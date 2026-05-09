/* tokens.f3-5b1-color-evolution.test — SP-B-1 Capa 2.
   Verifica:
   1) phosphorCyanByPhase contiene 3 fases con hex válidos.
   2) getCyanForPhase helper defensive contracts.
   3) Anti-regression: phosphorCyan + phosphorCyanRgb existing preserved. */
import { describe, it, expect } from "vitest";
import { colors, getCyanForPhase } from "./tokens";

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

describe("F3.5-B1 Capa-2 — phosphorCyanByPhase shape", () => {
  it("phosphorCyanByPhase contiene 3 phases (phase1/phase2/phase3)", () => {
    expect(colors.accent.phosphorCyanByPhase).toBeDefined();
    expect(colors.accent.phosphorCyanByPhase.phase1).toBeDefined();
    expect(colors.accent.phosphorCyanByPhase.phase2).toBeDefined();
    expect(colors.accent.phosphorCyanByPhase.phase3).toBeDefined();
  });

  it("Cada fase color es valid hex 6-char (#RRGGBB)", () => {
    expect(colors.accent.phosphorCyanByPhase.phase1).toMatch(HEX_REGEX);
    expect(colors.accent.phosphorCyanByPhase.phase2).toMatch(HEX_REGEX);
    expect(colors.accent.phosphorCyanByPhase.phase3).toMatch(HEX_REGEX);
  });

  it("Hex específicos approved: phase1=#0E7490 (deep) phase2=#67E8F9 (cool) phase3=#06B6D4 (warm)", () => {
    expect(colors.accent.phosphorCyanByPhase.phase1).toBe("#0E7490");
    expect(colors.accent.phosphorCyanByPhase.phase2).toBe("#67E8F9");
    expect(colors.accent.phosphorCyanByPhase.phase3).toBe("#06B6D4");
  });
});

describe("F3.5-B1 Capa-2 — getCyanForPhase helper", () => {
  it("getCyanForPhase(0) returns phase1 cyan-deep #0E7490", () => {
    expect(getCyanForPhase(0)).toBe("#0E7490");
  });

  it("getCyanForPhase(1) returns phase2 cyan-cool #67E8F9", () => {
    expect(getCyanForPhase(1)).toBe("#67E8F9");
  });

  it("getCyanForPhase(2) returns phase3 cyan-warm #06B6D4", () => {
    expect(getCyanForPhase(2)).toBe("#06B6D4");
  });

  it("getCyanForPhase(undefined) returns base phosphorCyan #22D3EE", () => {
    expect(getCyanForPhase(undefined)).toBe("#22D3EE");
  });

  it("getCyanForPhase(null) returns base phosphorCyan", () => {
    expect(getCyanForPhase(null)).toBe("#22D3EE");
  });

  it("getCyanForPhase(99) returns base phosphorCyan (out of range)", () => {
    expect(getCyanForPhase(99)).toBe("#22D3EE");
    expect(getCyanForPhase(-1)).toBe("#22D3EE");
  });

  it("getCyanForPhase(NaN) returns base phosphorCyan (defensive)", () => {
    expect(getCyanForPhase(NaN)).toBe("#22D3EE");
    expect(getCyanForPhase(Infinity)).toBe("#22D3EE");
  });

  it("getCyanForPhase('1') returns base phosphorCyan (no string coercion)", () => {
    expect(getCyanForPhase("1")).toBe("#22D3EE");
  });
});

describe("F3.5-B1 Capa-2 — anti-regression existing tokens preserved", () => {
  it("colors.accent.phosphorCyan === '#22D3EE' (base unchanged)", () => {
    expect(colors.accent.phosphorCyan).toBe("#22D3EE");
  });

  it("colors.accent.phosphorCyanRgb === '34, 211, 238' (RGB triple unchanged)", () => {
    expect(colors.accent.phosphorCyanRgb).toBe("34, 211, 238");
  });

  it("colors.bg + colors.text + colors.semantic existing intactos", () => {
    expect(colors.bg.base).toBe("#08080A");
    expect(colors.text.primary).toBeDefined();
    expect(colors.semantic.warning).toBe("#f59e0b");
  });

  it("colors.focusRing === '#22D3EE' (focus ring unchanged)", () => {
    expect(colors.focusRing).toBe("#22D3EE");
  });
});
