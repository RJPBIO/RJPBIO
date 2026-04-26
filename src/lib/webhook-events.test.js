import { describe, it, expect } from "vitest";
import {
  WEBHOOK_EVENTS,
  groupByCategory,
  getEvent,
  validateSubscription,
  validateSubscriptions,
  listGroups,
  groupLabel,
  serializeSample,
  listEventIds,
} from "./webhook-events";

describe("WEBHOOK_EVENTS catalog", () => {
  it("array no vacío", () => {
    expect(Array.isArray(WEBHOOK_EVENTS)).toBe(true);
    expect(WEBHOOK_EVENTS.length).toBeGreaterThan(5);
  });
  it("frozen (no mutable)", () => {
    expect(Object.isFrozen(WEBHOOK_EVENTS)).toBe(true);
  });
  it("cada evento tiene id/group/description/since/samplePayload", () => {
    for (const ev of WEBHOOK_EVENTS) {
      expect(typeof ev.id).toBe("string");
      expect(ev.id.length).toBeGreaterThan(0);
      expect(typeof ev.group).toBe("string");
      expect(typeof ev.description).toBe("string");
      expect(ev.description.length).toBeGreaterThan(5);
      expect(typeof ev.since).toBe("string");
      expect(typeof ev.samplePayload).toBe("object");
      expect(ev.samplePayload).not.toBeNull();
    }
  });
  it("ids únicos", () => {
    const ids = WEBHOOK_EVENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("group coincide con prefijo del id", () => {
    for (const ev of WEBHOOK_EVENTS) {
      // ping es excepción (group:webhook, id:ping)
      if (ev.id === "ping") {
        expect(ev.group).toBe("webhook");
        continue;
      }
      const prefix = ev.id.split(".")[0];
      expect(ev.group).toBe(prefix);
    }
  });
  it("contiene eventos canónicos del producto", () => {
    const ids = WEBHOOK_EVENTS.map((e) => e.id);
    expect(ids).toContain("session.completed");
    expect(ids).toContain("session.started");
    expect(ids).toContain("member.added");
    expect(ids).toContain("member.removed");
    expect(ids).toContain("station.tap");
    expect(ids).toContain("billing.overage");
    expect(ids).toContain("webhook.failed");
    expect(ids).toContain("ping");
  });
});

describe("getEvent", () => {
  it("lookup exitoso", () => {
    const ev = getEvent("session.completed");
    expect(ev).toBeTruthy();
    expect(ev.id).toBe("session.completed");
    expect(ev.group).toBe("session");
  });
  it("desconocido → null", () => {
    expect(getEvent("nonexistent.event")).toBeNull();
  });
  it("input inválido → null", () => {
    expect(getEvent(null)).toBeNull();
    expect(getEvent("")).toBeNull();
    expect(getEvent(123)).toBeNull();
    expect(getEvent(undefined)).toBeNull();
  });
});

describe("validateSubscription", () => {
  it("evento válido del catálogo → ok", () => {
    expect(validateSubscription("session.completed").ok).toBe(true);
  });
  it("wildcard * → ok", () => {
    expect(validateSubscription("*").ok).toBe(true);
  });
  it("evento desconocido → ok=false, error=unknown_event", () => {
    const r = validateSubscription("foo.bar");
    expect(r.ok).toBe(false);
    expect(r.error).toBe("unknown_event");
  });
  it("input inválido → ok=false, error=missing_id", () => {
    expect(validateSubscription(null).ok).toBe(false);
    expect(validateSubscription("").ok).toBe(false);
    expect(validateSubscription(undefined).ok).toBe(false);
    expect(validateSubscription(null).error).toBe("missing_id");
  });
});

describe("validateSubscriptions", () => {
  it("todos válidos → ok=true, invalid=[]", () => {
    const r = validateSubscriptions(["session.completed", "member.added", "*"]);
    expect(r.ok).toBe(true);
    expect(r.invalid).toEqual([]);
  });
  it("alguno inválido → ok=false, lista invalid", () => {
    const r = validateSubscriptions(["session.completed", "foo.bar", "baz.qux"]);
    expect(r.ok).toBe(false);
    expect(r.invalid).toEqual(["foo.bar", "baz.qux"]);
  });
  it("no array → ok=false, invalid=[]", () => {
    expect(validateSubscriptions(null).ok).toBe(false);
    expect(validateSubscriptions("session.completed").ok).toBe(false);
  });
  it("array vacío → ok=true (no invalidos)", () => {
    expect(validateSubscriptions([]).ok).toBe(true);
  });
});

describe("groupByCategory", () => {
  it("agrupa por group respetando orden", () => {
    const r = groupByCategory();
    const keys = Object.keys(r);
    // session debe ir antes de billing
    expect(keys.indexOf("session")).toBeLessThan(keys.indexOf("billing"));
    expect(r.session.length).toBeGreaterThan(0);
    expect(r.member.length).toBeGreaterThan(0);
  });
  it("cada grupo solo contiene eventos de su grupo", () => {
    const r = groupByCategory();
    for (const [g, list] of Object.entries(r)) {
      for (const ev of list) {
        expect(ev.group).toBe(g);
      }
    }
  });
  it("recibe array custom", () => {
    const r = groupByCategory([
      { id: "x.a", group: "x", description: "x", since: "v1", samplePayload: {} },
      { id: "y.a", group: "y", description: "y", since: "v1", samplePayload: {} },
    ]);
    expect(r.x.length).toBe(1);
    expect(r.y.length).toBe(1);
  });
  it("evento sin group → ignora", () => {
    const r = groupByCategory([
      { id: "x.a", description: "x" },
      null,
      { id: "y.a", group: "y", description: "y" },
    ]);
    expect(r.y.length).toBe(1);
    expect(r.x).toBeUndefined();
  });
});

describe("listGroups / groupLabel", () => {
  it("listGroups → array no vacío con session/member/billing", () => {
    const groups = listGroups();
    expect(groups).toContain("session");
    expect(groups).toContain("member");
    expect(groups).toContain("billing");
  });
  it("groupLabel devuelve ES label conocido", () => {
    expect(groupLabel("session")).toBe("Sesiones");
    expect(groupLabel("billing")).toBe("Billing");
    expect(groupLabel("compliance")).toBe("Compliance");
  });
  it("groupLabel desconocido → fallback al raw", () => {
    expect(groupLabel("xyz")).toBe("xyz");
  });
});

describe("serializeSample", () => {
  it("acepta id string", () => {
    const s = serializeSample("session.completed");
    expect(typeof s).toBe("string");
    expect(s.length).toBeGreaterThan(0);
    // pretty-printed (incluye indent)
    expect(s).toContain("\n");
    expect(s).toContain("sessionId");
  });
  it("acepta objeto event", () => {
    const ev = getEvent("ping");
    const s = serializeSample(ev);
    expect(s).toContain("hookId");
  });
  it("id desconocido → ''", () => {
    expect(serializeSample("nonexistent")).toBe("");
  });
  it("event sin samplePayload → ''", () => {
    expect(serializeSample({ id: "x", group: "x" })).toBe("");
  });
  it("null/undefined → ''", () => {
    expect(serializeSample(null)).toBe("");
    expect(serializeSample(undefined)).toBe("");
  });
});

describe("listEventIds", () => {
  it("devuelve solo strings", () => {
    const ids = listEventIds();
    expect(Array.isArray(ids)).toBe(true);
    expect(ids.length).toBe(WEBHOOK_EVENTS.length);
    for (const id of ids) expect(typeof id).toBe("string");
  });
});
