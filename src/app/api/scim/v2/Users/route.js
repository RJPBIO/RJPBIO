/* SCIM 2.0 Users — RFC 7644 */
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { requireScimAuth, scimError, toScimUser } from "@/server/scim";
import { auditLog } from "@/server/audit";

export async function GET(req) {
  const ctx = await requireScimAuth(req); if (ctx.error) return ctx.error;
  const url = new URL(req.url);
  const filter = url.searchParams.get("filter") || "";
  const count = Math.min(Number(url.searchParams.get("count") || 100), 200);
  const startIndex = Math.max(Number(url.searchParams.get("startIndex") || 1), 1);
  const orm = await db();
  const where = { orgId: ctx.orgId };
  const members = await orm.membership.findMany({ where });
  const users = await Promise.all(members.map(async (m) => {
    const u = await orm.user.findUnique({ where: { id: m.userId } });
    return { ...u, membership: m };
  }));
  const eq = filter.match(/userName eq "([^"]+)"/i);
  const filtered = eq ? users.filter((u) => u.email === eq[1]) : users;
  const page = filtered.slice(startIndex - 1, startIndex - 1 + count);
  return NextResponse.json({
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    totalResults: filtered.length,
    itemsPerPage: page.length,
    startIndex,
    Resources: page.map(toScimUser),
  });
}

export async function POST(req) {
  const ctx = await requireScimAuth(req); if (ctx.error) return ctx.error;
  const body = await req.json();
  const email = body.userName || body.emails?.[0]?.value;
  if (!email) return scimError(400, "userName required");
  const orm = await db();
  let user = await orm.user.findUnique({ where: { email } });
  if (!user) user = await orm.user.create({ data: { email, name: body.displayName || email } });
  const existing = await orm.membership.findFirst({ where: { userId: user.id, orgId: ctx.orgId } });
  if (existing) return scimError(409, "already a member");
  const m = await orm.membership.create({
    data: { userId: user.id, orgId: ctx.orgId, role: "MEMBER", scimId: body.externalId || null },
  });
  await auditLog({ orgId: ctx.orgId, action: "scim.user.create", target: user.id, payload: { email } });
  return NextResponse.json(toScimUser({ ...user, membership: m }), { status: 201 });
}
