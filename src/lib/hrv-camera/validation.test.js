import { describe, it, expect } from "vitest";
import {
  computeMAE,
  computeCorrelation,
  computeBlandAltman,
  compareMeasurements,
  aggregateValidationSessions,
} from "./validation";

describe("computeMAE", () => {
  it("returns null for empty arrays", () => {
    expect(computeMAE([], [])).toBeNull();
  });

  it("perfect agreement → 0", () => {
    expect(computeMAE([1, 2, 3], [1, 2, 3])).toBe(0);
  });

  it("computes correctly for known diff", () => {
    // diffs |1-2|, |2-4|, |3-6| = 1, 2, 3 → mean 2
    expect(computeMAE([1, 2, 3], [2, 4, 6])).toBe(2);
  });
});

describe("computeCorrelation", () => {
  it("returns null with <3 points", () => {
    expect(computeCorrelation([1, 2], [1, 2])).toBeNull();
  });

  it("perfect positive correlation → ~1", () => {
    const r = computeCorrelation([1, 2, 3, 4], [10, 20, 30, 40]);
    expect(r).toBeCloseTo(1, 6);
  });

  it("perfect negative correlation → ~-1", () => {
    const r = computeCorrelation([1, 2, 3, 4], [40, 30, 20, 10]);
    expect(r).toBeCloseTo(-1, 6);
  });

  it("returns null with constant input (zero variance)", () => {
    expect(computeCorrelation([1, 1, 1, 1], [1, 2, 3, 4])).toBeNull();
  });
});

describe("computeBlandAltman", () => {
  it("returns null with <3 points", () => {
    expect(computeBlandAltman([1, 2], [1, 2])).toBeNull();
  });

  it("perfect agreement → bias 0, narrow LoA", () => {
    const r = computeBlandAltman([10, 20, 30, 40], [10, 20, 30, 40]);
    expect(r.bias).toBe(0);
    expect(r.std).toBe(0);
    expect(r.lowerLoA).toBe(0);
    expect(r.upperLoA).toBe(0);
  });

  it("constant offset → non-zero bias, zero std", () => {
    const r = computeBlandAltman([12, 22, 32, 42], [10, 20, 30, 40]);
    expect(r.bias).toBe(2);
    expect(r.std).toBe(0);
  });
});

describe("compareMeasurements", () => {
  it("returns null when input missing", () => {
    expect(compareMeasurements(null, {})).toBeNull();
    expect(compareMeasurements({}, null)).toBeNull();
  });

  it("computes %error and tolerance flags correctly", () => {
    const camera = { meanHr: 65, rmssd: 42, sdnn: 50 };
    const ble = { meanHr: 64, rmssd: 45, sdnn: 52 };
    const r = compareMeasurements(camera, ble);
    expect(r.hr.diffBpm).toBe(1);
    expect(r.hr.pctError).toBeCloseTo(1.6, 0);
    expect(r.hr.withinTolerance).toBe(true); // <5%
    expect(r.rmssd.diffMs).toBe(-3);
    expect(r.rmssd.withinTolerance).toBe(true); // <30%
  });

  it("flags out-of-tolerance correctly", () => {
    const camera = { meanHr: 80, rmssd: 20 };
    const ble = { meanHr: 60, rmssd: 50 };
    const r = compareMeasurements(camera, ble);
    expect(r.hr.withinTolerance).toBe(false); // 33% off
    expect(r.rmssd.withinTolerance).toBe(false); // 60% off
  });
});

describe("aggregateValidationSessions", () => {
  it("returns null with no sessions", () => {
    expect(aggregateValidationSessions([])).toBeNull();
    expect(aggregateValidationSessions(null)).toBeNull();
  });

  it("aggregates n sessions into MAE + correlation + BA", () => {
    const sessions = [
      compareMeasurements({ meanHr: 65, rmssd: 42 }, { meanHr: 64, rmssd: 44 }),
      compareMeasurements({ meanHr: 70, rmssd: 38 }, { meanHr: 71, rmssd: 40 }),
      compareMeasurements({ meanHr: 60, rmssd: 50 }, { meanHr: 60, rmssd: 52 }),
    ];
    const r = aggregateValidationSessions(sessions);
    expect(r.n).toBe(3);
    expect(r.hr.mae).toBeGreaterThan(0);
    expect(r.hr.mae).toBeLessThan(2);
    expect(r.rmssd.mae).toBeCloseTo(2, 0);
    expect(r.hr.correlation).toBeGreaterThan(0.95);
  });
});
