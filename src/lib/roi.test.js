import { describe, it, expect } from "vitest";
import {
  computeRecoveredHours,
  computeRoiValue,
  ROI_DEFAULTS,
} from "./roi";

describe("computeRecoveredHours", () => {
  it("insufficient si sesiones < minSessions", () => {
    const r = computeRecoveredHours({ sessions: [{ actualSec: 180 }] });
    expect(r.insufficient).toBe(true);
    expect(r.n).toBe(1);
    expect(r.minRequired).toBe(ROI_DEFAULTS.minSessions);
  });

  it("calcula minutos totales desde actualSec", () => {
    const sessions = Array.from({ length: 40 }, () => ({
      actualSec: 180,  // 3 min
      pre: 2,
      mood: 3,
    }));
    const r = computeRecoveredHours({ sessions });
    expect(r.insufficient).toBe(false);
    expect(r.sessionsMinutes).toBe(120); // 40 * 3
  });

  it("si no se pasa observedLift, lo deriva del ratio pre<mood (capsulado)", () => {
    // 10 positivas de 40 = 0.25, por debajo del cap → se usa tal cual
    const sessions = [
      ...Array.from({ length: 10 }, () => ({ actualSec: 180, pre: 2, mood: 3 })), // +1
      ...Array.from({ length: 30 }, () => ({ actualSec: 180, pre: 2, mood: 2 })), // 0
    ];
    const r = computeRecoveredHours({ sessions });
    expect(r.observedLift).toBe(0.25);
  });

  it("capsula observedLift en effectSizeCap (conservador)", () => {
    // 100% positivos → ratio 1, pero el cap es 0.35
    const sessions = Array.from({ length: 40 }, () => ({
      actualSec: 180,
      pre: 2,
      mood: 4,
    }));
    const r = computeRecoveredHours({ sessions });
    expect(r.observedLift).toBe(ROI_DEFAULTS.effectSizeCap);
  });

  it("acepta observedLift externo (p.ej. de effectiveness.js) y lo capsula", () => {
    const sessions = Array.from({ length: 40 }, () => ({ actualSec: 180 }));
    const r = computeRecoveredHours({ sessions, observedLift: 0.8 });
    expect(r.observedLift).toBe(ROI_DEFAULTS.effectSizeCap);  // capped
    const r2 = computeRecoveredHours({ sessions, observedLift: 0.1 });
    expect(r2.observedLift).toBe(0.1);
  });

  it("formula: recoveredHours = sessionsMin × lift × residualFactor / 60", () => {
    // 40 sesiones × 3 min = 120 min
    // lift=0.2, residualFactor=2 → 120*0.2*2 = 48 min = 0.8 h
    const sessions = Array.from({ length: 40 }, () => ({ actualSec: 180 }));
    const r = computeRecoveredHours({
      sessions,
      observedLift: 0.2,
      residualFactor: 2,
    });
    expect(r.recoveredHours).toBe(0.8);
  });

  it("usa fallback de duración si no hay actualSec", () => {
    const sessions = Array.from({ length: 40 }, () => ({}));
    const r = computeRecoveredHours({ sessions, observedLift: 0.2 });
    expect(r.sessionsMinutes).toBeGreaterThan(0);
  });
});

describe("computeRoiValue", () => {
  it("retorna null si no hay recoveredHours", () => {
    expect(computeRoiValue({ recoveredHours: null })).toBeNull();
    expect(computeRoiValue({ recoveredHours: 0 })).toBeNull();
  });

  it("totalValue = hours * hourlyLoadedCost", () => {
    const v = computeRoiValue({ recoveredHours: 10, hourlyLoadedCost: 60 });
    expect(v.totalValue).toBe(600);
    expect(v.currency).toBe("USD");
  });

  it("acepta override de currency y hourlyLoadedCost", () => {
    const v = computeRoiValue({
      recoveredHours: 8,
      hourlyLoadedCost: 800,
      currency: "MXN",
    });
    expect(v.currency).toBe("MXN");
    expect(v.totalValue).toBe(6400);
  });

  it("usa defaults documentados si no se pasan", () => {
    const v = computeRoiValue({ recoveredHours: 5 });
    expect(v.hourlyLoadedCost).toBe(ROI_DEFAULTS.hourlyLoadedCost);
    expect(v.totalValue).toBe(5 * ROI_DEFAULTS.hourlyLoadedCost);
  });
});
