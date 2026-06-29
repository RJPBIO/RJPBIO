/* ═══════════════════════════════════════════════════════════════
   Billing webhook — pure event resolver.
   ═══════════════════════════════════════════════════════════════
   Extraído de /api/billing/webhook/route.js para testing isolation.
   El route hace signature verification + apply; este módulo decide
   QUÉ aplicar dado un Stripe event.

   Decisión: la función NO tiene side effects. Devuelve un descriptor
   de mutaciones + notificaciones que el route ejecuta. Esto permite
   tests unitarios sin mockear Stripe SDK ni db.

   Returns:
     {
       orgId: string | null,                 — destinatario de mutaciones
       orgUpdate: object | null,             — fields a actualizar en Org
       notification: { title, body, ... }    — notify a admins (opcional)
       action: string,                       — para audit log
       skip: boolean,                        — si true, no aplicar nada
     }
   ═══════════════════════════════════════════════════════════════ */

const GRACE_DAYS_DEFAULT = 14;
const GRACE_DAYS_CANCELED = 90;

/* Helper inyectable para fechas (tests usan now fijo). */
function makeGraceDate(now, days) {
  return new Date(now + days * 86400000);
}

/**
 * @param {object} event Stripe event (de constructEvent)
 * @param {object} [opts]
 * @param {number} [opts.now=Date.now()] timestamp de referencia para fechas
 */
export function resolveStripeEvent(event, opts = {}) {
  const now = opts.now ?? Date.now();
  const obj = event?.data?.object || {};
  const orgId =
    obj.metadata?.orgId ||
    obj.subscription_details?.metadata?.orgId ||
    null;

  const action = `billing.${event?.type || "unknown"}`;
  const skip = { orgId, orgUpdate: null, notification: null, action, skip: true };

  if (!event?.type) return skip;

  switch (event.type) {
    case "checkout.session.completed":
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      if (!orgId) return skip;
      const plan = String(obj.metadata?.plan || "STARTER").toUpperCase();
      const seats = Number(obj.items?.data?.[0]?.quantity || 5);
      const trialEnd = obj.trial_end ? new Date(obj.trial_end * 1000) : null;
      const isPastDue = obj.status === "past_due";
      // BUG FIX: en checkout.session.completed el id es cs_… (sesión), no la
      // suscripción — la sub real está en obj.subscription. Para eventos de
      // subscription obj.id ya es sub_…. Persistimos también el customer
      // (obj.customer) como defensa para que el billing portal sea alcanzable.
      const isCheckout = event.type === "checkout.session.completed";
      const subId = isCheckout ? obj.subscription || obj.id : obj.id;
      return {
        orgId,
        orgUpdate: {
          stripeSub: subId,
          stripeCustomer: obj.customer || undefined,
          plan,
          seats,
          trialEndsAt: trialEnd,
          dunningState: isPastDue ? "past_due" : null,
          graceUntil: isPastDue ? makeGraceDate(now, GRACE_DAYS_DEFAULT) : null,
        },
        notification: null,
        action,
        skip: false,
      };
    }

    case "customer.subscription.trial_will_end": {
      if (!orgId) return skip;
      return {
        orgId,
        orgUpdate: null,
        notification: {
          title: "Tu trial termina pronto",
          body: "Agrega método de pago para continuar sin interrupción.",
          level: "warn",
          href: "/admin/billing",
          kind: "billing.trial_end_soon",
        },
        action,
        skip: false,
      };
    }

    case "invoice.payment_failed": {
      if (!orgId) return skip;
      // BUG FIX: Stripe emite payment_failed alrededor de la cancelación
      // (intentos de factura final) y los eventos pueden llegar fuera de
      // orden. No degradar un grace de cancelación (90d) a 14d ni revivir
      // un org ya `canceled`. Tampoco acortar un grace existente más largo.
      const cur = opts.org || {};
      if (cur.dunningState === "canceled") {
        return { orgId, orgUpdate: null, notification: null, action, skip: true };
      }
      const candidate = makeGraceDate(now, GRACE_DAYS_DEFAULT);
      const existing = cur.graceUntil ? new Date(cur.graceUntil) : null;
      const grace = existing && existing.getTime() > candidate.getTime() ? existing : candidate;
      return {
        orgId,
        orgUpdate: {
          dunningState: "past_due",
          graceUntil: grace,
        },
        notification: {
          title: "Pago rechazado",
          body: `Intentaremos nuevamente. Acceso continuo hasta ${grace.toISOString().slice(0, 10)}.`,
          level: "error",
          href: "/admin/billing",
          kind: "billing.payment_failed",
        },
        action,
        skip: false,
      };
    }

    case "invoice.paid":
    case "invoice.payment_succeeded": {
      if (!orgId) return skip;
      return {
        orgId,
        orgUpdate: { dunningState: null, graceUntil: null },
        notification: null,
        action,
        skip: false,
      };
    }

    case "customer.subscription.deleted":
    case "customer.subscription.paused": {
      if (!orgId) return skip;
      const isDeleted = event.type.endsWith("deleted");
      return {
        orgId,
        orgUpdate: {
          plan: "FREE",
          dunningState: isDeleted ? "canceled" : "paused",
          graceUntil: makeGraceDate(now, GRACE_DAYS_CANCELED),
        },
        notification: {
          title: isDeleted ? "Suscripción cancelada" : "Suscripción pausada",
          body: "Tus datos se conservan 90 días. Reactiva cuando quieras.",
          level: "warn",
          href: "/admin/billing",
          kind: "billing.canceled",
        },
        action,
        skip: false,
      };
    }

    default:
      return skip;
  }
}

export { GRACE_DAYS_DEFAULT, GRACE_DAYS_CANCELED };
