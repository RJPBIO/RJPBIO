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
// BUG FIX: las keys deben coincidir EXACTAMENTE con los ids que el engine
// pushea a state.achievements (src/lib/neural.js). Antes este catálogo usaba
// snake_case (early_bird, night_owl, week_streak) que NO matcheaban los ids
// reales camelCase (earlyBird, nightOwl, streak7) → la UI mostraba el id crudo
// ("allProtos", "nightOwl"). Labels en español tomados de constants.js.
export const ACHIEVEMENT_LABELS = {
  first_session:    { label: "Primera sesión",                  icon: "Sparkles"      },
  streak7:          { label: "Racha de 7 días",                 icon: "Flame"         },
  streak14:         { label: "14 días — Disciplina neural",     icon: "Flame"         },
  streak30:         { label: "30 días consecutivos",            icon: "Flame"         },
  streak60:         { label: "60 días — Maestro de hábitos",    icon: "Flame"         },
  coherencia90:     { label: "Coherencia >90%",                 icon: "Activity"      },
  sessions50:       { label: "50 sesiones",                     icon: "Award"         },
  sessions100:      { label: "100 sesiones — Centurión",        icon: "Award"         },
  sessions250:      { label: "250 sesiones — Arquitecto Neural", icon: "Award"        },
  mood5:            { label: "Sesión en rendimiento óptimo",    icon: "TrendingUp"    },
  moodRecovery:     { label: "Recuperación en una sesión",      icon: "TrendingUp"    },
  allProtos:        { label: "Probó los 14 protocolos",         icon: "Grid3x3"       },
  time60:           { label: "60 minutos invertidos",           icon: "Clock"         },
  time300:          { label: "5 horas de entrenamiento",        icon: "Clock"         },
  earlyBird:        { label: "Sesión antes de las 7am",         icon: "Sunrise"       },
  nightOwl:         { label: "Sesión después de las 10pm",      icon: "Moon"          },
  calibrated:       { label: "Calibración completada",          icon: "Compass"       },
  weekPerfect:      { label: "7/7 días en una semana",          icon: "CalendarCheck" },
  bioSignal80:      { label: "BioSignal Score >80",             icon: "Activity"      },
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
