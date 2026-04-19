import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useThemeDark } from "./useThemeDark";

beforeEach(() => vi.useFakeTimers());
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

function setHour(h) {
  const d = new Date(2026, 0, 15, h, 0, 0);
  vi.setSystemTime(d);
}

describe("useThemeDark", () => {
  it("no emite dark hasta que ready=true", () => {
    setHour(22);
    const { result } = renderHook(() => useThemeDark({ ready: false, mode: "auto" }));
    expect(result.current).toBe(false);
  });

  it("mode=dark fuerza dark independientemente de la hora", () => {
    setHour(12);
    const { result } = renderHook(() => useThemeDark({ ready: true, mode: "dark" }));
    expect(result.current).toBe(true);
  });

  it("mode=light fuerza light aunque sea de noche", () => {
    setHour(23);
    const { result } = renderHook(() => useThemeDark({ ready: true, mode: "light" }));
    expect(result.current).toBe(false);
  });

  it("mode=auto: 20:00 en adelante es dark", () => {
    setHour(20);
    const { result } = renderHook(() => useThemeDark({ ready: true, mode: "auto" }));
    expect(result.current).toBe(true);
  });

  it("mode=auto: antes de las 6 es dark", () => {
    setHour(5);
    const { result } = renderHook(() => useThemeDark({ ready: true, mode: "auto" }));
    expect(result.current).toBe(true);
  });

  it("mode=auto: 6:00 hasta 19:59 es light", () => {
    setHour(6);
    const { result } = renderHook(() => useThemeDark({ ready: true, mode: "auto" }));
    expect(result.current).toBe(false);
    setHour(19);
    const { result: r2 } = renderHook(() => useThemeDark({ ready: true, mode: "auto" }));
    expect(r2.current).toBe(false);
  });

  it("re-evalúa al cruzar la frontera de las 20:00 (60s tick)", () => {
    setHour(19);
    const { result } = renderHook(() => useThemeDark({ ready: true, mode: "auto" }));
    expect(result.current).toBe(false);
    // Avanza el reloj del sistema a las 20:00 y dispara el interval
    act(() => {
      setHour(20);
      vi.advanceTimersByTime(60000);
    });
    expect(result.current).toBe(true);
  });

  it("mode sin valor cae en auto", () => {
    setHour(22);
    const { result } = renderHook(() => useThemeDark({ ready: true }));
    expect(result.current).toBe(true);
  });

  it("limpia el interval al desmontar", () => {
    setHour(22);
    const clearSpy = vi.spyOn(global, "clearInterval");
    const { unmount } = renderHook(() => useThemeDark({ ready: true, mode: "auto" }));
    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });
});
