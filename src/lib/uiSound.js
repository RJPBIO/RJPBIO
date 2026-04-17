"use client";
/* ═══════════════════════════════════════════════════════════════
   UI SOUND — firma sonora de interfaz
   ═══════════════════════════════════════════════════════════════
   Micro-tones generados con WebAudio (sin samples). Cada acción
   tiene su huella: nav (tab switch), open (modal), close, confirm
   (submit positivo), error, select (command palette).

   Diseño: tonos cortos (60–140ms), volumen bajo (0.04–0.08),
   envolvente rápida para no solapar con el audio de sesión.
   ═══════════════════════════════════════════════════════════════ */

let ctx = null;
let lastPlay = 0;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") {
    try { ctx.resume(); } catch { /* noop */ }
  }
  return ctx;
}

function tone(freq, duration = 0.09, type = "sine", gain = 0.05, attack = 0.005, release = 0.04, offset = 0) {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime + offset;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(gain, now + attack);
  g.gain.setValueAtTime(gain, now + duration - release);
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(g).connect(c.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function guard(enabled) {
  if (enabled === false) return false;
  const t = Date.now();
  if (t - lastPlay < 35) return false;
  lastPlay = t;
  return true;
}

export const uiSound = {
  nav(enabled = true) {
    if (!guard(enabled)) return;
    tone(880, 0.06, "sine", 0.04, 0.003, 0.03);
    tone(1320, 0.06, "sine", 0.035, 0.003, 0.03, 0.035);
  },

  open(enabled = true) {
    if (!guard(enabled)) return;
    tone(520, 0.05, "triangle", 0.04, 0.003, 0.025);
    tone(780, 0.07, "triangle", 0.035, 0.003, 0.04, 0.03);
  },

  close(enabled = true) {
    if (!guard(enabled)) return;
    tone(780, 0.05, "triangle", 0.035, 0.003, 0.025);
    tone(440, 0.07, "triangle", 0.03, 0.003, 0.04, 0.03);
  },

  confirm(enabled = true) {
    if (!guard(enabled)) return;
    tone(660, 0.07, "sine", 0.05, 0.003, 0.04);
    tone(990, 0.1, "sine", 0.045, 0.003, 0.06, 0.05);
  },

  error(enabled = true) {
    if (!guard(enabled)) return;
    tone(220, 0.06, "square", 0.04, 0.002, 0.03);
    tone(185, 0.08, "square", 0.035, 0.002, 0.04, 0.04);
  },

  select(enabled = true) {
    if (!guard(enabled)) return;
    tone(1760, 0.04, "sine", 0.035, 0.002, 0.025);
  },
};

export default uiSound;
