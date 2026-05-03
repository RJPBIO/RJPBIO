/* ═══════════════════════════════════════════════════════════════
   Cron · Audit retention prune (Sprint S2.2)
   ═══════════════════════════════════════════════════════════════
   Cadencia: diario.
   Para cada org, borra audit logs con `ts < now - org.auditRetentionDays`.
   El hash chain sigue válido para los logs restantes (chain advances
   naturally desde el primer log no borrado).
   Persiste `Org.auditLastPrunedAt`.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "../db";
import { pruneByRetention } from "../audit";

export async function runAuditPrune() {
  const orm = await db();
  const orgs = await orm.org.findMany({
    where: {},
    select: { id: true, auditRetentionDays: true },
  }).catch(() => []);

  let processed = 0;
  let totalDeleted = 0;
  let errors = 0;
  const perOrg = [];

  for (const org of orgs) {
    const days = Number.isInteger(org.auditRetentionDays) ? org.auditRetentionDays : 365;
    if (days < 30 || days > 2555) continue; // sanity guard
    try {
      const deleted = await pruneByRetention(org.id, days);
      processed += 1;
      totalDeleted += deleted;
      perOrg.push({ orgId: org.id, deleted });
      await orm.org.update({
        where: { id: org.id },
        data: { auditLastPrunedAt: new Date() },
      }).catch(() => {});
    } catch {
      errors += 1;
    }
  }

  return {
    processed,
    errors,
    details: { totalDeleted, orgsCount: orgs.length, perOrg: perOrg.slice(0, 50) },
  };
}
