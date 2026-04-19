import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { portalSession } from "@/server/billing";
import { auditLog } from "@/server/audit";
import { requireCsrf } from "@/server/csrf";
import { requireMembership } from "@/server/rbac";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user) return new Response("unauthorized", { status: 401 });

  const form = await request.formData().catch(() => null);
  const bodyOrgId = String(form?.get("orgId") || "");
  const orgId = bodyOrgId || session.memberships?.[0]?.orgId;
  if (!orgId) return new Response("forbidden", { status: 403 });

  try {
    await requireMembership(session, orgId, "billing.view");
  } catch (e) {
    return new Response(e.message, { status: e.status || 403 });
  }

  const orm = await db();
  const org = await orm.org.findUnique({ where: { id: orgId } });
  if (!org?.stripeCustomer) {
    return new Response("Sin cliente de Stripe. Activa un plan primero.", { status: 409 });
  }

  const origin = new URL(request.url).origin;
  try {
    const s = await portalSession(org, `${origin}/admin/billing`);
    await auditLog({ orgId, actorId: session.user.id, action: "billing.portal.open" }).catch(() => {});
    return Response.redirect(s.url, 303);
  } catch (e) {
    return new Response(`No se pudo abrir el portal: ${e.message || "error"}`, { status: 502 });
  }
}
