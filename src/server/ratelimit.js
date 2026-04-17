/* ═══════════════════════════════════════════════════════════════
   Rate limit — token bucket por clave (tenant / IP / user).
   Backends: memoria (dev) · Upstash Redis (prod) si REDIS_URL.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";

const mem = new Map();

async function memCheck(key, limit, windowMs) {
  const now = Date.now();
  const b = mem.get(key) || { count: 0, reset: now + windowMs };
  if (now > b.reset) { b.count = 0; b.reset = now + windowMs; }
  b.count += 1;
  mem.set(key, b);
  return { ok: b.count <= limit, remaining: Math.max(0, limit - b.count), reset: b.reset };
}

let redisPromise;
async function redisCheck(key, limit, windowMs) {
  if (!redisPromise) {
    redisPromise = (async () => {
      const { Redis } = await import("@upstash/redis");
      return new Redis({ url: process.env.REDIS_URL, token: process.env.REDIS_TOKEN });
    })();
  }
  const r = await redisPromise;
  const nowSec = Math.floor(Date.now() / 1000);
  const bucket = `rl:${key}:${Math.floor(nowSec / (windowMs / 1000))}`;
  const count = await r.incr(bucket);
  if (count === 1) await r.expire(bucket, windowMs / 1000);
  return { ok: count <= limit, remaining: Math.max(0, limit - count), reset: (Math.floor(nowSec / (windowMs / 1000)) + 1) * windowMs };
}

export async function check(key, { limit = 120, windowMs = 60_000 } = {}) {
  if (process.env.REDIS_URL) return redisCheck(key, limit, windowMs);
  return memCheck(key, limit, windowMs);
}

export function limits(plan) {
  switch (plan) {
    case "ENTERPRISE": return { limit: 10000, windowMs: 60_000 };
    case "GROWTH": return { limit: 2000, windowMs: 60_000 };
    case "STARTER": return { limit: 600, windowMs: 60_000 };
    default: return { limit: 120, windowMs: 60_000 };
  }
}
