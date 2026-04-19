import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAutoSave } from "./useAutoSave";

describe("useAutoSave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("no hace nada si ready=false", () => {
    const save = vi.fn();
    renderHook(() => useAutoSave(false, save));
    act(() => {
      vi.advanceTimersByTime(60000);
    });
    expect(save).not.toHaveBeenCalled();
  });

  it("llama save cada intervalMs cuando ready=true", () => {
    const save = vi.fn();
    renderHook(() => useAutoSave(true, save, { intervalMs: 1000 }));
    act(() => {
      vi.advanceTimersByTime(3500);
    });
    expect(save).toHaveBeenCalledTimes(3);
  });

  it("salva en beforeunload", () => {
    const save = vi.fn();
    renderHook(() => useAutoSave(true, save));
    window.dispatchEvent(new Event("beforeunload"));
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("salva en pagehide", () => {
    const save = vi.fn();
    renderHook(() => useAutoSave(true, save));
    window.dispatchEvent(new Event("pagehide"));
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("salva cuando la pestaña pasa a hidden (no cuando vuelve a visible)", () => {
    const save = vi.fn();
    renderHook(() => useAutoSave(true, save));
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(save).toHaveBeenCalledTimes(1);
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("remueve listeners al desmontar", () => {
    const save = vi.fn();
    const { unmount } = renderHook(() => useAutoSave(true, save));
    unmount();
    window.dispatchEvent(new Event("beforeunload"));
    window.dispatchEvent(new Event("pagehide"));
    act(() => {
      vi.advanceTimersByTime(60000);
    });
    expect(save).not.toHaveBeenCalled();
  });

  it("usa la última closure si onSave cambia (ref pattern)", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ fn }) => useAutoSave(true, fn, { intervalMs: 1000 }), {
      initialProps: { fn: first },
    });
    rerender({ fn: second });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("no rompe si onSave lanza", () => {
    const save = vi.fn(() => {
      throw new Error("boom");
    });
    renderHook(() => useAutoSave(true, save, { intervalMs: 500 }));
    expect(() => {
      act(() => {
        vi.advanceTimersByTime(1500);
      });
    }).not.toThrow();
    expect(save).toHaveBeenCalledTimes(3);
  });
});
