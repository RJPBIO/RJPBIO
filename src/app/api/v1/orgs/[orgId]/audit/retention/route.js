/* GET / PUT /api/v1/orgs/[orgId]/audit/retention
   Auth: OWNER (lectura permitida también a ADMIN; escritura solo OWNER —
   retention afecta compliance y debe estar en una sola cabeza).
   PUT body: { days: number } */

import { auth } from "../../../../../../../server/auth";
import { db } from "../../../../../../../server/db";
import { requireCsrf } from "../../../../../../../server/csrf";
import { auditLog } from "../../../../../../../server/audit";
import { validateRetentionDays, AUDIT_RETENTION_DEFAULT } from "../../../../../../../lib/audit-retention";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { orgId } = await params;
  const m = session.memberships?.find((mm) => mm.orgId === orgId);
  if (!m || !["OWNER", "ADMIN"].includes(m.role)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const orm = await db();
  const org = await orm.org.findUnique({
    where: { id: orgId },
    select: { auditRetentionDays: true },
  });
  if (!org) return Response.json({ error: "not_found" }, { status: 404 });

  return Response.json({
    days: org.auditRetentionDays ?? AUDIT_RETENTION_DEFAULT,
  });
}

export async function PUT(request, { params }) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { orgId } = await params;
  const m = session.memberships?.find((mm) => mm.orgId === orgId);
  if (!m || m.role !== "OWNER") {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "bad_json" }, { status: 400 }); }

  const v = validateRetentionDays(body?.days);
  if (!v.ok) {
    return Response.json({ error: "invalid_days", reason: v.error }, { status: 422 });
  }

  const orm = await db();
  const before = await orm.org.findUnique({
    where: { id: orgId },
    select: { auditRetentionDays: true },
  });
  if (!before) return Response.json({ error: "not_found" }, { status: 404 });

  await orm.org.update({
    where: { id: orgId },
    data: { auditRetentionDays: v.value },
  });

  await auditLog({
    orgId,
    actorId: session.user.id,
    action: "org.audit.retention.updated",
    payload: { before: before.auditRetentionDays, after: v.value },
  }).catch(() => {});

  return Response.json({ ok: true, days: v.value });
}
