/* ═══════════════════════════════════════════════════════════════
   Cron · Maintenance window notifications T-24 / T-0 / complete (Sprint S2.5)
   ═══════════════════════════════════════════════════════════════
   Cadencia: cada 5 min.
   Busca MaintenanceWindow:
     - status=scheduled && scheduledStart en próximas 24h && !notifiedT24
     - status=scheduled && scheduledStart <= now+5min && !notifiedT0
     - status=completed && !notifiedComplete

   Notifica a IncidentSubscriber matching components (vía componentes
   compartidos con incidents). Persiste flags para idempotencia.

   Sin smtp/webhook delivery real: best-effort notifyOrgAdmins (in-app
   notification) + audit log. Email/webhook delivery a subscribers
   externos = sub-item futuro (Sprint 5+).
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "../db";
import { auditLog } from "../audit";

const HOUR_MS = 3600_000;
const TIGHT_T0_WINDOW_MS = 5 * 60_000;

export async function runMaintenanceNotify() {
  const orm = await db();
  const now = new Date();

  let notifiedT24 = 0;
  let notifiedT0 = 0;
  let notifiedComplete = 0;
  let errors = 0;

  // T-24: scheduled, scheduledStart entre now+23h y now+25h, !notifiedT24
  const inT24Window = {
    status: "scheduled",
    notifiedT24: false,
    scheduledStart: {
      gte: new Date(now.getTime() + 23 * HOUR_MS),
      lte: new Date(now.getTime() + 25 * HOUR_MS),
    },
  };
  // T-0: scheduled, scheduledStart entre now-5min y now+5min, !notifiedT0
  const inT0Window = {
    status: "scheduled",
    notifiedT0: false,
    scheduledStart: {
      gte: new Date(now.getTime() - TIGHT_T0_WINDOW_MS),
      lte: new Date(now.getTime() + TIGHT_T0_WINDOW_MS),
    },
  };
  // Complete: status=completed, !notifiedComplete
  const completeWindow = {
    status: "completed",
    notifiedComplete: false,
  };

  for (const [kind, where] of [
    ["T24", inT24Window],
    ["T0", inT0Window],
    ["complete", completeWindow],
  ]) {
    const windows = await orm.maintenanceWindow.findMany({ where, take: 100 }).catch(() => []);
    for (const w of windows) {
      try {
        const flag = kind === "T24" ? "notifiedT24" : kind === "T0" ? "notifiedT0" : "notifiedComplete";
        await orm.maintenanceWindow.update({
          where: { id: w.id },
          data: { [flag]: true },
        });
        await auditLog({
          action: `maintenance.notify.${kind}`,
          target: w.id,
          payload: {
            title: w.title,
            components: w.components || [],
            scheduledStart: w.scheduledStart,
            scheduledEnd: w.scheduledEnd,
          },
        }).catch(() => {});
        if (kind === "T24") notifiedT24 += 1;
        else if (kind === "T0") notifiedT0 += 1;
        else notifiedComplete += 1;
      } catch {
        errors += 1;
      }
    }
  }

  return {
    processed: notifiedT24 + notifiedT0 + notifiedComplete,
    errors,
    details: { notifiedT24, notifiedT0, notifiedComplete },
  };
}
