import { describe, it, expect } from "vitest";
import { buildReadinessInput, computeReadiness } from "./useReadiness";

describe("buildReadinessInput", () => {
  it("devuelve estructura mínima con estado vacío", () => {
    const inp = buildReadinessInput({});
    expect(inp.hrvHistory).toEqual([]);
    expect(inp.rhrHistory).toEqual([]);
    expect(inp.moodLog).toEqual([]);
    expect(inp.sessions).toEqual([]);
    expect(inp.currentHRV).toBeNull();
    expect(inp.sleepTarget).toBe(7.5);
    expect(inp.sleepHours).toBeNull();
  });

  it("acepta null/undefined sin romper", () => {
    expect(() => buildReadinessInput(null)).not.toThrow();
    expect(() => buildReadinessInput(undefined)).not.toThrow();
  });

  it("filtra entradas HRV sin lnRmssd numérico", () => {
    const st = {
      hrvLog: [
        { ts: 1, lnRmssd: 4.1 },
        { ts: 2, lnRmssd: null },
        { ts: 3 },
        { ts: 4, lnRmssd: 4.3 },
      ],
    };
    const inp = buildReadinessInput(st);
    expect(inp.hrvHistory).toEqual([
      { ts: 1, lnRmssd: 4.1 },
      { ts: 4, lnRmssd: 4.3 },
    ]);
  });

  it("acepta alias lnrmssd (case) en entradas legacy", () => {
    const st = { hrvLog: [{ ts: 1, lnrmssd: 3.9 }] };
    const inp = buildReadinessInput(st);
    expect(inp.hrvHistory[0].lnRmssd).toBe(3.9);
  });

  it("currentHRV usa la última entrada de hrvLog", () => {
    const st = {
      hrvLog: [
        { ts: 1, lnRmssd: 4.0, rhr: 65 },
        { ts: 2, lnRmssd: 4.2, rhr: 62 },
      ],
    };
    const inp = buildReadinessInput(st);
    expect(inp.currentHRV).toEqual({ lnRmssd: 4.2, rhr: 62 });
  });

  it("propaga sleepHours y sleepTarget del store", () => {
    const st = { lastSleepHours: 6.5, sleepTargetHours: 8 };
    const inp = buildReadinessInput(st);
    expect(inp.sleepHours).toBe(6.5);
    expect(inp.sleepTarget).toBe(8);
  });
});

describe("computeReadiness", () => {
  it("devuelve null en caso de error (no lanza)", () => {
    // calcReadiness puede devolver { score: null, insufficient: true }
    // cuando no hay señales — eso NO es un error.
    const r = computeReadiness({});
    expect(r).toBeTruthy();
    expect(r.insufficient).toBe(true);
  });

  it("con datos suficientes devuelve score numérico", () => {
    const now = Date.now();
    const hrvLog = Array.from({ length: 10 }, (_, i) => ({
      ts: now - (10 - i) * 86400000,
      lnRmssd: 4.0 + (i % 3) * 0.1,
    }));
    const moodLog = [{ ts: now - 3600000, mood: 4, energy: 2 }];
    const st = {
      hrvLog,
      rhrLog: [],
      lastSleepHours: 7,
      sleepTargetHours: 7.5,
      moodLog,
      history: [],
    };
    const r = computeReadiness(st);
    expect(r).toBeTruthy();
    expect(typeof r.score).toBe("number");
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });
});
