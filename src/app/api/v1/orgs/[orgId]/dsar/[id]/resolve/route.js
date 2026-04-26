/* POST /api/v1/orgs/[orgId]/dsar/[id]/resolve
   body: { status: "APPROVED" | "REJECTED" | "COMPLETED", notes? }
   Auth: OWNER o ADMIN. State machine en lib/dsar.canTransition. */

import { auth } from "../../../../../../../../server/auth";
import { requireCsrf } from "../../../../../../../../server/csrf";
import { resolveDsarRequest } from "../../../../../../../../server/dsar";
import { validateResolve } from "../../../../../../../../lib/dsar";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { orgId, id } = await params;
  const m = session.memberships?.find((mm) => mm.orgId === orgId);
  if (!m || !["OWNER", "ADMIN"].includes(m.role)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "bad_json" }, { status: 400 }); }

  const v = validateResolve(body);
  if (!v.ok) {
    return Response.json({ error: "invalid_resolve", details: v.errors }, { status: 422 });
  }

  const r = await resolveDsarRequest({
    requestId: id,
    orgId,
    actorUserId: session.user.id,
    actorRole: m.role,
    status: v.value.status,
    notes: v.value.notes,
  });
  if (!r.ok) {
    const status = r.error === "not_found" || r.error === "wrong_org" ? 404
      : r.error === "forbidden" ? 403
      : r.error === "invalid_transition" ? 409
      : 500;
    return Response.json({ error: r.error }, { status });
  }
  return Response.json({
    ok: true,
    request: {
      ...r.request,
      requestedAt: r.request.requestedAt.toISOString(),
      resolvedAt: r.request.resolvedAt ? r.request.resolvedAt.toISOString() : null,
      expiresAt: r.request.expiresAt.toISOString(),
    },
  });
}
