/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — ZUSTAND STORE v3
   Persistencia: IndexedDB (cifrado) + localStorage fallback
   Sync cloud · Outbox offline · Migraciones versionadas
   ═══════════════════════════════════════════════════════════════ */

import { create } from "zustand";
import { DS } from "../lib/constants";
import { getWeekNum } from "../lib/neural";
import { loadState, saveState, clearAll, outboxAdd, getSyncChannel } from "../lib/storage";
// Nota: outboxAdd ahora dispatcha "bio-outbox-changed" event al
// completar el IndexedDB write; sync.js (vía wireBackgroundSync)
// escucha ese event y dispara drain debounced. Sin circular dep
// entre storage y sync — bus pattern.
import { logger } from "../lib/logger";
import { updateArm, armKey, timeBucket, compositeReward } from "../lib/neural/bandit";
import { logResidual as logResidualEntry } from "../lib/neural/residuals";

const STORE_VERSION = 14;

function migrate(data) {
  if (!data) return { ...DS, _v: STORE_VERSION, _created: Date.now() };
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
    merged._v = STORE_VERSION;
    merged._migrated = Date.now();
  }
  return merged;
}

// Si el dueño del estado persistido no coincide con el usuario actual
// (ej. logout → nuevo login en mismo navegador), devolvemos estado fresco.
// Null/undefined actual = sesión anónima; si el previo era de un user real,
// también limpiamos para que invitados no hereden datos ajenos.
function belongsToUser(loaded, currentUserId) {
  const prev = loaded?._userId ?? null;
  const curr = currentUserId ?? null;
  return prev === curr;
}

let persistTimer = null;
let lastScheduledState = null;
function scheduleSave(state) {
  lastScheduledState = state;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    saveState(state).catch((e) => logger.error("persist.save", e));
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
  const target = state || lastScheduledState;
  if (!target) return;
  try {
    await saveState(target);
  } catch (e) {
    logger.error("persist.saveNow", e);
  }
}

export const useStore = create((set, get) => ({
  ...DS,
  _loaded: false,
  _syncing: false,

  init: async (opts = {}) => {
    try {
      const userId = opts.userId ?? null;
      let loaded = migrate(await loadState());
      if (!belongsToUser(loaded, userId)) {
        // Mismo navegador, otro usuario → reset local para no filtrar datos.
        await clearAll();
        loaded = migrate(null);
      }
      loaded._userId = userId;
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
    set(update);
    scheduleSave({ ...st, ...update });
    outboxAdd({ kind: "session", payload: r, userId: st._userId ?? null }).catch(() => {});
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
    const delta = Number(deltaMood);
    if (!Number.isFinite(delta) || !intent) return;
    // El bandit aprende del reward compuesto (mood + energía + HRV +
    // completitud). Los residuales siguen calibrando contra mood puro —
    // que es lo que predecimos en la UI.
    const reward = compositeReward({
      moodDelta: delta,
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
    const nextArms = {
      ...arms,
      [keyCtx]: updateArm(arms[keyCtx], reward),
      [keyGlb]: updateArm(arms[keyGlb], reward),
    };
    const nextResiduals =
      typeof predictedDelta === "number"
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
    set({ activeProgram: null, programHistory, achievements: ach, vCores });
    scheduleSave({ ...st, activeProgram: null, programHistory, achievements: ach, vCores });
    outboxAdd({
      kind: "program_complete",
      payload: { id: st.activeProgram.id, startedAt: st.activeProgram.startedAt, completedAt: now },
      userId: st._userId ?? null,
    }).catch(() => {});
    return true;
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
