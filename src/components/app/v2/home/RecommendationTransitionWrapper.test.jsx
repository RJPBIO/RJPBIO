/* RecommendationTransitionWrapper.test — Phase Polish-Tier-1 Gap-3.
   Cubre transition behavior cuando transitionKey cambia: fade-out 180ms
   → swap displayed → fade-in 220ms. Reduced-motion: instant swap.
   Same key prop: refresh sin animation. */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import RecommendationTransitionWrapper from "./RecommendationTransitionWrapper";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

vi.mock("@/lib/a11y", async () => {
  const actual = await vi.importActual("@/lib/a11y");
  return {
    ...actual,
    useReducedMotion: vi.fn(() => false),
  };
});

import * as a11y from "@/lib/a11y";

describe("RecommendationTransitionWrapper — Polish-Tier-1 Gap-3", () => {
  it("primera mount renderea children direct sin transition", () => {
    render(
      <RecommendationTransitionWrapper transitionKey="proto-a">
        <div data-testid="card">Proto A</div>
      </RecommendationTransitionWrapper>
    );
    const wrapper = document.querySelector("[data-v2-recommendation-transition]");
    expect(wrapper).toBeTruthy();
    expect(wrapper.getAttribute("data-transitioning")).toBe("false");
    expect(document.querySelector('[data-testid="card"]').textContent).toBe("Proto A");
  });

  it("transitionKey igual entre re-renders → no transition triggered", () => {
    const { rerender } = render(
      <RecommendationTransitionWrapper transitionKey="proto-a">
        <div data-testid="card">A</div>
      </RecommendationTransitionWrapper>
    );
    rerender(
      <RecommendationTransitionWrapper transitionKey="proto-a">
        <div data-testid="card">A-updated</div>
      </RecommendationTransitionWrapper>
    );
    const wrapper = document.querySelector("[data-v2-recommendation-transition]");
    expect(wrapper.getAttribute("data-transitioning")).toBe("false");
  });

  it("transitionKey cambia → transitioning=true durante fade-out", () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <RecommendationTransitionWrapper transitionKey="proto-a">
        <div data-testid="card">A</div>
      </RecommendationTransitionWrapper>
    );
    rerender(
      <RecommendationTransitionWrapper transitionKey="proto-b">
        <div data-testid="card">B</div>
      </RecommendationTransitionWrapper>
    );
    const wrapper = document.querySelector("[data-v2-recommendation-transition]");
    expect(wrapper.getAttribute("data-transitioning")).toBe("true");
    expect(wrapper.style.opacity).toBe("0");
    // Durante fade-out, displayed sigue siendo el contenido viejo.
    expect(document.querySelector('[data-testid="card"]').textContent).toBe("A");
  });

  it("post fade-out swap → displayed cambia al nuevo content", () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <RecommendationTransitionWrapper transitionKey="proto-a">
        <div data-testid="card">A</div>
      </RecommendationTransitionWrapper>
    );
    rerender(
      <RecommendationTransitionWrapper transitionKey="proto-b">
        <div data-testid="card">B</div>
      </RecommendationTransitionWrapper>
    );
    act(() => { vi.advanceTimersByTime(180); });
    expect(document.querySelector('[data-testid="card"]').textContent).toBe("B");
    // Settle timer 16ms restablece transitioning=false (fade-in).
    act(() => { vi.advanceTimersByTime(20); });
    const wrapper = document.querySelector("[data-v2-recommendation-transition]");
    expect(wrapper.getAttribute("data-transitioning")).toBe("false");
    expect(wrapper.style.opacity).toBe("1");
  });

  it("reduced-motion → instant swap, sin transition data attr ni opacity", () => {
    a11y.useReducedMotion.mockReturnValue(true);
    const { rerender } = render(
      <RecommendationTransitionWrapper transitionKey="proto-a">
        <div data-testid="card">A</div>
      </RecommendationTransitionWrapper>
    );
    rerender(
      <RecommendationTransitionWrapper transitionKey="proto-b">
        <div data-testid="card">B</div>
      </RecommendationTransitionWrapper>
    );
    const wrapper = document.querySelector("[data-v2-recommendation-transition]");
    expect(wrapper.getAttribute("data-transitioning")).toBe("false");
    expect(wrapper.style.opacity).toBe("1");
    expect(document.querySelector('[data-testid="card"]').textContent).toBe("B");
    expect(wrapper.style.transition).toBe("none");
    a11y.useReducedMotion.mockReturnValue(false);
  });

  it("transitionKey undefined → render direct, no transition", () => {
    const { rerender } = render(
      <RecommendationTransitionWrapper transitionKey={undefined}>
        <div data-testid="card">A</div>
      </RecommendationTransitionWrapper>
    );
    rerender(
      <RecommendationTransitionWrapper transitionKey={undefined}>
        <div data-testid="card">A-2</div>
      </RecommendationTransitionWrapper>
    );
    const wrapper = document.querySelector("[data-v2-recommendation-transition]");
    expect(wrapper.getAttribute("data-transitioning")).toBe("false");
    expect(document.querySelector('[data-testid="card"]').textContent).toBe("A-2");
  });

  it("testid prop personalizado se aplica al wrapper", () => {
    render(
      <RecommendationTransitionWrapper transitionKey="x" testid="my-custom-id">
        <span>hi</span>
      </RecommendationTransitionWrapper>
    );
    expect(document.querySelector('[data-testid="my-custom-id"]')).toBeTruthy();
  });
});
