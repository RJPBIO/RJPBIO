import { describe, it, expect } from "vitest";
import { calcReadiness } from "./readiness";

function makeHrvHistory(days = 14, lnBase = 4.0, noise = 0.1) {
  return Array(days).fill(0).map((_, i) => ({
    ts: Date.now() - (days - i) * 86400000,
    lnRmssd: lnBase + (Math.random() - 0.5) * noise * 2,
  }));
}

describe("calcReadiness", () => {
  it("returns insufficient when no data at all", () => {
    const r = calcReadiness({});
    expect(r.score).toBeNull();
    expect(r.insufficient).toBe(true);
  });

  it("computes with only sleep data", () => {
    const r = calcReadiness({ sleepHours: 7.5 });
    expect(r.score).not.toBeNull();
    expect(r.components.sleep).toBeDefined();
  });

  it("penalizes sleep deficit", () => {
    const good = calcReadiness({ sleepHours: 7.5 });
    const bad = calcReadiness({ sleepHours: 4 });
    expect(good.components.sleep.score).toBeGreaterThan(bad.components.sleep.score);
  });

  it("penalizes sleep excess (>9.5h)", () => {
    const normal = calcReadiness({ sleepHours: 7.5 });
    const oversleep = calcReadiness({ sleepHours: 11 });
    expect(normal.components.sleep.score).toBeGreaterThan(oversleep.components.sleep.score);
  });

  it("increases score with high HRV vs baseline", () => {
    const hist = makeHrvHistory(14, 4.0, 0.05);
    const highHRV = calcReadiness({
      hrvHistory: hist,
      currentHRV: { lnRmssd: 4.3, rhr: 55 },
    });
    const lowHRV = calcReadiness({
      hrvHistory: hist,
      currentHRV: { lnRmssd: 3.6, rhr: 55 },
    });
    expect(highHRV.score).toBeGreaterThan(lowHRV.score);
  });

  it("recommends calma at low readiness", () => {
    const lowHist = makeHrvHistory(14, 4.0, 0.02);
    const r = calcReadiness({
      hrvHistory: lowHist,
      currentHRV: { lnRmssd: 3.2 },
      sleepHours: 4,
    });
    expect(r.recommendation.intent).toBe("calma");
  });

  it("penalizes high recent session load", () => {
    const many = Array(6).fill(0).map((_, i) => ({ ts: Date.now() - i * 3600000 }));
    const few = Array(1).fill(0).map((_, i) => ({ ts: Date.now() - 10 * 3600000 }));
    const rMany = calcReadiness({ sleepHours: 7.5, sessions: many });
    const rFew = calcReadiness({ sleepHours: 7.5, sessions: few });
    expect(rMany.components.load.score).toBeLessThan(rFew.components.load.score);
  });

  it("returns interpretation string", () => {
    const r = calcReadiness({ sleepHours: 7.5 });
    expect(["primed", "ready", "caution", "recover"]).toContain(r.interpretation);
  });

  it("score is 0-100", () => {
    const r = calcReadiness({ sleepHours: 7.5 });
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });
});
