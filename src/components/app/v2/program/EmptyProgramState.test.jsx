/* EmptyProgramState — Phase 6G Fix2 P1-2 unit tests */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import EmptyProgramState from "./EmptyProgramState";

// Stub next/link a un <a> simple — los tests E2E validan navegación real.
import { vi } from "vitest";
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

describe("EmptyProgramState — Phase 6G Fix2 P1-2", () => {
  it("context=today renderea copy específico", () => {
    render(<EmptyProgramState context="today" />);
    expect(screen.getByText("SIN PROGRAMA ACTIVO")).toBeInTheDocument();
    expect(screen.getByText("Empieza un programa")).toBeInTheDocument();
    expect(screen.getByText(/sesiones diarias y re-evaluación/i)).toBeInTheDocument();
  });

  it("context=timeline renderea copy específico", () => {
    render(<EmptyProgramState context="timeline" />);
    expect(screen.getByText("SIN PROGRAMA ACTIVO")).toBeInTheDocument();
    expect(screen.getByText("Sin línea de tiempo")).toBeInTheDocument();
    expect(screen.getByText(/progreso día a día/i)).toBeInTheDocument();
  });

  it("default context = today si no se pasa prop", () => {
    render(<EmptyProgramState />);
    expect(screen.getByText("Empieza un programa")).toBeInTheDocument();
  });

  it("CTA tiene data-testid empty-program-cta y href /app/programs", () => {
    render(<EmptyProgramState context="today" />);
    const cta = screen.getByTestId("empty-program-cta");
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute("href", "/app/programs");
    expect(cta.textContent).toMatch(/EXPLORAR PROGRAMAS/i);
  });

  it("data-context attribute refleja prop", () => {
    const { container, rerender } = render(<EmptyProgramState context="today" />);
    expect(container.querySelector("[data-context='today']")).toBeInTheDocument();
    rerender(<EmptyProgramState context="timeline" />);
    expect(container.querySelector("[data-context='timeline']")).toBeInTheDocument();
  });
});
