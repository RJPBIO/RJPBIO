/* audio.f0-4-haptic.test — Phase 7 F0-4 Capa 2.
   Verifica que hapticProtocolSignature:
   1) Consume catalog HAPTIC_SIGNATURES via getHapticSignature.
   2) Reusa internal vibrate() wrapper (intensity scaling + iOS fallback).
   3) Aplica intensity_modifier × callerIntensity (clamped 0.5-1.5).
   4) Respeta reducedMotion option.
   5) Defensive: invalid args → no-op.
   6) Anti-regression: hapticBreath/hapticPhase/hapticSignature/hapticCountdown
      siguen existiendo y funcionando.
*/
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// jsdom no provee navigator.vibrate — mockear en window.
function mockNavigatorVibrate() {
  const fn = vi.fn(() => true);
  Object.defineProperty(global.navigator, "vibrate", {
    configurable: true,
    writable: true,
    value: fn,
  });
  return fn;
}

function clearNavigatorVibrate() {
  try {
    delete global.navigator.vibrate;
  } catch (e) { /* noop */ }
}

beforeEach(() => {
  clearNavigatorVibrate();
});

afterEach(() => {
  clearNavigatorVibrate();
  vi.restoreAllMocks();
});

describe("F0-4 Capa-2 — hapticProtocolSignature exports", () => {
  it("export existe en audio.js", async () => {
    const audio = await import("./audio");
    expect(typeof audio.hapticProtocolSignature).toBe("function");
  });

  it("anti-regression: existing haptic functions siguen exportadas", async () => {
    const audio = await import("./audio");
    expect(typeof audio.hapticBreath).toBe("function");
    expect(typeof audio.hapticPhase).toBe("function");
    expect(typeof audio.hapticSignature).toBe("function");
    expect(typeof audio.hapticPreShift).toBe("function");
    expect(typeof audio.hapticCountdown).toBe("function");
    expect(typeof audio.setHapticFallback).toBe("function");
  });
});

describe("F0-4 Capa-2 — hapticProtocolSignature behavior", () => {
  it("dispara navigator.vibrate cuando API disponible (known protocolId + phase)", async () => {
    const vibrateMock = mockNavigatorVibrate();
    const { hapticProtocolSignature } = await import("./audio");
    hapticProtocolSignature(15, "breath_inhale"); // Suspiro Fisiológico
    expect(vibrateMock).toHaveBeenCalledTimes(1);
    const arg = vibrateMock.mock.calls[0][0];
    expect(Array.isArray(arg)).toBe(true);
    expect(arg.length).toBeGreaterThan(0);
  });

  it("aplica intensity_modifier de signature al patrón base", async () => {
    const vibrateMock = mockNavigatorVibrate();
    const { hapticProtocolSignature } = await import("./audio");
    // #15 intensity_modifier=0.90; breath_inhale=[40, 20, 30, 20, 80]
    // Indices pares (0,2,4) escalan: 40*0.9=36, 30*0.9=27, 80*0.9=72.
    // Wrapper aplica floor 30ms a duraciones pares: [36→36, 20, 27→30, 20, 72→72]
    hapticProtocolSignature(15, "breath_inhale");
    const arg = vibrateMock.mock.calls[0][0];
    // Verifica longitud preservada (5 valores)
    expect(arg.length).toBe(5);
    // Verifica que las duraciones (índices pares) son menores que originales
    expect(arg[0]).toBeLessThanOrEqual(40);
    expect(arg[2]).toBeGreaterThanOrEqual(30); // floor 30
    expect(arg[4]).toBeLessThanOrEqual(80);
  });

  it("aplica callerIntensity option × signature.intensity_modifier", async () => {
    const vibrateMock = mockNavigatorVibrate();
    const { hapticProtocolSignature } = await import("./audio");
    // #15 mod=0.9, callerIntensity=0.5 → factor=0.45 → clamp a 0.5
    // Original: [40,20,30,20,80] → con factor 0.5: [20→30 floor, 20, 15→30, 20, 40]
    hapticProtocolSignature(15, "breath_inhale", { intensity: 0.5 });
    const arg = vibrateMock.mock.calls[0][0];
    expect(arg[0]).toBeGreaterThanOrEqual(20); // pre-floor 20, post-floor 30
    expect(arg[4]).toBeLessThanOrEqual(40);    // 80*0.5 = 40
  });

  it("clamp intensity factor a [0.5, 1.5] (defensive vs callers absurdos)", async () => {
    const vibrateMock = mockNavigatorVibrate();
    const { hapticProtocolSignature } = await import("./audio");
    // Insane intensity 1000 → clamp 1.5; #15 mod=0.9 × 1000 = 900 → clamp 1.5
    hapticProtocolSignature(15, "breath_inhale", { intensity: 1000 });
    const arg = vibrateMock.mock.calls[0][0];
    expect(arg.length).toBe(5);
    // Cada duración par (índice 0,2,4) debería ser ≤ original × 1.5
    expect(arg[0]).toBeLessThanOrEqual(60); // 40 * 1.5
    expect(arg[4]).toBeLessThanOrEqual(120); // 80 * 1.5
  });

  it("unknown protocolId → DEFAULT_SIGNATURE pattern (intensity_modifier 1.0)", async () => {
    const vibrateMock = mockNavigatorVibrate();
    const { hapticProtocolSignature } = await import("./audio");
    hapticProtocolSignature(999, "breath_inhale");
    expect(vibrateMock).toHaveBeenCalledTimes(1);
    // DEFAULT breath_inhale = [40, 30, 60]
    const arg = vibrateMock.mock.calls[0][0];
    expect(arg.length).toBe(3);
  });

  it("non-numeric protocolId → DEFAULT_SIGNATURE pattern", async () => {
    const vibrateMock = mockNavigatorVibrate();
    const { hapticProtocolSignature } = await import("./audio");
    hapticProtocolSignature("15", "breath_inhale");
    expect(vibrateMock).toHaveBeenCalledTimes(1);
    // Aún así dispara — usa DEFAULT_SIGNATURE
    const arg = vibrateMock.mock.calls[0][0];
    expect(arg.length).toBe(3); // DEFAULT length
  });
});

describe("F0-4 Capa-2 — hapticProtocolSignature defensive contracts", () => {
  it("phaseKind no-string → no-op (no vibrate)", async () => {
    const vibrateMock = mockNavigatorVibrate();
    const { hapticProtocolSignature } = await import("./audio");
    hapticProtocolSignature(15, null);
    hapticProtocolSignature(15, undefined);
    hapticProtocolSignature(15, 42);
    hapticProtocolSignature(15, {});
    expect(vibrateMock).not.toHaveBeenCalled();
  });

  it("unknown phaseKind ('not_a_kind') → no-op", async () => {
    const vibrateMock = mockNavigatorVibrate();
    const { hapticProtocolSignature } = await import("./audio");
    hapticProtocolSignature(15, "not_a_kind");
    expect(vibrateMock).not.toHaveBeenCalled();
  });

  it("options no-object (passed string/array) tolerado sin crash", async () => {
    const vibrateMock = mockNavigatorVibrate();
    const { hapticProtocolSignature } = await import("./audio");
    expect(() => hapticProtocolSignature(15, "breath_inhale", "junk")).not.toThrow();
    expect(() => hapticProtocolSignature(15, "breath_inhale", null)).not.toThrow();
    expect(vibrateMock).toHaveBeenCalled(); // proceeded with defaults
  });

  it("options.intensity NaN → fallback a 1.0", async () => {
    const vibrateMock = mockNavigatorVibrate();
    const { hapticProtocolSignature } = await import("./audio");
    hapticProtocolSignature(15, "breath_inhale", { intensity: NaN });
    expect(vibrateMock).toHaveBeenCalledTimes(1);
  });
});

describe("F0-4 Capa-2 — reducedMotion path + iOS fallback", () => {
  it("reducedMotion=true → NO vibra, dispara fallback visual con 'phase-shift'", async () => {
    const vibrateMock = mockNavigatorVibrate();
    const { hapticProtocolSignature, setHapticFallback } = await import("./audio");
    const fallbackMock = vi.fn();
    setHapticFallback(fallbackMock);
    hapticProtocolSignature(15, "breath_inhale", { reducedMotion: true });
    expect(vibrateMock).not.toHaveBeenCalled();
    expect(fallbackMock).toHaveBeenCalledWith("phase-shift");
    setHapticFallback(null);
  });

  it("reducedMotion=true sin fallback registrado → no crash, no-op", async () => {
    const vibrateMock = mockNavigatorVibrate();
    const { hapticProtocolSignature, setHapticFallback } = await import("./audio");
    setHapticFallback(null);
    expect(() =>
      hapticProtocolSignature(15, "breath_inhale", { reducedMotion: true })
    ).not.toThrow();
    expect(vibrateMock).not.toHaveBeenCalled();
  });

  it("sin navigator.vibrate (iOS Safari) → wrapper dispara fallback con pattern", async () => {
    clearNavigatorVibrate();
    const { hapticProtocolSignature, setHapticFallback } = await import("./audio");
    const fallbackMock = vi.fn();
    setHapticFallback(fallbackMock);
    hapticProtocolSignature(15, "breath_inhale");
    // El wrapper internal vibrate() llama _hapticFallback con el pattern
    // (no con el string 'phase-shift' — eso es solo el reducedMotion path).
    expect(fallbackMock).toHaveBeenCalledTimes(1);
    const arg = fallbackMock.mock.calls[0][0];
    expect(Array.isArray(arg)).toBe(true);
    setHapticFallback(null);
  });
});

describe("F0-4 Capa-2 — anti-regression: existing haptic APIs intactos", () => {
  it("hapticBreath('INHALA') sigue invocando navigator.vibrate", async () => {
    const vibrateMock = mockNavigatorVibrate();
    const { hapticBreath } = await import("./audio");
    hapticBreath("INHALA");
    expect(vibrateMock).toHaveBeenCalledTimes(1);
  });

  it("hapticPhase('breath') sigue invocando navigator.vibrate", async () => {
    const vibrateMock = mockNavigatorVibrate();
    const { hapticPhase } = await import("./audio");
    hapticPhase("breath");
    expect(vibrateMock).toHaveBeenCalledTimes(1);
  });

  it("hapticSignature('ignition') sigue invocando navigator.vibrate", async () => {
    const vibrateMock = mockNavigatorVibrate();
    const { hapticSignature } = await import("./audio");
    hapticSignature("ignition");
    expect(vibrateMock).toHaveBeenCalledTimes(1);
  });

  it("hapticCountdown(1) sigue invocando navigator.vibrate", async () => {
    const vibrateMock = mockNavigatorVibrate();
    const { hapticCountdown } = await import("./audio");
    hapticCountdown(1);
    expect(vibrateMock).toHaveBeenCalledTimes(1);
  });
});
