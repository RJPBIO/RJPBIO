/* ═══════════════════════════════════════════════════════════════
   POST /api/push/resubscribe — Sprint 91

   Llamado desde el service worker (sw.js handler de
   pushsubscriptionchange) cuando el browser rota la subscription
   (iOS/Android lo hacen periódicamente). Persiste el nuevo endpoint
   y borra el viejo si lo conocemos.

   Antes (Sprint 53): no-op (logs y returns 204) → subscriptions
   obsoletas se acumulaban, push notifications dejaban de funcionar
   silenciosamente con el tiempo.

   IMPORTANTE: este endpoint NO requiere auth porque el SW ejecuta
   en background sin context de cookies session siempre disponibles.
   En su lugar, identificamos al user por la subscription anterior
   (oldEndpoint si lo manda el SW) o por findFirst por endpoint.
   No-CSRF — endpoint público acepta solo desde same-origin SW.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  // Same-origin only — el SW del PWA es el único caller legítimo.
  // Un atacante cross-origin no puede llamar (sin CORS preflight allow).
  const origin = request.headers.get("origin") || "";
  const host = request.headers.get("host") || "";
  if (origin && !origin.endsWith(host)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "bad_json" }, { status: 400 });
  }

  const newSub = body?.newSubscription || body; // SW puede mandar la sub directa
  const oldEndpoint = body?.oldEndpoint || null;

  const endpoint = String(newSub?.endpoint || "");
  const p256dh = String(newSub?.keys?.p256dh || "");
  const authKey = String(newSub?.keys?.auth || "");
  if (!endpoint || !p256dh || !authKey) {
    return Response.json({ error: "missing_fields" }, { status: 400 });
  }
  if (endpoint.length > 1024 || !/^https:\/\//.test(endpoint)) {
    return Response.json({ error: "invalid_endpoint" }, { status: 400 });
  }

  try {
    const orm = await db();
    // Resolver userId: del oldEndpoint si lo enviaron, si no del endpoint
    // nuevo (porque el SW ya pudo haber persistido el nuevo si subscribe
    // ocurrió antes). Si no encontramos userId, descartamos — no podemos
    // crear PushSubscription anónima (FK a User).
    let resolvedUserId = null;
    if (oldEndpoint) {
      const old = await orm.pushSubscription.findUnique({
        where: { endpoint: oldEndpoint },
        select: { userId: true },
      });
      resolvedUserId = old?.userId || null;
      // Borrar el endpoint viejo
      if (old) {
        await orm.pushSubscription.delete({ where: { endpoint: oldEndpoint } }).catch(() => {});
      }
    }
    if (!resolvedUserId) {
      const existing = await orm.pushSubscription.findUnique({
        where: { endpoint },
        select: { userId: true },
      });
      resolvedUserId = existing?.userId || null;
    }
    if (!resolvedUserId) {
      // No podemos rescatar — el SW debería haber guardado oldEndpoint
      // antes de pushsubscriptionchange. Caso real probable: cold-start
      // del SW post-install donde no había subscription previa registrada.
      // Audit-log para detectar patrón en producción.
      await auditLog({
        action: "push.resubscribe.orphan",
        payload: { endpointPrefix: endpoint.slice(0, 64) },
      }).catch(() => {});
      return Response.json({ ok: false, reason: "user_unknown" }, { status: 200 });
    }

    await orm.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId: resolvedUserId,
        endpoint,
        p256dh,
        authKey,
        userAgent: String(request.headers.get("user-agent") || "").slice(0, 256) || null,
      },
      update: { p256dh, authKey, lastUsedAt: new Date() },
    });
    await auditLog({
      actorId: resolvedUserId,
      action: "push.resubscribe",
      payload: { endpointPrefix: endpoint.slice(0, 64), oldEndpointPrefix: oldEndpoint?.slice(0, 64) || null },
    }).catch(() => {});
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "db_error" }, { status: 500 });
  }
}
