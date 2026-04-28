/* API v1 — Sesiones
   GET /api/v1/sessions      lista paginada (scope: read)
   POST /api/v1/sessions     ingesta server-side (scope: write)
   Anti-abuso: Idempotency-Key (replay guard) + rate sano 12 sesiones/día/usuario.
   Sprint 26: rate limit dual (per-key + per-org) vía verifyApiKeyAndRateLimit
   con headers RFC 9239 en respuestas. */
import { NextResponse } from "next/server";
import { verifyApiKeyAndRateLimit } from "@/server/apikey";
import { check } from "@/server/ratelimit";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";
import { dispatchWebhooks } from "@/server/webhooks";
import { buildRateLimitHeaders } from "@/lib/rate-limit-headers";
import { findSessionsForOrgMembers } from "@/server/org-neural-sessions";

// Idempotency store (in-memory; Upstash si hay REDIS_URL)
const idemMem = new Map();
async function idemSeen(key) {
  if (process.env.REDIS_URL) {
    const { Redis } = await import("@upstash/redis");
    const r = new Redis({ url: process.env.REDIS_URL, token: process.env.REDIS_TOKEN });
    const prev = await r.get(`idem:${key}`);
    if (prev) return prev;
    return null;
  }
  const now = Date.now();
  const entry = idemMem.get(key);
  if (entry && entry.expires > now) return entry.body;
  return null;
}
async function idemStore(key, body) {
  if (process.env.REDIS_URL) {
    const { Redis } = await import("@upstash/redis");
    const r = new Redis({ url: process.env.REDIS_URL, token: process.env.REDIS_TOKEN });
    await r.set(`idem:${key}`, body, { ex: 86400 });
    return;
  }
  idemMem.set(key, { body, expires: Date.now() + 86400_000 });
}

async function authed(req, scope) {
  const r = await verifyApiKeyAndRateLimit(req, scope);
  if (!r.ok) {
    const headers = buildRateLimitHeaders({
      policy: r.rateLimit?.policy,
      remaining: r.rateLimit?.remaining,
      reset: r.rateLimit?.reset,
      retryAfter: r.status === 429 ? r.rateLimit?.retryAfter : undefined,
    });
    return {
      error: NextResponse.json(
        { error: r.error, blockedBy: r.blockedBy },
        { status: r.status, headers }
      ),
    };
  }
  // RFC 9239 headers en respuestas exitosas — clientes SDK auto-backoff.
  const headers = buildRateLimitHeaders({
    policy: r.rateLimit?.policy,
    remaining: r.rateLimit?.remaining,
    reset: r.rateLimit?.reset,
  });
  const orm = await db();
  const org = await orm.org.findUnique({ where: { id: r.key.orgId } });
  return { ctx: r.key, org, headers };
}

export async function GET(req) {
  const a = await authed(req, "read:sessions"); if (a.error) return a.error;
  const url = new URL(req.url);
  const take = Math.min(Number(url.searchParams.get("limit") || 50), 200);
  const skip = Number(url.searchParams.get("offset") || 0);
  // Sprint 63 — usa helper canónico (sessions viven en personal-org del
  // user, no en B2B-org). Sprint 55 patrón consolidado.
  const rows = await findSessionsForOrgMembers(a.ctx.orgId, {
    orderBy: { completedAt: "desc" },
    take, skip,
  });
  return NextResponse.json({ data: rows, paging: { limit: take, offset: skip } }, { headers: a.headers });
}

export async function POST(req) {
  const a = await authed(req, "write:sessions"); if (a.error) return a.error;
  const body = await req.json();

  // Idempotency: mismo key en 24h devuelve el mismo resultado sin crear duplicado.
  const idemKey = req.headers.get("idempotency-key");
  if (idemKey) {
    const prev = await idemSeen(`${a.ctx.orgId}:${idemKey}`);
    if (prev) return NextResponse.json(prev, { status: 200, headers: { ...a.headers, "Idempotent-Replayed": "true" } });
  }

  // Rate sano por usuario: máx 12 sesiones/24h. Pedagógico, no punitivo.
  if (body.userId) {
    const rl = await check(`sessions:user:${body.userId}`, { limit: 12, windowMs: 24 * 60 * 60_000 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "too_many_sessions", message: "Descansa — el exceso rompe el propósito. Máx 12 sesiones/día." },
        { status: 429, headers: { ...a.headers, "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)) } }
      );
    }
  }

  const orm = await db();

  // Si viene stationId, validamos pertenencia al org y (opcionalmente) slot.
  let stationId = null, slot = null;
  if (body.stationId) {
    const st = await orm.station.findUnique({ where: { id: String(body.stationId) } });
    if (st && st.orgId === a.ctx.orgId && st.active) {
      stationId = st.id;
      const allowed = ["MORNING", "EVENING", "ADHOC"];
      if (body.slot && allowed.includes(String(body.slot))) slot = String(body.slot);
    }
  }

  const s = await orm.neuralSession.create({
    data: {
      orgId: a.ctx.orgId,
      userId: body.userId,
      teamId: body.teamId || null,
      protocolId: body.protocolId,
      durationSec: body.durationSec,
      coherenciaDelta: body.coherenciaDelta ?? null,
      moodPre: body.moodPre ?? null,
      moodPost: body.moodPost ?? null,
      completedAt: new Date(body.completedAt || Date.now()),
      clientVersion: body.clientVersion || null,
      stationId,
      slot,
    },
  });
  await auditLog({ orgId: a.ctx.orgId, action: "api.session.create", target: s.id });
  dispatchWebhooks(a.ctx.orgId, "session.completed", s).catch(() => {});
  const responseBody = { data: s };
  if (idemKey) await idemStore(`${a.ctx.orgId}:${idemKey}`, responseBody);
  return NextResponse.json(responseBody, { status: 201, headers: a.headers });
}
