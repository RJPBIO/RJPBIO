import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSessionTimer } from "./useSessionTimer";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useSessionTimer", () => {
  it("idle por defecto con segundos iniciales", () => {
    const { result } = renderHook(() => useSessionTimer(120));
    expect(result.current.status).toBe("idle");
    expect(result.current.seconds).toBe(120);
  });

  it("start cuenta hacia 0 y marca done", () => {
    const { result } = renderHook(() => useSessionTimer(3));
    act(() => result.current.start());
    expect(result.current.status).toBe("running");
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.seconds).toBe(0);
    expect(result.current.status).toBe("done");
  });

  it("pause / resume", () => {
    const { result } = renderHook(() => useSessionTimer(10));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(2000));
    act(() => result.current.pause());
    expect(result.current.status).toBe("paused");
    const frozen = result.current.seconds;
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.seconds).toBe(frozen);
    act(() => result.current.resume());
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.seconds).toBe(frozen - 1);
  });

  it("stop resetea", () => {
    const { result } = renderHook(() => useSessionTimer(10));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(4000));
    act(() => result.current.stop());
    expect(result.current.status).toBe("idle");
    expect(result.current.seconds).toBe(10);
  });
});
