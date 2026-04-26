/* POST /api/v1/orgs/[orgId]/audit/verify
   Corre verifyChain sobre TODOS los logs del org (puede ser costoso para
   orgs grandes — TODO: paginate / sample en futuro polish). Devuelve
   resumen UI-friendly + audit-loga el evento de verificación.
   Auth: OWNER o ADMIN. */

import { auth } from "../../../../../../../server/auth";
import { requireCsrf } from "../../../../../../../server/csrf";
import { auditLog, verifyChain } from "../../../../../../../server/audit";
import { summarizeVerification } from "../../../../../../../lib/audit-retention";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { orgId } = await params;
  const m = session.memberships?.find((mm) => mm.orgId === orgId);
  if (!m || !["OWNER", "ADMIN"].includes(m.role)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const result = await verifyChain(orgId);
  const summary = summarizeVerification(result);

  await auditLog({
    orgId,
    actorId: session.user.id,
    action: "org.audit.verified",
    payload: {
      status: summary.status,
      verified: summary.verified,
      brokenAt: summary.brokenAt || null,
      reason: summary.reason || null,
    },
  }).catch(() => {});

  return Response.json({ ...summary, raw: result });
}
