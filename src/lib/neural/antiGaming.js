/* ═══════════════════════════════════════════════════════════════
   antiGaming v2 — detector multi-signal de gaming/scripting
   ═══════════════════════════════════════════════════════════════
   Sprint 45.

   Filosofía: signal fusion. En lugar de 3 reglas binarias (v1) que
   un usuario motivado puede burlar, aquí calculamos varios signals
   independientes y los combinamos en un score [0..100]:

     <30  = clean       (motor confía)
     30-59 = suspicious (motor reduce confianza pero no bloquea)
     ≥60  = likely-gaming (motor bloquea métricas, reduce vCores)

   Signals incluidos:
     A. Reaction time variance — CV fuera de banda humana
     B. Touch hold uniformity — variance ~0 = bot/instant taps
     C. Time-of-day distribution — entropía entrópicamente
        plausible para humano
     D. BioQ score distribution — varianza demasiado baja
     E. Session duration variance — bot completa exactamente lo mismo

   Cada signal retorna {score, evidence}. Composer suma scores y
   genera verdict + lista de evidencias para auditabilidad.

   IMPORTANTE: este detector es para señalar PATRONES sospechosos,
   NO para acusar al usuario. Output debe surface "needs review" no
   "user is cheating". Falsos positivos son costosos.
   ═══════════════════════════════════════════════════════════════ */

import { NEURAL_CONFIG as NC } from "./config";

/* ═══ Signal A: reaction time variance ═══ */
export function analyzeRTVariance(reactionTimes) {
  const cfg = NC.gamingV2.rt;
  if (!Array.isArray(reactionTimes) || reactionTimes.length < cfg.minSamples) {
    return { score: 0, status: "insufficient-data" };
  }
  const rts = reactionTimes.filter((x) => typeof x === "number" && x > 0);
  if (rts.length < cfg.minSamples) {
    return { score: 0, status: "insufficient-data" };
  }
  const mean = rts.reduce((a, b) => a + b, 0) / rts.length;
  if (mean === 0) return { score: 0, status: "insufficient-data" };
  const variance = rts.reduce((a, t) => a + (t - mean) * (t - mean), 0) / rts.length;
  const cv = Math.sqrt(variance) / mean;
  // Banda humana plausible: cv ∈ [humanCvMin, humanCvMax]
  if (cv >= cfg.humanCvMin && cv <= cfg.humanCvMax) {
    return { score: 0, status: "human-like", cv: +cv.toFixed(3) };
  }
  return {
    score: cfg.bothFlanksPenalty,
    status: cv < cfg.humanCvMin ? "robotic-low-cv" : "fake-high-cv",
    cv: +cv.toFixed(3),
    evidence: cv < cfg.humanCvMin
      ? `Reaction time variance demasiado baja (CV=${cv.toFixed(2)} < ${cfg.humanCvMin})`
      : `Reaction time variance demasiado alta (CV=${cv.toFixed(2)} > ${cfg.humanCvMax})`,
  };
}

/* ═══ Signal B: touch hold uniformity ═══ */
export function analyzeTouchHoldUniformity(holdDurations) {
  const cfg = NC.gamingV2.touchHold;
  if (!Array.isArray(holdDurations) || holdDurations.length < cfg.minSamples) {
    return { score: 0, status: "insufficient-data" };
  }
  const holds = holdDurations.filter((x) => typeof x === "number" && x >= 0);
  if (holds.length < cfg.minSamples) {
    return { score: 0, status: "insufficient-data" };
  }
  const mean = holds.reduce((a, b) => a + b, 0) / holds.length;
  const variance = holds.reduce((a, t) => a + (t - mean) * (t - mean), 0) / holds.length;
  if (variance <= cfg.uniformVarianceMax) {
    return {
      score: cfg.uniformPenalty,
      status: "uniform-holds",
      variance: +variance.toFixed(4),
      evidence: `Touch holds casi idénticos (var=${variance.toFixed(4)}s²) — patrón robótico`,
    };
  }
  return { score: 0, status: "varied", variance: +variance.toFixed(4) };
}

/* ═══ Signal C: time-of-day distribution (entropy) ═══ */
function shannonEntropy(buckets) {
  const total = buckets.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  let h = 0;
  for (const c of buckets) {
    if (c === 0) continue;
    const p = c / total;
    h -= p * Math.log(p);
  }
  return h;
}

export function analyzeTimeOfDayDistribution(history) {
  const cfg = NC.gamingV2.timeOfDay;
  if (!Array.isArray(history) || history.length < cfg.minSessions) {
    return { score: 0, status: "insufficient-data" };
  }
  const hours = history.map((h) => new Date(h.ts).getHours()).filter((x) => Number.isFinite(x));
  if (hours.length < cfg.minSessions) {
    return { score: 0, status: "insufficient-data" };
  }
  // 24-bucket histogram
  const buckets = Array(24).fill(0);
  for (const h of hours) buckets[h]++;
  const entropy = shannonEntropy(buckets);

  // Implausible hour count
  const implausible = hours.filter((h) => h >= cfg.implausibleHourStart && h < cfg.implausibleHourEnd).length;

  let score = 0;
  const evidence = [];
  if (entropy <= cfg.lowEntropyMax) {
    score += cfg.lowEntropyPenalty;
    evidence.push(`Todas las sesiones a casi la misma hora (entropy=${entropy.toFixed(2)} nats)`);
  } else if (entropy >= cfg.highEntropyMin) {
    score += cfg.highEntropyPenalty;
    evidence.push(`Distribución horaria demasiado uniforme (entropy=${entropy.toFixed(2)} nats)`);
  }
  if (implausible >= 3) {
    score += cfg.implausibleHourPenalty * Math.min(5, implausible);
    evidence.push(`${implausible} sesiones entre 02-04h (madrugada implausible)`);
  }
  return {
    score: Math.min(score, 35), // cap del signal
    status: score === 0 ? "human-like" : "anomaly",
    entropy: +entropy.toFixed(2),
    implausibleCount: implausible,
    ...(evidence.length ? { evidence: evidence.join("; ") } : {}),
  };
}

/* ═══ Signal D: bioQ distribution ═══ */
export function analyzeBioQDistribution(history) {
  const cfg = NC.gamingV2.bioQ;
  if (!Array.isArray(history) || history.length < cfg.minSamples) {
    return { score: 0, status: "insufficient-data" };
  }
  const scores = history.map((h) => h.bioQ).filter((x) => typeof x === "number");
  if (scores.length < cfg.minSamples) {
    return { score: 0, status: "insufficient-data" };
  }
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((a, s) => a + (s - mean) * (s - mean), 0) / scores.length;
  // Sospechoso: varianza ≤ lowVarianceMax (estable) Y mean < 50 (siempre baja).
  // Mean alta + low variance = usuario consistentemente bueno (NO sospechoso).
  if (variance <= cfg.lowVarianceMax && mean < 50) {
    return {
      score: cfg.lowVariancePenalty,
      status: "flat-low-quality",
      mean: +mean.toFixed(1),
      variance: +variance.toFixed(2),
      evidence: `BioQ variance baja (${variance.toFixed(0)}) con mean baja (${mean.toFixed(0)}) — patrón de baja participación sostenida`,
    };
  }
  return {
    score: 0,
    status: "natural-distribution",
    mean: +mean.toFixed(1),
    variance: +variance.toFixed(2),
  };
}

/* ═══ Signal E: session duration variance ═══ */
export function analyzeDurationUniformity(history) {
  const cfg = NC.gamingV2.duration;
  if (!Array.isArray(history) || history.length < cfg.minSamples) {
    return { score: 0, status: "insufficient-data" };
  }
  const durs = history.map((h) => h.dur).filter((x) => typeof x === "number" && x > 0);
  if (durs.length < cfg.minSamples) {
    return { score: 0, status: "insufficient-data" };
  }
  // Si todas las sesiones tienen exactamente la misma duración (var ≤ 9s²
  // ≈ ±3s), es robótico. Real users abandonan, hacen partial, etc.
  const mean = durs.reduce((a, b) => a + b, 0) / durs.length;
  const variance = durs.reduce((a, d) => a + (d - mean) * (d - mean), 0) / durs.length;
  if (variance <= cfg.uniformVarianceMax) {
    return {
      score: cfg.uniformPenalty,
      status: "uniform-duration",
      variance: +variance.toFixed(2),
      evidence: `Duración de sesiones idéntica (var=${variance.toFixed(1)}s²) — sin variación natural`,
    };
  }
  return { score: 0, status: "varied", variance: +variance.toFixed(2) };
}

/* ═══ Composer — combina signals en veredicto ═══ */
/**
 * Detector multi-signal de gaming. Combina hasta 5 signals independientes.
 * Compatible con el shape antiguo de detectGamingPattern (v1) — retorna
 * también {gaming, reason} para drop-in replacement.
 *
 * @param {object} state - state del store o subset con history + sessionData
 * @param {object} [extra] - {reactionTimes, touchHolds} si se conocen externamente
 * @returns {{score:number, verdict:string, signals:Array, gaming:boolean, reason:string}}
 */
export function detectGamingV2(state, extra = {}) {
  const cfg = NC.gamingV2;
  const hist = Array.isArray(state?.history) ? state.history : [];
  if (hist.length < cfg.minHistory) {
    return {
      score: 0, verdict: "insufficient-data", signals: [],
      gaming: false, reason: "",
    };
  }

  const last = hist.slice(-cfg.windowSize);

  // Extraer signals desde hist o extra
  const reactionTimes = Array.isArray(extra?.reactionTimes)
    ? extra.reactionTimes
    : last.flatMap((h) => Array.isArray(h.reactionTimes) ? h.reactionTimes : []);
  const touchHolds = Array.isArray(extra?.touchHolds)
    ? extra.touchHolds
    : last.flatMap((h) => Array.isArray(h.touchHolds) ? h.touchHolds : []);

  const a = analyzeRTVariance(reactionTimes);
  const b = analyzeTouchHoldUniformity(touchHolds);
  const c = analyzeTimeOfDayDistribution(last);
  const d = analyzeBioQDistribution(last);
  const e = analyzeDurationUniformity(last);

  const signals = [
    { name: "reactionTimes", ...a },
    { name: "touchHolds", ...b },
    { name: "timeOfDay", ...c },
    { name: "bioQ", ...d },
    { name: "duration", ...e },
  ];

  const score = Math.min(100,
    signals.reduce((acc, s) => acc + (typeof s.score === "number" ? s.score : 0), 0)
  );
  const verdict = score >= cfg.likelyScore ? "likely-gaming"
    : score >= cfg.suspiciousScore ? "suspicious"
    : "clean";

  // Backwards compat con detectGamingPattern (v1):
  // gaming: true cuando verdict es likely-gaming.
  // reason: composición de evidencias del signal con score más alto.
  const topEvidence = signals
    .filter((s) => s.score > 0 && s.evidence)
    .sort((a, b) => b.score - a.score)[0];

  return {
    score,
    verdict,
    signals,
    gaming: verdict === "likely-gaming",
    reason: topEvidence?.evidence || "",
  };
}
