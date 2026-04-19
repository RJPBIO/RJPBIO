/* Admin impersonation — start endpoint.
   POST body: { targetUserId | targetEmail, reason, minutes? }
   Requires caller.email ∈ PLATFORM_ADMINS.
   Returns { consumeUrl } — open in private window to assume identity. */

import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";
import { requireCsrf } from "@/server/csrf";
import { headers } from "next/headers";
import {
  isPlatformAdmin,
  clampMinutes,
  signToken,
} from "@/server/impersonation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user) return new Response("unauthorized", { status: 401 });
  if (!isPlatformAdmin(session.user.email)) {
    await auditLog({
      actorId: session.user.id,
      action: "impersonation.denied",
      payload: { email: session.user.email },
    }).catch(() => {});
    return new Response("forbidden", { status: 403 });
  }

  let body;
  try { body = await request.json(); } catch { return new Response("bad json", { status: 400 }); }

  const reason = String(body?.reason || "").trim();
  if (reason.length < 6) return new Response("reason required (>=6 chars)", { status: 400 });
  const minutes = clampMinutes(body?.minutes);

  const orm = await db();
  const target = body?.targetUserId
    ? await orm.user.findUnique({ where: { id: body.targetUserId } })
    : body?.targetEmail
      ? await orm.user.findUnique({ where: { email: String(body.targetEmail).toLowerCase() } })
      : null;
  if (!target) return new Response("target not found", { status: 404 });
  if (target.deletedAt) return new Response("target deleted", { status: 410 });

  const membership = await orm.membership.findFirst({
    where: { userId: target.id },
    orderBy: { createdAt: "asc" },
  });
  const orgId = membership?.orgId;
  if (!orgId) return new Response("target has no org", { status: 409 });

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const ua = h.get("user-agent") || null;

  const expiresAt = new Date(Date.now() + minutes * 60_000);
  const imp = await orm.impersonation.create({
    data: {
      orgId,
      actorId: session.user.id,
      targetId: target.id,
      reason,
      expiresAt,
      ip, ua,
    },
  });

  await auditLog({
    orgId,
    actorId: session.user.id,
    action: "impersonation.start",
    target: target.id,
    payload: { impersonationId: imp.id, reason, minutes },
  }).catch(() => {});

  const token = signToken(imp.id, expiresAt.getTime());
  const origin = new URL(request.url).origin;
  const consumeUrl = `${origin}/api/admin/impersonate/consume/${encodeURIComponent(token)}`;
  return Response.json({ impersonationId: imp.id, consumeUrl, expiresAt: expiresAt.toISOString() });
}
