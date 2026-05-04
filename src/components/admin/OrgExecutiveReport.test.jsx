/* OrgExecutiveReport — Phase 6F SP-D
   Cubre: null report, suppressed branch, full happy path render,
   BORRADOR watermark cuando NEXT_PUBLIC_NOM35_DOF_VERIFIED ≠ "true",
   isPrintMode oculta el PrintButton. */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import OrgExecutiveReport from "./OrgExecutiveReport";

// Mock recharts ResponsiveContainer (jsdom no calcula layout) para evitar warnings ruidosos.
vi.mock("recharts", async () => {
  const actual = await vi.importActual("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }) => (
      <div data-testid="responsive-mock" style={{ width: 400, height: 200 }}>{children}</div>
    ),
  };
});

const baseSnapshot = {
  generatedAt: new Date("2026-05-04T12:00:00Z"),
  version: "v1",
  kAnonThreshold: 5,
};

function makeReport(overrides = {}) {
  return {
    org: { id: "org_1", name: "Acme Corp", plan: "STARTER", activeMembers: 12 },
    period: {
      start: new Date("2026-02-04T00:00:00Z"),
      end: new Date("2026-05-04T00:00:00Z"),
      days: 90,
    },
    kpis: {
      activeMembers: 12,
      sessionsTotal: 128,
      sessionsPerActiveMember: 10.66,
      hrvDeltaMean: 5.5,
      moodDeltaMean: 1.3,
      programCompletionRate: 0.72,
      nom35Level: "bajo",
    },
    nom35: {
      summary: { suppressed: false, nivelPromedio: "bajo", avgTotal: 35 },
      trends: {},
    },
    instruments: { summary: {}, trends: {} },
    hrv: { trend: [], totalSamples: 0 },
    sessions: { total: 128 },
    topProtocols: [],
    programs: { suppressed: true, n: 2 },
    engagement: {},
    correlation: { suppressed: true, n: 2 },
    snapshot: baseSnapshot,
    ...overrides,
  };
}

beforeEach(() => {
  // Default sin DOF verified → BORRADOR visible
  delete process.env.NEXT_PUBLIC_NOM35_DOF_VERIFIED;
});

describe("OrgExecutiveReport — Phase 6F SP-D", () => {
  it("retorna null cuando report es null/undefined", () => {
    const { container: c1 } = render(<OrgExecutiveReport report={null} />);
    expect(c1.firstChild).toBeNull();
    const { container: c2 } = render(<OrgExecutiveReport report={undefined} />);
    expect(c2.firstChild).toBeNull();
  });

  it("renderiza branch suppressed con mensaje + footer + watermark", () => {
    const report = {
      org: { id: "org_x", name: "Tiny Co", activeMembers: 3 },
      period: { start: new Date(), end: new Date(), days: 90 },
      suppressed: true,
      reason: "k_anonymity",
      message: "Reporte requiere mínimo 5 miembros activos. Tu organización tiene 3.",
      snapshot: baseSnapshot,
    };
    render(<OrgExecutiveReport report={report} />);
    expect(screen.getByText(/Tiny Co/i)).toBeInTheDocument();
    expect(screen.getByText(/Reporte requiere mínimo 5 miembros/i)).toBeInTheDocument();
    expect(screen.getByText(/k-anonimato ≥ 5/i)).toBeInTheDocument();
    // Watermark visible (DOF NO verified default)
    expect(document.querySelector("[data-v2-borrador-watermark]")).toBeInTheDocument();
  });

  it("renderiza happy path con header + KpiHero + NOM-35 + HRV + Programs + Correlation + footer + PrintButton", () => {
    render(<OrgExecutiveReport report={makeReport()} />);
    expect(document.querySelector("[data-v2-executive-report]")).toBeInTheDocument();
    expect(screen.getByText(/Acme Corp/i)).toBeInTheDocument();
    expect(document.querySelector("[data-v2-kpi-hero]")).toBeInTheDocument();
    expect(document.querySelector("[data-v2-nom35-trends]")).toBeInTheDocument();
    expect(document.querySelector("[data-v2-hrv-trends]")).toBeInTheDocument();
    expect(document.querySelector("[data-v2-programs-cohort]")).toBeInTheDocument();
    expect(document.querySelector("[data-v2-correlation]")).toBeInTheDocument();
    expect(document.querySelector("[data-v2-report-footer]")).toBeInTheDocument();
    expect(screen.getByTestId("report-print-button")).toBeInTheDocument();
  });

  it("isPrintMode oculta PrintButton + print-actions block", () => {
    render(<OrgExecutiveReport report={makeReport()} isPrintMode={true} />);
    expect(screen.queryByTestId("report-print-button")).toBeNull();
    expect(document.querySelector("[data-v2-print-actions]")).toBeNull();
  });

  it("BORRADOR watermark se oculta cuando NEXT_PUBLIC_NOM35_DOF_VERIFIED='true'", () => {
    process.env.NEXT_PUBLIC_NOM35_DOF_VERIFIED = "true";
    render(<OrgExecutiveReport report={makeReport()} />);
    expect(document.querySelector("[data-v2-borrador-watermark]")).toBeNull();
  });

  it("BORRADOR watermark visible por default (DOF NO verified)", () => {
    render(<OrgExecutiveReport report={makeReport()} />);
    const wm = document.querySelector("[data-v2-borrador-watermark]");
    expect(wm).toBeInTheDocument();
    expect(wm.textContent).toMatch(/borrador/i);
  });

  it("muestra periodo + miembros + generated en header", () => {
    render(<OrgExecutiveReport report={makeReport()} />);
    expect(screen.getByText(/12 miembros activos/i)).toBeInTheDocument();
    expect(screen.getByText(/90 días/i)).toBeInTheDocument();
    expect(screen.getByText(/Generado/i)).toBeInTheDocument();
  });

  it("KpiHero renderiza counts + Δ + adhesión", () => {
    render(<OrgExecutiveReport report={makeReport()} />);
    expect(screen.getByText("128")).toBeInTheDocument(); // sessionsTotal
    expect(screen.getByText("12")).toBeInTheDocument(); // activeMembers
    expect(screen.getByText("72")).toBeInTheDocument(); // programCompletionRate (%)
    // nom35 nivel as text — múltiples ocurrencias OK ("Bajo" en KPI + summary)
    expect(screen.getAllByText(/Bajo/i).length).toBeGreaterThan(0);
  });

  it("ComplianceFooter incluye k-anon + LFPDPPP + Cohen + NOM-035", () => {
    render(<OrgExecutiveReport report={makeReport()} />);
    expect(screen.getByText(/LFPDPPP \/ GDPR Art-89/i)).toBeInTheDocument();
    expect(screen.getByText(/Bio-Ignición no es dispositivo médico/i)).toBeInTheDocument();
    expect(screen.getByText(/Cohen 1983 \(PSS-4\)/i)).toBeInTheDocument();
    expect(screen.getByText(/NOM-035-STPS-2018 \(10 dominios oficiales DOF\)/i)).toBeInTheDocument();
  });

  it("ProgramsCohort suppressed muestra mensaje no-disponible", () => {
    render(<OrgExecutiveReport report={makeReport()} />);
    // n=2 < 5
    expect(screen.getByText(/Comparativa no disponible/i)).toBeInTheDocument();
  });

  it("Correlation suppressed muestra mensaje sin-muestra", () => {
    render(<OrgExecutiveReport report={makeReport()} />);
    expect(screen.getByText(/Mínimo 5 personas con ambas mediciones/i)).toBeInTheDocument();
  });
});
