/* ═══════════════════════════════════════════════════════════════
   OPTIMAL WINDOW — ventana de mayor receptividad por hora del día.
   ───────────────────────────────────────────────────────────────
   No es el cronotipo declarado: aprende de datos OBSERVADOS. Para cada
   franja de 2h del día, promedia la "responsividad" de las sesiones
   completadas en esa franja y encuentra la ventana donde el usuario
   responde mejor (y la peor).

   Responsividad por sesión = señal densa post-sesión que SÍ existe en
   cada entrada de history: calidad bio (bioQ) + coherencia (c). ΔRMSSD
   se incorpora cuando está presente en la entrada (forward-compat; hoy
   es transitorio). Función pura, testeable sin render.

   Robustez ante datos escasos: shrinkage empírico-Bayes hacia la media
   global (una franja con 1 sola sesión no gana por azar). La ventana
   "mejor" exige soporte mínimo (minBucketN). Cold-start honesto: si hay
   pocas sesiones, available=false con cuántas faltan.
   ═══════════════════════════════════════════════════════════════ */

const BUCKET_H = 2; // franjas de 2h → 12 franjas
const N_BUCKETS = 24 / BUCKET_H;

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const pad2 = (n) => String(n).padStart(2, "0");

/** Etiqueta "10:00–12:00" para una franja que arranca en hourStart. */
export function windowLabel(hourStart) {
  return `${pad2(hourStart)}:00–${pad2((hourStart + BUCKET_H) % 24)}:00`;
}

/** Parte del día en lenguaje natural (sin jerga). */
export function partOfDay(hour) {
  if (hour >= 5 && hour < 12) return "la mañana";
  if (hour >= 12 && hour < 18) return "la tarde";
  if (hour >= 18 && hour < 22) return "la noche";
  return "la madrugada";
}

/**
 * Responsividad [0,1] de una sesión a partir de señales densas.
 * Devuelve null si la sesión no es utilizable (inválida o sin señal).
 */
export function responsivenessOf(h) {
  if (!h || h.quality === "inválida") return null;
  const bioQ = Number(h.bioQ);
  const c = Number(h.c);
  const hasBio = Number.isFinite(bioQ);
  const hasC = Number.isFinite(c);
  let r;
  if (hasBio && hasC) r = 0.6 * (bioQ / 100) + 0.4 * (c / 100);
  else if (hasBio) r = bioQ / 100;
  else if (hasC) r = c / 100;
  else return null;
  r = clamp01(r);
  // ΔRMSSD forward-compat: si la entrada lo persiste, lo mezclamos suave
  // (un lift vagal positivo sube la responsividad observada).
  const d = Number(h.deltaRmssd);
  if (Number.isFinite(d)) {
    const dNorm = clamp01(0.5 + d / 40); // ±20ms → [0,1] alrededor de 0.5
    r = clamp01(0.75 * r + 0.25 * dNorm);
  }
  return r;
}

/**
 * @param {Array} history — entradas de sesión (con ts, bioQ, c, ...)
 * @param {object} [opts]
 * @param {number} [opts.now=Date.now()]
 * @param {number} [opts.minSessions=12] — mínimo total para activar
 * @param {number} [opts.minBucketN=2]   — soporte mínimo de la franja ganadora
 * @param {number} [opts.shrinkK=3]      — fuerza del shrinkage hacia media global
 */
export function buildOptimalWindow(history, opts = {}) {
  const now = opts.now ?? Date.now();
  const minSessions = opts.minSessions ?? 12;
  const minBucketN = opts.minBucketN ?? 2;
  const shrinkK = opts.shrinkK ?? 3;

  const buckets = Array.from({ length: N_BUCKETS }, (_, i) => ({
    hourStart: i * BUCKET_H,
    sum: 0,
    n: 0,
  }));

  let usable = 0;
  let globalSum = 0;
  for (const h of history || []) {
    const ts = Number(h?.ts);
    if (!Number.isFinite(ts)) continue;
    const r = responsivenessOf(h);
    if (r === null) continue;
    const hour = new Date(ts).getHours();
    const bi = Math.floor(hour / BUCKET_H) % N_BUCKETS;
    buckets[bi].sum += r;
    buckets[bi].n += 1;
    globalSum += r;
    usable += 1;
  }

  const maturity = { sessions: usable, needed: minSessions, ready: usable >= minSessions };

  if (usable === 0) {
    return { available: false, reason: "Sin sesiones utilizables todavía.", maturity, profile: [] };
  }

  const globalMean = globalSum / usable;

  // shrinkage empírico-Bayes hacia la media global.
  const rated = buckets.map((b) => {
    const mean = b.n > 0 ? b.sum / b.n : null;
    const shrunk = (b.sum + shrinkK * globalMean) / (b.n + shrinkK);
    return { hourStart: b.hourStart, hour: b.hourStart, n: b.n, mean, shrunk };
  });

  const maxShrunk = Math.max(...rated.map((b) => b.shrunk));
  const minShrunk = Math.min(...rated.map((b) => b.shrunk));
  const span = Math.max(1e-6, maxShrunk - minShrunk);
  const profile = rated.map((b) => ({
    ...b,
    label: windowLabel(b.hourStart),
    // nivel 0-4 relativo (para visualización tipo intensidad)
    level: b.n === 0 ? 0 : Math.round(((b.shrunk - minShrunk) / span) * 4),
  }));

  // candidatas con soporte real para "mejor/peor"
  const supported = profile.filter((b) => b.n >= minBucketN);
  if (!maturity.ready || supported.length < 2) {
    const remaining = Math.max(0, minSessions - usable);
    return {
      available: false,
      reason: remaining > 0
        ? `Tu mejor ventana se está formando — faltan ${remaining} sesiones.`
        : "Aún sin suficiente variedad de horarios para comparar.",
      maturity,
      profile,
    };
  }

  const byShrunkDesc = supported.slice().sort((a, b) => b.shrunk - a.shrunk);
  const best = byShrunkDesc[0];
  const worst = byShrunkDesc[byShrunkDesc.length - 1];

  const headline = `Respondes mejor en ${partOfDay(best.hourStart)}, entre las ${pad2(best.hourStart)}:00 y las ${pad2((best.hourStart + BUCKET_H) % 24)}:00.`;

  return {
    available: true,
    maturity,
    best: {
      hour: best.hourStart,
      hourStart: best.hourStart,
      hourEnd: (best.hourStart + BUCKET_H) % 24,
      label: best.label,
      n: best.n,
      score: Math.round(best.shrunk * 1000) / 1000,
    },
    worst: {
      hour: worst.hourStart,
      hourStart: worst.hourStart,
      label: worst.label,
      n: worst.n,
      score: Math.round(worst.shrunk * 1000) / 1000,
    },
    profile,
    headline,
    nextWindowMinutes: minutesUntilHour(best.hourStart, now),
  };
}

/** Minutos desde `now` hasta la próxima ocurrencia de la hora `hourStart`. */
export function minutesUntilHour(hourStart, now = Date.now()) {
  const d = new Date(now);
  const target = new Date(now);
  target.setHours(hourStart, 0, 0, 0);
  if (target.getTime() <= d.getTime()) target.setDate(target.getDate() + 1);
  return Math.round((target.getTime() - d.getTime()) / 60000);
}
