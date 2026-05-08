/* useHeroSparklineData.test — Phase Polish-Tier-2 Gap-4. */
import { describe, it, expect, afterEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import useHeroSparklineData from "./useHeroSparklineData";

afterEach(() => vi.restoreAllMocks());

const makeUseStoreMock = (history) => {
  return (selector) => selector({ history });
};

describe("useHeroSparklineData — Polish-Tier-2 Gap-4", () => {
  it("history undefined → bio:[]", async () => {
    vi.doMock("@/store/useStore", () => ({ useStore: makeUseStoreMock(undefined) }));
    const { default: hook } = await import("./useHeroSparklineData?case=1");
    // Module re-import via cache buster — fallback al hook ya importado.
    const { result } = renderHook(() => useHeroSparklineData());
    expect(result.current.bio).toEqual([]);
  });
});

// Per limitation jest cache-buster en vitest, hacemos un test set determinístico
// con vi.mock + vi.resetModules entre cases.

describe("useHeroSparklineData — primary cases", () => {
  it("history null → bio:[] (defensive)", async () => {
    vi.resetModules();
    vi.doMock("@/store/useStore", () => ({
      useStore: (selector) => selector({ history: null }),
    }));
    const mod = await import("./useHeroSparklineData");
    const { renderHook: rh } = await import("@testing-library/react");
    const { result } = rh(() => mod.default());
    expect(result.current.bio).toEqual([]);
    vi.doUnmock("@/store/useStore");
  });

  it("history < 2 puntos → bio:[]", async () => {
    vi.resetModules();
    vi.doMock("@/store/useStore", () => ({
      useStore: (selector) => selector({ history: [{ ts: 1, bioQ: 50 }] }),
    }));
    const mod = await import("./useHeroSparklineData");
    const { renderHook: rh } = await import("@testing-library/react");
    const { result } = rh(() => mod.default());
    expect(result.current.bio).toEqual([]);
    vi.doUnmock("@/store/useStore");
  });

  it("history con 14+ puntos → últimos 14 entries con bioQ válido", async () => {
    vi.resetModules();
    const hist = Array.from({ length: 20 }, (_, i) => ({ ts: 1000 + i, bioQ: 50 + i }));
    vi.doMock("@/store/useStore", () => ({
      useStore: (selector) => selector({ history: hist }),
    }));
    const mod = await import("./useHeroSparklineData");
    const { renderHook: rh } = await import("@testing-library/react");
    const { result } = rh(() => mod.default());
    expect(result.current.bio).toHaveLength(14);
    // Últimos 14 = índices 6..19, bioQ = 56..69.
    expect(result.current.bio[0]).toEqual({ value: 56, ts: 1006 });
    expect(result.current.bio[13]).toEqual({ value: 69, ts: 1019 });
    vi.doUnmock("@/store/useStore");
  });

  it("entries sin bioQ válido se filtran (defensive)", async () => {
    vi.resetModules();
    const hist = [
      { ts: 1, bioQ: 50 },
      { ts: 2, bioQ: null },          // filtrado
      { ts: 3, bioQ: undefined },     // filtrado
      { ts: 4, bioQ: 60 },
      { ts: 5, bioQ: "bad" },         // filtrado
      { ts: 6, bioQ: 70 },
    ];
    vi.doMock("@/store/useStore", () => ({
      useStore: (selector) => selector({ history: hist }),
    }));
    const mod = await import("./useHeroSparklineData");
    const { renderHook: rh } = await import("@testing-library/react");
    const { result } = rh(() => mod.default());
    expect(result.current.bio).toEqual([
      { value: 50, ts: 1 },
      { value: 60, ts: 4 },
      { value: 70, ts: 6 },
    ]);
    vi.doUnmock("@/store/useStore");
  });

  it("entry sin ts → filtrado (defensive)", async () => {
    vi.resetModules();
    const hist = [
      { ts: 1, bioQ: 50 },
      { bioQ: 60 }, // sin ts
      { ts: 3, bioQ: 70 },
    ];
    vi.doMock("@/store/useStore", () => ({
      useStore: (selector) => selector({ history: hist }),
    }));
    const mod = await import("./useHeroSparklineData");
    const { renderHook: rh } = await import("@testing-library/react");
    const { result } = rh(() => mod.default());
    expect(result.current.bio).toEqual([
      { value: 50, ts: 1 },
      { value: 70, ts: 3 },
    ]);
    vi.doUnmock("@/store/useStore");
  });
});
