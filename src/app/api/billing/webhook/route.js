/* ═══════════════════════════════════════════════════════════════
   Stripe webhook — orquestación delgada.
   - Verifica firma (raw body, sin parse previo).
   - Delega event resolution a lib/billing-webhook (testable puro).
   - Aplica orgUpdate + notification + audit (side effects).
   - Idempotente por event.id vía AuditLog (el hash-chain detecta dupes).
   ═══════════════════════════════════════════════════════════════ */
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";
import { notifyOrgAdmins } from "@/server/notifications";
import { resolveStripeEvent } from "@/lib/billing-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  }
  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-11-20" });
  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const resolution = resolveStripeEvent(event);
  const { orgId, orgUpdate, notification, action } = resolution;
  const orm = await db();

  try {
    if (!resolution.skip) {
      if (orgUpdate && orgId) {
        await orm.org.update({ where: { id: orgId }, data: orgUpdate }).catch(() => {});
      }
      if (notification && orgId) {
        await notifyOrgAdmins(orgId, notification).catch(() => {});
      }
    }

    await auditLog({
      orgId: orgId || undefined,
      action,
      payload: { eventId: event.id },
    }).catch(() => {});
  } catch (e) {
    await auditLog({
      orgId: orgId || undefined,
      action: "billing.webhook.error",
      payload: { eventType: event.type, eventId: event.id, error: String(e?.message || e) },
    }).catch(() => {});
    return NextResponse.json({ received: true, handled: false }, { status: 200 });
  }

  return NextResponse.json({ received: true });
}
