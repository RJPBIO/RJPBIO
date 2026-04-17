/* Helpers SCIM 2.0 */
import "server-only";
import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { db } from "./db";

export function scimError(status, detail) {
  return NextResponse.json({
    schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
    status: String(status), detail,
  }, { status });
}

function hashToken(t) {
  return createHash("sha256").update(t).digest("hex");
}

export async function requireScimAuth(req) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return { error: scimError(401, "Bearer required") };
  const token = h.slice(7);
  const prefix = token.slice(0, 8);
  const orm = await db();
  const key = await orm.apiKey.findFirst({ where: { prefix, revokedAt: null } });
  if (!key) return { error: scimError(401, "invalid token") };
  const expected = Buffer.from(key.hash, "hex");
  const got = Buffer.from(hashToken(token), "hex");
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return { error: scimError(401, "invalid token") };
  if (!key.scopes.includes("scim")) return { error: scimError(403, "scope required: scim") };
  await orm.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
  return { orgId: key.orgId, keyId: key.id };
}

export function toScimUser(u) {
  return {
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
    id: u.id,
    userName: u.email,
    name: { formatted: u.name || u.email },
    displayName: u.name,
    emails: [{ value: u.email, primary: true }],
    active: !!u.membership,
    externalId: u.membership?.scimId,
    meta: { resourceType: "User", created: u.createdAt, lastModified: u.updatedAt || u.createdAt },
  };
}
