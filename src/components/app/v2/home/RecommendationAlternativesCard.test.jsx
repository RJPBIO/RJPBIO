/* RecommendationAlternativesCard.test — Phase 6I-3.
   Cubre 3 estados (no render / colapsada / expanded), interactions completas
   (toggle, alt tap, aria), reduced-motion path, separator behavior. */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import RecommendationAlternativesCard from "./RecommendationAlternativesCard";

// JSDOM matchMedia mock (useReducedMotion lo requiere).
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
});

afterEach(() => cleanup());

// Engine real shape sample (neural.js:809-816 + 845)
const ENGINE_REAL = {
  primary: {
    protocol: { id: 1, n: "Reinicio Parasimpático", d: 120, int: "calma" },
    score: 80,
    reason: "primary reason",
  },
  alternatives: [
    {
      protocol: { id: 4, n: "Pulse Shift", d: 90, int: "energia" },
      score: 65.2,
      reason: "Ciclo circadiano favorable para activación",
    },
    {
      protocol: { id: 2, n: "Activación Cognitiva", d: 90, int: "enfoque" },
      score: 60.0,
      reason: "Tu historial muestra +0.8 puntos con este protocolo",
    },
  ],
};

describe("RecommendationAlternativesCard — null / no-render", () => {
  it("recommendation null → no renderea", () => {
    const { container } = render(<RecommendationAlternativesCard recommendation={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("recommendation undefined → no renderea", () => {
    const { container } = render(<RecommendationAlternativesCard recommendation={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it("recommendation sin alternatives field → no renderea", () => {
    const { container } = render(
      <RecommendationAlternativesCard recommendation={{ primary: {} }} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("alternatives empty array → no renderea", () => {
    const { container } = render(
      <RecommendationAlternativesCard recommendation={{ alternatives: [] }} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("alternatives all invalid (sin protocol.id) → no renderea", () => {
    const r = { alternatives: [{ score: 50 }, null, { protocol: {} }] };
    const { container } = render(<RecommendationAlternativesCard recommendation={r} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("RecommendationAlternativesCard — render colapsada", () => {
  it("engine real con 2 alternatives → renderea con count en label", () => {
    render(<RecommendationAlternativesCard recommendation={ENGINE_REAL} />);
    const card = document.querySelector('[data-testid="recommendation-alternatives"]');
    expect(card).toBeTruthy();
    expect(card.getAttribute("data-expanded")).toBe("false");
    expect(document.body.innerHTML).toMatch(/Otras opciones \(2\)/);
  });

  it("toggle button tiene aria-expanded=false default + aria-controls", () => {
    render(<RecommendationAlternativesCard recommendation={ENGINE_REAL} />);
    const toggle = document.querySelector('[data-testid="recommendation-alternatives-toggle"]');
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(toggle.getAttribute("aria-controls")).toBe("recommendation-alternatives-content");
  });

  it("content está renderizado en DOM (max-height 0) — accessibility for SR", () => {
    render(<RecommendationAlternativesCard recommendation={ENGINE_REAL} />);
    const content = document.querySelector("[data-v2-alternatives-content]");
    expect(content).toBeTruthy();
    // Alts están en DOM aunque colapsadas (collapse via maxHeight, no display:none)
    expect(document.querySelectorAll("[data-v2-alternative-row]")).toHaveLength(2);
  });
});

describe("RecommendationAlternativesCard — toggle expand/collapse", () => {
  it("tap toggle → expanded=true + aria-expanded=true", () => {
    render(<RecommendationAlternativesCard recommendation={ENGINE_REAL} />);
    const toggle = document.querySelector('[data-testid="recommendation-alternatives-toggle"]');
    fireEvent.click(toggle);
    const card = document.querySelector('[data-testid="recommendation-alternatives"]');
    expect(card.getAttribute("data-expanded")).toBe("true");
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });

  it("tap toggle 2x → expanded=false (colapsa)", () => {
    render(<RecommendationAlternativesCard recommendation={ENGINE_REAL} />);
    const toggle = document.querySelector('[data-testid="recommendation-alternatives-toggle"]');
    fireEvent.click(toggle);
    fireEvent.click(toggle);
    const card = document.querySelector('[data-testid="recommendation-alternatives"]');
    expect(card.getAttribute("data-expanded")).toBe("false");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("custom testid se aplica a card + toggle + content + alts", () => {
    render(<RecommendationAlternativesCard recommendation={ENGINE_REAL} testid="custom-id" />);
    expect(document.querySelector('[data-testid="custom-id"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="custom-id-toggle"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="custom-id-alt-0"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="custom-id-alt-1"]')).toBeTruthy();
  });
});

describe("RecommendationAlternativesCard — alt rows content", () => {
  it("alt 0 muestra protocol name, duration, intent, reason", () => {
    render(<RecommendationAlternativesCard recommendation={ENGINE_REAL} />);
    const alt0 = document.querySelector('[data-testid="recommendation-alternatives-alt-0"]');
    expect(alt0).toBeTruthy();
    expect(alt0.textContent).toMatch(/Pulse Shift/);
    expect(alt0.textContent).toMatch(/90s · 2 min/); // 90s → ceil(90/60)=2 min wait, Math.round(90/60)=2
    expect(alt0.textContent).toMatch(/energia/);
    expect(alt0.textContent).toMatch(/Ciclo circadiano favorable/);
  });

  it("alt 0 tiene data-protocol-id correctamente", () => {
    render(<RecommendationAlternativesCard recommendation={ENGINE_REAL} />);
    const alt0 = document.querySelector('[data-testid="recommendation-alternatives-alt-0"]');
    expect(alt0.getAttribute("data-protocol-id")).toBe("4");
  });

  it("ALTERNATIVA eyebrow visible en cada row", () => {
    render(<RecommendationAlternativesCard recommendation={ENGINE_REAL} />);
    const alts = document.querySelectorAll("[data-v2-alternative-row]");
    expect(alts).toHaveLength(2);
    for (const alt of alts) {
      expect(alt.textContent).toMatch(/Alternativa/i);
    }
  });

  it("Reason caption italic visible cuando engine provee", () => {
    render(<RecommendationAlternativesCard recommendation={ENGINE_REAL} />);
    const reasons = document.querySelectorAll("[data-v2-alternative-reason]");
    expect(reasons).toHaveLength(2);
    expect(reasons[0].textContent).toMatch(/Ciclo circadiano/);
    expect(reasons[1].textContent).toMatch(/historial muestra \+0.8/);
    expect(reasons[0].style.fontStyle).toBe("italic");
  });

  it("alt sin reason → caption italic NO renderea solo para esa alt", () => {
    const r = {
      alternatives: [
        { protocol: { id: 4, n: "Pulse Shift", d: 90, int: "energia" }, score: 70 }, // sin reason
        { protocol: { id: 2, n: "Activación Cognitiva", d: 90, int: "enfoque" }, score: 60, reason: "with reason" },
      ],
    };
    render(<RecommendationAlternativesCard recommendation={r} />);
    const reasons = document.querySelectorAll("[data-v2-alternative-reason]");
    expect(reasons).toHaveLength(1); // solo la 2da tiene reason
    expect(reasons[0].textContent).toMatch(/with reason/);
  });

  it("Separator entre alt rows (showSeparator prop)", () => {
    render(<RecommendationAlternativesCard recommendation={ENGINE_REAL} />);
    const altButtons = document.querySelectorAll("[data-v2-alternative-row] button");
    // Primera alt sin border-top, segunda con border-top.
    // jsdom edge case (Premium-Fix4 A-similar): `border: "none"` inline retorna ""
    // en style.borderTop. Verificamos que la 2da SI tiene border (presente truthy)
    // y la 1a NO (falsy/empty).
    expect(altButtons[0].style.borderTop || "").toBe(""); // no separator
    expect(altButtons[1].style.borderTop).toMatch(/0\.5px solid/); // separator
  });

  it("Touch target ≥44px en toggle + alt rows (Polish-2)", () => {
    render(<RecommendationAlternativesCard recommendation={ENGINE_REAL} />);
    const toggle = document.querySelector('[data-testid="recommendation-alternatives-toggle"]');
    expect(toggle.style.minHeight).toBe("44px");
    const altButtons = document.querySelectorAll("[data-v2-alternative-row] button");
    for (const btn of altButtons) {
      expect(btn.style.minHeight).toBe("44px");
    }
  });
});

describe("RecommendationAlternativesCard — onAction interaction", () => {
  it("tap alt 0 → onAction({action:'start-protocol', protocolId})", () => {
    const onAction = vi.fn();
    render(<RecommendationAlternativesCard recommendation={ENGINE_REAL} onAction={onAction} />);
    fireEvent.click(document.querySelector('[data-testid="recommendation-alternatives-alt-0"]'));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith({ action: "start-protocol", protocolId: 4 });
  });

  it("tap alt 1 → onAction protocolId distinto", () => {
    const onAction = vi.fn();
    render(<RecommendationAlternativesCard recommendation={ENGINE_REAL} onAction={onAction} />);
    fireEvent.click(document.querySelector('[data-testid="recommendation-alternatives-alt-1"]'));
    expect(onAction).toHaveBeenCalledWith({ action: "start-protocol", protocolId: 2 });
  });

  it("onAction null/undefined → no crash al tap", () => {
    render(<RecommendationAlternativesCard recommendation={ENGINE_REAL} />);
    expect(() => {
      fireEvent.click(document.querySelector('[data-testid="recommendation-alternatives-alt-0"]'));
    }).not.toThrow();
  });

  it("toggle NO invoca onAction (solo toggle expand/collapse state)", () => {
    const onAction = vi.fn();
    render(<RecommendationAlternativesCard recommendation={ENGINE_REAL} onAction={onAction} />);
    fireEvent.click(document.querySelector('[data-testid="recommendation-alternatives-toggle"]'));
    expect(onAction).not.toHaveBeenCalled();
  });
});

describe("RecommendationAlternativesCard — prefers-reduced-motion", () => {
  it("reduce=true → max-height transition disabled", () => {
    mockMatchMedia(true);
    render(<RecommendationAlternativesCard recommendation={ENGINE_REAL} />);
    const content = document.querySelector("[data-v2-alternatives-content]");
    expect(content.style.transition).toBe("none");
  });

  it("reduce=false → transition cubic-bezier active", () => {
    mockMatchMedia(false);
    render(<RecommendationAlternativesCard recommendation={ENGINE_REAL} />);
    const content = document.querySelector("[data-v2-alternatives-content]");
    expect(content.style.transition).toMatch(/max-height 320ms/);
  });
});

describe("RecommendationAlternativesCard — legacy/mixed shapes", () => {
  it("legacy alternative shape (id directo) → renderea con protocol info", () => {
    const r = {
      alternatives: [
        { id: 4, n: "Legacy", d: 60, int: "calma" },
      ],
    };
    render(<RecommendationAlternativesCard recommendation={r} />);
    const alt0 = document.querySelector('[data-testid="recommendation-alternatives-alt-0"]');
    expect(alt0).toBeTruthy();
    expect(alt0.textContent).toMatch(/Legacy/);
    expect(alt0.getAttribute("data-protocol-id")).toBe("4");
  });

  it("Solo 1 alt válida + 1 inválida → renderea solo la válida (count=1)", () => {
    const r = {
      alternatives: [
        { protocol: { id: 4, n: "Valid" }, score: 70 },
        { score: 50 }, // invalid
      ],
    };
    render(<RecommendationAlternativesCard recommendation={r} />);
    expect(document.body.innerHTML).toMatch(/Otras opciones \(1\)/);
    expect(document.querySelectorAll("[data-v2-alternative-row]")).toHaveLength(1);
  });
});
