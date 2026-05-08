/* SubScreenMountWrapper.test — Phase Polish-Sub-Screens-Motion Capa 2. */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import SubScreenMountWrapper from "./SubScreenMountWrapper";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  cleanup();
  vi.restoreAllMocks();
});

vi.mock("@/lib/a11y", async () => {
  const actual = await vi.importActual("@/lib/a11y");
  return { ...actual, useReducedMotion: vi.fn(() => false) };
});

import * as a11y from "@/lib/a11y";

describe("SubScreenMountWrapper — Polish-Sub-Screens-Motion Capa 2", () => {
  it("initial render: mounted=false → opacity 0 + translateY 12", () => {
    render(<SubScreenMountWrapper><div>x</div></SubScreenMountWrapper>);
    const w = document.querySelector("[data-v2-sub-screen-mount]");
    expect(w.getAttribute("data-mounted")).toBe("false");
    expect(w.style.opacity).toBe("0");
    expect(w.style.transform).toBe("translateY(12px)");
  });

  it("after delay 0 (default): mounted=true tras siguiente tick", () => {
    render(<SubScreenMountWrapper><div>x</div></SubScreenMountWrapper>);
    act(() => { vi.advanceTimersByTime(20); });
    const w = document.querySelector("[data-v2-sub-screen-mount]");
    expect(w.getAttribute("data-mounted")).toBe("true");
    expect(w.style.opacity).toBe("1");
    expect(w.style.transform).toBe("translateY(0)");
  });

  it("custom delay respected", () => {
    render(<SubScreenMountWrapper delay={300}><div>x</div></SubScreenMountWrapper>);
    act(() => { vi.advanceTimersByTime(100); });
    expect(document.querySelector("[data-v2-sub-screen-mount]").getAttribute("data-mounted")).toBe("false");
    act(() => { vi.advanceTimersByTime(250); });
    expect(document.querySelector("[data-v2-sub-screen-mount]").getAttribute("data-mounted")).toBe("true");
  });

  it("reduced-motion → mounted=true inmediato sin transition", () => {
    a11y.useReducedMotion.mockReturnValue(true);
    render(<SubScreenMountWrapper><div>x</div></SubScreenMountWrapper>);
    const w = document.querySelector("[data-v2-sub-screen-mount]");
    expect(w.getAttribute("data-mounted")).toBe("true");
    expect(w.style.transition).toBe("none");
    expect(w.style.opacity).toBe("1");
    a11y.useReducedMotion.mockReturnValue(false);
  });

  it("testid prop personalizado se aplica", () => {
    render(<SubScreenMountWrapper testid="my-mount"><div>x</div></SubScreenMountWrapper>);
    expect(document.querySelector('[data-testid="my-mount"]')).toBeTruthy();
  });

  it("children renderizados dentro del wrapper", () => {
    render(<SubScreenMountWrapper><div data-testid="kid">child</div></SubScreenMountWrapper>);
    expect(document.querySelector('[data-testid="kid"]').textContent).toBe("child");
  });
});
