import { describe, it, expect } from "vitest";
import {
  parseDeliveryQuery, matchesDeliveryQuery, deliveryMatchesString,
  statusTone, summarizeDeliveries,
  SEARCH_OPERATORS,
} from "./webhook-delivery-search";

describe("parseDeliveryQuery", () => {
  it("vacío → isEmpty", () => {
    expect(parseDeliveryQuery("").isEmpty).toBe(true);
    expect(parseDeliveryQuery(null).isEmpty).toBe(true);
  });
  it("operadores reconocidos", () => {
    const r = parseDeliveryQuery("event:session.completed status:200 has:delivered");
    expect(r.operators.event).toBe("session.completed");
    expect(r.operators.status).toBe("200");
    expect(r.operators.has).toBe("delivered");
  });
  it("plain text mezclado con operadores", () => {
    const r = parseDeliveryQuery("status:5xx timeout error");
    expect(r.operators.status).toBe("5xx");
    expect(r.text).toBe("timeout error");
  });
  it("expone SEARCH_OPERATORS", () => {
    expect(SEARCH_OPERATORS).toContain("event");
    expect(SEARCH_OPERATORS).toContain("status");
    expect(SEARCH_OPERATORS).toContain("has");
    expect(SEARCH_OPERATORS).toContain("attempts");
  });
});

describe("matchesDeliveryQuery — event", () => {
  const d = { event: "session.completed", status: 200, attempts: 1, deliveredAt: new Date() };
  it("exact match", () => {
    expect(deliveryMatchesString(d, "event:session.completed")).toBe(true);
    expect(deliveryMatchesString(d, "event:session.failed")).toBe(false);
  });
  it("wildcard prefix", () => {
    expect(deliveryMatchesString(d, "event:session.*")).toBe(true);
    expect(deliveryMatchesString(d, "event:billing.*")).toBe(false);
  });
});

describe("matchesDeliveryQuery — status", () => {
  it("exact code", () => {
    expect(deliveryMatchesString({ status: 200 }, "status:200")).toBe(true);
    expect(deliveryMatchesString({ status: 200 }, "status:201")).toBe(false);
  });
  it("range 2xx / 4xx / 5xx", () => {
    expect(deliveryMatchesString({ status: 201 }, "status:2xx")).toBe(true);
    expect(deliveryMatchesString({ status: 299 }, "status:2xx")).toBe(true);
    expect(deliveryMatchesString({ status: 300 }, "status:2xx")).toBe(false);
    expect(deliveryMatchesString({ status: 503 }, "status:5xx")).toBe(true);
    expect(deliveryMatchesString({ status: 404 }, "status:4xx")).toBe(true);
    expect(deliveryMatchesString({ status: 404 }, "status:5xx")).toBe(false);
  });
  it("status null/undefined → no match", () => {
    expect(deliveryMatchesString({ status: null }, "status:200")).toBe(false);
    expect(deliveryMatchesString({}, "status:5xx")).toBe(false);
  });
});

describe("matchesDeliveryQuery — has", () => {
  it("has:error → tiene error string", () => {
    expect(deliveryMatchesString({ error: "ETIMEDOUT" }, "has:error")).toBe(true);
    expect(deliveryMatchesString({ error: "" }, "has:error")).toBe(false);
    expect(deliveryMatchesString({}, "has:error")).toBe(false);
  });
  it("has:delivered → deliveredAt + 2xx", () => {
    expect(deliveryMatchesString({
      status: 200, deliveredAt: new Date(),
    }, "has:delivered")).toBe(true);
    expect(deliveryMatchesString({
      status: 500, deliveredAt: new Date(),
    }, "has:delivered")).toBe(false);
    expect(deliveryMatchesString({
      status: 200, deliveredAt: null,
    }, "has:delivered")).toBe(false);
  });
  it("has:failed → no delivered O status >= 400", () => {
    expect(deliveryMatchesString({ deliveredAt: null }, "has:failed")).toBe(true);
    expect(deliveryMatchesString({
      status: 500, deliveredAt: new Date(),
    }, "has:failed")).toBe(true);
    expect(deliveryMatchesString({
      status: 200, deliveredAt: new Date(),
    }, "has:failed")).toBe(false);
  });
});

describe("matchesDeliveryQuery — attempts", () => {
  it("> N", () => {
    expect(deliveryMatchesString({ attempts: 5 }, "attempts:>3")).toBe(true);
    expect(deliveryMatchesString({ attempts: 3 }, "attempts:>3")).toBe(false);
  });
  it("< N", () => {
    expect(deliveryMatchesString({ attempts: 2 }, "attempts:<5")).toBe(true);
    expect(deliveryMatchesString({ attempts: 5 }, "attempts:<5")).toBe(false);
  });
  it("= N (default no operador)", () => {
    expect(deliveryMatchesString({ attempts: 3 }, "attempts:3")).toBe(true);
    expect(deliveryMatchesString({ attempts: 3 }, "attempts:=3")).toBe(true);
    expect(deliveryMatchesString({ attempts: 4 }, "attempts:3")).toBe(false);
  });
  it("invalid pattern → false", () => {
    expect(deliveryMatchesString({ attempts: 3 }, "attempts:abc")).toBe(false);
  });
});

describe("matchesDeliveryQuery — plain text", () => {
  it("substring en event/error/status", () => {
    expect(deliveryMatchesString({ event: "x.y", error: "ETIMEDOUT" }, "ETIMEDOUT")).toBe(true);
    expect(deliveryMatchesString({ event: "session.completed" }, "session")).toBe(true);
    expect(deliveryMatchesString({ status: 500 }, "500")).toBe(true);
  });
  it("case insensitive", () => {
    expect(deliveryMatchesString({ event: "Session.Completed" }, "session")).toBe(true);
  });
  it("non-match", () => {
    expect(deliveryMatchesString({ event: "x" }, "yz")).toBe(false);
  });
});

describe("AND combination", () => {
  it("event + status + has", () => {
    const d = { event: "session.completed", status: 200, deliveredAt: new Date() };
    expect(deliveryMatchesString(d, "event:session.* status:2xx has:delivered")).toBe(true);
    expect(deliveryMatchesString(d, "event:session.* status:5xx has:delivered")).toBe(false);
  });
});

describe("statusTone", () => {
  it("delivered + 2xx → success", () => {
    expect(statusTone({ status: 200, deliveredAt: new Date() })).toBe("success");
  });
  it("5xx → danger", () => {
    expect(statusTone({ status: 503 })).toBe("danger");
  });
  it("4xx → warn", () => {
    expect(statusTone({ status: 404 })).toBe("warn");
  });
  it("error sin status → danger", () => {
    expect(statusTone({ error: "ETIMEDOUT" })).toBe("danger");
  });
  it("pending (no deliveredAt, no error) → warn", () => {
    expect(statusTone({ deliveredAt: null })).toBe("warn");
  });
  it("null delivery → neutral", () => {
    expect(statusTone(null)).toBe("neutral");
  });
});

describe("summarizeDeliveries", () => {
  it("breakdown delivered/failed/pending", () => {
    const r = summarizeDeliveries([
      { status: 200, deliveredAt: new Date() }, // delivered
      { status: 200, deliveredAt: new Date() }, // delivered
      { status: 503 }, // failed
      { error: "ETIMEDOUT" }, // failed (error)
      { deliveredAt: null }, // pending
    ]);
    expect(r.total).toBe(5);
    expect(r.delivered).toBe(2);
    expect(r.failed).toBe(2);
    expect(r.pending).toBe(1);
  });
  it("non-array → zeros", () => {
    expect(summarizeDeliveries(null)).toEqual({
      total: 0, delivered: 0, failed: 0, pending: 0,
    });
  });
});

describe("matchesDeliveryQuery — defensiva", () => {
  it("delivery null → false (excepto query vacío)", () => {
    expect(matchesDeliveryQuery(null, parseDeliveryQuery("event:x"))).toBe(false);
  });
  it("query null → match", () => {
    expect(matchesDeliveryQuery({}, null)).toBe(true);
  });
  it("query vacío → match all", () => {
    expect(deliveryMatchesString({ event: "x" }, "")).toBe(true);
  });
});
