import { requireScimAuth } from "../../../../../../server/scim";
import { db } from "../../../../../../server/db";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const auth = await requireScimAuth(request);
  if (auth instanceof Response) return auth;
  const { id } = await params;
  const client = db();
  const team = await client.team.findUnique({ where: { id } });
  if (!team || team.orgId !== auth.orgId) return new Response("not found", { status: 404 });
  const members = await client.membership.findMany({ where: { orgId: auth.orgId, teamId: id } });
  return Response.json({
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:Group"],
    id: team.id, displayName: team.name,
    members: members.map((m) => ({ value: m.userId, type: "User" })),
    meta: { resourceType: "Group", created: team.createdAt, location: `/scim/v2/Groups/${team.id}` },
  });
}

export async function PATCH(request, { params }) {
  const auth = await requireScimAuth(request);
  if (auth instanceof Response) return auth;
  const { id } = await params;
  const body = await request.json();
  const client = db();
  for (const op of body.Operations || []) {
    if (op.op?.toLowerCase() === "add" && op.path === "members") {
      for (const m of op.value || []) {
        await client.membership.update({ where: { userId_orgId: { userId: m.value, orgId: auth.orgId } }, data: { teamId: id } }).catch(() => {});
      }
    }
    if (op.op?.toLowerCase() === "remove" && op.path?.startsWith("members")) {
      await client.membership.updateMany({ where: { orgId: auth.orgId, teamId: id }, data: { teamId: null } });
    }
    if (op.op?.toLowerCase() === "replace" && op.path === "displayName") {
      await client.team.update({ where: { id }, data: { name: op.value } });
    }
  }
  return Response.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const auth = await requireScimAuth(request);
  if (auth instanceof Response) return auth;
  const { id } = await params;
  const client = db();
  await client.team.delete({ where: { id } }).catch(() => {});
  return new Response(null, { status: 204 });
}
