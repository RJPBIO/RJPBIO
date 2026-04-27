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
  // BUG FIX (Sprint 62): NeuralSession.orgId es la personal-org del user
  // (escrito en /api/sync/outbox/route.js:137). Query directa por orgId
  // del B2B devolvía [] silently — mismo patrón que Sprint 55 (admin) y
  // Sprint 59 (API v1/sessions). GDPR Art. 20 (right of portability del
  // org) violado en silencio: el bundle salía con sessions=[] aunque los
  // members tuvieran historial completo. Fix: query memberships primero,
  // luego sessions por userId∈members.
  const client = await db();
  const [org, members, audit] = await Promise.all([
    client.org.findUnique({ where: { id: orgId } }),
    client.membership.findMany({ where: { orgId, deactivatedAt: null } }),
    client.auditLog.findMany({ where: { orgId }, orderBy: { ts: "asc" } }),
  ]);
  const memberIds = members.map((m) => m.userId);
  const sessions = memberIds.length === 0 ? [] : await client.neuralSession.findMany({
    where: { userId: { in: memberIds } },
  });
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
