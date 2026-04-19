import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useInstallPrompt } from "./useInstallPrompt";

function fireBip() {
  const ev = new Event("beforeinstallprompt");
  ev.prompt = vi.fn(async () => {});
  Object.defineProperty(ev, "userChoice", {
    value: Promise.resolve({ outcome: "accepted" }),
    configurable: true,
  });
  window.dispatchEvent(ev);
  return ev;
}

describe("useInstallPrompt", () => {
  beforeEach(() => {
    window.localStorage.clear();
    // forzar que NO estemos en standalone
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
  });
  afterEach(() => {
    window.localStorage.clear();
  });

  it("promptable=false hasta que llega beforeinstallprompt", () => {
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.visible).toBe(false);
    act(() => { fireBip(); });
    expect(result.current.visible).toBe(true);
  });

  it("no muestra si el usuario no está engaged", () => {
    const { result } = renderHook(() => useInstallPrompt({ engaged: false }));
    act(() => { fireBip(); });
    expect(result.current.visible).toBe(false);
  });

  it("install() llama prompt + userChoice, marca dismissal si dismissed", async () => {
    const { result } = renderHook(() => useInstallPrompt());
    let ev;
    act(() => { ev = fireBip(); });
    Object.defineProperty(ev, "userChoice", {
      value: Promise.resolve({ outcome: "dismissed" }),
      configurable: true,
    });
    await act(async () => {
      const r = await result.current.install();
      expect(r.outcome).toBe("dismissed");
    });
    expect(result.current.visible).toBe(false);
    expect(window.localStorage.getItem("bio-install-dismissed-at")).toBeTruthy();
  });

  it("dismiss() persiste y oculta", () => {
    const { result } = renderHook(() => useInstallPrompt());
    act(() => { fireBip(); });
    act(() => { result.current.dismiss(); });
    expect(result.current.visible).toBe(false);
    expect(window.localStorage.getItem("bio-install-dismissed-at")).toBeTruthy();
  });

  it("si hay dismissal reciente, el nuevo prompt se suprime hasta cooldown", () => {
    window.localStorage.setItem("bio-install-dismissed-at", String(Date.now()));
    const { result } = renderHook(() => useInstallPrompt());
    act(() => { fireBip(); });
    expect(result.current.visible).toBe(false);
  });

  it("appinstalled marca installed=true", () => {
    const { result } = renderHook(() => useInstallPrompt());
    act(() => { fireBip(); });
    expect(result.current.visible).toBe(true);
    act(() => { window.dispatchEvent(new Event("appinstalled")); });
    expect(result.current.installed).toBe(true);
    expect(result.current.visible).toBe(false);
  });

  it("standalone (PWA ya instalada) evita mostrar siempre", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    const { result } = renderHook(() => useInstallPrompt());
    act(() => { fireBip(); });
    expect(result.current.installed).toBe(true);
    expect(result.current.visible).toBe(false);
  });
});
