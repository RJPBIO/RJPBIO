/* ═══════════════════════════════════════════════════════════════
   BURNOUT EARLY-WARNING ENGINE
   ───────────────────────────────────────────────────────────────
   Detecta señales tempranas de agotamiento laboral combinando 3
   de las 4 dimensiones del Maslach Burnout Inventory (Maslach &
   Jackson 1981) que se pueden derivar de sesiones de ignición:

     - Agotamiento emocional  → tendencia descendente de pre-mood
     - Despersonalización     → caída de frecuencia de sesiones
     - Realización personal   → efectividad decreciente (Δmood, Δcoh)

   No pretende diagnosticar — solo escalar lo que ya es observable
   en los datos a un semáforo accionable (ok | watch | warn | alert).

   Uso individual: autoseñal para el propio usuario (autonomía sobre
   sus datos). Uso colectivo: SIEMPRE pasar por anonymize() con k≥5
   y nunca exponer nombre o id en dashboards de manager — es ilegal
   bajo LFPDPPP / GDPR art. 9 (salud mental = dato sensible).

   Referencias:
   - Maslach C, Jackson SE (1981). The Maslach Burnout Inventory.
     Journal of Occupational Behavior, 2(2), 99-113.
   - WHO ICD-11 QD85: Burnout como "fenómeno ocupacional", no
     condición médica. Por eso salida = semáforo, no diagnóstico.
   ═══════════════════════════════════════════════════════════════ */

export const BURNOUT_LEVELS = Object.freeze({
  OK: "ok",
  WATCH: "watch",
  WARN: "warn",
  ALERT: "alert",
});

export const BURNOUT_DEFAULTS = Object.freeze({
  minSessions: 10,            // umbral mínimo para emitir lectura
  baselineDays: 28,           // ventana baseline (inicio del periodo)
  recentDays: 7,              // ventana reciente para comparar
  freqDropWatch: 0.25,        // -25% frecuencia → watch
  freqDropWarn: 0.50,         // -50% → warn
  moodSlopeWatch: -0.15,      // pendiente pre-mood (1..10) por semana
  moodSlopeWarn: -0.35,
  effectivenessDropWatch: 0.30,
  effectivenessDropWarn: 0.55,
});

/**
 * Regresión lineal simple (pendiente en unidades-y por unidad-x).
 * x en días desde el primer punto, y es el valor a ajustar.
 */
function slope(points) {
  if (points.length < 3) return 0;
  const n = points.length;
  const mx = points.reduce((a, p) => a + p.x, 0) / n;
  const my = points.reduce((a, p) => a + p.y, 0) / n;
  let num = 0, den = 0;
  for (const p of points) {
    num += (p.x - mx) * (p.y - my);
    den += (p.x - mx) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

function avg(nums) {
  const v = nums.filter((x) => typeof x === "number" && isFinite(x));
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

/**
 * @param {Array<{completedAt:Date|string,pre?:number,mood?:number,coherenciaDelta?:number}>} sessions
 * @param {object} [opts]
 * @returns {{level:string, signals:string[], metrics:object, insufficient?:boolean, n:number}}
 */
export function assessBurnout(sessions, opts = {}) {
  const cfg = { ...BURNOUT_DEFAULTS, ...opts };
  const now = opts.now ? new Date(opts.now).getTime() : Date.now();

  const safe = (Array.isArray(sessions) ? sessions : [])
    .map((s) => ({ ...s, t: new Date(s.completedAt).getTime() }))
    .filter((s) => Number.isFinite(s.t))
    .sort((a, b) => a.t - b.t);

  if (safe.length < cfg.minSessions) {
    return { level: BURNOUT_LEVELS.OK, signals: [], insufficient: true, n: safe.length, metrics: {} };
  }

  const baselineCut = now - cfg.baselineDays * 86400_000;
  const recentCut = now - cfg.recentDays * 86400_000;
  const baselineSessions = safe.filter((s) => s.t >= baselineCut && s.t < recentCut);
  const recentSessions = safe.filter((s) => s.t >= recentCut);

  // --- Señal 1: frecuencia ---
  const baselineFreq = baselineSessions.length / Math.max(1, cfg.baselineDays - cfg.recentDays);
  const recentFreq = recentSessions.length / Math.max(1, cfg.recentDays);
  const freqDrop = baselineFreq > 0 ? Math.max(0, 1 - recentFreq / baselineFreq) : 0;

  // --- Señal 2: pre-mood slope (agotamiento emocional) ---
  const moodPoints = safe
    .filter((s) => typeof s.pre === "number")
    .map((s) => ({ x: (s.t - safe[0].t) / 86400_000, y: s.pre }));
  const moodSlopePerDay = slope(moodPoints);
  const moodSlopePerWeek = moodSlopePerDay * 7;

  // --- Señal 3: efectividad (Δmood + Δcoherencia) ---
  const effect = (s) => {
    const dm = typeof s.mood === "number" && typeof s.pre === "number" ? s.mood - s.pre : null;
    const dc = typeof s.coherenciaDelta === "number" ? s.coherenciaDelta : null;
    if (dm == null && dc == null) return null;
    // Normalización: dm en escala 1..10 → /10; dc en 0..100 → /100.
    const dmN = dm == null ? null : dm / 10;
    const dcN = dc == null ? null : dc / 100;
    const parts = [dmN, dcN].filter((x) => x != null);
    return parts.reduce((a, b) => a + b, 0) / parts.length;
  };
  const baseEff = avg(baselineSessions.map(effect));
  const recentEff = avg(recentSessions.map(effect));
  const effDrop = (baseEff != null && recentEff != null && baseEff > 0)
    ? Math.max(0, 1 - recentEff / baseEff)
    : 0;

  const signals = [];
  let level = BURNOUT_LEVELS.OK;
  const bump = (l) => {
    const order = ["ok", "watch", "warn", "alert"];
    if (order.indexOf(l) > order.indexOf(level)) level = l;
  };

  if (freqDrop >= cfg.freqDropWarn) { signals.push("frecuencia -50%"); bump(BURNOUT_LEVELS.WARN); }
  else if (freqDrop >= cfg.freqDropWatch) { signals.push("frecuencia -25%"); bump(BURNOUT_LEVELS.WATCH); }

  if (moodSlopePerWeek <= cfg.moodSlopeWarn) { signals.push("pre-mood descendente fuerte"); bump(BURNOUT_LEVELS.WARN); }
  else if (moodSlopePerWeek <= cfg.moodSlopeWatch) { signals.push("pre-mood descendente"); bump(BURNOUT_LEVELS.WATCH); }

  if (effDrop >= cfg.effectivenessDropWarn) { signals.push("efectividad -55%"); bump(BURNOUT_LEVELS.WARN); }
  else if (effDrop >= cfg.effectivenessDropWatch) { signals.push("efectividad -30%"); bump(BURNOUT_LEVELS.WATCH); }

  // 2+ señales en WARN → ALERT
  const warnSignals = signals.filter((s) => /-50%|descendente fuerte|-55%/.test(s)).length;
  if (warnSignals >= 2) level = BURNOUT_LEVELS.ALERT;

  return {
    level,
    signals,
    n: safe.length,
    metrics: {
      baselineFreqPerDay: +baselineFreq.toFixed(3),
      recentFreqPerDay: +recentFreq.toFixed(3),
      freqDrop: +freqDrop.toFixed(3),
      moodSlopePerWeek: +moodSlopePerWeek.toFixed(3),
      baselineEffectiveness: baseEff != null ? +baseEff.toFixed(3) : null,
      recentEffectiveness: recentEff != null ? +recentEff.toFixed(3) : null,
      effectivenessDrop: +effDrop.toFixed(3),
    },
  };
}

/** Texto corto accionable por nivel. UX gentle: nunca diagnóstico. */
export function burnoutCopy(level) {
  switch (level) {
    case BURNOUT_LEVELS.ALERT:
      return {
        title: "Señales consistentes de agotamiento",
        body: "Tu patrón reciente combina menos sesiones, menor estado inicial y menor efectividad. Considera pausar, hablar con tu manager o un profesional. Tu organización puede conectarte con apoyo — lo activamos sin compartir detalles.",
      };
    case BURNOUT_LEVELS.WARN:
      return {
        title: "Tu ritmo está cambiando",
        body: "Los últimos días muestran una caída notable. Prueba protocolos de reset (3-5 min) 2× al día durante 1 semana y observa.",
      };
    case BURNOUT_LEVELS.WATCH:
      return {
        title: "Señal suave, no urgente",
        body: "Pequeña tendencia. Mantén tu rutina y vuelve a revisar en 7 días.",
      };
    default:
      return { title: "Sin señales", body: "Tu patrón se ve estable." };
  }
}
