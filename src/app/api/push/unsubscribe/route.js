/* ═══════════════════════════════════════════════════════════════
   POST /api/push/unsubscribe — Sprint 91

   Borra un PushSubscription. User toggleea push off en Settings →
   client unsubscribes localmente Y posts aquí para que server tampoco
   intente dispatchar.

   Body: { endpoint: "..." }
   Auth: NextAuth session + CSRF.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { requireCsrf } from "@/server/csrf";
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

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "bad_json" }, { status: 400 });
  }

  const endpoint = String(body?.endpoint || "");
  if (!endpoint) return Response.json({ error: "missing_endpoint" }, { status: 400 });

  try {
    const orm = await db();
    // Solo borra si pertenece al user — defensa contra unsubscribe
    // de otros users con endpoint conocido.
    const result = await orm.pushSubscription.deleteMany({
      where: { endpoint, userId },
    });
    await auditLog({
      actorId: userId,
      action: "push.unsubscribe",
      payload: { endpointPrefix: endpoint.slice(0, 64), removed: result.count },
    }).catch(() => {});
    return Response.json({ ok: true, removed: result.count });
  } catch {
    return Response.json({ error: "db_error" }, { status: 500 });
  }
}
