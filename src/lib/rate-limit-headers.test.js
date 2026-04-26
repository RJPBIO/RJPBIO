import { describe, it, expect } from "vitest";
import {
  buildRateLimitHeaders, applyRateLimitHeaders, rateLimitHeadersInit,
} from "./rate-limit-headers";

describe("buildRateLimitHeaders", () => {
  it("policy + remaining + reset → 2 headers", () => {
    const h = buildRateLimitHeaders({
      policy: { limit: 60, window: 60 },
      remaining: 23, reset: 17,
    });
    expect(h["RateLimit-Policy"]).toBe("60;w=60");
    expect(h["RateLimit"]).toBe("limit=60, remaining=23, reset=17");
  });

  it("incluye burst si presente", () => {
    const h = buildRateLimitHeaders({
      policy: { limit: 60, window: 60, burst: 100 },
      remaining: 5, reset: 30,
    });
    expect(h["RateLimit-Policy"]).toBe("60;w=60;burst=100");
  });

  it("Retry-After cuando se bloquea", () => {
    const h = buildRateLimitHeaders({
      policy: { limit: 60, window: 60 },
      retryAfter: 42,
    });
    expect(h["Retry-After"]).toBe("42");
  });

  it("ceil de retryAfter (no fractional)", () => {
    const h = buildRateLimitHeaders({ retryAfter: 0.3 });
    expect(h["Retry-After"]).toBe("1");
  });

  it("floor de remaining (no fractional)", () => {
    const h = buildRateLimitHeaders({
      policy: { limit: 60, window: 60 },
      remaining: 23.7, reset: 5,
    });
    expect(h["RateLimit"]).toContain("remaining=23");
  });

  it("clamp negativos a 0", () => {
    const h = buildRateLimitHeaders({
      policy: { limit: 60, window: 60 },
      remaining: -5, reset: -3, retryAfter: -2,
    });
    expect(h["RateLimit"]).toBe("limit=60, remaining=0, reset=0");
    expect(h["Retry-After"]).toBe("0");
  });

  it("sin policy → no RateLimit ni RateLimit-Policy", () => {
    const h = buildRateLimitHeaders({ remaining: 5, reset: 10 });
    expect(h["RateLimit-Policy"]).toBeUndefined();
    expect(h["RateLimit"]).toBeUndefined();
  });

  it("input vacío → {}", () => {
    expect(buildRateLimitHeaders({})).toEqual({});
    expect(buildRateLimitHeaders()).toEqual({});
  });

  it("policy sin limit/window válidos → no header", () => {
    expect(buildRateLimitHeaders({ policy: {} })["RateLimit-Policy"]).toBeUndefined();
    expect(buildRateLimitHeaders({ policy: { limit: "a" } })["RateLimit-Policy"]).toBeUndefined();
  });
});

describe("applyRateLimitHeaders", () => {
  it("usa Headers.set si disponible", () => {
    const headers = new Map();
    headers.set = headers.set.bind(headers); // Map.set fits the API
    applyRateLimitHeaders(headers, {
      policy: { limit: 60, window: 60 },
      remaining: 10, reset: 5,
    });
    expect(headers.get("RateLimit-Policy")).toBe("60;w=60");
    expect(headers.get("RateLimit")).toContain("remaining=10");
  });

  it("usa setHeader si Map-like ausente (Node-style)", () => {
    const calls = [];
    const target = { setHeader: (k, v) => calls.push([k, v]) };
    applyRateLimitHeaders(target, { retryAfter: 30 });
    expect(calls).toContainEqual(["Retry-After", "30"]);
  });

  it("target null → null", () => {
    expect(applyRateLimitHeaders(null, { retryAfter: 5 })).toBe(null);
  });
});

describe("rateLimitHeadersInit", () => {
  it("retorna shape para Response constructor", () => {
    const init = rateLimitHeadersInit({
      policy: { limit: 60, window: 60 },
      retryAfter: 17,
    });
    expect(init.headers["Retry-After"]).toBe("17");
    expect(init.headers["RateLimit-Policy"]).toBe("60;w=60");
  });
});
