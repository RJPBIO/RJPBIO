/* Helpers SCIM 2.0. Sprint 15 — auth delega en verifyApiKeyDetailed
   (centraliza Bearer parse + timing-safe hash + expiry check + lastUsedIp). */
import "server-only";
import { NextResponse } from "next/server";
import { verifyApiKeyDetailed } from "./apikey";

export function scimError(status, detail) {
  return NextResponse.json({
    schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
    status: String(status), detail,
  }, { status });
}

export async function requireScimAuth(req) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return { error: scimError(401, "Bearer required") };
  const result = await verifyApiKeyDetailed(req);
  if (!result) return { error: scimError(401, "invalid or expired token") };
  if (!result.scopes.includes("scim")) {
    return { error: scimError(403, "scope required: scim") };
  }
  return { orgId: result.orgId, keyId: result.keyId, plan: result.plan };
}

export function toScimUser(u) {
  // Sprint 12 — active = membership existe Y no está deactivated.
  const active = !!u.membership && !u.membership.deactivatedAt;
  return {
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
    id: u.id,
    userName: u.email,
    name: { formatted: u.name || u.email },
    displayName: u.name,
    emails: [{ value: u.email, primary: true }],
    active,
    externalId: u.membership?.scimId,
    meta: {
      resourceType: "User",
      created: u.createdAt,
      lastModified: u.updatedAt || u.createdAt,
      location: `/api/scim/v2/Users/${u.id}`,
    },
  };
}

/* Sprint 12 — exposed para que routes/Groups* lo consuman desde un solo lugar. */
export function toScimGroup(team, members = []) {
  return {
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:Group"],
    id: team.id,
    displayName: team.name,
    members: members.map((m) => ({
      value: m.userId,
      display: m.userId,
      type: "User",
      $ref: `/api/scim/v2/Users/${m.userId}`,
    })),
    meta: {
      resourceType: "Group",
      created: team.createdAt,
      location: `/api/scim/v2/Groups/${team.id}`,
    },
  };
}
