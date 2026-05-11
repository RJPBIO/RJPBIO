"use client";
/* ═══════════════════════════════════════════════════════════════
   PrimitivePreview — storybook minimalista dev-only.
   Lista cada primitiva con props default; tap para preview en
   sandbox. Botón reset reinicia la primitiva activa.
   ═══════════════════════════════════════════════════════════════ */

import { useState } from "react";
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
import CognitiveDescargaPrimitive from "./primitives/CognitiveDescargaPrimitive";
import CommitmentMotorPrimitive from "./primitives/CommitmentMotorPrimitive";
import ParasympathicResetOrb from "./primitives/ParasympathicResetOrb";
import VagalCouplingReveal from "./reset1/VagalCouplingReveal";
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

const PRIMITIVES = [
  { id: "BreathOrbExtended", render: (k) => <BreathOrbExtended key={k} cadence={{in:4,h1:0,ex:6,h2:0}} intent="calma" enabled cycleCountTarget={3} audioEnabled={false} hapticEnabled={false} /> },
  { id: "BilateralTapTargets", render: (k) => <BilateralTapTargets key={k} bpm={120} target_taps={20} haptic_enabled={false} /> },
  { id: "OcularDots", render: (k) => <OcularDots key={k} dot_count={5} interval_ms={1000} sequence="saccade_pattern" total_steps={10} /> },
  { id: "OcularHorizontalMetronome", render: (k) => <OcularHorizontalMetronome key={k} frequency_hz={0.5} total_cycles={5} /> },
  { id: "VisualPanoramicPrompt", render: (k) => <VisualPanoramicPrompt key={k} duration_ms={60000} /> },
  { id: "DualFocusTargets", render: (k) => <DualFocusTargets key={k} cycles={3} /> },
  { id: "BodySilhouetteHighlight", render: (k) => <BodySilhouetteHighlight key={k} transition_ms={2000} /> },
  { id: "PostureVisual", render: (k) => <PostureVisual key={k} transition_ms={3000} /> },
  { id: "IsometricGripPrompt", render: (k) => <IsometricGripPrompt key={k} target_holds={2} hold_duration_ms={3000} release_duration_ms={1500} /> },
  { id: "ChestPercussionPrompt", render: (k) => <ChestPercussionPrompt key={k} bpm={150} duration_ms={60000} haptic_enabled={false} audio_enabled={false} /> },
  { id: "FacialColdPrompt", render: (k) => <FacialColdPrompt key={k} min_duration_ms={5000} voice_text="" /> },
  { id: "ShakeHandsPrompt", render: (k) => <ShakeHandsPrompt key={k} duration_ms={60000} haptic_enabled={false} audio_enabled={false} /> },
  { id: "ChipSelector", render: (k) => <ChipSelector key={k} question="¿Cómo te sientes?" min_thinking_ms={1000} chips={[{id:"a",label:"Tenso"},{id:"b",label:"Cansado"},{id:"c",label:"Activo"},{id:"d",label:"Calma"}]} /> },
  { id: "HoldPressButton", render: (k) => <HoldPressButton key={k} label="Mantén" min_hold_ms={2500} release_message="Listo" /> },
  { id: "TextEmphasisVoice", render: (k) => <TextEmphasisVoice key={k} text="Una sola tarea" subtext="La que hace todo lo demás más fácil" voice_enabled={false} min_duration_ms={60000} /> },
  { id: "SilenceCyanMinimal", render: (k) => <SilenceCyanMinimal key={k} text="Quédate en el silencio" duration_ms={60000} /> },
  { id: "ObjectAnchorPrompt", render: (k) => <ObjectAnchorPrompt key={k} prompt="Elige un objeto" min_chars={2} /> },
  { id: "VocalWithHaptic", render: (k) => <VocalWithHaptic key={k} target_vocalizations={2} haptic_enabled={false} audio_enabled={false} /> },
  { id: "TransitionDots", render: (k) => <TransitionDots key={k} total_acts={5} current_act={2} /> },
  // Phase 5 SP2 — 5 primitivas nuevas para protocolos #21-#25
  { id: "DoorwayVisualizer", render: (k) => <DoorwayVisualizer key={k} duration_ms={20000} flash_enabled={true} audio_enabled={false} haptic_enabled={false} /> },
  { id: "VocalResonanceVisual", render: (k) => <VocalResonanceVisual key={k} target_hums={4} hum_duration_ms={6000} audio_enabled={false} haptic_enabled={false} /> },
  { id: "PowerPoseVisual", render: (k) => <PowerPoseVisual key={k} target_holds={3} hold_duration_ms={6000} release_duration_ms={3000} audio_enabled={false} haptic_enabled={false} /> },
  { id: "WalkingPaceIndicator", render: (k) => <WalkingPaceIndicator key={k} target_steps={16} pattern="alternate" pace_bpm={60} audio_enabled={false} haptic_enabled={false} /> },
  { id: "PulseMatchVisual", render: (k) => <PulseMatchVisual key={k} mode="match_breathing" target_breaths={5} interval_ms={30000} audio_enabled={false} haptic_enabled={false} /> },
  // Phase 7 SP-B-3 — primitive #1 Phase 2 multi-task. 3 variantes per subActIdx.
  { id: "CognitiveDescarga · subAct 0 (texto)", render: (k) => <CognitiveDescargaPrimitive key={k} subActIdx={0} hapticEnabled={false} /> },
  { id: "CognitiveDescarga · subAct 1 (chip)",  render: (k) => <CognitiveDescargaPrimitive key={k} subActIdx={1} min_thinking_ms={500} hapticEnabled={false} /> },
  { id: "CognitiveDescarga · subAct 2 (cierre)", render: (k) => <CognitiveDescargaPrimitive key={k} subActIdx={2} min_duration_ms={15000} hapticEnabled={false} /> },
  // Phase 7 SP-B-4 — primitive #1 Phase 3 multi-task (hold-press + viz + orb + particles centrifugal + anchor + eyebrow).
  { id: "CommitmentMotor · hold-press 5s", render: (k) => <CommitmentMotorPrimitive key={k} label="MANTÉN" min_hold_ms={5000} release_message="Esa es la acción." hapticEnabled={false} /> },
  { id: "ParasympathicResetOrb · phase 1", render: (k) => <ParasympathicResetOrb key={k} cycleCountTarget={2} audioEnabled={false} hapticEnabled={false} voiceEnabled={false} /> },
  // Phase 7 SP-B-5 — Vagal Coupling Reveal cinematic hero (post-session).
  { id: "VagalCouplingReveal · cinematic", render: (k) => <VagalCouplingReveal key={k} hrvDelta={4.2} /> },
  // Phase 7 SP-C-1 — primitive #2 Phase 1 HeartMath 6-2-8-0.
  { id: "CardiacCoherence · phase 1 (6-2-8)", render: (k) => <CardiacCoherencePrimitive key={k} cycleCountTarget={2} audioEnabled={false} hapticEnabled={false} voiceEnabled={false} /> },
  // Phase 7 SP-C-2 — primitive #2 Phase 2 multi-task etiquetado emocional 3 sub-acts.
  { id: "EmotionalLabeling · subAct 0 (interocepción)", render: (k) => <EmotionalLabelingPrimitive key={k} subActIdx={0} hapticEnabled={false} /> },
  { id: "EmotionalLabeling · subAct 1 (chip emociones)", render: (k) => <EmotionalLabelingPrimitive key={k} subActIdx={1} min_thinking_ms={500} hapticEnabled={false} /> },
  { id: "EmotionalLabeling · subAct 2 (silencio)", render: (k) => <EmotionalLabelingPrimitive key={k} subActIdx={2} min_duration_ms={8000} hapticEnabled={false} /> },
  // Phase 7 SP-C-3 — primitive #2 Phase 3 multi-exercise layered (saccades + hold + humming).
  { id: "VisualizationCommitment · multi-exercise", render: (k) => <VisualizationCommitmentPrimitive key={k} label="MANTÉN" min_hold_ms={6000} release_message="Hoy avanzas, paso a paso." hapticEnabled={false} /> },
  // Phase 7 SP-D-1 — primitive #3 Phase 1 ratio 1:3 (2-0-6-0) + cycling release cues.
  { id: "DescargaRapida · phase 1 (2-0-6-0)", render: (k) => <DescargaRapidaPrimitive key={k} cycleCountTarget={3} audioEnabled={false} hapticEnabled={false} voiceEnabled={false} /> },
  // Phase 7 SP-D-2 — primitive #3 Phase 2 multi-exercise filtro Eisenhower.
  { id: "PriorityFilter · subAct 0 (3 slots)", render: (k) => <PriorityFilterPrimitive key={k} subActIdx={0} /> },
  { id: "PriorityFilter · subAct 1 (Eisenhower)", render: (k) => <PriorityFilterPrimitive key={k} subActIdx={1} /> },
  { id: "PriorityFilter · subAct 2 (convergencia)", render: (k) => <PriorityFilterPrimitive key={k} subActIdx={2} /> },
  // Phase 7 SP-D-3 — primitive #3 Phase 3 multi-exercise compromiso ejecutivo.
  { id: "ExecutiveCommitment · triple-seal", render: (k) => <ExecutiveCommitmentPrimitive key={k} label="MANTÉN" min_hold_ms={5000} release_message="60 minutos para esto." hapticEnabled={false} /> },
  // Phase 7 SP-E-1 — primitive #4 Phase 1 bilateral motor + pacer + postura erguida.
  { id: "BilateralPulseActivation · #4 Phase 1", render: (k) => <BilateralPulseActivationPrimitive key={k} pattern="alternate" bpm={60} target_taps={6} haptic_enabled={false} /> },
  // Phase 7 SP-E-2 — primitive #4 Phase 2 multi-exercise (breath 3-3 + shake hands).
  { id: "EnergizingBreathRelease · subAct 0 (breath 3-3)", render: (k) => <EnergizingBreathReleasePrimitive key={k} subActIdx={0} cycleCountTarget={5} hapticEnabled={false} /> },
  { id: "EnergizingBreathRelease · subAct 1 (shake)", render: (k) => <EnergizingBreathReleasePrimitive key={k} subActIdx={1} duration_ms={10000} hapticEnabled={false} /> },
  // Phase 7 SP-E-3 — primitive #4 Phase 3 anclaje energético.
  { id: "EnergyAnchorCommitment · #4 Phase 3", render: (k) => <EnergyAnchorCommitmentPrimitive key={k} label="MANTÉN" min_hold_ms={6000} release_message="Listo para el siguiente bloque." hapticEnabled={false} /> },
  // Phase 7 SP-F-1 — primitive #5 Phase 1 paradox visual periférica.
  { id: "PanoramicVision · #5 Phase 1", render: (k) => <PanoramicVisionPrimitive key={k} duration_ms={30000} hapticEnabled={false} /> },
  // Phase 7 SP-F-2 — primitive #5 Phase 2 dual focus + breath + cognitive.
  { id: "DualFocusRefocus · subAct 0 (cerca-lejos)", render: (k) => <DualFocusReFocusPrimitive key={k} subActIdx={0} cycles={3} hapticEnabled={false} /> },
  { id: "DualFocusRefocus · subAct 1 (breath 4-4)", render: (k) => <DualFocusReFocusPrimitive key={k} subActIdx={1} cycles={3} hapticEnabled={false} /> },
  { id: "DualFocusRefocus · subAct 2 (cognitive)", render: (k) => <DualFocusReFocusPrimitive key={k} subActIdx={2} min_duration_ms={5000} hapticEnabled={false} /> },
  // Phase 7 SP-F-3 — primitive #5 Phase 3 visual-anchor-driven focus commitment.
  { id: "FocusCommitment · #5 Phase 3", render: (k) => <FocusCommitmentPrimitive key={k} label="MANTÉN" min_hold_ms={5000} release_message="Una hora de foco." hapticEnabled={false} /> },
  // Phase 7 SP-G-1 — primitive #6 Phase 1 grounding body scan secuencial.
  { id: "GroundingBodyScan · #6 Phase 1", render: (k) => <GroundingBodyScanPrimitive key={k} duration_ms={40000} hapticEnabled={false} /> },
  // Phase 7 SP-G-2 — primitive #6 Phase 2 deep breath 5-7 + sink + silence sostén.
  { id: "DeepBreathSettle · subAct 0 (breath 5-7)", render: (k) => <DeepBreathSettlePrimitive key={k} subActIdx={0} cycleCountTarget={4} hapticEnabled={false} /> },
  { id: "DeepBreathSettle · subAct 1 (silence)", render: (k) => <DeepBreathSettlePrimitive key={k} subActIdx={1} min_duration_ms={8000} hapticEnabled={false} /> },
  // Phase 7 SP-G-3 — primitive #6 Phase 3 stable close commitment.
  { id: "StableCloseCommitment · #6 Phase 3", render: (k) => <StableCloseCommitmentPrimitive key={k} label="MANTÉN" min_hold_ms={6000} release_message="Aquí. Firme." hapticEnabled={false} /> },
  // Phase 7 SP-H-1 — primitive #7 Phase 1 percusión + breath compound.
  { id: "EmotionalDischargePercussion · #7 Phase 1", render: (k) => <EmotionalDischargePercussionPrimitive key={k} bpm={150} duration_ms={30000} hapticEnabled={false} /> },
  // Phase 7 SP-H-2 — primitive #7 Phase 2 isometric grip discharge.
  { id: "IsometricDischarge · #7 Phase 2", render: (k) => <IsometricDischargePrimitive key={k} target_holds={3} hold_duration_ms={10000} release_duration_ms={5000} hapticEnabled={false} /> },
  // Phase 7 SP-H-3 — primitive #7 Phase 3 cognitive reset commitment.
  { id: "CognitiveResetCommitment · #7 Phase 3", render: (k) => <CognitiveResetCommitmentPrimitive key={k} label="MANTÉN" min_hold_ms={6000} release_message="Algo cambia ahora." hapticEnabled={false} /> },
  // Phase 7 SP-I-1 — primitive #8 Phase 1 ocular metronome 0.5Hz oculomotor.
  { id: "OcularResetMetronome · #8 Phase 1", render: (k) => <OcularResetMetronomePrimitive key={k} frequency_hz={0.5} total_cycles={15} hapticEnabled={false} /> },
  // Phase 7 SP-I-2 — primitive #8 Phase 2 dual-mode (fixation + mantra)
  { id: "FocalAnchorMantra · #8 Phase 2 fixation", render: (k) => <FocalAnchorMantraPrimitive key={k} mode="fixation" duration_ms={30000} hapticEnabled={false} /> },
  { id: "FocalAnchorMantra · #8 Phase 2 mantra", render: (k) => <FocalAnchorMantraPrimitive key={k} mode="mantra" mantra="Ahora." duration_ms={30000} hapticEnabled={false} /> },
  // Phase 7 SP-I-3 — primitive #8 Phase 3 Lock-in (60-min badge + segmented arcs + hold-press 6s)
  { id: "LockInCommitment · #8 Phase 3", render: (k) => <LockInCommitmentPrimitive key={k} label="BLOQUEAR" min_hold_ms={3000} release_message="Bloqueado · 60 min" hapticEnabled={false} /> },
  // Phase 7 SP-J-1 — primitive #9 Phase 1 Exhale Explosivo (core burst + sound bars + cadence 4-0-6-0)
  { id: "VagalBurstExhale · #9 Phase 1", render: (k) => <VagalBurstExhalePrimitive key={k} cycleCountTarget={3} cadence={{in:4,h1:0,ex:6,h2:0}} hapticEnabled={false} /> },
  // Phase 7 SP-J-2 — primitive #9 Phase 2 dual-mode (activation + lateral_breath)
  { id: "SteelCoreActivation · #9 P2 activation", render: (k) => <SteelCoreActivationPrimitive key={k} mode="activation" duration_ms={25000} hapticEnabled={false} /> },
  { id: "SteelCoreActivation · #9 P2 lateral", render: (k) => <SteelCoreActivationPrimitive key={k} mode="lateral_breath" duration_ms={20000} hapticEnabled={false} /> },
  // Phase 7 SP-J-3 — primitive #9 Phase 3 columna commitment (body silhouette + mantra word-by-word)
  { id: "SteelCoreColumnCommitment · #9 P3", render: (k) => <SteelCoreColumnCommitmentPrimitive key={k} label="MANTÉN" min_hold_ms={3500} release_message="Eje. Vertical. Estable." hapticEnabled={false} /> },
  // Phase 7 SP-K-1 — primitive #10 Phase 1 Pulso Respiratorio (4 pulsos staccato exhale)
  { id: "RespiratoryPulseTrain · #10 P1", render: (k) => <RespiratoryPulseTrainPrimitive key={k} cycleCountTarget={3} cadence={{in:1,h1:0,ex:2,h2:0}} hapticEnabled={false} /> },
  // Phase 7 SP-K-2 — primitive #10 Phase 2 dual-mode (body_scan 6-zone + attention_global)
  { id: "SensoryAwake · #10 P2 body_scan", render: (k) => <SensoryAwakePrimitive key={k} mode="body_scan" duration_ms={30000} hapticEnabled={false} /> },
  { id: "SensoryAwake · #10 P2 global", render: (k) => <SensoryAwakePrimitive key={k} mode="attention_global" duration_ms={10000} hapticEnabled={false} /> },
  // Phase 7 SP-K-3 — primitive #10 Phase 3 directional activation (body + arrow forward + comets)
  { id: "DirectionalActivationCommitment · #10 P3", render: (k) => <DirectionalActivationCommitmentPrimitive key={k} label="MANTÉN" min_hold_ms={3500} release_message="Cuerpo activo · Próxima acción" hapticEnabled={false} /> },
  // Phase 7 SP-L-1 — primitive #11 Phase 1 anclaje diafragmático (mano abdomen + descent)
  { id: "DiaphragmaticAnchor · #11 P1", render: (k) => <DiaphragmaticAnchorPrimitive key={k} cycleCountTarget={2} cadence={{in:4,h1:0,ex:8,h2:0}} hapticEnabled={false} /> },
  // Phase 7 SP-L-2 — primitive #11 Phase 2 dual-mode (body_scan_descent + descent_hold)
  { id: "RelaxationDescent · #11 P2 scan", render: (k) => <RelaxationDescentPrimitive key={k} mode="body_scan_descent" duration_ms={49000} hapticEnabled={false} /> },
  { id: "RelaxationDescent · #11 P2 hold", render: (k) => <RelaxationDescentPrimitive key={k} mode="descent_hold" duration_ms={10000} hapticEnabled={false} /> },
  // Phase 7 SP-L-3 — primitive #11 Phase 3 grounding anchor (roots + horizon)
  { id: "GroundingAnchorCommitment · #11 P3", render: (k) => <GroundingAnchorCommitmentPrimitive key={k} label="MANTÉN" min_hold_ms={3500} release_message="Aquí. Anclado." hapticEnabled={false} /> },
  // Phase 7 SP-M-1 — primitive #12 Phase 1 vertical breath (beam ascending/descending)
  { id: "VerticalBreathAscension · #12 P1", render: (k) => <VerticalBreathAscensionPrimitive key={k} cycleCountTarget={2} cadence={{in:4,h1:2,ex:6,h2:0}} hapticEnabled={false} /> },
  // Phase 7 SP-M-2 — primitive #12 Phase 2 alignment 5 zones (feet→head + axis builds)
  { id: "PosturalAlignment · #12 P2", render: (k) => <PosturalAlignmentPrimitive key={k} duration_ms={35000} hapticEnabled={false} /> },
  // Phase 7 SP-M-3 — primitive #12 Phase 3 cognitive opening (focal + thought waves + 3-stage)
  { id: "CognitiveOpening · #12 P3", render: (k) => <CognitiveOpeningPrimitive key={k} duration_ms={25000} hapticEnabled={false} /> },
  // Phase 7 SP-M-4 — primitive #12 Phase 4 commitment (3 checkmarks + ascension beam)
  { id: "NeuralAscensionCommitment · #12 P4", render: (k) => <NeuralAscensionCommitmentPrimitive key={k} label="MANTÉN" min_hold_ms={3500} release_message="Esta es la decisión." hapticEnabled={false} /> },
  // Phase 7 SP-N-1 — primitive #15 Phase 2 interoception settle (3-stage inquiry)
  { id: "InteroceptionSettle · #15 P2", render: (k) => <InteroceptionSettlePrimitive key={k} duration_ms={30000} hapticEnabled={false} /> },
  // Phase 7 SP-N-2 — primitive #15 Phase 3 calma express (2-word mantra + calm waves)
  { id: "CalmaExpressClosure · #15 P3", render: (k) => <CalmaExpressClosurePrimitive key={k} label="MANTÉN" min_hold_ms={3500} release_message="Calmo. Sigo." hapticEnabled={false} /> },
  // Phase 7 SP-O-1 — primitive #16 Phase 1 vagal resonance calibration (5.5 rpm + coherence wave)
  { id: "VagalResonanceCalibration · #16 P1", render: (k) => <VagalResonanceCalibrationPrimitive key={k} cycleCountTarget={2} cadence={{in:5.5,h1:0,ex:5.5,h2:0}} hapticEnabled={false} /> },
  // Phase 7 SP-O-2 — primitive #16 Phase 2 Sostenimiento (4 bloques × 10 cycles each)
  { id: "VagalResonanceSustainment · #16 P2 b1", render: (k) => <VagalResonanceSustainmentPrimitive key={k} subActIdx={0} cycleCountTarget={3} cadence={{in:5.5,h1:0,ex:5.5,h2:0}} hapticEnabled={false} /> },
  { id: "VagalResonanceSustainment · #16 P2 b3", render: (k) => <VagalResonanceSustainmentPrimitive key={k} subActIdx={2} cycleCountTarget={3} cadence={{in:5.5,h1:0,ex:5.5,h2:0}} hapticEnabled={false} /> },
  // Phase 7 SP-O-3 — primitive #16 Phase 3 closing reflection (point + progress ring)
  { id: "VagalResonanceClosing · #16 P3", render: (k) => <VagalResonanceClosingPrimitive key={k} duration_ms={30000} hapticEnabled={false} /> },
  // Phase 7 SP-P-1 — primitive #17 Phase 1 NSDR config (sleep aesthetic)
  { id: "NSDRConfiguration · #17 P1", render: (k) => <NSDRConfigurationPrimitive key={k} duration_ms={30000} hapticEnabled={false} /> },
  // Phase 7 SP-P-2 — primitive #17 Phase 2 body scan (4 zones × 75s)
  { id: "NSDRBodyScan · #17 P2 z1", render: (k) => <NSDRBodyScanPrimitive key={k} subActIdx={0} duration_ms={15000} hapticEnabled={false} /> },
  { id: "NSDRBodyScan · #17 P2 z3", render: (k) => <NSDRBodyScanPrimitive key={k} subActIdx={2} duration_ms={15000} hapticEnabled={false} /> },
  // Phase 7 SP-P-3 — primitive #17 Phase 3 passive breath (deepest state)
  { id: "NSDRPassiveBreath · #17 P3", render: (k) => <NSDRPassiveBreathPrimitive key={k} duration_ms={30000} hapticEnabled={false} /> },
  // Phase 7 SP-P-4 — primitive #17 Phase 4 return gradual (progressive brightness)
  { id: "NSDRReturn · #17 P4", render: (k) => <NSDRReturnPrimitive key={k} duration_ms={30000} hapticEnabled={false} /> },
  // Phase 7 SP-Q-1 — primitive #18 crisis sensory anchor (visual/auditory/tactile)
  { id: "CrisisSensoryAnchor · #18 P1 visual", render: (k) => <CrisisSensoryAnchorPrimitive key={k} mode="visual" hapticEnabled={false} /> },
  { id: "CrisisSensoryAnchor · #18 P2 auditory", render: (k) => <CrisisSensoryAnchorPrimitive key={k} mode="auditory" hapticEnabled={false} /> },
  { id: "CrisisSensoryAnchor · #18 P3 tactile", render: (k) => <CrisisSensoryAnchorPrimitive key={k} mode="tactile" hapticEnabled={false} /> },
  // Phase 7 SP-Q-5 — primitive #18 Phase 5 presence anchor (rings + crosshair + mantra)
  { id: "PresenceAnchorCommitment · #18 P5", render: (k) => <PresenceAnchorCommitmentPrimitive key={k} label="MANTÉN" min_hold_ms={3000} release_message="Estás aquí · Ahora" hapticEnabled={false} /> },
];

export default function PrimitivePreview() {
  const [active, setActive] = useState(null);
  const [resetKey, setResetKey] = useState(0);

  const activePrim = PRIMITIVES.find((p) => p.id === active);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#08080A",
      color: "rgba(245,245,247,0.92)",
      fontFamily: '"Inter Tight", system-ui, sans-serif',
      paddingBlock: 32,
      paddingInline: 20,
      maxInlineSize: 720,
      marginInline: "auto",
      display: "flex",
      flexDirection: "column",
      gap: 24,
    }}>
      <header>
        <p style={{
          margin: 0,
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(245,245,247,0.38)",
          fontWeight: 500,
        }}>dev / protocol primitives</p>
        <h1 style={{
          margin: "8px 0 0",
          fontWeight: 200,
          fontSize: 28,
          letterSpacing: "-0.02em",
        }}>SP2 storybook</h1>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "rgba(245,245,247,0.62)" }}>
          {PRIMITIVES.length} primitivas. Tap para preview. Reset reinicia.
        </p>
      </header>

      <nav
        data-test="primitive-list"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          paddingBlockEnd: 8,
          borderBlockEnd: "0.5px solid rgba(255,255,255,0.06)",
        }}
      >
        {PRIMITIVES.map((p) => {
          const isActive = active === p.id;
          return (
            <button
              key={p.id}
              type="button"
              data-test={`open-${p.id}`}
              onClick={() => { setActive(p.id); setResetKey((k) => k + 1); }}
              style={{
                appearance: "none",
                cursor: "pointer",
                padding: "8px 12px",
                background: isActive ? "#22D3EE" : "rgba(255,255,255,0.03)",
                color: isActive ? "#08080A" : "rgba(245,245,247,0.72)",
                border: `0.5px solid ${isActive ? "#22D3EE" : "rgba(255,255,255,0.06)"}`,
                borderRadius: 999,
                fontFamily: "inherit",
                fontWeight: 500,
                fontSize: 12,
                letterSpacing: "0.02em",
              }}
            >
              {p.id}
            </button>
          );
        })}
      </nav>

      {active && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            data-test="reset"
            onClick={() => setResetKey((k) => k + 1)}
            style={{
              appearance: "none",
              cursor: "pointer",
              padding: "6px 12px",
              background: "transparent",
              color: "rgba(245,245,247,0.62)",
              border: "0.5px solid rgba(255,255,255,0.06)",
              borderRadius: 999,
              fontFamily: "inherit",
              fontWeight: 500,
              fontSize: 11,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Reset
          </button>
        </div>
      )}

      <main
        data-test="preview-area"
        data-active={active || ""}
        style={{
          minBlockSize: 360,
          padding: 16,
          background: "rgba(255,255,255,0.02)",
          border: "0.5px solid rgba(255,255,255,0.06)",
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {!activePrim && (
          <p style={{ margin: 0, fontSize: 13, color: "rgba(245,245,247,0.38)" }}>
            Selecciona una primitiva para previsualizar
          </p>
        )}
        {activePrim && (
          <div style={{ inlineSize: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {activePrim.render(resetKey)}
          </div>
        )}
      </main>
    </div>
  );
}
