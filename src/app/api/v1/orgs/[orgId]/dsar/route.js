/* GET /api/v1/orgs/[orgId]/dsar?status=PENDING — admin queue.
   Auth: OWNER o ADMIN. */

import { auth } from "../../../../../../server/auth";
import { listDsarForOrg } from "../../../../../../server/dsar";
import { isValidStatus } from "../../../../../../lib/dsar";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { orgId } = await params;
  const m = session.memberships?.find((mm) => mm.orgId === orgId);
  if (!m || !["OWNER", "ADMIN"].includes(m.role)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  const status = statusParam && isValidStatus(statusParam) ? statusParam : null;

  const rows = await listDsarForOrg(orgId, { status });
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
  return Response.json({ requests, total: requests.length });
}
