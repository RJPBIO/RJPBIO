/* GET /api/v1/orgs/[orgId]/compliance — JSON evidence pack para UI.
   Auth: OWNER o ADMIN del org. */

import { auth } from "../../../../../../server/auth";
import { getCompliancePackForOrg } from "../../../../../../server/compliance";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { orgId } = await params;
  const m = session.memberships?.find((mm) => mm.orgId === orgId);
  if (!m || !["OWNER", "ADMIN"].includes(m.role)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const pack = await getCompliancePackForOrg(orgId, { actorUserId: session.user.id });
  if (!pack) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json(pack);
}
