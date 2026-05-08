/* FatigueBanner.test — Phase 6J-2 HIGH-4. */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import FatigueBanner from "./FatigueBanner";

afterEach(() => cleanup());

describe("FatigueBanner — gating", () => {
  it("fatigue null → no renderea", () => {
    const { container } = render(<FatigueBanner fatigue={null} guidance={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("fatigue.level='none' → no renderea (gate per shape real)", () => {
    const { container } = render(
      <FatigueBanner
        fatigue={{ level: "none" }}
        guidance={null}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("fatigue.level='mild' sin guidance → no renderea (defensive)", () => {
    const { container } = render(
      <FatigueBanner
        fatigue={{ level: "mild" }}
        guidance={null}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});

describe("FatigueBanner — render", () => {
  it("level='mild' + guidance → renderea con copy guidance", () => {
    const guidance = {
      severity: "mild",
      title: "Considera bajar el ritmo",
      body: "Algunas sesiones recientes con muchas pausas.",
      cta: "Ver protocolos de reset",
    };
    render(
      <FatigueBanner
        fatigue={{ level: "mild", partialRatio: 0.4 }}
        guidance={guidance}
      />
    );
    const banner = document.querySelector('[data-testid="fatigue-banner"]');
    expect(banner).toBeTruthy();
    expect(banner.getAttribute("data-level")).toBe("mild");
    expect(banner.textContent).toMatch(/Considera bajar el ritmo/);
    expect(banner.textContent).toMatch(/Algunas sesiones recientes/);
    expect(document.querySelector('[data-testid="fatigue-banner-cta"]').textContent)
      .toMatch(/Ver protocolos de reset/i);
  });

  it("level='severe' → data-level='severe' + cyan accent (eyebrow texto 'atención')", () => {
    const guidance = {
      severity: "severe",
      title: "Tu sistema pide pausa",
      body: "Detectamos varias sesiones incompletas.",
      cta: "Hacer sesión de calma",
    };
    render(
      <FatigueBanner
        fatigue={{ level: "severe", partialRatio: 0.6 }}
        guidance={guidance}
      />
    );
    const banner = document.querySelector('[data-testid="fatigue-banner"]');
    expect(banner.getAttribute("data-level")).toBe("severe");
    expect(banner.textContent).toMatch(/atención/i);
  });
});

describe("FatigueBanner — interactions", () => {
  it("Tap CTA → onCta llamado", () => {
    const onCta = vi.fn();
    render(
      <FatigueBanner
        fatigue={{ level: "severe" }}
        guidance={{ severity: "severe", title: "T", body: "B", cta: "Acción" }}
        onCta={onCta}
      />
    );
    fireEvent.click(document.querySelector('[data-testid="fatigue-banner-cta"]'));
    expect(onCta).toHaveBeenCalled();
  });

  it("Sin guidance.cta → no renderea botón CTA", () => {
    render(
      <FatigueBanner
        fatigue={{ level: "mild" }}
        guidance={{ severity: "mild", title: "T", body: "B" /* no cta */ }}
      />
    );
    expect(document.querySelector('[data-testid="fatigue-banner-cta"]')).toBeNull();
  });
});
