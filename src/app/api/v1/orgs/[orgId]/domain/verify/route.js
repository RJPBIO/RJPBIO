/* GET /api/v1/orgs/[orgId]/domain/verify
   POST   ?action=start     → genera token nuevo + persiste
   POST   ?action=check     → resuelve DNS y compara
   DELETE                   → limpia token + status
   Auth: OWNER (custom domain afecta white-label, single source of truth).
*/

import { auth } from "../../../../../../../server/auth";
import { db } from "../../../../../../../server/db";
import { requireCsrf } from "../../../../../../../server/csrf";
import {
  startDomainVerification,
  checkDomainVerification,
  clearDomainVerification,
} from "../../../../../../../server/domain-verify";
import {
  getVerifyInstructions,
  summarizeVerificationState,
  verifyHostname,
} from "../../../../../../../lib/domain-verify";
import { mergeBrandingDefaults } from "../../../../../../../lib/branding";

export const runtime = "nodejs"; // dns.resolveTxt necesita nodejs runtime
export const dynamic = "force-dynamic";

async function authorizedOwner(orgId, session) {
  if (!session?.user) return { ok: false, status: 401, error: "unauthorized" };
  const m = session.memberships?.find((mm) => mm.orgId === orgId);
  if (!m || m.role !== "OWNER") return { ok: false, status: 403, error: "forbidden" };
  return { ok: true, role: m.role };
}

/**
 * GET — devuelve estado actual + instrucciones si hay token + summary.
 */
export async function GET(request, { params }) {
  const session = await auth();
  const { orgId } = await params;
  const authz = await authorizedOwner(orgId, session);
  if (!authz.ok) return Response.json({ error: authz.error }, { status: authz.status });

  const orm = await db();
  const org = await orm.org.findUnique({
    where: { id: orgId },
    select: {
      branding: true,
      customDomainVerified: true,
      customDomainVerifyToken: true,
      customDomainVerifiedAt: true,
      customDomainLastCheckedAt: true,
    },
  });
  if (!org) return Response.json({ error: "not_found" }, { status: 404 });

  const branding = mergeBrandingDefaults(org.branding);
  const domain = branding.customDomain || null;

  const summary = summarizeVerificationState({
    verified: org.customDomainVerified,
    token: org.customDomainVerifyToken,
    verifiedAt: org.customDomainVerifiedAt ? org.customDomainVerifiedAt.toISOString() : null,
    lastCheckedAt: org.customDomainLastCheckedAt ? org.customDomainLastCheckedAt.toISOString() : null,
  });

  const instructions = (domain && org.customDomainVerifyToken)
    ? getVerifyInstructions(domain, org.customDomainVerifyToken)
    : null;

  return Response.json({
    domain,
    hostname: domain ? verifyHostname(domain) : null,
    verified: org.customDomainVerified,
    verifiedAt: org.customDomainVerifiedAt ? org.customDomainVerifiedAt.toISOString() : null,
    lastCheckedAt: org.customDomainLastCheckedAt ? org.customDomainLastCheckedAt.toISOString() : null,
    token: org.customDomainVerifyToken,
    summary,
    instructions,
  });
}

export async function POST(request, { params }) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const session = await auth();
  const { orgId } = await params;
  const authz = await authorizedOwner(orgId, session);
  if (!authz.ok) return Response.json({ error: authz.error }, { status: authz.status });

  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  if (!["start", "check"].includes(action)) {
    return Response.json({ error: "unknown_action" }, { status: 400 });
  }

  const orm = await db();
  const org = await orm.org.findUnique({
    where: { id: orgId },
    select: { branding: true, plan: true },
  });
  if (!org) return Response.json({ error: "not_found" }, { status: 404 });
  if (org.plan !== "ENTERPRISE") {
    return Response.json({ error: "plan_required", required: "ENTERPRISE" }, { status: 403 });
  }
  const branding = mergeBrandingDefaults(org.branding);
  if (!branding.customDomain) {
    return Response.json({ error: "no_custom_domain", message: "Configura customDomain en branding primero" }, { status: 400 });
  }

  if (action === "start") {
    const r = await startDomainVerification({
      orgId,
      actorUserId: session.user.id,
      domain: branding.customDomain,
    });
    if (!r.ok) return Response.json({ error: r.error }, { status: 500 });
    const instructions = getVerifyInstructions(branding.customDomain, r.token);
    return Response.json({ ok: true, token: r.token, hostname: r.hostname, instructions });
  }

  // action === "check"
  const r = await checkDomainVerification({
    orgId,
    actorUserId: session.user.id,
    domain: branding.customDomain,
  });
  if (!r.ok) {
    const status = r.error === "no_token" ? 400 : 500;
    return Response.json({ error: r.error, message: r.message }, { status });
  }
  return Response.json({
    ok: true,
    verified: r.verified,
    records: r.records,
    resolveError: r.resolveError,
  });
}

export async function DELETE(request, { params }) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const session = await auth();
  const { orgId } = await params;
  const authz = await authorizedOwner(orgId, session);
  if (!authz.ok) return Response.json({ error: authz.error }, { status: authz.status });

  const r = await clearDomainVerification({
    orgId,
    actorUserId: session.user.id,
  });
  if (!r.ok) return Response.json({ error: r.error }, { status: 500 });
  return Response.json({ ok: true });
}
