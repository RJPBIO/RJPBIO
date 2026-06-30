/* ═══════════════════════════════════════════════════════════════
   BIO-MUSIC SIGNATURE — la identidad sinfónica de cada usuario.
   ───────────────────────────────────────────────────────────────
   Cada usuario tiene una TONALIDAD, un MODO y un TIMBRE propios,
   derivados de forma determinista de su identidad + su fisiología base.
   Así su sinfonía suena reconociblemente suya entre sesiones, mientras el
   HRV en vivo modula la armonía/dinámica del momento.

   Determinista (hash, no Math.random): mismo usuario → misma firma.
   Pura, sin dependencias.
   ═══════════════════════════════════════════════════════════════ */

// Raíces graves agradables (Hz). Pentatónica de tónicas: todas suenan bien.
const ROOTS = [
  { hz: 65.41, name: "C2" },
  { hz: 73.42, name: "D2" },
  { hz: 82.41, name: "E2" },
  { hz: 98.0, name: "G2" },
  { hz: 110.0, name: "A2" },
];

// Modos (semitonos desde la raíz) — cada uno un color emocional distinto.
export const MODES = {
  lydian: { semis: [0, 2, 4, 6, 7, 9, 11], color: "luminoso" },
  ionian: { semis: [0, 2, 4, 5, 7, 9, 11], color: "claro" },
  mixolydian: { semis: [0, 2, 4, 5, 7, 9, 10], color: "cálido" },
  dorian: { semis: [0, 2, 3, 5, 7, 9, 10], color: "esperanzado" },
  aeolian: { semis: [0, 2, 3, 5, 7, 8, 10], color: "profundo" },
};

const MODE_KEYS = Object.keys(MODES);

// Hash FNV-1a determinista.
function hashStr(s) {
  let h = 2166136261;
  const str = String(s || "anon");
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// El cronotipo tiñe el modo: matutino → luminoso; vespertino → profundo.
function modeFromChronotype(chronotype) {
  const t = chronotype?.type || chronotype?.category || (typeof chronotype === "string" ? chronotype : null);
  if (!t) return null;
  if (/morning|matut/i.test(t)) return /definite|defin/i.test(t) ? "lydian" : "ionian";
  if (/evening|vesper/i.test(t)) return /definite|defin/i.test(t) ? "aeolian" : "dorian";
  return "mixolydian"; // intermedio
}

/**
 * @param {object} args — { userId, baselineRmssd, chronotype }
 */
export function buildMusicSignature({ userId, baselineRmssd, chronotype } = {}) {
  const h = hashStr(userId);
  const root = ROOTS[h % ROOTS.length];
  const modeName = modeFromChronotype(chronotype) || MODE_KEYS[(h >>> 3) % MODE_KEYS.length];
  const mode = MODES[modeName] || MODES.ionian;

  // Octava base del pad sube un poco si la HRV base es alta (sistema más
  // "brillante"); detune + timbre dan carácter individual.
  const baseOctaveShift = Number.isFinite(baselineRmssd) && baselineRmssd >= 45 ? 12 : 0;
  const detuneCents = 3 + (h % 7); // 3..9 cents de anchura
  const oscType = (h >>> 5) % 2 === 0 ? "sine" : "triangle";

  return {
    rootHz: root.hz,
    rootName: root.name,
    modeName,
    modeColor: mode.color,
    mode: mode.semis,
    baseOctaveShift,
    detuneCents,
    oscType,
    seed: h,
  };
}
