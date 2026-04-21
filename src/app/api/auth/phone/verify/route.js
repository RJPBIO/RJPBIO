/* ═══════════════════════════════════════════════════════════════
   POST /api/auth/phone/verify
   Body: { phone, code }
   Timing-safe check, upsert User by phone, create a Session row,
   set the Auth.js session cookie. Attempts capped at 5 per OTP.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { db } from "@/server/db";
import { check } from "@/server/ratelimit";
import { normalizeE164 } from "@/lib/sms";
import { auditLog } from "@/server/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SESSION_TTL_MS = 8 * 60 * 60_000;
const MAX_ATTEMPTS = 5;

function hashCode(phone, code) {
  const key = process.env.AUTH_SECRET || "dev-secret";
  return createHmac("sha256", key).update(`${phone}:${code}`).digest("hex");
}

function safeEq(a, b) {
  const ba = Buffer.from(a, "hex"); const bb = Buffer.from(b, "hex");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

function getIp(req) {
  const xff = req.headers.get("x-forwarded-for");
  return (xff?.split(",")[0]?.trim()) || req.headers.get("x-real-ip") || "0.0.0.0";
}

export async function POST(req) {
  let body;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }

  const phone = normalizeE164(body?.phone, body?.defaultCountry || "52");
  const code = String(body?.code || "").replace(/\D/g, "");
  if (!phone || code.length !== 6) {
    return NextResponse.json({ error: "input_invalid" }, { status: 400 });
  }

  const ip = getIp(req);
  const rl = await check(`phone-verify:${phone}`, { limit: 10, windowMs: 10 * 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "too_many_requests" }, { status: 429 });

  const orm = await db();
  const rec = await orm.phoneOtp.findUnique({ where: { phone } });
  if (!rec) return NextResponse.json({ error: "code_invalid" }, { status: 400 });
  if (rec.expiresAt.getTime() < Date.now()) {
    await orm.phoneOtp.delete({ where: { phone } }).catch(() => {});
    return NextResponse.json({ error: "code_expired" }, { status: 400 });
  }
  if (rec.attempts >= MAX_ATTEMPTS) {
    await orm.phoneOtp.delete({ where: { phone } }).catch(() => {});
    return NextResponse.json({ error: "attempts_exceeded" }, { status: 429 });
  }

  const ok = safeEq(hashCode(phone, code), rec.codeHash);
  if (!ok) {
    await orm.phoneOtp.update({ where: { phone }, data: { attempts: { increment: 1 } } }).catch(() => {});
    return NextResponse.json({ error: "code_invalid" }, { status: 400 });
  }

  // Consume OTP.
  await orm.phoneOtp.delete({ where: { phone } }).catch(() => {});

  // Upsert User by phone. Email is synthesized only if missing (can be
  // rewritten later via account linking). Stamps phoneVerified now.
  const syntheticEmail = `phone-${phone.replace(/\D/g, "")}@phone.bio-ignicion.app`;
  const user = await orm.user.upsert({
    where: { phone },
    update: { phoneVerified: new Date(), lastLoginAt: new Date() },
    create: {
      phone,
      phoneVerified: new Date(),
      email: syntheticEmail,
      name: phone,
      lastLoginAt: new Date(),
    },
  });

  // Issue database session (Auth.js-compatible).
  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_TTL_MS);
  await orm.session.create({
    data: {
      sessionToken,
      userId: user.id,
      expires,
      ip,
      ua: req.headers.get("user-agent") || null,
    },
  });

  const isProd = process.env.NODE_ENV === "production";
  const cookieName = isProd ? "__Secure-authjs.session-token" : "authjs.session-token";
  const jar = await cookies();
  jar.set(cookieName, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    expires,
  });

  await auditLog({ action: "auth.phone.verify", actorId: user.id, target: phone, ip }).catch(() => {});

  // Account-linking hint: if the User still has a synthetic email
  // (minted on first phone sign-in), the client should prompt them
  // to add a real email so magic-link/SSO flows can later reuse the
  // same account. Redirect there instead of straight into the app.
  const needsEmail = user.email.endsWith("@phone.bio-ignicion.app");
  return NextResponse.json({
    ok: true,
    needsEmail,
    redirect: needsEmail ? "/account/link-email?next=/app" : "/app",
  });
}
