/* GET /api/v1/me/sessions — lista las sesiones activas del usuario.
   Auth: cualquier sesión válida. Devuelve sólo sus propias sesiones. */

import { auth } from "@/server/auth";
import { listUserSessions } from "@/server/sessions";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const rows = await listUserSessions(session.user.id);
  const currentJti = session.jti || null;
  const sessions = rows.map((s) => ({
    id: s.id,
    jti: s.jti,
    ip: s.ip,
    userAgent: s.userAgent,
    label: s.label,
    createdAt: s.createdAt.toISOString(),
    lastSeenAt: s.lastSeenAt.toISOString(),
    expiresAt: s.expiresAt.toISOString(),
    revokedAt: s.revokedAt ? s.revokedAt.toISOString() : null,
    current: !!currentJti && s.jti === currentJti,
  }));
  return Response.json({ sessions, currentJti });
}
