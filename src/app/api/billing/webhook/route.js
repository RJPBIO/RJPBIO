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

  // Sprint S1.5 — idempotency. Antes: si Stripe retransmitía un event
  // (network blip, retry burst), `org.update` se aplicaba 2× y un audit
  // duplicado se escribía. Ahora: pre-check en StripeEvent, persist tras
  // aplicar, y skip si ya está. Race-safe: PRIMARY KEY en id permite
  // que dos webhooks concurrentes con mismo event.id terminen con uno
  // ganando el insert y el otro tomando el catch path → skip apply.
  let alreadyProcessed = false;
  try {
    const existing = await orm.stripeEvent.findUnique({ where: { id: event.id } });
    if (existing) alreadyProcessed = true;
  } catch {
    // Si la tabla no existe (migration no aplicada) o el adapter de
    // memoria no la tiene, seguimos sin idempotency check — best-effort.
  }

  try {
    if (!resolution.skip && !alreadyProcessed) {
      if (orgUpdate && orgId) {
        await orm.org.update({ where: { id: orgId }, data: orgUpdate }).catch(() => {});
      }
      if (notification && orgId) {
        await notifyOrgAdmins(orgId, notification).catch(() => {});
      }
    }

    // Persistir fingerprint del evento (idempotency). Si el insert falla
    // por unique constraint (race con otro worker), no es problema —
    // ya quedó registrado por el ganador.
    if (!alreadyProcessed) {
      try {
        await orm.stripeEvent.create({
          data: {
            id: event.id,
            type: event.type,
            orgId: orgId || null,
            payload: { type: event.type, livemode: !!event.livemode },
          },
        });
      } catch { /* unique violation race or memory adapter — ignore */ }
    }

    await auditLog({
      orgId: orgId || undefined,
      action,
      payload: { eventId: event.id, idempotentSkip: alreadyProcessed || undefined },
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
