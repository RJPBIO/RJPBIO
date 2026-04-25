/* ═══════════════════════════════════════════════════════════════
   useReadiness — derive readiness (HRV/RHR/sueño/mood/carga) desde
   el store. Memoiza sólo contra los campos relevantes para no
   recomputar en cada render de page.jsx.

   SQI gating: entradas con source="camera" y SQI bajo (<60) NO
   entran al baseline ni se usan como currentHRV — evitan contaminar
   la z-score del motor neural. Entradas BLE (sin SQI) se consideran
   confiables por default. Dato clínico basura es peor que ningún dato.
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { calcReadiness } from "../lib/readiness";
import { isReliableHrvEntry } from "../lib/hrv-camera/insight";

/**
 * Construye la entrada a `calcReadiness` desde una snapshot del store.
 * Pura y exportada para reuso (inicialización pre-render y tests).
 */
export function buildReadinessInput(st) {
  const hrvLog = Array.isArray(st?.hrvLog) ? st.hrvLog : [];
  const rhrLog = Array.isArray(st?.rhrLog) ? st.rhrLog : [];
  const reliable = hrvLog
    .map((h) => ({ ...h, lnRmssd: h.lnRmssd ?? h.lnrmssd ?? null }))
    .filter(isReliableHrvEntry);
  const hrvHistory = reliable.map((h) => ({ ts: h.ts, lnRmssd: h.lnRmssd }));
  const rhrHistory = rhrLog.map((h) => ({ ts: h.ts, rhr: h.rhr }));
  // currentHRV debe ser la última lectura CONFIABLE — no la más reciente
  // si esa es basura.
  const last = reliable.length ? reliable[reliable.length - 1] : null;
  const currentHRV = last
    ? { lnRmssd: last.lnRmssd, rhr: last.rhr ?? null }
    : null;
  return {
    hrvHistory,
    rhrHistory,
    sleepHours: st?.lastSleepHours ?? null,
    sleepTarget: st?.sleepTargetHours ?? 7.5,
    moodLog: st?.moodLog || [],
    sessions: st?.history || [],
    currentHRV,
  };
}

/** Cálculo síncrono; útil para inicialización antes de que React monte. */
export function computeReadiness(st) {
  try {
    return calcReadiness(buildReadinessInput(st));
  } catch {
    return null;
  }
}

/** Hook React: memoiza readiness contra los campos que realmente importan. */
export function useReadiness(st) {
  return useMemo(
    () => computeReadiness(st),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [st?.hrvLog, st?.rhrLog, st?.lastSleepHours, st?.sleepTargetHours, st?.moodLog, st?.history]
  );
}
