import { describe, it, expect } from "vitest";
import {
  createBucket, refillTokens, canConsume, consume, getRemaining,
  bucketFromQuota, serialize, deserialize,
} from "./token-bucket";

describe("createBucket", () => {
  it("crea bucket lleno", () => {
    const b = createBucket({ capacity: 60, refillRate: 1, now: 1000 });
    expect(b.capacity).toBe(60);
    expect(b.tokens).toBe(60);
    expect(b.refillRate).toBe(1);
    expect(b.lastRefill).toBe(1000);
  });
  it("rechaza capacity <= 0", () => {
    expect(() => createBucket({ capacity: 0, refillRate: 1 })).toThrow();
    expect(() => createBucket({ capacity: -1, refillRate: 1 })).toThrow();
  });
  it("rechaza refillRate <= 0", () => {
    expect(() => createBucket({ capacity: 10, refillRate: 0 })).toThrow();
    expect(() => createBucket({ capacity: 10, refillRate: -5 })).toThrow();
  });
});

describe("refillTokens", () => {
  it("aplica elapsed * refillRate, capped en capacity", () => {
    const b = createBucket({ capacity: 60, refillRate: 1, now: 0 });
    const half = consume(b, 50, 0).bucket; // tokens=10, lastRefill=0
    const refilled = refillTokens(half, 30_000); // 30s × 1 = 30
    expect(refilled.tokens).toBe(40);
    expect(refilled.lastRefill).toBe(30_000);
  });
  it("cap at capacity (no overflow)", () => {
    const b = createBucket({ capacity: 60, refillRate: 1, now: 0 });
    const refilled = refillTokens(b, 1_000_000); // mucho elapsed
    expect(refilled.tokens).toBe(60);
  });
  it("non-object → null", () => {
    expect(refillTokens(null)).toBe(null);
  });
});

describe("canConsume", () => {
  it("true si tokens >= cost", () => {
    const b = createBucket({ capacity: 10, refillRate: 1 });
    expect(canConsume(b, 5)).toBe(true);
    expect(canConsume(b, 10)).toBe(true);
  });
  it("false si tokens < cost", () => {
    const b = createBucket({ capacity: 10, refillRate: 1 });
    expect(canConsume(b, 11)).toBe(false);
  });
  it("null bucket → false", () => {
    expect(canConsume(null, 1)).toBe(false);
  });
});

describe("consume", () => {
  it("ok=true, decrementa tokens", () => {
    const b = createBucket({ capacity: 10, refillRate: 1, now: 0 });
    const r = consume(b, 3, 0);
    expect(r.ok).toBe(true);
    expect(r.bucket.tokens).toBe(7);
  });

  it("ok=false con retryAfter cuando insuficiente", () => {
    const b = createBucket({ capacity: 10, refillRate: 1, now: 0 });
    const drain = consume(b, 10, 0).bucket; // tokens=0
    const r = consume(drain, 5, 0); // necesita 5, tiene 0
    expect(r.ok).toBe(false);
    expect(r.retryAfter).toBe(5); // 5 tokens / 1 token-per-sec = 5s
  });

  it("refill funciona dentro de consume", () => {
    const b = createBucket({ capacity: 10, refillRate: 1, now: 0 });
    const drain = consume(b, 10, 0).bucket; // tokens=0
    // 5s después → 5 tokens disponibles
    const r = consume(drain, 3, 5_000);
    expect(r.ok).toBe(true);
    expect(r.bucket.tokens).toBe(2);
  });

  it("retryAfter ceil (no fractional seconds)", () => {
    const b = createBucket({ capacity: 10, refillRate: 1, now: 0 });
    const drain = consume(b, 10, 0).bucket;
    // necesita 1, tiene 0.5 (después de 500ms refill)
    const r = consume(drain, 1, 500);
    expect(r.ok).toBe(false);
    expect(r.retryAfter).toBe(1); // (1 - 0.5) / 1 = 0.5 → ceil = 1
  });

  it("burst inicial — consume capacity completa", () => {
    const b = createBucket({ capacity: 60, refillRate: 1, now: 0 });
    const r = consume(b, 60, 0);
    expect(r.ok).toBe(true);
    expect(r.bucket.tokens).toBe(0);
  });

  it("cost > capacity → siempre falla", () => {
    const b = createBucket({ capacity: 10, refillRate: 1, now: 0 });
    const r = consume(b, 11, 0);
    expect(r.ok).toBe(false);
  });

  it("cost negativo → ok=false", () => {
    const b = createBucket({ capacity: 10, refillRate: 1, now: 0 });
    const r = consume(b, -1, 0);
    expect(r.ok).toBe(false);
  });

  it("null bucket → ok=false con retryAfter Infinity", () => {
    const r = consume(null, 1);
    expect(r.ok).toBe(false);
    expect(r.retryAfter).toBe(Infinity);
  });
});

describe("getRemaining", () => {
  it("aplica refill virtual sin mutar", () => {
    const b = createBucket({ capacity: 10, refillRate: 1, now: 0 });
    const drain = consume(b, 10, 0).bucket; // tokens=0
    expect(getRemaining(drain, 5_000)).toBe(5);
    // bucket original NO mutado
    expect(drain.tokens).toBe(0);
  });
  it("floor (no fractional)", () => {
    const b = createBucket({ capacity: 10, refillRate: 1, now: 0 });
    const drain = consume(b, 10, 0).bucket;
    expect(getRemaining(drain, 1_500)).toBe(1); // 1.5 → floor 1
  });
});

describe("bucketFromQuota", () => {
  it("perMinute → refillRate = perMinute/60", () => {
    const b = bucketFromQuota({ perMinute: 60 }, 0);
    expect(b.capacity).toBe(60);
    expect(b.refillRate).toBe(1);
  });
  it("perMinute alto", () => {
    const b = bucketFromQuota({ perMinute: 600 }, 0);
    expect(b.capacity).toBe(600);
    expect(b.refillRate).toBe(10);
  });
  it("rechaza quota inválida", () => {
    expect(() => bucketFromQuota({})).toThrow();
    expect(() => bucketFromQuota(null)).toThrow();
    expect(() => bucketFromQuota({ perMinute: 0 })).toThrow();
  });
});

describe("serialize / deserialize", () => {
  it("round-trip", () => {
    const b = createBucket({ capacity: 60, refillRate: 1, now: 12345 });
    const s = serialize(b);
    const back = deserialize(s);
    expect(back).toEqual(b);
  });
  it("formato compacto (no bytes desperdiciados)", () => {
    const b = createBucket({ capacity: 60, refillRate: 1, now: 12345 });
    const s = serialize(b);
    expect(s.length).toBeLessThan(80);
  });
  it("null/invalid → null", () => {
    expect(serialize(null)).toBe(null);
    expect(deserialize(null)).toBe(null);
    expect(deserialize("")).toBe(null);
    expect(deserialize("not-json")).toBe(null);
    expect(deserialize('{"c":"oops"}')).toBe(null);
  });
});

describe("integración — escenario rate-limited", () => {
  it("60 requests/min: 60 OK, 61 bloqueado, recovery a los 60s", () => {
    let bucket = bucketFromQuota({ perMinute: 60 }, 0);
    for (let i = 0; i < 60; i++) {
      const r = consume(bucket, 1, 0);
      expect(r.ok).toBe(true);
      bucket = r.bucket;
    }
    // 61º bloqueado
    const blocked = consume(bucket, 1, 0);
    expect(blocked.ok).toBe(false);
    bucket = blocked.bucket;

    // 1 segundo después → 1 token disponible
    const recovered = consume(bucket, 1, 1000);
    expect(recovered.ok).toBe(true);
  });

  it("burst limit respected — no queue ni acumulación más allá de capacity", () => {
    const b = createBucket({ capacity: 10, refillRate: 1, now: 0 });
    // Esperamos 100s sin uso → bucket lleno cap 10 (no 100)
    expect(refillTokens(b, 100_000).tokens).toBe(10);
  });
});
