import { auth } from "../../../../server/auth";
import { listDsarForUser } from "../../../../server/dsar";
import DataRequestsClient from "./DataRequestsClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Solicitudes de datos (DSAR)" };

export default async function DataRequestsPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?next=/settings/data-requests");

  const rows = await listDsarForUser(session.user.id);
  const initial = rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    status: r.status,
    reason: r.reason,
    artifactUrl: r.artifactUrl,
    resolverNotes: r.resolverNotes,
    requestedAt: r.requestedAt instanceof Date ? r.requestedAt.toISOString() : r.requestedAt,
    resolvedAt: r.resolvedAt ? (r.resolvedAt instanceof Date ? r.resolvedAt.toISOString() : r.resolvedAt) : null,
    expiresAt: r.expiresAt instanceof Date ? r.expiresAt.toISOString() : r.expiresAt,
  }));

  // Pasamos memberships del session para que el form pueda elegir
  // org-context (DSAR puede ser para personal data o data dentro de un org B2B).
  const orgs = (session.memberships || [])
    .filter((m) => m.org && !m.org.personal)
    .map((m) => ({ id: m.orgId, name: m.org?.name || m.orgId }));

  return <DataRequestsClient initial={initial} orgs={orgs} />;
}
