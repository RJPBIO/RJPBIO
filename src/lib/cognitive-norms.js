/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — COGNITIVE NORMATIVE DATA
   Reaction time · Sustained attention · Stroop
   ───────────────────────────────────────────────────────────────
   References:
   - Dinges DF, Powell JW (1985). Microcomputer analyses of
     performance on a portable, simple visual RT task during
     sustained operations. Behav Res Methods, 17(6):652-655.
   - Basner M, Dinges DF (2011). Maximizing sensitivity of the
     Psychomotor Vigilance Test (PVT). Sleep, 34(5):581-591.
   - Scarpina F, Tagini S (2017). The Stroop Color and Word Test.
     Frontiers in Psychology, 8:557.
   - Fjell AM, Walhovd KB (2010). Structural brain changes in aging:
     Courses, causes and cognitive consequences. Rev Neurosci, 21(3):187-221.
   ═══════════════════════════════════════════════════════════════ */

/**
 * PVT simple reaction time norms (milliseconds).
 * Source: Basner & Dinges 2011 normative cohort (N=74).
 * Values approximate age-adjusted means and standard deviations.
 */
const PVT_NORMS = [
  { minAge: 18, maxAge: 29, meanMs: 270, sdMs: 35 },
  { minAge: 30, maxAge: 39, meanMs: 285, sdMs: 38 },
  { minAge: 40, maxAge: 49, meanMs: 302, sdMs: 40 },
  { minAge: 50, maxAge: 59, meanMs: 320, sdMs: 45 },
  { minAge: 60, maxAge: 69, meanMs: 345, sdMs: 50 },
  { minAge: 70, maxAge: 99, meanMs: 370, sdMs: 55 },
];

/**
 * Stroop interference (difference between incongruent - congruent
 * condition), milliseconds. Golden 2002 standardization approx.
 */
const STROOP_NORMS = [
  { minAge: 18, maxAge: 29, meanMs: 120, sdMs: 40 },
  { minAge: 30, maxAge: 39, meanMs: 135, sdMs: 45 },
  { minAge: 40, maxAge: 49, meanMs: 155, sdMs: 50 },
  { minAge: 50, maxAge: 59, meanMs: 180, sdMs: 55 },
  { minAge: 60, maxAge: 69, meanMs: 210, sdMs: 60 },
  { minAge: 70, maxAge: 99, meanMs: 240, sdMs: 65 },
];

function findNorm(norms, age) {
  return norms.find((n) => age >= n.minAge && age <= n.maxAge) || norms[2];
}

/**
 * Convert reaction time in ms to percentile vs age norm.
 * Lower RT = higher percentile.
 */
export function pvtPercentile(rtMs, age = 35) {
  if (!rtMs || rtMs <= 0) return null;
  const norm = findNorm(PVT_NORMS, age);
  const z = (rtMs - norm.meanMs) / norm.sdMs;
  const invZ = -z;
  return zToPct(invZ);
}

export function stroopPercentile(interferenceMs, age = 35) {
  if (typeof interferenceMs !== "number") return null;
  const norm = findNorm(STROOP_NORMS, age);
  const z = (interferenceMs - norm.meanMs) / norm.sdMs;
  return zToPct(-z);
}

/**
 * Intra-individual variability (IIV) — coefficient of variation
 * of reaction times. More sensitive to fatigue than the mean alone
 * (MacDonald et al. 2009, Neurosci Biobehav Rev 33:557).
 */
export function iivScore(rts) {
  if (!Array.isArray(rts) || rts.length < 5) return null;
  const mean = rts.reduce((a, b) => a + b, 0) / rts.length;
  const variance = rts.reduce((a, b) => a + (b - mean) ** 2, 0) / (rts.length - 1);
  const sd = Math.sqrt(variance);
  return +((sd / mean) * 100).toFixed(1);
}

/**
 * PVT lapses (>500 ms) — hallmark of sleep debt.
 */
export function pvtLapses(rts) {
  if (!Array.isArray(rts)) return 0;
  return rts.filter((t) => t > 500).length;
}

/**
 * Give a realistic interpretation of a cognitive test result.
 */
export function interpretPVT({ meanRt, lapses, iiv, age = 35 }) {
  const pct = pvtPercentile(meanRt, age);
  if (pct === null) return { pct: null, label: "Datos insuficientes", concern: null };
  let label, concern = null;
  if (pct >= 75) label = "Rendimiento superior al promedio de tu grupo de edad";
  else if (pct >= 45) label = "Rendimiento dentro del rango normal";
  else if (pct >= 25) label = "Por debajo del promedio";
  else { label = "Bastante por debajo del promedio"; concern = "fatigue_or_illness"; }
  if (lapses >= 3) concern = "sleep_deprivation";
  if (iiv !== null && iiv > 20) concern = concern || "attentional_instability";
  return { pct, label, concern };
}

function zToPct(z) {
  const clamped = Math.max(-3, Math.min(3, z));
  const erf = (x) => {
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
    const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
  };
  return Math.round((0.5 * (1 + erf(clamped / Math.sqrt(2)))) * 100);
}
