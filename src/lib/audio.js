/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — AUDIO ENGINE
   Binaural, ambient, soundscapes, haptic, voice
   ═══════════════════════════════════════════════════════════════ */

let _aC = null;
export function gAC() {
  if (!_aC && typeof window !== "undefined") {
    try { _aC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  }
  return _aC;
}

export function playChord(f, d, v) {
  try {
    const c = gAC(); if (!c) return;
    if (c.state === "suspended") c.resume();
    f.forEach((fr) => {
      const o = c.createOscillator(); const g = c.createGain();
      o.connect(g); g.connect(c.destination); o.type = "sine"; o.frequency.value = fr;
      g.gain.setValueAtTime(0, c.currentTime);
      g.gain.linearRampToValueAtTime((v || 0.04) / f.length, c.currentTime + 0.08);
      g.gain.linearRampToValueAtTime(0, c.currentTime + d);
      o.start(c.currentTime); o.stop(c.currentTime + d);
    });
  } catch (e) {}
}

// ─── Brown noise ambient ──────────────────────────────────
let _ambNode = null, _ambGain = null;
export function startAmbient() {
  try {
    const c = gAC(); if (!c) return;
    if (c.state === "suspended") c.resume();
    if (_ambNode) return;
    const bs = 4096;
    _ambNode = c.createScriptProcessor ? c.createScriptProcessor(bs, 1, 1) : null;
    if (!_ambNode) return;
    _ambGain = c.createGain(); _ambGain.gain.value = 0;
    _ambGain.connect(c.destination); _ambNode.connect(_ambGain);
    let last = 0;
    _ambNode.onaudioprocess = (e) => {
      const o = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < o.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; o[i] = last * 3.5; }
    };
    _ambGain.gain.linearRampToValueAtTime(0.12, c.currentTime + 2);
  } catch (e) {}
}

export function stopAmbient() {
  try {
    if (_ambGain) { const c = gAC(); if (c) _ambGain.gain.linearRampToValueAtTime(0, c.currentTime + 1); }
    setTimeout(() => { if (_ambNode) { _ambNode.disconnect(); _ambNode = null; } if (_ambGain) { _ambGain.disconnect(); _ambGain = null; } }, 1200);
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
      const bs = 4096;
      _ssNode = c.createScriptProcessor ? c.createScriptProcessor(bs, 1, 1) : null;
      if (!_ssNode) return;
      let last = 0;
      _ssNode.onaudioprocess = (e) => { const o = e.outputBuffer.getChannelData(0); for (let i = 0; i < o.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.01 * w) / 1.01; o[i] = last * 2.5; } };
      _ssNode.connect(_ssGain); _ssGain.gain.linearRampToValueAtTime(0.08, c.currentTime + 3);
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
let _binauralL = null, _binauralR = null, _binauralGain = null, _binauralPan = 0;
export function startBinaural(type) {
  try {
    const c = gAC(); if (!c) return;
    stopBinaural();
    _binauralGain = c.createGain(); _binauralGain.gain.value = 0; _binauralGain.connect(c.destination);
    const panL = c.createStereoPanner(); const panR = c.createStereoPanner();
    _binauralL = c.createOscillator(); _binauralR = c.createOscillator();
    _binauralL.type = "sine"; _binauralR.type = "sine";
    if (type === "enfoque") { _binauralL.frequency.value = 200; _binauralR.frequency.value = 214; }
    else if (type === "energia") { _binauralL.frequency.value = 200; _binauralR.frequency.value = 218; }
    else if (type === "calma") { _binauralL.frequency.value = 200; _binauralR.frequency.value = 210; }
    else if (type === "reset") { _binauralL.frequency.value = 200; _binauralR.frequency.value = 206; }
    else { _binauralL.frequency.value = 200; _binauralR.frequency.value = 210; }
    function rotatePan() { panL.pan.value = Math.sin(_binauralPan) * 0.8; panR.pan.value = Math.cos(_binauralPan) * 0.8; _binauralPan += 0.015; if (_binauralGain) requestAnimationFrame(rotatePan); }
    _binauralL.connect(panL); _binauralR.connect(panR); panL.connect(_binauralGain); panR.connect(_binauralGain);
    _binauralL.start(); _binauralR.start(); rotatePan();
    _binauralGain.gain.linearRampToValueAtTime(0.025, c.currentTime + 4);
  } catch (e) {}
}

export function stopBinaural() {
  try {
    if (_binauralGain) { const c = gAC(); if (c) _binauralGain.gain.linearRampToValueAtTime(0, c.currentTime + 2); }
    setTimeout(() => {
      try { if (_binauralL) { _binauralL.stop(); _binauralL.disconnect(); } if (_binauralR) { _binauralR.stop(); _binauralR.disconnect(); } if (_binauralGain) _binauralGain.disconnect(); _binauralL = null; _binauralR = null; _binauralGain = null; } catch (e) {}
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

export function loadVoices() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    _voices = window.speechSynthesis.getVoices();
  }
}

export function unlockVoice() {
  if (_voiceUnlocked || typeof window === "undefined" || !window.speechSynthesis) return;
  try { const u = new SpeechSynthesisUtterance(""); u.volume = 0; window.speechSynthesis.speak(u); _voiceUnlocked = true; } catch (e) {}
}

export function speak(text, circadian, voiceOn = true) {
  if (!voiceOn || typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-MX"; u.rate = circadian?.voiceRate || 0.92; u.pitch = circadian?.voicePitch || 1.0; u.volume = 0.85;
    const v = _voices.find((v) => v.lang === "es-MX") || _voices.find((v) => v.lang === "es-ES") || _voices.find((v) => v.lang.startsWith("es"));
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  } catch (e) {}
}

export function speakNow(text, circadian, voiceOn = true) {
  if (!voiceOn || typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-MX"; u.rate = circadian?.voiceRate || 0.92; u.pitch = circadian?.voicePitch || 1.0; u.volume = 0.85;
    const v = _voices.find((v) => v.lang === "es-MX") || _voices.find((v) => v.lang === "es-ES") || _voices.find((v) => v.lang.startsWith("es"));
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  } catch (e) {}
}

export function stopVoice() {
  try { if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
}

// ─── Persistence ──────────────────────────────────────────
export function ldS(DS) {
  try {
    if (typeof window !== "undefined") {
      const r = localStorage.getItem("bio-g2");
      if (r) {
        const parsed = JSON.parse(r);
        const data = { ...DS, ...parsed };
        if (!data._v || data._v < 3) { data._v = 3; data._migrated = Date.now(); }
        return data;
      }
    }
  } catch (e) { console.error("Load error:", e); }
  return { ...DS, _v: 3, _created: Date.now() };
}

export function svS(d) {
  try { if (typeof window !== "undefined") { localStorage.setItem("bio-g2", JSON.stringify(d)); } } catch (e) { console.error("Save error:", e); }
}

export function exportData(st) {
  try {
    const blob = new Blob([JSON.stringify(st, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "bio-ignicion-data.json"; a.click();
    URL.revokeObjectURL(url);
  } catch (e) {}
}
