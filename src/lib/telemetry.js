/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — Telemetry (errors + Web Vitals + events)
   ═══════════════════════════════════════════════════════════════
   Capa minimalista de observabilidad construida sobre `logger`.
   Off-by-default: solo emite si NEXT_PUBLIC_LOG_ENDPOINT está definido.
   Consistente con la postura del CLAUDE.md ("Nada de telemetría por
   defecto").

   Qué cubre:
     1) Errores no-capturados (window.onerror + unhandledrejection)
     2) Core Web Vitals (LCP, INP, CLS, FCP, TTFB) cuando estén
        disponibles vía PerformanceObserver
     3) Eventos de producto: track(name, props)
     4) Page view: trackPageView(path)

   Qué NO captura:
     — PII: emails, IDs, mensajes de coach (sanitizados upstream)
     — Body de errores (solo name + message + stack)
     — Cookies / localStorage / form values
   ═══════════════════════════════════════════════════════════════ */

import { logger } from "./logger";

const ENABLED = typeof process !== "undefined"
  ? !!process.env.NEXT_PUBLIC_LOG_ENDPOINT
  : false;

let installed = false;
let pageViewSent = false;

/**
 * Instala los handlers globales y empieza a observar Web Vitals.
 * Idempotente: llámalo una vez al boot del cliente.
 */
export function installTelemetry() {
  if (installed) return;
  if (typeof window === "undefined") return;
  installed = true;

  if (!ENABLED) return; // off-by-default

  // 1) Errores globales no-capturados
  window.addEventListener("error", (event) => {
    try {
      logger.error("uncaught.error", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    } catch {}
  });

  window.addEventListener("unhandledrejection", (event) => {
    try {
      const reason = event.reason;
      logger.error("unhandled.rejection", {
        name: reason?.name,
        message: reason?.message ?? String(reason),
        stack: reason?.stack,
      });
    } catch {}
  });

  // 2) Web Vitals — si PerformanceObserver está disponible (todos los
  // navegadores modernos), observamos las métricas core. Reportamos
  // una vez por métrica; CLS se acumula durante la sesión.
  observeMetric("largest-contentful-paint", (entries) => {
    const last = entries[entries.length - 1];
    if (last) report("web-vital", { metric: "LCP", value: round(last.startTime), rating: rateLCP(last.startTime) });
  });

  observeMetric("first-input", (entries) => {
    const first = entries[0];
    if (first) report("web-vital", { metric: "FID", value: round(first.processingStart - first.startTime), rating: rateFID(first.processingStart - first.startTime) });
  });

  observeMetric("paint", (entries) => {
    const fcp = entries.find((e) => e.name === "first-contentful-paint");
    if (fcp) report("web-vital", { metric: "FCP", value: round(fcp.startTime) });
  });

  // CLS: acumular shifts hasta visibilitychange/pagehide
  let clsValue = 0;
  observeMetric("layout-shift", (entries) => {
    for (const e of entries) {
      if (!e.hadRecentInput) clsValue += e.value;
    }
  });
  const flushCLS = () => {
    if (clsValue > 0) {
      report("web-vital", { metric: "CLS", value: round(clsValue, 3), rating: rateCLS(clsValue) });
      clsValue = 0;
    }
  };
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushCLS();
  });
  window.addEventListener("pagehide", flushCLS, { once: true });

  // INP: experimental — observar cada interaction y reportar el peor
  let worstInp = 0;
  observeMetric("event", (entries) => {
    for (const e of entries) {
      if (typeof e.duration === "number" && e.duration > worstInp) {
        worstInp = e.duration;
      }
    }
  }, { durationThreshold: 16 });
  window.addEventListener("pagehide", () => {
    if (worstInp > 0) report("web-vital", { metric: "INP", value: round(worstInp), rating: rateINP(worstInp) });
  }, { once: true });

  // TTFB — disponible en navigation timing
  try {
    const nav = performance.getEntriesByType?.("navigation")?.[0];
    if (nav?.responseStart) {
      report("web-vital", { metric: "TTFB", value: round(nav.responseStart) });
    }
  } catch {}
}

/**
 * Track de evento de producto. Llama esto en momentos significativos:
 *   track("hrv.measure.completed", { source: "camera", sqi: 78 });
 *   track("session.started", { protocol: "calma" });
 *
 * Mantén las propiedades pequeñas y sin PII.
 */
export function track(name, props = {}) {
  if (!ENABLED) return;
  report("event", { name, ...sanitizeProps(props) });
}

/**
 * Page view. Llamar al cambio de ruta. Idempotente para la primera ruta
 * (Next App Router emite múltiples re-renders del layout).
 */
export function trackPageView(path) {
  if (!ENABLED) return;
  if (!path) return;
  if (pageViewSent && pageViewSent === path) return;
  pageViewSent = path;
  report("page-view", { path });
}

// ─────────────────────────────────────────────────────────────

function observeMetric(type, callback, opts = {}) {
  try {
    if (typeof PerformanceObserver === "undefined") return;
    const supported = PerformanceObserver.supportedEntryTypes || [];
    if (!supported.includes(type)) return;
    const obs = new PerformanceObserver((list) => callback(list.getEntries()));
    obs.observe({ type, buffered: true, ...opts });
  } catch {
    // ignored
  }
}

function report(level, payload) {
  try {
    logger.info(level, payload);
  } catch {}
}

function sanitizeProps(props) {
  const out = {};
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null) continue;
    if (typeof v === "string" && v.length > 200) continue; // skip long strings
    if (typeof v === "object") continue; // skip nested objects
    out[k] = v;
  }
  return out;
}

function round(v, decimals = 0) {
  if (!Number.isFinite(v)) return null;
  const m = Math.pow(10, decimals);
  return Math.round(v * m) / m;
}

function rateLCP(v) {
  if (v <= 2500) return "good";
  if (v <= 4000) return "needs-improvement";
  return "poor";
}
function rateFID(v) {
  if (v <= 100) return "good";
  if (v <= 300) return "needs-improvement";
  return "poor";
}
function rateCLS(v) {
  if (v <= 0.1) return "good";
  if (v <= 0.25) return "needs-improvement";
  return "poor";
}
function rateINP(v) {
  if (v <= 200) return "good";
  if (v <= 500) return "needs-improvement";
  return "poor";
}
