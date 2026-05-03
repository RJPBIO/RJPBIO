/* ═══════════════════════════════════════════════════════════════
   ProtocolPlayer.test — Phase 4 SP3
   Tests del shell + PrimitiveSwitcher + acciones por useCase.
   ═══════════════════════════════════════════════════════════════ */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

vi.mock("../../../lib/audio", () => ({
  startBinaural: vi.fn(),
  stopBinaural: vi.fn(),
  hapticSignature: vi.fn(),
  requestWakeLock: vi.fn(),
  releaseWakeLock: vi.fn(),
  unlockAudio: vi.fn(),
  playBreathTick: vi.fn(),
  hapticBreath: vi.fn(),
  hap: vi.fn(),
  playSpark: vi.fn(),
  playChord: vi.fn(),
  speak: vi.fn(),
  speakNow: vi.fn(),
}));

import ProtocolPlayer from "./ProtocolPlayer";

const ACTIVE_PROTO = {
  id: 1, n: "Test Active Protocol", int: "calma", d: 30,
  ph: [
    { l: "F1", s: 0, e: 15, k: "respira", i: "i", sc: "s", ic: "breath", br: { in: 4, h1: 0, ex: 6, h2: 0 },
      iExec: [{ from: 0, to: 15, text: "respira lento" }] },
    { l: "F2", s: 15, e: 30, k: "cierra", i: "i", sc: "s", ic: "mind", br: null,
      iExec: [{ from: 0, to: 15, text: "cierra los ojos" }] },
  ],
};

const TRAINING_PROTO = { ...ACTIVE_PROTO, id: 2, useCase: "training", n: "Test Training" };
const CRISIS_PROTO = { ...ACTIVE_PROTO, id: 3, useCase: "crisis", n: "Test Crisis" };

beforeEach(() => {
  vi.useFakeTimers();
});

describe("ProtocolPlayer — render base", () => {
  it("renderiza dialog fullscreen con nombre del protocolo", () => {
    render(<ProtocolPlayer protocol={ACTIVE_PROTO} autoStart={false} />);
    expect(screen.getByRole("dialog", { name: /Test Active Protocol/i })).toBeTruthy();
    expect(screen.getByText("TEST ACTIVE PROTOCOL".toLowerCase(), { exact: false })).toBeTruthy();
  });

  it("muestra TransitionDots con conteo correcto (1 dot por acto)", () => {
    render(<ProtocolPlayer protocol={ACTIVE_PROTO} autoStart={false} />);
    const pb = screen.getByRole("progressbar");
    expect(pb.getAttribute("aria-valuemax")).toBe("2");
  });

  it("retorna null si no hay protocolo", () => {
    const { container } = render(<ProtocolPlayer protocol={null} autoStart={false} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("ProtocolPlayer — Crisis 'Estoy bien'", () => {
  it("muestra 'Estoy bien' en crisis", () => {
    render(<ProtocolPlayer protocol={CRISIS_PROTO} autoStart={false} />);
    expect(screen.getByText(/Estoy bien/i)).toBeTruthy();
  });

  it("NO muestra 'Estoy bien' en active", () => {
    render(<ProtocolPlayer protocol={ACTIVE_PROTO} autoStart={false} />);
    expect(screen.queryByText(/Estoy bien/i)).toBeNull();
  });

  it("NO muestra 'Estoy bien' en training", () => {
    render(<ProtocolPlayer protocol={TRAINING_PROTO} autoStart={false} />);
    expect(screen.queryByText(/Estoy bien/i)).toBeNull();
  });
});

describe("ProtocolPlayer — Skip button por useCase", () => {
  it("training muestra 'Saltar' cuando validation no cumple", () => {
    render(<ProtocolPlayer protocol={TRAINING_PROTO} autoStart={true} />);
    act(() => { vi.advanceTimersByTime(100); });
    expect(screen.queryByText(/Saltar/i)).toBeTruthy();
  });

  it("active NO muestra 'Saltar'", () => {
    render(<ProtocolPlayer protocol={ACTIVE_PROTO} autoStart={true} />);
    act(() => { vi.advanceTimersByTime(100); });
    expect(screen.queryByText(/Saltar/i)).toBeNull();
  });
});

describe("ProtocolPlayer — Exit button", () => {
  it("active requiere doble tap para confirmar exit", () => {
    const onCancel = vi.fn();
    render(<ProtocolPlayer protocol={ACTIVE_PROTO} onCancel={onCancel} autoStart={false} />);
    const exitBtn = screen.getByLabelText(/Salir/i);
    act(() => { exitBtn.click(); });
    expect(onCancel).not.toHaveBeenCalled();
    // Segundo tap confirma
    act(() => {
      const btn2 = screen.getByLabelText(/Confirmar salida sin acreditar|Salir/);
      btn2.click();
    });
    expect(onCancel).toHaveBeenCalled();
  });

  it("training requiere doble tap con partial indicator (Phase 4 SP7)", () => {
    const onCancel = vi.fn();
    render(<ProtocolPlayer protocol={TRAINING_PROTO} onCancel={onCancel} autoStart={false} />);
    const exitBtn = screen.getByLabelText(/Salir/i);
    act(() => { exitBtn.click(); });
    // Primer tap: NO cancela, muestra partial indicator
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.queryByTestId("partial-credit-indicator")).toBeTruthy();
    // Segundo tap: cancela
    act(() => {
      const btn2 = screen.getByLabelText(/Confirmar salida sin acreditar|Salir/);
      btn2.click();
    });
    expect(onCancel).toHaveBeenCalled();
  });
});

describe("ProtocolPlayer — Safety overlay (Phase 4 SP8 + Phase 5 quick-fix)", () => {
  const CRISIS_WITH_SAFETY = {
    ...CRISIS_PROTO,
    safety: "AVISO: Si tienes arritmia, NO uses este protocolo.",
  };

  it("crisis con safety field muestra SafetyOverlay al mount", () => {
    render(<ProtocolPlayer protocol={CRISIS_WITH_SAFETY} autoStart={true} />);
    expect(screen.queryByTestId("safety-overlay")).toBeTruthy();
    expect(screen.getByText(/arritmia/i)).toBeTruthy();
  });

  it("crisis SIN safety field NO muestra SafetyOverlay", () => {
    render(<ProtocolPlayer protocol={CRISIS_PROTO} autoStart={true} />);
    expect(screen.queryByTestId("safety-overlay")).toBeNull();
  });

  // Phase 5 quick-fix: gate ampliado a !!protocol.safety. Cualquier protocolo
  // con safety field (no sólo crisis) muestra el overlay. Compliance B2B.
  it("active con safety field SÍ muestra SafetyOverlay (Phase 5 quick-fix)", () => {
    const activeWithSafety = { ...ACTIVE_PROTO, safety: "AVISO: epilepsia fotosensible." };
    render(<ProtocolPlayer protocol={activeWithSafety} autoStart={true} />);
    expect(screen.queryByTestId("safety-overlay")).toBeTruthy();
    expect(screen.getByText(/fotosensible/i)).toBeTruthy();
  });

  it("active SIN safety field NO muestra SafetyOverlay (caso baseline)", () => {
    render(<ProtocolPlayer protocol={ACTIVE_PROTO} autoStart={true} />);
    expect(screen.queryByTestId("safety-overlay")).toBeNull();
  });

  it("training con safety field SÍ muestra SafetyOverlay (Phase 5 quick-fix)", () => {
    const trainingWithSafety = { ...TRAINING_PROTO, safety: "AVISO: lesión lumbar." };
    render(<ProtocolPlayer protocol={trainingWithSafety} autoStart={true} />);
    expect(screen.queryByTestId("safety-overlay")).toBeTruthy();
  });

  it("tap 'Estoy listo' confirma y oculta el overlay", () => {
    render(<ProtocolPlayer protocol={CRISIS_WITH_SAFETY} autoStart={false} />);
    expect(screen.queryByTestId("safety-overlay")).toBeTruthy();
    act(() => { screen.getByTestId("safety-confirm").click(); });
    expect(screen.queryByTestId("safety-overlay")).toBeNull();
  });

  it("tap 'Cancelar' llama onCancel sin start", () => {
    const onCancel = vi.fn();
    render(<ProtocolPlayer protocol={CRISIS_WITH_SAFETY} onCancel={onCancel} autoStart={true} />);
    act(() => { screen.getByTestId("safety-cancel").click(); });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("tap 'Estoy listo' en active con safety arranca el player (autoStart=true)", () => {
    const activeWithSafety = { ...ACTIVE_PROTO, safety: "AVISO: test." };
    render(<ProtocolPlayer protocol={activeWithSafety} autoStart={true} />);
    expect(screen.queryByTestId("safety-overlay")).toBeTruthy();
    act(() => { screen.getByTestId("safety-confirm").click(); });
    expect(screen.queryByTestId("safety-overlay")).toBeNull();
    expect(screen.getByRole("dialog", { name: /Test Active Protocol/i })).toBeTruthy();
  });
});

describe("ProtocolPlayer — Pause UI (Phase 4 SP7, training only)", () => {
  it("training muestra pause button en header", () => {
    render(<ProtocolPlayer protocol={TRAINING_PROTO} autoStart={false} />);
    expect(screen.queryByTestId("pause-button")).toBeTruthy();
  });

  it("active NO muestra pause button", () => {
    render(<ProtocolPlayer protocol={ACTIVE_PROTO} autoStart={false} />);
    expect(screen.queryByTestId("pause-button")).toBeNull();
  });

  it("crisis NO muestra pause button", () => {
    render(<ProtocolPlayer protocol={CRISIS_PROTO} autoStart={false} />);
    expect(screen.queryByTestId("pause-button")).toBeNull();
  });
});

describe("ProtocolPlayer — autoStart", () => {
  it("autoStart=true arranca el player automáticamente al mount", () => {
    render(<ProtocolPlayer protocol={ACTIVE_PROTO} autoStart={true} />);
    act(() => { vi.advanceTimersByTime(100); });
    // El player ahora muestra primitivas activas (no idle)
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
});
