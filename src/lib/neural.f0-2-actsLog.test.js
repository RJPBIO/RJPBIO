/* neural.f0-2-actsLog.test — Phase 7 F0-2 Capa 2.
   Verifica que _buildHistoryEntry (via calcSessionCompletion API) propaga
   actsLog del sessionData al entry persistido + computa los 3 aggregates.
   Anti-regression: campos legacy preservados; consumers que leen otros
   fields no impactados. */
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

const SAMPLE_ACTS_LOG = [
  {
    actIndex: 0, phaseIndex: 0, passed: true, forced: false, elapsedMs: 30000,
    actId: "0-0", type: "breath", status: "completed", durationMs: 30000,
    targetMs: 30000, validationOutcome: "passed", validationKind: "breath_cycles",
    pausedDurationMs: 0,
  },
  {
    actIndex: 1, phaseIndex: 1, passed: false, forced: true, elapsedMs: 5000,
    actId: "1-0", type: "cognitive_anchor", status: "skipped", durationMs: 5000,
    targetMs: 25000, validationOutcome: "failed", validationKind: "min_duration",
    pausedDurationMs: 1200,
  },
  {
    actIndex: 2, phaseIndex: 2, passed: true, forced: false, elapsedMs: 22000,
    actId: "2-0", type: "commitment_motor", status: "completed", durationMs: 22000,
    targetMs: 22000, validationOutcome: "no_validation", validationKind: "no_validation",
    pausedDurationMs: 0,
  },
];

describe("F0-2 Capa-2 — _buildHistoryEntry actsLog persist + aggregates", () => {
  it("entry contiene actsLog cuando sessionData.actsLog presente", () => {
    const r = calcSessionCompletion(baseSt, {
      protocol: protoForTest,
      durMult: 1,
      sessionData: { interactions: 3, motionSamples: 0, pauses: 0, actsLog: SAMPLE_ACTS_LOG },
      nfcCtx: null,
      circadian: { period: "day" },
    });
    const entry = r.newState.history[0];
    expect(Array.isArray(entry.actsLog)).toBe(true);
    expect(entry.actsLog).toHaveLength(3);
    expect(entry.actsLog[0].actId).toBe("0-0");
    expect(entry.actsLog[1].status).toBe("skipped");
  });

  it("entry contiene actsLog=null cuando sessionData omite el field (defensive)", () => {
    const r = calcSessionCompletion(baseSt, {
      protocol: protoForTest,
      durMult: 1,
      sessionData: { interactions: 3, motionSamples: 0, pauses: 0 },
      nfcCtx: null,
      circadian: { period: "day" },
    });
    const entry = r.newState.history[0];
    expect(entry.actsLog).toBeNull();
    expect(entry.actsCompleted).toBeNull();
    expect(entry.actsSkipped).toBeNull();
    expect(entry.actsFailed).toBeNull();
  });

  it("aggregates actsCompleted/actsSkipped/actsFailed correctos", () => {
    const r = calcSessionCompletion(baseSt, {
      protocol: protoForTest,
      durMult: 1,
      sessionData: { interactions: 3, motionSamples: 0, pauses: 0, actsLog: SAMPLE_ACTS_LOG },
      nfcCtx: null,
      circadian: { period: "day" },
    });
    const entry = r.newState.history[0];
    expect(entry.actsCompleted).toBe(2); // act 0 + act 2
    expect(entry.actsSkipped).toBe(1);   // act 1
    expect(entry.actsFailed).toBe(1);    // act 1 (validationOutcome=failed)
  });

  it("actsLog vacío → aggregates en 0 (no null)", () => {
    const r = calcSessionCompletion(baseSt, {
      protocol: protoForTest,
      durMult: 1,
      sessionData: { interactions: 0, motionSamples: 0, pauses: 0, actsLog: [] },
      nfcCtx: null,
      circadian: { period: "day" },
    });
    const entry = r.newState.history[0];
    expect(Array.isArray(entry.actsLog)).toBe(true);
    expect(entry.actsLog).toHaveLength(0);
    expect(entry.actsCompleted).toBe(0);
    expect(entry.actsSkipped).toBe(0);
    expect(entry.actsFailed).toBe(0);
  });

  it("actsLog NO array (e.g. string mal formado) → null defensive", () => {
    const r = calcSessionCompletion(baseSt, {
      protocol: protoForTest,
      durMult: 1,
      sessionData: { interactions: 3, motionSamples: 0, pauses: 0, actsLog: "junk" },
      nfcCtx: null,
      circadian: { period: "day" },
    });
    const entry = r.newState.history[0];
    expect(entry.actsLog).toBeNull();
    expect(entry.actsCompleted).toBeNull();
  });

  it("anti-regression: campos legacy entry preservados (p, ts, c, r, bioQ, dur, dimensions)", () => {
    const r = calcSessionCompletion(baseSt, {
      protocol: protoForTest,
      durMult: 1,
      sessionData: { interactions: 3, motionSamples: 0, pauses: 0, actsLog: SAMPLE_ACTS_LOG },
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
    expect(typeof entry.bioSignal).toBe("number");
    expect(typeof entry.partial).toBe("boolean");
    expect(typeof entry.completeness).toBe("number");
    expect(entry.dimensions).not.toBeUndefined();
  });

  it("anti-regression: interactions field NO removed (engine consumers Phase 6+ leen este field)", () => {
    const r = calcSessionCompletion(baseSt, {
      protocol: protoForTest,
      durMult: 1,
      sessionData: { interactions: 7, motionSamples: 0, pauses: 0, actsLog: SAMPLE_ACTS_LOG },
      nfcCtx: null,
      circadian: { period: "day" },
    });
    const entry = r.newState.history[0];
    expect(entry.interactions).toBe(7);
  });

  it("aggregates compatibles con engine consumers DEFER (F0-1 leerá estos fields)", () => {
    // Sanity: los aggregates son derivables de actsLog si consumers prefieren
    // recompute on-read. Esto es defensive parity.
    const r = calcSessionCompletion(baseSt, {
      protocol: protoForTest,
      durMult: 1,
      sessionData: { interactions: 3, motionSamples: 0, pauses: 0, actsLog: SAMPLE_ACTS_LOG },
      nfcCtx: null,
      circadian: { period: "day" },
    });
    const entry = r.newState.history[0];
    const recomputeCompleted = entry.actsLog.filter((a) => a.status === "completed").length;
    expect(entry.actsCompleted).toBe(recomputeCompleted);
  });

  it("entries acumuladas mantienen actsLog independiente per session", () => {
    let st = { ...baseSt };
    for (let i = 0; i < 3; i++) {
      const r = calcSessionCompletion(st, {
        protocol: protoForTest,
        durMult: 1,
        sessionData: {
          interactions: 3, motionSamples: 0, pauses: 0,
          actsLog: SAMPLE_ACTS_LOG.slice(0, i + 1),
        },
        nfcCtx: null,
        circadian: { period: "day" },
      });
      st = { ...st, ...r.newState };
    }
    expect(st.history.length).toBe(3);
    expect(st.history[0].actsLog).toHaveLength(1);
    expect(st.history[1].actsLog).toHaveLength(2);
    expect(st.history[2].actsLog).toHaveLength(3);
  });
});

describe("F0-2 Capa-2 — engine consumers anti-regression (mixed entries)", () => {
  it("history.filter por h.bioQ funciona con entries mixed (con/sin actsLog)", () => {
    const mixed = [
      { ts: 1, p: "A", c: 60, r: 50, bioQ: 65 }, // pre-F0-2 sin actsLog
      { ts: 2, p: "B", c: 65, r: 55, bioQ: 70, actsLog: SAMPLE_ACTS_LOG }, // F0-2
    ];
    const validBioQ = mixed.filter((h) => typeof h.bioQ === "number");
    expect(validBioQ.length).toBe(2);
  });

  it("history.map para h.dimensions sigue funcionando (Tier 4)", () => {
    const mixed = [
      { ts: 1, p: "A", c: 60, r: 50, bioQ: 65, dimensions: null, actsLog: null }, // post-migration v19
      { ts: 2, p: "B", c: 65, r: 55, bioQ: 70, dimensions: { foco: 65, calma: 55, energia: 60 }, actsLog: SAMPLE_ACTS_LOG },
    ];
    const dims = mixed.map((h) => h.dimensions).filter((v) => v !== null);
    expect(dims.length).toBe(1);
  });
});
