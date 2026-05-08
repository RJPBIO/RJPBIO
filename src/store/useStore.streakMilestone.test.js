/* useStore.streakMilestone.test — Phase 6I-2.
   Cubre detectStreakMilestone helper (puro) + completeSession integration
   + markStreakMilestoneShown / dismissPending setter actions. Test file
   separado del baseline para no modificar anti-regression Fix3 + Phase6I-1. */
import { describe, it, expect, beforeEach } from "vitest";
import { useStore, detectStreakMilestone } from "./useStore";

const initialStoreState = useStore.getState();

beforeEach(() => {
  useStore.setState(initialStoreState, true);
});

// ============================================================================
// detectStreakMilestone (función pura)
// ============================================================================
describe("detectStreakMilestone — Phase 6I-2", () => {
  it("prev=6 next=7 cruza milestone 7 → celebration con currentStreak=7", () => {
    const c = detectStreakMilestone(6, 7, [7, 14, 30], {});
    expect(c).toBeTruthy();
    expect(c.milestone).toBe(7);
    expect(c.currentStreak).toBe(7);
    expect(typeof c.timestamp).toBe("number");
  });

  it("prev=13 next=14 cruza 14 → celebration", () => {
    const c = detectStreakMilestone(13, 14, [7, 14, 30], {});
    expect(c).toBeTruthy();
    expect(c.milestone).toBe(14);
  });

  it("prev=29 next=30 cruza 30 → celebration", () => {
    const c = detectStreakMilestone(29, 30, [7, 14, 30], {});
    expect(c).toBeTruthy();
    expect(c.milestone).toBe(30);
  });

  it("prev=7 next=8 (already past 7) → null", () => {
    expect(detectStreakMilestone(7, 8, [7, 14, 30], {})).toBeNull();
  });

  it("prev=14 next=15 → null (already past 14, 30 no crossed)", () => {
    expect(detectStreakMilestone(14, 15, [7, 14, 30], {})).toBeNull();
  });

  it("doneAt[7] truthy → null (dedup persistente)", () => {
    expect(detectStreakMilestone(6, 7, [7, 14, 30], { 7: 999 })).toBeNull();
  });

  it("doneAt[14] truthy + new=14 → null (dedup)", () => {
    expect(detectStreakMilestone(13, 14, [7, 14, 30], { 14: 999 })).toBeNull();
  });

  it("newStreak === prevStreak (segunda sesión del mismo día) → null", () => {
    expect(detectStreakMilestone(7, 7, [7, 14, 30], {})).toBeNull();
  });

  it("newStreak < prevStreak (streak break/reset) → null", () => {
    expect(detectStreakMilestone(15, 1, [7, 14, 30], {})).toBeNull();
    expect(detectStreakMilestone(30, 1, [7, 14, 30], {})).toBeNull();
  });

  it("milestones array empty / null / undefined → fallback [7,14,30]", () => {
    expect(detectStreakMilestone(6, 7, [], {})).toBeTruthy();
    expect(detectStreakMilestone(6, 7, null, {})).toBeTruthy();
    expect(detectStreakMilestone(6, 7, undefined, {})).toBeTruthy();
  });

  it("milestones unsorted → sorted ascending defensive", () => {
    const c = detectStreakMilestone(6, 7, [30, 7, 14], {});
    expect(c.milestone).toBe(7); // first crossed (sorted)
  });

  it("prev=0 next=7 (skip from 0) → celebration 7", () => {
    const c = detectStreakMilestone(0, 7, [7, 14, 30], {});
    expect(c).toBeTruthy();
    expect(c.milestone).toBe(7);
  });

  it("prev=0 next=14 (skip both 7 + 14) → first cross is 7 (sorted)", () => {
    // Edge case: jump from 0 to 14 — the helper picks the FIRST milestone
    // crossed (smallest). Realistic scenario rare but safe behavior: 7 fires
    // first, after dismiss + dedup, future N=14 doesn't re-fire (already done
    // via doneAt[14] would need to be set externally — no, this returns 7).
    const c = detectStreakMilestone(0, 14, [7, 14, 30], {});
    expect(c).toBeTruthy();
    expect(c.milestone).toBe(7);
  });

  it("prev=0 next=14 con doneAt[7] → fires 14 (next uncelebrated milestone)", () => {
    const c = detectStreakMilestone(0, 14, [7, 14, 30], { 7: 999 });
    expect(c).toBeTruthy();
    expect(c.milestone).toBe(14);
  });

  it("custom milestones (futuro Phase 6I+) → respeta config", () => {
    const c = detectStreakMilestone(59, 60, [60, 90, 180], {});
    expect(c).toBeTruthy();
    expect(c.milestone).toBe(60);
  });

  it("non-numeric prevStreak/newStreak → defensive null/0", () => {
    expect(detectStreakMilestone(undefined, 7, [7, 14, 30], {})).toBeTruthy();
    expect(detectStreakMilestone(null, 7, [7, 14, 30], {})).toBeTruthy();
    expect(detectStreakMilestone("invalid", 7, [7, 14, 30], {})).toBeTruthy();
  });

  it("milestones con entries no-numeric → skipped sin crash", () => {
    const c = detectStreakMilestone(6, 7, [7, "bogus", null, 14], {});
    expect(c).toBeTruthy();
    expect(c.milestone).toBe(7);
  });

  it("doneAt undefined / null → fallback {} (no crash)", () => {
    expect(detectStreakMilestone(6, 7, [7, 14, 30], undefined)).toBeTruthy();
    expect(detectStreakMilestone(6, 7, [7, 14, 30], null)).toBeTruthy();
  });
});

// ============================================================================
// completeSession integration — wires detection to store
// ============================================================================
describe("completeSession + streak milestone wiring — Phase 6I-2", () => {
  function buildSessionPayload(opts = {}) {
    const {
      ns = 1,
      nsk = 1,
      nC = 60,
      nR = 50,
      nE = 50,
      eVC = 5,
      newHist = [{ ts: Date.now(), p: "test", c: nC }],
    } = opts;
    return {
      eVC, nC, nR, nE, ns, nsk,
      nw: [0, 0, 0, 0, 0, 0, 1],
      newHist,
      ach: [],
      totalT: 120,
    };
  }

  it("completeSession N=6→7 (streak crosses 7) → pendingStreakMilestoneCelebration set", () => {
    useStore.setState({ ...initialStoreState, streak: 6, history: [] }, true);
    useStore.getState().completeSession(buildSessionPayload({ nsk: 7 }));
    const state = useStore.getState();
    expect(state.pendingStreakMilestoneCelebration).toBeTruthy();
    expect(state.pendingStreakMilestoneCelebration.milestone).toBe(7);
    expect(state.pendingStreakMilestoneCelebration.currentStreak).toBe(7);
    expect(state.streak).toBe(7); // semantic core preserved
  });

  it("completeSession N=13→14 → milestone 14 fires", () => {
    useStore.setState({
      ...initialStoreState,
      streak: 13,
      streakMilestoneDoneAt: { 7: 999 }, // 7 ya celebrado previamente
    }, true);
    useStore.getState().completeSession(buildSessionPayload({ nsk: 14 }));
    const state = useStore.getState();
    expect(state.pendingStreakMilestoneCelebration.milestone).toBe(14);
    // doneAt[7] preservado
    expect(state.streakMilestoneDoneAt[7]).toBe(999);
  });

  it("completeSession N=29→30 → milestone 30 fires", () => {
    useStore.setState({
      ...initialStoreState,
      streak: 29,
      streakMilestoneDoneAt: { 7: 999, 14: 999 },
    }, true);
    useStore.getState().completeSession(buildSessionPayload({ nsk: 30 }));
    expect(useStore.getState().pendingStreakMilestoneCelebration.milestone).toBe(30);
  });

  it("completeSession N=7→8 (already past 7) → NO pending", () => {
    useStore.setState({ ...initialStoreState, streak: 7 }, true);
    useStore.getState().completeSession(buildSessionPayload({ nsk: 8 }));
    expect(useStore.getState().pendingStreakMilestoneCelebration).toBeNull();
  });

  it("completeSession streak=7 segunda sesión mismo día (nsk=7) → NO pending (no increment)", () => {
    useStore.setState({ ...initialStoreState, streak: 7 }, true);
    useStore.getState().completeSession(buildSessionPayload({ nsk: 7 }));
    expect(useStore.getState().pendingStreakMilestoneCelebration).toBeNull();
  });

  it("completeSession streak break (nsk=1 desde streak=15) → NO pending", () => {
    useStore.setState({ ...initialStoreState, streak: 15 }, true);
    useStore.getState().completeSession(buildSessionPayload({ nsk: 1 }));
    expect(useStore.getState().pendingStreakMilestoneCelebration).toBeNull();
  });

  it("completeSession N=6→7 con doneAt[7] ya set → NO re-celebrate (post-break rebuild)", () => {
    useStore.setState({
      ...initialStoreState,
      streak: 6,
      streakMilestoneDoneAt: { 7: 999 },
    }, true);
    useStore.getState().completeSession(buildSessionPayload({ nsk: 7 }));
    expect(useStore.getState().pendingStreakMilestoneCelebration).toBeNull();
  });

  it("Cohort + streak crossings simultáneos → ambas celebrations populadas (atomic set)", () => {
    // user con 4 sessions + streak 6 → completar la 5ª sesión cruza N=5
    // (cohort cold-start→learning) y nsk=7 (milestone 7).
    useStore.setState({
      ...initialStoreState,
      streak: 6,
      history: Array.from({ length: 4 }, (_, i) => ({ ts: Date.now() - i * 1000, c: 60 })),
    }, true);
    const newHist = [
      ...useStore.getState().history,
      { ts: Date.now(), c: 65, p: "test" },
    ];
    useStore.getState().completeSession({
      eVC: 5, nC: 65, nR: 50, nE: 50, ns: 5, nsk: 7,
      nw: [0, 0, 0, 0, 0, 0, 1], newHist, ach: [], totalT: 120,
    });
    const state = useStore.getState();
    // Ambos pending populados (sheets renderean una a la vez vía HomeV2 render)
    expect(state.pendingCelebration).toBeTruthy();
    expect(state.pendingCelebration.to).toBe("learning");
    expect(state.pendingStreakMilestoneCelebration).toBeTruthy();
    expect(state.pendingStreakMilestoneCelebration.milestone).toBe(7);
  });

  it("Anti-regression: completeSession preserva semantic Phase 6E SP-A (streak/totalSessions/coherencia)", () => {
    useStore.setState({
      ...initialStoreState,
      streak: 6,
      totalSessions: 6,
      coherencia: 50,
    }, true);
    useStore.getState().completeSession(buildSessionPayload({
      ns: 7, nsk: 7, nC: 70,
    }));
    const state = useStore.getState();
    // Engine fields preserved
    expect(state.streak).toBe(7);
    expect(state.totalSessions).toBe(7);
    expect(state.coherencia).toBe(70);
    expect(state.bestStreak).toBe(7); // updated from 6 to max(6, 7)
  });
});

// ============================================================================
// markStreakMilestoneShown / dismissPending setter actions
// ============================================================================
describe("streak milestone setter actions — Phase 6I-2", () => {
  it("markStreakMilestoneShown(7) → pending null + doneAt[7] timestamped", () => {
    useStore.setState({
      ...initialStoreState,
      pendingStreakMilestoneCelebration: { milestone: 7, currentStreak: 7, timestamp: 1 },
    }, true);
    useStore.getState().markStreakMilestoneShown(7);
    const state = useStore.getState();
    expect(state.pendingStreakMilestoneCelebration).toBeNull();
    expect(state.streakMilestoneDoneAt[7]).toBeTruthy();
    expect(typeof state.streakMilestoneDoneAt[7]).toBe("number");
  });

  it("markStreakMilestoneShown(30) preserva doneAt[7] + doneAt[14]", () => {
    useStore.setState({
      ...initialStoreState,
      pendingStreakMilestoneCelebration: { milestone: 30, currentStreak: 30, timestamp: 1 },
      streakMilestoneDoneAt: { 7: 100, 14: 200 },
    }, true);
    useStore.getState().markStreakMilestoneShown(30);
    const state = useStore.getState();
    expect(state.streakMilestoneDoneAt[7]).toBe(100);
    expect(state.streakMilestoneDoneAt[14]).toBe(200);
    expect(state.streakMilestoneDoneAt[30]).toBeTruthy();
  });

  it("markStreakMilestoneShown(99) bogus → no-op (whitelist contra config)", () => {
    useStore.setState({
      ...initialStoreState,
      pendingStreakMilestoneCelebration: { milestone: 7 },
    }, true);
    useStore.getState().markStreakMilestoneShown(99);
    useStore.getState().markStreakMilestoneShown(0);
    useStore.getState().markStreakMilestoneShown(-7);
    useStore.getState().markStreakMilestoneShown(null);
    useStore.getState().markStreakMilestoneShown(undefined);
    useStore.getState().markStreakMilestoneShown("7"); // string no number
    expect(useStore.getState().pendingStreakMilestoneCelebration).toBeTruthy(); // intacto
    expect(useStore.getState().streakMilestoneDoneAt).toEqual({}); // no pollution
  });

  it("markStreakMilestoneShown acepta los 3 milestones reales del config (7/14/30)", () => {
    for (const m of [7, 14, 30]) {
      useStore.setState({ ...initialStoreState }, true);
      useStore.getState().markStreakMilestoneShown(m);
      expect(useStore.getState().streakMilestoneDoneAt[m]).toBeTruthy();
    }
  });

  it("dismissPendingStreakMilestoneCelebration → limpia pending sin tocar doneAt", () => {
    useStore.setState({
      ...initialStoreState,
      pendingStreakMilestoneCelebration: { milestone: 7, currentStreak: 7, timestamp: 1 },
      streakMilestoneDoneAt: {},
    }, true);
    useStore.getState().dismissPendingStreakMilestoneCelebration();
    const state = useStore.getState();
    expect(state.pendingStreakMilestoneCelebration).toBeNull();
    expect(state.streakMilestoneDoneAt).toEqual({});
  });

  it("dismissPendingStreakMilestoneCelebration con pending=null → no-op silencioso", () => {
    useStore.setState({ ...initialStoreState, pendingStreakMilestoneCelebration: null }, true);
    expect(() => useStore.getState().dismissPendingStreakMilestoneCelebration()).not.toThrow();
    expect(useStore.getState().pendingStreakMilestoneCelebration).toBeNull();
  });

  it("Independencia con Fix3 cohort + Phase6I-1 program completion celebrations", () => {
    useStore.setState({
      ...initialStoreState,
      pendingCelebration: { to: "learning", from: "cold-start", totalSessions: 5, timestamp: 1 },
      cohortCelebrationDoneAt: { learning: 100 },
      pendingProgramCompletionCelebration: { programId: "burnout-recovery", totalDays: 28, timestamp: 1 },
      programCompletionCelebrationDoneAt: { "burnout-recovery": 200 },
      pendingStreakMilestoneCelebration: { milestone: 7, currentStreak: 7, timestamp: 1 },
      streakMilestoneDoneAt: { 7: 300 },
    }, true);
    // dismiss streak milestone NO toca cohort ni program
    useStore.getState().dismissPendingStreakMilestoneCelebration();
    const state = useStore.getState();
    expect(state.pendingCelebration).toBeTruthy(); // intacto Fix3
    expect(state.cohortCelebrationDoneAt.learning).toBe(100); // intacto Fix3
    expect(state.pendingProgramCompletionCelebration).toBeTruthy(); // intacto Phase6I-1
    expect(state.programCompletionCelebrationDoneAt["burnout-recovery"]).toBe(200); // intacto Phase6I-1
    expect(state.streakMilestoneDoneAt[7]).toBe(300); // doneAt preserved
  });
});
