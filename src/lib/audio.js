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

// Static ducking deprecado — el master bus tiene un duckGain que se
// automatiza con envelope (attack 80ms / release 400ms) cuando arranca/
// termina cada utterance. Más natural que la reducción estática.
// Este helper queda como pass-through para compat con call sites.
function duckedVolume(base) {
  return base;
}

// ─── User audio preferences (persistentes) ─────────────────
// Settings UI escribe aquí; el resto del audio engine lee desde
// estos values runtime. Cambiar masterVolume aplica un ramp suave
// (50ms) sobre el master input gain — sin clicks audibles.
let _userVoiceRate = null; // null → circadian/default 0.83
export function setUserVoiceRate(rate) {
  _userVoiceRate = typeof rate === "number" && rate >= 0.5 && rate <= 1.5 ? rate : null;
}
export function getUserVoiceRate() { return _userVoiceRate; }

let _userVoicePreference = null; // null → pickVoice() auto-selects premium
export function setUserVoicePreference(name) {
  _userVoicePreference = typeof name === "string" && name.length > 0 ? name : null;
}
export function getUserVoicePreference() { return _userVoicePreference; }

// Haptic intensity multiplier. Wrapper sobre navigator.vibrate aplica
// scale solo a las DURACIONES (índices pares en pattern arrays);
// las pausas (índices impares) NO se escalan — preservan el ritmo.
let _hapticIntensity = 1;
export function setHapticIntensity(level) {
  _hapticIntensity = level === "light" ? 0.6 : level === "strong" ? 1.4 : 1.0;
}

// Gating flags para granular audio control desde settings.
// startBinaural y startMusicBed verifican estos flags antes de arrancar.
let _binauralEnabled = true;
let _musicBedEnabled = true;
export function setBinauralEnabled(flag) {
  _binauralEnabled = flag !== false;
  if (!_binauralEnabled) {
    try { stopBinaural(); } catch (e) {}
  }
}
export function setMusicBedEnabled(flag) {
  _musicBedEnabled = flag !== false;
  if (!_musicBedEnabled) {
    try { stopMusicBed(); } catch (e) {}
  }
}

// Gating flag global de haptics — fuente única de verdad.
let _hapticEnabled = true;
export function setHapticEnabled(flag) {
  _hapticEnabled = flag !== false;
}

// Visual fallback para devices sin navigator.vibrate (iOS Safari).
// Page.jsx registra una callback que renderiza un flash sutil — el
// usuario iOS recibe SOMETHING sincronizado con la cadencia háptica
// aunque no sea físico. Si vibrate API existe, este fallback NO se
// dispara (sería redundante).
let _hapticFallback = null;
export function setHapticFallback(fn) {
  _hapticFallback = typeof fn === "function" ? fn : null;
}

// Wrapper único — todos los audio.js vibrate calls deben usar esto.
function vibrate(pattern) {
  if (!_hapticEnabled) return;
  // Si el device tiene vibrate API, lo usamos. Si no, fallback visual.
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      if (typeof pattern === "number") {
        navigator.vibrate(Math.max(1, Math.round(pattern * _hapticIntensity)));
      } else if (Array.isArray(pattern)) {
        navigator.vibrate(pattern.map((d, i) => i % 2 === 0 ? Math.max(1, Math.round(d * _hapticIntensity)) : d));
      } else {
        navigator.vibrate(pattern);
      }
    } catch (e) {}
    return;
  }
  // Fallback: dispatch al callback registrado (visual flash en page.jsx)
  if (_hapticFallback) {
    try { _hapticFallback(pattern); } catch (e) {}
  }
}

export function setMasterVolume(v) {
  const c = gAC();
  if (!c) return;
  ensureMasterBus();
  if (!_masterIn) return;
  const target = Math.max(0, Math.min(1, typeof v === "number" ? v : 1));
  const now = c.currentTime;
  try {
    _masterIn.gain.cancelScheduledValues(now);
    _masterIn.gain.setValueAtTime(_masterIn.gain.value, now);
    _masterIn.gain.linearRampToValueAtTime(target, now + 0.05);
  } catch (e) {}
}

// ─── Master Bus (Mastering Chain) ─────────────────────────
// Cadena fija al final de TODA salida de audio:
//   master input → soft saturation → compressor → limiter → destination
//
// Soft saturation: tanh-shaped waveshaper. Añade armónicos pares sutiles
// (calor analógico) y suaviza picos antes del compresor. Sin saturación
// los sine waves suenan estériles aunque el resto esté bien.
//
// Compresor: ratio 3:1 con attack rápido (5ms) y release medio (120ms).
// Settings broadcast estándar — "pega" la mezcla, hace que sounds + voz
// + binaural se sientan coherentes en un mismo espacio.
//
// Limiter: compresor con ratio 20:1, hard knee, attack 1ms. Previene
// clipping al destination — crítico cuando varios elementos suenan a
// la vez (chord + binaural + spark) y la suma rebasa 0dBFS.

let _masterIn = null;
let _masterCompressor = null;
let _masterLimiter = null;
let _masterSaturation = null;
let _masterDuckGain = null;        // sidechain ducking dinámico
let _masterLevelGain = null;       // auto-leveling (loudness compensation)
let _masterAnalyser = null;        // RMS metering para auto-level

function makeSoftSaturationCurve(amount = 1.5) {
  const samples = 4096;
  const curve = new Float32Array(samples);
  const norm = Math.tanh(amount);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = Math.tanh(x * amount) / norm;
  }
  return curve;
}

function ensureMasterBus() {
  const c = gAC(); if (!c) return null;
  if (_masterIn && _masterLimiter) return { c, in: _masterIn };
  try {
    _masterIn = c.createGain();
    _masterIn.gain.value = 1.0;

    // SIDECHAIN DUCKING dinámico — antes era static (gain reduction al
    // crear el sound). Ahora es un gain en la cadena master que se
    // automatiza con envelope cuando la voz arranca/termina. Resultado:
    // sounds "respiran" con la voz como en mezclas radiophonic broadcast.
    // Attack 80ms (rápido al empezar voz), Release 400ms (suave al terminar).
    _masterDuckGain = c.createGain();
    _masterDuckGain.gain.value = 1.0;

    // AUTO-LEVELING — compensa loudness target -18 dBFS RMS (≈-21 LUFS).
    // Ajustado por _masterAnalyser via tick lento. Clamped [-6dB, +3dB]
    // del nominal — nunca aplica más boost del razonable.
    _masterLevelGain = c.createGain();
    _masterLevelGain.gain.value = 1.0;

    _masterSaturation = c.createWaveShaper();
    _masterSaturation.curve = makeSoftSaturationCurve(1.2);
    _masterSaturation.oversample = "2x";

    _masterCompressor = c.createDynamicsCompressor();
    _masterCompressor.threshold.setValueAtTime(-18, c.currentTime);
    _masterCompressor.knee.setValueAtTime(12, c.currentTime);
    _masterCompressor.ratio.setValueAtTime(3, c.currentTime);
    _masterCompressor.attack.setValueAtTime(0.005, c.currentTime);
    _masterCompressor.release.setValueAtTime(0.12, c.currentTime);

    _masterLimiter = c.createDynamicsCompressor();
    _masterLimiter.threshold.setValueAtTime(-2, c.currentTime);
    _masterLimiter.knee.setValueAtTime(0, c.currentTime);
    _masterLimiter.ratio.setValueAtTime(20, c.currentTime);
    _masterLimiter.attack.setValueAtTime(0.001, c.currentTime);
    _masterLimiter.release.setValueAtTime(0.05, c.currentTime);

    // Cadena: master IN → duck → level → saturation → compressor → limiter → destination
    _masterIn.connect(_masterDuckGain);
    _masterDuckGain.connect(_masterLevelGain);
    _masterLevelGain.connect(_masterSaturation);
    _masterSaturation.connect(_masterCompressor);
    _masterCompressor.connect(_masterLimiter);
    _masterLimiter.connect(c.destination);

    // Analyser tap después del limiter — mide el final output que el user oye
    _masterAnalyser = c.createAnalyser();
    _masterAnalyser.fftSize = 2048;
    _masterAnalyser.smoothingTimeConstant = 0.85;
    _masterLimiter.connect(_masterAnalyser);
    // Analyser es un sink — no conecta a destination, solo lee.

    // Iniciar el loop de auto-leveling cuando se monta el master bus.
    startAutoLeveler();

    return { c, in: _masterIn };
  } catch (e) {
    return null;
  }
}

// ─── Sidechain Ducking (broadcast sidechain feel) ─────────
// Reemplaza el static ducking. Attack 80ms = rápido para no enmascarar
// la primera sílaba de la voz. Release 400ms = suave para que los
// sonidos no "saltan" de vuelta cuando la voz termina.
const DUCK_ATTACK = 0.08;
const DUCK_RELEASE = 0.40;
const DUCK_AMOUNT = 0.32; // sounds bajan al 32% durante voz (más agresivo, mejor claridad)

function applyDuck(active) {
  if (!_masterDuckGain) return;
  const c = gAC(); if (!c) return;
  try {
    const target = active ? DUCK_AMOUNT : 1.0;
    const time = active ? DUCK_ATTACK : DUCK_RELEASE;
    _masterDuckGain.gain.cancelScheduledValues(c.currentTime);
    _masterDuckGain.gain.setValueAtTime(_masterDuckGain.gain.value, c.currentTime);
    _masterDuckGain.gain.linearRampToValueAtTime(target, c.currentTime + time);
  } catch {}
}

// ─── Auto-Leveler (loudness compensation) ─────────────────
// Mide RMS del output post-limiter cada 250ms. Promedia sobre 5s
// (rolling window). Si la media RMS cae fuera del rango target
// [-25 dBFS, -15 dBFS] (≈ -28 a -18 LUFS aproximado), ajusta el
// _masterLevelGain por ±0.5dB con paso suave (1s ramp).
//
// Clamp duro: nunca sale del rango [-6 dB, +3 dB] del nominal.
// Esto evita que un protocolo silencioso reciba boost agresivo y
// suene comprimido cuando la siguiente parte tiene transientes.
//
// Es DIFFERENT del compressor — el compressor reacciona instantáneo
// a cada peak. El leveler reacciona a la energía PROMEDIO sostenida,
// como un audio engineer ajustando el master fader según la sección.

const TARGET_RMS_DB_MIN = -25;
const TARGET_RMS_DB_MAX = -15;
const LEVEL_GAIN_MIN_DB = -6;
const LEVEL_GAIN_MAX_DB = 3;
const LEVEL_TICK_MS = 250;
const LEVEL_WINDOW_SAMPLES = 20; // 5s de rolling window a 250ms tick

let _levelTimer = null;
let _rmsHistory = [];
let _meterDataBuf = null;

function dbToGain(db) { return Math.pow(10, db / 20); }
function gainToDb(g) { return g > 0 ? 20 * Math.log10(g) : -Infinity; }

function startAutoLeveler() {
  if (_levelTimer) return;
  if (!_masterAnalyser) return;
  if (!_meterDataBuf) _meterDataBuf = new Float32Array(_masterAnalyser.fftSize);

  _levelTimer = setInterval(() => {
    try {
      // Skip cuando pestaña no visible (ahorra CPU)
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      // Skip cuando NADA está sonando — sin sources activos no tiene
      // sentido medir, y métricas de "silencio digital" pueden hacer
      // que el leveler decida boost agresivo cuando algo arranque.
      const binauralOn = !!_binauralGain;
      const ambientOn = !!_pinkNoiseGain;
      const musicOn = !!_bedGain;
      if (!binauralOn && !ambientOn && !musicOn && _activeSourceCount === 0) {
        // Reset rolling history para que próxima sesión empiece limpia
        if (_rmsHistory.length) _rmsHistory.length = 0;
        return;
      }
      _masterAnalyser.getFloatTimeDomainData(_meterDataBuf);
      // RMS del buffer
      let sumSquare = 0;
      for (let i = 0; i < _meterDataBuf.length; i++) {
        sumSquare += _meterDataBuf[i] * _meterDataBuf[i];
      }
      const rms = Math.sqrt(sumSquare / _meterDataBuf.length);
      if (rms < 1e-6) return; // silencio absoluto, no medir

      _rmsHistory.push(rms);
      if (_rmsHistory.length > LEVEL_WINDOW_SAMPLES) _rmsHistory.shift();
      if (_rmsHistory.length < LEVEL_WINDOW_SAMPLES) return; // espera ventana llena

      // Average RMS over rolling window
      const avgRms = _rmsHistory.reduce((a, b) => a + b, 0) / _rmsHistory.length;
      const avgDb = gainToDb(avgRms);

      const c = gAC(); if (!c || !_masterLevelGain) return;
      const currentGainDb = gainToDb(_masterLevelGain.gain.value);

      // Decide si necesita ajuste
      let newGainDb = currentGainDb;
      if (avgDb < TARGET_RMS_DB_MIN && currentGainDb < LEVEL_GAIN_MAX_DB) {
        newGainDb = Math.min(LEVEL_GAIN_MAX_DB, currentGainDb + 0.5);
      } else if (avgDb > TARGET_RMS_DB_MAX && currentGainDb > LEVEL_GAIN_MIN_DB) {
        newGainDb = Math.max(LEVEL_GAIN_MIN_DB, currentGainDb - 0.5);
      }

      if (Math.abs(newGainDb - currentGainDb) >= 0.4) {
        const newGain = dbToGain(newGainDb);
        _masterLevelGain.gain.cancelScheduledValues(c.currentTime);
        _masterLevelGain.gain.setValueAtTime(_masterLevelGain.gain.value, c.currentTime);
        // Ramp 1s — suave, no audible
        _masterLevelGain.gain.linearRampToValueAtTime(newGain, c.currentTime + 1.0);
      }
    } catch {}
  }, LEVEL_TICK_MS);
}

// Expone el meter actual para diagnóstico/UI futura
export function getMasterLevel() {
  if (!_masterAnalyser || !_meterDataBuf) return null;
  try {
    _masterAnalyser.getFloatTimeDomainData(_meterDataBuf);
    let sumSquare = 0;
    for (let i = 0; i < _meterDataBuf.length; i++) {
      sumSquare += _meterDataBuf[i] * _meterDataBuf[i];
    }
    const rms = Math.sqrt(sumSquare / _meterDataBuf.length);
    const dbfs = rms > 0 ? 20 * Math.log10(rms) : -Infinity;
    return {
      rmsDb: +dbfs.toFixed(1),
      // Aproximación LUFS rough — broadcast asume ~-3dB shift K-weighted
      lufsApprox: +(dbfs - 3).toFixed(1),
      currentLevelGainDb: +gainToDb(_masterLevelGain?.gain.value || 1).toFixed(1),
    };
  } catch { return null; }
}

// ─── Reverb Bus ───────────────────────────────────────────
// Convolution reverb con IR estructurado al estilo Schroeder:
//   - Pre-delay (~25ms) — separa la señal directa del reverb
//   - Early reflections — 8-12 impulsos sparse en los primeros 60ms
//   - Late tail — densidad alta con decay exponencial
//
// Esto se acerca a un IR sampleado real. Pure exp-decay noise (versión
// anterior) suena "genérico digital"; con early reflections + pre-delay
// el oído percibe un espacio físico definido.

let _reverbConvolver = null;
let _reverbWetGain = null;
let _reverbDryGain = null;

function buildImpulseResponse(c, opts = {}) {
  const {
    duration = 1.8,
    decay = 2.4,
    predelay = 0.025,    // 25ms — espacio entre directa y reverb
    earlyDensity = 10,   // # impulsos sparse en early reflections
    earlyWindow = 0.06,  // ventana de early (60ms tras predelay)
  } = opts;
  const sr = c.sampleRate;
  const length = Math.floor(sr * duration);
  const ir = c.createBuffer(2, length, sr);
  const predelaySamples = Math.floor(sr * predelay);
  const earlyEnd = predelaySamples + Math.floor(sr * earlyWindow);

  for (let ch = 0; ch < 2; ch++) {
    const data = ir.getChannelData(ch);
    // Pre-delay: silencio (zeros)
    // Early reflections: impulsos sparse decrecientes
    for (let k = 0; k < earlyDensity; k++) {
      const offset = predelaySamples + Math.floor(Math.random() * (earlyEnd - predelaySamples));
      const amplitude = (1 - k / earlyDensity) * 0.55 * (Math.random() < 0.5 ? -1 : 1);
      // Decorrelación stereo: ±10% timing jitter por canal → reverb amplio
      const jitter = ch === 0 ? 0 : Math.floor(sr * 0.001 * (Math.random() - 0.5));
      const idx = offset + jitter;
      if (idx >= 0 && idx < length) data[idx] = amplitude;
    }
    // Late tail: densidad alta con exp decay desde earlyEnd
    for (let i = earlyEnd; i < length; i++) {
      const t = (i - earlyEnd) / (length - earlyEnd);
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay) * 0.42;
    }
  }
  return ir;
}

function ensureReverbBus() {
  const masterBus = ensureMasterBus(); if (!masterBus) return null;
  if (_reverbConvolver && _reverbWetGain && _reverbDryGain) {
    return { c: masterBus.c, wet: _reverbWetGain, dry: _reverbDryGain };
  }
  try {
    const c = masterBus.c;
    const conv = c.createConvolver();
    conv.buffer = buildImpulseResponse(c);
    const wet = c.createGain(); wet.gain.value = 0.32;
    const dry = c.createGain(); dry.gain.value = 1.0;
    // Reverb routing: wet → conv → master IN (no destination directo)
    // Esto hace que TODO el audio pase por el mastering chain.
    wet.connect(conv);
    conv.connect(masterBus.in);
    dry.connect(masterBus.in);
    _reverbConvolver = conv;
    _reverbWetGain = wet;
    _reverbDryGain = dry;
    return { c, wet, dry };
  } catch (e) {
    return null;
  }
}

// ─── Pink Noise Ambient Bed ───────────────────────────────
// Voss-McCartney pink noise approximation + lowpass para "soft pink".
// Función: rellenar el silencio absoluto con presencia tonal sutil. Sin
// esto, entre un sound y otro hay vacío audible que delata la naturaleza
// "synth en habitación vacía" de la app. Con ambient bed: presencia
// continua que el oído percibe como "la app respira" en lugar de
// "está dormida hasta que algo suena".
//
// Auto-start con startBinaural y auto-stop con stopBinaural — vinculados
// porque la sesión activa es donde la presencia importa.

let _pinkNoiseBuffer = null;
let _pinkNoiseSource = null;
let _pinkNoiseGain = null;
let _pinkNoiseFilter = null;

function buildPinkNoiseBuffer(c, durSec = 5) {
  const length = Math.floor(c.sampleRate * durSec);
  const buf = c.createBuffer(2, length, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  }
  return buf;
}

function startAmbientBed() {
  const masterBus = ensureMasterBus(); if (!masterBus) return;
  const c = masterBus.c;
  if (_pinkNoiseSource) return; // ya activo
  if (!_pinkNoiseBuffer) _pinkNoiseBuffer = buildPinkNoiseBuffer(c);

  _pinkNoiseSource = c.createBufferSource();
  _pinkNoiseSource.buffer = _pinkNoiseBuffer;
  _pinkNoiseSource.loop = true;

  _pinkNoiseFilter = c.createBiquadFilter();
  _pinkNoiseFilter.type = "lowpass";
  _pinkNoiseFilter.frequency.value = 4000;
  _pinkNoiseFilter.Q.value = 0.5;

  _pinkNoiseGain = c.createGain();
  _pinkNoiseGain.gain.value = 0;

  _pinkNoiseSource.connect(_pinkNoiseFilter);
  _pinkNoiseFilter.connect(_pinkNoiseGain);
  _pinkNoiseGain.connect(masterBus.in);

  _pinkNoiseSource.start();
  // Fade-in lento (7s) para que el user no perciba "se prendió noise"
  _pinkNoiseGain.gain.linearRampToValueAtTime(0.014, c.currentTime + 7);
}

function stopAmbientBed() {
  if (!_pinkNoiseGain || !_pinkNoiseSource) return;
  const c = gAC();
  if (c) _pinkNoiseGain.gain.linearRampToValueAtTime(0, c.currentTime + 2);
  setTimeout(() => {
    try {
      _pinkNoiseSource?.stop();
      _pinkNoiseSource?.disconnect();
      _pinkNoiseFilter?.disconnect();
      _pinkNoiseGain?.disconnect();
    } catch {}
    _pinkNoiseSource = null;
    _pinkNoiseFilter = null;
    _pinkNoiseGain = null;
  }, 2200);
}

// ─── Musical Pad Bed ──────────────────────────────────────
// Pad armónico muy suave debajo del binaural. Da continuidad emocional
// que el pink noise no provee — el oído percibe melodía/armonía como
// "intención" en lugar de solo "presencia". Apps premium (Calm, Endel)
// tienen pads compuestos por musicians; aquí lo sintetizamos pero
// elegimos cuerdas armónicas justas (consonancias) para que suene
// natural, no atonal.
//
// Voicing por intent — cada uno transmite una emocionalidad distinta:
//   calma  → E minor (E2 G2 B2) — solemne, contenido
//   enfoque→ D major (D2 F#2 A2) — claro, focalizado
//   energia→ G major (G2 B2 D3) — abierto, ascendente
//   reset  → C major (C2 G2 E3) — neutral, restaurativo
//
// Volumen 0.010 — debajo del umbral de "música presente"; el oído lo
// integra como ambiente, no como track. LFO sutil 0.05Hz por nota
// → respiración orgánica imperceptible pero acumulativa.

let _bedOscillators = [];
let _bedLfos = [];
let _bedFilter = null;
let _bedGain = null;

const INTENT_CHORDS = {
  calma:   [82.41, 98.00, 123.47],   // E2 G2 B2 (E minor)
  enfoque: [73.42, 92.50, 110.00],   // D2 F#2 A2 (D major)
  energia: [98.00, 123.47, 146.83],  // G2 B2 D3 (G major)
  reset:   [65.41, 98.00, 164.81],   // C2 G2 E3 (C major)
};

function startMusicBed(intent) {
  const masterBus = ensureMasterBus(); if (!masterBus) return;
  if (_bedGain) return; // ya activo
  const c = masterBus.c;
  const chord = INTENT_CHORDS[intent] || INTENT_CHORDS.calma;

  _bedGain = c.createGain();
  _bedGain.gain.value = 0;

  // Lowpass dedicado a 800Hz — solo el cuerpo armónico bajo. Los altos
  // del sine pad sonarían ásperos en sostenido; el lowpass hace que
  // suene "warm/woody" como un string pad lejano.
  _bedFilter = c.createBiquadFilter();
  _bedFilter.type = "lowpass";
  _bedFilter.frequency.value = 800;
  _bedFilter.Q.value = 0.7;
  _bedFilter.connect(_bedGain);
  _bedGain.connect(masterBus.in);

  for (let i = 0; i < chord.length; i++) {
    const f = chord[i];
    // 2 osciladores detuneados ±7 cents → pad ancho, no afinación cruda
    for (const detune of [-7, 7]) {
      const o = c.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      o.detune.value = detune;
      o.connect(_bedFilter);
      o.start();
      _bedOscillators.push(o);

      // LFO sutil de detune adicional ~0.05Hz amplitud 2 cents
      // → respiración orgánica desincronizada por nota.
      const lfo = c.createOscillator();
      const lfoGain = c.createGain();
      lfo.frequency.value = 0.04 + i * 0.012; // distinto por nota
      lfoGain.gain.value = 2;
      lfo.connect(lfoGain);
      lfoGain.connect(o.detune);
      lfo.start();
      _bedLfos.push(lfo);
    }
  }

  // Fade-in 12s — entrada IMPERCEPTIBLE; el user no nota cuándo entra
  // el pad, solo siente "más profundidad" en la mezcla. Volume 0.010
  // está debajo del umbral de "está sonando música" — apenas perfil
  // armónico que el oído integra como espacio.
  _bedGain.gain.linearRampToValueAtTime(0.010, c.currentTime + 12);
}

function stopMusicBed() {
  if (!_bedGain) return;
  const c = gAC();
  if (c) _bedGain.gain.linearRampToValueAtTime(0, c.currentTime + 4);
  setTimeout(() => {
    try {
      for (const o of _bedOscillators) { o.stop(); o.disconnect(); }
      for (const l of _bedLfos) { l.stop(); l.disconnect(); }
      _bedFilter?.disconnect();
      _bedGain?.disconnect();
    } catch {}
    _bedOscillators = [];
    _bedLfos = [];
    _bedFilter = null;
    _bedGain = null;
  }, 4500);
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
// Counter de sources activos — usado por auto-leveler para pausar
// metering cuando no hay nada sonando (CPU saving + evita drift falso).
let _activeSourceCount = 0;

function createLayeredTone({
  freq,
  durSec,
  peakVol,
  attack = 0.01,
  type = "sine",
  filterStart = 8000,
  filterEnd = 1400,
  detuneCents = 5,
  spatial = false,
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
  const oscs = [];
  for (const detune of [-detuneCents, detuneCents]) {
    const o = c.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    o.connect(filter);
    o.start(now);
    o.stop(now + durSec + 0.1);
    oscs.push(o);
  }

  filter.connect(voiceGain);

  let panner = null;
  // Spatial routing: PannerNode HRTF posiciona en XYZ del campo virtual.
  // HRTF es CARO (cada panner hace HRIR convolution). Disponer al
  // terminar es crítico: sin disposal, 12 sparks/sec × 60s = 720 panners
  // vivos en memoria → leak garantizado y CPU drift.
  if (spatial) {
    panner = c.createPanner();
    panner.panningModel = "HRTF";
    panner.distanceModel = "inverse";
    panner.refDistance = 1;
    panner.maxDistance = 50;
    panner.rolloffFactor = 1;
    panner.positionX.value = (Math.random() - 0.5) * 1.6;
    panner.positionY.value = (Math.random() - 0.5) * 1.0;
    panner.positionZ.value = -1 + Math.random() * 0.5;
    voiceGain.connect(panner);
    panner.connect(dry);
    panner.connect(wet);
  } else {
    voiceGain.connect(dry);
    voiceGain.connect(wet);
  }

  // DISPOSAL: cuando el último oscilador termina, desconectamos toda
  // la cadena (oscs + filter + voiceGain + panner). Sin esto los nodos
  // permanecen referenciados por el grafo de Web Audio y no se GC.
  // Resultado del leak: app trabada después de 30-60s de sesión activa.
  _activeSourceCount += oscs.length;
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    try {
      for (const o of oscs) { try { o.disconnect(); } catch {} }
      try { filter.disconnect(); } catch {}
      try { voiceGain.disconnect(); } catch {}
      if (panner) { try { panner.disconnect(); } catch {} }
    } finally {
      _activeSourceCount = Math.max(0, _activeSourceCount - oscs.length);
    }
  };
  // onended del último oscilador (todos terminan al mismo tiempo)
  oscs[oscs.length - 1].onended = dispose;
  // Safety: timeout backup por si onended no dispara (raro, pero ocurre
  // cuando AudioContext se cierra antes que el sonido termine).
  setTimeout(dispose, (durSec + 0.3) * 1000);
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
    const f = Math.max(260, Math.min(1100, freq || 640));
    const v = duckedVolume(Math.max(0.01, Math.min(0.12, volume || 0.055)));
    // Spark con reverb + detune mínimo (3 cents) + posicionamiento HRTF
    // espacial (el spark "viene de un punto" en el campo 3D virtual).
    // Cada spark en una posición XYZ randomizada → red neuronal "alive".
    createLayeredTone({
      freq: f,
      durSec: 0.18,
      peakVol: v,
      attack: 0.004,
      filterStart: 12000,
      filterEnd: 4000,
      detuneCents: 3,
      spatial: true,
    });
  } catch (e) {}
}

// ─── Breath phase tick ──────────────────────────────────
// Cue auditivo sutil sincronizado con las transiciones de fase
// respiratoria del orb. Volúmenes muy bajos (0.018–0.04) para vivir
// DEBAJO del umbral de la voz y del chord — se percibe como
// "respiración del espacio" más que como nota.
//
// Diseño por fase:
//   INHALA  → sweep ascendente (196 → 392 Hz), filtro abre, ~720ms.
//             Triangle wave (suave, expansivo). El cuerpo lee "subir".
//   SOSTÉN  → tono breve sostenido (294 Hz), filtro casi cerrado, 280ms.
//             Apenas audible — refuerza el "freeze" del orb.
//   EXHALA  → sweep descendente (392 → 147 Hz), filtro cierra, ~860ms.
//             Sine puro, attack más lento. El cuerpo lee "soltar".
//   VACÍO   → ping muy soft (523 Hz, breve, sine), 180ms. Anclaje
//             central sin presencia — quietud con un pulso mínimo.
//
// Throttle: una llamada cada 600ms mínimo. bp normalmente cambia cada
// 2-8s, pero defensivo ante doble-fire.
let _lastBreathTickTs = 0;
export function playBreathTick(label, intent = "enfoque") {
  const now = Date.now();
  if (now - _lastBreathTickTs < 600) return;
  _lastBreathTickTs = now;
  try {
    const bus = ensureReverbBus();
    if (!bus) return;
    const { c, wet, dry } = bus;
    if (c.state === "suspended") c.resume();
    const t0 = c.currentTime;

    const norm = String(label || "").toUpperCase();
    let cfg;
    if (norm.startsWith("INHAL")) {
      cfg = { f0: 196, f1: 392, dur: 0.72, attack: 0.06, type: "triangle", filtStart: 1200, filtEnd: 4800, peak: 0.038 };
    } else if (norm.startsWith("MANT") || norm.startsWith("SOST")) {
      cfg = { f0: 294, f1: 294, dur: 0.28, attack: 0.04, type: "sine", filtStart: 2200, filtEnd: 1400, peak: 0.022 };
    } else if (norm.startsWith("EXHAL")) {
      cfg = { f0: 392, f1: 147, dur: 0.86, attack: 0.10, type: "sine", filtStart: 3400, filtEnd: 800, peak: 0.034 };
    } else if (norm.startsWith("VAC") || norm.startsWith("EMPT")) {
      cfg = { f0: 523, f1: 523, dur: 0.18, attack: 0.005, type: "sine", filtStart: 4200, filtEnd: 2400, peak: 0.018 };
    } else {
      return;
    }

    // Intent flavor: energia sube +2 semitonos, calma baja -2,
    // enfoque/reset neutral. Mantiene cohesión con el chord pad.
    const semitone = Math.pow(2, 1 / 12);
    const shift = intent === "energia" ? Math.pow(semitone, 2) : intent === "calma" ? Math.pow(semitone, -2) : 1;
    const f0 = cfg.f0 * shift;
    const f1 = cfg.f1 * shift;

    const v = duckedVolume(cfg.peak);

    // Envelope
    const g = c.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(v, t0 + cfg.attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + cfg.dur);

    // Lowpass envelope — IN abre, OUT cierra
    const filt = c.createBiquadFilter();
    filt.type = "lowpass";
    filt.Q.value = 0.7;
    filt.frequency.setValueAtTime(cfg.filtStart, t0);
    filt.frequency.exponentialRampToValueAtTime(Math.max(200, cfg.filtEnd), t0 + cfg.dur * 0.85);

    // Dos osciladores con detune ±4 cents — riqueza sin batimientos
    const oscs = [];
    for (const detune of [-4, 4]) {
      const o = c.createOscillator();
      o.type = cfg.type;
      o.frequency.setValueAtTime(f0, t0);
      if (f1 !== f0) {
        o.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t0 + cfg.dur * 0.95);
      }
      o.detune.value = detune;
      o.connect(filt);
      o.start(t0);
      o.stop(t0 + cfg.dur + 0.05);
      oscs.push(o);
    }
    filt.connect(g);
    g.connect(dry);
    g.connect(wet);

    // Disposal idéntico a createLayeredTone
    _activeSourceCount += oscs.length;
    let disposed = false;
    const dispose = () => {
      if (disposed) return;
      disposed = true;
      try {
        for (const o of oscs) { try { o.disconnect(); } catch {} }
        try { filt.disconnect(); } catch {}
        try { g.disconnect(); } catch {}
      } finally {
        _activeSourceCount = Math.max(0, _activeSourceCount - oscs.length);
      }
    };
    oscs[oscs.length - 1].onended = dispose;
    setTimeout(dispose, (cfg.dur + 0.3) * 1000);
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
    if (!_binauralEnabled) return;
    const masterBus = ensureMasterBus(); if (!masterBus) return;
    const c = masterBus.c;
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
    // Binaural ahora pasa por master bus → mastering chain compartida.
    _binauralGain.connect(masterBus.in);

    // Ambient bed pink noise auto-start con binaural (presence layer).
    startAmbientBed();
    // Musical pad por intent — gated por _musicBedEnabled (settings).
    if (_musicBedEnabled) startMusicBed(type);

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
    // Ambient bed se detiene en sincronía con binaural.
    stopAmbientBed();
    stopMusicBed();
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
// TODOS los patrones pasan por vibrate() wrapper para respetar
// _hapticIntensity (settings.hapticIntensity).
export function hap(t, sO, hO) {
  if (hO !== false) {
    if (t === "go") vibrate([20, 40, 20]);
    else if (t === "ph") vibrate(12);
    else if (t === "ok") vibrate([40, 60, 40, 60, 80]);
    else if (t === "tick") vibrate(5);
    else if (t === "tap") vibrate(8);
  }
  if (sO !== false) {
    try {
      if (t === "go") playChord([432, 648], 0.5, 0.05);
      else if (t === "ph") playChord([528, 660, 792], 0.5, 0.04);
      else if (t === "ok") { playChord([432, 528, 648, 792], 1.5, 0.06); setTimeout(() => playChord([528, 648, 792], 1.2, 0.025), 300); }
      else if (t === "tap") playChord([440], 0.08, 0.02);
    } catch (e) {}
  }
}

export function hapticPhase(type) {
  if (type === "breath") vibrate([30, 60, 30]);
  else if (type === "body") vibrate([50, 30, 50, 30, 50]);
  else if (type === "mind") vibrate([20, 100, 20]);
  else if (type === "focus") vibrate([80, 20, 80]);
  else vibrate(30);
}

// Patrones gradient — micro-pulsos con duraciones variables que el
// cuerpo lee como "intensidad creciente/decreciente" aunque vibrate API
// solo soporta on/off binario.
//
// CRÍTICO: piso de 12ms en cada pulso. El motor háptico de cualquier
// teléfono (iOS si soporta vibrate, Android, etc.) NO percibe pulsos
// menores. Antes había pulsos de 4-6ms → invisibles físicamente.
// Con hapticIntensity=light (0.6x), un pulso 12ms se vuelve 7ms
// (borderline pero perceptible).
//
// INHALA: rampa ascendente — pulsos crecen.
// EXHALA: rampa descendente — pulsos decaen.
// MANTÉN: dos golpes firmes con silencio largo entre.
// SOSTÉN/VACÍO: pulsos mínimos perceptibles + gaps largos.
export function hapticBreath(label) {
  if (label === "INHALA") {
    // 6 pulsos crecientes 12→32ms, ~250ms total
    vibrate([12, 35, 16, 30, 20, 25, 24, 20, 28, 15, 32]);
  } else if (label === "EXHALA") {
    // 6 pulsos decrecientes 32→12ms (espejo)
    vibrate([32, 15, 28, 20, 24, 25, 20, 30, 16, 35, 12]);
  } else if (label === "MANTÉN") {
    // Dos golpes firmes con silencio sostenido — freeze cue
    vibrate([20, 80, 20]);
  } else {
    // SOSTÉN/VACÍO — barely-there pero perceptible
    vibrate([14, 100, 14]);
  }
}

// ─── Haptic Firma ─────────────────────────────────────────
export function hapticSignature(kind) {
  if (kind === "ignition") vibrate([18, 30, 26, 20, 40, 40, 100]);
  else if (kind === "checkpoint") vibrate([50, 50, 50]);
  else if (kind === "phaseShift") vibrate([12, 18, 24]);
  else if (kind === "award") vibrate([30, 40, 30, 40, 90]);
  else vibrate(15);
}

export function hapticPreShift() {
  vibrate([6, 40, 10]);
}

// Countdown gradient — escalada de tensión 3→2→1.
// Piso 14ms para garantizar perceptibilidad en motor háptico.
//   Step 3: tap suave + eco (anticipation suave)
//   Step 2: 3 pulsos crecientes (tensión sube)
//   Step 1: anticipation crescendo + golpe + follow-through
//          (cinematográfico: el cuerpo se prepara para GO)
export function hapticCountdown(step) {
  if (step === 3) vibrate([14, 30, 18]);
  else if (step === 2) vibrate([16, 20, 22, 15, 28]);
  else if (step === 1) vibrate([18, 25, 24, 20, 30, 60, 36, 25, 44]);
}

// Tick auditivo del countdown — nota de cristal breve, sine pura,
// volumen bajo para vivir DEBAJO de la voz "Tres/Dos/Uno". Frecuencia
// asciende cada tick (440→528→660→880 Hz para 3/2/1/GO) creando un
// arco tonal. Sumada al voice, el cuerpo lee la cadencia rítmica
// del countdown incluso si el TTS varía en latencia.
export function playCountdownTick(step) {
  try {
    const freq = step === 3 ? 440 : step === 2 ? 528 : step === 1 ? 660 : 880;
    // Usa el bus master + reverb (cohesión con resto de audio). Volumen 0.022
    // — debajo del voice (~0.06) y debajo del breath tick (0.038).
    playChord([freq], 0.42, 0.022);
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

// Lista de voces disponibles para un locale, ordenadas premium-first.
// Cada item: { name, lang, isPremium, isLocal }. Para el voice picker UI.
export function listAvailableVoices(locale = "es") {
  if (!_voices.length) return [];
  const prefix = (locale || "es").slice(0, 2).toLowerCase();
  const premiumNames = PREMIUM_VOICE_NAMES[prefix] || [];
  const localeFilter = (v) => v.lang?.toLowerCase().startsWith(prefix);
  const matchesPremium = (v) => premiumNames.some((n) => v.name === n || (v.name && v.name.includes(n)));
  const isRobotic = (v) =>
    /^Microsoft (David|Mark|Zira|Hazel) (Desktop|Mobile)/.test(v.name || "") ||
    v.name === "Google" ||
    v.name === "fred";
  const filtered = _voices.filter((v) => localeFilter(v) && !isRobotic(v));
  const decorated = filtered.map((v) => ({
    name: v.name,
    lang: v.lang,
    isPremium: matchesPremium(v),
    isLocal: !!v.localService,
  }));
  // Premium primero, luego local, luego resto (alfabético).
  decorated.sort((a, b) => {
    if (a.isPremium !== b.isPremium) return a.isPremium ? -1 : 1;
    if (a.isLocal !== b.isLocal) return a.isLocal ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return decorated;
}

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
// Lista priorizada por SUAVIDAD/CALIDEZ — no solo por calidad técnica.
// Una voz "Premium" puede ser técnicamente nítida pero sonar firme/seca.
// Para coaching de meditación queremos voces breathy, contemplativas,
// con timbre cálido. Orden empírico de softness probado en cada OS.
//
// Apple Premium > Apple Enhanced > Apple legacy > Google Wavenet >
//   Microsoft Neural Online > Microsoft Desktop legacy (último recurso).
//
// Para SPANISH específicamente: Mónica suena más serena que Paulina,
// que es ligeramente más declamatoria. Marisol (macOS) es la más cálida.
const PREMIUM_VOICE_NAMES = {
  es: [
    // iOS / macOS — orden por calidez/suavidad
    "Mónica (Premium)", "Mónica (Enhanced)", "Mónica",
    "Marisol",                                            // macOS — la más cálida
    "Paulina (Premium)", "Paulina (Enhanced)", "Paulina",
    "Esperanza",
    // Microsoft Edge Neural Online — voces "naturales"
    "Microsoft Dalia Online (Natural) - Spanish (Mexico)",
    "Microsoft Elvira Online (Natural) - Spanish (Spain)",
    "Microsoft Helena Online (Natural) - Spanish (Spain)",
    // Google Android Wavenet — fluidas, no robóticas
    "Spanish (Mexico)", "Spanish (Spain)", "Spanish (Latin America)",
  ],
  en: [
    // Voces por CALIDEZ — no por populrity
    "Allison (Premium)", "Allison",                        // soft US, contemplativa
    "Ava (Premium)", "Ava (Enhanced)", "Ava",              // soft US, breathy
    "Samantha (Premium)", "Samantha (Enhanced)", "Samantha",
    "Moira",                                                // Irish, muy cálida
    "Karen",                                                // Australian, warm
    "Tessa",                                                // South African, contemplative
    "Microsoft Aria Online (Natural)",
    "Microsoft Jenny Online (Natural)",
    "Google UK English Female",
  ],
  pt: ["Luciana (Premium)", "Luciana (Enhanced)", "Luciana", "Joana"],
  fr: ["Amélie (Premium)", "Amélie (Enhanced)", "Amélie", "Aurélie"],
  de: ["Anna (Premium)", "Anna (Enhanced)", "Anna", "Petra"],
  it: ["Alice (Premium)", "Alice (Enhanced)", "Alice", "Federica"],
};

function pickVoice(locale = "es") {
  if (!_voices.length) return null;
  const prefix = (locale || "es").slice(0, 2).toLowerCase();

  // 0) User preference (settings) tiene precedencia absoluta.
  if (_userVoicePreference) {
    const userHit = _voices.find((v) => v.name === _userVoicePreference);
    if (userHit) return userHit;
    // Si la voz preferida ya no está disponible, fallback a auto-pick.
  }

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
// silencioso periódico — pero SOLO durante la "ventana viva" después
// del último speak() real (90s). Antes corría siempre → carga inútil
// constante incluso cuando user no está en sesión.
let _keepaliveTimer = null;
const KEEPALIVE_WINDOW_MS = 90000; // 90s después del último speak real
function startVoiceKeepalive() {
  if (_keepaliveTimer || typeof window === "undefined" || !window.speechSynthesis) return;
  _keepaliveTimer = setInterval(() => {
    try {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) return;
      // Si pasaron > KEEPALIVE_WINDOW_MS desde el último speak real,
      // detener el keepalive — la app está idle, no hay razón de
      // mantener viva la API. Si user vuelve a hablar, speak() llama
      // startVoiceKeepalive de nuevo.
      if (Date.now() - _lastSpeechTs > KEEPALIVE_WINDOW_MS) {
        clearInterval(_keepaliveTimer);
        _keepaliveTimer = null;
        return;
      }
      // Ping: utterance vacía silenciosa cada 8s mantiene la API viva.
      const u = new SpeechSynthesisUtterance("");
      u.volume = 0;
      window.speechSynthesis.speak(u);
    } catch {}
  }, 8000);
}

// Insertamos micro-pausas naturales — el TTS browser por default lee
// frases sin respiración, sonando declamativo. Una coma adicional al
// inicio + período al final relaja la prosodia. Aplica solo a
// frases >12 chars (palabras sueltas como "INHALA" no necesitan break).
function softenProsody(text) {
  if (!text || typeof text !== "string") return text;
  const t = text.trim();
  if (t.length < 12) return t; // labels cortos: leave alone
  // Quitar punto final si lo trae, agregar coma inicial + período suave.
  const clean = t.replace(/[.!?]+$/, "");
  return `${clean}.`;
}

function buildUtterance(text, circadian, loc) {
  const softText = softenProsody(text);
  const u = new SpeechSynthesisUtterance(softText);
  u.lang = voiceLangTag(loc);

  // WHISPER-LEVEL — browser TTS tiene techo perceptual; el único modo de
  // que NO suene robotic es minimizar exposición y volumen. Voz íntima,
  // casi susurro. El user activa device volume si quiere más presencia.
  //
  // rate 0.83: lentitud contemplativa (igual a Calm "noche"). Menor de
  //   0.78 entra en territorio "ralentizado robótico", no.
  // pitch 0.93: ligeramente más grave = timbre cálido. Piso firme 0.85.
  // volume 0.62: WHISPER. Antes 0.78 era íntima; 0.62 es susurro real.
  //   El TTS suena menos "anuncio" cuando es bajo — los artefactos de
  //   prosodia se diluyen en el silencio relativo.
  // Precedencia: user override > circadian > default 0.83.
  // El user control vive en settings (st.voiceRate, persistente).
  const rateOverride = _userVoiceRate ?? circadian?.voiceRate;
  u.rate = Math.max(0.6, Math.min(1.4, typeof rateOverride === "number" ? rateOverride : 0.83));
  u.pitch = Math.max(0.85, Math.min(1.05, circadian?.voicePitch || 0.93));
  u.volume = 0.62;
  const v = pickVoice(loc);
  if (v) u.voice = v;
  // Trackear estado para sidechain ducking dinámico — antes solo flag
  // _isSpeaking; ahora dispara envelope smooth en el master duckGain.
  u.onstart = () => { _isSpeaking = true; applyDuck(true); };
  u.onend = () => { _isSpeaking = false; applyDuck(false); };
  u.onerror = () => { _isSpeaking = false; applyDuck(false); };
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
