/* CoachV2 — Phase 6D SP5 tests focalizados en error states + cleanup. */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CoachErrorBanner } from "./CoachV2";

describe("CoachErrorBanner — Phase 6D SP5 Bug-13", () => {
  it("renderiza message + CTA cuando type=unauthenticated", () => {
    const onCta = vi.fn();
    render(
      <CoachErrorBanner
        type="unauthenticated"
        message="Tu sesión expiró. Inicia sesión para continuar."
        cta={{ label: "INICIAR SESIÓN", action: "signin" }}
        onCtaPress={onCta}
        onDismiss={() => {}}
      />,
    );
    expect(screen.getByText(/Tu sesión expiró/i)).toBeTruthy();
    const cta = screen.getByTestId("coach-error-cta-signin");
    expect(cta).toBeTruthy();
    fireEvent.click(cta);
    expect(onCta).toHaveBeenCalledTimes(1);
  });

  it("renderiza CTA REINTENTAR cuando type=server", () => {
    const onCta = vi.fn();
    render(
      <CoachErrorBanner
        type="server"
        message="No pude responder ahora. Intenta de nuevo en un momento."
        cta={{ label: "REINTENTAR", action: "retry" }}
        onCtaPress={onCta}
        onDismiss={() => {}}
      />,
    );
    expect(screen.getByText(/No pude responder ahora/i)).toBeTruthy();
    const cta = screen.getByTestId("coach-error-cta-retry");
    fireEvent.click(cta);
    expect(onCta).toHaveBeenCalledTimes(1);
  });

  it("renderiza CTA REINTENTAR cuando type=network", () => {
    render(
      <CoachErrorBanner
        type="network"
        message="Sin conexión. Verifica tu internet."
        cta={{ label: "REINTENTAR", action: "retry" }}
        onCtaPress={() => {}}
        onDismiss={() => {}}
      />,
    );
    expect(screen.getByText(/Sin conexión/i)).toBeTruthy();
    expect(screen.getByTestId("coach-error-cta-retry")).toBeTruthy();
  });

  it("dismiss button llama onDismiss", () => {
    const onDismiss = vi.fn();
    render(
      <CoachErrorBanner
        type="server"
        message="x"
        cta={{ label: "x", action: "retry" }}
        onCtaPress={() => {}}
        onDismiss={onDismiss}
      />,
    );
    fireEvent.click(screen.getByTestId("coach-error-dismiss"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("aplica data-error-type para estilos diferenciados por tipo", () => {
    const { container, rerender } = render(
      <CoachErrorBanner
        type="unauthenticated"
        message="x"
        cta={null}
        onCtaPress={() => {}}
        onDismiss={() => {}}
      />,
    );
    expect(container.querySelector('[data-error-type="unauthenticated"]')).toBeTruthy();
    rerender(
      <CoachErrorBanner
        type="server"
        message="x"
        cta={null}
        onCtaPress={() => {}}
        onDismiss={() => {}}
      />,
    );
    expect(container.querySelector('[data-error-type="server"]')).toBeTruthy();
    rerender(
      <CoachErrorBanner
        type="network"
        message="x"
        cta={null}
        onCtaPress={() => {}}
        onDismiss={() => {}}
      />,
    );
    expect(container.querySelector('[data-error-type="network"]')).toBeTruthy();
  });

  it("sin CTA NO renderiza botón de acción (network sin retry)", () => {
    render(
      <CoachErrorBanner
        type="network"
        message="Sin conexión."
        cta={null}
        onCtaPress={() => {}}
        onDismiss={() => {}}
      />,
    );
    expect(screen.queryByTestId("coach-error-cta-retry")).toBeNull();
    expect(screen.queryByTestId("coach-error-cta-signin")).toBeNull();
    expect(screen.getByTestId("coach-error-dismiss")).toBeTruthy();
  });

  it("role=alert para anuncio a screen readers", () => {
    const { container } = render(
      <CoachErrorBanner
        type="server"
        message="x"
        cta={null}
        onCtaPress={() => {}}
        onDismiss={() => {}}
      />,
    );
    expect(container.querySelector('[role="alert"]')).toBeTruthy();
  });
});
