/* ═══════════════════════════════════════════════════════════════
   HRV-CAMERA · Time-domain HRV metrics
   ═══════════════════════════════════════════════════════════════
   Métricas time-domain estándar (Task Force 1996 · Shaffer 2017):

     — Mean HR (BPM)    — 60000 / mean(IBI)
     — SDNN (ms)        — desviación estándar de NN intervals
     — RMSSD (ms)       — √mean(diff²) — principal marker
                           parasimpático
     — pNN50 (%)        — % de |diff| > 50ms
     — lnRmssd          — log natural de RMSSD (normaliza
                           distribución para análisis estadístico)
     — CV (%)           — coeficiente de variación (SDNN/meanIBI)

   Requisitos:
     — Mínimo 30 latidos (~30s) para RMSSD confiable
     — 60 latidos recomendado para SDNN estable
     — IBIs pre-validados (300-2000ms) y ectópicos removidos

   NO computamos frequency-domain (LF/HF) en esta versión — requiere
   resampling uniforme + Welch periodogram + >5min de data para ser
   confiable. Time-domain es suficiente para readiness daily use.
   ═══════════════════════════════════════════════════════════════ */

/**
 * Computa todas las métricas HRV time-domain a partir de IBIs limpios.
 *
 * @param {number[]} ibisMs   IBIs en milisegundos, ya validados
 * @returns {{meanHr, meanIbi, sdnn, rmssd, pnn50, lnRmssd, cv, n}|null}
 *          null si hay menos de 2 IBIs
 */
export function computeHrv(ibisMs) {
  const N = ibisMs.length;
  if (N < 2) return null;

  // Mean IBI
  let sum = 0;
  for (let i = 0; i < N; i++) sum += ibisMs[i];
  const meanIbi = sum / N;
  const meanHr = 60000 / meanIbi;

  // SDNN — desviación estándar de IBIs
  let sumsq = 0;
  for (let i = 0; i < N; i++) sumsq += (ibisMs[i] - meanIbi) ** 2;
  // Usamos n-1 (sample std) para menos sesgo en muestras pequeñas.
  const sdnn = Math.sqrt(sumsq / Math.max(1, N - 1));

  // RMSSD — √(mean(diff²)) sobre diferencias sucesivas
  // Principal marker del tono parasimpático.
  let sumDiffSq = 0;
  let countDiff = 0;
  let nn50 = 0;
  for (let i = 1; i < N; i++) {
    const d = ibisMs[i] - ibisMs[i - 1];
    sumDiffSq += d * d;
    countDiff++;
    if (Math.abs(d) > 50) nn50++;
  }
  const rmssd = countDiff > 0 ? Math.sqrt(sumDiffSq / countDiff) : 0;
  const pnn50 = countDiff > 0 ? (nn50 / countDiff) * 100 : 0;

  // lnRmssd — normaliza distribución (RMSSD es log-normal)
  const lnRmssd = rmssd > 0 ? Math.log(rmssd) : 0;

  // Coeficiente de variación
  const cv = meanIbi > 0 ? (sdnn / meanIbi) * 100 : 0;

  return {
    meanHr: round(meanHr, 1),
    meanIbi: round(meanIbi, 1),
    sdnn: round(sdnn, 2),
    rmssd: round(rmssd, 2),
    pnn50: round(pnn50, 2),
    lnRmssd: round(lnRmssd, 3),
    cv: round(cv, 2),
    n: N,
  };
}

function round(v, decimals = 2) {
  if (!Number.isFinite(v)) return 0;
  const m = Math.pow(10, decimals);
  return Math.round(v * m) / m;
}
