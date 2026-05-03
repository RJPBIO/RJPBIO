/* ═══════════════════════════════════════════════════════════════
   Cron · Trial-end reminder (Sprint S2.7)
   ═══════════════════════════════════════════════════════════════
   Cadencia: diario.
   Para cada org con trialEndsAt en próximas 72h, fan-out
   notification al admin (in-app via Notification table).

   Idempotencia: chequeamos si ya hay una Notification kind="billing.trial_end_soon"
   para ese orgId creada en últimas 72h. Si sí, skip.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "../db";
import { notifyOrgAdmins } from "../notifications";

const HOUR_MS = 3600_000;
const REMINDER_WINDOW_HOURS = 72;
const RECENT_NOTIFICATION_HOURS = 70; // ligeramente menor para evitar bordes

export async function runTrialEndReminder() {
  const orm = await db();
  const now = new Date();

  const orgs = await orm.org.findMany({
    where: {
      trialEndsAt: {
        gt: now,
        lt: new Date(now.getTime() + REMINDER_WINDOW_HOURS * HOUR_MS),
      },
    },
    select: { id: true, name: true, trialEndsAt: true },
    take: 200,
  }).catch(() => []);

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const org of orgs) {
    try {
      const since = new Date(now.getTime() - RECENT_NOTIFICATION_HOURS * HOUR_MS);
      const recent = await orm.notification.findFirst({
        where: {
          orgId: org.id,
          kind: "billing.trial_end_soon",
          createdAt: { gte: since },
        },
      }).catch(() => null);
      if (recent) { skipped += 1; continue; }

      const hoursLeft = Math.max(1, Math.round((new Date(org.trialEndsAt).getTime() - now.getTime()) / HOUR_MS));
      await notifyOrgAdmins(org.id, {
        title: `Tu trial termina en ${hoursLeft}h`,
        body: "Agrega método de pago para continuar sin interrupción.",
        level: "warn",
        href: "/admin/billing",
        kind: "billing.trial_end_soon",
      }).catch(() => {});
      processed += 1;
    } catch {
      errors += 1;
    }
  }

  return {
    processed,
    errors,
    details: { skipped, orgsCount: orgs.length, windowHours: REMINDER_WINDOW_HOURS },
  };
}
