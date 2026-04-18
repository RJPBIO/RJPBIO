/* Admin impersonation — consume endpoint.
   GET /api/admin/impersonate/consume/<token>
   - Verifies HMAC-signed token + expiry.
   - Consumes once (endedAt set on Impersonation).
   - Creates a real Session row for target user (short TTL).
   - Sets NextAuth session cookie + impersonation marker cookie.
   - Redirects to / so the admin lands in the impersonated session. */

import { db } from "@/server/db";
import { auditLog } from "@/server/audit";
import { cookies } from "next/headers";
import { verifyToken, newSessionToken } from "@/server/impersonation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SESSION_COOKIE =
  process.env.AUTH_COOKIE_NAME ||
  (process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token");

export async function GET(_request, { params }) {
  const { token } = await params;
  const parsed = verifyToken(token);
  if (!parsed) return new Response("invalid or expired token", { status: 400 });

  const orm = await db();
  const imp = await orm.impersonation.findUnique({ where: { id: parsed.id } });
  if (!imp) return new Response("not found", { status: 404 });
  if (imp.endedAt) return new Response("already consumed", { status: 410 });
  if (imp.expiresAt.getTime() <= Date.now()) {
    return new Response("expired", { status: 410 });
  }

  const target = await orm.user.findUnique({ where: { id: imp.targetId } });
  if (!target || target.deletedAt) return new Response("target unavailable", { status: 410 });

  const sessionToken = newSessionToken();
  const ttl = imp.expiresAt;
  await orm.session.create({
    data: { sessionToken, userId: target.id, expires: ttl },
  });

  await orm.impersonation.update({
    where: { id: imp.id },
    data: { endedAt: new Date() },
  });

  await auditLog({
    orgId: imp.orgId,
    actorId: imp.actorId,
    action: "impersonation.consume",
    target: imp.targetId,
    payload: { impersonationId: imp.id, expiresAt: imp.expiresAt.toISOString() },
  }).catch(() => {});

  const jar = await cookies();
  jar.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: ttl,
  });
  jar.set("bio-impersonation", imp.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: ttl,
  });

  return Response.redirect(new URL("/", _request.url), 302);
}
