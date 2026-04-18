import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { createCheckoutSession } from "@/server/billing";
import { auditLog } from "@/server/audit";

export const dynamic = "force-dynamic";

const VALID_PLANS = ["STARTER", "GROWTH", "ENTERPRISE"];

export async function POST(request) {
  const session = await auth();
  if (!session?.user) return new Response("unauthorized", { status: 401 });

  const form = await request.formData().catch(() => null);
  const bodyOrgId = form?.get("orgId");
  const plan = String(form?.get("plan") || "").toUpperCase();
  if (!VALID_PLANS.includes(plan)) return new Response("plan inválido", { status: 400 });

  const admin = (session.memberships || []).find(
    (m) => ["OWNER", "ADMIN"].includes(m.role) && (!bodyOrgId || m.orgId === bodyOrgId)
  );
  if (!admin) return new Response("forbidden", { status: 403 });

  const orm = await db();
  const org = await orm.org.findUnique({ where: { id: admin.orgId } });
  if (!org) return new Response("org no encontrada", { status: 404 });

  const seats = Math.max(1, await orm.membership.count({ where: { orgId: org.id } }));
  const origin = new URL(request.url).origin;
  try {
    const s = await createCheckoutSession({
      org,
      plan,
      seats,
      successUrl: `${origin}/admin/billing?upgraded=${plan}`,
      cancelUrl: `${origin}/admin/billing?cancelled=1`,
    });
    await auditLog({
      orgId: org.id,
      actorId: session.user.id,
      action: "billing.checkout.start",
      payload: { plan, seats },
    }).catch(() => {});
    return Response.redirect(s.url, 303);
  } catch (e) {
    return new Response(`No se pudo iniciar el checkout: ${e.message || "error"}`, { status: 502 });
  }
}
