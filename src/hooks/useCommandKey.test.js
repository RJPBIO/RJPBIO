import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCommandKey } from "./useCommandKey";

vi.mock("../lib/uiSound", () => ({
  uiSound: { open: vi.fn(), close: vi.fn() },
}));
import { uiSound } from "../lib/uiSound";

function fireKey(key, opts = {}) {
  const ev = new KeyboardEvent("keydown", { key, ...opts, cancelable: true });
  window.dispatchEvent(ev);
  return ev;
}

describe("useCommandKey", () => {
  beforeEach(() => {
    uiSound.open.mockClear();
    uiSound.close.mockClear();
  });
  afterEach(() => {
    // cleanup happens via unmount
  });

  it("Cmd+K togglea y suena open la primera vez", () => {
    const setShowCmd = vi.fn((updater) => updater(false));
    renderHook(() => useCommandKey(setShowCmd, true));
    const ev = fireKey("k", { metaKey: true });
    expect(ev.defaultPrevented).toBe(true);
    expect(setShowCmd).toHaveBeenCalledTimes(1);
    expect(uiSound.open).toHaveBeenCalledWith(true);
    expect(uiSound.close).not.toHaveBeenCalled();
  });

  it("Ctrl+K también dispara (Windows/Linux)", () => {
    const setShowCmd = vi.fn((updater) => updater(false));
    renderHook(() => useCommandKey(setShowCmd, false));
    fireKey("K", { ctrlKey: true });
    expect(setShowCmd).toHaveBeenCalledTimes(1);
    expect(uiSound.open).toHaveBeenCalledWith(false);
  });

  it("cuando ya estaba abierto, suena close al cerrar", () => {
    const setShowCmd = vi.fn((updater) => updater(true));
    renderHook(() => useCommandKey(setShowCmd, true));
    fireKey("k", { metaKey: true });
    expect(uiSound.close).toHaveBeenCalledWith(true);
    expect(uiSound.open).not.toHaveBeenCalled();
  });

  it("ignora otras teclas", () => {
    const setShowCmd = vi.fn();
    renderHook(() => useCommandKey(setShowCmd, true));
    fireKey("j", { metaKey: true });
    fireKey("k"); // sin modificador
    expect(setShowCmd).not.toHaveBeenCalled();
  });

  it("limpia el listener al desmontar", () => {
    const setShowCmd = vi.fn((u) => u(false));
    const { unmount } = renderHook(() => useCommandKey(setShowCmd, true));
    unmount();
    fireKey("k", { metaKey: true });
    expect(setShowCmd).not.toHaveBeenCalled();
  });
});
