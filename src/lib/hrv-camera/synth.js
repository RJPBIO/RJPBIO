/* ═══════════════════════════════════════════════════════════════
   HRV-CAMERA · Synthetic PPG generator (solo para tests)
   ═══════════════════════════════════════════════════════════════
   Genera una señal PPG sintética con HR y RMSSD objetivo conocidos,
   para validar que nuestro algoritmo recupera los valores correctos.

   Modelo de la onda de pulso (simplificado — una suma de Gaussianas
   por latido aproxima la forma dícrota real lo suficiente para
   testear detección de picos):

     p(t) = Σ Gauss(t; t_i, σ_systolic)   — para cada latido t_i

   Los IBIs se generan con media 60000/HR y random gaussiano para
   producir un RMSSD objetivo.
   ═══════════════════════════════════════════════════════════════ */

/**
 * Genera un tren de IBIs con HR medio + RMSSD objetivo.
 *
 * @param {number} count
 * @param {number} meanHrBpm
 * @param {number} targetRmssdMs
 * @param {() => number} [rng]  generador (default Math.random)
 * @returns {number[]} IBIs en ms
 */
export function generateIbis(count, meanHrBpm, targetRmssdMs, rng = Math.random) {
  const meanIbi = 60000 / meanHrBpm;
  const ibis = new Array(count);
  // Para que el RMSSD sea exactamente targetRmssdMs, generamos las
  // diferencias sucesivas con std = targetRmssdMs / √2 (porque
  // RMSSD ≈ std(diff)) y acumulamos alrededor de meanIbi.
  const diffStd = targetRmssdMs / Math.SQRT2;
  ibis[0] = meanIbi + (randNormal(rng) * diffStd) / 2;
  for (let i = 1; i < count; i++) {
    const diff = randNormal(rng) * diffStd;
    ibis[i] = Math.max(300, Math.min(2000, ibis[i - 1] + diff));
  }
  // Re-centra para mantener mean ≈ meanIbi
  const sum = ibis.reduce((a, b) => a + b, 0);
  const actualMean = sum / count;
  const shift = meanIbi - actualMean;
  for (let i = 0; i < count; i++) ibis[i] += shift;
  return ibis;
}

/**
 * Genera una señal PPG muestreada a fs Hz con latidos en los tiempos
 * implicados por una secuencia de IBIs.
 *
 * @param {number[]} ibisMs
 * @param {number}   fs
 * @param {object}   [opts]
 * @param {number}   [opts.amplitude=1]     amplitud base del latido
 * @param {number}   [opts.sigmaMs=80]      ancho de la Gaussiana de pulso
 * @param {number}   [opts.noiseStd=0.02]   ruido gaussiano añadido
 * @param {number}   [opts.driftAmp=0.05]   amplitud de drift lento (simula DC shift)
 * @returns {number[]} señal PPG
 */
export function generatePpgFromIbis(ibisMs, fs, opts = {}) {
  const amp = opts.amplitude ?? 1;
  const sigmaMs = opts.sigmaMs ?? 80;
  const noiseStd = opts.noiseStd ?? 0.02;
  const driftAmp = opts.driftAmp ?? 0.05;
  const rng = opts.rng ?? Math.random;

  // Tiempo total = Σ IBIs + buffer inicial
  const warmupMs = 500;
  const totalMs = warmupMs + ibisMs.reduce((a, b) => a + b, 0);
  const N = Math.ceil((totalMs / 1000) * fs);
  const signal = new Array(N).fill(0);

  // Tiempos de latido (en ms desde 0)
  const beatTimesMs = [];
  let t = warmupMs;
  for (const ibi of ibisMs) {
    beatTimesMs.push(t);
    t += ibi;
  }

  // Para cada muestra, suma contribución de latidos cercanos
  const msPerSample = 1000 / fs;
  const sigmaSamples = sigmaMs / msPerSample;
  const spanSamples = Math.ceil(sigmaSamples * 3); // 99.7% de la Gaussiana
  for (const beatMs of beatTimesMs) {
    const centerSample = beatMs / msPerSample;
    const startI = Math.max(0, Math.floor(centerSample - spanSamples));
    const endI = Math.min(N - 1, Math.ceil(centerSample + spanSamples));
    for (let i = startI; i <= endI; i++) {
      const d = i - centerSample;
      signal[i] += amp * Math.exp(-(d * d) / (2 * sigmaSamples * sigmaSamples));
    }
  }

  // Añade drift lento (simula cambio de color por presión del dedo)
  const driftFreq = 0.1; // Hz
  for (let i = 0; i < N; i++) {
    signal[i] += driftAmp * Math.sin((2 * Math.PI * driftFreq * i) / fs);
  }

  // Añade ruido gaussiano
  if (noiseStd > 0) {
    for (let i = 0; i < N; i++) {
      signal[i] += randNormal(rng) * noiseStd;
    }
  }

  return signal;
}

/**
 * Pipeline completo: genera una señal lista para alimentar el algoritmo.
 */
export function synthesize({ durationSec, hrBpm, rmssdMs, fs = 30, noiseStd = 0.02, driftAmp = 0.05, rng = Math.random }) {
  const approxBeats = Math.ceil((durationSec * hrBpm) / 60) + 5;
  const ibis = generateIbis(approxBeats, hrBpm, rmssdMs, rng);
  const signal = generatePpgFromIbis(ibis, fs, { noiseStd, driftAmp, rng });
  return { signal, trueIbis: ibis };
}

/**
 * Box-Muller transform para valores gaussianos estándar (mean=0, std=1).
 */
function randNormal(rng = Math.random) {
  const u1 = rng() || Number.EPSILON;
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Seedable PRNG (Mulberry32) para tests deterministas.
 */
export function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
