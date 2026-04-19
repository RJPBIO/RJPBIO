/* ═══════════════════════════════════════════════════════════════
   useReadiness — derive readiness (HRV/RHR/sueño/mood/carga) desde
   el store. Memoiza sólo contra los campos relevantes para no
   recomputar en cada render de page.jsx.
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { calcReadiness } from "../lib/readiness";

/**
 * Construye la entrada a `calcReadiness` desde una snapshot del store.
 * Pura y exportada para reuso (inicialización pre-render y tests).
 */
export function buildReadinessInput(st) {
  const hrvLog = Array.isArray(st?.hrvLog) ? st.hrvLog : [];
  const rhrLog = Array.isArray(st?.rhrLog) ? st.rhrLog : [];
  const hrvHistory = hrvLog
    .map((h) => ({ ts: h.ts, lnRmssd: h.lnRmssd ?? h.lnrmssd ?? null }))
    .filter((h) => typeof h.lnRmssd === "number");
  const rhrHistory = rhrLog.map((h) => ({ ts: h.ts, rhr: h.rhr }));
  const last = hrvLog.length ? hrvLog[hrvLog.length - 1] : null;
  const currentHRV = last
    ? { lnRmssd: last.lnRmssd ?? last.lnrmssd ?? null, rhr: last.rhr ?? null }
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
