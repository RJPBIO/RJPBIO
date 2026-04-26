/* ═══════════════════════════════════════════════════════════════
   Health metrics — pure helpers para /admin/health dashboard.
   ═══════════════════════════════════════════════════════════════
   Aggregations + UI summarizers. Server hace los probes (DB latency,
   Redis ping) + queries de tablas; este lib transforma a shape UI.

   Convención: services tienen { ok, latencyMs, detail, error }.
   ═══════════════════════════════════════════════════════════════ */

/**
 * Cuenta filas por action prefix. Ej:
 *   aggregateAuditEvents(rows, "auth.") → count de auth.signin + auth.signout
 *   aggregateAuditEvents(rows, "webhook.") → webhook.* events
 *
 * Returns total count + breakdown por full action.
 */
export function aggregateAuditEvents(rows, prefix = "") {
  if (!Array.isArray(rows)) return { total: 0, byAction: {} };
  const byAction = {};
  let total = 0;
  for (const r of rows) {
    if (!r?.action) continue;
    if (prefix && !r.action.startsWith(prefix)) continue;
    byAction[r.action] = (byAction[r.action] || 0) + 1;
    total++;
  }
  return { total, byAction };
}

/**
 * Success rate de webhook deliveries (% delivered ok).
 * @param {Array<{deliveredAt, status}>} deliveries
 */
export function computeWebhookSuccessRate(deliveries) {
  if (!Array.isArray(deliveries) || deliveries.length === 0) {
    return { rate: null, total: 0, success: 0, failed: 0 };
  }
  let success = 0;
  let failed = 0;
  for (const d of deliveries) {
    if (d?.deliveredAt) success++;
    else failed++;
  }
  const total = success + failed;
  return {
    rate: total > 0 ? Math.round((success / total) * 1000) / 10 : null,
    total, success, failed,
  };
}

/**
 * Auth success rate — auth.signin success vs total auth.* attempts.
 * Si tenemos auth.signin.failed eventos los contamos como failures.
 */
export function computeAuthSuccessRate(auditRows) {
  if (!Array.isArray(auditRows)) return { rate: null, signins: 0, failures: 0 };
  let signins = 0;
  let failures = 0;
  for (const r of auditRows) {
    if (r?.action === "auth.signin") signins++;
    else if (r?.action === "auth.signin.failed" || r?.action === "auth.error") failures++;
  }
  const total = signins + failures;
  return {
    rate: total > 0 ? Math.round((signins / total) * 1000) / 10 : null,
    signins, failures,
  };
}

/**
 * Tone para Badge según probe shape.
 * @param {object} probe { ok, latencyMs, error? }
 */
export function summarizeService(probe) {
  if (!probe) return { tone: "neutral", label: "Sin datos" };
  if (probe.error || probe.ok === false) {
    return { tone: "danger", label: "Down", detail: probe.error || probe.detail || "Probe failed" };
  }
  // Latency thresholds (ms): <100 OK, <500 warn, ≥500 slow
  if (typeof probe.latencyMs === "number") {
    if (probe.latencyMs < 100) {
      return { tone: "success", label: "OK", detail: `${probe.latencyMs}ms` };
    }
    if (probe.latencyMs < 500) {
      return { tone: "warn", label: "Slow", detail: `${probe.latencyMs}ms` };
    }
    return { tone: "danger", label: "Slow+", detail: `${probe.latencyMs}ms` };
  }
  return { tone: "success", label: "OK", detail: probe.detail || "—" };
}

/**
 * Bucket rows por hora (últimas N horas). Returns array length=N
 * con { hour: ISO, count }.
 */
export function bucketByHour(rows, hours = 24, now = new Date()) {
  const buckets = [];
  const nowMs = now.getTime();
  for (let i = hours - 1; i >= 0; i--) {
    const start = new Date(nowMs - i * 3600_000);
    start.setMinutes(0, 0, 0);
    buckets.push({ hour: start.toISOString(), startMs: start.getTime(), count: 0 });
  }
  if (!Array.isArray(rows)) return buckets;
  for (const r of rows) {
    const ts = r?.ts || r?.createdAt;
    if (!ts) continue;
    const t = new Date(ts).getTime();
    if (Number.isNaN(t)) continue;
    // Encuentra el bucket correspondiente.
    for (let i = 0; i < buckets.length; i++) {
      const b = buckets[i];
      const next = i + 1 < buckets.length ? buckets[i + 1].startMs : nowMs + 3600_000;
      if (t >= b.startMs && t < next) {
        b.count++;
        break;
      }
    }
  }
  return buckets;
}

/**
 * Format latency human-readable.
 */
export function formatLatency(ms) {
  if (typeof ms !== "number" || !Number.isFinite(ms)) return "—";
  if (ms < 1) return "<1ms";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Estado global agregado — devuelve overall tone para hero.
 * "danger" si cualquier critical service down; "warn" si alguno slow;
 * "success" si todos OK.
 */
export function overallSystemHealth(services) {
  if (!Array.isArray(services) || services.length === 0) {
    return { tone: "neutral", label: "Sin datos" };
  }
  const summaries = services.map(summarizeService);
  if (summaries.some((s) => s.tone === "danger")) {
    return { tone: "danger", label: "Degradado" };
  }
  if (summaries.some((s) => s.tone === "warn")) {
    return { tone: "warn", label: "Lento" };
  }
  return { tone: "success", label: "Operativo" };
}

/**
 * Format counter — N → "N", >999 → "1.2k", >999_999 → "1.2M".
 */
export function formatCounter(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  if (Math.abs(n) < 1000) return String(n);
  if (Math.abs(n) < 1_000_000) return `${(n / 1000).toFixed(1)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}
