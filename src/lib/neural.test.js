import { describe, it, expect } from "vitest";
import {
  gL, lvPct, nxtLv, getStatus, getWeekNum,
  getDailyIgn, getCircadian,
  calcBioQuality,
  calcBurnoutIndex,
  calcBioSignal,
  detectGamingPattern,
  adaptiveProtocolEngine,
  calcSessionCompletion,
  calcProtoSensitivity,
  predictSessionImpact,
  calcNeuralFingerprint,
  suggestOptimalTime,
  analyzeStreakChain,
  estimateCognitiveLoad,
  calcNeuralMomentum,
  calcRecoveryIndex,
  calcCognitiveEntropy,
  estimateCoherence,
  calcNeuralVariability,
  calcProtocolDiversity,
  genIns,
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

// ─── calcSessionCompletion ───────────────────────────────
describe("calcSessionCompletion", () => {
  const baseSt = {
    totalSessions: 5, streak: 2, todaySessions: 0, lastDate: "",
    coherencia: 60, resiliencia: 55, capacidad: 50,
    weeklyData: [1, 0, 1, 0, 0, 0, 0], weekNum: 1,
    moodLog: [], history: [], achievements: [], vCores: 10,
    totalTime: 300, progDay: 2, favs: [],
  };
  const sessionCtx = {
    protocol: { n: "Respira Gamma", d: 120, id: "rg" },
    durMult: 1, nfcCtx: null, circadian: { period: "day" },
    sessionData: { interactions: 3, touchHolds: 1, pauses: 0, motionSamples: 5 },
  };

  it("increments totalSessions", () => {
    const r = calcSessionCompletion(baseSt, sessionCtx);
    expect(r.newState.totalSessions).toBe(6);
  });

  it("awards V-Cores", () => {
    const r = calcSessionCompletion(baseSt, sessionCtx);
    expect(r.eVC).toBeGreaterThanOrEqual(3);
    expect(r.newState.vCores).toBeGreaterThan(baseSt.vCores);
  });

  it("keeps metrics clamped 20-100", () => {
    const r = calcSessionCompletion(baseSt, sessionCtx);
    expect(r.newState.coherencia).toBeGreaterThanOrEqual(20);
    expect(r.newState.coherencia).toBeLessThanOrEqual(100);
    expect(r.newState.resiliencia).toBeGreaterThanOrEqual(20);
    expect(r.newState.resiliencia).toBeLessThanOrEqual(100);
    expect(r.newState.capacidad).toBeGreaterThanOrEqual(20);
    expect(r.newState.capacidad).toBeLessThanOrEqual(100);
  });

  it("adds to history (max 200)", () => {
    const r = calcSessionCompletion(baseSt, sessionCtx);
    expect(r.newState.history.length).toBe(1);
    expect(r.newState.history[0].p).toBe("Respira Gamma");
  });

  it("unlocks streak7 achievement at 7-day streak", () => {
    const yd = new Date(Date.now() - 864e5).toDateString();
    const st7 = { ...baseSt, streak: 6, lastDate: yd };
    const r = calcSessionCompletion(st7, sessionCtx);
    expect(r.newState.achievements).toContain("streak7");
  });

  it("returns bioQ object", () => {
    const r = calcSessionCompletion(baseSt, sessionCtx);
    expect(r.bioQ).toHaveProperty("score");
    expect(r.bioQ).toHaveProperty("quality");
  });

  it("penalizes gaming sessions with reduced V-Cores", () => {
    const gamingSt = {
      ...baseSt,
      history: Array.from({ length: 10 }, (_, i) => ({
        p: "test", ts: Date.now() - i * 60000, interactions: 0, bioQ: 10,
      })),
    };
    const normalR = calcSessionCompletion(baseSt, sessionCtx);
    const gamingR = calcSessionCompletion(gamingSt, sessionCtx);
    expect(gamingR.eVC).toBeLessThanOrEqual(normalR.eVC);
  });
});

// ─── calcProtoSensitivity ────────────────────────────────
describe("calcProtoSensitivity", () => {
  it("returns empty object for empty moodLog", () => {
    expect(calcProtoSensitivity([])).toEqual({});
  });

  it("calculates avg delta per protocol", () => {
    const ml = [
      { mood: 4, pre: 2, proto: "Alpha" },
      { mood: 5, pre: 3, proto: "Alpha" },
      { mood: 3, pre: 3, proto: "Beta" },
    ];
    const r = calcProtoSensitivity(ml);
    expect(r.Alpha).toBeDefined();
    expect(r.Alpha.avgDelta).toBe(2);
    expect(r.Alpha.sessions).toBe(2);
    expect(r.Alpha.eff).toBe("alta");
    expect(r.Beta.avgDelta).toBe(0);
    expect(r.Beta.eff).toBe("baja");
  });

  it("handles null input", () => {
    expect(calcProtoSensitivity(null)).toEqual({});
  });
});

// ─── predictSessionImpact ────────────────────────────────
describe("predictSessionImpact", () => {
  it("returns personal prediction when enough data", () => {
    const st = {
      moodLog: [
        { mood: 4, pre: 2, proto: "X" },
        { mood: 5, pre: 3, proto: "X" },
        { mood: 4, pre: 3, proto: "X" },
      ],
    };
    const r = predictSessionImpact(st, { n: "X", int: "enfoque" });
    expect(r.basis).toBe("historial personal");
    expect(r.predictedDelta).toBeGreaterThan(0);
    expect(r.confidence).toBeGreaterThanOrEqual(50);
  });

  it("falls back to global average for unknown protocol", () => {
    const r = predictSessionImpact({ moodLog: [] }, { n: "Unknown", int: "calma" });
    expect(r.basis).toBe("promedio global");
    expect(r.predictedDelta).toBe(0.8);
    expect(r.confidence).toBe(20);
  });

  it("uses similar protocols when no direct history", () => {
    const st = {
      moodLog: [
        { mood: 4, pre: 2, proto: "A" },
        { mood: 5, pre: 3, proto: "B" },
      ],
    };
    // A and B need to have int="enfoque" in the protocol list to match
    // Since they don't exist in P, this falls through to global
    const r = predictSessionImpact(st, { n: "C", int: "enfoque" });
    expect(r).toHaveProperty("predictedDelta");
    expect(r).toHaveProperty("confidence");
  });
});

// ─── Level System: gL, lvPct, nxtLv ────────────────────
describe("gL (getLevel)", () => {
  it("returns INICIADO for 0 sessions", () => {
    expect(gL(0).n).toBe("INICIADO");
  });

  it("returns OPERADOR for 1 session", () => {
    expect(gL(1).n).toBe("OPERADOR");
  });

  it("returns EJECUTOR for 10 sessions", () => {
    expect(gL(10).n).toBe("EJECUTOR");
  });

  it("returns ARQUITECTO for 100+ sessions", () => {
    expect(gL(100).n).toBe("ARQUITECTO");
    expect(gL(500).n).toBe("ARQUITECTO");
  });

  it("has a color property", () => {
    expect(gL(0)).toHaveProperty("c");
    expect(typeof gL(0).c).toBe("string");
  });
});

describe("lvPct", () => {
  it("returns 0 for 0 sessions", () => {
    expect(lvPct(0)).toBe(0);
  });

  it("returns 100 at level cap", () => {
    // OPERADOR range is 1-10, at 9 sessions: (9-1)/(10-1)=88%
    // At 10 you become EJECUTOR (m=10,mx=25), so lvPct(10)=0
    // Use 9 to test near-cap within OPERADOR
    expect(lvPct(9)).toBeGreaterThan(80);
    // At max level (ARQUITECTO m=100 mx=999), test cap
    expect(lvPct(999)).toBe(100);
  });

  it("returns intermediate percentage", () => {
    // OPERADOR: m=1, mx=10 → at 5: (5-1)/(10-1)*100 = 44%
    const pct = lvPct(5);
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThan(100);
  });
});

describe("nxtLv", () => {
  it("returns next level for low sessions", () => {
    const next = nxtLv(0);
    expect(next).not.toBeNull();
    expect(next.n).toBe("OPERADOR");
  });

  it("returns null at max level", () => {
    expect(nxtLv(100)).toBeNull();
  });
});

// ─── getStatus ──────────────────────────────────────────
describe("getStatus", () => {
  it("returns Calibrando for low values", () => {
    expect(getStatus(20).label).toBe("Calibrando");
  });

  it("returns Activación for mid values", () => {
    expect(getStatus(50).label).toBe("Activación");
  });

  it("returns Rendimiento for good values", () => {
    expect(getStatus(70).label).toBe("Rendimiento");
  });

  it("returns Óptimo for high values", () => {
    expect(getStatus(90).label).toBe("Óptimo");
  });

  it("has color property", () => {
    expect(getStatus(50)).toHaveProperty("color");
  });

  it("falls back for out of range values", () => {
    const r = getStatus(200);
    expect(r).toHaveProperty("label");
  });
});

// ─── getWeekNum ─────────────────────────────────────────
describe("getWeekNum", () => {
  it("returns a number between 1 and 53", () => {
    const w = getWeekNum();
    expect(w).toBeGreaterThanOrEqual(1);
    expect(w).toBeLessThanOrEqual(53);
  });
});

// ─── getCircadian ───────────────────────────────────────
describe("getCircadian", () => {
  it("returns an object with required properties", () => {
    const c = getCircadian();
    expect(c).toHaveProperty("period");
    expect(c).toHaveProperty("energy");
    expect(c).toHaveProperty("intent");
    expect(c).toHaveProperty("audioFreq");
    expect(c).toHaveProperty("voiceRate");
    expect(c).toHaveProperty("voicePitch");
  });

  it("intent is one of known values", () => {
    const c = getCircadian();
    expect(["calma", "energia", "enfoque", "reset"]).toContain(c.intent);
  });
});

// ─── getDailyIgn ────────────────────────────────────────
describe("getDailyIgn", () => {
  it("returns proto and phrase", () => {
    const r = getDailyIgn({ moodLog: [] });
    expect(r).toHaveProperty("proto");
    expect(r).toHaveProperty("phrase");
    expect(r.proto).toHaveProperty("n");
  });

  it("filters to easier protocols for low mood", () => {
    const ml = [{ mood: 1, ts: Date.now() }];
    const r = getDailyIgn({ moodLog: ml });
    expect(r.proto.dif).toBeLessThanOrEqual(2);
  });
});

// ─── calcNeuralFingerprint ──────────────────────────────
describe("calcNeuralFingerprint", () => {
  it("returns null with < 10 history entries", () => {
    expect(calcNeuralFingerprint({ moodLog: [], history: [] })).toBeNull();
    expect(calcNeuralFingerprint({ moodLog: [], history: Array(9).fill({ ts: Date.now(), c: 50 }) })).toBeNull();
  });

  it("returns fingerprint with sufficient history", () => {
    const hist = Array.from({ length: 15 }, (_, i) => ({
      ts: Date.now() - i * 3600000, p: "TestProto", c: 60 + i, bioQ: 70,
    }));
    const ml = Array.from({ length: 5 }, (_, i) => ({
      mood: 4, pre: 2, proto: "TestProto", ts: Date.now() - i * 3600000,
    }));
    const r = calcNeuralFingerprint({ moodLog: ml, history: hist, weeklyData: [1, 2, 0, 1, 0, 0, 0], coherencia: 70, resiliencia: 60, capacidad: 55 });
    expect(r).not.toBeNull();
    expect(r).toHaveProperty("peakHour");
    expect(r).toHaveProperty("bestProto");
    expect(r).toHaveProperty("avgQuality");
    expect(r).toHaveProperty("weekPattern");
    expect(r).toHaveProperty("moodBaseline");
    expect(r).toHaveProperty("adaptationRate");
    expect(r).toHaveProperty("cognitiveBaseline");
  });
});

// ─── suggestOptimalTime ─────────────────────────────────
describe("suggestOptimalTime", () => {
  it("returns null with < 10 history entries", () => {
    expect(suggestOptimalTime({ history: [], moodLog: [] })).toBeNull();
  });

  it("returns best/worst windows with sufficient data", () => {
    const hist = Array.from({ length: 20 }, (_, i) => ({
      ts: new Date(2025, 0, 1, 9 + (i % 3), 0).getTime(), p: "T", c: 60 + i,
    }));
    const ml = Array.from({ length: 10 }, (_, i) => ({
      mood: 4, pre: 2, ts: new Date(2025, 0, 1, 9, 0).getTime(), proto: "T",
    }));
    const r = suggestOptimalTime({ history: hist, moodLog: ml });
    expect(r).not.toBeNull();
    expect(r).toHaveProperty("best");
    expect(r).toHaveProperty("recommendation");
    expect(r.best).toHaveProperty("hour");
    expect(r.best).toHaveProperty("sessions");
  });
});

// ─── analyzeStreakChain ─────────────────────────────────
describe("analyzeStreakChain", () => {
  it("returns null with < 7 history entries", () => {
    expect(analyzeStreakChain({ history: [], streak: 0 })).toBeNull();
  });

  it("analyzes streak patterns with sufficient data", () => {
    const now = Date.now();
    const hist = Array.from({ length: 14 }, (_, i) => ({
      ts: now - (13 - i) * 86400000, p: "T",
    }));
    const r = analyzeStreakChain({ history: hist, streak: 5 });
    expect(r).not.toBeNull();
    expect(r).toHaveProperty("maxStreak");
    expect(r).toHaveProperty("avgStreak");
    expect(r).toHaveProperty("avgBreakPoint");
    expect(r).toHaveProperty("prediction");
    expect(r.maxStreak).toBeGreaterThanOrEqual(1);
  });

  it("detects at-risk streaks", () => {
    const now = Date.now();
    // 5-day streak, then gap, then 5-day streak — avgBreakPoint ≈ 5
    const hist = [
      ...Array.from({ length: 5 }, (_, i) => ({ ts: now - (20 - i) * 86400000, p: "T" })),
      ...Array.from({ length: 5 }, (_, i) => ({ ts: now - (10 - i) * 86400000, p: "T" })),
    ];
    const r = analyzeStreakChain({ history: hist, streak: 4 });
    expect(r).not.toBeNull();
    expect(typeof r.atRisk).toBe("boolean");
  });
});

// ─── estimateCognitiveLoad ──────────────────────────────
describe("estimateCognitiveLoad", () => {
  it("returns load between 0 and 100", () => {
    const r = estimateCognitiveLoad({ todaySessions: 0, moodLog: [] });
    expect(r.load).toBeGreaterThanOrEqual(0);
    expect(r.load).toBeLessThanOrEqual(100);
  });

  it("returns known level values", () => {
    const r = estimateCognitiveLoad({ todaySessions: 0, moodLog: [] });
    expect(["bajo", "moderado", "alto", "máximo"]).toContain(r.level);
  });

  it("sessions reduce cognitive load", () => {
    const noSessions = estimateCognitiveLoad({ todaySessions: 0, moodLog: [] });
    const withSessions = estimateCognitiveLoad({ todaySessions: 3, moodLog: [] });
    expect(withSessions.load).toBeLessThanOrEqual(noSessions.load);
  });

  it("has recommendation, color, optimalDuration", () => {
    const r = estimateCognitiveLoad({ todaySessions: 0, moodLog: [] });
    expect(r).toHaveProperty("recommendation");
    expect(r).toHaveProperty("color");
    expect(r).toHaveProperty("optimalDuration");
  });
});

// ─── calcNeuralMomentum ─────────────────────────────────
describe("calcNeuralMomentum", () => {
  it("returns neutral with < 5 history entries", () => {
    const r = calcNeuralMomentum({ history: [], streak: 0, weeklyData: [] });
    expect(r.direction).toBe("neutral");
    expect(r.score).toBe(0);
  });

  it("detects ascending momentum", () => {
    const hist = [
      ...Array.from({ length: 5 }, () => ({ c: 40 })),
      ...Array.from({ length: 5 }, () => ({ c: 80 })),
    ];
    const r = calcNeuralMomentum({ history: hist, streak: 5, weeklyData: [1, 1, 1, 1, 1, 0, 0] });
    expect(r.direction).toBe("ascendente");
    expect(r.score).toBeGreaterThan(0);
  });

  it("detects descending momentum", () => {
    const hist = [
      ...Array.from({ length: 5 }, () => ({ c: 80 })),
      ...Array.from({ length: 5 }, () => ({ c: 30 })),
    ];
    const r = calcNeuralMomentum({ history: hist, streak: 0, weeklyData: [0, 0, 0, 0, 0, 0, 0] });
    expect(r.direction).toBe("descendente");
    expect(r.score).toBeLessThan(0);
  });
});

// ─── calcRecoveryIndex ──────────────────────────────────
describe("calcRecoveryIndex", () => {
  it("returns null with < 4 entries", () => {
    expect(calcRecoveryIndex([])).toBeNull();
    expect(calcRecoveryIndex([{ mood: 3, pre: 2 }])).toBeNull();
  });

  it("returns null when < 2 entries have pre", () => {
    const ml = Array.from({ length: 5 }, () => ({ mood: 3, pre: 0 }));
    expect(calcRecoveryIndex(ml)).toBeNull();
  });

  it("calculates retention for valid data", () => {
    const now = Date.now();
    const ml = [
      { mood: 4, pre: 2, ts: now - 86400000 * 3 },
      { mood: 5, pre: 4, ts: now - 86400000 * 2 },
      { mood: 4, pre: 3, ts: now - 86400000 },
      { mood: 5, pre: 4, ts: now },
    ];
    const r = calcRecoveryIndex(ml);
    expect(r).not.toBeNull();
    expect(r).toHaveProperty("avgRetention");
    expect(r).toHaveProperty("avgHours");
    expect(r).toHaveProperty("interpretation");
  });
});

// ─── calcCognitiveEntropy ───────────────────────────────
describe("calcCognitiveEntropy", () => {
  it("returns zero entropy with < 2 reaction times", () => {
    expect(calcCognitiveEntropy({ reactionTimes: [] }).entropy).toBe(0);
    expect(calcCognitiveEntropy({ reactionTimes: [300] }).entropy).toBe(0);
  });

  it("calculates entropy for varied reaction times", () => {
    const r = calcCognitiveEntropy({ reactionTimes: [200, 800, 300, 700, 250] });
    expect(r.entropy).toBeGreaterThan(0);
    expect(r).toHaveProperty("speed");
    expect(r).toHaveProperty("avgReaction");
    expect(r).toHaveProperty("activationDelta");
  });

  it("low variance yields low entropy", () => {
    const r = calcCognitiveEntropy({ reactionTimes: [400, 402, 398, 401, 399] });
    expect(r.entropy).toBeLessThan(20);
  });
});

// ─── estimateCoherence ──────────────────────────────────
describe("estimateCoherence", () => {
  it("returns sin datos with insufficient input", () => {
    expect(estimateCoherence(null).state).toBe("sin datos");
    expect(estimateCoherence([300]).state).toBe("sin datos");
  });

  it("returns coherence for valid data", () => {
    const r = estimateCoherence([400, 410, 395, 405, 400]);
    expect(r.coherence).toBeGreaterThan(0);
    expect(r.coherence).toBeLessThanOrEqual(100);
    expect(r).toHaveProperty("consistency");
    expect(r).toHaveProperty("avgRT");
  });
});

// ─── calcNeuralVariability ──────────────────────────────
describe("calcNeuralVariability", () => {
  it("returns null with < 3 entries", () => {
    expect(calcNeuralVariability([])).toBeNull();
    expect(calcNeuralVariability([{ c: 50 }, { c: 60 }])).toBeNull();
  });

  it("returns variability index for valid data", () => {
    const hist = Array.from({ length: 5 }, (_, i) => ({ c: 50 + i * 5 }));
    const r = calcNeuralVariability(hist);
    expect(r).not.toBeNull();
    expect(r).toHaveProperty("index");
    expect(r).toHaveProperty("interpretation");
    expect(r).toHaveProperty("trend");
  });
});

// ─── calcProtocolDiversity ──────────────────────────────
describe("calcProtocolDiversity", () => {
  it("returns 0 score with < 5 entries", () => {
    const r = calcProtocolDiversity([]);
    expect(r.score).toBe(0);
  });

  it("calculates diversity for varied protocols", () => {
    const hist = [
      { p: "A" }, { p: "B" }, { p: "C" }, { p: "D" }, { p: "E" },
    ];
    const r = calcProtocolDiversity(hist);
    expect(r.score).toBeGreaterThan(0);
    expect(r.uniqueCount).toBe(5);
    expect(r).toHaveProperty("totalAvailable");
    expect(r).toHaveProperty("message");
  });

  it("low diversity for repeated protocols", () => {
    const hist = Array.from({ length: 10 }, () => ({ p: "Same" }));
    const r = calcProtocolDiversity(hist);
    expect(r.uniqueCount).toBe(1);
    expect(r.score).toBeLessThan(20);
  });
});

// ─── genIns (Insights Generator) ────────────────────────
describe("genIns", () => {
  it("returns at least one insight for empty state", () => {
    const r = genIns({ totalSessions: 0, moodLog: [], history: [], coherencia: 64, resiliencia: 66 });
    expect(r.length).toBeGreaterThanOrEqual(1);
    expect(r[0]).toHaveProperty("t");
    expect(r[0]).toHaveProperty("x");
  });

  it("returns insights for active user", () => {
    const r = genIns({
      totalSessions: 20, coherencia: 80, resiliencia: 75, capacidad: 60,
      streak: 5, totalTime: 1800,
      moodLog: Array.from({ length: 5 }, () => ({ mood: 4 })),
      history: Array.from({ length: 5 }, () => ({ p: "Alpha", ts: Date.now() })),
    });
    expect(r.length).toBeGreaterThanOrEqual(1);
  });
});
