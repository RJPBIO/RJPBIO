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
