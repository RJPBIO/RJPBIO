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

// Sprint 47 — time-based decay (calendario, no observaciones).
// Maneja el caso donde el usuario se queda inactivo y el bandit se
// queda anclado a preferencias viejas que ya no aplican. Mientras
// observation-decay (0.97) opera al actualizar, time-decay opera
// LAZY-ON-READ: cuando se lee la arm, se aplica decay según el
// elapsed time desde lastUpdatedAt.
const DEFAULT_TIME_HALF_LIFE_DAYS = 30;
const DEFAULT_TIME_DECAY_FLOOR = 0.10;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Calcula el factor de decay temporal para una arm dado un timestamp
 * de referencia (now). Retorna 1.0 cuando arm es fresh o sin
 * lastUpdatedAt (backwards compat con arms pre-Sprint-47).
 *
 * @param {object} arm - debe tener lastUpdatedAt opcional
 * @param {number} now - ms epoch de referencia
 * @param {number} [halfLifeDays] - default 30
 * @param {number} [floor] - factor mínimo (default 0.10)
 * @returns {number} factor ∈ [floor, 1]
 */
export function timeDecayFactor(arm, now = Date.now(), {
  halfLifeDays = DEFAULT_TIME_HALF_LIFE_DAYS,
  floor = DEFAULT_TIME_DECAY_FLOOR,
} = {}) {
  if (!arm || typeof arm.lastUpdatedAt !== "number") return 1;
  const days = Math.max(0, (now - arm.lastUpdatedAt) / DAY_MS);
  if (days === 0) return 1;
  // Decay exponencial: f(d) = 0.5 ^ (d / halfLifeDays)
  const f = Math.pow(0.5, days / halfLifeDays);
  return Math.max(floor, Math.min(1, f));
}

/**
 * Devuelve una copia decayada por tiempo. Útil para snapshots/UI.
 * El arm original NO se muta. Si no hay lastUpdatedAt, retorna copia
 * shallow sin cambios numéricos.
 */
export function decayByTime(arm, now = Date.now(), opts = {}) {
  if (!arm) return arm;
  const f = timeDecayFactor(arm, now, opts);
  if (f === 1) return { ...arm };
  return {
    n: (arm.n || 0) * f,
    sum: (arm.sum || 0) * f,
    sumsq: (arm.sumsq || 0) * f,
    lastUpdatedAt: arm.lastUpdatedAt,
  };
}

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
 *
 * Sprint 47: si se pasa `now`, también se guarda lastUpdatedAt para
 * que time-based decay pueda calcularse en lecturas futuras. También
 * aplica time-decay a los datos del arm previo ANTES de añadir la
 * nueva observación (evita que un arm vieja repentinamente "vuelva
 * a la vida" al recibir una nueva obs sin que pase su penalty).
 *
 * Backwards compat: sin `now`, comportamiento idéntico a antes.
 */
export function updateArm(arm, observation, {
  decay = DEFAULT_DECAY,
  now = null,
  timeDecay = true,
  halfLifeDays = DEFAULT_TIME_HALF_LIFE_DAYS,
} = {}) {
  const x = Number(observation);
  if (!Number.isFinite(x)) return arm || { n: 0, sum: 0, sumsq: 0 };
  // Si se pasa now y el arm tiene lastUpdatedAt, primero aplicar time-decay.
  let prev = arm || { n: 0, sum: 0, sumsq: 0 };
  if (now !== null && timeDecay && arm?.lastUpdatedAt) {
    prev = decayByTime(arm, now, { halfLifeDays });
  }
  const d = Math.min(1, Math.max(0, decay));
  const next = {
    n: prev.n * d + 1,
    sum: prev.sum * d + x,
    sumsq: prev.sumsq * d + x * x,
  };
  if (now !== null) next.lastUpdatedAt = now;
  return next;
}

/**
 * Estadísticos del brazo con prior poblacional (media, varianza, n, se).
 *
 * Sprint 47: si se pasa `now` y `timeDecay: true`, aplica decay temporal
 * lazy-on-read antes de calcular stats. Backwards compat: sin estos
 * params, comportamiento idéntico a versiones previas.
 */
export function armStats(arm, {
  priorMean = PRIOR_MEAN,
  priorN = PRIOR_N_VIRTUAL,
  now = null,
  timeDecay = false,
  halfLifeDays = DEFAULT_TIME_HALF_LIFE_DAYS,
} = {}) {
  const effective = (now !== null && timeDecay && arm?.lastUpdatedAt)
    ? decayByTime(arm, now, { halfLifeDays })
    : arm;
  const n0 = effective?.n || 0;
  const sum0 = effective?.sum || 0;
  const sumsq0 = effective?.sumsq || 0;
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
 *
 * Sprint 47: cuarto param opcional `{now, timeDecay, halfLifeDays}` para
 * aplicar time-based decay sobre la arm antes de calcular el score.
 */
export function scoreArm(arm, totalPulls, c = 1.0, statsOpts = {}) {
  const { mean, variance, n } = armStats(arm, statsOpts);
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

/**
 * Recompensa compuesta del bandit. Mood es el canal primario; energía y
 * HRV (lnRMSSD) aportan señal secundaria cuando están disponibles. El
 * completionRatio castiga sesiones abandonadas (señal de que el protocolo
 * no es viable en este contexto, incluso si cuando se completa es bueno).
 *
 * Pesos defendibles:
 *   - mood  : 1.0 (primario, escala Likert ±4)
 *   - energy: 0.3 (escala 1-3 → ±2, así que aporta ≤ ±0.6)
 *   - HRV   : 1.5 sobre Δ lnRMSSD (~±0.3 típico post-respiración lenta)
 *   - completionRatio=1 → factor 1; 0.5 → 0.75; 0 → 0.5 (no anula)
 */
export function compositeReward({
  moodDelta,
  energyDelta = null,
  hrvDeltaLnRmssd = null,
  completionRatio = 1,
} = {}) {
  const m = Number(moodDelta);
  if (!Number.isFinite(m)) return null;
  let r = m;
  if (typeof energyDelta === "number" && Number.isFinite(energyDelta)) {
    r += 0.3 * energyDelta;
  }
  if (typeof hrvDeltaLnRmssd === "number" && Number.isFinite(hrvDeltaLnRmssd)) {
    r += 1.5 * hrvDeltaLnRmssd;
  }
  const ratio = Math.max(0, Math.min(1, Number.isFinite(completionRatio) ? completionRatio : 1));
  return +(r * (0.5 + 0.5 * ratio)).toFixed(3);
}

/** Snapshot para UI/debug: top-k brazos por media con CI. */
export function topArms(armsState, k = 3) {
  const entries = Object.entries(armsState || {}).filter(([, a]) => a?.n >= 2);
  return entries
    .map(([id, a]) => ({ id, ...armCI(a) }))
    .sort((a, b) => b.mean - a.mean)
    .slice(0, k);
}
