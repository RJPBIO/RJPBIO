/* ActionCard.test — Phase 6H Premium-Fix4 M-1.
   Cubre el prop nuevo `reason` (engine adaptive recommendation.primary.reason)
   que renderea como caption italic muted bajo el description. Anti-regresión:
   ActionCard sin reason mantiene comportamiento legacy 100%. */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import ActionCard from "./ActionCard";

afterEach(() => cleanup());

describe("ActionCard — Phase 6H Premium-Fix4 M-1 reason caption", () => {
  it("renderea title + description + Iniciar CTA legacy (sin reason)", () => {
    const onStart = vi.fn();
    render(
      <ActionCard
        title="Pulse Shift · 120s"
        description="Energía · 2 min"
        onStart={onStart}
      />
    );
    const card = document.querySelector("[data-v2-action]");
    expect(card).toBeTruthy();
    expect(card.textContent).toMatch(/Pulse Shift/);
    expect(card.textContent).toMatch(/Energía · 2 min/);
    // CTA "Iniciar" presente
    const cta = card.querySelector("button");
    expect(cta).toBeTruthy();
    expect(cta.textContent).toMatch(/Iniciar/);
    fireEvent.click(cta);
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("sin reason → caption [data-v2-action-reason] no renderea", () => {
    render(
      <ActionCard
        title="Test"
        description="desc"
        onStart={() => {}}
      />
    );
    expect(document.querySelector("[data-v2-action-reason]")).toBeNull();
  });

  it("con reason → caption italic muted visible bajo description", () => {
    render(
      <ActionCard
        title="Reinicio Parasimpático · 120s"
        description="Calma · 2 min"
        reason="Tu historial muestra +1.2 puntos con este protocolo"
        onStart={() => {}}
      />
    );
    const reason = document.querySelector("[data-v2-action-reason]");
    expect(reason).toBeTruthy();
    expect(reason.textContent).toMatch(/Tu historial muestra \+1\.2 puntos/);
    expect(reason.style.fontStyle).toBe("italic");
  });

  it("reason vacío string → no renderea (treated as falsy)", () => {
    render(
      <ActionCard
        title="t"
        description="d"
        reason=""
        onStart={() => {}}
      />
    );
    expect(document.querySelector("[data-v2-action-reason]")).toBeNull();
  });

  it("reason null explícito → no renderea", () => {
    render(
      <ActionCard
        title="t"
        description="d"
        reason={null}
        onStart={() => {}}
      />
    );
    expect(document.querySelector("[data-v2-action-reason]")).toBeNull();
  });

  it("reason engine sample real (Readiness elevado): renderea", () => {
    render(
      <ActionCard
        title="Pulse Shift · 90s"
        description="Energía · 2 min"
        reason="Readiness elevado (78): ventana para trabajo cognitivo exigente"
        onStart={() => {}}
      />
    );
    expect(document.querySelector("[data-v2-action-reason]").textContent)
      .toMatch(/Readiness elevado \(78\)/);
  });
});
