/* POST /api/v1/me/notifications/read-all — mark todas as read del user.
   Returns count. */

import { auth } from "@/server/auth";
import { requireCsrf } from "@/server/csrf";
import { markAllRead } from "@/server/notifications";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;
  const session = await auth();
  if (!session?.user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const r = await markAllRead(session.user.id);
  return Response.json({ ok: true, count: r.count });
}
