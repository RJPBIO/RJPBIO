/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — Push Notifications
   Suscripción Web Push con VAPID · Reminders locales
   ═══════════════════════════════════════════════════════════════ */

import { logger } from "./logger";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

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
  if (existing) return existing.toJSON();
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlB64ToU8(VAPID),
  });
  return sub.toJSON();
}

export async function unsubscribePush() {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) await sub.unsubscribe();
}

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
