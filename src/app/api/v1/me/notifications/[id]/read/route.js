/* POST /api/v1/me/notifications/[id]/read — mark single as read.
   IDOR-safe (server verifica userId match). */

import { auth } from "@/server/auth";
import { requireCsrf } from "@/server/csrf";
import { markRead } from "@/server/notifications";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;
  const session = await auth();
  if (!session?.user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const r = await markRead(id, session.user.id);
  if (!r.ok) {
    const status = r.error === "not_found" ? 404
      : r.error === "forbidden" ? 403
      : 500;
    return Response.json({ error: r.error }, { status });
  }
  return Response.json({ ok: true, idempotent: !!r.idempotent });
}
