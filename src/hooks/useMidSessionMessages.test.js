import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMidSessionMessages } from "./useMidSessionMessages";

describe("useMidSessionMessages", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("no hace nada fuera de running", () => {
    const setMidMsg = vi.fn();
    const setShowMid = vi.fn();
    renderHook(() =>
      useMidSessionMessages({ timerStatus: "idle", secondsRemaining: 60, setMidMsg, setShowMid })
    );
    expect(setMidMsg).not.toHaveBeenCalled();
    expect(setShowMid).not.toHaveBeenCalled();
  });

  it("no hace nada en segundos que no son trigger", () => {
    const setMidMsg = vi.fn();
    const setShowMid = vi.fn();
    renderHook(() =>
      useMidSessionMessages({ timerStatus: "running", secondsRemaining: 45, setMidMsg, setShowMid })
    );
    expect(setMidMsg).not.toHaveBeenCalled();
    expect(setShowMid).not.toHaveBeenCalled();
  });

  it("en sec=60 muestra mensaje y lo oculta a los 3500ms", () => {
    const setMidMsg = vi.fn();
    const setShowMid = vi.fn();
    renderHook(() =>
      useMidSessionMessages({ timerStatus: "running", secondsRemaining: 60, setMidMsg, setShowMid })
    );
    expect(setMidMsg).toHaveBeenCalledTimes(1);
    expect(setShowMid).toHaveBeenLastCalledWith(true);
    act(() => { vi.advanceTimersByTime(3500); });
    expect(setShowMid).toHaveBeenLastCalledWith(false);
  });

  it("en sec=30 muestra el mensaje fijo por 3000ms", () => {
    const setMidMsg = vi.fn();
    const setShowMid = vi.fn();
    renderHook(() =>
      useMidSessionMessages({ timerStatus: "running", secondsRemaining: 30, setMidMsg, setShowMid })
    );
    expect(setMidMsg).toHaveBeenCalledWith("Últimos 30. Cierra con todo.");
    act(() => { vi.advanceTimersByTime(3000); });
    expect(setShowMid).toHaveBeenLastCalledWith(false);
  });

  it("limpia el timeout al desmontar (no llama setShowMid(false) tarde)", () => {
    const setMidMsg = vi.fn();
    const setShowMid = vi.fn();
    const { unmount } = renderHook(() =>
      useMidSessionMessages({ timerStatus: "running", secondsRemaining: 60, setMidMsg, setShowMid })
    );
    setShowMid.mockClear();
    unmount();
    act(() => { vi.advanceTimersByTime(5000); });
    expect(setShowMid).not.toHaveBeenCalled();
  });
});
