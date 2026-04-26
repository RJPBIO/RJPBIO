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
  PRO: process.env.STRIPE_PRICE_PRO,             // B2C personal — 1 seat fixed
  STARTER: process.env.STRIPE_PRICE_STARTER,
  GROWTH: process.env.STRIPE_PRICE_GROWTH,
  ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE,
  OVERAGE: process.env.STRIPE_PRICE_OVERAGE,
};

/* Trial config — 14 días para STARTER/GROWTH (B2B), 7 días para PRO (B2C).
   ENTERPRISE tiene su propio onboarding negociado, sin trial Stripe. */
const TRIAL_DAYS = { PRO: 7, STARTER: 14, GROWTH: 14 };

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
  // PRO es B2C: 1 seat fijo, sin overage. STARTER/GROWTH: per-seat + overage.
  // ENTERPRISE no usa este flow (sales-led con MSA custom).
  const isPro = plan === "PRO";
  const lineItems = isPro
    ? [{ price: PRICE_IDS.PRO, quantity: 1 }]
    : [
        { price: PRICE_IDS[plan], quantity: seats },
        { price: PRICE_IDS.OVERAGE },
      ];

  // Trial automático según plan. El usuario puede cancelar antes de
  // que termine sin cargo. customer.subscription.trial_will_end (3 días
  // antes) y customer.subscription.deleted (al final si no pagó) son
  // manejados por el webhook existente.
  const trialDays = TRIAL_DAYS[plan];
  const subscriptionData = {
    metadata: { orgId: org.id, plan },
    ...(trialDays ? { trial_period_days: trialDays } : {}),
  };

  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: lineItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    subscription_data: subscriptionData,
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

/* Lista las últimas N facturas para el customer. No-op seguro sin Stripe. */
export async function listInvoices(customerId, limit = 12) {
  if (!process.env.STRIPE_SECRET_KEY || !customerId) return [];
  try {
    const stripe = await getStripe();
    const res = await stripe.invoices.list({ customer: customerId, limit });
    return (res.data || []).map((i) => ({
      id: i.id,
      date: (i.created || 0) * 1000,
      amount: i.amount_paid ?? i.total ?? 0,
      currency: i.currency,
      status: i.status,
      pdf: i.invoice_pdf || i.hosted_invoice_url || null,
    }));
  } catch (e) {
    console.error("[billing] listInvoices failed:", e?.message);
    return [];
  }
}
