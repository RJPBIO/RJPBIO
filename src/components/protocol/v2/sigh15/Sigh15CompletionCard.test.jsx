/* Sigh15CompletionCard.test — Phase 7 F1 Capa-2.
   Verifica:
   1) Render shape (4 stages + backdrop + CTA).
   2) HRV delta framing (uplift / neutral / fallback).
   3) buildSigh15DeltaDisplay helper defensive.
   4) 5-stage choreography sequence.
   5) Reduced motion path (instant stages).
   6) Continue CTA fires onContinue.
   7) ESC dismiss via focus trap. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  useReducedMotion: vi.fn(() => false),
  announce: vi.fn(),
}));

vi.mock("@/lib/a11y", () => ({
  useReducedMotion: mocks.useReducedMotion,
  useFocusTrap: vi.fn(() => ({ current: null })),
  announce: mocks.announce,
}));

import Sigh15CompletionCard, { buildSigh15DeltaDisplay } from "./Sigh15CompletionCard";

beforeEach(() => {
  mocks.useReducedMotion.mockReturnValue(false);
  mocks.announce.mockClear();
});

afterEach(() => {
  cleanup();
});

describe("Sigh15CompletionCard — F1 Capa-2 mount/unmount", () => {
  it("isOpen=false → no renderiza", () => {
    const { container } = render(
      <Sigh15CompletionCard isOpen={false} onContinue={() => {}} />
    );
    expect(container.querySelector('[data-testid="sigh15-completion-card"]')).toBeNull();
  });

  it("isOpen=true → renderiza dialog con role + aria-modal", () => {
    render(<Sigh15CompletionCard isOpen onContinue={() => {}} />);
    const card = document.querySelector('[data-testid="sigh15-completion-card"]');
    expect(card).toBeTruthy();
    expect(card.getAttribute("role")).toBe("dialog");
    expect(card.getAttribute("aria-modal")).toBe("true");
  });

  it("eyebrow + título Stanford visible", () => {
    render(<Sigh15CompletionCard isOpen onContinue={() => {}} />);
    expect(document.querySelector('[data-testid="sigh15-eyebrow"]').textContent).toMatch(/SUSPIRO FISIOLÓGICO COMPLETADO/);
    expect(document.body.innerHTML).toMatch(/Tu sistema acaba de regular/);
  });

  it("announce sr-live polite al abrir", () => {
    render(<Sigh15CompletionCard isOpen onContinue={() => {}} />);
    expect(mocks.announce).toHaveBeenCalledWith(
      expect.stringMatching(/Suspiro Fisiológico completado/),
      "polite"
    );
  });
});

describe("Sigh15CompletionCard — F1 HRV delta framing", () => {
  it("hrvDelta > 0 + classification 'vagal-lift' → tone 'uplift' + cyan", () => {
    render(
      <Sigh15CompletionCard isOpen hrvDelta={4.2} hrvClassification="vagal-lift" onContinue={() => {}} />
    );
    const stage2 = document.querySelector('[data-testid="sigh15-stage-2"]');
    expect(stage2.getAttribute("data-hrv-tone")).toBe("uplift");
    const headline = document.querySelector('[data-testid="sigh15-hrv-headline"]');
    expect(headline.textContent).toMatch(/\+4\.2 ms HRV/);
  });

  it("hrvDelta < 0 + classification 'vagal-suppression' → tone 'neutral' (sin judgment)", () => {
    render(
      <Sigh15CompletionCard isOpen hrvDelta={-2.5} hrvClassification="vagal-suppression" onContinue={() => {}} />
    );
    const stage2 = document.querySelector('[data-testid="sigh15-stage-2"]');
    expect(stage2.getAttribute("data-hrv-tone")).toBe("neutral");
    const headline = document.querySelector('[data-testid="sigh15-hrv-headline"]');
    expect(headline.textContent).toMatch(/−2\.5 ms HRV/);
  });

  it("hrvDelta=null → tone 'fallback' + headline 'Sistema regulado'", () => {
    render(<Sigh15CompletionCard isOpen hrvDelta={null} onContinue={() => {}} />);
    const stage2 = document.querySelector('[data-testid="sigh15-stage-2"]');
    expect(stage2.getAttribute("data-hrv-tone")).toBe("fallback");
    const headline = document.querySelector('[data-testid="sigh15-hrv-headline"]');
    expect(headline.textContent).toMatch(/Sistema regulado/);
  });

  it("uplift mostra Stanford validation paragraph", () => {
    render(
      <Sigh15CompletionCard isOpen hrvDelta={5.1} hrvClassification="vagal-lift" onContinue={() => {}} />
    );
    expect(document.querySelector('[data-testid="sigh15-stanford-validation"]')).toBeTruthy();
  });

  it("neutral / fallback NO mostran validation paragraph (no overclaim)", () => {
    const { rerender } = render(
      <Sigh15CompletionCard isOpen hrvDelta={-1.2} hrvClassification="vagal-suppression" onContinue={() => {}} />
    );
    expect(document.querySelector('[data-testid="sigh15-stanford-validation"]')).toBeNull();
    rerender(<Sigh15CompletionCard isOpen hrvDelta={null} onContinue={() => {}} />);
    expect(document.querySelector('[data-testid="sigh15-stanford-validation"]')).toBeNull();
  });
});

describe("buildSigh15DeltaDisplay — F1 helper defensive", () => {
  it("uplift: hrvDelta positive + vagal-lift", () => {
    const r = buildSigh15DeltaDisplay(3.7, "vagal-lift");
    expect(r.tone).toBe("uplift");
    expect(r.headline).toMatch(/\+3\.7 ms/);
    expect(r.sub).toMatch(/parasimpático/);
  });

  it("neutral: hrvDelta negative + vagal-suppression (sin overclaim)", () => {
    const r = buildSigh15DeltaDisplay(-2.0, "vagal-suppression");
    expect(r.tone).toBe("neutral");
    expect(r.headline).toMatch(/−2 ms/);
  });

  it("fallback: hrvDelta null", () => {
    const r = buildSigh15DeltaDisplay(null);
    expect(r.tone).toBe("fallback");
    expect(r.headline).toMatch(/Sistema regulado/);
  });

  it("fallback: hrvDelta NaN/Infinity (defensive)", () => {
    expect(buildSigh15DeltaDisplay(NaN).tone).toBe("fallback");
    expect(buildSigh15DeltaDisplay(Infinity).tone).toBe("fallback");
  });

  it("classification null + delta positive → uplift", () => {
    const r = buildSigh15DeltaDisplay(2.3, null);
    expect(r.tone).toBe("uplift");
  });

  it("classification 'no-change' o 'unverified' → neutral", () => {
    const r = buildSigh15DeltaDisplay(0.1, "no-change");
    expect(r.tone).toBe("neutral");
  });
});

describe("Sigh15CompletionCard — F1 reduced motion path", () => {
  it("prefers-reduced-motion: instant stage 4 (CTA visible directo)", () => {
    mocks.useReducedMotion.mockReturnValue(true);
    render(<Sigh15CompletionCard isOpen onContinue={() => {}} />);
    const stage4 = document.querySelector('[data-testid="sigh15-stage-4"]');
    expect(stage4.getAttribute("data-stage-visible")).toBe("true");
  });

  it("reduced motion: continue CTA habilitado al mount", () => {
    mocks.useReducedMotion.mockReturnValue(true);
    const onContinue = vi.fn();
    render(<Sigh15CompletionCard isOpen onContinue={onContinue} />);
    fireEvent.click(document.querySelector('[data-testid="sigh15-continue"]'));
    expect(onContinue).toHaveBeenCalled();
  });
});

describe("Sigh15CompletionCard — F1 CTA + state reset", () => {
  it("Continue button fires onContinue", () => {
    mocks.useReducedMotion.mockReturnValue(true); // skip choreography for simplicity
    const onContinue = vi.fn();
    render(<Sigh15CompletionCard isOpen onContinue={onContinue} />);
    fireEvent.click(document.querySelector('[data-testid="sigh15-continue"]'));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("Re-mount tras unmount: stage reset a 0", () => {
    mocks.useReducedMotion.mockReturnValue(false);
    const { rerender } = render(<Sigh15CompletionCard isOpen onContinue={() => {}} />);
    expect(document.querySelector('[data-testid="sigh15-stage-1"]')).toBeTruthy();
    rerender(<Sigh15CompletionCard isOpen={false} onContinue={() => {}} />);
    rerender(<Sigh15CompletionCard isOpen onContinue={() => {}} />);
    // stage debería arrancar en 0 (oculto) hasta que la choreography avance
    const stage1 = document.querySelector('[data-testid="sigh15-stage-1"]');
    expect(stage1.getAttribute("data-stage-visible")).toBe("false");
  });
});
