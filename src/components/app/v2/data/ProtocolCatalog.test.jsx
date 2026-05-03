/* ProtocolCatalog.test — Phase 6 SP4 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProtocolCatalog from "./ProtocolCatalog";
import { getActiveProtocols } from "@/lib/protocols";

const ACTIVE_COUNT = getActiveProtocols().length;

describe("ProtocolCatalog", () => {
  it("muestra el conteo total de protocolos active", () => {
    render(<ProtocolCatalog onSelectProtocol={() => {}} />);
    expect(screen.getByText(new RegExp(`${ACTIVE_COUNT} de ${ACTIVE_COUNT}`))).toBeTruthy();
  });

  it("renderiza una card por cada protocolo active", () => {
    const { container } = render(<ProtocolCatalog onSelectProtocol={() => {}} />);
    const cards = container.querySelectorAll("[data-protocol-id]");
    expect(cards.length).toBe(ACTIVE_COUNT);
  });

  it("excluye protocolos crisis del catálogo (no #18/#19/#20)", () => {
    const { container } = render(<ProtocolCatalog onSelectProtocol={() => {}} />);
    expect(container.querySelector("[data-protocol-id='18']")).toBeNull();
    expect(container.querySelector("[data-protocol-id='19']")).toBeNull();
    expect(container.querySelector("[data-protocol-id='20']")).toBeNull();
  });

  it("excluye protocolos training del catálogo (no #16/#17)", () => {
    const { container } = render(<ProtocolCatalog onSelectProtocol={() => {}} />);
    expect(container.querySelector("[data-protocol-id='16']")).toBeNull();
    expect(container.querySelector("[data-protocol-id='17']")).toBeNull();
  });

  it("incluye protocolo #1 (Reinicio Parasimpático) en active", () => {
    render(<ProtocolCatalog onSelectProtocol={() => {}} />);
    expect(screen.getByTestId("protocol-card-1")).toBeTruthy();
  });

  it("incluye protocolos nuevos #21-#25 en active", () => {
    render(<ProtocolCatalog onSelectProtocol={() => {}} />);
    expect(screen.getByTestId("protocol-card-21")).toBeTruthy();
    expect(screen.getByTestId("protocol-card-22")).toBeTruthy();
    expect(screen.getByTestId("protocol-card-23")).toBeTruthy();
    expect(screen.getByTestId("protocol-card-24")).toBeTruthy();
    expect(screen.getByTestId("protocol-card-25")).toBeTruthy();
  });

  it("filter intent='calma' muestra solo protocolos calma", () => {
    const { container } = render(<ProtocolCatalog onSelectProtocol={() => {}} />);
    fireEvent.click(screen.getByTestId("filter-intent-calma"));
    const cards = container.querySelectorAll("[data-protocol-id]");
    const expected = getActiveProtocols().filter((p) => p.int === "calma").length;
    expect(cards.length).toBe(expected);
  });

  it("filter difficulty='1' muestra solo protocolos dif=1", () => {
    const { container } = render(<ProtocolCatalog onSelectProtocol={() => {}} />);
    fireEvent.click(screen.getByTestId("filter-dificultad-1"));
    const cards = container.querySelectorAll("[data-protocol-id]");
    const expected = getActiveProtocols().filter((p) => p.dif === 1).length;
    expect(cards.length).toBe(expected);
  });

  it("filtros combinados (intent=calma + dif=1) restringen correctamente", () => {
    const { container } = render(<ProtocolCatalog onSelectProtocol={() => {}} />);
    fireEvent.click(screen.getByTestId("filter-intent-calma"));
    fireEvent.click(screen.getByTestId("filter-dificultad-1"));
    const cards = container.querySelectorAll("[data-protocol-id]");
    const expected = getActiveProtocols().filter((p) => p.int === "calma" && p.dif === 1).length;
    expect(cards.length).toBe(expected);
  });

  it("filter activo está marcado aria-checked=true", () => {
    render(<ProtocolCatalog onSelectProtocol={() => {}} />);
    const enfoqueBtn = screen.getByTestId("filter-intent-enfoque");
    fireEvent.click(enfoqueBtn);
    expect(enfoqueBtn.getAttribute("aria-checked")).toBe("true");
  });

  it("tap card dispara onSelectProtocol con protocolo correcto", () => {
    const onSelect = vi.fn();
    render(<ProtocolCatalog onSelectProtocol={onSelect} />);
    fireEvent.click(screen.getByTestId("protocol-card-1"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0].id).toBe(1);
  });

  it("muestra mensaje 'Sin protocolos' cuando filtros no matchean", () => {
    // No hay protocolos active con int="reset" + dif=3 actualmente; verificar fallback.
    const filtered = getActiveProtocols().filter((p) => p.int === "reset" && p.dif === 3);
    if (filtered.length === 0) {
      render(<ProtocolCatalog onSelectProtocol={() => {}} />);
      fireEvent.click(screen.getByTestId("filter-intent-reset"));
      fireEvent.click(screen.getByTestId("filter-dificultad-3"));
      expect(screen.queryByText(/Sin protocolos/i)).toBeTruthy();
    }
  });

  it("ProtocolCard muestra tag (tg) + nombre + duración", () => {
    render(<ProtocolCatalog onSelectProtocol={() => {}} />);
    const card1 = screen.getByTestId("protocol-card-1");
    expect(card1.textContent).toMatch(/Reinicio Parasimpático/);
    expect(card1.textContent).toMatch(/min/);
  });

  it("cards tienen tap target accesible (minHeight ≥44px)", () => {
    render(<ProtocolCatalog onSelectProtocol={() => {}} />);
    const card = screen.getByTestId("protocol-card-1");
    expect(parseInt(card.style.minHeight, 10)).toBeGreaterThanOrEqual(44);
  });
});
