/* CohortCelebrationSheet.test — Phase 6H Premium-Fix3.
   Cubre 3 estados (null/learning/personalized) + interaction (CTA primary,
   dismiss, backdrop, ESC, auto-dismiss) + reduced-motion path. */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, fireEvent, cleanup, act } from "@testing-library/react";
import CohortCelebrationSheet from "./CohortCelebrationSheet";

// JSDOM no implementa matchMedia por default — useReducedMotion lo necesita.
// Set up controllable mock antes de cada test.
function mockMatchMedia(reduce = false) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: query === "(prefers-reduced-motion: reduce)" ? reduce : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    })),
  });
}

beforeEach(() => {
  mockMatchMedia(false);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe("CohortCelebrationSheet — null / no-render", () => {
  it("celebration null → no renderea (return null)", () => {
    const { container } = render(<CohortCelebrationSheet celebration={null} />);
    expect(container.querySelector('[data-testid="cohort-celebration-sheet"]')).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it("celebration sin .to válido → no renderea", () => {
    const { container } = render(
      <CohortCelebrationSheet celebration={{ from: "cold-start", to: "bogus" }} />
    );
    expect(container.querySelector('[data-testid="cohort-celebration-sheet"]')).toBeNull();
  });
});

describe("CohortCelebrationSheet — learning copy", () => {
  const celebration = {
    from: "cold-start",
    to: "learning",
    totalSessions: 5,
    timestamp: Date.now(),
  };

  it("renderea sheet con eyebrow + title + subtitle + stat label específicos de learning", () => {
    render(<CohortCelebrationSheet celebration={celebration} onDismiss={() => {}} />);
    const sheet = document.querySelector('[data-testid="cohort-celebration-sheet"]');
    expect(sheet).toBeTruthy();
    expect(sheet.getAttribute("data-cohort")).toBe("learning");
    expect(sheet.getAttribute("role")).toBe("dialog");
    expect(sheet.getAttribute("aria-modal")).toBe("true");
    const html = document.body.innerHTML;
    expect(html).toMatch(/TRAYECTORIA EN APRENDIZAJE/);
    expect(html).toMatch(/trayectoria personalizada está aprendiendo/i);
    expect(html).toMatch(/SESIONES · BASELINE/);
    expect(html).toMatch(/Ver mi lectura/);
    expect(html).toMatch(/Continuar/);
  });

  it("count-up animation 0→5 (target=5 para learning)", () => {
    render(<CohortCelebrationSheet celebration={celebration} onDismiss={() => {}} />);
    // Antes de avanzar timers, count debería ser 0 (initial)
    const count0 = document.querySelector('[data-testid="cohort-celebration-count"]');
    expect(count0.textContent).toBe("0");
    // Tras 200ms (STAGE_COUNT_DELAY) + 650ms (animation), count = 5
    act(() => { vi.advanceTimersByTime(900); });
    const countFinal = document.querySelector('[data-testid="cohort-celebration-count"]');
    expect(countFinal.textContent).toBe("5");
  });
});

describe("CohortCelebrationSheet — personalized copy", () => {
  const celebration = {
    from: "learning",
    to: "personalized",
    totalSessions: 14,
    timestamp: Date.now(),
  };

  it("renderea sheet con copy específico de personalized + count-up to 14", () => {
    render(<CohortCelebrationSheet celebration={celebration} onDismiss={() => {}} />);
    expect(document.querySelector('[data-cohort="personalized"]')).toBeTruthy();
    const html = document.body.innerHTML;
    expect(html).toMatch(/TRAYECTORIA PERSONALIZADA/);
    expect(html).toMatch(/trayectoria personalizada se activó/i);
    expect(html).toMatch(/Ver mi sistema/);
    act(() => { vi.advanceTimersByTime(900); });
    expect(document.querySelector('[data-testid="cohort-celebration-count"]').textContent).toBe("14");
  });
});

describe("CohortCelebrationSheet — interactions", () => {
  const celebration = {
    from: "cold-start",
    to: "learning",
    totalSessions: 5,
    timestamp: Date.now(),
  };

  it("primary CTA invoca onPrimaryAction(cohort) + onDismiss", () => {
    const onPrimaryAction = vi.fn();
    const onDismiss = vi.fn();
    render(
      <CohortCelebrationSheet
        celebration={celebration}
        onPrimaryAction={onPrimaryAction}
        onDismiss={onDismiss}
      />
    );
    // Avanzar timers para que CTAs estén ya visibles + interactables
    act(() => { vi.advanceTimersByTime(500); });
    fireEvent.click(document.querySelector('[data-testid="cohort-celebration-primary"]'));
    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
    expect(onPrimaryAction).toHaveBeenCalledWith("learning");
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("secondary CTA dismiss invoca onDismiss SIN onPrimaryAction", () => {
    const onPrimaryAction = vi.fn();
    const onDismiss = vi.fn();
    render(
      <CohortCelebrationSheet
        celebration={celebration}
        onPrimaryAction={onPrimaryAction}
        onDismiss={onDismiss}
      />
    );
    act(() => { vi.advanceTimersByTime(500); });
    fireEvent.click(document.querySelector('[data-testid="cohort-celebration-dismiss"]'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onPrimaryAction).not.toHaveBeenCalled();
  });

  it("backdrop click invoca onDismiss", () => {
    const onDismiss = vi.fn();
    render(
      <CohortCelebrationSheet celebration={celebration} onDismiss={onDismiss} />
    );
    const backdrop = document.querySelector('[data-testid="cohort-celebration-backdrop"]');
    fireEvent.click(backdrop, { target: backdrop });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("click DENTRO del sheet NO invoca onDismiss (stopPropagation)", () => {
    const onDismiss = vi.fn();
    render(
      <CohortCelebrationSheet celebration={celebration} onDismiss={onDismiss} />
    );
    const sheet = document.querySelector('[data-testid="cohort-celebration-sheet"]');
    fireEvent.click(sheet);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("ESC key invoca onDismiss (via useFocusTrap)", () => {
    const onDismiss = vi.fn();
    render(
      <CohortCelebrationSheet celebration={celebration} onDismiss={onDismiss} />
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("Auto-dismiss tras 8s", () => {
    const onDismiss = vi.fn();
    render(
      <CohortCelebrationSheet celebration={celebration} onDismiss={onDismiss} />
    );
    act(() => { vi.advanceTimersByTime(8001); });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

describe("CohortCelebrationSheet — prefers-reduced-motion", () => {
  it("reduce=true → count-up se setea instant al target (sin animación)", () => {
    mockMatchMedia(true);
    const celebration = {
      from: "cold-start",
      to: "learning",
      totalSessions: 5,
      timestamp: Date.now(),
    };
    render(<CohortCelebrationSheet celebration={celebration} onDismiss={() => {}} />);
    // Sin avanzar timers, count debería ser 5 ya (instant)
    const count = document.querySelector('[data-testid="cohort-celebration-count"]');
    expect(count.textContent).toBe("5");
  });

  it("reduce=true → CTAs visibles instant (sin stagger delay)", () => {
    mockMatchMedia(true);
    const celebration = {
      from: "cold-start",
      to: "learning",
      totalSessions: 5,
      timestamp: Date.now(),
    };
    const onPrimaryAction = vi.fn();
    render(
      <CohortCelebrationSheet
        celebration={celebration}
        onPrimaryAction={onPrimaryAction}
        onDismiss={() => {}}
      />
    );
    // Sin advance timers, primary debe ser interactable
    fireEvent.click(document.querySelector('[data-testid="cohort-celebration-primary"]'));
    expect(onPrimaryAction).toHaveBeenCalled();
  });
});
