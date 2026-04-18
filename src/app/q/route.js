/* ═══════════════════════════════════════════════════════════════
   Tap-to-Ignite — landing pública del tap (QR / NFC).
   GET /q?s=<stationId>                       (QR estático — caso normal)
   GET /q?s=<stationId>&t=&n=&sig=            (URL firmada efímera)
   ═══════════════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { processTap } from "@/server/stations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vendor → IANA TZ. Adaptadores típicos. Si no encaja, cae a CDMX.
function resolveTimezone(req) {
  return (
    req.headers.get("x-vercel-ip-timezone") ||
    req.headers.get("cf-timezone") ||
    req.headers.get("x-forwarded-timezone") ||
    process.env.DEFAULT_TIMEZONE ||
    "America/Mexico_City"
  );
}

export async function GET(req) {
  const url = new URL(req.url);
  const stationId = url.searchParams.get("s");
  const t = url.searchParams.get("t");
  const n = url.searchParams.get("n");
  const sig = url.searchParams.get("sig");
  const anonId = req.cookies.get("bio-anon")?.value || null;

  // Sesión opcional: un tap funciona sin login.
  let userId = null;
  try { const s = await auth(); userId = s?.user?.id || null; } catch {}

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const ua = req.headers.get("user-agent") || null;
  const timezone = resolveTimezone(req);

  const result = await processTap({ stationId, t, n, sig, userId, anonId, timezone, ip, ua });

  if (!result.ok) {
    const dest = new URL("/", url);
    dest.searchParams.set("tap", "error");
    dest.searchParams.set("reason", result.reason || "unknown");
    return NextResponse.redirect(dest);
  }

  // Redirige al shell de la app con contexto de tap — la PWA toma el resto.
  const dest = new URL("/", url);
  dest.searchParams.set("quick", "1");
  dest.searchParams.set("source", "tap");
  dest.searchParams.set("station", result.station.id);
  dest.searchParams.set("slot", result.slot);

  const res = NextResponse.redirect(dest);

  // Si no hay identidad local, emitir una anónima estable.
  // `secure` solo en prod: en dev HTTP el browser ignora la cookie con secure=true.
  if (!userId && !anonId) {
    const fresh = crypto.randomUUID().replace(/-/g, "");
    res.cookies.set("bio-anon", fresh, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return res;
}
