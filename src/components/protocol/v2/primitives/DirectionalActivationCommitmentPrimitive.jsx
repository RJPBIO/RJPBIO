"use client";
/* ═══════════════════════════════════════════════════════════════
   DirectionalActivationCommitmentPrimitive — Phase 7 SP-K-3
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 3 "Activación Direccional" del
   protocolo #10 Sensory Wake. Visual signature unique: body
   silhouette + energy arrow forward + comets streaming durante
   hold (visualiza "próxima acción con energía direccional").

   Lección palmas conflict aplicada preventively ⚠️:
   El catálogo decía "Mantén las palmas presionadas mientras
   visualizas..." — MISMO conflict #4/#5/#7/#8/#9. Aplicado fix:
   "palmas presionadas" REMOVIDO del UI. Body anchor mental.

   Macro-phase A→B (8s + 37s):
     Phase A — Visualiza (0-8s):
       - Primary: "Visualiza tu próxima acción · Con energía"
       - Body anchor: "Imagina lo que vas a hacer ahora"
       - Body silhouette + arrow forward subtle.
       - Hold button hidden.
     Phase B — Mantén · Energía hacia adelante (8-45s):
       - Primary: "Mantén · Energía direccional"
       - Body anchor: "Tu próxima acción · Con fuerza"
       - Hold-press 5s ring progress.
       - Energy arrow extends forward + 3 comets streaming.
       - On complete: full forward beam + body silhouette peak glow.

   Identity #10 = "Sensory Wake" — body activated for next action.
   Phase 3 cierra el ciclo proyectando energía direccional adelante.

   Differentiation vs other Phase 3 primitives:
     - #7 cognitive_reset: orb + particles centrifugal (algo cambia)
     - #8 lock_in: 60-min badge + segmented arcs (una tarea una hora)
     - #9 steel_core_column: vertical axis + mantra word-by-word
     - #10 (este): body + horizontal forward arrow + comets streaming

   Multi-exercise tracks layered (8):
     1. BODY silhouette (continuidad SP-K-2 Phase 2).
     2. VERTICAL core column lit subtle (background).
     3. ENERGY ARROW horizontal forward (right side, chest level).
     4. 3 ENERGY COMETS streaming forward staggered (particle flow).
     5. HOLD-PRESS button con ring progress 5s.
     6. PRIMARY prompt cambia per macro-phase (aria-live).
     7. BODY anchor evolutivo per macro-phase.
     8. PHASE label "Activación Direccional" cyan-warm.

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - Visualización mental + 1 mano hold-press = perfectamente compatible.
     - SIN body anchor manos extras (lección persistente palmas).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const PHASE_LABEL = "Activación Direccional";
const PHASE_A_PROMPT = "Visualiza tu próxima acción · Con energía";
const PHASE_B_PROMPT = "Mantén · Energía direccional";
const PHASE_A_BODY_ANCHOR = "Imagina lo que vas a hacer ahora";
const PHASE_B_BODY_ANCHOR = "Tu próxima acción · Con fuerza";
const RELEASE_DEFAULT = "Cuerpo activo · Próxima acción";

const PHASE_A_END_MS = 8000;
const HOLD_SIZE = 110;
const HOLD_RADIUS = 50;

const COMET_COUNT = 3;
const COMET_PERIOD_MS = 1800; // each comet cycle 1.8s

/**
 * @param {object} props
 * @param {string} [props.label="MANTÉN"]
 * @param {number} [props.min_hold_ms=5000]
 * @param {string} [props.release_message]
 * @param {boolean} [props.audioEnabled]
 * @param {boolean} [props.hapticEnabled]
 * @param {boolean} [props.voiceEnabled]
 * @param {(s:object)=>void} [props.onSignal]
 * @param {()=>void} [props.onComplete]
 * @param {()=>void} [props.onCancel]
 */
export default function DirectionalActivationCommitmentPrimitive({
  label = "MANTÉN",
  min_hold_ms = 5000,
  release_message = RELEASE_DEFAULT,
  audioEnabled = true,  
  hapticEnabled = true,
  voiceEnabled = false,  
  onSignal,
  onComplete,
  onCancel,
}) {
  const reduceMotion = useReducedMotion();
  const phaseColor = getCyanForPhase(2); // cyan-warm #06B6D4 phase3
  const uid = useId();
  const haloId = `dacBlur-${uid}`;
  const vignetteId = `dacVignette-${uid}`;
  const arrowGradId = `dacArrowGrad-${uid}`;
  const auraId = `dacAura-${uid}`;
  const cometGradId = `dacCometGrad-${uid}`;

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
  const [cometPhase, setCometPhase] = useState(0); // 0..1 cycling
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

  // Comet phase ticker — cycles 0..1 over COMET_PERIOD_MS
  useEffect(() => {
    if (reduceMotion) return undefined;
    let stopped = false;
    let raf;
    const startTime = performance.now();
    const tickComet = (now) => {
      if (stopped) return;
      const t = ((now - startTime) % COMET_PERIOD_MS) / COMET_PERIOD_MS;
      setCometPhase(t);
      raf = requestAnimationFrame(tickComet);
    };
    raf = requestAnimationFrame(tickComet);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [reduceMotion]);

  // Particles ambient
  const particleCanvasRef = useRef(null);
  const particleSysRef = useRef(null);
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return undefined;
    canvas.width = 320;
    canvas.height = 320;
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

  // Arrow length grows with progress: base 60, max 120 (~50% extension)
  const baseArrowLength = 60;
  const arrowLength = baseArrowLength + (macroPhase === "B" ? progress * 60 : 0);
  const arrowEndX = 160 + arrowLength; // start at body right side

  return (
    <div
      data-v2-directional-activation-commitment
      data-macro-phase={macroPhase}
      data-completed={completed ? "true" : "false"}
      data-pressing={pressing ? "true" : "false"}
      data-testid="directional-activation-commitment-primitive"
      role="region"
      aria-label="Activación direccional, visualiza tu próxima acción con energía y mantén"
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
        data-testid="directional-activation-commitment-phase-label"
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
        data-testid="directional-activation-commitment-primary-prompt"
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
          width: 320,
          height: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <canvas
          ref={particleCanvasRef}
          data-testid="directional-activation-commitment-particles"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: reduceMotion ? 0 : 0.18,
            transition: "opacity 200ms ease-out",
          }}
        />

        <svg
          data-testid="directional-activation-commitment-silhouette"
          aria-hidden="true"
          width="320"
          height="320"
          viewBox="0 0 320 340"
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
            <linearGradient id={arrowGradId} x1="0" y1="0.5" x2="1" y2="0.5">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.95" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </linearGradient>
            <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.45" />
              <stop offset="50%" stopColor={phaseColor} stopOpacity="0.15" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={cometGradId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.95" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="160" cy="170" rx="140" ry="160" fill={`url(#${vignetteId})`} />

          {/* Body silhouette — stylized flowing path (offset cx=160) */}
          <path
            d="M 160 36
               C 149 36, 140 46, 140 60
               C 140 70, 144 79, 150 84
               L 150 90
               C 140 92, 126 96, 122 108
               C 118 122, 116 138, 116 158
               L 116 196
               C 116 210, 118 222, 124 234
               L 128 248
               C 128 260, 130 270, 130 280
               L 130 308
               C 130 314, 134 318, 140 318
               L 148 318
               C 150 314, 152 308, 152 300
               L 152 250
               L 168 250
               L 168 300
               C 168 308, 170 314, 172 318
               L 180 318
               C 186 318, 190 314, 190 308
               L 190 280
               C 190 270, 192 260, 192 248
               L 196 234
               C 202 222, 204 210, 204 196
               L 204 158
               C 204 138, 202 122, 198 108
               C 194 96, 180 92, 170 90
               L 170 84
               C 176 79, 180 70, 180 60
               C 180 46, 171 36, 160 36 Z"
            fill="none"
            stroke={phaseColor}
            strokeWidth="0.9"
            opacity={completed ? 0.85 : (macroPhase === "B" ? 0.55 + progress * 0.30 : 0.45)}
            style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
          />

          {/* Vertical core column subtle */}
          <rect
            x="156" y="40" width="8" height="280"
            fill={phaseColor}
            opacity={completed ? 0.85 : (macroPhase === "B" ? 0.50 + progress * 0.35 : 0.40)}
            rx="4"
            style={{ transition: reduceMotion ? "none" : "opacity 400ms ease-out" }}
          />

          {/* Head halo */}
          <circle
            cx="160" cy="58" r="32"
            fill={`url(#${auraId})`}
            opacity={completed ? 0.95 : (macroPhase === "B" ? 0.55 + progress * 0.40 : 0.45)}
            filter={reduceMotion ? undefined : `url(#${haloId})`}
          />
          <circle cx="160" cy="58" r="20" fill="none" stroke={phaseColor} strokeWidth="1.2" opacity="0.85" />

          {/* Shoulder orbs */}
          {[
            { x: 126, y: 100 },
            { x: 194, y: 100 },
          ].map((pt, i) => (
            <g key={`sh-${i}`}>
              <circle
                cx={pt.x} cy={pt.y} r="14"
                fill={`url(#${auraId})`}
                opacity={completed ? 0.95 : (macroPhase === "B" ? 0.55 + progress * 0.40 : 0.45)}
                filter={reduceMotion ? undefined : `url(#${haloId})`}
              />
              <circle cx={pt.x} cy={pt.y} r="5" fill={phaseColor} opacity="0.95" />
            </g>
          ))}

          {/* Core orb */}
          <circle
            cx="160" cy="172" r="28"
            fill={`url(#${auraId})`}
            opacity={completed ? 0.95 : (macroPhase === "B" ? 0.55 + progress * 0.40 : 0.45)}
            filter={reduceMotion ? undefined : `url(#${haloId})`}
          />
          <circle cx="160" cy="172" r="14" fill="none" stroke={phaseColor} strokeWidth="1.5" opacity="0.85" />

          {/* Feet anchors */}
          {[
            { x1: 124, x2: 150 },
            { x1: 170, x2: 196 },
          ].map((seg, i) => (
            <g key={`ft-${i}`}>
              <ellipse
                cx={(seg.x1 + seg.x2) / 2} cy="320" rx="18" ry="3"
                fill={`url(#${auraId})`}
                opacity={completed ? 0.95 : (macroPhase === "B" ? 0.55 + progress * 0.40 : 0.45)}
                filter={reduceMotion ? undefined : `url(#${haloId})`}
              />
              <line
                x1={seg.x1} y1="320" x2={seg.x2} y2="320"
                stroke={phaseColor} strokeWidth="2.5" strokeLinecap="round"
                opacity="0.95"
              />
            </g>
          ))}

          {/* ═══ ENERGY BEAM PROJECTION ═══
              Tapered cone emanating from chest core (cx=160 cy=140) forward right.
              Multiple gradient layers + light points streaming along axis. */}
          {(() => {
            const beamOriginX = 188; // edge of chest orb
            const beamLength = arrowLength;
            const beamEndX = beamOriginX + beamLength;
            const beamStartHalfHeight = 4 + (macroPhase === "B" ? progress * 6 : 2);
            const beamEndHalfHeight = 14 + (macroPhase === "B" ? progress * 14 : 8);
            const intensity = completed ? 1 : (macroPhase === "B" ? 0.55 + progress * 0.45 : 0.30);

            return (
              <g style={{ transition: reduceMotion ? "none" : "all 220ms ease-out" }}>
                {/* Outer halo cone — wider, softer */}
                <path
                  d={`M ${beamOriginX} ${140 - beamStartHalfHeight - 3}
                      L ${beamEndX} ${140 - beamEndHalfHeight - 6}
                      L ${beamEndX + 6} 140
                      L ${beamEndX} ${140 + beamEndHalfHeight + 6}
                      L ${beamOriginX} ${140 + beamStartHalfHeight + 3} Z`}
                  fill={phaseColor}
                  opacity={intensity * 0.18}
                  filter={reduceMotion ? undefined : `url(#${haloId})`}
                />

                {/* Inner beam cone — primary */}
                <path
                  d={`M ${beamOriginX} ${140 - beamStartHalfHeight}
                      L ${beamEndX} ${140 - beamEndHalfHeight}
                      L ${beamEndX + 2} 140
                      L ${beamEndX} ${140 + beamEndHalfHeight}
                      L ${beamOriginX} ${140 + beamStartHalfHeight} Z`}
                  fill={`url(#${arrowGradId})`}
                  opacity={intensity * 0.72}
                />

                {/* 3 horizontal energy rays inside beam */}
                {[-0.55, 0, 0.55].map((yOff, i) => (
                  <line
                    key={`ray-${i}`}
                    x1={beamOriginX} y1={140 + yOff * beamStartHalfHeight}
                    x2={beamEndX - 4} y2={140 + yOff * beamEndHalfHeight}
                    stroke={phaseColor}
                    strokeWidth={i === 1 ? 2 : 1}
                    strokeLinecap="round"
                    opacity={i === 1 ? intensity * 0.95 : intensity * 0.55}
                  />
                ))}

                {/* Beam tip cluster — radial light source at endpoint */}
                <circle
                  cx={beamEndX + 2} cy="140"
                  r={6 + (macroPhase === "B" ? progress * 8 : 2)}
                  fill={`url(#${cometGradId})`}
                  opacity={intensity * 0.95}
                  filter={reduceMotion ? undefined : `url(#${haloId})`}
                />
                <circle
                  cx={beamEndX + 2} cy="140"
                  r="3"
                  fill={phaseColor}
                  opacity={intensity}
                />

                {/* Light points streaming along central axis (Phase B only) */}
                {macroPhase === "B" && Array.from({ length: COMET_COUNT }).map((_, i) => {
                  const offset = i / COMET_COUNT;
                  const t = (cometPhase + offset) % 1;
                  const cometX = beamOriginX + t * beamLength;
                  // Bell curve fade
                  const cometOpacity = (1 - Math.pow(Math.abs(t - 0.5) * 2, 2)) * (0.45 + progress * 0.35);
                  return (
                    <circle
                      key={`comet-${i}`}
                      cx={cometX} cy="140"
                      r={3.5 + (1 - t) * 2}
                      fill={phaseColor}
                      opacity={cometOpacity}
                      filter={reduceMotion ? undefined : `url(#${haloId})`}
                    />
                  );
                })}

                {/* Source glow — pulse halo at chest origin */}
                <circle
                  cx={beamOriginX - 4} cy="140"
                  r={10 + (macroPhase === "B" ? progress * 6 : 0)}
                  fill={`url(#${cometGradId})`}
                  opacity={intensity * 0.85}
                  filter={reduceMotion ? undefined : `url(#${haloId})`}
                />
              </g>
            );
          })()}
        </svg>

        {/* Hold-press button (Phase B only) — bottom of body */}
        {macroPhase === "B" && (
          <button
            type="button"
            data-testid="directional-activation-commitment-hold-button"
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

      {/* Body anchor */}
      <span
        data-testid="directional-activation-commitment-body-anchor"
        aria-live="polite"
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.01em",
          color: colors.text.secondary,
          opacity: 0.78,
          textAlign: "center",
          minHeight: 22,
          transition: reduceMotion ? "none" : "opacity 220ms ease-out",
        }}
      >
        {bodyAnchor}
      </span>
    </div>
  );
}
