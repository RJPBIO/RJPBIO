/* ═══════════════════════════════════════════════════════════════
   BIOSIGNAL INDEX — benchmark autonómico anónimo por industria.
   ───────────────────────────────────────────────────────────────
   Convierte la métrica interna de una org en una métrica COMPETITIVA:
   "tu org vs el promedio de tu industria". Doble k-anonimato:
     · dentro de la org, los agregados ya exigen N≥5 (analytics-anonymize).
     · el benchmark de cohorte exige ≥minOrgs ORGS por cohorte, para que
       ninguna org sea identificable dentro de su grupo.

   Funciones puras, testeables. HONESTIDAD: el índice es un compuesto
   expresivo de señales de bienestar/autonómicas (NOM-035, ánimo, HRV,
   uso), no un biomarcador clínico. El benchmark solo aparece con masa
   suficiente de orgs; mientras tanto, estado "en formación".
   ═══════════════════════════════════════════════════════════════ */

const clamp = (x, lo, hi) => (x < lo ? lo : x > hi ? hi : x);

const NIVEL_SCORE = { nulo: 100, bajo: 80, medio: 60, alto: 35, muy_alto: 15 };

/**
 * Índice 0-100 de una org desde sus agregados (mayor = mejor estado).
 * Pondera solo los componentes presentes (re-normaliza si faltan).
 * @param {object} agg — { nom35Level, moodDeltaMean, hrvDeltaMean, engagementRate }
 * @returns {{ index:number|null, components:object }}
 */
export function computeOrgIndex(agg) {
  if (!agg || typeof agg !== "object") return { index: null, components: {} };
  const parts = [];
  const components = {};

  if (agg.nom35Level && NIVEL_SCORE[agg.nom35Level] != null) {
    const v = NIVEL_SCORE[agg.nom35Level];
    parts.push({ w: 0.35, v });
    components.nom35 = v;
  }
  if (Number.isFinite(agg.moodDeltaMean)) {
    // delta de ánimo (escala 1-5) ~ [-2,+2] → 0..100
    const v = clamp(((agg.moodDeltaMean + 2) / 4) * 100, 0, 100);
    parts.push({ w: 0.25, v });
    components.mood = Math.round(v);
  }
  if (Number.isFinite(agg.hrvDeltaMean)) {
    // Δcoherencia/HRV centrado en 0 → 0..100 (±5 cubre el rango usual)
    const v = clamp((0.5 + agg.hrvDeltaMean / 10) * 100, 0, 100);
    parts.push({ w: 0.25, v });
    components.hrv = Math.round(v);
  }
  if (Number.isFinite(agg.engagementRate)) {
    const rate = agg.engagementRate > 1 ? agg.engagementRate / 100 : agg.engagementRate;
    const v = clamp(rate * 100, 0, 100);
    parts.push({ w: 0.15, v });
    components.engagement = Math.round(v);
  }

  if (parts.length === 0) return { index: null, components };
  const wsum = parts.reduce((a, p) => a + p.w, 0);
  const index = Math.round(parts.reduce((a, p) => a + p.w * p.v, 0) / wsum);
  return { index, components };
}

function percentileOf(sortedAsc, value) {
  const n = sortedAsc.length;
  if (n === 0) return null;
  let below = 0;
  for (const v of sortedAsc) if (v < value) below++;
  return Math.round((below / n) * 100);
}

function quantile(sortedAsc, q) {
  const n = sortedAsc.length;
  if (n === 0) return null;
  if (n === 1) return sortedAsc[0];
  const idx = q * (n - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedAsc[lo];
  return Math.round(sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * (idx - lo));
}

/**
 * Agrupa orgs por cohorte y construye el benchmark, suprimiendo cohortes
 * con menos de `minOrgs` (k-anon a nivel de org).
 * @param {Array} orgEntries — [{ cohort:string, index:number }]
 * @param {object} [opts] — { minOrgs=5 }
 * @returns {{ cohorts: Object<string,{n,mean,p25,p50,p75}>, suppressed:number }}
 */
export function buildCohortBenchmark(orgEntries, { minOrgs = 5 } = {}) {
  const groups = {};
  for (const e of orgEntries || []) {
    if (!e || !e.cohort || !Number.isFinite(e.index)) continue;
    (groups[e.cohort] = groups[e.cohort] || []).push(e.index);
  }
  const cohorts = {};
  let suppressed = 0;
  for (const [cohort, arr] of Object.entries(groups)) {
    if (arr.length < minOrgs) {
      suppressed += 1;
      continue;
    }
    const sorted = arr.slice().sort((a, b) => a - b);
    cohorts[cohort] = {
      n: sorted.length,
      mean: Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length),
      p25: quantile(sorted, 0.25),
      p50: quantile(sorted, 0.5),
      p75: quantile(sorted, 0.75),
      _values: sorted,
    };
  }
  return { cohorts, suppressed, minOrgs };
}

/**
 * Compara el índice de una org contra el benchmark de su cohorte.
 * @returns {{available, delta, percentile, mean, n, label, reason?}}
 */
export function compareOrgToCohort(orgIndex, cohort) {
  if (!cohort || !Number.isFinite(orgIndex)) {
    return { available: false, reason: "Falta benchmark de cohorte o índice de la org." };
  }
  const delta = orgIndex - cohort.mean;
  const percentile = percentileOf(cohort._values || [], orgIndex);
  const label =
    delta >= 8 ? "por encima de tu industria"
      : delta <= -8 ? "por debajo de tu industria"
      : "en línea con tu industria";
  return { available: true, delta, percentile, mean: cohort.mean, n: cohort.n, label };
}
