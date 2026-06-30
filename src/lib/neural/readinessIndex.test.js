import { describe, it, expect } from "vitest";
import { buildReadinessIndex, percentile } from "./readinessIndex";

const DAY = 86_400_000;
const NOW = new Date(2026, 5, 15, 12, 0, 0).getTime();

// 14 lecturas (daysAgo 2..15) con rmssd repartido 28..54.
function baseline() {
  const out = [];
  for (let i = 2; i <= 15; i++) out.push({ ts: NOW - i * DAY, rmssd: 24 + i * 2 });
  return out;
}

describe("percentile", () => {
  it("interpola linealmente", () => {
    expect(percentile([10, 20, 30, 40], 0.5)).toBe(25);
    expect(percentile([10, 20, 30, 40], 0)).toBe(10);
    expect(percentile([10, 20, 30, 40], 1)).toBe(40);
  });
});

describe("buildReadinessIndex", () => {
  it("cold-start: <12 lecturas → calibrando", () => {
    const r = buildReadinessIndex(baseline().slice(0, 6), { now: NOW });
    expect(r.available).toBe(false);
    expect(r.reason).toMatch(/Calibrando/);
  });

  it("lectura reciente alta → disposición alta (≥70%)", () => {
    const r = buildReadinessIndex([...baseline(), { ts: NOW, rmssd: 56 }], { now: NOW });
    expect(r.available).toBe(true);
    expect(r.readiness.pct).toBeGreaterThanOrEqual(70);
    expect(r.readiness.label).toMatch(/alta/i);
    expect(r.headline).toMatch(/exigentes/);
  });

  it("lectura reciente baja → disposición baja (<40%) + recuperar", () => {
    const r = buildReadinessIndex([...baseline(), { ts: NOW, rmssd: 26 }], { now: NOW });
    expect(r.readiness.pct).toBeLessThan(40);
    expect(r.headline).toMatch(/recuperar/);
  });

  it("pct queda acotado 0–100", () => {
    const high = buildReadinessIndex([...baseline(), { ts: NOW, rmssd: 200 }], { now: NOW });
    const low = buildReadinessIndex([...baseline(), { ts: NOW, rmssd: 5 }], { now: NOW });
    expect(high.readiness.pct).toBeLessThanOrEqual(100);
    expect(low.readiness.pct).toBeGreaterThanOrEqual(0);
  });

  it("sin lectura reciente (>36h) → invita a medir, expone tu pico", () => {
    const r = buildReadinessIndex(baseline(), { now: NOW });
    expect(r.available).toBe(true);
    expect(r.readiness).toBeNull();
    expect(r.peakRmssd).toBeGreaterThan(0);
    expect(r.headline).toMatch(/Mide tu HRV/);
  });

  it("acepta lnRmssd directo", () => {
    const log = baseline().map((e) => ({ ts: e.ts, lnRmssd: Math.log(e.rmssd) }));
    const r = buildReadinessIndex([...log, { ts: NOW, lnRmssd: Math.log(56) }], { now: NOW });
    expect(r.available).toBe(true);
    expect(r.readiness.pct).toBeGreaterThanOrEqual(70);
  });

  it("no rompe con entrada inválida", () => {
    expect(buildReadinessIndex(null, { now: NOW }).available).toBe(false);
  });
});
