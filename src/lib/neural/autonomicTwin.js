/* ═══════════════════════════════════════════════════════════════
   AUTONOMIC TWIN — modelo predictivo PERSONAL (no poblacional).
   ───────────────────────────────────────────────────────────────
   Con el historial HRV del propio usuario, predice cuál DEBERÍA ser su
   estado autonómico hoy y lo compara con su lectura real. La desviación
   contra su PROPIO baseline (no contra una población) es la señal de
   intervención más precisa.

   Modelo ligero a propósito (sin TF.js/LSTM — sobreajustarían con datos
   escasos y pesarían ~1MB). Es estadística robusta, on-device, sobre
   IndexedDB:
     · centro esperado  = EWMA de ln(RMSSD) (half-life 14d, recency-weighted)
     · ajuste por día   = residual medio del día-de-semana de hoy (shrunk)
     · variabilidad     = SD personal de ln(RMSSD) → z-score
     · desviación       = (lectura − esperado) / SD  → above/within/below

   Funciones puras, testeables sin render. ln-scale porque RMSSD es
   log-normal (lo correcto para promediar/varianza).
   ═══════════════════════════════════════════════════════════════ */

const DAY_MS = 86_400_000;
const MIN_READINGS = 10;
const MIN_SPAN_DAYS = 14;
const HALF_LIFE_DAYS = 14;
const MIN_DOW_SAMPLES = 3;
const DOW_SHRINK_K = 3;
const Z_THRESHOLD = 0.7;

const WEEKDAY = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

const tsOf = (e) => {
  const raw = e?.ts;
  return typeof raw === "number" ? raw : raw ? new Date(raw).getTime() : NaN;
};

const lnOf = (e) => {
  if (Number.isFinite(e?.lnRmssd)) return e.lnRmssd;
  const r = Number(e?.rmssd);
  return Number.isFinite(r) && r > 0 ? Math.log(r) : NaN;
};

const round1 = (x) => Math.round(Number(x) * 10) / 10;

function mean(xs) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}
function stdev(xs) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
}

/**
 * @param {Array} hrvLog — entradas {ts, rmssd, lnRmssd?}
 * @param {object} [opts] — { now }
 */
export function buildAutonomicTwin(hrvLog, opts = {}) {
  const now = opts.now ?? Date.now();

  const clean = (hrvLog || [])
    .map((e) => ({ ts: tsOf(e), ln: lnOf(e), rmssd: Number(e?.rmssd) }))
    .filter((e) => Number.isFinite(e.ts) && Number.isFinite(e.ln) && e.ts <= now)
    .sort((a, b) => a.ts - b.ts);

  const readings = clean.length;
  const spanDays = readings >= 2 ? (clean[readings - 1].ts - clean[0].ts) / DAY_MS : 0;
  const ready = readings >= MIN_READINGS && spanDays >= MIN_SPAN_DAYS;
  const maturity = { readings, needed: MIN_READINGS, spanDays: Math.round(spanDays), ready };

  if (!ready) {
    const remaining = Math.max(0, MIN_READINGS - readings);
    return {
      available: false,
      reason:
        remaining > 0
          ? `Tu gemelo se está calibrando — ${remaining} ${remaining === 1 ? "medición" : "mediciones"} más.`
          : "Necesitas mediciones a lo largo de más días para calibrar tu modelo.",
      maturity,
    };
  }

  // Comparación fuera-de-muestra: el modelo predice el esperado de hoy SIN
  // ver la lectura de hoy. Si la última lectura es reciente (~today), se
  // excluye del baseline y se compara contra él.
  const last = clean[readings - 1];
  const recentHrs = (now - last.ts) / 3_600_000;
  const isRecent = recentHrs <= 36;
  const hist = isRecent && readings > 2 ? clean.slice(0, -1) : clean;

  const lns = hist.map((e) => e.ln);
  const overallMean = mean(lns);
  const sd = stdev(lns) || 0.01;

  // Centro esperado: EWMA recency-weighted (half-life 14d).
  let wSum = 0;
  let wxSum = 0;
  for (const e of hist) {
    const ageDays = (now - e.ts) / DAY_MS;
    const w = Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
    wSum += w;
    wxSum += w * e.ln;
  }
  const ewma = wSum > 0 ? wxSum / wSum : overallMean;

  // Ajuste por día-de-semana de HOY: residual medio (vs overall), shrunk.
  const todayDow = new Date(now).getDay();
  const dowResiduals = hist.filter((e) => new Date(e.ts).getDay() === todayDow).map((e) => e.ln - overallMean);
  const dowAdj =
    dowResiduals.length >= MIN_DOW_SAMPLES
      ? dowResiduals.reduce((a, b) => a + b, 0) / (dowResiduals.length + DOW_SHRINK_K)
      : 0;

  const expectedLn = ewma + dowAdj;
  const expectedRmssd = Math.exp(expectedLn);
  const lowRmssd = Math.exp(expectedLn - sd);
  const highRmssd = Math.exp(expectedLn + sd);

  // Tendencia 7d (factor explicativo): media reciente vs previa.
  const last7 = clean.filter((e) => now - e.ts <= 7 * DAY_MS).map((e) => e.ln);
  const prev7 = clean.filter((e) => now - e.ts > 7 * DAY_MS && now - e.ts <= 14 * DAY_MS).map((e) => e.ln);
  const trend7 = last7.length && prev7.length ? mean(last7) - mean(prev7) : null;

  // Desviación de la lectura reciente vs el esperado (fuera-de-muestra).
  let deviation = null;
  if (isRecent) {
    const z = (last.ln - expectedLn) / sd;
    const direction = z <= -Z_THRESHOLD ? "below" : z >= Z_THRESHOLD ? "above" : "within";
    deviation = {
      z: Math.round(z * 100) / 100,
      deltaRmssd: round1(last.rmssd - expectedRmssd),
      direction,
      label:
        direction === "below"
          ? "Por debajo de tu norma"
          : direction === "above"
          ? "Por encima de tu norma"
          : "Dentro de tu rango",
    };
  }

  const factors = [];
  if (dowAdj !== 0) {
    factors.push(`Los ${WEEKDAY[todayDow]} tu HRV suele ser ${dowAdj > 0 ? "más alta" : "más baja"}.`);
  }
  if (trend7 != null && Math.abs(trend7) > 0.05) {
    factors.push(`Tu tendencia de 7 días va ${trend7 > 0 ? "al alza" : "a la baja"}.`);
  }

  let headline;
  if (!deviation) {
    headline = `Tu gemelo espera ~${round1(expectedRmssd)} ms hoy. Mide tu HRV para comparar.`;
  } else if (deviation.direction === "below") {
    headline = "Hoy tu sistema está por debajo de tu norma — buena señal para recuperar.";
  } else if (deviation.direction === "above") {
    headline = "Hoy tu sistema está por encima de tu norma — buena ventana para exigir.";
  } else {
    headline = "Hoy estás dentro de tu rango esperado.";
  }

  return {
    available: true,
    maturity,
    expected: {
      lnRmssd: Math.round(expectedLn * 1000) / 1000,
      rmssd: round1(expectedRmssd),
      low: round1(lowRmssd),
      high: round1(highRmssd),
    },
    latest: { ts: last.ts, rmssd: round1(last.rmssd), lnRmssd: Math.round(last.ln * 1000) / 1000, isRecent },
    deviation,
    trend7: trend7 == null ? null : Math.round(trend7 * 1000) / 1000,
    factors,
    headline,
  };
}
