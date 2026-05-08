/* useDimensionsSparklineData.test — Phase Polish-Tier-4 Capa 2. */
import { describe, it, expect, afterEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";

afterEach(() => {
  vi.restoreAllMocks();
  vi.doUnmock("@/store/useStore");
  vi.resetModules();
});

const importHook = async () => (await import("./useDimensionsSparklineData")).default;
const mockStore = (state) => {
  vi.doMock("@/store/useStore", () => ({ useStore: (selector) => selector(state) }));
};

describe("useDimensionsSparklineData — Polish-Tier-4 Capa-2", () => {
  it("history vacío → empty arrays per dim", async () => {
    vi.resetModules();
    mockStore({ history: [] });
    const hook = await importHook();
    const { result } = renderHook(() => hook());
    expect(result.current).toEqual({ foco: [], calma: [], energia: [] });
  });

  it("history null → empty arrays (defensive)", async () => {
    vi.resetModules();
    mockStore({ history: null });
    const hook = await importHook();
    const { result } = renderHook(() => hook());
    expect(result.current).toEqual({ foco: [], calma: [], energia: [] });
  });

  it("history sin dimensions (entries pre-Tier-4) → empty arrays", async () => {
    vi.resetModules();
    mockStore({ history: [
      { ts: 1, p: "X", c: 50, r: 50, bioQ: 60 },
      { ts: 2, p: "Y", c: 55, r: 55, bioQ: 65 },
    ] });
    const hook = await importHook();
    const { result } = renderHook(() => hook());
    expect(result.current.foco).toEqual([]);
    expect(result.current.calma).toEqual([]);
    expect(result.current.energia).toEqual([]);
  });

  it("entries con dimensions populated → series correctas per dim", async () => {
    vi.resetModules();
    mockStore({ history: [
      { ts: 1, p: "X", dimensions: { foco: 70, calma: 60, energia: 65 } },
      { ts: 2, p: "Y", dimensions: { foco: 72, calma: 62, energia: 68 } },
      { ts: 3, p: "Z", dimensions: { foco: 75, calma: 65, energia: 70 } },
    ] });
    const hook = await importHook();
    const { result } = renderHook(() => hook());
    expect(result.current.foco).toEqual([
      { value: 70, ts: 1 }, { value: 72, ts: 2 }, { value: 75, ts: 3 },
    ]);
    expect(result.current.calma).toHaveLength(3);
    expect(result.current.energia).toHaveLength(3);
  });

  it("entries mixtos (algunos con dimensions, otros sin) → solo válidos extraídos", async () => {
    vi.resetModules();
    mockStore({ history: [
      { ts: 1, p: "A", dimensions: { foco: 70, calma: 60, energia: 65 } },
      { ts: 2, p: "B", dimensions: null }, // pre-Tier-4, no participa
      { ts: 3, p: "C" }, // sin field, no participa
      { ts: 4, p: "D", dimensions: { foco: 80, calma: 70, energia: 75 } },
    ] });
    const hook = await importHook();
    const { result } = renderHook(() => hook());
    expect(result.current.foco).toEqual([
      { value: 70, ts: 1 }, { value: 80, ts: 4 },
    ]);
  });

  it("últimos 14 entries (slice cap)", async () => {
    vi.resetModules();
    const hist = Array.from({ length: 20 }, (_, i) => ({
      ts: 1000 + i,
      p: "X",
      dimensions: { foco: 50 + i, calma: 60, energia: 70 },
    }));
    mockStore({ history: hist });
    const hook = await importHook();
    const { result } = renderHook(() => hook());
    expect(result.current.foco).toHaveLength(14);
    expect(result.current.foco[0].value).toBe(56); // i=6 (20 - 14)
    expect(result.current.foco[13].value).toBe(69); // i=19
  });

  it("dimension partial (foco numérico, calma string) → solo foco capturado para esa entry", async () => {
    vi.resetModules();
    mockStore({ history: [
      { ts: 1, dimensions: { foco: 60, calma: "bad", energia: null } },
      { ts: 2, dimensions: { foco: 65, calma: 55, energia: 60 } },
    ] });
    const hook = await importHook();
    const { result } = renderHook(() => hook());
    expect(result.current.foco).toEqual([{ value: 60, ts: 1 }, { value: 65, ts: 2 }]);
    expect(result.current.calma).toEqual([{ value: 55, ts: 2 }]);
    expect(result.current.energia).toEqual([{ value: 60, ts: 2 }]);
  });
});
