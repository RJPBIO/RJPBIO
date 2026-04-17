import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { requireScimAuth, scimError, toScimUser } from "@/server/scim";
import { auditLog } from "@/server/audit";

export async function GET(req, { params }) {
  const { id } = await params;
  const ctx = await requireScimAuth(req); if (ctx.error) return ctx.error;
  const orm = await db();
  const user = await orm.user.findUnique({ where: { id } });
  const membership = await orm.membership.findFirst({ where: { userId: id, orgId: ctx.orgId } });
  if (!user || !membership) return scimError(404, "not found");
  return NextResponse.json(toScimUser({ ...user, membership }));
}

export async function PATCH(req, { params }) {
  const { id } = await params;
  const ctx = await requireScimAuth(req); if (ctx.error) return ctx.error;
  const body = await req.json();
  const orm = await db();
  for (const op of body.Operations || []) {
    if (op.op === "replace" && op.path === "active" && op.value === false) {
      await orm.membership.delete({ where: { userId_orgId: { userId: id, orgId: ctx.orgId } } }).catch(() => {});
      await auditLog({ orgId: ctx.orgId, action: "scim.user.deactivate", target: id });
    }
  }
  const user = await orm.user.findUnique({ where: { id } });
  const membership = await orm.membership.findFirst({ where: { userId: id, orgId: ctx.orgId } });
  return NextResponse.json(toScimUser({ ...user, membership }));
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  const ctx = await requireScimAuth(req); if (ctx.error) return ctx.error;
  const orm = await db();
  await orm.membership.delete({ where: { userId_orgId: { userId: id, orgId: ctx.orgId } } }).catch(() => {});
  await auditLog({ orgId: ctx.orgId, action: "scim.user.delete", target: id });
  return new NextResponse(null, { status: 204 });
}
