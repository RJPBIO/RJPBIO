/* GET /api/v1/incidents — public list (active + recently-resolved)
   POST /api/v1/incidents — create (PLATFORM_ADMIN only)
*/

import { auth } from "@/server/auth";
import { requireCsrf } from "@/server/csrf";
import {
  createIncident, listStatusIncidents, isPlatformAdmin,
} from "@/server/incidents";
import { validateIncident } from "@/lib/incidents";

export const dynamic = "force-dynamic";

function serialize(i) {
  return {
    id: i.id, title: i.title, body: i.body,
    status: i.status, severity: i.severity, components: i.components,
    startedAt: i.startedAt instanceof Date ? i.startedAt.toISOString() : i.startedAt,
    resolvedAt: i.resolvedAt ? (i.resolvedAt instanceof Date ? i.resolvedAt.toISOString() : i.resolvedAt) : null,
    updates: (i.updates || []).map((u) => ({
      id: u.id, status: u.status, body: u.body,
      createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
    })),
  };
}

export async function GET() {
  const incidents = await listStatusIncidents();
  return Response.json({ incidents: incidents.map(serialize) });
}

export async function POST(request) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;
  const session = await auth();
  if (!session?.user) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!isPlatformAdmin(session.user.email)) {
    return Response.json({ error: "forbidden", message: "PLATFORM_ADMIN_EMAILS only" }, { status: 403 });
  }

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "bad_json" }, { status: 400 }); }

  const v = validateIncident(body);
  if (!v.ok) return Response.json({ error: "invalid_incident", details: v.errors }, { status: 422 });

  const r = await createIncident({
    title: v.value.title,
    body: v.value.body,
    severity: v.value.severity,
    components: v.value.components,
    creatorEmail: session.user.email,
  });
  if (!r.ok) return Response.json({ error: r.error }, { status: 500 });
  return Response.json({ ok: true, incident: serialize(r.incident) }, { status: 201 });
}
