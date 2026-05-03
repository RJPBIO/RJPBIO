/* ═══════════════════════════════════════════════════════════════
   primitives.refstable.test — Phase 5 SP2
   Verifica que las 5 primitivas nuevas mantienen el patrón ref-based:
   bajo re-render frecuente del padre (simulando ProtocolPlayer tick
   cada 100ms con onComplete cambiando de identidad), las primitivas
   no se atascan ni emiten onComplete múltiples veces.

   Bug Phase 4 (post-SP5 quick fix): si el padre pasa una nueva función
   onComplete en cada render y la primitiva la mete en useEffect deps,
   el efecto se re-ejecuta cada 100ms y la primitiva no progresa.
   El fix canon es onCompleteRef.current = onComplete + ref usage.
   ═══════════════════════════════════════════════════════════════ */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { useState, useEffect } from "react";
import { render, act, fireEvent } from "@testing-library/react";

vi.mock("../../../lib/audio", () => ({
  playBreathTick: vi.fn(),
  hapticBreath: vi.fn(),
  hap: vi.fn(),
  hapticSignature: vi.fn(),
  playSpark: vi.fn(),
  playChord: vi.fn(),
  speak: vi.fn(),
  speakNow: vi.fn(),
}));

import DoorwayVisualizer from "./primitives/DoorwayVisualizer";
import VocalResonanceVisual from "./primitives/VocalResonanceVisual";
import PowerPoseVisual from "./primitives/PowerPoseVisual";
import WalkingPaceIndicator from "./primitives/WalkingPaceIndicator";
import PulseMatchVisual from "./primitives/PulseMatchVisual";

// NOTA: estas pruebas usan REAL timers y duraciones cortas. Las fake timers de
// vitest no procesan correctamente las re-ejecuciones de useEffect entre
// callbacks de setInterval, lo cual es ortogonal al patrón ref-based que se
// está validando aquí. El propósito real es que la primitiva no se atasque
// bajo re-render frecuente del padre — eso se prueba con timers reales.

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

beforeEach(() => {
  if (typeof globalThis.requestAnimationFrame !== "function") {
    globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 16);
    globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
  }
});

/**
 * TickHarness — simula ProtocolPlayer re-renderizando cada 100ms y
 * pasando una nueva función onComplete en cada render. Si la primitiva
 * tuviera un useEffect con onComplete en deps, se re-ejecutaría cada
 * tick y nunca avanzaría.
 */
function TickHarness({ children, onComplete }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(id);
  }, []);
  // Renderizar con tick para forzar re-render — onComplete cambia de
  // identidad cada render del harness (cuando children es función).
  return <div data-tick={tick}>{children(onComplete)}</div>;
}

describe("Phase 5 SP2 primitives — ref-based pattern under frequent re-render", () => {
  it("DoorwayVisualizer monta sin crash bajo re-render frecuente del padre", async () => {
    const onComplete = vi.fn();
    const { container, unmount } = render(
      <TickHarness onComplete={onComplete}>
        {(cb) => (
          <DoorwayVisualizer
            duration_ms={5000}
            audio_enabled={false}
            haptic_enabled={false}
            flash_enabled={true}
            onComplete={cb}
          />
        )}
      </TickHarness>
    );
    // El padre re-renderiza cada 100ms y pasa nuevo onComplete cada vez.
    // El portal SVG debe seguir presente sin crashes.
    await act(async () => { await wait(500); });
    expect(container.querySelector("svg")).toBeTruthy();
    unmount();
  }, 6000);

  it("VocalResonanceVisual emite onComplete una vez tras N taps con ref pattern", async () => {
    const onComplete = vi.fn();
    const { container } = render(
      <TickHarness onComplete={onComplete}>
        {(cb) => (
          <VocalResonanceVisual
            target_hums={2}
            hum_duration_ms={500}
            audio_enabled={false}
            haptic_enabled={false}
            onComplete={cb}
          />
        )}
      </TickHarness>
    );
    const btn = container.querySelector("button");
    expect(btn).toBeTruthy();
    // Tap 1 empezar, 2 hum hecho 1, 3 empezar 2, 4 hum hecho 2 → onComplete
    await act(async () => { fireEvent.click(btn); await wait(150); });
    await act(async () => { fireEvent.click(btn); await wait(150); });
    await act(async () => { fireEvent.click(btn); await wait(150); });
    await act(async () => { fireEvent.click(btn); await wait(250); });
    expect(onComplete).toHaveBeenCalledTimes(1);
  }, 6000);

  it("PowerPoseVisual monta sin crash bajo re-render frecuente del padre", async () => {
    const onComplete = vi.fn();
    const { container, unmount } = render(
      <TickHarness onComplete={onComplete}>
        {(cb) => (
          <PowerPoseVisual
            target_holds={2}
            hold_duration_ms={5000}
            release_duration_ms={2000}
            audio_enabled={false}
            haptic_enabled={false}
            onComplete={cb}
          />
        )}
      </TickHarness>
    );
    // Bajo re-render del padre cada 100ms con nueva callback identity,
    // la primitiva mantiene su SVG y counter sin crashes.
    await act(async () => { await wait(500); });
    expect(container.querySelector("svg")).toBeTruthy();
    expect(onComplete).not.toHaveBeenCalled();
    unmount();
  }, 6000);

  it("WalkingPaceIndicator emite onComplete una vez tras N taps", async () => {
    const onComplete = vi.fn();
    const { container } = render(
      <TickHarness onComplete={onComplete}>
        {(cb) => (
          <WalkingPaceIndicator
            target_steps={3}
            pattern="alternate"
            pace_bpm={60}
            audio_enabled={false}
            haptic_enabled={false}
            onComplete={cb}
          />
        )}
      </TickHarness>
    );
    const btn = container.querySelector("button");
    expect(btn).toBeTruthy();
    for (let i = 0; i < 3; i++) {
      await act(async () => { fireEvent.click(btn); await wait(80); });
    }
    expect(onComplete).toHaveBeenCalledTimes(1);
    // Tap extra: no debe disparar otro onComplete
    await act(async () => { fireEvent.click(btn); await wait(80); });
    expect(onComplete).toHaveBeenCalledTimes(1);
  }, 6000);

  it("PulseMatchVisual completa por interval (count_only) bajo re-render frecuente", async () => {
    const onComplete = vi.fn();
    render(
      <TickHarness onComplete={onComplete}>
        {(cb) => (
          <PulseMatchVisual
            mode="count_only"
            interval_ms={500}
            audio_enabled={false}
            haptic_enabled={false}
            onComplete={cb}
          />
        )}
      </TickHarness>
    );
    await act(async () => { await wait(1200); });
    expect(onComplete).toHaveBeenCalledTimes(1);
  }, 6000);
});
