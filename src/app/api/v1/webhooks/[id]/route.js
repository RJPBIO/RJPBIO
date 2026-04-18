/* API v1 — Webhook individual
   PATCH  /api/v1/webhooks/[id]          toggle active / update events
   DELETE /api/v1/webhooks/[id]          elimina
   POST   /api/v1/webhooks/[id]?action=rotate   rota secret
   POST   /api/v1/webhooks/[id]?action=test     envía evento "ping" */

import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { requireMembership } from "@/server/rbac";
import { requireCsrf } from "@/server/csrf";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";
import { dispatchWebhooks } from "@/server/webhooks";
import { randomBytes } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadAndAuthorize(id) {
  const session = await auth();
  if (!session?.user) { const e = new Error("unauthorized"); e.status = 401; throw e; }
  const orm = await db();
  const h = await orm.webhook.findUnique({ where: { id } });
  if (!h) { const e = new Error("not found"); e.status = 404; throw e; }
  await requireMembership(session, h.orgId, "webhook.manage");
  return { orm, h };
}

export async function PATCH(req, { params }) {
  try {
    const csrf = requireCsrf(req);
    if (csrf) return csrf;
    const { id } = await params;
    const { orm, h } = await loadAndAuthorize(id);
    const body = await req.json().catch(() => ({}));
    const data = {};
    if (typeof body.active === "boolean") data.active = body.active;
    if (Array.isArray(body.events)) {
      const ev = body.events.map((e) => String(e).trim()).filter(Boolean);
      if (ev.length) data.events = ev;
    }
    const updated = await orm.webhook.update({ where: { id: h.id }, data });
    await auditLog({ orgId: h.orgId, action: "webhook.update", target: h.id, payload: data });
    return NextResponse.json({ id: updated.id, active: updated.active, events: updated.events });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const csrf = requireCsrf(req);
    if (csrf) return csrf;
    const { id } = await params;
    const { orm, h } = await loadAndAuthorize(id);
    await orm.webhook.delete({ where: { id: h.id } });
    await auditLog({ orgId: h.orgId, action: "webhook.delete", target: h.id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const csrf = requireCsrf(req);
    if (csrf) return csrf;
    const { id } = await params;
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const { orm, h } = await loadAndAuthorize(id);

    if (action === "rotate") {
      const secret = randomBytes(32).toString("base64");
      await orm.webhook.update({ where: { id: h.id }, data: { secret } });
      await auditLog({ orgId: h.orgId, action: "webhook.rotate", target: h.id });
      return NextResponse.json({ secret, warning: "Actualiza la verificación HMAC en tu receptor." });
    }
    if (action === "test") {
      // Usa el pipeline real — crea una WebhookDelivery visible en el log.
      await dispatchWebhooks(h.orgId, "ping", { hookId: h.id, note: "Test manual desde admin" });
      await auditLog({ orgId: h.orgId, action: "webhook.test", target: h.id });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
