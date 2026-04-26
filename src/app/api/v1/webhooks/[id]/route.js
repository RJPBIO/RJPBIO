/* API v1 — Webhook individual
   PATCH  /api/v1/webhooks/[id]                       toggle active / update events
   DELETE /api/v1/webhooks/[id]                       elimina
   POST   /api/v1/webhooks/[id]?action=rotate         Sprint 17: rota CON overlap (zero-downtime)
                                                      body: { overlapDays?: number }
   POST   /api/v1/webhooks/[id]?action=test           envía evento "ping" */

import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { requireMembership } from "@/server/rbac";
import { requireCsrf } from "@/server/csrf";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";
import { dispatchWebhooks, rotateWebhookSecret } from "@/server/webhooks";
import { validateOverlapDays } from "@/lib/webhook-rotation";

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
      // Sprint 17 — rotation con overlap (zero-downtime). Body opcional:
      // { overlapDays: 1..30 } — default 7 días.
      const body = await req.json().catch(() => ({}));
      const v = validateOverlapDays(body?.overlapDays ?? null);
      if (!v.ok) return NextResponse.json({ error: "overlapDays inválido", reason: v.error }, { status: 400 });
      const session = await auth();
      const r = await rotateWebhookSecret({
        webhookId: h.id,
        orgId: h.orgId,
        actorUserId: session?.user?.id,
        overlapDays: v.value,
      });
      if (!r.ok) {
        const status = r.error === "not_found" ? 404 : r.error === "wrong_org" ? 404 : 500;
        return NextResponse.json({ error: r.error }, { status });
      }
      return NextResponse.json({
        secret: r.newSecret,
        overlapDays: v.value,
        prevSecretExpiresAt: r.expiresAt.toISOString(),
        message: `Secret nuevo activo. El anterior sigue válido por ${v.value} día${v.value !== 1 ? "s" : ""} para que actualices tus integraciones sin downtime.`,
      });
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
