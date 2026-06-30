/* hapticSignatures.test — Phase 7 F0-4 Capa 1.
   Verifica:
   1) Catalog completeness: 23 entries (matchea P[] catalog).
   2) Shape consistency per signature: 5 phase kinds + intensity_modifier.
   3) Validation: durations son numbers positivos finitos, en rango operativo.
   4) intensity_modifier en 0.7-1.3 (DNA constraint per-tone).
   5) Helper getHapticSignature: known id, unknown, defensive null/string.
*/
import { describe, it, expect } from "vitest";
import {
  HAPTIC_SIGNATURES,
  DEFAULT_SIGNATURE,
  HAPTIC_PHASE_KINDS,
  getHapticSignature,
} from "./hapticSignatures";
import { P } from "./protocols";

describe("F0-4 Capa-1 — HAPTIC_SIGNATURES catalog completeness", () => {
  it("contiene 24 protocol entries (matchea P[] del catálogo)", () => {
    const ids = Object.keys(HAPTIC_SIGNATURES).map((k) => Number(k)).sort((a, b) => a - b);
    expect(ids.length).toBe(24);
    // IDs reservados 13-14 NO deben aparecer (OMEGA/OMNIA eliminados Phase 4 SP1)
    expect(ids.includes(13)).toBe(false);
    expect(ids.includes(14)).toBe(false);
  });

  it("cobertura 1:1 con P[] (todo protocolo activo tiene firma)", () => {
    const protoIds = P.map((p) => p.id).sort((a, b) => a - b);
    const sigIds = Object.keys(HAPTIC_SIGNATURES).map((k) => Number(k)).sort((a, b) => a - b);
    expect(sigIds).toEqual(protoIds);
  });

  it("cada signature tiene los 5 phase kinds canon + intensity_modifier", () => {
    Object.entries(HAPTIC_SIGNATURES).forEach(([id, sig]) => {
      HAPTIC_PHASE_KINDS.forEach((kind) => {
        expect(sig).toHaveProperty(kind);
        expect(Array.isArray(sig[kind])).toBe(true);
      });
      expect(typeof sig.intensity_modifier).toBe("number");
    });
  });
});

describe("F0-4 Capa-1 — HAPTIC_SIGNATURES shape validation", () => {
  it("cada phase kind es array no vacío de duraciones numéricas positivas", () => {
    Object.entries(HAPTIC_SIGNATURES).forEach(([id, sig]) => {
      HAPTIC_PHASE_KINDS.forEach((kind) => {
        const arr = sig[kind];
        expect(arr.length).toBeGreaterThan(0);
        arr.forEach((d, i) => {
          expect(typeof d).toBe("number");
          expect(Number.isFinite(d)).toBe(true);
          expect(d).toBeGreaterThan(0);
        });
      });
    });
  });

  it("ninguna duración excede 500ms (cap operativo UX + battery)", () => {
    Object.entries(HAPTIC_SIGNATURES).forEach(([id, sig]) => {
      HAPTIC_PHASE_KINDS.forEach((kind) => {
        sig[kind].forEach((d) => {
          expect(d).toBeLessThanOrEqual(500);
        });
      });
    });
  });

  it("intensity_modifier en rango 0.7-1.3 (DNA constraint)", () => {
    Object.entries(HAPTIC_SIGNATURES).forEach(([id, sig]) => {
      expect(sig.intensity_modifier).toBeGreaterThanOrEqual(0.7);
      expect(sig.intensity_modifier).toBeLessThanOrEqual(1.3);
    });
  });

  it("DEFAULT_SIGNATURE sigue la misma shape que entries del catalog", () => {
    HAPTIC_PHASE_KINDS.forEach((kind) => {
      expect(Array.isArray(DEFAULT_SIGNATURE[kind])).toBe(true);
      expect(DEFAULT_SIGNATURE[kind].length).toBeGreaterThan(0);
    });
    expect(DEFAULT_SIGNATURE.intensity_modifier).toBe(1.0);
  });
});

describe("F0-4 Capa-1 — getHapticSignature helper", () => {
  it("known protocolId retorna su firma específica", () => {
    const flagship = getHapticSignature(15); // Suspiro Fisiológico
    expect(flagship).toBe(HAPTIC_SIGNATURES[15]);
    expect(flagship.intensity_modifier).toBe(0.90);
    // Doble-inhalación pattern única (5 valores)
    expect(flagship.breath_inhale).toEqual([40, 20, 30, 20, 80]);
  });

  it("crisis protocolId retorna firma slow/deliberate", () => {
    const er = getHapticSignature(18); // Emergency Reset
    expect(er).toBe(HAPTIC_SIGNATURES[18]);
    expect(er.intensity_modifier).toBeLessThanOrEqual(0.85);
  });

  it("foco protocolId retorna firma sharp/staccato", () => {
    const lf = getHapticSignature(8); // Lightning Focus
    expect(lf).toBe(HAPTIC_SIGNATURES[8]);
    expect(lf.intensity_modifier).toBeGreaterThanOrEqual(1.2);
  });

  it("unknown protocolId retorna DEFAULT_SIGNATURE", () => {
    expect(getHapticSignature(999)).toBe(DEFAULT_SIGNATURE);
    expect(getHapticSignature(13)).toBe(DEFAULT_SIGNATURE); // ID reservado
    expect(getHapticSignature(14)).toBe(DEFAULT_SIGNATURE);
  });

  it("non-number protocolId retorna DEFAULT_SIGNATURE (defensive)", () => {
    expect(getHapticSignature("15")).toBe(DEFAULT_SIGNATURE);
    expect(getHapticSignature(null)).toBe(DEFAULT_SIGNATURE);
    expect(getHapticSignature(undefined)).toBe(DEFAULT_SIGNATURE);
    expect(getHapticSignature({})).toBe(DEFAULT_SIGNATURE);
    expect(getHapticSignature(NaN)).toBe(DEFAULT_SIGNATURE);
    expect(getHapticSignature(Infinity)).toBe(DEFAULT_SIGNATURE);
  });
});

describe("F0-4 Capa-1 — DNA constraints per-tone", () => {
  // Calma protocolos: intensity_modifier <1.0 (softer)
  it("calma protocolos tienen intensity_modifier ≤ 0.95 (softer baseline)", () => {
    const calmaIds = [1, 6, 11, 15, 16, 17, 22];
    calmaIds.forEach((id) => {
      expect(HAPTIC_SIGNATURES[id].intensity_modifier).toBeLessThanOrEqual(0.95);
    });
  });

  // Foco/enfoque protocolos: intensity_modifier ≥1.1 (sharper)
  it("foco/enfoque protocolos tienen intensity_modifier ≥ 1.1 (sharper)", () => {
    const focoIds = [2, 5, 8];
    focoIds.forEach((id) => {
      expect(HAPTIC_SIGNATURES[id].intensity_modifier).toBeGreaterThanOrEqual(1.1);
    });
  });

  it("Lightning Focus #8 es el sharpest del catalog (intensity_modifier max)", () => {
    const allMods = Object.values(HAPTIC_SIGNATURES).map((s) => s.intensity_modifier);
    const max = Math.max(...allMods);
    expect(HAPTIC_SIGNATURES[8].intensity_modifier).toBe(max);
  });

  it("NSDR #17 es el softest del catalog (intensity_modifier min)", () => {
    const allMods = Object.values(HAPTIC_SIGNATURES).map((s) => s.intensity_modifier);
    const min = Math.min(...allMods);
    expect(HAPTIC_SIGNATURES[17].intensity_modifier).toBe(min);
  });

  it("Suspiro Fisiológico #15 (FLAGSHIP) tiene firma única doble-inhalación", () => {
    // 5 valores en breath_inhale = doble-inhalación pattern (no replicado en otros)
    const flagship = HAPTIC_SIGNATURES[15];
    expect(flagship.breath_inhale.length).toBe(5);
    // Verifica que NO hay otro protocolo con la misma secuencia exacta
    const flagshipKey = JSON.stringify(flagship.breath_inhale);
    const dupes = Object.entries(HAPTIC_SIGNATURES)
      .filter(([id, s]) => id !== "15" && JSON.stringify(s.breath_inhale) === flagshipKey);
    expect(dupes.length).toBe(0);
  });
});
