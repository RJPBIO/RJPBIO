import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HelpTooltip from "./HelpTooltip";

describe("HelpTooltip", () => {
  it("renders trigger with default aria-label", () => {
    render(<HelpTooltip>contenido</HelpTooltip>);
    expect(screen.getByRole("button", { name: /ayuda contextual/i })).toBeInTheDocument();
  });

  it("uses custom aria-label", () => {
    render(<HelpTooltip label="Más info">contenido</HelpTooltip>);
    expect(screen.getByRole("button", { name: /más info/i })).toBeInTheDocument();
  });

  it("hides bubble by default", () => {
    render(<HelpTooltip>secret</HelpTooltip>);
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("shows bubble on hover", () => {
    render(<HelpTooltip>visible-on-hover</HelpTooltip>);
    fireEvent.mouseEnter(screen.getByRole("button"));
    expect(screen.getByText("visible-on-hover")).toBeInTheDocument();
  });

  it("toggles bubble on click", () => {
    render(<HelpTooltip>click-toggle</HelpTooltip>);
    const trigger = screen.getByRole("button");
    fireEvent.click(trigger);
    expect(screen.getByText("click-toggle")).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.queryByText("click-toggle")).not.toBeInTheDocument();
  });

  it("applies placement attribute", () => {
    const { container } = render(<HelpTooltip placement="right">x</HelpTooltip>);
    expect(container.querySelector(".bi-help")).toHaveAttribute("data-placement", "right");
  });
});
