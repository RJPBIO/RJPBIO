import { describe, it, expect } from "vitest";
import { resolveStripeEvent, GRACE_DAYS_DEFAULT, GRACE_DAYS_CANCELED } from "./billing-webhook";

const FIXED_NOW = new Date("2026-04-26T12:00:00Z").getTime();

function ev(type, dataObj = {}) {
  return { type, id: `evt_test_${type}`, data: { object: dataObj } };
}

describe("billing-webhook — resolveStripeEvent", () => {
  describe("skip cases", () => {
    it("event sin type → skip", () => {
      const r = resolveStripeEvent({});
      expect(r.skip).toBe(true);
    });

    it("event type desconocido → skip", () => {
      const r = resolveStripeEvent(ev("customer.unknown.event"));
      expect(r.skip).toBe(true);
      expect(r.action).toBe("billing.customer.unknown.event");
    });

    it("subscription.created sin orgId en metadata → skip", () => {
      const r = resolveStripeEvent(ev("customer.subscription.created", { id: "sub_x" }));
      expect(r.skip).toBe(true);
    });

    it("invoice.payment_failed sin orgId → skip", () => {
      const r = resolveStripeEvent(ev("invoice.payment_failed", {}));
      expect(r.skip).toBe(true);
    });
  });

  describe("checkout.session.completed", () => {
    it("crea suscripción con plan + seats + trialEnd", () => {
      const trialEndUnix = Math.floor(new Date("2026-05-10T00:00:00Z").getTime() / 1000);
      const r = resolveStripeEvent(
        ev("checkout.session.completed", {
          id: "sub_abc",
          metadata: { orgId: "org_123", plan: "PRO" },
          items: { data: [{ quantity: 1 }] },
          trial_end: trialEndUnix,
          status: "trialing",
        }),
        { now: FIXED_NOW }
      );
      expect(r.skip).toBe(false);
      expect(r.orgId).toBe("org_123");
      expect(r.orgUpdate).toMatchObject({
        stripeSub: "sub_abc",
        plan: "PRO",
        seats: 1,
        dunningState: null,
        graceUntil: null,
      });
      expect(r.orgUpdate.trialEndsAt).toBeInstanceOf(Date);
      expect(r.orgUpdate.trialEndsAt.toISOString()).toBe("2026-05-10T00:00:00.000Z");
    });

    it("plan default a STARTER si no viene en metadata", () => {
      const r = resolveStripeEvent(
        ev("checkout.session.completed", {
          id: "sub_x",
          metadata: { orgId: "org_x" },
          items: { data: [{ quantity: 5 }] },
        })
      );
      expect(r.orgUpdate.plan).toBe("STARTER");
    });

    it("seats default 5 si no viene", () => {
      const r = resolveStripeEvent(
        ev("checkout.session.completed", {
          id: "sub_x",
          metadata: { orgId: "org_x", plan: "STARTER" },
        })
      );
      expect(r.orgUpdate.seats).toBe(5);
    });

    it("status past_due al subscribir → marca dunning + grace", () => {
      const r = resolveStripeEvent(
        ev("checkout.session.completed", {
          id: "sub_x",
          metadata: { orgId: "org_x", plan: "STARTER" },
          items: { data: [{ quantity: 5 }] },
          status: "past_due",
        }),
        { now: FIXED_NOW }
      );
      expect(r.orgUpdate.dunningState).toBe("past_due");
      expect(r.orgUpdate.graceUntil).toBeInstanceOf(Date);
      expect(r.orgUpdate.graceUntil.getTime()).toBe(FIXED_NOW + GRACE_DAYS_DEFAULT * 86400000);
    });

    it("subscription_details.metadata como fallback de orgId", () => {
      const r = resolveStripeEvent(
        ev("customer.subscription.updated", {
          id: "sub_y",
          subscription_details: { metadata: { orgId: "org_via_subdetails" } },
          items: { data: [{ quantity: 5 }] },
        })
      );
      expect(r.orgId).toBe("org_via_subdetails");
    });

    it("trial_end null → trialEndsAt null (sin trial)", () => {
      const r = resolveStripeEvent(
        ev("customer.subscription.updated", {
          id: "sub_x",
          metadata: { orgId: "org_x", plan: "STARTER" },
          items: { data: [{ quantity: 5 }] },
        })
      );
      expect(r.orgUpdate.trialEndsAt).toBeNull();
    });
  });

  describe("trial_will_end", () => {
    it("dispara notification sin orgUpdate", () => {
      const r = resolveStripeEvent(
        ev("customer.subscription.trial_will_end", { metadata: { orgId: "org_x" } })
      );
      expect(r.skip).toBe(false);
      expect(r.orgUpdate).toBeNull();
      expect(r.notification.kind).toBe("billing.trial_end_soon");
      expect(r.notification.level).toBe("warn");
    });
  });

  describe("invoice.payment_failed", () => {
    it("marca past_due + grace + notification error", () => {
      const r = resolveStripeEvent(
        ev("invoice.payment_failed", { metadata: { orgId: "org_x" } }),
        { now: FIXED_NOW }
      );
      expect(r.orgUpdate.dunningState).toBe("past_due");
      expect(r.orgUpdate.graceUntil.getTime()).toBe(FIXED_NOW + GRACE_DAYS_DEFAULT * 86400000);
      expect(r.notification.level).toBe("error");
      expect(r.notification.kind).toBe("billing.payment_failed");
      expect(r.notification.body).toContain("2026-05-10"); // grace date YYYY-MM-DD
    });
  });

  describe("invoice.paid / payment_succeeded", () => {
    it("limpia dunning state", () => {
      const r = resolveStripeEvent(
        ev("invoice.paid", { metadata: { orgId: "org_x" } })
      );
      expect(r.orgUpdate).toEqual({ dunningState: null, graceUntil: null });
      expect(r.notification).toBeNull();
    });

    it("payment_succeeded actúa igual que paid", () => {
      const r = resolveStripeEvent(
        ev("invoice.payment_succeeded", { metadata: { orgId: "org_x" } })
      );
      expect(r.orgUpdate.dunningState).toBeNull();
      expect(r.orgUpdate.graceUntil).toBeNull();
    });
  });

  describe("subscription.deleted / paused", () => {
    it("deleted → revierte a FREE + canceled state + 90d grace", () => {
      const r = resolveStripeEvent(
        ev("customer.subscription.deleted", { metadata: { orgId: "org_x" } }),
        { now: FIXED_NOW }
      );
      expect(r.orgUpdate.plan).toBe("FREE");
      expect(r.orgUpdate.dunningState).toBe("canceled");
      expect(r.orgUpdate.graceUntil.getTime()).toBe(FIXED_NOW + GRACE_DAYS_CANCELED * 86400000);
      expect(r.notification.title).toBe("Suscripción cancelada");
    });

    it("paused → revierte a FREE + paused state + 90d grace", () => {
      const r = resolveStripeEvent(
        ev("customer.subscription.paused", { metadata: { orgId: "org_x" } })
      );
      expect(r.orgUpdate.plan).toBe("FREE");
      expect(r.orgUpdate.dunningState).toBe("paused");
      expect(r.notification.title).toBe("Suscripción pausada");
    });
  });

  describe("audit action format", () => {
    it("action = 'billing.{event.type}'", () => {
      const r = resolveStripeEvent(
        ev("invoice.payment_failed", { metadata: { orgId: "org_x" } })
      );
      expect(r.action).toBe("billing.invoice.payment_failed");
    });

    it("action incluye event.type aunque skip", () => {
      const r = resolveStripeEvent(ev("foo.bar.baz"));
      expect(r.action).toBe("billing.foo.bar.baz");
      expect(r.skip).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("plan en metadata es uppercased", () => {
      const r = resolveStripeEvent(
        ev("customer.subscription.created", {
          id: "sub_x",
          metadata: { orgId: "org_x", plan: "pro" },
          items: { data: [{ quantity: 1 }] },
        })
      );
      expect(r.orgUpdate.plan).toBe("PRO");
    });

    it("orgId desde subscription_details fallback funciona en deleted", () => {
      const r = resolveStripeEvent(
        ev("customer.subscription.deleted", {
          subscription_details: { metadata: { orgId: "org_y" } },
        })
      );
      expect(r.orgId).toBe("org_y");
      expect(r.orgUpdate.plan).toBe("FREE");
    });

    it("fechas de grace son determinísticas con `now` injection", () => {
      const r1 = resolveStripeEvent(
        ev("invoice.payment_failed", { metadata: { orgId: "org_x" } }),
        { now: 1000 }
      );
      const r2 = resolveStripeEvent(
        ev("invoice.payment_failed", { metadata: { orgId: "org_x" } }),
        { now: 1000 }
      );
      expect(r1.orgUpdate.graceUntil.getTime()).toBe(r2.orgUpdate.graceUntil.getTime());
    });
  });
});
