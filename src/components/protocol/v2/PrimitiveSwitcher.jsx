"use client";
/* ═══════════════════════════════════════════════════════════════
   PrimitiveSwitcher — mapea act.ui.primitive a la primitiva real
   y reenvía señales al ProtocolPlayer.
   ═══════════════════════════════════════════════════════════════ */

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
import DoorwayVisualizer from "./primitives/DoorwayVisualizer";
import VocalResonanceVisual from "./primitives/VocalResonanceVisual";
import PowerPoseVisual from "./primitives/PowerPoseVisual";
import WalkingPaceIndicator from "./primitives/WalkingPaceIndicator";
import PulseMatchVisual from "./primitives/PulseMatchVisual";

const FALLBACK = "text_emphasis_voice";

/**
 * @param {{
 *   act: object,
 *   phase: object,
 *   audioOn?: boolean,
 *   hapticOn?: boolean,
 *   voiceOn?: boolean,
 *   intent?: string,
 *   onSignal: (signal: object) => void,
 *   onLocalComplete: () => void,
 * }} props
 */
export default function PrimitiveSwitcher({
  act,
  phase,
  audioOn = true,
  hapticOn = true,
  voiceOn = false,
  intent = "calma",
  onSignal,
  onLocalComplete,
}) {
  if (!act) return null;
  const primitive = act.ui?.primitive || FALLBACK;
  const props = act.ui?.props || {};
  const fallbackSubtext = act.text || phase?.k || "";

  switch (primitive) {
    case "breath_orb":
      return (
        <BreathOrbExtended
          cadence={phase?.br || { in: 4, h1: 0, ex: 6, h2: 0 }}
          intent={intent}
          enabled
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          cycleCountTarget={act.validate?.kind === "breath_cycles" ? (act.validate.min_cycles || 0) : 0}
          onCycleComplete={(n) => onSignal({ breathCyclesCompleted: n })}
          onComplete={onLocalComplete}
          {...props}
        />
      );
    case "bilateral_tap_targets":
      return (
        <BilateralTapTargets
          target_taps={act.validate?.min_taps || props.target_taps || 30}
          haptic_enabled={hapticOn}
          onTap={(side) => onSignal({ lastTapSide: side })}
          onComplete={() => { onSignal({ tapsCompleted: act.validate?.min_taps || 30 }); onLocalComplete(); }}
          {...props}
        />
      );
    case "ocular_dots":
      return (
        <OcularDots
          {...props}
          onComplete={onLocalComplete}
        />
      );
    case "ocular_horizontal_metronome":
      return (
        <OcularHorizontalMetronome
          {...props}
          onComplete={onLocalComplete}
        />
      );
    case "visual_panoramic_prompt":
      return (
        <VisualPanoramicPrompt
          duration_ms={act.duration?.target_ms || 30000}
          text={act.text}
          {...props}
          onComplete={onLocalComplete}
        />
      );
    case "dual_focus_targets":
      return (
        <DualFocusTargets
          {...props}
          onComplete={onLocalComplete}
        />
      );
    case "body_silhouette_highlight":
      return (
        <BodySilhouetteHighlight
          {...props}
          onComplete={onLocalComplete}
        />
      );
    case "posture_visual":
      return (
        <PostureVisual
          {...props}
          onComplete={onLocalComplete}
        />
      );
    case "isometric_grip_prompt":
      return (
        <IsometricGripPrompt
          {...props}
          onHoldComplete={(n) => onSignal({ holdsCompleted: n })}
          onComplete={onLocalComplete}
        />
      );
    case "chest_percussion_prompt":
      return (
        <ChestPercussionPrompt
          duration_ms={act.duration?.target_ms || 30000}
          haptic_enabled={hapticOn}
          audio_enabled={audioOn}
          {...props}
          onComplete={onLocalComplete}
        />
      );
    case "facial_cold_prompt":
      return (
        <FacialColdPrompt
          min_duration_ms={act.duration?.min_ms || 25000}
          {...props}
          onCompleted={() => { onSignal({ completedFlag: true }); onLocalComplete(); }}
        />
      );
    case "shake_hands_prompt":
      return (
        <ShakeHandsPrompt
          duration_ms={act.duration?.target_ms || 30000}
          haptic_enabled={hapticOn}
          audio_enabled={audioOn}
          {...props}
          onComplete={onLocalComplete}
        />
      );
    case "chip_selector":
      return (
        <ChipSelector
          question={act.text || phase?.k || "Elige una"}
          chips={props.chips || []}
          min_thinking_ms={props.min_thinking_ms || 1500}
          multi_select={props.multi_select}
          onSelect={(id) => { onSignal({ selectedChipId: id }); onLocalComplete(); }}
        />
      );
    case "hold_press_button":
      return (
        <HoldPressButton
          label={props.label || "Sostén"}
          min_hold_ms={act.validate?.min_hold_ms || props.min_hold_ms || 3000}
          release_message={props.release_message || "Listo"}
          haptic_during_hold={hapticOn}
          onComplete={() => { onSignal({ holdMs: act.validate?.min_hold_ms || 3000 }); onLocalComplete(); }}
        />
      );
    case "silence_cyan_minimal":
      return (
        <SilenceCyanMinimal
          text={act.text}
          duration_ms={act.duration?.target_ms || 8000}
          {...props}
          onComplete={onLocalComplete}
        />
      );
    case "object_anchor_prompt":
      return (
        <ObjectAnchorPrompt
          prompt={act.text || "Elige un objeto a tu alrededor"}
          {...props}
          onComplete={(text) => { onSignal({ selectedChipId: text, completedFlag: true }); onLocalComplete(); }}
        />
      );
    case "vocal_with_haptic":
      return (
        <VocalWithHaptic
          haptic_enabled={hapticOn}
          audio_enabled={audioOn}
          {...props}
          onComplete={onLocalComplete}
        />
      );
    case "doorway_visualizer":
      return (
        <DoorwayVisualizer
          duration_ms={act.duration?.target_ms || 30000}
          audio_enabled={audioOn}
          haptic_enabled={hapticOn}
          {...props}
          onComplete={onLocalComplete}
        />
      );
    case "vocal_resonance_visual":
      return (
        <VocalResonanceVisual
          haptic_enabled={hapticOn}
          audio_enabled={audioOn}
          {...props}
          onHumComplete={(n) => onSignal({ tapsCompleted: n })}
          onComplete={onLocalComplete}
        />
      );
    case "power_pose_visual":
      return (
        <PowerPoseVisual
          audio_enabled={audioOn}
          haptic_enabled={hapticOn}
          {...props}
          onHoldComplete={(n) => onSignal({ holdsCompleted: n })}
          onComplete={onLocalComplete}
        />
      );
    case "walking_pace_indicator":
      return (
        <WalkingPaceIndicator
          audio_enabled={audioOn}
          haptic_enabled={hapticOn}
          {...props}
          onStep={(s) => onSignal({ tapsCompleted: s.step })}
          onComplete={onLocalComplete}
        />
      );
    case "pulse_match_visual":
      return (
        <PulseMatchVisual
          audio_enabled={audioOn}
          haptic_enabled={hapticOn}
          {...props}
          onComplete={onLocalComplete}
        />
      );
    case "text_emphasis_voice":
    default:
      return (
        <TextEmphasisVoice
          text={act.text || fallbackSubtext}
          subtext={props.subtext}
          voice_enabled={voiceOn}
          min_duration_ms={act.duration?.min_ms || act.validate?.min_ms || 6000}
          {...props}
          onComplete={onLocalComplete}
        />
      );
  }
}
