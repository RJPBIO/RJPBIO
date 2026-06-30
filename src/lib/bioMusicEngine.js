/* ═══════════════════════════════════════════════════════════════
   BIO-MUSIC ENGINE — síntesis procedural Web Audio del estado HRV.
   ───────────────────────────────────────────────────────────────
   Pad de 5 voces (osciladores) afinadas a los intervalos del acorde que
   manda bioMusic.mapStateToMusic. Un lowpass abre/cierra el brillo según
   la HRV; un LFO de tremolo late al ritmo del pulso (bpm). Transiciones
   con setTargetAtTime → sin clicks; la música "respira" entre armonía y
   disonancia en tiempo real.

   Gesture-gated (start() debe llamarse desde un tap por la autoplay
   policy). SSR-safe (no toca window/AudioContext fuera del browser).
   Sin dependencias.
   ═══════════════════════════════════════════════════════════════ */

const ROOT_HZ = 110; // A2 — raíz cálida
const VOICES = 5;

export function createBioMusicEngine() {
  let ctx = null;
  let master = null;
  let filter = null;
  let lfo = null;
  let lfoGain = null;
  let voices = [];
  let started = false;

  function start() {
    if (started) return true;
    if (typeof window === "undefined") return false;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      ctx = new AC();
      const t = ctx.currentTime;

      master = ctx.createGain();
      master.gain.value = 0.0001;
      master.connect(ctx.destination);

      filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 700;
      filter.Q.value = 0.7;
      filter.connect(master);

      // Tremolo LFO al ritmo del latido (modula el master gain).
      lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 1; // Hz (= bpm/60), se actualiza en update()
      lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.04; // profundidad sutil del tremolo
      lfo.connect(lfoGain);
      lfoGain.connect(master.gain);
      lfo.start();

      for (let i = 0; i < VOICES; i++) {
        const o = ctx.createOscillator();
        o.type = i === 0 ? "sine" : "triangle";
        o.frequency.value = ROOT_HZ;
        const g = ctx.createGain();
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(filter);
        o.start();
        voices.push({ o, g });
      }

      // Fade-in del master.
      master.gain.setValueAtTime(0.0001, t);
      master.gain.linearRampToValueAtTime(0.18, t + 1.6);
      started = true;
      return true;
    } catch {
      started = false;
      return false;
    }
  }

  function update(p) {
    if (!started || !ctx || !p) return;
    const t = ctx.currentTime;
    const chord = Array.isArray(p.chord) && p.chord.length ? p.chord : [0, 4, 7];
    voices.forEach((v, i) => {
      if (i < chord.length) {
        const freq = ROOT_HZ * Math.pow(2, chord[i] / 12);
        v.o.frequency.setTargetAtTime(freq, t, 0.4);
        v.g.gain.setTargetAtTime(0.14, t, 0.5);
      } else {
        v.g.gain.setTargetAtTime(0.0001, t, 0.5);
      }
    });
    // Brillo (0..1) → cutoff 400..3000 Hz.
    if (filter) filter.frequency.setTargetAtTime(400 + (p.brightness ?? 0.5) * 2600, t, 0.5);
    // Latido → frecuencia del tremolo.
    if (lfo) lfo.frequency.setTargetAtTime(p.pulseHz && p.pulseHz > 0 ? p.pulseHz : 1, t, 0.6);
    // Volumen general por calidad de señal.
    if (master) master.gain.setTargetAtTime(0.05 + (p.level ?? 0.3) * 0.2, t, 0.7);
  }

  function stop() {
    if (!started || !ctx) return;
    const t = ctx.currentTime;
    try {
      master.gain.cancelScheduledValues(t);
      master.gain.setTargetAtTime(0.0001, t, 0.4);
    } catch { /* noop */ }
    const c = ctx;
    const vs = voices;
    const l = lfo;
    setTimeout(() => {
      try { vs.forEach((v) => v.o.stop()); } catch { /* noop */ }
      try { l && l.stop(); } catch { /* noop */ }
      try { c.close(); } catch { /* noop */ }
    }, 900);
    started = false;
    voices = [];
    ctx = null;
    master = null;
    filter = null;
    lfo = null;
    lfoGain = null;
  }

  return {
    start,
    update,
    stop,
    get running() {
      return started;
    },
  };
}
