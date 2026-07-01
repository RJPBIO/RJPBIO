import { describe, it, expect } from "vitest";
import { encryptHrvNumerics, decryptHrvRow, decryptHrvRows } from "./encrypted-fields";
import { isEncrypted } from "./kms";

/* Garantiza el round-trip cifrado de los numéricos de HRV y —clave— que la
   lectura de filas legacy en claro es un no-op (passthrough), para que
   activar el cifrado no rompa datos ni agregaciones existentes. */

describe("encryptHrvNumerics", () => {
  it("cifra los 6 numéricos a strings", () => {
    const out = encryptHrvNumerics({ id: "h1", userId: "u1", rmssd: 42, lnRmssd: 3.7, sdnn: 55, pnn50: 12, meanHr: 68, rhr: 60, source: "camera" });
    for (const f of ["rmssd", "lnRmssd", "sdnn", "pnn50", "meanHr", "rhr"]) {
      expect(typeof out[f]).toBe("string");
      expect(isEncrypted(out[f])).toBe(true);
    }
    expect(out.source).toBe("camera"); // no-numérico intacto
    expect(out.id).toBe("h1");
  });

  it("preserva null/undefined en opcionales", () => {
    const out = encryptHrvNumerics({ rmssd: 42, lnRmssd: 3.7, meanHr: 68, sdnn: null, pnn50: undefined, rhr: null });
    expect(out.sdnn).toBeNull();
    expect(out.rhr).toBeNull();
    expect(isEncrypted(out.rmssd)).toBe(true);
  });
});

describe("decryptHrvRow / decryptHrvRows", () => {
  it("round-trip: encrypt → decrypt recupera los números", () => {
    const original = { id: "h1", rmssd: 42.7, lnRmssd: 3.75, sdnn: 55.2, pnn50: 12, meanHr: 68, rhr: 60 };
    const dec = decryptHrvRow(encryptHrvNumerics(original));
    expect(dec.rmssd).toBeCloseTo(42.7, 4);
    expect(dec.lnRmssd).toBeCloseTo(3.75, 4);
    expect(dec.meanHr).toBe(68);
  });

  it("PASSTHROUGH legacy: fila con números en claro se lee igual", () => {
    const legacy = { id: "h2", rmssd: 40, lnRmssd: 3.6, sdnn: null, pnn50: null, meanHr: 65, rhr: null };
    const dec = decryptHrvRow(legacy);
    expect(dec.rmssd).toBe(40);
    expect(dec.meanHr).toBe(65);
    expect(dec.sdnn).toBeNull();
  });

  it("decryptHrvRows mapea arrays y tolera no-arrays", () => {
    const rows = [{ rmssd: 40, lnRmssd: 3.6, meanHr: 65 }, encryptHrvNumerics({ rmssd: 50, lnRmssd: 3.9, meanHr: 70 })];
    const dec = decryptHrvRows(rows);
    expect(dec[0].rmssd).toBe(40);
    expect(dec[1].rmssd).toBe(50);
    expect(decryptHrvRows(null)).toBeNull();
  });
});
