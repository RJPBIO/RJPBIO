/* API Key auth para rutas /api/v1/*.
   Sprint 15:
   - mintApiKey acepta { expiresAt } opcional
   - verifyApiKey rechaza si revoked o expired
   - persiste lastUsedAt + lastUsedIp (forensics) en cada validación exitosa
   - exporta verifyApiKeyDetailed para reusar en SCIM (devuelve plan + key full) */

import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { db } from "./db";

function hashToken(t) { return createHash("sha256").update(t).digest("hex"); }

/**
 * Crea una key nueva.
 * @param {string} orgId
 * @param {string} name
 * @param {string[]} scopes
 * @param {object} [opts]
 * @param {Date|null} [opts.expiresAt]
 */
export async function mintApiKey(orgId, name, scopes = ["read"], opts = {}) {
  const raw = `bi_${randomBytes(24).toString("base64url")}`;
  const prefix = raw.slice(0, 8);
  const orm = await db();
  const data = {
    orgId, name, prefix, scopes,
    hash: hashToken(raw),
  };
  if (opts.expiresAt instanceof Date) {
    data.expiresAt = opts.expiresAt;
  }
  const key = await orm.apiKey.create({ data });
  return { id: key.id, token: raw, prefix, expiresAt: key.expiresAt };
}

/**
 * Valida una API key del header Authorization. Retorna info esencial
 * o null si inválida/expired/revoked.
 *
 * Persiste lastUsedAt + lastUsedIp (best-effort) cuando match.
 */
export async function verifyApiKey(req, scope) {
  const result = await verifyApiKeyDetailed(req, scope);
  if (!result) return null;
  return { orgId: result.orgId, keyId: result.keyId, scopes: result.scopes };
}

/**
 * Versión "rica" — devuelve también el plan del org y key.expiresAt.
 * SCIM y otros consumidores que necesiten info adicional pueden usar esta.
 */
export async function verifyApiKeyDetailed(req, scope) {
  const h = req.headers?.get?.("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  const token = h.slice(7);
  const prefix = token.slice(0, 8);
  const orm = await db();
  const key = await orm.apiKey.findFirst({
    where: { prefix, revokedAt: null },
    include: { org: { select: { plan: true } } },
  });
  if (!key) return null;

  const a = Buffer.from(key.hash, "hex");
  const b = Buffer.from(hashToken(token), "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  // Sprint 15 — chequeo de expiry tras la comparación de hash
  // (timing-safe: si el atacante adivina prefix + hash, no le revelamos
  // que la key existe pero está expired vs no existe).
  if (key.expiresAt && new Date(key.expiresAt).getTime() <= Date.now()) {
    return null;
  }

  if (scope && !key.scopes.includes(scope)) return null;

  // Persistencia best-effort de last-used (no bloquea respuesta).
  const ip = req.headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim() || null;
  orm.apiKey.update({
    where: { id: key.id },
    data: {
      lastUsedAt: new Date(),
      ...(ip ? { lastUsedIp: ip } : {}),
    },
  }).catch(() => {});

  return {
    orgId: key.orgId,
    keyId: key.id,
    scopes: key.scopes,
    plan: key.org?.plan || "FREE",
    expiresAt: key.expiresAt,
  };
}
