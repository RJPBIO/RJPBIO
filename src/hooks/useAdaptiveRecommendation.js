/* ═══════════════════════════════════════════════════════════════
   useAdaptiveRecommendation — envuelve adaptiveProtocolEngine con
   memoización y tolerancia a errores. Los call-sites (inicialización
   pre-render y re-render) comparten la función pura
   `computeAdaptiveRecommendation` para no divergir.
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { adaptiveProtocolEngine } from "../lib/neural";

/**
 * Ejecuta el motor adaptativo con opciones opcionales. Devuelve null si el
 * motor lanza — la UI siempre debe tolerar ausencia de recomendación.
 */
export function computeAdaptiveRecommendation(st, options = {}) {
  try {
    return adaptiveProtocolEngine(st, {
      chronotype: st?.chronotype || null,
      banditArms: st?.banditArms || null,
      porDominio: options.nom35Dominios || null,
      readiness: options.readiness || null,
    });
  } catch {
    return null;
  }
}

/** Hook React: memoiza por los campos que realmente cambian la recomendación. */
export function useAdaptiveRecommendation(st, { nom35Dominios = null, readiness = null } = {}) {
  return useMemo(
    () => computeAdaptiveRecommendation(st, { nom35Dominios, readiness }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      st?.moodLog,
      st?.history,
      st?.weeklyData,
      st?.chronotype,
      st?.banditArms,
      st?.lastSleepHours,
      st?.sleepTargetHours,
      nom35Dominios,
      readiness,
    ]
  );
}
