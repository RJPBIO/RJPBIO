/* useStore.programCompletion.test — Phase 6I-1.
   Cubre detectProgramCompletionCelebration helper (puro) + finalizeProgram
   integration + markProgramCompletionCelebrationShown / dismissPending
   setter actions. Test file separado del baseline para no modificar
   anti-regression Phase 6E SP-A program tests. */
import { describe, it, expect, beforeEach } from "vitest";
import { useStore, detectProgramCompletionCelebration } from "./useStore";

const initialStoreState = useStore.getState();

beforeEach(() => {
  useStore.setState(initialStoreState, true);
});

// Programs catalog reales (lib/programs.js):
//   neural-baseline (14d) · recovery-week (7d) · focus-sprint (5d)
//   burnout-recovery (28d) · executive-presence (10d)

// ============================================================================
// detectProgramCompletionCelebration (función pura)
// ============================================================================
describe("detectProgramCompletionCelebration — Phase 6I-1", () => {
  it("activeProgram válido + sin doneAt → celebration con programId/totalDays", () => {
    const snapshot = { id: "burnout-recovery", startedAt: 1000, completedSessionDays: [] };
    const catalog = { id: "burnout-recovery", n: "Burnout Recovery", duration: 28 };
    const c = detectProgramCompletionCelebration(snapshot, {}, catalog);
    expect(c).toBeTruthy();
    expect(c.programId).toBe("burnout-recovery");
    expect(c.programName).toBe("Burnout Recovery");
    expect(c.totalDays).toBe(28);
    expect(typeof c.completedAt).toBe("number");
    expect(typeof c.timestamp).toBe("number");
  });

  it("activeProgram válido + doneAt[programId] ya set → null (dedup)", () => {
    const snapshot = { id: "focus-sprint", startedAt: 1000, completedSessionDays: [] };
    const catalog = { id: "focus-sprint", n: "Focus Sprint", duration: 5 };
    const doneAt = { "focus-sprint": 999 };
    expect(detectProgramCompletionCelebration(snapshot, doneAt, catalog)).toBeNull();
  });

  it("activeProgramSnapshot null → null", () => {
    expect(detectProgramCompletionCelebration(null, {}, null)).toBeNull();
    expect(detectProgramCompletionCelebration(undefined, {}, null)).toBeNull();
  });

  it("activeProgramSnapshot sin id válido → null", () => {
    expect(detectProgramCompletionCelebration({}, {}, null)).toBeNull();
    expect(detectProgramCompletionCelebration({ id: null }, {}, null)).toBeNull();
    expect(detectProgramCompletionCelebration({ id: "" }, {}, null)).toBeNull();
    expect(detectProgramCompletionCelebration({ id: 123 }, {}, null)).toBeNull();
  });

  it("catalogEntry null → fallback programName=programId, totalDays=0", () => {
    const snapshot = { id: "unknown-program", startedAt: 1000, completedSessionDays: [] };
    const c = detectProgramCompletionCelebration(snapshot, {}, null);
    expect(c).toBeTruthy();
    expect(c.programName).toBe("unknown-program");
    expect(c.totalDays).toBe(0);
  });

  it("doneAt undefined / null → fallback {} (no crash)", () => {
    const snapshot = { id: "neural-baseline", startedAt: 1000, completedSessionDays: [] };
    const catalog = { id: "neural-baseline", n: "Neural Baseline", duration: 14 };
    expect(detectProgramCompletionCelebration(snapshot, undefined, catalog)).toBeTruthy();
    expect(detectProgramCompletionCelebration(snapshot, null, catalog)).toBeTruthy();
  });

  it("doneAt con OTRO programId → no afecta (independencia per-program)", () => {
    const snapshot = { id: "focus-sprint", startedAt: 1000, completedSessionDays: [] };
    const catalog = { id: "focus-sprint", n: "Focus Sprint", duration: 5 };
    const doneAt = { "burnout-recovery": 999 }; // different program
    const c = detectProgramCompletionCelebration(snapshot, doneAt, catalog);
    expect(c).toBeTruthy();
    expect(c.programId).toBe("focus-sprint");
  });
});

// ============================================================================
// finalizeProgram integration — detection wires to store
// ============================================================================
describe("finalizeProgram + program completion celebration wiring — Phase 6I-1", () => {
  it("finalizeProgram completes burnout-recovery → pendingProgramCompletionCelebration set", () => {
    // 28 días requeridos; setear activeProgram con 28 días completados
    useStore.setState({
      ...initialStoreState,
      activeProgram: {
        id: "burnout-recovery",
        startedAt: Date.now() - 28 * 86400000,
        completedSessionDays: Array.from({ length: 28 }, (_, i) => i + 1),
      },
    }, true);

    const result = useStore.getState().finalizeProgram({ totalRequired: 28 });
    expect(result).toBe(true);

    const state = useStore.getState();
    expect(state.activeProgram).toBeNull(); // archived
    expect(state.pendingProgramCompletionCelebration).toBeTruthy();
    expect(state.pendingProgramCompletionCelebration.programId).toBe("burnout-recovery");
    expect(state.pendingProgramCompletionCelebration.programName).toBe("Burnout Recovery");
    expect(state.pendingProgramCompletionCelebration.totalDays).toBe(28);
  });

  it("finalizeProgram completes focus-sprint → celebration con totalDays=5", () => {
    useStore.setState({
      ...initialStoreState,
      activeProgram: {
        id: "focus-sprint",
        startedAt: Date.now() - 5 * 86400000,
        completedSessionDays: [1, 2, 3, 4, 5],
      },
    }, true);

    useStore.getState().finalizeProgram({ totalRequired: 5 });

    const state = useStore.getState();
    expect(state.pendingProgramCompletionCelebration.programId).toBe("focus-sprint");
    expect(state.pendingProgramCompletionCelebration.totalDays).toBe(5);
  });

  it("finalizeProgram con doneAt[programId] ya set → NO re-fire celebration", () => {
    useStore.setState({
      ...initialStoreState,
      activeProgram: {
        id: "focus-sprint",
        startedAt: Date.now() - 5 * 86400000,
        completedSessionDays: [1, 2, 3, 4, 5],
      },
      programCompletionCelebrationDoneAt: { "focus-sprint": Date.now() - 1000 },
    }, true);

    useStore.getState().finalizeProgram({ totalRequired: 5 });

    const state = useStore.getState();
    expect(state.pendingProgramCompletionCelebration).toBeNull();
    // activeProgram sigue archivado correctamente (semantic core preservada)
    expect(state.activeProgram).toBeNull();
    expect(state.programHistory).toHaveLength(1);
  });

  it("finalizeProgram con totalRequired no cumplido → no completion ni celebration", () => {
    useStore.setState({
      ...initialStoreState,
      activeProgram: {
        id: "burnout-recovery",
        startedAt: Date.now(),
        completedSessionDays: [1, 2, 3], // solo 3 de 28
      },
    }, true);

    const result = useStore.getState().finalizeProgram({ totalRequired: 28 });
    expect(result).toBe(false);
    expect(useStore.getState().pendingProgramCompletionCelebration).toBeNull();
    // activeProgram NO se archiva (Phase 6E SP-A semantic preservada)
    expect(useStore.getState().activeProgram).toBeTruthy();
  });

  it("finalizeProgram sin activeProgram → no completion ni celebration", () => {
    useStore.setState({ ...initialStoreState, activeProgram: null }, true);
    const result = useStore.getState().finalizeProgram({ totalRequired: 5 });
    expect(result).toBe(false);
    expect(useStore.getState().pendingProgramCompletionCelebration).toBeNull();
  });

  it("Anti-regression: finalizeProgram preserva semantic Phase 6E SP-A (achievements + vCores + outbox)", () => {
    useStore.setState({
      ...initialStoreState,
      activeProgram: {
        id: "neural-baseline",
        startedAt: Date.now() - 14 * 86400000,
        completedSessionDays: Array.from({ length: 14 }, (_, i) => i + 1),
      },
      vCores: 100,
      achievements: [],
    }, true);

    useStore.getState().finalizeProgram({ totalRequired: 14 });

    const state = useStore.getState();
    // Achievements
    expect(state.achievements).toContain("program_complete");
    // vCores bonus +20
    expect(state.vCores).toBe(120);
    // programHistory anchor
    expect(state.programHistory).toHaveLength(1);
    expect(state.programHistory[0].id).toBe("neural-baseline");
    expect(state.programHistory[0].completionFraction).toBe(1);
    expect(state.programHistory[0].abandoned).toBe(false);
  });
});

// ============================================================================
// markProgramCompletionCelebrationShown / dismissPending setter actions
// ============================================================================
describe("program completion celebration setter actions — Phase 6I-1", () => {
  it("markProgramCompletionCelebrationShown('burnout-recovery') → pending null + doneAt timestamped", () => {
    useStore.setState({
      ...initialStoreState,
      pendingProgramCompletionCelebration: {
        programId: "burnout-recovery",
        programName: "Burnout Recovery",
        totalDays: 28,
        completedAt: Date.now(),
        timestamp: Date.now(),
      },
    }, true);

    useStore.getState().markProgramCompletionCelebrationShown("burnout-recovery");

    const state = useStore.getState();
    expect(state.pendingProgramCompletionCelebration).toBeNull();
    expect(state.programCompletionCelebrationDoneAt["burnout-recovery"]).toBeTruthy();
    expect(typeof state.programCompletionCelebrationDoneAt["burnout-recovery"]).toBe("number");
  });

  it("markProgramCompletionCelebrationShown preserva otros programIds en doneAt", () => {
    useStore.setState({
      ...initialStoreState,
      pendingProgramCompletionCelebration: {
        programId: "focus-sprint", totalDays: 5, timestamp: Date.now(),
      },
      programCompletionCelebrationDoneAt: { "burnout-recovery": 999 },
    }, true);

    useStore.getState().markProgramCompletionCelebrationShown("focus-sprint");

    const state = useStore.getState();
    expect(state.programCompletionCelebrationDoneAt["burnout-recovery"]).toBe(999);
    expect(state.programCompletionCelebrationDoneAt["focus-sprint"]).toBeTruthy();
  });

  it("markProgramCompletionCelebrationShown con programId no en catalog → no-op", () => {
    useStore.setState({
      ...initialStoreState,
      pendingProgramCompletionCelebration: { programId: "bogus", totalDays: 0 },
    }, true);

    useStore.getState().markProgramCompletionCelebrationShown("bogus-program-not-in-catalog");
    useStore.getState().markProgramCompletionCelebrationShown(null);
    useStore.getState().markProgramCompletionCelebrationShown(undefined);
    useStore.getState().markProgramCompletionCelebrationShown(123);

    // pendingProgramCompletionCelebration intacto + doneAt vacío
    expect(useStore.getState().pendingProgramCompletionCelebration).toBeTruthy();
    expect(useStore.getState().programCompletionCelebrationDoneAt).toEqual({});
  });

  it("markProgramCompletionCelebrationShown acepta los 5 programs reales del catalog", () => {
    const programIds = ["neural-baseline", "recovery-week", "focus-sprint", "burnout-recovery", "executive-presence"];
    for (const id of programIds) {
      useStore.setState({ ...initialStoreState }, true);
      useStore.getState().markProgramCompletionCelebrationShown(id);
      expect(useStore.getState().programCompletionCelebrationDoneAt[id]).toBeTruthy();
    }
  });

  it("dismissPendingProgramCompletionCelebration → limpia pending sin tocar doneAt", () => {
    useStore.setState({
      ...initialStoreState,
      pendingProgramCompletionCelebration: { programId: "x", totalDays: 5, timestamp: Date.now() },
      programCompletionCelebrationDoneAt: {},
    }, true);

    useStore.getState().dismissPendingProgramCompletionCelebration();

    const state = useStore.getState();
    expect(state.pendingProgramCompletionCelebration).toBeNull();
    expect(state.programCompletionCelebrationDoneAt).toEqual({});
  });

  it("dismissPendingProgramCompletionCelebration con pending=null → no-op silencioso", () => {
    useStore.setState({ ...initialStoreState, pendingProgramCompletionCelebration: null }, true);
    expect(() => useStore.getState().dismissPendingProgramCompletionCelebration()).not.toThrow();
    expect(useStore.getState().pendingProgramCompletionCelebration).toBeNull();
  });

  it("Independencia con Premium-Fix3 cohort celebration state", () => {
    useStore.setState({
      ...initialStoreState,
      pendingCelebration: { from: "cold-start", to: "learning", totalSessions: 5, timestamp: 1 },
      cohortCelebrationDoneAt: { learning: 100 },
    }, true);

    // dismiss program completion celebration NO toca cohort celebration
    useStore.getState().dismissPendingProgramCompletionCelebration();
    const state = useStore.getState();
    expect(state.pendingCelebration).toBeTruthy(); // intacto
    expect(state.cohortCelebrationDoneAt.learning).toBe(100); // intacto
  });
});
