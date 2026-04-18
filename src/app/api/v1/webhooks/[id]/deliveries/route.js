/* API v1 — Webhook deliveries
   GET  /api/v1/webhooks/[id]/deliveries     lista últimas N
   POST /api/v1/webhooks/[id]/deliveries?action=retry&did=...  reintenta */

import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { requireMembership } from "@/server/rbac";
import { requireCsrf } from "@/server/csrf";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";
import { retryDelivery } from "@/server/webhooks";

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

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const { orm, h } = await loadAndAuthorize(id);
    const rows = await orm.webhookDelivery.findMany({
      where: { webhookId: h.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, event: true, status: true, attempts: true, deliveredAt: true, error: true, createdAt: true },
    });
    return NextResponse.json({ data: rows });
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
    if (url.searchParams.get("action") !== "retry") {
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
    const did = url.searchParams.get("did");
    if (!did) return NextResponse.json({ error: "did required" }, { status: 400 });
    const { h } = await loadAndAuthorize(id);
    const ok = await retryDelivery(did);
    if (!ok) return NextResponse.json({ error: "delivery not found" }, { status: 404 });
    await auditLog({ orgId: h.orgId, action: "webhook.retry", target: did });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
