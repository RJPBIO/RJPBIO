import { describe, it, expect } from "vitest";
import { createCoherenceTracker } from "./coherence";

describe("createCoherenceTracker", () => {
  it("returns null with insufficient beats", () => {
    const t = createCoherenceTracker();
    for (let i = 0; i < 5; i++) {
      t.pushBreath(i / 5, i * 1000);
      t.pushBeat(800, i * 1000);
    }
    expect(t.coherence()).toBeNull();
  });

  it("rejects out-of-range IBIs (physiological filter)", () => {
    const t = createCoherenceTracker();
    t.pushBreath(0, 0);
    t.pushBeat(100, 0); // too short
    t.pushBeat(3000, 100); // too long
    expect(t.snapshot().beatCount).toBe(0);
  });

  it("returns score with strong RSA + phase alignment", () => {
    const t = createCoherenceTracker();
    // Simulate 30 beats with sinusoidal RSA (50ms amplitude) phase-locked
    // to a 6s breathing cycle. Each beat ~1s.
    const breathPeriod = 6000;
    const baseIbi = 1000;
    const rsaAmplitude = 50;
    let ts = 0;
    for (let i = 0; i < 30; i++) {
      const phase = (ts / breathPeriod) % 1;
      // IBI follows -sin(2π·phase): IBI lowest at peak inhalation
      const ibi = baseIbi - rsaAmplitude * Math.sin(2 * Math.PI * phase);
      t.pushBreath(phase, ts);
      t.pushBeat(ibi, ts);
      ts += ibi;
    }
    const r = t.coherence();
    expect(r).not.toBeNull();
    expect(r.score).toBeGreaterThan(60);
    expect(r.phaseLock).toBeGreaterThan(80);
    expect(r.amplitude).toBeGreaterThan(60);
  });

  it("returns low score with no RSA (constant IBIs)", () => {
    const t = createCoherenceTracker();
    let ts = 0;
    for (let i = 0; i < 30; i++) {
      const phase = (ts / 6000) % 1;
      t.pushBreath(phase, ts);
      t.pushBeat(800, ts); // constant
      ts += 800;
    }
    const r = t.coherence();
    expect(r).not.toBeNull();
    expect(r.amplitude).toBeLessThan(10); // std ≈ 0 → low amplitude
  });

  it("returns mid-low score with random uncorrelated variability", () => {
    const t = createCoherenceTracker();
    // Random IBI variability NOT phase-locked to breath
    let ts = 0;
    const seed = 42;
    let s = seed;
    function rng() {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    }
    for (let i = 0; i < 40; i++) {
      const phase = (ts / 6000) % 1;
      const ibi = 800 + (rng() - 0.5) * 100; // ±50ms random
      t.pushBreath(phase, ts);
      t.pushBeat(ibi, ts);
      ts += ibi;
    }
    const r = t.coherence();
    expect(r).not.toBeNull();
    // amplitude alta (variabilidad) pero phaseLock baja (no alineada)
    expect(r.phaseLock).toBeLessThan(50);
  });

  it("prunes samples older than window", () => {
    const t = createCoherenceTracker({ windowMs: 5000 });
    for (let i = 0; i < 10; i++) {
      t.pushBeat(800, i * 1000);
      t.pushBreath((i % 6) / 6, i * 1000);
    }
    // Push something fresh; older than 5s should be gone
    t.pushBeat(800, 15000);
    expect(t.snapshot().beatCount).toBeLessThanOrEqual(2);
  });

  it("reset() clears all state", () => {
    const t = createCoherenceTracker();
    t.pushBeat(800);
    t.pushBreath(0.5);
    t.reset();
    expect(t.snapshot().beatCount).toBe(0);
    expect(t.snapshot().breathSampleCount).toBe(0);
  });

  it("wraps breath phase to [0, 1)", () => {
    const t = createCoherenceTracker();
    t.pushBreath(2.5); // → 0.5
    expect(t.snapshot().latestBreathPhase).toBeCloseTo(0.5, 3);
    t.pushBreath(-0.25); // → 0.75
    expect(t.snapshot().latestBreathPhase).toBeCloseTo(0.75, 3);
  });
});
