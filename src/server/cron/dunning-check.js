/* ═══════════════════════════════════════════════════════════════
   Cron · Dunning state check (Sprint S2.8)
   ═══════════════════════════════════════════════════════════════
   Cadencia: diario.
   Para orgs con dunningState != null y graceUntil < now:
     - past_due → downgrade a FREE + notify owner
     - canceled → downgrade a FREE + notify owner
     - failed → downgrade a FREE + notify owner

   Sin esto, una org en grace period sigue con su plan paid pasado
   el grace por inacción del Stripe webhook (que ya hizo su trabajo
   inicial).
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "../db";
import { auditLog } from "../audit";
import { notifyOrgAdmins } from "../notifications";

export async function runDunningCheck() {
  const orm = await db();
  const now = new Date();

  const orgs = await orm.org.findMany({
    where: {
      dunningState: { not: null },
      graceUntil: { lt: now, not: null },
    },
    select: { id: true, name: true, plan: true, dunningState: true, graceUntil: true },
    take: 200,
  }).catch(() => []);

  let processed = 0;
  let errors = 0;
  const downgrades = [];

  for (const org of orgs) {
    if (org.plan === "FREE") continue; // ya en FREE, no hay nada que hacer
    try {
      await orm.org.update({
        where: { id: org.id },
        data: {
          plan: "FREE",
          dunningState: null,
          graceUntil: null,
        },
      });
      await auditLog({
        orgId: org.id,
        action: "billing.dunning.downgrade",
        payload: { from: org.plan, to: "FREE", priorState: org.dunningState },
      }).catch(() => {});
      await notifyOrgAdmins(org.id, {
        title: "Plan reduced to Free",
        body: "Tu período de gracia expiró. Reactiva pagando para recuperar features premium.",
        level: "warn",
        href: "/admin/billing",
        kind: "billing.downgrade.auto",
      }).catch(() => {});
      processed += 1;
      downgrades.push({ orgId: org.id, from: org.plan });
    } catch {
      errors += 1;
    }
  }

  return {
    processed,
    errors,
    details: { downgrades: downgrades.slice(0, 50), checked: orgs.length },
  };
}
