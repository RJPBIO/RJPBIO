/* API v1 — Sesiones
   GET /api/v1/sessions      lista paginada (scope: read)
   POST /api/v1/sessions     ingesta server-side (scope: write)
   Anti-abuso: Idempotency-Key (replay guard) + rate sano 12 sesiones/día/usuario */
import { NextResponse } from "next/server";
import { verifyApiKey } from "@/server/apikey";
import { check, limits } from "@/server/ratelimit";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";
import { dispatchWebhooks } from "@/server/webhooks";

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
  const ctx = await verifyApiKey(req, scope);
  if (!ctx) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  const orm = await db();
  const org = await orm.org.findUnique({ where: { id: ctx.orgId } });
  const rl = await check(`org:${ctx.orgId}`, limits(org?.plan));
  const headers = { "RateLimit-Remaining": String(rl.remaining), "RateLimit-Reset": String(rl.reset) };
  if (!rl.ok) return { error: NextResponse.json({ error: "rate_limited" }, { status: 429, headers }) };
  return { ctx, org, headers };
}

export async function GET(req) {
  const a = await authed(req, "read"); if (a.error) return a.error;
  const url = new URL(req.url);
  const take = Math.min(Number(url.searchParams.get("limit") || 50), 200);
  const skip = Number(url.searchParams.get("offset") || 0);
  const orm = await db();
  const rows = await orm.neuralSession.findMany({
    where: { orgId: a.ctx.orgId }, orderBy: { completedAt: "desc" }, take, skip,
  });
  return NextResponse.json({ data: rows, paging: { limit: take, offset: skip } }, { headers: a.headers });
}

export async function POST(req) {
  const a = await authed(req, "write"); if (a.error) return a.error;
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
    },
  });
  await auditLog({ orgId: a.ctx.orgId, action: "api.session.create", target: s.id });
  dispatchWebhooks(a.ctx.orgId, "session.completed", s).catch(() => {});
  const responseBody = { data: s };
  if (idemKey) await idemStore(`${a.ctx.orgId}:${idemKey}`, responseBody);
  return NextResponse.json(responseBody, { status: 201, headers: a.headers });
}
