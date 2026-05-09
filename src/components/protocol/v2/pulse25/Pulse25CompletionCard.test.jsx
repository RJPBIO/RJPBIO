/* Pulse25CompletionCard.test — Phase 7 F2 Capa-2.
   Verifica:
   1) Render shape (4 stages + backdrop + CTA + dual metric blocks).
   2) HRV delta framing (uplift / neutral / fallback).
   3) Coherence framing (optimal ≥0.70 / achieved ≥0.50 / partial ≥0.30 / low <0.30).
   4) buildPulse25HrvDisplay + buildPulse25CoherenceDisplay helpers defensive.
   5) Validation paragraph conditional (uplift OR coherence ≥0.50 only).
   6) Reduced motion path.
   7) Continue CTA. */
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

import Pulse25CompletionCard, {
  buildPulse25HrvDisplay,
  buildPulse25CoherenceDisplay,
} from "./Pulse25CompletionCard";

beforeEach(() => {
  mocks.useReducedMotion.mockReturnValue(false);
  mocks.announce.mockClear();
});

afterEach(() => {
  cleanup();
});

describe("Pulse25CompletionCard — F2 Capa-2 mount/unmount", () => {
  it("isOpen=false → no renderiza", () => {
    const { container } = render(
      <Pulse25CompletionCard isOpen={false} onContinue={() => {}} />
    );
    expect(container.querySelector('[data-testid="pulse25-completion-card"]')).toBeNull();
  });

  it("isOpen=true → renderiza dialog con role + aria-modal", () => {
    render(<Pulse25CompletionCard isOpen onContinue={() => {}} />);
    const card = document.querySelector('[data-testid="pulse25-completion-card"]');
    expect(card).toBeTruthy();
    expect(card.getAttribute("role")).toBe("dialog");
    expect(card.getAttribute("aria-modal")).toBe("true");
  });

  it("eyebrow CARDIAC PULSE MATCH COMPLETADO + título 'Tu sistema sincronizó.'", () => {
    render(<Pulse25CompletionCard isOpen onContinue={() => {}} />);
    expect(document.querySelector('[data-testid="pulse25-eyebrow"]').textContent).toMatch(/CARDIAC PULSE MATCH COMPLETADO/);
    expect(document.body.innerHTML).toMatch(/Tu sistema sincronizó/);
  });

  it("announce sr-live polite al abrir", () => {
    render(<Pulse25CompletionCard isOpen onContinue={() => {}} />);
    expect(mocks.announce).toHaveBeenCalledWith(
      expect.stringMatching(/Cardiac Pulse Match completado/),
      "polite"
    );
  });
});

describe("Pulse25CompletionCard — F2 metric blocks", () => {
  it("hrvDelta + coherenceScore both present → ambos blocks visible", () => {
    render(
      <Pulse25CompletionCard
        isOpen
        hrvDelta={3.5}
        hrvClassification="vagal-lift"
        coherenceScore={0.65}
        onContinue={() => {}}
      />
    );
    expect(document.querySelector('[data-testid="pulse25-hrv-block"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="pulse25-coherence-block"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="pulse25-fallback-block"]')).toBeNull();
  });

  it("Solo hrvDelta presente → hrv block + NO fallback", () => {
    render(
      <Pulse25CompletionCard isOpen hrvDelta={2.1} coherenceScore={null} onContinue={() => {}} />
    );
    expect(document.querySelector('[data-testid="pulse25-hrv-block"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="pulse25-coherence-block"]')).toBeNull();
    expect(document.querySelector('[data-testid="pulse25-fallback-block"]')).toBeNull();
  });

  it("Solo coherenceScore presente → coherence block + NO fallback", () => {
    render(
      <Pulse25CompletionCard isOpen hrvDelta={null} coherenceScore={0.55} onContinue={() => {}} />
    );
    expect(document.querySelector('[data-testid="pulse25-coherence-block"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="pulse25-hrv-block"]')).toBeNull();
    expect(document.querySelector('[data-testid="pulse25-fallback-block"]')).toBeNull();
  });

  it("Ambos null → fallback block visible", () => {
    render(
      <Pulse25CompletionCard isOpen hrvDelta={null} coherenceScore={null} onContinue={() => {}} />
    );
    expect(document.querySelector('[data-testid="pulse25-fallback-block"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="pulse25-hrv-block"]')).toBeNull();
    expect(document.querySelector('[data-testid="pulse25-coherence-block"]')).toBeNull();
  });
});

describe("Pulse25CompletionCard — F2 HRV framing", () => {
  it("hrvDelta > 0 + 'vagal-lift' → tone 'uplift' + cyan", () => {
    render(
      <Pulse25CompletionCard isOpen hrvDelta={4.2} hrvClassification="vagal-lift" onContinue={() => {}} />
    );
    const block = document.querySelector('[data-testid="pulse25-hrv-block"]');
    expect(block.getAttribute("data-hrv-tone")).toBe("uplift");
    expect(document.querySelector('[data-testid="pulse25-hrv-headline"]').textContent).toMatch(/\+4\.2 ms HRV/);
  });

  it("hrvDelta < 0 + 'vagal-suppression' → tone 'neutral' (sin overclaim)", () => {
    render(
      <Pulse25CompletionCard isOpen hrvDelta={-1.8} hrvClassification="vagal-suppression" onContinue={() => {}} />
    );
    const block = document.querySelector('[data-testid="pulse25-hrv-block"]');
    expect(block.getAttribute("data-hrv-tone")).toBe("neutral");
    expect(document.querySelector('[data-testid="pulse25-hrv-headline"]').textContent).toMatch(/−1\.8 ms HRV/);
  });
});

describe("Pulse25CompletionCard — F2 coherence framing per Lehrer-Vaschillo thresholds", () => {
  it("coherenceScore ≥ 0.70 → tone 'optimal' + headline %", () => {
    render(<Pulse25CompletionCard isOpen coherenceScore={0.75} onContinue={() => {}} />);
    const block = document.querySelector('[data-testid="pulse25-coherence-block"]');
    expect(block.getAttribute("data-coh-tone")).toBe("optimal");
    expect(document.querySelector('[data-testid="pulse25-coherence-headline"]').textContent).toMatch(/75% coherencia/);
  });

  it("coherenceScore ≥ 0.50 < 0.70 → tone 'achieved'", () => {
    render(<Pulse25CompletionCard isOpen coherenceScore={0.55} onContinue={() => {}} />);
    const block = document.querySelector('[data-testid="pulse25-coherence-block"]');
    expect(block.getAttribute("data-coh-tone")).toBe("achieved");
  });

  it("coherenceScore ≥ 0.30 < 0.50 → tone 'partial'", () => {
    render(<Pulse25CompletionCard isOpen coherenceScore={0.40} onContinue={() => {}} />);
    const block = document.querySelector('[data-testid="pulse25-coherence-block"]');
    expect(block.getAttribute("data-coh-tone")).toBe("partial");
  });

  it("coherenceScore < 0.30 → tone 'low'", () => {
    render(<Pulse25CompletionCard isOpen coherenceScore={0.15} onContinue={() => {}} />);
    const block = document.querySelector('[data-testid="pulse25-coherence-block"]');
    expect(block.getAttribute("data-coh-tone")).toBe("low");
  });
});

describe("Pulse25CompletionCard — F2 validation paragraph conditional", () => {
  it("coherence ≥ 0.50 OR hrv uplift → validation paragraph visible", () => {
    render(<Pulse25CompletionCard isOpen coherenceScore={0.55} onContinue={() => {}} />);
    expect(document.querySelector('[data-testid="pulse25-research-validation"]')).toBeTruthy();
  });

  it("coherence < 0.50 AND no hrv uplift → NO validation paragraph (no overclaim)", () => {
    render(
      <Pulse25CompletionCard
        isOpen
        coherenceScore={0.30}
        hrvDelta={-1.0}
        hrvClassification="vagal-suppression"
        onContinue={() => {}}
      />
    );
    expect(document.querySelector('[data-testid="pulse25-research-validation"]')).toBeNull();
  });

  it("coherence optimal ≥0.70 → validation menciona 'sostenido'", () => {
    render(<Pulse25CompletionCard isOpen coherenceScore={0.85} onContinue={() => {}} />);
    const v = document.querySelector('[data-testid="pulse25-research-validation"]');
    expect(v.textContent).toMatch(/sostenido/);
  });

  it("hrv uplift sin coherence → validation paragraph visible (uplift path)", () => {
    render(
      <Pulse25CompletionCard isOpen hrvDelta={3.0} hrvClassification="vagal-lift" coherenceScore={null} onContinue={() => {}} />
    );
    expect(document.querySelector('[data-testid="pulse25-research-validation"]')).toBeTruthy();
  });
});

describe("buildPulse25HrvDisplay helper — F2", () => {
  it("uplift", () => {
    const r = buildPulse25HrvDisplay(2.5, "vagal-lift");
    expect(r.tone).toBe("uplift");
    expect(r.headline).toMatch(/\+2\.5 ms/);
  });

  it("neutral suppression", () => {
    const r = buildPulse25HrvDisplay(-1.0, "vagal-suppression");
    expect(r.tone).toBe("neutral");
  });

  it("null/NaN/Infinity → null defensive", () => {
    expect(buildPulse25HrvDisplay(null)).toBeNull();
    expect(buildPulse25HrvDisplay(NaN)).toBeNull();
    expect(buildPulse25HrvDisplay(Infinity)).toBeNull();
  });
});

describe("buildPulse25CoherenceDisplay helper — F2 thresholds", () => {
  it("0.70 → optimal", () => {
    expect(buildPulse25CoherenceDisplay(0.70).tone).toBe("optimal");
  });
  it("0.50 → achieved", () => {
    expect(buildPulse25CoherenceDisplay(0.50).tone).toBe("achieved");
  });
  it("0.30 → partial", () => {
    expect(buildPulse25CoherenceDisplay(0.30).tone).toBe("partial");
  });
  it("0.00 → low", () => {
    expect(buildPulse25CoherenceDisplay(0.05).tone).toBe("low");
  });
  it("null/NaN → null defensive", () => {
    expect(buildPulse25CoherenceDisplay(null)).toBeNull();
    expect(buildPulse25CoherenceDisplay(NaN)).toBeNull();
  });
});

describe("Pulse25CompletionCard — F2 reduced motion + CTA", () => {
  it("prefers-reduced-motion: instant stage 4", () => {
    mocks.useReducedMotion.mockReturnValue(true);
    render(<Pulse25CompletionCard isOpen onContinue={() => {}} />);
    const stage4 = document.querySelector('[data-testid="pulse25-stage-4"]');
    expect(stage4.getAttribute("data-stage-visible")).toBe("true");
  });

  it("Continue CTA fires onContinue", () => {
    mocks.useReducedMotion.mockReturnValue(true);
    const onContinue = vi.fn();
    render(<Pulse25CompletionCard isOpen onContinue={onContinue} />);
    fireEvent.click(document.querySelector('[data-testid="pulse25-continue"]'));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
