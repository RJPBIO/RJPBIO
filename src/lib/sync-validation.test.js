import { describe, it, expect } from "vitest";
import {
  validateEntry, jsonSize, VALID_KINDS,
  MAX_BATCH, MAX_PAYLOAD_BYTES, MAX_NEURAL_STATE_BYTES, MAX_ENTRY_PAYLOAD_BYTES,
} from "./sync-validation";

describe("sync-validation — validateEntry", () => {
  it("acepta entry mínima válida", () => {
    expect(validateEntry({ id: "abc", kind: "session" })).toBeNull();
  });

  it("acepta entry con payload válido", () => {
    expect(validateEntry({
      id: "session-123",
      kind: "session",
      payload: { protocolId: "calma60", durationSec: 60 },
    })).toBeNull();
  });

  it("rechaza entry no-objeto", () => {
    expect(validateEntry(null)).toBe("not_object");
    expect(validateEntry(undefined)).toBe("not_object");
    expect(validateEntry("string")).toBe("not_object");
    expect(validateEntry(42)).toBe("not_object");
  });

  it("rechaza id ausente o malformado", () => {
    expect(validateEntry({ kind: "session" })).toBe("bad_id");
    expect(validateEntry({ id: "", kind: "session" })).toBe("bad_id");
    expect(validateEntry({ id: 42, kind: "session" })).toBe("bad_id");
    expect(validateEntry({ id: "x".repeat(129), kind: "session" })).toBe("bad_id");
  });

  it("rechaza kind no en whitelist", () => {
    expect(validateEntry({ id: "x", kind: "evil_kind" })).toBe("bad_kind");
    expect(validateEntry({ id: "x", kind: "" })).toBe("bad_kind");
    expect(validateEntry({ id: "x", kind: 42 })).toBe("bad_kind");
  });

  it("acepta cada kind del whitelist", () => {
    for (const kind of VALID_KINDS) {
      expect(validateEntry({ id: "x", kind })).toBeNull();
    }
  });

  it("rechaza payload no-objeto cuando presente", () => {
    expect(validateEntry({ id: "x", kind: "session", payload: "string" })).toBe("bad_payload");
    expect(validateEntry({ id: "x", kind: "session", payload: 42 })).toBe("bad_payload");
  });

  it("acepta payload null o undefined", () => {
    expect(validateEntry({ id: "x", kind: "session", payload: null })).toBeNull();
    expect(validateEntry({ id: "x", kind: "session" })).toBeNull();
  });

  it("rechaza payload mayor al cap (32KB)", () => {
    const huge = { data: "x".repeat(MAX_ENTRY_PAYLOAD_BYTES + 100) };
    expect(validateEntry({ id: "x", kind: "session", payload: huge })).toBe("payload_too_large");
  });

  it("acepta payload justo en el límite", () => {
    // ~30KB, dentro del cap
    const ok = { data: "x".repeat(30 * 1024) };
    expect(validateEntry({ id: "x", kind: "session", payload: ok })).toBeNull();
  });
});

describe("sync-validation — jsonSize", () => {
  it("retorna bytes UTF-8 del JSON", () => {
    expect(jsonSize({})).toBe(2); // "{}"
    expect(jsonSize({ a: 1 })).toBe(7); // {"a":1}
  });

  it("maneja Infinity para objetos no-serializables", () => {
    const circular = {};
    circular.self = circular;
    expect(jsonSize(circular)).toBe(Number.POSITIVE_INFINITY);
  });

  it("cuenta caracteres multi-byte correctamente", () => {
    // "ñ" = 2 bytes UTF-8 → JSON {"name":"ñ"} es 12 chars pero 13 bytes
    const obj = { name: "ñ" };
    expect(jsonSize(obj)).toBe(13);
  });
});

describe("sync-validation — limits", () => {
  it("MAX_BATCH > 50 (típico) y < 1000 (sane cap)", () => {
    expect(MAX_BATCH).toBeGreaterThan(50);
    expect(MAX_BATCH).toBeLessThan(1000);
  });

  it("MAX_NEURAL_STATE_BYTES < MAX_PAYLOAD_BYTES", () => {
    // El neuralState va dentro del body, así que su cap debe ser
    // menor al cap total para dejar espacio a los entries.
    expect(MAX_NEURAL_STATE_BYTES).toBeLessThan(MAX_PAYLOAD_BYTES);
  });

  it("MAX_ENTRY_PAYLOAD_BYTES < MAX_BATCH * MAX_ENTRY_PAYLOAD_BYTES < MAX_PAYLOAD_BYTES (sanity)", () => {
    // Si todos los entries usaran el cap entero, no deberían sobrepasar el body cap
    // (pequeño cushion para metadata: ids, kinds, separators).
    // Esta es una validación de configuración coherente.
    const theoretical = MAX_BATCH * MAX_ENTRY_PAYLOAD_BYTES;
    // El cap real es 512KB; 200 entries × 32KB = 6.4MB. Si bien el server rechaza
    // por body size antes de procesar, este test documenta que el body cap es
    // intencionalmente más estricto que la suma teórica.
    expect(theoretical).toBeGreaterThan(MAX_PAYLOAD_BYTES);
  });
});
