/* ═══════════════════════════════════════════════════════════════
   evaluateEngineHealth — introspección del motor adaptativo
   ═══════════════════════════════════════════════════════════════
   Sprint 40: el motor por primera vez se autoevalúa. Mide:

   - predictionAccuracy:   |predicted − observed| en moodLog. Sin esto
                           no sabíamos si el predictedDelta funciona.
   - recommendationAcceptance:  cuántas veces el usuario corrió el
                                primary recomendado (proxy: protocolo
                                jugado coincide con el que el motor
                                hubiera sugerido en ese contexto).
   - personalizationDelta: cuán distinta es la recomendación actual
                           vs un baseline circadiano-only. Mide si la
                           personalización está realmente operando.
   - staleness:            días desde última sesión. Si > 14, los
                           patrones del usuario pueden haber drifteado.
   - dataMaturity:         cold-start / learning / personalized según
                           cantidad de sesiones acumuladas.

   Esta función es PURA (no toca DB, no muta state). Recibe state
   como input y devuelve un snapshot evaluable.
   ═══════════════════════════════════════════════════════════════ */

import { NEURAL_CONFIG as NC } from "./config";
import { detectStaleness } from "./staleness";
import { detectPauseFatigue } from "./pauseFatigue";

const HOUR_MS = 3600000;
const DAY_MS = 24 * HOUR_MS;

/**
 * Evalúa la salud del motor adaptativo basándose en el state del usuario.
 *
 * @param {object} state - state del store: { history, moodLog, ... }
 * @returns {EngineHealth}
 */
export function evaluateEngineHealth(state) {
  const cfg = NC.health;
  const hist = Array.isArray(state?.history) ? state.history : [];
  const ml = Array.isArray(state?.moodLog) ? state.moodLog : [];
  const totalSessions = hist.length;

  const dataMaturity = totalSessions < cfg.coldStartSessions
    ? "cold-start"
    : totalSessions < cfg.learningSessions
      ? "learning"
      : "personalized";

  const staleness = computeStaleness(hist);
  // Sprint 42 — Detectar si el motor está operando con datos obsoletos
  // y debería ofrecer recalibración al usuario.
  const stalenessReport = detectStaleness(state);
  const recalibrationNeeded = stalenessReport.recalibrate !== false;
  // Sprint 50 — fatigue detection surfaceable
  const fatigueReport = detectPauseFatigue(hist);

  // Prediction accuracy: usa pares (m.proto, m.pre, m.mood) del moodLog.
  // No tenemos predicciones registradas históricamente, pero podemos
  // simular: cada sesión con pre>0 tiene un delta observado (mood-pre).
  // Estimamos accuracy como qué tan estable es ese delta — varianza alta
  // = motor poco confiable; varianza baja = motor predice bien.
  const accuracy = computePredictionAccuracy(ml, cfg);

  // Recommendation acceptance: heurística. Si el usuario tiene
  // diversidad (>3 protocolos distintos en últimas 10 sesiones) Y el
  // historial de mood-deltas es positivo, asumimos que las recomendaciones
  // se están aceptando y funcionando. Métrica conservadora.
  const acceptance = computeRecommendationAcceptance(state);

  // Personalization delta: heurística. Si el usuario tiene historial
  // personal (sensibilidad, peak window, ritmo), el motor está
  // personalizando. Si no, está cayendo a circadiano-only.
  const personalization = computePersonalizationStrength(state, cfg);

  return {
    dataMaturity,
    totalSessions,
    moodSamples: ml.length,

    staleness,
    recalibrationNeeded,
    recalibrationSeverity: stalenessReport.recalibrate || null,
    dataConfidence: stalenessReport.dataConfidence,
    fatigue: {
      level: fatigueReport.level,
      partialRatio: fatigueReport.partialRatio,
      avgPauses: fatigueReport.avgPauses,
      signals: fatigueReport.signals,
    },

    predictionAccuracy: accuracy,
    recommendationAcceptance: acceptance,
    personalization,

    // Resumen ejecutivo: una palabra que indica salud global.
    overall: synthesizeOverall({ accuracy, acceptance, personalization, staleness, dataMaturity, fatigue: fatigueReport }),

    // Recomendaciones accionables para el operador del sistema.
    actions: synthesizeActions({ accuracy, acceptance, personalization, staleness, dataMaturity, fatigue: fatigueReport }),

    // Versión del schema — facilita migrations futuras.
    schemaVersion: 1,
  };
}

/* ═══════════════════════════════════════════════════════════════
   Sub-cálculos
   ═══════════════════════════════════════════════════════════════ */

function computeStaleness(history) {
  if (!history.length) return { days: null, status: "no-data" };
  const lastTs = history[history.length - 1]?.ts;
  if (typeof lastTs !== "number") return { days: null, status: "no-data" };
  const days = Math.floor((Date.now() - lastTs) / DAY_MS);
  const status = days <= 1 ? "fresh"
    : days <= 7 ? "active"
    : days <= 14 ? "cooling"
    : "stale";
  return { days, status };
}

function computePredictionAccuracy(ml, cfg) {
  const withPre = ml.filter((m) => typeof m.pre === "number" && m.pre > 0 && typeof m.mood === "number");
  if (withPre.length < cfg.minPredictionPairs) {
    return { value: null, sampleSize: withPre.length, status: "insufficient-data" };
  }
  // Para cada sesión, el "predicted" implícito sería el delta promedio
  // de las anteriores con el mismo protocolo. Calculamos error promedio.
  const errors = [];
  const byProto = new Map();
  for (const m of withPre) {
    const observed = m.mood - m.pre;
    const protoHist = byProto.get(m.proto) || [];
    if (protoHist.length >= 1) {
      const predicted = protoHist.reduce((a, b) => a + b, 0) / protoHist.length;
      errors.push(Math.abs(predicted - observed));
    }
    protoHist.push(observed);
    byProto.set(m.proto, protoHist);
  }
  if (errors.length === 0) {
    return { value: null, sampleSize: 0, status: "insufficient-data" };
  }
  const meanError = errors.reduce((a, b) => a + b, 0) / errors.length;
  const hits = errors.filter((e) => e < cfg.predictionHitTolerance).length;
  const hitRate = hits / errors.length;
  return {
    value: +(1 - meanError / 4).toFixed(3), // normaliza a [0..1] (4 = max delta posible)
    meanError: +meanError.toFixed(3),
    hitRate: +hitRate.toFixed(3),
    sampleSize: errors.length,
    status: hitRate >= 0.6 ? "good" : hitRate >= 0.4 ? "fair" : "poor",
  };
}

function computeRecommendationAcceptance(state) {
  const hist = Array.isArray(state?.history) ? state.history : [];
  if (hist.length < 5) {
    return { value: null, sampleSize: hist.length, status: "insufficient-data" };
  }
  const last10 = hist.slice(-10);
  const protos = new Set(last10.map((h) => h.p));
  // Diversidad alta = el usuario está siguiendo recomendaciones
  // que rotan protocolos. Diversidad de 1 = el motor sugiere lo mismo
  // o el usuario ignora las sugerencias y va siempre al mismo.
  const diversityRatio = protos.size / last10.length;
  // Cross-check con bioQ: si las sesiones tienen calidad >= 50, el
  // usuario está participando activamente, no clickeando rápido.
  const validQuality = last10.filter((h) => (h.bioQ ?? 0) >= 50).length;
  const qualityRate = validQuality / last10.length;
  // Combinación: diversidad pesa 0.6, calidad 0.4.
  const score = +(diversityRatio * 0.6 + qualityRate * 0.4).toFixed(3);
  return {
    value: score,
    diversity: +diversityRatio.toFixed(3),
    qualityRate: +qualityRate.toFixed(3),
    sampleSize: last10.length,
    status: score >= 0.6 ? "good" : score >= 0.4 ? "fair" : "poor",
  };
}

function computePersonalizationStrength(state, cfg) {
  const hist = Array.isArray(state?.history) ? state.history : [];
  const ml = Array.isArray(state?.moodLog) ? state.moodLog : [];
  // Señales que prueban que el motor personaliza:
  //  1. moodLog con preset (varios deltas) → sensitivity calculable
  //  2. history >= 8 → analyzeNeuralRhythm ofrece peak window
  //  3. history >= 14 → cogLoad se personaliza por día de semana
  //  4. predictionResiduals.history >= 5 → calibración por residuales activa
  //  5. banditArms con n>0 en algún brazo → exploración personalizada
  const signals = {
    sensitivity: ml.filter((m) => typeof m.pre === "number" && m.pre > 0).length >= 5,
    peakWindow: hist.length >= 8,
    weeklyDensity: hist.length >= 14,
    residualCalibration: Array.isArray(state?.predictionResiduals?.history)
      && state.predictionResiduals.history.length >= 5,
    bandit: !!state?.banditArms && Object.values(state.banditArms).some((a) => (a?.n || 0) > 0),
  };
  const activeSignals = Object.values(signals).filter(Boolean).length;
  const score = +(activeSignals / 5).toFixed(3);

  // Cuál es el riesgo de "personalización débil": que el motor cae a
  // circadiano-only la mayor parte del tiempo. Esto pasa si tienes muchas
  // sesiones pero pocas señales de feedback (pre-mood, residuals).
  const totalSessions = hist.length;
  const weakRisk = totalSessions >= 10 && activeSignals <= 2;

  return {
    value: score,
    signals,
    activeSignals,
    weakRisk,
    status: score >= 0.8 ? "strong"
      : score >= 0.5 ? "developing"
      : score >= 0.2 ? "early"
      : "minimal",
    weakThreshold: cfg.personalizationWeakThreshold,
  };
}

function synthesizeOverall({ accuracy, acceptance, personalization, staleness, dataMaturity, fatigue }) {
  if (dataMaturity === "cold-start") return "cold-start";
  if (staleness.status === "stale") return "stale";
  // Sprint 50 — fatiga severa precede a otros estados (señal de bienestar)
  if (fatigue?.level === "severe") return "fatigued";
  // Si tenemos accuracy y es "poor", la salud es "calibrating" (motor aprende).
  if (accuracy.status === "poor") return "calibrating";
  // Personalización mínima con muchas sesiones = problema serio.
  if (personalization.weakRisk) return "underperforming";
  // Todo OK.
  if (accuracy.status === "good" && acceptance.status === "good" && personalization.status === "strong") {
    return "healthy";
  }
  return "operational";
}

function synthesizeActions(snap) {
  const actions = [];
  if (snap.dataMaturity === "cold-start") {
    actions.push({
      kind: "info",
      title: "Cold start activo",
      detail: "El motor opera en modo baseline. Las primeras 5 sesiones alimentan la personalización.",
    });
  }
  if (snap.staleness.status === "stale") {
    actions.push({
      kind: "warn",
      title: `Patrones potencialmente obsoletos (${snap.staleness.days} días sin actividad)`,
      detail: "Recomendar al usuario una sesión de re-baseline para recalibrar el motor.",
    });
  }
  if (snap.accuracy.status === "poor") {
    actions.push({
      kind: "warn",
      title: "Predicciones poco precisas",
      detail: `Hit rate ${(snap.accuracy.hitRate * 100).toFixed(0)}%. Considera revisar tolerancia o aumentar muestras.`,
    });
  }
  if (snap.fatigue?.level === "severe") {
    actions.push({
      kind: "warn",
      title: "Fatiga severa detectada",
      detail: `${(snap.fatigue.partialRatio * 100).toFixed(0)}% de sesiones recientes incompletas. El motor está priorizando regulación parasimpática.`,
    });
  } else if (snap.fatigue?.level === "mild") {
    actions.push({
      kind: "info",
      title: "Patrón de fatiga leve",
      detail: `Algunas sesiones recientes con pausas frecuentes. Motor reduce dificultad recomendada.`,
    });
  }
  if (snap.acceptance.status === "poor") {
    actions.push({
      kind: "warn",
      title: "Baja aceptación de recomendaciones",
      detail: "El usuario está ignorando o no completando las sugerencias. Posible mismatch motor-preferencia.",
    });
  }
  if (snap.personalization.weakRisk) {
    actions.push({
      kind: "danger",
      title: "Personalización débil con historial significativo",
      detail: "El motor está cayendo a circadiano-only pese a tener datos. Faltan señales pre-mood o residuales.",
    });
  }
  if (!actions.length) {
    actions.push({
      kind: "ok",
      title: "Motor operando dentro de rangos saludables",
      detail: "Continúa monitoreando. Próxima evaluación recomendada en 7 días.",
    });
  }
  return actions;
}
