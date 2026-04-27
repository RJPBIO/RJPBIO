import { describe, it, expect } from "vitest";
import {
  buildSessionDelta,
  deltaDisplay,
  buildSessionOutboxPayload,
} from "./sessionDelta";

// Helpers ────────────────────────────────────────────────
const ms = (s) => s * 1000;
const baselineHistory = (count = 10, mean = 40, jitter = 1.5) =>
  Array.from({ length: count }, (_, i) => ({
    ts: -ms(60 * (count - i)), // fechas relativas al "ahora" 0
    rmssd: mean + (i % 2 === 0 ? jitter : -jitter),
    lnRmssd: Math.log(mean + (i % 2 === 0 ? jitter : -jitter)),
    valid: true,
  }));

describe("buildSessionDelta", () => {
  it("evidenceLevel='time-only' sin HRV ni mood", () => {
    const out = buildSessionDelta({
      sessionStartedAt: 1000,
      sessionEndedAt: 1000 + ms(120),
      hrvLog: [],
    });
    expect(out.evidenceLevel).toBe("time-only");
    expect(out.hrv).toBeNull();
    expect(out.mood).toBeNull();
    expect(out.durationSec).toBe(0);
  });

  it("evidenceLevel='subjective' cuando solo hay mood", () => {
    const out = buildSessionDelta({
      sessionStartedAt: 1000,
      sessionEndedAt: 1000 + ms(120),
      hrvLog: [],
      preMood: 2,
      postMood: 4,
      durationSec: 120,
    });
    expect(out.evidenceLevel).toBe("subjective");
    expect(out.mood).toEqual({ pre: 2, post: 4, delta: 2 });
    expect(out.hrv).toBeNull();
  });

  it("evidenceLevel='verified' con HRV pre/post + historial suficiente y delta significativo", () => {
    const start = 100_000;
    const end = start + ms(120);
    const history = baselineHistory(10, 40, 1).map((h) => ({ ...h, ts: start - 86_400_000 + h.ts }));
    const log = [
      ...history,
      { ts: start - ms(60), rmssd: 40, lnRmssd: Math.log(40), valid: true },
      { ts: end + ms(30), rmssd: 60, lnRmssd: Math.log(60), valid: true },
    ];
    const out = buildSessionDelta({
      sessionStartedAt: start,
      sessionEndedAt: end,
      hrvLog: log,
      durationSec: 120,
    });
    expect(out.hrv).not.toBeNull();
    expect(out.hrv.deltaRmssd).toBe(20);
    expect(out.hrv.classification).toBe("vagal-lift");
    expect(out.hrv.significant).toBe(true);
    expect(out.evidenceLevel).toBe("verified");
  });

  it("classification='no-change' cuando delta < MDC95", () => {
    const start = 100_000;
    const end = start + ms(120);
    const history = baselineHistory(10, 40, 1).map((h) => ({ ...h, ts: start - 86_400_000 + h.ts }));
    const log = [
      ...history,
      { ts: start - ms(60), rmssd: 40, lnRmssd: Math.log(40), valid: true },
      { ts: end + ms(30), rmssd: 40.5, lnRmssd: Math.log(40.5), valid: true },
    ];
    const out = buildSessionDelta({
      sessionStartedAt: start,
      sessionEndedAt: end,
      hrvLog: log,
      preMood: 3,
      postMood: 3,
      durationSec: 120,
    });
    expect(out.hrv.classification).toBe("no-change");
    // No-change no marca verified; cae a subjective porque mood existe.
    expect(out.evidenceLevel).toBe("subjective");
  });

  it("classification='unverified' cuando historial insuficiente", () => {
    const start = 100_000;
    const end = start + ms(120);
    const log = [
      // Solo 2 lecturas previas — insuficiente para MDC95 (≥7).
      { ts: start - 3600_000, rmssd: 40, valid: true },
      { ts: start - 1800_000, rmssd: 41, valid: true },
      { ts: start - ms(60), rmssd: 40, lnRmssd: Math.log(40), valid: true },
      { ts: end + ms(30), rmssd: 50, lnRmssd: Math.log(50), valid: true },
    ];
    const out = buildSessionDelta({
      sessionStartedAt: start,
      sessionEndedAt: end,
      hrvLog: log,
      durationSec: 120,
    });
    expect(out.hrv.classification).toBe("unverified");
    expect(out.hrv.significant).toBeNull();
    expect(out.evidenceLevel).toBe("subjective");
  });

  it("ignora HRV fuera de la ventana de 15 min", () => {
    const start = 100_000;
    const end = start + ms(120);
    const log = [
      // Pre fuera de ventana (16 min antes).
      { ts: start - 16 * 60_000, rmssd: 40, valid: true },
      { ts: end + ms(30), rmssd: 55, valid: true },
    ];
    const out = buildSessionDelta({
      sessionStartedAt: start,
      sessionEndedAt: end,
      hrvLog: log,
      durationSec: 120,
    });
    expect(out.hrv).toBeNull();
  });

  it("ignora lectura HRV con valid=false", () => {
    const start = 100_000;
    const end = start + ms(120);
    const log = [
      { ts: start - ms(60), rmssd: 40, valid: false },
      { ts: end + ms(30), rmssd: 55, valid: true },
    ];
    const out = buildSessionDelta({
      sessionStartedAt: start,
      sessionEndedAt: end,
      hrvLog: log,
      durationSec: 120,
    });
    expect(out.hrv).toBeNull();
  });

  it("mood inválido (>5 o <1) se descarta", () => {
    const out = buildSessionDelta({
      sessionStartedAt: 1000,
      sessionEndedAt: 2000,
      hrvLog: [],
      preMood: 7,
      postMood: 0,
    });
    expect(out.mood).toBeNull();
    expect(out.evidenceLevel).toBe("time-only");
  });

  it("entradas malformadas no rompen el cálculo", () => {
    const out = buildSessionDelta({
      sessionStartedAt: 1000,
      sessionEndedAt: 2000,
      hrvLog: [null, undefined, { foo: "bar" }, "not-an-object"],
    });
    expect(out.hrv).toBeNull();
    expect(out.evidenceLevel).toBe("time-only");
  });

  it("rechaza cuando endedAt <= startedAt", () => {
    const out = buildSessionDelta({
      sessionStartedAt: 2000,
      sessionEndedAt: 1000,
      hrvLog: [{ ts: 1500, rmssd: 40, valid: true }],
    });
    expect(out.hrv).toBeNull();
  });
});

describe("deltaDisplay", () => {
  it("devuelve clave 'verifiedUplift' para vagal-lift verificado", () => {
    const d = deltaDisplay({
      evidenceLevel: "verified",
      hrv: { classification: "vagal-lift", deltaRmssd: 12, significant: true },
    });
    expect(d).toEqual({ tone: "uplift", key: "session.delta.verifiedUplift", value: 12 });
  });

  it("devuelve 'verifiedDrop' para suppression verificada", () => {
    const d = deltaDisplay({
      evidenceLevel: "verified",
      hrv: { classification: "vagal-suppression", deltaRmssd: -8, significant: true },
    });
    expect(d.tone).toBe("drop");
    expect(d.key).toBe("session.delta.verifiedDrop");
  });

  it("'steady' para no-change", () => {
    const d = deltaDisplay({
      evidenceLevel: "subjective",
      hrv: { classification: "no-change", deltaRmssd: 0.4, significant: false },
    });
    expect(d.tone).toBe("steady");
    expect(d.key).toBe("session.delta.steady");
  });

  it("'unverifiedHrv' cuando hay HRV pero historial insuficiente", () => {
    const d = deltaDisplay({
      evidenceLevel: "subjective",
      hrv: { classification: "unverified", deltaRmssd: 5, significant: null },
    });
    expect(d.tone).toBe("subjective");
    expect(d.key).toBe("session.delta.unverifiedHrv");
  });

  it("'moodOnly' cuando solo hay mood (sin HRV)", () => {
    const d = deltaDisplay({
      evidenceLevel: "subjective",
      hrv: null,
      mood: { delta: 2, pre: 2, post: 4 },
    });
    expect(d.key).toBe("session.delta.moodOnly");
    expect(d.value).toBe(2);
  });

  it("'timeOnly' cuando no hay nada", () => {
    const d = deltaDisplay({ evidenceLevel: "time-only", durationSec: 120 });
    expect(d.key).toBe("session.delta.timeOnly");
    expect(d.value).toBe(120);
  });

  it("retorna null para input null", () => {
    expect(deltaDisplay(null)).toBeNull();
  });
});

describe("buildSessionOutboxPayload", () => {
  it("expone coherenciaDelta solo si HRV es verificado", () => {
    const verified = buildSessionOutboxPayload({
      protocolId: "calma60",
      durationSec: 120,
      delta: {
        evidenceLevel: "verified",
        hrv: { significant: true, deltaLnRmssd: 0.25, deltaRmssd: 12 },
      },
    });
    expect(verified.coherenciaDelta).toBeCloseTo(0.25, 2);

    const unverified = buildSessionOutboxPayload({
      protocolId: "calma60",
      durationSec: 120,
      delta: {
        evidenceLevel: "subjective",
        hrv: { significant: null, deltaLnRmssd: 0.5, deltaRmssd: 12 },
      },
    });
    expect(unverified.coherenciaDelta).toBeNull();
  });

  it("clampa durationSec a [0, 7200]", () => {
    expect(buildSessionOutboxPayload({ protocolId: "x", durationSec: -50 }).durationSec).toBe(0);
    expect(buildSessionOutboxPayload({ protocolId: "x", durationSec: 99999 }).durationSec).toBe(7200);
  });

  it("acepta protocolId numérico (ids built-in son numbers)", () => {
    const out = buildSessionOutboxPayload({ protocolId: 7, durationSec: 60 });
    expect(out.protocolId).toBe("7");
  });

  it("protocolId nulo o inválido → null", () => {
    expect(buildSessionOutboxPayload({ protocolId: null, durationSec: 60 }).protocolId).toBeNull();
    expect(buildSessionOutboxPayload({ protocolId: NaN, durationSec: 60 }).protocolId).toBeNull();
    expect(buildSessionOutboxPayload({ protocolId: "", durationSec: 60 }).protocolId).toBeNull();
  });

  it("acepta moodPre/Post entre 1 y 5; el resto → null", () => {
    expect(buildSessionOutboxPayload({ protocolId: "x", durationSec: 60, preMood: 3, postMood: 5 })).toMatchObject({
      moodPre: 3, moodPost: 5,
    });
    expect(buildSessionOutboxPayload({ protocolId: "x", durationSec: 60, preMood: 9, postMood: 0 })).toMatchObject({
      moodPre: null, moodPost: null,
    });
  });

  it("completedAt se serializa como ISO string", () => {
    const t = 1_700_000_000_000;
    const out = buildSessionOutboxPayload({ protocolId: "x", durationSec: 60, completedAt: t });
    expect(typeof out.completedAt).toBe("string");
    expect(new Date(out.completedAt).getTime()).toBe(t);
  });
});
