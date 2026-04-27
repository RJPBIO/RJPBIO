import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  detectStaleness,
  sampleAgeWeight,
  weightedAvg,
  recalibrationGuidance,
} from "./staleness";

const HOUR = 3600000;
const DAY = 24 * HOUR;
const NOW = new Date("2026-04-26T12:00:00Z").getTime();

function histEntry(daysAgo) {
  return { p: "x", ts: NOW - daysAgo * DAY, c: 50, bioQ: 60 };
}

describe("detectStaleness", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
  });
  afterEach(() => vi.useRealTimers());

  it("no-data sin historial", () => {
    const r = detectStaleness({});
    expect(r.level).toBe("no-data");
    expect(r.daysSinceLast).toBeNull();
    expect(r.dataConfidence).toBe(1.0);
    expect(r.recalibrate).toBe(false);
  });

  it("fresh: última sesión hoy", () => {
    const r = detectStaleness({ history: [histEntry(0)] });
    expect(r.level).toBe("fresh");
    expect(r.daysSinceLast).toBe(0);
    expect(r.dataConfidence).toBe(1.0);
    expect(r.recalibrate).toBe(false);
  });

  it("active: 12 días (entre 8-14)", () => {
    const r = detectStaleness({ history: [histEntry(12)] });
    expect(r.level).toBe("active");
    expect(r.dataConfidence).toBe(0.85);
    expect(r.recalibrate).toBe(false);
  });

  it("cooling: 20 días", () => {
    const r = detectStaleness({ history: [histEntry(20)] });
    expect(r.level).toBe("cooling");
    expect(r.dataConfidence).toBe(0.55);
    expect(r.recalibrate).toBe("soft");
  });

  it("stale: 45 días → recalibrate hard", () => {
    const r = detectStaleness({ history: [histEntry(45)] });
    expect(r.level).toBe("stale");
    expect(r.dataConfidence).toBe(0.25);
    expect(r.recalibrate).toBe("hard");
  });

  it("abandoned: 90 días", () => {
    const r = detectStaleness({ history: [histEntry(90)] });
    expect(r.level).toBe("abandoned");
    expect(r.dataConfidence).toBeLessThan(0.1);
    expect(r.recalibrate).toBe("hard");
  });

  it("acepta options.now custom", () => {
    const customNow = new Date(NOW + 30 * DAY);
    const r = detectStaleness({ history: [histEntry(0)] }, { now: customNow });
    expect(r.daysSinceLast).toBe(30);
    expect(r.level).toBe("cooling");
  });

  it("expone daysSinceMoodLog", () => {
    const r = detectStaleness({
      history: [histEntry(2)],
      moodLog: [{ mood: 3, ts: NOW - 7 * DAY }],
    });
    expect(r.daysSinceMoodLog).toBe(7);
  });

  it("history sin ts → no-data", () => {
    const r = detectStaleness({ history: [{ p: "x" }] });
    expect(r.level).toBe("no-data");
  });

  it("nunca tira con state malformado", () => {
    expect(() => detectStaleness(null)).not.toThrow();
    expect(() => detectStaleness({ history: "bad" })).not.toThrow();
  });
});

describe("sampleAgeWeight", () => {
  it("muestra de hoy = peso 1.0", () => {
    expect(sampleAgeWeight(NOW, NOW)).toBe(1);
  });

  it("muestra a half-life (21d) = peso 0.5", () => {
    const w = sampleAgeWeight(NOW - 21 * DAY, NOW);
    expect(w).toBeCloseTo(0.5, 2);
  });

  it("muestra a 2× half-life = peso ~0.25", () => {
    const w = sampleAgeWeight(NOW - 42 * DAY, NOW);
    expect(w).toBeCloseTo(0.25, 2);
  });

  it("respeta floor mínimo (0.10)", () => {
    const w = sampleAgeWeight(NOW - 365 * DAY, NOW);
    expect(w).toBeGreaterThanOrEqual(0.10);
  });

  it("nunca pasa de 1.0", () => {
    const w = sampleAgeWeight(NOW + 100 * DAY, NOW); // futuro
    expect(w).toBeLessThanOrEqual(1);
  });

  it("input inválido → 1", () => {
    expect(sampleAgeWeight(null)).toBe(1);
    expect(sampleAgeWeight("bad")).toBe(1);
    expect(sampleAgeWeight(NaN)).toBe(1);
  });
});

describe("weightedAvg", () => {
  it("array vacío → mean 0", () => {
    expect(weightedAvg([])).toEqual({ weightedMean: 0, totalWeight: 0 });
  });

  it("muestras frescas se promedian sin escalar", () => {
    const samples = [
      { delta: 1, ts: NOW },
      { delta: 2, ts: NOW },
      { delta: 3, ts: NOW },
    ];
    const r = weightedAvg(samples, NOW);
    expect(r.weightedMean).toBeCloseTo(2, 2);
  });

  it("muestras viejas pesan menos que nuevas", () => {
    const samples = [
      { delta: 5, ts: NOW - 60 * DAY }, // viejo
      { delta: 1, ts: NOW },             // nuevo
    ];
    const r = weightedAvg(samples, NOW);
    expect(r.weightedMean).toBeLessThan(3); // promedio simple sería 3
    expect(r.weightedMean).toBeGreaterThan(1);
  });

  it("input no-array → safe", () => {
    expect(weightedAvg(null)).toEqual({ weightedMean: 0, totalWeight: 0 });
  });
});

describe("recalibrationGuidance", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
  });
  afterEach(() => vi.useRealTimers());

  it("retorna null si recalibrate=false", () => {
    expect(recalibrationGuidance({ recalibrate: false })).toBeNull();
    expect(recalibrationGuidance(null)).toBeNull();
  });

  it("retorna soft con cooling staleness", () => {
    const g = recalibrationGuidance({
      level: "cooling",
      daysSinceLast: 20,
      dataConfidence: 0.55,
      recalibrate: "soft",
    });
    expect(g.severity).toBe("soft");
    expect(g.title).toMatch(/Bienvenido/i);
    expect(g.body).toMatch(/20 días/);
    expect(g.dataConfidence).toBe(0.55);
  });

  it("retorna hard con stale staleness", () => {
    const g = recalibrationGuidance({
      level: "stale",
      daysSinceLast: 45,
      dataConfidence: 0.25,
      recalibrate: "hard",
    });
    expect(g.severity).toBe("hard");
    expect(g.title).toMatch(/45 días/);
    expect(g.body).toMatch(/recalibrar/i);
    expect(g.cta).toMatch(/Recalibrar/i);
  });

  it("sugiere reset en horas matutinas", () => {
    const morning = new Date("2026-04-26T11:00:00");
    const g = recalibrationGuidance({
      level: "cooling", daysSinceLast: 20, dataConfidence: 0.55, recalibrate: "soft",
    }, { now: morning });
    expect(g.suggestedIntent).toBe("reset");
  });

  it("sugiere calma en horas vespertinas", () => {
    const evening = new Date("2026-04-26T20:00:00");
    const g = recalibrationGuidance({
      level: "cooling", daysSinceLast: 20, dataConfidence: 0.55, recalibrate: "soft",
    }, { now: evening });
    expect(g.suggestedIntent).toBe("calma");
  });
});
