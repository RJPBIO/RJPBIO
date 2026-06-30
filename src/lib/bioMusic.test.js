import { describe, it, expect } from "vitest";
import { mapStateToMusic, chordForConsonance } from "./bioMusic";

describe("chordForConsonance", () => {
  it("escala de cluster disonante a maj9 luminoso", () => {
    expect(chordForConsonance(0.9)).toEqual([0, 4, 7, 11, 14]);
    expect(chordForConsonance(0.7)).toEqual([0, 4, 7]);
    expect(chordForConsonance(0.5)).toEqual([0, 5, 7]);
    expect(chordForConsonance(0.3)).toEqual([0, 3, 7, 10]);
    expect(chordForConsonance(0.05)).toEqual([0, 1, 6]);
  });
});

describe("mapStateToMusic", () => {
  it("señal limpia + HRV sana → alta consonancia (armonía)", () => {
    const m = mapStateToMusic({ hrv: { meanHr: 64, rmssd: 55 }, sqi: { score: 95 }, fingerOk: true });
    expect(m.hasSignal).toBe(true);
    expect(m.consonance).toBeGreaterThanOrEqual(0.8);
    expect(m.chord).toEqual([0, 4, 7, 11, 14]);
    expect(m.pulseHz).toBeCloseTo(64 / 60, 2);
    expect(m.level).toBeGreaterThan(0.8);
  });

  it("señal fragmentada (SQI bajo) → disonancia", () => {
    const m = mapStateToMusic({ hrv: { meanHr: 80, rmssd: 18 }, sqi: { score: 25 }, fingerOk: true });
    expect(m.consonance).toBeLessThan(0.4);
    expect(m.dissonance).toBeGreaterThan(0.6);
  });

  it("sin dedo / sin señal → casi silencio tenso (cluster, level bajo)", () => {
    const m = mapStateToMusic({ hrv: null, sqi: null, fingerOk: false });
    expect(m.hasSignal).toBe(false);
    expect(m.level).toBeLessThan(0.2);
    expect(m.chord).toEqual([0, 1, 6]);
  });

  it("brillo crece con la HRV", () => {
    const low = mapStateToMusic({ hrv: { meanHr: 70, rmssd: 18 }, sqi: { score: 90 }, fingerOk: true });
    const high = mapStateToMusic({ hrv: { meanHr: 70, rmssd: 58 }, sqi: { score: 90 }, fingerOk: true });
    expect(high.brightness).toBeGreaterThan(low.brightness);
  });

  it("bpm fuera de rango → pulso neutro 1 Hz", () => {
    const m = mapStateToMusic({ hrv: { meanHr: 0, rmssd: 40 }, sqi: { score: 80 }, fingerOk: true });
    expect(m.pulseHz).toBe(1);
  });

  it("no rompe con update vacío", () => {
    const m = mapStateToMusic(undefined);
    expect(m.hasSignal).toBe(false);
    expect(Array.isArray(m.chord)).toBe(true);
  });
});
