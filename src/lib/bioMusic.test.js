import { describe, it, expect } from "vitest";
import { mapStateToMusic, chordDegreesForConsonance } from "./bioMusic";

describe("chordDegreesForConsonance", () => {
  it("escala de cluster cerrado a voicing maj9 abierto (grados diatónicos)", () => {
    expect(chordDegreesForConsonance(0.9)).toEqual([0, 2, 4, 6, 7]);
    expect(chordDegreesForConsonance(0.7)).toEqual([0, 2, 4]);
    expect(chordDegreesForConsonance(0.5)).toEqual([0, 3, 4]);
    expect(chordDegreesForConsonance(0.3)).toEqual([0, 1, 3]);
    expect(chordDegreesForConsonance(0.05)).toEqual([0, 1, 2]);
  });
});

describe("mapStateToMusic", () => {
  it("señal limpia + HRV sana → voicing abierto + arpegio presente", () => {
    const m = mapStateToMusic({ hrv: { meanHr: 64, rmssd: 55 }, sqi: { score: 95 }, fingerOk: true });
    expect(m.hasSignal).toBe(true);
    expect(m.consonance).toBeGreaterThanOrEqual(0.8);
    expect(m.chordDegrees).toEqual([0, 2, 4, 6, 7]);
    expect(m.arpGain).toBeGreaterThan(0.5);
    expect(m.shimmer).toBeGreaterThan(0.5);
    expect(m.pulseHz).toBeCloseTo(64 / 60, 2);
    expect(m.arpRate).toBeCloseTo((64 / 60) * 2, 2);
  });

  it("señal fragmentada → cluster + arpegio apagado", () => {
    const m = mapStateToMusic({ hrv: { meanHr: 82, rmssd: 18 }, sqi: { score: 25 }, fingerOk: true });
    expect(m.consonance).toBeLessThan(0.4);
    expect(m.chordDegrees[m.chordDegrees.length - 1]).toBeLessThanOrEqual(3);
  });

  it("sin dedo → casi silencio, sin arpegio", () => {
    const m = mapStateToMusic({ hrv: null, sqi: null, fingerOk: false });
    expect(m.hasSignal).toBe(false);
    expect(m.arpGain).toBe(0);
    expect(m.level).toBeLessThan(0.2);
    expect(m.chordDegrees).toEqual([0, 1, 2]);
  });

  it("brillo crece con la HRV", () => {
    const lo = mapStateToMusic({ hrv: { meanHr: 70, rmssd: 18 }, sqi: { score: 90 }, fingerOk: true });
    const hi = mapStateToMusic({ hrv: { meanHr: 70, rmssd: 58 }, sqi: { score: 90 }, fingerOk: true });
    expect(hi.brightness).toBeGreaterThan(lo.brightness);
  });

  it("no rompe con update vacío", () => {
    const m = mapStateToMusic(undefined);
    expect(m.hasSignal).toBe(false);
    expect(Array.isArray(m.chordDegrees)).toBe(true);
  });
});
