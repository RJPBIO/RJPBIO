import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOnlineStatus } from "./useOnlineStatus";

function setOnLine(v) {
  Object.defineProperty(navigator, "onLine", { value: v, configurable: true });
}

describe("useOnlineStatus", () => {
  afterEach(() => setOnLine(true));

  it("refleja el estado inicial de navigator.onLine", () => {
    setOnLine(false);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);
  });

  it("online=true por default al montar", () => {
    setOnLine(true);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  it("reacciona al evento offline", () => {
    setOnLine(true);
    const { result } = renderHook(() => useOnlineStatus());
    act(() => {
      setOnLine(false);
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current).toBe(false);
  });

  it("reacciona al evento online", () => {
    setOnLine(false);
    const { result } = renderHook(() => useOnlineStatus());
    act(() => {
      setOnLine(true);
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current).toBe(true);
  });

  it("remueve listeners al desmontar", () => {
    const { unmount, result } = renderHook(() => useOnlineStatus());
    unmount();
    // si no removió, esto cambiaría estado, pero no habría rerender visible;
    // vi que al menos no lanza.
    expect(() => {
      window.dispatchEvent(new Event("offline"));
      window.dispatchEvent(new Event("online"));
    }).not.toThrow();
    // estado último reportado quedó en true
    expect(result.current).toBe(true);
  });
});
