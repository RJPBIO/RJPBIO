/* Bulk member actions. action=remove → elimina memberships del org.
   Auth: OWNER|ADMIN del org. Evita auto-eliminación del owner. */
import { db } from "@/server/db";
import { auth } from "@/server/auth";

const MAX_BATCH = 200;

export async function POST(request) {
  const session = await auth();
  if (!session?.user) return new Response("unauthorized", { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body) return new Response("bad request", { status: 400 });

  const { orgId, ids, action } = body;
  if (!orgId || !Array.isArray(ids) || !action) return new Response("bad request", { status: 400 });
  if (ids.length > MAX_BATCH) return new Response("too many", { status: 413 });
  const member = session.memberships?.find((m) => m.orgId === orgId);
  if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
    return new Response("forbidden", { status: 403 });
  }

  const orm = await db();
  if (action === "remove") {
    const rows = await orm.membership.findMany({ where: { orgId, id: { in: ids } } });
    const toDelete = rows
      .filter((r) => r.userId !== session.user.id)
      .filter((r) => r.role !== "OWNER")
      .map((r) => r.id);
    if (!toDelete.length) return Response.json({ removed: 0 });
    await orm.membership.deleteMany({ where: { id: { in: toDelete } } });
    return Response.json({ removed: toDelete.length, skipped: rows.length - toDelete.length });
  }
  return new Response("unsupported action", { status: 400 });
}
