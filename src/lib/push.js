/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — Push Notifications
   Suscripción Web Push con VAPID · Reminders locales
   ═══════════════════════════════════════════════════════════════ */

import { logger } from "./logger";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

const CSRF_COOKIE = "bio-csrf";
const CSRF_HEADER = "x-csrf-token";

function readCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// Sprint 91 — POSTea subscription al server para que pueda dispatchar
// pushes. Antes (Sprint 53) subscribePush() retornaba la sub al caller
// y nadie la posteaba → push notif feature era teatro server-side.
async function persistSubscription(subJson) {
  if (!subJson?.endpoint) return false;
  try {
    const headers = { "content-type": "application/json" };
    const csrf = readCookie(CSRF_COOKIE);
    if (csrf) headers[CSRF_HEADER] = csrf;
    const r = await fetch("/api/push/subscribe", {
      method: "POST",
      headers,
      credentials: "same-origin",
      body: JSON.stringify(subJson),
    });
    return r.ok;
  } catch (e) {
    logger.error?.("push.persist_failed", e);
    return false;
  }
}

async function dropSubscription(endpoint) {
  if (!endpoint) return false;
  try {
    const headers = { "content-type": "application/json" };
    const csrf = readCookie(CSRF_COOKIE);
    if (csrf) headers[CSRF_HEADER] = csrf;
    const r = await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers,
      credentials: "same-origin",
      body: JSON.stringify({ endpoint }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

function urlB64ToU8(b64) {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function requestPushPermission() {
  if (typeof Notification === "undefined") return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export async function subscribePush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  if (!VAPID) { logger.warn("push.vapid_missing"); return null; }
  const perm = await requestPushPermission();
  if (perm !== "granted") return null;
  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    // Sprint 91 — re-persist por si server perdió esta subscription
    // (ej. user limpió DB, primera sync post-feature). Idempotent.
    const json = existing.toJSON();
    persistSubscription(json).catch(() => {});
    return json;
  }
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlB64ToU8(VAPID),
  });
  const json = sub.toJSON();
  // Sprint 91 — persistir server-side. Si falla, log pero no bloqueamos
  // al user — la subscription local existe; el siguiente subscribe
  // o el pushsubscriptionchange en SW reintentará.
  await persistSubscription(json);
  return json;
}

export async function unsubscribePush() {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    // Sprint 91 — limpiar server-side también, sino el server seguirá
    // intentando push a un endpoint muerto y el browser tira 410 Gone.
    if (endpoint) await dropSubscription(endpoint);
  }
}

// Sprint 53 — best-effort solo. Setea setTimeout para HH:MM hoy/mañana.
// Solo dispara si el tab/PWA permanece abierto hasta ese momento. Si el
// user cierra antes, la notificación no llega. El re-mount del componente
// (re-abrir app) re-schedule.
//
// Para entrega fiable a HH:MM exacta, el camino correcto es push server-
// side (requiere /api/push/send + scheduler cron — separado de Sprint 91
// que solo persiste subscriptions).
export function scheduleLocalReminder({ hour = 9, minute = 0, body } = {}) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  const delay = target.getTime() - now.getTime();
  setTimeout(() => {
    new Notification("BIO-IGNICIÓN", {
      body: body || "Momento perfecto para una sesión de 2 minutos.",
      icon: "/icon.svg",
      badge: "/icon-monochrome.svg",
      tag: "bio-daily",
    });
  }, Math.min(delay, 24 * 60 * 60 * 1000));
}

// Sprint 91 — periodicSync registration como capa adicional de
// reliability para PWAs instaladas. Browser dispara el SW handler
// `bio-daily-reminder` (sw.js:201) ~1×24h cuando ESTA en background,
// independiente de si el tab está abierto. Apple iOS no lo soporta
// (cae al fallback setTimeout); Chrome/Edge desktop+PWA sí.
//
// Limitación: la HORA de disparo es browser-determined (no puede
// forzarse HH:MM exacto). Para schedule preciso, el camino es push
// server-side (Sprint futuro).
export async function registerPeriodicReminder() {
  if (typeof navigator === "undefined") return { ok: false, reason: "no_navigator" };
  if (!("serviceWorker" in navigator)) return { ok: false, reason: "no_sw" };
  try {
    const reg = await navigator.serviceWorker.ready;
    if (!("periodicSync" in reg)) return { ok: false, reason: "unsupported" };
    // Permission gate — browsers requieren engagement score y el user
    // debe haber instalado la PWA. Sin permission, register() throws.
    const status = await navigator.permissions
      .query({ name: "periodic-background-sync" })
      .catch(() => ({ state: "denied" }));
    if (status.state !== "granted") return { ok: false, reason: "permission_denied" };
    await reg.periodicSync.register("bio-daily-reminder", {
      minInterval: 24 * 60 * 60 * 1000, // 24h. Browser puede ampliar.
    });
    return { ok: true };
  } catch (e) {
    logger.warn?.("push.periodic_register_failed", e?.message || e);
    return { ok: false, reason: "register_failed" };
  }
}

export async function unregisterPeriodicReminder() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    if ("periodicSync" in reg) {
      await reg.periodicSync.unregister("bio-daily-reminder").catch(() => {});
    }
  } catch {}
}
