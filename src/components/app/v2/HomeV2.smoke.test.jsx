/* HomeV2.smoke.test — Phase 6D SP6 Bug-26.
   Smoke tests con devOverride. Anti-regression: verificar que
   HomeV2 NO sirve fixtures hardcoded en sus branches principales.
   Tests usan useStore.setState para inyectar state minimal sin
   mockear el módulo entero (más realista). */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import HomeV2 from "./HomeV2";
import { useStore } from "@/store/useStore";

const initialState = useStore.getState();

beforeEach(() => {
  // Reset store a defaults limpios para cada test (sin fixtures).
  useStore.setState(initialState, true);
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-04T08:00:00"));
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe("HomeV2 — smoke Phase 6D SP6", () => {
  it("renderiza ColdStartView cuando devOverride='cold-start'", () => {
    render(<HomeV2 devOverride="cold-start" onNavigate={() => {}} onBellClick={() => {}} />);
    // ColdStartView renderiza saludo + cards. Verificamos que monta sin crash
    // y que NO inyecta strings de fixtures eliminados (ej. "Pulse Shift" estaba
    // hardcoded en SP1 antes del fix Bug-22).
    const html = document.body.innerHTML;
    expect(html).not.toContain("FIXTURE_");
    expect(html).not.toContain("neural-baseline");
    expect(html).not.toContain("Día 4 de 14");
  });

  it("renderiza PersonalizedView cuando devOverride='personalized'", () => {
    render(<HomeV2 devOverride="personalized" onNavigate={() => {}} onBellClick={() => {}} />);
    const html = document.body.innerHTML;
    expect(html).not.toContain("FIXTURE_");
    // Composite mock 62 (applyDevOverride hardcoded para preview).
    expect(html).toMatch(/62/);
  });

  it("renderiza con state vacío real sin crash", () => {
    expect(() => render(<HomeV2 onNavigate={() => {}} onBellClick={() => {}} />)).not.toThrow();
  });

  it("greeting se deriva de hora actual (no fixture)", () => {
    vi.setSystemTime(new Date("2026-05-04T08:00:00"));
    render(<HomeV2 devOverride="personalized" onNavigate={() => {}} onBellClick={() => {}} />);
    const html = document.body.innerHTML;
    // Saludo bucket-aware. Solo verificamos que NO esté el placeholder
    // "Hola User" o similar fixture text.
    expect(html).not.toContain("Hola User");
  });
});
