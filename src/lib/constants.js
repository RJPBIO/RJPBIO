/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — CONSTANTS & DATA
   ═══════════════════════════════════════════════════════════════ */

export const CATS = ["Reset", "Activación", "Protocolo"];

// Ladder neuro-fisiológico: cada rango es un estado cerebral real.
// g = glifo para avatar (letra griega, símbolo final para Ignición).
// d = descripción corta del estado mostrada en el collapsible de progresión.
export const LVL = [
  { n: "Delta",    g: "δ", m: 0,   mx: 3,   c: "#94A3B8", d: "Reposo profundo. El sistema consolida aprendizajes." },
  { n: "Theta",    g: "θ", m: 3,   mx: 10,  c: "#6366F1", d: "Meditación y creatividad. Baja el ruido externo." },
  { n: "Alpha",    g: "α", m: 10,  mx: 30,  c: "#059669", d: "Calma alerta. El foco se sostiene sin esfuerzo." },
  { n: "Beta",     g: "β", m: 30,  mx: 75,  c: "#D97706", d: "Atención activa. Rendimiento bajo carga cognitiva." },
  { n: "Gamma",    g: "γ", m: 75,  mx: 175, c: "#DC2626", d: "Cognición pico. Integración multi-sensorial." },
  { n: "Ignición", g: "★", m: 175, mx: 999, c: "#7C3AED", d: "Maestría del sistema. Operador neural completo." },
];

export const DN = ["L", "M", "X", "J", "V", "S", "D"];

export const MOODS = [
  { id: 1, label: "Tensión alta", icon: "stress", value: 1, color: "#EF4444" },
  { id: 2, label: "Agotamiento", icon: "drain", value: 2, color: "#F59E0B" },
  { id: 3, label: "Estable", icon: "neutral", value: 3, color: "#64748B" },
  { id: 4, label: "Enfocado", icon: "sharp", value: 4, color: "#0D9488" },
  { id: 5, label: "Óptimo", icon: "peak", value: 5, color: "#059669" },
];

export const ENERGY_LEVELS = [
  { id: 1, label: "Bajo", v: 1 },
  { id: 2, label: "Medio", v: 2 },
  { id: 3, label: "Alto", v: 3 },
];

export const WORK_TAGS = [
  "Pre-reunión", "Post-reunión", "Inicio jornada", "Mitad del día",
  "Fin de jornada", "Bajo presión", "Pausa activa",
];

export const INTENTS = [
  { id: "calma", label: "Calma", icon: "calm", desc: "Reducir tensión", color: "#059669" },
  { id: "enfoque", label: "Enfoque", icon: "focus", desc: "Concentración", color: "#22D3EE" },
  { id: "energia", label: "Energía", icon: "energy", desc: "Activación", color: "#F59E0B" },
  { id: "reset", label: "Reset", icon: "reset", desc: "Reinicio", color: "#8B5CF6" },
];

export const DIF_LABELS = ["Básico", "Intermedio", "Avanzado"];

export const SOUNDSCAPES = [
  { id: "off", n: "Silencio", cost: 0 },
  { id: "wind", n: "Viento suave", cost: 25 },
  { id: "drone", n: "Drone tonal", cost: 50 },
  { id: "bnarl", n: "Binaural", cost: 75 },
];

export const AM = {
  streak7: "7 días de racha",
  streak14: "14 días — Disciplina neural",
  streak30: "30 días consecutivos",
  streak60: "60 días — Maestro de hábitos",
  coherencia90: "Coherencia >90%",
  sessions50: "50 sesiones",
  sessions100: "100 sesiones — Centurión",
  sessions250: "250 sesiones — Arquitecto Neural",
  mood5: "Sesión en rendimiento óptimo",
  allProtos: "Probó los 14 protocolos",
  time60: "60 minutos totales invertidos",
  time300: "5 horas de entrenamiento neural",
  earlyBird: "Sesión antes de las 7am",
  nightOwl: "Sesión después de las 10pm",
  calibrated: "Calibración neural completada",
  weekPerfect: "7/7 días en una semana",
  moodRecovery: "Subió de 1-2 a 4-5 en una sesión",
  bioSignal80: "BioSignal Score >80",
};

export const STATUS_MSGS = [
  { min: 0, max: 40, label: "Calibrando", color: "#94A3B8" },
  { min: 40, max: 65, label: "Activación", color: "#6366F1" },
  { min: 65, max: 82, label: "Rendimiento", color: "#0D9488" },
  { min: 82, max: 100, label: "Óptimo", color: "#059669" },
];

export const POST_MSGS = [
  "Dos minutos bien invertidos. Tu cerebro lo nota.",
  "Sesión potente. El efecto dura 60-90 minutos.",
  "Hiciste algo que el 95% no hace: pausar para rendir.",
  "Tu sistema acaba de recalibrarse.",
  "Consistencia mata talento. Hoy sumaste.",
];

export const GREETINGS = [
  "Tu sistema está listo.",
  "Cada sesión cuenta. Hoy puede ser la mejor.",
  "Tu cerebro recuerda el hábito.",
];

export const DAILY_PHRASES = [
  "Hoy tu sistema se recalibra.",
  "120 segundos pueden cambiar las próximas 4 horas.",
  "No meditas para escapar. Meditas para llegar.",
  "Tu mente es el instrumento. Esta es la afinación.",
  "El rendimiento empieza en la pausa.",
  "Dos minutos de silencio interno. El mundo puede esperar.",
  "No necesitas más tiempo. Necesitas más presencia.",
  "La claridad no se busca. Se construye.",
  "Este es tu momento de ventaja.",
  "Tu cuerpo sabe resetear. Solo necesita permiso.",
  "La calma no es debilidad. Es tecnología.",
  "Hoy entrenas lo que nadie ve: tu mente.",
  "120 segundos. Sin distracciones. Solo tú.",
  "El ruido mental tiene un interruptor. Estás a punto de tocarlo.",
];

export const PROG_7 = [
  { day: 1, pid: 1, t: "Día 1: Respira", d: "Tu primera conexión con el sistema nervioso." },
  { day: 2, pid: 2, t: "Día 2: Enfoca", d: "Activa tu corteza prefrontal con intención." },
  { day: 3, pid: 3, t: "Día 3: Decide", d: "Aprende a priorizar bajo presión." },
  { day: 4, pid: 6, t: "Día 4: Ancla", d: "Presencia ejecutiva. Tu cuerpo como base." },
  { day: 5, pid: 8, t: "Día 5: Intensifica", d: "Enfoque extremo. Nivel avanzado." },
  { day: 6, pid: 13, t: "Día 6: Realinea", d: "Protocolo OMEGA completo. 6 fases." },
  { day: 7, pid: 14, t: "Día 7: Enciende", d: "OMNIA. Activación humana total." },
];

export const CLARITY_LEVELS = [
  { l: "Nublado", v: 1 },
  { l: "Regular", v: 2 },
  { l: "Claro", v: 3 },
  { l: "Cristalino", v: 4 },
];

export const DS = {
  totalSessions: 0,
  streak: 0,
  todaySessions: 0,
  lastDate: null,
  weeklyData: [0, 0, 0, 0, 0, 0, 0],
  weekNum: null,
  coherencia: 64,
  resiliencia: 66,
  capacidad: 73,
  achievements: [],
  vCores: 0,
  history: [],
  totalTime: 0,
  soundOn: true,
  hapticOn: true,
  themeMode: "auto",
  moodLog: [],
  firstDone: false,
  favs: [],
  prevWeekData: [0, 0, 0, 0, 0, 0, 0],
  progDay: 0,
  soundscape: "off",
  unlockedSS: ["off"],
  neuralBaseline: null,
  onboardingComplete: false,
  sessionGoal: 2,
  // v5 fields
  calibrationHistory: [],
  bestStreak: 0,
  // v7 — bioneural: HRV, RHR, sleep, chronotype, resonance, NOM-035, evidence
  hrvLog: [],
  rhrLog: [],
  lastSleepHours: null,
  sleepTargetHours: 7.5,
  chronotype: null,
  resonanceFreq: null,
  nom035Results: [],
  breathTechniqueLog: [],
  cognitiveLog: [],
  orgMode: false,
  orgTeamResponses: [],
  // Streak freeze — pausa honesta (máx 2/mes, no miente)
  streakFreezes: { usedThisMonth: [], lastFreezeMonth: null },
  // v9 — learning state para el motor neural
  // banditArms: UCB1-Normal por intent ({ calma|reset|energia|enfoque }: { n, sum, sumsq })
  // predictionResiduals: rolling log predicho vs real para calibrar delta
  banditArms: {},
  predictionResiduals: { history: [] },
  // v10 — recordatorios diarios (opt-in)
  remindersEnabled: false,
  reminderHour: 9,
  reminderMinute: 0,
  // v11 — historial de instrumentos psicométricos (PSS-4, SWEMWBS, PHQ-2)
  instruments: [],
  // v12 — programs: trayectorias curadas multi-día.
  // activeProgram: el programa en curso (null si no hay).
  //   { id: string, startedAt: ms, completedSessionDays: number[] }
  // programHistory: programas completados (archivo).
  //   { id: string, startedAt: ms, completedAt: ms, completionFraction: 0-1 }
  activeProgram: null,
  programHistory: [],
};

// ─── Neural State Color Mapping ──────────────────────────
// Colores adaptados al estado cognitivo actual
export const NEURAL_COLORS = {
  calma: { primary: "#059669", glow: "#05966920", gradient: "135deg, #059669, #10B981" },
  enfoque: { primary: "#22D3EE", glow: "#22D3EE20", gradient: "135deg, #22D3EE, #6366F1" },
  energia: { primary: "#F59E0B", glow: "#F59E0B20", gradient: "135deg, #F59E0B, #FBBF24" },
  reset: { primary: "#8B5CF6", glow: "#8B5CF620", gradient: "135deg, #8B5CF6, #A78BFA" },
  stress: { primary: "#DC2626", glow: "#DC262620", gradient: "135deg, #DC2626, #F43F5E" },
  optimal: { primary: "#059669", glow: "#05966930", gradient: "135deg, #059669, #22D3EE" },
};
