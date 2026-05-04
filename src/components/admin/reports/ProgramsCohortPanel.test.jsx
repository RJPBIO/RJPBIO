/* ProgramsCohortPanel — Phase 6F SP-D
   Cubre: suppressed top-level, cohort suppressed, inverted PSS-4 logic
   (lower is better), HRV improved logic, suppressed metric. */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ProgramsCohortPanel from "./ProgramsCohortPanel";

describe("ProgramsCohortPanel — Phase 6F SP-D", () => {
  it("retorna null cuando programs es null", () => {
    const { container } = render(<ProgramsCohortPanel programs={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("muestra suppressed top-level cuando programs.suppressed", () => {
    render(
      <ProgramsCohortPanel programs={{ suppressed: true, n: 3, completionRate: null }} />
    );
    expect(screen.getByText(/Comparativa no disponible/i)).toBeInTheDocument();
    expect(screen.getByText(/actual: 3/i)).toBeInTheDocument();
  });

  it("muestra empty cuando cohorts es {} y completionRate disponible", () => {
    render(
      <ProgramsCohortPanel programs={{ suppressed: false, n: 8, completionRate: 0.5, cohorts: {} }} />
    );
    expect(screen.getByText(/Sin programas con cohort suficiente/i)).toBeInTheDocument();
  });

  it("renderiza cohort card con PSS-4 mejorado (delta negativo = improved)", () => {
    const programs = {
      suppressed: false,
      n: 8,
      completionRate: 0.6,
      cohorts: {
        "burnout-recovery": {
          n: 6,
          duration: 28,
          pss4: { n: 6, preMean: 9.5, postMean: 6.2, delta: -3.3 },
          hrv: { n: 6, preMean: 28.4, postMean: 35.7, delta: 7.3 },
        },
      },
    };
    render(<ProgramsCohortPanel programs={programs} />);
    expect(screen.getByText(/Burnout Recovery/i)).toBeInTheDocument();
    // PSS-4: lower is better → delta -3.3 → improved=true
    // HRV: higher is better → delta +7.3 → improved=true
    // Labels aparecen en subtitle de la sección + metric label → getAllByText.
    expect(screen.getAllByText(/PSS-4 estrés/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/RMSSD \(HRV\)/i).length).toBeGreaterThan(0);
    // Both metrics improved → "(mejor)" twice
    const mejorMatches = screen.getAllByText(/\(mejor\)/i);
    expect(mejorMatches.length).toBe(2);
  });

  it("muestra '(retrocedió)' cuando PSS-4 sube (peor)", () => {
    const programs = {
      suppressed: false,
      n: 8,
      completionRate: 0.5,
      cohorts: {
        "neural-baseline": {
          n: 6,
          duration: 14,
          pss4: { n: 6, preMean: 4.0, postMean: 7.5, delta: 3.5 }, // PSS-4 subió → empeoró
          hrv: { n: 6, preMean: 40, postMean: 38, delta: -2 }, // HRV bajó → empeoró
        },
      },
    };
    render(<ProgramsCohortPanel programs={programs} />);
    const retrocedioMatches = screen.getAllByText(/\(retrocedió\)/i);
    expect(retrocedioMatches.length).toBe(2);
  });

  it("cohort suppressed muestra muestra-insuficiente per program", () => {
    const programs = {
      suppressed: false,
      n: 8,
      completionRate: 0.6,
      cohorts: {
        "focus-sprint": { suppressed: true, n: 3, reason: "k_anonymity" },
      },
    };
    render(<ProgramsCohortPanel programs={programs} />);
    expect(screen.getByText(/Muestra insuficiente/i)).toBeInTheDocument();
  });

  it("metric suppressed (sin pares pre/post) muestra mensaje específico", () => {
    const programs = {
      suppressed: false,
      n: 8,
      completionRate: 0.5,
      cohorts: {
        "recovery-week": {
          n: 6,
          duration: 7,
          pss4: { suppressed: true, n: 2 }, // <5 pares pre+post
          hrv: { n: 6, preMean: 30, postMean: 33, delta: 3 },
        },
      },
    };
    render(<ProgramsCohortPanel programs={programs} />);
    expect(screen.getByText(/Sin pares pre\/post suficientes/i)).toBeInTheDocument();
  });

  it("respeta program_not_in_catalog reason", () => {
    const programs = {
      suppressed: false,
      n: 6,
      completionRate: 0.5,
      cohorts: {
        "fake-program-id": { suppressed: true, n: 6, reason: "program_not_in_catalog" },
      },
    };
    render(<ProgramsCohortPanel programs={programs} />);
    expect(screen.getByText(/Programa no encontrado en catálogo/i)).toBeInTheDocument();
  });

  it("completionRate muestra porcentaje en subtitle", () => {
    const programs = {
      suppressed: false,
      n: 10,
      completionRate: 0.85,
      cohorts: {
        "burnout-recovery": {
          n: 5,
          duration: 28,
          pss4: { n: 5, preMean: 8, postMean: 5, delta: -3 },
          hrv: { n: 5, preMean: 30, postMean: 38, delta: 8 },
        },
      },
    };
    render(<ProgramsCohortPanel programs={programs} />);
    expect(screen.getByText(/85% completion/i)).toBeInTheDocument();
  });
});
