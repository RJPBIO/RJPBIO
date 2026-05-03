/* ═══════════════════════════════════════════════════════════════
   Cron · DSAR sweep (Sprint S2.3)
   ═══════════════════════════════════════════════════════════════
   Cadencia: diario.
   Dos sub-tareas en una corrida:

   1. EXPIRY: requests con status=PENDING y expiresAt < now → marca EXPIRED.
   2. HARD-DELETE: users con deletedAt < now-30d → cascade delete del User
      row (que dispara onDelete:Cascade en sessions, devices, accounts,
      push, wearable, dsar requests, notifications, nom35).

   Audit log de cada acción.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "../db";
import { auditLog } from "../audit";
import { hardDeleteExpiredUsers } from "../erase-user-data";

const HARD_DELETE_GRACE_DAYS = 30;
const HARD_DELETE_BATCH = 50;

export async function runDsarSweep() {
  const orm = await db();
  const now = new Date();

  // 1) DSAR PENDING expiry.
  const expired = await orm.dsarRequest.findMany({
    where: { status: "PENDING", expiresAt: { lt: now } },
    select: { id: true, userId: true, kind: true },
    take: 500,
  }).catch(() => []);

  let dsarExpired = 0;
  for (const req of expired) {
    try {
      await orm.dsarRequest.update({
        where: { id: req.id },
        data: { status: "EXPIRED", resolvedAt: now },
      });
      await auditLog({
        actorId: null,
        action: "dsar.auto.expired",
        target: req.id,
        payload: { kind: req.kind, userId: req.userId },
      }).catch(() => {});
      dsarExpired += 1;
    } catch {/* skip */}
  }

  // 2) Hard-delete users post-grace.
  const hardDelete = await hardDeleteExpiredUsers({
    graceDays: HARD_DELETE_GRACE_DAYS,
    batchSize: HARD_DELETE_BATCH,
    now,
  });

  return {
    processed: dsarExpired + hardDelete.deleted,
    errors: hardDelete.errors,
    details: {
      dsarExpired,
      usersHardDeleted: hardDelete.deleted,
      usersDeleteErrors: hardDelete.errors,
      graceDays: HARD_DELETE_GRACE_DAYS,
    },
  };
}
