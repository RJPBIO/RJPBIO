/* Bulk invitations — crea N tokens de invitación, sin spam-mail.
   Auth: sesión con rol OWNER|ADMIN en el org indicado. */
import crypto from "node:crypto";
import { db } from "@/server/db";
import { auth } from "@/server/auth";

const EXP_DAYS = 7;
const MAX_BATCH = 200;

function isValidEmail(e) {
  return typeof e === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

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
  if (!["OWNER", "ADMIN", "MANAGER", "MEMBER", "VIEWER"].includes(role)) {
    return new Response("invalid role", { status: 400 });
  }
  if (emails.length > MAX_BATCH) return new Response("too many", { status: 413 });

  const uniq = Array.from(new Set(emails.map((e) => String(e || "").trim().toLowerCase()).filter(isValidEmail)));
  if (!uniq.length) return Response.json({ invited: 0, skipped: emails.length });

  const orm = await db();
  const existing = await orm.invitation.findMany({
    where: { orgId, email: { in: uniq }, acceptedAt: null },
  });
  const pending = new Set(existing.map((i) => i.email));
  const memberRows = await orm.membership.findMany({ where: { orgId } });
  const memberUserIds = memberRows.map((m) => m.userId);
  const existingUsers = memberUserIds.length
    ? await orm.user.findMany({ where: { id: { in: memberUserIds } } })
    : [];
  const alreadyMembers = new Set(existingUsers.map((u) => (u.email || "").toLowerCase()));

  const expiresAt = new Date(Date.now() + EXP_DAYS * 86400000);
  let invited = 0;
  for (const email of uniq) {
    if (pending.has(email) || alreadyMembers.has(email)) continue;
    try {
      await orm.invitation.create({
        data: {
          orgId, email, role,
          token: crypto.randomBytes(32).toString("base64url"),
          expiresAt,
        },
      });
      invited += 1;
    } catch { /* ignore individual failures */ }
  }
  return Response.json({
    invited,
    skipped: uniq.length - invited,
    rejected: emails.length - uniq.length,
  });
}
