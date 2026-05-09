/* audio.f3-5b1-crossfade.test — SP-B-1 Capa 5.
   Verifica utilities defensive contracts + anti-regression existing API.
   Note: Web Audio API real (AudioContext) NO está disponible en jsdom; tests
   verifican null-paths + does-not-throw + API surface. Schedule-call
   assertions deferred a real-browser smoke (Capa 6 anti-regression suite). */
import { describe, it, expect } from "vitest";
import {
  fadeOutNode,
  fadeInNode,
  crossfadeNodes,
  __crossfadeInternals,
  hapticBreath,
  hapticPhase,
  hapticSignature,
  hapticCountdown,
  hapticProtocolSignature,
  speak,
  startBinaural,
  stopBinaural,
} from "./audio";

describe("fadeOutNode — SP-B-1 Capa 5 defensive contracts", () => {
  it("returns null si audioNode null", () => {
    expect(fadeOutNode(null)).toBeNull();
    expect(fadeOutNode(undefined)).toBeNull();
  });

  it("returns null si audioNode sin gain", () => {
    expect(fadeOutNode({})).toBeNull();
    expect(fadeOutNode({ gain: null })).toBeNull();
  });

  it("returns null si gain sin exponentialRampToValueAtTime", () => {
    expect(fadeOutNode({ gain: { value: 0.5 } })).toBeNull();
  });

  it("returns null si AudioContext no disponible en jsdom (does NOT throw)", () => {
    const fakeNode = {
      gain: {
        value: 0.5,
        cancelScheduledValues: () => {},
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      },
    };
    // En jsdom gAC() puede retornar null si window.AudioContext no existe.
    // Fade utility debe ser null-safe en ambos casos.
    expect(() => fadeOutNode(fakeNode, 600)).not.toThrow();
  });

  it("Defensive: durationMs negative/NaN/huge no throw", () => {
    const fakeNode = {
      gain: {
        value: 0.5,
        cancelScheduledValues: () => {},
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      },
    };
    expect(() => fadeOutNode(fakeNode, -500)).not.toThrow();
    expect(() => fadeOutNode(fakeNode, NaN)).not.toThrow();
    expect(() => fadeOutNode(fakeNode, 999999)).not.toThrow();
    expect(() => fadeOutNode(fakeNode, Infinity)).not.toThrow();
  });
});

describe("fadeInNode — SP-B-1 Capa 5 defensive contracts", () => {
  it("returns null si audioNode null o sin gain", () => {
    expect(fadeInNode(null)).toBeNull();
    expect(fadeInNode({})).toBeNull();
    expect(fadeInNode({ gain: null })).toBeNull();
  });

  it("targetGain custom + duration no throw", () => {
    const fakeNode = {
      gain: {
        value: 0,
        cancelScheduledValues: () => {},
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      },
    };
    expect(() => fadeInNode(fakeNode, 0.8, 600)).not.toThrow();
    expect(() => fadeInNode(fakeNode, -0.5, 600)).not.toThrow(); // clamped
    expect(() => fadeInNode(fakeNode, NaN, 600)).not.toThrow();
  });
});

describe("crossfadeNodes — SP-B-1 Capa 5", () => {
  it("Returns object con outEnd + inEnd keys", () => {
    const result = crossfadeNodes(null, null);
    expect(result).toHaveProperty("outEnd");
    expect(result).toHaveProperty("inEnd");
  });

  it("Ambos null → returns { outEnd: null, inEnd: null }", () => {
    expect(crossfadeNodes(null, null)).toEqual({ outEnd: null, inEnd: null });
  });

  it("Solo outNode null → outEnd null + does-not-throw", () => {
    const fakeIn = {
      gain: {
        value: 0,
        cancelScheduledValues: () => {},
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      },
    };
    expect(() => crossfadeNodes(null, fakeIn)).not.toThrow();
    const r = crossfadeNodes(null, fakeIn);
    expect(r.outEnd).toBeNull();
  });

  it("Solo inNode null → inEnd null + does-not-throw", () => {
    const fakeOut = {
      gain: {
        value: 0.5,
        cancelScheduledValues: () => {},
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      },
    };
    expect(() => crossfadeNodes(fakeOut, null)).not.toThrow();
    const r = crossfadeNodes(fakeOut, null);
    expect(r.inEnd).toBeNull();
  });

  it("Defensive: durationMs invalid → no throw", () => {
    expect(() => crossfadeNodes(null, null, NaN)).not.toThrow();
    expect(() => crossfadeNodes(null, null, -100)).not.toThrow();
  });
});

describe("Audio Crossfade — SP-B-1 Capa 5 internals constants", () => {
  it("DEFAULT_MS = 600 (alineado TRANSITION_DURATION_MS)", () => {
    expect(__crossfadeInternals.DEFAULT_MS).toBe(600);
  });

  it("MIN_MS = 50 (perceptible mínimo)", () => {
    expect(__crossfadeInternals.MIN_MS).toBe(50);
  });

  it("MAX_MS = 5000 (cap razonable UX)", () => {
    expect(__crossfadeInternals.MAX_MS).toBe(5000);
  });

  it("NEAR_ZERO = 0.0001 (exponential never reaches 0)", () => {
    expect(__crossfadeInternals.NEAR_ZERO).toBe(0.0001);
  });
});

describe("Audio Crossfade — SP-B-1 Capa 5 anti-regression API surface", () => {
  it("Crossfade utilities exported (3 functions + internals)", () => {
    expect(typeof fadeOutNode).toBe("function");
    expect(typeof fadeInNode).toBe("function");
    expect(typeof crossfadeNodes).toBe("function");
    expect(typeof __crossfadeInternals).toBe("object");
  });

  it("Existing haptic API preserved (5 functions)", () => {
    expect(typeof hapticBreath).toBe("function");
    expect(typeof hapticPhase).toBe("function");
    expect(typeof hapticSignature).toBe("function");
    expect(typeof hapticCountdown).toBe("function");
    expect(typeof hapticProtocolSignature).toBe("function");
  });

  it("Speak + binaural infra preserved", () => {
    expect(typeof speak).toBe("function");
    expect(typeof startBinaural).toBe("function");
    expect(typeof stopBinaural).toBe("function");
  });
});
