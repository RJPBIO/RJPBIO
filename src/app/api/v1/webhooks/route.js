/* API v1 — Webhooks
   POST /api/v1/webhooks   crea webhook (admin) */

import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { requireMembership } from "@/server/rbac";
import { requireCsrf } from "@/server/csrf";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";
import { randomBytes } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_EVENTS = [
  "session.completed", "session.started",
  "member.added", "member.removed",
  "station.tap", "billing.overage",
  "*",
];

export async function POST(req) {
  try {
    const csrf = requireCsrf(req);
    if (csrf) return csrf;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const orgId = session.memberships?.find((m) => ["OWNER", "ADMIN"].includes(m.role))?.orgId;
    if (!orgId) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    await requireMembership(session, orgId, "webhook.manage");

    let url;
    try { url = new URL(body.url); } catch { return NextResponse.json({ error: "URL inválida" }, { status: 400 }); }
    if (!["http:", "https:"].includes(url.protocol)) return NextResponse.json({ error: "URL debe ser https" }, { status: 400 });

    const events = (Array.isArray(body.events) ? body.events : String(body.events || "").split(","))
      .map((e) => String(e).trim()).filter(Boolean)
      .filter((e) => VALID_EVENTS.includes(e));
    if (!events.length) return NextResponse.json({ error: "al menos un evento válido" }, { status: 400 });

    const orm = await db();
    const secret = randomBytes(32).toString("base64");
    const hook = await orm.webhook.create({
      data: { orgId, url: url.toString(), secret, events, active: true },
    });
    await auditLog({ orgId, action: "webhook.create", target: hook.id, payload: { url: url.toString(), events } });
    // El secret completo solo se muestra aquí. Luego solo los últimos 4 caracteres.
    return NextResponse.json({
      id: hook.id, url: hook.url, events: hook.events, active: true, secret,
    }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
