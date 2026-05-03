import { describe, it, expect } from "vitest";
import { getCoachQuota, evaluateQuota, currentBillingPeriod } from "./coach-quota.js";

describe("getCoachQuota", () => {
  it("FREE → 5/mo Haiku", () => {
    expect(getCoachQuota("FREE")).toEqual({ maxRequests: 5, modelTier: "haiku" });
  });
  it("PRO → 100/mo Sonnet", () => {
    expect(getCoachQuota("PRO")).toEqual({ maxRequests: 100, modelTier: "sonnet" });
  });
  it("STARTER → 500/mo Sonnet", () => {
    expect(getCoachQuota("STARTER").maxRequests).toBe(500);
  });
  it("GROWTH/ENTERPRISE → unlimited", () => {
    expect(getCoachQuota("GROWTH").maxRequests).toBe(Infinity);
    expect(getCoachQuota("ENTERPRISE").maxRequests).toBe(Infinity);
  });
  it("unknown plan → FREE", () => {
    expect(getCoachQuota("WHATEVER")).toEqual({ maxRequests: 5, modelTier: "haiku" });
    expect(getCoachQuota(null).maxRequests).toBe(5);
  });
  it("case-insensitive", () => {
    expect(getCoachQuota("free").maxRequests).toBe(5);
    expect(getCoachQuota("Pro").maxRequests).toBe(100);
  });
});

describe("evaluateQuota", () => {
  it("under cap → ok with remaining", () => {
    expect(evaluateQuota({ requests: 2 }, "FREE")).toEqual({ ok: true, used: 2, max: 5, remaining: 3 });
  });
  it("at cap → blocked", () => {
    expect(evaluateQuota({ requests: 5 }, "FREE")).toEqual({
      ok: false, used: 5, max: 5, remaining: 0, reason: "quota_exceeded",
    });
  });
  it("over cap (somehow) → blocked", () => {
    expect(evaluateQuota({ requests: 7 }, "FREE")).toMatchObject({ ok: false, remaining: 0 });
  });
  it("usage null → treated as 0", () => {
    expect(evaluateQuota(null, "PRO")).toEqual({ ok: true, used: 0, max: 100, remaining: 100 });
  });
  it("unlimited plan → always ok", () => {
    expect(evaluateQuota({ requests: 999999 }, "ENTERPRISE")).toMatchObject({ ok: true, max: Infinity });
  });
});

describe("currentBillingPeriod", () => {
  it("returns year+month from UTC", () => {
    const r = currentBillingPeriod(new Date("2026-05-15T10:00:00Z"));
    expect(r).toEqual({ year: 2026, month: 5 });
  });
  it("UTC consistency for late-night local times", () => {
    const r = currentBillingPeriod(new Date("2026-04-30T23:30:00Z"));
    expect(r).toEqual({ year: 2026, month: 4 });
  });
});
