/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — ZUSTAND STORE v3
   Persistencia: IndexedDB (cifrado) + localStorage fallback
   Sync cloud · Outbox offline · Migraciones versionadas
   ═══════════════════════════════════════════════════════════════ */

import { create } from "zustand";
import { DS } from "../lib/constants";
import { getWeekNum } from "../lib/neural";
// Phase 6I-1 — getProgramById usado para resolver programName + totalDays
// del catálogo cuando finalizeProgram dispara celebration. lib/programs.js
// solo importa lib/protocols (puro) — no introduce circular dep con store.
import { getProgramById } from "../lib/programs";
// Phase 6I-2 — NEURAL_CONFIG.coaching.streakMilestones consumed para detectar
// streak threshold cross en completeSession. lib/neural/config.js es puro
// (zero imports) — no circular dep risk.
import { NEURAL_CONFIG } from "../lib/neural/config";
import { loadState, saveState, clearAll, outboxAdd, getSyncChannel } from "../lib/storage";
// Nota: outboxAdd ahora dispatcha "bio-outbox-changed" event al
// completar el IndexedDB write; sync.js (vía wireBackgroundSync)
// escucha ese event y dispara drain debounced. Sin circular dep
// entre storage y sync — bus pattern.
import { logger } from "../lib/logger";
import { updateArm, armKey, timeBucket, compositeReward } from "../lib/neural/bandit";
import { logResidual as logResidualEntry } from "../lib/neural/residuals";

const STORE_VERSION = 20;

// Phase 6H Premium-Fix3 — cohort thresholds.
// MUST stay aligned con NEURAL_CONFIG.health.coldStartSessions/learningSessions
// (src/lib/neural/config.js:425-426). NO importar config aquí para evitar
// circular dep store→neural→store. Si cambian thresholds, bump ambos.
const COHORT_THRESHOLD_LEARNING = 5;
const COHORT_THRESHOLD_PERSONALIZED = 14;

/**
 * Phase 6I-2 — pure helper: detecta cuándo el streak cruzó uno de los
 * milestones configurados (NEURAL_CONFIG.coaching.streakMilestones) y
 * construye el celebration payload. Exportado para reuse en tests sin
 * mountar el store entero.
 *
 * Reglas:
 *   - newStreak debe ser STRICTAMENTE mayor que prevStreak. Excluye:
 *     · Segunda sesión del mismo día (engine retorna mismo streak)
 *     · Streak break (engine retorna 1 < prevStreak)
 *   - Solo dispara cuando exactamente UN milestone se cruzó: prev<m && new>=m
 *     El primer match de la lista milestones gana (pequeños primero).
 *   - Si doneAt[milestone] truthy → null (dedup persistente).
 *
 * @param {number} prevStreak - state.streak antes del set()
 * @param {number} newStreak - r.nsk del payload de completeSession
 * @param {number[]} milestones - default fallback [7, 14, 30] si null/empty
 * @param {object} doneAt - streakMilestoneDoneAt actual { [milestone]: ts }
 * @returns {object|null} { milestone, currentStreak, timestamp } | null
 */
export function detectStreakMilestone(prevStreak, newStreak, milestones, doneAt = {}) {
  const safePrev = Number.isFinite(prevStreak) ? prevStreak : 0;
  const safeNew = Number.isFinite(newStreak) ? newStreak : 0;
  if (safeNew <= safePrev) return null;
  const list = Array.isArray(milestones) && milestones.length > 0
    ? milestones
    : [7, 14, 30];
  const safeDone = doneAt || {};
  // Find first milestone crossed by this transition que no esté en doneAt.
  // Sort ascending defensive (config debería ya estar ascending, pero no asumimos).
  // Edge case relevante: user salta prev=0 → new=14 con doneAt[7] ya truthy.
  // El loop continúa más allá del 7 (skipped por dedup) y dispara 14 — que
  // ES el milestone uncelebrated cruzado válido.
  const sorted = [...list].sort((a, b) => a - b);
  for (const m of sorted) {
    if (typeof m !== "number" || !Number.isFinite(m)) continue;
    if (safePrev < m && safeNew >= m) {
      if (safeDone[m]) continue; // dedup — try next milestone in this transition
      return {
        milestone: m,
        currentStreak: safeNew,
        timestamp: Date.now(),
      };
    }
  }
  return null;
}

/**
 * Phase 6I-1 — pure helper: builds program completion celebration payload
 * cuando finalizeProgram detecta completion. Exportado para reuse en tests
 * sin mountar el store entero.
 *
 * @param {object|null} activeProgramSnapshot - state.activeProgram justo antes
 *   del set() que limpia (id, startedAt, completedSessionDays)
 * @param {object} doneAt - programCompletionCelebrationDoneAt actual
 * @param {object} catalogEntry - PROGRAMS catalog entry para resolver
 *   programName + totalDays. Pasado como param (NO import aquí) para evitar
 *   circular dep store→programs→store.
 * @returns {object|null} celebration payload o null si ya done o data inválida
 */
export function detectProgramCompletionCelebration(activeProgramSnapshot, doneAt = {}, catalogEntry = null) {
  if (!activeProgramSnapshot || typeof activeProgramSnapshot !== "object") return null;
  const programId = activeProgramSnapshot.id;
  if (typeof programId !== "string" || !programId) return null;
  const safeDone = doneAt || {};
  if (safeDone[programId]) return null; // dedup: ya celebrado este program
  return {
    programId,
    programName: catalogEntry?.n || programId,
    totalDays: catalogEntry?.duration || 0,
    completedAt: Date.now(),
    timestamp: Date.now(),
  };
}

/**
 * Pure helper: detecta cohort transition cross al cerrar una sesión.
 * Exportada para reuse en tests sin mountar el store entero.
 *
 * @param {number} prevSessions - history.length antes del set()
 * @param {number} newSessions - history.length después del set()
 * @param {object} doneAt - cohortCelebrationDoneAt actual { learning?, personalized? }
 * @returns {object|null} { from, to, totalSessions, timestamp } | null si no cross o ya done
 */
export function detectCohortCelebration(prevSessions, newSessions, doneAt = {}) {
  const safeDone = doneAt || {};
  const prevCohort = cohortFor(prevSessions);
  const newCohort = cohortFor(newSessions);
  if (prevCohort === newCohort) return null;
  if (newCohort === "learning" && !safeDone.learning) {
    return {
      from: prevCohort,
      to: "learning",
      totalSessions: newSessions,
      timestamp: Date.now(),
    };
  }
  if (newCohort === "personalized" && !safeDone.personalized) {
    return {
      from: prevCohort,
      to: "personalized",
      totalSessions: newSessions,
      timestamp: Date.now(),
    };
  }
  return null;
}

function cohortFor(n) {
  if (n < COHORT_THRESHOLD_LEARNING) return "cold-start";
  if (n < COHORT_THRESHOLD_PERSONALIZED) return "learning";
  return "personalized";
}

function migrate(data) {
  if (!data) {
    // New user: voiceOn default OFF (Phase 4 SP2 — TTS opt-in explícito).
    return { ...DS, voiceOn: false, _v: STORE_VERSION, _created: Date.now() };
  }
  const merged = { ...DS, ...data };
  if (!merged._v || merged._v < STORE_VERSION) {
    // v7: ensure bioneural arrays exist for users migrating from v6
    if (!Array.isArray(merged.hrvLog)) merged.hrvLog = [];
    if (!Array.isArray(merged.rhrLog)) merged.rhrLog = [];
    if (!Array.isArray(merged.nom035Results)) merged.nom035Results = [];
    if (!Array.isArray(merged.breathTechniqueLog)) merged.breathTechniqueLog = [];
    if (!Array.isArray(merged.cognitiveLog)) merged.cognitiveLog = [];
    if (!Array.isArray(merged.orgTeamResponses)) merged.orgTeamResponses = [];
    if (typeof merged.sleepTargetHours !== "number") merged.sleepTargetHours = 7.5;
    // v8: anclar estado al userId autenticado (anti cross-user leak en mismo browser)
    if (typeof merged._userId === "undefined") merged._userId = null;
    // v9: aprendizaje del motor neural — bandit UCB y residuales de predicción
    if (!merged.banditArms || typeof merged.banditArms !== "object") merged.banditArms = {};
    if (!merged.predictionResiduals || !Array.isArray(merged.predictionResiduals.history)) {
      merged.predictionResiduals = { history: [] };
    }
    // v10: recordatorios diarios (push/local). Default apagado — opt-in explícito.
    if (typeof merged.remindersEnabled !== "boolean") merged.remindersEnabled = false;
    if (typeof merged.reminderHour !== "number") merged.reminderHour = 9;
    if (typeof merged.reminderMinute !== "number") merged.reminderMinute = 0;
    // v11: historial de instrumentos psicométricos (PSS-4, SWEMWBS-7, PHQ-2).
    if (!Array.isArray(merged.instruments)) merged.instruments = [];
    // v12: programs — trayectorias curadas multi-día.
    if (typeof merged.activeProgram === "undefined") merged.activeProgram = null;
    if (!Array.isArray(merged.programHistory)) merged.programHistory = [];
    // v13: voice + audio granularity persistente (antes useState volátil) +
    //      wake lock toggle + reducedMotion override
    if (typeof merged.voiceOn !== "boolean") merged.voiceOn = true;
    if (typeof merged.voiceRate !== "number") merged.voiceRate = 0.83;
    if (typeof merged.masterVolume !== "number") merged.masterVolume = 1;
    if (typeof merged.wakeLockEnabled !== "boolean") merged.wakeLockEnabled = true;
    if (typeof merged.reducedMotionOverride !== "string") merged.reducedMotionOverride = "auto";
    // v14: granular audio (music bed, binaural) + haptic intensity + voice picker
    if (typeof merged.musicBedOn !== "boolean") merged.musicBedOn = true;
    if (typeof merged.binauralOn !== "boolean") merged.binauralOn = true;
    if (typeof merged.hapticIntensity !== "string") merged.hapticIntensity = "medium";
    if (typeof merged.voicePreference === "undefined") merged.voicePreference = null;
    // v15: voiceOn default OFF para nuevos users (Phase 4 SP2). Users
    // existentes con voiceOn=true mantienen su preferencia previa
    // (la condición v13 arriba sólo dispara si el campo no existe).
    // Sólo si el field está totalmente ausente Y el migración previa nunca corrió,
    // el v13 lo seteaba true. Aquí no hacemos nada — preservamos preferencia.
    // v16: persistencia local de conversaciones del coach (Phase 6C SP3).
    if (!Array.isArray(merged.coachConversations)) merged.coachConversations = [];
    if (typeof merged.coachActiveConversationId === "undefined") merged.coachActiveConversationId = null;
    // v17: Phase Polish-Tier-3 — monthly digest dedup timestamp.
    // Defaults a 0 (epoch) → primer trigger ocurrirá cuando totalSessions ≥ 30
    // y daysSinceLastDigest >= 28 (epoch ts == 0 → days ~= 56 años, OK).
    if (typeof merged.lastMonthlyDigestShown !== "number") merged.lastMonthlyDigestShown = 0;
    // v18: Phase Polish-Tier-4 — backfill defensive del campo dimensions
    // en entries de history previos. Lazy compute on read principle: NO
    // computamos synthetic dimensions; entries pre-v18 quedan con
    // dimensions: null, sparklines + per-month averages auto-skip via
    // filter null defensive. Nuevos entries (post-v18) populan dimensions
    // via _buildHistoryEntry. Idempotente: si ya tenían dimensions, se
    // preserva (?? null mantiene el valor existente).
    //
    // v19: Phase 7 F0-2 — backfill defensive de los 4 fields de telemetría
    // granular per-act (actsLog/actsCompleted/actsSkipped/actsFailed).
    // Mismo principio que v18: NO computamos synthetic backfill (preserva
    // data trust). Entries pre-v19 quedan con los 4 fields en null;
    // engine consumers F0-1+ deben filter null defensive antes de iterar.
    // Idempotente: si ya tenían los fields (post-v19 hot path), se preservan.
    //
    // v20: Phase 7 F0-3 — backfill defensive del field postSessionFeedback
    // (las 5 preguntas subjetivas opcionales). Misma semántica que v18+v19:
    // null backfill, no synthetic compute. Engine consumers F0-1+ deben
    // checkear `entry.postSessionFeedback != null` antes de leer fields
    // internos (helpedRating, willDoAgain, bodySensations, sideEffects,
    // timeToEffect, capturedAt).
    //
    // Combina los 3 backfills (v18 dims + v19 actsLog + v20 feedback) en un
    // solo pass para evitar mutar history múltiples veces.
    if (Array.isArray(merged.history)) {
      let mutated = false;
      const next = merged.history.map((entry) => {
        if (!entry || typeof entry !== "object") return entry;
        const patch = {};
        if (!("dimensions" in entry)) {
          patch.dimensions = null;
        }
        if (!("actsLog" in entry)) {
          patch.actsLog = null;
          patch.actsCompleted = null;
          patch.actsSkipped = null;
          patch.actsFailed = null;
        }
        if (!("postSessionFeedback" in entry)) {
          patch.postSessionFeedback = null;
        }
        if (Object.keys(patch).length > 0) {
          mutated = true;
          return { ...entry, ...patch };
        }
        return entry;
      });
      if (mutated) merged.history = next;
    }
    merged._v = STORE_VERSION;
    merged._migrated = Date.now();
  }
  return merged;
}

// Decide si el estado persistido pertenece al usuario actual:
//   - prev null + curr null  → sesión anónima continua, preservar
//   - prev null + curr X     → primer login, attach (preservar local)
//   - prev X    + curr X     → mismo user, preservar
//   - prev X    + curr Y     → switch real de usuario, clearAll
//   - prev X    + curr null  → AMBIGUO: token aún no resuelto / 429 en
//                              /api/auth/session / mount de AppV2Root
//                              ANTES que useAuthBridge propague userId.
//                              Phase 6G Fix1 P0-1 master bug: NO clearAll
//                              en este caso — preserva local; sync.js
//                              valida re-attach en próximo pull con
//                              currentUserId real. signOutAndClear()
//                              sigue siendo el path explícito para
//                              wipear cuando el user de verdad cierra.
function belongsToUser(loaded, currentUserId) {
  const prev = loaded?._userId ?? null;
  const curr = currentUserId ?? null;
  if (prev === curr) return true;
  if (prev === null) return true; // first login: anon-saved se attach al user
  if (curr === null) return true; // ambiguous: token aún no resuelto/429 — preservar
  return false;                    // ambos definidos y distintos → switch real
}

// PHASE 6D SP6 Bug-37 — allowlist negative para persist. Antes el state
// se persistía completo via spread, incluyendo flags volátiles (`_loaded`,
// `_syncing`) y funciones del store (init, save, completeSession, etc.
// que el spread no incluye porque Zustand las separa, pero defensivo).
//
// Problema observado: `_loaded:true` se persistía → al rehidratar de
// IDB, el flag llegaba ya en true antes de que loadState() retornara →
// componentes que checkean `if (state._loaded)` para gate UI mostraban
// contenido stale del save anterior antes de que init() acabe de
// reconciliar. Filtrarlo asegura que `_loaded` SOLO se setea via init().
//
// `_userId` SÍ se persiste (belongsToUser lo necesita para detectar
// cambio de owner). _syncing es transient (cross-tab sync flag).
const VOLATILE_PERSIST_FIELDS = new Set([
  "_loaded",
  "_syncing",
]);

function sanitizeForPersist(state) {
  if (!state || typeof state !== "object") return state;
  const out = {};
  for (const key of Object.keys(state)) {
    if (VOLATILE_PERSIST_FIELDS.has(key)) continue;
    const val = state[key];
    if (typeof val === "function") continue; // funciones del store
    out[key] = val;
  }
  return out;
}

let persistTimer = null;
let lastScheduledState = null;
function scheduleSave(state) {
  const clean = sanitizeForPersist(state);
  lastScheduledState = clean;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    saveState(clean).catch((e) => logger.error("persist.save", e));
  }, 300);
}

// Sprint 73 — flush síncrono del debounce. Usar antes de operaciones
// que cierran/navegan rápido (HRV save → modal close → user puede
// salir antes de los 300ms del debounce → datos perdidos).
async function saveNow(state) {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  const target = state ? sanitizeForPersist(state) : lastScheduledState;
  if (!target) return;
  try {
    await saveState(target);
  } catch (e) {
    logger.error("persist.saveNow", e);
  }
}

// Dev-mode: expose store on window for browser-side seeding/inspection.
// Active only when NODE_ENV !== "production". No effect in builds.
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  // Defer so the create() below has run before assignment.
  setTimeout(() => { try { window.__BIO_STORE__ = useStore; } catch {} }, 0);
}

export const useStore = create((set, get) => ({
  ...DS,
  _loaded: false,
  _syncing: false,

  init: async (opts = {}) => {
    try {
      const userId = opts.userId ?? null;
      let loaded = migrate(await loadState());
      const prevUserId = loaded?._userId ?? null;
      if (!belongsToUser(loaded, userId)) {
        // Mismo navegador, otro usuario → reset local para no filtrar datos.
        await clearAll();
        loaded = migrate(null);
        loaded._userId = userId;
      } else if (prevUserId !== null && userId === null) {
        // Phase 6G Fix1 P0-1: caso ambiguo (saved state autenticado,
        // current call sin userId). Preservar loaded._userId — no
        // sobrescribir con null. Razón: AppV2Root.useEffect llama
        // store.init() sin userId; si lo overwriteamos, sync.js
        // identity binding (line 150) interpreta wrong actor en próximo
        // pull. Mantener _userId previo permite re-attach silencioso.
        // (loaded._userId ya viene del migrate; no tocamos.)
      } else {
        loaded._userId = userId;
      }
      const cw = getWeekNum();
      if (loaded.weekNum !== null && loaded.weekNum !== cw) {
        loaded.prevWeekData = [...loaded.weeklyData];
        loaded.weeklyData = [0, 0, 0, 0, 0, 0, 0];
        loaded.weekNum = cw;
      }
      if (loaded.weekNum === null) loaded.weekNum = cw;
      set({ ...loaded, _loaded: true });
      scheduleSave(loaded);
    } catch (e) {
      logger.error("store.init", e);
      set({ _loaded: true });
    }
  },

  update: (partial) => {
    set(partial);
    scheduleSave(get());
  },

  save: () => scheduleSave(get()),
  saveNow: () => saveNow(get()),

  completeSession: (r) => {
    const st = get();
    const { eVC, nC, nR, nE, ns, nsk, nw, newHist, ach, totalT } = r;
    const td = new Date().toDateString();
    const update = {
      totalSessions: ns,
      streak: nsk,
      bestStreak: Math.max(st.bestStreak || 0, nsk),
      todaySessions: st.lastDate === td ? st.todaySessions + 1 : 1,
      lastDate: td,
      weeklyData: nw,
      weekNum: getWeekNum(),
      coherencia: nC,
      resiliencia: nR,
      capacidad: nE,
      achievements: ach,
      vCores: (st.vCores || 0) + eVC,
      history: newHist,
      totalTime: totalT,
      firstDone: true,
      // Sprint 77 — progDay deprecated. El bloque legacy "Programa 7 Días"
      // fue eliminado por bug (incrementaba con cada sesión, no calendar-
      // based, no reset). El nuevo sistema (Sprint 64+) usa programs.js +
      // ActiveProgramCard + programSuggestion.js. Campo se conserva en
      // saves antiguos por backcompat pero ya no avanza.
    };
    // Phase 6H Premium-Fix3 — detectar cohort threshold cross (5/14).
    // Se computa contra newHist.length (post-session) vs prev hist.length.
    // Si user cruzó cold-start→learning o learning→personalized Y no había
    // visto la celebración antes (cohortCelebrationDoneAt[cohort] ausente),
    // setea pendingCelebration. HomeV2 mounta <CohortCelebrationSheet/>.
    const prevSessions = Array.isArray(st.history) ? st.history.length : 0;
    const newSessions = Array.isArray(newHist) ? newHist.length : 0;
    const celebration = detectCohortCelebration(
      prevSessions,
      newSessions,
      st.cohortCelebrationDoneAt || {},
    );
    if (celebration) {
      update.pendingCelebration = celebration;
    }
    // Phase 6I-2 — detectar streak milestone cross (config 7/14/30).
    // Engine ya pre-computó nsk (newStreak) en lib/neural.js _computeStreakUpdate.
    // Solo dispara cuando newStreak > prevStreak (segunda sesión del día +
    // streak break excluidos automáticamente). Coverage complementario al
    // engine pre-existing achievements "streak7"/"streak30" (engine los
    // persiste en state.achievements; nuestro sheet añade UI feedback premium).
    const prevStreak = Number.isFinite(st.streak) ? st.streak : 0;
    const newStreak = Number.isFinite(nsk) ? nsk : 0;
    const streakCelebration = detectStreakMilestone(
      prevStreak,
      newStreak,
      NEURAL_CONFIG?.coaching?.streakMilestones,
      st.streakMilestoneDoneAt || {},
    );
    if (streakCelebration) {
      update.pendingStreakMilestoneCelebration = streakCelebration;
    }
    set(update);
    scheduleSave({ ...st, ...update });
    outboxAdd({ kind: "session", payload: r, userId: st._userId ?? null }).catch(() => {});
  },

  // Phase 6H Premium-Fix3 — marca celebración mostrada (dedup persistente).
  // HomeV2 lo invoca on-mount del CohortCelebrationSheet para que reload
  // o subsequent sesiones del mismo cohort NO re-disparen el sheet.
  markCelebrationShown: (cohort) => {
    if (!cohort || !["learning", "personalized"].includes(cohort)) return;
    const st = get();
    const update = {
      pendingCelebration: null,
      cohortCelebrationDoneAt: {
        ...(st.cohortCelebrationDoneAt || {}),
        [cohort]: Date.now(),
      },
    };
    set(update);
    scheduleSave({ ...st, ...update });
  },

  // Phase 6H Premium-Fix3 — limpia pendingCelebration sin marcar done.
  // Caso edge: user dismiss accidentalmente y debería poder re-trigger
  // (ej. reload). Decision A2-locked: NO se usa este path en el flow normal
  // — markCelebrationShown se invoca on-mount del sheet, así que dismiss
  // ya viene con doneAt seteado. Este action existe para tests + edge case
  // de cleanup defensivo (ej. test reset).
  dismissPendingCelebration: () => {
    const st = get();
    if (st.pendingCelebration === null) return;
    set({ pendingCelebration: null });
    scheduleSave({ ...st, pendingCelebration: null });
  },

  logMood: (moodEntry) => {
    const st = get();
    const ml = [...(st.moodLog || []), moodEntry].slice(-200);
    const ach = [...st.achievements];
    if (moodEntry.mood === 5 && !ach.includes("mood5")) ach.push("mood5");
    set({ moodLog: ml, achievements: ach });
    scheduleSave({ ...st, moodLog: ml, achievements: ach });
    outboxAdd({ kind: "mood", payload: moodEntry, userId: st._userId ?? null }).catch(() => {});
  },

  setNeuralBaseline: (baseline) => {
    set({ neuralBaseline: baseline, onboardingComplete: true });
    scheduleSave({ ...get() });
  },

  // Phase 6 SP5 — onboarding welcome state (BioIgnitionWelcome pre-Calibration).
  setWelcomeDone: (done = true) => {
    set({ welcomeDone: !!done });
    scheduleSave({ ...get() });
  },
  setFirstIntent: (intent) => {
    const valid = ["calma", "enfoque", "energia", "recuperacion", "reset"].includes(intent);
    set({ firstIntent: valid ? intent : null });
    scheduleSave({ ...get() });
  },
  completeOnboarding: () => {
    set({ onboardingComplete: true });
    scheduleSave({ ...get() });
  },

  // Streak freeze — pausa honesta: congela racha 1 día sin falsear
  // Máx 2/mes. Resetea mensualmente. Mejor que mentir bajo presión social.
  freezeStreak: () => {
    const st = get();
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
    const sf = st.streakFreezes || { usedThisMonth: [], lastFreezeMonth: null };
    const used = sf.lastFreezeMonth === monthKey ? sf.usedThisMonth : [];
    if (used.length >= 2) return { ok: false, reason: "limit_reached", remaining: 0 };
    const td = now.toDateString();
    if (used.includes(td)) return { ok: false, reason: "already_today", remaining: 2 - used.length };
    const newUsed = [...used, td];
    const streakFreezes = { usedThisMonth: newUsed, lastFreezeMonth: monthKey };
    set({ streakFreezes, lastDate: td });
    scheduleSave({ ...get() });
    return { ok: true, remaining: 2 - newUsed.length };
  },

  toggleFav: (name) => {
    const favs = get().favs || [];
    const nf = favs.includes(name) ? favs.filter((f) => f !== name) : [...favs, name];
    set({ favs: nf });
    scheduleSave({ ...get() });
  },

  updateSettings: (settings) => {
    set(settings);
    scheduleSave({ ...get() });
  },

  setSessionGoal: (goal) => {
    set({ sessionGoal: goal });
    scheduleSave({ ...get() });
  },

  setDailyGoal: (goal) => {
    set({ sessionGoal: goal });
    scheduleSave({ ...get() });
  },

  importData: (data) => {
    const merged = { ...DS, ...data, _v: STORE_VERSION, _imported: Date.now() };
    set(merged);
    scheduleSave(merged);
  },

  recalibrate: (newBaseline) => {
    const st = get();
    const calibrationHistory = [...(st.calibrationHistory || []), {
      ...newBaseline, ts: Date.now(), sessionCount: st.totalSessions,
    }].slice(-10);
    set({ neuralBaseline: newBaseline, calibrationHistory, onboardingComplete: true });
    scheduleSave({ ...get() });
  },

  // ─── Bioneural actions (v7) ────────────────────────────
  logHRV: (entry) => {
    const st = get();
    const hrvLog = [...(st.hrvLog || []), entry].slice(-365);
    // rhrLog también propaga source/sqi para que isReliableRhrEntry
    // pueda filtrar por calidad — sin esto, una medición cámara con
    // SQI bajo contaminaría el baseline RHR aunque la rechazáramos
    // del baseline lnRmssd.
    const rhrLog = entry.rhr != null
      ? [
          ...(st.rhrLog || []),
          {
            ts: entry.ts,
            rhr: entry.rhr,
            ...(entry.source != null ? { source: entry.source } : {}),
            ...(entry.sqi != null ? { sqi: entry.sqi } : {}),
          },
        ].slice(-365)
      : st.rhrLog;
    set({ hrvLog, rhrLog });
    scheduleSave({ ...st, hrvLog, rhrLog });
    outboxAdd({ kind: "hrv", payload: entry, userId: st._userId ?? null }).catch(() => {});
  },

  logSleep: (hours) => {
    const st = get();
    set({ lastSleepHours: hours });
    scheduleSave({ ...st, lastSleepHours: hours });
  },

  setSleepTarget: (hours) => {
    set({ sleepTargetHours: hours });
    scheduleSave({ ...get() });
  },

  setChronotype: (ct) => {
    set({ chronotype: ct });
    scheduleSave({ ...get() });
    outboxAdd({ kind: "chronotype", payload: ct, userId: get()._userId ?? null }).catch(() => {});
  },

  // Phase 6D SP3 — cachea el email del user autenticado para que ProfileV2
  // y AccountView lo muestren post-hidratación sin requerir useSession()
  // en cada mount. Llamar desde el sign-in flow o un componente raíz que
  // tenga acceso a session.user.email. Acepta string o null (logout limpia).
  // No hay outboxAdd: el email es source-of-truth del backend, no algo que
  // sincronicemos al server.
  setUserEmail: (email) => {
    const next = typeof email === "string" && email.length > 0 ? email : null;
    set({ _userEmail: next });
    scheduleSave({ ...get() });
  },

  setResonanceFreq: (bpm) => {
    set({ resonanceFreq: bpm });
    scheduleSave({ ...get() });
  },

  logNOM035: (result) => {
    const st = get();
    const nom035Results = [...(st.nom035Results || []), result].slice(-20);
    set({ nom035Results });
    scheduleSave({ ...st, nom035Results });
    outboxAdd({ kind: "nom035", payload: result, userId: st._userId ?? null }).catch(() => {});
  },

  // Registra un resultado de instrumento psicométrico (PSS-4, SWEMWBS-7, PHQ-2).
  // El `entry` debe incluir `instrumentId`, `score`, `level`, `ts`.
  logInstrument: (entry) => {
    const st = get();
    if (!entry || !entry.instrumentId || typeof entry.score !== "number") return;
    const withTs = { ...entry, ts: typeof entry.ts === "number" ? entry.ts : Date.now() };
    const instruments = [...(st.instruments || []), withTs].slice(-200);
    set({ instruments });
    scheduleSave({ ...st, instruments });
    outboxAdd({ kind: "instrument", payload: withTs, userId: st._userId ?? null }).catch(() => {});
  },

  logBreathTechnique: (entry) => {
    const st = get();
    const breathTechniqueLog = [...(st.breathTechniqueLog || []), entry].slice(-500);
    set({ breathTechniqueLog });
    scheduleSave({ ...st, breathTechniqueLog });
  },

  logCognitive: (entry) => {
    const st = get();
    const cognitiveLog = [...(st.cognitiveLog || []), entry].slice(-200);
    set({ cognitiveLog });
    scheduleSave({ ...st, cognitiveLog });
  },

  setOrgMode: (enabled) => {
    set({ orgMode: !!enabled });
    scheduleSave({ ...get() });
  },

  // ─── Coach conversations (v16 — Phase 6C SP3) ──────────
  // Persistencia local IDB de conversaciones del coach LLM. Hasta SP2,
  // useState en CoachV2 era volátil — cada reload o cambio de tab
  // perdía todo el contexto de la conversación. Ahora vive en zustand
  // → IDB cifrado. NO sync server (compliance NOM-035 + cross-device
  // hydration es Phase 6D scope).
  // Caps defensivos: 30 conversaciones FIFO + 50 mensajes/conv sliding.
  startCoachConversation: () => {
    const id = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const conversation = { id, startedAt: Date.now(), lastMessageAt: Date.now(), messages: [] };
    const st = get();
    const coachConversations = [conversation, ...(st.coachConversations || [])].slice(0, 30);
    set({ coachConversations, coachActiveConversationId: id });
    scheduleSave({ ...st, coachConversations, coachActiveConversationId: id });
    return id;
  },

  logCoachMessage: (conversationId, message) => {
    if (!conversationId || !message || typeof message.role !== "string") return;
    const st = get();
    const conversations = st.coachConversations || [];
    const idx = conversations.findIndex((c) => c.id === conversationId);
    if (idx < 0) return;
    const prev = conversations[idx];
    const newMsg = {
      role: message.role,
      content: String(message.content || ""),
      ts: typeof message.ts === "number" ? message.ts : Date.now(),
      ...(message.resources ? { resources: message.resources } : {}),
    };
    // Sliding window: cap 50 mensajes/conv para evitar bloat IDB en
    // conversaciones muy largas. Dropea los más antiguos.
    const messages = [...prev.messages, newMsg].slice(-50);
    const updated = { ...prev, messages, lastMessageAt: newMsg.ts };
    const next = [...conversations];
    next[idx] = updated;
    // Mantener la conversación más recientemente activa al frente para
    // que startCoachConversation FIFO no la dropee si tiene 30 ya.
    next.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
    set({ coachConversations: next });
    scheduleSave({ ...st, coachConversations: next });
  },

  clearCoachConversation: (conversationId) => {
    if (!conversationId) return;
    const st = get();
    const coachConversations = (st.coachConversations || []).filter((c) => c.id !== conversationId);
    const coachActiveConversationId =
      st.coachActiveConversationId === conversationId ? null : st.coachActiveConversationId;
    set({ coachConversations, coachActiveConversationId });
    scheduleSave({ ...st, coachConversations, coachActiveConversationId });
  },

  setCoachActiveConversation: (conversationId) => {
    // null = "ningún activo" — el próximo mensaje del user dispara
    // startCoachConversation desde el handler de CoachV2.
    set({ coachActiveConversationId: conversationId || null });
    scheduleSave({ ...get() });
  },

  clearAllCoachConversations: () => {
    set({ coachConversations: [], coachActiveConversationId: null });
    scheduleSave({ ...get() });
  },

  // ─── Neural learning (v9) ──────────────────────────────
  // Cada sesión con mood pre/post alimenta el bandit contextual
  // (intent × bucket temporal) y el log de residuales para calibrar
  // predicciones. El decay del bandit hace que observaciones nuevas
  // pesen más que las viejas (~33 obs de vida media).
  recordSessionOutcome: ({
    intent,
    protocol,
    deltaMood,
    predictedDelta = null,
    at = null,
    energyDelta = null,
    hrvDelta = null,
    completionRatio = 1,
  }) => {
    const st = get();
    if (!intent) return;
    const delta = Number(deltaMood);
    const moodPresent = Number.isFinite(delta);
    const hrvPresent = typeof hrvDelta === "number" && Number.isFinite(hrvDelta);
    // Sprint S4.2 — antes: sin mood-post salíamos sin actualizar bandit
    // (sesión perdida ~30-50% de las veces). Ahora: si hay HRV, compositeReward
    // infiere reward desde HRV. Mood preferido si presente.
    if (!moodPresent && !hrvPresent) return;

    const reward = compositeReward({
      moodDelta: moodPresent ? delta : null,
      energyDelta,
      hrvDeltaLnRmssd: hrvDelta,
      completionRatio,
    });
    if (reward === null) return;
    const bucket = timeBucket(at || new Date());
    const arms = st.banditArms || {};
    // Actualizamos DOS brazos: contextual (intent:bucket) y global (intent).
    // El global da fallback cuando el bucket actual no tiene datos.
    const keyCtx = armKey(intent, bucket);
    const keyGlb = armKey(intent);
    // Engine Audit HIGH-1 — pasar `now` para que updateArm setee
    // lastUpdatedAt en cada arm. Sin esto, Sprint 47 time-decay queda
    // muerto (timeDecayFactor retorna 1 cuando lastUpdatedAt undefined).
    const nowMs = (at instanceof Date ? at.getTime() : (typeof at === "number" ? at : Date.now()));
    const nextArms = {
      ...arms,
      [keyCtx]: updateArm(arms[keyCtx], reward, { now: nowMs }),
      [keyGlb]: updateArm(arms[keyGlb], reward, { now: nowMs }),
    };
    // Residuales solo se loggean si tenemos mood real (calibran contra
    // predicción de mood, no contra HRV inferido). Fallback HRV-only no
    // contamina el calibration bias.
    const nextResiduals =
      moodPresent && typeof predictedDelta === "number"
        ? logResidualEntry(st.predictionResiduals || { history: [] }, {
            predicted: predictedDelta,
            actual: delta,
            armId: intent,
          })
        : (st.predictionResiduals || { history: [] });
    const update = { banditArms: nextArms, predictionResiduals: nextResiduals };
    set(update);
    scheduleSave({ ...st, ...update });
  },

  // ─── Phase 7 F0-3 — Five post-session questions ────────────
  // attachSessionFeedback patches el ÚLTIMO history entry con feedback
  // subjetivo capturado por MoodPostSessionSheet (5 dimensiones opcionales).
  //
  // Razón post-hoc en lugar de calcSessionCompletion arg: el sheet aparece
  // DESPUÉS de que completeSession ya persistió la entry. Patchear el
  // último entry es la forma menos invasiva de añadir feedback al historial
  // sin reordenar el flujo de completion.
  //
  // Defensive contract:
  //   - feedback null o no-object → no-op (preserva entry)
  //   - history vacío → no-op (no hay último entry a patchear)
  //   - feedback.capturedAt sobrescrito a Date.now() (server-side trust,
  //     ignoramos el del UI por temporal drift)
  //   - whitelist de fields conocidos: defensive contra payloads malformed
  //     desde llamadas externas (bug futuro, fuzzing test, etc).
  //   - idempotente: re-call reemplaza la feedback completa.
  //
  // Engine consumers DEFER F0-1: la feedback NO actualiza banditArms ni
  // residuals en este SP. Solo persiste para futuro uso por el motor.
  attachSessionFeedback: (feedback) => {
    if (!feedback || typeof feedback !== "object" || Array.isArray(feedback)) return;
    const st = get();
    if (!Array.isArray(st.history) || st.history.length === 0) return;
    const lastIdx = st.history.length - 1;
    const lastEntry = st.history[lastIdx];
    if (!lastEntry || typeof lastEntry !== "object") return;
    const sanitized = {
      helpedRating: typeof feedback.helpedRating === "number" &&
        feedback.helpedRating >= 1 && feedback.helpedRating <= 5
        ? feedback.helpedRating : null,
      willDoAgain: typeof feedback.willDoAgain === "number" &&
        feedback.willDoAgain >= 1 && feedback.willDoAgain <= 5
        ? feedback.willDoAgain : null,
      bodySensations: Array.isArray(feedback.bodySensations) && feedback.bodySensations.length > 0
        ? feedback.bodySensations.filter((v) => typeof v === "string")
        : null,
      sideEffects: Array.isArray(feedback.sideEffects) && feedback.sideEffects.length > 0
        ? feedback.sideEffects.filter((v) => typeof v === "string")
        : null,
      timeToEffect: typeof feedback.timeToEffect === "string"
        ? feedback.timeToEffect : null,
      capturedAt: Date.now(),
    };
    // No-op si todos los fields quedan null (defensive: respeta semántica
    // "skip-all → null feedback" que MoodPostSessionSheet ya garantiza,
    // pero también filtra payloads malformed desde otros llamadores).
    const hasAnyAnswer =
      sanitized.helpedRating != null ||
      sanitized.willDoAgain != null ||
      sanitized.bodySensations != null ||
      sanitized.sideEffects != null ||
      sanitized.timeToEffect != null;
    if (!hasAnyAnswer) return;
    const nextHistory = st.history.slice();
    nextHistory[lastIdx] = { ...lastEntry, postSessionFeedback: sanitized };
    set({ history: nextHistory });
    scheduleSave({ ...st, history: nextHistory });
  },

  // ─── Programs (v12) ───────────────────────────────────────
  // Trayectorias multi-día curadas. Cada sesión que coincida con
  // el protocolo del día del programa activo avanza el progreso.
  // Si se completa el programa → se archiva a programHistory +
  // desbloquea achievement.

  /**
   * Inicia un programa. Si ya hay uno activo, lo sustituye (el
   * anterior queda archivado con su fracción parcial de completación).
   * Idempotente para el mismo id — si ya está iniciado hoy, no hace nada.
   */
  startProgram: (programId) => {
    if (typeof programId !== "string" || !programId) return;
    const st = get();
    const now = Date.now();
    // Si ya hay un programa activo igual, no reiniciar (evitar pérdida de progreso)
    if (st.activeProgram && st.activeProgram.id === programId) return;
    // Archivar programa anterior con su progreso parcial
    let programHistory = [...(st.programHistory || [])];
    if (st.activeProgram && st.activeProgram.id) {
      programHistory.push({
        id: st.activeProgram.id,
        startedAt: st.activeProgram.startedAt || now,
        completedAt: now,
        completionFraction: 0, // parcial — completamos un cálculo preciso en abandonProgram
        abandoned: true,
      });
    }
    const activeProgram = {
      id: programId,
      startedAt: now,
      completedSessionDays: [],
    };
    set({ activeProgram, programHistory });
    scheduleSave({ ...st, activeProgram, programHistory });
    outboxAdd({ kind: "program_start", payload: { id: programId, startedAt: now }, userId: st._userId ?? null }).catch(() => {});
  },

  /**
   * Marca el día `day` como completado para el programa activo.
   * Idempotente — no duplica días. Si el programa se completa
   * (todos los días requeridos hechos), se archiva automáticamente
   * y desbloquea achievement "program_complete".
   * NOTA: esta action es genérica — NO valida que el día corresponda
   * al día actual del programa. La lógica de "qué día cuenta como
   * completado" vive en el caller (page.jsx session completion).
   */
  completeProgramDay: (day, completionMeta = {}) => {
    const st = get();
    if (!st.activeProgram || !st.activeProgram.id) return;
    if (typeof day !== "number" || day < 1) return;
    const existing = Array.isArray(st.activeProgram.completedSessionDays)
      ? st.activeProgram.completedSessionDays
      : [];
    if (existing.includes(day)) return; // ya completado
    const completedSessionDays = [...existing, day].sort((a, b) => a - b);
    const activeProgram = { ...st.activeProgram, completedSessionDays };
    set({ activeProgram });
    scheduleSave({ ...st, activeProgram });
    outboxAdd({
      kind: "program_day_complete",
      payload: { id: activeProgram.id, day, meta: completionMeta },
      userId: st._userId ?? null,
    }).catch(() => {});
  },

  /**
   * Llamar cuando el progreso del programa alcanza 100%.
   * Archiva el programa y desbloquea achievement.
   * Retorna true si se completó, false si no.
   * Espera un objeto con { totalRequired } para verificar.
   */
  finalizeProgram: ({ totalRequired } = {}) => {
    const st = get();
    if (!st.activeProgram || !st.activeProgram.id) return false;
    const completed = Array.isArray(st.activeProgram.completedSessionDays)
      ? st.activeProgram.completedSessionDays.length
      : 0;
    if (typeof totalRequired !== "number" || totalRequired <= 0) return false;
    if (completed < totalRequired) return false;
    const now = Date.now();
    // Phase 6I-1 — snapshot del activeProgram ANTES de limpiar (set
    // activeProgram:null abajo). Pasado a detectProgramCompletionCelebration
    // junto con catalogEntry para resolver programName + totalDays sin
    // depender del state post-update.
    const completedSnapshot = { ...st.activeProgram };
    const programHistory = [
      ...(st.programHistory || []),
      {
        id: st.activeProgram.id,
        startedAt: st.activeProgram.startedAt || now,
        completedAt: now,
        completionFraction: 1,
        abandoned: false,
      },
    ].slice(-50);
    const ach = [...(st.achievements || [])];
    if (!ach.includes("program_complete")) ach.push("program_complete");
    // Bonus XP: +20 vCores por programa completado
    const vCores = (st.vCores || 0) + 20;
    // Phase 6I-1 — detection celebration ANTES de set(). Si user ya celebró
    // este programId previamente (caso edge: re-completion del mismo program
    // tras restart), NO re-fire. Catalog entry resolved via getProgramById
    // para programName + totalDays — fallback al programId si no encontrado.
    const celebration = detectProgramCompletionCelebration(
      completedSnapshot,
      st.programCompletionCelebrationDoneAt || {},
      getProgramById(completedSnapshot.id),
    );
    const update = {
      activeProgram: null,
      programHistory,
      achievements: ach,
      vCores,
    };
    if (celebration) {
      update.pendingProgramCompletionCelebration = celebration;
    }
    set(update);
    scheduleSave({ ...st, ...update });
    outboxAdd({
      kind: "program_complete",
      payload: { id: completedSnapshot.id, startedAt: completedSnapshot.startedAt, completedAt: now },
      userId: st._userId ?? null,
    }).catch(() => {});
    return true;
  },

  // Phase 6I-1 — marca celebración mostrada (dedup persistente per programId).
  // HomeV2 invoca on-mount del ProgramCompletionSheet para que reload o
  // re-completion del mismo programa no re-disparen el sheet. Whitelist
  // contra catálogo PROGRAMS para evitar pollution con IDs inválidos.
  markProgramCompletionCelebrationShown: (programId) => {
    if (typeof programId !== "string" || !programId) return;
    // Whitelist defensive: solo IDs reales del catalog. Si futuro programa
    // se agrega al catalog, automáticamente está cubierto. Si llega un ID
    // bogus (test, race, mutation), no contamina doneAt.
    if (!getProgramById(programId)) return;
    const st = get();
    const update = {
      pendingProgramCompletionCelebration: null,
      programCompletionCelebrationDoneAt: {
        ...(st.programCompletionCelebrationDoneAt || {}),
        [programId]: Date.now(),
      },
    };
    set(update);
    scheduleSave({ ...st, ...update });
  },

  // Phase 6I-1 — limpia pendingProgramCompletionCelebration sin marcar done.
  // Defensive cleanup edge — markProgramCompletionCelebrationShown se invoca
  // on-mount del sheet (mismo pattern Fix3 dismissPendingCelebration).
  dismissPendingProgramCompletionCelebration: () => {
    const st = get();
    if (st.pendingProgramCompletionCelebration === null) return;
    set({ pendingProgramCompletionCelebration: null });
    scheduleSave({ ...st, pendingProgramCompletionCelebration: null });
  },

  // Phase 6I-2 — marca streak milestone celebrado (dedup persistente per-milestone).
  // HomeV2 invoca on-mount del StreakMilestoneSheet para que reload o
  // reconstrucción del streak (post-break) NO re-disparen el sheet del mismo
  // milestone. Whitelist contra NEURAL_CONFIG.coaching.streakMilestones para
  // evitar pollution con valores no canónicos. Si futura iteración añade
  // milestone 60 al config, automáticamente queda cubierto.
  markStreakMilestoneShown: (milestone) => {
    if (typeof milestone !== "number" || !Number.isFinite(milestone)) return;
    const milestonesConfig = NEURAL_CONFIG?.coaching?.streakMilestones || [7, 14, 30];
    if (!milestonesConfig.includes(milestone)) return;
    const st = get();
    const update = {
      pendingStreakMilestoneCelebration: null,
      streakMilestoneDoneAt: {
        ...(st.streakMilestoneDoneAt || {}),
        [milestone]: Date.now(),
      },
    };
    set(update);
    scheduleSave({ ...st, ...update });
  },

  // Phase 6I-2 — limpia pendingStreakMilestoneCelebration sin marcar done.
  // Defensive cleanup edge — markStreakMilestoneShown se invoca on-mount del
  // sheet (mismo pattern Fix3 + Phase6I-1).
  dismissPendingStreakMilestoneCelebration: () => {
    const st = get();
    if (st.pendingStreakMilestoneCelebration === null) return;
    set({ pendingStreakMilestoneCelebration: null });
    scheduleSave({ ...st, pendingStreakMilestoneCelebration: null });
  },

  // Phase Polish-Tier-3 — registra timestamp del monthly digest mostrado.
  // AppV2Root invoca esta action al primer render del MonthlyDigestSheet
  // para dedup (próximo trigger requiere daysSinceLastDigest >= 28).
  markMonthlyDigestShown: () => {
    const st = get();
    const update = { lastMonthlyDigestShown: Date.now() };
    set(update);
    scheduleSave({ ...st, ...update });
  },

  /**
   * Abandona el programa actual sin completarlo. Archiva con
   * completionFraction calculada. Usuario puede iniciar otro.
   */
  abandonProgram: () => {
    const st = get();
    if (!st.activeProgram || !st.activeProgram.id) return;
    const completed = Array.isArray(st.activeProgram.completedSessionDays)
      ? st.activeProgram.completedSessionDays.length
      : 0;
    const now = Date.now();
    const programHistory = [
      ...(st.programHistory || []),
      {
        id: st.activeProgram.id,
        startedAt: st.activeProgram.startedAt || now,
        completedAt: now,
        completedSessionDays: completed,
        completionFraction: null, // calculable desde completedSessionDays + program.sessions.length
        abandoned: true,
      },
    ].slice(-50);
    set({ activeProgram: null, programHistory });
    scheduleSave({ ...st, activeProgram: null, programHistory });
    outboxAdd({
      kind: "program_abandon",
      payload: { id: st.activeProgram.id, completedDays: completed },
      userId: st._userId ?? null,
    }).catch(() => {});
  },

  resetAll: async () => {
    const fresh = { ...DS, weekNum: getWeekNum(), _v: STORE_VERSION, _userId: null };
    await clearAll();
    set(fresh);
    scheduleSave(fresh);
  },

  // Sprint 80 — cross-tab sync. Triggered cuando otra pestaña broadcast
  // que persistió cambios. Recargamos desde IDB y aplicamos a la memoria
  // local SIN volver a persistir (sería loop infinito de broadcasts).
  // Preserva flags volátiles (_loaded, _syncing) que no pertenecen al
  // estado persistido.
  syncFromStorage: async () => {
    try {
      const fresh = await loadState();
      if (!fresh) return;
      const cur = get();
      // Si el state persistido es de otro user (race con login/logout en
      // otra tab), no aplicar — dejamos que el path de auth recheck en
      // page.jsx lo maneje con su propia lógica.
      if ((fresh._userId ?? null) !== (cur._userId ?? null)) return;
      const migrated = migrate(fresh);
      // No llamar scheduleSave — esto es read-only desde la perspectiva
      // de persistencia. Preservamos flags runtime de esta tab.
      set({ ...migrated, _loaded: cur._loaded, _syncing: cur._syncing });
    } catch (e) {
      logger.error("store.syncFromStorage", e);
    }
  },
}));

// Sprint 80 — listener cross-tab. Setup once por tab, después de crear
// el store. BroadcastChannel.postMessage no se entrega al emisor (spec),
// así que el saveState de ESTA tab no dispara este handler — solo lo
// disparan saves de otras pestañas del mismo origen.
(function setupCrossTabSync() {
  if (typeof window === "undefined") return;
  try {
    const ch = getSyncChannel();
    if (!ch) return;
    ch.addEventListener("message", (e) => {
      const data = e?.data || {};
      if (data.kind === "state-saved") {
        useStore.getState().syncFromStorage?.();
      }
    });
  } catch (e) {
    logger.error("store.setupCrossTabSync", e);
  }
})();
