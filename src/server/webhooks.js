/* ═══════════════════════════════════════════════════════════════
   Webhooks — HMAC-SHA256 signing, retries con backoff exponencial.
   Compatible con Standard Webhooks (standardwebhooks.com).
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { createHmac, randomBytes, timingSafeEqual as _timingSafeEqual } from "node:crypto";
import { db } from "./db";
import { logger } from "@/lib/logger";

function sign(secret, body, timestamp, id) {
  const h = createHmac("sha256", Buffer.from(secret, "base64"));
  h.update(`${id}.${timestamp}.${body}`);
  return `v1,${h.digest("base64")}`;
}

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
    }
  } catch (e) {
    await orm.webhookDelivery.update({
      where: { id: deliveryId },
      data: { error: String(e).slice(0, 500), attempts: attempt + 1 },
    }).catch(() => {});
    if (attempt < max - 1) {
      const delay = Math.min(60_000, 1000 * 2 ** attempt) + Math.random() * 300;
      setTimeout(() => sendWithRetry({ id, url, body, ts, sig, deliveryId, attempt: attempt + 1 }), delay);
    }
  }
}

export function verifyIncomingSignature({ secret, body, timestamp, id, signatureHeader }) {
  const expected = sign(secret, body, timestamp, id);
  const provided = signatureHeader?.split(" ") || [];
  return provided.some((p) => timingSafeEqual(p, expected));
}

function timingSafeEqual(a, b) {
  // node:crypto.timingSafeEqual requiere longitudes iguales: comparamos contra
  // `expected` con longitud fija, pero `a` puede ser manipulado por el atacante.
  // Hacemos padding al max length para que el early-return por length no filtre
  // información sobre `expected`. Usamos la impl de OpenSSL (constant-time real).
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  const len = Math.max(ab.length, bb.length);
  const pa = Buffer.alloc(len); ab.copy(pa);
  const pb = Buffer.alloc(len); bb.copy(pb);
  const eq = _timingSafeEqual(pa, pb);
  return eq && ab.length === bb.length;
}
