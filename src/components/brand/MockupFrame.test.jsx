 
import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";
import MockupFrame, { __mockupFrameInternals } from "./MockupFrame";

describe("MockupFrame", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders with required props", () => {
    const { getByTestId } = render(
      <MockupFrame screenshot="/x.png" alt="Test screenshot" />,
    );
    const frame = getByTestId("mockup-frame");
    expect(frame).toBeDefined();
    expect(frame.getAttribute("role")).toBe("img");
    expect(frame.getAttribute("aria-label")).toBe("Test screenshot");
  });

  it("renders the screenshot as <img> (aria-hidden, parent owns label)", () => {
    const { container } = render(
      <MockupFrame screenshot="/screenshots/why/01-hrv.png" alt="HRV cold-start active" />,
    );
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img.getAttribute("src")).toBe("/screenshots/why/01-hrv.png");
    expect(img.getAttribute("aria-hidden")).toBe("true");
  });

  it("supports variant titanium-black", () => {
    const { getByTestId } = render(
      <MockupFrame screenshot="/x.png" alt="x" variant="titanium-black" />,
    );
    expect(getByTestId("mockup-frame").dataset.variant).toBe("titanium-black");
  });

  it("default variant is titanium-natural", () => {
    const { getByTestId } = render(<MockupFrame screenshot="/x.png" alt="x" />);
    expect(getByTestId("mockup-frame").dataset.variant).toBe("titanium-natural");
  });

  it("applies glow filter when glow=true", () => {
    const { getByTestId } = render(
      <MockupFrame screenshot="/x.png" alt="x" glow />,
    );
    const style = getByTestId("mockup-frame").getAttribute("style") || "";
    expect(style).toMatch(/34, ?211, ?238/); // phosphorCyan rgb in glow drop-shadow
  });

  it("does NOT include glow filter by default", () => {
    const { getByTestId } = render(<MockupFrame screenshot="/x.png" alt="x" />);
    const style = getByTestId("mockup-frame").getAttribute("style") || "";
    expect(style).not.toMatch(/34, ?211, ?238/);
  });

  it("returns null when screenshot is missing (warns in dev)", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = render(<MockupFrame alt="x" />);
    expect(container.firstChild).toBeNull();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("screenshot prop missing"));
  });

  it("warns when alt is missing (a11y dev warning)", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<MockupFrame screenshot="/x.png" />);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("alt prop missing"));
  });

  it("width prop controls rendered size + aspect ratio", () => {
    const { getByTestId } = render(
      <MockupFrame screenshot="/x.png" alt="x" width={400} />,
    );
    const frame = getByTestId("mockup-frame");
    expect(frame.style.width).toBe("400px");
    // height = round(400 / FRAME_RATIO) → ~868
    const expectedHeight = Math.round(400 / __mockupFrameInternals.FRAME_RATIO);
    expect(frame.style.height).toBe(`${expectedHeight}px`);
  });

  it("FRAME_RATIO is iPhone 15 Pro 393/852", () => {
    expect(__mockupFrameInternals.FRAME_RATIO).toBeCloseTo(393 / 852, 5);
  });

  it("renders dynamic island rect", () => {
    const { container } = render(<MockupFrame screenshot="/x.png" alt="x" />);
    // Second SVG contains the dynamic island (positioned absolute overlay).
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBe(2);
    const islandRect = svgs[1].querySelector('rect[fill="#000"]');
    expect(islandRect).not.toBeNull();
  });
});
