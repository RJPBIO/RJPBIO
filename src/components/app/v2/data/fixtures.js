// Catalog metadata para Tab Datos — NO es data del usuario.
//
// Phase 6D SP3 — eliminados los fakes que se servían como datos del user
// cuando history.length < 5:
//   - fixtureComposite28d() (sparkline 28 días sintetizado)
//   - fixtureDimensions28d() (focus/calm/energy waves)
//   - FIXTURE_SESSIONS (10 sesiones inventadas)
//   - FIXTURE_PROGRESS (vCores 1247 · racha 7 · 8 logros)
//   - FIXTURE_ACHIEVEMENTS_RECENT (3 IDs)
//   - FIXTURE_ACTIVE_PROGRAM ("Neural Baseline · Día 4 de 14")
//
// DataV2 ahora muestra DataEmpty cuando history vacío, vista parcial
// honesta cuando 1-4 sessions, vista completa con data real cuando 5+.
//
// Lo que queda son metadata catalogs (i18n labels, program catalog, active
// program descriptors) que son fuente de verdad del producto, no fakes.

// Achievement id -> label humano + icono lucide name. Catalog estable.
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
