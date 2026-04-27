/* ═══════════════════════════════════════════════════════════════
   coldStart — priors bayesianos para usuarios nuevos (Sprint 41)
   ═══════════════════════════════════════════════════════════════
   Antes del Sprint 41, las primeras 0–5 sesiones recibían
   `predictedDelta: 0.8` (constante global). Ahora reciben una
   recomendación condicionada a:

   - intent del protocolo (calma/reset/energia/enfoque)
   - hora subjetiva (offset por chronotype si está disponible)
   - bucket de 3h del día

   Los valores baseline derivan de literatura cronobiología (Cajochen
   2007 review of human circadian, Roenneberg & Merrow 2007 social
   jetlag, Schmidt et al 2007 cognitive performance and chronotype):

   - Activación cognitiva (energia/enfoque) tiene ventana 9–13h subj
     y secundaria 14–17h, débil en madrugada/noche
   - Recuperación (calma/reset) tiene ventana 18–23h subj, débil en
     mañana
   - Reset peak 13–16h (post-prandial dip)

   Estos NO son entrenamientos sobre data real de usuarios. Son priors
   informados por evidencia poblacional. Para retraining cohort-specific
   en futuros sprints, este módulo es el punto de extensión.
   ═══════════════════════════════════════════════════════════════ */

import { subjectiveHour } from "./chronoCircadian";

const FREEZE = (x) => Object.freeze(x);

/**
 * Delta esperado por intent en cada bucket de 3h (hora SUBJETIVA).
 * Bucket = floor(h/3), 0..7 cubre 24h. Valores en escala mood-delta:
 * +1.0 ≈ "una unidad de mood", típico de un protocolo bien aplicado.
 *
 * Indexed por bucket → intent → delta.
 */
export const BASELINE_BY_BUCKET = FREEZE({
  0: FREEZE({ calma: 0.5, reset: 0.3, energia: 0.2, enfoque: 0.1 }), // 00–03 madrugada
  1: FREEZE({ calma: 0.4, reset: 0.3, energia: 0.5, enfoque: 0.3 }), // 03–06
  2: FREEZE({ calma: 0.4, reset: 0.3, energia: 0.9, enfoque: 0.7 }), // 06–09 amanecer
  3: FREEZE({ calma: 0.5, reset: 0.4, energia: 1.1, enfoque: 1.2 }), // 09–12 pico cognitivo
  4: FREEZE({ calma: 0.6, reset: 0.7, energia: 0.9, enfoque: 1.1 }), // 12–15 mediodía
  5: FREEZE({ calma: 0.7, reset: 0.9, energia: 0.6, enfoque: 0.8 }), // 15–18 post-prandial
  6: FREEZE({ calma: 1.0, reset: 0.7, energia: 0.3, enfoque: 0.4 }), // 18–21 anochecer
  7: FREEZE({ calma: 1.2, reset: 0.5, energia: 0.1, enfoque: 0.2 }), // 21–24 noche
});

/**
 * Cuánto pesa el prior vs los datos personales. Decae linealmente
 * con sesiones acumuladas. A las 0 sesiones el prior es 100% del
 * input; a las 5+ ya pesan los datos personales.
 */
export function priorWeight(sessionsCount = 0) {
  const w = 1 - (sessionsCount || 0) / 5;
  return Math.max(0, Math.min(1, w));
}

/**
 * Devuelve el prior bayesiano para una sesión dada.
 *
 * @param {object} args
 * @param {object|null} [args.chronotype] - resultado MEQ-SA o null
 * @param {string}      args.intent       - "calma"|"reset"|"energia"|"enfoque"
 * @param {Date}        [args.now]        - timestamp de evaluación
 * @param {number}      [args.sessionsCount] - sesiones acumuladas para weighting
 * @returns {{delta:number, weight:number, bucket:number, subjectiveHour:number}}
 */
export function getColdStartPrior({ chronotype = null, intent, now = new Date(), sessionsCount = 0 }) {
  const sh = chronotype
    ? subjectiveHour(chronotype, now)
    : now.getHours() + now.getMinutes() / 60;
  const bucket = Math.max(0, Math.min(7, Math.floor(sh / 3)));
  const intentMap = BASELINE_BY_BUCKET[bucket] || BASELINE_BY_BUCKET[0];
  const delta = typeof intentMap[intent] === "number" ? intentMap[intent] : 0.5;
  return {
    delta,
    weight: priorWeight(sessionsCount),
    bucket,
    subjectiveHour: +sh.toFixed(2),
  };
}

/**
 * Para uso en adaptiveProtocolEngine: convierte un prior delta en un
 * pequeño score adjustment. Cap suave para que no domine sobre datos
 * reales (max ±6 puntos en el scoring de candidatos).
 */
export function priorBonus(prior) {
  if (!prior || typeof prior.delta !== "number") return 0;
  // delta típico ∈ [0.1, 1.2]. Convertimos a [-2, +6] linealmente
  // y multiplicamos por weight (decae con sesiones).
  const raw = (prior.delta - 0.5) * 8; // 0.5 → 0, 1.2 → +5.6, 0.1 → -3.2
  return +(raw * prior.weight).toFixed(2);
}

/**
 * Helper para predictSessionImpact: dado el prior, construye el shape
 * que el engine devuelve cuando no hay datos personales pero hay prior.
 *
 * @param {object} prior - resultado de getColdStartPrior
 * @param {string} basisLabel - texto descriptivo del basis
 */
export function priorPredictionShape(prior, basisLabel = "prior cronobiológico") {
  const halfWidth = 1.2; // ligeramente más estrecho que el fallback fijo
  return {
    predictedDelta: +prior.delta.toFixed(1),
    lower: +(prior.delta - halfWidth).toFixed(2),
    upper: +(prior.delta + halfWidth).toFixed(2),
    confidence: 30, // entre cold-start (20) y cross-protocol (30+)
    sampleSize: 0,
    basis: basisLabel,
    priorBucket: prior.bucket,
    priorWeight: prior.weight,
    message: prior.delta > 0
      ? `+${prior.delta.toFixed(1)} esperado por hora ${prior.subjectiveHour.toFixed(0)}h y tipo de protocolo`
      : "Hora subóptima para este protocolo según patrones cronobiológicos",
  };
}
