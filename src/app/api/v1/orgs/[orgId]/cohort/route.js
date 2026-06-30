/* GET / PUT /api/v1/orgs/[orgId]/cohort
   Cohorte del BioSignal Index (industria / tamaño / turno).
   Auth: GET → cualquier member. PUT → OWNER | ADMIN.
   Persiste solo ids válidos de la taxonomía curada (orgCohort). */

import { auth } from "../../../../../../server/auth";
import { db } from "../../../../../../server/db";
import { auditLog } from "../../../../../../server/audit";
import { requireCsrf } from "../../../../../../server/csrf";
import { validateCohort } from "../../../../../../lib/orgCohort";

export const dynamic = "force-dynamic";

const WRITE_ROLES = new Set(["OWNER", "ADMIN"]);

export async function GET(request, { params }) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { orgId } = await params;
  const m = session.memberships?.find((mm) => mm.orgId === orgId);
  if (!m) return Response.json({ error: "forbidden" }, { status: 403 });

  const orm = await db();
  const org = await orm.org.findUnique({
    where: { id: orgId },
    select: { industry: true, companySize: true, shift: true },
  });
  if (!org) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ cohort: org });
}

export async function PUT(request, { params }) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { orgId } = await params;
  const m = session.memberships?.find((mm) => mm.orgId === orgId);
  if (!m || !WRITE_ROLES.has(m.role)) return Response.json({ error: "forbidden" }, { status: 403 });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "bad_json" }, { status: 400 }); }

  const v = validateCohort(body);
  if (!v.ok) return Response.json({ error: "invalid_cohort", details: v.errors }, { status: 422 });

  const orm = await db();
  const exists = await orm.org.findUnique({ where: { id: orgId }, select: { id: true } });
  if (!exists) return Response.json({ error: "not_found" }, { status: 404 });

  await orm.org.update({ where: { id: orgId }, data: v.value });

  await auditLog({
    orgId,
    actorId: session.user.id,
    action: "org.cohort.updated",
    payload: v.value,
  }).catch(() => {});

  const org = await orm.org.findUnique({
    where: { id: orgId },
    select: { industry: true, companySize: true, shift: true },
  });
  return Response.json({ ok: true, cohort: org });
}
