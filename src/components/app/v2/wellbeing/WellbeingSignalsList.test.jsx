/* WellbeingSignalsList — Phase 6F SP-F
   Cubre: empty signals, render explanation per signal, métrica específica
   por signal type (hrvDecline, chronoDyssynchrony usa chronoMisalignedSessions
   no chronoMisalignedDays — sub-prompt error catched). */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import WellbeingSignalsList from "./WellbeingSignalsList";

describe("WellbeingSignalsList — Phase 6F SP-F", () => {
  it("empty array → mensaje 'no señales'", () => {
    render(<WellbeingSignalsList signals={[]} />);
    expect(screen.getByText(/No se detectaron señales/i)).toBeInTheDocument();
  });

  it("null/undefined signals → mensaje 'no señales'", () => {
    const { rerender } = render(<WellbeingSignalsList signals={null} />);
    expect(screen.getByText(/No se detectaron señales/i)).toBeInTheDocument();
    rerender(<WellbeingSignalsList signals={undefined} />);
    expect(screen.getByText(/No se detectaron señales/i)).toBeInTheDocument();
  });

  it("renderiza una entry per signal active", () => {
    render(
      <WellbeingSignalsList
        signals={["freqDrop", "moodSlope", "hrvDecline"]}
        metrics={{}}
      />
    );
    const rows = document.querySelectorAll("[data-v2-signal-row]");
    expect(rows).toHaveLength(3);
  });

  it("freqDrop signal muestra title + description humanas", () => {
    render(<WellbeingSignalsList signals={["freqDrop"]} metrics={{ freqDrop: 0.4 }} />);
    expect(screen.getByText(/Frecuencia de sesiones declinó/i)).toBeInTheDocument();
    expect(screen.getByText(/Frecuencia reciente 60% del baseline/i)).toBeInTheDocument();
  });

  it("hrvDecline metric muestra decline pct + baseline + recent", () => {
    render(
      <WellbeingSignalsList
        signals={["hrvDecline"]}
        metrics={{ hrvDeclinePct: 0.25, hrvBaseline28d: 50.0, hrvRecent7d: 37.5 }}
      />
    );
    expect(screen.getByText(/Variabilidad cardíaca/i)).toBeInTheDocument();
    expect(screen.getByText(/Decline 25%/i)).toBeInTheDocument();
    expect(screen.getByText(/50\.0 ms baseline/i)).toBeInTheDocument();
    expect(screen.getByText(/37\.5 ms reciente/i)).toBeInTheDocument();
  });

  it("chronoDyssynchrony usa chronoMisalignedSessions (NO chronoMisalignedDays)", () => {
    render(
      <WellbeingSignalsList
        signals={["chronoDyssynchrony"]}
        metrics={{ chronoMisalignedSessions: 9 }}
      />
    );
    expect(screen.getByText(/Patrón sesión \/ cronotipo desalineado/i)).toBeInTheDocument();
    expect(screen.getByText(/9 sesiones consecutivas fuera/i)).toBeInTheDocument();
  });

  it("chronoDyssynchrony sin metric → no muestra detail line", () => {
    render(<WellbeingSignalsList signals={["chronoDyssynchrony"]} metrics={{}} />);
    expect(screen.getByText(/Patrón sesión \/ cronotipo desalineado/i)).toBeInTheDocument();
    expect(screen.queryByText(/sesiones consecutivas fuera/i)).toBeNull();
  });

  it("moodSlope metric muestra slope/semana", () => {
    render(
      <WellbeingSignalsList
        signals={["moodSlope"]}
        metrics={{ moodSlopePerWeek: -0.45 }}
      />
    );
    expect(screen.getByText(/Pendiente: -0\.45 puntos\/semana/i)).toBeInTheDocument();
  });

  it("effDrop metric muestra effectiveness pct", () => {
    render(
      <WellbeingSignalsList
        signals={["effDrop"]}
        metrics={{ effectivenessDrop: 0.4 }}
      />
    );
    expect(screen.getByText(/Effectiveness reciente 60% del baseline/i)).toBeInTheDocument();
  });

  it("signal desconocido → fallback 'Detalle no disponible'", () => {
    render(<WellbeingSignalsList signals={["unknownSignal"]} metrics={{}} />);
    expect(screen.getByText(/Detalle no disponible/i)).toBeInTheDocument();
  });

  it("data-signal attribute presente per row para CSS hooks", () => {
    render(<WellbeingSignalsList signals={["freqDrop", "hrvDecline"]} metrics={{}} />);
    expect(document.querySelector('[data-signal="freqDrop"]')).toBeInTheDocument();
    expect(document.querySelector('[data-signal="hrvDecline"]')).toBeInTheDocument();
  });
});
