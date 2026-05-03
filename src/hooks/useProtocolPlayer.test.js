/* ═══════════════════════════════════════════════════════════════
   useProtocolPlayer.test — Phase 4 SP3
   Tests del hook consolidado: state machine, validación, acreditación.
   ═══════════════════════════════════════════════════════════════ */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";

vi.mock("../lib/audio", () => ({
  startBinaural: vi.fn(),
  stopBinaural: vi.fn(),
  hapticSignature: vi.fn(),
  requestWakeLock: vi.fn(),
  releaseWakeLock: vi.fn(),
  unlockAudio: vi.fn(),
}));

import { useProtocolPlayer, __internals } from "./useProtocolPlayer";

const ACTIVE_PROTO = {
  id: 99, n: "Test Active", int: "calma", d: 30, useCase: undefined,
  ph: [
    { l: "F1", s: 0, e: 15, k: "k1", i: "i1", sc: "s", ic: "breath", br: { in: 4, h1: 0, ex: 6, h2: 0 },
      iExec: [{ from: 0, to: 15, text: "act 1" }] },
    { l: "F2", s: 15, e: 30, k: "k2", i: "i2", sc: "s", ic: "mind", br: null,
      iExec: [{ from: 0, to: 15, text: "act 2" }] },
  ],
};

const TRAINING_PROTO = { ...ACTIVE_PROTO, id: 100, useCase: "training" };
const CRISIS_PROTO = { ...ACTIVE_PROTO, id: 101, useCase: "crisis" };

beforeEach(() => {
  vi.useFakeTimers();
});

describe("useProtocolPlayer — state machine", () => {
  it("start() inicia el protocolo y status pasa a running", () => {
    const { result } = renderHook(() => useProtocolPlayer(ACTIVE_PROTO));
    expect(result.current.status).toBe("idle");
    act(() => result.current.start());
    expect(result.current.status).toBe("running");
    expect(result.current.currentPhaseIndex).toBe(0);
    expect(result.current.currentActIndex).toBe(0);
  });

  it("totalActsInProtocol cuenta actos a través de fases", () => {
    const { result } = renderHook(() => useProtocolPlayer(ACTIVE_PROTO));
    expect(result.current.totalActsInProtocol).toBe(2);
  });

  it("advance() NO avanza cuando validation NO cumple", () => {
    const { result } = renderHook(() => useProtocolPlayer(ACTIVE_PROTO));
    act(() => result.current.start());
    // 0 ms elapsed, breath_cycles validation requires cycles
    expect(result.current.validation.canAdvance).toBe(false);
    act(() => result.current.advance());
    expect(result.current.currentActIndex).toBe(0);
  });

  it("forceAdvance() avanza pero el resultado se marca forced+passed=false", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useProtocolPlayer(ACTIVE_PROTO, { onComplete }));
    act(() => result.current.start());
    act(() => result.current.forceAdvance()); // skip act 1
    act(() => result.current.forceAdvance()); // skip act 2 → completion
    expect(onComplete).toHaveBeenCalledTimes(1);
    const data = onComplete.mock.calls[0][0];
    // active strict: skipping ambos actos → no acredita
    expect(data.status).toBe("incomplete_uncredited");
    expect(data.completedActs).toBe(0);
    expect(data.totalActs).toBe(2);
    expect(data.banditWeight).toBe(0);
    expect(data.streakIncrement).toBe(false);
  });

  it("pause() y resume() congelan/restauran el elapsed", () => {
    const { result } = renderHook(() => useProtocolPlayer(ACTIVE_PROTO));
    act(() => result.current.start());
    expect(result.current.status).toBe("running");
    act(() => result.current.pause());
    expect(result.current.status).toBe("paused");
    act(() => result.current.resume());
    expect(result.current.status).toBe("running");
  });

  it("cancel() llama onCancel y status pasa a cancelled", () => {
    const onCancel = vi.fn();
    const { result } = renderHook(() => useProtocolPlayer(ACTIVE_PROTO, { onCancel }));
    act(() => result.current.start());
    act(() => result.current.cancel());
    expect(result.current.status).toBe("cancelled");
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe("useProtocolPlayer — TTS override en crisis", () => {
  it("crisis fuerza effectiveVoiceOn=true ignorando user pref", () => {
    const { result } = renderHook(() => useProtocolPlayer(CRISIS_PROTO, { voiceOn: false }));
    expect(result.current.effectiveVoiceOn).toBe(true);
  });

  it("active respeta user pref voiceOn=false", () => {
    const { result } = renderHook(() => useProtocolPlayer(ACTIVE_PROTO, { voiceOn: false }));
    expect(result.current.effectiveVoiceOn).toBe(false);
  });

  it("active respeta user pref voiceOn=true", () => {
    const { result } = renderHook(() => useProtocolPlayer(ACTIVE_PROTO, { voiceOn: true }));
    expect(result.current.effectiveVoiceOn).toBe(true);
  });
});

describe("useProtocolPlayer — TTS override en NSDR (#17) Phase 4 SP7", () => {
  const NSDR_PROTO = { ...ACTIVE_PROTO, id: 17, useCase: "training" };

  it("NSDR #17 fuerza effectiveVoiceOn=true ignorando user pref OFF", () => {
    const { result } = renderHook(() => useProtocolPlayer(NSDR_PROTO, { voiceOn: false }));
    expect(result.current.effectiveVoiceOn).toBe(true);
  });

  it("Resonancia Vagal #16 (training pero NO NSDR) respeta user pref OFF", () => {
    const RV_PROTO = { ...ACTIVE_PROTO, id: 16, useCase: "training" };
    const { result } = renderHook(() => useProtocolPlayer(RV_PROTO, { voiceOn: false }));
    expect(result.current.effectiveVoiceOn).toBe(false);
  });
});

describe("useProtocolPlayer — partial credit refinado (Phase 4 SP7)", () => {
  it("forceAdvance NO cuenta como completedAct en training", () => {
    const TRAINING_PROTO = {
      id: 99, n: "T", int: "calma", d: 30, useCase: "training",
      ph: [
        { l: "F1", s: 0, e: 10, k: "k", i: "i", sc: "s", ic: "mind", br: null,
          iExec: [{ from: 0, to: 10, text: "a1" }] },
        { l: "F2", s: 10, e: 20, k: "k", i: "i", sc: "s", ic: "mind", br: null,
          iExec: [{ from: 0, to: 10, text: "a2" }] },
        { l: "F3", s: 20, e: 30, k: "k", i: "i", sc: "s", ic: "mind", br: null,
          iExec: [{ from: 0, to: 10, text: "a3" }] },
      ],
    };
    const onComplete = vi.fn();
    const { result } = renderHook(() => useProtocolPlayer(TRAINING_PROTO, { onComplete }));
    act(() => result.current.start());
    act(() => result.current.forceAdvance()); // act 1 forzado
    act(() => result.current.forceAdvance()); // act 2 forzado
    act(() => result.current.forceAdvance()); // act 3 forzado → completion
    expect(onComplete).toHaveBeenCalled();
    const data = onComplete.mock.calls[0][0];
    // Todos forzados → completedActs=0 → status incomplete_uncredited
    expect(data.completedActs).toBe(0);
    expect(data.totalActs).toBe(3);
    expect(data.status).toBe("incomplete_uncredited");
    expect(data.banditWeight).toBe(0);
    expect(data.streakIncrement).toBe(false);
  });
});

describe("useProtocolPlayer — pause/resume en training (Phase 4 SP7)", () => {
  it("pause() transitions status to paused; resume() restaura running", () => {
    const TRAINING_PROTO = {
      id: 16, n: "T", int: "calma", d: 30, useCase: "training",
      ph: [{ l: "F1", s: 0, e: 30, k: "k", i: "i", sc: "s", ic: "mind", br: null,
        iExec: [{ from: 0, to: 30, text: "a1" }] }],
    };
    const { result } = renderHook(() => useProtocolPlayer(TRAINING_PROTO));
    act(() => result.current.start());
    expect(result.current.status).toBe("running");
    act(() => result.current.pause());
    expect(result.current.status).toBe("paused");
    act(() => result.current.resume());
    expect(result.current.status).toBe("running");
  });
});

describe("useProtocolPlayer — acreditación por useCase", () => {
  it("active complete → status=complete + banditWeight=1.0 + vCores=10", () => {
    const result = __internals.computeSessionCompletion(
      ACTIVE_PROTO,
      [{ passed: true }, { passed: true }],
      120000,
    );
    expect(result.status).toBe("complete");
    expect(result.banditWeight).toBe(1.0);
    expect(result.vCoresAward).toBe(10);
    expect(result.streakIncrement).toBe(true);
  });

  it("active partial → no acredita (strict)", () => {
    const result = __internals.computeSessionCompletion(
      ACTIVE_PROTO,
      [{ passed: true }, { passed: false }],
      60000,
    );
    expect(result.status).toBe("incomplete_uncredited");
    expect(result.banditWeight).toBe(0);
    expect(result.streakIncrement).toBe(false);
  });

  it("training partial >=50% → partial_credited", () => {
    const result = __internals.computeSessionCompletion(
      TRAINING_PROTO,
      [{ passed: true }, { passed: false }],
      60000,
    );
    expect(result.status).toBe("partial_credited");
    expect(result.partial).toBe(true);
    expect(result.partialPercent).toBe(0.5);
    expect(result.banditWeight).toBe(0.6);
    expect(result.vCoresAward).toBe(5);
    expect(result.streakIncrement).toBe(true);
  });

  it("training <50% → incomplete_uncredited", () => {
    const result = __internals.computeSessionCompletion(
      { ...TRAINING_PROTO, ph: ACTIVE_PROTO.ph },
      [{ passed: true }, { passed: false }, { passed: false }, { passed: false }],
      30000,
    );
    expect(result.status).toBe("incomplete_uncredited");
  });

  it("crisis siempre acredita con weight 0.3 + vCores 5", () => {
    const result = __internals.computeSessionCompletion(
      CRISIS_PROTO,
      [{ passed: false }, { passed: false }],
      30000,
    );
    expect(result.status).toBe("crisis_credited");
    expect(result.banditWeight).toBe(0.3);
    expect(result.vCoresAward).toBe(5);
    expect(result.streakIncrement).toBe(true);
  });
});

describe("useProtocolPlayer — validation kinds", () => {
  it("min_duration cumple cuando elapsedMs >= min_ms", () => {
    const act = { validate: { kind: "min_duration", min_ms: 5000 } };
    expect(__internals.evaluateValidation(act, 4999, {}).canAdvance).toBe(false);
    expect(__internals.evaluateValidation(act, 5000, {}).canAdvance).toBe(true);
  });

  it("breath_cycles cumple cuando completed >= min_cycles AND elapsed", () => {
    const act = { validate: { kind: "breath_cycles", min_cycles: 3, cycle_min_ms: 8000 } };
    // 2 ciclos elapsed → false
    expect(__internals.evaluateValidation(act, 24000, { breathCyclesCompleted: 2 }).canAdvance).toBe(false);
    // 3 ciclos pero elapsed insuficiente → false
    expect(__internals.evaluateValidation(act, 23000, { breathCyclesCompleted: 3 }).canAdvance).toBe(false);
    // 3 ciclos AND 24s elapsed → true
    expect(__internals.evaluateValidation(act, 24000, { breathCyclesCompleted: 3 }).canAdvance).toBe(true);
  });

  it("tap_count cumple cuando taps >= min_taps", () => {
    const act = { validate: { kind: "tap_count", min_taps: 30, bilateral: true } };
    expect(__internals.evaluateValidation(act, 0, { tapsCompleted: 29 }).canAdvance).toBe(false);
    expect(__internals.evaluateValidation(act, 0, { tapsCompleted: 30 }).canAdvance).toBe(true);
  });

  it("hold_press cumple cuando holdMs >= min_hold_ms", () => {
    const act = { validate: { kind: "hold_press", min_hold_ms: 3000 } };
    expect(__internals.evaluateValidation(act, 0, { holdMs: 2999 }).canAdvance).toBe(false);
    expect(__internals.evaluateValidation(act, 0, { holdMs: 3000 }).canAdvance).toBe(true);
  });

  it("chip_selection cumple cuando hay selectedChipId", () => {
    const act = { validate: { kind: "chip_selection", required: true } };
    expect(__internals.evaluateValidation(act, 0, {}).canAdvance).toBe(false);
    expect(__internals.evaluateValidation(act, 0, { selectedChipId: "a" }).canAdvance).toBe(true);
    expect(__internals.evaluateValidation(act, 0, { selectedChipId: ["a", "b"] }).canAdvance).toBe(true);
  });

  it("no_validation siempre cumple (crisis)", () => {
    const act = { validate: { kind: "no_validation", reason: "crisis_no_pressure" } };
    expect(__internals.evaluateValidation(act, 0, {}).canAdvance).toBe(true);
  });
});

describe("useProtocolPlayer — flattenActs", () => {
  it("aplana fases × actos correctamente", () => {
    const flat = __internals.flattenActs(ACTIVE_PROTO);
    expect(flat).toHaveLength(2);
    expect(flat[0].phaseIdx).toBe(0);
    expect(flat[1].phaseIdx).toBe(1);
  });

  it("usa fallback cuando phase no tiene iExec", () => {
    const proto = {
      ...ACTIVE_PROTO,
      ph: [{ l: "X", s: 0, e: 10, k: "kicker", i: "i", sc: "s", ic: "breath", br: null }],
    };
    const flat = __internals.flattenActs(proto);
    expect(flat).toHaveLength(1);
    expect(flat[0].act.text).toBe("kicker");
  });
});

describe("useProtocolPlayer — imOK crisis", () => {
  it("imOK acredita la sesión completa en crisis", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useProtocolPlayer(CRISIS_PROTO, { onComplete }));
    act(() => result.current.start());
    act(() => result.current.imOK());
    expect(onComplete).toHaveBeenCalledTimes(1);
    const data = onComplete.mock.calls[0][0];
    expect(data.status).toBe("crisis_credited");
    expect(data.streakIncrement).toBe(true);
  });

  it("imOK no opera en active", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useProtocolPlayer(ACTIVE_PROTO, { onComplete }));
    act(() => result.current.start());
    act(() => result.current.imOK());
    expect(onComplete).not.toHaveBeenCalled();
  });
});
