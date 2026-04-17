/* API v1 — Estación individual
   PATCH  /api/v1/stations/[id]     actualiza label/location/policy/active
   DELETE /api/v1/stations/[id]     desactiva (soft delete)
   POST   /api/v1/stations/[id]?action=rotate   rota signingKey */

import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { requireMembership } from "@/server/rbac";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";
import { generateSigningKey, buildTapUrl } from "@/server/stations";
import { headers } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadAndAuthorize(id) {
  const session = await auth();
  if (!session?.user) { const e = new Error("unauthorized"); e.status = 401; throw e; }
  const orm = await db();
  const st = await orm.station.findUnique({ where: { id } });
  if (!st) { const e = new Error("not found"); e.status = 404; throw e; }
  await requireMembership(session, st.orgId, "org.update");
  return { orm, st };
}

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const { orm, st } = await loadAndAuthorize(id);
    const body = await req.json();
    const data = {};
    if (typeof body.label === "string")    data.label = body.label.slice(0, 80);
    if (typeof body.location === "string") data.location = body.location.slice(0, 120);
    if (["ANY", "ENTRY_EXIT", "MORNING_ONLY", "EVENING_ONLY"].includes(body.policy)) data.policy = body.policy;
    if (typeof body.active === "boolean")  data.active = body.active;
    const updated = await orm.station.update({ where: { id: st.id }, data });
    await auditLog({ orgId: st.orgId, action: "station.update", target: st.id, payload: data });
    return NextResponse.json({ data: { id: updated.id, label: updated.label, location: updated.location, policy: updated.policy, active: updated.active } });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const { id } = await params;
    const { orm, st } = await loadAndAuthorize(id);
    await orm.station.update({ where: { id: st.id }, data: { active: false } });
    await auditLog({ orgId: st.orgId, action: "station.deactivate", target: st.id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

async function currentOrigin() {
  // Prioriza env confiable para evitar host header injection (tapUrls a dominio atacante).
  const env = process.env.NEXT_PUBLIC_BASE_URL || process.env.AUTH_URL;
  if (env) return env.replace(/\/+$/, "");
  const h = await headers();
  const proto = h.get("x-forwarded-proto") || "https";
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    if (url.searchParams.get("action") !== "rotate") {
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
    const { orm, st } = await loadAndAuthorize(id);
    const signingKey = generateSigningKey();
    await orm.station.update({ where: { id: st.id }, data: { signingKey } });
    await auditLog({ orgId: st.orgId, action: "station.rotate", target: st.id });
    const origin = await currentOrigin();
    const tapUrl = buildTapUrl({ origin, stationId: st.id, signingKey });
    return NextResponse.json({ tapUrl, warning: "Claves antiguas invalidadas. Re-imprime tags." });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
