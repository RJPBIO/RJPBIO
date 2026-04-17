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

const STORE_VERSION = 6;

function migrate(data) {
  if (!data) return { ...DS, _v: STORE_VERSION, _created: Date.now() };
  const merged = { ...DS, ...data };
  if (!merged._v || merged._v < STORE_VERSION) {
    merged._v = STORE_VERSION;
    merged._migrated = Date.now();
  }
  return merged;
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

  init: async () => {
    try {
      const loaded = migrate(await loadState());
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
    outboxAdd({ kind: "session", payload: r }).catch(() => {});
  },

  logMood: (moodEntry) => {
    const st = get();
    const ml = [...(st.moodLog || []), moodEntry].slice(-200);
    const ach = [...st.achievements];
    if (moodEntry.mood === 5 && !ach.includes("mood5")) ach.push("mood5");
    set({ moodLog: ml, achievements: ach });
    scheduleSave({ ...st, moodLog: ml, achievements: ach });
    outboxAdd({ kind: "mood", payload: moodEntry }).catch(() => {});
  },

  setNeuralBaseline: (baseline) => {
    set({ neuralBaseline: baseline, onboardingComplete: true });
    scheduleSave({ ...get() });
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

  resetAll: async () => {
    const fresh = { ...DS, weekNum: getWeekNum(), _v: STORE_VERSION };
    await clearAll();
    set(fresh);
    scheduleSave(fresh);
  },
}));
