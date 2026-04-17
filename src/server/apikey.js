/* API Key auth para rutas /api/v1/* */
import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { db } from "./db";

function hashToken(t) { return createHash("sha256").update(t).digest("hex"); }

export async function mintApiKey(orgId, name, scopes = ["read"]) {
  const raw = `bi_${randomBytes(24).toString("base64url")}`;
  const prefix = raw.slice(0, 8);
  const orm = await db();
  const key = await orm.apiKey.create({ data: { orgId, name, prefix, scopes, hash: hashToken(raw) } });
  return { id: key.id, token: raw, prefix }; // token se muestra UNA vez
}

export async function verifyApiKey(req, scope) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  const token = h.slice(7);
  const prefix = token.slice(0, 8);
  const orm = await db();
  const key = await orm.apiKey.findFirst({ where: { prefix, revokedAt: null } });
  if (!key) return null;
  const a = Buffer.from(key.hash, "hex"), b = Buffer.from(hashToken(token), "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (scope && !key.scopes.includes(scope)) return null;
  orm.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
  return { orgId: key.orgId, keyId: key.id, scopes: key.scopes };
}
