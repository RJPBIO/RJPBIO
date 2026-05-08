/* TabTransitionWrapper.test — Phase Polish-Sub-Screens-Motion Capa 1.
   Pattern reuse RecommendationTransitionWrapper.test (Polish Tier 1) — mismo
   shape. Cubre fade-out/swap/fade-in cuando activeTab cambia + reduced-motion
   instant + same tab idempotente. */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import TabTransitionWrapper from "./TabTransitionWrapper";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

vi.mock("@/lib/a11y", async () => {
  const actual = await vi.importActual("@/lib/a11y");
  return { ...actual, useReducedMotion: vi.fn(() => false) };
});

import * as a11y from "@/lib/a11y";

describe("TabTransitionWrapper — Polish-Sub-Screens-Motion Capa 1", () => {
  it("primera mount renderea displayedTab inicial sin transition", () => {
    render(
      <TabTransitionWrapper activeTab="hoy">
        {(tab) => <div data-testid="screen">{tab}</div>}
      </TabTransitionWrapper>
    );
    const wrapper = document.querySelector("[data-v2-tab-transition]");
    expect(wrapper).toBeTruthy();
    expect(wrapper.getAttribute("data-active-tab")).toBe("hoy");
    expect(wrapper.getAttribute("data-transitioning")).toBe("false");
    expect(document.querySelector('[data-testid="screen"]').textContent).toBe("hoy");
  });

  it("activeTab igual entre re-renders → no transition triggered", () => {
    const { rerender } = render(
      <TabTransitionWrapper activeTab="hoy">
        {(tab) => <div data-testid="screen">{tab}</div>}
      </TabTransitionWrapper>
    );
    rerender(
      <TabTransitionWrapper activeTab="hoy">
        {(tab) => <div data-testid="screen">{tab}-updated</div>}
      </TabTransitionWrapper>
    );
    expect(document.querySelector("[data-v2-tab-transition]").getAttribute("data-transitioning")).toBe("false");
  });

  it("activeTab cambia (hoy→datos) → transitioning=true durante fade-out", () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <TabTransitionWrapper activeTab="hoy">
        {(tab) => <div data-testid="screen">{tab}</div>}
      </TabTransitionWrapper>
    );
    rerender(
      <TabTransitionWrapper activeTab="datos">
        {(tab) => <div data-testid="screen">{tab}</div>}
      </TabTransitionWrapper>
    );
    const wrapper = document.querySelector("[data-v2-tab-transition]");
    expect(wrapper.getAttribute("data-transitioning")).toBe("true");
    expect(wrapper.style.opacity).toBe("0");
    expect(document.querySelector('[data-testid="screen"]').textContent).toBe("hoy");
  });

  it("post fade-out → swap displayedTab al nuevo activeTab", () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <TabTransitionWrapper activeTab="hoy">
        {(tab) => <div data-testid="screen">{tab}</div>}
      </TabTransitionWrapper>
    );
    rerender(
      <TabTransitionWrapper activeTab="perfil">
        {(tab) => <div data-testid="screen">{tab}</div>}
      </TabTransitionWrapper>
    );
    act(() => { vi.advanceTimersByTime(180); });
    expect(document.querySelector('[data-testid="screen"]').textContent).toBe("perfil");
    act(() => { vi.advanceTimersByTime(20); });
    const wrapper = document.querySelector("[data-v2-tab-transition]");
    expect(wrapper.getAttribute("data-transitioning")).toBe("false");
    expect(wrapper.style.opacity).toBe("1");
    expect(wrapper.getAttribute("data-active-tab")).toBe("perfil");
  });

  it("reduced-motion → instant swap, sin transition data attr ni opacity", () => {
    a11y.useReducedMotion.mockReturnValue(true);
    const { rerender } = render(
      <TabTransitionWrapper activeTab="hoy">
        {(tab) => <div data-testid="screen">{tab}</div>}
      </TabTransitionWrapper>
    );
    rerender(
      <TabTransitionWrapper activeTab="coach">
        {(tab) => <div data-testid="screen">{tab}</div>}
      </TabTransitionWrapper>
    );
    const wrapper = document.querySelector("[data-v2-tab-transition]");
    expect(wrapper.getAttribute("data-transitioning")).toBe("false");
    expect(wrapper.getAttribute("data-active-tab")).toBe("coach");
    expect(document.querySelector('[data-testid="screen"]').textContent).toBe("coach");
    expect(wrapper.style.transition).toBe("none");
    a11y.useReducedMotion.mockReturnValue(false);
  });

  it("children non-function (ReactNode) → render directo", () => {
    render(
      <TabTransitionWrapper activeTab="hoy">
        <div data-testid="static-child">static</div>
      </TabTransitionWrapper>
    );
    expect(document.querySelector('[data-testid="static-child"]').textContent).toBe("static");
  });

  it("testid prop personalizado se aplica al wrapper", () => {
    render(
      <TabTransitionWrapper activeTab="hoy" testid="my-tab-trans">
        <span>x</span>
      </TabTransitionWrapper>
    );
    expect(document.querySelector('[data-testid="my-tab-trans"]')).toBeTruthy();
  });
});
