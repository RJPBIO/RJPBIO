/* ═══════════════════════════════════════════════════════════════
   AUTONOMIC JOURNAL — la huella fisiológica de tu vida.
   ───────────────────────────────────────────────────────────────
   El usuario marca momentos importantes (una conversación difícil, una
   decisión, una pérdida, un logro) con un contexto. El sistema asocia cada
   momento con tus lecturas HRV cercanas y, con el tiempo, revela qué
   contextos/personas/actividades coinciden con tus mejores y peores
   estados autonómicos. Todo local.

   HONESTIDAD: con HRV de spot, un momento solo tiene "huella" si mediste
   cerca de él. Esta lib asocia la lectura MÁS CERCANA dentro de una
   ventana (±windowHours) — no inventa un valor si no hay lectura. La
   captura continua (huella de cada momento sin medir) es wearable.

   Función pura, on-device, sin dependencias.
   ═══════════════════════════════════════════════════════════════ */

// Contextos curados (neutrales) para agregar la huella por tipo de momento.
export const JOURNAL_CONTEXTS = Object.freeze([
  { id: "pareja", label: "Pareja" },
  { id: "familia", label: "Familia" },
  { id: "trabajo", label: "Trabajo" },
  { id: "decision", label: "Decisión" },
  { id: "social", label: "Social" },
  { id: "salud", label: "Salud" },
  { id: "logro", label: "Logro" },
  { id: "perdida", label: "Pérdida" },
  { id: "soledad", label: "Tiempo a solas" },
]);

const CONTEXT_LABEL = Object.fromEntries(JOURNAL_CONTEXTS.map((c) => [c.id, c.label]));

const WINDOW_HOURS = 8;
const MIN_CTX_EVENTS = 2;

const tsOf = (e) => {
  const raw = e?.ts;
  return typeof raw === "number" ? raw : raw ? new Date(raw).getTime() : NaN;
};
const lnOf = (e) => {
  if (Number.isFinite(e?.lnRmssd)) return e.lnRmssd;
  const r = Number(e?.rmssd);
  return Number.isFinite(r) && r > 0 ? Math.log(r) : NaN;
};
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
function stdev(xs) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
}

/**
 * @param {Array} events — { id, ts, label, context, valence? }
 * @param {Array} hrvLog — { ts, rmssd, lnRmssd? }
 * @param {object} [opts] — { now, windowHours }
 */
export function buildAutonomicJournal(events, hrvLog, opts = {}) {
  const now = opts.now ?? Date.now();
  const windowMs = (opts.windowHours ?? WINDOW_HOURS) * 3_600_000;

  const hrv = (hrvLog || [])
    .map((e) => ({ ts: tsOf(e), ln: lnOf(e), rmssd: Number(e?.rmssd) }))
    .filter((e) => Number.isFinite(e.ts) && Number.isFinite(e.ln));

  // Baseline personal para z-score de la huella.
  const lns = hrv.map((e) => e.ln);
  const baseMean = lns.length ? mean(lns) : null;
  const baseSd = stdev(lns) || 0.01;

  const evs = (events || [])
    .map((ev) => ({ ...ev, _ts: tsOf(ev) }))
    .filter((ev) => Number.isFinite(ev._ts) && ev._ts <= now)
    .sort((a, b) => b._ts - a._ts); // recientes primero

  const entries = evs.map((ev) => {
    // Lectura HRV más cercana dentro de la ventana.
    let nearest = null;
    let bestDiff = Infinity;
    for (const r of hrv) {
      const diff = Math.abs(r.ts - ev._ts);
      if (diff <= windowMs && diff < bestDiff) {
        bestDiff = diff;
        nearest = r;
      }
    }
    const autonomic = nearest
      ? {
          ts: nearest.ts,
          rmssd: Math.round(nearest.rmssd * 10) / 10,
          lnRmssd: Math.round(nearest.ln * 1000) / 1000,
          z: baseMean != null ? Math.round(((nearest.ln - baseMean) / baseSd) * 100) / 100 : null,
          hoursFromEvent: Math.round((bestDiff / 3_600_000) * 10) / 10,
        }
      : null;
    return {
      id: ev.id,
      ts: ev._ts,
      label: ev.label || "",
      context: ev.context || null,
      contextLabel: CONTEXT_LABEL[ev.context] || null,
      valence: typeof ev.valence === "number" ? ev.valence : null,
      autonomic,
    };
  });

  // Agregación por contexto (solo eventos con lectura asociada).
  const byCtxMap = {};
  for (const e of entries) {
    if (!e.autonomic || !e.context) continue;
    (byCtxMap[e.context] = byCtxMap[e.context] || []).push(e.autonomic.lnRmssd);
  }
  const byContext = Object.entries(byCtxMap)
    .filter(([, arr]) => arr.length >= MIN_CTX_EVENTS)
    .map(([context, arr]) => ({
      context,
      contextLabel: CONTEXT_LABEL[context] || context,
      n: arr.length,
      meanRmssd: Math.round(Math.exp(mean(arr)) * 10) / 10,
      meanZ: baseMean != null ? Math.round(((mean(arr) - baseMean) / baseSd) * 100) / 100 : null,
    }))
    .sort((a, b) => b.meanRmssd - a.meanRmssd);

  const withReading = entries.filter((e) => e.autonomic).length;
  const best = byContext.length >= 1 ? byContext[0] : null;
  const worst = byContext.length >= 2 ? byContext[byContext.length - 1] : null;

  let insight = null;
  if (best && worst && best.context !== worst.context) {
    insight = `Tus mejores estados coinciden con ${best.contextLabel}; los más bajos con ${worst.contextLabel}.`;
  }

  return {
    entries,
    byContext,
    best,
    worst,
    insight,
    coverage: { total: entries.length, withReading },
  };
}
