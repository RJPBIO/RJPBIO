import { describe, it, expect } from "vitest";
import {
  calcBioQuality,
  calcBurnoutIndex,
  calcBioSignal,
  detectGamingPattern,
  adaptiveProtocolEngine,
} from "./neural";

// ─── calcBioQuality ──────────────────────────────────────
describe("calcBioQuality", () => {
  it("returns inválida when no interactions", () => {
    const r = calcBioQuality({ interactions: 0, touchHolds: 0, pauses: 0 });
    expect(r.quality).toBe("inválida");
    expect(r.score).toBeGreaterThanOrEqual(5);
  });

  it("returns alta quality for high engagement", () => {
    const r = calcBioQuality({ interactions: 5, touchHolds: 2, motionSamples: 10, pauses: 0 });
    expect(r.quality).toBe("alta");
    expect(r.score).toBeGreaterThanOrEqual(70);
  });

  it("penalizes pauses", () => {
    const noPause = calcBioQuality({ interactions: 3, touchHolds: 1, pauses: 0 });
    const withPause = calcBioQuality({ interactions: 3, touchHolds: 1, pauses: 3 });
    expect(noPause.score).toBeGreaterThan(withPause.score);
  });

  it("score is always between 5 and 100", () => {
    const low = calcBioQuality({ interactions: 0, touchHolds: 0, pauses: 10 });
    const high = calcBioQuality({ interactions: 100, touchHolds: 100, motionSamples: 100, pauses: 0 });
    expect(low.score).toBeGreaterThanOrEqual(5);
    expect(high.score).toBeLessThanOrEqual(100);
  });

  it("handles empty/undefined input", () => {
    const r = calcBioQuality({});
    expect(r).toHaveProperty("score");
    expect(r).toHaveProperty("quality");
  });
});

// ─── calcBurnoutIndex ────────────────────────────────────
describe("calcBurnoutIndex", () => {
  it("returns sin datos with <5 entries", () => {
    const r = calcBurnoutIndex([{ mood: 3 }], []);
    expect(r.risk).toBe("sin datos");
    expect(r.index).toBe(0);
  });

  it("detects critical burnout on low mood streak", () => {
    const ml = Array.from({ length: 10 }, (_, i) => ({ mood: 1, ts: Date.now() - i * 86400000 }));
    const r = calcBurnoutIndex(ml, []);
    expect(r.risk).toBe("crítico");
    expect(r.index).toBeGreaterThanOrEqual(70);
  });

  it("returns bajo or moderado for consistently good mood with sessions", () => {
    const ml = Array.from({ length: 14 }, (_, i) => ({ mood: 5, ts: Date.now() - i * 86400000 }));
    const hist = Array.from({ length: 7 }, (_, i) => ({ ts: Date.now() - i * 86400000, p: "test" }));
    const r = calcBurnoutIndex(ml, hist);
    expect(["bajo", "moderado"]).toContain(r.risk);
    expect(r.index).toBeLessThan(50);
  });

  it("detects flat affect pattern", () => {
    const ml = Array.from({ length: 10 }, () => ({ mood: 3 }));
    const r = calcBurnoutIndex(ml, []);
    expect(r.risk).toBe("moderado");
  });

  it("handles null inputs gracefully", () => {
    const r = calcBurnoutIndex(null, null);
    expect(r.risk).toBe("sin datos");
  });
});

// ─── calcBioSignal ───────────────────────────────────────
describe("calcBioSignal", () => {
  it("returns a score between 0 and 100", () => {
    const st = { coherencia: 70, resiliencia: 60, capacidad: 65, moodLog: [], weeklyData: [1, 0, 1, 0, 0, 0, 0], history: [] };
    const r = calcBioSignal(st);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });

  it("higher metrics yield higher score", () => {
    const low = calcBioSignal({ coherencia: 20, resiliencia: 20, capacidad: 20, moodLog: [], weeklyData: [], history: [] });
    const high = calcBioSignal({ coherencia: 90, resiliencia: 90, capacidad: 90, moodLog: [{ mood: 5 }, { mood: 5 }, { mood: 5 }], weeklyData: [1, 1, 1, 1, 1, 1, 1], history: [] });
    expect(high.score).toBeGreaterThan(low.score);
  });

  it("returns burnout sub-object", () => {
    const st = { coherencia: 50, resiliencia: 50, capacidad: 50, moodLog: [], weeklyData: [], history: [] };
    const r = calcBioSignal(st);
    expect(r).toHaveProperty("burnout");
    expect(r.burnout).toHaveProperty("index");
  });

  it("handles minimal state", () => {
    const r = calcBioSignal({});
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });
});

// ─── detectGamingPattern ─────────────────────────────────
describe("detectGamingPattern", () => {
  it("returns no gaming with <5 entries", () => {
    const r = detectGamingPattern([{ interactions: 3 }]);
    expect(r.gaming).toBe(false);
  });

  it("detects zero-interaction gaming", () => {
    const hist = Array.from({ length: 10 }, (_, i) => ({ interactions: 0, ts: Date.now() - i * 60000, bioQ: 10 }));
    const r = detectGamingPattern(hist);
    expect(r.gaming).toBe(true);
    expect(r.reason).toContain("Sin interacción");
  });

  it("detects rapid-fire sessions", () => {
    const hist = Array.from({ length: 6 }, (_, i) => ({ interactions: 3, ts: Date.now() - i * 10000, bioQ: 50 }));
    const r = detectGamingPattern(hist);
    expect(r.gaming).toBe(true);
    expect(r.reason).toContain("30s");
  });

  it("detects identical low quality", () => {
    const hist = Array.from({ length: 10 }, (_, i) => ({ interactions: 1, ts: Date.now() - i * 120000, bioQ: 15 }));
    const r = detectGamingPattern(hist);
    expect(r.gaming).toBe(true);
    expect(r.reason).toContain("idéntica");
  });

  it("passes for legitimate sessions", () => {
    const now = Date.now();
    const hist = Array.from({ length: 10 }, (_, i) => ({ interactions: 3 + i, ts: now - (9 - i) * 3600000, bioQ: 50 + i * 3 }));
    const r = detectGamingPattern(hist);
    expect(r.gaming).toBe(false);
  });

  it("handles null input", () => {
    const r = detectGamingPattern(null);
    expect(r.gaming).toBe(false);
  });
});

// ─── adaptiveProtocolEngine ──────────────────────────────
describe("adaptiveProtocolEngine", () => {
  const baseSt = {
    totalSessions: 10,
    coherencia: 60,
    resiliencia: 55,
    capacidad: 50,
    streak: 3,
    todaySessions: 1,
    weeklyData: [1, 1, 0, 0, 0, 0, 0],
    moodLog: Array.from({ length: 7 }, (_, i) => ({ mood: 3, ts: Date.now() - i * 86400000, proto: "test", pre: 2 })),
    history: Array.from({ length: 7 }, (_, i) => ({ p: "test", ts: Date.now() - i * 86400000, interactions: 3, bioQ: 60 })),
  };

  it("returns a primary recommendation", () => {
    const r = adaptiveProtocolEngine(baseSt);
    expect(r).toHaveProperty("primary");
    expect(r.primary).toHaveProperty("protocol");
    expect(r.primary.protocol).toHaveProperty("n");
    expect(r.primary.protocol).toHaveProperty("id");
  });

  it("returns alternatives array", () => {
    const r = adaptiveProtocolEngine(baseSt);
    expect(r).toHaveProperty("alternatives");
    expect(Array.isArray(r.alternatives)).toBe(true);
  });

  it("overrides to calma on critical burnout", () => {
    const burnoutSt = {
      ...baseSt,
      moodLog: Array.from({ length: 14 }, () => ({ mood: 1, ts: Date.now(), proto: "test", pre: 1 })),
    };
    const r = adaptiveProtocolEngine(burnoutSt);
    expect(r).toHaveProperty("need");
    expect(r.need).toBe("calma");
  });

  it("handles empty state gracefully", () => {
    const r = adaptiveProtocolEngine({ totalSessions: 0, moodLog: [], history: [], weeklyData: [0, 0, 0, 0, 0, 0, 0] });
    expect(r).toHaveProperty("primary");
  });
});
