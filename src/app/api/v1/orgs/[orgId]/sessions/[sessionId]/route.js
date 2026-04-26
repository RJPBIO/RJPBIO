/* DELETE /api/v1/orgs/[orgId]/sessions/[sessionId] — revoca sesión específica.
   Auth: OWNER o ADMIN. Role gating contra el target en revokeOrgSession. */

import { auth } from "../../../../../../../server/auth";
import { requireCsrf } from "../../../../../../../server/csrf";
import { revokeOrgSession } from "../../../../../../../server/org-sessions";

export const dynamic = "force-dynamic";

export async function DELETE(request, { params }) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { orgId, sessionId } = await params;
  const m = session.memberships?.find((mm) => mm.orgId === orgId);
  if (!m) return Response.json({ error: "forbidden" }, { status: 403 });

  const r = await revokeOrgSession({
    sessionId,
    orgId,
    actorUserId: session.user.id,
    actorRole: m.role,
  });

  if (!r.ok) {
    const status = r.error === "forbidden" ? 403
      : r.error === "not_found" ? 404
      : r.error === "wrong_org" ? 404
      : 500;
    return Response.json({ error: r.error }, { status });
  }
  return Response.json({ ok: true, idempotent: !!r.idempotent });
}
