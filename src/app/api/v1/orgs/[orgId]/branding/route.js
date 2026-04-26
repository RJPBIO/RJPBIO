/* GET / PUT /api/v1/orgs/[orgId]/branding
   Auth: GET → cualquier member del org. PUT → OWNER (branding afecta
   identidad visual del org; single source of truth = OWNER).
   Plan-gating: validateBranding rechaza con plan_required si plan no
   permite (FREE/PRO/STARTER read-only; ENTERPRISE para customDomain).
*/

import { auth } from "../../../../../../server/auth";
import { db } from "../../../../../../server/db";
import { auditLog } from "../../../../../../server/audit";
import { requireCsrf } from "../../../../../../server/csrf";
import {
  validateBranding,
  mergeBrandingDefaults,
  BRANDING_FIELDS,
} from "../../../../../../lib/branding";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { orgId } = await params;
  const m = session.memberships?.find((mm) => mm.orgId === orgId);
  if (!m) return Response.json({ error: "forbidden" }, { status: 403 });

  const orm = await db();
  const org = await orm.org.findUnique({
    where: { id: orgId },
    select: { branding: true, plan: true },
  });
  if (!org) return Response.json({ error: "not_found" }, { status: 404 });

  return Response.json({
    branding: mergeBrandingDefaults(org.branding),
    plan: org.plan,
  });
}

export async function PUT(request, { params }) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { orgId } = await params;
  const m = session.memberships?.find((mm) => mm.orgId === orgId);
  // OWNER-only para escritura — branding es identidad visual del org.
  if (!m || m.role !== "OWNER") return Response.json({ error: "forbidden" }, { status: 403 });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "bad_json" }, { status: 400 }); }

  const orm = await db();
  const org = await orm.org.findUnique({
    where: { id: orgId },
    select: { branding: true, plan: true },
  });
  if (!org) return Response.json({ error: "not_found" }, { status: 404 });

  const v = validateBranding(body, { plan: org.plan });
  if (!v.ok) {
    return Response.json({ error: "invalid_branding", details: v.errors }, { status: 422 });
  }

  // Solo guardamos los campos validados — preserva campos existentes
  // que el cliente no envió en este request (PATCH-style behavior).
  const before = org.branding || {};
  const next = { ...before };
  for (const f of BRANDING_FIELDS) {
    if (v.value[f] !== undefined) next[f] = v.value[f];
  }
  // Si todos los campos quedan vacíos/default, limpia el Json.
  const cleaned = Object.fromEntries(
    Object.entries(next).filter(([, val]) => val !== "" && val !== null)
  );

  await orm.org.update({
    where: { id: orgId },
    data: { branding: Object.keys(cleaned).length ? cleaned : null },
  });

  await auditLog({
    orgId,
    actorId: session.user.id,
    action: "org.branding.updated",
    payload: { before, after: cleaned },
  }).catch(() => {});

  return Response.json({
    ok: true,
    branding: mergeBrandingDefaults(cleaned),
  });
}
