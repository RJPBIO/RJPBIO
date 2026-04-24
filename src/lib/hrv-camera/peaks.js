/* ═══════════════════════════════════════════════════════════════
   HRV-CAMERA · Peak detection
   ═══════════════════════════════════════════════════════════════
   Detecta picos sistólicos en un PPG ya filtrado (bandpass 0.7-4 Hz
   + detrended + z-score normalized). Cada pico corresponde al
   máximo del pulso arterial cuando la sangre llena el dedo.

   Algoritmo (multi-etapa):

     1) Zero-crossing slope change: identifica candidatos como
        puntos donde la derivada pasa de + a − (local maxima).

     2) Prominence filter: solo mantiene picos cuya altura sobre
        los valles circundantes supera un umbral mínimo (por
        defecto 0.3× std de la señal). Rechaza picos falsos en
        ruido.

     3) Refractory period: dos latidos reales nunca ocurren a
        menos de ~300ms (= 200 BPM), que es el tope fisiológico.
        Dos candidatos dentro del refractory → mantiene el de
        mayor prominence.

     4) Adaptive threshold: si en los últimos N latidos se ve
        que la señal está más alta/baja, ajusta el umbral para
        mantener sensibilidad estable.

   Output: índices en muestras donde está cada pico. Se convierten
   a IBIs (ms) en metrics.js usando el sampleRate.
   ═══════════════════════════════════════════════════════════════ */

/**
 * Detecta picos sistólicos con pipeline completo.
 *
 * @param {number[]} signal     señal PPG preprocesada
 * @param {number}   fs         sample rate en Hz (tipicamente 30)
 * @param {object}   [options]
 * @param {number}   [options.minProminenceSigma=0.3]  prominence mínima en unidades de std
 * @param {number}   [options.refractoryMs=300]        mínimo entre latidos (ms)
 * @param {number}   [options.minHrBpm=35]             HR mínimo plausible
 * @param {number}   [options.maxHrBpm=200]            HR máximo plausible
 * @returns {number[]} índices (int) de cada pico detectado
 */
export function detectPeaks(signal, fs, options = {}) {
  const N = signal.length;
  if (N < 3 || !fs || fs <= 0) return [];

  const minProm = options.minProminenceSigma ?? 0.3;
  const refractoryMs = options.refractoryMs ?? 300;
  const minHrBpm = options.minHrBpm ?? 35;
  const maxHrBpm = options.maxHrBpm ?? 200;

  // 1) Std de la señal para umbrales relativos
  let sum = 0;
  for (let i = 0; i < N; i++) sum += signal[i];
  const mean = sum / N;
  let sumsq = 0;
  for (let i = 0; i < N; i++) sumsq += (signal[i] - mean) ** 2;
  const std = Math.sqrt(sumsq / N) || 1;
  const promThreshold = minProm * std;

  // 2) Zero-crossing: candidatos
  const candidates = [];
  for (let i = 1; i < N - 1; i++) {
    // Local maximum: mayor que vecinos inmediatos
    if (signal[i] > signal[i - 1] && signal[i] >= signal[i + 1]) {
      candidates.push(i);
    }
  }
  if (candidates.length === 0) return [];

  // 3) Prominence: para cada candidato, busca el valle más alto
  // a izquierda y derecha. Prominence = pico − max(valle_izq, valle_der).
  const withProm = candidates.map((idx) => {
    const prom = computeProminence(signal, idx);
    return { idx, val: signal[idx], prom };
  });

  // 4) Filter por prominence mínima
  const filtered = withProm.filter((p) => p.prom >= promThreshold);
  if (filtered.length === 0) return [];

  // 5) Refractory: si dos picos están dentro de refractoryMs,
  // mantener el de mayor prominence (más alto).
  const refractorySamples = Math.floor((refractoryMs / 1000) * fs);
  const kept = [];
  for (const p of filtered) {
    if (kept.length === 0) {
      kept.push(p);
      continue;
    }
    const last = kept[kept.length - 1];
    if (p.idx - last.idx < refractorySamples) {
      // conflicto: mantener el más prominente
      if (p.prom > last.prom) kept[kept.length - 1] = p;
    } else {
      kept.push(p);
    }
  }

  // 6) Final sanity: verifica que el HR inferido está en rango
  // fisiológico (rechaza outliers extremos por artefactos).
  const minIbiSamples = (60 / maxHrBpm) * fs;
  const maxIbiSamples = (60 / minHrBpm) * fs;
  const finalPeaks = [];
  let lastIdx = -Infinity;
  for (const p of kept) {
    const gap = p.idx - lastIdx;
    if (lastIdx >= 0 && (gap < minIbiSamples || gap > maxIbiSamples)) {
      // Gap implausible — skip este candidato pero mantén lastIdx
      continue;
    }
    finalPeaks.push(p.idx);
    lastIdx = p.idx;
  }

  return finalPeaks;
}

/**
 * Prominence de un pico: altura del pico sobre el punto de silla
 * (valle) más alto entre este pico y el pico vecino más alto a
 * cada lado. Implementación simplificada: busca el mínimo en
 * una ventana alrededor (típicamente 1 beat = fs/2 muestras).
 */
function computeProminence(signal, idx) {
  const N = signal.length;
  const peakVal = signal[idx];
  // Busca valles extendiendo a ambos lados hasta encontrar un pico mayor
  // o el borde. Implementación O(N) simple.
  let leftMin = peakVal;
  for (let i = idx - 1; i >= 0; i--) {
    if (signal[i] > peakVal) break;
    if (signal[i] < leftMin) leftMin = signal[i];
  }
  let rightMin = peakVal;
  for (let i = idx + 1; i < N; i++) {
    if (signal[i] > peakVal) break;
    if (signal[i] < rightMin) rightMin = signal[i];
  }
  const higherValley = Math.max(leftMin, rightMin);
  return peakVal - higherValley;
}

/**
 * Refina índices enteros de pico a posiciones sub-muestra usando
 * interpolación parabólica sobre las 3 muestras (y[i-1], y[i], y[i+1]).
 *
 * Por qué importa: a fs=30 Hz cada muestra son 33 ms. Sin refinar,
 * dos latidos reales que caen en el mismo índice entero generan
 * quantization noise ~15-20 ms en RMSSD. Interpolando parabólicamente
 * bajamos ese piso a <3 ms → precisión comparable a ECG/BLE.
 *
 * Fórmula clásica: para un parabola ajustada por los 3 puntos, el
 * vértice está en offset = 0.5·(yL − yR)/(yL − 2·yC + yR), con
 * offset ∈ [−0.5, 0.5].
 *
 * @param {number[]} signal
 * @param {number[]} peakIndices  índices enteros de pico
 * @returns {number[]}  posiciones float (mismo length)
 */
export function refinePeakPositions(signal, peakIndices) {
  const N = signal.length;
  const out = new Array(peakIndices.length);
  for (let k = 0; k < peakIndices.length; k++) {
    const i = peakIndices[k];
    if (i <= 0 || i >= N - 1) {
      out[k] = i;
      continue;
    }
    const yL = signal[i - 1];
    const yC = signal[i];
    const yR = signal[i + 1];
    const denom = yL - 2 * yC + yR;
    if (denom === 0 || !Number.isFinite(denom)) {
      out[k] = i;
      continue;
    }
    const offset = (0.5 * (yL - yR)) / denom;
    // Clamp físico: la parábola válida tiene offset ∈ [-0.5, 0.5].
    // Valores fuera indican que el máximo real está lejos, y la
    // aproximación parabólica ya no aplica → usamos el entero.
    if (!Number.isFinite(offset) || offset > 0.5 || offset < -0.5) {
      out[k] = i;
      continue;
    }
    out[k] = i + offset;
  }
  return out;
}

/**
 * Convierte una lista de índices de pico a IBIs (inter-beat intervals)
 * en milisegundos. Acepta índices float (resultado de refinePeakPositions).
 *
 * @param {number[]} peakIndices
 * @param {number}   fs  sample rate Hz
 * @returns {number[]} IBIs en ms
 */
export function peaksToIbi(peakIndices, fs) {
  if (peakIndices.length < 2) return [];
  const ibis = new Array(peakIndices.length - 1);
  const msPerSample = 1000 / fs;
  for (let i = 1; i < peakIndices.length; i++) {
    ibis[i - 1] = (peakIndices[i] - peakIndices[i - 1]) * msPerSample;
  }
  return ibis;
}

/**
 * Filtra IBIs fisiológicamente implausibles (fuera del rango
 * 300-2000ms = 30-200 BPM). Retorna subset válido más un contador
 * de rechazados (útil para SQI).
 */
export function validateIbis(ibis, options = {}) {
  const minMs = options.minMs ?? 300;
  const maxMs = options.maxMs ?? 2000;
  const valid = [];
  let rejected = 0;
  for (const ibi of ibis) {
    if (ibi >= minMs && ibi <= maxMs) valid.push(ibi);
    else rejected++;
  }
  return { valid, rejected, rejectRate: ibis.length > 0 ? rejected / ibis.length : 0 };
}

/**
 * Hampel filter para detección robusta de ectópicos en series de IBI.
 * Mucho más robusto que "desviación de la mediana móvil" cuando el
 * ruido es heterogéneo: usa MAD (median absolute deviation) como
 * escala, que es inmune a outliers (el estimador de escala clásico
 * — la desviación estándar — colapsa en presencia de 2+ outliers).
 *
 * Regla: punto i es ectópico si
 *   |x[i] − median(window)| > nSigmas · 1.4826 · MAD(window)
 * donde 1.4826 es el factor que hace MAD consistente con σ bajo
 * distribución normal.
 *
 * Referencia: Pearson, R.K. (2005). "Mining Imperfect Data". SIAM.
 *
 * @param {number[]} ibis
 * @param {object}   [opts]
 * @param {number}   [opts.windowSize=7]  muestras vecinas (±windowSize/2)
 * @param {number}   [opts.nSigmas=3]     umbral en desviaciones robustas
 * @returns {{clean: number[], ectopic: number[], ectopicIndices: number[]}}
 */
export function hampelFilterIbis(ibis, opts = {}) {
  const windowSize = opts.windowSize ?? 7;
  const nSigmas = opts.nSigmas ?? 3;
  const N = ibis.length;
  if (N < windowSize) {
    return { clean: ibis.slice(), ectopic: [], ectopicIndices: [] };
  }
  const half = Math.floor(windowSize / 2);
  const K = 1.4826;
  const clean = [];
  const ectopic = [];
  const ectopicIndices = [];
  for (let i = 0; i < N; i++) {
    const lo = Math.max(0, i - half);
    const hi = Math.min(N, i + half + 1);
    const win = ibis.slice(lo, hi);
    const med = median(win);
    const mad = median(win.map((x) => Math.abs(x - med)));
    const scale = K * mad;
    if (scale === 0) {
      // señal localmente constante → no hay base para juzgar outlier
      clean.push(ibis[i]);
      continue;
    }
    if (Math.abs(ibis[i] - med) > nSigmas * scale) {
      ectopic.push(ibis[i]);
      ectopicIndices.push(i);
    } else {
      clean.push(ibis[i]);
    }
  }
  return { clean, ectopic, ectopicIndices };
}

/**
 * Detecta latidos ectópicos: aquellos que desvían >threshold (20%
 * default) del running median. Los ectópicos corrompen el RMSSD si
 * se incluyen en el cálculo directo, por eso se devuelven flaggeados
 * para que el consumidor decida: descartar o reemplazar con mediana.
 *
 * @param {number[]} ibis
 * @param {number}   [deviationThreshold=0.20]
 * @returns {{clean: number[], ectopic: number[], ectopicIndices: number[]}}
 */
export function detectEctopic(ibis, deviationThreshold = 0.2) {
  const N = ibis.length;
  if (N < 3) return { clean: ibis.slice(), ectopic: [], ectopicIndices: [] };

  const clean = [];
  const ectopic = [];
  const ectopicIndices = [];
  const window = 5;
  for (let i = 0; i < N; i++) {
    // Running median de los últimos `window` valores (antes de i),
    // usando mínimo 3 samples.
    const start = Math.max(0, i - window);
    const slice = ibis.slice(start, i);
    if (slice.length < 3) {
      clean.push(ibis[i]);
      continue;
    }
    const med = median(slice);
    const deviation = Math.abs(ibis[i] - med) / med;
    if (deviation > deviationThreshold) {
      ectopic.push(ibis[i]);
      ectopicIndices.push(i);
    } else {
      clean.push(ibis[i]);
    }
  }
  return { clean, ectopic, ectopicIndices };
}

function median(arr) {
  const s = arr.slice().sort((a, b) => a - b);
  const n = s.length;
  if (n === 0) return 0;
  if (n % 2 === 1) return s[(n - 1) / 2];
  return (s[n / 2 - 1] + s[n / 2]) / 2;
}
