/* SystemReadingSubCard.test — Phase 6J-2 HIGH-5. */
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import SystemReadingSubCard from "./SystemReadingSubCard";

afterEach(() => cleanup());

describe("SystemReadingSubCard — gating", () => {
  it("sin momentum ni burnout → no renderea", () => {
    const { container } = render(<SystemReadingSubCard />);
    expect(container.firstChild).toBeNull();
  });

  it("momentumDir='neutral' (sin datos suficientes) + burnoutRisk='sin datos' → no renderea", () => {
    const { container } = render(
      <SystemReadingSubCard
        momentum={0}
        momentumDir="neutral"
        burnoutRisk="sin datos"
      />
    );
    expect(container.firstChild).toBeNull();
  });
});

describe("SystemReadingSubCard — momentum chip", () => {
  it("momentumDir='ascendente' + momentum=15 → chip con label 'Ascendente' + '+15'", () => {
    render(
      <SystemReadingSubCard
        momentum={15}
        momentumDir="ascendente"
      />
    );
    const card = document.querySelector('[data-testid="system-reading-subcard"]');
    expect(card).toBeTruthy();
    const chip = document.querySelector('[data-testid="system-reading-subcard-momentum-chip"]');
    expect(chip).toBeTruthy();
    expect(chip.textContent).toMatch(/Momentum/i);
    expect(chip.textContent).toMatch(/Ascendente/);
    expect(chip.textContent).toMatch(/\+15/);
    expect(chip.getAttribute("data-tone")).toBe("cyan");
  });

  it("momentumDir='descendente' → tone='warn'", () => {
    render(
      <SystemReadingSubCard momentum={-20} momentumDir="descendente" />
    );
    const chip = document.querySelector('[data-testid="system-reading-subcard-momentum-chip"]');
    expect(chip.getAttribute("data-tone")).toBe("warn");
    expect(chip.textContent).toMatch(/-20/);
  });

  it("momentumDir='estable' → renderea sin tone warn", () => {
    render(
      <SystemReadingSubCard momentum={0} momentumDir="estable" />
    );
    const chip = document.querySelector('[data-testid="system-reading-subcard-momentum-chip"]');
    expect(chip).toBeTruthy();
    expect(chip.getAttribute("data-tone")).toBe("muted");
    expect(chip.textContent).toMatch(/Estable/);
  });
});

describe("SystemReadingSubCard — burnout chip", () => {
  it("burnoutRisk='alto' → chip con label 'Alto' + tone warn", () => {
    render(<SystemReadingSubCard burnoutRisk="alto" />);
    const chip = document.querySelector('[data-testid="system-reading-subcard-burnout-chip"]');
    expect(chip).toBeTruthy();
    expect(chip.textContent).toMatch(/Burnout/i);
    expect(chip.textContent).toMatch(/Alto/);
    expect(chip.getAttribute("data-tone")).toBe("warn");
  });

  it("burnoutRisk='crítico' → tone warn", () => {
    render(<SystemReadingSubCard burnoutRisk="crítico" />);
    const chip = document.querySelector('[data-testid="system-reading-subcard-burnout-chip"]');
    expect(chip.getAttribute("data-tone")).toBe("warn");
    expect(chip.textContent).toMatch(/Crítico/);
  });

  it("burnoutRisk='bajo' → tone='muted'", () => {
    render(<SystemReadingSubCard burnoutRisk="bajo" />);
    const chip = document.querySelector('[data-testid="system-reading-subcard-burnout-chip"]');
    expect(chip.getAttribute("data-tone")).toBe("muted");
  });

  it("burnoutRisk='sin datos' → no renderea (gate skip)", () => {
    const { container } = render(<SystemReadingSubCard burnoutRisk="sin datos" />);
    expect(container.firstChild).toBeNull();
  });
});

describe("SystemReadingSubCard — both chips together", () => {
  it("momentum + burnout poblados → ambos chips visibles", () => {
    render(
      <SystemReadingSubCard
        momentum={5}
        momentumDir="ascendente"
        burnoutRisk="moderado"
      />
    );
    expect(document.querySelector('[data-testid="system-reading-subcard-momentum-chip"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="system-reading-subcard-burnout-chip"]')).toBeTruthy();
  });
});
