/* neural.f0-3-feedback.test — Phase 7 F0-3 Capa 2.
   Verifica que _buildHistoryEntry inicializa postSessionFeedback en null
   por default. La data real entra post-hoc via store.attachSessionFeedback
   (probada en useStore.f0-3-feedback.test.js). Anti-regression: campos
   legacy + Tier 4 + F0-2 preservados; consumers no afectados. */
import { describe, it, expect } from "vitest";
import { calcSessionCompletion } from "./neural";
import { P } from "./protocols";

const baseSt = {
  totalSessions: 0,
  streak: 0,
  todaySessions: 0,
  lastDate: null,
  weeklyData: [0, 0, 0, 0, 0, 0, 0],
  weekNum: 0,
  coherencia: 70,
  resiliencia: 60,
  capacidad: 65,
  achievements: [],
  vCores: 0,
  history: [],
  totalTime: 0,
  moodLog: [],
};

const protoForTest = P[0];

describe("F0-3 Capa-2 — _buildHistoryEntry postSessionFeedback default", () => {
  it("entry tiene postSessionFeedback: null por default", () => {
    const r = calcSessionCompletion(baseSt, {
      protocol: protoForTest,
      durMult: 1,
      sessionData: { interactions: 3, motionSamples: 0, pauses: 0 },
      nfcCtx: null,
      circadian: { period: "day" },
    });
    const entry = r.newState.history[0];
    expect(entry).toHaveProperty("postSessionFeedback");
    expect(entry.postSessionFeedback).toBeNull();
  });

  it("postSessionFeedback null incluso cuando sessionData lo pase (engine ignora upstream)", () => {
    // El sheet aparece DESPUÉS de completion; sessionData arg no es el
    // path de propagación. Si alguien malformedly pasa la field aquí, el
    // engine no la lee — debe llegar via attachSessionFeedback action.
    const r = calcSessionCompletion(baseSt, {
      protocol: protoForTest,
      durMult: 1,
      sessionData: {
        interactions: 3,
        motionSamples: 0,
        pauses: 0,
        postSessionFeedback: { helpedRating: 5 }, // ignored
      },
      nfcCtx: null,
      circadian: { period: "day" },
    });
    const entry = r.newState.history[0];
    expect(entry.postSessionFeedback).toBeNull();
  });

  it("anti-regression: Tier 4 dimensions + F0-2 actsLog fields preservados", () => {
    const r = calcSessionCompletion(baseSt, {
      protocol: protoForTest,
      durMult: 1,
      sessionData: {
        interactions: 3,
        motionSamples: 0,
        pauses: 0,
        actsLog: [{ status: "completed", validationOutcome: "passed" }],
      },
      nfcCtx: null,
      circadian: { period: "day" },
    });
    const entry = r.newState.history[0];
    expect(entry.dimensions).not.toBeUndefined();
    expect(Array.isArray(entry.actsLog)).toBe(true);
    expect(entry.actsCompleted).toBe(1);
    expect(entry.postSessionFeedback).toBeNull();
  });

  it("anti-regression: campos legacy entry preservados (p, ts, c, r, bioQ, dur)", () => {
    const r = calcSessionCompletion(baseSt, {
      protocol: protoForTest,
      durMult: 1,
      sessionData: { interactions: 3, motionSamples: 0, pauses: 0 },
      nfcCtx: null,
      circadian: { period: "day" },
    });
    const entry = r.newState.history[0];
    expect(entry.p).toBeTypeOf("string");
    expect(entry.ts).toBeTypeOf("number");
    expect(typeof entry.c).toBe("number");
    expect(typeof entry.r).toBe("number");
    expect(typeof entry.bioQ).toBe("number");
    expect(typeof entry.dur).toBe("number");
  });

  it("entries acumuladas: cada uno postSessionFeedback null independiente", () => {
    let st = { ...baseSt };
    for (let i = 0; i < 3; i++) {
      const r = calcSessionCompletion(st, {
        protocol: protoForTest,
        durMult: 1,
        sessionData: { interactions: 3, motionSamples: 0, pauses: 0 },
        nfcCtx: null,
        circadian: { period: "day" },
      });
      st = { ...st, ...r.newState };
    }
    expect(st.history.length).toBe(3);
    st.history.forEach((entry) => {
      expect(entry.postSessionFeedback).toBeNull();
    });
  });
});
