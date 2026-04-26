/* POST /api/v1/orgs/[orgId]/members/[userId]/revoke-sessions
   Revoca TODAS las sesiones del user + bumps epoch (offboarding).
   Auth: OWNER o ADMIN con role gating contra el target. */

import { auth } from "../../../../../../../../server/auth";
import { requireCsrf } from "../../../../../../../../server/csrf";
import { revokeAllSessionsForOrgUser } from "../../../../../../../../server/org-sessions";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { orgId, userId } = await params;
  const m = session.memberships?.find((mm) => mm.orgId === orgId);
  if (!m) return Response.json({ error: "forbidden" }, { status: 403 });

  const r = await revokeAllSessionsForOrgUser({
    targetUserId: userId,
    orgId,
    actorUserId: session.user.id,
    actorRole: m.role,
  });

  if (!r.ok) {
    const status = r.error === "forbidden" ? 403
      : r.error === "wrong_org" ? 404
      : 500;
    return Response.json({ error: r.error }, { status });
  }
  return Response.json({ ok: true, count: r.count ?? 0 });
}
