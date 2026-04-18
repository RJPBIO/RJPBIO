/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — Protocol bandit (UCB1-Normal)
   Selección online de protocolo con exploración/explotación.

   Cada protocolo es un brazo con estadísticas incrementales de la
   recompensa observada (Δmood = mood_post − mood_pre). Usamos
   UCB1-Normal (Auer et al. 2002) en vez de Thompson por dos razones:
     1. Es determinista → fácil de testear sin RNG.
     2. Converge igual de rápido con n moderado (n ≥ 30 por brazo).

   Entrada/salida: todo funciones puras. El store guarda el objeto
   `arms = { [armId]: { n, sum, sumsq } }` y se muta via updateArm.
   ═══════════════════════════════════════════════════════════════ */

/**
 * Actualiza el brazo con una nueva observación (reward).
 * No modifica la entrada.
 */
export function updateArm(arm, observation) {
  const x = Number(observation);
  if (!Number.isFinite(x)) return arm || { n: 0, sum: 0, sumsq: 0 };
  const prev = arm || { n: 0, sum: 0, sumsq: 0 };
  return {
    n: prev.n + 1,
    sum: prev.sum + x,
    sumsq: prev.sumsq + x * x,
  };
}

/** Estadísticos del brazo (media, varianza muestral, n). */
export function armStats(arm) {
  if (!arm || arm.n === 0) return { mean: 0, variance: 1, n: 0, se: Infinity };
  const mean = arm.sum / arm.n;
  if (arm.n < 2) return { mean, variance: 1, n: arm.n, se: 1 };
  const variance = Math.max(0.01, (arm.sumsq - (arm.sum * arm.sum) / arm.n) / (arm.n - 1));
  return { mean, variance, n: arm.n, se: Math.sqrt(variance / arm.n) };
}

/**
 * UCB1-Normal score. Brazos sin datos reciben +Infinity (exploración
 * forzada) hasta tener ≥ 2 observaciones. `c` controla exploración.
 */
export function scoreArm(arm, totalPulls, c = 1.0) {
  if (!arm || arm.n < 2) return Infinity;
  const { mean, variance, n } = armStats(arm);
  const total = Math.max(2, totalPulls);
  const bonus = c * Math.sqrt((16 * variance * Math.log(total - 1)) / n);
  return mean + bonus;
}

/**
 * Selecciona el protocolo ganador entre candidatos.
 * `armsState` es `{ [id]: {n, sum, sumsq} }`.
 * `candidates` es un array de protocolos (objetos con id o n).
 * Devuelve `{ protocol, score, reason, stats }`.
 */
export function selectArm(armsState, candidates, { c = 1.0 } = {}) {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const state = armsState || {};
  const total = Object.values(state).reduce((a, s) => a + (s?.n || 0), 0);
  let best = null;
  let bestScore = -Infinity;
  for (const cand of candidates) {
    const key = cand.id ?? cand.n;
    const arm = state[key];
    const score = scoreArm(arm, total, c);
    if (score > bestScore) {
      bestScore = score;
      best = cand;
    }
  }
  const key = best?.id ?? best?.n;
  const arm = state[key];
  const stats = armStats(arm);
  const isExplore = !arm || arm.n < 2;
  return {
    protocol: best,
    score: bestScore,
    reason: isExplore ? "explorando — pocas observaciones" : "mejor recompensa esperada",
    stats,
  };
}

/**
 * Intervalo de confianza 90% (aproximado con t de Student ~ 1.86 para df≥8)
 * sobre la media del brazo. Para n<2 devuelve CI ancho (± 2).
 */
export function armCI(arm, confidence = 0.9) {
  const { mean, n, se } = armStats(arm);
  if (n < 2) return { mean, lower: mean - 2, upper: mean + 2, n, width: 4 };
  const t = confidence >= 0.95 ? 2.26 : confidence >= 0.9 ? 1.86 : 1.29;
  const half = t * se;
  return {
    mean: +mean.toFixed(2),
    lower: +(mean - half).toFixed(2),
    upper: +(mean + half).toFixed(2),
    n,
    width: +(2 * half).toFixed(2),
  };
}

/**
 * Snapshot legible para UI/debug: top-k brazos por media con CI.
 */
export function topArms(armsState, k = 3) {
  const entries = Object.entries(armsState || {}).filter(([, a]) => a?.n >= 2);
  return entries
    .map(([id, a]) => ({ id, ...armCI(a) }))
    .sort((a, b) => b.mean - a.mean)
    .slice(0, k);
}
