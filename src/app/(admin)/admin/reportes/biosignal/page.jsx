/* /admin/reportes/biosignal — BioSignal Index (B2B benchmark)
   ═══════════════════════════════════════════════════════════════
   Server component: auth + role gate + buildBioSignalReport + render.
   Patrón clon de /admin/reportes/ejecutivo. Benchmark anónimo por
   industria (k-anon a nivel org + miembro). */

import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { auditLog } from "@/server/audit";
import { buildBioSignalReport } from "@/server/bioSignalReport";
import { PageHeader } from "@/components/admin/PageHeader";
import BioSignalIndexPanel from "@/components/admin/reports/BioSignalIndexPanel";
import CohortSettingsForm from "@/components/admin/reports/CohortSettingsForm";
import { cssVar, font } from "@/components/ui/tokens";

export const metadata = { title: "BioSignal Index · Admin" };
export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set(["OWNER", "ADMIN", "MANAGER"]);

export default async function BioSignalPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=/admin/reportes/biosignal");
  }

  const memberships = (session.memberships || []).filter(
    (m) => ALLOWED_ROLES.has(m.role) && !m.deactivatedAt
  );
  const mem = memberships.find((m) => m.org && !m.org.personal) || memberships[0];
  if (!mem) {
    return (
      <main>
        <PageHeader eyebrow="Reportes · BioSignal" italic="Sin acceso." title="Necesitas role ADMIN o MANAGER." />
        <p style={{ color: cssVar.textMuted, fontSize: font.size.base }}>
          Reservado a OWNER, ADMIN y MANAGER de organizaciones B2B.
        </p>
      </main>
    );
  }

  const orgId = mem.orgId;
  let report = null;
  try {
    report = await buildBioSignalReport(orgId);
  } catch {
    report = null;
  }

  await auditLog({
    orgId,
    actorId: session.user.id,
    action: "org.biosignal_index.viewed",
    target: orgId,
    payload: {
      industry: report?.org?.industry ?? null,
      benchmarkReady: !!report?.benchmarkReady,
      myIndex: report?.myIndex ?? null,
    },
  }).catch(() => {});

  return (
    <main data-v2-biosignal>
      <PageHeader
        eyebrow="Reportes · Benchmark"
        italic="BioSignal"
        title="Index — tu org vs tu industria."
        subtitle={`${mem.org?.name || "Tu organización"} · comparativa anónima (k-anonimato)`}
      />
      {report ? (
        <BioSignalIndexPanel report={report} />
      ) : (
        <p style={{ color: cssVar.textMuted, fontSize: font.size.base }}>
          No pudimos generar el índice. Reintenta en unos minutos.
        </p>
      )}

      {/* OWNER/ADMIN: configurar la cohorte (activa/ajusta el benchmark). */}
      {mem.role !== "MANAGER" && (
        <CohortSettingsForm orgId={orgId} current={report?.org || {}} />
      )}
    </main>
  );
}
