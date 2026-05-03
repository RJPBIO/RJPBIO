/* Cron · Push outbox drain (Sprint S5.2)
 *
 * Cadencia: cada minuto. Drena PushOutbox status=pending con
 * nextAttempt vencido. Backoff exponencial 1min × 2^attempts.
 * Max 5 intentos antes de "exhausted".
 */

import "server-only";
import { drainPushQueue } from "../push-delivery";

export async function runPushDeliver() {
  const r = await drainPushQueue({ batchSize: 50 });
  return {
    processed: r.processed,
    errors: r.errors,
    details: { sent: r.sent, failed: r.failed, exhausted: r.exhausted, errorMessage: r.errorMessage },
  };
}
