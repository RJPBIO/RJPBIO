/* GET /api/v1/orgs/[orgId]/sessions — lista sesiones de members del org.
   Auth: OWNER o ADMIN del org.
   Query params: ?includeRevoked=1 — incluye sesiones revocadas recientes
                                      (filtro: expiresAt > now, sin importar revokedAt).
   Returns: { groups: [{ userId, userEmail, userRole, sessions: [...] }], total }
*/

import { auth } from "../../../../../../server/auth";
import { listSessionsForOrg } from "../../../../../../server/org-sessions";
import { canManageOrgSessions } from "../../../../../../lib/org-sessions";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { orgId } = await params;
  const m = session.memberships?.find((mm) => mm.orgId === orgId);
  if (!m || !canManageOrgSessions(m.role)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const includeRevoked = url.searchParams.get("includeRevoked") === "1";

  const { groups, total } = await listSessionsForOrg(orgId, { includeRevoked });

  // Serializa Date → ISO para JSON.
  const serialized = groups.map((g) => ({
    ...g,
    sessions: g.sessions.map((s) => ({
      ...s,
      createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
      lastSeenAt: s.lastSeenAt instanceof Date ? s.lastSeenAt.toISOString() : s.lastSeenAt,
      expiresAt: s.expiresAt instanceof Date ? s.expiresAt.toISOString() : s.expiresAt,
      revokedAt: s.revokedAt instanceof Date ? s.revokedAt.toISOString() : s.revokedAt,
    })),
  }));

  return Response.json({ groups: serialized, total });
}
