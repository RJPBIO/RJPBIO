/* Reset1IntroCard.test — Phase 7 F3.5-A Capa-2.
   Verifica:
   1) 4-stage choreography render.
   2) 4 mecanismos científicos visibles con citations.
   3) Validation paragraph "estudios revisados por pares".
   4) CTAs (EMPEZAR + No mostrar de nuevo).
   5) Reduced motion path.
   6) a11y dialog completa. */
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

import Reset1IntroCard from "./Reset1IntroCard";

beforeEach(() => {
  mocks.useReducedMotion.mockReturnValue(false);
  mocks.announce.mockClear();
});

afterEach(() => cleanup());

describe("Reset1IntroCard — F3.5-A Capa-2 mount/unmount", () => {
  it("isOpen=false → no renderiza", () => {
    const { container } = render(<Reset1IntroCard isOpen={false} onStart={() => {}} onSkipForever={() => {}} />);
    expect(container.querySelector('[data-testid="reset1-intro-card"]')).toBeNull();
  });

  it("isOpen=true → renderiza dialog con role + aria-modal", () => {
    render(<Reset1IntroCard isOpen onStart={() => {}} onSkipForever={() => {}} />);
    const card = document.querySelector('[data-testid="reset1-intro-card"]');
    expect(card).toBeTruthy();
    expect(card.getAttribute("role")).toBe("dialog");
    expect(card.getAttribute("aria-modal")).toBe("true");
  });

  it("eyebrow POLYVAGAL · BOX 4-4-4-4 · RCT-VALIDATED + título 'Activa tu sistema vagal en 2 minutos.'", () => {
    render(<Reset1IntroCard isOpen onStart={() => {}} onSkipForever={() => {}} />);
    expect(document.querySelector('[data-testid="reset1-intro-eyebrow"]').textContent).toMatch(/POLYVAGAL.*BOX 4-4-4-4.*RCT-VALIDATED/);
    expect(document.body.innerHTML).toMatch(/Activa tu sistema vagal en 2 minutos/);
  });

  it("announce sr-live polite al abrir", () => {
    render(<Reset1IntroCard isOpen onStart={() => {}} onSkipForever={() => {}} />);
    expect(mocks.announce).toHaveBeenCalledWith(
      expect.stringMatching(/Reinicio Parasimpático.*RCT/),
      "polite"
    );
  });
});

describe("Reset1IntroCard — F3.5-A 4 mecanismos científicos", () => {
  it("Renderiza 4 mecanismos con headlines + bodies", () => {
    render(<Reset1IntroCard isOpen onStart={() => {}} onSkipForever={() => {}} />);
    const list = document.querySelector('[data-testid="reset1-intro-mechanisms"]');
    expect(list).toBeTruthy();
    [0, 1, 2, 3].forEach((i) => {
      expect(document.querySelector(`[data-testid="reset1-intro-mechanism-${i}"]`)).toBeTruthy();
    });
  });

  it("Mecanismo 0 cita Porges 2022 (VVC)", () => {
    render(<Reset1IntroCard isOpen onStart={() => {}} onSkipForever={() => {}} />);
    const m0 = document.querySelector('[data-testid="reset1-intro-mechanism-0"]');
    expect(m0.textContent).toMatch(/Activación VVC/);
    expect(m0.textContent).toMatch(/Porges 2022/);
  });

  it("Mecanismo 1 cita Russo 2017 Breathe ERS (HRV)", () => {
    render(<Reset1IntroCard isOpen onStart={() => {}} onSkipForever={() => {}} />);
    const m1 = document.querySelector('[data-testid="reset1-intro-mechanism-1"]');
    expect(m1.textContent).toMatch(/HRV/);
    expect(m1.textContent).toMatch(/Russo 2017.*Breathe ERS/);
  });

  it("Mecanismo 2 cita Ma 2017 RCT N=40 (cortisol)", () => {
    render(<Reset1IntroCard isOpen onStart={() => {}} onSkipForever={() => {}} />);
    const m2 = document.querySelector('[data-testid="reset1-intro-mechanism-2"]');
    expect(m2.textContent).toMatch(/Cortisol/);
    expect(m2.textContent).toMatch(/Ma 2017.*N=40/);
  });

  it("Mecanismo 3 cita Lemaitre 2025 RCT box (3.75 brpm)", () => {
    render(<Reset1IntroCard isOpen onStart={() => {}} onSkipForever={() => {}} />);
    const m3 = document.querySelector('[data-testid="reset1-intro-mechanism-3"]');
    expect(m3.textContent).toMatch(/3\.75 brpm/);
    expect(m3.textContent).toMatch(/Lemaitre 2025.*box 4-4-4-4/);
  });
});

describe("Reset1IntroCard — F3.5-A validation paragraph", () => {
  it("Validation paragraph menciona Frontiers/ERS/MDPI revisados por pares", () => {
    render(<Reset1IntroCard isOpen onStart={() => {}} onSkipForever={() => {}} />);
    const v = document.querySelector('[data-testid="reset1-intro-validation"]');
    expect(v.textContent).toMatch(/2 minutos.*8 ciclos/);
    expect(v.textContent).toMatch(/revisados por pares/);
    expect(v.textContent).toMatch(/Frontiers|ERS|MDPI/);
    expect(v.textContent).toMatch(/Porges 2022/);
  });
});

describe("Reset1IntroCard — F3.5-A CTAs", () => {
  it("Empezar CTA fires onStart", () => {
    mocks.useReducedMotion.mockReturnValue(true); // skip choreography
    const onStart = vi.fn();
    render(<Reset1IntroCard isOpen onStart={onStart} onSkipForever={() => {}} />);
    fireEvent.click(document.querySelector('[data-testid="reset1-intro-start"]'));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("No mostrar de nuevo CTA fires onSkipForever", () => {
    mocks.useReducedMotion.mockReturnValue(true);
    const onSkipForever = vi.fn();
    render(<Reset1IntroCard isOpen onStart={() => {}} onSkipForever={onSkipForever} />);
    fireEvent.click(document.querySelector('[data-testid="reset1-intro-skip-forever"]'));
    expect(onSkipForever).toHaveBeenCalledTimes(1);
  });
});

describe("Reset1IntroCard — F3.5-A reduced motion", () => {
  it("prefers-reduced-motion: instant stage 4 (CTAs visible)", () => {
    mocks.useReducedMotion.mockReturnValue(true);
    render(<Reset1IntroCard isOpen onStart={() => {}} onSkipForever={() => {}} />);
    const stage4 = document.querySelector('[data-testid="reset1-intro-stage-4"]');
    expect(stage4.getAttribute("data-stage-visible")).toBe("true");
  });
});
