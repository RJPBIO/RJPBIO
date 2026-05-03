/* ═══════════════════════════════════════════════════════════════
   protocols.test — Phase 4 SP1
   Verifica:
   - Catálogo: 18 protocolos, IDs 13/14 ausentes.
   - Renames: #10 = "Sensory Wake", #11 = "Body Anchor".
   - Refactor: #12 Neural Ascension tiene 4 fases.
   - Helpers: getActiveProtocols / getCrisisProtocols / getTrainingProtocols.
   - inferActDefaults rellena defaults para actos legacy.
   ═══════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import {
  P,
  inferActDefaults,
  getActiveProtocols,
  getCrisisProtocols,
  getTrainingProtocols,
} from "./protocols";

describe("Phase 4 SP1 — catálogo post-eliminación OMEGA/OMNIA (Phase 5 SP3-SP5)", () => {
  it("P contiene 23 protocolos (18 base + #21 + #22 + #23 + #24 + #25)", () => {
    expect(P.length).toBe(23);
  });

  it("getActiveProtocols() devuelve 18 (todos active de SP3-SP5 sumados)", () => {
    // Phase 4 SP1: 12 base activos + #15 → 13.
    // Phase 5 SP3: +#21 → 14.
    // Phase 5 SP4: +#22 + #23 → 16.
    // Phase 5 SP5: +#24 + #25 → 18.
    expect(getActiveProtocols().length).toBe(18);
  });

  it("getCrisisProtocols() devuelve 3 (#18, #19, #20)", () => {
    const crisis = getCrisisProtocols();
    expect(crisis.length).toBe(3);
    expect(crisis.map((p) => p.id).sort((a, b) => a - b)).toEqual([18, 19, 20]);
  });

  it("getTrainingProtocols() devuelve 2 (#16 Resonancia Vagal, #17 NSDR)", () => {
    // El catálogo declara explícitamente useCase:"training" sólo en #16 y #17.
    // Spec original asumía 3 training; #15 sería el candidato natural pero
    // no está marcado como tal — discrepancia documentada en microscope
    // report SP1.
    const training = getTrainingProtocols();
    expect(training.length).toBe(2);
    expect(training.map((p) => p.id).sort((a, b) => a - b)).toEqual([16, 17]);
  });

  it("P NO contiene IDs 13 ni 14", () => {
    const ids = new Set(P.map((p) => p.id));
    expect(ids.has(13)).toBe(false);
    expect(ids.has(14)).toBe(false);
  });

  it("protocolo #10 tiene name \"Sensory Wake\"", () => {
    const p10 = P.find((p) => p.id === 10);
    expect(p10).toBeDefined();
    expect(p10.n).toBe("Sensory Wake");
  });

  it("protocolo #11 tiene name \"Body Anchor\"", () => {
    const p11 = P.find((p) => p.id === 11);
    expect(p11).toBeDefined();
    expect(p11.n).toBe("Body Anchor");
  });

  it("protocolo #12 Neural Ascension tiene 4 fases (refactor profundo)", () => {
    const p12 = P.find((p) => p.id === 12);
    expect(p12).toBeDefined();
    expect(p12.n).toBe("Neural Ascension");
    expect(Array.isArray(p12.ph)).toBe(true);
    expect(p12.ph.length).toBe(4);
  });
});

describe("inferActDefaults — backwards-compat upgrade de actos legacy", () => {
  it("acto sin type infere desde phase.ic (breath → \"breath\")", () => {
    const phase = { ic: "breath", s: 0, br: { in: 4, h1: 0, ex: 6, h2: 0 } };
    const protocol = { id: 1, int: "calma" };
    const upgraded = inferActDefaults({ from: 0, to: 30, text: "x" }, phase, protocol);
    expect(upgraded.type).toBe("breath");
  });

  it("infera duration desde from/to en ms", () => {
    const phase = { ic: "mind" };
    const upgraded = inferActDefaults({ from: 0, to: 20, text: "x" }, phase, { id: 1, int: "calma" });
    expect(upgraded.duration).toBeDefined();
    expect(upgraded.duration.target_ms).toBe(20000);
    expect(upgraded.duration.min_ms).toBeLessThan(20000);
    expect(upgraded.duration.max_ms).toBeGreaterThan(20000);
  });

  it("crisis useCase produce validate.kind \"no_validation\"", () => {
    const phase = { ic: "body" };
    const protocol = { id: 18, int: "reset", useCase: "crisis" };
    const upgraded = inferActDefaults({ from: 0, to: 30, text: "x" }, phase, protocol);
    expect(upgraded.validate.kind).toBe("no_validation");
  });

  it("breath phase produce validate.kind \"breath_cycles\" (active)", () => {
    const phase = { ic: "breath", br: { in: 4, h1: 4, ex: 4, h2: 4 } };
    const protocol = { id: 1, int: "calma" };
    const upgraded = inferActDefaults({ from: 0, to: 32, text: "x" }, phase, protocol);
    expect(upgraded.validate.kind).toBe("breath_cycles");
    expect(upgraded.validate.min_cycles).toBeGreaterThanOrEqual(1);
  });

  it("non-breath active produce validate.kind \"min_duration\" 70%", () => {
    const phase = { ic: "mind" };
    const protocol = { id: 2, int: "enfoque" };
    const upgraded = inferActDefaults({ from: 0, to: 60, text: "x" }, phase, protocol);
    expect(upgraded.validate.kind).toBe("min_duration");
    expect(upgraded.validate.min_ms).toBe(42000); // floor(60 * 1000 * 0.7)
  });

  it("ui.primitive default = \"breath_orb\" para tipo breath", () => {
    const phase = { ic: "breath", br: { in: 4, h1: 0, ex: 6, h2: 0 } };
    const upgraded = inferActDefaults({ from: 0, to: 30, text: "x" }, phase, { id: 1, int: "calma" });
    expect(upgraded.ui.primitive).toBe("breath_orb");
  });

  it("media.voice.enabled_default ON solo en crisis", () => {
    const phaseB = { ic: "breath", br: { in: 4, h1: 0, ex: 6, h2: 0 } };
    const active = inferActDefaults({ from: 0, to: 30, text: "x" }, phaseB, { id: 1, int: "calma" });
    const crisis = inferActDefaults({ from: 0, to: 30, text: "x" }, phaseB, { id: 18, int: "reset", useCase: "crisis" });
    expect(active.media.voice.enabled_default).toBe(false);
    expect(crisis.media.voice.enabled_default).toBe(true);
  });

  it("idempotente: respeta campos ya presentes en el acto", () => {
    const phase = { ic: "breath" };
    const protocol = { id: 1, int: "calma" };
    const customAct = {
      from: 0, to: 30, text: "x",
      type: "vocalization",
      validate: { kind: "tap_count", min_taps: 8 },
    };
    const upgraded = inferActDefaults(customAct, phase, protocol);
    expect(upgraded.type).toBe("vocalization"); // no override
    expect(upgraded.validate.kind).toBe("tap_count"); // no override
  });
});
