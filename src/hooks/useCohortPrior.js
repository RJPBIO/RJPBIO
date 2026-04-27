/* ═══════════════════════════════════════════════════════════════
   useCohortPrior — Sprint 51
   ═══════════════════════════════════════════════════════════════
   Fetcha el cohort prior del org del usuario desde /api/v1/me/neural-priors
   y lo cachea en memoria del módulo. Se invoca el endpoint UNA vez por
   sesión del browser (no por cada render). Stale-while-revalidate
   conservador: si llega un segundo mount, devolvemos el cache mientras
   re-fetchamos en background.

   Privacy: el endpoint solo retorna agregados k≥5. Sin orgs B2B,
   retorna cohortPrior: null y este hook devuelve null sin romper el
   motor (el cold-start prior cae a literatura, comportamiento legacy).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";

let cache = { value: null, fetchedAt: 0, inFlight: null };
const TTL_MS = 5 * 60 * 1000; // 5 min — coherente con Cache-Control del endpoint

async function fetchCohortPrior() {
  if (typeof window === "undefined") return null;
  try {
    const r = await fetch("/api/v1/me/neural-priors", {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    if (!r.ok) return null;
    const data = await r.json();
    return data?.cohortPrior || null;
  } catch {
    return null;
  }
}

/**
 * React hook que fetcha y mantiene el cohort prior. Retorna null
 * mientras carga o si no hay prior disponible. El motor adaptativo
 * tolera null sin problema (cae a literatura baseline).
 */
export function useCohortPrior() {
  const [prior, setPrior] = useState(cache.value);

  useEffect(() => {
    const now = Date.now();
    const fresh = cache.value && (now - cache.fetchedAt) < TTL_MS;
    if (fresh) {
      setPrior(cache.value);
      return;
    }
    if (cache.inFlight) {
      cache.inFlight.then((p) => setPrior(p));
      return;
    }
    cache.inFlight = fetchCohortPrior().then((p) => {
      cache.value = p;
      cache.fetchedAt = Date.now();
      cache.inFlight = null;
      return p;
    });
    cache.inFlight.then((p) => setPrior(p));
  }, []);

  return prior;
}

/** Para tests: limpia el cache del módulo. */
export function _resetCohortPriorCache() {
  cache = { value: null, fetchedAt: 0, inFlight: null };
}
