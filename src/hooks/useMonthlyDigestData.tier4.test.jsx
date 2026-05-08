/* useMonthlyDigestData.tier4.test — Phase Polish-Tier-4 Capa 2.
   Cubre el avgDimensions del digest (extension Tier-4 sobre el aggregator
   Tier-3). Anti-regression: tests existing del aggregator viven en
   useMonthlyDigestData.test.jsx — éste suite es additive sobre la
   nueva field avgDimensions. */
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";

afterEach(() => {
  vi.restoreAllMocks();
  vi.doUnmock("@/store/useStore");
  vi.resetModules();
});

const importHook = async () => (await import("./useMonthlyDigestData")).default;
const mockStore = (state) => {
  vi.doMock("@/store/useStore", () => ({ useStore: (selector) => selector(state) }));
};

const NOW = 1_700_000_000_000;
beforeEach(() => {
  vi.spyOn(Date, "now").mockReturnValue(NOW);
});

const DAY = 86_400_000;

describe("useMonthlyDigestData — Tier-4 avgDimensions", () => {
  it("< 5 entries con dimensions populated → avgDimensions: null (insufficient sample)", async () => {
    vi.resetModules();
    const hist = [];
    for (let i = 0; i < 4; i++) {
      hist.push({
        ts: NOW - (i + 1) * DAY,
        p: "X",
        bioQ: 60, c: 65, dur: 100,
        dimensions: { foco: 70, calma: 60, energia: 65 },
      });
    }
    mockStore({ history: hist, moodLog: [], achievements: [] });
    const hook = await importHook();
    const { result } = renderHook(() => hook(0));
    expect(result.current.sessionsCount).toBe(4);
    expect(result.current.avgDimensions).toBeNull();
  });

  it(">= 5 entries con dimensions populated → avgDimensions calculado correcto", async () => {
    vi.resetModules();
    const hist = [];
    // 5 entries con dimensions: foco 60-80 (avg 70), calma 50-70 (avg 60), energia 70-90 (avg 80)
    for (let i = 0; i < 5; i++) {
      hist.push({
        ts: NOW - (i + 1) * DAY,
        p: "X",
        bioQ: 60, c: 65, dur: 100,
        dimensions: { foco: 60 + i * 5, calma: 50 + i * 5, energia: 70 + i * 5 },
      });
    }
    mockStore({ history: hist, moodLog: [], achievements: [] });
    const hook = await importHook();
    const { result } = renderHook(() => hook(0));
    expect(result.current.avgDimensions).toEqual({ foco: 70, calma: 60, energia: 80 });
  });

  it("entries mixtos (algunos pre-Tier-4 sin dimensions) → avg solo sobre válidos", async () => {
    vi.resetModules();
    const hist = [];
    // 3 sin dimensions
    for (let i = 0; i < 3; i++) {
      hist.push({ ts: NOW - (i + 1) * DAY, p: "X", bioQ: 60, c: 65, dur: 100 });
    }
    // 5 con dimensions
    for (let i = 0; i < 5; i++) {
      hist.push({
        ts: NOW - (i + 4) * DAY,
        p: "X",
        bioQ: 60, c: 65, dur: 100,
        dimensions: { foco: 70, calma: 60, energia: 80 },
      });
    }
    mockStore({ history: hist, moodLog: [], achievements: [] });
    const hook = await importHook();
    const { result } = renderHook(() => hook(0));
    expect(result.current.sessionsCount).toBe(8);
    expect(result.current.avgDimensions).toEqual({ foco: 70, calma: 60, energia: 80 });
  });

  it("entries con dimensions:null (post-v18 pre-Tier-4 backfill) → no participan", async () => {
    vi.resetModules();
    const hist = [];
    for (let i = 0; i < 5; i++) {
      hist.push({
        ts: NOW - (i + 1) * DAY,
        p: "X", bioQ: 60, c: 65, dur: 100,
        dimensions: null,
      });
    }
    mockStore({ history: hist, moodLog: [], achievements: [] });
    const hook = await importHook();
    const { result } = renderHook(() => hook(0));
    expect(result.current.avgDimensions).toBeNull();
  });

  it("entries con dimensions partial (foco numérico, calma string) → no participan", async () => {
    vi.resetModules();
    const hist = [];
    for (let i = 0; i < 5; i++) {
      hist.push({
        ts: NOW - (i + 1) * DAY,
        p: "X", bioQ: 60, c: 65, dur: 100,
        dimensions: { foco: 70, calma: "bad", energia: 80 },
      });
    }
    mockStore({ history: hist, moodLog: [], achievements: [] });
    const hook = await importHook();
    const { result } = renderHook(() => hook(0));
    expect(result.current.avgDimensions).toBeNull();
  });

  it("avgDimensions outside the month NO participan (window respeta)", async () => {
    vi.resetModules();
    const hist = [];
    for (let i = 0; i < 5; i++) {
      // 50+ días atrás → fuera del window por default offset 0
      hist.push({
        ts: NOW - (50 + i) * DAY,
        p: "X", bioQ: 60, c: 65, dur: 100,
        dimensions: { foco: 70, calma: 60, energia: 80 },
      });
    }
    // 1 entrada dentro del window pero sin dimensions
    hist.push({ ts: NOW - 1 * DAY, p: "X", bioQ: 60, c: 65, dur: 100 });
    mockStore({ history: hist, moodLog: [], achievements: [] });
    const hook = await importHook();
    const { result } = renderHook(() => hook(0));
    expect(result.current.sessionsCount).toBe(1);
    expect(result.current.avgDimensions).toBeNull();
  });
});
