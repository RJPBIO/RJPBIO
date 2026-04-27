import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KPITile } from "./KPITile";

describe("KPITile", () => {
  it("renders label, value, and sub", () => {
    render(<KPITile label="Sesiones" value="42" sub="último mes" />);
    expect(screen.getByText("Sesiones")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("último mes")).toBeInTheDocument();
  });

  it("applies tone via data-tone attribute", () => {
    const { container } = render(<KPITile label="X" value="1" tone="success" />);
    expect(container.querySelector(".bi-kpi-tile")).toHaveAttribute("data-tone", "success");
  });

  it("renders unit alongside value", () => {
    render(<KPITile label="Latencia" value="120" unit="ms" />);
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("ms")).toBeInTheDocument();
  });

  it("renders trend with positive arrow when pct > 0", () => {
    const { container } = render(<KPITile label="X" value="100" trend={5.2} />);
    expect(container.querySelector(".bi-kpi-trend")).toBeInTheDocument();
    expect(screen.getByText(/5\.2%/)).toBeInTheDocument();
  });

  it("does not render sparkline with single point", () => {
    const { container } = render(<KPITile label="X" value="1" spark={[5]} />);
    expect(container.querySelector(".bi-kpi-spark")).not.toBeInTheDocument();
  });

  it("renders sparkline with multi-point data", () => {
    const { container } = render(<KPITile label="X" value="1" spark={[1, 2, 3, 4]} />);
    expect(container.querySelector(".bi-kpi-spark")).toBeInTheDocument();
  });

  it("applies glow attribute when glow=true", () => {
    const { container } = render(<KPITile label="X" value="1" glow />);
    expect(container.querySelector(".bi-kpi-tile")).toHaveAttribute("data-glow", "1");
  });
});
