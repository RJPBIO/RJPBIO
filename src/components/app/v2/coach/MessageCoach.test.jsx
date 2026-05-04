/* ═══════════════════════════════════════════════════════════════
   MessageCoach.test — Phase 6C SP2 markup tappeable parse
   ═══════════════════════════════════════════════════════════════
   Verifica el parser puro `parseRunMarkup` + render de
   ProtocolTapInline + defensa contra crisis tappeable + tap dispatch.
   ═══════════════════════════════════════════════════════════════ */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Stub framer-motion (StreamingCursor no lo usa pero por si acaso).
vi.mock("framer-motion", () => ({
  motion: new Proxy({}, { get: () => ({ children }) => children }),
  AnimatePresence: ({ children }) => children,
}));

import MessageCoach, { parseRunMarkup } from "./MessageCoach";

describe("parseRunMarkup — Phase 6C SP2", () => {
  it("texto sin markup retorna single text part", () => {
    const result = parseRunMarkup("Solo texto plano.");
    expect(result).toEqual([{ type: "text", content: "Solo texto plano." }]);
  });

  it("reemplaza [run:1] con protocol part (Reinicio Parasimpático)", () => {
    const result = parseRunMarkup("Prueba [run:1] ahora.");
    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ type: "text", content: "Prueba " });
    expect(result[1]).toMatchObject({ type: "protocol" });
    expect(result[1].protocol.id).toBe(1);
    expect(result[1].protocol.n).toBe("Reinicio Parasimpático");
    expect(result[2]).toMatchObject({ type: "text", content: " ahora." });
  });

  it("múltiples [run:N] en mismo mensaje", () => {
    const result = parseRunMarkup("Mañana [run:2] y luego [run:5].");
    const protocols = result.filter((p) => p.type === "protocol");
    expect(protocols).toHaveLength(2);
    expect(protocols[0].protocol.id).toBe(2);
    expect(protocols[1].protocol.id).toBe(5);
  });

  it("[run:N] al inicio del mensaje", () => {
    const result = parseRunMarkup("[run:1] te ayuda.");
    expect(result[0]).toMatchObject({ type: "protocol" });
    expect(result[0].protocol.id).toBe(1);
  });

  it("[run:N] al final del mensaje", () => {
    const result = parseRunMarkup("Empezamos con [run:4]");
    expect(result[result.length - 1]).toMatchObject({ type: "protocol" });
    expect(result[result.length - 1].protocol.id).toBe(4);
  });

  it("protocol ID inválido (no existe) renderiza texto literal", () => {
    const result = parseRunMarkup("Prueba [run:999].");
    expect(result.find((p) => p.type === "protocol")).toBeUndefined();
    expect(result.some((p) => p.content === "[run:999]")).toBe(true);
  });

  it("crisis [run:18] renderiza texto literal NO tap (defensa LLM disobedience)", () => {
    const result = parseRunMarkup("Tap [run:18] ahora.");
    expect(result.find((p) => p.type === "protocol")).toBeUndefined();
    expect(result.some((p) => p.content === "[run:18]")).toBe(true);
  });

  it("crisis [run:19] y [run:20] tampoco tappeables", () => {
    const r19 = parseRunMarkup("[run:19]");
    expect(r19.find((p) => p.type === "protocol")).toBeUndefined();
    const r20 = parseRunMarkup("[run:20]");
    expect(r20.find((p) => p.type === "protocol")).toBeUndefined();
  });

  it("training [run:16] (Resonancia Vagal) tappeable — NO es crisis", () => {
    // Training NO está prohibido tappeable; solo crisis. El system prompt
    // SP1 no inyecta #16/#17 al catálogo pero si LLM los menciona, OK tap.
    const result = parseRunMarkup("[run:16]");
    const proto = result.find((p) => p.type === "protocol");
    expect(proto).toBeDefined();
    expect(proto.protocol.id).toBe(16);
  });

  it("content empty/null no crashea", () => {
    expect(parseRunMarkup("")).toEqual([{ type: "text", content: "" }]);
    expect(parseRunMarkup(null)).toEqual([{ type: "text", content: null }]);
    expect(parseRunMarkup(undefined)).toEqual([{ type: "text", content: undefined }]);
  });

  it("invocaciones consecutivas son deterministas (regex state aislado)", () => {
    // Bug guard: /g flag puede mantener .lastIndex entre llamadas si compartes
    // la instancia. Verifica que cada call empieza desde 0.
    const a = parseRunMarkup("[run:1]");
    const b = parseRunMarkup("[run:1]");
    expect(a).toEqual(b);
  });
});

describe("MessageCoach component — Phase 6C SP2", () => {
  it("renderiza texto plano sin markup", () => {
    render(<MessageCoach content="Hola" ts={Date.now()} />);
    expect(screen.getByText("Hola")).toBeTruthy();
  });

  it("renderiza tap button para [run:1]", () => {
    render(<MessageCoach content="[run:1]" ts={Date.now()} onProtocolTap={() => {}} />);
    const btn = screen.getByRole("button", { name: /Iniciar protocolo Reinicio Parasimpático/i });
    expect(btn).toBeTruthy();
    expect(btn.getAttribute("data-v2-protocol-tap")).toBe("1");
  });

  it("tap dispara onProtocolTap con protocolId numérico", () => {
    const onProtocolTap = vi.fn();
    render(<MessageCoach content="[run:5]" ts={Date.now()} onProtocolTap={onProtocolTap} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onProtocolTap).toHaveBeenCalledWith(5);
  });

  it("crisis [run:18] NO genera button (renderiza literal)", () => {
    render(<MessageCoach content="[run:18]" ts={Date.now()} onProtocolTap={() => {}} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("[run:18]")).toBeTruthy();
  });

  it("muestra label nombre + duración del protocolo", () => {
    render(<MessageCoach content="[run:1]" ts={Date.now()} onProtocolTap={() => {}} />);
    const btn = screen.getByRole("button");
    expect(btn.textContent).toMatch(/Reinicio Parasimpático/);
    expect(btn.textContent).toMatch(/120s/);
  });

  it("button disabled cuando onProtocolTap no se provee", () => {
    render(<MessageCoach content="[run:1]" ts={Date.now()} />);
    const btn = screen.queryByRole("button");
    expect(btn).toBeTruthy();
    expect(btn.disabled).toBe(true);
  });
});
