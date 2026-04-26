export const dynamic = "force-dynamic";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import AuditSettingsClient from "./AuditSettingsClient";
import { cssVar, font, space } from "@/components/ui/tokens";
import { AUDIT_RETENTION_DEFAULT } from "@/lib/audit-retention";

export const metadata = { title: "Audit settings · Admin" };

export default async function AuditSettingsPage() {
  const session = await auth();
  // Solo OWNER puede modificar retention/exportar (security-critical).
  // ADMIN puede ver pero no editar — UI hace el gating con `canEdit`.
  const ownerOrAdmin = (session?.memberships || []).find(
    (m) => ["OWNER", "ADMIN"].includes(m.role) && m.org && !m.org.personal
  );
  if (!ownerOrAdmin) {
    return (
      <main style={{ padding: space[6], color: cssVar.text }}>
        <h1 style={{ fontSize: font.size.xl, fontWeight: font.weight.bold, margin: 0 }}>
          Configuración de auditoría no disponible
        </h1>
        <p style={{ color: cssVar.textMuted, marginTop: space[2] }}>
          Solo OWNER o ADMIN del org puede ver retention y exportar logs.
        </p>
      </main>
    );
  }

  const orm = await db();
  const org = await orm.org.findUnique({
    where: { id: ownerOrAdmin.orgId },
    select: {
      id: true, name: true, auditRetentionDays: true,
      auditLastVerifiedAt: true, auditLastVerifiedStatus: true,
    },
  });
  if (!org) return null;

  // Conteo total de logs activos para mostrar en UI.
  const totalLogs = await orm.auditLog.count({ where: { orgId: org.id } }).catch(() => 0);

  return (
    <AuditSettingsClient
      orgId={org.id}
      orgName={org.name}
      canEdit={ownerOrAdmin.role === "OWNER"}
      initialDays={org.auditRetentionDays ?? AUDIT_RETENTION_DEFAULT}
      totalLogs={totalLogs}
      lastVerifiedAt={org.auditLastVerifiedAt ? org.auditLastVerifiedAt.toISOString() : null}
      lastVerifiedStatus={org.auditLastVerifiedStatus || null}
    />
  );
}
