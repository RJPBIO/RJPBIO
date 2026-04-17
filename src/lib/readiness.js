/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — READINESS SCORE ENGINE
   Personal baseline · Z-scores · No hard-coded claims
   ───────────────────────────────────────────────────────────────
   Methodology:
   A daily composite score [0-100] computed ONLY against the user's
   own rolling baseline (≥14 days). No population norms, no borrowed
   Oura/WHOOP secrets. Every component is transparent.

   Components (weighted):
     • HRV (z-score of lnRMSSD vs 14d baseline)        40%
     • Resting HR (z-score, inverted — lower is better) 20%
     • Sleep duration (hours vs personal target)        20%
     • Subjective recovery (1-5 scale last log)         10%
     • Prior 24h training load (session count)          10%

   References:
   - Plews DJ et al. (2013). Training adaptation and HRV in elite
     endurance athletes. Eur J Appl Physiol, 113(3):851-865.
   - Buchheit M (2014). Monitoring training status with HR measures.
     Front Physiol, 5:73.
   ═══════════════════════════════════════════════════════════════ */

import { zScore, lnRmssd, rmssd } from "./hrv";

const BASELINE_DAYS = 14;
const MIN_BASELINE = 7;

/**
 * Build a rolling baseline of a metric from history.
 * Expects entries shaped { ts, value }.
 */
function rollingBaseline(history, key, days = BASELINE_DAYS) {
  if (!Array.isArray(history)) return [];
  const cutoff = Date.now() - days * 86400000;
  return history
    .filter((h) => h.ts >= cutoff && typeof h[key] === "number")
    .map((h) => h[key]);
}

/**
 * Normalize a z-score to 0-100 via cumulative normal distribution
 * approximation (error function). Z of +1 ≈ 84, z of -1 ≈ 16.
 */
function zToPct(z) {
  if (z === null || z === undefined || isNaN(z)) return 50;
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

/**
 * Subjective recovery score from mood+energy logs (last 12h).
 * @returns {number|null} 0-100 or null if no data
 */
function subjectiveScore(moodLog) {
  if (!Array.isArray(moodLog) || moodLog.length === 0) return null;
  const cutoff = Date.now() - 12 * 3600000;
  const recent = moodLog.filter((m) => m.ts >= cutoff);
  if (recent.length === 0) return null;
  const last = recent[recent.length - 1];
  const mood = Math.max(1, Math.min(5, last.mood || 3));
  const energy = Math.max(1, Math.min(3, last.energy || 2));
  return Math.round(((mood - 1) / 4) * 70 + ((energy - 1) / 2) * 30);
}

/**
 * Prior 24h training load penalty. >4 sessions → penalty; 1-2 → neutral;
 * 0 or >2d gap → slight positive.
 */
function loadScore(sessionHistory) {
  if (!Array.isArray(sessionHistory) || sessionHistory.length === 0) return 60;
  const cutoff24 = Date.now() - 86400000;
  const cutoff48 = Date.now() - 2 * 86400000;
  const n24 = sessionHistory.filter((h) => h.ts >= cutoff24).length;
  const hasRecent = sessionHistory.some((h) => h.ts >= cutoff48);
  if (n24 === 0 && hasRecent) return 75;
  if (n24 === 0) return 55;
  if (n24 <= 2) return 70;
  if (n24 <= 4) return 55;
  return 35;
}

/**
 * Compute readiness score.
 * @param {object} input
 *   - hrvHistory: [{ ts, lnRmssd }] rolling HRV recordings
 *   - rhrHistory: [{ ts, rhr }]
 *   - sleepHours: number last-night sleep (or null)
 *   - sleepTarget: number (default 7.5)
 *   - moodLog: mood entries
 *   - sessions: session history
 *   - currentHRV: { lnRmssd, rhr } today's measurement (optional)
 */
export function calcReadiness({
  hrvHistory = [],
  rhrHistory = [],
  sleepHours = null,
  sleepTarget = 7.5,
  moodLog = [],
  sessions = [],
  currentHRV = null,
}) {
  const hrvBaseline = rollingBaseline(hrvHistory, "lnRmssd");
  const rhrBaseline = rollingBaseline(rhrHistory, "rhr");

  const hrvAvailable = hrvBaseline.length >= MIN_BASELINE && currentHRV?.lnRmssd;
  const rhrAvailable = rhrBaseline.length >= MIN_BASELINE && typeof currentHRV?.rhr === "number";
  const sleepAvailable = typeof sleepHours === "number" && sleepHours > 0;

  const components = {};
  let totalWeight = 0;
  let weightedSum = 0;

  if (hrvAvailable) {
    const z = zScore(currentHRV.lnRmssd, hrvBaseline);
    const pct = zToPct(z);
    components.hrv = { score: pct, z, weight: 0.4 };
    weightedSum += pct * 0.4;
    totalWeight += 0.4;
  }

  if (rhrAvailable) {
    const z = zScore(currentHRV.rhr, rhrBaseline);
    const pct = zToPct(-z);
    components.rhr = { score: pct, z, weight: 0.2 };
    weightedSum += pct * 0.2;
    totalWeight += 0.2;
  }

  if (sleepAvailable) {
    const deficit = Math.max(0, sleepTarget - sleepHours);
    const excess = Math.max(0, sleepHours - (sleepTarget + 2));
    const pct = Math.max(0, Math.min(100, 100 - deficit * 12 - excess * 8));
    components.sleep = { score: Math.round(pct), hours: sleepHours, target: sleepTarget, weight: 0.2 };
    weightedSum += pct * 0.2;
    totalWeight += 0.2;
  }

  const subj = subjectiveScore(moodLog);
  if (subj !== null) {
    components.subjective = { score: subj, weight: 0.1 };
    weightedSum += subj * 0.1;
    totalWeight += 0.1;
  }

  const hasPrimary = hrvAvailable || rhrAvailable || sleepAvailable || subj !== null;
  if (!hasPrimary) {
    return { score: null, insufficient: true, components, baselineDays: 0 };
  }

  if (Array.isArray(sessions) && sessions.length > 0) {
    const load = loadScore(sessions);
    components.load = { score: load, weight: 0.1 };
    weightedSum += load * 0.1;
    totalWeight += 0.1;
  }

  const score = Math.round(weightedSum / totalWeight);
  const baselineDays = Math.max(hrvBaseline.length, rhrBaseline.length);

  return {
    score,
    insufficient: baselineDays < MIN_BASELINE && !sleepAvailable && subj === null,
    components,
    baselineDays,
    interpretation: interpret(score),
    recommendation: recommend(score, components),
  };
}

function interpret(score) {
  if (score >= 80) return "primed";
  if (score >= 65) return "ready";
  if (score >= 45) return "caution";
  return "recover";
}

function recommend(score, components) {
  if (score >= 80) return { intent: "energia", reason: "Recursos elevados. Aprovecha para trabajo cognitivo exigente." };
  if (score >= 65) return { intent: "enfoque", reason: "Estado estable. Foco sostenido es viable." };
  if (score >= 45) {
    if (components.subjective?.score < 40) return { intent: "calma", reason: "Descarga parasimpática antes de tareas exigentes." };
    return { intent: "reset", reason: "Transición recomendada, no acumules carga." };
  }
  return { intent: "calma", reason: "Prioriza recuperación. Evita estímulos intensos." };
}
