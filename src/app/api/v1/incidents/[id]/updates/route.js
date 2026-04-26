/* POST /api/v1/incidents/[id]/updates — agrega update + cambia status
   (incluye resolved). Auth: PLATFORM_ADMIN. */

import { auth } from "@/server/auth";
import { requireCsrf } from "@/server/csrf";
import { addIncidentUpdate, isPlatformAdmin } from "@/server/incidents";
import { validateIncidentUpdate } from "@/lib/incidents";

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

  const v = validateIncidentUpdate(body);
  if (!v.ok) return Response.json({ error: "invalid_update", details: v.errors }, { status: 422 });

  const r = await addIncidentUpdate({
    incidentId: id,
    status: v.value.status,
    body: v.value.body,
    authorEmail: session.user.email,
  });
  if (!r.ok) {
    const status = r.error === "not_found" ? 404
      : r.error === "invalid_transition" ? 409
      : 500;
    return Response.json({ error: r.error }, { status });
  }
  return Response.json({
    ok: true,
    update: {
      id: r.update.id,
      status: r.update.status,
      body: r.update.body,
      createdAt: r.update.createdAt.toISOString(),
    },
  }, { status: 201 });
}
