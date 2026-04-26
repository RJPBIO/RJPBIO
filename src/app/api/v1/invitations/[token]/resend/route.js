/* POST — re-envía el email de la invitación.
   Casos: el destinatario perdió/spamfilter el email original.
   Extiende expiry +7d para que el resend tenga ventana fresca.
   Rate limit: 5 resends por invitación cada 24h (anti-spam admin).
   Auth: OWNER|ADMIN del org dueño. */
import { auth } from "../../../../../../server/auth";
import { db } from "../../../../../../server/db";
import { auditLog } from "../../../../../../server/audit";
import { requireCsrf } from "../../../../../../server/csrf";
import { check } from "../../../../../../server/ratelimit";
import { sendInvite } from "../../../../../../server/email";
import { defaultExpiry } from "../../../../../../lib/invitation";

export const dynamic = "force-dynamic";

const RATE = { limit: 5, windowMs: 24 * 60 * 60_000 };

export async function POST(request, { params }) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { token } = await params;

  const orm = await db();
  const inv = await orm.invitation.findUnique({ where: { token } });
  if (!inv) return Response.json({ error: "not_found" }, { status: 404 });
  if (inv.acceptedAt) {
    return Response.json({ error: "already_accepted" }, { status: 410 });
  }

  const member = session.memberships?.find((m) => m.orgId === inv.orgId);
  if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const rl = await check(`invite-resend:${token}`, RATE);
  if (!rl.ok) {
    return Response.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)) } }
    );
  }

  // Extender expiry +7d desde ahora — un resend implica que la
  // ventana original puede haber pasado o estar por pasar.
  const newExpiry = defaultExpiry();
  await orm.invitation.update({
    where: { token },
    data: { expiresAt: newExpiry },
  });

  const org = await orm.org.findUnique({ where: { id: inv.orgId }, select: { name: true } });
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  try {
    await sendInvite({
      to: inv.email,
      orgName: org?.name || "tu equipo",
      acceptUrl: `${baseUrl}/accept-invite/${token}`,
      inviterName: session.user.name || session.user.email,
    });
  } catch (e) {
    console.error("[invite/resend] email failed", inv.email, e?.message);
    return Response.json({ error: "email_failed" }, { status: 502 });
  }

  await auditLog({
    orgId: inv.orgId,
    actorId: session.user.id,
    action: "invitation.resent",
    payload: { email: inv.email, expiresAt: newExpiry.toISOString() },
  }).catch(() => {});

  return Response.json({
    resent: true,
    expiresAt: newExpiry.toISOString(),
  });
}
