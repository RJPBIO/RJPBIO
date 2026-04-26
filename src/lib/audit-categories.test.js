import { describe, it, expect } from "vitest";
import {
  AUDIT_CATEGORIES, matchActionCategory, isInCategory, countByCategory,
} from "./audit-categories";

describe("matchActionCategory", () => {
  it("auth.* → 'auth'", () => {
    expect(matchActionCategory("auth.signin")).toBe("auth");
    expect(matchActionCategory("auth.signout")).toBe("auth");
    expect(matchActionCategory("auth.mfa.verify")).toBe("auth");
  });

  it("billing.* → 'billing'", () => {
    expect(matchActionCategory("billing.checkout.start")).toBe("billing");
    expect(matchActionCategory("billing.invoice.payment_failed")).toBe("billing");
    expect(matchActionCategory("billing.customer.subscription.updated")).toBe("billing");
  });

  it("invitation.* + member.* → 'members'", () => {
    expect(matchActionCategory("invitation.revoked")).toBe("members");
    expect(matchActionCategory("invitation.resent")).toBe("members");
    expect(matchActionCategory("member.joined")).toBe("members");
    expect(matchActionCategory("user.deletion.requested")).toBe("members");
  });

  it("org.sso.* → 'sso' (no 'org')", () => {
    expect(matchActionCategory("org.sso.configured")).toBe("sso");
    expect(matchActionCategory("org.sso.disabled")).toBe("sso");
  });

  it("user.data.exported (exact) → 'data'", () => {
    expect(matchActionCategory("user.data.exported")).toBe("data");
    expect(matchActionCategory("org.data.exported")).toBe("data");
    expect(matchActionCategory("nom35.aggregate.exported")).toBe("data");
    expect(matchActionCategory("sync.outbox.drain")).toBe("data");
    expect(matchActionCategory("sync.state.read")).toBe("data");
  });

  it("session.* → 'session'", () => {
    expect(matchActionCategory("session.complete")).toBe("session");
    expect(matchActionCategory("api.session.create")).toBe("session");
  });

  it("webhook.* → 'webhook'", () => {
    expect(matchActionCategory("webhook.failed")).toBe("webhook");
    expect(matchActionCategory("api.webhook.delivered")).toBe("webhook");
  });

  it("org.created (exact) → 'org', no 'sso'", () => {
    expect(matchActionCategory("org.created")).toBe("org");
    expect(matchActionCategory("org.personal.created")).toBe("org");
  });

  it("action desconocido → null", () => {
    expect(matchActionCategory("custom.event")).toBeNull();
    expect(matchActionCategory("foo.bar")).toBeNull();
    expect(matchActionCategory("")).toBeNull();
    expect(matchActionCategory(null)).toBeNull();
    expect(matchActionCategory(undefined)).toBeNull();
    expect(matchActionCategory(42)).toBeNull();
  });

  it("primer match wins (orden de AUDIT_CATEGORIES)", () => {
    // user.deletion.requested matches members (user.deletion. prefix);
    // user.data.exported matches data (exact). Verificamos que no se
    // confundan.
    expect(matchActionCategory("user.deletion.requested")).toBe("members");
    expect(matchActionCategory("user.data.exported")).toBe("data");
  });
});

describe("isInCategory", () => {
  it("categoryId vacío/null → todo pasa (all)", () => {
    expect(isInCategory("auth.signin", "")).toBe(true);
    expect(isInCategory("billing.x", null)).toBe(true);
    expect(isInCategory("anything", undefined)).toBe(true);
  });

  it("categoryId match → true", () => {
    expect(isInCategory("auth.signin", "auth")).toBe(true);
    expect(isInCategory("billing.checkout.start", "billing")).toBe(true);
  });

  it("categoryId mismatch → false", () => {
    expect(isInCategory("auth.signin", "billing")).toBe(false);
    expect(isInCategory("billing.x", "sso")).toBe(false);
  });

  it("action desconocido + cualquier category → false (excepto all)", () => {
    expect(isInCategory("unknown.event", "auth")).toBe(false);
    expect(isInCategory("unknown.event", "")).toBe(true); // all
  });
});

describe("countByCategory", () => {
  it("cuenta correctamente cada categoría", () => {
    const rows = [
      { action: "auth.signin" },
      { action: "auth.signin" },
      { action: "billing.checkout.start" },
      { action: "invitation.revoked" },
      { action: "org.sso.configured" },
      { action: "session.complete" },
      { action: "session.complete" },
      { action: "session.complete" },
    ];
    const c = countByCategory(rows);
    expect(c.auth).toBe(2);
    expect(c.billing).toBe(1);
    expect(c.members).toBe(1);
    expect(c.sso).toBe(1);
    expect(c.session).toBe(3);
  });

  it("acciones desconocidas → 'other'", () => {
    const rows = [
      { action: "auth.signin" },
      { action: "unknown.event" },
      { action: "weird.thing" },
    ];
    const c = countByCategory(rows);
    expect(c.auth).toBe(1);
    expect(c.other).toBe(2);
  });

  it("rows vacío → todas las categorías = 0", () => {
    const c = countByCategory([]);
    for (const cat of AUDIT_CATEGORIES) {
      expect(c[cat.id]).toBe(0);
    }
    expect(c.other).toBe(0);
  });

  it("rows null/undefined → 0 sin throw", () => {
    expect(countByCategory(null).auth).toBe(0);
    expect(countByCategory(undefined).auth).toBe(0);
  });

  it("rows con action ausente cuentan como 'other'", () => {
    const c = countByCategory([{}, { action: null }, { foo: 1 }]);
    expect(c.other).toBe(3);
  });
});

describe("AUDIT_CATEGORIES schema", () => {
  it("cada categoría tiene id, label, prefixes, description", () => {
    for (const cat of AUDIT_CATEGORIES) {
      expect(cat.id).toBeTruthy();
      expect(typeof cat.id).toBe("string");
      expect(cat.label).toBeTruthy();
      expect(Array.isArray(cat.prefixes)).toBe(true);
      expect(cat.prefixes.length).toBeGreaterThan(0);
      expect(cat.description).toBeTruthy();
    }
  });

  it("ids únicos", () => {
    const ids = AUDIT_CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("incluye categorías esenciales para B2B compliance", () => {
    const ids = AUDIT_CATEGORIES.map((c) => c.id);
    expect(ids).toContain("auth");
    expect(ids).toContain("billing");
    expect(ids).toContain("sso");
    expect(ids).toContain("data");
    expect(ids).toContain("members");
  });
});
