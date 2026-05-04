/* ProgramActiveCard — Phase 6F SP-B
   Cubre los 4 estados de today (sesión pendiente, completada, descanso, ninguna)
   + lag warning + reEval banner + abandon CTA + timeline CTA. */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProgramActiveCard from "./ProgramActiveCard";

function makeActive(opts = {}) {
  return {
    id: "pa_test",
    programId: "burnout-recovery",
    startedAt: new Date(Date.now() - 5 * 86400_000).toISOString(),
    completedDays: opts.completedDays ?? [],
    reEvalAt: opts.reEvalAt ?? null,
    reEvalCompletedAt: opts.reEvalCompletedAt ?? null,
    source: "self-selected",
    todayStatus: opts.todayStatus ?? {
      shouldSession: true,
      day: 5,
      session: { day: 5, protocolId: 6, note: "grounded steel" },
    },
    lagStatus: opts.lagStatus ?? { isLagging: false, daysBehind: 0 },
    progress: opts.progress ?? { completed: 2, total: 14, fraction: 0.14, isComplete: false },
    reEval: opts.reEval ?? { dueDate: new Date().toISOString(), isDue: false, daysUntil: 9, completed: false },
  };
}

describe("ProgramActiveCard — Phase 6F SP-B", () => {
  it("retorna null cuando activeProgram es null", () => {
    const { container } = render(<ProgramActiveCard activeProgram={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("retorna null cuando activeProgram sin programId", () => {
    const { container } = render(<ProgramActiveCard activeProgram={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it("renderiza header con eyebrow + nombre cuando programa válido", () => {
    render(<ProgramActiveCard activeProgram={makeActive()} />);
    expect(screen.getByText("Burnout Recovery")).toBeInTheDocument();
    expect(screen.getByText(/TU PROGRAMA · 28D/)).toBeInTheDocument();
  });

  it("muestra TodaySessionBlock con CTA EMPEZAR cuando shouldSession=true", () => {
    const onAction = vi.fn();
    render(<ProgramActiveCard activeProgram={makeActive()} onAction={onAction} />);
    expect(screen.getByText(/HOY · DÍA 5/)).toBeInTheDocument();
    const cta = screen.getByTestId("program-today-cta");
    expect(cta).toBeInTheDocument();
    fireEvent.click(cta);
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "start-protocol",
        protocolId: 6,
        source: "program",
        programId: "burnout-recovery",
        day: 5,
      })
    );
  });

  it("muestra CompletedTodayBlock cuando shouldSession=false + session presente", () => {
    const active = makeActive({
      todayStatus: {
        shouldSession: false,
        day: 3,
        session: { day: 3, protocolId: 1, note: "reinicio parasimpático" },
      },
    });
    render(<ProgramActiveCard activeProgram={active} />);
    expect(screen.getByText(/DÍA 3 · COMPLETADO/)).toBeInTheDocument();
    expect(screen.queryByTestId("program-today-cta")).toBeNull();
  });

  it("muestra RestDayBlock cuando shouldSession=false + session=null", () => {
    const active = makeActive({
      todayStatus: { shouldSession: false, day: 2, session: null },
    });
    render(<ProgramActiveCard activeProgram={active} />);
    expect(screen.getByText(/DÍA 2 · DESCANSO/)).toBeInTheDocument();
  });

  it("muestra LagWarning cuando isLagging=true", () => {
    const active = makeActive({ lagStatus: { isLagging: true, daysBehind: 3 } });
    render(<ProgramActiveCard activeProgram={active} />);
    expect(screen.getByText(/AL MARGEN DEL PLAN/)).toBeInTheDocument();
    expect(screen.getByText(/3 días atrás/i)).toBeInTheDocument();
  });

  it("muestra ReEvalDueBanner cuando reEval.isDue && !completed", () => {
    const onAction = vi.fn();
    const active = makeActive({
      reEval: { dueDate: new Date().toISOString(), isDue: true, daysUntil: 0, completed: false },
    });
    render(<ProgramActiveCard activeProgram={active} onAction={onAction} />);
    const cta = screen.getByTestId("program-reeval-cta");
    expect(cta).toBeInTheDocument();
    fireEvent.click(cta);
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ action: "open-reeval-prompt" }));
  });

  it("NO muestra ReEvalDueBanner cuando reEval.completed=true", () => {
    const active = makeActive({
      reEval: { dueDate: new Date().toISOString(), isDue: true, daysUntil: 0, completed: true },
    });
    render(<ProgramActiveCard activeProgram={active} />);
    expect(screen.queryByTestId("program-reeval-cta")).toBeNull();
  });

  it("NO muestra ReEvalDueBanner cuando reEval.isDue=false", () => {
    const active = makeActive({
      reEval: { dueDate: new Date().toISOString(), isDue: false, daysUntil: 5, completed: false },
    });
    render(<ProgramActiveCard activeProgram={active} />);
    expect(screen.queryByTestId("program-reeval-cta")).toBeNull();
  });

  it("CTA Abandonar dispara action abandon-program", () => {
    const onAction = vi.fn();
    render(<ProgramActiveCard activeProgram={makeActive()} onAction={onAction} />);
    const abandon = screen.getByTestId("program-abandon");
    fireEvent.click(abandon);
    expect(onAction).toHaveBeenCalledWith({ action: "abandon-program" });
  });

  it("CTA línea de tiempo dispara navigation target /app/program/timeline", () => {
    const onAction = vi.fn();
    render(<ProgramActiveCard activeProgram={makeActive()} onAction={onAction} />);
    fireEvent.click(screen.getByText(/Ver línea de tiempo/i));
    expect(onAction).toHaveBeenCalledWith({ target: "/app/program/timeline" });
  });

  it("ProgressBar refleja progress.completed/total", () => {
    const active = makeActive({ progress: { completed: 7, total: 14, fraction: 0.5, isComplete: false } });
    render(<ProgramActiveCard activeProgram={active} />);
    const pb = screen.getByRole("progressbar");
    expect(pb.getAttribute("aria-valuenow")).toBe("7");
    expect(pb.getAttribute("aria-valuemax")).toBe("14");
    expect(screen.getByText(/7 sesiones completadas/i)).toBeInTheDocument();
  });
});
