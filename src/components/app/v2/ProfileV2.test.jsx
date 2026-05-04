/* ProfileV2.test — Phase 6D SP3 fixtures cleanup. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock dynamic loaders just like AppV2Root.test.jsx pattern — keeps things
// fast and predictable. ProfileV2 itself imports SubViews directly (no
// dynamic), so we don't need the dynamic mock — but lib/audio is heavy.
vi.mock("../../../lib/audio", () => ({}));
// Mock SubRoutesList rendering (its primitives are tested elsewhere).

import ProfileV2 from "./ProfileV2";
import { useStore } from "@/store/useStore";

beforeEach(() => {
  // Phase 6D SP3 — reset slots que ProfileV2 lee. Sin esto, tests acumulan
  // state entre runs (otros tests llaman setUserEmail/logInstrument/etc).
  useStore.setState({
    _loaded: true,
    _userEmail: null,
    welcomeDone: true,
    onboardingComplete: true,
    totalSessions: 0,
    history: [],
    streak: 0,
    achievements: [],
    chronotype: null,
    instruments: [],
  });
});

describe("ProfileV2 — Phase 6D SP3 IdentityHeader empty/populated", () => {
  it("isEmpty=true (sin sessions) → muestra 'Bienvenido' empty header, NO fixture 'Operador Neural'", () => {
    render(<ProfileV2 />);
    // Empty state honesto.
    expect(screen.getByText(/Bienvenido/)).toBeTruthy();
    expect(screen.getByText(/Tu progreso aparece aquí/)).toBeTruthy();
    // Confirma que NO se filtra el fixture eliminado.
    expect(screen.queryByText(/Operador Neural/)).toBeNull();
    expect(screen.queryByText(/operador@bio-ignicion\.local/)).toBeNull();
  });

  it("muestra email del store cuando _userEmail está set y user empty", () => {
    useStore.setState({ _userEmail: "ana.gomez@empresa.com" });
    render(<ProfileV2 />);
    expect(screen.getByText("ana.gomez@empresa.com")).toBeTruthy();
    // Display name derivado del local-part del email.
    expect(screen.getByText(/Bienvenido, ana\.gomez/)).toBeTruthy();
  });

  it("populated header con email + level del LVL ladder cuando totalSessions > 0", () => {
    useStore.setState({
      _userEmail: "test@example.com",
      totalSessions: 1,
      history: [{ ts: Date.now(), c: 60 }],
    });
    render(<ProfileV2 />);
    // El level "Delta" corresponde a 1 sesión (LVL[0]: m=0, mx=3).
    expect(screen.getByText(/NIVEL · δ Delta/i)).toBeTruthy();
    // NO el hardcoded "NIVEL 3".
    expect(screen.queryByText(/NIVEL · ☆ Ignición/i)).toBeNull();
  });

  it("level escala con totalSessions — Theta a partir de 3 sesiones", () => {
    useStore.setState({
      _userEmail: "test@example.com",
      totalSessions: 5,
      history: Array.from({ length: 5 }, (_, i) => ({ ts: Date.now() - i * 86400000, c: 60 })),
    });
    render(<ProfileV2 />);
    // LVL[1]: Theta m=3, mx=10. 5 sesiones → Theta.
    expect(screen.getByText(/NIVEL · θ Theta/i)).toBeTruthy();
  });

  it("StatsHighlights NO se renderiza cuando isEmpty=true", () => {
    render(<ProfileV2 />);
    // Labels distintivas de StatsHighlights.
    expect(screen.queryByText(/SESIONES TOTALES/)).toBeNull();
    expect(screen.queryByText(/DÍAS · RACHA/)).toBeNull();
    expect(screen.queryByText(/LOGROS/)).toBeNull();
  });

  it("StatsHighlights se renderiza con valores reales cuando hay sessions", () => {
    useStore.setState({
      _userEmail: "test@example.com",
      totalSessions: 3,
      history: [{ ts: Date.now(), c: 60 }, { ts: Date.now(), c: 65 }, { ts: Date.now(), c: 70 }],
      streak: 2,
      achievements: ["first_session", "calibrated"],
    });
    render(<ProfileV2 />);
    // Stats labels visibles.
    expect(screen.getByText(/SESIONES TOTALES/)).toBeTruthy();
    expect(screen.getByText(/DÍAS · RACHA/)).toBeTruthy();
    expect(screen.getByText(/LOGROS/)).toBeTruthy();
    // Valores reales (no fixture 47 / 7 / 8).
    // Note: usa getAllByText porque "3" puede aparecer en otros lugares.
    const sessionsValue = screen.getAllByText("3");
    expect(sessionsValue.length).toBeGreaterThan(0);
  });
});

describe("ProfileV2 — Phase 6D SP3 sub-routes list (no fixture descriptors)", () => {
  it("Salud del motor: descriptor honesto cuando totalSessions === 0", () => {
    render(<ProfileV2 />);
    expect(screen.getByText(/Sin datos · primera sesión pendiente/i)).toBeTruthy();
    // Anti-regression: NO aparece "Personalizado · 47 sesiones" hardcoded.
    expect(screen.queryByText(/Personalizado · 47 sesiones/)).toBeNull();
  });

  it("Salud del motor: descriptor 'Conociéndonos · X de 5' cuando totalSessions < 5", () => {
    useStore.setState({
      totalSessions: 2,
      history: [{ ts: Date.now() }, { ts: Date.now() }],
    });
    render(<ProfileV2 />);
    expect(screen.getByText(/Conociéndonos · 2 de 5 sesiones/i)).toBeTruthy();
  });

  it("Seguridad: descriptor genérico, NO fixture 'MFA activo · 2 dispositivos'", () => {
    render(<ProfileV2 />);
    expect(screen.getByText(/Ver MFA, sesiones y dispositivos/i)).toBeTruthy();
    expect(screen.queryByText(/MFA activo · 2 dispositivos/)).toBeNull();
  });
});
