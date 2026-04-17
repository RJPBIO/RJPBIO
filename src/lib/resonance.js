/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — RESONANCE FREQUENCY BREATHING
   Personal resonance frequency calibration (RFB)
   ───────────────────────────────────────────────────────────────
   Scientific basis:
   - Vaschillo EG, Vaschillo B, Lehrer PM (2006). Characteristics
     of resonance in heart rate variability stimulated by biofeedback.
     Appl Psychophysiol Biofeedback, 31(2):129-142.
   - Lehrer P, Gevirtz R (2014). Heart rate variability biofeedback:
     how and why does it work? Front Psychol, 5:756.
   - Steffen PR et al. (2017). The impact of resonance frequency
     breathing on measures of HRV, blood pressure, and mood.
     Front Public Health, 5:222.

   Protocol:
   Test 5 breathing rates (4.5, 5.0, 5.5, 6.0, 6.5 bpm) for ~2 min each.
   Measure HRV amplitude (peak-to-trough of the smoothed HR signal).
   The rate producing maximum amplitude = personal resonance frequency.
   Typical range: 4.5–7 bpm (most adults cluster 5.5–6.5).
   ═══════════════════════════════════════════════════════════════ */

export const RESONANCE_RATES = [
  { bpm: 4.5, inMs: 6000, exMs: 7333, label: "4.5 rpm" },
  { bpm: 5.0, inMs: 5500, exMs: 6500, label: "5.0 rpm" },
  { bpm: 5.5, inMs: 5000, exMs: 5909, label: "5.5 rpm" },
  { bpm: 6.0, inMs: 4500, exMs: 5500, label: "6.0 rpm" },
  { bpm: 6.5, inMs: 4200, exMs: 5031, label: "6.5 rpm" },
];

/**
 * Compute HRV amplitude from RR intervals during a rate trial.
 * Amplitude = (max - min) of a smoothed instantaneous HR series.
 * Uses 3-beat moving average to remove noise while preserving the
 * respiratory sinus arrhythmia waveform.
 * @param {number[]} rrMs
 * @returns {number} amplitude in BPM
 */
export function hrvAmplitude(rrMs) {
  if (!Array.isArray(rrMs) || rrMs.length < 20) return 0;
  const hrSeries = rrMs.map((r) => 60000 / r);
  const smoothed = [];
  for (let i = 1; i < hrSeries.length - 1; i++) {
    smoothed.push((hrSeries[i - 1] + hrSeries[i] + hrSeries[i + 1]) / 3);
  }
  if (smoothed.length === 0) return 0;
  const max = Math.max(...smoothed);
  const min = Math.min(...smoothed);
  return +(max - min).toFixed(1);
}

/**
 * Given trial results, pick the best rate (max amplitude).
 * @param {Array<{bpm: number, rrMs: number[]}>} trials
 */
export function pickResonanceRate(trials) {
  if (!Array.isArray(trials) || trials.length === 0) return null;
  const scored = trials.map((t) => ({
    bpm: t.bpm,
    amplitude: hrvAmplitude(t.rrMs),
    n: t.rrMs.length,
  }));
  const valid = scored.filter((s) => s.n >= 20);
  if (valid.length === 0) return null;
  valid.sort((a, b) => b.amplitude - a.amplitude);
  const best = valid[0];
  return {
    bpm: best.bpm,
    amplitude: best.amplitude,
    rankings: valid,
    confidence: valid.length >= 3 ? "high" : "medium",
  };
}

/**
 * Build breathing timing for a given rate (50% inhale / 50% exhale
 * with slight exhale bias improves vagal activation — Lin et al. 2014).
 */
export function timingsFor(bpm) {
  const cycleMs = 60000 / bpm;
  const inMs = Math.round(cycleMs * 0.45);
  const exMs = Math.round(cycleMs * 0.55);
  return { cycleMs: Math.round(cycleMs), inMs, exMs, inSec: +(inMs / 1000).toFixed(1), exSec: +(exMs / 1000).toFixed(1) };
}

/**
 * Total cycles needed for a standard 20-min resonance session
 * (published dose-response for vagal tone adaptation; Steffen 2017).
 */
export function sessionPlan(bpm, minutes = 20) {
  const { cycleMs } = timingsFor(bpm);
  const cycles = Math.round((minutes * 60000) / cycleMs);
  return { bpm, minutes, cycles, cycleMs };
}
