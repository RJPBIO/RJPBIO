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

  it("excluye entradas cámara con SQI bajo del baseline", () => {
    const st = {
      hrvLog: [
        { ts: 1, lnRmssd: 4.1, source: "camera", sqi: 85 },
        { ts: 2, lnRmssd: 3.0, source: "camera", sqi: 30 }, // garbage
        { ts: 3, lnRmssd: 4.3, source: "camera", sqi: 70 },
      ],
    };
    const inp = buildReadinessInput(st);
    expect(inp.hrvHistory).toHaveLength(2);
    expect(inp.hrvHistory.map((h) => h.lnRmssd)).toEqual([4.1, 4.3]);
  });

  it("entradas BLE (sin SQI) siempre entran al baseline", () => {
    const st = {
      hrvLog: [
        { ts: 1, lnRmssd: 4.0 }, // legacy/BLE
        { ts: 2, lnRmssd: 4.2, source: "camera", sqi: 80 },
      ],
    };
    const inp = buildReadinessInput(st);
    expect(inp.hrvHistory).toHaveLength(2);
  });

  it("entrada cámara sin SQI se considera no confiable", () => {
    const st = {
      hrvLog: [
        { ts: 1, lnRmssd: 4.0 }, // BLE legacy
        { ts: 2, lnRmssd: 4.5, source: "camera" }, // sin SQI explícito
      ],
    };
    const inp = buildReadinessInput(st);
    expect(inp.hrvHistory).toHaveLength(1);
    expect(inp.hrvHistory[0].lnRmssd).toBe(4.0);
  });

  it("currentHRV es la última entrada CONFIABLE, no la más reciente", () => {
    const st = {
      hrvLog: [
        { ts: 1, lnRmssd: 4.0, rhr: 62 }, // BLE confiable
        { ts: 2, lnRmssd: 3.0, rhr: 90, source: "camera", sqi: 25 }, // basura
      ],
    };
    const inp = buildReadinessInput(st);
    expect(inp.currentHRV).toEqual({ lnRmssd: 4.0, rhr: 62 });
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

// Phase 6H Premium-Fix1 — fallback coherence-only.
describe("computeReadiness — Phase 6H Premium-Fix1 fallback coherence-only", () => {
  it("full signals → partial=false, source='full'", () => {
    const now = Date.now();
    const hrvLog = Array.from({ length: 10 }, (_, i) => ({
      ts: now - (10 - i) * 86400000,
      lnRmssd: 4.0 + (i % 3) * 0.1,
    }));
    const st = {
      hrvLog,
      lastSleepHours: 7,
      sleepTargetHours: 7.5,
      moodLog: [{ ts: now - 3600000, mood: 4, energy: 2 }],
      history: [],
    };
    const r = computeReadiness(st);
    expect(r.partial).toBe(false);
    expect(r.source).toBe("full");
    expect(r.reason).toBeNull();
    expect(r.eligibleForFallback).toBe(false);
    expect(typeof r.score).toBe("number");
  });

  it("N≥5 sin HRV con coherence per-sesión → partial=true, source='coherence-only'", () => {
    const now = Date.now();
    const history = Array.from({ length: 7 }, (_, i) => ({
      ts: now - (7 - i) * 86400000,
      c: 60 + i * 2, // 60, 62, 64, 66, 68, 70, 72 → avg 66
      p: "Reinicio Parasimpático",
    }));
    const st = { hrvLog: [], rhrLog: [], moodLog: [], history };
    const r = computeReadiness(st);
    expect(r.partial).toBe(true);
    expect(r.source).toBe("coherence-only");
    expect(r.eligibleForFallback).toBe(true);
    expect(typeof r.score).toBe("number");
    expect(r.score).toBe(66);
    expect(r.reason).toMatch(/parcial/i);
    expect(r.fallbackSamples).toBe(7);
  });

  it("N<5 → score=null, partial=false, source=null, reason informativo", () => {
    const now = Date.now();
    const history = Array.from({ length: 3 }, (_, i) => ({
      ts: now - (3 - i) * 86400000,
      c: 60,
    }));
    const st = { history };
    const r = computeReadiness(st);
    expect(r.score).toBeNull();
    expect(r.partial).toBe(false);
    expect(r.source).toBeNull();
    expect(r.eligibleForFallback).toBe(false);
    expect(r.reason).toMatch(/insuficientes|sesiones/i);
  });

  it("N≥5 pero <3 entradas con h.c numérico → no fallback, score=null", () => {
    const now = Date.now();
    const history = Array.from({ length: 6 }, (_, i) => ({
      ts: now - (6 - i) * 86400000,
      // sólo 2 entradas con c válido (insuficiente para fallback)
      c: i < 2 ? 60 : null,
    }));
    const st = { history };
    const r = computeReadiness(st);
    expect(r.score).toBeNull();
    expect(r.eligibleForFallback).toBe(false);
  });

  it("history vacío → reason 'sin datos'", () => {
    const r = computeReadiness({ history: [] });
    expect(r.score).toBeNull();
    expect(r.reason).toMatch(/sin datos|primera sesión/i);
  });

  it("fallback usa últimas 14 sesiones (no las primeras)", () => {
    const now = Date.now();
    const history = [
      // 5 viejas con c=20 (no deben contar — fuera de ventana)
      ...Array.from({ length: 5 }, (_, i) => ({ ts: now - (50 - i) * 86400000, c: 20 })),
      // 14 recientes con c=80 → avg=80 esperado
      ...Array.from({ length: 14 }, (_, i) => ({ ts: now - (14 - i) * 86400000, c: 80 })),
    ];
    const st = { history };
    const r = computeReadiness(st);
    expect(r.partial).toBe(true);
    expect(r.score).toBe(80);
    expect(r.fallbackSamples).toBe(14);
  });

  it("clamp 0-100 cuando coherence promedia >100 o <0 (defensivo)", () => {
    const now = Date.now();
    const historyHigh = Array.from({ length: 5 }, (_, i) => ({
      ts: now - (5 - i) * 86400000, c: 150,
    }));
    const r1 = computeReadiness({ history: historyHigh });
    expect(r1.score).toBe(100);

    const historyLow = Array.from({ length: 5 }, (_, i) => ({
      ts: now - (5 - i) * 86400000, c: -20,
    }));
    const r2 = computeReadiness({ history: historyLow });
    expect(r2.score).toBe(0);
  });
});
