/* SectionEmergeWrapper.test — Phase Polish-Sub-Screens-Motion Capa 3.
   Cubre IO-trigger emergence + stagger delay + reduced-motion + IO fallback. */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import SectionEmergeWrapper from "./SectionEmergeWrapper";

let originalIO;
let observerInstances = [];

beforeEach(() => {
  vi.useFakeTimers();
  observerInstances = [];
  originalIO = global.IntersectionObserver;
  global.IntersectionObserver = class MockIO {
    constructor(callback, options) {
      this.callback = callback;
      this.options = options;
      this.observed = [];
      observerInstances.push(this);
    }
    observe(el) { this.observed.push(el); }
    unobserve(el) { this.observed = this.observed.filter((e) => e !== el); }
    disconnect() { this.observed = []; }
    trigger(isIntersecting = true) {
      this.callback([{ isIntersecting, target: this.observed[0] }]);
    }
  };
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
  global.IntersectionObserver = originalIO;
  vi.restoreAllMocks();
});

vi.mock("@/lib/a11y", async () => {
  const actual = await vi.importActual("@/lib/a11y");
  return { ...actual, useReducedMotion: vi.fn(() => false) };
});

import * as a11y from "@/lib/a11y";

describe("SectionEmergeWrapper — Polish-Sub-Screens-Motion Capa 3", () => {
  it("initial render: emerged=false → opacity 0 + translateY 16", () => {
    render(<SectionEmergeWrapper><div>x</div></SectionEmergeWrapper>);
    const w = document.querySelector("[data-v2-section-emerge]");
    expect(w.getAttribute("data-emerged")).toBe("false");
    expect(w.style.opacity).toBe("0");
    expect(w.style.transform).toBe("translateY(16px)");
  });

  it("IO triggers (isIntersecting=true) → emerged=true tras stagger 0", () => {
    render(<SectionEmergeWrapper staggerIndex={0}><div>x</div></SectionEmergeWrapper>);
    expect(observerInstances.length).toBe(1);
    act(() => { observerInstances[0].trigger(true); vi.advanceTimersByTime(10); });
    expect(document.querySelector("[data-v2-section-emerge]").getAttribute("data-emerged")).toBe("true");
  });

  it("staggerIndex=3 → emerge tras 150ms (3 × 50)", () => {
    render(<SectionEmergeWrapper staggerIndex={3}><div>x</div></SectionEmergeWrapper>);
    act(() => { observerInstances[0].trigger(true); });
    act(() => { vi.advanceTimersByTime(100); });
    expect(document.querySelector("[data-v2-section-emerge]").getAttribute("data-emerged")).toBe("false");
    act(() => { vi.advanceTimersByTime(100); });
    expect(document.querySelector("[data-v2-section-emerge]").getAttribute("data-emerged")).toBe("true");
  });

  it("IO non-intersecting → emerged stays false", () => {
    render(<SectionEmergeWrapper><div>x</div></SectionEmergeWrapper>);
    act(() => { observerInstances[0].trigger(false); vi.advanceTimersByTime(200); });
    expect(document.querySelector("[data-v2-section-emerge]").getAttribute("data-emerged")).toBe("false");
  });

  it("reduced-motion → emerged inmediato sin scroll-trigger", () => {
    a11y.useReducedMotion.mockReturnValue(true);
    render(<SectionEmergeWrapper><div>x</div></SectionEmergeWrapper>);
    const w = document.querySelector("[data-v2-section-emerge]");
    expect(w.getAttribute("data-emerged")).toBe("true");
    expect(w.style.transition).toBe("none");
    a11y.useReducedMotion.mockReturnValue(false);
  });

  it("IO undefined (older browser SSR) → emerged inmediato (defensive)", () => {
    global.IntersectionObserver = undefined;
    render(<SectionEmergeWrapper><div>x</div></SectionEmergeWrapper>);
    expect(document.querySelector("[data-v2-section-emerge]").getAttribute("data-emerged")).toBe("true");
  });

  it("observer.unobserve después de primera intersection (one-shot)", () => {
    render(<SectionEmergeWrapper><div>x</div></SectionEmergeWrapper>);
    expect(observerInstances[0].observed.length).toBe(1);
    act(() => { observerInstances[0].trigger(true); });
    expect(observerInstances[0].observed.length).toBe(0);
  });

  it("testid prop personalizado se aplica", () => {
    render(<SectionEmergeWrapper testid="my-emerge"><div>x</div></SectionEmergeWrapper>);
    expect(document.querySelector('[data-testid="my-emerge"]')).toBeTruthy();
  });

  it("staggerIndex negativo se clampa a 0 (defensive)", () => {
    render(<SectionEmergeWrapper staggerIndex={-5}><div>x</div></SectionEmergeWrapper>);
    act(() => { observerInstances[0].trigger(true); vi.advanceTimersByTime(10); });
    expect(document.querySelector("[data-v2-section-emerge]").getAttribute("data-emerged")).toBe("true");
  });

  it("children renderizados dentro del wrapper", () => {
    render(<SectionEmergeWrapper><div data-testid="kid">child</div></SectionEmergeWrapper>);
    expect(document.querySelector('[data-testid="kid"]').textContent).toBe("child");
  });
});
