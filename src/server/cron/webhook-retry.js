/* ═══════════════════════════════════════════════════════════════
   Cron · Webhook delivery retry sweep (Sprint S2.8)
   ═══════════════════════════════════════════════════════════════
   Cadencia: cada minuto.
   Busca WebhookDelivery con `nextRetry < now` y `attempts < 8` y
   `deliveredAt IS NULL`. Reenvía vía retryDelivery (existente en
   src/server/webhooks.js).
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "../db";

const MAX_ATTEMPTS = 8;
const BATCH = 50;

export async function runWebhookRetry() {
  const orm = await db();
  const now = new Date();

  const due = await orm.webhookDelivery.findMany({
    where: {
      deliveredAt: null,
      nextRetry: { lte: now, not: null },
      attempts: { lt: MAX_ATTEMPTS },
    },
    take: BATCH,
  }).catch(() => []);

  if (!due.length) return { processed: 0, errors: 0, details: { batch: 0 } };

  // Importar lazy para evitar circular deps si server/webhooks importa esto.
  const { retryDelivery } = await import("../webhooks.js").catch(() => ({ retryDelivery: null }));
  if (!retryDelivery) {
    return {
      processed: 0,
      errors: 1,
      details: { reason: "retryDelivery not exported by server/webhooks.js — implement in Sprint 5" },
    };
  }

  let processed = 0;
  let errors = 0;
  for (const d of due) {
    try {
      await retryDelivery(d.id);
      processed += 1;
    } catch {
      errors += 1;
    }
  }

  return { processed, errors, details: { batch: due.length, maxAttempts: MAX_ATTEMPTS } };
}
