/* ═══════════════════════════════════════════════════════════════
   POST /api/auth/phone/send
   Body: { phone, locale? }
   Issues a 6-digit OTP hashed-at-rest, 5-min TTL, one active row
   per phone (upserted on resend). Rate-limited per-phone and per-IP.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { NextResponse } from "next/server";
import { createHmac, randomInt } from "node:crypto";
import { db } from "@/server/db";
import { check } from "@/server/ratelimit";
import { sendSms, smsEnabled, normalizeE164 } from "@/lib/sms";
import { auditLog } from "@/server/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OTP_TTL_MS = 5 * 60_000;

function hashCode(phone, code) {
  const key = process.env.AUTH_SECRET || "dev-secret";
  return createHmac("sha256", key).update(`${phone}:${code}`).digest("hex");
}

function getIp(req) {
  const xff = req.headers.get("x-forwarded-for");
  return (xff?.split(",")[0]?.trim()) || req.headers.get("x-real-ip") || "0.0.0.0";
}

export async function POST(req) {
  if (!smsEnabled()) {
    return NextResponse.json({ error: "sms_disabled" }, { status: 503 });
  }

  let body;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }

  const phone = normalizeE164(body?.phone, body?.defaultCountry || "52");
  const locale = body?.locale === "en" ? "en" : "es";
  if (!phone) return NextResponse.json({ error: "phone_invalid" }, { status: 400 });

  const ip = getIp(req);

  const rlPhone = await check(`phone-send:${phone}`, { limit: 3, windowMs: 10 * 60_000 });
  if (!rlPhone.ok) {
    return NextResponse.json({ error: "too_many_requests" }, {
      status: 429,
      headers: { "Retry-After": String(Math.ceil((rlPhone.reset - Date.now()) / 1000)) },
    });
  }
  const rlIp = await check(`phone-send-ip:${ip}`, { limit: 10, windowMs: 10 * 60_000 });
  if (!rlIp.ok) {
    return NextResponse.json({ error: "too_many_requests" }, {
      status: 429,
      headers: { "Retry-After": String(Math.ceil((rlIp.reset - Date.now()) / 1000)) },
    });
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const codeHash = hashCode(phone, code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  try {
    const orm = await db();
    await orm.phoneOtp.upsert({
      where: { phone },
      update: { codeHash, expiresAt, attempts: 0, ip },
      create: { phone, codeHash, expiresAt, attempts: 0, ip },
    });

    const bodyText = locale === "en"
      ? `BIO-IGNITION code: ${code}. Valid 5 min. If you didn't request this, ignore.`
      : `BIO-IGNICIÓN código: ${code}. Vigente 5 min. Si no lo pediste, ignora este mensaje.`;
    await sendSms(phone, bodyText);

    await auditLog({ action: "auth.phone.send", target: phone, ip, payload: { locale } }).catch(() => {});
    return NextResponse.json({ ok: true, expiresAt: expiresAt.toISOString() });
  } catch (e) {
    console.error("[phone/send]", e?.message);
    if (String(e?.message).includes("sms_provider_missing")) {
      return NextResponse.json({ error: "sms_disabled" }, { status: 503 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
