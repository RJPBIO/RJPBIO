/* GET / PUT para org security policies (Sprint 7).
   Auth: OWNER del org (security-critical, igual que SSO).
   PUT body: { requireMfa?, sessionMaxAgeMinutes?, ipAllowlist?, ipAllowlistEnabled? }
   - Validación delegada a lib/org-security.validatePolicy (puro, testeado).
   - Audit log con diff antes/después para rastreabilidad SOC2/ISO. */

import { auth } from "../../../../../../server/auth";
import { db } from "../../../../../../server/db";
import { auditLog } from "../../../../../../server/audit";
import { requireCsrf } from "../../../../../../server/csrf";
import { validatePolicy } from "../../../../../../lib/org-security";

export const dynamic = "force-dynamic";

async function authorizedOwner(orgId, session) {
  if (!session?.user) return { ok: false, status: 401, error: "unauthorized" };
  const m = session.memberships?.find((mm) => mm.orgId === orgId);
  // Solo OWNER toca policies — security-critical surface (igual que SSO).
  if (!m || m.role !== "OWNER") return { ok: false, status: 403, error: "forbidden" };
  return { ok: true };
}

function serialize(org) {
  return {
    requireMfa: !!org.requireMfa,
    sessionMaxAgeMinutes: org.sessionMaxAgeMinutes ?? null,
    ipAllowlist: Array.isArray(org.ipAllowlist) ? org.ipAllowlist : [],
    ipAllowlistEnabled: !!org.ipAllowlistEnabled,
  };
}

export async function GET(request, { params }) {
  const session = await auth();
  const { orgId } = await params;
  const authz = await authorizedOwner(orgId, session);
  if (!authz.ok) return Response.json({ error: authz.error }, { status: authz.status });

  const orm = await db();
  const org = await orm.org.findUnique({
    where: { id: orgId },
    select: {
      requireMfa: true,
      sessionMaxAgeMinutes: true,
      ipAllowlist: true,
      ipAllowlistEnabled: true,
    },
  });
  if (!org) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json(serialize(org));
}

export async function PUT(request, { params }) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const session = await auth();
  const { orgId } = await params;
  const authz = await authorizedOwner(orgId, session);
  if (!authz.ok) return Response.json({ error: authz.error }, { status: authz.status });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "bad_json" }, { status: 400 }); }

  const validation = validatePolicy(body);
  if (!validation.ok) {
    return Response.json({ error: "invalid_policy", details: validation.errors }, { status: 422 });
  }

  const orm = await db();
  const before = await orm.org.findUnique({
    where: { id: orgId },
    select: {
      requireMfa: true,
      sessionMaxAgeMinutes: true,
      ipAllowlist: true,
      ipAllowlistEnabled: true,
    },
  });
  if (!before) return Response.json({ error: "not_found" }, { status: 404 });

  const updated = await orm.org.update({
    where: { id: orgId },
    data: validation.policy,
    select: {
      requireMfa: true,
      sessionMaxAgeMinutes: true,
      ipAllowlist: true,
      ipAllowlistEnabled: true,
    },
  });

  await auditLog({
    orgId,
    actorId: session.user.id,
    action: "org.security.policy.updated",
    payload: { before: serialize(before), after: serialize(updated) },
  }).catch(() => {});

  return Response.json({ ok: true, policy: serialize(updated) });
}
