import { describe, it, expect } from "vitest";
import { EVIDENCE, getEvidence, evidenceIds, evidenceForProtocol } from "./evidence";

describe("evidence registry", () => {
  it("cada card tiene campos requeridos", () => {
    for (const [id, card] of Object.entries(EVIDENCE)) {
      expect(card.id).toBe(id);
      expect(card.title).toBeTruthy();
      expect(card.mechanism).toBeTruthy();
      expect(Array.isArray(card.studies)).toBe(true);
      expect(card.studies.length).toBeGreaterThan(0);
      expect(["high", "moderate", "limited"]).toContain(card.evidenceLevel);
    }
  });

  it("getEvidence devuelve card o null", () => {
    expect(getEvidence("physiological_sigh")).toBeTruthy();
    expect(getEvidence("no-existe")).toBeNull();
  });

  it("evidenceIds devuelve todas las keys", () => {
    const ids = evidenceIds();
    expect(ids).toContain("physiological_sigh");
    expect(ids.length).toBe(Object.keys(EVIDENCE).length);
  });
});

describe("evidenceForProtocol", () => {
  it("null cuando proto no existe", () => {
    expect(evidenceForProtocol(null)).toBeNull();
  });

  it("nombre 'Reinicio Parasimpático' → box_breathing", () => {
    const e = evidenceForProtocol({ n: "Reinicio Parasimpático", int: "calma" });
    expect(e.id).toBe("box_breathing");
  });

  it("'Suspiro' → physiological_sigh", () => {
    const e = evidenceForProtocol({ n: "Suspiro fisiológico", int: "calma" });
    expect(e.id).toBe("physiological_sigh");
  });

  it("'NSDR' → nsdr", () => {
    const e = evidenceForProtocol({ n: "NSDR 10 min", int: "calma" });
    expect(e.id).toBe("nsdr");
  });

  it("'Coherencia' → resonance_breathing", () => {
    const e = evidenceForProtocol({ n: "Coherencia cardíaca", int: "calma" });
    expect(e.id).toBe("resonance_breathing");
  });

  it("'Etiquetado' → affect_labeling", () => {
    const e = evidenceForProtocol({ n: "Etiquetado emocional", int: "calma" });
    expect(e.id).toBe("affect_labeling");
  });

  it("intent enfoque sin match → meditation", () => {
    const e = evidenceForProtocol({ n: "Protocolo X", int: "enfoque" });
    expect(e.id).toBe("meditation");
  });

  it("intent calma sin match → resonance_breathing", () => {
    const e = evidenceForProtocol({ n: "Protocolo Y", int: "calma" });
    expect(e.id).toBe("resonance_breathing");
  });

  it("intent desconocido → box_breathing (default)", () => {
    const e = evidenceForProtocol({ n: "Protocolo Z", int: "energia" });
    expect(e.id).toBe("box_breathing");
  });
});
