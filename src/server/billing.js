/* Billing — Stripe con per-seat + metered overage. */
import "server-only";

let stripePromise;
async function getStripe() {
  if (!stripePromise) {
    stripePromise = (async () => {
      const { default: Stripe } = await import("stripe");
      return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-11-20" });
    })();
  }
  return stripePromise;
}

const PRICE_IDS = {
  STARTER: process.env.STRIPE_PRICE_STARTER,
  GROWTH: process.env.STRIPE_PRICE_GROWTH,
  ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE,
  OVERAGE: process.env.STRIPE_PRICE_OVERAGE,
};

export async function ensureCustomer(org) {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  const stripe = await getStripe();
  if (org.stripeCustomer) return org.stripeCustomer;
  const c = await stripe.customers.create({
    name: org.name,
    metadata: { orgId: org.id },
  });
  return c.id;
}

export async function createCheckoutSession({ org, plan, seats, successUrl, cancelUrl }) {
  const stripe = await getStripe();
  const customer = await ensureCustomer(org);
  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: [
      { price: PRICE_IDS[plan], quantity: seats },
      { price: PRICE_IDS.OVERAGE },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    subscription_data: { metadata: { orgId: org.id, plan } },
  });
}

export async function reportUsage(subscriptionItemId, quantity, timestamp) {
  const stripe = await getStripe();
  return stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
    quantity, timestamp: Math.floor((timestamp || Date.now()) / 1000), action: "increment",
  });
}

export async function portalSession(org, returnUrl) {
  const stripe = await getStripe();
  return stripe.billingPortal.sessions.create({ customer: org.stripeCustomer, return_url: returnUrl });
}
