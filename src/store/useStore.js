/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — ZUSTAND STORE v3
   Persistencia: IndexedDB (cifrado) + localStorage fallback
   Sync cloud · Outbox offline · Migraciones versionadas
   ═══════════════════════════════════════════════════════════════ */

import { create } from "zustand";
import { DS } from "../lib/constants";
import { getWeekNum } from "../lib/neural";
import { loadState, saveState, clearAll, outboxAdd } from "../lib/storage";
import { logger } from "../lib/logger";
import { updateArm, armKey, timeBucket, compositeReward } from "../lib/neural/bandit";
import { logResidual as logResidualEntry } from "../lib/neural/residuals";

const STORE_VERSION = 9;

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
function scheduleSave(state) {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    saveState(state).catch((e) => logger.error("persist.save", e));
  }, 300);
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
      progDay: Math.min((st.progDay || 0) + 1, 7),
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
    const rhrLog = entry.rhr != null
      ? [...(st.rhrLog || []), { ts: entry.ts, rhr: entry.rhr }].slice(-365)
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

  resetAll: async () => {
    const fresh = { ...DS, weekNum: getWeekNum(), _v: STORE_VERSION, _userId: null };
    await clearAll();
    set(fresh);
    scheduleSave(fresh);
  },
}));
