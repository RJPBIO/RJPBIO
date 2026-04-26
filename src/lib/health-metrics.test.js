import { describe, it, expect } from "vitest";
import {
  aggregateAuditEvents, computeWebhookSuccessRate, computeAuthSuccessRate,
  summarizeService, bucketByHour, formatLatency, formatCounter,
  overallSystemHealth,
} from "./health-metrics";

describe("aggregateAuditEvents", () => {
  it("cuenta sin filter → todo", () => {
    const r = aggregateAuditEvents([
      { action: "auth.signin" },
      { action: "auth.signout" },
      { action: "webhook.delivered" },
    ]);
    expect(r.total).toBe(3);
    expect(r.byAction).toEqual({
      "auth.signin": 1, "auth.signout": 1, "webhook.delivered": 1,
    });
  });

  it("filtra por prefix", () => {
    const r = aggregateAuditEvents([
      { action: "auth.signin" },
      { action: "auth.signin" },
      { action: "webhook.delivered" },
    ], "auth.");
    expect(r.total).toBe(2);
    expect(r.byAction["auth.signin"]).toBe(2);
    expect(r.byAction["webhook.delivered"]).toBeUndefined();
  });

  it("non-array → totals 0", () => {
    expect(aggregateAuditEvents(null)).toEqual({ total: 0, byAction: {} });
  });

  it("rows sin action se ignoran", () => {
    expect(aggregateAuditEvents([{}, { action: null }, { action: "x" }]).total).toBe(1);
  });
});

describe("computeWebhookSuccessRate", () => {
  it("cuenta delivered (con deliveredAt) vs failed", () => {
    const r = computeWebhookSuccessRate([
      { deliveredAt: new Date() },
      { deliveredAt: new Date() },
      { deliveredAt: null },
      { deliveredAt: null },
      { deliveredAt: null },
    ]);
    expect(r.success).toBe(2);
    expect(r.failed).toBe(3);
    expect(r.rate).toBe(40);
  });

  it("100% success", () => {
    expect(computeWebhookSuccessRate([
      { deliveredAt: new Date() }, { deliveredAt: new Date() },
    ]).rate).toBe(100);
  });

  it("0 entries → rate null", () => {
    expect(computeWebhookSuccessRate([])).toEqual({
      rate: null, total: 0, success: 0, failed: 0,
    });
  });

  it("non-array → rate null", () => {
    expect(computeWebhookSuccessRate(null).rate).toBe(null);
  });
});

describe("computeAuthSuccessRate", () => {
  it("calcula ratio signin / (signin + failed)", () => {
    const r = computeAuthSuccessRate([
      { action: "auth.signin" },
      { action: "auth.signin" },
      { action: "auth.signin" },
      { action: "auth.signin.failed" },
      { action: "auth.error" },
    ]);
    expect(r.signins).toBe(3);
    expect(r.failures).toBe(2);
    expect(r.rate).toBe(60);
  });

  it("ignora otros actions", () => {
    const r = computeAuthSuccessRate([
      { action: "auth.signin" },
      { action: "webhook.delivered" },
    ]);
    expect(r.signins).toBe(1);
    expect(r.rate).toBe(100);
  });

  it("vacío → null rate", () => {
    expect(computeAuthSuccessRate([]).rate).toBe(null);
  });
});

describe("summarizeService", () => {
  it("ok=true, latency baja → success", () => {
    expect(summarizeService({ ok: true, latencyMs: 30 })).toMatchObject({
      tone: "success", label: "OK",
    });
  });

  it("ok=true, latency entre 100-500 → warn", () => {
    expect(summarizeService({ ok: true, latencyMs: 250 }).tone).toBe("warn");
  });

  it("ok=true, latency alta → danger", () => {
    expect(summarizeService({ ok: true, latencyMs: 1500 }).tone).toBe("danger");
  });

  it("ok=false → danger", () => {
    expect(summarizeService({ ok: false, error: "ETIMEDOUT" }).tone).toBe("danger");
  });

  it("error sin ok → danger", () => {
    expect(summarizeService({ error: "boom" }).tone).toBe("danger");
  });

  it("null probe → neutral", () => {
    expect(summarizeService(null).tone).toBe("neutral");
  });

  it("probe sin latency pero ok → success", () => {
    expect(summarizeService({ ok: true }).tone).toBe("success");
  });
});

describe("bucketByHour", () => {
  const NOW = new Date("2026-04-25T12:30:00Z");

  it("12 horas → 12 buckets ordenados ascending", () => {
    const r = bucketByHour([], 12, NOW);
    expect(r).toHaveLength(12);
    expect(new Date(r[0].hour).getTime()).toBeLessThan(new Date(r[11].hour).getTime());
  });

  it("rows caen en buckets correctos", () => {
    const rows = [
      { ts: new Date("2026-04-25T12:00:00Z") }, // current hour
      { ts: new Date("2026-04-25T12:15:00Z") }, // current hour
      { ts: new Date("2026-04-25T11:30:00Z") }, // 1h ago
      { ts: new Date("2026-04-25T08:00:00Z") }, // 4h ago
    ];
    const r = bucketByHour(rows, 24, NOW);
    const lastHour = r[r.length - 1].count; // current
    expect(lastHour).toBe(2);
    const oneHourAgo = r[r.length - 2].count;
    expect(oneHourAgo).toBe(1);
  });

  it("rows fuera del window se ignoran", () => {
    const rows = [{ ts: new Date("2026-04-20T00:00:00Z") }]; // 5 días atrás
    const r = bucketByHour(rows, 24, NOW);
    expect(r.reduce((a, b) => a + b.count, 0)).toBe(0);
  });

  it("non-array → all zeros", () => {
    const r = bucketByHour(null, 6, NOW);
    expect(r).toHaveLength(6);
    expect(r.every((b) => b.count === 0)).toBe(true);
  });

  it("acepta createdAt en lugar de ts", () => {
    const rows = [{ createdAt: new Date("2026-04-25T12:30:00Z") }];
    const r = bucketByHour(rows, 1, NOW);
    expect(r[0].count).toBe(1);
  });
});

describe("formatLatency", () => {
  it("< 1ms", () => expect(formatLatency(0.5)).toBe("<1ms"));
  it("ms range", () => expect(formatLatency(150)).toBe("150ms"));
  it("seconds range", () => expect(formatLatency(1500)).toBe("1.50s"));
  it("non-number → '—'", () => {
    expect(formatLatency(null)).toBe("—");
    expect(formatLatency("abc")).toBe("—");
    expect(formatLatency(NaN)).toBe("—");
  });
});

describe("overallSystemHealth", () => {
  it("todos OK → success", () => {
    const r = overallSystemHealth([
      { ok: true, latencyMs: 50 },
      { ok: true, latencyMs: 80 },
    ]);
    expect(r.tone).toBe("success");
  });

  it("uno warn → warn", () => {
    const r = overallSystemHealth([
      { ok: true, latencyMs: 50 },
      { ok: true, latencyMs: 300 }, // warn
    ]);
    expect(r.tone).toBe("warn");
  });

  it("uno danger → danger (peor gana)", () => {
    const r = overallSystemHealth([
      { ok: true, latencyMs: 50 },
      { ok: false, error: "down" },
    ]);
    expect(r.tone).toBe("danger");
  });

  it("vacío → neutral", () => {
    expect(overallSystemHealth([]).tone).toBe("neutral");
    expect(overallSystemHealth(null).tone).toBe("neutral");
  });
});

describe("formatCounter", () => {
  it("< 1000 → string raw", () => {
    expect(formatCounter(0)).toBe("0");
    expect(formatCounter(42)).toBe("42");
    expect(formatCounter(999)).toBe("999");
  });
  it("1k+ → 1.2k", () => {
    expect(formatCounter(1500)).toBe("1.5k");
    expect(formatCounter(12345)).toBe("12.3k");
  });
  it("M+", () => {
    expect(formatCounter(2_500_000)).toBe("2.5M");
  });
  it("non-number → '—'", () => {
    expect(formatCounter("nope")).toBe("—");
    expect(formatCounter(NaN)).toBe("—");
  });
  it("negative", () => {
    expect(formatCounter(-1500)).toBe("-1.5k");
  });
});
