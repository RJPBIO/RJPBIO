/* useStore.celebration.test — Phase 6H Premium-Fix3.
   Cubre detectCohortCelebration helper (puro) + completeSession integration
   + markCelebrationShown / dismissPendingCelebration setter actions. */
import { describe, it, expect, beforeEach } from "vitest";
import { useStore, detectCohortCelebration } from "./useStore";

const initialStoreState = useStore.getState();

beforeEach(() => {
  useStore.setState(initialStoreState, true);
});

// ============================================================================
// detectCohortCelebration (función pura)
// ============================================================================
describe("detectCohortCelebration — Phase 6H Premium-Fix3", () => {
  it("prev=4 next=5 (cold-start→learning) → celebration learning", () => {
    const c = detectCohortCelebration(4, 5, {});
    expect(c).toBeTruthy();
    expect(c.from).toBe("cold-start");
    expect(c.to).toBe("learning");
    expect(c.totalSessions).toBe(5);
    expect(typeof c.timestamp).toBe("number");
  });

  it("prev=13 next=14 (learning→personalized) → celebration personalized", () => {
    const c = detectCohortCelebration(13, 14, {});
    expect(c).toBeTruthy();
    expect(c.from).toBe("learning");
    expect(c.to).toBe("personalized");
    expect(c.totalSessions).toBe(14);
  });

  it("prev=5 next=6 (mismo cohort learning) → null", () => {
    expect(detectCohortCelebration(5, 6, {})).toBeNull();
  });

  it("prev=14 next=15 (mismo cohort personalized) → null", () => {
    expect(detectCohortCelebration(14, 15, {})).toBeNull();
  });

  it("prev=0 next=1 (mismo cold-start) → null", () => {
    expect(detectCohortCelebration(0, 1, {})).toBeNull();
  });

  it("prev=4 next=5 con doneAt.learning ya set → null (dedup)", () => {
    expect(detectCohortCelebration(4, 5, { learning: 1234 })).toBeNull();
  });

  it("prev=13 next=14 con doneAt.personalized ya set → null (dedup)", () => {
    expect(detectCohortCelebration(13, 14, { personalized: 1234 })).toBeNull();
  });

  it("prev=4 next=14 (skip learning, salta a personalized) → celebration personalized", () => {
    // Edge case: bulk import o test fixture brinca threshold intermedio
    const c = detectCohortCelebration(4, 14, {});
    expect(c).toBeTruthy();
    expect(c.to).toBe("personalized");
    expect(c.from).toBe("cold-start");
  });

  it("doneAt undefined / null → fallback {} (no crash)", () => {
    expect(detectCohortCelebration(4, 5, undefined)).toBeTruthy();
    expect(detectCohortCelebration(4, 5, null)).toBeTruthy();
  });

  it("prev > next (history shrunk, edge defensivo) → null", () => {
    expect(detectCohortCelebration(20, 14, {})).toBeNull();
  });
});

// ============================================================================
// completeSession integration — cohort cross detection wires to store
// ============================================================================
describe("completeSession cohort celebration wiring — Phase 6H Premium-Fix3", () => {
  it("4→5 sesiones → pendingCelebration set with from=cold-start to=learning", () => {
    useStore.setState({
      ...initialStoreState,
      history: Array.from({ length: 4 }, (_, i) => ({ ts: Date.now() - i * 1000, c: 60 })),
    }, true);

    const newHist = [
      ...useStore.getState().history,
      { ts: Date.now(), c: 65, p: "test" },
    ];
    useStore.getState().completeSession({
      eVC: 5, nC: 65, nR: 50, nE: 50, ns: 5, nsk: 1, nw: [0, 0, 0, 0, 0, 0, 1],
      newHist, ach: [], totalT: 120,
    });

    const state = useStore.getState();
    expect(state.pendingCelebration).toBeTruthy();
    expect(state.pendingCelebration.from).toBe("cold-start");
    expect(state.pendingCelebration.to).toBe("learning");
    expect(state.pendingCelebration.totalSessions).toBe(5);
  });

  it("13→14 sesiones → pendingCelebration set with to=personalized", () => {
    useStore.setState({
      ...initialStoreState,
      history: Array.from({ length: 13 }, (_, i) => ({ ts: Date.now() - i * 1000, c: 60 })),
      // Already done learning previously
      cohortCelebrationDoneAt: { learning: Date.now() - 86400000 },
    }, true);

    const newHist = [
      ...useStore.getState().history,
      { ts: Date.now(), c: 70, p: "test" },
    ];
    useStore.getState().completeSession({
      eVC: 5, nC: 70, nR: 60, nE: 65, ns: 14, nsk: 14, nw: [0, 0, 0, 0, 0, 0, 14],
      newHist, ach: [], totalT: 120,
    });

    const state = useStore.getState();
    expect(state.pendingCelebration).toBeTruthy();
    expect(state.pendingCelebration.to).toBe("personalized");
    expect(state.pendingCelebration.totalSessions).toBe(14);
    // Learning doneAt preservado
    expect(state.cohortCelebrationDoneAt.learning).toBeTruthy();
  });

  it("5→6 sesiones (already in learning) → NO pendingCelebration", () => {
    useStore.setState({
      ...initialStoreState,
      history: Array.from({ length: 5 }, (_, i) => ({ ts: Date.now() - i * 1000, c: 60 })),
    }, true);

    const newHist = [
      ...useStore.getState().history,
      { ts: Date.now(), c: 65, p: "test" },
    ];
    useStore.getState().completeSession({
      eVC: 5, nC: 65, nR: 50, nE: 50, ns: 6, nsk: 6, nw: [0, 0, 0, 0, 0, 0, 6],
      newHist, ach: [], totalT: 120,
    });

    expect(useStore.getState().pendingCelebration).toBeNull();
  });

  it("4→5 con doneAt.learning ya set (replay no-op) → NO pendingCelebration", () => {
    useStore.setState({
      ...initialStoreState,
      history: Array.from({ length: 4 }, (_, i) => ({ ts: Date.now() - i * 1000, c: 60 })),
      cohortCelebrationDoneAt: { learning: Date.now() - 86400000 },
    }, true);

    const newHist = [
      ...useStore.getState().history,
      { ts: Date.now(), c: 65, p: "test" },
    ];
    useStore.getState().completeSession({
      eVC: 5, nC: 65, nR: 50, nE: 50, ns: 5, nsk: 5, nw: [0, 0, 0, 0, 0, 0, 5],
      newHist, ach: [], totalT: 120,
    });

    expect(useStore.getState().pendingCelebration).toBeNull();
  });

  it("0→1 (fresh) → NO pendingCelebration (sigue en cold-start)", () => {
    useStore.setState({ ...initialStoreState, history: [] }, true);

    useStore.getState().completeSession({
      eVC: 5, nC: 60, nR: 50, nE: 50, ns: 1, nsk: 1, nw: [0, 0, 0, 0, 0, 0, 1],
      newHist: [{ ts: Date.now(), c: 60, p: "test" }],
      ach: [], totalT: 120,
    });

    expect(useStore.getState().pendingCelebration).toBeNull();
  });
});

// ============================================================================
// markCelebrationShown / dismissPendingCelebration setter actions
// ============================================================================
describe("celebration setter actions — Phase 6H Premium-Fix3", () => {
  it("markCelebrationShown('learning') → pendingCelebration null + doneAt.learning timestamped", () => {
    useStore.setState({
      ...initialStoreState,
      pendingCelebration: { from: "cold-start", to: "learning", totalSessions: 5, timestamp: 1234 },
    }, true);

    useStore.getState().markCelebrationShown("learning");

    const state = useStore.getState();
    expect(state.pendingCelebration).toBeNull();
    expect(state.cohortCelebrationDoneAt.learning).toBeTruthy();
    expect(typeof state.cohortCelebrationDoneAt.learning).toBe("number");
  });

  it("markCelebrationShown('personalized') preserva doneAt.learning si existía", () => {
    useStore.setState({
      ...initialStoreState,
      pendingCelebration: { from: "learning", to: "personalized", totalSessions: 14, timestamp: 1234 },
      cohortCelebrationDoneAt: { learning: 9999 },
    }, true);

    useStore.getState().markCelebrationShown("personalized");

    const state = useStore.getState();
    expect(state.cohortCelebrationDoneAt.learning).toBe(9999);
    expect(state.cohortCelebrationDoneAt.personalized).toBeTruthy();
  });

  it("markCelebrationShown con cohort inválido → no-op", () => {
    useStore.setState({
      ...initialStoreState,
      pendingCelebration: { to: "learning" },
    }, true);

    useStore.getState().markCelebrationShown("bogus");
    useStore.getState().markCelebrationShown(null);
    useStore.getState().markCelebrationShown(undefined);

    // pendingCelebration intacto
    expect(useStore.getState().pendingCelebration).toBeTruthy();
  });

  it("dismissPendingCelebration → limpia pending sin tocar doneAt", () => {
    useStore.setState({
      ...initialStoreState,
      pendingCelebration: { from: "cold-start", to: "learning", totalSessions: 5, timestamp: 1234 },
      cohortCelebrationDoneAt: {},
    }, true);

    useStore.getState().dismissPendingCelebration();

    const state = useStore.getState();
    expect(state.pendingCelebration).toBeNull();
    expect(state.cohortCelebrationDoneAt).toEqual({});
  });

  it("dismissPendingCelebration con pending=null ya → no-op silencioso", () => {
    useStore.setState({ ...initialStoreState, pendingCelebration: null }, true);
    expect(() => useStore.getState().dismissPendingCelebration()).not.toThrow();
    expect(useStore.getState().pendingCelebration).toBeNull();
  });
});
