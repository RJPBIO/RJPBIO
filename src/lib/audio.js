/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — AUDIO ENGINE
   Binaural, ambient, soundscapes, haptic, voice
   ═══════════════════════════════════════════════════════════════ */

let _aC = null;
let _audioUnlocked = false;
export function gAC() {
  // Si el contexto quedó "closed" (iOS en low-power, o cierre explícito),
  // lo descartamos y creamos uno nuevo; si no, cualquier llamada posterior
  // lanza InvalidStateError y el audio queda muerto hasta recargar la app.
  // Reseteamos también el flag de unlock: el AC nuevo arranca "suspended".
  if (_aC && _aC.state === "closed") { _aC = null; _audioUnlocked = false; }
  if (!_aC && typeof window !== "undefined") {
    try { _aC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  }
  return _aC;
}

// ─── Audio unlock (iOS/Android) ───────────────────────────
// iOS Safari mantiene el AudioContext en "suspended" hasta que un
// gesto del usuario (touch/click) llame a resume() DENTRO de ese call
// stack. Esta función debe ejecutarse desde un handler de evento.
export function unlockAudio() {
  try {
    const c = gAC(); if (!c) return false;
    if (_audioUnlocked && c.state === "running") return true;
    if (c.state === "suspended") c.resume().catch(() => {});
    // Oscilador mudo para "calentar" el grafo en iOS.
    const o = c.createOscillator(); const g = c.createGain();
    g.gain.value = 0; o.connect(g); g.connect(c.destination);
    o.start(0); o.stop(c.currentTime + 0.02);
    _audioUnlocked = true;
    return true;
  } catch { return false; }
}

// Listeners permanentes (no `once:true`): si el AC se cierra a mitad de
// sesión y gAC() lo recrea, necesitamos otra oportunidad de resume en
// gesto del usuario. unlockAudio es idempotente y barato.
let _unlockWired = false;
export function wireAudioUnlock() {
  if (_unlockWired || typeof window === "undefined") return;
  _unlockWired = true;
  const onGesture = () => { unlockAudio(); };
  const opts = { capture: true, passive: true };
  window.addEventListener("pointerdown", onGesture, opts);
  window.addEventListener("touchstart", onGesture, opts);
  window.addEventListener("keydown", onGesture, opts);

  // Cuando la pestaña se oculta, paramos voz para que no quede
  // hablando en background (mala UX si el user abre otra app).
  // Cuando vuelve, no auto-resumeamos — speak() se llamará si hace falta.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      try { window.speechSynthesis?.cancel(); } catch {}
    }
  });
}

// Ducking: si la voz está hablando, los sonidos suenan al 35% del volumen
// normal → claridad. Sin esto, los chords se mezclan con la voz y todo
// se vuelve ruido. Diseño estándar en apps de mindfulness premium.
function duckedVolume(base) {
  return _isSpeaking ? base * 0.35 : base;
}

// ─── Reverb Bus ───────────────────────────────────────────
// Convolution reverb compartido por todos los sonidos. Sin esto los
// sine waves puros suenan "secos en una caja" — feel de synth barato.
// Con reverb: sensación espacial, presencia, calidad de instrumento.
//
// La impulse response (IR) la sintetizamos en runtime con noise
// exponencialmente decaído — cero asset payload, ~10ms de cómputo
// al primer uso. Calidad menor que un IR sampleado de iglesia/hall
// real, pero suficiente para "sonar diseñado" vs synth crudo.

let _reverbConvolver = null;
let _reverbWetGain = null;
let _reverbDryGain = null;

function buildImpulseResponse(c, durationSec = 1.8, decay = 2.4) {
  const sr = c.sampleRate;
  const length = Math.floor(sr * durationSec);
  const ir = c.createBuffer(2, length, sr);
  for (let ch = 0; ch < 2; ch++) {
    const data = ir.getChannelData(ch);
    // Decorrelación stereo sutil: el seed del random difiere entre canales
    // → el reverb se siente "amplio" en lugar de mono.
    for (let i = 0; i < length; i++) {
      const t = i / length;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
    }
  }
  return ir;
}

function ensureReverbBus() {
  const c = gAC(); if (!c) return null;
  if (_reverbConvolver && _reverbWetGain && _reverbDryGain) {
    return { c, wet: _reverbWetGain, dry: _reverbDryGain };
  }
  try {
    const conv = c.createConvolver();
    conv.buffer = buildImpulseResponse(c);
    const wet = c.createGain(); wet.gain.value = 0.32; // ~32% reverb send → presencia clara, no "iglesia"
    const dry = c.createGain(); dry.gain.value = 1.0;
    wet.connect(conv);
    conv.connect(c.destination);
    dry.connect(c.destination);
    _reverbConvolver = conv;
    _reverbWetGain = wet;
    _reverbDryGain = dry;
    return { c, wet, dry };
  } catch (e) {
    return null;
  }
}

/**
 * Layered tone: 2 oscillators detuneados + filter envelope + reverb send.
 * Esto es lo que separa "synth digital crudo" de "sonido diseñado".
 *
 * - 2 osciladores a ±5 cents → riqueza armónica (efecto chorus sutil)
 * - Lowpass biquad cierra de filterStart → filterEnd durante la nota
 *   → simula timbre orgánico (en vez de buzz constante)
 * - Envelope ADR: ataque rápido, decay exponencial → percusivo
 * - Send a wet (reverb) + dry → espacialidad
 *
 * @param {object} opts
 * @param {number} opts.freq        Hz fundamental
 * @param {number} opts.durSec      duración total
 * @param {number} opts.peakVol     volumen pico del envelope
 * @param {number} [opts.attack=0.01]
 * @param {string} [opts.type="sine"]
 * @param {number} [opts.filterStart=8000]  Hz inicial del lowpass
 * @param {number} [opts.filterEnd=1400]    Hz final
 * @param {number} [opts.detuneCents=5]     ± cents para layering
 */
function createLayeredTone({
  freq,
  durSec,
  peakVol,
  attack = 0.01,
  type = "sine",
  filterStart = 8000,
  filterEnd = 1400,
  detuneCents = 5,
}) {
  const bus = ensureReverbBus();
  if (!bus) return;
  const { c, wet, dry } = bus;
  if (c.state === "suspended") c.resume();
  const now = c.currentTime;

  // Envelope de la nota
  const voiceGain = c.createGain();
  voiceGain.gain.setValueAtTime(0, now);
  voiceGain.gain.linearRampToValueAtTime(peakVol, now + attack);
  voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + durSec);

  // Filter envelope: abre brillante y cierra al timbre cálido
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 1;
  filter.frequency.setValueAtTime(filterStart, now);
  filter.frequency.exponentialRampToValueAtTime(
    Math.max(200, filterEnd),
    now + durSec * 0.75
  );

  // Stack de 2 osciladores detuneados → riqueza
  for (const detune of [-detuneCents, detuneCents]) {
    const o = c.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    o.connect(filter);
    o.start(now);
    o.stop(now + durSec + 0.1);
  }

  filter.connect(voiceGain);
  voiceGain.connect(dry);
  voiceGain.connect(wet); // mismo signal a wet → reverb mix
}

export function playChord(f, d, v) {
  try {
    const targetVol = duckedVolume(v || 0.04);
    f.forEach((fr) => {
      createLayeredTone({
        freq: fr,
        durSec: d,
        peakVol: targetVol / f.length,
        attack: 0.08,
        // Notas más altas: filtro más abierto para preservar brillo
        filterStart: fr > 800 ? 10000 : 8000,
        filterEnd: fr > 800 ? 2200 : 1400,
      });
    });
  } catch (e) {}
}

// Spark blip — tono breve, suave, para sincronía audio-visual con
// los firings sinápticos del NeuralCore3D. Sine wave, ataque casi
// instantáneo (4 ms), decay exponencial (~55 ms). Muy sutil: un
// blip debajo del umbral de "interrupción" — se percibe como un
// "chispazo" en el fondo, no como música. Frecuencia mapeada a
// la altura del mote destino para que la red neuronal "suene"
// como una red.
// Throttle: si NeuralCore3D dispara 50 firings en 500ms, crear 50
// oscillators causa glitches y clipping. Limitamos a uno cada 80ms
// (max ~12 sparks/segundo) — sigue dando sensación de "red activa"
// sin saturar el grafo de audio.
let _lastSparkTs = 0;
export function playSpark(freq, volume) {
  const now = Date.now();
  if (now - _lastSparkTs < 80) return;
  _lastSparkTs = now;
  try {
    // Rango de frecuencia ligeramente más estrecho (260-1100Hz) — fuera
    // de eso suena demasiado grave o piercing.
    const f = Math.max(260, Math.min(1100, freq || 640));
    const v = duckedVolume(Math.max(0.01, Math.min(0.12, volume || 0.055)));
    // Spark con reverb + detune mínimo (3 cents). Filter cierra rápido
    // para mantener el carácter percusivo "blip" pero con tail espacial.
    createLayeredTone({
      freq: f,
      durSec: 0.18, // tail del reverb extiende la percepción
      peakVol: v,
      attack: 0.004,
      filterStart: 12000,
      filterEnd: 4000,
      detuneCents: 3,
    });
  } catch (e) {}
}

// ─── Noise buffers (pre-generados) ────────────────────────
// Reemplazamos createScriptProcessor (deprecado, inestable en iOS/Android)
// por un AudioBuffer estático reproducido en loop. Más portable, sin
// worklet file, y el buffer es suficientemente largo para que el loop
// no se perciba (4 s de ruido filtrado ≈ indistinguible).
function makeNoiseBuffer(ctx, kind) {
  const seconds = 4;
  const sr = ctx.sampleRate || 44100;
  const len = Math.floor(sr * seconds);
  const buf = ctx.createBuffer(1, len, sr);
  const data = buf.getChannelData(0);
  let last = 0;
  if (kind === "brown") {
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      data[i] = last * 3.5;
    }
  } else { // "wind" — un poco más suave
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.01 * w) / 1.01;
      data[i] = last * 2.5;
    }
  }
  return buf;
}

// ─── Brown noise ambient ──────────────────────────────────
let _ambNode = null, _ambGain = null;
export function startAmbient() {
  try {
    const c = gAC(); if (!c) return;
    if (c.state === "suspended") c.resume().catch(() => {});
    if (_ambNode) return;
    _ambGain = c.createGain(); _ambGain.gain.value = 0;
    _ambGain.connect(c.destination);
    _ambNode = c.createBufferSource();
    _ambNode.buffer = makeNoiseBuffer(c, "brown");
    _ambNode.loop = true;
    _ambNode.connect(_ambGain);
    _ambNode.start(0);
    _ambGain.gain.linearRampToValueAtTime(0.12, c.currentTime + 2);
  } catch (e) {}
}

export function stopAmbient() {
  try {
    if (_ambGain) { const c = gAC(); if (c) _ambGain.gain.linearRampToValueAtTime(0, c.currentTime + 1); }
    setTimeout(() => {
      try { if (_ambNode) { _ambNode.stop(); _ambNode.disconnect(); _ambNode = null; } } catch {}
      try { if (_ambGain) { _ambGain.disconnect(); _ambGain = null; } } catch {}
    }, 1200);
  } catch (e) {}
}

// ─── Soundscapes ──────────────────────────────────────────
let _ssNode = null, _ssGain = null;
export function startSoundscape(type) {
  try {
    const c = gAC(); if (!c || type === "off") return;
    if (c.state === "suspended") c.resume();
    stopSoundscape();
    _ssGain = c.createGain(); _ssGain.gain.value = 0; _ssGain.connect(c.destination);
    if (type === "wind") {
      const src = c.createBufferSource();
      src.buffer = makeNoiseBuffer(c, "wind");
      src.loop = true;
      src.connect(_ssGain);
      src.start(0);
      // Envolvemos para que stopSoundscape() lo pare correctamente.
      _ssNode = { disconnect: () => { try { src.stop(); } catch {} try { src.disconnect(); } catch {} } };
      _ssGain.gain.linearRampToValueAtTime(0.08, c.currentTime + 3);
    } else if (type === "drone") {
      const o = c.createOscillator(); const o2 = c.createOscillator();
      o.type = "sine"; o.frequency.value = 60; o2.type = "sine"; o2.frequency.value = 90;
      o.connect(_ssGain); o2.connect(_ssGain); o.start(); o2.start();
      _ssNode = { disconnect: () => { o.stop(); o2.stop(); o.disconnect(); o2.disconnect(); } };
      _ssGain.gain.linearRampToValueAtTime(0.04, c.currentTime + 3);
    } else if (type === "bnarl") {
      const o = c.createOscillator(); const o2 = c.createOscillator();
      o.type = "sine"; o.frequency.value = 200; o2.type = "sine"; o2.frequency.value = 210;
      const panL = c.createStereoPanner(); const panR = c.createStereoPanner();
      panL.pan.value = -1; panR.pan.value = 1;
      o.connect(panL); o2.connect(panR); panL.connect(_ssGain); panR.connect(_ssGain);
      o.start(); o2.start();
      _ssNode = { disconnect: () => { o.stop(); o2.stop(); o.disconnect(); o2.disconnect(); panL.disconnect(); panR.disconnect(); } };
      _ssGain.gain.linearRampToValueAtTime(0.035, c.currentTime + 3);
    }
  } catch (e) {}
}

export function stopSoundscape() {
  try {
    if (_ssGain) { const c = gAC(); if (c) _ssGain.gain.linearRampToValueAtTime(0, c.currentTime + 1.5); }
    setTimeout(() => { if (_ssNode) { _ssNode.disconnect(); _ssNode = null; } if (_ssGain) { _ssGain.disconnect(); _ssGain = null; } }, 1800);
  } catch (e) {}
}

// ─── Binaural Engine ──────────────────────────────────────
// Antes: 2 sine puros con auto-pan. Suena "clínico" y digital.
// Ahora: 2 sine + LFO sutil (warmth) + lowpass dedicado (suaviza
// armónicos altos) + envelope de fade-in más natural. El binaural
// se siente como "presencia" en lugar de tono de prueba.
let _binauralL = null, _binauralR = null, _binauralGain = null, _binauralPan = 0;
let _binauralFilter = null, _binauralLfoL = null, _binauralLfoR = null;

export function startBinaural(type) {
  try {
    const c = gAC(); if (!c) return;
    stopBinaural();
    _binauralGain = c.createGain();
    _binauralGain.gain.value = 0;

    // Lowpass dedicado (~3.5kHz) suaviza armónicos altos del sine puro
    // que suenan "duros" después de minutos. Q bajo para curva orgánica.
    _binauralFilter = c.createBiquadFilter();
    _binauralFilter.type = "lowpass";
    _binauralFilter.frequency.value = 3500;
    _binauralFilter.Q.value = 0.7;
    _binauralFilter.connect(_binauralGain);
    _binauralGain.connect(c.destination);

    const panL = c.createStereoPanner();
    const panR = c.createStereoPanner();
    _binauralL = c.createOscillator();
    _binauralR = c.createOscillator();
    _binauralL.type = "sine";
    _binauralR.type = "sine";

    let baseFreq, beatFreq;
    if (type === "enfoque") { baseFreq = 200; beatFreq = 14; } // beta low
    else if (type === "energia") { baseFreq = 200; beatFreq = 18; } // beta mid
    else if (type === "calma") { baseFreq = 200; beatFreq = 10; } // alpha
    else if (type === "reset") { baseFreq = 200; beatFreq = 6; } // theta
    else { baseFreq = 200; beatFreq = 10; }

    _binauralL.frequency.value = baseFreq;
    _binauralR.frequency.value = baseFreq + beatFreq;

    // LFO sutil de ±0.3Hz a 0.08Hz por canal → "respiración" orgánica
    // que evita el carácter sterile del sine fijo. Imperceptible como
    // modulación, pero el cerebro la registra como "ambient" no test tone.
    _binauralLfoL = c.createOscillator();
    const lfoLGain = c.createGain();
    _binauralLfoL.frequency.value = 0.08;
    lfoLGain.gain.value = 0.3;
    _binauralLfoL.connect(lfoLGain);
    lfoLGain.connect(_binauralL.frequency);
    _binauralLfoL.start();

    _binauralLfoR = c.createOscillator();
    const lfoRGain = c.createGain();
    _binauralLfoR.frequency.value = 0.07; // ligeramente distinto = no sincrónico
    lfoRGain.gain.value = 0.3;
    _binauralLfoR.connect(lfoRGain);
    lfoRGain.connect(_binauralR.frequency);
    _binauralLfoR.start();

    const myGain = _binauralGain;
    function rotatePan() {
      if (_binauralGain !== myGain) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        requestAnimationFrame(rotatePan);
        return;
      }
      panL.pan.value = Math.sin(_binauralPan) * 0.8;
      panR.pan.value = Math.cos(_binauralPan) * 0.8;
      _binauralPan += 0.015;
      requestAnimationFrame(rotatePan);
    }

    _binauralL.connect(panL);
    _binauralR.connect(panR);
    panL.connect(_binauralFilter);
    panR.connect(_binauralFilter);
    _binauralL.start();
    _binauralR.start();
    rotatePan();

    // Fade-in más largo (5s) — entrada suave, no abrupta.
    _binauralGain.gain.linearRampToValueAtTime(0.028, c.currentTime + 5);
  } catch (e) {}
}

export function stopBinaural() {
  try {
    if (_binauralGain) { const c = gAC(); if (c) _binauralGain.gain.linearRampToValueAtTime(0, c.currentTime + 2); }
    setTimeout(() => {
      try {
        if (_binauralL) { _binauralL.stop(); _binauralL.disconnect(); }
        if (_binauralR) { _binauralR.stop(); _binauralR.disconnect(); }
        if (_binauralLfoL) { _binauralLfoL.stop(); _binauralLfoL.disconnect(); }
        if (_binauralLfoR) { _binauralLfoR.stop(); _binauralLfoR.disconnect(); }
        if (_binauralFilter) _binauralFilter.disconnect();
        if (_binauralGain) _binauralGain.disconnect();
        _binauralL = null;
        _binauralR = null;
        _binauralLfoL = null;
        _binauralLfoR = null;
        _binauralFilter = null;
        _binauralGain = null;
      } catch (e) {}
    }, 2500);
  } catch (e) {}
}

// ─── Haptic Engine ────────────────────────────────────────
export function hap(t, sO, hO) {
  try {
    if (hO !== false && typeof navigator !== "undefined" && navigator.vibrate) {
      if (t === "go") navigator.vibrate([20, 40, 20]);
      else if (t === "ph") navigator.vibrate(12);
      else if (t === "ok") navigator.vibrate([40, 60, 40, 60, 80]);
      else if (t === "tick") navigator.vibrate(5);
      else if (t === "tap") navigator.vibrate(8);
    }
    if (sO !== false) {
      if (t === "go") playChord([432, 648], 0.5, 0.05);
      else if (t === "ph") playChord([528, 660, 792], 0.5, 0.04);
      else if (t === "ok") { playChord([432, 528, 648, 792], 1.5, 0.06); setTimeout(() => playChord([528, 648, 792], 1.2, 0.025), 300); }
      else if (t === "tap") playChord([440], 0.08, 0.02);
    }
  } catch (e) {}
}

export function hapticPhase(type) {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  try {
    if (type === "breath") navigator.vibrate([30, 60, 30]);
    else if (type === "body") navigator.vibrate([50, 30, 50, 30, 50]);
    else if (type === "mind") navigator.vibrate([20, 100, 20]);
    else if (type === "focus") navigator.vibrate([80, 20, 80]);
    else navigator.vibrate(30);
  } catch (e) {}
}

export function hapticBreath(label) {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  try {
    if (label === "INHALA") navigator.vibrate([15, 30, 15, 30, 15]);
    else if (label === "EXHALA") navigator.vibrate([40]);
    else if (label === "MANTÉN") navigator.vibrate(20);
    else navigator.vibrate(10);
  } catch (e) {}
}

// ─── Haptic Firma ─────────────────────────────────────────
// Patrones hápticos firmados que el usuario aprende a reconocer
// sin mirar. Cada uno tiene una "silueta rítmica" única:
//   ignition: crescendo + golpe + cola (explosión controlada)
//   checkpoint: doble tap largo (verificación deliberada)
//   phaseShift: rampa corta (algo cambió)
//   award: Morse-like corto-corto-largo (reconocimiento)
export function hapticSignature(kind) {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  try {
    if (kind === "ignition") navigator.vibrate([18, 30, 26, 20, 40, 40, 100]);
    else if (kind === "checkpoint") navigator.vibrate([50, 50, 50]);
    else if (kind === "phaseShift") navigator.vibrate([12, 18, 24]);
    else if (kind === "award") navigator.vibrate([30, 40, 30, 40, 90]);
    else navigator.vibrate(15);
  } catch (e) {}
}

// ─── Pre-phase alert ──────────────────────────────────────
// Pulso corto ~2s antes del cambio de fase. El usuario lo siente
// como "algo viene" sin interrumpir la atención actual.
export function hapticPreShift() {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  try { navigator.vibrate([6, 40, 10]); } catch (e) {}
}

// Countdown escalado 3→2→1 con intensidad creciente. Lee el
// tiempo como tensión que aumenta hasta la ignición.
export function hapticCountdown(step) {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  try {
    if (step === 3) navigator.vibrate(8);
    else if (step === 2) navigator.vibrate(16);
    else if (step === 1) navigator.vibrate(28);
  } catch (e) {}
}

// Ignición sonora — acorde ascendente bio-eléctrico (quinta+octava+tercera)
// Se apila sobre la stinger existente "ok" en hap(); úsalo cuando quieras
// enfatizar explícitamente el momento de completar (IgnitionBurst).
export function playIgnition() {
  try {
    const c = gAC(); if (!c) return;
    if (c.state === "suspended") c.resume();
    // Ataque: chispa aguda corta
    playChord([1320, 1760], 0.25, 0.05);
    // Núcleo: acorde perfecto que sostiene
    setTimeout(() => playChord([528, 792, 1056, 1320], 1.6, 0.055), 180);
    // Cola: base que se desvanece
    setTimeout(() => playChord([264, 396], 1.8, 0.04), 520);
  } catch (e) {}
}

// ─── Motion Detection ─────────────────────────────────────
export function setupMotionDetection(cb) {
  if (typeof window === "undefined") return null;
  let samples = 0, stability = 0, lastMag = 9.8;
  function handle(e) {
    const a = e.accelerationIncludingGravity; if (!a) return;
    const mag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
    const diff = Math.abs(mag - lastMag);
    if (diff > 0.3) samples++;
    stability = stability * 0.95 + diff * 0.05; lastMag = mag;
    if (cb) cb({ samples, stability });
  }
  try {
    if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
      DeviceMotionEvent.requestPermission().then((p) => { if (p === "granted") window.addEventListener("devicemotion", handle); });
    } else { window.addEventListener("devicemotion", handle); }
  } catch (e) {}
  return { getSamples: () => samples, getStability: () => stability, cleanup: () => { try { window.removeEventListener("devicemotion", handle); } catch (e) {} } };
}

// ─── Wake Lock ────────────────────────────────────────────
let _wakeLock = null;
export async function requestWakeLock() {
  try { if ("wakeLock" in navigator) { _wakeLock = await navigator.wakeLock.request("screen"); } } catch (e) {}
}
export function releaseWakeLock() {
  try { if (_wakeLock) { _wakeLock.release(); _wakeLock = null; } } catch (e) {}
}

// ─── Voice Guidance ───────────────────────────────────────
let _voices = [];
let _voiceUnlocked = false;
let _voiceListenerWired = false;

// Las voces del sistema cargan async en Chrome/Android/iOS; si llamamos
// speak() antes de que lleguen, el motor cae al default (robótico). Nos
// suscribimos a `voiceschanged` y re-cacheamos cada vez que dispare.
export function loadVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  _voices = window.speechSynthesis.getVoices() || [];
  if (!_voiceListenerWired) {
    _voiceListenerWired = true;
    try {
      window.speechSynthesis.addEventListener("voiceschanged", () => {
        _voices = window.speechSynthesis.getVoices() || [];
      });
    } catch {
      // Safari antiguo expone `onvoiceschanged` como propiedad, no addEventListener.
      try {
        window.speechSynthesis.onvoiceschanged = () => {
          _voices = window.speechSynthesis.getVoices() || [];
        };
      } catch {}
    }
  }
}

// Preferimos voces NATIVAS (localService) por encima de remotas; para cada
// locale probamos tags regionales comunes antes de caer al prefijo de idioma.
// La voz remota de Google suena más "robótica" en móviles antiguos.
const VOICE_PREFS = {
  es: ["es-MX", "es-US", "es-ES", "es-AR", "es-CO"],
  en: ["en-US", "en-GB", "en-AU", "en-CA"],
  pt: ["pt-BR", "pt-PT"],
  fr: ["fr-FR", "fr-CA"],
  de: ["de-DE", "de-AT"],
  it: ["it-IT"],
  nl: ["nl-NL", "nl-BE"],
  ja: ["ja-JP"],
  ko: ["ko-KR"],
  zh: ["zh-CN", "zh-TW", "zh-HK"],
  ar: ["ar-SA", "ar-EG"],
  he: ["he-IL"],
};

// Voces premium conocidas por OS — empíricamente son las más naturales.
// Si una está disponible, la priorizamos sobre la búsqueda por lang tag.
// Apple voces nuevas (Premium / Enhanced) son las mejores; Google "Wavenet"
// son aceptables; nombres genéricos tipo "Microsoft David" suenan robóticos.
const PREMIUM_VOICE_NAMES = {
  es: [
    // iOS / macOS — voces Premium o Enhanced
    "Paulina (Enhanced)", "Paulina (Premium)", "Paulina",
    "Mónica (Enhanced)", "Mónica (Premium)", "Mónica",
    "Marisol", "Esperanza",
    // Android Google TTS network voices con calidad alta
    "Spanish (Mexico)", "Spanish (Spain)",
    // Microsoft Edge / Windows voces Neural
    "Microsoft Dalia Online (Natural) - Spanish (Mexico)",
    "Microsoft Helena Desktop - Spanish (Spain)",
  ],
  en: [
    "Samantha (Enhanced)", "Samantha (Premium)", "Samantha",
    "Karen", "Daniel", "Moira", "Tessa", "Allison",
    "Microsoft Aria Online (Natural)", "Google US English",
  ],
  pt: ["Luciana (Enhanced)", "Luciana", "Joana"],
  fr: ["Amélie (Enhanced)", "Amélie", "Thomas"],
  de: ["Anna (Enhanced)", "Anna", "Markus"],
  it: ["Alice (Enhanced)", "Alice", "Luca"],
};

function pickVoice(locale = "es") {
  if (!_voices.length) return null;
  const prefix = (locale || "es").slice(0, 2).toLowerCase();

  // 1) Try premium named voices first — empíricamente la mejor calidad.
  const premiumNames = PREMIUM_VOICE_NAMES[prefix] || [];
  for (const name of premiumNames) {
    const hit = _voices.find((v) =>
      v.name === name || (v.name && v.name.includes(name))
    );
    if (hit) return hit;
  }

  // 2) Fallback al método anterior por lang tag con preferencia local.
  const tags = VOICE_PREFS[prefix] || [];
  const byLang = (tag) => _voices.filter((v) => v.lang === tag);
  const byPrefix = (p) => _voices.filter((v) => v.lang?.toLowerCase().startsWith(p));
  // Filtra voces conocidas como robóticas si tenemos alternativa.
  const isRobotic = (v) =>
    /^Microsoft (David|Mark|Zira|Hazel) (Desktop|Mobile)/.test(v.name || "") ||
    v.name === "Google" ||
    v.name === "fred";
  const prefer = (list) => {
    const local = list.filter((v) => v.localService && !isRobotic(v));
    if (local.length) return local[0];
    const nonRobotic = list.filter((v) => !isRobotic(v));
    return nonRobotic[0] || list[0];
  };
  for (const tag of tags) {
    const hit = prefer(byLang(tag));
    if (hit) return hit;
  }
  return prefer(byPrefix(prefix)) || null;
}

function voiceLangTag(locale = "es") {
  const prefix = (locale || "es").slice(0, 2).toLowerCase();
  const tags = VOICE_PREFS[prefix];
  return tags?.[0] || prefix;
}

export function unlockVoice() {
  if (_voiceUnlocked || typeof window === "undefined" || !window.speechSynthesis) return;
  try { const u = new SpeechSynthesisUtterance(""); u.volume = 0; window.speechSynthesis.speak(u); _voiceUnlocked = true; } catch (e) {}
}

function resolveLocale(locale) {
  if (locale) return locale;
  if (typeof document !== "undefined" && document.documentElement?.lang) return document.documentElement.lang;
  if (typeof localStorage !== "undefined") {
    try { const l = localStorage.getItem("bio-locale"); if (l) return l; } catch {}
  }
  return "es";
}

// Dedup: rápidos repeats (p.ej. INHALA INHALA por race entre breath-tick
// y phase-change) producen voz superpuesta. Saltamos repeats <800ms.
let _lastSpeechText = "";
let _lastSpeechTs = 0;
const SPEECH_DEDUP_MS = 800;

// Estado "speaking" expuesto para ducking de sonidos (sounds más bajos
// mientras la voz habla → claridad).
let _isSpeaking = false;
export function isSpeaking() { return _isSpeaking; }

// iOS Safari conocido bug: speechSynthesis se "duerme" tras ~10-15s sin
// uso. Si llamas speak() después, no suena. Mantenemos vivo con un ping
// silencioso periódico cuando la pestaña está visible.
let _keepaliveTimer = null;
function startVoiceKeepalive() {
  if (_keepaliveTimer || typeof window === "undefined" || !window.speechSynthesis) return;
  _keepaliveTimer = setInterval(() => {
    try {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) return;
      // Ping: utterance vacía silenciosa cada 8s mantiene la API viva.
      const u = new SpeechSynthesisUtterance("");
      u.volume = 0;
      window.speechSynthesis.speak(u);
    } catch {}
  }, 8000);
}

function buildUtterance(text, circadian, loc) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = voiceLangTag(loc);
  // Defaults naturales (1.0 pitch, 1.0 volume). Rate ligeramente <1 (0.95)
  // para presencia clara sin sonar lento. Circadian puede ajustar pero
  // mantenemos el rango estrecho para no entrar en "robotic territory".
  const rateOverride = circadian?.voiceRate;
  u.rate = Math.max(0.85, Math.min(1.15, typeof rateOverride === "number" ? rateOverride : 0.95));
  u.pitch = Math.max(0.9, Math.min(1.1, circadian?.voicePitch || 1.0));
  u.volume = 1.0;
  const v = pickVoice(loc);
  if (v) u.voice = v;
  // Trackear estado para ducking
  u.onstart = () => { _isSpeaking = true; };
  u.onend = () => { _isSpeaking = false; };
  u.onerror = () => { _isSpeaking = false; };
  return u;
}

export function speak(text, circadian, voiceOn = true, locale) {
  if (!voiceOn || !text || typeof window === "undefined" || !window.speechSynthesis) return;
  // Dedup: mismo texto < 800ms = skip. Evita "INHALA INHALA" overlap.
  const now = Date.now();
  if (text === _lastSpeechText && now - _lastSpeechTs < SPEECH_DEDUP_MS) return;
  _lastSpeechText = text;
  _lastSpeechTs = now;
  try {
    if (!_voices.length) loadVoices();
    startVoiceKeepalive();
    if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    const loc = resolveLocale(locale);
    window.speechSynthesis.speak(buildUtterance(text, circadian, loc));
  } catch (e) {}
}

export function speakNow(text, circadian, voiceOn = true, locale) {
  if (!voiceOn || !text || typeof window === "undefined" || !window.speechSynthesis) return;
  // speakNow interrumpe — actualiza el dedup state también.
  _lastSpeechText = text;
  _lastSpeechTs = Date.now();
  try {
    if (!_voices.length) loadVoices();
    startVoiceKeepalive();
    if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    window.speechSynthesis.cancel();
    _isSpeaking = false; // cancel resetea
    const loc = resolveLocale(locale);
    window.speechSynthesis.speak(buildUtterance(text, circadian, loc));
  } catch (e) {}
}

export function stopVoice() {
  try {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      _isSpeaking = false;
      _lastSpeechText = "";
      _lastSpeechTs = 0;
    }
  } catch (e) {}
}

// ─── Persistence (DEPRECATED: use Zustand store) ─────────
// ldS and svS removed in v5 unification — all state flows through useStore

export function exportData(st) {
  try {
    const blob = new Blob([JSON.stringify(st, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "bio-ignicion-data.json"; a.click();
    URL.revokeObjectURL(url);
  } catch (e) {}
}
