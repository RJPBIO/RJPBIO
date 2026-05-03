/* ═══════════════════════════════════════════════════════════════
   Server-side Web Push delivery (Sprint S5.2)
   ═══════════════════════════════════════════════════════════════
   Pipeline:
     enqueuePush(userId, msg)  →  PushOutbox.create({status:"pending"})
                                      ↓ (cron drainPushQueue)
     web-push send a c/u de las PushSubscription del user
                                      ↓
     status = "sent" | "failed" | "exhausted" (max 5 intentos)

   Antes Sprint 91 las PushSubscription se persistían pero no había
   sender. Reminders eran setTimeout cliente (solo si tab abierto).
   Ahora: el motor adaptativo puede mandar reminders, weekly digests,
   incident notifications de verdad cross-device.

   ─── Activación ─────────────────────────────────────────────────
   Requiere `web-push` lib instalada y VAPID keys configuradas:

     npm i web-push
     (VAPID_PRIVATE_KEY + NEXT_PUBLIC_VAPID_PUBLIC_KEY ya existían
      en .env.example desde Sprint 91)

   Sin web-push instalado, drainPushQueue() lanza error claro al primer
   intento. enqueuePush() funciona siempre (solo persiste a DB).
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "./db";
import { auditLog } from "./audit";

const MAX_ATTEMPTS = 5;
const BACKOFF_BASE_MS = 60_000; // 1 min × 2^attempt

/**
 * Encola un push notification para un user. Idempotente solo en sentido
 * de "agrega 1 row más" — si llamas 5 veces, se envía 5 veces. Usa kind
 * + dedupe externamente si necesitas rate-limit.
 *
 * @param {string} userId
 * @param {object} msg
 * @param {string} msg.title  - obligatorio
 * @param {string} [msg.body]
 * @param {string} [msg.href]
 * @param {string} [msg.kind] - "reminder" | "weekly-digest" | "incident" | etc
 * @returns {Promise<{ok: boolean, id?: string}>}
 */
export async function enqueuePush(userId, { title, body = null, href = null, kind = null } = {}) {
  if (!userId || !title) return { ok: false, error: "invalid_input" };
  try {
    const orm = await db();
    const row = await orm.pushOutbox.create({
      data: { userId, title, body, href, kind, status: "pending" },
    });
    return { ok: true, id: row.id };
  } catch {
    return { ok: false, error: "enqueue_failed" };
  }
}

/**
 * Cron-callable. Drena hasta `batchSize` items pendientes. Retorna stats.
 *
 * @param {object} [opts]
 * @param {number} [opts.batchSize=50]
 * @param {Date}   [opts.now=new Date()]
 * @returns {Promise<{processed:number, sent:number, failed:number, exhausted:number, errors:number}>}
 */
export async function drainPushQueue({ batchSize = 50, now = new Date() } = {}) {
  const orm = await db();
  const due = await orm.pushOutbox.findMany({
    where: {
      status: "pending",
      nextAttempt: { lte: now },
    },
    orderBy: { createdAt: "asc" },
    take: batchSize,
  }).catch(() => []);

  if (!due.length) return { processed: 0, sent: 0, failed: 0, exhausted: 0, errors: 0 };

  let webpush;
  try {
    webpush = await loadWebPush();
  } catch (e) {
    return {
      processed: 0,
      sent: 0,
      failed: 0,
      exhausted: 0,
      errors: 1,
      errorMessage: String(e?.message || e),
    };
  }

  // VAPID setup — una vez por proceso. Si no están las keys, fail loud.
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT || "mailto:ops@bio-ignicion.app";
  if (!vapidPublic || !vapidPrivate) {
    return { processed: 0, sent: 0, failed: 0, exhausted: 0, errors: 1, errorMessage: "VAPID keys missing" };
  }
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  let sent = 0;
  let failed = 0;
  let exhausted = 0;
  let errors = 0;

  for (const item of due) {
    const subs = await orm.pushSubscription.findMany({ where: { userId: item.userId } }).catch(() => []);
    if (!subs.length) {
      // Sin suscripciones → exhausted (no recovery posible).
      await orm.pushOutbox.update({
        where: { id: item.id },
        data: { status: "exhausted", lastError: "no_subscriptions" },
      }).catch(() => {});
      exhausted += 1;
      continue;
    }

    const payload = JSON.stringify({
      title: item.title,
      body: item.body || "",
      href: item.href || "/app",
      kind: item.kind || "default",
    });

    let anyDelivered = false;
    let lastError = null;
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.authKey },
          },
          payload,
          { TTL: 60 * 60, urgency: "normal" }
        );
        anyDelivered = true;
        await orm.pushSubscription.update({
          where: { id: sub.id },
          data: { lastUsedAt: now },
        }).catch(() => {});
      } catch (e) {
        const status = e?.statusCode;
        // 410 Gone → sub expired/unsubscribed; cleanup.
        // 404 Not Found → mismo.
        if (status === 410 || status === 404) {
          await orm.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
        lastError = String(e?.message || status || "fetch_error").slice(0, 200);
      }
    }

    if (anyDelivered) {
      await orm.pushOutbox.update({
        where: { id: item.id },
        data: { status: "sent", sentAt: now, attempts: item.attempts + 1 },
      }).catch(() => {});
      sent += 1;
    } else {
      const attempts = item.attempts + 1;
      if (attempts >= MAX_ATTEMPTS) {
        await orm.pushOutbox.update({
          where: { id: item.id },
          data: { status: "exhausted", lastError, attempts },
        }).catch(() => {});
        exhausted += 1;
      } else {
        const delayMs = BACKOFF_BASE_MS * Math.pow(2, attempts - 1);
        await orm.pushOutbox.update({
          where: { id: item.id },
          data: {
            attempts,
            lastError,
            nextAttempt: new Date(now.getTime() + delayMs),
          },
        }).catch(() => {});
        failed += 1;
      }
    }
  }

  await auditLog({
    action: "push.delivery.tick",
    payload: { processed: due.length, sent, failed, exhausted, errors },
  }).catch(() => {});

  return { processed: due.length, sent, failed, exhausted, errors };
}

async function loadWebPush() {
  // Indirect string import → vite ignora en bundle/test cuando no instalado.
  const moduleName = "web-push";
  try {
    const mod = await import(/* @vite-ignore */ moduleName);
    return mod.default || mod;
  } catch {
    throw new Error(
      "web-push not installed. Run `npm i web-push` to enable server-side push delivery."
    );
  }
}
