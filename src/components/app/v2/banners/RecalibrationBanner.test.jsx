/* RecalibrationBanner.test — Phase 6J-2 HIGH-4. */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import RecalibrationBanner from "./RecalibrationBanner";

afterEach(() => cleanup());

describe("RecalibrationBanner — gating", () => {
  it("recalibration null → no renderea", () => {
    const { container } = render(<RecalibrationBanner recalibration={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("recalibration sin title → no renderea (defensive)", () => {
    const { container } = render(
      <RecalibrationBanner recalibration={{ severity: "soft" }} />
    );
    expect(container.firstChild).toBeNull();
  });
});

describe("RecalibrationBanner — render", () => {
  it("severity='soft' + guidance → renderea con eyebrow 'verificación'", () => {
    const guidance = {
      severity: "soft",
      title: "Bienvenido de vuelta",
      body: "Han pasado 14 días.",
      cta: "Continuar con sesión",
    };
    render(<RecalibrationBanner recalibration={guidance} />);
    const banner = document.querySelector('[data-testid="recalibration-banner"]');
    expect(banner).toBeTruthy();
    expect(banner.getAttribute("data-severity")).toBe("soft");
    expect(banner.textContent).toMatch(/Bienvenido de vuelta/);
    expect(banner.textContent).toMatch(/verificación/i);
  });

  it("severity='hard' → data-severity='hard' + eyebrow 'recalibración'", () => {
    const guidance = {
      severity: "hard",
      title: "35 días de pausa",
      body: "Tus patrones pueden haber cambiado.",
      cta: "Recalibrar ahora",
    };
    render(<RecalibrationBanner recalibration={guidance} />);
    const banner = document.querySelector('[data-testid="recalibration-banner"]');
    expect(banner.getAttribute("data-severity")).toBe("hard");
    expect(banner.textContent).toMatch(/recalibración/i);
    expect(banner.textContent).toMatch(/Recalibrar ahora/i);
  });
});

describe("RecalibrationBanner — interactions", () => {
  it("Tap CTA → onCta llamado", () => {
    const onCta = vi.fn();
    render(
      <RecalibrationBanner
        recalibration={{ severity: "hard", title: "T", body: "B", cta: "Acción" }}
        onCta={onCta}
      />
    );
    fireEvent.click(document.querySelector('[data-testid="recalibration-banner-cta"]'));
    expect(onCta).toHaveBeenCalled();
  });
});
