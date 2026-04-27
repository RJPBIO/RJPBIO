/* ═══════════════════════════════════════════════════════════════
   RETORNO SALUDABLE — KPI anti-engagement para B2B
   ───────────────────────────────────────────────────────────────
   Métrica: % de sesiones donde el operador NO necesitó volver a
   abrir el protocolo en las siguientes HEALTHY_GAP_HOURS horas.

   Filosofía operativa BIO-IGNICIÓN:
     · Calm/Headspace optimizan "más minutos en la app".
     · BIO-IGNICIÓN optimiza "menos dependencia, más autonomía".
     · La app desapareciendo de tu vida = la app funcionó.

   Cómo se calcula:
     1. Por cada usuario, se ordenan sesiones por completedAt.
     2. La última sesión (sin sucesora aún) NO entra al denominador
        — no se puede saber si el usuario "regresó" o no.
     3. De las restantes, una sesión es "retorno saludable" si la
        siguiente sesión del mismo usuario ocurre ≥6h después.
     4. Tasa = saludables / sesiones evaluables.

   K-anonymity: requiere ≥minK usuarios distintos con sesiones
   evaluables; si no, retorna { insufficient: true }.
   ═══════════════════════════════════════════════════════════════ */

const HEALTHY_GAP_HOURS = 6;
const HEALTHY_GAP_MS = HEALTHY_GAP_HOURS * 60 * 60 * 1000;
const DEFAULT_MIN_K = 5;

/**
 * Computa la tasa de Retorno Saludable a partir de sesiones planas.
 *
 * @param {Array<{userId:string, completedAt:Date|number|string}>} sessions
 * @param {{minK?:number, gapMs?:number}} [opts]
 * @returns {
 *   { insufficient: true, reason: string, uniqueUsers: number, minK: number }
 *   | { insufficient: false, healthyReturnRate: number, evaluable: number,
 *       healthy: number, uniqueUsers: number, gapHours: number }
 * }
 */
export function computeRetornoSaludable(sessions, opts = {}) {
  const minK = typeof opts.minK === "number" && opts.minK > 0 ? opts.minK : DEFAULT_MIN_K;
  const gapMs = typeof opts.gapMs === "number" && opts.gapMs > 0 ? opts.gapMs : HEALTHY_GAP_MS;
  const gapHours = +(gapMs / 3_600_000).toFixed(1);

  const safe = Array.isArray(sessions) ? sessions : [];
  // Agrupar por usuario.
  const byUser = new Map();
  for (const s of safe) {
    if (!s || typeof s !== "object") continue;
    if (!s.userId || typeof s.userId !== "string") continue;
    const t = toEpoch(s.completedAt);
    if (t === null) continue;
    if (!byUser.has(s.userId)) byUser.set(s.userId, []);
    byUser.get(s.userId).push(t);
  }

  let evaluable = 0;
  let healthy = 0;
  let uniqueWithEvaluable = 0;

  for (const arr of byUser.values()) {
    arr.sort((a, b) => a - b);
    if (arr.length < 2) continue; // ninguna sesión evaluable: no hay sucesora
    uniqueWithEvaluable += 1;
    for (let i = 0; i < arr.length - 1; i++) {
      const gap = arr[i + 1] - arr[i];
      evaluable += 1;
      if (gap >= gapMs) healthy += 1;
    }
  }

  if (uniqueWithEvaluable < minK || evaluable === 0) {
    return {
      insufficient: true,
      reason: uniqueWithEvaluable < minK ? "k_anonymity" : "no_evaluable_sessions",
      uniqueUsers: uniqueWithEvaluable,
      minK,
    };
  }

  return {
    insufficient: false,
    healthyReturnRate: +((healthy / evaluable) * 100).toFixed(1),
    evaluable,
    healthy,
    uniqueUsers: uniqueWithEvaluable,
    gapHours,
    minK,
  };
}

function toEpoch(v) {
  if (v == null) return null;
  if (v instanceof Date) {
    const t = v.getTime();
    return Number.isFinite(t) ? t : null;
  }
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const t = Date.parse(v);
    return Number.isFinite(t) ? t : null;
  }
  return null;
}

/**
 * Compara dos periodos para mostrar tendencia en el panel admin.
 * Si alguno es insufficient, devuelve null en delta.
 */
export function compareRetornoSaludable(currentSessions, priorSessions, opts = {}) {
  const curr = computeRetornoSaludable(currentSessions, opts);
  const prev = computeRetornoSaludable(priorSessions, opts);
  if (curr.insufficient || prev.insufficient) {
    return { current: curr, prior: prev, deltaPp: null };
  }
  return {
    current: curr,
    prior: prev,
    deltaPp: +(curr.healthyReturnRate - prev.healthyReturnRate).toFixed(1),
  };
}
