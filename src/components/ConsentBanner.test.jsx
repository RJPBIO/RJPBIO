/* ConsentBanner — Phase 6D SP5 Bug-08 stacking guards.
   No test del flow completo de consent (lib/consent.js ya cubierto).
   Aquí solo validamos contratos de stacking + a11y básicos. */
import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import ConsentBanner from "./ConsentBanner";

beforeEach(() => {
  // Asegurar que readConsent retorna { decided: false } → banner se monta.
  if (typeof window !== "undefined") {
    try { window.localStorage.clear(); } catch {}
  }
});

describe("ConsentBanner — Phase 6D SP5 Bug-08 stacking", () => {
  it("renderiza con role=dialog cuando consent no decidido", () => {
    const { container } = render(<ConsentBanner />);
    expect(container.querySelector('[role="dialog"]')).toBeTruthy();
  });

  it("zIndex >= 105 (por encima de onboarding modal zIndex 100)", () => {
    const { container } = render(<ConsentBanner />);
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    const z = Number(dialog.style.zIndex);
    expect(z).toBeGreaterThanOrEqual(105);
  });

  it("zIndex < 200 (por debajo de app modals z.overlay/z.modal)", () => {
    const { container } = render(<ConsentBanner />);
    const dialog = container.querySelector('[role="dialog"]');
    const z = Number(dialog.style.zIndex);
    expect(z).toBeLessThan(200);
  });

  it("position fixed bottom (no flotando arriba bloqueando contenido)", () => {
    const { container } = render(<ConsentBanner />);
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog.style.position).toBe("fixed");
    expect(dialog.style.insetBlockEnd).toBeTruthy();
  });

  it("aria-modal=false (es notificación, no diálogo bloqueante)", () => {
    const { container } = render(<ConsentBanner />);
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog.getAttribute("aria-modal")).toBe("false");
  });
});
