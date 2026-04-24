/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — CURATED PROGRAMS

   Trayectorias multi-día que usan los 17 protocolos como
   ingredientes. Convierten la biblioteca de sesiones sueltas en
   un producto de **journey** (Calm/Headspace style programs).

   Schema:
     id       — slug estable (para persistencia)
     n        — display name
     sb       — subtitle, value prop de 1 línea
     tg       — 2-3 char abbrev visual (consistente con protocol.tg)
     cl       — color dominante (del intent principal)
     intent   — "calma" | "enfoque" | "energia" | "reset" | "mixed"
     duration — días totales (no nº sesiones — incluye días de reposo)
     window   — franja horaria sugerida: "morning" | "afternoon" | "evening" | "any"
     sb_long  — descripción larga (pantalla detalle)
     rationale— explicación del arco (por qué funciona)
     evidence — cita breve (si aplica)
     sessions — array de { day, protocolId, durMult?, note? }
                · day es 1-based (día del programa)
                · protocolId referencia lib/protocols.js
                · durMult default 1 (normal)
                · days sin entrada = días de reposo (schedule sparse OK)

   Reglas de diseño:
     — Intensidad progresiva: los primeros días arrancan suaves,
       escalan hacia el punto medio, cierran con integración.
     — Variedad de intent: programas "mixed" rotan 3-4 intents;
       programas focalizados mantienen 1 intent dominante.
     — Completación NO requiere streak perfecto: grace period
       de 1 día contempla vida real; 2+ días perdidos pausan.

   Completación y recompensas: (gestionado en el store)
     — Cada día con `sessions` entry es un "required day".
     — Completar un required day = completedSessionDays += [day].
     — Progreso = completedSessions / requiredSessions.
     — 100% = program complete → XP bonus + achievement.
   ═══════════════════════════════════════════════════════════════ */

import { P as PROTOCOLS } from "./protocols";

/**
 * Busca un protocolo por id. Helper exportado para que el UI pueda
 * resolver el nombre/color sin duplicar lógica.
 * @param {number} id
 * @returns {object|null}
 */
export function getProtocolById(id) {
  if (typeof id !== "number") return null;
  return PROTOCOLS.find((p) => p.id === id) || null;
}

export const PROGRAMS = [
  // ─── 1. Neural Baseline ────────────────────────────────────────
  // Onboarding progresivo. Enseña un intent distinto cada 2 días.
  // Ideal para usuarios nuevos que no saben qué intent les funciona.
  {
    id: "neural-baseline",
    n: "Neural Baseline",
    sb: "14 días · descubre tu intent ganador",
    tg: "NB",
    cl: "#22D3EE",
    intent: "mixed",
    duration: 14,
    window: "morning",
    sb_long:
      "Arco sistemático por los 4 intents: calma, enfoque, energía y reset. En 14 días descubres cuál responde mejor tu sistema — los últimos días adaptan a lo que funcionó.",
    rationale:
      "Sin datos personales iniciales, el motor adaptativo no puede elegir bien. Neural Baseline recopila señales de respuesta a cada intent para que tras 14 días el sistema te recomiende con precisión calibrada a tu fisiología.",
    sessions: [
      { day: 1, protocolId: 1, note: "calma · reinicio" },
      { day: 2, protocolId: 15, note: "calma · suspiro" },
      { day: 3, protocolId: 2, note: "enfoque · coherencia" },
      { day: 4, protocolId: 5, note: "enfoque · visual" },
      { day: 5, protocolId: 4, note: "energia · pulse" },
      { day: 6, protocolId: 10, note: "energia · atomic" },
      { day: 7, protocolId: 3, note: "reset · ejecutivo" },
      { day: 8, protocolId: 7, note: "reset · descarga" },
      { day: 9, protocolId: 6, note: "integración · acero" },
      { day: 10, protocolId: 11, note: "integración · anclaje" },
      { day: 11, protocolId: 12, note: "integración · ascenso" },
      { day: 12, protocolId: 13, note: "síntesis · OMEGA" },
      { day: 13, protocolId: 14, note: "síntesis · OMNIA" },
      { day: 14, protocolId: 16, note: "sello · resonancia vagal" },
    ],
  },

  // ─── 2. Recovery Week ──────────────────────────────────────────
  // Post-crisis / post-burnout. 7 días progresivos.
  {
    id: "recovery-week",
    n: "Recovery Week",
    sb: "7 días · descarga progresiva post-crisis",
    tg: "RW",
    cl: "#059669",
    intent: "calma",
    duration: 7,
    window: "any",
    sb_long:
      "Después de una semana intensa, crisis emocional, o carga sostenida. Arco de 7 días que arranca con descarga suave y termina con integración profunda. Calma dominante con reset intercalado.",
    rationale:
      "La recuperación neural tras estrés agudo no es lineal: requiere descarga (días 1-3), consolidación (días 4-5), e integración (días 6-7). Secuencia diseñada para reconstruir reservas parasimpáticas sin sobre-exigir.",
    sessions: [
      { day: 1, protocolId: 15, note: "entrada suave · suspiro fisiológico" },
      { day: 2, protocolId: 1, note: "reinicio parasimpático" },
      { day: 3, protocolId: 3, note: "reset ejecutivo" },
      { day: 4, protocolId: 11, note: "quantum grounding" },
      { day: 5, protocolId: 6, note: "grounded steel" },
      { day: 6, protocolId: 16, note: "resonancia vagal · 10 min" },
      { day: 7, protocolId: 13, note: "OMEGA · realineación completa" },
    ],
  },

  // ─── 3. Focus Sprint ───────────────────────────────────────────
  // 5 días matutinos de alta demanda cognitiva. Activación dominante.
  {
    id: "focus-sprint",
    n: "Focus Sprint",
    sb: "5 días matinales · enfoque extremo",
    tg: "FS",
    cl: "#22D3EE",
    intent: "enfoque",
    duration: 5,
    window: "morning",
    sb_long:
      "Semana de deadline, lanzamiento, o cualquier periodo de alta demanda cognitiva. 5 días consecutivos matutinos que entrenan progresivamente el enfoque: de coherencia cardíaca (día 1) a enfoque extremo (día 5).",
    rationale:
      "Protocolos de enfoque requieren un substrato autonómico estable. Arrancar con coherencia cardíaca calibra el sistema nervioso; recalibración visual + ascenso mental preparan la corteza prefrontal; Lightning Focus y OMNIA son los picos — aplicables solo cuando ya hay base.",
    sessions: [
      { day: 1, protocolId: 2, note: "coherencia cardíaca base" },
      { day: 2, protocolId: 5, note: "recalibración visual" },
      { day: 3, protocolId: 12, note: "ascenso neural" },
      { day: 4, protocolId: 8, note: "enfoque extremo" },
      { day: 5, protocolId: 14, note: "activación humana total" },
    ],
  },

  // ─── 4. Burnout Recovery ──────────────────────────────────────
  // 4 semanas · 14 sesiones · escalado clínico MBI-aware.
  // Basado en literatura de recuperación post-burnout:
  // semana 1 descarga · semana 2 consolidación · semana 3 re-activación
  // suave · semana 4 integración y prevención de recaída.
  {
    id: "burnout-recovery",
    n: "Burnout Recovery",
    sb: "4 semanas · recuperación clínica MBI",
    tg: "BR",
    cl: "#059669",
    intent: "calma",
    duration: 28,
    window: "any",
    sb_long:
      "Programa de 4 semanas para recuperación de burnout (clasificación MBI: exhaustion + disengagement + reduced efficacy). Escalado con días de reposo. NO sustituye atención clínica — lo complementa.",
    rationale:
      "Burnout no es solo estrés alto: incluye despersonalización y pérdida de eficacia. Protocolo clínico de 4 semanas con descarga progresiva (S1), anclaje corporal (S2), re-activación controlada (S3), e integración con prevención (S4). Incluye días de reposo explícitos — sobre-ejercitar protocolos durante burnout es contraproducente.",
    evidence:
      "Alineado con Maslach & Leiter (2016) modelo MBI, Shaufeli (2017) work engagement, y Goessl et al. 2017 meta-análisis RFB en burnout.",
    sessions: [
      // Semana 1 — descarga
      { day: 1, protocolId: 15, note: "semana 1 · entrada suave" },
      { day: 3, protocolId: 1, note: "reinicio parasimpático" },
      { day: 5, protocolId: 15, note: "suspiro fisiológico · repite" },
      { day: 7, protocolId: 17, note: "NSDR · 10 min restoration" },
      // Semana 2 — consolidación / anclaje
      { day: 9, protocolId: 11, note: "semana 2 · anclaje profundo" },
      { day: 11, protocolId: 6, note: "grounded steel" },
      { day: 14, protocolId: 16, note: "resonancia vagal · 10 min" },
      // Semana 3 — re-activación controlada
      { day: 16, protocolId: 3, note: "semana 3 · reset ejecutivo suave" },
      { day: 18, protocolId: 7, note: "HyperShift · descarga emocional" },
      { day: 21, protocolId: 9, note: "steel core reset" },
      // Semana 4 — integración y cierre
      { day: 23, protocolId: 13, note: "semana 4 · OMEGA" },
      { day: 25, protocolId: 12, note: "neural ascension" },
      { day: 27, protocolId: 16, note: "resonancia vagal · consolidación" },
      { day: 28, protocolId: 17, note: "NSDR · sello integrativo" },
    ],
  },

  // ─── 5. Executive Presence ─────────────────────────────────────
  // 10 días alternos · steel family · líderes bajo presión sostenida.
  {
    id: "executive-presence",
    n: "Executive Presence",
    sb: "10 días · presencia ejecutiva inquebrantable",
    tg: "EP",
    cl: "#059669",
    intent: "calma",
    duration: 10,
    window: "morning",
    sb_long:
      "Para líderes en posiciones de alta exposición pública y decisión crítica. 10 días alternos (5 sesiones + 5 de reposo) centrados en la familia Steel: presencia que combina calma con no-claudicación.",
    rationale:
      "Presencia ejecutiva no es calma pura (aburrida) ni energía pura (ansiosa) — es la paradoja acero+calma. Arco de 10 días alternando Grounded Steel, Steel Core Reset, Quantum Grounding, y OMEGA para consolidar el callback 'inquebrantable' como estado operativo repetible.",
    sessions: [
      { day: 1, protocolId: 6, note: "grounded steel · base" },
      { day: 3, protocolId: 11, note: "quantum grounding" },
      { day: 5, protocolId: 9, note: "steel core reset" },
      { day: 7, protocolId: 6, note: "grounded steel · profundización" },
      { day: 9, protocolId: 13, note: "OMEGA · síntesis" },
      { day: 10, protocolId: 14, note: "OMNIA · sello encendido" },
    ],
  },
];

/**
 * Busca un programa por id.
 * @param {string} id
 * @returns {object|null}
 */
export function getProgramById(id) {
  if (typeof id !== "string") return null;
  return PROGRAMS.find((p) => p.id === id) || null;
}

/**
 * Número de días del programa que tienen sesión (no reposo).
 * @param {object} program
 * @returns {number}
 */
export function programRequiredSessions(program) {
  if (!program || !Array.isArray(program.sessions)) return 0;
  return program.sessions.length;
}

/**
 * Día actual del programa basado en startedAt.
 * Retorna 1-based. Si el programa ya terminó, retorna program.duration.
 * Si startedAt es inválido, retorna 1.
 * @param {object} program
 * @param {number} startedAt — timestamp ms
 * @param {number} [now] — timestamp actual (default Date.now)
 * @returns {number}
 */
export function currentProgramDay(program, startedAt, now) {
  if (!program) return 1;
  const nowMs = typeof now === "number" ? now : Date.now();
  const startMs = typeof startedAt === "number" ? startedAt : nowMs;
  const daysSinceStart = Math.floor((nowMs - startMs) / 86400000);
  // day 1 = día de inicio (daysSinceStart 0)
  const day = daysSinceStart + 1;
  if (day < 1) return 1;
  if (day > program.duration) return program.duration;
  return day;
}

/**
 * Entrada de sesión del programa para un día específico.
 * Retorna null si ese día es de reposo (no hay session agendada).
 * @param {object} program
 * @param {number} day — 1-based
 * @returns {object|null}
 */
export function programSessionForDay(program, day) {
  if (!program || !Array.isArray(program.sessions)) return null;
  return program.sessions.find((s) => s.day === day) || null;
}

/**
 * ¿Debe hoy el usuario hacer sesión del programa?
 * True si hay entrada para hoy Y aún no la completó.
 * @param {object} activeProgram — { id, startedAt, completedSessionDays }
 * @param {number} [now]
 * @returns {{ shouldSession: boolean, day: number, session: object|null, program: object|null }}
 */
export function programTodayStatus(activeProgram, now) {
  if (!activeProgram || !activeProgram.id) {
    return { shouldSession: false, day: 0, session: null, program: null };
  }
  const program = getProgramById(activeProgram.id);
  if (!program) return { shouldSession: false, day: 0, session: null, program: null };
  const day = currentProgramDay(program, activeProgram.startedAt, now);
  const session = programSessionForDay(program, day);
  const completed = Array.isArray(activeProgram.completedSessionDays)
    ? activeProgram.completedSessionDays.includes(day)
    : false;
  return {
    shouldSession: !!session && !completed,
    day,
    session,
    program,
  };
}

/**
 * Progreso del programa: (días completados) / (días requeridos).
 * Retorna { completed, total, fraction (0-1), isComplete }.
 * @param {object} activeProgram
 * @returns {object}
 */
export function programProgress(activeProgram) {
  if (!activeProgram || !activeProgram.id) {
    return { completed: 0, total: 0, fraction: 0, isComplete: false };
  }
  const program = getProgramById(activeProgram.id);
  if (!program) return { completed: 0, total: 0, fraction: 0, isComplete: false };
  const total = programRequiredSessions(program);
  const completed = Array.isArray(activeProgram.completedSessionDays)
    ? activeProgram.completedSessionDays.length
    : 0;
  const fraction = total > 0 ? Math.min(1, completed / total) : 0;
  return {
    completed,
    total,
    fraction,
    isComplete: completed >= total,
  };
}

/**
 * ¿Usuario va atrasado con el programa?
 * True si hoy > currentDay pero completedSessionDays < daysElapsed.
 * Grace: 1 día de retraso permitido sin penalidad.
 * @param {object} activeProgram
 * @param {number} [now]
 * @returns {{ isLagging: boolean, daysBehind: number }}
 */
export function programLagStatus(activeProgram, now) {
  if (!activeProgram || !activeProgram.id) return { isLagging: false, daysBehind: 0 };
  const program = getProgramById(activeProgram.id);
  if (!program) return { isLagging: false, daysBehind: 0 };
  const day = currentProgramDay(program, activeProgram.startedAt, now);
  // Cuántas sesiones deberían haberse completado por este día
  const shouldHaveCompleted = program.sessions.filter((s) => s.day <= day).length;
  const actuallyCompleted = Array.isArray(activeProgram.completedSessionDays)
    ? activeProgram.completedSessionDays.length
    : 0;
  const daysBehind = Math.max(0, shouldHaveCompleted - actuallyCompleted);
  return {
    isLagging: daysBehind >= 2, // grace de 1 día
    daysBehind,
  };
}
