/* API v1 — Estaciones (Tap-to-Ignite)
   GET  /api/v1/stations            lista del org (admin)
   POST /api/v1/stations            crea estación (admin)
   Auth: sesión OWNER/ADMIN (no API key; es operación de setup). */

import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { requireMembership } from "@/server/rbac";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";
import { generateSigningKey, buildTapUrl } from "@/server/stations";
import { headers } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin(orgId) {
  const session = await auth();
  if (!session?.user) { const e = new Error("unauthorized"); e.status = 401; throw e; }
  await requireMembership(session, orgId, "org.update");
  return session;
}

function currentOrigin() {
  return headers().then((h) => {
    const proto = h.get("x-forwarded-proto") || "https";
    const host = h.get("host") || "localhost:3000";
    return `${proto}://${host}`;
  });
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const orgId = url.searchParams.get("orgId");
    if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });
    await requireAdmin(orgId);
    const orm = await db();
    const rows = await orm.station.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      select: { id: true, label: true, location: true, policy: true, active: true, lastTapAt: true, createdAt: true },
    });
    return NextResponse.json({ data: rows });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const orgId = String(body.orgId || "");
    if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });
    await requireAdmin(orgId);

    const label = String(body.label || "").trim();
    if (!label || label.length > 80) return NextResponse.json({ error: "label invalid" }, { status: 400 });

    const location = body.location ? String(body.location).slice(0, 120) : null;
    const policy = ["ANY", "ENTRY_EXIT", "MORNING_ONLY", "EVENING_ONLY"].includes(body.policy)
      ? body.policy : "ENTRY_EXIT";

    const signingKey = generateSigningKey();
    const orm = await db();
    const st = await orm.station.create({
      data: { orgId, label, location, policy, signingKey },
    });

    await auditLog({ orgId, action: "station.create", target: st.id, payload: { label, policy } });

    const origin = await currentOrigin();
    const url = buildTapUrl({ origin, stationId: st.id, signingKey });

    return NextResponse.json({
      data: {
        id: st.id, label: st.label, location: st.location, policy: st.policy,
        active: st.active, createdAt: st.createdAt,
      },
      tapUrl: url,
      // signingKey NO se devuelve al cliente después de la creación.
      warning: "Imprime y distribuye la URL. No se podrá recuperar la signingKey.",
    }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
