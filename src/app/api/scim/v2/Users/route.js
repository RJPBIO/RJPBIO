/* SCIM 2.0 Users — RFC 7644.
   Sprint 12: filter parser real + DB-side pagination + soft-deactivation. */

import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { requireScimAuth, scimError, toScimUser } from "@/server/scim";
import { auditLog } from "@/server/audit";
import { parseScimFilter, evalScimFilter } from "@/lib/scim-filter";

export async function GET(req) {
  const ctx = await requireScimAuth(req); if (ctx.error) return ctx.error;
  const url = new URL(req.url);
  const filter = url.searchParams.get("filter") || "";
  const count = Math.min(Number(url.searchParams.get("count") || 100), 200);
  const startIndex = Math.max(Number(url.searchParams.get("startIndex") || 1), 1);

  // Parsea filter — si inválido, devolvemos 400 con detalle (Okta lo pide así).
  let filterAst;
  try {
    filterAst = parseScimFilter(filter);
  } catch (e) {
    return scimError(400, `invalid filter: ${e.message}`);
  }

  const orm = await db();
  const memberships = await orm.membership.findMany({
    where: { orgId: ctx.orgId },
    select: { userId: true, scimId: true, deactivatedAt: true, createdAt: true, role: true },
  });
  const userIds = memberships.map((m) => m.userId);
  if (!userIds.length) {
    return NextResponse.json({
      schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
      totalResults: 0, itemsPerPage: 0, startIndex, Resources: [],
    });
  }
  const users = await orm.user.findMany({ where: { id: { in: userIds } } });
  const memberByUser = new Map(memberships.map((m) => [m.userId, m]));

  // Aplica filter SCIM contra el shape SCIM (no contra row crudo).
  const scimUsers = users.map((u) => toScimUser({ ...u, membership: memberByUser.get(u.id) }));
  const filtered = filterAst ? scimUsers.filter((s) => evalScimFilter(filterAst, s)) : scimUsers;

  const page = filtered.slice(startIndex - 1, startIndex - 1 + count);
  return NextResponse.json({
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    totalResults: filtered.length,
    itemsPerPage: page.length,
    startIndex,
    Resources: page,
  });
}

export async function POST(req) {
  const ctx = await requireScimAuth(req); if (ctx.error) return ctx.error;
  const body = await req.json();
  const email = body.userName || body.emails?.[0]?.value;
  if (!email) return scimError(400, "userName required");
  const orm = await db();

  // Reactivation idempotente: si ya hay membership deactivada con este email,
  // re-activamos en lugar de crear duplicado (Okta provisioning re-add flow).
  let user = await orm.user.findUnique({ where: { email } });
  if (!user) {
    user = await orm.user.create({ data: { email, name: body.displayName || email } });
  }
  const existing = await orm.membership.findFirst({ where: { userId: user.id, orgId: ctx.orgId } });
  if (existing) {
    if (existing.deactivatedAt) {
      const reactivated = await orm.membership.update({
        where: { id: existing.id },
        data: { deactivatedAt: null, scimId: body.externalId || existing.scimId },
      });
      await auditLog({
        orgId: ctx.orgId, action: "scim.user.reactivate", target: user.id, payload: { email },
      }).catch(() => {});
      return NextResponse.json(toScimUser({ ...user, membership: reactivated }), { status: 200 });
    }
    return scimError(409, "already a member");
  }
  const m = await orm.membership.create({
    data: { userId: user.id, orgId: ctx.orgId, role: "MEMBER", scimId: body.externalId || null },
  });
  await auditLog({
    orgId: ctx.orgId, action: "scim.user.create", target: user.id, payload: { email },
  }).catch(() => {});
  return NextResponse.json(toScimUser({ ...user, membership: m }), { status: 201 });
}
