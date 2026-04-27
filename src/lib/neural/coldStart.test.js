import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  BASELINE_BY_BUCKET,
  priorWeight,
  getColdStartPrior,
  priorBonus,
  priorPredictionShape,
} from "./coldStart";

describe("BASELINE_BY_BUCKET", () => {
  it("tiene 8 buckets cubriendo 24h", () => {
    expect(Object.keys(BASELINE_BY_BUCKET)).toHaveLength(8);
    for (let i = 0; i < 8; i++) {
      expect(BASELINE_BY_BUCKET[i]).toBeDefined();
    }
  });
  it("cada bucket tiene los 4 intents", () => {
    for (const bucket of Object.values(BASELINE_BY_BUCKET)) {
      expect(bucket).toHaveProperty("calma");
      expect(bucket).toHaveProperty("reset");
      expect(bucket).toHaveProperty("energia");
      expect(bucket).toHaveProperty("enfoque");
    }
  });
  it("frozen — no se puede mutar en runtime", () => {
    expect(Object.isFrozen(BASELINE_BY_BUCKET)).toBe(true);
    expect(Object.isFrozen(BASELINE_BY_BUCKET[0])).toBe(true);
  });
  it("energia/enfoque pico en buckets cognitivos (3 = 9-12h)", () => {
    const peak = BASELINE_BY_BUCKET[3];
    const trough = BASELINE_BY_BUCKET[7]; // 21-24h
    expect(peak.energia).toBeGreaterThan(trough.energia);
    expect(peak.enfoque).toBeGreaterThan(trough.enfoque);
  });
  it("calma pico en buckets nocturnos (7 = 21-24h)", () => {
    const peak = BASELINE_BY_BUCKET[7];
    const trough = BASELINE_BY_BUCKET[3]; // 9-12h
    expect(peak.calma).toBeGreaterThan(trough.calma);
  });
});

describe("priorWeight", () => {
  it("100% peso a las 0 sesiones", () => {
    expect(priorWeight(0)).toBe(1);
  });
  it("decae linealmente", () => {
    expect(priorWeight(1)).toBeCloseTo(0.8, 5);
    expect(priorWeight(2)).toBeCloseTo(0.6, 5);
    expect(priorWeight(3)).toBeCloseTo(0.4, 5);
    expect(priorWeight(4)).toBeCloseTo(0.2, 5);
  });
  it("0 peso a las 5+ sesiones", () => {
    expect(priorWeight(5)).toBe(0);
    expect(priorWeight(10)).toBe(0);
    expect(priorWeight(100)).toBe(0);
  });
  it("clamps en límites", () => {
    expect(priorWeight(-1)).toBeLessThanOrEqual(1);
    expect(priorWeight(undefined)).toBe(1);
  });
});

describe("getColdStartPrior", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it("sin chronotype usa hora real", () => {
    vi.setSystemTime(new Date("2026-04-26T11:00:00"));
    const r = getColdStartPrior({ intent: "enfoque", now: new Date("2026-04-26T11:00:00") });
    expect(r.bucket).toBe(3); // 11h → bucket 3 (9-12)
    expect(r.delta).toBe(BASELINE_BY_BUCKET[3].enfoque);
  });

  it("morning chronotype shifta el bucket", () => {
    // definite_morning offset = -2 → real 11h se vive como 13h subjetiva
    const morning = { type: "definite_morning" };
    const r = getColdStartPrior({
      chronotype: morning,
      intent: "enfoque",
      now: new Date("2026-04-26T11:00:00"),
    });
    expect(r.bucket).toBe(4); // 13h subj → bucket 4 (12-15)
  });

  it("evening chronotype shifta inverso", () => {
    // definite_evening offset = +2 → real 11h se vive como 9h subjetiva
    const evening = { type: "definite_evening" };
    const r = getColdStartPrior({
      chronotype: evening,
      intent: "enfoque",
      now: new Date("2026-04-26T11:00:00"),
    });
    expect(r.bucket).toBe(3); // 9h subj → bucket 3 (9-12)
  });

  it("intent desconocido retorna fallback", () => {
    const r = getColdStartPrior({ intent: "xyz", now: new Date("2026-04-26T11:00:00") });
    expect(r.delta).toBe(0.5);
  });

  it("retorna weight según sessionsCount", () => {
    const r0 = getColdStartPrior({ intent: "calma", now: new Date(), sessionsCount: 0 });
    const r3 = getColdStartPrior({ intent: "calma", now: new Date(), sessionsCount: 3 });
    const r5 = getColdStartPrior({ intent: "calma", now: new Date(), sessionsCount: 5 });
    expect(r0.weight).toBe(1);
    expect(r3.weight).toBeCloseTo(0.4, 5);
    expect(r5.weight).toBe(0);
  });

  it("subjectiveHour expone hora calculada", () => {
    const morning = { type: "definite_morning" };
    const r = getColdStartPrior({
      chronotype: morning,
      intent: "calma",
      now: new Date("2026-04-26T20:00:00"),
    });
    // 20h real, offset -2 → 22h subj
    expect(r.subjectiveHour).toBeCloseTo(22, 1);
  });
});

describe("priorBonus", () => {
  it("delta neutro (0.5) → 0", () => {
    expect(priorBonus({ delta: 0.5, weight: 1 })).toBe(0);
  });
  it("delta alto + weight 1 → bonus positivo capped", () => {
    const b = priorBonus({ delta: 1.2, weight: 1 });
    expect(b).toBeGreaterThan(0);
    expect(b).toBeLessThanOrEqual(6);
  });
  it("delta bajo → penalidad", () => {
    const b = priorBonus({ delta: 0.1, weight: 1 });
    expect(b).toBeLessThan(0);
  });
  it("weight 0 → bonus 0 (decay total)", () => {
    expect(priorBonus({ delta: 1.2, weight: 0 })).toBe(0);
  });
  it("input inválido → 0", () => {
    expect(priorBonus(null)).toBe(0);
    expect(priorBonus({})).toBe(0);
    expect(priorBonus({ delta: null })).toBe(0);
  });
});

describe("priorPredictionShape", () => {
  it("genera shape compatible con predictSessionImpact", () => {
    const prior = { delta: 0.9, weight: 1, bucket: 3, subjectiveHour: 11 };
    const shape = priorPredictionShape(prior);
    expect(shape).toMatchObject({
      predictedDelta: 0.9,
      sampleSize: 0,
      confidence: 30,
      basis: "prior cronobiológico",
      priorBucket: 3,
      priorWeight: 1,
    });
    expect(shape.lower).toBeLessThan(shape.predictedDelta);
    expect(shape.upper).toBeGreaterThan(shape.predictedDelta);
  });

  it("delta > 0 produce mensaje positivo", () => {
    const shape = priorPredictionShape({ delta: 0.8, weight: 1, bucket: 2, subjectiveHour: 8 });
    expect(shape.message).toMatch(/\+0\.8/);
  });

  it("delta <= 0 produce mensaje subóptimo", () => {
    const shape = priorPredictionShape({ delta: 0, weight: 1, bucket: 7, subjectiveHour: 22 });
    expect(shape.message).toMatch(/subóptima/i);
  });

  it("permite override de basisLabel", () => {
    const shape = priorPredictionShape(
      { delta: 0.5, weight: 1, bucket: 3, subjectiveHour: 11 },
      "test-basis"
    );
    expect(shape.basis).toBe("test-basis");
  });
});
