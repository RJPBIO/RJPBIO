/* GET /api/v1/maintenance — público (active + recent)
   POST /api/v1/maintenance — PLATFORM_ADMIN, programa nueva ventana
*/

import { auth } from "@/server/auth";
import { requireCsrf } from "@/server/csrf";
import {
  createMaintenanceWindow, listStatusMaintenances, isPlatformAdmin,
} from "@/server/maintenance";
import { validateMaintenance } from "@/lib/maintenance";

export const dynamic = "force-dynamic";

function serialize(w) {
  return {
    id: w.id, title: w.title, body: w.body,
    status: w.status, components: w.components,
    scheduledStart: w.scheduledStart instanceof Date ? w.scheduledStart.toISOString() : w.scheduledStart,
    scheduledEnd: w.scheduledEnd instanceof Date ? w.scheduledEnd.toISOString() : w.scheduledEnd,
    actualStart: w.actualStart ? (w.actualStart instanceof Date ? w.actualStart.toISOString() : w.actualStart) : null,
    actualEnd: w.actualEnd ? (w.actualEnd instanceof Date ? w.actualEnd.toISOString() : w.actualEnd) : null,
  };
}

export async function GET() {
  const rows = await listStatusMaintenances();
  return Response.json({ windows: rows.map(serialize) });
}

export async function POST(request) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;
  const session = await auth();
  if (!session?.user) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!isPlatformAdmin(session.user.email)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "bad_json" }, { status: 400 }); }

  const v = validateMaintenance(body);
  if (!v.ok) {
    return Response.json({ error: "invalid_window", details: v.errors }, { status: 422 });
  }

  const r = await createMaintenanceWindow({
    title: v.value.title,
    body: v.value.body,
    scheduledStart: v.value.scheduledStart,
    scheduledEnd: v.value.scheduledEnd,
    components: v.value.components,
    creatorEmail: session.user.email,
  });
  if (!r.ok) return Response.json({ error: r.error }, { status: 500 });
  return Response.json({ ok: true, window: serialize(r.window) }, { status: 201 });
}
