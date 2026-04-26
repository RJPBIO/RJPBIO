/* POST /api/v1/maintenance/[id]/status — transition entre statuses.
   Auth: PLATFORM_ADMIN. State machine guarded en server. */

import { auth } from "@/server/auth";
import { requireCsrf } from "@/server/csrf";
import { updateMaintenanceStatus, isPlatformAdmin } from "@/server/maintenance";
import { isValidStatus } from "@/lib/maintenance";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;
  const session = await auth();
  if (!session?.user) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!isPlatformAdmin(session.user.email)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "bad_json" }, { status: 400 }); }

  if (!isValidStatus(body?.status)) {
    return Response.json({ error: "invalid_status" }, { status: 422 });
  }

  const r = await updateMaintenanceStatus({
    windowId: id, status: body.status, actorEmail: session.user.email,
  });
  if (!r.ok) {
    const code = r.error === "not_found" ? 404
      : r.error === "invalid_transition" ? 409
      : 500;
    return Response.json({ error: r.error }, { status: code });
  }
  return Response.json({ ok: true, window: r.window });
}
