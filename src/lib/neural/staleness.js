/* ═══════════════════════════════════════════════════════════════
   staleness — detección de patrones obsoletos + recalibration UX
   ═══════════════════════════════════════════════════════════════
   Sprint 42: cuando un usuario vuelve después de un gap significativo,
   el motor:

   1. Detecta el gap (detectStaleness)
   2. Reduce confianza en datos personales (dataConfidenceMultiplier)
   3. Reactiva cold-start prior con peso parcial
   4. Genera copy de recalibración para la UX (recalibrationGuidance)

   Filosofía: NO borrar datos viejos. Solo bajar su peso. Si el usuario
   regresa con patrones similares, los datos viejos siguen siendo útiles
   y rápidamente recuperan peso al acumular sesiones nuevas.

   Backbones:
   - Lima 2018 retornos a programas de wellness — los patrones
     conductuales se reformulan en 2-4 semanas, no instantáneo
   - Wood & Rünger 2016 habit theory — gaps >21 días desestabilizan
     hábitos consolidados
   ═══════════════════════════════════════════════════════════════ */

import { NEURAL_CONFIG as NC } from "./config";

const HOUR_MS = 3600000;
const DAY_MS = 24 * HOUR_MS;

/**
 * Detecta el nivel de staleness del state del usuario.
 *
 * @param {object} state - state del store ({history, moodLog, ...})
 * @param {object} [options]
 * @param {Date} [options.now] - timestamp de evaluación (default: now)
 * @returns {StalenessReport}
 */
export function detectStaleness(state, options = {}) {
  const now = options.now ?? new Date();
  const hist = Array.isArray(state?.history) ? state.history : [];
  const ml = Array.isArray(state?.moodLog) ? state.moodLog : [];

  // Sin historial → "no-data" (no es staleness, es cold-start puro).
  if (hist.length === 0) {
    return {
      level: "no-data",
      daysSinceLast: null,
      dataConfidence: 1.0,    // sin datos, no hay nada que descontar
      recalibrate: false,
      lastSessionTs: null,
    };
  }

  const lastTs = hist[hist.length - 1]?.ts;
  if (typeof lastTs !== "number") {
    return {
      level: "no-data", daysSinceLast: null, dataConfidence: 1.0,
      recalibrate: false, lastSessionTs: null,
    };
  }

  const daysSince = Math.max(0, Math.floor((now.getTime() - lastTs) / DAY_MS));
  const window = NC.staleness.windows.find((w) => daysSince <= w.maxDays);

  // Para señalar drift potencial: si mood log también es viejo, mayor riesgo
  // de que las preferencias hayan cambiado.
  const lastMoodTs = ml[ml.length - 1]?.ts;
  const daysSinceMood = typeof lastMoodTs === "number"
    ? Math.max(0, Math.floor((now.getTime() - lastMoodTs) / DAY_MS))
    : daysSince;

  return {
    level: window.level,
    daysSinceLast: daysSince,
    daysSinceMoodLog: daysSinceMood,
    dataConfidence: window.dataConfidence,
    recalibrate: window.recalibrate,
    lastSessionTs: lastTs,
  };
}

/**
 * Calcula el peso de una muestra individual basado en su antigüedad.
 * Decay exponencial con half-life configurable. Floor mínimo evita
 * olvido completo.
 *
 * Útil para `calcProtoSensitivity` con peso por antigüedad: una
 * muestra de hace 21 días vale 50% que una de hoy. Una de hace 60d
 * vale ~16% pero nunca menos de decayMinWeight (0.10).
 *
 * @param {number} sampleTs - timestamp de la muestra (ms)
 * @param {number} [nowMs] - referencia de "ahora"
 * @returns {number} peso ∈ [decayMinWeight, 1]
 */
export function sampleAgeWeight(sampleTs, nowMs = Date.now()) {
  if (typeof sampleTs !== "number" || !Number.isFinite(sampleTs)) return 1;
  const days = Math.max(0, (nowMs - sampleTs) / DAY_MS);
  const halfLife = NC.staleness.decayHalfLifeDays;
  // Exponential decay: w(d) = 0.5 ^ (d / half_life)
  const w = Math.pow(0.5, days / halfLife);
  return Math.max(NC.staleness.decayMinWeight, Math.min(1, w));
}

/**
 * Aplica decay por antigüedad a un set de deltas con timestamp.
 * Útil para calcular sensitivity ponderada cuando hay staleness.
 *
 * @param {Array<{delta:number, ts:number}>} samples
 * @param {number} [nowMs]
 * @returns {{weightedMean:number, totalWeight:number}}
 */
export function weightedAvg(samples, nowMs = Date.now()) {
  if (!Array.isArray(samples) || samples.length === 0) {
    return { weightedMean: 0, totalWeight: 0 };
  }
  let num = 0, den = 0;
  for (const s of samples) {
    const w = sampleAgeWeight(s.ts, nowMs);
    num += s.delta * w;
    den += w;
  }
  if (den === 0) return { weightedMean: 0, totalWeight: 0 };
  return { weightedMean: num / den, totalWeight: den };
}

/**
 * Genera copy de UX para recalibración. Usado cuando recalibrate ≠ false.
 *
 * @param {StalenessReport} staleness
 * @param {object} [options]
 * @param {Date} [options.now] - para sugerir intent por hora del día
 * @returns {RecalibrationGuidance|null}
 */
export function recalibrationGuidance(staleness, options = {}) {
  if (!staleness || !staleness.recalibrate) return null;
  const now = options.now ?? new Date();
  const h = now.getHours();
  const days = staleness.daysSinceLast;
  const isHard = staleness.recalibrate === "hard";

  // Sugerir intent seguro según hora — calma o reset son siempre seguros.
  // Mañana: reset. Tarde: calma. Madrugada/noche: calma.
  const suggestedIntent = h >= 9 && h < 16 ? "reset" : "calma";

  return {
    severity: isHard ? "hard" : "soft",
    title: isHard
      ? `${days} días de pausa`
      : "Bienvenido de vuelta",
    body: isHard
      ? `Han pasado ${days} días desde tu última sesión. Tus patrones pueden haber cambiado — comencemos con una sesión corta para recalibrar el motor.`
      : `Han pasado ${days} días. Una sesión corta nos ayuda a confirmar que tus protocolos siguen siendo los más efectivos.`,
    cta: isHard ? "Recalibrar ahora" : "Continuar con sesión",
    suggestedIntent,
    // Hint para el caller: cuánto pesar datos viejos en este reentry.
    dataConfidence: staleness.dataConfidence,
  };
}

/**
 * @typedef {object} StalenessReport
 * @property {"no-data"|"fresh"|"active"|"cooling"|"stale"|"abandoned"} level
 * @property {number|null} daysSinceLast - días desde última sesión
 * @property {number} dataConfidence - 0..1, multiplicador para datos personales
 * @property {false|"soft"|"hard"} recalibrate - si UX debe ofrecer recalibración
 * @property {number|null} lastSessionTs
 */

/**
 * @typedef {object} RecalibrationGuidance
 * @property {"soft"|"hard"} severity
 * @property {string} title
 * @property {string} body
 * @property {string} cta
 * @property {"calma"|"reset"|"energia"|"enfoque"} suggestedIntent
 * @property {number} dataConfidence
 */
