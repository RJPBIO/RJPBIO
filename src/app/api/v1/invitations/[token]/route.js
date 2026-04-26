/* GET / DELETE para una invitación específica.
   Auth: OWNER|ADMIN del org dueño de la invitación.
   - DELETE: revoca (hard-delete) una invitación pending.
     Si ya fue aceptada, 410 (no se puede revocar la membership desde aquí).
   - GET (opcional): retorna detalles para admin UI sin exponer el token.
*/
import { auth } from "../../../../../server/auth";
import { db } from "../../../../../server/db";
import { auditLog } from "../../../../../server/audit";
import { requireCsrf } from "../../../../../server/csrf";

export const dynamic = "force-dynamic";

async function authorizedAdmin(orgId, session) {
  if (!session?.user) return { ok: false, status: 401, error: "unauthorized" };
  const m = session.memberships?.find((mm) => mm.orgId === orgId);
  if (!m || !["OWNER", "ADMIN"].includes(m.role)) {
    return { ok: false, status: 403, error: "forbidden" };
  }
  return { ok: true, member: m };
}

export async function DELETE(request, { params }) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;
  const session = await auth();
  const { token } = await params;
  const orm = await db();

  const inv = await orm.invitation.findUnique({ where: { token } });
  if (!inv) return Response.json({ error: "not_found" }, { status: 404 });
  if (inv.acceptedAt) {
    return Response.json({ error: "already_accepted" }, { status: 410 });
  }

  const authz = await authorizedAdmin(inv.orgId, session);
  if (!authz.ok) return Response.json({ error: authz.error }, { status: authz.status });

  await orm.invitation.delete({ where: { token } });
  await auditLog({
    orgId: inv.orgId,
    actorId: session.user.id,
    action: "invitation.revoked",
    payload: { email: inv.email, role: inv.role },
  }).catch(() => {});

  return Response.json({ revoked: true });
}
