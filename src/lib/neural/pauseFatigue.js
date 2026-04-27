/* ═══════════════════════════════════════════════════════════════
   pauseFatigue — detección de fatiga por abandono/pausas
   ═══════════════════════════════════════════════════════════════
   Sprint 50.

   Cuando el usuario empieza a:
     - Abandonar sesiones (quality="ligera", partial=true)
     - Pausar frecuentemente durante la sesión
     - Pasar tiempo en background (hiddenSec alto)

   ...es señal de fatiga acumulada, dificultad excesiva, o mismatch
   protocolo-contexto. El motor debe reducir exigencia y biasing hacia
   protocolos de regulación (calma, reset).

   Diseño:
     - 3 sub-signals: partial ratio, avg pauses, hidden time ratio
     - Compose en level: none | mild | severe
     - severe → fuerza primaryNeed; mild → penalty a scoring de dif alta
     - none → no-op (motor opera normalmente)

   Pure function. No depende de DB ni de side effects.
   ═══════════════════════════════════════════════════════════════ */

import { NEURAL_CONFIG as NC } from "./config";

/**
 * Detecta nivel de fatiga del usuario en su ventana reciente.
 *
 * @param {Array<HistoryEntry>} history - history del state (slice -200)
 * @returns {FatigueReport}
 */
export function detectPauseFatigue(history) {
  const cfg = NC.pauseFatigue;
  if (!Array.isArray(history) || history.length < cfg.minHistory) {
    return {
      level: "none",
      reason: "insufficient-data",
      partialRatio: 0,
      avgPauses: 0,
      avgHiddenRatio: 0,
      sampleSize: history?.length || 0,
      signals: [],
    };
  }

  const window = history.slice(-cfg.windowSize);
  const n = window.length;

  // Sub-signal 1: partial ratio (quality="ligera" o flag partial=true)
  const partialCount = window.filter(
    (h) => h?.partial === true || h?.quality === "ligera"
  ).length;
  const partialRatio = partialCount / n;

  // Sub-signal 2: avg pauses per session
  const totalPauses = window.reduce((sum, h) => sum + (h?.pauses || 0), 0);
  const avgPauses = totalPauses / n;

  // Sub-signal 3: avg hidden time ratio (hiddenSec / dur)
  const hiddenRatios = window
    .map((h) => {
      const dur = h?.dur || 0;
      const hidden = h?.hiddenSec || 0;
      return dur > 0 ? hidden / dur : 0;
    })
    .filter((r) => Number.isFinite(r));
  const avgHiddenRatio = hiddenRatios.length
    ? hiddenRatios.reduce((a, b) => a + b, 0) / hiddenRatios.length
    : 0;

  // Cada sub-signal contribuye a un level. Tomamos el máximo.
  const partialLevel = partialRatio >= cfg.severePartialRatio ? "severe"
    : partialRatio >= cfg.mildPartialRatio ? "mild"
    : "none";
  const pausesLevel = avgPauses >= cfg.avgPausesSevere ? "severe"
    : avgPauses >= cfg.avgPausesMild ? "mild"
    : "none";
  const hiddenLevel = avgHiddenRatio >= cfg.hiddenRatioSevere ? "severe"
    : avgHiddenRatio >= cfg.hiddenRatioMild ? "mild"
    : "none";

  // Promote level: si CUALQUIERA está severe, level=severe; si dos están
  // mild, level=mild; si solo uno está mild, level=mild también.
  const levels = [partialLevel, pausesLevel, hiddenLevel];
  const level = levels.includes("severe") ? "severe"
    : levels.includes("mild") ? "mild"
    : "none";

  const signals = [];
  if (partialLevel !== "none") {
    signals.push({
      kind: "partial",
      severity: partialLevel,
      detail: `${partialCount}/${n} sesiones recientes incompletas (${(partialRatio * 100).toFixed(0)}%)`,
    });
  }
  if (pausesLevel !== "none") {
    signals.push({
      kind: "pauses",
      severity: pausesLevel,
      detail: `${avgPauses.toFixed(1)} pausas promedio por sesión`,
    });
  }
  if (hiddenLevel !== "none") {
    signals.push({
      kind: "hidden",
      severity: hiddenLevel,
      detail: `${(avgHiddenRatio * 100).toFixed(0)}% de tiempo en background`,
    });
  }

  return {
    level,
    partialRatio: +partialRatio.toFixed(3),
    avgPauses: +avgPauses.toFixed(2),
    avgHiddenRatio: +avgHiddenRatio.toFixed(3),
    sampleSize: n,
    signals,
  };
}

/**
 * Aplica penalty de difficulty al score de un protocolo según el nivel
 * de fatiga. Solo penaliza protocolos con dif alta (≥3); protocolos de
 * regulación reciben pequeño boost.
 *
 * @param {number} score - score base del candidato
 * @param {object} protocol - {dif, int}
 * @param {FatigueReport} fatigue
 * @returns {number} score ajustado
 */
export function applyFatigueAdjustment(score, protocol, fatigue) {
  if (!fatigue || fatigue.level === "none") return score;
  const cfg = NC.pauseFatigue;
  const penalty = fatigue.level === "severe"
    ? cfg.severeDifficultyPenalty
    : cfg.mildDifficultyPenalty;
  // Penalty solo a protocolos de dificultad media/alta
  if ((protocol?.dif || 1) >= 3) return score + penalty;
  // Pequeño boost a protocolos de regulación cuando hay fatiga
  if (cfg.severeForceIntents.includes(protocol?.int)) {
    return score + Math.abs(penalty) * 0.5;
  }
  return score;
}

/**
 * Si fatigue es severe, retorna "calma" o "reset" como primaryNeed
 * forzado. null si no aplica override.
 */
export function fatigueOverridePrimaryNeed(fatigue, currentNeed) {
  if (!fatigue || fatigue.level !== "severe") return null;
  // Si el primaryNeed actual ya es regulación, no cambiamos.
  const cfg = NC.pauseFatigue;
  if (cfg.severeForceIntents.includes(currentNeed)) return null;
  // Default: calma (más segura que reset cuando fatigue es alto).
  return "calma";
}

/**
 * Genera mensaje de UX para el usuario cuando hay fatiga detectada.
 */
export function fatigueGuidance(fatigue) {
  if (!fatigue || fatigue.level === "none") return null;
  if (fatigue.level === "severe") {
    return {
      severity: "severe",
      title: "Tu sistema pide pausa",
      body: "Detectamos varias sesiones incompletas o con muchas interrupciones. Dale prioridad a regulación parasimpática esta semana — protocolos de calma cortos.",
      cta: "Hacer sesión de calma",
    };
  }
  return {
    severity: "mild",
    title: "Considera bajar el ritmo",
    body: "Algunas sesiones recientes se quedaron a medio. No es alarma, pero un día de regulación puede ayudarte a recuperar consistencia.",
    cta: "Ver protocolos de reset",
  };
}

/**
 * @typedef {object} HistoryEntry
 * @property {boolean} [partial]
 * @property {string} [quality] - "alta"|"media"|"baja"|"ligera"|"inválida"
 * @property {number} [pauses]
 * @property {number} [dur] - duración planeada (sec)
 * @property {number} [hiddenSec] - tiempo en background
 */

/**
 * @typedef {object} FatigueReport
 * @property {"none"|"mild"|"severe"} level
 * @property {number} partialRatio
 * @property {number} avgPauses
 * @property {number} avgHiddenRatio
 * @property {number} sampleSize
 * @property {Array<{kind:string, severity:string, detail:string}>} signals
 */
