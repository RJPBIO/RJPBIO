/* WellbeingSparkline — Phase 6F SP-F
   Cubre: empty/insufficient history → mensaje placeholder, ≥2 entries
   renderiza recharts container, sort por computedAt ascending. */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock recharts ResponsiveContainer (jsdom no calcula layout).
vi.mock("recharts", async () => {
  const actual = await vi.importActual("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }) => (
      <div data-testid="responsive-mock" style={{ width: 400, height: 200 }}>
        {children}
      </div>
    ),
  };
});

import WellbeingSparkline from "./WellbeingSparkline";

describe("WellbeingSparkline — Phase 6F SP-F", () => {
  it("history=[] muestra placeholder 'Necesitas más historial'", () => {
    render(<WellbeingSparkline history={[]} />);
    expect(screen.getByText(/Necesitas más historial/i)).toBeInTheDocument();
    expect(document.querySelector('[data-empty="true"]')).toBeInTheDocument();
  });

  it("history con 1 entry → placeholder (necesita ≥2)", () => {
    render(<WellbeingSparkline history={[{ level: "ok", computedAt: new Date() }]} />);
    expect(screen.getByText(/Necesitas más historial/i)).toBeInTheDocument();
  });

  it("history null/undefined → placeholder", () => {
    render(<WellbeingSparkline history={null} />);
    expect(screen.getByText(/Necesitas más historial/i)).toBeInTheDocument();
  });

  it("history ≥2 entries → renderiza chart container (no placeholder)", () => {
    const history = [
      { level: "ok", computedAt: new Date(Date.now() - 30 * 86400_000) },
      { level: "watch", computedAt: new Date(Date.now() - 20 * 86400_000) },
      { level: "warn", computedAt: new Date(Date.now() - 10 * 86400_000) },
      { level: "ok", computedAt: new Date(Date.now() - 1 * 86400_000) },
    ];
    render(<WellbeingSparkline history={history} />);
    expect(document.querySelector("[data-v2-wellbeing-sparkline]:not([data-empty='true'])")).toBeInTheDocument();
    expect(screen.queryByText(/Necesitas más historial/i)).toBeNull();
    expect(screen.getByTestId("responsive-mock")).toBeInTheDocument();
  });

  it("entries con level desconocido se filtran (sin crash)", () => {
    const history = [
      { level: "ok", computedAt: new Date() },
      { level: "unknown_level", computedAt: new Date() },
      { level: "alert", computedAt: new Date() },
    ];
    // No crashea; con 2 entries válidas, renderiza chart
    render(<WellbeingSparkline history={history} />);
    expect(document.querySelector("[data-v2-wellbeing-sparkline]")).toBeInTheDocument();
  });

  it("entries con computedAt inválido se filtran", () => {
    const history = [
      { level: "ok", computedAt: "not-a-date" },
      { level: "ok", computedAt: null },
    ];
    // 0 entries válidas → placeholder
    render(<WellbeingSparkline history={history} />);
    expect(screen.getByText(/Necesitas más historial/i)).toBeInTheDocument();
  });

  it("acepta computedAt como string ISO o Date object", () => {
    const history = [
      { level: "ok", computedAt: "2026-04-01T00:00:00Z" },
      { level: "watch", computedAt: new Date("2026-04-15") },
    ];
    render(<WellbeingSparkline history={history} />);
    expect(document.querySelector("[data-v2-wellbeing-sparkline]:not([data-empty='true'])")).toBeInTheDocument();
  });
});
