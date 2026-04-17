import { auth } from "../../../../../../server/auth";
import { db } from "../../../../../../server/db";
import { requireMembership } from "../../../../../../server/rbac";
import { auditLog } from "../../../../../../server/audit";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const { id: orgId } = await params;
  const session = await auth();
  const guard = await requireMembership(session, orgId, "org.export");
  if (guard) return guard;
  const client = db();
  const [org, members, sessions, audit] = await Promise.all([
    client.org.findUnique({ where: { id: orgId } }),
    client.membership.findMany({ where: { orgId } }),
    client.neuralSession.findMany({ where: { orgId } }),
    client.auditLog.findMany({ where: { orgId }, orderBy: { ts: "asc" } }),
  ]);
  await auditLog({ orgId, actorId: session.user.id, action: "org.data.exported" });
  const body = JSON.stringify({ org, members, sessions, audit, exportedAt: new Date().toISOString() }, null, 2);
  return new Response(body, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="org-${orgId}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
