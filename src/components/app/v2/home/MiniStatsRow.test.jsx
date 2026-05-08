/* MiniStatsRow.test — Phase 6H Premium-Fix2. */
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import MiniStatsRow from "./MiniStatsRow";

afterEach(() => cleanup());

describe("MiniStatsRow — Phase 6H Premium-Fix2", () => {
  it("renderea N stats con grid template columns dinámico", () => {
    render(<MiniStatsRow stats={[
      { label: "SESIONES", value: "3", testid: "mini-sessions" },
      { label: "RACHA", value: "2d", testid: "mini-streak" },
      { label: "VENTANA", value: "22:00", testid: "mini-window" },
    ]} />);
    const row = document.querySelector("[data-v2-mini-stats-row]");
    expect(row).toBeTruthy();
    expect(row.style.gridTemplateColumns).toBe("repeat(3, 1fr)");
    expect(document.querySelectorAll("[data-v2-mini-stat]")).toHaveLength(3);
  });

  it("primera stat sin separator, resto con borderInlineStart", () => {
    render(<MiniStatsRow stats={[
      { label: "A", value: "1" },
      { label: "B", value: "2" },
      { label: "C", value: "3" },
    ]} />);
    const stats = document.querySelectorAll("[data-v2-mini-stat]");
    expect(stats[0].style.borderInlineStart).toBe("none");
    expect(stats[1].style.borderInlineStart).not.toBe("none");
    expect(stats[2].style.borderInlineStart).not.toBe("none");
  });

  it("empty array → return null (no row)", () => {
    const { container } = render(<MiniStatsRow stats={[]} />);
    expect(container.querySelector("[data-v2-mini-stats-row]")).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it("stats undefined / no array → return null", () => {
    const { container: c1 } = render(<MiniStatsRow stats={null} />);
    expect(c1.firstChild).toBeNull();
    cleanup();
    const { container: c2 } = render(<MiniStatsRow />);
    expect(c2.firstChild).toBeNull();
  });

  it("renderea label + value de cada stat", () => {
    render(<MiniStatsRow stats={[
      { label: "SESIONES", value: "3", testid: "mini-sessions" },
      { label: "RACHA", value: "2d", testid: "mini-streak" },
    ]} />);
    expect(document.querySelector('[data-testid="mini-sessions"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="mini-sessions"]').textContent).toContain("SESIONES");
    expect(document.querySelector('[data-testid="mini-sessions"]').textContent).toContain("3");
    expect(document.querySelector('[data-testid="mini-streak"]').textContent).toContain("2d");
  });

  it("acepta 2 stats (no fija a 3)", () => {
    render(<MiniStatsRow stats={[
      { label: "A", value: "1" },
      { label: "B", value: "2" },
    ]} />);
    const row = document.querySelector("[data-v2-mini-stats-row]");
    expect(row.style.gridTemplateColumns).toBe("repeat(2, 1fr)");
    expect(document.querySelectorAll("[data-v2-mini-stat]")).toHaveLength(2);
  });
});
