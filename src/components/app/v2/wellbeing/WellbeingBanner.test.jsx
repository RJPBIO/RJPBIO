/* WellbeingBanner — Phase 6F SP-F
   Cubre: Decision A3 (gate por totalSessions≥1), Decision B3 (no auto-mount
   drawer), level=warn renderiza, level=alert + SAPTEL CTA, ok/watch silencio. */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("@/hooks/useWellbeingTrends", () => ({
  useWellbeingTrends: vi.fn(),
}));
// Mock recharts dependency chain (drawer renders signals + crisis bloque
// que NO usa recharts; pero AlertDrawer sí monta children — keep simple).

import WellbeingBanner from "./WellbeingBanner";
import { useWellbeingTrends } from "@/hooks/useWellbeingTrends";

beforeEach(() => {
  vi.clearAllMocks();
});

function setHook({ data = null, loading = false, error = null } = {}) {
  useWellbeingTrends.mockReturnValue({
    data,
    loading,
    error,
    refetch: vi.fn(),
  });
}

function makeAssessment(level, signals = []) {
  return {
    assessment: {
      level,
      signals,
      metrics: {},
      snapshot: { disclaimer: "test disclaimer SAPTEL", methodology: "heuristic-retrospective", version: "v1" },
    },
    copy: {
      title: `Title for ${level}`,
      subtitle: `Subtitle for ${level}`,
      cta: level === "warn" ? { label: "Empezar Burnout Recovery", target: "/app/program/today" } : null,
      crisisLine: level === "alert" ? "SAPTEL 800-290-0024" : undefined,
      severity: level === "alert" ? "danger" : "warn",
    },
    period: { days: 28 },
  };
}

describe("WellbeingBanner — Phase 6F SP-F", () => {
  it("Decision A3: NO renderiza cuando totalSessions=0", () => {
    setHook({ data: makeAssessment("warn") });
    const { container } = render(<WellbeingBanner totalSessions={0} />);
    expect(container.firstChild).toBeNull();
    // Hook tampoco debe activarse semantically — pero como react-hooks corren
    // siempre, sólo verificamos que el render output es vacío.
  });

  it("Decision A3: SÍ renderiza cuando totalSessions>=1 + level=warn", () => {
    setHook({ data: makeAssessment("warn") });
    render(<WellbeingBanner totalSessions={3} />);
    const banner = document.querySelector("[data-v2-wellbeing-banner][data-level='warn']");
    expect(banner).toBeInTheDocument();
    expect(banner.textContent).toContain("Title for warn");
  });

  it("NO renderiza cuando level=ok", () => {
    setHook({ data: makeAssessment("ok") });
    const { container } = render(<WellbeingBanner totalSessions={5} />);
    expect(container.firstChild).toBeNull();
  });

  it("NO renderiza cuando level=watch (UX silencio para evitar spam)", () => {
    setHook({ data: makeAssessment("watch") });
    const { container } = render(<WellbeingBanner totalSessions={5} />);
    expect(container.firstChild).toBeNull();
  });

  it("renderiza cuando level=warn con CTA detalle", () => {
    setHook({ data: makeAssessment("warn") });
    render(<WellbeingBanner totalSessions={5} />);
    expect(screen.getByTestId("wellbeing-banner-detail-cta")).toBeInTheDocument();
    // SAPTEL CTA NO presente en warn (solo en alert)
    expect(screen.queryByTestId("wellbeing-banner-saptel-cta")).toBeNull();
  });

  it("renderiza cuando level=alert con CTA SAPTEL adicional", () => {
    setHook({ data: makeAssessment("alert") });
    render(<WellbeingBanner totalSessions={5} />);
    expect(screen.getByTestId("wellbeing-banner-detail-cta")).toBeInTheDocument();
    const saptel = screen.getByTestId("wellbeing-banner-saptel-cta");
    expect(saptel).toBeInTheDocument();
    expect(saptel.getAttribute("href")).toBe("tel:8002900024");
  });

  it("eyebrow muestra 'Wellbeing · atención' (NO 'burnout score')", () => {
    setHook({ data: makeAssessment("alert") });
    render(<WellbeingBanner totalSessions={5} />);
    const banner = document.querySelector("[data-v2-wellbeing-banner]");
    expect(banner.textContent.toLowerCase()).toContain("wellbeing");
    expect(banner.textContent.toLowerCase()).not.toContain("burnout score");
    expect(banner.textContent.toLowerCase()).not.toContain("predicción");
  });

  it("Decision B3: NO auto-monta drawer (drawer cerrado al inicio)", () => {
    setHook({ data: makeAssessment("warn") });
    render(<WellbeingBanner totalSessions={5} />);
    // Drawer se reconoce por data-v2-wellbeing-drawer en su árbol
    expect(document.querySelector("[data-v2-wellbeing-drawer]")).toBeNull();
  });

  it("Tap detalle abre drawer con SignalsList", async () => {
    setHook({
      data: makeAssessment("warn", ["freqDrop", "hrvDecline"]),
    });
    render(<WellbeingBanner totalSessions={5} />);
    fireEvent.click(screen.getByTestId("wellbeing-banner-detail-cta"));
    await waitFor(() => {
      expect(document.querySelector("[data-v2-wellbeing-drawer]")).toBeInTheDocument();
    });
  });

  it("NO renderiza durante loading (evita flash)", () => {
    setHook({ loading: true, data: null });
    const { container } = render(<WellbeingBanner totalSessions={5} />);
    expect(container.firstChild).toBeNull();
  });

  it("NO renderiza cuando hook retorna error", () => {
    setHook({ data: null, error: { type: "server" } });
    const { container } = render(<WellbeingBanner totalSessions={5} />);
    expect(container.firstChild).toBeNull();
  });

  it("aria-live polite para accessibility", () => {
    setHook({ data: makeAssessment("warn") });
    render(<WellbeingBanner totalSessions={5} />);
    const banner = document.querySelector("[data-v2-wellbeing-banner]");
    expect(banner.getAttribute("role")).toBe("alert");
    expect(banner.getAttribute("aria-live")).toBe("polite");
  });
});
