/* /admin/reportes/ejecutivo/print — Phase 6F SP-D
   ═══════════════════════════════════════════════════════════════
   Print-ready version del reporte ejecutivo. Patrón clon de
   /admin/nom35/documento (window.print() + @media print CSS).

   Diferencias vs dashboard interactivo:
     · isPrintMode={true} → oculta PrintButton + nav chrome
     · @media print: white background, dark text, A4 page size
     · @media screen: dark theme (legible mientras user previsualiza
       antes de Ctrl+P / "Guardar como PDF")
     · Audit log "org.executive_report.printed" — distinto de "viewed"
       para tracear specifically los exports de evidencia STPS

   NO inyecta auto-trigger de window.print() — el user controla cuándo
   imprimir (UX consistente con Nom35DocumentClient legacy).
   ═══════════════════════════════════════════════════════════════ */

import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { auditLog } from "@/server/audit";
import { buildExecutiveReport } from "@/server/executiveReport";
import OrgExecutiveReport from "@/components/admin/OrgExecutiveReport";
import { cssVar, font, space } from "@/components/ui/tokens";

export const metadata = { title: "Reporte ejecutivo · Imprimir" };
export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set(["OWNER", "ADMIN", "MANAGER"]);
const DEFAULT_DAYS = 90;
const MIN_DAYS = 7;
const MAX_DAYS = 365;

const PRINT_CSS = `
@page {
  size: A4;
  margin: 18mm 14mm;
}
@media print {
  body { background: #FFFFFF !important; color: #0B1320 !important; }
  [data-v2-borrador-watermark] { display: block !important; }
  [data-v2-print-actions] { display: none !important; }
  [data-v2-days-selector],
  [data-v2-print-button],
  [data-testid="report-print-link"] { display: none !important; }
  [data-v2-executive-report] {
    color: #0B1320;
    max-width: 100%;
  }
  [data-v2-executive-report] * { color: inherit; }
  [data-v2-kpi-card],
  [data-v2-cohort-card],
  [data-v2-dominio-card],
  [data-v2-hrv-chart] {
    background: #FFFFFF !important;
    border: 1px solid #E2E8F0 !important;
    color: #0B1320 !important;
    page-break-inside: avoid;
  }
  [data-v2-section-header] h2 { color: #0B1320 !important; }
  [data-v2-report-header] h1 { color: #0B1320 !important; }
  [data-v2-report-footer] { color: #475569 !important; border-color: #E2E8F0 !important; }
  table { color: #0B1320 !important; }
  thead tr { background: #F1F5F9 !important; }
  tbody tr { border-color: #E2E8F0 !important; }
  /* Force readable axis colors in recharts */
  .recharts-text tspan { fill: #475569 !important; }
}
@media screen {
  body { background: var(--bi-bg, #0A0A0F); color: var(--bi-text, #E5E5E7); }
}
`;

export default async function ReporteEjecutivoPrintPage(props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=/admin/reportes/ejecutivo/print");
  }

  const searchParams = await Promise.resolve(props?.searchParams).catch(() => ({}));
  const daysRaw = Number(searchParams?.days || DEFAULT_DAYS);
  const days = Number.isFinite(daysRaw) && daysRaw > 0
    ? Math.min(MAX_DAYS, Math.max(MIN_DAYS, Math.floor(daysRaw)))
    : DEFAULT_DAYS;

  const memberships = (session.memberships || []).filter(
    (m) => ALLOWED_ROLES.has(m.role) && !m.deactivatedAt
  );
  const mem =
    memberships.find((m) => m.org && !m.org.personal) ||
    memberships[0];

  if (!mem) {
    return <SinAccesoBlock />;
  }

  const orgId = mem.orgId;
  const report = await buildExecutiveReport(orgId, { days });

  if (!report) {
    return <SinDatosBlock />;
  }

  await auditLog({
    orgId,
    actorId: session.user.id,
    action: "org.executive_report.printed",
    target: orgId,
    payload: {
      days,
      suppressed: !!report.suppressed,
      activeMembers: report.org?.activeMembers ?? null,
      surface: "print-page",
    },
  }).catch(() => {});

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <main
        data-v2-reporte-ejecutivo-print
        style={{
          maxWidth: 960,
          marginInline: "auto",
          padding: space[5],
          paddingBlockEnd: space[6],
        }}
      >
        <OrgExecutiveReport report={report} isPrintMode={true} />
      </main>
    </>
  );
}

function SinAccesoBlock() {
  return (
    <main style={{ padding: space[5] }}>
      <p style={{ color: cssVar.textMuted, fontSize: font.size.base }}>
        Sin acceso. Necesitas role OWNER, ADMIN o MANAGER de un org B2B.
      </p>
    </main>
  );
}

function SinDatosBlock() {
  return (
    <main style={{ padding: space[5] }}>
      <p style={{ color: cssVar.textMuted, fontSize: font.size.base }}>
        Sin datos para generar el reporte.
      </p>
    </main>
  );
}
