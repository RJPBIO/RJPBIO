import { describe, it, expect } from "vitest";
import { computeHrvDelta, aggregateHrvDeltas, pairSessionHrvDeltas } from "./hrvDelta";

const validPre = { rmssd: 40, lnRmssd: 3.69, sdnn: 50, valid: true };
const validPost = { rmssd: 52, lnRmssd: 3.95, sdnn: 58, valid: true };

describe("computeHrvDelta", () => {
  it("retorna null si pre o post son inválidos", () => {
    expect(computeHrvDelta(null, validPost)).toBeNull();
    expect(computeHrvDelta(validPre, null)).toBeNull();
    expect(computeHrvDelta({ ...validPre, valid: false }, validPost)).toBeNull();
    expect(computeHrvDelta(validPre, { ...validPost, valid: false })).toBeNull();
  });

  it("computa delta RMSSD y cambio relativo", () => {
    const d = computeHrvDelta(validPre, validPost);
    expect(d.deltaRmssd).toBe(12);
    expect(d.relativeChange).toBe(30); // (52-40)/40 * 100
    expect(d.deltaLnRmssd).toBeCloseTo(0.26, 2);
  });

  it("classification=no-change cuando delta < MDC95 con historial suficiente", () => {
    // historial estable con baja varianza → MDC95 pequeño pero delta también
    const history = [40, 41, 39, 40, 42, 40, 41];
    const post = { ...validPost, rmssd: 40.5, lnRmssd: 3.70 };
    const d = computeHrvDelta(validPre, post, history);
    expect(d.significant).toBe(false);
    expect(d.classification).toBe("no-change");
  });

  it("classification=vagal-lift cuando delta positivo supera MDC95", () => {
    const history = [40, 41, 39, 40, 42, 40, 41];
    const d = computeHrvDelta(validPre, validPost, history);
    expect(d.significant).toBe(true);
    expect(d.classification).toBe("vagal-lift");
  });

  it("classification=vagal-suppression cuando delta negativo significativo", () => {
    const history = [40, 41, 39, 40, 42, 40, 41];
    const post = { ...validPost, rmssd: 20, lnRmssd: 3.00 };
    const d = computeHrvDelta(validPre, post, history);
    expect(d.deltaRmssd).toBe(-20);
    expect(d.significant).toBe(true);
    expect(d.classification).toBe("vagal-suppression");
  });

  it("mdc95=null cuando historial insuficiente → significant=null", () => {
    const d = computeHrvDelta(validPre, validPost, [40, 41]);
    expect(d.mdc95).toBeNull();
    expect(d.significant).toBeNull();
    expect(d.classification).toBe("unverified");
  });
});

describe("aggregateHrvDeltas", () => {
  it("insufficient cuando n < minK", () => {
    const agg = aggregateHrvDeltas([{ deltaRmssd: 3 }, { deltaRmssd: 5 }], { minK: 5 });
    expect(agg.insufficient).toBe(true);
    expect(agg.n).toBe(2);
    expect(agg.minK).toBe(5);
  });

  it("computa media, SD, IC95 y % positivos con n suficiente", () => {
    const deltas = [
      { deltaRmssd: 5 }, { deltaRmssd: 8 }, { deltaRmssd: 3 },
      { deltaRmssd: -2 }, { deltaRmssd: 6 }, { deltaRmssd: 10 },
    ];
    const agg = aggregateHrvDeltas(deltas, { minK: 5 });
    expect(agg.insufficient).toBe(false);
    expect(agg.n).toBe(6);
    expect(agg.meanDelta).toBe(5);
    expect(agg.positivePct).toBe(83); // 5 de 6
    expect(agg.ci95Lo).toBeLessThan(agg.meanDelta);
    expect(agg.ci95Hi).toBeGreaterThan(agg.meanDelta);
  });

  it("filtra entradas no numéricas", () => {
    const deltas = [
      { deltaRmssd: 5 }, { deltaRmssd: null }, { deltaRmssd: NaN },
      { deltaRmssd: 8 }, { deltaRmssd: 3 }, { deltaRmssd: 6 }, { deltaRmssd: 10 },
    ];
    const agg = aggregateHrvDeltas(deltas, { minK: 5 });
    expect(agg.n).toBe(5);
  });

  it("usa minK por defecto de 5 si no se pasa", () => {
    const agg = aggregateHrvDeltas([{ deltaRmssd: 1 }, { deltaRmssd: 2 }, { deltaRmssd: 3 }]);
    expect(agg.insufficient).toBe(true);
  });

  it("entrada null/undefined retorna insufficient n=0", () => {
    const agg = aggregateHrvDeltas(null);
    expect(agg.insufficient).toBe(true);
    expect(agg.n).toBe(0);
  });
});

describe("pairSessionHrvDeltas", () => {
  const MIN = 60_000;
  const now = 1_700_000_000_000;

  function entry(ts, rmssd) {
    return { ts, rmssd, lnRmssd: Math.log(rmssd), valid: true };
  }

  it("empareja lecturas pre (antes del start) y post (después del end)", () => {
    const sessions = [{ ts: now, startedAt: now, actualSec: 180, proto: "focus" }];
    const hrv = [
      entry(now - 5 * MIN, 40),       // pre
      entry(now + 5 * MIN, 52),       // post (5 min después del end @180s)
    ];
    const pairs = pairSessionHrvDeltas(sessions, hrv);
    expect(pairs.length).toBe(1);
    expect(pairs[0].deltaRmssd).toBe(12);
    expect(pairs[0].protocolId).toBe("focus");
  });

  it("descarta sesiones sin pre o post dentro de ventana", () => {
    const sessions = [{ ts: now, startedAt: now, actualSec: 180 }];
    const hrv = [entry(now - 5 * MIN, 40)]; // solo pre, sin post
    expect(pairSessionHrvDeltas(sessions, hrv)).toEqual([]);
  });

  it("respeta windowMs — lecturas fuera de ventana no se usan", () => {
    const sessions = [{ ts: now, startedAt: now, actualSec: 180 }];
    const hrv = [
      entry(now - 20 * MIN, 40),      // demasiado lejos con default 15min
      entry(now + 20 * MIN, 52),
    ];
    const pairs = pairSessionHrvDeltas(sessions, hrv);
    expect(pairs).toEqual([]);
  });

  it("emparejamiento por múltiples sesiones", () => {
    const s1 = { ts: now, startedAt: now, actualSec: 180, proto: "focus" };
    const s2 = { ts: now + 60 * MIN, startedAt: now + 60 * MIN, actualSec: 180, proto: "calm" };
    const hrv = [
      entry(now - 5 * MIN, 40), entry(now + 5 * MIN, 50),
      entry(now + 55 * MIN, 45), entry(now + 65 * MIN, 55),
    ];
    const pairs = pairSessionHrvDeltas([s1, s2], hrv);
    expect(pairs.length).toBe(2);
    expect(pairs[0].protocolId).toBe("focus");
    expect(pairs[1].protocolId).toBe("calm");
  });

  it("entrada vacía retorna []", () => {
    expect(pairSessionHrvDeltas([], [])).toEqual([]);
    expect(pairSessionHrvDeltas(null, null)).toEqual([]);
  });
});
