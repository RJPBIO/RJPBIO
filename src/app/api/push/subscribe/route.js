/* ═══════════════════════════════════════════════════════════════
   POST /api/push/subscribe — Sprint 91

   Persiste un PushSubscription para que el server pueda enviar
   web-pushes a este device. Idempotent: upsert por endpoint
   (cada device tiene endpoint único).

   Body shape (matches PushSubscription.toJSON()):
   {
     endpoint: "https://fcm.googleapis.com/fcm/send/...",
     keys: { p256dh: "...", auth: "..." }
   }

   Response: { ok: true } | { error: "..." }

   Auth: NextAuth session + CSRF.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { requireCsrf } from "@/server/csrf";
import { check } from "@/server/ratelimit";
import { auditLog } from "@/server/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // Rate-limit suave: 30 subscribes/hour per user (replays + tab opens)
  const rl = await check(`push:subscribe:${userId}`, { limit: 30, windowMs: 60 * 60_000 });
  if (!rl.ok) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "bad_json" }, { status: 400 });
  }

  const endpoint = String(body?.endpoint || "");
  const p256dh = String(body?.keys?.p256dh || "");
  const auth_ = String(body?.keys?.auth || "");
  if (!endpoint || !p256dh || !auth_) {
    return Response.json({ error: "missing_fields" }, { status: 400 });
  }
  // Sanity caps — endpoints son URLs largas pero no infinitas; keys son ~88 chars Base64URL
  if (endpoint.length > 1024 || p256dh.length > 256 || auth_.length > 256) {
    return Response.json({ error: "field_too_long" }, { status: 400 });
  }
  // Solo http(s) endpoints de push services conocidos. Fail-closed
  // para prevenir SSRF si alguien manda endpoint custom.
  if (!/^https:\/\//.test(endpoint)) {
    return Response.json({ error: "invalid_endpoint" }, { status: 400 });
  }

  const userAgent = String(request.headers.get("user-agent") || "").slice(0, 256) || null;

  try {
    const orm = await db();
    // Upsert por endpoint (único). Si endpoint ya existe pero pertenece
    // a otro userId (cambió de cuenta en mismo browser), reasignamos.
    await orm.pushSubscription.upsert({
      where: { endpoint },
      create: { userId, endpoint, p256dh, authKey: auth_, userAgent },
      update: { userId, p256dh, authKey: auth_, userAgent, lastUsedAt: new Date() },
    });
    await auditLog({
      actorId: userId,
      action: "push.subscribe",
      payload: { endpointPrefix: endpoint.slice(0, 64), userAgent },
    }).catch(() => {});
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "db_error" }, { status: 500 });
  }
}
