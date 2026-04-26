/* GET / POST /api/v1/me/dsar — DSAR self-service.
   - GET: lista propias requests
   - POST body: { kind, reason?, orgId? }; auto-resuelve ACCESS/PORTABILITY,
     ERASURE queda PENDING para admin approval. */

import { auth } from "@/server/auth";
import { requireCsrf } from "@/server/csrf";
import { createDsarRequest, listDsarForUser } from "@/server/dsar";
import { validateDsarRequest } from "@/lib/dsar";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const rows = await listDsarForUser(session.user.id);
  return Response.json({
    requests: rows.map((r) => ({
      ...r,
      requestedAt: r.requestedAt instanceof Date ? r.requestedAt.toISOString() : r.requestedAt,
      resolvedAt: r.resolvedAt instanceof Date ? r.resolvedAt.toISOString() : r.resolvedAt,
      expiresAt: r.expiresAt instanceof Date ? r.expiresAt.toISOString() : r.expiresAt,
    })),
  });
}

export async function POST(request) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user) return Response.json({ error: "unauthorized" }, { status: 401 });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "bad_json" }, { status: 400 }); }

  const v = validateDsarRequest(body);
  if (!v.ok) {
    return Response.json({ error: "invalid_request", details: v.errors }, { status: 422 });
  }

  // orgId opcional (puede haber requests fuera de un org B2B). Si lo
  // pasan, validamos que el user sea member.
  let orgId = null;
  if (typeof body.orgId === "string" && body.orgId) {
    const m = session.memberships?.find((mm) => mm.orgId === body.orgId);
    if (!m) return Response.json({ error: "forbidden" }, { status: 403 });
    orgId = body.orgId;
  }

  const xff = request.headers.get("x-forwarded-for") || "";
  const ip = xff.split(",")[0]?.trim() || null;
  const userAgent = request.headers.get("user-agent") || null;

  const created = await createDsarRequest({
    userId: session.user.id,
    orgId,
    kind: v.value.kind,
    reason: v.value.reason,
    ip,
    userAgent,
  });
  if (!created) {
    return Response.json({ error: "create_failed" }, { status: 500 });
  }

  return Response.json({
    ok: true,
    request: {
      id: created.id,
      kind: created.kind,
      status: created.status,
      reason: created.reason,
      artifactUrl: created.artifactUrl,
      requestedAt: created.requestedAt.toISOString(),
      resolvedAt: created.resolvedAt ? created.resolvedAt.toISOString() : null,
      expiresAt: created.expiresAt.toISOString(),
    },
  }, { status: 201 });
}
