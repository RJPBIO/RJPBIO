/* ═══════════════════════════════════════════════════════════════
   Rate limit per-key (Redis-backed, in-memory fallback).
   ═══════════════════════════════════════════════════════════════
   Math pure en lib/token-bucket.js. Este módulo añade persistencia:
   - Si REDIS_URL configurado → Upstash Redis (works en edge + node)
   - Sino → Map in-memory (perdido al deploy, OK para single-instance dev)

   Una request:
     1. Lee bucket de Redis (deserialize) o crea uno fresh
     2. consume(bucket, cost, now) — refill + check + decrement
     3. Si ok → escribe bucket actualizado con TTL = window * 2
     4. Retorna { ok, remaining, retryAfter, policy }

   Race condition: dos requests simultáneos pueden leer el mismo state
   y ambos consumir → over-consume por una request. Aceptable para
   B2B-elite (Stripe lo hace igual). Para bullet-proof: WATCH + MULTI
   con Redis o lua script. Defer.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import {
  bucketFromQuota, consume, getRemaining, serialize, deserialize,
} from "@/lib/token-bucket";
import { getRateLimitForPlan } from "@/lib/api-quotas";

const memBuckets = new Map();

let _redisPromise;
async function getRedis() {
  if (!process.env.REDIS_URL) return null;
  if (!_redisPromise) {
    _redisPromise = (async () => {
      try {
        const { Redis } = await import("@upstash/redis");
        return new Redis({ url: process.env.REDIS_URL, token: process.env.REDIS_TOKEN });
      } catch { return null; }
    })();
  }
  return _redisPromise;
}

function bucketKey(scope, id) {
  return `rl:${scope}:${id}`;
}

async function readBucket(scope, id) {
  const redis = await getRedis();
  const k = bucketKey(scope, id);
  if (redis) {
    try {
      const v = await redis.get(k);
      // Upstash retorna ya parseado si era JSON; toleramos string también.
      if (typeof v === "string") return deserialize(v);
      if (v && typeof v === "object" && typeof v.c === "number") {
        return {
          capacity: v.c, refillRate: v.r, tokens: v.t, lastRefill: v.l,
        };
      }
      return null;
    } catch { /* fall through to memory */ }
  }
  return memBuckets.get(k) || null;
}

async function writeBucket(scope, id, bucket, ttlSec = 120) {
  const redis = await getRedis();
  const k = bucketKey(scope, id);
  if (redis) {
    try {
      await redis.set(k, serialize(bucket), { ex: ttlSec });
      return;
    } catch { /* fall through */ }
  }
  memBuckets.set(k, bucket);
}

/**
 * Chequea + consume token bucket para (scope, id) según el plan dado.
 * `scope` = "key" | "org" | otro identificador de bucket family.
 *
 * @param {object} args
 * @param {"key"|"org"} args.scope
 * @param {string} args.id
 * @param {string} args.plan
 * @param {number} [args.cost=1]
 * @returns {Promise<{ok, remaining, retryAfter?, policy}>}
 */
export async function checkAndConsume({ scope, id, plan, cost = 1 }) {
  if (!scope || !id) return { ok: true, remaining: Infinity, policy: null };
  const quota = getRateLimitForPlan(plan);
  const policy = { limit: quota.perMinute, window: 60, burst: quota.perMinute };

  const now = Date.now();
  let bucket = await readBucket(scope, id);
  if (!bucket) {
    bucket = bucketFromQuota(quota, now);
  } else if (bucket.capacity !== quota.perMinute) {
    // Plan cambió → re-build bucket (no inflar/encoger sino reset clean).
    bucket = bucketFromQuota(quota, now);
  }

  const r = consume(bucket, cost, now);
  await writeBucket(scope, id, r.bucket, 120).catch(() => {});

  const remaining = getRemaining(r.bucket, now);
  if (r.ok) {
    return {
      ok: true,
      remaining,
      reset: Math.ceil((policy.limit - remaining) / quota.perMinute * 60),
      policy,
    };
  }
  return {
    ok: false,
    remaining,
    retryAfter: r.retryAfter,
    policy,
  };
}

/**
 * Reset rate limit para (scope, id). Útil tras revoke/rotate de keys.
 */
export async function resetBucket(scope, id) {
  const redis = await getRedis();
  const k = bucketKey(scope, id);
  if (redis) {
    try { await redis.del(k); } catch { /* no-op */ }
  }
  memBuckets.delete(k);
}

/**
 * Limpia el cache in-memory (sólo testing — el redis se gestiona aparte).
 */
export function _resetMemoryStoreForTests() {
  memBuckets.clear();
}
