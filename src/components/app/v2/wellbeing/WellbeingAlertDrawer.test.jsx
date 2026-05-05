/* WellbeingAlertDrawer — Phase 6F SP-F
   Cubre: null guards, ModalShell mount con eyebrowTone correcto,
   crisis resources con tel: links, disclaimer SAPTEL siempre presente,
   primary CTA target/label, methodology footer. */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import WellbeingAlertDrawer from "./WellbeingAlertDrawer";

function makeAssessment(level, signals = []) {
  return {
    level,
    signals,
    metrics: {},
    snapshot: {
      disclaimer:
        "Indicador sugerente de patrones consistentes con agotamiento. NO es " +
        "diagnóstico médico ni reemplaza atención profesional. Si te encuentras " +
        "en crisis: SAPTEL 800-290-0024 (México).",
      methodology: "heuristic-retrospective",
      version: "v1",
    },
  };
}

function makeCopy(level) {
  if (level === "warn") {
    return {
      title: "Patrones consistentes con agotamiento",
      subtitle: "Múltiples señales sugieren agotamiento.",
      cta: { label: "Empezar Burnout Recovery", target: "/app/program/today" },
      severity: "warn",
    };
  }
  if (level === "alert") {
    return {
      title: "Múltiples señales de agotamiento",
      subtitle: "Tu wellbeing necesita atención.",
      cta: { label: "Ver recursos", target: "/app/program/today" },
      crisisLine: "SAPTEL 800-290-0024",
      severity: "danger",
    };
  }
  return { title: "Tu wellbeing se ve estable", subtitle: "OK", cta: null, severity: "info" };
}

describe("WellbeingAlertDrawer — Phase 6F SP-F", () => {
  it("retorna null cuando assessment o copy null", () => {
    const { container: c1 } = render(<WellbeingAlertDrawer assessment={null} copy={makeCopy("warn")} />);
    expect(c1.firstChild).toBeNull();
    const { container: c2 } = render(<WellbeingAlertDrawer assessment={makeAssessment("warn")} copy={null} />);
    expect(c2.firstChild).toBeNull();
  });

  it("renderiza ModalShell con title del copy", () => {
    render(
      <WellbeingAlertDrawer
        assessment={makeAssessment("warn", ["freqDrop"])}
        copy={makeCopy("warn")}
        onClose={vi.fn()}
      />
    );
    // ModalShell renders title via id="<testId>-title". Scoped query evita
    // multi-match si el copy se reusa en otros sub-textos.
    const titleEl = document.querySelector("#wellbeing-drawer-title");
    expect(titleEl).toBeInTheDocument();
    expect(titleEl.textContent).toMatch(/Patrones consistentes con agotamiento/i);
    expect(document.querySelector("[data-v2-wellbeing-drawer]")).toBeInTheDocument();
  });

  it("eyebrow incluye level uppercase", () => {
    render(
      <WellbeingAlertDrawer
        assessment={makeAssessment("alert")}
        copy={makeCopy("alert")}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText(/WELLBEING · ALERT/)).toBeInTheDocument();
  });

  it("renderiza WellbeingSignalsList con signals provistos", () => {
    render(
      <WellbeingAlertDrawer
        assessment={makeAssessment("warn", ["freqDrop", "hrvDecline"])}
        copy={makeCopy("warn")}
        onClose={vi.fn()}
      />
    );
    const rows = document.querySelectorAll("[data-v2-signal-row]");
    expect(rows).toHaveLength(2);
    expect(screen.getByText(/Frecuencia de sesiones declinó/i)).toBeInTheDocument();
    expect(screen.getByText(/Variabilidad cardíaca/i)).toBeInTheDocument();
  });

  it("muestra count de señales en eyebrow", () => {
    render(
      <WellbeingAlertDrawer
        assessment={makeAssessment("warn", ["freqDrop", "hrvDecline", "chronoDyssynchrony"])}
        copy={makeCopy("warn")}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText(/Señales detectadas · 3/i)).toBeInTheDocument();
  });

  it("primary CTA renderiza con label + target del copy", () => {
    render(
      <WellbeingAlertDrawer
        assessment={makeAssessment("warn")}
        copy={makeCopy("warn")}
        onClose={vi.fn()}
      />
    );
    const cta = screen.getByTestId("wellbeing-drawer-primary-cta");
    expect(cta.textContent).toMatch(/Empezar Burnout Recovery/i);
    expect(cta.getAttribute("href")).toBe("/app/program/today");
  });

  it("CTA NO renderiza cuando copy.cta es null", () => {
    render(
      <WellbeingAlertDrawer
        assessment={makeAssessment("ok")}
        copy={makeCopy("ok")}
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByTestId("wellbeing-drawer-primary-cta")).toBeNull();
  });

  it("crisis resources block muestra SAPTEL + Línea de la Vida con tel: links", () => {
    render(
      <WellbeingAlertDrawer
        assessment={makeAssessment("warn")}
        copy={makeCopy("warn")}
        onClose={vi.fn()}
      />
    );
    const saptel = screen.getByTestId("wellbeing-saptel-link");
    expect(saptel.getAttribute("href")).toBe("tel:8002900024");
    expect(saptel.textContent).toContain("800 290 0024");

    const linea = screen.getByTestId("wellbeing-linea-vida-link");
    expect(linea.getAttribute("href")).toBe("tel:8009112000");
    expect(linea.textContent).toContain("800 911 2000");

    const more = screen.getByTestId("wellbeing-resources-link");
    expect(more.getAttribute("href")).toBe("/app/resources/crisis");
  });

  it("disclaimer SAPTEL siempre presente en footer", () => {
    render(
      <WellbeingAlertDrawer
        assessment={makeAssessment("warn")}
        copy={makeCopy("warn")}
        onClose={vi.fn()}
      />
    );
    const disclaimer = document.querySelector("[data-v2-wellbeing-disclaimer]");
    expect(disclaimer).toBeInTheDocument();
    expect(disclaimer.textContent).toMatch(/SAPTEL/);
    expect(disclaimer.textContent).toMatch(/NO es diagnóstico/i);
  });

  it("methodology + version visible en footer", () => {
    render(
      <WellbeingAlertDrawer
        assessment={makeAssessment("warn")}
        copy={makeCopy("warn")}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText(/heuristic-retrospective/)).toBeInTheDocument();
    expect(screen.getByText(/Version v1/)).toBeInTheDocument();
  });

  it("ESC dispara onClose (ModalShell pattern)", () => {
    const onClose = vi.fn();
    render(
      <WellbeingAlertDrawer
        assessment={makeAssessment("warn")}
        copy={makeCopy("warn")}
        onClose={onClose}
      />
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
