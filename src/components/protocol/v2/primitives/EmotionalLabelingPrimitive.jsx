"use client";
/* ═══════════════════════════════════════════════════════════════
   EmotionalLabelingPrimitive — Phase 7 SP-C-2
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 2 "Etiquetado Emocional" del
   protocolo #2 Activación Cognitiva. Reemplaza shared
   body_silhouette_highlight + chip_selector + silence_cyan_minimal
   con primitive multi-task wrapper.

   3 sub-actos (controlled via subActIdx prop):
     - subActIdx=0 (25s): "Escanea tu cuerpo. ¿Qué sientes?"
       → SVG silhouette progressive highlight + interocepción.
     - subActIdx=1 (25s): "Elige la palabra más precisa."
       → chip selector 6 emociones, min_thinking_ms 6000.
     - subActIdx=2 (10s): "Quédate con la palabra. La intensidad baja."
       → silence sustain text + min_duration_ms gate.

   Multi-task tracks simultáneos cada subAct:
     1. PRIMARY cognitive: silhouette / chip / silence per subActIdx.
     2. SECONDARY visual: orb continuation 6-2-8 carry-over from
        Phase 1 (vagal sustained, soft pulse).
     3. SECONDARY visual: particle field orbital hold-pattern.
     4. SECONDARY cognitive-somatic: "Mano sobre el corazón"
        sustained — continuidad de Phase 1 anchor (mano libre del
        celular permanece en pecho).
     5. PHASE label simple "Etiquetado Emocional" (zero scientific text).

   Functional human logic:
     - subAct 0: usuario sigue silueta visual + nota sensaciones
       en cuerpo (interocepción ínsula anterior).
     - subAct 1: usuario tap chip emoción con pulgar (mano celular).
       La OTRA mano sigue sobre corazón — no conflicto.
     - subAct 2: silence — usuario sostiene la palabra cognitivamente.
       Mano-corazón anchor refuerza la consolidación somática.

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - Mano libre sobre corazón sustained — anchor continuo Phase 1+2.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";
import BodySilhouetteHighlight from "./BodySilhouetteHighlight";

// Sub-act configs internos.
const SUB_ACTS = [
  {
    idx: 0,
    kind: "interoception",
    title: "Escanea tu cuerpo.",
    subtitle: "¿Qué sientes exactamente?",
    minDurationMs: 20000,
  },
  {
    idx: 1,
    kind: "chip",
    title: "Elige la palabra más precisa.",
    subtitle: null,
    chips: [
      { id: "frustration",  label: "Frustración" },
      { id: "exhaustion",   label: "Agotamiento" },
      { id: "uncertainty",  label: "Incertidumbre" },
      { id: "anxiety",      label: "Ansiedad" },
      { id: "anger",        label: "Enojo" },
      { id: "sadness",      label: "Tristeza" },
    ],
    minThinkingMs: 6000,
  },
  {
    idx: 2,
    kind: "silence",
    title: "Quédate con la palabra.",
    subtitle: "La intensidad baja.",
    minDurationMs: 8000,
  },
];

const PHASE_LABEL = "Etiquetado Emocional";
const BODY_ANCHOR_CUE = "Mano sobre el corazón";

const DEFAULT_HIGHLIGHT_PROGRESSION = ["chest", "shoulders", "stomach", "head", "neck"];

/**
 * @param {object} props
 * @param {number} [props.subActIdx=0] — 0/1/2
 * @param {Array} [props.chips]
 * @param {Array} [props.highlight_progression]
 * @param {number} [props.transition_ms=4000]
 * @param {number} [props.min_thinking_ms=6000]
 * @param {number} [props.min_duration_ms]
 * @param {boolean} [props.audioEnabled=true]
 * @param {boolean} [props.hapticEnabled=true]
 * @param {boolean} [props.voiceEnabled=false]
 * @param {(s:object)=>void} [props.onSignal]
 * @param {()=>void} [props.onComplete]
 */
export default function EmotionalLabelingPrimitive({
  subActIdx = 0,
  chips,
  highlight_progression = DEFAULT_HIGHLIGHT_PROGRESSION,
  transition_ms = 4000,
  min_thinking_ms = 6000,
  min_duration_ms,
  audioEnabled = true, // eslint-disable-line no-unused-vars
  hapticEnabled = true,
  voiceEnabled = false, // eslint-disable-line no-unused-vars
  onSignal,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const cfg = SUB_ACTS[subActIdx] || SUB_ACTS[0];
  const phaseColor = getCyanForPhase(1); // cyan-cool #67E8F9 phase2

  const onSignalRef = useRef(onSignal);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onSignalRef.current = onSignal; }, [onSignal]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // ─── Sub-act state ─────────────────────────────────────────
  const [thinkingTimePassed, setThinkingTimePassed] = useState(false);
  const [silenceTimePassed, setSilenceTimePassed] = useState(false);
  const [selectedChipId, setSelectedChipId] = useState(null);

  // Silence sub-act min_duration gate.
  useEffect(() => {
    if (cfg.kind !== "silence") return undefined;
    setSilenceTimePassed(false);
    const targetMs = min_duration_ms || cfg.minDurationMs;
    const timeout = setTimeout(() => {
      setSilenceTimePassed(true);
      try {
        if (typeof onCompleteRef.current === "function") onCompleteRef.current();
      } catch { /* noop */ }
    }, targetMs);
    return () => clearTimeout(timeout);
  }, [cfg.kind, min_duration_ms, cfg.minDurationMs]);

  // Chip selector min_thinking gate.
  useEffect(() => {
    if (cfg.kind !== "chip") return undefined;
    setThinkingTimePassed(false);
    setSelectedChipId(null);
    const timeout = setTimeout(() => setThinkingTimePassed(true), min_thinking_ms);
    return () => clearTimeout(timeout);
  }, [cfg.kind, min_thinking_ms]);

  function handleChipSelect(chipId) {
    if (!thinkingTimePassed) return;
    if (cfg.kind !== "chip") return;
    setSelectedChipId(chipId);
    try {
      if (typeof onSignalRef.current === "function") {
        onSignalRef.current({ selectedChipId: chipId });
      }
    } catch { /* noop */ }
    if (hapticEnabled) {
      try {
        hapticProtocolSignature(2, "phase_shift", { reducedMotion: reduceMotion });
      } catch { /* noop */ }
    }
    try {
      if (typeof onCompleteRef.current === "function") onCompleteRef.current();
    } catch { /* noop */ }
  }

  // Interocepción onComplete handler — passed to BodySilhouetteHighlight.
  function handleInteroceptionComplete() {
    try {
      if (typeof onCompleteRef.current === "function") onCompleteRef.current();
    } catch { /* noop */ }
  }

  // ─── Multi-task overlays ───────────────────────────────────
  // Track 2: orb continuation (vagal carry-over from Phase 1, soft pulse).
  const orbRef = useRef(null);
  useEffect(() => {
    if (reduceMotion) return undefined;
    let stopped = false;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      if (stopped) return;
      const t = ((now - start) / 1000) % 4;
      const scale = 1.0 + Math.sin((t / 4) * Math.PI * 2) * 0.05;
      const orb = orbRef.current;
      if (orb) orb.style.transform = `scale(${scale.toFixed(4)})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [reduceMotion]);

  // Track 3: particle field orbital hold-pattern.
  const particleCanvasRef = useRef(null);
  const particleSysRef = useRef(null);
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return undefined;
    canvas.width = 300;
    canvas.height = 300;
    try {
      particleSysRef.current = createParticleSystem({ canvas, reducedMotion: reduceMotion });
      if (particleSysRef.current) {
        particleSysRef.current.setPhase("hold", 0);
        particleSysRef.current.start();
      }
    } catch (e) { /* noop */ }
    return () => {
      if (particleSysRef.current) {
        try { particleSysRef.current.stop(); } catch { /* noop */ }
        particleSysRef.current = null;
      }
    };
  }, [reduceMotion]);

  return (
    <div
      data-v2-emotional-labeling
      data-sub-act-idx={subActIdx}
      data-sub-act-kind={cfg.kind}
      data-testid="emotional-labeling-primitive"
      role="region"
      aria-label={`Etiquetado Emocional, sub-acto ${subActIdx + 1}, ${cfg.title}`}
      style={{
        width: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.s24,
      }}
    >
      {/* Phase label simple top */}
      <span
        data-testid="emotional-labeling-phase-label"
        style={{
          fontFamily: typography.family,
          fontSize: 11,
          fontWeight: typography.weight.medium,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: phaseColor,
          opacity: 0.7,
        }}
      >
        {PHASE_LABEL}
      </span>

      {/* Visual stack: particles + orb continuation (background) + PRIMARY content */}
      <div
        style={{
          position: "relative",
          width: 300,
          minHeight: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Track 3: particles orbital */}
        <canvas
          ref={particleCanvasRef}
          data-testid="emotional-labeling-particles"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: reduceMotion ? 0 : 0.40,
            transition: "opacity 200ms ease-out",
          }}
        />
        {/* Track 2: orb continuation soft pulse */}
        <div
          ref={orbRef}
          data-testid="emotional-labeling-orb"
          aria-hidden="true"
          style={{
            position: "absolute",
            width: 110,
            height: 110,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(103,232,249,0.28) 0%, rgba(14,116,144,0.12) 60%, rgba(14,116,144,0) 100%)",
            border: `1px solid ${phaseColor}`,
            opacity: 0.55,
            transition: "none",
            willChange: "transform",
            transform: "scale(1.0)",
          }}
        />

        {/* Track 1: PRIMARY content per sub-act */}
        <div
          data-testid="emotional-labeling-primary"
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 320,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: spacing.s12,
            paddingInline: spacing.s16,
          }}
        >
          {/* Title + subtitle */}
          <h2
            data-testid="emotional-labeling-title"
            style={{
              margin: 0,
              fontFamily: typography.family,
              fontSize: 22,
              fontWeight: typography.weight.light,
              letterSpacing: "-0.02em",
              color: colors.text.strong,
              lineHeight: 1.25,
            }}
          >
            {cfg.title}
          </h2>
          {cfg.subtitle && (
            <p
              data-testid="emotional-labeling-subtitle"
              style={{
                margin: 0,
                fontFamily: typography.family,
                fontSize: typography.size.body,
                fontWeight: typography.weight.regular,
                color: colors.text.secondary,
                lineHeight: 1.45,
              }}
            >
              {cfg.subtitle}
            </p>
          )}

          {/* Sub-act 0: body silhouette interocepción */}
          {cfg.kind === "interoception" && (
            <div
              data-testid="emotional-labeling-silhouette"
              style={{ marginBlockStart: spacing.s12 }}
            >
              <BodySilhouetteHighlight
                highlight_progression={highlight_progression}
                transition_ms={transition_ms}
                onComplete={handleInteroceptionComplete}
              />
            </div>
          )}

          {/* Sub-act 1: chip selector emociones */}
          {cfg.kind === "chip" && (
            <div
              data-testid="emotional-labeling-chips"
              role="radiogroup"
              aria-label="Elige la palabra más precisa"
              style={{
                marginBlockStart: spacing.s16,
                display: "flex",
                gap: spacing.s8,
                justifyContent: "center",
                flexWrap: "wrap",
                opacity: thinkingTimePassed ? 1 : 0.4,
                transition: reduceMotion ? "none" : "opacity 220ms ease-out",
                pointerEvents: thinkingTimePassed ? "auto" : "none",
              }}
            >
              {(chips || cfg.chips).map((c) => {
                const isActive = selectedChipId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    data-testid={`emotional-labeling-chip-${c.id}`}
                    onClick={() => handleChipSelect(c.id)}
                    disabled={!thinkingTimePassed}
                    style={{
                      paddingBlock: spacing.s12,
                      paddingInline: spacing.s16,
                      borderRadius: 999,
                      border: `1px solid ${isActive ? phaseColor : colors.separator}`,
                      background: isActive ? "rgba(103,232,249,0.12)" : "transparent",
                      color: isActive ? phaseColor : colors.text.primary,
                      fontFamily: typography.family,
                      fontSize: typography.size.body,
                      fontWeight: typography.weight.regular,
                      cursor: thinkingTimePassed ? "pointer" : "not-allowed",
                      minHeight: 44,
                      transition: reduceMotion ? "none" : "all 180ms ease-out",
                    }}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Sub-act 2: silence sostén indicator */}
          {cfg.kind === "silence" && (
            <span
              data-testid="emotional-labeling-silence-indicator"
              style={{
                marginBlockStart: spacing.s24,
                fontFamily: typography.family,
                fontSize: 11,
                fontWeight: typography.weight.medium,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: phaseColor,
                opacity: silenceTimePassed ? 1 : 0.5,
                transition: reduceMotion ? "none" : "opacity 320ms ease-out",
              }}
            >
              {silenceTimePassed ? "Listo" : "Sostén"}
            </span>
          )}
        </div>
      </div>

      {/* Track 4: body anchor sustained "Mano sobre el corazón" */}
      <span
        data-testid="emotional-labeling-body-anchor"
        aria-live="polite"
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.01em",
          color: colors.text.secondary,
          opacity: 0.7,
          textAlign: "center",
        }}
      >
        {BODY_ANCHOR_CUE}
      </span>
    </div>
  );
}
