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

const MIN_BASELINE = 5;

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
 * Determina si una entrada HRV es confiable para alimentar el baseline.
 * Re-export desde useReadiness para reuso fuera del hook.
 * Reglas: BLE (sin source o sin sqi) confiable; cámara solo si SQI ≥ 60.
 */
export function isReliableHrvEntry(h) {
  if (!h || typeof h.lnRmssd !== "number") return false;
  if (h.source === "camera") {
    const sqi = typeof h.sqi === "number" ? h.sqi : null;
    if (sqi === null) return false;
    return sqi >= 60;
  }
  return true;
}

/**
 * Construye baseline14d (array de lnRmssd) desde un hrvLog crudo.
 * Filtra confiabilidad y rango temporal.
 */
export function buildHrvBaseline(hrvLog, days = 14) {
  if (!Array.isArray(hrvLog)) return [];
  const cutoff = Date.now() - days * 86400000;
  return hrvLog
    .filter((h) => h && h.ts >= cutoff && isReliableHrvEntry({ ...h, lnRmssd: h.lnRmssd ?? h.lnrmssd }))
    .map((h) => h.lnRmssd ?? h.lnrmssd)
    .filter((v) => Number.isFinite(v));
}
