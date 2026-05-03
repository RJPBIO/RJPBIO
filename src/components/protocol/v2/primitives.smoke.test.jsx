/* ═══════════════════════════════════════════════════════════════
   primitives.smoke.test — Phase 4 SP2
   Cada primitiva renderiza sin crashear con props default.
   No comprueba comportamiento profundo (eso vendrá en SP3).
   ═══════════════════════════════════════════════════════════════ */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

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

import BreathOrbExtended from "./primitives/BreathOrbExtended";
import BilateralTapTargets from "./primitives/BilateralTapTargets";
import OcularDots from "./primitives/OcularDots";
import OcularHorizontalMetronome from "./primitives/OcularHorizontalMetronome";
import VisualPanoramicPrompt from "./primitives/VisualPanoramicPrompt";
import DualFocusTargets from "./primitives/DualFocusTargets";
import BodySilhouetteHighlight from "./primitives/BodySilhouetteHighlight";
import PostureVisual from "./primitives/PostureVisual";
import IsometricGripPrompt from "./primitives/IsometricGripPrompt";
import ChestPercussionPrompt from "./primitives/ChestPercussionPrompt";
import FacialColdPrompt from "./primitives/FacialColdPrompt";
import ShakeHandsPrompt from "./primitives/ShakeHandsPrompt";
import ChipSelector from "./primitives/ChipSelector";
import HoldPressButton from "./primitives/HoldPressButton";
import TextEmphasisVoice from "./primitives/TextEmphasisVoice";
import SilenceCyanMinimal from "./primitives/SilenceCyanMinimal";
import ObjectAnchorPrompt from "./primitives/ObjectAnchorPrompt";
import VocalWithHaptic from "./primitives/VocalWithHaptic";
import TransitionDots from "./primitives/TransitionDots";
import DoorwayVisualizer from "./primitives/DoorwayVisualizer";
import VocalResonanceVisual from "./primitives/VocalResonanceVisual";
import PowerPoseVisual from "./primitives/PowerPoseVisual";
import WalkingPaceIndicator from "./primitives/WalkingPaceIndicator";
import PulseMatchVisual from "./primitives/PulseMatchVisual";

beforeEach(() => {
  // jsdom no implementa requestAnimationFrame en algunos paths
  if (typeof globalThis.requestAnimationFrame !== "function") {
    globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 16);
    globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
  }
});

describe("protocol/v2 primitives — smoke tests", () => {
  it("BreathOrbExtended renders without crash", () => {
    const { container } = render(
      <BreathOrbExtended cadence={{in:4,h1:0,ex:6,h2:0}} intent="calma" enabled audioEnabled={false} hapticEnabled={false} />
    );
    expect(container).toBeTruthy();
  });

  it("BilateralTapTargets renders 2 pads", () => {
    const { container } = render(<BilateralTapTargets target_taps={5} haptic_enabled={false} />);
    expect(container.querySelectorAll("button").length).toBe(2);
  });

  it("OcularDots renders 5 dots", () => {
    const { container } = render(<OcularDots dot_count={5} interval_ms={5000} total_steps={5} />);
    expect(container).toBeTruthy();
  });

  it("OcularHorizontalMetronome renders without crash", () => {
    const { container } = render(<OcularHorizontalMetronome frequency_hz={0.5} total_cycles={3} />);
    expect(container).toBeTruthy();
  });

  it("VisualPanoramicPrompt renders text", () => {
    const { getByText } = render(<VisualPanoramicPrompt duration_ms={1000} />);
    expect(getByText("Mira lo más lejos posible")).toBeTruthy();
  });

  it("DualFocusTargets renders without crash", () => {
    const { container } = render(<DualFocusTargets cycles={2} />);
    expect(container).toBeTruthy();
  });

  it("BodySilhouetteHighlight renders silhouette + label", () => {
    const { container, getByText } = render(<BodySilhouetteHighlight transition_ms={5000} />);
    expect(container.querySelector("svg")).toBeTruthy();
    expect(getByText(/Atención en/)).toBeTruthy();
  });

  it("PostureVisual renders 5 points", () => {
    const { container } = render(<PostureVisual transition_ms={5000} />);
    expect(container.querySelectorAll("circle").length).toBeGreaterThanOrEqual(5);
  });

  it("IsometricGripPrompt renders APRIETA initial", () => {
    const { getByText } = render(<IsometricGripPrompt target_holds={2} hold_duration_ms={5000} release_duration_ms={2000} />);
    expect(getByText(/Aprieta/i)).toBeTruthy();
  });

  it("ChestPercussionPrompt renders prompt", () => {
    const { getByText } = render(<ChestPercussionPrompt bpm={150} duration_ms={5000} haptic_enabled={false} audio_enabled={false} />);
    expect(getByText(/esternón/i)).toBeTruthy();
  });

  it("FacialColdPrompt renders disabled button initially", () => {
    const { getByRole } = render(<FacialColdPrompt min_duration_ms={5000} voice_text="" />);
    const btn = getByRole("button");
    expect(btn.disabled).toBe(true);
  });

  it("ShakeHandsPrompt renders prompt", () => {
    const { getByText } = render(<ShakeHandsPrompt duration_ms={5000} audio_enabled={false} haptic_enabled={false} />);
    expect(getByText(/Sacude las manos/i)).toBeTruthy();
  });

  it("ChipSelector renders chips disabled during thinking", () => {
    const chips = [{id:"a",label:"A"},{id:"b",label:"B"}];
    const { container } = render(<ChipSelector question="?" min_thinking_ms={5000} chips={chips} />);
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBe(2);
    expect(buttons[0].disabled).toBe(true);
  });

  it("HoldPressButton renders with label", () => {
    const { getByRole } = render(<HoldPressButton label="Mantén" min_hold_ms={2000} release_message="Listo" />);
    expect(getByRole("button", { name: "Mantén" })).toBeTruthy();
  });

  it("TextEmphasisVoice renders text", () => {
    const { getByText } = render(<TextEmphasisVoice text="Hola" subtext="Sub" voice_enabled={false} min_duration_ms={5000} />);
    expect(getByText("Hola")).toBeTruthy();
    expect(getByText("Sub")).toBeTruthy();
  });

  it("SilenceCyanMinimal renders dot + text", () => {
    const { getByText } = render(<SilenceCyanMinimal text="silencio" duration_ms={5000} />);
    expect(getByText("silencio")).toBeTruthy();
  });

  it("ObjectAnchorPrompt renders input + button", () => {
    const { container, getByRole } = render(<ObjectAnchorPrompt prompt="Objeto" />);
    expect(container.querySelector("input")).toBeTruthy();
    expect(getByRole("button")).toBeTruthy();
  });

  it("VocalWithHaptic renders empezar button", () => {
    const { getByText } = render(<VocalWithHaptic target_vocalizations={2} audio_enabled={false} haptic_enabled={false} />);
    expect(getByText(/Empezar/i)).toBeTruthy();
  });

  it("TransitionDots renders correct count", () => {
    const { getByRole } = render(<TransitionDots total_acts={4} current_act={1} />);
    const pb = getByRole("progressbar");
    expect(pb.getAttribute("aria-valuemax")).toBe("4");
    expect(pb.getAttribute("aria-valuenow")).toBe("2");
  });

  // Phase 5 SP2 — 5 primitivas nuevas para protocolos #21-#25

  it("DoorwayVisualizer renders portal SVG + label (default phase=approach)", () => {
    const { container, getByTestId } = render(
      <DoorwayVisualizer duration_ms={3000} audio_enabled={false} haptic_enabled={false} />
    );
    expect(container.querySelector("svg")).toBeTruthy();
    expect(getByTestId("doorway-label")).toBeTruthy();
    expect(getByTestId("doorway-root").getAttribute("data-phase")).toBe("approach");
  });

  // Phase 5 quick-fix: phase-controlled DoorwayVisualizer
  it("DoorwayVisualizer phase='approach' NO muestra flash overlay activo", () => {
    const { getByTestId } = render(
      <DoorwayVisualizer phase="approach" duration_ms={3000} audio_enabled={false} haptic_enabled={false} />
    );
    expect(getByTestId("doorway-flash").getAttribute("data-active")).toBe("false");
    expect(getByTestId("doorway-label").textContent).toMatch(/El umbral se acerca/i);
  });

  it("DoorwayVisualizer phase='cross' incluye flash visible al mount", () => {
    const { getByTestId } = render(
      <DoorwayVisualizer phase="cross" duration_ms={3000} flash_enabled={true} audio_enabled={false} haptic_enabled={false} />
    );
    // Al mount, el flash overlay está activo (antes de que el setTimeout lo apague).
    expect(getByTestId("doorway-flash").getAttribute("data-active")).toBe("true");
    expect(getByTestId("doorway-label").textContent).toMatch(/Del otro lado/i);
  });

  it("DoorwayVisualizer phase='post' NO muestra flash y label sostenido", () => {
    const { getByTestId } = render(
      <DoorwayVisualizer phase="post" duration_ms={3000} audio_enabled={false} haptic_enabled={false} />
    );
    expect(getByTestId("doorway-flash").getAttribute("data-active")).toBe("false");
    expect(getByTestId("doorway-label").textContent).toMatch(/Del otro lado/i);
  });

  it("VocalResonanceVisual renders silhouette + counter + button", () => {
    const { container, getByTestId, getByText } = render(
      <VocalResonanceVisual target_hums={4} hum_duration_ms={3000} audio_enabled={false} haptic_enabled={false} />
    );
    expect(container.querySelector("svg")).toBeTruthy();
    expect(getByTestId("hum-counter")).toBeTruthy();
    expect(getByText(/Empezar hum/i)).toBeTruthy();
  });

  it("PowerPoseVisual default phase=isometric_holds renders figure + APRIETA initial", () => {
    const { container, getByText, getByTestId } = render(
      <PowerPoseVisual target_holds={3} hold_duration_ms={3000} release_duration_ms={1500} audio_enabled={false} haptic_enabled={false} />
    );
    expect(container.querySelector("svg")).toBeTruthy();
    expect(getByText(/Aprieta/i)).toBeTruthy();
    expect(getByTestId("pose-counter")).toBeTruthy();
    expect(getByTestId("pose-root").getAttribute("data-phase")).toBe("isometric_holds");
  });

  // Phase 5 quick-fix 5-2: phase-controlled PowerPoseVisual
  it("PowerPoseVisual phase='posture_alignment' NO entra en isometric loop (sin APRIETA)", () => {
    const { queryByText, getByTestId } = render(
      <PowerPoseVisual phase="posture_alignment" duration_ms={5000} audio_enabled={false} haptic_enabled={false} />
    );
    expect(getByTestId("pose-root").getAttribute("data-phase")).toBe("posture_alignment");
    expect(queryByText(/Aprieta/i)).toBeNull();
    expect(queryByText(/Suelta/i)).toBeNull();
    expect(queryByText(/Alineación postural/i)).toBeTruthy();
  });

  it("PowerPoseVisual phase='posture_alignment' muestra figura highlighted con 5 puntos", () => {
    const { container, getByTestId } = render(
      <PowerPoseVisual phase="posture_alignment" duration_ms={5000} audio_enabled={false} haptic_enabled={false} />
    );
    // 5 puntos de alineación + cabeza (cx,cy=80,32) = 6 circles + breath orb = 7 circles totales
    const circles = container.querySelectorAll("svg circle");
    // Sin highlights: figura tiene cabeza + breath orb = 2 circles
    // Con highlights: + 5 puntos = 7 circles
    expect(circles.length).toBeGreaterThanOrEqual(7);
    expect(getByTestId("pose-root").getAttribute("data-subphase")).toBe("alignment");
  });

  it("PowerPoseVisual phase='isometric_holds' requiere target_holds completados", () => {
    const { getByText, getByTestId } = render(
      <PowerPoseVisual phase="isometric_holds" target_holds={2} hold_duration_ms={3000} release_duration_ms={1000} audio_enabled={false} haptic_enabled={false} />
    );
    expect(getByText(/Aprieta/i)).toBeTruthy();
    expect(getByTestId("pose-counter").textContent).toMatch(/0 \/ 2/);
  });

  it("WalkingPaceIndicator renders feet + tap button", () => {
    const { container, getByRole, getByTestId } = render(
      <WalkingPaceIndicator target_steps={8} pace_bpm={60} audio_enabled={false} haptic_enabled={false} />
    );
    expect(container.querySelector("svg")).toBeTruthy();
    expect(getByRole("button", { name: /^paso$/i })).toBeTruthy();
    expect(getByTestId("step-counter")).toBeTruthy();
  });

  // Phase 5 quick-fix 5-2: audit pattern-respect for WalkingPaceIndicator
  it("WalkingPaceIndicator pattern='right_only' inicia con foot derecho activo", () => {
    const { container } = render(
      <WalkingPaceIndicator target_steps={4} pattern="right_only" pace_bpm={60} audio_enabled={false} haptic_enabled={false} />
    );
    // El elipse derecho (cx=132) tiene fill cyan-tinted; el izquierdo no.
    const ellipses = container.querySelectorAll("svg ellipse");
    const right = Array.from(ellipses).find((e) => e.getAttribute("cx") === "132");
    expect(right.getAttribute("fill")).toMatch(/34,211,238/);
  });

  it("WalkingPaceIndicator pattern='left_only' inicia con foot izquierdo activo", () => {
    const { container } = render(
      <WalkingPaceIndicator target_steps={4} pattern="left_only" pace_bpm={60} audio_enabled={false} haptic_enabled={false} />
    );
    const ellipses = container.querySelectorAll("svg ellipse");
    const left = Array.from(ellipses).find((e) => e.getAttribute("cx") === "68");
    expect(left.getAttribute("fill")).toMatch(/34,211,238/);
  });

  it("PulseMatchVisual renders pulse dot + breath orb + tap button", () => {
    const { container, getByTestId, getByRole } = render(
      <PulseMatchVisual mode="match_breathing" target_breaths={3} interval_ms={3000} audio_enabled={false} haptic_enabled={false} />
    );
    expect(container.querySelector("svg")).toBeTruthy();
    expect(getByTestId("pulse-stats")).toBeTruthy();
    expect(getByRole("button", { name: /^latido$/i })).toBeTruthy();
  });

  // Phase 5 quick-fix 5-2: audit mode-respect for PulseMatchVisual
  it("PulseMatchVisual mode='count_only' muestra countdown en seconds, no ciclos", () => {
    const { getByTestId, queryByText } = render(
      <PulseMatchVisual mode="count_only" interval_ms={5000} audio_enabled={false} haptic_enabled={false} />
    );
    expect(getByTestId("pulse-stats").textContent).toMatch(/\d+s/);
    expect(queryByText(/Cuenta latidos/i)).toBeTruthy();
    expect(queryByText(/Sincroniza con respiración/i)).toBeNull();
  });

  it("PulseMatchVisual mode='match_breathing' muestra ciclos respiración + título sync", () => {
    const { getByTestId, queryByText } = render(
      <PulseMatchVisual mode="match_breathing" target_breaths={3} audio_enabled={false} haptic_enabled={false} />
    );
    expect(getByTestId("pulse-stats").textContent).toMatch(/Ciclos/i);
    expect(queryByText(/Sincroniza con respiración/i)).toBeTruthy();
    expect(queryByText(/Cuenta latidos en tus dedos/i)).toBeNull();
  });
});
