import { describe, it, expect } from "vitest";
import {
  lowpassBiquad,
  highpassBiquad,
  bandpassCascade,
  filtfilt,
  detrend,
  zscoreNormalize,
} from "./filter";
import {
  detectPeaks,
  peaksToIbi,
  validateIbis,
  detectEctopic,
  refinePeakPositions,
  hampelFilterIbis,
} from "./peaks";
import { isFingerPlaced, createStreamingAnalyzer } from "./capture";
import { computeHrv } from "./metrics";
import { computeSqi, shouldAcceptMeasurement } from "./sqi";
import {
  generateIbis,
  generatePpgFromIbis,
  synthesize,
  mulberry32,
} from "./synth";

/* ─────────────────── FILTER ─────────────────── */

describe("filter: lowpass biquad", () => {
  it("passes low-frequency signal (1 Hz) at fs=30", () => {
    const fs = 30;
    const N = 300;
    const input = Array.from({ length: N }, (_, i) =>
      Math.sin((2 * Math.PI * 1 * i) / fs)
    );
    const lpf = lowpassBiquad(4, fs);
    const out = lpf.processArray(input);
    // Steady-state amplitude debería estar cerca de 1
    const tail = out.slice(200);
    const rmsIn = Math.sqrt(input.slice(200).reduce((a, x) => a + x * x, 0) / tail.length);
    const rmsOut = Math.sqrt(tail.reduce((a, x) => a + x * x, 0) / tail.length);
    expect(rmsOut / rmsIn).toBeGreaterThan(0.9);
  });

  it("attenuates high-frequency signal (10 Hz) at fs=30 with fc=4", () => {
    const fs = 30;
    const N = 300;
    const input = Array.from({ length: N }, (_, i) =>
      Math.sin((2 * Math.PI * 10 * i) / fs)
    );
    const lpf = lowpassBiquad(4, fs);
    const out = lpf.processArray(input);
    const tail = out.slice(200);
    const rmsOut = Math.sqrt(tail.reduce((a, x) => a + x * x, 0) / tail.length);
    // Butterworth de 2º orden a 2.5× cutoff → atenuación fuerte
    expect(rmsOut).toBeLessThan(0.3);
  });

  it("reset clears state", () => {
    const lpf = lowpassBiquad(4, 30);
    lpf.process(1);
    lpf.process(1);
    lpf.reset();
    expect(lpf.process(0)).toBe(0);
  });
});

describe("filter: highpass biquad", () => {
  it("attenuates DC (constant signal)", () => {
    const fs = 30;
    const input = new Array(300).fill(1);
    const hpf = highpassBiquad(0.7, fs);
    const out = hpf.processArray(input);
    const tail = out.slice(200);
    const meanOut = tail.reduce((a, b) => a + b, 0) / tail.length;
    expect(Math.abs(meanOut)).toBeLessThan(0.05);
  });

  it("passes high-frequency signal", () => {
    const fs = 30;
    const N = 300;
    const input = Array.from({ length: N }, (_, i) =>
      Math.sin((2 * Math.PI * 3 * i) / fs)
    );
    const hpf = highpassBiquad(0.7, fs);
    const out = hpf.processArray(input);
    const tail = out.slice(200);
    const rmsIn = Math.sqrt(input.slice(200).reduce((a, x) => a + x * x, 0) / tail.length);
    const rmsOut = Math.sqrt(tail.reduce((a, x) => a + x * x, 0) / tail.length);
    expect(rmsOut / rmsIn).toBeGreaterThan(0.85);
  });
});

describe("filter: bandpass cascade", () => {
  it("passes 1.5 Hz (≈90 BPM) cleanly", () => {
    const fs = 30;
    const N = 600;
    const input = Array.from({ length: N }, (_, i) =>
      Math.sin((2 * Math.PI * 1.5 * i) / fs)
    );
    const bpf = bandpassCascade(0.7, 4, fs);
    const out = bpf.processArray(input);
    const tail = out.slice(400);
    const rmsIn = Math.sqrt(input.slice(400).reduce((a, x) => a + x * x, 0) / tail.length);
    const rmsOut = Math.sqrt(tail.reduce((a, x) => a + x * x, 0) / tail.length);
    expect(rmsOut / rmsIn).toBeGreaterThan(0.8);
  });

  it("suppresses DC + very slow drift", () => {
    const fs = 30;
    const N = 600;
    const input = Array.from({ length: N }, (_, i) => 2 + 0.5 * Math.sin((2 * Math.PI * 0.05 * i) / fs));
    const bpf = bandpassCascade(0.7, 4, fs);
    const out = bpf.processArray(input);
    const tail = out.slice(400);
    const rmsOut = Math.sqrt(tail.reduce((a, x) => a + x * x, 0) / tail.length);
    expect(rmsOut).toBeLessThan(0.15);
  });
});

describe("filter: filtfilt (zero-phase)", () => {
  it("has zero phase shift on a Gaussian pulse", () => {
    const fs = 30;
    const N = 300;
    const center = 150;
    const sigma = 8;
    const input = Array.from({ length: N }, (_, i) =>
      Math.exp(-((i - center) ** 2) / (2 * sigma * sigma))
    );
    const out = filtfilt(() => lowpassBiquad(4, fs), input);
    const argmax = (arr) => {
      let bi = 0, bv = -Infinity;
      for (let i = 0; i < arr.length; i++) if (arr[i] > bv) { bv = arr[i]; bi = i; }
      return bi;
    };
    // Un filtro IIR one-way desplazaría el pico; filtfilt debe preservarlo.
    expect(Math.abs(argmax(out) - center)).toBeLessThanOrEqual(2);
  });

  it("single-pass filter (no filtfilt) introduces phase shift", () => {
    const fs = 30;
    const N = 300;
    const center = 150;
    const sigma = 8;
    const input = Array.from({ length: N }, (_, i) =>
      Math.exp(-((i - center) ** 2) / (2 * sigma * sigma))
    );
    const lpf = lowpassBiquad(4, fs);
    const out = lpf.processArray(input);
    const argmax = (arr) => {
      let bi = 0, bv = -Infinity;
      for (let i = 0; i < arr.length; i++) if (arr[i] > bv) { bv = arr[i]; bi = i; }
      return bi;
    };
    // One-way IIR retarda el pico respecto al input
    expect(argmax(out)).toBeGreaterThan(center);
  });
});

describe("filter: detrend", () => {
  it("removes linear trend ≈", () => {
    const N = 300;
    const arr = Array.from({ length: N }, (_, i) => i * 0.1);
    const out = detrend(arr, 60);
    // La mayoría del centro debe tener valores cercanos a 0
    const center = out.slice(100, 200);
    const mean = center.reduce((a, b) => a + b, 0) / center.length;
    expect(Math.abs(mean)).toBeLessThan(0.1);
  });
});

describe("filter: zscoreNormalize", () => {
  it("produces mean≈0, std≈1", () => {
    const arr = Array.from({ length: 300 }, (_, i) =>
      5 + 3 * Math.sin((2 * Math.PI * i) / 30)
    );
    const out = zscoreNormalize(arr);
    const mean = out.reduce((a, b) => a + b, 0) / out.length;
    const std = Math.sqrt(out.reduce((a, b) => a + (b - mean) ** 2, 0) / out.length);
    expect(Math.abs(mean)).toBeLessThan(1e-9);
    expect(std).toBeCloseTo(1, 5);
  });
});

/* ─────────────────── PEAKS ─────────────────── */

describe("peaks: detectPeaks on synthetic Gaussian train", () => {
  it("finds exactly N peaks in clean signal", () => {
    const fs = 30;
    const rng = mulberry32(42);
    const ibis = generateIbis(20, 60, 0, rng); // HR 60 BPM, sin variabilidad
    const signal = generatePpgFromIbis(ibis, fs, { noiseStd: 0, driftAmp: 0, rng });
    const peaks = detectPeaks(signal, fs);
    // Esperamos ~20 picos ± 1 (efectos de borde)
    expect(peaks.length).toBeGreaterThanOrEqual(18);
    expect(peaks.length).toBeLessThanOrEqual(21);
  });

  it("respects refractory period (no peaks < 300ms apart)", () => {
    const fs = 30;
    const rng = mulberry32(7);
    const ibis = generateIbis(20, 70, 10, rng);
    const signal = generatePpgFromIbis(ibis, fs, { noiseStd: 0.01, driftAmp: 0, rng });
    const peaks = detectPeaks(signal, fs);
    const refractorySamples = Math.floor((300 / 1000) * fs);
    for (let i = 1; i < peaks.length; i++) {
      expect(peaks[i] - peaks[i - 1]).toBeGreaterThanOrEqual(refractorySamples);
    }
  });

  it("returns empty for too-short signal", () => {
    expect(detectPeaks([1, 2], 30)).toEqual([]);
    expect(detectPeaks([], 30)).toEqual([]);
  });

  it("returns empty for invalid fs", () => {
    expect(detectPeaks([1, 2, 3, 4], 0)).toEqual([]);
    expect(detectPeaks([1, 2, 3, 4], -5)).toEqual([]);
  });
});

describe("peaks: peaksToIbi", () => {
  it("converts index gaps to ms at fs=30", () => {
    const ibis = peaksToIbi([0, 30, 60, 90], 30);
    expect(ibis.length).toBe(3);
    ibis.forEach((v) => expect(v).toBeCloseTo(1000, 6));
  });

  it("empty input → empty output", () => {
    expect(peaksToIbi([10], 30)).toEqual([]);
    expect(peaksToIbi([], 30)).toEqual([]);
  });
});

describe("peaks: validateIbis physiological filter", () => {
  it("rejects values <300 or >2000", () => {
    const { valid, rejected } = validateIbis([200, 800, 810, 3000, 820]);
    expect(valid).toEqual([800, 810, 820]);
    expect(rejected).toBe(2);
  });

  it("rejectRate is correct fraction", () => {
    const { rejectRate } = validateIbis([200, 800, 810, 3000, 820]);
    expect(rejectRate).toBeCloseTo(0.4, 5);
  });
});

describe("peaks: hampelFilterIbis (MAD-based robust detection)", () => {
  it("flags a single spike in a low-variability series", () => {
    const ibis = [800, 810, 805, 815, 808, 1400, 803, 812, 799, 807];
    const { ectopic, ectopicIndices } = hampelFilterIbis(ibis);
    expect(ectopic).toContain(1400);
    expect(ectopicIndices).toContain(5);
  });

  it("preserves RSA-like smooth oscillation without flagging", () => {
    // Respiratory Sinus Arrhythmia real: IBI sigue ciclo respiratorio
    // (5-6s) con amplitud 60-80ms. Gaussian + oscilación suave, no
    // alternancia abrupta. Hampel debe dejarla intacta.
    const N = 30;
    const ibis = Array.from({ length: N }, (_, i) =>
      Math.round(900 + 40 * Math.sin((2 * Math.PI * i) / 6))
    );
    const { ectopic } = hampelFilterIbis(ibis, { nSigmas: 3 });
    expect(ectopic.length).toBe(0);
  });

  it("flags a sudden jump inside a smooth RSA-like series", () => {
    const N = 30;
    const ibis = Array.from({ length: N }, (_, i) =>
      Math.round(900 + 40 * Math.sin((2 * Math.PI * i) / 6))
    );
    ibis[15] = 1500; // spike
    const { ectopic } = hampelFilterIbis(ibis, { nSigmas: 3 });
    expect(ectopic).toContain(1500);
  });

  it("returns input unchanged when series is too short", () => {
    const ibis = [800, 810, 790];
    const r = hampelFilterIbis(ibis);
    expect(r.clean).toEqual(ibis);
    expect(r.ectopic).toEqual([]);
  });

  it("handles constant series without flagging anything", () => {
    const ibis = new Array(20).fill(800);
    const { ectopic } = hampelFilterIbis(ibis);
    expect(ectopic.length).toBe(0);
  });
});

describe("peaks: detectEctopic", () => {
  it("flags large outlier beats", () => {
    const ibis = [800, 810, 820, 1500, 815, 805]; // 1500 es outlier
    const { ectopic, ectopicIndices } = detectEctopic(ibis, 0.2);
    expect(ectopic).toContain(1500);
    expect(ectopicIndices).toContain(3);
  });

  it("handles short arrays gracefully", () => {
    const r = detectEctopic([800, 810], 0.2);
    expect(r.clean.length).toBe(2);
    expect(r.ectopic.length).toBe(0);
  });
});

/* ─────────────────── METRICS ─────────────────── */

describe("metrics: computeHrv", () => {
  it("returns null for <2 IBIs", () => {
    expect(computeHrv([])).toBe(null);
    expect(computeHrv([800])).toBe(null);
  });

  it("mean HR matches (60000/meanIBI)", () => {
    const r = computeHrv([1000, 1000, 1000, 1000]);
    expect(r.meanHr).toBeCloseTo(60, 0);
  });

  it("RMSSD=0 for constant IBIs", () => {
    const r = computeHrv([800, 800, 800, 800]);
    expect(r.rmssd).toBe(0);
  });

  it("RMSSD≈50 for alternating ±50 differences", () => {
    const r = computeHrv([800, 850, 800, 850, 800]);
    expect(r.rmssd).toBeCloseTo(50, 0);
  });

  it("includes all expected fields", () => {
    const r = computeHrv([800, 810, 820, 815, 825]);
    expect(r).toHaveProperty("meanHr");
    expect(r).toHaveProperty("meanIbi");
    expect(r).toHaveProperty("sdnn");
    expect(r).toHaveProperty("rmssd");
    expect(r).toHaveProperty("pnn50");
    expect(r).toHaveProperty("lnRmssd");
    expect(r).toHaveProperty("cv");
    expect(r).toHaveProperty("n");
  });
});

/* ─────────────────── SQI ─────────────────── */

describe("sqi: computeSqi", () => {
  it("gives high score for clean regular IBIs", () => {
    const ibis = Array(40)
      .fill(0)
      .map((_, i) => 850 + (i % 2 === 0 ? 15 : -15));
    const peaks = Array(40).fill(1);
    const sqi = computeSqi({
      ibisValid: ibis,
      ectopicRate: 0,
      peakValues: peaks,
      durationSec: 60,
      expectedHrBpm: 70,
    });
    expect(sqi.score).toBeGreaterThanOrEqual(80);
    expect(sqi.band).toBe("excellent");
  });

  it("penalizes high ectopic rate", () => {
    const ibis = Array(20).fill(800);
    const sqi = computeSqi({
      ibisValid: ibis,
      ectopicRate: 0.3,
      durationSec: 40,
    });
    expect(sqi.components.ectopic).toBeLessThan(50);
  });

  it("penalizes low coverage", () => {
    const ibis = [800, 810, 820]; // solo 3 latidos en 60s
    const sqi = computeSqi({
      ibisValid: ibis,
      ectopicRate: 0,
      durationSec: 60,
      expectedHrBpm: 70,
    });
    expect(sqi.components.coverage).toBeLessThan(20);
  });

  it("returns poor band for garbage input", () => {
    const sqi = computeSqi({
      ibisValid: [800, 2000, 500, 1500],
      ectopicRate: 0.5,
      durationSec: 60,
    });
    expect(["poor", "marginal"]).toContain(sqi.band);
  });
});

describe("sqi: shouldAcceptMeasurement", () => {
  it("rejects null", () => {
    expect(shouldAcceptMeasurement(null)).toBe(false);
  });

  it("rejects poor band", () => {
    expect(
      shouldAcceptMeasurement({
        score: 30,
        band: "poor",
        components: { periodicity: 0, ectopic: 100, prominence: 100, coverage: 100 },
      })
    ).toBe(false);
  });

  it("rejects low coverage even with high overall score", () => {
    expect(
      shouldAcceptMeasurement({
        score: 70,
        band: "good",
        components: { periodicity: 100, ectopic: 100, prominence: 100, coverage: 30 },
      })
    ).toBe(false);
  });

  it("accepts good band with all components OK", () => {
    expect(
      shouldAcceptMeasurement({
        score: 75,
        band: "good",
        components: { periodicity: 80, ectopic: 80, prominence: 70, coverage: 80 },
      })
    ).toBe(true);
  });
});

/* ─────────────────── END-TO-END ─────────────────── */

describe("pipeline E2E: recovers known HR from synthetic PPG", () => {
  it("HR 60 BPM ± 3 BPM with clean signal", () => {
    const fs = 30;
    const rng = mulberry32(1234);
    const { signal } = synthesize({
      durationSec: 60,
      hrBpm: 60,
      rmssdMs: 30,
      fs,
      noiseStd: 0.02,
      driftAmp: 0.05,
      rng,
    });
    const bpf = bandpassCascade(0.7, 4, fs);
    const filtered = bpf.processArray(signal);
    const normalized = zscoreNormalize(filtered);
    const peaks = detectPeaks(normalized, fs);
    const rawIbis = peaksToIbi(peaks, fs);
    const { valid } = validateIbis(rawIbis);
    const { clean } = detectEctopic(valid);
    const hrv = computeHrv(clean);
    expect(hrv).not.toBeNull();
    expect(hrv.meanHr).toBeGreaterThan(57);
    expect(hrv.meanHr).toBeLessThan(63);
  });

  it("HR 80 BPM ± 3 BPM with clean signal", () => {
    const fs = 30;
    const rng = mulberry32(2025);
    const { signal } = synthesize({
      durationSec: 60,
      hrBpm: 80,
      rmssdMs: 25,
      fs,
      noiseStd: 0.02,
      driftAmp: 0.05,
      rng,
    });
    const bpf = bandpassCascade(0.7, 4, fs);
    const filtered = bpf.processArray(signal);
    const normalized = zscoreNormalize(filtered);
    const peaks = detectPeaks(normalized, fs);
    const rawIbis = peaksToIbi(peaks, fs);
    const { valid } = validateIbis(rawIbis);
    const { clean } = detectEctopic(valid);
    const hrv = computeHrv(clean);
    expect(hrv).not.toBeNull();
    expect(hrv.meanHr).toBeGreaterThan(77);
    expect(hrv.meanHr).toBeLessThan(83);
  });
});

describe("pipeline E2E: recovers known RMSSD from synthetic PPG", () => {
  it("target RMSSD 40ms ± 30% tolerance", () => {
    const fs = 30;
    const rng = mulberry32(5555);
    const { signal } = synthesize({
      durationSec: 90,
      hrBpm: 65,
      rmssdMs: 40,
      fs,
      noiseStd: 0.01,
      driftAmp: 0.02,
      rng,
    });
    const bpf = bandpassCascade(0.7, 4, fs);
    const filtered = bpf.processArray(signal);
    const normalized = zscoreNormalize(filtered);
    const peaks = detectPeaks(normalized, fs);
    const rawIbis = peaksToIbi(peaks, fs);
    const { valid } = validateIbis(rawIbis);
    const { clean } = detectEctopic(valid);
    const hrv = computeHrv(clean);
    expect(hrv).not.toBeNull();
    // Camera PPG pierde algo de precisión en RMSSD por el muestreo a 30 Hz
    // (resolución temporal = 33ms). Toleramos ±30%.
    expect(hrv.rmssd).toBeGreaterThan(28);
    expect(hrv.rmssd).toBeLessThan(55);
  });

  it("low RMSSD (10ms) stays low", () => {
    const fs = 30;
    const rng = mulberry32(9000);
    const { signal } = synthesize({
      durationSec: 90,
      hrBpm: 70,
      rmssdMs: 10,
      fs,
      noiseStd: 0.01,
      driftAmp: 0.02,
      rng,
    });
    const bpf = bandpassCascade(0.7, 4, fs);
    const filtered = bpf.processArray(signal);
    const normalized = zscoreNormalize(filtered);
    const peaks = detectPeaks(normalized, fs);
    const rawIbis = peaksToIbi(peaks, fs);
    const { valid } = validateIbis(rawIbis);
    const { clean } = detectEctopic(valid);
    const hrv = computeHrv(clean);
    // Con 30 Hz el piso de ruido de cuantización es ~15-20ms. Permitimos hasta 40.
    expect(hrv.rmssd).toBeLessThan(40);
  });
});

describe("pipeline E2E: SQI reflects signal quality", () => {
  it("clean synthetic signal → good/excellent SQI", () => {
    const fs = 30;
    const rng = mulberry32(111);
    const { signal } = synthesize({
      durationSec: 60,
      hrBpm: 65,
      rmssdMs: 30,
      fs,
      noiseStd: 0.01,
      driftAmp: 0.02,
      rng,
    });
    const bpf = bandpassCascade(0.7, 4, fs);
    const filtered = bpf.processArray(signal);
    const normalized = zscoreNormalize(filtered);
    const peaks = detectPeaks(normalized, fs);
    const peakValues = peaks.map((i) => normalized[i]);
    const rawIbis = peaksToIbi(peaks, fs);
    const { valid, rejectRate } = validateIbis(rawIbis);
    const { clean, ectopic } = detectEctopic(valid);
    const ectopicRate = valid.length > 0 ? ectopic.length / valid.length : 0;
    const sqi = computeSqi({
      ibisValid: clean,
      ectopicRate: Math.max(rejectRate, ectopicRate),
      peakValues,
      durationSec: 60,
      expectedHrBpm: 65,
    });
    expect(sqi.score).toBeGreaterThan(60);
    expect(shouldAcceptMeasurement(sqi)).toBe(true);
  });

  it("heavy-noise signal → lower SQI", () => {
    const fs = 30;
    const rng = mulberry32(777);
    const { signal } = synthesize({
      durationSec: 30,
      hrBpm: 70,
      rmssdMs: 25,
      fs,
      noiseStd: 0.5, // ruido dominante
      driftAmp: 0.3,
      rng,
    });
    const bpf = bandpassCascade(0.7, 4, fs);
    const filtered = bpf.processArray(signal);
    const normalized = zscoreNormalize(filtered);
    const peaks = detectPeaks(normalized, fs);
    const peakValues = peaks.map((i) => normalized[i]);
    const rawIbis = peaksToIbi(peaks, fs);
    const { valid, rejectRate } = validateIbis(rawIbis);
    const { clean, ectopic } = detectEctopic(valid);
    const ectopicRate = valid.length > 0 ? ectopic.length / valid.length : 0;
    const sqi = computeSqi({
      ibisValid: clean,
      ectopicRate: Math.max(rejectRate, ectopicRate),
      peakValues,
      durationSec: 30,
      expectedHrBpm: 70,
    });
    // El SQI debería ser bastante más bajo que en el caso limpio
    expect(sqi.score).toBeLessThan(90);
  });
});

/* ─────────────── PARABOLIC INTERPOLATION ─────────────── */

describe("peaks: refinePeakPositions", () => {
  it("returns input unchanged when i is at boundary", () => {
    const sig = [1, 2, 3, 2, 1];
    const out = refinePeakPositions(sig, [0, 4]);
    expect(out).toEqual([0, 4]);
  });

  it("gives sub-sample offset in [-0.5, 0.5]", () => {
    // Gaussiana con pico real en 100.3 (entre samples 100 y 101)
    const N = 200;
    const trueCenter = 100.3;
    const sigma = 6;
    const sig = Array.from({ length: N }, (_, i) =>
      Math.exp(-((i - trueCenter) ** 2) / (2 * sigma * sigma))
    );
    // Pico entero más cercano: 100
    const refined = refinePeakPositions(sig, [100]);
    // Debe acercarse a 100.3, no dejar en 100
    expect(Math.abs(refined[0] - trueCenter)).toBeLessThan(0.1);
  });

  it("improves RMSSD precision vs integer peaks (con filtfilt)", () => {
    // Señal sintética con RMSSD=50 ms. Con filtfilt zero-phase,
    // la interpolación parabólica debe acercarnos al target mejor
    // que el pico entero puro.
    const fs = 30;
    const rng = mulberry32(33);
    const { signal } = synthesize({
      durationSec: 120,
      hrBpm: 60,
      rmssdMs: 50,
      fs,
      noiseStd: 0.005,
      driftAmp: 0.01,
      rng,
    });
    const filtered = filtfilt(() => bandpassCascade(0.7, 4, fs), signal);
    const normalized = zscoreNormalize(filtered);
    const peaksInt = detectPeaks(normalized, fs);
    const peaksRefined = refinePeakPositions(normalized, peaksInt);

    const ibisInt = peaksToIbi(peaksInt, fs);
    const ibisRef = peaksToIbi(peaksRefined, fs);

    const { clean: cleanInt } = detectEctopic(validateIbis(ibisInt).valid);
    const { clean: cleanRef } = detectEctopic(validateIbis(ibisRef).valid);
    const rmssdInt = computeHrv(cleanInt)?.rmssd ?? 0;
    const rmssdRef = computeHrv(cleanRef)?.rmssd ?? 0;

    const errorInt = Math.abs(rmssdInt - 50);
    const errorRef = Math.abs(rmssdRef - 50);
    // El refinamiento parabólico debe reducir (o al menos no empeorar
    // significativamente) el error vs el pico entero.
    expect(errorRef).toBeLessThan(errorInt);
  });
});

/* ─────────────── FINGER PLACEMENT ─────────────── */

describe("capture: isFingerPlaced", () => {
  it("accepts red-dominant, non-clipping signal", () => {
    expect(isFingerPlaced({ r: 180, g: 30, b: 30, clipRate: 0.05 })).toBe(true);
  });

  it("rejects when red is too low (no flash reaching sensor)", () => {
    expect(isFingerPlaced({ r: 80, g: 50, b: 50, clipRate: 0 })).toBe(false);
  });

  it("rejects when RGB is balanced (ambient light, no finger)", () => {
    expect(isFingerPlaced({ r: 160, g: 150, b: 145, clipRate: 0 })).toBe(false);
  });

  it("rejects heavy clipping (flash too strong / dedo demasiado delgado)", () => {
    expect(isFingerPlaced({ r: 250, g: 20, b: 20, clipRate: 0.5 })).toBe(false);
  });

  it("does not block when metadata is missing", () => {
    expect(isFingerPlaced({})).toBe(true);
  });
});

/* ─────────────── DYNAMIC FS ─────────────── */

describe("analyzer: dynamic fs from timestamps", () => {
  it("measures fs correctly at nominal 30 Hz", () => {
    let lastUpdate = null;
    const an = createStreamingAnalyzer({
      fs: 30,
      windowSec: 60,
      updateMs: 0,
      onUpdate: (u) => (lastUpdate = u),
    });
    const dt = 1000 / 30; // exact 30 fps
    for (let i = 0; i < 100; i++) an.pushSample(100, i * dt, { r: 180, g: 30, b: 30, clipRate: 0 });
    expect(lastUpdate.fs).toBeGreaterThan(29.5);
    expect(lastUpdate.fs).toBeLessThan(30.5);
  });

  it("adapts when real frame rate is 20 Hz", () => {
    let lastUpdate = null;
    const an = createStreamingAnalyzer({
      fs: 30, // valor nominal INCORRECTO
      windowSec: 60,
      updateMs: 0,
      onUpdate: (u) => (lastUpdate = u),
    });
    const dt = 1000 / 20; // navegador throttlea a 20 fps
    for (let i = 0; i < 100; i++) an.pushSample(100, i * dt, { r: 180, g: 30, b: 30, clipRate: 0 });
    expect(lastUpdate.fs).toBeGreaterThan(19.5);
    expect(lastUpdate.fs).toBeLessThan(20.5);
  });

  it("tracks finger presence ratio", () => {
    let lastUpdate = null;
    const an = createStreamingAnalyzer({
      fs: 30,
      windowSec: 60,
      updateMs: 0,
      onUpdate: (u) => (lastUpdate = u),
    });
    const dt = 1000 / 30;
    // 60 samples sin dedo (red bajo, balanceado)
    for (let i = 0; i < 60; i++) an.pushSample(100, i * dt, { r: 80, g: 80, b: 80, clipRate: 0 });
    expect(lastUpdate.fingerOk).toBe(false);
    // Luego 60 samples CON dedo
    for (let i = 60; i < 120; i++) an.pushSample(180, i * dt, { r: 180, g: 30, b: 30, clipRate: 0 });
    expect(lastUpdate.fingerOk).toBe(true);
  });
});

describe("synth: determinism via mulberry32", () => {
  it("same seed → same output", () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);
    const a = synthesize({ durationSec: 10, hrBpm: 65, rmssdMs: 30, fs: 30, rng: rng1 });
    const b = synthesize({ durationSec: 10, hrBpm: 65, rmssdMs: 30, fs: 30, rng: rng2 });
    expect(a.signal).toEqual(b.signal);
    expect(a.trueIbis).toEqual(b.trueIbis);
  });

  it("different seed → different output", () => {
    const rng1 = mulberry32(1);
    const rng2 = mulberry32(2);
    const a = synthesize({ durationSec: 10, hrBpm: 65, rmssdMs: 30, fs: 30, rng: rng1 });
    const b = synthesize({ durationSec: 10, hrBpm: 65, rmssdMs: 30, fs: 30, rng: rng2 });
    expect(a.signal).not.toEqual(b.signal);
  });
});
