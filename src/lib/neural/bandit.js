/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — Protocol bandit (UCB1-Normal, contextual)
   Selección online de protocolo con exploración/explotación.

   Cada brazo es una combinación `{intent, timeBucket}` con estadísticas
   incrementales de la recompensa observada (Δmood = mood_post − mood_pre).

   Mejoras vs v1:
     - Decay exponencial: las observaciones viejas pesan menos, para
       que el modelo se adapte si el usuario cambia de rutina (ventana
       efectiva ~1/(1-decay) observaciones).
     - Prior poblacional: brazos nuevos arrancan con una media positiva
       pequeña (+0.3) y n_virtual=1 para que cold-start no sea aleatorio.
     - Llaves contextuales: `armKey(intent, bucket)` → "calma:morning".
       El motor elige el brazo del bucket actual.

   Referencias:
     - Auer, Cesa-Bianchi, Fischer 2002 — UCB1.
     - Garivier & Moulines 2008 — UCB con discounting para
       entornos no-estacionarios.
   ═══════════════════════════════════════════════════════════════ */

const PRIOR_MEAN = 0.3;       // Δmood esperado optimista moderado
const PRIOR_N_VIRTUAL = 1;    // fuerza del prior (equivale a 1 obs)
const DEFAULT_DECAY = 0.97;   // ~33 observaciones de vida media

/** Llave contextual del brazo: intent + bucket temporal. */
export function armKey(intent, bucket = null) {
  return bucket ? `${intent}:${bucket}` : `${intent}`;
}

/** Bucket horario para el contexto del bandit (4 ventanas). */
export function timeBucket(date = new Date()) {
  const h = (date instanceof Date ? date : new Date(date)).getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 22) return "evening";
  return "night";
}

/**
 * Actualiza el brazo con una nueva observación (reward) aplicando
 * decay exponencial para dar más peso a observaciones recientes.
 */
export function updateArm(arm, observation, { decay = DEFAULT_DECAY } = {}) {
  const x = Number(observation);
  if (!Number.isFinite(x)) return arm || { n: 0, sum: 0, sumsq: 0 };
  const prev = arm || { n: 0, sum: 0, sumsq: 0 };
  const d = Math.min(1, Math.max(0, decay));
  return {
    n: prev.n * d + 1,
    sum: prev.sum * d + x,
    sumsq: prev.sumsq * d + x * x,
  };
}

/** Estadísticos del brazo con prior poblacional (media, varianza, n, se). */
export function armStats(arm, { priorMean = PRIOR_MEAN, priorN = PRIOR_N_VIRTUAL } = {}) {
  const n0 = arm?.n || 0;
  const sum0 = arm?.sum || 0;
  const sumsq0 = arm?.sumsq || 0;
  // Fusión con prior: n_eff = n + priorN, sum_eff = sum + priorN * priorMean
  const n = n0 + priorN;
  const sum = sum0 + priorN * priorMean;
  const sumsq = sumsq0 + priorN * priorMean * priorMean;
  const mean = sum / n;
  if (n < 2) return { mean, variance: 1, n, se: 1 };
  const variance = Math.max(0.01, (sumsq - (sum * sum) / n) / Math.max(1, n - 1));
  return { mean, variance, n, se: Math.sqrt(variance / n) };
}

/**
 * UCB1-Normal score. Con prior, todos los brazos tienen al menos
 * n_virtual observaciones, así que nunca devuelve +Infinity.
 */
export function scoreArm(arm, totalPulls, c = 1.0) {
  const { mean, variance, n } = armStats(arm);
  // Total efectivo incluye el prior para evitar log(0) o log negativo.
  const total = Math.max(2, totalPulls + PRIOR_N_VIRTUAL);
  const bonus = c * Math.sqrt((16 * variance * Math.log(total - 1)) / Math.max(1, n));
  return mean + bonus;
}

/**
 * Selecciona el brazo ganador entre candidatos. Si se pasa `bucket`,
 * busca brazos contextuales `intent:bucket`; si no, por `intent`.
 */
export function selectArm(armsState, candidates, { c = 1.0, bucket = null } = {}) {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const state = armsState || {};
  const total = Object.values(state).reduce((a, s) => a + (s?.n || 0), 0);
  let best = null;
  let bestScore = -Infinity;
  for (const cand of candidates) {
    const intent = cand.int ?? cand.id ?? cand.n;
    const key = armKey(intent, bucket);
    const arm = state[key] || state[intent] || null; // fallback a llave sin bucket
    const score = scoreArm(arm, total, c);
    if (score > bestScore) {
      bestScore = score;
      best = cand;
    }
  }
  const intent = best?.int ?? best?.id ?? best?.n;
  const key = armKey(intent, bucket);
  const arm = state[key] || state[intent] || null;
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
 * Intervalo de confianza 90% (t-Student ~ 1.86) sobre la media del brazo.
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
    n: +n.toFixed(2),
    width: +(2 * half).toFixed(2),
  };
}

/** Snapshot para UI/debug: top-k brazos por media con CI. */
export function topArms(armsState, k = 3) {
  const entries = Object.entries(armsState || {}).filter(([, a]) => a?.n >= 2);
  return entries
    .map(([id, a]) => ({ id, ...armCI(a) }))
    .sort((a, b) => b.mean - a.mean)
    .slice(0, k);
}
