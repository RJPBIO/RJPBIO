import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  calcBioQuality,
  calcBurnoutIndex,
  calcBioSignal,
  detectGamingPattern,
  adaptiveProtocolEngine,
  calcSessionCompletion,
  calcProtoSensitivity,
  predictSessionImpact,
  gL, lvPct, nxtLv, getStatus, getWeekNum,
  calcNeuralFingerprint, calcCognitiveEntropy, estimateCoherence,
  calcRecoveryIndex, genIns, smartSuggest, getRecords,
  getDailyIgn, getCircadian, calcNeuralVariability,
  calcProtocolCorrelations, calcNeuralMomentum, estimateCognitiveLoad,
  analyzeNeuralRhythm, generateCoachingInsights, calcProtocolDiversity,
  calcSessionQualityTrend, analyzeStreakChain, suggestOptimalTime,
  interpretCalibration,
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

// ─── levels (gL / lvPct / nxtLv) ─────────────────────────
describe("levels", () => {
  it("gL: 0 sesiones → INICIADO", () => {
    expect(gL(0).n).toBe("INICIADO");
  });
  it("gL: 5 sesiones → OPERADOR", () => {
    expect(gL(5).n).toBe("OPERADOR");
  });
  it("gL: 25 sesiones → ESTRATEGA", () => {
    expect(gL(25).n).toBe("ESTRATEGA");
  });
  it("gL: 500 sesiones → ARQUITECTO", () => {
    expect(gL(500).n).toBe("ARQUITECTO");
  });
  it("lvPct: dentro del rango calcula porcentaje", () => {
    const p = lvPct(15);
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThanOrEqual(100);
  });
  it("lvPct: supera max → 100", () => {
    expect(lvPct(9999)).toBe(100);
  });
  it("nxtLv: INICIADO tiene siguiente OPERADOR", () => {
    expect(nxtLv(0).n).toBe("OPERADOR");
  });
  it("nxtLv: último nivel → null", () => {
    expect(nxtLv(999)).toBeNull();
  });
});

describe("getStatus / getWeekNum", () => {
  it("getStatus: 30 → Calibrando", () => {
    expect(getStatus(30).label).toBe("Calibrando");
  });
  it("getStatus: 50 → Activación", () => {
    expect(getStatus(50).label).toBe("Activación");
  });
  it("getStatus: 90 → Óptimo", () => {
    expect(getStatus(90).label).toBe("Óptimo");
  });
  it("getStatus: fuera de rango → fallback", () => {
    const r = getStatus(-5);
    expect(r).toBeDefined();
  });
  it("getWeekNum devuelve número de semana válido", () => {
    const w = getWeekNum();
    expect(w).toBeGreaterThan(0);
    expect(w).toBeLessThan(55);
  });
});

describe("calcNeuralFingerprint", () => {
  it("< 10 sesiones → null", () => {
    expect(calcNeuralFingerprint({ history: [], moodLog: [] })).toBeNull();
  });
  it("≥ 10 sesiones → objeto completo", () => {
    const hist = Array.from({ length: 15 }, (_, i) => ({
      ts: Date.now() - i * 3600000, c: 60 + i, bioQ: 70, p: "Reinicio Parasimpático",
    }));
    const ml = Array.from({ length: 15 }, () => ({ proto: "Reinicio Parasimpático", pre: 2, mood: 4, ts: Date.now() }));
    const r = calcNeuralFingerprint({ history: hist, moodLog: ml, weeklyData: [1, 1, 1, 1, 1, 0, 0], coherencia: 70, resiliencia: 60, capacidad: 65 });
    expect(r).not.toBeNull();
    expect(r.peakHour).toBeGreaterThanOrEqual(0);
    expect(r.avgQuality).toBeGreaterThanOrEqual(0);
    expect(r.cognitiveBaseline).toBeDefined();
  });
});

describe("calcCognitiveEntropy", () => {
  it("< 2 rt → neutral", () => {
    const r = calcCognitiveEntropy({ reactionTimes: [500] });
    expect(r.state).toBe("neutral");
  });
  it("vacío → neutral", () => {
    const r = calcCognitiveEntropy({});
    expect(r.state).toBe("neutral");
  });
  it("rt consistentes → baja entropía", () => {
    const r = calcCognitiveEntropy({ reactionTimes: [500, 510, 505, 498, 502] });
    expect(r.entropy).toBeLessThan(50);
  });
  it("speed alta con rt rápido", () => {
    const fast = calcCognitiveEntropy({ reactionTimes: [300, 350] });
    expect(fast.speed).toBe("alta");
  });
  it("speed baja con rt lento", () => {
    const slow = calcCognitiveEntropy({ reactionTimes: [900, 900] });
    expect(slow.speed).toBe("baja");
  });
  it("speed media con rt 500-599", () => {
    const r = calcCognitiveEntropy({ reactionTimes: [500, 550] });
    expect(r.speed).toBe("media");
  });
  it("speed normal con rt 600-799", () => {
    const r = calcCognitiveEntropy({ reactionTimes: [700, 700] });
    expect(r.speed).toBe("normal");
  });
});

describe("estimateCoherence", () => {
  it("sin datos → sin datos", () => {
    const r = estimateCoherence([]);
    expect(r.state).toBe("sin datos");
  });
  it("null → sin datos", () => {
    const r = estimateCoherence(null);
    expect(r.state).toBe("sin datos");
  });
  it("< 2 → sin datos", () => {
    const r = estimateCoherence([500]);
    expect(r.state).toBe("sin datos");
  });
  it("consistentes → alta coherencia", () => {
    const r = estimateCoherence([500, 510, 505, 498, 502, 500, 500, 505, 498, 502]);
    expect(r.coherence).toBeGreaterThan(50);
  });
  it("variables → baja coherencia", () => {
    const r = estimateCoherence([100, 900, 200, 800]);
    expect(r.state).toMatch(/coherencia/);
  });
});

describe("calcRecoveryIndex", () => {
  it("< 4 moodLog → null", () => {
    expect(calcRecoveryIndex([{}, {}])).toBeNull();
  });
  it("null → null", () => {
    expect(calcRecoveryIndex(null)).toBeNull();
  });
  it("sin entradas con pre → null", () => {
    const ml = [{ mood: 3 }, { mood: 4 }, { mood: 5 }, { mood: 3 }];
    expect(calcRecoveryIndex(ml)).toBeNull();
  });
  it("calcula retención", () => {
    const now = Date.now();
    const ml = [
      { pre: 2, mood: 4, ts: now - 20 * 3600000 },
      { pre: 3, mood: 4, ts: now - 10 * 3600000 },
      { pre: 3, mood: 5, ts: now - 5 * 3600000 },
      { pre: 4, mood: 5, ts: now },
    ];
    const r = calcRecoveryIndex(ml);
    expect(r).not.toBeNull();
    expect(r.avgRetention).toBeGreaterThan(0);
    expect(r.interpretation).toBeDefined();
  });
});

describe("genIns", () => {
  it("sin datos → al menos una recomendación", () => {
    const r = genIns({ totalSessions: 0, history: [], moodLog: [], weeklyData: [] });
    expect(r.length).toBeGreaterThanOrEqual(1);
  });
  it("coherencia alta → insight 'up'", () => {
    const r = genIns({ totalSessions: 5, coherencia: 80, resiliencia: 66, streak: 0, totalTime: 100, moodLog: [], history: [], weeklyData: [] });
    expect(r.some((x) => x.t === "up")).toBe(true);
  });
  it("streak ≥3 → incluye 'fire'", () => {
    const r = genIns({ totalSessions: 5, coherencia: 64, resiliencia: 66, streak: 5, totalTime: 300, moodLog: [], history: [], weeklyData: [] });
    expect(r.some((x) => x.t === "fire")).toBe(true);
  });
  it("mood promedio bajo → alerta", () => {
    const r = genIns({ totalSessions: 5, coherencia: 64, resiliencia: 66, streak: 0, totalTime: 100, moodLog: [{ mood: 1 }, { mood: 2 }, { mood: 1 }], history: [], weeklyData: [] });
    expect(r.some((x) => x.t === "alert")).toBe(true);
  });
  it("mismo protocolo 3 veces → sugiere diversidad", () => {
    const r = genIns({ totalSessions: 5, coherencia: 64, resiliencia: 66, streak: 0, totalTime: 100, moodLog: [], history: [{ p: "A" }, { p: "A" }, { p: "A" }], weeklyData: [] });
    expect(r.some((x) => x.t === "rec")).toBe(true);
  });
});

describe("smartSuggest", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });
  it("retorna un protocolo", () => {
    const r = smartSuggest({ moodLog: [], history: [] });
    expect(r).toBeDefined();
    expect(r.n).toBeDefined();
    expect(r.int).toBeDefined();
  });
  it("mañana con mood bajo → reset", () => {
    vi.setSystemTime(new Date("2026-04-16T07:00:00"));
    const r = smartSuggest({ moodLog: [{ mood: 1 }], history: [] });
    expect(r.int).toBe("reset");
  });
  it("mañana con mood normal → energia", () => {
    vi.setSystemTime(new Date("2026-04-16T07:00:00"));
    const r = smartSuggest({ moodLog: [{ mood: 4 }], history: [] });
    expect(r.int).toBe("energia");
  });
  it("medio día → enfoque", () => {
    vi.setSystemTime(new Date("2026-04-16T11:00:00"));
    const r = smartSuggest({ moodLog: [], history: [] });
    expect(r.int).toBe("enfoque");
  });
  it("noche → calma", () => {
    vi.setSystemTime(new Date("2026-04-16T22:00:00"));
    const r = smartSuggest({ moodLog: [], history: [] });
    expect(r.int).toBe("calma");
  });
});

describe("getRecords", () => {
  it("sin historial devuelve defaults", () => {
    const r = getRecords({ history: [], streak: 0, coherencia: 50 });
    expect(r.maxC).toBe(50);
    expect(r.topProto).toBeNull();
  });
  it("calcula maxC y topProto", () => {
    const hist = [
      { p: "A", c: 70, ts: Date.now() - 1000 },
      { p: "A", c: 85, ts: Date.now() - 500 },
      { p: "B", c: 60, ts: Date.now() },
    ];
    const r = getRecords({ history: hist, streak: 5, coherencia: 60 });
    expect(r.maxC).toBe(85);
    expect(r.topProto.n).toBe("A");
  });
});

describe("getDailyIgn / getCircadian", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });
  it("getDailyIgn retorna proto + phrase", () => {
    vi.setSystemTime(new Date("2026-04-16T10:00:00"));
    const r = getDailyIgn({ moodLog: [] });
    expect(r.proto).toBeDefined();
    expect(r.phrase).toBeDefined();
  });
  it("getDailyIgn con mood bajo filtra dif ≤2", () => {
    vi.setSystemTime(new Date("2026-04-16T10:00:00"));
    const r = getDailyIgn({ moodLog: [{ mood: 1 }] });
    expect(r.proto.dif).toBeLessThanOrEqual(2);
  });
  it("getCircadian amanecer", () => {
    vi.setSystemTime(new Date("2026-04-16T06:00:00"));
    expect(getCircadian().period).toBe("amanecer");
  });
  it("getCircadian mañana", () => {
    vi.setSystemTime(new Date("2026-04-16T10:00:00"));
    expect(getCircadian().period).toBe("mañana");
  });
  it("getCircadian mediodía", () => {
    vi.setSystemTime(new Date("2026-04-16T14:00:00"));
    expect(getCircadian().period).toBe("mediodía");
  });
  it("getCircadian tarde", () => {
    vi.setSystemTime(new Date("2026-04-16T17:00:00"));
    expect(getCircadian().period).toBe("tarde");
  });
  it("getCircadian noche", () => {
    vi.setSystemTime(new Date("2026-04-16T21:00:00"));
    expect(getCircadian().period).toBe("noche");
  });
  it("getCircadian madrugada", () => {
    vi.setSystemTime(new Date("2026-04-16T03:00:00"));
    expect(getCircadian().period).toBe("madrugada");
  });
});

describe("calcNeuralVariability", () => {
  it("< 3 hist → null", () => {
    expect(calcNeuralVariability([{ c: 50 }])).toBeNull();
  });
  it("null → null", () => {
    expect(calcNeuralVariability(null)).toBeNull();
  });
  it("estables → baja", () => {
    const hist = Array.from({ length: 10 }, () => ({ c: 70 }));
    const r = calcNeuralVariability(hist);
    expect(r.index).toBeLessThan(5);
    expect(r.interpretation).toMatch(/Estabilidad/);
  });
  it("variables → alta", () => {
    const hist = [{ c: 20 }, { c: 90 }, { c: 30 }, { c: 95 }, { c: 25 }];
    const r = calcNeuralVariability(hist);
    expect(r.index).toBeGreaterThan(15);
  });
});

describe("calcProtocolCorrelations", () => {
  it("< 5 entradas → null", () => {
    expect(calcProtocolCorrelations({ moodLog: [] })).toBeNull();
  });
  it("agrupa por proto y detecta bestTimeOfDay", () => {
    const morning = new Date("2026-04-16T09:00:00").getTime();
    const afternoon = new Date("2026-04-16T15:00:00").getTime();
    const ml = [
      { proto: "A", pre: 2, mood: 4, ts: morning },
      { proto: "A", pre: 2, mood: 5, ts: morning + 60000 },
      { proto: "A", pre: 3, mood: 3, ts: afternoon },
      { proto: "B", pre: 2, mood: 4, ts: morning },
      { proto: "B", pre: 3, mood: 4, ts: afternoon },
    ];
    const r = calcProtocolCorrelations({ moodLog: ml });
    expect(r.A).toBeDefined();
    expect(r.A.bestTimeOfDay).toBe("mañana");
    expect(r.A.sessions).toBe(3);
  });
});

describe("calcNeuralMomentum", () => {
  it("< 5 hist → score 0 neutral", () => {
    const r = calcNeuralMomentum({ history: [] });
    expect(r.score).toBe(0);
    expect(r.direction).toBe("neutral");
  });
  it("< 8 hist (prev5 <3) → neutral", () => {
    const r = calcNeuralMomentum({ history: [{ c: 50 }, { c: 55 }, { c: 60 }, { c: 65 }, { c: 70 }, { c: 75 }] });
    expect(r.direction).toBe("neutral");
  });
  it("ascendente con streak", () => {
    const hist = [
      { c: 40 }, { c: 42 }, { c: 44 }, { c: 46 }, { c: 48 },
      { c: 70 }, { c: 75 }, { c: 80 }, { c: 85 }, { c: 88 },
    ];
    const r = calcNeuralMomentum({ history: hist, streak: 5, weeklyData: [1, 1, 1, 1, 1, 1, 1] });
    expect(r.direction).toBe("ascendente");
    expect(r.delta).toBeGreaterThan(0);
  });
  it("descendente cuando metrics caen", () => {
    const hist = [
      { c: 90 }, { c: 88 }, { c: 85 }, { c: 82 }, { c: 80 },
      { c: 40 }, { c: 42 }, { c: 38 }, { c: 35 }, { c: 40 },
    ];
    const r = calcNeuralMomentum({ history: hist, streak: 0, weeklyData: [0, 0, 0, 0, 0, 0, 0] });
    expect(r.direction).toBe("descendente");
  });
});

describe("estimateCognitiveLoad", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });
  it("mañana temprano → carga baja", () => {
    vi.setSystemTime(new Date("2026-04-15T07:00:00"));
    const r = estimateCognitiveLoad({ moodLog: [] });
    expect(r.level).toBe("bajo");
  });
  it("noche → carga alta/máxima", () => {
    vi.setSystemTime(new Date("2026-04-15T22:00:00"));
    const r = estimateCognitiveLoad({ moodLog: [] });
    expect(["alto", "máximo"]).toContain(r.level);
  });
  it("mood bajo aumenta carga", () => {
    vi.setSystemTime(new Date("2026-04-15T15:00:00"));
    const normal = estimateCognitiveLoad({ moodLog: [{ mood: 3 }] });
    const estresado = estimateCognitiveLoad({ moodLog: [{ mood: 1 }] });
    expect(estresado.load).toBeGreaterThan(normal.load);
  });
  it("mood alto reduce carga", () => {
    vi.setSystemTime(new Date("2026-04-15T15:00:00"));
    const normal = estimateCognitiveLoad({ moodLog: [{ mood: 3 }] });
    const optimo = estimateCognitiveLoad({ moodLog: [{ mood: 5 }] });
    expect(optimo.load).toBeLessThan(normal.load);
  });
  it("sesiones hoy reducen carga", () => {
    vi.setSystemTime(new Date("2026-04-15T15:00:00"));
    const sin = estimateCognitiveLoad({ moodLog: [] });
    const con = estimateCognitiveLoad({ moodLog: [], todaySessions: 3 });
    expect(con.load).toBeLessThan(sin.load);
  });
  it("retorna campos requeridos", () => {
    vi.setSystemTime(new Date("2026-04-15T10:00:00"));
    const r = estimateCognitiveLoad({ moodLog: [] });
    expect(r.load).toBeDefined();
    expect(r.level).toBeDefined();
    expect(r.recommendation).toBeDefined();
    expect(r.color).toMatch(/^#/);
  });
});

describe("analyzeNeuralRhythm", () => {
  it("< 8 hist → null", () => {
    expect(analyzeNeuralRhythm({ history: [] })).toBeNull();
  });
  it("≥ 8 hist retorna ventana pico + pattern", () => {
    const base = new Date("2026-04-16T10:00:00").getTime();
    const hist = Array.from({ length: 12 }, (_, i) => ({
      ts: base + i * 3600000, c: 70, p: "Test",
    }));
    const r = analyzeNeuralRhythm({ history: hist });
    expect(r).not.toBeNull();
    expect(r.peakWindow).toBeDefined();
    expect(r.consistency).toBeGreaterThanOrEqual(0);
    expect(r.pattern).toMatch(/Ritmo/);
    expect(r.bestDay).toBeDefined();
  });
});

describe("generateCoachingInsights", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });
  it("sin datos → al menos 1 motivacional", () => {
    vi.setSystemTime(new Date("2026-04-16T10:00:00"));
    const r = generateCoachingInsights({ moodLog: [], history: [], weeklyData: [] });
    expect(r.length).toBeGreaterThanOrEqual(1);
    expect(r[0]).toHaveProperty("type");
  });
  it("streak 7+ → incluye streak insight", () => {
    vi.setSystemTime(new Date("2026-04-16T10:00:00"));
    const hist = Array.from({ length: 10 }, (_, i) => ({
      ts: Date.now() - i * 86400000, p: "A", c: 60, bioQ: 60,
    }));
    const r = generateCoachingInsights({ streak: 7, history: hist, moodLog: [], weeklyData: [] });
    expect(r.some((x) => x.type === "streak")).toBe(true);
  });
  it("streak 30 contiene mensaje distinto", () => {
    vi.setSystemTime(new Date("2026-04-16T10:00:00"));
    const r = generateCoachingInsights({ streak: 30, history: [], moodLog: [], weeklyData: [] });
    const streakIns = r.find((x) => x.type === "streak");
    expect(streakIns.message).toMatch(/Un mes/);
  });
  it("burnout crítico genera insight burnout", () => {
    vi.setSystemTime(new Date("2026-04-16T10:00:00"));
    const ml = Array.from({ length: 14 }, () => ({ mood: 1, ts: Date.now() }));
    const r = generateCoachingInsights({ moodLog: ml, history: [], weeklyData: [] });
    expect(r.some((x) => x.type === "burnout")).toBe(true);
  });
  it("ordenados por prioridad ascendente", () => {
    vi.setSystemTime(new Date("2026-04-16T10:00:00"));
    const r = generateCoachingInsights({ moodLog: [], history: [], weeklyData: [] });
    for (let i = 1; i < r.length; i++) {
      expect(r[i].priority).toBeGreaterThanOrEqual(r[i - 1].priority);
    }
  });
  it("noche genera mensaje nocturno", () => {
    vi.setSystemTime(new Date("2026-04-16T20:00:00"));
    const r = generateCoachingInsights({ moodLog: [], history: [], weeklyData: [] });
    const mot = r.find((x) => x.type === "motivational");
    if (mot) expect(mot.message).toMatch(/sueño|cerebro|consolida/);
  });
});

describe("calcProtocolDiversity", () => {
  it("< 5 → acumulando datos", () => {
    const r = calcProtocolDiversity([{ p: "A" }]);
    expect(r.message).toMatch(/Acumulando/);
  });
  it("null → acumulando", () => {
    const r = calcProtocolDiversity(null);
    expect(r.score).toBe(0);
  });
  it("calcula únicos vs totales", () => {
    const hist = [
      { p: "A" }, { p: "B" }, { p: "C" }, { p: "A" }, { p: "B" }, { p: "D" },
    ];
    const r = calcProtocolDiversity(hist);
    expect(r.uniqueCount).toBe(4);
    expect(r.score).toBeGreaterThan(0);
  });
});

describe("calcSessionQualityTrend", () => {
  it("< 5 hist → null", () => {
    expect(calcSessionQualityTrend([{ bioQ: 60 }])).toBeNull();
  });
  it("null → null", () => {
    expect(calcSessionQualityTrend(null)).toBeNull();
  });
  it("sin bioQ → null", () => {
    expect(calcSessionQualityTrend([{}, {}, {}, {}, {}, {}])).toBeNull();
  });
  it("mejorando", () => {
    const hist = [
      { bioQ: 30 }, { bioQ: 35 }, { bioQ: 40 },
      { bioQ: 80 }, { bioQ: 85 }, { bioQ: 90 },
    ];
    const r = calcSessionQualityTrend(hist);
    expect(r.direction).toBe("mejorando");
  });
  it("deteriorando", () => {
    const hist = [
      { bioQ: 90 }, { bioQ: 85 }, { bioQ: 80 },
      { bioQ: 30 }, { bioQ: 25 }, { bioQ: 20 },
    ];
    const r = calcSessionQualityTrend(hist);
    expect(r.direction).toBe("deteriorando");
  });
});

describe("analyzeStreakChain", () => {
  it("< 7 hist → null", () => {
    expect(analyzeStreakChain({ history: [] })).toBeNull();
  });
  it("reconstruye rachas desde timestamps consecutivos", () => {
    const day = 86400000;
    const start = new Date("2026-04-01T10:00:00").getTime();
    const hist = Array.from({ length: 7 }, (_, i) => ({
      ts: start + i * day, p: "A", c: 60,
    }));
    const r = analyzeStreakChain({ history: hist, streak: 7 });
    expect(r).not.toBeNull();
    expect(r.maxStreak).toBeGreaterThanOrEqual(1);
    expect(r.prediction).toBeDefined();
  });
  it("con gaps detecta múltiples rachas", () => {
    const day = 86400000;
    const start = new Date("2026-04-01T10:00:00").getTime();
    const hist = [
      { ts: start }, { ts: start + day }, { ts: start + 2 * day },
      { ts: start + 10 * day }, { ts: start + 11 * day }, { ts: start + 12 * day },
      { ts: start + 20 * day }, { ts: start + 21 * day },
    ];
    const r = analyzeStreakChain({ history: hist, streak: 2 });
    expect(r.totalStreaks).toBeGreaterThan(1);
  });
});

describe("suggestOptimalTime", () => {
  it("< 10 hist → null", () => {
    expect(suggestOptimalTime({ history: [] })).toBeNull();
  });
  it("agrupa por ventanas de 2h", () => {
    const base = new Date("2026-04-16T10:00:00").getTime();
    const hist = Array.from({ length: 12 }, (_, i) => ({
      ts: base + i * 3600000, c: 70 + i, p: "A",
    }));
    const r = suggestOptimalTime({ history: hist, moodLog: [] });
    expect(r.best).toBeDefined();
    expect(r.best.hour % 2).toBe(0);
    expect(r.recommendation).toBeDefined();
  });
  it("incluye deltas de mood", () => {
    const base = new Date("2026-04-16T10:00:00").getTime();
    const hist = Array.from({ length: 12 }, (_, i) => ({
      ts: base + i * 3600000, c: 70, p: "A",
    }));
    const ml = Array.from({ length: 8 }, (_, i) => ({
      pre: 2, mood: 4, ts: base + i * 3600000,
    }));
    const r = suggestOptimalTime({ history: hist, moodLog: ml });
    expect(r.best.avgDelta).toBeGreaterThanOrEqual(0);
  });
});

describe("interpretCalibration", () => {
  it("null baseline → null", () => {
    expect(interpretCalibration(null)).toBeNull();
  });
  it("scores altos → fortalezas múltiples", () => {
    const r = interpretCalibration({
      rtScore: 80, bhScore: 70, focusAccuracy: 80, stressScore: 70,
      recommendations: { primaryIntent: "enfoque" },
    });
    expect(r.strengths.length).toBeGreaterThanOrEqual(3);
    expect(r.primaryProtocol).toBe("Activación Cognitiva");
  });
  it("intent calma → Reinicio Parasimpático", () => {
    const r = interpretCalibration({
      rtScore: 30, bhScore: 20, focusAccuracy: 30, stressScore: 30,
      recommendations: { primaryIntent: "calma" },
    });
    expect(r.primaryProtocol).toBe("Reinicio Parasimpático");
    expect(r.areas.length).toBeGreaterThanOrEqual(3);
  });
  it("intent default → Pulse Shift", () => {
    const r = interpretCalibration({
      rtScore: 50, bhScore: 50, focusAccuracy: 50, stressScore: 50,
      recommendations: { primaryIntent: "otro" },
    });
    expect(r.primaryProtocol).toBe("Pulse Shift");
  });
});
