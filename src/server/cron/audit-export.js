/* ═══════════════════════════════════════════════════════════════
   Cron · Audit S3 export sweep (Sprint S3.2)
   ═══════════════════════════════════════════════════════════════
   Cadencia: diario.
   Para cada org, drena su audit chain a S3 (o filesystem stub) en
   chunks de 500 entries hasta vaciarla.

   ⚠ Sin cursor persistido (TODO: agregar `Org.auditLastExportedId`
   en próxima migración). Hoy `exportChainAll` exporta TODO desde
   sinceId=null cada vez. En orgs con audit chain muy grande, esto
   re-exporta cada día — funcional pero ineficiente. Apropiado
   mientras el feature es opt-in para clientes Enterprise; cuando
   el cliente lo enciende, su audit chain inicial se exporta full
   y subsequent runs son delta de 24h.

   Para el dev sin S3: escribe a .audit-export/. Útil solo para
   testing que el pipeline corre.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "../db";
import { exportChainAll } from "../audit-export";

export async function runAuditExportSweep() {
  const orm = await db();
  const orgs = await orm.org.findMany({
    where: {},
    select: { id: true },
  }).catch(() => []);

  let processed = 0;
  let totalExported = 0;
  let errors = 0;
  let target = "none";
  for (const org of orgs) {
    try {
      const r = await exportChainAll(org.id, { pageSize: 500, maxPages: 50 });
      totalExported += r.totalExported;
      target = r.target;
      processed += 1;
    } catch {
      errors += 1;
    }
  }

  return { processed, errors, details: { orgsCount: orgs.length, totalExported, target } };
}
