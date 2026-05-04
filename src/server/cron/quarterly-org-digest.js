/* Cron · quarterly-org-digest (Phase 6F SP-C)
 * ═══════════════════════════════════════════════════════════════
 * Cadencia: 0 16 1 * * (mensual, primer día del mes 16:00 UTC ≈ 10am MX).
 *
 * Para cada org NO-personal con ≥1 admin/owner activo:
 *   1. Build executive report (k-anon ≥5 enforced internamente)
 *   2. Si suppressed o sin data → skip (no email innecesario)
 *   3. Si OK → enviar email con HIGHLIGHTS mínimos + link al dashboard
 *      Decision A locked: link only. Email NO contiene data sensible.
 *
 * Idempotencia: si el cron corre 2 veces el mismo día (e.g. retry
 * Vercel), enviará 2 emails. Aceptable para cadencia mensual; future
 * hardening: persistir lastDigestSentAt en Org.
 *
 * Privacy: respeta el flag Org.personal — no envía digests a orgs
 * personales (B2C user). Solo orgs B2B con admin invitable.
 * ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "../db";
import { auditLog } from "../audit";
import { buildExecutiveReport } from "../executiveReport";
import { sendExecutiveReportDigest } from "../email";

const ALLOWED_ROLES = new Set(["OWNER", "ADMIN"]);
const PERIOD_DAYS = 90;

export async function runQuarterlyOrgDigest() {
  const startedAt = Date.now();
  const orm = await db();
  let scanned = 0;
  let sent = 0;
  let skipped = 0;
  let errors = 0;

  let orgs = [];
  try {
    orgs = await orm.org.findMany({
      where: { personal: false },
    });
  } catch {
    orgs = [];
  }

  scanned = orgs.length;

  if (scanned === 0) {
    await auditLog({
      action: "cron.quarterly-org-digest.tick",
      payload: { scanned: 0, sent: 0, skipped: 0, errors: 0, durationMs: Date.now() - startedAt },
    }).catch(() => {});
    return { processed: 0, errors: 0, details: { scanned: 0, sent: 0, skipped: 0 } };
  }

  // Resolve base URL para el link del email. Patrón consistente con
  // sendIncidentNotification que usa NEXT_PUBLIC_APP_URL fallback.
  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://bio-ignicion.app"
  ).replace(/\/$/, "");
  const reportUrl = `${baseUrl}/admin/reportes/ejecutivo`;

  for (const org of orgs) {
    try {
      // Lookup admin/owner memberships del org para destinatarios.
      let adminMemberships = [];
      try {
        adminMemberships = await orm.membership.findMany({
          where: { orgId: org.id, deactivatedAt: null },
        });
      } catch {
        adminMemberships = [];
      }
      const admins = adminMemberships.filter((m) => ALLOWED_ROLES.has(m.role));
      if (admins.length === 0) {
        skipped += 1;
        continue;
      }

      // Build report con k-anon ≥5 enforce. Si suppressed → skip email
      // (admin verá "muestra insuficiente" si abre el dashboard manualmente,
      // pero no recibirá email con highlights vacíos).
      const report = await buildExecutiveReport(org.id, { days: PERIOD_DAYS });
      if (!report || report.suppressed) {
        skipped += 1;
        continue;
      }

      // Resolve emails de admins. Lookup users by ids para obtener email/name.
      const adminUserIds = admins.map((m) => m.userId).filter(Boolean);
      let adminUsers = [];
      try {
        adminUsers = await orm.user.findMany({
          where: { id: { in: adminUserIds } },
        });
      } catch {
        adminUsers = [];
      }

      const highlights = {
        periodDays: PERIOD_DAYS,
        activeMembers: report.kpis?.activeMembers ?? null,
        sessionsTotal: report.kpis?.sessionsTotal ?? null,
        programCompletionRate: report.kpis?.programCompletionRate ?? null,
      };

      let orgSent = 0;
      for (const u of adminUsers) {
        if (!u?.email) continue;
        try {
          const r = await sendExecutiveReportDigest({
            to: u.email,
            adminName: u.name || null,
            orgName: org.name,
            reportUrl,
            highlights,
            locale: u.locale || "es",
            branding: org.branding || null,
            customDomainVerified: !!org.customDomainVerified,
          });
          if (r && (r.skipped || r.MessageID || r.messageId)) {
            // postmark() devuelve { skipped: true } sin token, o el response real.
            orgSent += 1;
          }
        } catch (e) {
          errors += 1;
          // No fail the org — keep trying other admins.
        }
      }

      sent += orgSent;

      await auditLog({
        orgId: org.id,
        action: "cron.quarterly-org-digest.org",
        target: org.id,
        payload: {
          adminsTried: adminUsers.length,
          orgSent,
          activeMembers: highlights.activeMembers,
          sessionsTotal: highlights.sessionsTotal,
        },
      }).catch(() => {});
    } catch {
      errors += 1;
    }
  }

  await auditLog({
    action: "cron.quarterly-org-digest.tick",
    payload: {
      scanned,
      sent,
      skipped,
      errors,
      durationMs: Date.now() - startedAt,
    },
  }).catch(() => {});

  return {
    processed: sent,
    errors,
    details: { scanned, sent, skipped, errors },
  };
}
