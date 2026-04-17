import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";

export const runtime = "nodejs";

export async function POST(req) {
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ ok: false }, { status: 503 });
  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-11-20" });
  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }
  const orm = await db();
  const sub = event.data.object;
  const orgId = sub?.metadata?.orgId;

  switch (event.type) {
    case "checkout.session.completed":
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      if (orgId) {
        await orm.org.update({
          where: { id: orgId },
          data: {
            stripeSub: sub.id,
            plan: (sub.metadata?.plan || "STARTER").toUpperCase(),
            seats: Number(sub.items?.data?.[0]?.quantity || 5),
          },
        }).catch(() => {});
        await auditLog({ orgId, action: `billing.${event.type}`, payload: { subId: sub.id } });
      }
      break;
    }
    case "customer.subscription.deleted": {
      if (orgId) await orm.org.update({ where: { id: orgId }, data: { plan: "FREE" } }).catch(() => {});
      break;
    }
  }
  return NextResponse.json({ received: true });
}
