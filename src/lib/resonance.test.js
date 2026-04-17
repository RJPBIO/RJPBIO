import { describe, it, expect } from "vitest";
import {
  hrvAmplitude, pickResonanceRate, timingsFor, sessionPlan,
  RESONANCE_RATES,
} from "./resonance";

describe("RESONANCE_RATES", () => {
  it("has 5 rates from 4.5 to 6.5", () => {
    expect(RESONANCE_RATES.length).toBe(5);
    expect(RESONANCE_RATES[0].bpm).toBe(4.5);
    expect(RESONANCE_RATES[4].bpm).toBe(6.5);
  });
});

describe("hrvAmplitude", () => {
  it("returns 0 for too-few samples", () => {
    expect(hrvAmplitude([800, 810])).toBe(0);
  });

  it("returns 0 for constant RR", () => {
    expect(hrvAmplitude(Array(30).fill(800))).toBe(0);
  });

  it("returns positive for varying RR (RSA)", () => {
    const rr = Array(30).fill(0).map((_, i) => 800 + 50 * Math.sin(i / 3));
    const a = hrvAmplitude(rr);
    expect(a).toBeGreaterThan(1);
  });
});

describe("pickResonanceRate", () => {
  it("returns null for empty trials", () => {
    expect(pickResonanceRate([])).toBe(null);
  });

  it("picks max-amplitude rate", () => {
    const mkRR = (amp) => Array(30).fill(0).map((_, i) => 800 + amp * Math.sin(i / 3));
    const trials = [
      { bpm: 4.5, rrMs: mkRR(20) },
      { bpm: 5.5, rrMs: mkRR(50) },
      { bpm: 6.0, rrMs: mkRR(10) },
    ];
    const r = pickResonanceRate(trials);
    expect(r.bpm).toBe(5.5);
  });

  it("includes confidence level", () => {
    const trials = RESONANCE_RATES.slice(0, 3).map((r) => ({
      bpm: r.bpm,
      rrMs: Array(30).fill(0).map((_, i) => 800 + 20 * Math.sin(i / 3)),
    }));
    const picked = pickResonanceRate(trials);
    expect(picked.confidence).toBe("high");
  });
});

describe("timingsFor", () => {
  it("matches cycle length to BPM", () => {
    const t = timingsFor(6);
    expect(t.cycleMs).toBe(10000);
  });

  it("biases exhale slightly longer", () => {
    const t = timingsFor(5.5);
    expect(t.exMs).toBeGreaterThan(t.inMs);
  });
});

describe("sessionPlan", () => {
  it("computes cycles for 20-min session at 6 rpm", () => {
    const p = sessionPlan(6, 20);
    expect(p.cycles).toBe(120);
  });
});
