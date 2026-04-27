/* DEV-ONLY one-shot login. Hard-blocked outside development.
   GET /api/dev/login?email=owner@demo.local → sets authjs.session-token
   cookie via Set-Cookie header and redirects to /admin/onboarding.
*/
import "server-only";
import { NextResponse } from "next/server";
import { encode, decode } from "next-auth/jwt";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET(req) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Forbidden in non-dev", { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email") || "owner@demo.local";
  const next = searchParams.get("next") || "/admin/onboarding";

  const orm = await db();
  const user = await orm.user.findUnique({ where: { email } });
  if (!user) return new NextResponse(`User ${email} not found. Run npm run seed.`, { status: 404 });

  const secret = process.env.AUTH_SECRET;
  if (!secret) return new NextResponse("AUTH_SECRET missing", { status: 500 });

  const maxAge = 8 * 60 * 60;
  const epoch = user.sessionEpoch ?? 0;

  const tokenPayload = {
    sub: user.id, name: user.name, email: user.email,
    locale: user.locale, timezone: user.timezone,
    epoch, lastValidatedAt: Date.now(),
  };

  const cookieValue = await encode({
    token: tokenPayload, secret, salt: "authjs.session-token", maxAge,
  });
  const decoded = await decode({ token: cookieValue, secret, salt: "authjs.session-token" });
  const jti = decoded?.jti;

  await orm.userSession.create({
    data: {
      userId: user.id, jti,
      ip: "127.0.0.1", userAgent: "dev-login-endpoint",
      label: "Dev login (URL)",
      expiresAt: new Date(Date.now() + maxAge * 1000),
    },
  });

  const membership = await orm.membership.findFirst({
    where: { userId: user.id, org: { personal: false } },
    include: { org: true },
  }) || await orm.membership.findFirst({
    where: { userId: user.id },
    include: { org: true },
  });
  const orgId = membership?.orgId;

  const res = NextResponse.redirect(new URL(next, req.url));
  res.cookies.set("authjs.session-token", cookieValue, {
    path: "/", httpOnly: true, sameSite: "lax", maxAge,
  });
  if (orgId) {
    res.cookies.set("bio-org", orgId, {
      path: "/", httpOnly: false, sameSite: "lax", maxAge,
    });
  }
  return res;
}
