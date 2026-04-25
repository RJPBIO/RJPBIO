/* ═══════════════════════════════════════════════════════════════
   HRV-CAMERA · Validation math (camera vs ground-truth BLE strap)
   ═══════════════════════════════════════════════════════════════
   Estadística estándar para validar mediciones de HRV vs un
   gold-standard (Polar H10 vía BLE):

     — MAE (Mean Absolute Error) — error promedio en unidades originales
     — Pearson correlation — co-variación lineal de las series
     — Bland-Altman — bias y limits of agreement (95%) entre métodos
     — % error relativo — escalado por la magnitud del valor

   Estas son las métricas que usan los papers de validación de PPG
   contra ECG (e.g., Schäfer 2013, Pinheiro 2016, Plews 2017).

   No comparamos IBI por IBI (requeriría alineamiento temporal complejo
   con jitter de inicio entre sensores). Comparamos métricas agregadas
   sobre la misma ventana — el approach estándar en validación clínica.
   ═══════════════════════════════════════════════════════════════ */

/**
 * Mean Absolute Error entre dos arrays. Asume mismo length.
 */
export function computeMAE(a, b) {
  const n = Math.min(a.length, b.length);
  if (n === 0) return null;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += Math.abs(a[i] - b[i]);
  return sum / n;
}

/**
 * Pearson r para dos arrays de igual length.
 * Returns null si <3 puntos o varianza cero en alguno.
 */
export function computeCorrelation(a, b) {
  const n = Math.min(a.length, b.length);
  if (n < 3) return null;
  let sumA = 0, sumB = 0;
  for (let i = 0; i < n; i++) { sumA += a[i]; sumB += b[i]; }
  const meanA = sumA / n;
  const meanB = sumB / n;
  let num = 0, denA = 0, denB = 0;
  for (let i = 0; i < n; i++) {
    const dA = a[i] - meanA;
    const dB = b[i] - meanB;
    num += dA * dB;
    denA += dA * dA;
    denB += dB * dB;
  }
  if (denA === 0 || denB === 0) return null;
  return num / Math.sqrt(denA * denB);
}

/**
 * Bland-Altman: bias y limits of agreement (95%) — diff = method1 - method2.
 *   bias = mean(diff)
 *   loA  = bias ± 1.96 * std(diff)
 *
 * Devuelve null si <3 puntos.
 */
export function computeBlandAltman(method1, method2) {
  const n = Math.min(method1.length, method2.length);
  if (n < 3) return null;
  const diffs = new Array(n);
  for (let i = 0; i < n; i++) diffs[i] = method1[i] - method2[i];
  const bias = diffs.reduce((s, x) => s + x, 0) / n;
  const variance = diffs.reduce((s, x) => s + (x - bias) ** 2, 0) / Math.max(1, n - 1);
  const std = Math.sqrt(variance);
  return {
    bias: round(bias, 2),
    std: round(std, 2),
    lowerLoA: round(bias - 1.96 * std, 2),
    upperLoA: round(bias + 1.96 * std, 2),
  };
}

/**
 * Compara dos mediciones (cámara vs BLE) sobre la misma ventana
 * temporal. Cada método aporta sus métricas agregadas; éste módulo
 * NO recalcula HRV — el caller pasa lo que su pipeline produjo.
 *
 * @param {object} camera   {meanHr, rmssd, sdnn, pnn50, lnRmssd}
 * @param {object} ble      {meanHr, rmssd, sdnn, pnn50, lnRmssd}
 * @returns {object} comparison stats
 */
export function compareMeasurements(camera, ble) {
  if (!camera || !ble) return null;

  const hrCam = camera.meanHr;
  const hrBle = ble.meanHr;
  const rmssdCam = camera.rmssd;
  const rmssdBle = ble.rmssd;

  const hrDiff = round(hrCam - hrBle, 2);
  const rmssdDiff = round(rmssdCam - rmssdBle, 2);
  const hrPctErr = hrBle > 0 ? round(((hrCam - hrBle) / hrBle) * 100, 1) : null;
  const rmssdPctErr = rmssdBle > 0 ? round(((rmssdCam - rmssdBle) / rmssdBle) * 100, 1) : null;

  return {
    hr: {
      camera: round(hrCam, 1),
      ble: round(hrBle, 1),
      diffBpm: hrDiff,
      pctError: hrPctErr,
      withinTolerance: hrPctErr != null && Math.abs(hrPctErr) <= 5,
    },
    rmssd: {
      camera: round(rmssdCam, 1),
      ble: round(rmssdBle, 1),
      diffMs: rmssdDiff,
      pctError: rmssdPctErr,
      withinTolerance: rmssdPctErr != null && Math.abs(rmssdPctErr) <= 30,
    },
    sdnn: {
      camera: round(camera.sdnn ?? 0, 1),
      ble: round(ble.sdnn ?? 0, 1),
      diffMs: round((camera.sdnn ?? 0) - (ble.sdnn ?? 0), 2),
    },
  };
}

/**
 * Agrega múltiples sesiones de validación → estadística cumulativa.
 * Cada elemento de `sessions` es el output de compareMeasurements.
 *
 * @param {object[]} sessions
 * @returns {object|null}
 */
export function aggregateValidationSessions(sessions) {
  if (!Array.isArray(sessions) || sessions.length === 0) return null;
  const hrCam = sessions.map((s) => s.hr.camera).filter(Number.isFinite);
  const hrBle = sessions.map((s) => s.hr.ble).filter(Number.isFinite);
  const rmssdCam = sessions.map((s) => s.rmssd.camera).filter(Number.isFinite);
  const rmssdBle = sessions.map((s) => s.rmssd.ble).filter(Number.isFinite);

  return {
    n: sessions.length,
    hr: {
      mae: round(computeMAE(hrCam, hrBle), 2),
      correlation: round(computeCorrelation(hrCam, hrBle), 3),
      blandAltman: computeBlandAltman(hrCam, hrBle),
    },
    rmssd: {
      mae: round(computeMAE(rmssdCam, rmssdBle), 2),
      correlation: round(computeCorrelation(rmssdCam, rmssdBle), 3),
      blandAltman: computeBlandAltman(rmssdCam, rmssdBle),
    },
  };
}

function round(v, decimals = 2) {
  if (v == null || !Number.isFinite(v)) return null;
  const m = Math.pow(10, decimals);
  return Math.round(v * m) / m;
}
