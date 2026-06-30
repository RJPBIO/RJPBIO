/* ═══════════════════════════════════════════════════════════════
   READINESS INDEX — % hacia TU mejor estado autonómico personal.
   ───────────────────────────────────────────────────────────────
   Complementa al gemelo autonómico: el gemelo compara vs tu NORMA; este
   índice compara vs tu PICO. Da un número de capacidad ("estás al 71%")
   anclado a TU propia distribución, no a una población.

   HONESTIDAD (importante): mide la posición de tu estado autonómico
   (lnRMSSD) entre tu piso y tu techo personales. Es un proxy de
   disposición para sostener carga cognitiva exigente — NO una predicción
   validada de la calidad de tus decisiones. La PWA no mide interoceptive
   accuracy; el copy no debe prometer eso.

   Modelo: percentiles de la propia historia (p20 = piso, p85 = pico).
   Función pura, on-device, sin dependencias.
   ═══════════════════════════════════════════════════════════════ */

const MIN_READINGS = 12;
const FLOOR_PCT = 0.2;
const PEAK_PCT = 0.85;
const RECENT_HRS = 36;

const tsOf = (e) => {
  const raw = e?.ts;
  return typeof raw === "number" ? raw : raw ? new Date(raw).getTime() : NaN;
};
const lnOf = (e) => {
  if (Number.isFinite(e?.lnRmssd)) return e.lnRmssd;
  const r = Number(e?.rmssd);
  return Number.isFinite(r) && r > 0 ? Math.log(r) : NaN;
};

/** Percentil con interpolación lineal sobre un array ascendente. */
export function percentile(sortedAsc, p) {
  const n = sortedAsc.length;
  if (n === 0) return NaN;
  if (n === 1) return sortedAsc[0];
  const idx = p * (n - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedAsc[lo];
  return sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * (idx - lo);
}

function labelFor(pct) {
  if (pct >= 70) return "Disposición alta";
  if (pct >= 40) return "Disposición moderada";
  return "Disposición baja";
}

/**
 * @param {Array} hrvLog — { ts, rmssd, lnRmssd? }
 * @param {object} [opts] — { now }
 */
export function buildReadinessIndex(hrvLog, opts = {}) {
  const now = opts.now ?? Date.now();
  const clean = (hrvLog || [])
    .map((e) => ({ ts: tsOf(e), ln: lnOf(e), rmssd: Number(e?.rmssd) }))
    .filter((e) => Number.isFinite(e.ts) && Number.isFinite(e.ln) && e.ts <= now);

  const readings = clean.length;
  const maturity = { readings, needed: MIN_READINGS, ready: readings >= MIN_READINGS };

  if (!maturity.ready) {
    const remaining = Math.max(0, MIN_READINGS - readings);
    return {
      available: false,
      reason: `Calibrando tu rango personal — ${remaining} ${remaining === 1 ? "medición" : "mediciones"} más.`,
      maturity,
    };
  }

  const sortedLn = clean.map((e) => e.ln).sort((a, b) => a - b);
  const floor = percentile(sortedLn, FLOOR_PCT);
  const peak = percentile(sortedLn, PEAK_PCT);
  const range = peak - floor;

  // Lectura reciente (≈hoy) → posición entre piso y pico.
  const sortedByTs = clean.slice().sort((a, b) => a.ts - b.ts);
  const last = sortedByTs[sortedByTs.length - 1];
  const isRecent = (now - last.ts) / 3_600_000 <= RECENT_HRS;

  const peakRmssd = Math.round(Math.exp(peak) * 10) / 10;

  if (!isRecent || range <= 1e-6) {
    return {
      available: true,
      maturity,
      readiness: null,
      peakRmssd,
      headline: `Tu mejor estado ronda ~${peakRmssd} ms. Mide tu HRV para ver tu disposición de hoy.`,
    };
  }

  const ratio = (last.ln - floor) / range;
  const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)));
  const label = labelFor(pct);

  const headline =
    pct >= 70
      ? `Estás al ${pct}% de tu mejor estado — buena ventana para tareas exigentes.`
      : pct >= 40
      ? `Estás al ${pct}% de tu mejor estado — capacidad moderada hoy.`
      : `Estás al ${pct}% de tu mejor estado — prioriza recuperar antes de exigir.`;

  return {
    available: true,
    maturity,
    readiness: {
      pct,
      label,
      currentRmssd: Math.round(last.rmssd * 10) / 10,
      peakRmssd,
    },
    peakRmssd,
    headline,
  };
}
