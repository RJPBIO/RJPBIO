import { describe, it, expect } from "vitest";
import {
  computeNom35ItemsHash,
  verifyNom35Integrity,
  NOM35_ITEMS_HASH_EXPECTED,
  nom035TextValidatedByLawyer,
} from "./integrity.js";
import { ITEMS } from "./items.js";

describe("NOM-035 integrity", () => {
  it("ITEMS contains 72 entries (Guía III)", () => {
    expect(ITEMS.length).toBe(72);
  });

  it("computed hash matches the expected known-good", async () => {
    const h = await computeNom35ItemsHash();
    // Si este test falla, alguien editó el texto de los ítems.
    // Recompute (`computeNom35ItemsHash`), pega el nuevo valor en
    // NOM35_ITEMS_HASH_EXPECTED, y revísalo manualmente vs DOF.
    expect(h).toBe(NOM35_ITEMS_HASH_EXPECTED);
  });

  it("verifyNom35Integrity returns ok=true on unmodified items", async () => {
    const r = await verifyNom35Integrity();
    expect(r.ok).toBe(true);
    expect(r.mismatch).toBeUndefined();
  });

  it("nom035TextValidatedByLawyer is FALSE by default — must be flipped manually after legal review", () => {
    expect(nom035TextValidatedByLawyer).toBe(false);
  });
});
