import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { createCheckoutSession } from "@/server/billing";
import { auditLog } from "@/server/audit";
import { requireCsrf } from "@/server/csrf";
import { requireMembership } from "@/server/rbac";

export const dynamic = "force-dynamic";

// PRO añadido: B2C personal (1 seat, personal-org). STARTER+ son B2B
// con seats. ENTERPRISE sigue sales-led pero el endpoint lo acepta
// como fallback si el sales team prefiere flow self-service.
const VALID_PLANS = ["PRO", "STARTER", "GROWTH", "ENTERPRISE"];

export async function POST(request) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user) return new Response("unauthorized", { status: 401 });

  const form = await request.formData().catch(() => null);
  const bodyOrgId = String(form?.get("orgId") || "");
  const plan = String(form?.get("plan") || "").toUpperCase();
  if (!VALID_PLANS.includes(plan)) return new Response("plan inválido", { status: 400 });

  // PRO: usa la personal-org del usuario por default (auto-creada al
  // signin). STARTER+ requiere orgId explícito (B2B context).
  let orgId = bodyOrgId;
  if (!orgId) {
    if (plan === "PRO") {
      // Personal-org del usuario — slug determinístico
      const orm = await db();
      const personalOrg = await orm.org.findUnique({
        where: { slug: `personal-${session.user.id}` },
        select: { id: true },
      });
      orgId = personalOrg?.id;
    } else {
      orgId = session.memberships?.[0]?.orgId;
    }
  }
  if (!orgId) return new Response("forbidden", { status: 403 });

  try {
    await requireMembership(session, orgId, "billing.update");
  } catch (e) {
    return new Response(e.message, { status: e.status || 403 });
  }

  const orm = await db();
  const org = await orm.org.findUnique({ where: { id: orgId } });
  if (!org) return new Response("org no encontrada", { status: 404 });

  // PRO: 1 seat fijo (personal). STARTER+: count de members del org.
  const seats = plan === "PRO" ? 1 : Math.max(1, await orm.membership.count({ where: { orgId: org.id } }));

  // success/cancel URLs varían por contexto: PRO redirige al account
  // del user; STARTER+ al admin/billing del org.
  const origin = new URL(request.url).origin;
  const successUrl = plan === "PRO"
    ? `${origin}/account?upgraded=${plan}`
    : `${origin}/admin/billing?upgraded=${plan}`;
  const cancelUrl = plan === "PRO"
    ? `${origin}/account?cancelled=1`
    : `${origin}/admin/billing?cancelled=1`;

  try {
    const s = await createCheckoutSession({ org, plan, seats, successUrl, cancelUrl });
    await auditLog({
      orgId, actorId: session.user.id,
      action: "billing.checkout.start", payload: { plan, seats },
    }).catch(() => {});
    return Response.redirect(s.url, 303);
  } catch (e) {
    return new Response(`No se pudo iniciar el checkout: ${e.message || "error"}`, { status: 502 });
  }
}
