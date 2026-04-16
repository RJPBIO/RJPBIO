/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — ZUSTAND STORE v3
   Gestión centralizada de estado con persistencia robusta,
   acciones de sesión, calibración neural y computed state
   ═══════════════════════════════════════════════════════════════ */

import { create } from "zustand";
import { DS } from "../lib/constants";
import { getWeekNum } from "../lib/neural";

const STORAGE_KEY = "bio-g2";
const STORE_VERSION = 5;

// ─── Storage Availability Check ─────────────────────────
function isStorageAvailable() {
  try {
    if (typeof window === "undefined") return false;
    const test = "__bio_test__";
    localStorage.setItem(test, "1");
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

// ─── Persistence Layer ───────────────────────────────────
function loadFromStorage() {
  if (!isStorageAvailable()) return { ...DS, _v: STORE_VERSION };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DS, _v: STORE_VERSION, _created: Date.now() };

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (parseErr) {
      console.error("[BIO] Corrupt localStorage data, resetting:", parseErr.message);
      localStorage.removeItem(STORAGE_KEY);
      return { ...DS, _v: STORE_VERSION, _created: Date.now(), _recovered: true };
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      console.error("[BIO] Invalid state shape, resetting");
      localStorage.removeItem(STORAGE_KEY);
      return { ...DS, _v: STORE_VERSION, _created: Date.now(), _recovered: true };
    }

    const data = { ...DS, ...parsed };
    // Migration: add new fields from DS if they don't exist
    if (!data._v || data._v < STORE_VERSION) {
      data._v = STORE_VERSION;
      data._migrated = Date.now();
    }
    return data;
  } catch (e) {
    console.error("[BIO] Store load error:", e.message);
    return { ...DS, _v: STORE_VERSION, _created: Date.now() };
  }
}

function saveToStorage(state) {
  if (!isStorageAvailable()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // Quota exceeded — try trimming history
    if (e.name === "QuotaExceededError") {
      console.warn("[BIO] Storage quota exceeded, trimming history");
      const trimmed = {
        ...state,
        history: (state.history || []).slice(-50),
        moodLog: (state.moodLog || []).slice(-50),
        calibrationHistory: (state.calibrationHistory || []).slice(-5),
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed)); }
      catch (e2) { console.error("[BIO] Save failed even after trim:", e2.message); }
    } else {
      console.error("[BIO] Store save error:", e.message);
    }
  }
}

// ─── Import Validation ──────────────────────────────────
function validateImport(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  // Must have at least one expected field
  const expected = ["totalSessions", "history", "moodLog", "coherencia"];
  const hasExpected = expected.some(k => k in data);
  if (!hasExpected) return null;
  // Sanitize: ensure numeric fields are numbers
  const sanitized = { ...data };
  ["totalSessions", "streak", "coherencia", "resiliencia", "capacidad", "vCores", "totalTime"].forEach(k => {
    if (k in sanitized && typeof sanitized[k] !== "number") sanitized[k] = 0;
  });
  ["history", "moodLog", "achievements", "weeklyData", "favs"].forEach(k => {
    if (k in sanitized && !Array.isArray(sanitized[k])) sanitized[k] = DS[k] || [];
  });
  return sanitized;
}

// ─── Store Definition ────────────────────────────────────
export const useStore = create((set, get) => ({
  // ─── Core State ─────────────────────────────────────────
  ...DS,
  _loaded: false,
  _initCalled: false,

  // ─── Initialization (idempotent) ────────────────────────
  init: () => {
    if (get()._initCalled) return; // prevent double init
    const loaded = loadFromStorage();
    const cw = getWeekNum();

    // Rotación semanal automática
    if (loaded.weekNum !== null && loaded.weekNum !== cw) {
      loaded.prevWeekData = [...(loaded.weeklyData || [0,0,0,0,0,0,0])];
      loaded.weeklyData = [0, 0, 0, 0, 0, 0, 0];
      loaded.weekNum = cw;
    }
    if (loaded.weekNum === null) loaded.weekNum = cw;

    set({ ...loaded, _loaded: true, _initCalled: true });
    saveToStorage({ ...loaded });
  },

  // ─── Generic Update ─────────────────────────────────────
  update: (partial) => {
    set(partial);
    saveToStorage(get());
  },

  // ─── Explicit Save ──────────────────────────────────────
  save: () => {
    saveToStorage(get());
  },

  // ─── Session Completion ─────────────────────────────────
  completeSession: (newState) => {
    const st = get();
    set(newState);
    saveToStorage({ ...st, ...newState });
  },

  // ─── Mood Logging ───────────────────────────────────────
  logMood: (moodEntry) => {
    const st = get();
    const ml = [...(st.moodLog || []), moodEntry].slice(-200);
    const ach = [...(st.achievements || [])];
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

  // ─── Import Data (validated) ────────────────────────────
  importData: (data) => {
    const validated = validateImport(data);
    if (!validated) {
      console.error("[BIO] Import rejected: invalid data shape");
      return false;
    }
    const merged = { ...DS, ...validated, _v: STORE_VERSION, _imported: Date.now() };
    set(merged);
    saveToStorage(merged);
    return true;
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
    set({ ...fresh, _initCalled: true, _loaded: true });
    saveToStorage(fresh);
  },
}));
