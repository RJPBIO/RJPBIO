/* ═══════════════════════════════════════════════════════════════
   primitives.signal-contract.test — Phase 7 SP-R..X blindaje
   ───────────────────────────────────────────────────────────────
   Lockea el signal contract para los primitives nuevos. Previene
   regresión del bug donde commitments emitían solo onLocalComplete
   sin emitir onSignal({holdMs}), causando que el pill "Continuar"
   nunca se habilite y los protocolos no avancen.

   Validaciones por kind (per useProtocolPlayer evaluateValidation):
     - hold_press   → signals.holdMs ≥ min_hold_ms
     - chip_selection → signals.selectedChipId truthy
     - tap_count    → signals.tapsCompleted ≥ min_taps
     - breath_cycles → signals.breathCyclesCompleted ≥ min_cycles

   Cada test renderiza PrimitiveSwitcher con act mock, simula el
   trigger del primitive y verifica que onSignal recibe el shape
   esperado ANTES (o en conjunto con) onLocalComplete.
   ═══════════════════════════════════════════════════════════════ */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, act, waitFor } from "@testing-library/react";

vi.mock("../../../lib/audio", () => ({
  playBreathTick: vi.fn(),
  hapticBreath: vi.fn(),
  hap: vi.fn(),
  hapticSignature: vi.fn(),
  hapticProtocolSignature: vi.fn(),
  playSpark: vi.fn(),
  playChord: vi.fn(),
  speak: vi.fn(),
  speakNow: vi.fn(),
}));

import PrimitiveSwitcher from "./PrimitiveSwitcher";

beforeEach(() => {
  if (typeof globalThis.requestAnimationFrame !== "function") {
    globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 16);
    globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
  }
});

function renderPrimitive(act) {
  const onSignal = vi.fn();
  const onLocalComplete = vi.fn();
  const utils = render(
    <PrimitiveSwitcher
      act={act}
      audioOn={false}
      hapticOn={false}
      voiceOn={false}
      onSignal={onSignal}
      onLocalComplete={onLocalComplete}
      fallbackSubtext=""
    />,
  );
  return { ...utils, onSignal, onLocalComplete };
}

describe("Signal contract — hold_press commitments (Phase 7 SP-R..X)", () => {
  const HOLD_COMMITMENTS = [
    { primitive: "panic_anchor_closure", testid: "panic-anchor-closure-primitive", btnTestId: "panic-anchor-hold-button", minHoldMs: 3000 },
    { primitive: "micro_action_momentum", testid: "micro-action-momentum-primitive", btnTestId: "micro-action-hold-button", minHoldMs: 3000 },
    { primitive: "threshold_commitment", testid: "threshold-commitment-primitive", btnTestId: "threshold-commitment-hold-button", minHoldMs: 5000 },
    { primitive: "calm_commitment", testid: "calm-commitment-primitive", btnTestId: "calm-commitment-hold-button", minHoldMs: 5000 },
    { primitive: "posture_energy_commitment", testid: "posture-energy-commitment-primitive", btnTestId: "posture-energy-hold-button", minHoldMs: 5000 },
    { primitive: "stable_closing_commitment", testid: "stable-closing-commitment-primitive", btnTestId: "stable-closing-hold-button", minHoldMs: 5000 },
    { primitive: "coherent_closing_commitment", testid: "coherent-closing-commitment-primitive", btnTestId: "coherent-closing-hold-button", minHoldMs: 5000 },
  ];

  HOLD_COMMITMENTS.forEach(({ primitive, testid, btnTestId, minHoldMs }) => {
    it(`${primitive} emite onSignal({holdMs}) al completar el hold`, async () => {
      vi.useFakeTimers();
      const act_ = {
        type: "commitment_motor",
        validate: { kind: "hold_press", min_hold_ms: minHoldMs },
        ui: { primitive, props: { min_hold_ms: minHoldMs, release_message: "OK" } },
        duration: { target_ms: 30000 },
        media: {},
      };
      const { onSignal, onLocalComplete, getByTestId, unmount } = renderPrimitive(act_);

      const btn = getByTestId(btnTestId);
      fireEvent.mouseDown(btn);
      // Advance past minHoldMs
      await act(async () => {
        await vi.advanceTimersByTimeAsync(minHoldMs + 100);
      });

      // Critical assertion: onSignal called with holdMs
      expect(onSignal).toHaveBeenCalledWith(
        expect.objectContaining({ holdMs: expect.any(Number) })
      );
      const holdCall = onSignal.mock.calls.find((c) => c[0]?.holdMs != null);
      expect(holdCall[0].holdMs).toBeGreaterThanOrEqual(minHoldMs);
      // And onLocalComplete also called
      expect(onLocalComplete).toHaveBeenCalled();

      unmount();
      vi.useRealTimers();
    });
  });
});

describe("Signal contract — chip_selection primitives (Phase 7 SP-R..X)", () => {
  const CHIP_PRIMITIVES = [
    {
      primitive: "reencuadre_choice",
      chipTestId: "reencuadre-chip-perspective",
      chips: [
        { id: "perspective", label: "Otra perspectiva" },
        { id: "external_help", label: "Pedir ayuda" },
        { id: "pause", label: "Pausa" },
      ],
      minThinkingMs: 100, // override para evitar wait largo en test
    },
    {
      primitive: "load_identification",
      chipTestId: "load-chip-frustration",
      chips: [
        { id: "frustration", label: "Frustración" },
        { id: "fatigue", label: "Fatiga" },
      ],
      minThinkingMs: undefined,
    },
  ];

  CHIP_PRIMITIVES.forEach(({ primitive, chipTestId, chips, minThinkingMs }) => {
    it(`${primitive} emite onSignal({selectedChipId}) al seleccionar chip`, async () => {
      vi.useFakeTimers();
      const act_ = {
        type: "cognitive_anchor",
        validate: { kind: "chip_selection", required: true },
        ui: {
          primitive,
          props: { question: "¿Test?", chips, ...(minThinkingMs != null ? { min_thinking_ms: minThinkingMs } : {}) },
        },
        duration: { target_ms: 30000 },
        media: {},
      };
      const { onSignal, getByTestId, unmount } = renderPrimitive(act_);

      // Esperar thinking window si aplica
      if (minThinkingMs) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(minThinkingMs + 100);
        });
      }

      const chipBtn = getByTestId(chipTestId);
      fireEvent.click(chipBtn);

      expect(onSignal).toHaveBeenCalledWith(
        expect.objectContaining({ selectedChipId: expect.any(String) })
      );

      unmount();
      vi.useRealTimers();
    });
  });
});

describe("Signal contract — tap_count primitives (Phase 7 SP-R..X)", () => {
  it("vagal_humming_resonance emite onSignal({tapsCompleted: n}) en cada ciclo", async () => {
    vi.useFakeTimers();
    const act_ = {
      type: "vocal_resonance",
      validate: { kind: "tap_count", min_taps: 4 },
      ui: { primitive: "vagal_humming_resonance", props: { target_hums: 4, hum_duration_ms: 10000 } },
      duration: { target_ms: 56000 },
      media: {},
    };
    const { onSignal, unmount } = renderPrimitive(act_);

    // Advance through 2 cycles (each 14s = 4s inhale + 10s hum)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(28100);
    });

    const tapCalls = onSignal.mock.calls.filter((c) => c[0]?.tapsCompleted != null);
    expect(tapCalls.length).toBeGreaterThanOrEqual(1);

    unmount();
    vi.useRealTimers();
  });

  it("walking_unilateral emite onSignal({tapsCompleted: n}) en cada tap del button", async () => {
    const act_ = {
      type: "walking_meditation",
      validate: { kind: "tap_count", min_taps: 8 },
      ui: { primitive: "walking_unilateral", props: { target_steps: 8, pattern: "left_only", pace_bpm: 60 } },
      duration: { target_ms: 40000 },
      media: {},
    };
    const { onSignal, getByTestId, unmount } = renderPrimitive(act_);

    const btn = getByTestId("walking-unilateral-tap-button");
    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);

    const tapCalls = onSignal.mock.calls.filter((c) => c[0]?.tapsCompleted != null);
    expect(tapCalls.length).toBe(3);
    expect(tapCalls[2][0].tapsCompleted).toBe(3);

    unmount();
  });
});

describe("Signal contract — breath_cycles primitive (Phase 7 SP-V)", () => {
  it("energizing_breath emite onSignal({breathCyclesCompleted: n}) en cada ciclo", async () => {
    vi.useFakeTimers();
    const act_ = {
      type: "breath",
      validate: { kind: "breath_cycles", min_cycles: 4 },
      ui: { primitive: "energizing_breath", props: { target_cycles: 4 } },
      duration: { target_ms: 32000 },
      media: {},
    };
    const { onSignal, unmount } = renderPrimitive(act_);

    // Advance through 2 cycles (each 8s = 4s in + 4s ex)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(16100);
    });

    const cycleCalls = onSignal.mock.calls.filter((c) => c[0]?.breathCyclesCompleted != null);
    expect(cycleCalls.length).toBeGreaterThanOrEqual(1);

    unmount();
    vi.useRealTimers();
  });
});

describe("Signal contract — regression guards", () => {
  it("chip primitives emiten 'selectedChipId' (no 'selectedChip' wrong key)", async () => {
    vi.useFakeTimers();
    const primitives = [
      { primitive: "reencuadre_choice", chipTestId: "reencuadre-chip-a", minThinkingMs: 50 },
      { primitive: "load_identification", chipTestId: "load-chip-a", minThinkingMs: 50 },
    ];
    for (const { primitive, chipTestId, minThinkingMs } of primitives) {
      const act_ = {
        type: "cognitive_anchor",
        validate: { kind: "chip_selection", required: true },
        ui: {
          primitive,
          props: {
            question: "?",
            chips: [{ id: "a", label: "A" }, { id: "b", label: "B" }],
            min_thinking_ms: minThinkingMs,
          },
        },
        duration: { target_ms: 30000 },
        media: {},
      };
      const { onSignal, getByTestId, unmount } = renderPrimitive(act_);
      // Advance past thinking window (reencuadre only — load_identification ignores)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(minThinkingMs + 100);
      });
      fireEvent.click(getByTestId(chipTestId));

      const wrongKeyCalls = onSignal.mock.calls.filter((c) => c[0] && "selectedChip" in c[0] && !("selectedChipId" in c[0]));
      expect(wrongKeyCalls.length).toBe(0);
      const correctCalls = onSignal.mock.calls.filter((c) => c[0]?.selectedChipId);
      expect(correctCalls.length).toBeGreaterThanOrEqual(1);
      unmount();
    }
    vi.useRealTimers();
  });
});
