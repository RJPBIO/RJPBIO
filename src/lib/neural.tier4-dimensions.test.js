/* neural.tier4-dimensions.test — Phase Polish-Tier-4 Capa 1.
   Cubre el snapshot dimensions {foco, calma, energia} en _buildHistoryEntry
   via calcSessionCompletion (la API exportada). Mantiene anti-regression
   verifying entries existing fields preservados. */
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

const sessionCtx = {
  protocol: P.find((p) => p.n === "Respira Gamma") || P[0],
  durMult: 1,
  sessionData: { interactions: 5, motionSamples: 100, pauses: 0, hiddenSec: 0 },
  nfcCtx: null,
  circadian: { period: "day" },
};

describe("Tier-4 Capa-1 — _buildHistoryEntry dimensions snapshot", () => {
  it("nuevo entry contiene dimensions {foco, calma, energia} numéricas", () => {
    const r = calcSessionCompletion(baseSt, sessionCtx);
    const entry = r.newState.history[0];
    expect(entry.dimensions).toBeTypeOf("object");
    expect(entry.dimensions).not.toBeNull();
    expect(typeof entry.dimensions.foco).toBe("number");
    expect(typeof entry.dimensions.calma).toBe("number");
    expect(typeof entry.dimensions.energia).toBe("number");
  });

  it("dimensions están en rango 0-100 (consistente con coherencia/resiliencia/capacidad)", () => {
    const r = calcSessionCompletion(baseSt, sessionCtx);
    const { foco, calma, energia } = r.newState.history[0].dimensions;
    expect(foco).toBeGreaterThanOrEqual(0);
    expect(foco).toBeLessThanOrEqual(100);
    expect(calma).toBeGreaterThanOrEqual(0);
    expect(calma).toBeLessThanOrEqual(100);
    expect(energia).toBeGreaterThanOrEqual(0);
    expect(energia).toBeLessThanOrEqual(100);
  });

  it("dimensions snapshot iguala newState.coherencia/resiliencia/capacidad (consistencia)", () => {
    const r = calcSessionCompletion(baseSt, sessionCtx);
    const entry = r.newState.history[0];
    expect(entry.dimensions.foco).toBe(Math.round(r.newState.coherencia));
    expect(entry.dimensions.calma).toBe(Math.round(r.newState.resiliencia));
    expect(entry.dimensions.energia).toBe(Math.round(r.newState.capacidad));
  });

  it("anti-regression: campos originales del entry preservados (p, ts, c, r, bioQ, dur, etc)", () => {
    const r = calcSessionCompletion(baseSt, sessionCtx);
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
  });

  it("entries acumuladas mantienen dimensions independientes per session", () => {
    let st = { ...baseSt };
    for (let i = 0; i < 3; i++) {
      const r = calcSessionCompletion(st, sessionCtx);
      st = { ...st, ...r.newState };
    }
    expect(st.history.length).toBe(3);
    expect(st.history[0].dimensions).not.toBeNull();
    expect(st.history[1].dimensions).not.toBeNull();
    expect(st.history[2].dimensions).not.toBeNull();
  });
});

describe("Tier-4 Capa-1 — anti-regression engine consumers", () => {
  it("history.filter por h.bioQ sigue funcionando (anti-gaming pattern)", () => {
    let st = { ...baseSt };
    for (let i = 0; i < 5; i++) {
      const r = calcSessionCompletion(st, sessionCtx);
      st = { ...st, ...r.newState };
    }
    const validBioQ = st.history.filter((h) => typeof h.bioQ === "number");
    expect(validBioQ.length).toBe(5);
  });

  it("history.map para h.c sigue funcionando (sparkline bio)", () => {
    let st = { ...baseSt };
    for (let i = 0; i < 3; i++) {
      const r = calcSessionCompletion(st, sessionCtx);
      st = { ...st, ...r.newState };
    }
    const cValues = st.history.map((h) => h.c).filter((v) => typeof v === "number");
    expect(cValues.length).toBe(3);
  });

  it("history.find por h.p sigue funcionando (LearningView last3 names)", () => {
    let st = { ...baseSt };
    const r = calcSessionCompletion(st, sessionCtx);
    st = { ...st, ...r.newState };
    const found = st.history.find((h) => h.p === sessionCtx.protocol.n);
    expect(found).toBeTruthy();
    expect(found.dimensions).not.toBeNull();
  });
});
