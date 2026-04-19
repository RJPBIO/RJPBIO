/* Support ticket intake.
   POST { email?, subject, body, priority?, tags? }
   - Works authenticated (user/org inferred) or anonymous.
   - Rate-limited by IP to prevent spam.
   - Persists to SupportTicket, notifies org admins if scoped, and
     emails a receipt if Postmark is configured. */

import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";
import { notifyOrgAdmins } from "@/server/notifications";
import { check as rateCheck } from "@/server/ratelimit";
import { headers } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SUBJECT = 200;
const MAX_BODY = 10_000;
const PRIORITIES = new Set(["LOW", "NORMAL", "HIGH", "URGENT"]);

export async function POST(request) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ua = h.get("user-agent") || null;

  const lim = await rateCheck(`support:${ip}`, { limit: 10, windowMs: 10 * 60_000 }).catch(() => ({ ok: true }));
  if (!lim.ok) return new Response("rate limited", { status: 429 });

  let body;
  try { body = await request.json(); } catch { return new Response("bad json", { status: 400 }); }

  const subject = String(body?.subject || "").trim().slice(0, MAX_SUBJECT);
  const message = String(body?.body || "").trim().slice(0, MAX_BODY);
  if (!subject || !message) return new Response("subject and body required", { status: 400 });

  const priority = PRIORITIES.has(body?.priority) ? body.priority : "NORMAL";
  const tags = Array.isArray(body?.tags) ? body.tags.slice(0, 8).map((t) => String(t).slice(0, 32)) : [];

  const session = await auth();
  const orm = await db();

  let email = String(body?.email || "").toLowerCase().trim();
  let userId = null;
  let orgId = null;

  if (session?.user) {
    userId = session.user.id;
    email = email || session.user.email || "";
    const m = await orm.membership.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    orgId = m?.orgId || null;
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response("valid email required", { status: 400 });
  }

  const ticket = await orm.supportTicket.create({
    data: {
      orgId, userId, email,
      subject, body: message,
      priority, tags, ip, ua,
    },
  });

  await auditLog({
    orgId: orgId || undefined,
    actorId: userId || undefined,
    actorEmail: email,
    action: "support.ticket.created",
    target: ticket.id,
    payload: { priority, tagsCount: tags.length },
  }).catch(() => {});

  if (orgId) {
    await notifyOrgAdmins(orgId, {
      title: `Ticket: ${subject}`,
      body: message.slice(0, 160),
      level: priority === "URGENT" || priority === "HIGH" ? "error" : "info",
      href: `/admin/support?ticket=${ticket.id}`,
      kind: `support.${priority.toLowerCase()}`,
    }).catch(() => {});
  }

  return Response.json({ id: ticket.id, status: ticket.status }, { status: 201 });
}
