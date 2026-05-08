/* useMonthlyDigestData.test — Phase Polish-Tier-3.
   Cubre aggregator de la rolling-window 30-day. Mock useStore con state
   sintético para verificar shapes + edge cases (empty, partial bioQ, etc). */
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";

afterEach(() => {
  vi.restoreAllMocks();
  vi.doUnmock("@/store/useStore");
  vi.resetModules();
});

const importHook = async () => (await import("./useMonthlyDigestData")).default;

const mockStore = (state) => {
  vi.doMock("@/store/useStore", () => ({
    useStore: (selector) => selector(state),
  }));
};

const NOW = 1_700_000_000_000; // determinístico
beforeEach(() => {
  vi.spyOn(Date, "now").mockReturnValue(NOW);
});

describe("useMonthlyDigestData — Polish-Tier-3", () => {
  it("history vacío → null", async () => {
    vi.resetModules();
    mockStore({ history: [], moodLog: [], achievements: [] });
    const hook = await importHook();
    const { result } = renderHook(() => hook(0));
    expect(result.current).toBeNull();
  });

  it("history null → null", async () => {
    vi.resetModules();
    mockStore({ history: null, moodLog: null, achievements: null });
    const hook = await importHook();
    const { result } = renderHook(() => hook(0));
    expect(result.current).toBeNull();
  });

  it("sesiones todas fuera del window → null", async () => {
    vi.resetModules();
    const oldTs = NOW - 60 * 86_400_000; // 60 días atrás
    mockStore({
      history: [{ ts: oldTs, p: "Reset", bioQ: 60, c: 65, dur: 120 }],
      moodLog: [],
      achievements: [],
    });
    const hook = await importHook();
    const { result } = renderHook(() => hook(0));
    expect(result.current).toBeNull();
  });

  it("sessionsCount agrega correctamente sesiones del último 30d", async () => {
    vi.resetModules();
    const day = 86_400_000;
    mockStore({
      history: [
        { ts: NOW - 1 * day, p: "Reset", bioQ: 60, c: 65, dur: 120 },
        { ts: NOW - 5 * day, p: "Reset", bioQ: 70, c: 70, dur: 180 },
        { ts: NOW - 28 * day, p: "Activación", bioQ: 65, c: 60, dur: 90 },
        { ts: NOW - 35 * day, p: "Foco", bioQ: 50, c: 55, dur: 60 }, // fuera
      ],
      moodLog: [],
      achievements: [],
    });
    const hook = await importHook();
    const { result } = renderHook(() => hook(0));
    expect(result.current.sessionsCount).toBe(3);
  });

  it("topProtocols: top 3 por frequency con desempate por orden", async () => {
    vi.resetModules();
    const day = 86_400_000;
    const hist = [];
    for (let i = 0; i < 5; i++) hist.push({ ts: NOW - i * day, p: "Reset", bioQ: 60, c: 65, dur: 120 });
    for (let i = 0; i < 3; i++) hist.push({ ts: NOW - (10 + i) * day, p: "Foco", bioQ: 60, c: 65, dur: 120 });
    for (let i = 0; i < 2; i++) hist.push({ ts: NOW - (15 + i) * day, p: "Activación", bioQ: 60, c: 65, dur: 120 });
    hist.push({ ts: NOW - 20 * day, p: "Coherencia", bioQ: 60, c: 65, dur: 120 });
    mockStore({ history: hist, moodLog: [], achievements: [] });
    const hook = await importHook();
    const { result } = renderHook(() => hook(0));
    expect(result.current.topProtocols).toEqual([
      ["Reset", 5],
      ["Foco", 3],
      ["Activación", 2],
    ]);
  });

  it("avgBioQ + avgCoherence redondeados", async () => {
    vi.resetModules();
    const day = 86_400_000;
    mockStore({
      history: [
        { ts: NOW - 1 * day, p: "Reset", bioQ: 60, c: 70, dur: 120 },
        { ts: NOW - 2 * day, p: "Reset", bioQ: 80, c: 80, dur: 120 },
        { ts: NOW - 3 * day, p: "Reset", bioQ: 70, c: 60, dur: 120 },
      ],
      moodLog: [],
      achievements: [],
    });
    const hook = await importHook();
    const { result } = renderHook(() => hook(0));
    expect(result.current.avgBioQ).toBe(70);
    expect(result.current.avgCoherence).toBe(70);
  });

  it("entries sin bioQ válido → avgBioQ derivado solo de los válidos", async () => {
    vi.resetModules();
    const day = 86_400_000;
    mockStore({
      history: [
        { ts: NOW - 1 * day, p: "X", bioQ: 50, c: 60, dur: 100 },
        { ts: NOW - 2 * day, p: "X", c: 60, dur: 100 }, // sin bioQ
        { ts: NOW - 3 * day, p: "X", bioQ: 70, c: 60, dur: 100 },
      ],
      moodLog: [],
      achievements: [],
    });
    const hook = await importHook();
    const { result } = renderHook(() => hook(0));
    // (50+70)/2 = 60
    expect(result.current.avgBioQ).toBe(60);
  });

  it("totalDurationSec suma h.dur correctamente", async () => {
    vi.resetModules();
    const day = 86_400_000;
    mockStore({
      history: [
        { ts: NOW - 1 * day, p: "X", bioQ: 50, c: 60, dur: 120 },
        { ts: NOW - 2 * day, p: "X", bioQ: 60, c: 60, dur: 180 },
        { ts: NOW - 3 * day, p: "X", bioQ: 70, c: 60, dur: 90 },
      ],
      moodLog: [],
      achievements: [],
    });
    const hook = await importHook();
    const { result } = renderHook(() => hook(0));
    expect(result.current.totalDurationSec).toBe(390);
  });

  it("avgMood derivado del moodLog filtrado por mes", async () => {
    vi.resetModules();
    const day = 86_400_000;
    mockStore({
      history: [{ ts: NOW - 1 * day, p: "X", bioQ: 50, c: 60, dur: 100 }],
      moodLog: [
        { ts: NOW - 1 * day, mood: 4 },
        { ts: NOW - 5 * day, mood: 3 },
        { ts: NOW - 50 * day, mood: 1 }, // fuera del mes
      ],
      achievements: [],
    });
    const hook = await importHook();
    const { result } = renderHook(() => hook(0));
    // (4+3)/2 = 3.5 redondeado a 1 decimal
    expect(result.current.avgMood).toBe(3.5);
  });

  it("moodLog vacío → avgMood null", async () => {
    vi.resetModules();
    mockStore({
      history: [{ ts: NOW - 1 * 86_400_000, p: "X", bioQ: 50, c: 60, dur: 100 }],
      moodLog: [],
      achievements: [],
    });
    const hook = await importHook();
    const { result } = renderHook(() => hook(0));
    expect(result.current.avgMood).toBeNull();
  });

  it("monthOffset=1 → ventana 31-60 días atrás", async () => {
    vi.resetModules();
    const day = 86_400_000;
    mockStore({
      history: [
        { ts: NOW - 5 * day, p: "X", bioQ: 50, c: 60, dur: 100 },     // últimos 30 → fuera offset 1
        { ts: NOW - 35 * day, p: "Y", bioQ: 60, c: 70, dur: 200 },    // dentro offset 1
        { ts: NOW - 50 * day, p: "Z", bioQ: 70, c: 80, dur: 150 },    // dentro offset 1
      ],
      moodLog: [],
      achievements: [],
    });
    const hook = await importHook();
    const { result } = renderHook(() => hook(1));
    expect(result.current.sessionsCount).toBe(2);
    expect(result.current.topProtocols).toEqual([["Y", 1], ["Z", 1]]);
  });

  it("monthOffset negativo se clampa a 0 (defensive)", async () => {
    vi.resetModules();
    const day = 86_400_000;
    mockStore({
      history: [{ ts: NOW - 1 * day, p: "X", bioQ: 50, c: 60, dur: 100 }],
      moodLog: [],
      achievements: [],
    });
    const hook = await importHook();
    const { result } = renderHook(() => hook(-3));
    expect(result.current.monthOffset).toBe(0);
    expect(result.current.sessionsCount).toBe(1);
  });

  it("achievementsTotal refleja length actual del array", async () => {
    vi.resetModules();
    mockStore({
      history: [{ ts: NOW - 1 * 86_400_000, p: "X", bioQ: 50, c: 60, dur: 100 }],
      moodLog: [],
      achievements: ["streak3", "streak7", "firstSession"],
    });
    const hook = await importHook();
    const { result } = renderHook(() => hook(0));
    expect(result.current.achievementsTotal).toBe(3);
  });
});
