/* ═══════════════════════════════════════════════════════════════
   useReadiness — derive readiness (HRV/RHR/sueño/mood/carga) desde
   el store. Memoiza sólo contra los campos relevantes para no
   recomputar en cada render de page.jsx.

   SQI gating: entradas con source="camera" y SQI bajo (<60) NO
   entran al baseline ni se usan como currentHRV — evitan contaminar
   la z-score del motor neural. Entradas BLE (sin SQI) se consideran
   confiables por default. Dato clínico basura es peor que ningún dato.

   Phase 6H Premium-Fix1 — fallback coherence-only.
   Cuando calcReadiness devuelve score=null (sin HRV / sleep / mood /
   subjective) PERO el usuario ya tiene ≥5 sesiones con coherence per-
   sesión registrada en history[].c, derivamos un composite parcial
   desde el promedio de coherencia reciente. Esto evita el caso H-1
   detectado en simulación 90 días: PersonalizedView mostraba "0"
   gigante demotivador a 14+ sesiones cuando el user no había medido
   HRV. El fallback es claramente etiquetado (`partial:true`,
   `source:"coherence-only"`) para que la UI muestre LECTURA PARCIAL
   y CTA "Activar lectura completa" — sin ocultar la limitación.
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { calcReadiness } from "../lib/readiness";
import {
  getReliableHrvEntries,
  getReliableRhrEntries,
  getCurrentReliableHrv,
} from "../lib/hrvLog";

// Phase 6H Premium-Fix1 — umbrales del fallback coherence-only.
const FALLBACK_MIN_SESSIONS = 5;       // gate por dataMaturity learning
const FALLBACK_MIN_COHERENCE_SAMPLES = 3; // mínimo de h.c válidos para promediar
const FALLBACK_RECENT_WINDOW = 14;     // ventana últimas N sesiones

/**
 * Construye la entrada a `calcReadiness` desde una snapshot del store.
 * Pura y exportada para reuso (inicialización pre-render y tests).
 *
 * Filtra hrvLog y rhrLog por confiabilidad (SQI ≥ 60 para cámara).
 * Sin este filtro el motor neural recibiría data sucia → recomendaciones
 * envenenadas. La función única de filtrado vive en lib/hrvLog.js.
 */
export function buildReadinessInput(st) {
  const reliableHrv = getReliableHrvEntries(st?.hrvLog);
  const reliableRhr = getReliableRhrEntries(st?.rhrLog);
  return {
    hrvHistory: reliableHrv.map((h) => ({ ts: h.ts, lnRmssd: h.lnRmssd })),
    rhrHistory: reliableRhr.map((h) => ({ ts: h.ts, rhr: h.rhr })),
    sleepHours: st?.lastSleepHours ?? null,
    sleepTarget: st?.sleepTargetHours ?? 7.5,
    moodLog: st?.moodLog || [],
    sessions: st?.history || [],
    currentHRV: getCurrentReliableHrv(st?.hrvLog),
  };
}

/**
 * Phase 6H Premium-Fix1 — coherence-only fallback.
 * Promedia las últimas {FALLBACK_RECENT_WINDOW} sesiones que tengan
 * h.c (per-session coherence 0-100) y devuelve el composite directo.
 * Returns { score, samples } o null si insuficiente.
 *
 * h.c viene de lib/neural.js _buildHistoryEntry → c: newCoherence.
 * Rango esperado 0-100 (es coherencia post-sesión, ya normalizada).
 */
function coherenceOnlyFallback(history) {
  if (!Array.isArray(history) || history.length < FALLBACK_MIN_SESSIONS) return null;
  const recent = history.slice(-FALLBACK_RECENT_WINDOW);
  const samples = recent
    .map((h) => h?.c)
    .filter((c) => typeof c === "number" && Number.isFinite(c));
  if (samples.length < FALLBACK_MIN_COHERENCE_SAMPLES) return null;
  const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
  const score = Math.max(0, Math.min(100, Math.round(avg)));
  return { score, samples: samples.length };
}

/** Cálculo síncrono; útil para inicialización antes de que React monte.
 *
 * Phase 6H Premium-Fix1 — el shape extendido (partial/source/reason/
 * eligibleForFallback) es ADITIVO: campos existentes (score/insufficient/
 * components/baselineDays/interpretation/recommendation) preservan su
 * semántica original cuando el engine tiene signals suficientes.
 */
export function computeReadiness(st) {
  let result;
  try {
    result = calcReadiness(buildReadinessInput(st));
  } catch {
    result = null;
  }
  // Caso 1 — engine OK con score numérico. Marcar source=full + partial=false.
  if (result && typeof result.score === "number") {
    return {
      ...result,
      partial: false,
      source: "full",
      reason: null,
      eligibleForFallback: false,
    };
  }
  // Caso 2 — engine devolvió { score: null, insufficient: true } o
  // calcReadiness lanzó. Intentar fallback coherence-only.
  const totalSessions = Array.isArray(st?.history) ? st.history.length : 0;
  const fallback = coherenceOnlyFallback(st?.history);
  if (fallback) {
    return {
      // Mantener shape compatible con consumers existentes.
      score: fallback.score,
      insufficient: false,
      components: result?.components || {},
      baselineDays: result?.baselineDays || 0,
      interpretation: undefined,
      recommendation: undefined,
      // Phase 6H Premium-Fix1 — campos nuevos.
      partial: true,
      source: "coherence-only",
      reason: "Lectura parcial · activa HRV para tu lectura completa",
      eligibleForFallback: true,
      fallbackSamples: fallback.samples,
    };
  }
  // Caso 3 — pre-baseline (N<5 o sin coherencia válida en history).
  // Preservamos result existing si lo había (insufficient:true) + añadimos
  // campos nuevos. Si result es null (calcReadiness threw), construimos
  // mínimo compat.
  const base = result || { score: null, insufficient: true, components: {}, baselineDays: 0 };
  return {
    ...base,
    partial: false,
    source: null,
    reason: totalSessions === 0
      ? "Sin datos — completa tu primera sesión"
      : "Datos insuficientes — completa al menos 5 sesiones",
    eligibleForFallback: false,
  };
}

/** Hook React: memoiza readiness contra los campos que realmente importan. */
export function useReadiness(st) {
  return useMemo(
    () => computeReadiness(st),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [st?.hrvLog, st?.rhrLog, st?.lastSleepHours, st?.sleepTargetHours, st?.moodLog, st?.history]
  );
}
