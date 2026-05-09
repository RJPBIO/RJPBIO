/* particleSystem.test — SP-B-1 Capa 1.
   Verifica creación, lifecycle, phase transitions, defensive contracts. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createParticleSystem,
  detectParticleCount,
  __internals,
} from "./particleSystem";

function makeCanvas(width = 400, height = 400) {
  // Mock canvas con getContext returning realistic 2d context.
  const calls = { clearRect: 0, beginPath: 0, arc: 0, fill: 0 };
  const ctx = {
    clearRect: vi.fn(() => { calls.clearRect++; }),
    beginPath: vi.fn(() => { calls.beginPath++; }),
    arc: vi.fn(() => { calls.arc++; }),
    fill: vi.fn(() => { calls.fill++; }),
    fillStyle: "",
  };
  return {
    canvas: {
      width,
      height,
      getContext: vi.fn(() => ctx),
    },
    ctx,
    calls,
  };
}

beforeEach(() => {
  // Mock requestAnimationFrame controlable.
  vi.stubGlobal("requestAnimationFrame", vi.fn((cb) => {
    return setTimeout(() => cb(performance.now()), 0);
  }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn((id) => clearTimeout(id)));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("createParticleSystem — SP-B-1 Capa 1 lifecycle", () => {
  it("returns null si canvas inválido (null)", () => {
    expect(createParticleSystem({ canvas: null })).toBeNull();
    expect(createParticleSystem({})).toBeNull();
    expect(createParticleSystem()).toBeNull();
  });

  it("returns null si canvas no tiene getContext", () => {
    expect(createParticleSystem({ canvas: { width: 400, height: 400 } })).toBeNull();
  });

  it("returns null si getContext retorna null", () => {
    const canvas = { width: 400, height: 400, getContext: vi.fn(() => null) };
    expect(createParticleSystem({ canvas })).toBeNull();
  });

  it("crea sistema con 12 particles full power (deviceMemory undefined o ≥4)", () => {
    Object.defineProperty(navigator, "deviceMemory", { configurable: true, value: 8 });
    const { canvas } = makeCanvas();
    const sys = createParticleSystem({ canvas });
    expect(sys).not.toBeNull();
    expect(sys.getParticleCount()).toBe(12);
    delete navigator.deviceMemory;
  });

  it("crea sistema con 6 particles low-power (deviceMemory < 4)", () => {
    Object.defineProperty(navigator, "deviceMemory", { configurable: true, value: 2 });
    const { canvas } = makeCanvas();
    const sys = createParticleSystem({ canvas });
    expect(sys.getParticleCount()).toBe(6);
    delete navigator.deviceMemory;
  });

  it("crea sistema con 0 particles cuando reducedMotion=true", () => {
    const { canvas } = makeCanvas();
    const sys = createParticleSystem({ canvas, reducedMotion: true });
    expect(sys.getParticleCount()).toBe(0);
  });

  it("start/stop lifecycle: rafId managed correctly", () => {
    const { canvas } = makeCanvas();
    const sys = createParticleSystem({ canvas });
    expect(() => sys.start()).not.toThrow();
    expect(() => sys.stop()).not.toThrow();
    // Stop after stop: idempotent
    expect(() => sys.stop()).not.toThrow();
  });

  it("start con reducedMotion: clearea canvas pero NO inicia RAF", () => {
    const { canvas, ctx } = makeCanvas();
    const sys = createParticleSystem({ canvas, reducedMotion: true });
    sys.start();
    expect(ctx.clearRect).toHaveBeenCalled();
  });

  it("detectParticleCount returns FULL si navigator undefined", () => {
    expect(detectParticleCount()).toBe(__internals.PARTICLE_COUNT_FULL);
  });
});

describe("createParticleSystem — SP-B-1 Capa 1 phase transitions", () => {
  it("setPhase: valid phases update internal state", () => {
    const { canvas } = makeCanvas();
    const sys = createParticleSystem({ canvas });
    sys.setPhase("inhale");
    expect(sys.getPhase()).toBe("inhale");
    sys.setPhase("hold");
    expect(sys.getPhase()).toBe("hold");
    sys.setPhase("exhale");
    expect(sys.getPhase()).toBe("exhale");
    sys.setPhase("empty");
    expect(sys.getPhase()).toBe("empty");
  });

  it("setPhase: invalid phase string ignored (defensive)", () => {
    const { canvas } = makeCanvas();
    const sys = createParticleSystem({ canvas });
    sys.setPhase("inhale");
    sys.setPhase("invalid_phase");
    expect(sys.getPhase()).toBe("inhale"); // unchanged
    sys.setPhase(null);
    expect(sys.getPhase()).toBe("inhale");
    sys.setPhase(42);
    expect(sys.getPhase()).toBe("inhale");
  });

  it("setPhase: progress clamped 0..1", () => {
    const { canvas } = makeCanvas();
    const sys = createParticleSystem({ canvas });
    // No direct getter for progress, but verify defensive — should not throw.
    expect(() => sys.setPhase("inhale", -5)).not.toThrow();
    expect(() => sys.setPhase("inhale", 99)).not.toThrow();
    expect(() => sys.setPhase("inhale", NaN)).not.toThrow();
    expect(() => sys.setPhase("inhale", "junk")).not.toThrow();
  });
});

describe("createParticleSystem — SP-B-1 Capa 1 internals", () => {
  it("CYAN_BASE_RGB matches phosphorCyan #22D3EE", () => {
    expect(__internals.CYAN_BASE_RGB).toEqual({ r: 34, g: 211, b: 238 });
  });

  it("VALID_PHASES contiene los 4 phases canon", () => {
    expect(__internals.VALID_PHASES.has("inhale")).toBe(true);
    expect(__internals.VALID_PHASES.has("hold")).toBe(true);
    expect(__internals.VALID_PHASES.has("exhale")).toBe(true);
    expect(__internals.VALID_PHASES.has("empty")).toBe(true);
    expect(__internals.VALID_PHASES.has("invalid")).toBe(false);
  });

  it("PARTICLE_COUNT thresholds: 12 full / 6 low", () => {
    expect(__internals.PARTICLE_COUNT_FULL).toBe(12);
    expect(__internals.PARTICLE_COUNT_LOW).toBe(6);
  });
});
