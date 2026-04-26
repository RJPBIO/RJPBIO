export const dynamic = "force-dynamic";
import { auth } from "@/server/auth";
import { listDsarForOrg } from "@/server/dsar";
import DsarQueueClient from "./DsarQueueClient";
import { cssVar, font, space } from "@/components/ui/tokens";

export const metadata = { title: "DSAR · Admin" };

export default async function DsarPage() {
  const session = await auth();
  const adminMembership = (session?.memberships || []).find(
    (m) => ["OWNER", "ADMIN"].includes(m.role) && m.org && !m.org.personal
  );
  if (!adminMembership) {
    return (
      <main style={{ padding: space[6], color: cssVar.text }}>
        <h1 style={{ fontSize: font.size.xl, fontWeight: font.weight.bold, margin: 0 }}>
          DSAR no disponible
        </h1>
        <p style={{ color: cssVar.textMuted, marginTop: space[2] }}>
          Solo OWNER o ADMIN del org puede ver y resolver solicitudes DSAR.
        </p>
      </main>
    );
  }

  const rows = await listDsarForOrg(adminMembership.orgId);
  const requests = rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    userEmail: r.user?.email || null,
    userName: r.user?.name || null,
    kind: r.kind,
    status: r.status,
    reason: r.reason,
    resolverEmail: r.resolver?.email || null,
    resolverNotes: r.resolverNotes,
    artifactUrl: r.artifactUrl,
    requestedAt: r.requestedAt.toISOString(),
    resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : null,
    expiresAt: r.expiresAt.toISOString(),
  }));

  return (
    <DsarQueueClient
      orgId={adminMembership.orgId}
      orgName={adminMembership.org?.name || "este org"}
      actorRole={adminMembership.role}
      initialRequests={requests}
    />
  );
}
