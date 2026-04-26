/* Bulk invitations — crea N tokens de invitación, sin spam-mail.
   Auth: sesión con rol OWNER|ADMIN en el org indicado. */
import crypto from "node:crypto";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { sendInvite } from "@/server/email";
import {
  isValidRole, filterInviteCandidates, defaultExpiry,
  MAX_INVITE_BATCH,
} from "@/lib/invitation";

export async function POST(request) {
  const session = await auth();
  if (!session?.user) return new Response("unauthorized", { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body) return new Response("bad request", { status: 400 });

  const { orgId, emails, role = "MEMBER" } = body;
  if (!orgId || !Array.isArray(emails)) return new Response("bad request", { status: 400 });
  const member = session.memberships?.find((m) => m.orgId === orgId);
  if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
    return new Response("forbidden", { status: 403 });
  }
  if (!isValidRole(role)) return new Response("invalid role", { status: 400 });
  if (emails.length > MAX_INVITE_BATCH) return new Response("too many", { status: 413 });

  const orm = await db();
  // Recolectar pending invites + emails de members existentes
  // antes de filtrar candidatos. Ambos sets se usan para skip.
  const lowerEmails = emails.map((e) => String(e || "").trim().toLowerCase()).filter(Boolean);
  const [pendingInvites, memberRows, org] = await Promise.all([
    orm.invitation.findMany({
      where: { orgId, email: { in: lowerEmails }, acceptedAt: null },
    }),
    orm.membership.findMany({ where: { orgId } }),
    orm.org.findUnique({ where: { id: orgId } }),
  ]);
  const memberUserIds = memberRows.map((m) => m.userId);
  const existingUsers = memberUserIds.length
    ? await orm.user.findMany({ where: { id: { in: memberUserIds } } })
    : [];

  const { eligible, skipped } = filterInviteCandidates(emails, {
    pendingEmails: pendingInvites.map((i) => i.email),
    memberEmails: existingUsers.map((u) => u.email || ""),
  });

  if (!eligible.length) {
    return Response.json({ invited: 0, skipped, rejected: 0 });
  }

  const orgName = org?.name || "tu equipo";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const inviterName = session.user.name || session.user.email;
  const expiresAt = defaultExpiry();

  let invited = 0;
  for (const email of eligible) {
    try {
      const token = crypto.randomBytes(32).toString("base64url");
      await orm.invitation.create({ data: { orgId, email, role, token, expiresAt } });
      try {
        await sendInvite({
          to: email,
          orgName,
          acceptUrl: `${baseUrl}/accept-invite/${token}`,
          inviterName,
        });
      } catch (mailErr) {
        console.error("[invite/bulk] email failed for", email, mailErr?.message);
      }
      invited += 1;
    } catch { /* ignore individual failures */ }
  }
  return Response.json({
    invited,
    skipped,
    failed: eligible.length - invited,
  });
}
