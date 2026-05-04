/* /admin/reportes/ejecutivo — Phase 6F SP-D
   ═══════════════════════════════════════════════════════════════
   Server component dashboard del reporte ejecutivo. Patrón clon de
   /admin/nom35/page.jsx + /admin/programs/adherence/page.jsx (SP-B):
   auth() + db() + role gate + buildReport directo (sin REST round-trip)
   + audit log + PageHeader + render OrgExecutiveReport.

   Soporta ?days=N query param (clamped a [7..365], default 90).
   Audit log fired al render — consistente con audit en endpoint REST
   pero con surface "admin-page" para distinguir.
   ═══════════════════════════════════════════════════════════════ */

import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { auditLog } from "@/server/audit";
import { buildExecutiveReport } from "@/server/executiveReport";
import { PageHeader } from "@/components/admin/PageHeader";
import OrgExecutiveReport from "@/components/admin/OrgExecutiveReport";
import DaysSelector from "@/components/admin/reports/DaysSelector";
import { cssVar, font, radius, space, bioSignal } from "@/components/ui/tokens";

export const metadata = { title: "Reporte ejecutivo · Admin" };
export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set(["OWNER", "ADMIN", "MANAGER"]);
const DEFAULT_DAYS = 90;
const MIN_DAYS = 7;
const MAX_DAYS = 365;

export default async function ReporteEjecutivoPage(props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=/admin/reportes/ejecutivo");
  }

  const searchParams = await Promise.resolve(props?.searchParams).catch(() => ({}));
  const daysRaw = Number(searchParams?.days || DEFAULT_DAYS);
  const days = Number.isFinite(daysRaw) && daysRaw > 0
    ? Math.min(MAX_DAYS, Math.max(MIN_DAYS, Math.floor(daysRaw)))
    : DEFAULT_DAYS;

  // Resolve B2B membership (no-personal preferred). Si user solo tiene
  // org personal o miembro sin role MANAGER+, mostramos NoAccessMessage.
  const memberships = (session.memberships || []).filter(
    (m) => ALLOWED_ROLES.has(m.role) && !m.deactivatedAt
  );
  const mem =
    memberships.find((m) => m.org && !m.org.personal) ||
    memberships[0];

  if (!mem) {
    return <NoAccessMessage />;
  }

  const orgId = mem.orgId;
  const report = await buildExecutiveReport(orgId, { days });

  if (!report) {
    return <NoDataMessage orgName={mem.org?.name} />;
  }

  await auditLog({
    orgId,
    actorId: session.user.id,
    action: "org.executive_report.viewed",
    target: orgId,
    payload: {
      days,
      suppressed: !!report.suppressed,
      activeMembers: report.org?.activeMembers ?? null,
      surface: "admin-page",
    },
  }).catch(() => {});

  return (
    <main data-v2-reporte-ejecutivo>
      <PageHeader
        eyebrow="Reportes · Ejecutivo"
        italic="Reporte"
        title="ejecutivo NOM-035 + biometría."
        subtitle={`${mem.org?.name || "Tu organización"} · Periodo: ${days} días`}
        actions={
          <>
            <DaysSelector current={days} />
            <a
              href={`/admin/reportes/ejecutivo/print?days=${days}`}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="report-print-link"
              style={{
                appearance: "none",
                background: "transparent",
                color: bioSignal.phosphorCyanInk,
                border: `1px solid ${cssVar.border}`,
                borderRadius: radius.md,
                padding: `${space[2]}px ${space[4]}px`,
                fontFamily: cssVar.fontMono,
                fontSize: font.size.xs,
                fontWeight: font.weight.semibold,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              Imprimir
            </a>
          </>
        }
      />

      <OrgExecutiveReport report={report} isPrintMode={false} />
    </main>
  );
}

function NoAccessMessage() {
  return (
    <main data-v2-no-access>
      <PageHeader
        eyebrow="Reportes · Ejecutivo"
        italic="Sin acceso."
        title="Necesitas role ADMIN o MANAGER."
        subtitle="Este reporte está reservado a OWNER, ADMIN y MANAGER de orgs B2B."
      />
      <p style={{ color: cssVar.textMuted, fontSize: font.size.base }}>
        Si crees que esto es un error, contacta al OWNER de tu organización.
      </p>
    </main>
  );
}

function NoDataMessage({ orgName }) {
  return (
    <main data-v2-no-data>
      <PageHeader
        eyebrow="Reportes · Ejecutivo"
        italic="Sin datos."
        title="No pudimos generar el reporte."
        subtitle={orgName ? `Organización: ${orgName}` : undefined}
      />
      <p style={{ color: cssVar.textMuted, fontSize: font.size.base }}>
        Reintenta en unos minutos. Si el problema persiste, escríbenos.
      </p>
    </main>
  );
}
