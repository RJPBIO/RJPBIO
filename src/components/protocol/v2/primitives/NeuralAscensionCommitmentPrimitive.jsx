"use client";
/* ═══════════════════════════════════════════════════════════════
   NeuralAscensionCommitmentPrimitive — Phase 7 SP-M-4
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 4 "Commitment Motor" del protocolo
   #12 Neural Ascension. ÚLTIMA Phase Tier 2. Visual signature:
   body silhouette + 3 verbalización checkmarks que se iluminan
   secuencial durante hold + ascension beam rising per repetition
   + mantra "Esta es la decisión." × 3.

   Lección palmas conflict aplicada preventively (6ª vez consecutiva)
   ⚠️: catálogo decía "presiona las palmas contra los muslos" —
   removido. Body anchor mental.

   Macro-phase A→B (8s + 17s):
     Phase A — Visualiza decisión (0-8s):
       - Primary: "Visualiza la decisión que identificaste"
       - Body anchor: "Tu única decisión clara"
       - Body silhouette dim + 3 checkmarks empty
       - Hold button hidden.
     Phase B — Mantén · Mantra × 3 (8-25s):
       - Primary: "Mantén · Repite mentalmente"
       - Body anchor: "Esta es la decisión." (× 3 visualmente)
       - Hold-press 6s ring progress.
       - 3 checkmarks light up at 33%, 66%, 100% progress.
       - Ascension beam rises per repetition.
       - On complete: 3 ✓ peak + body silhouette glow peak.

   Differentiation vs other Phase 3/4 commitment primitives:
     - #7 cognitive_reset: orb + centrifugal particles
     - #8 lock_in: 60-min badge + 12 arcs
     - #9 steel_core_column: vertical axis + mantra word-by-word
     - #10 directional_activation: forward beam + comets
     - #11 grounding_anchor: roots descendiendo + horizon
     - #12 (este): 3 verbalization CHECKMARKS + ascension beam (× 3)

   Multi-exercise tracks layered (8):
     1. BODY silhouette + vertical core column.
     2. 3 VERBALIZATION checkmarks (✓) light up secuencial.
     3. ASCENSION beam rising per repetition (echo Phase 1 vertical).
     4. HOLD-PRESS button con ring progress 6s.
     5. PRIMARY prompt cambia per macro-phase (aria-live).
     6. BODY anchor evolutivo + mantra emerge bright peak.
     7. RELEASE message "Esta es la decisión." peak.
     8. PHASE label "Commitment Motor" cyan-warm.

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - Mantra mental silencioso × 3.
     - SIN body anchor manos extras (lección palmas 6ª vez).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const PHASE_LABEL = "Commitment Motor";
const PHASE_A_PROMPT = "Visualiza la decisión que identificaste";
const PHASE_B_PROMPT = "Mantén · Repite mentalmente";
const PHASE_A_BODY_ANCHOR = "Tu única decisión clara";
const PHASE_B_BODY_ANCHOR = "Esta es la decisión.";
const RELEASE_DEFAULT = "Esta es la decisión.";

const PHASE_A_END_MS = 8000;
const HOLD_SIZE = 110;
const HOLD_RADIUS = 50;

const REPETITION_COUNT = 3;

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
export default function NeuralAscensionCommitmentPrimitive({
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
  const phaseColor = getCyanForPhase(2); // cyan-warm phase3/4 #06B6D4
  const uid = useId();
  const haloId = `nacBlur-${uid}`;
  const vignetteId = `nacVignette-${uid}`;
  const auraId = `nacAura-${uid}`;
  const beamGradId = `nacBeamGrad-${uid}`;

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
  const [repetitionsLit, setRepetitionsLit] = useState(0);
  const startRef = useRef(0);
  const rafRef = useRef(null);
  const lastRepRef = useRef(0);

  const stopAnim = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  useEffect(() => () => stopAnim(), []);

  const tick = () => {
    const elapsed = Date.now() - startRef.current;
    const pct = Math.min(1, elapsed / min_hold_ms);
    setProgress(pct);

    // Repetitions light up at 33%, 66%, 100%
    const newRepsLit = Math.min(REPETITION_COUNT, Math.floor(pct * REPETITION_COUNT) + (pct >= 1 ? 0 : (pct - Math.floor(pct * REPETITION_COUNT) / REPETITION_COUNT) > 0 ? 0 : 0));
    const repsBasedOnProgress = Math.min(REPETITION_COUNT, Math.floor(pct * REPETITION_COUNT * 1.0));
    if (repsBasedOnProgress !== lastRepRef.current && repsBasedOnProgress > 0) {
      lastRepRef.current = repsBasedOnProgress;
      setRepetitionsLit(repsBasedOnProgress);
      if (hapticEnabled) {
        try { hap("tap"); } catch {}
      }
    }

    if (pct >= 1) {
      stopAnim();
      setCompleted(true);
      setPressing(false);
      setRepetitionsLit(REPETITION_COUNT);
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
    lastRepRef.current = 0;
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
      setRepetitionsLit(0);
      lastRepRef.current = 0;
      try {
        if (typeof onCancelRef.current === "function") onCancelRef.current();
      } catch {}
    }
  };

  // Particles
  const particleCanvasRef = useRef(null);
  const particleSysRef = useRef(null);
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return undefined;
    canvas.width = 280;
    canvas.height = 360;
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

  // Ascension beam top y — rises higher with each repetition lit
  // Phase A: at chest (140), Phase B: rises per rep (140 → 100 → 60)
  const beamTopY = macroPhase === "B"
    ? 140 - (repetitionsLit / REPETITION_COUNT) * 80
    : 200;

  return (
    <div
      data-v2-neural-ascension-commitment
      data-macro-phase={macroPhase}
      data-completed={completed ? "true" : "false"}
      data-pressing={pressing ? "true" : "false"}
      data-repetitions-lit={repetitionsLit}
      data-testid="neural-ascension-commitment-primitive"
      role="region"
      aria-label="Commitment motor, mantén y repite mentalmente esta es la decisión tres veces"
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
        data-testid="neural-ascension-commitment-phase-label"
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
        data-testid="neural-ascension-commitment-primary-prompt"
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

      {/* 3 Verbalization checkmarks — visible always, light up sequencial during hold */}
      <div
        data-testid="neural-ascension-commitment-checkmarks"
        aria-hidden="true"
        style={{
          display: "flex",
          gap: spacing.s12,
          alignItems: "center",
          minHeight: 24,
        }}
      >
        {Array.from({ length: REPETITION_COUNT }).map((_, i) => {
          const lit = i < repetitionsLit;
          return (
            <div
              key={`rep-${i}`}
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: lit ? phaseColor : "rgba(255,255,255,0.04)",
                border: `1px solid ${lit ? phaseColor : colors.separator}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: lit ? 0.95 : 0.45,
                transition: reduceMotion ? "none" : "all 320ms ease-out",
                boxShadow: lit ? `0 0 12px rgba(6,182,212,0.55)` : "none",
              }}
            >
              {lit && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M 2 6 L 5 9 L 10 3" stroke="rgba(0,0,0,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "relative",
          width: 280,
          height: 360,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <canvas
          ref={particleCanvasRef}
          data-testid="neural-ascension-commitment-particles"
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
          data-testid="neural-ascension-commitment-silhouette"
          aria-hidden="true"
          width="240"
          height="340"
          viewBox="0 0 240 340"
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
            <linearGradient id={beamGradId} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.95" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0.55" />
            </linearGradient>
          </defs>

          <ellipse cx="120" cy="170" rx="110" ry="160" fill={`url(#${vignetteId})`} />

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
            opacity={completed ? 0.85 : (macroPhase === "B" ? 0.50 + progress * 0.35 : 0.45)}
            style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
          />

          {/* ASCENSION beam — rises from belly per repetition lit */}
          <rect
            x="116" y={beamTopY} width="8" height={280 - (beamTopY - 40)}
            fill={`url(#${beamGradId})`}
            rx="4"
            opacity={completed ? 0.95 : (macroPhase === "B" ? 0.55 + progress * 0.40 : 0.40)}
            style={{ transition: reduceMotion ? "none" : "y 600ms cubic-bezier(0.22,1,0.36,1), height 600ms cubic-bezier(0.22,1,0.36,1), opacity 400ms ease-out" }}
          />

          {/* Beam top glow (wavefront — moves up per rep) */}
          <circle
            cx="120" cy={beamTopY}
            r={macroPhase === "B" ? 6 + progress * 6 : 4}
            fill={phaseColor}
            opacity={macroPhase === "B" ? 0.65 + progress * 0.30 : 0.40}
            filter={reduceMotion ? undefined : `url(#${haloId})`}
            style={{ transition: reduceMotion ? "none" : "all 600ms cubic-bezier(0.22,1,0.36,1)" }}
          />

          {/* Body anchor halos (head/shoulders/feet) */}
          <circle
            cx="120" cy="58" r="32"
            fill={`url(#${auraId})`}
            opacity={completed ? 0.95 : (macroPhase === "B" ? 0.45 + progress * 0.45 : 0.35)}
            filter={reduceMotion ? undefined : `url(#${haloId})`}
          />
          <circle cx="120" cy="58" r="20" fill="none" stroke={phaseColor} strokeWidth="1.2" opacity="0.85" />

          {[{ x: 86, y: 100 }, { x: 154, y: 100 }].map((pt, i) => (
            <g key={`sh-${i}`}>
              <circle
                cx={pt.x} cy={pt.y} r="14"
                fill={`url(#${auraId})`}
                opacity={completed ? 0.85 : (macroPhase === "B" ? 0.45 + progress * 0.40 : 0.35)}
                filter={reduceMotion ? undefined : `url(#${haloId})`}
              />
              <circle cx={pt.x} cy={pt.y} r="5" fill={phaseColor} opacity="0.95" />
            </g>
          ))}

          {/* Feet anchors */}
          {[{ x1: 84, x2: 110 }, { x1: 130, x2: 156 }].map((seg, i) => (
            <g key={`ft-${i}`}>
              <ellipse
                cx={(seg.x1 + seg.x2) / 2} cy="320" rx="18" ry="3"
                fill={`url(#${auraId})`}
                opacity={completed ? 0.85 : (macroPhase === "B" ? 0.40 + progress * 0.35 : 0.30)}
                filter={reduceMotion ? undefined : `url(#${haloId})`}
              />
              <line
                x1={seg.x1} y1="320" x2={seg.x2} y2="320"
                stroke={phaseColor} strokeWidth="2.5" strokeLinecap="round"
                opacity="0.95"
              />
            </g>
          ))}
        </svg>

        {/* Hold-press button (Phase B only) */}
        {macroPhase === "B" && (
          <button
            type="button"
            data-testid="neural-ascension-commitment-hold-button"
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
        data-testid="neural-ascension-commitment-body-anchor"
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
