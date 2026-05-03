// Fixtures realistas para Tab Datos cuando state esta vacio en dev.
// NO mutan store. Override con ?empty=true para ver con state real.

const DAY = 24 * 60 * 60 * 1000;
const NOW = () => Date.now();

// 28 dias de composite con leve trayectoria ascendente + ruido organico.
export function fixtureComposite28d() {
  const base = NOW();
  const out = [];
  for (let i = 27; i >= 0; i--) {
    const ts = base - i * DAY;
    const trend = 50 + (27 - i) * 0.45;
    const wave = Math.sin((27 - i) * 0.7) * 4;
    const noise = ((i * 9301 + 49297) % 233280) / 233280 * 8 - 4;
    out.push({ ts, value: Math.max(20, Math.min(95, Math.round(trend + wave + noise))) });
  }
  return out;
}

export function fixtureDimensions28d() {
  const base = NOW();
  const out = { focus: [], calm: [], energy: [] };
  for (let i = 27; i >= 0; i--) {
    const ts = base - i * DAY;
    const fwave = Math.sin((27 - i) * 0.55) * 6;
    const cwave = Math.cos((27 - i) * 0.4) * 5;
    const ewave = Math.sin((27 - i) * 0.8) * 7;
    out.focus.push({ ts,  value: Math.round(60 + fwave + (27 - i) * 0.5) });
    out.calm.push({ ts,   value: Math.round(54 + cwave + (27 - i) * 0.2) });
    out.energy.push({ ts, value: Math.round(58 + ewave + (27 - i) * 0.4) });
  }
  return out;
}

// 10 sesiones recientes — protocolId del catalogo + delta + ts.
export const FIXTURE_SESSIONS = [
  { ts: NOW() - 2 * 60 * 60 * 1000,        p: 4,  int: "energia", deltaC: +5, d: 120 },
  { ts: NOW() - 8 * 60 * 60 * 1000,        p: 1,  int: "calma",   deltaC: +3, d: 120 },
  { ts: NOW() - 1 * DAY - 2 * 60 * 60000,  p: 2,  int: "enfoque", deltaC: +6, d: 120 },
  { ts: NOW() - 1 * DAY - 8 * 60 * 60000,  p: 3,  int: "reset",   deltaC:  0, d: 120 },
  { ts: NOW() - 2 * DAY,                   p: 4,  int: "energia", deltaC: +4, d: 120 },
  { ts: NOW() - 3 * DAY,                   p: 6,  int: "calma",   deltaC: -2, d: 120 },
  { ts: NOW() - 3 * DAY - 6 * 60 * 60000,  p: 5,  int: "enfoque", deltaC: +7, d: 120 },
  { ts: NOW() - 4 * DAY,                   p: 7,  int: "reset",   deltaC: +1, d: 120 },
  { ts: NOW() - 5 * DAY,                   p: 11, int: "calma",   deltaC: +2, d: 120 },
  { ts: NOW() - 6 * DAY,                   p: 12, int: "enfoque", deltaC: +3, d: 120 },
];

export const FIXTURE_PROGRESS = {
  vCores: 1247,
  vCoresThisWeek: 12,
  streak: 7,
  bestStreak: 14,
  achievementsCount: 8,
  achievementsThisMonth: 1,
};

// Achievement id -> label humano + icono lucide name.
export const ACHIEVEMENT_LABELS = {
  first_session:    { label: "Primera sesión",            icon: "Sparkles"  },
  mood5:            { label: "Mood óptimo registrado",     icon: "TrendingUp" },
  calibrated:       { label: "Calibración completada",     icon: "Compass"   },
  week_streak:      { label: "Racha de 7 días",            icon: "Flame"     },
  early_bird:       { label: "Sesión antes de las 7am",    icon: "Sunrise"   },
  night_owl:        { label: "Sesión nocturna",            icon: "Moon"      },
  deep_focus:       { label: "Foco profundo desbloqueado", icon: "Crosshair" },
  consistent:       { label: "Constancia 14 días",         icon: "CheckCircle2" },
};

export const FIXTURE_ACHIEVEMENTS_RECENT = ["calibrated", "early_bird", "week_streak"];

// Programa activo simulado (Neural Baseline dia 4 de 14).
export const FIXTURE_ACTIVE_PROGRAM = {
  id: "neural-baseline",
  startedAt: NOW() - 3 * DAY,
  completedSessionDays: [1, 2, 3],
};

// Catalog metadata sincronizado con src/lib/programs.js (campo `sb`).
// Backend es la fuente de verdad para nombre brand y descriptor literal.
export const PROGRAM_CATALOG_META = [
  { id: "neural-baseline",     tag: "NB", name: "Neural Baseline",     descriptor: "14 días · descubre tu intent ganador" },
  { id: "recovery-week",       tag: "RW", name: "Recovery Week",        descriptor: "7 días · descarga progresiva post-crisis" },
  { id: "focus-sprint",        tag: "FS", name: "Focus Sprint",         descriptor: "5 días matinales · enfoque extremo" },
  { id: "burnout-recovery",    tag: "BR", name: "Burnout Recovery",     descriptor: "4 semanas · recuperación clínica MBI" },
  { id: "executive-presence",  tag: "EP", name: "Executive Presence",   descriptor: "10 días · presencia ejecutiva inquebrantable" },
];

// Descriptor corto post-prefix ("Día X de Y · ...") para card de programa
// activo. Derivado del `sb` de cada programa, removiendo el prefix de duracion.
export const ACTIVE_PROGRAM_DESCRIPTOR = {
  "neural-baseline":   "descubre tu intent ganador",
  "recovery-week":     "descarga progresiva post-crisis",
  "focus-sprint":      "enfoque extremo",
  "burnout-recovery":  "recuperación clínica MBI",
  "executive-presence": "presencia ejecutiva inquebrantable",
};
