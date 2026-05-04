/* CrisisSheet.test — Phase 6 SP4 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CrisisSheet from "./CrisisSheet";

describe("CrisisSheet", () => {
  it("no renderiza nada cuando open=false", () => {
    const { container } = render(
      <CrisisSheet open={false} onClose={() => {}} onSelectProtocol={() => {}} />
    );
    expect(container.querySelector("[data-v2-crisis-sheet]")).toBeNull();
  });

  it("renderiza dialog modal cuando open=true", () => {
    render(<CrisisSheet open={true} onClose={() => {}} onSelectProtocol={() => {}} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-label")).toMatch(/crisis/i);
  });

  it("muestra los 3 protocolos crisis (#18, #19, #20)", () => {
    render(<CrisisSheet open={true} onClose={() => {}} onSelectProtocol={() => {}} />);
    expect(screen.getByTestId("crisis-option-18")).toBeTruthy();
    expect(screen.getByTestId("crisis-option-19")).toBeTruthy();
    expect(screen.getByTestId("crisis-option-20")).toBeTruthy();
  });

  it("copy describe estado, no etiqueta crisis severa", () => {
    render(<CrisisSheet open={true} onClose={() => {}} onSelectProtocol={() => {}} />);
    expect(screen.getByText(/Pánico, ansiedad aguda/i)).toBeTruthy();
    expect(screen.getByText(/Bloqueo cognitivo, agotamiento/i)).toBeTruthy();
    // NO debe usar lenguaje alarmante directo
    expect(screen.queryByText(/Estás en crisis severa/i)).toBeNull();
  });

  it("kicker 'ESTOY AQUÍ' para tono empático", () => {
    render(<CrisisSheet open={true} onClose={() => {}} onSelectProtocol={() => {}} />);
    expect(screen.getByText(/ESTOY AQUÍ/i)).toBeTruthy();
  });

  it("tap option dispara onSelectProtocol con protocolo correcto", () => {
    const onSelect = vi.fn();
    render(<CrisisSheet open={true} onClose={() => {}} onSelectProtocol={onSelect} />);
    screen.getByTestId("crisis-option-19").click();
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0].id).toBe(19);
  });

  it("tap close button dispara onClose", () => {
    const onClose = vi.fn();
    render(<CrisisSheet open={true} onClose={onClose} onSelectProtocol={() => {}} />);
    screen.getByTestId("crisis-sheet-close").click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("tap 'Estoy bien por ahora' dispara onClose", () => {
    const onClose = vi.fn();
    render(<CrisisSheet open={true} onClose={onClose} onSelectProtocol={() => {}} />);
    screen.getByTestId("crisis-sheet-im-ok").click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("opciones tienen tap target accesible (minHeight ≥44px)", () => {
    render(<CrisisSheet open={true} onClose={() => {}} onSelectProtocol={() => {}} />);
    const opt = screen.getByTestId("crisis-option-18");
    expect(parseInt(opt.style.minHeight, 10)).toBeGreaterThanOrEqual(44);
  });

  // PHASE 6D SP6 Bug-35 — keydown listener cleanup verification.
  // Anti-regression: si alguien quita el removeEventListener del cleanup
  // del useEffect, este test detecta el leak vía addSpy/removeSpy counts.
  it("Bug-35: ESC cierra sheet cuando open=true", () => {
    const onClose = vi.fn();
    render(<CrisisSheet open={true} onClose={onClose} onSelectProtocol={() => {}} />);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Bug-35: ESC NO dispara cuando open=false (listener no montado)", () => {
    const onClose = vi.fn();
    render(<CrisisSheet open={false} onClose={onClose} onSelectProtocol={() => {}} />);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("Bug-35: keydown listener removido en unmount (no leak)", () => {
    const addSpy = vi.spyOn(document, "addEventListener");
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const { unmount } = render(<CrisisSheet open={true} onClose={() => {}} onSelectProtocol={() => {}} />);
    const addedKeydown = addSpy.mock.calls.filter((c) => c[0] === "keydown").length;
    expect(addedKeydown).toBeGreaterThan(0);
    unmount();
    const removedKeydown = removeSpy.mock.calls.filter((c) => c[0] === "keydown").length;
    expect(removedKeydown).toBeGreaterThanOrEqual(addedKeydown);
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it("Bug-35: keydown listener desmontado al cambiar open=true → false (no leak)", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const { rerender } = render(<CrisisSheet open={true} onClose={() => {}} onSelectProtocol={() => {}} />);
    rerender(<CrisisSheet open={false} onClose={() => {}} onSelectProtocol={() => {}} />);
    const removedKeydown = removeSpy.mock.calls.filter((c) => c[0] === "keydown").length;
    expect(removedKeydown).toBeGreaterThan(0);
    removeSpy.mockRestore();
  });
});
