import { describe, it, expect } from "vitest";
import { computeHrvInsight, isReliableHrvEntry, buildHrvBaseline } from "./insight";

describe("isReliableHrvEntry", () => {
  it("BLE entries (no source) are reliable", () => {
    expect(isReliableHrvEntry({ lnRmssd: 4.0 })).toBe(true);
  });

  it("camera entries with SQI ≥ 60 are reliable", () => {
    expect(isReliableHrvEntry({ lnRmssd: 4.0, source: "camera", sqi: 75 })).toBe(true);
    expect(isReliableHrvEntry({ lnRmssd: 4.0, source: "camera", sqi: 60 })).toBe(true);
  });

  it("camera entries with SQI < 60 are rejected", () => {
    expect(isReliableHrvEntry({ lnRmssd: 4.0, source: "camera", sqi: 45 })).toBe(false);
  });

  it("camera entries without SQI are rejected", () => {
    expect(isReliableHrvEntry({ lnRmssd: 4.0, source: "camera" })).toBe(false);
  });

  it("entries without lnRmssd are rejected", () => {
    expect(isReliableHrvEntry({ source: "camera", sqi: 80 })).toBe(false);
    expect(isReliableHrvEntry({})).toBe(false);
    expect(isReliableHrvEntry(null)).toBe(false);
  });
});

describe("buildHrvBaseline", () => {
  it("returns empty when log is empty / not array", () => {
    expect(buildHrvBaseline([])).toEqual([]);
    expect(buildHrvBaseline(null)).toEqual([]);
    expect(buildHrvBaseline(undefined)).toEqual([]);
  });

  it("includes only reliable entries within window", () => {
    const now = Date.now();
    const log = [
      { ts: now - 1 * 86400000, lnRmssd: 4.1 }, // BLE, in window
      { ts: now - 5 * 86400000, lnRmssd: 4.2, source: "camera", sqi: 75 }, // good cam
      { ts: now - 6 * 86400000, lnRmssd: 3.8, source: "camera", sqi: 30 }, // bad cam — excluded
      { ts: now - 20 * 86400000, lnRmssd: 4.0 }, // outside 14d — excluded
    ];
    const base = buildHrvBaseline(log, 14);
    expect(base).toEqual([4.1, 4.2]);
  });

  it("handles legacy lnrmssd casing", () => {
    const now = Date.now();
    const log = [{ ts: now, lnrmssd: 3.9 }];
    expect(buildHrvBaseline(log, 14)).toEqual([3.9]);
  });
});

describe("computeHrvInsight", () => {
  // Baseline realista de 14d con variabilidad ~ std 0.33 (típico HRV real)
  const baseline14d = [3.5, 3.8, 4.2, 4.0, 4.5, 3.7, 4.3, 3.9]; // mean ≈ 3.99, std ≈ 0.33

  it("returns null with insufficient baseline (<5)", () => {
    expect(
      computeHrvInsight({ currentLnRmssd: 4.0, baseline14d: [4.0, 4.1, 4.0] })
    ).toBeNull();
  });

  it("returns null when current lnRmssd is invalid", () => {
    expect(computeHrvInsight({ currentLnRmssd: NaN, baseline14d })).toBeNull();
    expect(computeHrvInsight({ currentLnRmssd: null, baseline14d })).toBeNull();
  });

  it("classifies as 'above' when z >= 1 (high HRV today)", () => {
    const r = computeHrvInsight({ currentLnRmssd: 4.5, baseline14d });
    expect(r).not.toBeNull();
    expect(r.comparison).toBe("above");
    expect(r.intent).toBe("energia");
    expect(r.deltaPctRmssd).toBeGreaterThan(0);
  });

  it("classifies as 'near' when z is moderate positive", () => {
    const r = computeHrvInsight({ currentLnRmssd: 4.05, baseline14d });
    expect(r).not.toBeNull();
    expect(r.comparison).toBe("near");
    expect(r.intent).toBe("enfoque");
  });

  it("classifies as 'below' when z is mildly negative", () => {
    const r = computeHrvInsight({ currentLnRmssd: 3.85, baseline14d });
    expect(r).not.toBeNull();
    expect(r.comparison).toBe("below");
    expect(r.intent).toBe("reset");
    expect(r.deltaPctRmssd).toBeLessThan(0);
  });

  it("classifies as 'well-below' when z <= -1 (suppressed HRV)", () => {
    const r = computeHrvInsight({ currentLnRmssd: 3.4, baseline14d });
    expect(r).not.toBeNull();
    expect(r.comparison).toBe("well-below");
    expect(r.intent).toBe("calma");
  });

  it("delta% on RMSSD scale matches expected exponential", () => {
    // mean ≈ 3.99, current = 4.39 → diff 0.4 → ratio e^0.4 ≈ 1.49 → +49.2%
    const r = computeHrvInsight({ currentLnRmssd: 4.39, baseline14d });
    expect(r.deltaPctRmssd).toBeGreaterThan(45);
    expect(r.deltaPctRmssd).toBeLessThan(55);
  });
});
