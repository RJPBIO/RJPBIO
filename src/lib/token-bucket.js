/* ═══════════════════════════════════════════════════════════════
   Token bucket — pure math, sin dependencies.
   ═══════════════════════════════════════════════════════════════
   Algoritmo clásico para rate limiting:
   - bucket tiene `capacity` tokens y `refillRate` tokens/segundo
   - cada request "consume" N tokens (default 1)
   - si tokens < N → reject con `retryAfter`
   - bucket refilla continuamente (no por window): elapsed * refillRate

   Ventajas vs fixed window:
   - permite burst inicial (capacity full al start)
   - smooth rate sin "thundering herd" al cambiar de window
   - retryAfter calculable preciso

   Pure module: testeable sin Redis ni timers. Storage delega al caller
   (server/rate-limit-key.js para Redis-backed persistence).
   ═══════════════════════════════════════════════════════════════ */

/**
 * Crea un bucket nuevo lleno (capacity tokens).
 * @param {object} args
 * @param {number} args.capacity   — max tokens (burst cap)
 * @param {number} args.refillRate — tokens/segundo
 * @param {number} [args.now]      — ms epoch (testing)
 */
export function createBucket({ capacity, refillRate, now = Date.now() } = {}) {
  if (!Number.isFinite(capacity) || capacity <= 0) {
    throw new Error("capacity must be > 0");
  }
  if (!Number.isFinite(refillRate) || refillRate <= 0) {
    throw new Error("refillRate must be > 0");
  }
  return {
    capacity,
    refillRate,
    tokens: capacity,
    lastRefill: now,
  };
}

/**
 * Refill linear hasta `now`. Retorna nuevo bucket (immutable).
 * @param {object} bucket
 * @param {number} now ms epoch
 */
export function refillTokens(bucket, now = Date.now()) {
  if (!bucket || typeof bucket !== "object") return null;
  const elapsedSec = Math.max(0, (now - bucket.lastRefill) / 1000);
  const refill = elapsedSec * bucket.refillRate;
  const tokens = Math.min(bucket.capacity, bucket.tokens + refill);
  return {
    ...bucket,
    tokens,
    lastRefill: now,
  };
}

/**
 * ¿El bucket tiene cost tokens disponibles ahora-mismo (sin refill)?
 */
export function canConsume(bucket, cost = 1) {
  if (!bucket) return false;
  return bucket.tokens >= cost;
}

/**
 * Intenta consumir cost tokens. Internamente: refill → check → consume.
 * Retorna { ok, bucket, retryAfter? }.
 *
 * - ok=true  → tokens consumidos, bucket actualizado, retryAfter undefined
 * - ok=false → bucket actualizado (refill aplicado pero sin consume),
 *              retryAfter en SEGUNDOS hasta tener cost tokens
 *
 * @param {object} bucket
 * @param {number} cost   default 1
 * @param {number} now    ms epoch
 */
export function consume(bucket, cost = 1, now = Date.now()) {
  if (!bucket || cost < 0) {
    return { ok: false, bucket, retryAfter: Infinity };
  }
  const refilled = refillTokens(bucket, now);
  if (refilled.tokens >= cost) {
    return {
      ok: true,
      bucket: { ...refilled, tokens: refilled.tokens - cost },
    };
  }
  // No tokens suficientes — calcular retryAfter
  const deficit = cost - refilled.tokens;
  const retryAfter = Math.ceil(deficit / refilled.refillRate);
  return {
    ok: false,
    bucket: refilled,
    retryAfter,
  };
}

/**
 * Tokens "remaining" tras un refill virtual a now (sin consumir).
 * Útil para responder con headers RateLimit-Remaining.
 */
export function getRemaining(bucket, now = Date.now()) {
  if (!bucket) return 0;
  const refilled = refillTokens(bucket, now);
  return Math.floor(refilled.tokens);
}

/**
 * Builds bucket desde un quota object (lib/api-quotas.QUOTAS_BY_PLAN entry).
 * Usa perMinute como refill rate y capacity. Burst cap = capacity.
 *
 * @param {{perMinute: number}} quota
 * @param {number} [now]
 */
export function bucketFromQuota(quota, now = Date.now()) {
  const perMinute = quota?.perMinute;
  if (!Number.isFinite(perMinute) || perMinute <= 0) {
    throw new Error("quota.perMinute required");
  }
  return createBucket({
    capacity: perMinute,
    refillRate: perMinute / 60, // tokens/segundo
    now,
  });
}

/* Serialize / deserialize para Redis storage (JSON-safe). */
export function serialize(bucket) {
  if (!bucket) return null;
  return JSON.stringify({
    c: bucket.capacity,
    r: bucket.refillRate,
    t: bucket.tokens,
    l: bucket.lastRefill,
  });
}

export function deserialize(str) {
  if (typeof str !== "string" || !str) return null;
  try {
    const o = JSON.parse(str);
    if (typeof o.c !== "number" || typeof o.r !== "number" ||
        typeof o.t !== "number" || typeof o.l !== "number") return null;
    return {
      capacity: o.c,
      refillRate: o.r,
      tokens: o.t,
      lastRefill: o.l,
    };
  } catch { return null; }
}
