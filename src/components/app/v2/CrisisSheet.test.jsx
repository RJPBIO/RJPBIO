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
});
