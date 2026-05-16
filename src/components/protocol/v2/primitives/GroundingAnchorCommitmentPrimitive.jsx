"use client";
/* ═══════════════════════════════════════════════════════════════
   GroundingAnchorCommitmentPrimitive — Phase 7 SP-L-3
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 3 "Anclaje Final" del protocolo
   #11 Body Anchor. Visual signature unique: body silhouette +
   ROOTS descendiendo desde los pies hacia el suelo + horizon
   ground line + mantra "Aquí. Anclado." emerge durante hold.

   Lección palmas conflict aplicada preventively ⚠️ (5ª vez):
   El catálogo decía "Mantén las palmas firmes contra los muslos..."
   — MISMO conflict #4/#5/#7/#8/#9/#10. Aplicado fix: "palmas firmes"
   REMOVIDO del UI. Body anchor mental.

   Macro-phase A→B (8s + 22s):
     Phase A — Visualiza arraigo (0-8s):
       - Primary: "Visualiza tus pies firmes en el suelo"
       - Body anchor: "Aquí · Presente"
       - Body silhouette + roots subtle + horizon line.
       - Hold button hidden.
     Phase B — Mantén · Anclate (8-30s):
       - Primary: "Mantén · Aquí. Anclado."
       - Body anchor: "Aquí. Anclado." (emerge dim → bright peak)
       - Hold-press 6s ring progress.
       - Roots extend deeper + glow brighter sync hold progress.
       - On complete: roots peak deep + mantra full bright + release
         "Aquí. Anclado."

   Differentiation vs other Phase 3 primitives:
     - #7 cognitive_reset: orb + particles centrifugal
     - #8 lock_in: 60-min badge + segmented arcs
     - #9 steel_core_column: vertical axis + mantra word-by-word
     - #10 directional_activation: horizontal forward beam + comets
     - #11 (este): roots DOWN + horizon ground line + grounding metaphor

   Multi-exercise tracks layered (8):
     1. BODY silhouette (continuidad SP-L-1+2).
     2. ROOTS 5 vertical lines extending below feet (grow with hold).
     3. HORIZON GROUND LINE clearly visible below feet.
     4. FEET halo brightens during hold (anchored point).
     5. HOLD-PRESS button con ring progress 6s.
     6. PRIMARY prompt cambia per macro-phase (aria-live).
     7. BODY anchor evolutivo + mantra "Aquí. Anclado." peak.
     8. PHASE label "Anclaje Final" cyan-warm.

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - Visualización mental + 1 mano hold-press = compatible.
     - SIN body anchor manos extras (lección palmas).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const PHASE_LABEL = "Anclaje Final";
const PHASE_A_PROMPT = "Visualiza tus pies firmes en el suelo";
const PHASE_B_PROMPT = "Mantén · Aquí. Anclado.";
const PHASE_A_BODY_ANCHOR = "Aquí · Presente";
const PHASE_B_BODY_ANCHOR = "Aquí. Anclado.";
const RELEASE_DEFAULT = "Aquí. Anclado.";

const PHASE_A_END_MS = 8000;
const HOLD_SIZE = 110;
const HOLD_RADIUS = 50;

const ROOT_COUNT = 5;
const FEET_FLOOR_Y = 320;
const HORIZON_Y = 322;
const ROOT_BASE_LENGTH = 12;
const ROOT_MAX_LENGTH = 36;

/**
 * @param {object} props
 * @param {string} [props.label="MANTÉN"]
 * @param {number} [props.min_hold_ms=6000]
 * @param {string} [props.release_message]
 * @param {boolean} [props.audioEnabled]
 * @param {boolean} [props.hapticEnabled]
 * @param {boolean} [props.voiceEnabled]
 * @param {(s:object)=>void} [props.onSignal]
 * @param {()=>void} [props.onComplete]
 * @param {()=>void} [props.onCancel]
 */
export default function GroundingAnchorCommitmentPrimitive({
  label = "MANTÉN",
  min_hold_ms = 6000,
  release_message = RELEASE_DEFAULT,
  audioEnabled = true,  
  hapticEnabled = true,
  voiceEnabled = false,  
  onSignal,
  onComplete,
  onCancel,
}) {
  const reduceMotion = useReducedMotion();
  const phaseColor = getCyanForPhase(2); // cyan-warm #06B6D4
  const uid = useId();
  const haloId = `gacBlur-${uid}`;
  const vignetteId = `gacVignette-${uid}`;
  const auraId = `gacAura-${uid}`;
  const rootGradId = `gacRootGrad-${uid}`;

  const onSignalRef = useRef(onSignal);
  const onCompleteRef = useRef(onComplete);
  const onCancelRef = useRef(onCancel);
  useEffect(() => { onSignalRef.current = onSignal; }, [onSignal]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onCancelRef.current = onCancel; }, [onCancel]);

  const [macroPhase, setMacroPhase] = useState("A");
  useEffect(() => {
    if (reduceMotion) {
      const t = setTimeout(() => setMacroPhase("B"), 800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setMacroPhase("B"), PHASE_A_END_MS);
    return () => clearTimeout(t);
  }, [reduceMotion]);

  const [pressing, setPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showRelease, setShowRelease] = useState(false);
  const startRef = useRef(0);
  const rafRef = useRef(null);

  const stopAnim = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  useEffect(() => () => stopAnim(), []);

  const tick = () => {
    const elapsed = Date.now() - startRef.current;
    const pct = Math.min(1, elapsed / min_hold_ms);
    setProgress(pct);

    if (pct >= 1) {
      stopAnim();
      setCompleted(true);
      setPressing(false);
      if (hapticEnabled) {
        try { hapticSignature("award"); } catch {}
      }
      setShowRelease(true);
      try {
        if (typeof onSignalRef.current === "function") {
          onSignalRef.current({ holdMs: min_hold_ms });
        }
      } catch {}
      setTimeout(() => {
        try {
          if (typeof onCompleteRef.current === "function") onCompleteRef.current();
        } catch {}
      }, 1600);
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  const startPress = () => {
    if (completed) return;
    if (macroPhase !== "B") return;
    setPressing(true);
    startRef.current = Date.now();
    rafRef.current = requestAnimationFrame(tick);
  };

  const cancelPress = () => {
    if (completed || !pressing) return;
    const elapsed = Date.now() - startRef.current;
    stopAnim();
    setPressing(false);
    if (elapsed < min_hold_ms) {
      if (hapticEnabled) {
        try { hap("error"); } catch {}
      }
      setProgress(0);
      try {
        if (typeof onCancelRef.current === "function") onCancelRef.current();
      } catch {}
    }
  };

  // Particles ambient
  const particleCanvasRef = useRef(null);
  const particleSysRef = useRef(null);
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return undefined;
    canvas.width = 280;
    canvas.height = 380;
    try {
      particleSysRef.current = createParticleSystem({ canvas, reducedMotion: reduceMotion });
      if (particleSysRef.current) {
        particleSysRef.current.setPhase("hold", 0);
        particleSysRef.current.start();
      }
    } catch (e) {}
    return () => {
      if (particleSysRef.current) {
        try { particleSysRef.current.stop(); } catch {}
        particleSysRef.current = null;
      }
    };
  }, [reduceMotion]);

  const circumference = 2 * Math.PI * HOLD_RADIUS;
  const dashOffset = circumference * (1 - progress);

  const primaryPrompt = macroPhase === "A" ? PHASE_A_PROMPT : PHASE_B_PROMPT;
  const bodyAnchor = macroPhase === "A" ? PHASE_A_BODY_ANCHOR : PHASE_B_BODY_ANCHOR;

  // Root length grows with hold progress (Phase B only)
  const rootLength = macroPhase === "B"
    ? ROOT_BASE_LENGTH + progress * (ROOT_MAX_LENGTH - ROOT_BASE_LENGTH)
    : ROOT_BASE_LENGTH * 0.5;

  return (
    <div
      data-v2-grounding-anchor-commitment
      data-macro-phase={macroPhase}
      data-completed={completed ? "true" : "false"}
      data-pressing={pressing ? "true" : "false"}
      data-testid="grounding-anchor-commitment-primitive"
      role="region"
      aria-label="Anclaje final, pies firmes, mantén y repite mentalmente aquí anclado"
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
      <span
        data-testid="grounding-anchor-commitment-phase-label"
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

      <p
        data-testid="grounding-anchor-commitment-primary-prompt"
        aria-live="polite"
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: 17,
          fontWeight: macroPhase === "B" ? typography.weight.medium : typography.weight.light,
          letterSpacing: "-0.02em",
          color: macroPhase === "B" ? phaseColor : colors.text.strong,
          lineHeight: 1.3,
          textAlign: "center",
          maxWidth: 320,
          paddingInline: spacing.s16,
          minHeight: 24,
          transition: reduceMotion ? "none" : "color 320ms ease-out, font-weight 320ms ease-out",
        }}
      >
        {primaryPrompt}
      </p>

      <div
        style={{
          position: "relative",
          width: 280,
          height: 380,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <canvas
          ref={particleCanvasRef}
          data-testid="grounding-anchor-commitment-particles"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: reduceMotion ? 0 : 0.16,
            transition: "opacity 200ms ease-out",
          }}
        />

        <svg
          data-testid="grounding-anchor-commitment-silhouette"
          aria-hidden="true"
          width="240"
          height="380"
          viewBox="0 0 240 380"
          style={{ position: "absolute" }}
        >
          <defs>
            <filter id={haloId} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
            <radialGradient id={vignetteId} cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.06" />
              <stop offset="60%" stopColor={phaseColor} stopOpacity="0.02" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.45" />
              <stop offset="50%" stopColor={phaseColor} stopOpacity="0.15" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
            <linearGradient id={rootGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.95" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          <ellipse cx="120" cy="180" rx="110" ry="170" fill={`url(#${vignetteId})`} />

          {/* Body silhouette */}
          <path
            d="M 120 36
               C 109 36, 100 46, 100 60
               C 100 70, 104 79, 110 84
               L 110 90
               C 100 92, 86 96, 82 108
               C 78 122, 76 138, 76 158
               L 76 196
               C 76 210, 78 222, 84 234
               L 88 248
               C 88 260, 90 270, 90 280
               L 90 308
               C 90 314, 94 318, 100 318
               L 108 318
               C 110 314, 112 308, 112 300
               L 112 250
               L 128 250
               L 128 300
               C 128 308, 130 314, 132 318
               L 140 318
               C 146 318, 150 314, 150 308
               L 150 280
               C 150 270, 152 260, 152 248
               L 156 234
               C 162 222, 164 210, 164 196
               L 164 158
               C 164 138, 162 122, 158 108
               C 154 96, 140 92, 130 90
               L 130 84
               C 136 79, 140 70, 140 60
               C 140 46, 131 36, 120 36 Z"
            fill="none"
            stroke={phaseColor}
            strokeWidth="0.9"
            opacity={completed ? 0.85 : (macroPhase === "B" ? 0.55 + progress * 0.30 : 0.50)}
            style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
          />

          {/* Vertical core column subtle */}
          <rect
            x="116" y="40" width="8" height="280"
            fill={phaseColor}
            opacity={completed ? 0.75 : (macroPhase === "B" ? 0.45 + progress * 0.30 : 0.40)}
            rx="4"
            style={{ transition: reduceMotion ? "none" : "opacity 400ms ease-out" }}
          />

          {/* Head + shoulders + core orb (canon) */}
          <circle cx="120" cy="58" r="20" fill="none" stroke={phaseColor} strokeWidth="1.2" opacity="0.55" />
          {[{ x: 86, y: 100 }, { x: 154, y: 100 }].map((pt, i) => (
            <circle key={`sh-${i}`} cx={pt.x} cy={pt.y} r="5" fill={phaseColor} opacity="0.85" />
          ))}
          <circle cx="120" cy="172" r="14" fill="none" stroke={phaseColor} strokeWidth="1.2" opacity="0.55" />

          {/* FEET — bright anchor points (focus area for grounding) */}
          {[
            { x1: 84, x2: 110 },
            { x1: 130, x2: 156 },
          ].map((seg, i) => (
            <g key={`ft-${i}`}>
              <ellipse
                cx={(seg.x1 + seg.x2) / 2} cy={FEET_FLOOR_Y} rx="22" ry="4"
                fill={`url(#${auraId})`}
                opacity={completed ? 0.95 : (macroPhase === "B" ? 0.65 + progress * 0.30 : 0.55)}
                filter={reduceMotion ? undefined : `url(#${haloId})`}
                style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
              />
              <line
                x1={seg.x1} y1={FEET_FLOOR_Y} x2={seg.x2} y2={FEET_FLOOR_Y}
                stroke={phaseColor} strokeWidth="3" strokeLinecap="round"
                opacity="0.95"
              />
            </g>
          ))}

          {/* HORIZON GROUND LINE — clear horizontal reference below feet */}
          <line
            x1="40" y1={HORIZON_Y} x2="200" y2={HORIZON_Y}
            stroke={phaseColor}
            strokeWidth="1"
            strokeLinecap="round"
            opacity={completed ? 0.85 : (macroPhase === "B" ? 0.55 + progress * 0.30 : 0.45)}
            style={{ transition: reduceMotion ? "none" : "opacity 400ms ease-out" }}
          />
          {/* Horizon glow */}
          <ellipse
            cx="120" cy={HORIZON_Y} rx="80" ry="3"
            fill={phaseColor}
            opacity={completed ? 0.55 : (macroPhase === "B" ? 0.30 + progress * 0.25 : 0.18)}
            filter={reduceMotion ? undefined : `url(#${haloId})`}
            style={{ transition: reduceMotion ? "none" : "opacity 400ms ease-out" }}
          />

          {/* ROOTS — 5 vertical lines extending below feet floor into ground */}
          {Array.from({ length: ROOT_COUNT }).map((_, i) => {
            // Distribute roots: 2 left foot + 1 center + 2 right foot
            const xPositions = [88, 100, 120, 140, 152];
            const xPos = xPositions[i];
            const length = rootLength * (i === 2 ? 1.0 : (i === 1 || i === 3 ? 0.85 : 0.7));
            const opacity = completed ? 0.85 : (macroPhase === "B" ? 0.45 + progress * 0.45 : 0.30);
            return (
              <g key={`root-${i}`}>
                <line
                  x1={xPos} y1={HORIZON_Y}
                  x2={xPos} y2={HORIZON_Y + length}
                  stroke={`url(#${rootGradId})`}
                  strokeWidth={i === 2 ? 2 : 1.2}
                  strokeLinecap="round"
                  opacity={opacity}
                  style={{ transition: reduceMotion ? "none" : "all 220ms ease-out" }}
                />
                {/* Root tip glow */}
                <circle
                  cx={xPos} cy={HORIZON_Y + length}
                  r={completed ? 3 : (macroPhase === "B" ? 2 + progress * 2 : 1.5)}
                  fill={phaseColor}
                  opacity={opacity * 0.85}
                  filter={reduceMotion ? undefined : `url(#${haloId})`}
                  style={{ transition: reduceMotion ? "none" : "all 220ms ease-out" }}
                />
              </g>
            );
          })}

          {/* Ground depth shadow (below horizon, gradient fade) */}
          <rect
            x="40" y={HORIZON_Y} width="160" height="40"
            fill={`url(#${rootGradId})`}
            opacity={completed ? 0.25 : (macroPhase === "B" ? 0.10 + progress * 0.18 : 0.08)}
            style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
          />
        </svg>

        {/* Hold-press button (Phase B only) — bottom of body */}
        {macroPhase === "B" && (
          <button
            type="button"
            data-testid="grounding-anchor-commitment-hold-button"
            aria-label={label}
            onPointerDown={startPress}
            onPointerUp={cancelPress}
            onPointerLeave={cancelPress}
            onPointerCancel={cancelPress}
            style={{
              appearance: "none",
              position: "absolute",
              bottom: -16,
              inlineSize: HOLD_SIZE,
              blockSize: HOLD_SIZE,
              borderRadius: "50%",
              background: pressing
                ? "rgba(6,182,212,0.22)"
                : completed
                  ? "rgba(6,182,212,0.16)"
                  : "rgba(255,255,255,0.04)",
              border: `0.5px solid ${pressing || completed ? phaseColor : colors.separator}`,
              color: pressing || completed ? phaseColor : colors.text.secondary,
              fontFamily: typography.family,
              fontWeight: typography.weight.medium,
              fontSize: 11,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              cursor: completed ? "default" : "pointer",
              touchAction: "none",
              transition: "background 120ms linear, border-color 120ms linear",
              zIndex: 2,
              padding: 0,
            }}
          >
            <svg
              aria-hidden="true"
              width={HOLD_SIZE}
              height={HOLD_SIZE}
              viewBox={`0 0 ${HOLD_SIZE} ${HOLD_SIZE}`}
              style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}
            >
              <circle
                cx={HOLD_SIZE / 2}
                cy={HOLD_SIZE / 2}
                r={HOLD_RADIUS}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="2"
              />
              <circle
                cx={HOLD_SIZE / 2}
                cy={HOLD_SIZE / 2}
                r={HOLD_RADIUS}
                fill="none"
                stroke={phaseColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: "stroke-dashoffset 80ms linear" }}
              />
            </svg>
            <span
              style={{
                position: "relative",
                zIndex: 1,
                paddingInline: 4,
                lineHeight: 1.2,
              }}
            >
              {showRelease ? release_message : label}
            </span>
          </button>
        )}
      </div>

      {/* Body anchor / Mantra */}
      <span
        data-testid="grounding-anchor-commitment-body-anchor"
        aria-live="polite"
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: macroPhase === "B" ? typography.weight.medium : typography.weight.light,
          letterSpacing: "-0.01em",
          color: macroPhase === "B" ? phaseColor : colors.text.secondary,
          opacity: macroPhase === "A" ? 0.78 : (0.55 + progress * 0.40),
          textAlign: "center",
          minHeight: 22,
          transition: reduceMotion ? "none" : "opacity 220ms ease-out, color 320ms ease-out",
        }}
      >
        {bodyAnchor}
      </span>
    </div>
  );
}
