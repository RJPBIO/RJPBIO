/* ═══════════════════════════════════════════════════════════════
   Webhooks — HMAC-SHA256 signing, retries con backoff exponencial.
   Compatible con Standard Webhooks (standardwebhooks.com).
   Signing logic extraída a lib/webhook-signing para testing.
   Sprint 17: secret rotation con overlap (multi-sig en header).
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "./db";
import { logger } from "@/lib/logger";
import { notifyOrgAdmins } from "./notifications";
import { auditLog } from "./audit";
import { sign } from "@/lib/webhook-signing";
import {
  isOverlapActive,
  computeOverlapExpiry,
  buildSignatureHeader,
} from "@/lib/webhook-rotation";

// Re-export para mantener API pública existente — algunos call sites
// importan verifyIncomingSignature desde @/server/webhooks histórico.
export { verifyIncomingSignature } from "@/lib/webhook-signing";

/**
 * Sprint 17 — sign con prev+current si overlap activo.
 * Returns string para el header webhook-signature (Standard Webhooks v1
 * acepta múltiples firmas space-separated).
 */
function signForWebhook(webhook, body, ts, id, now = new Date()) {
  const signatures = [sign(webhook.secret, body, ts, id)];
  if (isOverlapActive(webhook, now)) {
    signatures.push(sign(webhook.prevSecret, body, ts, id));
  }
  return buildSignatureHeader(signatures);
}

/**
 * Genera un nuevo secret webhook (32 bytes random base64).
 */
export function generateWebhookSecret() {
  return randomBytes(32).toString("base64");
}

// Sprint S4.5 — versión semántica del payload schema. Bump cuando un cambio
// breaking se ship. Clientes pueden inspeccionar header `webhook-event-version`
// para distinguir v1 vs v2 schemas.
export const WEBHOOK_EVENT_VERSION = "1";

export async function dispatchWebhooks(orgId, event, payload) {
  const orm = await db();
  const hooks = await orm.webhook.findMany({ where: { orgId, active: true } });
  const delivers = hooks.filter((h) => h.events.includes(event) || h.events.includes("*"));
  for (const h of delivers) {
    const id = `msg_${randomBytes(12).toString("base64url")}`;
    const body = JSON.stringify({
      id,
      type: event,
      version: WEBHOOK_EVENT_VERSION,  // Sprint S4.5
      timestamp: new Date().toISOString(),
      data: payload,
    });
    const ts = Math.floor(Date.now() / 1000);
    const sig = signForWebhook(h, body, ts, id);
    const delivery = await orm.webhookDelivery.create({
      data: { webhookId: h.id, event, payload, attempts: 0, nextRetry: new Date() },
    });
    sendWithRetry({ id, url: h.url, body, ts, sig, deliveryId: delivery.id }).catch((e) =>
      logger.error("webhook.dispatch", { id, e: String(e) })
    );
  }
}

/**
 * Sprint 17 — rota el secret de un webhook. Setea overlap para que
 * dispatchWebhooks firme con AMBOS por `overlapDays` (default 7d).
 * Retorna el nuevo secret (mostrado UNA vez al admin).
 *
 * @param {object} args
 * @param {string} args.webhookId
 * @param {string} args.actorUserId
 * @param {string} args.orgId
 * @param {number} [args.overlapDays] default 7
 */
export async function rotateWebhookSecret({ webhookId, actorUserId, orgId, overlapDays = 7 }) {
  if (!webhookId || !orgId) return { ok: false, error: "bad_input" };
  try {
    const orm = await db();
    const webhook = await orm.webhook.findUnique({ where: { id: webhookId } });
    if (!webhook) return { ok: false, error: "not_found" };
    if (webhook.orgId !== orgId) return { ok: false, error: "wrong_org" };

    const newSecret = generateWebhookSecret();
    const expiry = computeOverlapExpiry(overlapDays);
    const now = new Date();

    await orm.webhook.update({
      where: { id: webhookId },
      data: {
        prevSecret: webhook.secret,
        prevSecretExpiresAt: expiry,
        secret: newSecret,
        secretRotatedAt: now,
      },
    });

    await auditLog({
      orgId,
      actorId: actorUserId,
      action: "webhook.secret.rotated",
      target: webhookId,
      payload: { overlapDays, prevSecretExpiresAt: expiry.toISOString() },
    }).catch(() => {});

    return { ok: true, newSecret, expiresAt: expiry };
  } catch {
    return { ok: false, error: "rotate_failed" };
  }
}

/**
 * Cleanup sweep — borra prevSecret tras overlap expirar. Cron-callable.
 */
export async function cleanupExpiredOverlaps() {
  try {
    const orm = await db();
    const r = await orm.webhook.updateMany({
      where: {
        prevSecretExpiresAt: { lt: new Date() },
        prevSecret: { not: null },
      },
      data: { prevSecret: null, prevSecretExpiresAt: null },
    });
    return r?.count ?? 0;
  } catch {
    return 0;
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
        "webhook-event-version": WEBHOOK_EVENT_VERSION,  // Sprint S4.5
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
  const body = JSON.stringify({
    id,
    type: d.event,
    version: WEBHOOK_EVENT_VERSION,  // Sprint S4.5
    timestamp: new Date().toISOString(),
    data: d.payload,
    retry: true,
  });
  const ts = Math.floor(Date.now() / 1000);
  // Sprint 17 — usa multi-sig si overlap activo (consistencia con dispatch).
  const sig = signForWebhook(d.webhook, body, ts, id);
  await orm.webhookDelivery.update({ where: { id: d.id }, data: { nextRetry: new Date(), error: null } });
  sendWithRetry({ id, url: d.webhook.url, body, ts, sig, deliveryId: d.id }).catch(() => {});
  return true;
}

// verifyIncomingSignature ya re-exportado arriba desde lib/webhook-signing.
// timingSafeEqual también allí, no requerido aquí.
