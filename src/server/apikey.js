/* API Key auth para rutas /api/v1/*.
   Sprint 15:
   - mintApiKey acepta { expiresAt } opcional
   - verifyApiKey rechaza si revoked o expired
   - persiste lastUsedAt + lastUsedIp (forensics) en cada validación exitosa
   - exporta verifyApiKeyDetailed para reusar en SCIM (devuelve plan + key full)

   Sprint 16:
   - verifyApiKeyAndRateLimit combina auth + token-bucket per-key
   - retorna info del rate-limit para que el caller setee headers RFC 9239
*/

import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { db } from "./db";
import { checkAndConsume } from "./rate-limit-key";
import { mergeRateLimitChecks } from "@/lib/rate-limit-headers";

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

/**
 * Sprint 16 — auth + rate limit combinados.
 * Retorna:
 *   { ok: false, status: 401|403, error }                  → no autorizada
 *   { ok: false, status: 429, rateLimit }                  → quota exceeded
 *   { ok: true, key, rateLimit }                           → válida; usar rateLimit para headers
 *
 * Caller patrón:
 *   const r = await verifyApiKeyAndRateLimit(req, "scim");
 *   if (!r.ok) return Response.json({error: r.error}, { status: r.status, ...rateLimitHeadersInit(r.rateLimit) });
 *   ... handler logic ...
 *   return Response.json(data, rateLimitHeadersInit(r.rateLimit));
 */
export async function verifyApiKeyAndRateLimit(req, scope) {
  const result = await verifyApiKeyDetailed(req, scope);
  if (!result) {
    return { ok: false, status: 401, error: "invalid_or_expired_token" };
  }
  if (scope && !result.scopes.includes(scope)) {
    return { ok: false, status: 403, error: "scope_required", required: scope };
  }
  // Sprint 26 — dual-check: per-key bucket + per-org bucket.
  // Anti-abuse: un org con 3 keys NO puede 3× su quota porque también
  // hay un bucket compartido a nivel org. Most-restrictive gana.
  const [keyRl, orgRl] = await Promise.all([
    checkAndConsume({ scope: "key", id: result.keyId, plan: result.plan }),
    checkAndConsume({ scope: "org", id: result.orgId, plan: result.plan }),
  ]);
  const merged = mergeRateLimitChecks([keyRl, orgRl]);
  if (!merged.ok) {
    return {
      ok: false,
      status: 429,
      error: "rate_limit_exceeded",
      rateLimit: merged,
      blockedBy: merged.blockedBy,
      key: result,
    };
  }
  return { ok: true, key: result, rateLimit: merged };
}
