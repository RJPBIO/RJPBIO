import { auth } from "../../../../../server/auth";
import { db } from "../../../../../server/db";
import { auditLog } from "../../../../../server/audit";
import { requireCsrf } from "../../../../../server/csrf";

export const dynamic = "force-dynamic";

/** GDPR Art. 17 — right to erasure. Soft-deletes now; hard-delete after 30d grace. */
export async function DELETE(request) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const userId = session.user.id;
  const client = db();
  await client.user.update({ where: { id: userId }, data: { deletedAt: new Date(), email: `deleted-${userId}@bio-ignicion.local`, name: null, image: null } });
  const memberships = await client.membership.findMany({ where: { userId } });
  for (const m of memberships) {
    await auditLog({ orgId: m.orgId, actorId: userId, action: "user.deletion.requested", target: userId, payload: { graceDays: 30 } });
  }
  return Response.json({ status: "scheduled", hardDeleteAt: new Date(Date.now() + 30 * 86400_000).toISOString() });
}
