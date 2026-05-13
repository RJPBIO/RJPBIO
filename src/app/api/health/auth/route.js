/* GET /api/health/auth — diagnostic endpoint para debug del sign-in
   en producción. Reporta el estado de cada dependencia que NextAuth
   necesita. NO expone secretos — solo presencia/ausencia y longitud.
   Acceso libre intencional: sin esto, debug en serverless es a ciegas.
*/

import "server-only";
import { NextResponse } from "next/server";
import { db } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function presence(v) {
  if (v === undefined || v === null || v === "") return { set: false };
  return { set: true, length: String(v).length };
}

async function probeAdapter() {
  try {
    if (!process.env.DATABASE_URL) {
      return { ok: false, reason: "DATABASE_URL not set" };
    }
    const orm = await db();
    if (!orm) return { ok: false, reason: "db() returned null" };
    // Probe each table that NextAuth + signIn callback touches.
    const probes = {};
    const tables = ["user", "account", "verificationToken", "membership", "org", "auditLog"];
    for (const t of tables) {
      try {
        if (typeof orm[t]?.count !== "function") {
          probes[t] = { ok: false, error: `no count() method (model "${t}" missing from client?)` };
          continue;
        }
        const c = await orm[t].count();
        probes[t] = { ok: true, count: typeof c === "bigint" ? Number(c) : c };
      } catch (e) {
        probes[t] = {
          ok: false,
          error: e?.name || "Error",
          code: e?.code || null,
          message: (e?.message || String(e)).slice(0, 240),
        };
      }
    }
    return { ok: true, probes };
  } catch (e) {
    return {
      ok: false,
      error: e?.name || "Error",
      code: e?.code || null,
      message: (e?.message || String(e)).slice(0, 240),
    };
  }
}

export async function GET() {
  const env = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: !!process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV || null,
    AUTH_SECRET: presence(process.env.AUTH_SECRET),
    NEXTAUTH_SECRET: presence(process.env.NEXTAUTH_SECRET),
    AUTH_URL: presence(process.env.AUTH_URL),
    NEXTAUTH_URL: presence(process.env.NEXTAUTH_URL),
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST || null,
    DATABASE_URL: presence(process.env.DATABASE_URL),
    DIRECT_URL: presence(process.env.DIRECT_URL),
    GOOGLE_CLIENT_ID: presence(process.env.GOOGLE_CLIENT_ID),
    GOOGLE_CLIENT_SECRET: presence(process.env.GOOGLE_CLIENT_SECRET),
    EMAIL_SERVER: presence(process.env.EMAIL_SERVER),
    EMAIL_FROM: presence(process.env.EMAIL_FROM),
  };

  // Auth.js requiere secret de ≥32 chars cuando encripta JWTs.
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const secretCheck = secret
    ? { present: true, length: secret.length, validLength: secret.length >= 32 }
    : { present: false, validLength: false };

  // Sin AUTH_URL ni trustHost, Auth.js falla en validar host en serverless.
  const hostCheck = {
    trustHostEffective:
      !!process.env.VERCEL ||
      process.env.AUTH_TRUST_HOST === "1" ||
      process.env.AUTH_TRUST_HOST === "true" ||
      process.env.NODE_ENV !== "production",
    authUrlSet: !!(process.env.AUTH_URL || process.env.NEXTAUTH_URL),
  };

  const adapterProbe = await probeAdapter();

  // Veredicto global
  const issues = [];
  if (!secretCheck.present) issues.push("AUTH_SECRET (o NEXTAUTH_SECRET) ausente");
  else if (!secretCheck.validLength) issues.push(`AUTH_SECRET tiene ${secretCheck.length} chars (mínimo 32)`);
  if (!env.DATABASE_URL.set) issues.push("DATABASE_URL ausente");
  if (!env.GOOGLE_CLIENT_ID.set) issues.push("GOOGLE_CLIENT_ID ausente");
  if (!env.GOOGLE_CLIENT_SECRET.set) issues.push("GOOGLE_CLIENT_SECRET ausente");
  if (!hostCheck.trustHostEffective && !hostCheck.authUrlSet) {
    issues.push("Ni VERCEL ni AUTH_TRUST_HOST ni AUTH_URL están seteados — host validation fallará en prod");
  }
  if (!adapterProbe.ok) {
    issues.push(`Adapter no operacional: ${adapterProbe.reason || adapterProbe.message}`);
  } else if (adapterProbe.probes) {
    for (const [t, r] of Object.entries(adapterProbe.probes)) {
      if (!r.ok) issues.push(`Tabla ${t} inaccesible: ${r.code || r.error}: ${r.message}`);
    }
  }

  return NextResponse.json({
    status: issues.length === 0 ? "healthy" : "unhealthy",
    issues,
    env,
    secretCheck,
    hostCheck,
    adapterProbe,
    time: new Date().toISOString(),
  }, { headers: { "Cache-Control": "no-store" } });
}
