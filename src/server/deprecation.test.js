import { describe, it, expect } from "vitest";
import { withDeprecation, sunsetAfter } from "./deprecation";

function mockResp() {
  const headers = new Map();
  return {
    headers: {
      set: (k, v) => headers.set(k, v),
      get: (k) => headers.get(k),
    },
    _map: headers,
  };
}

describe("withDeprecation", () => {
  it("sets Deprecation, Sunset, Link headers", () => {
    const r = mockResp();
    withDeprecation(r, {
      deprecatedOn: "2026-04-01",
      sunsetOn: "2026-10-01",
      successor: "/api/v2/sessions",
      docs: "https://ex.com/changelog",
    });
    expect(r._map.get("Deprecation")).toMatch(/GMT$/);
    expect(r._map.get("Sunset")).toMatch(/GMT$/);
    const link = r._map.get("Link");
    expect(link).toContain(`<\/api\/v2\/sessions>; rel="successor-version"`);
    expect(link).toContain(`rel="deprecation"`);
  });

  it("appends to existing Link header", () => {
    const r = mockResp();
    r.headers.set("Link", `</previous>; rel="prev"`);
    withDeprecation(r, { successor: "/api/v2/x" });
    expect(r._map.get("Link")).toMatch(/^<\/previous>; rel="prev", </);
  });

  it("is a no-op when response is null", () => {
    expect(() => withDeprecation(null, { sunsetOn: "2026-01-01" })).not.toThrow();
  });
});

describe("sunsetAfter", () => {
  it("throws if <6 months notice", () => {
    expect(() => sunsetAfter(3)).toThrow(/6 months/);
  });
  it("returns a future date ≥6 months ahead", () => {
    const base = new Date("2026-01-15");
    const s = sunsetAfter(6, base);
    expect(s.getFullYear()).toBe(2026);
    expect(s.getMonth()).toBe(6); // julio
  });
});
