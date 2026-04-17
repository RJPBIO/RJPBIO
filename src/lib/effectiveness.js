/* ═══════════════════════════════════════════════════════════════
   EFFECTIVENESS — lift pre/post por protocolo con IC95%
   ═══════════════════════════════════════════════════════════════
   Convierte telemetría de sesión en *interpretación*: para el par
   (usuario × protocolo), devuelve si el protocolo produce un lift
   de estado (mood) estadísticamente detectable.

   Criterio de significancia: IC95% del mean difference no cruza 0
   (equivalente a una t-test paired unilateral simple).
   Tamaño de efecto: Cohen's d paired = mean(d) / sd(d).

   Referencias:
   - Cohen J (1988). Statistical Power Analysis for the Behavioral
     Sciences. 2nd ed. Hillsdale, NJ: Erlbaum. (d thresholds)
   - Lakens D (2013). Calculating and reporting effect sizes to
     facilitate cumulative science. Frontiers in Psychology, 4:863.
   ═══════════════════════════════════════════════════════════════ */

const DEFAULT_MIN_N = 5;

/**
 * Lift pre/post para un conjunto de sesiones (típicamente filtradas
 * por protocolo y usuario). Ignora sesiones sin campos `pre` y `mood`.
 */
export function computeProtocolEffectiveness(sessions, { minN = DEFAULT_MIN_N } = {}) {
  const safe = Array.isArray(sessions) ? sessions : [];
  const pairs = safe.filter(
    (s) => typeof s?.pre === "number" && typeof s?.mood === "number"
  );
  if (pairs.length < minN) {
    return { insufficient: true, n: pairs.length, minN };
  }
  const diffs = pairs.map((p) => p.mood - p.pre);
  const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const variance = diffs.length > 1
    ? diffs.reduce((a, b) => a + (b - mean) ** 2, 0) / (diffs.length - 1)
    : 0;
  const sd = Math.sqrt(variance);
  const se = diffs.length > 0 ? sd / Math.sqrt(diffs.length) : 0;
  const ci95 = 1.96 * se;
  const lowerBound = mean - ci95;
  const upperBound = mean + ci95;
  // Cohen's d paired. SD=0 con mean≠0 es señal perfectamente consistente → efecto grande.
  const d = sd > 0 ? mean / sd : mean !== 0 ? Infinity : 0;
  const positivePct = Math.round(
    (diffs.filter((x) => x > 0).length / diffs.length) * 100
  );
  const significant = lowerBound > 0;
  let magnitude;
  if (!significant) magnitude = "no-effect";
  else if (Math.abs(d) < 0.2) magnitude = "small";
  else if (Math.abs(d) < 0.5) magnitude = "moderate";
  else magnitude = "large";

  return {
    insufficient: false,
    n: diffs.length,
    meanLift: +mean.toFixed(2),
    sd: +sd.toFixed(2),
    ci95Lo: +lowerBound.toFixed(2),
    ci95Hi: +upperBound.toFixed(2),
    cohensD: +d.toFixed(2),
    positivePct,
    significant,
    magnitude,
  };
}

/**
 * Mapa protocolo → resultado de efectividad. Agrupa por `proto` o
 * `protocolId`. Protocolos sin suficientes sesiones retornan insufficient.
 */
export function effectivenessByProtocol(sessions, { minN = DEFAULT_MIN_N } = {}) {
  const safe = Array.isArray(sessions) ? sessions : [];
  const byProto = {};
  for (const s of safe) {
    const pid = s?.proto || s?.protocolId;
    if (!pid) continue;
    (byProto[pid] = byProto[pid] || []).push(s);
  }
  const result = {};
  for (const [pid, arr] of Object.entries(byProto)) {
    result[pid] = computeProtocolEffectiveness(arr, { minN });
  }
  return result;
}
