/* SCIM 2.0 Groups — RFC 7644.
   Sprint 12: fix auth check bug + uso de toScimGroup centralizado. */

import { requireScimAuth, toScimGroup } from "../../../../../server/scim";
import { db } from "../../../../../server/db";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const auth = await requireScimAuth(request);
  // Sprint 12 fix — requireScimAuth retorna { error } o { orgId, keyId };
  // antes el check era `instanceof Response` que NUNCA matcheaba → bug.
  if (auth.error) return auth.error;
  const { searchParams } = new URL(request.url);
  const startIndex = Math.max(1, Number(searchParams.get("startIndex") || 1));
  const count = Math.min(100, Number(searchParams.get("count") || 25));
  const client = await db();
  const teams = await client.team.findMany({ where: { orgId: auth.orgId }, skip: startIndex - 1, take: count });
  const total = await client.team.count({ where: { orgId: auth.orgId } });
  const Resources = await Promise.all(teams.map(async (t) => {
    const members = await client.membership.findMany({ where: { orgId: auth.orgId, teamId: t.id } });
    return toScimGroup(t, members);
  }));
  return Response.json({
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    totalResults: total, startIndex, itemsPerPage: Resources.length, Resources,
  });
}

export async function POST(request) {
  const auth = await requireScimAuth(request);
  if (auth.error) return auth.error;
  const body = await request.json();
  const client = await db();
  const team = await client.team.create({
    data: { id: randomUUID(), orgId: auth.orgId, name: body.displayName || "Unnamed" },
  });
  if (Array.isArray(body.members)) {
    for (const m of body.members) {
      await client.membership.update({
        where: { userId_orgId: { userId: m.value, orgId: auth.orgId } },
        data: { teamId: team.id },
      }).catch(() => {});
    }
  }
  return Response.json(toScimGroup(team, body.members || []), { status: 201 });
}
