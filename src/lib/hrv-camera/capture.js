/* ═══════════════════════════════════════════════════════════════
   HRV-CAMERA · MediaStream capture + ROI extraction
   ═══════════════════════════════════════════════════════════════
   Wrappea el acceso a la cámara (trasera preferida) + torch LED
   + canvas offscreen para extraer el canal rojo medio del ROI
   central (zona donde el dedo cubre la lente).

   Modo de uso típico (finger-on-lens PPG):
     — usuario apoya el dedo sobre la cámara trasera con flash ON
     — cada frame, la lente ve solo rojo saturado con micro-
       pulsaciones por el volumen de sangre sistólico
     — promediamos el canal rojo sobre un ROI central 64×64 para
       ruidoreducir → da una muestra a ~30 Hz

   Entrega:
     start({ onSample, onError }) → Promise<void>
     stop() → void
     setTorch(on) → Promise<boolean>

   `onSample(value, timestampMs)` se invoca por cada frame procesado.
   Valor crudo (0-255) del canal rojo medio. El consumidor aplica el
   filtro IIR y peak detection en streaming.

   NOTAS:
     — getUserMedia sólo funciona en HTTPS (o localhost).
     — Torch control requiere ImageCapture API (Chrome Android).
       Si no está disponible, retornamos false; el usuario puede
       seguir midiendo bajo luz ambiente con menor SNR.
     — Intentamos 30 fps; si el navegador da menos, el algoritmo
       se adapta (fs real viene del sampleRate reportado).
   ═══════════════════════════════════════════════════════════════ */

const DEFAULT_ROI_SIZE = 64; // píxeles

/**
 * @param {object}   [opts]
 * @param {number}   [opts.roiSize=64]     ancho/alto del ROI central
 * @param {"environment"|"user"} [opts.facingMode="environment"]
 * @param {number}   [opts.frameRate=30]
 * @returns {{start, stop, setTorch, getStream, isTorchSupported}}
 */
export function createCameraCapture(opts = {}) {
  const roiSize = opts.roiSize ?? DEFAULT_ROI_SIZE;
  const facingMode = opts.facingMode ?? "environment";
  const requestedFps = opts.frameRate ?? 30;

  let stream = null;
  let videoEl = null;
  let canvas = null;
  let ctx = null;
  let track = null;
  let imageCapture = null;
  let rafId = null;
  let onSample = null;
  let onError = null;
  let running = false;
  let lastTs = 0;

  async function start(handlers = {}) {
    onSample = handlers.onSample || null;
    onError = handlers.onError || null;

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      throw new Error("getUserMedia no soportado en este navegador");
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: facingMode },
          frameRate: { ideal: requestedFps, min: 15 },
          width: { ideal: 320 },
          height: { ideal: 240 },
        },
      });
    } catch (err) {
      throw new Error(
        err?.name === "NotAllowedError"
          ? "Permiso de cámara denegado"
          : err?.name === "NotFoundError"
          ? "No se encontró cámara trasera"
          : "No se pudo iniciar la cámara"
      );
    }

    track = stream.getVideoTracks()[0];

    // Video element off-DOM (no necesitamos mostrarlo; el user ve
    // la UI, no el feed crudo).
    videoEl = document.createElement("video");
    videoEl.setAttribute("playsinline", "true");
    videoEl.muted = true;
    videoEl.srcObject = stream;
    await videoEl.play();

    // Canvas offscreen del tamaño del ROI (no del frame completo
    // → evitamos procesar píxeles que no nos interesan).
    canvas = document.createElement("canvas");
    canvas.width = roiSize;
    canvas.height = roiSize;
    ctx = canvas.getContext("2d", { willReadFrequently: true });

    // ImageCapture para control del torch (Chrome Android).
    if (typeof window !== "undefined" && "ImageCapture" in window) {
      try {
        imageCapture = new window.ImageCapture(track);
      } catch {
        imageCapture = null;
      }
    }

    running = true;
    lastTs = performance.now();
    loop();
  }

  function loop() {
    if (!running) return;
    try {
      // Extraer región central del frame al canvas del ROI.
      const vw = videoEl.videoWidth || 320;
      const vh = videoEl.videoHeight || 240;
      const sx = Math.max(0, (vw - roiSize) / 2);
      const sy = Math.max(0, (vh - roiSize) / 2);
      ctx.drawImage(videoEl, sx, sy, roiSize, roiSize, 0, 0, roiSize, roiSize);
      const data = ctx.getImageData(0, 0, roiSize, roiSize).data;

      // Canal rojo = PPG. Canales G/B se usan para detectar si el
      // dedo está bien apoyado (G y B caen cuando el dedo absorbe
      // la luz no-roja). Clipping si alguna muestra toca 255 →
      // saturación por flash demasiado fuerte o dedo retirado.
      let rSum = 0, gSum = 0, bSum = 0;
      let clipped = 0;
      const pxCount = roiSize * roiSize;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        rSum += r;
        gSum += data[i + 1];
        bSum += data[i + 2];
        if (r >= 253) clipped++;
      }
      const rMean = rSum / pxCount;
      const gMean = gSum / pxCount;
      const bMean = bSum / pxCount;
      const clipRate = clipped / pxCount;

      const ts = performance.now();
      if (onSample) onSample(rMean, ts, { r: rMean, g: gMean, b: bMean, clipRate });
      lastTs = ts;
    } catch (err) {
      if (onError) onError(err);
    }
    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (stream) {
      for (const t of stream.getTracks()) t.stop();
    }
    if (videoEl) {
      videoEl.pause();
      videoEl.srcObject = null;
    }
    stream = null;
    videoEl = null;
    canvas = null;
    ctx = null;
    track = null;
    imageCapture = null;
    onSample = null;
    onError = null;
  }

  /**
   * Intenta activar/desactivar el LED trasero. Retorna true si fue
   * aplicado con éxito, false si no es soportado.
   */
  async function setTorch(on) {
    if (!track) return false;
    try {
      const caps = track.getCapabilities?.();
      if (caps && "torch" in caps) {
        await track.applyConstraints({ advanced: [{ torch: !!on }] });
        return true;
      }
    } catch {
      // fallthrough
    }
    return false;
  }

  function isTorchSupported() {
    if (!track) return false;
    const caps = track.getCapabilities?.();
    return !!(caps && "torch" in caps);
  }

  function getStream() {
    return stream;
  }

  return { start, stop, setTorch, getStream, isTorchSupported };
}

/**
 * Wrapper streaming: recibe samples crudos de cámara y corre el
 * pipeline completo (bandpass → peaks → IBIs → HRV) en ventana
 * deslizante. Emite actualizaciones cada N segundos con las métricas
 * en vivo.
 */
import { bandpassCascade, zscoreNormalize, filtfilt } from "./filter";
import { detectPeaks, peaksToIbi, validateIbis, hampelFilterIbis, refinePeakPositions } from "./peaks";
import { computeHrv } from "./metrics";
import { computeSqi } from "./sqi";

/**
 * Detecta si el dedo está correctamente apoyado sobre lente + flash.
 * Criterios (derivados empíricamente del PPG en smartphones):
 *   — R alto (>120/255): el flash atraviesa la piel y llega saturado al sensor.
 *   — R domina sobre G/B (>25): la hemoglobina absorbe G/B selectivamente.
 *     Si no hay dominancia, la lente ve luz ambiente → sin dedo.
 *   — Clip rate bajo (<20%): si cada frame está saturado puro, el
 *     flash es demasiado intenso o el dedo muy delgado → PPG perdido.
 */
export function isFingerPlaced({ r, g, b, clipRate = 0 }) {
  if (r == null) return true; // datos faltantes → no bloquear
  if (r < 120) return false;
  if (r - Math.max(g ?? 0, b ?? 0) < 25) return false;
  if (clipRate > 0.2) return false;
  return true;
}

/**
 * @param {object}  [opts]
 * @param {number}  [opts.fs=30]           sample rate objetivo (nominal)
 * @param {number}  [opts.windowSec=60]    ventana de análisis
 * @param {number}  [opts.updateMs=1000]   cada cuánto emitir update
 * @param {number}  [opts.fingerLookbackMs=2000] ventana para estimar
 *                                         presencia del dedo
 * @param {(update: object) => void} [opts.onUpdate]
 * @returns {{pushSample, reset, finish}}
 */
export function createStreamingAnalyzer(opts = {}) {
  const nominalFs = opts.fs ?? 30;
  const windowSec = opts.windowSec ?? 60;
  const updateMs = opts.updateMs ?? 1000;
  const fingerLookbackMs = opts.fingerLookbackMs ?? 2000;
  const onUpdate = opts.onUpdate || null;

  const windowSize = windowSec * nominalFs;
  const buffer = [];         // samples crudas (canal rojo) desde la cámara
  const tsBuffer = [];       // timestamp de cada sample (ms)
  const fingerBuffer = [];   // boolean: dedo detectado
  let lastEmitTs = 0;
  const bpf = bandpassCascade(0.7, 4, nominalFs);
  const filteredLive = [];
  let startTs = null;
  let measuredFs = nominalFs;

  function pushSample(value, timestampMs, meta) {
    if (startTs == null) startTs = timestampMs;
    buffer.push(value);
    tsBuffer.push(timestampMs);
    const finger = meta ? isFingerPlaced(meta) : true;
    fingerBuffer.push(finger);

    filteredLive.push(bpf.process(value));
    while (buffer.length > windowSize) {
      buffer.shift();
      tsBuffer.shift();
      fingerBuffer.shift();
    }
    while (filteredLive.length > windowSize) filteredLive.shift();

    // Estimar fs real del stream (actualización ligera por sample).
    if (tsBuffer.length >= 10) {
      const span = tsBuffer[tsBuffer.length - 1] - tsBuffer[0];
      if (span > 100) measuredFs = ((tsBuffer.length - 1) * 1000) / span;
    }

    if (!onUpdate) return;
    if (timestampMs - lastEmitTs < updateMs) return;
    lastEmitTs = timestampMs;
    onUpdate(analyze(timestampMs - startTs));
  }

  function fingerPresenceRatio() {
    if (!tsBuffer.length) return 1;
    const nowTs = tsBuffer[tsBuffer.length - 1];
    let count = 0, hits = 0;
    for (let i = tsBuffer.length - 1; i >= 0; i--) {
      if (nowTs - tsBuffer[i] > fingerLookbackMs) break;
      count++;
      if (fingerBuffer[i]) hits++;
    }
    return count > 0 ? hits / count : 1;
  }

  function analyze(elapsedMs) {
    const elapsedSec = elapsedMs / 1000;
    const fingerRatio = fingerPresenceRatio();
    const fingerOk = fingerRatio > 0.6;

    const baseUpdate = {
      ready: false,
      elapsedSec,
      fs: measuredFs,
      fingerRatio,
      fingerOk,
      waveform: filteredLive.slice(-Math.min(filteredLive.length, Math.round(measuredFs * 6))),
      hrv: null,
      sqi: null,
    };

    if (buffer.length < measuredFs * 5) return baseUpdate;

    const fs = measuredFs;
    const signal = buffer.slice();

    // Paso 1: bandpass amplio 0.7-4 Hz (captura todo el rango fisiológico)
    // Filtfilt zero-phase → tiempos de pico exactos → parabolic útil.
    const wideFiltered = filtfilt(() => bandpassCascade(0.7, 4, fs), signal);

    // Paso 2: descartar warmup (primeros 2s) del array filtrado para
    // evitar el transitorio de los filtros IIR (ringing en los bordes).
    // Filtfilt atenúa el ringing pero no lo elimina; 2s a 30 Hz son
    // ~60 muestras, suficientes para que el estado se estabilice.
    const warmupSamples = Math.min(Math.floor(fs * 2), Math.floor(wideFiltered.length / 4));
    const trimmed = wideFiltered.slice(warmupSamples);

    // Paso 3: primera pasada de detección de picos sobre el rango amplio
    // para estimar la frecuencia fundamental (HR).
    const normalizedWide = zscoreNormalize(trimmed);
    const peaksProbeInt = detectPeaks(normalizedWide, fs);
    const probePeaksRefined = refinePeakPositions(normalizedWide, peaksProbeInt);
    const probeIbis = peaksToIbi(probePeaksRefined, fs);
    const { valid: probeValid } = validateIbis(probeIbis);

    // Paso 4: bandpass adaptativo. Si ya tenemos HR estimado, cerramos
    // el filtro alrededor del fundamental (±0.5 Hz) para matar armónicos
    // espurios y residuos de movimiento. Si no, usamos el rango amplio.
    let analyzed = normalizedWide;
    let estimatedHrHz = null;
    if (probeValid.length >= 5) {
      const meanIbiMs = probeValid.reduce((a, b) => a + b, 0) / probeValid.length;
      estimatedHrHz = 1000 / meanIbiMs;
      const fLow = Math.max(0.5, estimatedHrHz - 0.5);
      const fHigh = Math.min(fs / 2 - 0.5, estimatedHrHz + 0.6);
      if (fHigh > fLow + 0.3) {
        const narrow = filtfilt(() => bandpassCascade(fLow, fHigh, fs), signal);
        analyzed = zscoreNormalize(narrow.slice(warmupSamples));
      }
    }

    // Paso 5: detección final de picos sobre la señal adaptativa.
    const peaksInt = detectPeaks(analyzed, fs);
    const peakValues = peaksInt.map((i) => analyzed[i]);
    const peaksRefined = refinePeakPositions(analyzed, peaksInt);
    const rawIbis = peaksToIbi(peaksRefined, fs);
    const { valid, rejectRate } = validateIbis(rawIbis);

    // Paso 6: rechazo de ectópicos con Hampel (MAD) — más robusto
    // que el running-median con threshold porcentual fijo cuando la
    // HRV real es alta (atletas entrenados tienen picos de IBI amplios
    // pero fisiológicos; Hampel los mantiene, running-median los tira).
    const { clean, ectopic } = hampelFilterIbis(valid, { windowSize: 7, nSigmas: 3 });
    const ectopicRate = valid.length > 0 ? ectopic.length / valid.length : 0;

    const hrv = computeHrv(clean);
    const sqi = computeSqi({
      ibisValid: clean,
      ectopicRate: Math.max(rejectRate, ectopicRate),
      peakValues,
      durationSec: elapsedSec,
      expectedHrBpm: hrv?.meanHr ?? 70,
    });
    // Timestamp del pico más reciente — habilita haptic feedback por
    // beat en el componente UI (no comparable con un set anterior aquí
    // mismo: el componente compara updates consecutivos).
    let lastPeakTs = null;
    if (peaksInt.length > 0) {
      const lastIdxInTrimmed = peaksInt[peaksInt.length - 1];
      const idxInBuffer = lastIdxInTrimmed + warmupSamples;
      if (tsBuffer[idxInBuffer] != null) lastPeakTs = tsBuffer[idxInBuffer];
    }

    return {
      ...baseUpdate,
      ready: true,
      peaksInWindow: peaksInt.length,
      lastPeakTs,
      hrv,
      sqi,
      adaptiveBandpass: estimatedHrHz != null,
    };
  }

  function finish() {
    const elapsedMs =
      tsBuffer.length >= 2 ? tsBuffer[tsBuffer.length - 1] - tsBuffer[0] : ((buffer.length / nominalFs) * 1000) | 0;
    return analyze(elapsedMs);
  }

  function reset() {
    buffer.length = 0;
    tsBuffer.length = 0;
    fingerBuffer.length = 0;
    filteredLive.length = 0;
    lastEmitTs = 0;
    startTs = null;
    measuredFs = nominalFs;
    bpf.reset();
  }

  return { pushSample, reset, finish };
}
