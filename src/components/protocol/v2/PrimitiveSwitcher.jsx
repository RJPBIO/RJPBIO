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
import BilateralPulseActivationPrimitive from "./primitives/BilateralPulseActivationPrimitive";
import EnergizingBreathReleasePrimitive from "./primitives/EnergizingBreathReleasePrimitive";
import EnergyAnchorCommitmentPrimitive from "./primitives/EnergyAnchorCommitmentPrimitive";
import PanoramicVisionPrimitive from "./primitives/PanoramicVisionPrimitive";
import DualFocusReFocusPrimitive from "./primitives/DualFocusReFocusPrimitive";
import FocusCommitmentPrimitive from "./primitives/FocusCommitmentPrimitive";
import GroundingBodyScanPrimitive from "./primitives/GroundingBodyScanPrimitive";
import DeepBreathSettlePrimitive from "./primitives/DeepBreathSettlePrimitive";
import StableCloseCommitmentPrimitive from "./primitives/StableCloseCommitmentPrimitive";
import EmotionalDischargePercussionPrimitive from "./primitives/EmotionalDischargePercussionPrimitive";
import IsometricDischargePrimitive from "./primitives/IsometricDischargePrimitive";
import CognitiveResetCommitmentPrimitive from "./primitives/CognitiveResetCommitmentPrimitive";
import OcularResetMetronomePrimitive from "./primitives/OcularResetMetronomePrimitive";
import FocalAnchorMantraPrimitive from "./primitives/FocalAnchorMantraPrimitive";
import LockInCommitmentPrimitive from "./primitives/LockInCommitmentPrimitive";
import VagalBurstExhalePrimitive from "./primitives/VagalBurstExhalePrimitive";
import SteelCoreActivationPrimitive from "./primitives/SteelCoreActivationPrimitive";
import SteelCoreColumnCommitmentPrimitive from "./primitives/SteelCoreColumnCommitmentPrimitive";
import RespiratoryPulseTrainPrimitive from "./primitives/RespiratoryPulseTrainPrimitive";
import SensoryAwakePrimitive from "./primitives/SensoryAwakePrimitive";
import DirectionalActivationCommitmentPrimitive from "./primitives/DirectionalActivationCommitmentPrimitive";
import DiaphragmaticAnchorPrimitive from "./primitives/DiaphragmaticAnchorPrimitive";
import RelaxationDescentPrimitive from "./primitives/RelaxationDescentPrimitive";
import GroundingAnchorCommitmentPrimitive from "./primitives/GroundingAnchorCommitmentPrimitive";
import VerticalBreathAscensionPrimitive from "./primitives/VerticalBreathAscensionPrimitive";
import PosturalAlignmentPrimitive from "./primitives/PosturalAlignmentPrimitive";
import CognitiveOpeningPrimitive from "./primitives/CognitiveOpeningPrimitive";
import NeuralAscensionCommitmentPrimitive from "./primitives/NeuralAscensionCommitmentPrimitive";
import InteroceptionSettlePrimitive from "./primitives/InteroceptionSettlePrimitive";
import CalmaExpressClosurePrimitive from "./primitives/CalmaExpressClosurePrimitive";
import VagalResonanceCalibrationPrimitive from "./primitives/VagalResonanceCalibrationPrimitive";
import VagalResonanceSustainmentPrimitive from "./primitives/VagalResonanceSustainmentPrimitive";
import VagalResonanceClosingPrimitive from "./primitives/VagalResonanceClosingPrimitive";
import NSDRConfigurationPrimitive from "./primitives/NSDRConfigurationPrimitive";
import NSDRBodyScanPrimitive from "./primitives/NSDRBodyScanPrimitive";
import NSDRPassiveBreathPrimitive from "./primitives/NSDRPassiveBreathPrimitive";
import NSDRReturnPrimitive from "./primitives/NSDRReturnPrimitive";
import CrisisSensoryAnchorPrimitive from "./primitives/CrisisSensoryAnchorPrimitive";
import PresenceAnchorCommitmentPrimitive from "./primitives/PresenceAnchorCommitmentPrimitive";

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
    case "bilateral_pulse_activation":
      return (
        <BilateralPulseActivationPrimitive
          pattern={props.pattern || "alternate"}
          bpm={props.bpm || 60}
          target_taps={act.validate?.min_taps || props.target_taps || 30}
          haptic_enabled={hapticOn}
          onTap={(side) => onSignal({ lastTapSide: side })}
          onComplete={() => { onSignal({ tapsCompleted: act.validate?.min_taps || 30 }); onLocalComplete(); }}
        />
      );
    case "energizing_breath_release":
      return (
        <EnergizingBreathReleasePrimitive
          subActIdx={props.subActIdx ?? 0}
          cycleCountTarget={
            act.validate?.kind === "breath_cycles"
              ? (act.validate.min_cycles || 5)
              : (props.cycleCountTarget || 5)
          }
          duration_ms={act.duration?.target_ms || props.duration_ms || 10000}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onSignal={onSignal}
          onComplete={onLocalComplete}
        />
      );
    case "energy_anchor_commitment":
      return (
        <EnergyAnchorCommitmentPrimitive
          label={props.label || "MANTÉN"}
          min_hold_ms={
            act.validate?.min_hold_ms || props.min_hold_ms || 6000
          }
          release_message={props.release_message || "Listo para el siguiente bloque."}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onSignal={onSignal}
          onComplete={onLocalComplete}
        />
      );
    case "panoramic_vision":
      return (
        <PanoramicVisionPrimitive
          duration_ms={act.duration?.target_ms || props.duration_ms || 30000}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onComplete={onLocalComplete}
        />
      );
    case "dual_focus_refocus":
      return (
        <DualFocusReFocusPrimitive
          subActIdx={props.subActIdx ?? 0}
          cycles={props.cycles}
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
    case "focus_commitment":
      return (
        <FocusCommitmentPrimitive
          label={props.label || "MANTÉN"}
          min_hold_ms={
            act.validate?.min_hold_ms || props.min_hold_ms || 5000
          }
          release_message={props.release_message || "Una hora de foco."}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onSignal={onSignal}
          onComplete={onLocalComplete}
        />
      );
    case "grounding_body_scan":
      return (
        <GroundingBodyScanPrimitive
          duration_ms={act.duration?.target_ms || props.duration_ms || 40000}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onComplete={onLocalComplete}
        />
      );
    case "deep_breath_settle":
      return (
        <DeepBreathSettlePrimitive
          subActIdx={props.subActIdx ?? 0}
          cycleCountTarget={
            act.validate?.kind === "breath_cycles"
              ? (act.validate.min_cycles || 4)
              : (props.cycleCountTarget || 4)
          }
          min_duration_ms={
            act.duration?.min_ms ?? props.min_duration_ms
          }
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onComplete={onLocalComplete}
        />
      );
    case "stable_close_commitment":
      return (
        <StableCloseCommitmentPrimitive
          label={props.label || "MANTÉN"}
          min_hold_ms={
            act.validate?.min_hold_ms || props.min_hold_ms || 6000
          }
          release_message={props.release_message || "Aquí. Firme."}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onSignal={onSignal}
          onComplete={onLocalComplete}
        />
      );
    case "emotional_discharge_percussion":
      return (
        <EmotionalDischargePercussionPrimitive
          bpm={props.bpm || 150}
          duration_ms={act.duration?.target_ms || props.duration_ms || 30000}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onComplete={onLocalComplete}
        />
      );
    case "isometric_discharge":
      return (
        <IsometricDischargePrimitive
          target_holds={props.target_holds || 3}
          hold_duration_ms={props.hold_duration_ms || 10000}
          release_duration_ms={props.release_duration_ms || 5000}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onComplete={onLocalComplete}
        />
      );
    case "cognitive_reset_commitment":
      return (
        <CognitiveResetCommitmentPrimitive
          label={props.label || "MANTÉN"}
          min_hold_ms={
            act.validate?.min_hold_ms || props.min_hold_ms || 6000
          }
          release_message={props.release_message || "Algo cambia ahora."}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onSignal={onSignal}
          onComplete={onLocalComplete}
        />
      );
    case "ocular_reset_metronome":
      return (
        <OcularResetMetronomePrimitive
          frequency_hz={props.frequency_hz || 0.5}
          total_cycles={props.total_cycles || 15}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onComplete={onLocalComplete}
        />
      );
    case "focal_anchor_mantra":
      return (
        <FocalAnchorMantraPrimitive
          mode={props.mode || "fixation"}
          duration_ms={act.duration?.target_ms || props.duration_ms || 30000}
          mantra={props.mantra || "Ahora."}
          breathCadence={phase?.br || props.breathCadence}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onComplete={onLocalComplete}
        />
      );
    case "lock_in_commitment":
      return (
        <LockInCommitmentPrimitive
          label={props.label || "BLOQUEAR"}
          min_hold_ms={
            act.validate?.min_hold_ms || props.min_hold_ms || 6000
          }
          release_message={props.release_message || "Bloqueado · 60 min"}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onSignal={onSignal}
          onComplete={onLocalComplete}
        />
      );
    case "vagal_burst_exhale":
      return (
        <VagalBurstExhalePrimitive
          cycleCountTarget={
            act.validate?.kind === "breath_cycles"
              ? (act.validate.min_cycles || 3)
              : (props.cycleCountTarget || 3)
          }
          cadence={phase?.br || props.cadence || { in: 4, h1: 0, ex: 6, h2: 0 }}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onCycleComplete={(n) => onSignal({ breathCyclesCompleted: n })}
          onComplete={onLocalComplete}
        />
      );
    case "steel_core_activation":
      return (
        <SteelCoreActivationPrimitive
          mode={props.mode || "activation"}
          duration_ms={act.duration?.target_ms || props.duration_ms}
          breathCadence={phase?.br || props.breathCadence}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onComplete={onLocalComplete}
        />
      );
    case "steel_core_column_commitment":
      return (
        <SteelCoreColumnCommitmentPrimitive
          label={props.label || "MANTÉN"}
          min_hold_ms={
            act.validate?.min_hold_ms || props.min_hold_ms || 6000
          }
          release_message={props.release_message || "Eje. Vertical. Estable."}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onSignal={onSignal}
          onComplete={onLocalComplete}
        />
      );
    case "respiratory_pulse_train":
      return (
        <RespiratoryPulseTrainPrimitive
          cycleCountTarget={
            act.validate?.kind === "breath_cycles"
              ? (act.validate.min_cycles || 10)
              : (props.cycleCountTarget || 10)
          }
          cadence={phase?.br || props.cadence || { in: 1, h1: 0, ex: 2, h2: 0 }}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onCycleComplete={(n) => onSignal({ breathCyclesCompleted: n })}
          onComplete={onLocalComplete}
        />
      );
    case "sensory_awake":
      return (
        <SensoryAwakePrimitive
          mode={props.mode || "body_scan"}
          duration_ms={act.duration?.target_ms || props.duration_ms}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onComplete={onLocalComplete}
        />
      );
    case "directional_activation_commitment":
      return (
        <DirectionalActivationCommitmentPrimitive
          label={props.label || "MANTÉN"}
          min_hold_ms={
            act.validate?.min_hold_ms || props.min_hold_ms || 5000
          }
          release_message={props.release_message || "Cuerpo activo · Próxima acción"}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onSignal={onSignal}
          onComplete={onLocalComplete}
        />
      );
    case "diaphragmatic_anchor":
      return (
        <DiaphragmaticAnchorPrimitive
          cycleCountTarget={
            act.validate?.kind === "breath_cycles"
              ? (act.validate.min_cycles || 2)
              : (props.cycleCountTarget || 2)
          }
          cadence={phase?.br || props.cadence || { in: 4, h1: 0, ex: 8, h2: 0 }}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onCycleComplete={(n) => onSignal({ breathCyclesCompleted: n })}
          onComplete={onLocalComplete}
        />
      );
    case "relaxation_descent":
      return (
        <RelaxationDescentPrimitive
          mode={props.mode || "body_scan_descent"}
          duration_ms={act.duration?.target_ms || props.duration_ms}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onComplete={onLocalComplete}
        />
      );
    case "grounding_anchor_commitment":
      return (
        <GroundingAnchorCommitmentPrimitive
          label={props.label || "MANTÉN"}
          min_hold_ms={
            act.validate?.min_hold_ms || props.min_hold_ms || 6000
          }
          release_message={props.release_message || "Aquí. Anclado."}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onSignal={onSignal}
          onComplete={onLocalComplete}
        />
      );
    case "vertical_breath_ascension":
      return (
        <VerticalBreathAscensionPrimitive
          cycleCountTarget={
            act.validate?.kind === "breath_cycles"
              ? (act.validate.min_cycles || 2)
              : (props.cycleCountTarget || 2)
          }
          cadence={phase?.br || props.cadence || { in: 4, h1: 2, ex: 6, h2: 0 }}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onCycleComplete={(n) => onSignal({ breathCyclesCompleted: n })}
          onComplete={onLocalComplete}
        />
      );
    case "postural_alignment":
      return (
        <PosturalAlignmentPrimitive
          duration_ms={act.duration?.target_ms || props.duration_ms || 35000}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onComplete={onLocalComplete}
        />
      );
    case "cognitive_opening":
      return (
        <CognitiveOpeningPrimitive
          duration_ms={act.duration?.target_ms || props.duration_ms || 25000}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onComplete={onLocalComplete}
        />
      );
    case "neural_ascension_commitment":
      return (
        <NeuralAscensionCommitmentPrimitive
          label={props.label || "MANTÉN"}
          min_hold_ms={
            act.validate?.min_hold_ms || props.min_hold_ms || 6000
          }
          release_message={props.release_message || "Esta es la decisión."}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onSignal={onSignal}
          onComplete={onLocalComplete}
        />
      );
    case "interoception_settle":
      return (
        <InteroceptionSettlePrimitive
          duration_ms={act.duration?.target_ms || props.duration_ms || 30000}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onComplete={onLocalComplete}
        />
      );
    case "calma_express_closure":
      return (
        <CalmaExpressClosurePrimitive
          label={props.label || "MANTÉN"}
          min_hold_ms={
            act.validate?.min_hold_ms || props.min_hold_ms || 5000
          }
          release_message={props.release_message || "Calmo. Sigo."}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onSignal={onSignal}
          onComplete={onLocalComplete}
        />
      );
    case "vagal_resonance_calibration":
      return (
        <VagalResonanceCalibrationPrimitive
          cycleCountTarget={
            act.validate?.kind === "breath_cycles"
              ? (act.validate.min_cycles || 5)
              : (props.cycleCountTarget || 5)
          }
          cadence={phase?.br || props.cadence || { in: 5.5, h1: 0, ex: 5.5, h2: 0 }}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onCycleComplete={(n) => onSignal({ breathCyclesCompleted: n })}
          onComplete={onLocalComplete}
        />
      );
    case "vagal_resonance_sustainment":
      return (
        <VagalResonanceSustainmentPrimitive
          subActIdx={props.subActIdx ?? 0}
          cycleCountTarget={
            act.validate?.kind === "breath_cycles"
              ? (act.validate.min_cycles || 10)
              : (props.cycleCountTarget || 10)
          }
          cadence={phase?.br || props.cadence || { in: 5.5, h1: 0, ex: 5.5, h2: 0 }}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onCycleComplete={(n) => onSignal({ breathCyclesCompleted: n })}
          onComplete={onLocalComplete}
        />
      );
    case "vagal_resonance_closing":
      return (
        <VagalResonanceClosingPrimitive
          duration_ms={act.duration?.target_ms || props.duration_ms || 60000}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onComplete={onLocalComplete}
        />
      );
    case "nsdr_configuration":
      return (
        <NSDRConfigurationPrimitive
          duration_ms={act.duration?.target_ms || props.duration_ms || 60000}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onComplete={onLocalComplete}
        />
      );
    case "nsdr_body_scan":
      return (
        <NSDRBodyScanPrimitive
          subActIdx={props.subActIdx ?? 0}
          duration_ms={act.duration?.target_ms || props.duration_ms || 75000}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onComplete={onLocalComplete}
        />
      );
    case "nsdr_passive_breath":
      return (
        <NSDRPassiveBreathPrimitive
          duration_ms={act.duration?.target_ms || props.duration_ms || 150000}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onComplete={onLocalComplete}
        />
      );
    case "nsdr_return":
      return (
        <NSDRReturnPrimitive
          duration_ms={act.duration?.target_ms || props.duration_ms || 90000}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onComplete={onLocalComplete}
        />
      );
    case "crisis_sensory_anchor":
      return (
        <CrisisSensoryAnchorPrimitive
          mode={props.mode || "visual"}
          min_chars={props.min_chars ?? 2}
          audioEnabled={audioOn}
          hapticEnabled={hapticOn}
          voiceEnabled={voiceOn}
          onComplete={(value) => { onSignal({ selectedChipId: value, completedFlag: true }); onLocalComplete(); }}
        />
      );
    case "presence_anchor_commitment":
      return (
        <PresenceAnchorCommitmentPrimitive
          label={props.label || "MANTÉN"}
          min_hold_ms={
            act.validate?.min_hold_ms || props.min_hold_ms || 3000
          }
          release_message={props.release_message || "Estás aquí · Ahora"}
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
