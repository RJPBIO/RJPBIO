/* ═══════════════════════════════════════════════════════════════
   HRV-CAMERA · IIR Biquad filters (Butterworth)
   ═══════════════════════════════════════════════════════════════
   Filtros digitales IIR de 2º orden en cascada para procesar el
   PPG crudo de cámara. Usamos Butterworth por su respuesta plana
   en banda pasante (no introduce ripples que distorsionen la
   amplitud de los picos).

   Un bandpass 0.7-4 Hz (= 42-240 BPM) se compone de:
     HPF @ 0.7 Hz (corta DC + drift) → cascade → LPF @ 4 Hz (corta
     ruido de flicker + movimientos rápidos).

   Cada biquad procesa muestra por muestra manteniendo su propio
   estado (history buffer), lo que lo hace apto para streaming real-
   time desde el feed de cámara a 30 fps.

   Referencia: Robert Bristow-Johnson's Audio EQ Cookbook (biquad
   coefficients para Butterworth con Q=√2/2).
   ═══════════════════════════════════════════════════════════════ */

/**
 * Construye un biquad low-pass 2º orden Butterworth.
 *
 * @param {number} fc  frecuencia de corte (Hz)
 * @param {number} fs  sample rate (Hz)
 * @returns {{b0,b1,b2,a1,a2, reset, process}}
 */
export function lowpassBiquad(fc, fs) {
  const Q = Math.SQRT1_2; // 1/√2 = Butterworth
  const w0 = (2 * Math.PI * fc) / fs;
  const cos_w0 = Math.cos(w0);
  const sin_w0 = Math.sin(w0);
  const alpha = sin_w0 / (2 * Q);
  const a0 = 1 + alpha;
  const b0 = ((1 - cos_w0) / 2) / a0;
  const b1 = (1 - cos_w0) / a0;
  const b2 = ((1 - cos_w0) / 2) / a0;
  const a1 = (-2 * cos_w0) / a0;
  const a2 = (1 - alpha) / a0;
  return makeBiquad(b0, b1, b2, a1, a2);
}

/**
 * Construye un biquad high-pass 2º orden Butterworth.
 */
export function highpassBiquad(fc, fs) {
  const Q = Math.SQRT1_2;
  const w0 = (2 * Math.PI * fc) / fs;
  const cos_w0 = Math.cos(w0);
  const sin_w0 = Math.sin(w0);
  const alpha = sin_w0 / (2 * Q);
  const a0 = 1 + alpha;
  const b0 = ((1 + cos_w0) / 2) / a0;
  const b1 = (-(1 + cos_w0)) / a0;
  const b2 = ((1 + cos_w0) / 2) / a0;
  const a1 = (-2 * cos_w0) / a0;
  const a2 = (1 - alpha) / a0;
  return makeBiquad(b0, b1, b2, a1, a2);
}

/**
 * Encapsula un biquad con estado persistente para streaming.
 * Procesa muestra a muestra con y[n] = b0·x[n] + b1·x[n-1] + b2·x[n-2]
 *                              − a1·y[n-1] − a2·y[n-2].
 */
function makeBiquad(b0, b1, b2, a1, a2) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return {
    b0, b1, b2, a1, a2,
    reset() { x1 = x2 = y1 = y2 = 0; },
    process(x) {
      const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1; x1 = x;
      y2 = y1; y1 = y;
      return y;
    },
    // Batch process: applies the filter to an array (forward-only).
    // Para cero-fase se necesita filtfilt (ida+vuelta); lo exponemos
    // abajo como función standalone.
    processArray(arr) {
      const out = new Array(arr.length);
      for (let i = 0; i < arr.length; i++) out[i] = this.process(arr[i]);
      return out;
    },
  };
}

/**
 * Cascade de 2 biquads = bandpass 4º-orden Butterworth.
 * Para streaming. El orden importa: HPF primero (remueve DC) luego LPF.
 */
export function bandpassCascade(fLow, fHigh, fs) {
  const hpf = highpassBiquad(fLow, fs);
  const lpf = lowpassBiquad(fHigh, fs);
  return {
    reset() { hpf.reset(); lpf.reset(); },
    process(x) { return lpf.process(hpf.process(x)); },
    processArray(arr) {
      const out = new Array(arr.length);
      for (let i = 0; i < arr.length; i++) out[i] = this.process(arr[i]);
      return out;
    },
  };
}

/**
 * Filtfilt (zero-phase): filtra forward y luego backward para
 * eliminar el phase-shift introducido por el filtro IIR. Útil
 * en análisis offline (no streaming). Reduce distorsión de la
 * forma de la onda pulsátil, crítico para que los picos coincidan
 * con el pico verdadero de cada latido.
 */
export function filtfilt(filterFactory, arr) {
  const forward = filterFactory();
  const forwardOut = forward.processArray(arr);
  const backward = filterFactory();
  const reversed = forwardOut.slice().reverse();
  const backwardOut = backward.processArray(reversed);
  return backwardOut.reverse();
}

/**
 * Moving average subtraction para detrending. Resta a cada muestra
 * el promedio de las N muestras alrededor (ventana simétrica).
 * Sirve como detrender simple antes del bandpass IIR. Maneja los
 * bordes con ventana truncada.
 *
 * @param {number[]} arr  señal
 * @param {number}   w    ancho total de la ventana en muestras
 */
export function detrend(arr, w) {
  const N = arr.length;
  if (N === 0) return [];
  const half = Math.max(1, Math.floor(w / 2));
  const out = new Array(N);
  // Prefix sums para mean en O(1)
  const ps = new Array(N + 1);
  ps[0] = 0;
  for (let i = 0; i < N; i++) ps[i + 1] = ps[i] + arr[i];
  for (let i = 0; i < N; i++) {
    const lo = Math.max(0, i - half);
    const hi = Math.min(N, i + half + 1);
    const mean = (ps[hi] - ps[lo]) / (hi - lo);
    out[i] = arr[i] - mean;
  }
  return out;
}

/**
 * Z-score normalize: (x - mean) / std. Útil para peak detection
 * con thresholds absolutos consistentes entre mediciones.
 */
export function zscoreNormalize(arr) {
  const N = arr.length;
  if (N === 0) return [];
  let sum = 0;
  for (let i = 0; i < N; i++) sum += arr[i];
  const mean = sum / N;
  let sumsq = 0;
  for (let i = 0; i < N; i++) sumsq += (arr[i] - mean) ** 2;
  const std = Math.sqrt(sumsq / N) || 1; // evita div/0
  return arr.map((x) => (x - mean) / std);
}
