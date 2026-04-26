import { auth } from "../../../../../../server/auth";
import { db } from "../../../../../../server/db";
import { auditLog } from "../../../../../../server/audit";
import { randomUUID } from "node:crypto";
import { validateInvitationForAcceptance } from "../../../../../../lib/invitation";

export const dynamic = "force-dynamic";

const baseUrl = () => process.env.AUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export async function POST(_request, { params }) {
  const { token } = await params;
  const session = await auth();
  if (!session?.user) {
    return Response.redirect(new URL(`/signin?next=/accept-invite/${token}`, baseUrl()));
  }
  // BUG FIX: db() es async, antes se usaba sin await. La cadena
  // client.invitation.findUnique era Promise.invitation = undefined,
  // y todo el flow fallaba silenciosamente — el user veía "redirect"
  // pero NO se creaba Membership. Cero invitaciones aceptables.
  const client = await db();

  const inv = await client.invitation.findUnique({ where: { token } });
  const validation = validateInvitationForAcceptance(inv);
  if (!validation.ok) {
    return new Response(validation.reason, { status: 410 });
  }

  await client.membership.upsert({
    where: { userId_orgId: { userId: session.user.id, orgId: inv.orgId } },
    update: { role: inv.role },
    create: { id: randomUUID(), userId: session.user.id, orgId: inv.orgId, role: inv.role },
  });
  await client.invitation.update({ where: { token }, data: { acceptedAt: new Date() } });
  await auditLog({
    orgId: inv.orgId,
    actorId: session.user.id,
    action: "member.joined",
    payload: { role: inv.role, via: "invitation_token" },
  }).catch(() => {});

  // Redirect a /app (PWA) — el user recién aceptó, va directo a usar.
  // Antes redirigía a "/" lo cual mostraba marketing site (confusing).
  return Response.redirect(new URL("/app", baseUrl()));
}
