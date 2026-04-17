/* API v1 — Sesiones
   GET /api/v1/sessions      lista paginada (scope: read)
   POST /api/v1/sessions     ingesta server-side (scope: write) */
import { NextResponse } from "next/server";
import { verifyApiKey } from "@/server/apikey";
import { check, limits } from "@/server/ratelimit";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";
import { dispatchWebhooks } from "@/server/webhooks";

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
  return NextResponse.json({ data: s }, { status: 201, headers: a.headers });
}
