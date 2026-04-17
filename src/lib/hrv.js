/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — HRV CALCULATION ENGINE
   Heart Rate Variability · Time-domain & frequency-domain metrics
   ───────────────────────────────────────────────────────────────
   References:
   - Task Force of the European Society of Cardiology and the North
     American Society of Pacing and Electrophysiology (1996).
     Heart rate variability: standards of measurement, physiological
     interpretation, and clinical use. Circulation, 93(5), 1043-1065.
   - Shaffer F, Ginsberg JP (2017). An Overview of Heart Rate
     Variability Metrics and Norms. Frontiers in Public Health, 5:258.
   - Laborde S, Mosley E, Thayer JF (2017). Heart Rate Variability
     and Cardiac Vagal Tone in Psychophysiological Research.
     Frontiers in Psychology, 8:213.
   ═══════════════════════════════════════════════════════════════ */

/**
 * Sanitize RR intervals (ms). Removes ectopic beats and artifacts
 * using the Malik (20%) rule: reject any interval that differs by
 * more than 20% from its neighbor.
 * @param {number[]} rrMs - raw RR intervals in ms
 * @returns {number[]} cleaned intervals
 */
export function cleanRR(rrMs) {
  if (!Array.isArray(rrMs) || rrMs.length < 2) return [];
  const clean = [];
  for (let i = 0; i < rrMs.length; i++) {
    const r = rrMs[i];
    if (typeof r !== "number" || !isFinite(r) || r < 300 || r > 2000) continue;
    if (clean.length === 0) { clean.push(r); continue; }
    const prev = clean[clean.length - 1];
    if (Math.abs(r - prev) / prev > 0.20) continue;
    clean.push(r);
  }
  return clean;
}

/**
 * RMSSD — Root Mean Square of Successive Differences.
 * Primary time-domain metric of parasympathetic (vagal) activity.
 * Reference range (Shaffer & Ginsberg 2017, Table 3): 19-75 ms for
 * healthy adults on 5-min resting recordings. Lower values indicate
 * reduced vagal tone / accumulated stress load.
 * @param {number[]} rrMs
 * @returns {number} RMSSD in ms (0 if insufficient data)
 */
export function rmssd(rrMs) {
  const rr = cleanRR(rrMs);
  if (rr.length < 2) return 0;
  let sumSq = 0;
  for (let i = 1; i < rr.length; i++) {
    const d = rr[i] - rr[i - 1];
    sumSq += d * d;
  }
  return Math.sqrt(sumSq / (rr.length - 1));
}

/**
 * SDNN — Standard deviation of NN intervals.
 * Reflects total HRV (sympathetic + parasympathetic).
 * Reference 5-min (Shaffer & Ginsberg 2017): 32-93 ms.
 */
export function sdnn(rrMs) {
  const rr = cleanRR(rrMs);
  if (rr.length < 2) return 0;
  const mean = rr.reduce((a, b) => a + b, 0) / rr.length;
  const varSum = rr.reduce((a, b) => a + (b - mean) * (b - mean), 0);
  return Math.sqrt(varSum / (rr.length - 1));
}

/**
 * pNN50 — % of successive intervals differing by >50 ms.
 * Strongly correlates with RMSSD; vagal activity index.
 */
export function pnn50(rrMs) {
  const rr = cleanRR(rrMs);
  if (rr.length < 2) return 0;
  let count = 0;
  for (let i = 1; i < rr.length; i++) {
    if (Math.abs(rr[i] - rr[i - 1]) > 50) count++;
  }
  return (count / (rr.length - 1)) * 100;
}

/**
 * Mean heart rate (BPM) from RR.
 */
export function meanHR(rrMs) {
  const rr = cleanRR(rrMs);
  if (rr.length === 0) return 0;
  const mean = rr.reduce((a, b) => a + b, 0) / rr.length;
  return 60000 / mean;
}

/**
 * ln(RMSSD) — commonly used for statistical normality.
 * Oura, WHOOP and most research report this form.
 */
export function lnRmssd(rrMs) {
  const r = rmssd(rrMs);
  return r > 0 ? Math.log(r) : 0;
}

/**
 * Coherence-approximation: % of RR samples within ±10% of mean.
 * Proxy for the Heart-Rate-Variability coherence concept
 * (McCraty et al. 2009). NOT a substitute for true spectral coherence
 * which requires FFT on ≥2 min of data.
 */
export function coherenceProxy(rrMs) {
  const rr = cleanRR(rrMs);
  if (rr.length < 10) return 0;
  const mean = rr.reduce((a, b) => a + b, 0) / rr.length;
  let inRange = 0;
  for (const r of rr) if (Math.abs(r - mean) / mean <= 0.10) inRange++;
  return (inRange / rr.length) * 100;
}

/**
 * Full HRV summary from a recording.
 * @param {number[]} rrMs
 * @returns {{rmssd, sdnn, pnn50, meanHR, lnRmssd, n, durationSec, valid}}
 */
export function hrvSummary(rrMs) {
  const rr = cleanRR(rrMs);
  const durationSec = rr.reduce((a, b) => a + b, 0) / 1000;
  const valid = rr.length >= 30 && durationSec >= 60;
  return {
    rmssd: +rmssd(rr).toFixed(1),
    sdnn: +sdnn(rr).toFixed(1),
    pnn50: +pnn50(rr).toFixed(1),
    meanHR: +meanHR(rr).toFixed(1),
    lnRmssd: +lnRmssd(rr).toFixed(2),
    n: rr.length,
    durationSec: +durationSec.toFixed(1),
    valid,
  };
}

/**
 * Compute percentile of a value against personal history.
 * Uses simple empirical CDF — robust with small N.
 */
export function personalPercentile(value, history) {
  if (!Array.isArray(history) || history.length < 3) return null;
  const sorted = [...history].sort((a, b) => a - b);
  let below = 0;
  for (const v of sorted) if (v < value) below++;
  return Math.round((below / sorted.length) * 100);
}

/**
 * Z-score vs personal baseline. Requires ≥7 historical values
 * to be meaningful (rolling baseline).
 */
export function zScore(value, history) {
  if (!Array.isArray(history) || history.length < 7) return null;
  const mean = history.reduce((a, b) => a + b, 0) / history.length;
  const variance = history.reduce((a, b) => a + (b - mean) ** 2, 0) / (history.length - 1);
  const sd = Math.sqrt(variance);
  if (sd === 0) return 0;
  return +((value - mean) / sd).toFixed(2);
}

/**
 * Minimum Detectable Change (MDC95) for a metric.
 * MDC = SEM * 1.96 * sqrt(2), where SEM = SD * sqrt(1 - ICC).
 * Conservative estimate using SD alone: returns 1.96 * SD / sqrt(N).
 * Values changes below MDC should not be reported to users as meaningful.
 */
export function mdc95(history) {
  if (!Array.isArray(history) || history.length < 7) return null;
  const mean = history.reduce((a, b) => a + b, 0) / history.length;
  const variance = history.reduce((a, b) => a + (b - mean) ** 2, 0) / (history.length - 1);
  const sd = Math.sqrt(variance);
  return +(1.96 * sd / Math.sqrt(history.length)).toFixed(2);
}

/**
 * Classify delta vs baseline as meaningful / noise.
 * Returns one of: "elevated", "suppressed", "normal", "insufficient".
 */
export function classifyDelta(value, history) {
  const z = zScore(value, history);
  if (z === null) return "insufficient";
  if (z >= 1) return "elevated";
  if (z <= -1) return "suppressed";
  return "normal";
}
