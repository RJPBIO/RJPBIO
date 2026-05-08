/* EngagementPanel — Phase 6I-4 (cierre H-4 repo audit)
   Cubre: null/undefined defensive, suppressed branch (k<5), empty
   state (activeUsersLast7d=0), active state grid 4-up, derived
   metrics (sessions/day avg, activation %), totalActiveMembers
   ratio, k-anon reminder siempre en active state. */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import EngagementPanel from "./EngagementPanel";

describe("EngagementPanel — Phase 6I-4 (H-4 cierre)", () => {
  it("retorna null cuando engagement es null/undefined (defensive)", () => {
    const { container: c1 } = render(<EngagementPanel engagement={null} />);
    expect(c1.firstChild).toBeNull();
    const { container: c2 } = render(<EngagementPanel engagement={undefined} />);
    expect(c2.firstChild).toBeNull();
  });

  it("muestra suppressed branch cuando engagement.suppressed=true", () => {
    render(<EngagementPanel engagement={{ suppressed: true, n: 3 }} />);
    expect(screen.getByTestId("engagement-panel")).toHaveAttribute("data-state", "suppressed");
    expect(screen.getByText(/Métricas no disponibles/i)).toBeInTheDocument();
    expect(screen.getByText(/actual: 3/i)).toBeInTheDocument();
  });

  it("suppressed branch NO muestra stats grid ni k-anon reminder", () => {
    render(<EngagementPanel engagement={{ suppressed: true, n: 2 }} />);
    expect(screen.queryByTestId("engagement-stat-dau")).toBeNull();
    expect(screen.queryByTestId("engagement-kanon-reminder")).toBeNull();
  });

  it("empty state cuando activeUsersLast7d === 0 (sin sesiones 30d)", () => {
    render(
      <EngagementPanel
        engagement={{
          suppressed: false,
          sessionsLast7d: 0,
          sessionsLast30d: 0,
          activeUsersLast7d: 0,
          activeUsersLast30d: 0,
          activationRate: 0,
        }}
      />
    );
    expect(screen.getByTestId("engagement-panel")).toHaveAttribute("data-state", "empty");
    expect(screen.getByText(/Sin actividad en últimos 7 días/i)).toBeInTheDocument();
    expect(screen.getByText(/Aún no hay actividad de equipo/i)).toBeInTheDocument();
  });

  it("empty state diferenciado cuando hay actividad 30d pero 0 en 7d", () => {
    render(
      <EngagementPanel
        engagement={{
          suppressed: false,
          sessionsLast7d: 0,
          sessionsLast30d: 18,
          activeUsersLast7d: 0,
          activeUsersLast30d: 4,
          activationRate: 0,
        }}
      />
    );
    expect(screen.getByText(/18 sesiones en los últimos 30 días/i)).toBeInTheDocument();
    expect(screen.getByText(/dejó de usar la plataforma esta semana/i)).toBeInTheDocument();
  });

  it("empty state NO muestra stats grid", () => {
    render(
      <EngagementPanel
        engagement={{
          suppressed: false,
          sessionsLast7d: 0,
          sessionsLast30d: 0,
          activeUsersLast7d: 0,
          activeUsersLast30d: 0,
          activationRate: 0,
        }}
      />
    );
    expect(screen.queryByTestId("engagement-stat-dau")).toBeNull();
    expect(screen.queryByTestId("engagement-kanon-reminder")).toBeNull();
  });

  it("active state renderiza 4 stats con valores correctos", () => {
    render(
      <EngagementPanel
        engagement={{
          suppressed: false,
          sessionsLast7d: 28,
          sessionsLast30d: 96,
          activeUsersLast7d: 5,
          activeUsersLast30d: 9,
          activationRate: 0.75,
        }}
        totalActiveMembers={12}
      />
    );
    expect(screen.getByTestId("engagement-panel")).toHaveAttribute("data-state", "active");
    expect(screen.getByTestId("engagement-stat-dau")).toBeInTheDocument();
    expect(screen.getByTestId("engagement-stat-wau")).toBeInTheDocument();
    expect(screen.getByTestId("engagement-stat-sessions-per-day")).toBeInTheDocument();
    expect(screen.getByTestId("engagement-stat-activation")).toBeInTheDocument();
  });

  it("ACTIVOS / 7 DÍAS = activeUsersLast7d", () => {
    render(
      <EngagementPanel
        engagement={{
          suppressed: false,
          sessionsLast7d: 21,
          sessionsLast30d: 80,
          activeUsersLast7d: 7,
          activeUsersLast30d: 10,
          activationRate: 0.5,
        }}
        totalActiveMembers={14}
      />
    );
    const dauStat = screen.getByTestId("engagement-stat-dau");
    expect(dauStat).toHaveTextContent("7");
    expect(dauStat).toHaveTextContent(/ACTIVOS \/ 7 DÍAS/i);
  });

  it("ACTIVOS / 30 DÍAS = activeUsersLast30d", () => {
    render(
      <EngagementPanel
        engagement={{
          suppressed: false,
          sessionsLast7d: 21,
          sessionsLast30d: 80,
          activeUsersLast7d: 7,
          activeUsersLast30d: 11,
          activationRate: 0.5,
        }}
      />
    );
    const wauStat = screen.getByTestId("engagement-stat-wau");
    expect(wauStat).toHaveTextContent("11");
    expect(wauStat).toHaveTextContent(/ACTIVOS \/ 30 DÍAS/i);
  });

  it("SESIONES / DÍA = sessionsLast7d / 7 con 1 decimal", () => {
    render(
      <EngagementPanel
        engagement={{
          suppressed: false,
          sessionsLast7d: 28, // 28/7 = 4.0
          sessionsLast30d: 96,
          activeUsersLast7d: 5,
          activeUsersLast30d: 9,
          activationRate: 0.75,
        }}
      />
    );
    expect(screen.getByTestId("engagement-stat-sessions-per-day")).toHaveTextContent("4.0");
  });

  it("SESIONES / DÍA con división no entera muestra 1 decimal", () => {
    render(
      <EngagementPanel
        engagement={{
          suppressed: false,
          sessionsLast7d: 25, // 25/7 = 3.57 → "3.6"
          sessionsLast30d: 96,
          activeUsersLast7d: 5,
          activeUsersLast30d: 9,
          activationRate: 0.5,
        }}
      />
    );
    expect(screen.getByTestId("engagement-stat-sessions-per-day")).toHaveTextContent("3.6");
  });

  it("ACTIVACIÓN = activationRate * 100 con 0 decimal y %", () => {
    render(
      <EngagementPanel
        engagement={{
          suppressed: false,
          sessionsLast7d: 21,
          sessionsLast30d: 80,
          activeUsersLast7d: 7,
          activeUsersLast30d: 11,
          activationRate: 0.733, // → 73%
        }}
      />
    );
    expect(screen.getByTestId("engagement-stat-activation")).toHaveTextContent("73%");
  });

  it("ACTIVACIÓN muestra '—' cuando activationRate es null (defensive)", () => {
    render(
      <EngagementPanel
        engagement={{
          suppressed: false,
          sessionsLast7d: 5,
          sessionsLast30d: 5,
          activeUsersLast7d: 1,
          activeUsersLast30d: 1,
          activationRate: null,
        }}
      />
    );
    expect(screen.getByTestId("engagement-stat-activation")).toHaveTextContent("—");
  });

  it("Title muestra ratio activeUsersLast7d/totalActiveMembers cuando totalActiveMembers provided", () => {
    render(
      <EngagementPanel
        engagement={{
          suppressed: false,
          sessionsLast7d: 21,
          sessionsLast30d: 80,
          activeUsersLast7d: 7,
          activeUsersLast30d: 10,
          activationRate: 0.71,
        }}
        totalActiveMembers={14}
      />
    );
    expect(screen.getByText(/7\/14 miembros del equipo/i)).toBeInTheDocument();
  });

  it("Subtitle omite ratio cuando totalActiveMembers undefined", () => {
    render(
      <EngagementPanel
        engagement={{
          suppressed: false,
          sessionsLast7d: 21,
          sessionsLast30d: 80,
          activeUsersLast7d: 7,
          activeUsersLast30d: 10,
          activationRate: 0.71,
        }}
      />
    );
    // No debe contener "/X miembros del equipo"
    expect(screen.queryByText(/miembros del equipo/i)).toBeNull();
    // Pero sí muestra sesiones 7d
    expect(screen.getByText(/21 sesiones en últimos 7 días/i)).toBeInTheDocument();
  });

  it("Title singular vs plural: 1 persona activa vs N personas activas", () => {
    const { rerender } = render(
      <EngagementPanel
        engagement={{
          suppressed: false,
          sessionsLast7d: 5,
          sessionsLast30d: 18,
          activeUsersLast7d: 1,
          activeUsersLast30d: 3,
          activationRate: 0.2,
        }}
        totalActiveMembers={15}
      />
    );
    expect(screen.getByText(/1 persona activa esta semana/i)).toBeInTheDocument();

    rerender(
      <EngagementPanel
        engagement={{
          suppressed: false,
          sessionsLast7d: 28,
          sessionsLast30d: 96,
          activeUsersLast7d: 5,
          activeUsersLast30d: 9,
          activationRate: 0.6,
        }}
        totalActiveMembers={15}
      />
    );
    expect(screen.getByText(/5 personas activas esta semana/i)).toBeInTheDocument();
  });

  it("Secondary caption muestra sessionsLast30d + ratio mensual", () => {
    render(
      <EngagementPanel
        engagement={{
          suppressed: false,
          sessionsLast7d: 21,
          sessionsLast30d: 80,
          activeUsersLast7d: 7,
          activeUsersLast30d: 11,
          activationRate: 0.5,
        }}
        totalActiveMembers={22}
      />
    );
    const secondary = screen.getByTestId("engagement-secondary");
    expect(secondary).toHaveTextContent(/80 sesiones en últimos 30 días/i);
    expect(secondary).toHaveTextContent(/11\/22 del equipo en periodo mensual/i);
  });

  it("k-anon reminder visible siempre en active state", () => {
    render(
      <EngagementPanel
        engagement={{
          suppressed: false,
          sessionsLast7d: 21,
          sessionsLast30d: 80,
          activeUsersLast7d: 7,
          activeUsersLast30d: 11,
          activationRate: 0.5,
        }}
      />
    );
    const reminder = screen.getByTestId("engagement-kanon-reminder");
    expect(reminder).toBeInTheDocument();
    expect(reminder).toHaveTextContent(/k-anon ≥ 5/i);
    expect(reminder).toHaveTextContent(/activación = miembros con ≥1 sesión en últimos 30 días/i);
  });

  it("data-v2-engagement-stats-grid presente en active state", () => {
    render(
      <EngagementPanel
        engagement={{
          suppressed: false,
          sessionsLast7d: 21,
          sessionsLast30d: 80,
          activeUsersLast7d: 7,
          activeUsersLast30d: 11,
          activationRate: 0.5,
        }}
      />
    );
    expect(document.querySelector("[data-v2-engagement-stats-grid]")).toBeInTheDocument();
  });

  it("activeUsersLast30d ausente defensive → muestra 0", () => {
    render(
      <EngagementPanel
        engagement={{
          suppressed: false,
          sessionsLast7d: 21,
          sessionsLast30d: 80,
          activeUsersLast7d: 7,
          // activeUsersLast30d undefined
          activationRate: 0.5,
        }}
      />
    );
    expect(screen.getByTestId("engagement-stat-wau")).toHaveTextContent("0");
  });

  it("activationRate undefined defensive → activación '—'", () => {
    render(
      <EngagementPanel
        engagement={{
          suppressed: false,
          sessionsLast7d: 21,
          sessionsLast30d: 80,
          activeUsersLast7d: 7,
          activeUsersLast30d: 10,
          // activationRate undefined
        }}
      />
    );
    expect(screen.getByTestId("engagement-stat-activation")).toHaveTextContent("—");
  });

  it("totalActiveMembers no finite (NaN) defensive → ratio omitido", () => {
    render(
      <EngagementPanel
        engagement={{
          suppressed: false,
          sessionsLast7d: 21,
          sessionsLast30d: 80,
          activeUsersLast7d: 7,
          activeUsersLast30d: 10,
          activationRate: 0.5,
        }}
        totalActiveMembers={NaN}
      />
    );
    expect(screen.queryByText(/miembros del equipo/i)).toBeNull();
  });

  it("activeUsersLast7d=0 con sessionsLast30d>0 → empty state diferenciado", () => {
    render(
      <EngagementPanel
        engagement={{
          suppressed: false,
          sessionsLast7d: 0,
          sessionsLast30d: 12,
          activeUsersLast7d: 0,
          activeUsersLast30d: 3,
          activationRate: 0,
        }}
      />
    );
    expect(screen.getByText(/12 sesiones en los últimos 30 días/i)).toBeInTheDocument();
    expect(screen.getByText(/dejó de usar la plataforma esta semana/i)).toBeInTheDocument();
  });

  it("data-v2-engagement attribute presente en TODOS los branches", () => {
    const { rerender } = render(
      <EngagementPanel engagement={{ suppressed: true, n: 1 }} />
    );
    expect(document.querySelector("[data-v2-engagement]")).toBeInTheDocument();

    rerender(
      <EngagementPanel
        engagement={{
          suppressed: false,
          sessionsLast7d: 0,
          sessionsLast30d: 0,
          activeUsersLast7d: 0,
          activeUsersLast30d: 0,
          activationRate: 0,
        }}
      />
    );
    expect(document.querySelector("[data-v2-engagement]")).toBeInTheDocument();

    rerender(
      <EngagementPanel
        engagement={{
          suppressed: false,
          sessionsLast7d: 14,
          sessionsLast30d: 60,
          activeUsersLast7d: 4,
          activeUsersLast30d: 8,
          activationRate: 0.4,
        }}
      />
    );
    expect(document.querySelector("[data-v2-engagement]")).toBeInTheDocument();
  });
});
