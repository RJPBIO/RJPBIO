/* CrisisFAB.test — Phase 6 SP4 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CrisisFAB from "./CrisisFAB";

describe("CrisisFAB", () => {
  it("renderiza con label SOS y aria-label correcto", () => {
    render(<CrisisFAB onOpenSheet={() => {}} />);
    const btn = screen.getByRole("button", { name: /Acceso rápido a protocolo de crisis/i });
    expect(btn).toBeTruthy();
    expect(btn.textContent).toMatch(/SOS/);
  });

  it("dispara onOpenSheet al click", () => {
    const onOpen = vi.fn();
    render(<CrisisFAB onOpenSheet={onOpen} />);
    screen.getByRole("button").click();
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("posicionado fixed con zIndex>=50 (encima de BottomNav)", () => {
    render(<CrisisFAB onOpenSheet={() => {}} />);
    const btn = screen.getByRole("button");
    expect(btn.style.position).toBe("fixed");
    expect(Number(btn.style.zIndex)).toBeGreaterThanOrEqual(50);
  });

  it("tap target ≥44px", () => {
    render(<CrisisFAB onOpenSheet={() => {}} />);
    const btn = screen.getByRole("button");
    expect(parseInt(btn.style.minWidth, 10)).toBeGreaterThanOrEqual(44);
    expect(parseInt(btn.style.minHeight, 10)).toBeGreaterThanOrEqual(44);
  });

  it("color phosphorCyan en border + label", () => {
    render(<CrisisFAB onOpenSheet={() => {}} />);
    const btn = screen.getByRole("button");
    expect(btn.style.color.toLowerCase()).toContain("rgb(34, 211, 238)");
  });
});
