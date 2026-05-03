"use client";
/* ═══════════════════════════════════════════════════════════════
   useProtocolPlayer — Phase 4 SP3
   Hook consolidado que reemplaza el motor distribuido (page.jsx +
   useSessionTimer + useSessionAudio + SessionRunner).
   Owns:
   - State machine de actos (idle → running → completing → done/cancelled)
   - Validación anti-trampa MIXTA por useCase (active/training/crisis)
   - Tiempo elapsed por acto (NUNCA se expone al user — anti-trampa)
   - Audio orchestration (binaural + wake lock + signature al cierre)
   - Acreditación: bandit weight, vCores, streak, partial flag
   - TTS override en crisis (decisión locked)
   ═══════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import {
  startBinaural,
  stopBinaural,
  hapticSignature,
  requestWakeLock,
  releaseWakeLock,
  unlockAudio,
} from "../lib/audio";
import { getUseCase, inferActDefaults } from "../lib/protocols";

const TICK_MS = 100;

/**
 * @typedef {object} PrimitiveSignals
 * @property {number} [breathCyclesCompleted]
 * @property {number} [tapsCompleted]
 * @property {number} [holdMs]
 * @property {string|string[]} [selectedChipId]
 * @property {boolean} [completedFlag]
 */

/**
 * @typedef {object} ActResult
 * @property {number} actIndex
 * @property {number} phaseIndex
 * @property {boolean} passed
 * @property {boolean} forced
 * @property {number} elapsedMs
 */

const initialState = {
  status: "idle",
  currentPhaseIndex: 0,
  currentActIndex: 0,
  completedActs: 0,
  actStartedAt: 0,
  internalElapsedMs: 0,
  pausedAccum: 0,
  pausedAt: 0,
  signals: {},
  results: [],
  completionData: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "start":
      return {
        ...initialState,
        status: "running",
        actStartedAt: Date.now(),
      };
    case "tick":
      if (state.status !== "running") return state;
      return {
        ...state,
        internalElapsedMs: Date.now() - state.actStartedAt - state.pausedAccum,
      };
    case "set_signal":
      return { ...state, signals: { ...state.signals, ...action.payload } };
    case "advance_act":
      return {
        ...state,
        currentPhaseIndex: action.payload.nextPhaseIndex,
        currentActIndex: action.payload.nextActIndex,
        completedActs: state.completedActs + 1,
        actStartedAt: Date.now(),
        pausedAccum: 0,
        pausedAt: 0,
        signals: {},
        internalElapsedMs: 0,
        results: [...state.results, action.payload.result],
      };
    case "pause":
      if (state.status !== "running") return state;
      return { ...state, status: "paused", pausedAt: Date.now() };
    case "resume":
      if (state.status !== "paused") return state;
      return {
        ...state,
        status: "running",
        pausedAccum: state.pausedAccum + (Date.now() - state.pausedAt),
        pausedAt: 0,
      };
    case "complete":
      return {
        ...state,
        status: "done",
        completionData: action.payload,
        results: [...state.results, action.payload.lastResult],
        completedActs: state.completedActs + 1,
      };
    case "cancel":
      return { ...state, status: "cancelled" };
    case "reset":
      return initialState;
    default:
      return state;
  }
}

/* ─── Validation per act ─────────────────────────────────── */

function evaluateValidation(act, elapsedMs, signals) {
  if (!act?.validate) return { canAdvance: true, progress: 1.0 };
  const v = act.validate;
  switch (v.kind) {
    case "min_duration": {
      const need = v.min_ms ?? 0;
      return {
        canAdvance: elapsedMs >= need,
        progress: need > 0 ? Math.min(1, elapsedMs / need) : 1,
      };
    }
    case "breath_cycles": {
      const cycles = signals.breathCyclesCompleted || 0;
      const need = v.min_cycles ?? 1;
      const cycleMs = v.cycle_min_ms ?? 0;
      return {
        canAdvance: cycles >= need && elapsedMs >= need * cycleMs,
        progress: Math.min(1, cycles / Math.max(1, need)),
      };
    }
    case "tap_count": {
      const taps = signals.tapsCompleted || 0;
      const need = v.min_taps ?? 1;
      return {
        canAdvance: taps >= need,
        progress: Math.min(1, taps / Math.max(1, need)),
      };
    }
    case "hold_press": {
      const held = signals.holdMs || 0;
      const need = v.min_hold_ms ?? 0;
      return {
        canAdvance: held >= need,
        progress: need > 0 ? Math.min(1, held / need) : 1,
      };
    }
    case "chip_selection": {
      const sel = signals.selectedChipId;
      const has = Array.isArray(sel) ? sel.length > 0 : !!sel;
      return { canAdvance: has, progress: has ? 1 : 0 };
    }
    case "no_validation":
      return { canAdvance: true, progress: 1.0 };
    case "eye_movement":
    case "ppg_breath_match":
    case "visual_completion":
    default: {
      // SP3 fallback: timing-based 5s mínimo si validación específica
      // todavía no tiene runtime check (eye/ppg requieren camera SP4+).
      const need = 5000;
      return {
        canAdvance: elapsedMs >= need || !!signals.completedFlag,
        progress: Math.min(1, elapsedMs / need),
      };
    }
  }
}

/* ─── Session completion math ────────────────────────────── */

function computeSessionCompletion(protocol, results, durationMs) {
  const totalActs = results.length;
  // Phase 4 SP7 — refinamiento: forceAdvanced NO cuenta como completed.
  // Solo actos donde validation pasó orgánicamente (passed && !forced).
  // Esto evita que user en training salte 6 actos para fingir completion.
  const completedActs = results.filter((r) => r.passed && !r.forced).length;
  const useCase = getUseCase(protocol);
  const ratio = totalActs > 0 ? completedActs / totalActs : 0;

  if (useCase === "crisis") {
    return {
      status: "crisis_credited",
      partial: false,
      partialPercent: 1.0,
      banditWeight: 0.3,
      streakIncrement: true,
      vCoresAward: 5,
      durationMs,
      completedActs,
      totalActs,
      useCase,
    };
  }

  if (useCase === "training") {
    if (completedActs === totalActs && totalActs > 0) {
      return {
        status: "complete", partial: false, partialPercent: 1.0,
        banditWeight: 1.0, streakIncrement: true, vCoresAward: 10,
        durationMs, completedActs, totalActs, useCase,
      };
    }
    if (ratio >= 0.5) {
      return {
        status: "partial_credited", partial: true, partialPercent: ratio,
        banditWeight: 0.6, streakIncrement: true, vCoresAward: 5,
        durationMs, completedActs, totalActs, useCase,
      };
    }
    return {
      status: "incomplete_uncredited", partial: false, partialPercent: ratio,
      banditWeight: 0, streakIncrement: false, vCoresAward: 0,
      durationMs, completedActs, totalActs, useCase,
    };
  }

  // active strict
  if (completedActs === totalActs && totalActs > 0) {
    return {
      status: "complete", partial: false, partialPercent: 1.0,
      banditWeight: 1.0, streakIncrement: true, vCoresAward: 10,
      durationMs, completedActs, totalActs, useCase,
    };
  }
  return {
    status: "incomplete_uncredited", partial: false, partialPercent: ratio,
    banditWeight: 0, streakIncrement: false, vCoresAward: 0,
    durationMs, completedActs, totalActs, useCase,
  };
}

/* ─── Flatten phases × acts ──────────────────────────────── */

function flattenActs(protocol) {
  if (!protocol?.ph) return [];
  const flat = [];
  protocol.ph.forEach((phase, phaseIdx) => {
    const acts = Array.isArray(phase.iExec) && phase.iExec.length > 0
      ? phase.iExec
      : [{ from: 0, to: phase.e - phase.s, text: phase.k || "" }];
    acts.forEach((rawAct, actIdx) => {
      flat.push({
        phaseIdx,
        actIdx,
        phase,
        act: inferActDefaults(rawAct, phase, protocol),
      });
    });
  });
  return flat;
}

/* ─── Hook ───────────────────────────────────────────────── */

export function useProtocolPlayer(protocol, opts = {}) {
  const {
    voiceOn = false,
    hapticOn = true,
    binauralOn = true,
    cameraEnabled = false,
    onComplete,
    onCancel,
  } = opts;

  const [state, dispatch] = useReducer(reducer, initialState);
  const flat = useMemo(() => flattenActs(protocol), [protocol]);
  const sessionStartRef = useRef(0);
  const audioStartedRef = useRef(false);

  const flatIndex = useMemo(
    () => flat.findIndex(
      (f) => f.phaseIdx === state.currentPhaseIndex && f.actIdx === state.currentActIndex,
    ),
    [flat, state.currentPhaseIndex, state.currentActIndex],
  );

  const currentEntry = flat[flatIndex] || null;
  const currentAct = currentEntry?.act || null;
  const currentActPhase = currentEntry?.phase || null;
  const totalActsInProtocol = flat.length;

  const useCase = getUseCase(protocol);
  // Decisión 2: TTS auto-on en crisis. Override no persistido.
  // Phase 4 SP7 extensión: NSDR (#17) también override ON — voice-led
  // protocol (Yoga Nidra / Huberman). User pref de Settings se ignora
  // sólo durante este protocolo, no se persiste.
  const isVoiceOverrideProtocol = useCase === "crisis" || protocol?.id === 17;
  const effectiveVoiceOn = isVoiceOverrideProtocol ? true : !!voiceOn;

  /* ─── Tick interval ─── */
  useEffect(() => {
    if (state.status !== "running") return undefined;
    const id = setInterval(() => dispatch({ type: "tick" }), TICK_MS);
    return () => clearInterval(id);
  }, [state.status]);

  /* ─── Validation snapshot (re-evaluated on every render) ─── */
  const validation = useMemo(() => {
    if (!currentAct) return { canAdvance: false, progress: 0 };
    return evaluateValidation(currentAct, state.internalElapsedMs, state.signals);
  }, [currentAct, state.internalElapsedMs, state.signals]);

  /* ─── Audio orchestration ─── */
  const teardownAudio = useCallback(() => {
    if (!audioStartedRef.current) return;
    try { stopBinaural(); } catch { /* noop */ }
    try { releaseWakeLock(); } catch { /* noop */ }
    audioStartedRef.current = false;
  }, []);

  /* ─── Public actions ─── */

  const start = useCallback(() => {
    if (state.status === "running") return;
    sessionStartRef.current = Date.now();
    try { unlockAudio(); } catch { /* noop */ }
    if (binauralOn && protocol?.int) {
      try { startBinaural(protocol.int); } catch { /* noop */ }
    }
    try { requestWakeLock(); } catch { /* noop */ }
    audioStartedRef.current = true;
    dispatch({ type: "start" });
  }, [state.status, binauralOn, protocol]);

  const pause = useCallback(() => {
    // Phase 4 SP7 — audio orchestration: detener binaural durante pause.
    // Wakelock permanece (user todavía está en sesión, sólo descansando).
    try { stopBinaural(); } catch { /* noop */ }
    dispatch({ type: "pause" });
  }, []);
  const resume = useCallback(() => {
    // Reinicia binaural si el protocolo lo tenía activo.
    if (binauralOn && protocol?.int && audioStartedRef.current) {
      try { startBinaural(protocol.int); } catch { /* noop */ }
    }
    dispatch({ type: "resume" });
  }, [binauralOn, protocol]);

  const advanceInternal = useCallback((forced = false) => {
    if (!currentEntry) return;
    const passed = !forced && validation.canAdvance;
    const result = {
      actIndex: flatIndex,
      phaseIndex: state.currentPhaseIndex,
      passed,
      forced,
      elapsedMs: state.internalElapsedMs,
    };
    const isLast = flatIndex >= flat.length - 1;
    if (isLast) {
      const durationMs = Date.now() - sessionStartRef.current;
      const allResults = [...state.results, result];
      const completion = computeSessionCompletion(protocol, allResults, durationMs);
      teardownAudio();
      if (hapticOn) {
        try { hapticSignature("ignition"); } catch { /* noop */ }
      }
      dispatch({ type: "complete", payload: { ...completion, lastResult: result } });
      if (typeof onComplete === "function") onComplete(completion);
      return;
    }
    const nextEntry = flat[flatIndex + 1];
    dispatch({
      type: "advance_act",
      payload: {
        nextPhaseIndex: nextEntry.phaseIdx,
        nextActIndex: nextEntry.actIdx,
        result,
      },
    });
  }, [
    currentEntry, validation.canAdvance, flatIndex, flat, state.currentPhaseIndex,
    state.internalElapsedMs, state.results, protocol, hapticOn, teardownAudio, onComplete,
  ]);

  const advance = useCallback(() => {
    if (!validation.canAdvance) return;
    advanceInternal(false);
  }, [validation.canAdvance, advanceInternal]);

  const forceAdvance = useCallback(() => advanceInternal(true), [advanceInternal]);

  const cancel = useCallback(() => {
    teardownAudio();
    dispatch({ type: "cancel" });
    if (typeof onCancel === "function") onCancel();
  }, [teardownAudio, onCancel]);

  const imOK = useCallback(() => {
    if (useCase !== "crisis") return;
    const remaining = flat.slice(flatIndex);
    const allResults = [
      ...state.results,
      ...remaining.map((r, i) => ({
        actIndex: flatIndex + i,
        phaseIndex: r.phaseIdx,
        passed: true,
        forced: false,
        elapsedMs: i === 0 ? state.internalElapsedMs : 0,
      })),
    ];
    const durationMs = Date.now() - sessionStartRef.current;
    const completion = computeSessionCompletion(protocol, allResults, durationMs);
    teardownAudio();
    if (hapticOn) {
      try { hapticSignature("ignition"); } catch { /* noop */ }
    }
    dispatch({
      type: "complete",
      payload: {
        ...completion,
        lastResult: allResults[allResults.length - 1],
      },
    });
    if (typeof onComplete === "function") onComplete(completion);
  }, [useCase, flat, flatIndex, state.results, state.internalElapsedMs, protocol, hapticOn, teardownAudio, onComplete]);

  const updateActSignal = useCallback((payload) => {
    dispatch({ type: "set_signal", payload });
  }, []);

  /* ─── Cleanup on unmount ─── */
  useEffect(() => () => { teardownAudio(); }, [teardownAudio]);

  /* ─── Acreditación preview en tiempo real ─── */
  const willCredit = useMemo(() => {
    if (useCase === "crisis") return true;
    if (useCase === "training") {
      const passed = state.results.filter((r) => r.passed).length;
      const total = flat.length;
      return total > 0 && passed / total >= 0.5;
    }
    // active
    const passed = state.results.filter((r) => r.passed).length + (validation.canAdvance ? 1 : 0);
    return passed === flat.length;
  }, [useCase, state.results, flat.length, validation.canAdvance]);

  const partialPercent = useMemo(() => {
    if (flat.length === 0) return 0;
    return state.results.filter((r) => r.passed).length / flat.length;
  }, [state.results, flat.length]);

  const expectedDurationMs = useMemo(() => (protocol?.d || 0) * 1000, [protocol]);

  return {
    status: state.status,
    currentPhaseIndex: state.currentPhaseIndex,
    currentActIndex: state.currentActIndex,
    totalActsInProtocol,
    completedActs: state.completedActs,
    currentAct,
    currentActPhase,
    validation,
    internalElapsedMs: state.internalElapsedMs,
    expectedDurationMs,
    willCredit,
    partialPercent,
    effectiveVoiceOn,
    cameraEnabled,
    completionData: state.completionData,
    start,
    pause,
    resume,
    advance,
    forceAdvance,
    cancel,
    imOK,
    updateActSignal,
  };
}

/* Exposed for unit tests + future SP4-SP8 use */
export const __internals = {
  evaluateValidation,
  computeSessionCompletion,
  flattenActs,
};
