/* ═══════════════════════════════════════════════════════════════
   Cron · Audit chain verify sweep (Sprint S2.4 + S3.4 streamed)
   ═══════════════════════════════════════════════════════════════
   Cadencia: semanal.
   Para cada org con audit logs, recomputa hash chain (streamed por
   chunks, Sprint S3.4) y persiste:
     - Org.auditLastVerifiedAt
     - Org.auditLastVerifiedStatus = "verified" | "tampered"

   verifyChain ahora usa cursor por id en chunks de 5K rows — escala
   a millones de entries sin OOM. Cap defensivo de 50M rows por org.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "../db";
import { verifyChain } from "../audit";

export async function runAuditVerify() {
  const orm = await db();
  const orgs = await orm.org.findMany({
    where: {},
    select: { id: true },
  }).catch(() => []);

  let processed = 0;
  let verified = 0;
  let tampered = 0;
  let errors = 0;
  const issues = [];

  for (const org of orgs) {
    try {
      const count = await orm.auditLog.count({ where: { orgId: org.id } });
      if (count === 0) continue;
      const result = await verifyChain(org.id, { chunkSize: 5000 });
      processed += 1;
      const status = result.ok ? "verified" : "tampered";
      if (result.ok) verified += 1;
      else {
        tampered += 1;
        issues.push({ orgId: org.id, brokenAt: String(result.brokenAt), reason: result.reason });
      }
      await orm.org.update({
        where: { id: org.id },
        data: {
          auditLastVerifiedAt: new Date(),
          auditLastVerifiedStatus: status,
        },
      }).catch(() => {});
    } catch {
      errors += 1;
    }
  }

  return {
    processed,
    errors,
    details: {
      verified,
      tampered,
      orgsCount: orgs.length,
      issues: issues.slice(0, 20),
    },
  };
}
