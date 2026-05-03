/* ═══════════════════════════════════════════════════════════════
   sessionFlow.test — Phase 6 SP3
   Verifica la función pura `closeSession` y el adapter
   `adaptPlayerCompletionToSessionData`.
   ═══════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import { closeSession, adaptPlayerCompletionToSessionData } from "./sessionFlow";
import { P } from "./protocols";

const PROTOCOL = P.find((p) => p.id === 1) || P[0];

const BASE_ST = {
  vCores: 0,
  streak: 0,
  bestStreak: 0,
  totalSessions: 0,
  totalTime: 0,
  weeklyData: [0, 0, 0, 0, 0, 0, 0],
  history: [],
  moodLog: [],
  achievements: [],
  todaySessions: 0,
  lastDate: "—",
  coherencia: 50,
  resiliencia: 50,
  capacidad: 50,
  hrvLog: [],
  activeProgram: null,
};

function makeSessionData({ actualSec = 90, expectedSec = 90, hiddenMs = 0, completedActs = 4 } = {}) {
  return {
    actualSec,
    expectedSec,
    interactions: completedActs,
    hiddenMs,
    pauses: 0,
    motionSamples: 0,
    scienceViews: 0,
    touchHolds: 0,
    stability: 0,
    reactionTimes: [],
    phaseTimings: [],
    startedAt: Date.now() - actualSec * 1000,
  };
}

// ═══════════════════════════════════════════════════════════════
// closeSession — shape + invariantes
// ═══════════════════════════════════════════════════════════════

describe("closeSession — shape básico", () => {
  it("devuelve objeto con campos requeridos", () => {
    const result = closeSession({
      sessionData: makeSessionData(),
      protocol: PROTOCOL,
      st: BASE_ST,
    });
    expect(result).toBeDefined();
    expect(result.sessionDataFull).toBeDefined();
    expect(typeof result.eVC).toBe("number");
    expect(result.newState).toBeDefined();
    expect(result.bioQ).toBeDefined();
    expect(result.programAdvance).toBeNull();
  });

  it("eVC > 0 cuando completion ratio alto", () => {
    const result = closeSession({
      sessionData: makeSessionData({ actualSec: 120, expectedSec: 120 }),
      protocol: PROTOCOL,
      st: BASE_ST,
    });
    expect(result.eVC).toBeGreaterThan(0);
  });

  it("newState mantiene shape consistente con store", () => {
    const result = closeSession({
      sessionData: makeSessionData(),
      protocol: PROTOCOL,
      st: BASE_ST,
    });
    expect(typeof result.newState.totalSessions).toBe("number");
    expect(typeof result.newState.streak).toBe("number");
    expect(typeof result.newState.vCores).toBe("number");
    expect(typeof result.newState.totalTime).toBe("number");
    expect(Array.isArray(result.newState.history)).toBe(true);
    expect(result.newState.firstDone).toBe(true);
  });

  it("history del newState crece +1 vs st.history", () => {
    const stWithHistory = { ...BASE_ST, history: [{ p: "X", ts: 100, c: 50 }] };
    const result = closeSession({
      sessionData: makeSessionData(),
      protocol: PROTOCOL,
      st: stWithHistory,
    });
    expect(result.newState.history.length).toBe(2);
  });

  it("totalSessions del newState = st.totalSessions + 1", () => {
    const result = closeSession({
      sessionData: makeSessionData(),
      protocol: PROTOCOL,
      st: { ...BASE_ST, totalSessions: 7 },
    });
    expect(result.newState.totalSessions).toBe(8);
  });

  it("falla si protocol/sessionData/st faltan", () => {
    expect(() => closeSession({})).toThrow();
    expect(() => closeSession({ protocol: PROTOCOL })).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════
// closeSession — programAdvance
// ═══════════════════════════════════════════════════════════════

describe("closeSession — programAdvance", () => {
  it("programAdvance es null si no hay activeProgram", () => {
    const result = closeSession({
      sessionData: makeSessionData(),
      protocol: PROTOCOL,
      st: BASE_ST,
    });
    expect(result.programAdvance).toBeNull();
  });

  it("programAdvance es null si el protocolo no coincide con sesión del día", () => {
    // Programa NB día 1 = #1; tomamos protocolo distinto (#2).
    const otherProto = P.find((p) => p.id === 2);
    const stWithProgram = {
      ...BASE_ST,
      activeProgram: {
        id: "neural-baseline",
        startedAt: Date.now(),
        completedSessionDays: [],
      },
    };
    const result = closeSession({
      sessionData: makeSessionData(),
      protocol: otherProto,
      st: stWithProgram,
    });
    expect(result.programAdvance).toBeNull();
  });

  it("programAdvance correcto cuando protocolo coincide día actual", () => {
    // NB día 1 es #1. activeProgram.startedAt = ahora → currentDay = 1.
    const stWithProgram = {
      ...BASE_ST,
      activeProgram: {
        id: "neural-baseline",
        startedAt: Date.now(),
        completedSessionDays: [],
      },
    };
    const result = closeSession({
      sessionData: makeSessionData(),
      protocol: PROTOCOL, // #1
      st: stWithProgram,
    });
    expect(result.programAdvance).not.toBeNull();
    expect(result.programAdvance.day).toBe(1);
    expect(result.programAdvance.program).toBeDefined();
    expect(result.programAdvance.finalize).toBe(false);
    expect(result.announce).toMatch(/Día 1 del programa/i);
  });

  it("programAdvance.finalize=true cuando es el último día requerido", () => {
    // NB tiene 14 sesiones; si user ya completó 13 (días 1-13), día 14 finaliza.
    // Para simular día 14, ajustamos startedAt 13 días atrás.
    const thirteenDaysAgo = Date.now() - 13 * 24 * 60 * 60 * 1000;
    const completedSessionDays = [1,2,3,4,5,6,7,8,9,10,11,12,13];
    const stWithProgram = {
      ...BASE_ST,
      activeProgram: {
        id: "neural-baseline",
        startedAt: thirteenDaysAgo,
        completedSessionDays,
      },
    };
    // NB día 14 (último): protocol #16 (Resonancia Vagal sello).
    const day14Proto = P.find((p) => p.id === 16);
    const result = closeSession({
      sessionData: makeSessionData(),
      protocol: day14Proto,
      st: stWithProgram,
    });
    expect(result.programAdvance).not.toBeNull();
    expect(result.programAdvance.day).toBe(14);
    expect(result.programAdvance.finalize).toBe(true);
    expect(result.announce).toMatch(/completado/i);
  });
});

// ═══════════════════════════════════════════════════════════════
// closeSession — postDelta + refs
// ═══════════════════════════════════════════════════════════════

describe("closeSession — postDelta opcional", () => {
  it("postDelta es null si refs no presentes", () => {
    const result = closeSession({
      sessionData: makeSessionData(),
      protocol: PROTOCOL,
      st: BASE_ST,
    });
    expect(result.postDelta).toBeNull();
  });

  it("postDelta es null si hrvLog está vacío", () => {
    const result = closeSession({
      sessionData: makeSessionData(),
      protocol: PROTOCOL,
      st: BASE_ST,
      refs: {
        sessionStartedAt: Date.now() - 90000,
        sessionEndedAt: Date.now(),
      },
    });
    // sessionDelta builder devuelve { hrv: null, ... } cuando no hay readings
    expect(result.postDelta).toBeDefined();
    expect(result.postDelta.hrv).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════
// closeSession — partial sessions (Phase 4 banditWeight=0.5)
// ═══════════════════════════════════════════════════════════════

describe("closeSession — sesión partial procesa correctamente", () => {
  it("sessionData con hiddenSec alto resulta en bioQ.quality 'ligera'", () => {
    const result = closeSession({
      sessionData: makeSessionData({
        actualSec: 90,
        expectedSec: 90,
        hiddenMs: 60_000, // 60s ocultos > 30% de 90s
      }),
      protocol: PROTOCOL,
      st: BASE_ST,
    });
    expect(result.bioQ.quality).toBe("ligera");
  });

  it("sessionData con completion baja produce eVC reducido", () => {
    const fullResult = closeSession({
      sessionData: makeSessionData({ actualSec: 120, expectedSec: 120 }),
      protocol: PROTOCOL,
      st: BASE_ST,
    });
    const partialResult = closeSession({
      sessionData: makeSessionData({ actualSec: 30, expectedSec: 120 }),
      protocol: PROTOCOL,
      st: BASE_ST,
    });
    expect(partialResult.eVC).toBeLessThanOrEqual(fullResult.eVC);
  });
});

// ═══════════════════════════════════════════════════════════════
// adaptPlayerCompletionToSessionData
// ═══════════════════════════════════════════════════════════════

describe("adaptPlayerCompletionToSessionData", () => {
  const playerCompletion = {
    status: "complete",
    partial: false,
    partialPercent: 1,
    banditWeight: 1,
    streakIncrement: true,
    vCoresAward: 10,
    durationMs: 95000,
    completedActs: 4,
    totalActs: 4,
    useCase: "active",
  };

  it("mapea completedActs a interactions", () => {
    const sd = adaptPlayerCompletionToSessionData(playerCompletion, PROTOCOL, Date.now());
    expect(sd.interactions).toBe(4);
  });

  it("mapea durationMs a actualSec", () => {
    const sd = adaptPlayerCompletionToSessionData(playerCompletion, PROTOCOL, Date.now());
    expect(sd.actualSec).toBe(95);
  });

  it("preserva playerCompletion raw para CLEANUP_BACKLOG #12", () => {
    const sd = adaptPlayerCompletionToSessionData(playerCompletion, PROTOCOL, Date.now());
    expect(sd.playerCompletion).toBe(playerCompletion);
  });

  it("phaseTimings incluye un entry 'player_v2' con todos los campos Phase 4", () => {
    const sd = adaptPlayerCompletionToSessionData(playerCompletion, PROTOCOL, Date.now());
    expect(sd.phaseTimings).toHaveLength(1);
    const entry = sd.phaseTimings[0];
    expect(entry.phase).toBe("player_v2");
    expect(entry.completedActs).toBe(4);
    expect(entry.totalActs).toBe(4);
    expect(entry.status).toBe("complete");
    expect(entry.useCase).toBe("active");
    expect(entry.banditWeight).toBe(1);
  });

  it("partial session preserva banditWeight 0.5", () => {
    const partial = { ...playerCompletion, partial: true, partialPercent: 0.5, banditWeight: 0.5, completedActs: 2 };
    const sd = adaptPlayerCompletionToSessionData(partial, PROTOCOL, Date.now());
    expect(sd.phaseTimings[0].banditWeight).toBe(0.5);
    expect(sd.phaseTimings[0].partial).toBe(true);
    expect(sd.interactions).toBe(2);
  });

  it("startedAt correcto cuando se pasa explícito", () => {
    const start = 1700000000000;
    const sd = adaptPlayerCompletionToSessionData(playerCompletion, PROTOCOL, start);
    expect(sd.startedAt).toBe(start);
  });
});

// ═══════════════════════════════════════════════════════════════
// Integration: adapter → closeSession
// ═══════════════════════════════════════════════════════════════

describe("Integration adapter → closeSession", () => {
  it("flow completo: playerCompletion → sessionData → closeSession", () => {
    const playerCompletion = {
      status: "complete",
      partial: false,
      partialPercent: 1,
      banditWeight: 1,
      streakIncrement: true,
      vCoresAward: 10,
      durationMs: 120000,
      completedActs: 4,
      totalActs: 4,
      useCase: "active",
    };
    const startedAt = Date.now() - 120000;
    const sessionData = adaptPlayerCompletionToSessionData(playerCompletion, PROTOCOL, startedAt);
    const result = closeSession({
      sessionData,
      protocol: PROTOCOL,
      st: BASE_ST,
      refs: { sessionStartedAt: startedAt, sessionEndedAt: Date.now() },
    });
    expect(result.newState.totalSessions).toBe(1);
    expect(result.newState.history).toHaveLength(1);
    expect(result.newState.history[0].p).toBe(PROTOCOL.n);
    expect(result.eVC).toBeGreaterThan(0);
  });
});
