import { describe, it, expect } from "vitest";
import {
  encrypt,
  decrypt,
  isEncrypted,
  encryptIfPlaintext,
  decryptIfEncrypted,
  encryptJson,
  decryptJson,
} from "./kms";

/* En test (NODE_ENV != production) sin DATA_KEY, kms usa la root key de
   desarrollo (32 bytes cero). Suficiente para validar el round-trip y los
   invariantes de compatibilidad legacy que protegen el cifrado en reposo de
   campos sensibles (Nom35Response.answers, WearableEvent.payload). */

describe("encrypt / decrypt", () => {
  it("round-trip de string", () => {
    const blob = encrypt("respuesta-sensible");
    expect(blob.startsWith("enc:v1:")).toBe(true);
    expect(decrypt(blob)).toBe("respuesta-sensible");
  });

  it("dos cifrados del mismo texto difieren (IV aleatorio)", () => {
    expect(encrypt("x")).not.toBe(encrypt("x"));
  });

  it("tamper: alterar el ciphertext rompe la verificación GCM", () => {
    const blob = encrypt("secreto");
    const bad = blob.slice(0, -3) + (blob.endsWith("AAA") ? "BBB" : "AAA");
    expect(() => decrypt(bad)).toThrow();
  });
});

describe("isEncrypted", () => {
  it("detecta formato enc:v1: y legacy v1:", () => {
    expect(isEncrypted(encrypt("a"))).toBe(true);
    expect(isEncrypted("v1:iv:tag:ct")).toBe(true);
  });
  it("false para texto plano y no-strings", () => {
    expect(isEncrypted("texto plano")).toBe(false);
    expect(isEncrypted(null)).toBe(false);
    expect(isEncrypted({ a: 1 })).toBe(false);
  });
});

describe("encryptIfPlaintext / decryptIfEncrypted", () => {
  it("encryptIfPlaintext es idempotente (no doble-cifra)", () => {
    const once = encryptIfPlaintext("dato");
    expect(encryptIfPlaintext(once)).toBe(once);
  });
  it("null/undefined pasan tal cual", () => {
    expect(encryptIfPlaintext(null)).toBeNull();
    expect(decryptIfEncrypted(undefined)).toBeUndefined();
  });
  it("decryptIfEncrypted: passthrough legacy texto plano", () => {
    expect(decryptIfEncrypted("valor-viejo-plano")).toBe("valor-viejo-plano");
  });
  it("round-trip vía helpers idempotentes", () => {
    expect(decryptIfEncrypted(encryptIfPlaintext("hola"))).toBe("hola");
  });
});

describe("encryptJson / decryptJson (campos Json en reposo)", () => {
  const answers = { 1: 3, 2: 0, 72: 4 };

  it("round-trip de objeto", () => {
    const blob = encryptJson(answers);
    expect(typeof blob).toBe("string");
    expect(isEncrypted(blob)).toBe(true);
    expect(decryptJson(blob)).toEqual(answers);
  });

  it("payload con unicode (wearable / notas)", () => {
    const payload = { hrv: [42, 43], note: "ñoño áéí", _externalUserId: "ext_1" };
    expect(decryptJson(encryptJson(payload))).toEqual(payload);
  });

  it("null/undefined pasan tal cual", () => {
    expect(encryptJson(null)).toBeNull();
    expect(decryptJson(undefined)).toBeUndefined();
  });

  it("idempotente: no re-cifra un string ya cifrado", () => {
    const once = encryptJson(answers);
    expect(encryptJson(once)).toBe(once);
  });

  it("PASSTHROUGH legacy: objeto JSON plano (fila vieja) se devuelve igual", () => {
    expect(decryptJson(answers)).toEqual(answers);
  });

  it("token corrupto → null (fail-safe, sin crash)", () => {
    const blob = encryptJson(answers);
    const bad = blob.slice(0, -3) + (blob.endsWith("AAA") ? "BBB" : "AAA");
    expect(decryptJson(bad)).toBeNull();
  });
});
