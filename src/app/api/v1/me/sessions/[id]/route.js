/* DELETE /api/v1/me/sessions/[id] — revoca una sesión específica.
   Auth: el sessionId DEBE pertenecer al user actual (chequeo en revokeSession). */

import { auth } from "@/server/auth";
import { requireCsrf } from "@/server/csrf";
import { auditLog } from "@/server/audit";
import { revokeSession } from "@/server/sessions";

export const dynamic = "force-dynamic";

export async function DELETE(request, { params }) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const ok = await revokeSession({ sessionId: id, userId: session.user.id });
  if (!ok) return Response.json({ error: "not_found_or_forbidden" }, { status: 404 });

  await auditLog({
    actorId: session.user.id,
    action: "session.revoked",
    payload: { sessionId: id, by: "self" },
  }).catch(() => {});

  return Response.json({ ok: true });
}
