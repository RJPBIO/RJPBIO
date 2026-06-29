import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../audit", () => ({
  auditLog: vi.fn(async () => ({})),
}));

const { verifyCronAuth, runTask, TASK_REGISTRY } = await import("./runner.js");

function reqWith({ auth = null, vercel = false } = {}) {
  const headers = new Map();
  if (auth) headers.set("authorization", auth);
  if (vercel) headers.set("x-vercel-cron", "1");
  return {
    headers: { get: (k) => headers.get(k.toLowerCase()) ?? null },
  };
}

describe("verifyCronAuth", () => {
  beforeEach(() => { delete process.env.CRON_SECRET; });
  afterEach(() => { delete process.env.CRON_SECRET; });

  it("rejects when no secret and no vercel header", () => {
    const r = verifyCronAuth(reqWith({}));
    expect(r).toBeInstanceOf(Response);
    expect(r.status).toBe(401);
  });

  it("accepts when no secret but vercel header present", () => {
    const r = verifyCronAuth(reqWith({ vercel: true }));
    expect(r).toBeNull();
  });

  it("accepts valid bearer token", () => {
    process.env.CRON_SECRET = "topsecret123";
    const r = verifyCronAuth(reqWith({ auth: "Bearer topsecret123" }));
    expect(r).toBeNull();
  });

  it("rejects invalid bearer token", () => {
    process.env.CRON_SECRET = "topsecret123";
    const r = verifyCronAuth(reqWith({ auth: "Bearer wrong" }));
    expect(r).toBeInstanceOf(Response);
    expect(r.status).toBe(401);
  });

  it("rejects missing bearer prefix", () => {
    process.env.CRON_SECRET = "topsecret123";
    const r = verifyCronAuth(reqWith({ auth: "topsecret123" }));
    expect(r).toBeInstanceOf(Response);
    expect(r.status).toBe(401);
  });
});

describe("runTask", () => {
  it("returns ok=true with task metadata on success", async () => {
    const fn = vi.fn(async () => ({ processed: 5, errors: 0 }));
    const res = await runTask("test", fn);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.task).toBe("test");
    expect(body.ok).toBe(true);
    expect(body.processed).toBe(5);
    expect(typeof body.durationMs).toBe("number");
  });

  it("captures errors and returns ok=false with errorMessage", async () => {
    const fn = vi.fn(async () => { throw new Error("boom"); });
    const res = await runTask("test", fn);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.errors).toBe(1);
    expect(body.errorMessage).toContain("boom");
  });
});

describe("TASK_REGISTRY", () => {
  it("has all 15 expected tasks", () => {
    expect(Object.keys(TASK_REGISTRY).sort()).toEqual([
      "audit-export",
      "audit-prune",
      "audit-verify",
      // Phase 6F SP-E — diario wellbeing trends + push throttle 7d
      "burnout-scan",
      "dsar-sweep",
      "dunning-check",
      "incident-broadcast",
      "maintenance-notify",
      // NOM-035 longitudinal — push semanal a users con eval >90 días (reaplicar)
      "nom35-reapply-reminder",
      // Phase 6F SP-A — push reminder diario para users con programa activo
      "program-day-reminder",
      "push-deliver",
      // Phase 6F SP-C — digest mensual a admins B2B con link al reporte ejecutivo
      "quarterly-org-digest",
      "trial-end-reminder",
      "webhook-retry",
      "weekly-summary",
    ]);
  });

  it("each task loader resolves to a function", async () => {
    for (const [name, loader] of Object.entries(TASK_REGISTRY)) {
      const fn = await loader();
      expect(typeof fn).toBe("function");
    }
  });
});
