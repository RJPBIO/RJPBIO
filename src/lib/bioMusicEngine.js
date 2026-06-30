/* ═══════════════════════════════════════════════════════════════
   BIO-MUSIC ENGINE — sinfonía procedural en capas del HRV en vivo.
   ───────────────────────────────────────────────────────────────
   Arreglo (todo en la TONALIDAD/modo de la firma del usuario):
     · Pad sostenido    — el acorde (voicing por consonancia).
     · Shimmer alto      — emerge con coherencia + HRV.
     · Arpegio agendado  — melodía que camina el modo al ritmo del pulso.
     · Pulso grave        — un latido suave en cada beat (bpm).
     · Espacio            — delay con feedback (cola/reverb ligero).
   Filtro lowpass = brillo (HRV). Master = dinámica (calidad de señal).

   Scheduler lookahead (setInterval + cola Web Audio) para arpegio + pulso
   sin jitter. Gesture-gated, SSR-safe, ramps suaves (anti-click). Sin deps.
   ═══════════════════════════════════════════════════════════════ */

const DEFAULT_SIG = { rootHz: 110, mode: [0, 2, 4, 5, 7, 9, 11], oscType: "sine", detuneCents: 5, baseOctaveShift: 0 };
const PAD_VOICES = 5;
const ARP_PATTERN = [0, 2, 4, 7, 4, 2, 4, 6]; // grados (camina el modo, sube-baja)
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.12; // s

export function createBioMusicEngine() {
  let ctx = null;
  let master = null;
  let bus = null;
  let filter = null;
  let pad = [];
  let shimmer = null;
  let shimmerGain = null;
  let padGain = null;
  let started = false;
  let timer = null;

  let sig = DEFAULT_SIG;
  // estado dinámico (de update)
  const dyn = { arpRate: 2, arpGain: 0, pulseHz: 1, level: 0.3, lastBeat: 0 };
  let nextArpTime = 0;
  let nextBeatTime = 0;
  let arpIdx = 0;

  function degreeToFreq(degree, extraOct = 0) {
    const m = sig.mode || DEFAULT_SIG.mode;
    const oct = Math.floor(degree / 7) + extraOct;
    const idx = ((degree % 7) + 7) % 7;
    const semi = m[idx] + 12 * oct + (sig.baseOctaveShift || 0);
    return sig.rootHz * Math.pow(2, semi / 12);
  }

  function voice(freq, when, dur, peak, type) {
    if (!ctx || freq <= 0) return;
    const o = ctx.createOscillator();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, when);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(Math.max(0.0002, peak), when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g);
    g.connect(filter);
    o.start(when);
    o.stop(when + dur + 0.06);
  }

  function scheduler() {
    if (!ctx) return;
    const now = ctx.currentTime;
    // Arpegio
    const arpInterval = 1 / Math.max(0.5, Math.min(8, dyn.arpRate || 2));
    while (nextArpTime < now + SCHEDULE_AHEAD) {
      if (dyn.arpGain > 0.02) {
        const deg = ARP_PATTERN[arpIdx % ARP_PATTERN.length];
        voice(degreeToFreq(deg, 1), nextArpTime, 0.32, dyn.arpGain * 0.13, sig.oscType);
        arpIdx += 1;
      }
      nextArpTime += arpInterval;
      if (nextArpTime < now) nextArpTime = now + arpInterval; // recover from drift
    }
    // Pulso grave (latido)
    const beatInterval = 1 / Math.max(0.5, Math.min(3, dyn.pulseHz || 1));
    while (nextBeatTime < now + SCHEDULE_AHEAD) {
      voice(degreeToFreq(0, -1), nextBeatTime, 0.26, 0.07 + dyn.level * 0.07, "sine");
      nextBeatTime += beatInterval;
      if (nextBeatTime < now) nextBeatTime = now + beatInterval;
    }
  }

  function start(signature) {
    if (started) return true;
    if (typeof window === "undefined") return false;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      sig = { ...DEFAULT_SIG, ...(signature || {}) };
      ctx = new AC();
      const t = ctx.currentTime;

      master = ctx.createGain();
      master.gain.value = 0.0001;
      master.connect(ctx.destination);

      bus = ctx.createGain();
      bus.gain.value = 1;
      bus.connect(master);

      // Espacio: delay con feedback (cola tipo reverb ligero).
      const delay = ctx.createDelay(1.0);
      delay.delayTime.value = 0.28;
      const fb = ctx.createGain();
      fb.gain.value = 0.34;
      const wet = ctx.createGain();
      wet.gain.value = 0.32;
      delay.connect(fb);
      fb.connect(delay);
      delay.connect(wet);
      wet.connect(master);

      filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 700;
      filter.Q.value = 0.7;
      filter.connect(bus);
      filter.connect(delay);

      // Pad sostenido.
      padGain = ctx.createGain();
      padGain.gain.value = 0.0001;
      padGain.connect(filter);
      for (let i = 0; i < PAD_VOICES; i++) {
        const o = ctx.createOscillator();
        o.type = sig.oscType;
        o.frequency.value = sig.rootHz;
        o.detune.value = (i - 2) * (sig.detuneCents || 5);
        const g = ctx.createGain();
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(padGain);
        o.start();
        pad.push({ o, g });
      }

      // Shimmer alto.
      shimmer = ctx.createOscillator();
      shimmer.type = "sine";
      shimmer.frequency.value = degreeToFreq(0, 2);
      shimmerGain = ctx.createGain();
      shimmerGain.gain.value = 0.0001;
      shimmer.connect(shimmerGain);
      shimmerGain.connect(filter);
      shimmer.start();

      padGain.gain.setValueAtTime(0.0001, t);
      padGain.gain.linearRampToValueAtTime(0.16, t + 1.8);
      master.gain.setValueAtTime(0.0001, t);
      master.gain.linearRampToValueAtTime(0.22, t + 1.8);

      nextArpTime = t + 0.2;
      nextBeatTime = t + 0.2;
      arpIdx = 0;
      timer = setInterval(scheduler, LOOKAHEAD_MS);
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
    const degrees = Array.isArray(p.chordDegrees) && p.chordDegrees.length ? p.chordDegrees : [0, 2, 4];
    pad.forEach((v, i) => {
      if (i < degrees.length) {
        v.o.frequency.setTargetAtTime(degreeToFreq(degrees[i]), t, 0.4);
        v.g.gain.setTargetAtTime(0.2, t, 0.5);
      } else {
        v.g.gain.setTargetAtTime(0.0001, t, 0.5);
      }
    });
    if (filter) filter.frequency.setTargetAtTime(400 + (p.brightness ?? 0.5) * 2800, t, 0.5);
    if (shimmerGain) shimmerGain.gain.setTargetAtTime(0.0001 + (p.shimmer ?? 0) * 0.05, t, 0.6);
    if (master) master.gain.setTargetAtTime(0.06 + (p.level ?? 0.3) * 0.2, t, 0.6);
    dyn.arpRate = p.arpRate || 2;
    dyn.arpGain = p.arpGain ?? 0;
    dyn.pulseHz = p.pulseHz || 1;
    dyn.level = p.level ?? 0.3;
  }

  function stop() {
    if (!started || !ctx) return;
    if (timer) { clearInterval(timer); timer = null; }
    const t = ctx.currentTime;
    try {
      master.gain.cancelScheduledValues(t);
      master.gain.setTargetAtTime(0.0001, t, 0.4);
    } catch { /* noop */ }
    const c = ctx;
    const toStop = [...pad.map((v) => v.o), shimmer].filter(Boolean);
    setTimeout(() => {
      try { toStop.forEach((o) => o.stop()); } catch { /* noop */ }
      try { c.close(); } catch { /* noop */ }
    }, 1000);
    started = false;
    pad = [];
    shimmer = null;
    ctx = null;
    master = null;
    bus = null;
    filter = null;
    padGain = null;
    shimmerGain = null;
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
