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
import {
  getReliableHrvEntries,
  getReliableRhrEntries,
  getCurrentReliableHrv,
} from "../lib/hrvLog";

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
