/* GET / PUT / DELETE para SSO config del Org.
   Auth: OWNER del org (solo OWNER toca federation — security-critical).
   PUT body: { domain, provider, metadata? }
   DELETE: limpia ssoDomain/ssoProvider/ssoMetadata (vuelve a auth normal). */
import { auth } from "../../../../../../server/auth";
import { db } from "../../../../../../server/db";
import { auditLog } from "../../../../../../server/audit";
import { requireCsrf } from "../../../../../../server/csrf";
import { validateSsoConfig } from "../../../../../../lib/sso";

export const dynamic = "force-dynamic";

async function authorizedOwner(orgId, session) {
  if (!session?.user) return { ok: false, status: 401, error: "unauthorized" };
  const m = session.memberships?.find((mm) => mm.orgId === orgId);
  // SOLO OWNER puede modificar SSO — admins no, security-critical surface.
  if (!m || m.role !== "OWNER") return { ok: false, status: 403, error: "forbidden" };
  return { ok: true };
}

export async function GET(request, { params }) {
  const session = await auth();
  const { orgId } = await params;
  const authz = await authorizedOwner(orgId, session);
  if (!authz.ok) return Response.json({ error: authz.error }, { status: authz.status });

  const orm = await db();
  const org = await orm.org.findUnique({
    where: { id: orgId },
    select: { ssoDomain: true, ssoProvider: true, ssoMetadata: true },
  });
  if (!org) return Response.json({ error: "not_found" }, { status: 404 });

  return Response.json({
    domain: org.ssoDomain || null,
    provider: org.ssoProvider || null,
    metadata: org.ssoMetadata || null,
    configured: !!(org.ssoDomain && org.ssoProvider),
  });
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

  const validation = validateSsoConfig(body);
  if (!validation.ok) {
    return Response.json({ error: "invalid_config", details: validation.errors }, { status: 422 });
  }

  const orm = await db();
  // Verificar que el domain no esté tomado por OTRO org (Org.ssoDomain
  // tiene constraint @unique). Mensaje claro si así es.
  const taken = await orm.org.findUnique({
    where: { ssoDomain: validation.config.domain },
    select: { id: true },
  });
  if (taken && taken.id !== orgId) {
    return Response.json({ error: "domain_taken" }, { status: 409 });
  }

  await orm.org.update({
    where: { id: orgId },
    data: {
      ssoDomain: validation.config.domain,
      ssoProvider: validation.config.provider,
      ssoMetadata: validation.config.metadata,
    },
  });

  await auditLog({
    orgId,
    actorId: session.user.id,
    action: "org.sso.configured",
    payload: { domain: validation.config.domain, provider: validation.config.provider },
  }).catch(() => {});

  return Response.json({ ok: true, config: validation.config });
}

export async function DELETE(request, { params }) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const session = await auth();
  const { orgId } = await params;
  const authz = await authorizedOwner(orgId, session);
  if (!authz.ok) return Response.json({ error: authz.error }, { status: authz.status });

  const orm = await db();
  await orm.org.update({
    where: { id: orgId },
    data: { ssoDomain: null, ssoProvider: null, ssoMetadata: null },
  });

  await auditLog({
    orgId,
    actorId: session.user.id,
    action: "org.sso.disabled",
  }).catch(() => {});

  return Response.json({ ok: true });
}
