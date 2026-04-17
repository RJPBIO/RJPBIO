import { describe, it, expect } from "vitest";
import {
  cleanRR, rmssd, sdnn, pnn50, meanHR, lnRmssd,
  coherenceProxy, hrvSummary, personalPercentile, zScore,
  mdc95, classifyDelta,
} from "./hrv";

describe("cleanRR", () => {
  it("rejects out-of-range values", () => {
    const r = cleanRR([200, 800, 810, 3000, 820, 815]);
    expect(r).not.toContain(200);
    expect(r).not.toContain(3000);
  });

  it("rejects ectopic beats (>20% jump)", () => {
    const r = cleanRR([800, 810, 820, 1300, 820]);
    expect(r).not.toContain(1300);
  });

  it("returns empty for non-array input", () => {
    expect(cleanRR(null)).toEqual([]);
    expect(cleanRR("abc")).toEqual([]);
  });
});

describe("rmssd", () => {
  it("returns 0 for < 2 intervals", () => {
    expect(rmssd([])).toBe(0);
    expect(rmssd([800])).toBe(0);
  });

  it("equals 0 for constant RR", () => {
    expect(rmssd([800, 800, 800, 800])).toBe(0);
  });

  it("computes known value", () => {
    // differences: 50, -50 → squared 2500, 2500 → mean 2500 → sqrt = 50
    expect(rmssd([800, 850, 800])).toBeCloseTo(50, 1);
  });

  it("falls in physiological range for simulated data", () => {
    const rr = [800, 810, 790, 820, 800, 815, 795, 805];
    const r = rmssd(rr);
    expect(r).toBeGreaterThan(5);
    expect(r).toBeLessThan(50);
  });
});

describe("sdnn", () => {
  it("returns 0 for constant RR", () => {
    expect(sdnn([800, 800, 800])).toBe(0);
  });

  it("> 0 for variable RR", () => {
    expect(sdnn([800, 850, 780, 810, 790])).toBeGreaterThan(0);
  });
});

describe("pnn50", () => {
  it("returns 100% when all differences exceed 50ms", () => {
    expect(pnn50([800, 900, 800, 900])).toBe(100);
  });

  it("returns 0 for tightly clustered RR", () => {
    expect(pnn50([800, 805, 810, 802])).toBe(0);
  });
});

describe("meanHR", () => {
  it("converts RR to BPM", () => {
    expect(meanHR([1000, 1000, 1000])).toBe(60);
    expect(meanHR([600, 600])).toBe(100);
  });
});

describe("lnRmssd", () => {
  it("returns 0 if RMSSD is 0", () => {
    expect(lnRmssd([800, 800])).toBe(0);
  });

  it("is log of RMSSD for variable RR", () => {
    const r = rmssd([800, 850, 800]);
    expect(lnRmssd([800, 850, 800])).toBeCloseTo(Math.log(r), 2);
  });
});

describe("coherenceProxy", () => {
  it("returns high % for RR close to mean", () => {
    const rr = Array(20).fill(800).map((v, i) => v + (i % 2) * 5);
    expect(coherenceProxy(rr)).toBeGreaterThan(90);
  });

  it("returns 0 for insufficient data", () => {
    expect(coherenceProxy([800, 810])).toBe(0);
  });
});

describe("hrvSummary", () => {
  it("marks valid=false for short recording", () => {
    const r = hrvSummary([800, 810]);
    expect(r.valid).toBe(false);
  });

  it("marks valid=true for ≥60s with ≥30 beats", () => {
    const rr = Array(80).fill(0).map((_, i) => 800 + (i % 2 === 0 ? 10 : -10));
    const r = hrvSummary(rr);
    expect(r.valid).toBe(true);
    expect(r.n).toBeGreaterThanOrEqual(30);
  });
});

describe("personalPercentile", () => {
  it("returns null for < 3 history", () => {
    expect(personalPercentile(50, [10, 20])).toBe(null);
  });

  it("correctly ranks high value", () => {
    expect(personalPercentile(100, [10, 20, 30, 40, 50])).toBe(100);
  });

  it("correctly ranks low value", () => {
    expect(personalPercentile(5, [10, 20, 30, 40, 50])).toBe(0);
  });
});

describe("zScore", () => {
  it("returns null for < 7 history", () => {
    expect(zScore(50, [10, 20, 30])).toBe(null);
  });

  it("returns 0 for value equal to mean", () => {
    expect(zScore(30, [10, 20, 30, 40, 50, 30, 30])).toBeCloseTo(0, 0);
  });

  it("returns positive z for above-mean", () => {
    const z = zScore(80, [10, 20, 30, 40, 50, 30, 30]);
    expect(z).toBeGreaterThan(1);
  });
});

describe("mdc95", () => {
  it("returns null for too-small history", () => {
    expect(mdc95([1, 2, 3])).toBe(null);
  });

  it("returns positive number with variance", () => {
    expect(mdc95([10, 20, 30, 40, 50, 60, 70])).toBeGreaterThan(0);
  });
});

describe("classifyDelta", () => {
  it("returns insufficient with small history", () => {
    expect(classifyDelta(50, [1, 2])).toBe("insufficient");
  });

  it("elevated when z ≥ 1", () => {
    expect(classifyDelta(100, [10, 20, 30, 40, 50, 30, 30])).toBe("elevated");
  });

  it("suppressed when z ≤ -1", () => {
    expect(classifyDelta(0, [10, 20, 30, 40, 50, 30, 30])).toBe("suppressed");
  });
});
