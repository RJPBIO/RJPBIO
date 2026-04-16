/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — ZUSTAND STORE v2
   Gestión centralizada de estado con persistencia automática,
   acciones de sesión, calibración neural y computed state
   ═══════════════════════════════════════════════════════════════ */

import { create } from "zustand";
import { DS } from "../lib/constants";
import { getWeekNum } from "../lib/neural";

const STORAGE_KEY = "bio-g2";
const STORE_VERSION = 5;

// ─── Persistence Layer ───────────────────────────────────
function loadFromStorage() {
  try {
    if (typeof window === "undefined") return { ...DS, _v: STORE_VERSION };
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const data = { ...DS, ...parsed };
      // Migration: add new fields from DS if they don't exist
      if (!data._v || data._v < STORE_VERSION) {
        data._v = STORE_VERSION;
        data._migrated = Date.now();
      }
      return data;
    }
  } catch (e) { console.error("Store load error:", e); }
  return { ...DS, _v: STORE_VERSION, _created: Date.now() };
}

function saveToStorage(state) {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch (e) { console.error("Store save error:", e); }
}

// ─── Store Definition ────────────────────────────────────
export const useStore = create((set, get) => ({
  // ─── Core State ─────────────────────────────────────────
  ...DS,
  _loaded: false,

  // ─── Initialization ─────────────────────────────────────
  init: () => {
    const loaded = loadFromStorage();
    const cw = getWeekNum();

    // Rotación semanal automática
    if (loaded.weekNum !== null && loaded.weekNum !== cw) {
      loaded.prevWeekData = [...loaded.weeklyData];
      loaded.weeklyData = [0, 0, 0, 0, 0, 0, 0];
      loaded.weekNum = cw;
    }
    if (loaded.weekNum === null) loaded.weekNum = cw;

    set({ ...loaded, _loaded: true });
    saveToStorage({ ...loaded });
  },

  // ─── Generic Update ─────────────────────────────────────
  update: (partial) => {
    set(partial);
    const state = get();
    saveToStorage(state);
  },

  // ─── Explicit Save ──────────────────────────────────────
  save: () => {
    saveToStorage(get());
  },

  // ─── Session Completion ─────────────────────────────────
  // Accepts newState from calcSessionCompletion directly
  completeSession: (newState) => {
    const st = get();
    set(newState);
    saveToStorage({ ...st, ...newState });
  },

  // ─── Mood Logging ───────────────────────────────────────
  logMood: (moodEntry) => {
    const st = get();
    const ml = [...(st.moodLog || []), moodEntry].slice(-200);
    const ach = [...st.achievements];
    if (moodEntry.mood === 5 && !ach.includes("mood5")) ach.push("mood5");
    set({ moodLog: ml, achievements: ach });
    saveToStorage({ ...st, moodLog: ml, achievements: ach });
  },

  // ─── Neural Baseline Calibration ───────────────────────
  setNeuralBaseline: (baseline) => {
    const st = get();
    set({ neuralBaseline: baseline, onboardingComplete: true });
    saveToStorage({ ...st, neuralBaseline: baseline, onboardingComplete: true });
  },

  // ─── Toggle Favorites ──────────────────────────────────
  toggleFav: (name) => {
    const st = get();
    const favs = st.favs || [];
    const nf = favs.includes(name) ? favs.filter((f) => f !== name) : [...favs, name];
    set({ favs: nf });
    saveToStorage({ ...st, favs: nf });
  },

  // ─── Settings Update ───────────────────────────────────
  updateSettings: (settings) => {
    const st = get();
    const updated = { ...st, ...settings };
    set(settings);
    saveToStorage(updated);
  },

  // ─── Session Goal ───────────────────────────────────────
  setSessionGoal: (goal) => {
    const st = get();
    set({ sessionGoal: goal });
    saveToStorage({ ...st, sessionGoal: goal });
  },

  // ─── Import Data ─────────────────────────────────────────
  importData: (data) => {
    const merged = { ...DS, ...data, _v: STORE_VERSION, _imported: Date.now() };
    set(merged);
    saveToStorage(merged);
  },

  // ─── Recalibrate Neural Baseline ───────────────────────
  recalibrate: (newBaseline) => {
    const st = get();
    const calibrationHistory = [...(st.calibrationHistory || []), {
      ...newBaseline,
      ts: Date.now(),
      sessionCount: st.totalSessions,
    }].slice(-10);
    set({ neuralBaseline: newBaseline, calibrationHistory, onboardingComplete: true });
    saveToStorage({ ...st, neuralBaseline: newBaseline, calibrationHistory, onboardingComplete: true });
  },

  // ─── Update Session Goal ───────────────────────────────
  setDailyGoal: (goal) => {
    const st = get();
    set({ sessionGoal: goal });
    saveToStorage({ ...st, sessionGoal: goal });
  },

  // ─── Full Reset ─────────────────────────────────────────
  resetAll: () => {
    const fresh = { ...DS, weekNum: getWeekNum(), _v: STORE_VERSION };
    set(fresh);
    saveToStorage(fresh);
  },
}));
