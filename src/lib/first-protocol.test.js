/* Phase 6D SP1 — first-protocol mapping tests. */
import { describe, it, expect } from "vitest";
import {
  FIRST_PROTOCOL_BY_INTENT,
  DEFAULT_FIRST_PROTOCOL_ID,
  firstProtocolForIntent,
} from "./first-protocol";
import { P as PROTOCOLS } from "./protocols";

describe("FIRST_PROTOCOL_BY_INTENT (Phase 6D SP1)", () => {
  it("mapea los 4 intents canónicos + alias recuperacion", () => {
    expect(FIRST_PROTOCOL_BY_INTENT.calma).toBe(1);
    expect(FIRST_PROTOCOL_BY_INTENT.enfoque).toBe(2);
    expect(FIRST_PROTOCOL_BY_INTENT.energia).toBe(4);
    expect(FIRST_PROTOCOL_BY_INTENT.reset).toBe(3);
    expect(FIRST_PROTOCOL_BY_INTENT.recuperacion).toBe(3);
  });

  it("default es 1 (Reinicio Parasimpático) — protocolo más universal", () => {
    expect(DEFAULT_FIRST_PROTOCOL_ID).toBe(1);
  });

  it("cada id mapeado existe en el catálogo de protocolos", () => {
    for (const id of Object.values(FIRST_PROTOCOL_BY_INTENT)) {
      const protocol = PROTOCOLS.find((p) => p.id === id);
      expect(protocol).toBeDefined();
      expect(typeof protocol.n).toBe("string");
      expect(protocol.n.length).toBeGreaterThan(0);
    }
  });

  it("intent calma → protocolo con n='Reinicio Parasimpático' y int='calma'", () => {
    const id = FIRST_PROTOCOL_BY_INTENT.calma;
    const p = PROTOCOLS.find((x) => x.id === id);
    expect(p.n).toBe("Reinicio Parasimpático");
    expect(p.int).toBe("calma");
  });

  it("intent enfoque → 'Activación Cognitiva' int='enfoque'", () => {
    const id = FIRST_PROTOCOL_BY_INTENT.enfoque;
    const p = PROTOCOLS.find((x) => x.id === id);
    expect(p.n).toBe("Activación Cognitiva");
    expect(p.int).toBe("enfoque");
  });

  it("intent energia → 'Pulse Shift' int='energia'", () => {
    const id = FIRST_PROTOCOL_BY_INTENT.energia;
    const p = PROTOCOLS.find((x) => x.id === id);
    expect(p.n).toBe("Pulse Shift");
    expect(p.int).toBe("energia");
  });

  it("intent reset → 'Reset Ejecutivo' int='reset'", () => {
    const id = FIRST_PROTOCOL_BY_INTENT.reset;
    const p = PROTOCOLS.find((x) => x.id === id);
    expect(p.n).toBe("Reset Ejecutivo");
    expect(p.int).toBe("reset");
  });
});

describe("firstProtocolForIntent helper", () => {
  it("retorna el objeto Protocol completo para un intent válido", () => {
    const p = firstProtocolForIntent("calma");
    expect(p).toBeDefined();
    expect(p.id).toBe(1);
    expect(p.n).toBe("Reinicio Parasimpático");
    expect(typeof p.d).toBe("number"); // duración existe
  });

  it("intent null/undefined → default Reinicio Parasimpático", () => {
    const p = firstProtocolForIntent(null);
    expect(p?.id).toBe(DEFAULT_FIRST_PROTOCOL_ID);
    const p2 = firstProtocolForIntent(undefined);
    expect(p2?.id).toBe(DEFAULT_FIRST_PROTOCOL_ID);
  });

  it("intent desconocido → default", () => {
    const p = firstProtocolForIntent("foo-bar-invalid");
    expect(p?.id).toBe(DEFAULT_FIRST_PROTOCOL_ID);
  });
});
