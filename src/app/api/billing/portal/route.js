import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { portalSession } from "@/server/billing";
import { auditLog } from "@/server/audit";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const session = await auth();
  if (!session?.user) return new Response("unauthorized", { status: 401 });

  const form = await request.formData().catch(() => null);
  const bodyOrgId = form?.get("orgId");
  const admin = (session.memberships || []).find(
    (m) => ["OWNER", "ADMIN"].includes(m.role) && (!bodyOrgId || m.orgId === bodyOrgId)
  );
  if (!admin) return new Response("forbidden", { status: 403 });

  const orm = await db();
  const org = await orm.org.findUnique({ where: { id: admin.orgId } });
  if (!org?.stripeCustomer) {
    return new Response("Sin cliente de Stripe. Activa un plan primero.", { status: 409 });
  }

  const origin = new URL(request.url).origin;
  try {
    const s = await portalSession(org, `${origin}/admin/billing`);
    await auditLog({ orgId: org.id, actorId: session.user.id, action: "billing.portal.open" }).catch(() => {});
    return Response.redirect(s.url, 303);
  } catch (e) {
    return new Response(`No se pudo abrir el portal: ${e.message || "error"}`, { status: 502 });
  }
}
