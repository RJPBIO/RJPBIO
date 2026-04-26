/* ═══════════════════════════════════════════════════════════════
   Health monitoring — probes + metric gathering for /admin/health.
   ═══════════════════════════════════════════════════════════════
   Pure shape transformation en lib/health-metrics.js. Aquí sólo
   acceso a infra (DB, Redis, Postmark) y queries.

   Auth: PLATFORM_ADMIN_EMAILS (igual que Sprints 19/22).
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "./db";
import { isPlatformAdmin } from "./incidents";
import {
  aggregateAuditEvents,
  computeWebhookSuccessRate,
  computeAuthSuccessRate,
  bucketByHour,
} from "@/lib/health-metrics";

export { isPlatformAdmin };

/**
 * Probe DB con SELECT 1 + medición de latency.
 */
export async function probeDatabase() {
  const start = Date.now();
  try {
    const orm = await db();
    // $queryRaw works on Prisma; simple SELECT 1.
    await orm.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - start };
  } catch (e) {
    return { ok: false, latencyMs: Date.now() - start, error: String(e?.message || e).slice(0, 120) };
  }
}

/**
 * Probe Redis (Upstash) si REDIS_URL configurado. Si no, retorna no-op.
 */
export async function probeRedis() {
  if (!process.env.REDIS_URL) {
    return { ok: true, latencyMs: 0, detail: "not_configured" };
  }
  const start = Date.now();
  try {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({ url: process.env.REDIS_URL, token: process.env.REDIS_TOKEN });
    await redis.ping();
    return { ok: true, latencyMs: Date.now() - start };
  } catch (e) {
    return { ok: false, latencyMs: Date.now() - start, error: String(e?.message || e).slice(0, 120) };
  }
}

/**
 * Postmark info — no probe activo (no spammeamos), solo flag de configuración.
 */
export function probePostmark() {
  if (!process.env.POSTMARK_SERVER_TOKEN) {
    return { ok: true, latencyMs: 0, detail: "not_configured" };
  }
  return { ok: true, latencyMs: 0, detail: "configured" };
}

/**
 * Webhook health últimas 24h (todos los orgs).
 */
export async function gatherWebhookHealth() {
  try {
    const cutoff = new Date(Date.now() - 24 * 3600_000);
    const orm = await db();
    const deliveries = await orm.webhookDelivery.findMany({
      where: { createdAt: { gte: cutoff } },
      select: { id: true, deliveredAt: true, status: true, createdAt: true },
      take: 5000,
    });
    const rate = computeWebhookSuccessRate(deliveries);
    const buckets = bucketByHour(deliveries, 24);
    return { ...rate, buckets };
  } catch {
    return { rate: null, total: 0, success: 0, failed: 0, buckets: [] };
  }
}

/**
 * Auth flow health últimas 24h.
 */
export async function gatherAuthHealth() {
  try {
    const cutoff = new Date(Date.now() - 24 * 3600_000);
    const orm = await db();
    const rows = await orm.auditLog.findMany({
      where: {
        ts: { gte: cutoff },
        OR: [
          { action: "auth.signin" },
          { action: "auth.signin.failed" },
          { action: "auth.signout" },
          { action: "auth.error" },
        ],
      },
      select: { action: true, ts: true },
      take: 10000,
    });
    const events = aggregateAuditEvents(rows, "auth.");
    const successRate = computeAuthSuccessRate(rows);
    return { events, successRate };
  } catch {
    return { events: { total: 0, byAction: {} }, successRate: { rate: null } };
  }
}

/**
 * Sessions activas (no revoked, no expired).
 */
export async function gatherSessionHealth() {
  try {
    const orm = await db();
    const total = await orm.userSession.count({
      where: { revokedAt: null, expiresAt: { gt: new Date() } },
    });
    const recent24h = await orm.userSession.count({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 3600_000) } },
    });
    return { total, recent24h };
  } catch {
    return { total: 0, recent24h: 0 };
  }
}

/**
 * Audit chain status global — última verify timestamp por org agg.
 */
export async function gatherAuditStatus() {
  try {
    const orm = await db();
    const orgs = await orm.org.findMany({
      where: { personal: false },
      select: {
        id: true, name: true,
        auditLastVerifiedAt: true, auditLastVerifiedStatus: true,
      },
    });
    const total = orgs.length;
    const verified = orgs.filter((o) => o.auditLastVerifiedStatus === "verified").length;
    const tampered = orgs.filter((o) => o.auditLastVerifiedStatus === "tampered").length;
    const neverVerified = orgs.filter((o) => !o.auditLastVerifiedAt).length;
    return { total, verified, tampered, neverVerified };
  } catch {
    return { total: 0, verified: 0, tampered: 0, neverVerified: 0 };
  }
}

/**
 * Recent rate-limit hits (audit events). Útil para detectar abuso.
 * Contamos errores 429 que escribimos al audit log (si hubiéramos
 * añadido logging — simplificación: usamos signin failures como proxy).
 *
 * Para una métrica real de rate limit hits necesitaríamos persistir
 * desde middleware → audit. Future polish.
 */
export async function gatherRateLimitHealth() {
  // Por ahora retornamos zero placeholder — middleware no escribe a audit
  // por cada 429. Sprint future: pipe middleware metrics → DB.
  return { hits24h: 0, configured: !!process.env.REDIS_URL };
}

/**
 * Wrap todo en un objeto consumible por la UI.
 */
export async function gatherHealthSnapshot() {
  const [db, redis, postmark, webhook, auth, sessions, audit, rateLimit] = await Promise.all([
    probeDatabase(),
    probeRedis(),
    Promise.resolve(probePostmark()),
    gatherWebhookHealth(),
    gatherAuthHealth(),
    gatherSessionHealth(),
    gatherAuditStatus(),
    gatherRateLimitHealth(),
  ]);
  return {
    services: { db, redis, postmark },
    metrics: { webhook, auth, sessions, audit, rateLimit },
    snapshotAt: new Date().toISOString(),
  };
}
