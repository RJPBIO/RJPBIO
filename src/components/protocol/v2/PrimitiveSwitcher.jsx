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
import PhysiologicalSighOrb from "./primitives/PhysiologicalSighOrb";
import CardiacPulseMatchVisual from "./primitives/CardiacPulseMatchVisual";
import ParasympathicResetOrb from "./primitives/ParasympathicResetOrb";
import CognitiveDescargaPrimitive from "./primitives/CognitiveDescargaPrimitive";
import CommitmentMotorPrimitive from "./primitives/CommitmentMotorPrimitive";
import CardiacCoherencePrimitive from "./primitives/CardiacCoherencePrimitive";
import EmotionalLabelingPrimitive from "./primitives/EmotionalLabelingPrimitive";
import VisualizationCommitmentPrimitive from "./primitives/VisualizationCommitmentPrimitive";
import DescargaRapidaPrimitive from "./primitives/DescargaRapidaPrimitive";
import PriorityFilterPrimitive from "./primitives/PriorityFilterPrimitive";
import ExecutiveCommitmentPrimitive from "./primitives/ExecutiveCommitmentPrimitive";

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
    case "physiological_sigh_orb":
      return (
        <PhysiologicalSighOrb
          cycleCountTarget={act.validate?.kind === "breath_cycles" ? (act.validate.min_cycles || 5) : 5}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onCycleComplete={(n) => onSignal({ breathCyclesCompleted: n })}
          onComplete={onLocalComplete}
          {...props}
        />
      );
    case "cardiac_pulse_match_visual":
      return (
        <CardiacPulseMatchVisual
          cycleCountTarget={
            act.validate?.kind === "breath_cycles"
              ? (act.validate.min_cycles || 5)
              : (props.cycleCountTarget || 5)
          }
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onCycleComplete={(n) => onSignal({ breathCyclesCompleted: n })}
          onComplete={onLocalComplete}
          {...props}
        />
      );
    case "parasympathic_reset_orb":
      return (
        <ParasympathicResetOrb
          cycleCountTarget={
            act.validate?.kind === "breath_cycles"
              ? (act.validate.min_cycles || 2)
              : (props.cycleCountTarget || 2)
          }
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onCycleComplete={(n) => onSignal({ breathCyclesCompleted: n })}
          onComplete={onLocalComplete}
          {...props}
        />
      );
    case "cognitive_descarga":
      return (
        <CognitiveDescargaPrimitive
          subActIdx={props.subActIdx ?? 0}
          chips={props.chips}
          min_thinking_ms={props.min_thinking_ms ?? 5000}
          min_duration_ms={
            act.duration?.min_ms ?? props.min_duration_ms ?? 12000
          }
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onSignal={onSignal}
          onComplete={onLocalComplete}
        />
      );
    case "commitment_motor":
      return (
        <CommitmentMotorPrimitive
          label={props.label || "MANTÉN"}
          min_hold_ms={
            act.validate?.min_hold_ms || props.min_hold_ms || 5000
          }
          release_message={props.release_message || "Esa es la acción."}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onSignal={onSignal}
          onComplete={onLocalComplete}
        />
      );
    case "cardiac_coherence_orb":
      return (
        <CardiacCoherencePrimitive
          cycleCountTarget={
            act.validate?.kind === "breath_cycles"
              ? (act.validate.min_cycles || 2)
              : (props.cycleCountTarget || 2)
          }
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onCycleComplete={(n) => onSignal({ breathCyclesCompleted: n })}
          onComplete={onLocalComplete}
          {...props}
        />
      );
    case "emotional_labeling":
      return (
        <EmotionalLabelingPrimitive
          subActIdx={props.subActIdx ?? 0}
          chips={props.chips}
          highlight_progression={props.highlight_progression}
          transition_ms={props.transition_ms}
          min_thinking_ms={props.min_thinking_ms ?? 6000}
          min_duration_ms={
            act.duration?.min_ms ?? props.min_duration_ms
          }
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onSignal={onSignal}
          onComplete={onLocalComplete}
        />
      );
    case "visualization_commitment":
      return (
        <VisualizationCommitmentPrimitive
          label={props.label || "MANTÉN"}
          min_hold_ms={
            act.validate?.min_hold_ms || props.min_hold_ms || 6000
          }
          release_message={props.release_message || "Hoy avanzas, paso a paso."}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onSignal={onSignal}
          onComplete={onLocalComplete}
        />
      );
    case "descarga_rapida_orb":
      return (
        <DescargaRapidaPrimitive
          cycleCountTarget={
            act.validate?.kind === "breath_cycles"
              ? (act.validate.min_cycles || 3)
              : (props.cycleCountTarget || 3)
          }
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onCycleComplete={(n) => onSignal({ breathCyclesCompleted: n })}
          onComplete={onLocalComplete}
          {...props}
        />
      );
    case "priority_filter":
      return (
        <PriorityFilterPrimitive
          subActIdx={props.subActIdx ?? 0}
          min_duration_ms={
            act.duration?.min_ms ?? props.min_duration_ms
          }
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onSignal={onSignal}
          onComplete={onLocalComplete}
        />
      );
    case "executive_commitment":
      return (
        <ExecutiveCommitmentPrimitive
          label={props.label || "MANTÉN"}
          min_hold_ms={
            act.validate?.min_hold_ms || props.min_hold_ms || 5000
          }
          release_message={props.release_message || "60 minutos para esto."}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onSignal={onSignal}
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
