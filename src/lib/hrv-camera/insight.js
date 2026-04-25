/* ═══════════════════════════════════════════════════════════════
   HRV-CAMERA · Insight on the just-finished measurement
   ═══════════════════════════════════════════════════════════════
   Convierte un valor HRV crudo en una lectura comprensible:

     1) Delta vs baseline personal (lnRmssd) → magnitud del cambio
     2) Z-score → fuera/dentro de la variabilidad típica
     3) Intent recomendado (energia/enfoque/reset/calma) → qué
        protocolo del motor neural conviene
     4) Frase humana — el usuario no ve "RMSSD 42 ms" en el vacío,
        ve qué significa para ÉL hoy.

   Mínimo 5 entradas confiables previas para hablar de baseline; con
   menos retornamos null y la UI muestra solo el número.
   ═══════════════════════════════════════════════════════════════ */

import { zScore } from "../hrv";
import { isReliableHrvEntry as _isReliableHrvEntry, buildReliableHrvBaseline } from "../hrvLog";

const MIN_BASELINE = 5;

// Re-export para compat retro de imports actuales (insight.js era la
// fuente de verdad antes de centralizar en lib/hrvLog.js).
export const isReliableHrvEntry = _isReliableHrvEntry;

/**
 * @param {object} input
 * @param {number} input.currentLnRmssd  ln(RMSSD) de la medición que acaba de cerrar
 * @param {number[]} input.baseline14d   array de lnRmssd de las últimas 14d (excluye la actual)
 * @returns {{z, deltaPctRmssd, intent, label, comparison}|null}
 */
export function computeHrvInsight({ currentLnRmssd, baseline14d }) {
  if (!Number.isFinite(currentLnRmssd)) return null;
  if (!Array.isArray(baseline14d) || baseline14d.length < MIN_BASELINE) return null;

  const z = zScore(currentLnRmssd, baseline14d);
  if (z === null || !Number.isFinite(z)) return null;

  const mean = baseline14d.reduce((a, b) => a + b, 0) / baseline14d.length;
  // delta % en escala RMSSD (no ln). RMSSD = e^lnRmssd → ratio = e^(curr - mean).
  // (e^Δ − 1) × 100 da el cambio porcentual interpretable.
  const deltaPctRmssd = (Math.exp(currentLnRmssd - mean) - 1) * 100;

  let intent, label, comparison;
  if (z >= 1) {
    intent = "energia";
    label = "Sistema parasimpático elevado. Buena ventana para foco profundo o trabajo cognitivo exigente.";
    comparison = "above";
  } else if (z >= 0) {
    intent = "enfoque";
    label = "Estado equilibrado vs tu base. Listo para tu protocolo del día.";
    comparison = "near";
  } else if (z >= -1) {
    intent = "reset";
    label = "Tono parasimpático ligeramente bajo. Considera transición o calma antes de tareas exigentes.";
    comparison = "below";
  } else {
    intent = "calma";
    label = "Recuperación recomendada. Tu sistema está bajo carga; prioriza descanso parasimpático.";
    comparison = "well-below";
  }

  return {
    z: Math.round(z * 100) / 100,
    deltaPctRmssd: Math.round(deltaPctRmssd * 10) / 10,
    intent,
    label,
    comparison,
  };
}

/**
 * Construye baseline14d (array de lnRmssd) desde un hrvLog crudo.
 * Delegado a la fuente única en lib/hrvLog.js.
 */
export const buildHrvBaseline = buildReliableHrvBaseline;
