/* ProgressBar.test — Phase 6H Premium-Fix2.
   Cubre el componente extraído desde LearningView.jsx. Mantiene API
   `{ value, max }` compatible con caller existing + valida props
   opcionales nuevos (label, testid, variant). */
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import ProgressBar from "./ProgressBar";

afterEach(() => cleanup());

describe("ProgressBar — Phase 6H Premium-Fix2", () => {
  it("renderea bar con scaleX % correcto (3/5 = 60%)", () => {
    render(<ProgressBar value={3} max={5} />);
    const indicator = document.querySelector("[data-progress-indicator]");
    expect(indicator).toBeTruthy();
    expect(indicator.style.transform).toBe("scaleX(0.6)");
  });

  it("clamp 0-100% para inputs invalid", () => {
    render(<ProgressBar value={10} max={5} />);
    const indicator = document.querySelector("[data-progress-indicator]");
    expect(indicator.style.transform).toBe("scaleX(1)");
    cleanup();

    render(<ProgressBar value={-5} max={5} />);
    const indicator2 = document.querySelector("[data-progress-indicator]");
    expect(indicator2.style.transform).toBe("scaleX(0)");
  });

  it("preserva data-v2-learning-progressbar selector + aria attrs (anti-regression LearningView)", () => {
    render(<ProgressBar value={3} max={5} />);
    const bar = document.querySelector("[data-v2-learning-progressbar]");
    expect(bar).toBeTruthy();
    expect(bar.getAttribute("role")).toBe("progressbar");
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("5");
    expect(bar.getAttribute("aria-valuenow")).toBe("3");
  });

  it("variant=mini renderea bar 2px height", () => {
    render(<ProgressBar value={3} max={5} variant="mini" />);
    const wrapper = document.querySelector("[data-v2-progress-bar]");
    expect(wrapper.getAttribute("data-variant")).toBe("mini");
    const bar = document.querySelector("[data-v2-learning-progressbar]");
    expect(bar.style.height).toBe("2px");
  });

  it("variant=standard (default) renderea bar 4px height", () => {
    render(<ProgressBar value={3} max={5} />);
    const wrapper = document.querySelector("[data-v2-progress-bar]");
    expect(wrapper.getAttribute("data-variant")).toBe("standard");
    const bar = document.querySelector("[data-v2-learning-progressbar]");
    expect(bar.style.height).toBe("4px");
  });

  it("label opcional — sin label no renderea span eyebrow", () => {
    render(<ProgressBar value={3} max={5} />);
    const wrapper = document.querySelector("[data-v2-progress-bar]");
    expect(wrapper.querySelector("span")).toBeNull();
  });

  it("label presente — renderea span con texto eyebrow uppercase", () => {
    render(<ProgressBar value={3} max={5} label="HASTA TU TRAYECTORIA" />);
    const wrapper = document.querySelector("[data-v2-progress-bar]");
    const span = wrapper.querySelector("span");
    expect(span).toBeTruthy();
    expect(span.textContent).toBe("HASTA TU TRAYECTORIA");
  });

  it("testid se aplica a wrapper externo", () => {
    render(<ProgressBar value={3} max={5} testid="coldstart-progress" />);
    const wrapper = document.querySelector('[data-testid="coldstart-progress"]');
    expect(wrapper).toBeTruthy();
    // boolean attribute presente (valor exacto puede variar entre runtimes)
    expect(wrapper.hasAttribute("data-v2-progress-bar")).toBe(true);
  });

  it("max=0 no causa NaN (defensive)", () => {
    render(<ProgressBar value={3} max={0} />);
    const indicator = document.querySelector("[data-progress-indicator]");
    // (3/0) * 100 = Infinity → clamp a 100 → scaleX(1)
    expect(indicator.style.transform).toBe("scaleX(1)");
  });
});
