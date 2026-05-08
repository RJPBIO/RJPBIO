/* MoodPrePicker.test — Phase 6J-1 Group C.
   Cubre render, tap selection, toggle off, aria-checked propagation,
   data-active marker. */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import MoodPrePicker from "./MoodPrePicker";

afterEach(() => cleanup());

describe("MoodPrePicker — render", () => {
  it("renderea container con role=radiogroup + aria-label", () => {
    render(<MoodPrePicker value={null} onChange={() => {}} />);
    const group = document.querySelector('[role="radiogroup"]');
    expect(group).toBeTruthy();
    expect(group.getAttribute("aria-label")).toBe("Estado de ánimo");
  });

  it("renderea 5 mood options con role=radio", () => {
    render(<MoodPrePicker value={null} onChange={() => {}} />);
    expect(document.querySelector('[data-testid="mood-pre-picker-1"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="mood-pre-picker-2"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="mood-pre-picker-3"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="mood-pre-picker-4"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="mood-pre-picker-5"]')).toBeTruthy();
    const radios = document.querySelectorAll('[role="radio"]');
    expect(radios.length).toBe(5);
  });

  it("eyebrow muestra '¿Cómo te sientes ahora?'", () => {
    render(<MoodPrePicker value={null} onChange={() => {}} />);
    expect(document.body.innerHTML).toMatch(/¿Cómo te sientes ahora\?/);
  });

  it("aria-label descriptivo en cada chip", () => {
    render(<MoodPrePicker value={null} onChange={() => {}} />);
    expect(document.querySelector('[data-testid="mood-pre-picker-1"]').getAttribute("aria-label")).toMatch(/tensión alta/i);
    expect(document.querySelector('[data-testid="mood-pre-picker-3"]').getAttribute("aria-label")).toMatch(/estable/i);
    expect(document.querySelector('[data-testid="mood-pre-picker-5"]').getAttribute("aria-label")).toMatch(/óptimo/i);
  });
});

describe("MoodPrePicker — tap selection", () => {
  it("tap option → onChange(value)", () => {
    const onChange = vi.fn();
    render(<MoodPrePicker value={null} onChange={onChange} />);
    fireEvent.click(document.querySelector('[data-testid="mood-pre-picker-3"]'));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("tap distinto value cuando hay selección → onChange(nuevo value)", () => {
    const onChange = vi.fn();
    render(<MoodPrePicker value={2} onChange={onChange} />);
    fireEvent.click(document.querySelector('[data-testid="mood-pre-picker-5"]'));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("tap mismo value (toggle off) → onChange(null)", () => {
    const onChange = vi.fn();
    render(<MoodPrePicker value={3} onChange={onChange} />);
    fireEvent.click(document.querySelector('[data-testid="mood-pre-picker-3"]'));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});

describe("MoodPrePicker — active state markers", () => {
  it("value=3 → aria-checked='true' + data-active='true' en option 3", () => {
    render(<MoodPrePicker value={3} onChange={() => {}} />);
    const opt3 = document.querySelector('[data-testid="mood-pre-picker-3"]');
    expect(opt3.getAttribute("aria-checked")).toBe("true");
    expect(opt3.getAttribute("data-active")).toBe("true");
  });

  it("value=3 → todos los demás aria-checked='false'", () => {
    render(<MoodPrePicker value={3} onChange={() => {}} />);
    [1, 2, 4, 5].forEach((v) => {
      const opt = document.querySelector(`[data-testid="mood-pre-picker-${v}"]`);
      expect(opt.getAttribute("aria-checked")).toBe("false");
      expect(opt.getAttribute("data-active")).toBe("false");
    });
  });

  it("value=null → ningún option aria-checked='true'", () => {
    render(<MoodPrePicker value={null} onChange={() => {}} />);
    [1, 2, 3, 4, 5].forEach((v) => {
      const opt = document.querySelector(`[data-testid="mood-pre-picker-${v}"]`);
      expect(opt.getAttribute("aria-checked")).toBe("false");
    });
  });
});
