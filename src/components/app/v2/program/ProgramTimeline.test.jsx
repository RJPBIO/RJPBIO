/* ProgramTimeline — Phase 6F SP-B
   Verifica grid renderiza N celdas por programa, estados correctos, click handlers,
   y graceful fallback cuando programId no existe en catálogo. */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProgramTimeline from "./ProgramTimeline";

function makeActive(opts = {}) {
  return {
    id: "pa_t",
    programId: opts.programId || "neural-baseline",
    startedAt: new Date(Date.now() - 5 * 86400_000).toISOString(),
    completedDays: opts.completedDays ?? [1, 3],
    todayStatus: opts.todayStatus ?? { day: 5 },
    progress: opts.progress ?? { completed: 2, total: 14 },
  };
}

describe("ProgramTimeline — Phase 6F SP-B", () => {
  it("retorna null cuando activeProgram null/sin programId", () => {
    const { container: c1 } = render(<ProgramTimeline activeProgram={null} />);
    expect(c1.firstChild).toBeNull();
    const { container: c2 } = render(<ProgramTimeline activeProgram={{}} />);
    expect(c2.firstChild).toBeNull();
  });

  it("muestra fallback cuando programId no existe en catálogo", () => {
    render(<ProgramTimeline activeProgram={makeActive({ programId: "fake-program" })} />);
    expect(screen.getByText(/Programa no encontrado/i)).toBeInTheDocument();
  });

  it("renderiza eyebrow + nombre + duration para Neural Baseline 14 días", () => {
    render(<ProgramTimeline activeProgram={makeActive()} />);
    expect(screen.getByText(/LÍNEA DE TIEMPO · NEURAL BASELINE/i)).toBeInTheDocument();
    expect(screen.getByText("14 días")).toBeInTheDocument();
  });

  it("renderiza una celda por día (14 para Neural Baseline)", () => {
    render(<ProgramTimeline activeProgram={makeActive()} />);
    const dots = document.querySelectorAll('[data-v2-timeline-day]');
    expect(dots.length).toBe(14);
  });

  it("renderiza 28 celdas para Burnout Recovery", () => {
    render(<ProgramTimeline activeProgram={makeActive({ programId: "burnout-recovery" })} />);
    const dots = document.querySelectorAll('[data-v2-timeline-day]');
    expect(dots.length).toBe(28);
  });

  it("estados: completed / today / future / missed correctamente asignados", () => {
    // Neural Baseline tiene sesiones en TODOS los días (1-14, no hay reposos).
    render(<ProgramTimeline activeProgram={makeActive({
      completedDays: [1, 2, 3],
      todayStatus: { day: 5 },
    })} />);
    const dot1 = document.querySelector('[data-day="1"]');
    const dot4 = document.querySelector('[data-day="4"]');
    const dot5 = document.querySelector('[data-day="5"]');
    const dot10 = document.querySelector('[data-day="10"]');
    expect(dot1.getAttribute("data-state")).toBe("completed");
    // day 4: NO completed, < today (5) → "missed"
    expect(dot4.getAttribute("data-state")).toBe("missed");
    expect(dot5.getAttribute("data-state")).toBe("today");
    expect(dot10.getAttribute("data-state")).toBe("future");
  });

  it("identifica estado 'rest' para días sparse (Burnout Recovery día 2)", () => {
    // BR sessions empiezan: 1, 3, 5, 7, 9, 11, 12, 14... — día 2 es reposo.
    render(<ProgramTimeline activeProgram={makeActive({
      programId: "burnout-recovery",
      completedDays: [],
      todayStatus: { day: 1 },
    })} />);
    const dot2 = document.querySelector('[data-day="2"]');
    expect(dot2.getAttribute("data-state")).toBe("rest");
  });

  it("click en día con sesión llama a onDayClick con cell", () => {
    const onClick = vi.fn();
    render(<ProgramTimeline activeProgram={makeActive()} onDayClick={onClick} />);
    const dot1 = document.querySelector('[data-day="1"]');
    fireEvent.click(dot1.closest("button"));
    expect(onClick).toHaveBeenCalledWith(
      expect.objectContaining({ day: 1, state: "completed" })
    );
  });

  it("día de reposo NO es interactivo (no <button>)", () => {
    render(<ProgramTimeline activeProgram={makeActive({
      programId: "burnout-recovery",
      todayStatus: { day: 1 },
    })} />);
    const dot2 = document.querySelector('[data-day="2"]');
    expect(dot2.closest("button")).toBeNull();
  });

  it("legend muestra 5 variantes (completed, today, future, missed, rest)", () => {
    render(<ProgramTimeline activeProgram={makeActive()} />);
    expect(screen.getByText(/^Completado$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Hoy$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Pendiente$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Saltado$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Reposo$/i)).toBeInTheDocument();
  });

  it("aria-label de cell describe estado", () => {
    render(<ProgramTimeline activeProgram={makeActive({
      completedDays: [1],
      todayStatus: { day: 5 },
    })} />);
    expect(screen.getByLabelText(/Día 1 completado/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Día 5 hoy con sesión pendiente/i)).toBeInTheDocument();
  });
});
