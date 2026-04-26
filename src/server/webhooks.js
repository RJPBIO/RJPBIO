/* ═══════════════════════════════════════════════════════════════
   Webhooks — HMAC-SHA256 signing, retries con backoff exponencial.
   Compatible con Standard Webhooks (standardwebhooks.com).
   Signing logic extraída a lib/webhook-signing para testing.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "./db";
import { logger } from "@/lib/logger";
import { notifyOrgAdmins } from "./notifications";
import { sign } from "@/lib/webhook-signing";

// Re-export para mantener API pública existente — algunos call sites
// importan verifyIncomingSignature desde @/server/webhooks histórico.
export { verifyIncomingSignature } from "@/lib/webhook-signing";

export async function dispatchWebhooks(orgId, event, payload) {
  const orm = await db();
  const hooks = await orm.webhook.findMany({ where: { orgId, active: true } });
  const delivers = hooks.filter((h) => h.events.includes(event) || h.events.includes("*"));
  for (const h of delivers) {
    const id = `msg_${randomBytes(12).toString("base64url")}`;
    const body = JSON.stringify({ id, type: event, timestamp: new Date().toISOString(), data: payload });
    const ts = Math.floor(Date.now() / 1000);
    const sig = sign(h.secret, body, ts, id);
    const delivery = await orm.webhookDelivery.create({
      data: { webhookId: h.id, event, payload, attempts: 0, nextRetry: new Date() },
    });
    sendWithRetry({ id, url: h.url, body, ts, sig, deliveryId: delivery.id }).catch((e) =>
      logger.error("webhook.dispatch", { id, e: String(e) })
    );
  }
}

async function sendWithRetry({ id, url, body, ts, sig, deliveryId, attempt = 0 }) {
  const orm = await db();
  const max = 8;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "webhook-id": id,
        "webhook-timestamp": String(ts),
        "webhook-signature": sig,
        "user-agent": "BIO-IGNICION-Webhooks/1.0",
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    await orm.webhookDelivery.update({
      where: { id: deliveryId },
      data: { status: r.status, attempts: attempt + 1, deliveredAt: r.ok ? new Date() : null },
    });
    if (!r.ok && attempt < max - 1) {
      const delay = Math.min(60_000, 1000 * 2 ** attempt) + Math.random() * 300;
      setTimeout(() => sendWithRetry({ id, url, body, ts, sig, deliveryId, attempt: attempt + 1 }), delay);
    } else if (!r.ok) {
      await notifyFinalFailure(deliveryId, `HTTP ${r.status}`);
    }
  } catch (e) {
    await orm.webhookDelivery.update({
      where: { id: deliveryId },
      data: { error: String(e).slice(0, 500), attempts: attempt + 1 },
    }).catch(() => {});
    if (attempt < max - 1) {
      const delay = Math.min(60_000, 1000 * 2 ** attempt) + Math.random() * 300;
      setTimeout(() => sendWithRetry({ id, url, body, ts, sig, deliveryId, attempt: attempt + 1 }), delay);
    } else {
      await notifyFinalFailure(deliveryId, String(e).slice(0, 120));
    }
  }
}

async function notifyFinalFailure(deliveryId, reason) {
  try {
    const orm = await db();
    const d = await orm.webhookDelivery.findUnique({
      where: { id: deliveryId }, include: { webhook: true },
    });
    if (!d?.webhook) return;
    await notifyOrgAdmins(d.webhook.orgId, {
      title: `Webhook falló tras ${d.attempts} intentos`,
      body: `${d.event} → ${d.webhook.url} · ${reason}`,
      level: "error",
      href: "/admin/webhooks",
      kind: "webhook.failed",
    });
  } catch { /* no-op */ }
}

export async function retryDelivery(deliveryId) {
  const orm = await db();
  const d = await orm.webhookDelivery.findUnique({ where: { id: deliveryId }, include: { webhook: true } });
  if (!d || !d.webhook) return false;
  const id = `msg_${randomBytes(12).toString("base64url")}`;
  const body = JSON.stringify({ id, type: d.event, timestamp: new Date().toISOString(), data: d.payload, retry: true });
  const ts = Math.floor(Date.now() / 1000);
  const sig = sign(d.webhook.secret, body, ts, id);
  await orm.webhookDelivery.update({ where: { id: d.id }, data: { nextRetry: new Date(), error: null } });
  sendWithRetry({ id, url: d.webhook.url, body, ts, sig, deliveryId: d.id }).catch(() => {});
  return true;
}

// verifyIncomingSignature ya re-exportado arriba desde lib/webhook-signing.
// timingSafeEqual también allí, no requerido aquí.
