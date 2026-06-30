import { describe, it, expect } from "vitest";
import { buildMusicSignature, MODES } from "./bioMusicSignature";

describe("buildMusicSignature", () => {
  it("determinista: mismo userId → misma firma", () => {
    const a = buildMusicSignature({ userId: "user-123" });
    const b = buildMusicSignature({ userId: "user-123" });
    expect(a).toEqual(b);
  });

  it("usuarios distintos pueden diferir (tonalidad/modo)", () => {
    const a = buildMusicSignature({ userId: "alice" });
    const b = buildMusicSignature({ userId: "zoe-9999" });
    // No garantiza diferencia, pero el seed sí difiere.
    expect(a.seed).not.toBe(b.seed);
  });

  it("estructura válida: root en set, mode de 7 grados, timbre", () => {
    const s = buildMusicSignature({ userId: "x" });
    expect(s.rootHz).toBeGreaterThan(50);
    expect(s.mode).toHaveLength(7);
    expect(["sine", "triangle"]).toContain(s.oscType);
    expect(Object.keys(MODES)).toContain(s.modeName);
  });

  it("cronotipo tiñe el modo: matutino → luminoso/claro", () => {
    const m = buildMusicSignature({ userId: "x", chronotype: { type: "definite_morning" } });
    expect(m.modeName).toBe("lydian");
    const m2 = buildMusicSignature({ userId: "x", chronotype: { type: "moderate_morning" } });
    expect(m2.modeName).toBe("ionian");
  });

  it("cronotipo vespertino → profundo", () => {
    const e = buildMusicSignature({ userId: "x", chronotype: { type: "definite_evening" } });
    expect(e.modeName).toBe("aeolian");
    const e2 = buildMusicSignature({ userId: "x", chronotype: { type: "moderate_evening" } });
    expect(e2.modeName).toBe("dorian");
  });

  it("HRV base alta → octava base elevada", () => {
    const lo = buildMusicSignature({ userId: "x", baselineRmssd: 25 });
    const hi = buildMusicSignature({ userId: "x", baselineRmssd: 55 });
    expect(lo.baseOctaveShift).toBe(0);
    expect(hi.baseOctaveShift).toBe(12);
  });

  it("sin userId no rompe (anon)", () => {
    const s = buildMusicSignature({});
    expect(s.mode).toHaveLength(7);
  });
});
