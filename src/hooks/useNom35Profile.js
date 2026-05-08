/* ═══════════════════════════════════════════════════════════════
   useNom35Profile — Phase 6J-2 HIGH-2
   ───────────────────────────────────────────────────────────────
   Closes Engine Audit HIGH-2: el engine soporta `nom35Dominios` (→
   `protocolBiasFromDomain` → `nom35Bias` en context + override de
   primaryNeed cuando urgent), pero ningún consumer lo pasaba en
   producción. Resultado: `_generateReason` rama "Tu perfil NOM-035
   indica X como prioridad" muerta runtime.

   Este hook lee `state.nom035Results` (array, slice -20) y devuelve
   `nom35Dominios` del resultado más reciente. HomeV2 lo pasa a
   `useAdaptiveRecommendation({nom35Dominios})`.

   IMPORTANTE: el field se llama `nom035Results` (con cero medio) en
   useStore.js histórico — NO `nom35Results`. Respetamos el typo
   histórico para no migrar storage.

   Shape de Nom35Result (de `scoreAnswers` en lib/nom35/scoring.js):
     {
       completedCount, missingCount, missingItems,
       total, porDominio, porCategoria,
       nivel, nivelLabel, recomendacion,
       ts? (added by caller)
     }

   `porDominio`: { condiciones, carga, falta_control, jornada,
                   interferencia, liderazgo, violencia }
   ═══════════════════════════════════════════════════════════════ */
"use client";

import { useMemo } from "react";
import { useStore } from "@/store/useStore";

/**
 * @returns {{
 *   nom35Dominios: object | null,
 *   latestTotal: number | null,
 *   latestNivel: string | null,
 *   latestAt: number | null,
 * }}
 */
export function useNom35Profile() {
  const nom035Results = useStore((s) => s.nom035Results);
  return useMemo(() => deriveNom35Profile(nom035Results), [nom035Results]);
}

/**
 * Pure derivation function — exportada para test directo + uso fuera
 * del hook React (e.g. computeAdaptiveRecommendation server-side).
 *
 * @param {Array|null|undefined} results
 * @returns {{nom35Dominios, latestTotal, latestNivel, latestAt}}
 */
export function deriveNom35Profile(results) {
  if (!Array.isArray(results) || results.length === 0) {
    return { nom35Dominios: null, latestTotal: null, latestNivel: null, latestAt: null };
  }
  // Get most recent by ts (defensive: fallback al último del array
  // cuando ts ausente en algunos entries — store no garantiza ts).
  const sorted = [...results].sort((a, b) => {
    const tsA = typeof a?.ts === "number" ? a.ts : 0;
    const tsB = typeof b?.ts === "number" ? b.ts : 0;
    return tsB - tsA;
  });
  const latest = sorted[0];
  if (!latest || typeof latest !== "object") {
    return { nom35Dominios: null, latestTotal: null, latestNivel: null, latestAt: null };
  }
  // Defensive shape: prefer `porDominio` (canonical from scoreAnswers);
  // fallback a `dominios` para tolerar shapes legacy/mock alternativos.
  const dominios = latest.porDominio || latest.dominios || null;
  return {
    nom35Dominios: dominios && typeof dominios === "object" ? dominios : null,
    latestTotal: typeof latest.total === "number" ? latest.total : null,
    latestNivel: typeof latest.nivel === "string" ? latest.nivel : null,
    latestAt: typeof latest.ts === "number" ? latest.ts : null,
  };
}

export default useNom35Profile;
