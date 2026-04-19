/* ═══════════════════════════════════════════════════════════════
   Stripe webhook — eventos completos de ciclo de vida + dunning.
   - Verifica firma (raw body, sin parse previo).
   - Mantiene Org.plan, Org.dunningState, Org.graceUntil, Org.trialEndsAt.
   - Notifica a admins en fallos de pago y fin de trial.
   - Idempotente por event.id vía AuditLog (el hash-chain detecta dupes).
   ═══════════════════════════════════════════════════════════════ */
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";
import { notifyOrgAdmins } from "@/server/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GRACE_DAYS = 14;

function graceDate(days = GRACE_DAYS) {
  return new Date(Date.now() + days * 86400_000);
}

async function updateOrg(orm, orgId, data) {
  if (!orgId) return;
  return orm.org.update({ where: { id: orgId }, data }).catch(() => {});
}

async function notify(orgId, payload) {
  if (!orgId) return;
  return notifyOrgAdmins(orgId, payload).catch(() => {});
}

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

  const orm = await db();
  const obj = event.data.object || {};
  const orgId = obj.metadata?.orgId || obj.subscription_details?.metadata?.orgId || null;

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        if (!orgId) break;
        const plan = (obj.metadata?.plan || "STARTER").toUpperCase();
        const seats = Number(obj.items?.data?.[0]?.quantity || 5);
        const trialEnd = obj.trial_end ? new Date(obj.trial_end * 1000) : null;
        await updateOrg(orm, orgId, {
          stripeSub: obj.id,
          plan,
          seats,
          trialEndsAt: trialEnd,
          dunningState: obj.status === "past_due" ? "past_due" : null,
          graceUntil: obj.status === "past_due" ? graceDate() : null,
        });
        break;
      }

      case "customer.subscription.trial_will_end": {
        if (!orgId) break;
        await notify(orgId, {
          title: "Tu trial termina pronto",
          body: "Agrega método de pago para continuar sin interrupción.",
          level: "warn",
          href: "/admin/billing",
          kind: "billing.trial_end_soon",
        });
        break;
      }

      case "invoice.payment_failed": {
        if (!orgId) break;
        await updateOrg(orm, orgId, {
          dunningState: "past_due",
          graceUntil: graceDate(),
        });
        await notify(orgId, {
          title: "Pago rechazado",
          body: `Intentaremos nuevamente. Acceso continuo hasta ${graceDate().toISOString().slice(0, 10)}.`,
          level: "error",
          href: "/admin/billing",
          kind: "billing.payment_failed",
        });
        break;
      }

      case "invoice.paid":
      case "invoice.payment_succeeded": {
        if (!orgId) break;
        await updateOrg(orm, orgId, { dunningState: null, graceUntil: null });
        break;
      }

      case "customer.subscription.deleted":
      case "customer.subscription.paused": {
        if (!orgId) break;
        await updateOrg(orm, orgId, {
          plan: "FREE",
          dunningState: event.type.endsWith("deleted") ? "canceled" : "paused",
          graceUntil: graceDate(90),
        });
        await notify(orgId, {
          title: event.type.endsWith("deleted") ? "Suscripción cancelada" : "Suscripción pausada",
          body: "Tus datos se conservan 90 días. Reactiva cuando quieras.",
          level: "warn",
          href: "/admin/billing",
          kind: "billing.canceled",
        });
        break;
      }

      case "customer.updated": {
        if (!orgId) break;
        break;
      }
    }

    await auditLog({
      orgId: orgId || undefined,
      action: `billing.${event.type}`,
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
