"use client";
/* ═══════════════════════════════════════════════════════════════
   SteelCoreColumnCommitmentPrimitive — Phase 7 SP-J-3
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 3 "Cierre con Estructura" del
   protocolo #9 Steel Core Reset. Reemplaza shared hold_press_button
   con primitive específico de columna vertical estable + mantra
   verbal word-by-word emerging progressive durante hold-press.

   Lección palmas conflict aplicada preventively ⚠️:
   El catálogo decía "Mantén postura y palmas presionadas..." — MISMO
   conflict #4/#5/#7/#8. Aplicado fix: cue "palmas presionadas"
   REMOVIDO del UI. Body anchor primary mental ("Eje vertical · firme").

   Macro-phase A→B (8s + 37s):
     Phase A — Visualiza columna (0-8s):
       - Primary: "Visualízate como columna vertical estable"
       - Body anchor: "Eje vertical · Firme"
       - Body silhouette + core column lit, hold-press hidden.
     Phase B — Mantén + Mantra (8-45s):
       - Primary: "Mantén · Repite mentalmente"
       - Body anchor: "Soy una columna vertical estable"
       - Hold-press 6s ring progress.
       - VERBAL CONSTRUCTION: cada ~1s agrega una palabra del mantra
         (Soy → Soy una → Soy una columna → ... → Soy una columna
         vertical estable) — visual literal de "construir" la
         estructura verbal sync con motor.
       - Final state: mantra completo + lock animation + release
         message "Eje. Vertical. Estable."

   Identity #9 = "Steel Core Reset" — núcleo de acero estable.
   Phase 3 cierra el ciclo bloqueando structural commitment via
   motor + verbal + visual columna persists from Phase 2.

   Multi-exercise tracks layered (8):
     1. BODY silhouette stylized (continuidad SP-J-2 Phase 2).
     2. VERTICAL core column gradient FULL (núcleo de acero locked).
     3. HOLD-PRESS button con ring progress 6s.
     4. VERBAL mantra word-by-word emerge per second.
     5. PRIMARY prompt cambia per macro-phase.
     6. BODY anchor evolutivo.
     7. RELEASE message "Eje. Vertical. Estable." peak.
     8. PHASE label "Cierre con Estructura" cyan-warm.

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - Mantra MENTAL silencioso (no vocal) — sin volumen.
     - SIN body anchor manos extras (lección persistente palmas).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const PHASE_LABEL = "Cierre con Estructura";
const PHASE_A_PROMPT = "Visualízate como columna vertical estable";
const PHASE_B_PROMPT = "Mantén · Repite mentalmente";
const PHASE_A_BODY_ANCHOR = "Eje vertical · Firme";
const RELEASE_DEFAULT = "Eje. Vertical. Estable.";

const PHASE_A_END_MS = 8000;
const HOLD_SIZE = 110;
const HOLD_RADIUS = 50;

// Mantra words — emerge progressive per ~1s of hold
const MANTRA_WORDS = ["Soy", "una", "columna", "vertical", "estable"];

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
export default function SteelCoreColumnCommitmentPrimitive({
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
  const phaseColor = getCyanForPhase(2); // cyan-warm #06B6D4 phase3
  const uid = useId();
  const haloId = `sccBlur-${uid}`;
  const vignetteId = `sccVignette-${uid}`;
  const coreId = `sccCore-${uid}`;
  const auraId = `sccAura-${uid}`;

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
  const [wordsRevealed, setWordsRevealed] = useState(0);
  const startRef = useRef(0);
  const rafRef = useRef(null);
  const lastWordRef = useRef(0);

  const stopAnim = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  useEffect(() => () => stopAnim(), []);

  const tick = () => {
    const elapsed = Date.now() - startRef.current;
    const pct = Math.min(1, elapsed / min_hold_ms);
    setProgress(pct);

    // Verbal construction: each step reveals one more word
    const targetWords = Math.min(MANTRA_WORDS.length, Math.floor(pct * MANTRA_WORDS.length) + 1);
    if (targetWords !== lastWordRef.current) {
      lastWordRef.current = targetWords;
      setWordsRevealed(targetWords);
      if (hapticEnabled && targetWords > 0) {
        try { hap("tap"); } catch {}
      }
    }

    if (pct >= 1) {
      stopAnim();
      setCompleted(true);
      setPressing(false);
      setWordsRevealed(MANTRA_WORDS.length);
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
    lastWordRef.current = 0;
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
      setWordsRevealed(0);
      lastWordRef.current = 0;
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
  const bodyAnchor = macroPhase === "A"
    ? PHASE_A_BODY_ANCHOR
    : (wordsRevealed > 0 ? MANTRA_WORDS.slice(0, wordsRevealed).join(" ") + (wordsRevealed === MANTRA_WORDS.length ? "." : "...") : "Soy una columna vertical estable");

  return (
    <div
      data-v2-steel-core-column-commitment
      data-macro-phase={macroPhase}
      data-completed={completed ? "true" : "false"}
      data-pressing={pressing ? "true" : "false"}
      data-words-revealed={wordsRevealed}
      data-testid="steel-core-column-commitment-primitive"
      role="region"
      aria-label="Cierre con estructura, columna vertical estable mantén y repite mentalmente"
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
        data-testid="steel-core-column-commitment-phase-label"
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
        data-testid="steel-core-column-commitment-primary-prompt"
        aria-live="polite"
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: 17,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.02em",
          color: colors.text.strong,
          lineHeight: 1.3,
          textAlign: "center",
          maxWidth: 320,
          paddingInline: spacing.s16,
          transition: reduceMotion ? "none" : "opacity 220ms ease-out",
        }}
      >
        {primaryPrompt}
      </p>

      <div
        style={{
          position: "relative",
          width: 280,
          height: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <canvas
          ref={particleCanvasRef}
          data-testid="steel-core-column-commitment-particles"
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

        {/* Body silhouette continuation — same flowing path Phase 2, ALL parts lit */}
        <svg
          data-testid="steel-core-column-commitment-silhouette"
          aria-hidden="true"
          width="220"
          height="300"
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
            <linearGradient id={coreId} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={phaseColor} stopOpacity={completed ? "0.9" : "0.65"} />
              <stop offset="100%" stopColor={phaseColor} stopOpacity={completed ? "0.95" : "0.7"} />
            </linearGradient>
            <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.45" />
              <stop offset="50%" stopColor={phaseColor} stopOpacity="0.15" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="120" cy="170" rx="110" ry="160" fill={`url(#${vignetteId})`} />

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
            opacity="0.55"
          />

          {/* Vertical core column FULL — locked from Phase 2, extends to feet floor */}
          <rect
            x="116" y="40" width="8" height="280"
            fill={`url(#${coreId})`}
            rx="4"
            opacity="0.95"
          />
          <rect
            x="113" y="40" width="14" height="280"
            fill="none"
            stroke={phaseColor}
            strokeWidth="0.5"
            opacity={completed ? 0.65 : 0.40}
            rx="6"
            style={{ transition: reduceMotion ? "none" : "opacity 400ms ease-out" }}
          />

          {/* Head with halo */}
          <circle
            cx="120" cy="58" r="32"
            fill={`url(#${auraId})`}
            opacity={completed ? 0.95 : 0.65}
            filter={reduceMotion ? undefined : `url(#${haloId})`}
            style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
          />
          <circle
            cx="120" cy="58" r="20"
            fill={phaseColor}
            opacity="0.18"
          />
          <circle
            cx="120" cy="58" r="20"
            fill="none"
            stroke={phaseColor}
            strokeWidth="1.2"
            opacity="0.85"
          />

          {/* Shoulder orbs */}
          {[
            { x: 86, y: 100 },
            { x: 154, y: 100 },
          ].map((pt, i) => (
            <g key={`sh-${i}`}>
              <circle
                cx={pt.x} cy={pt.y} r="14"
                fill={`url(#${auraId})`}
                opacity={completed ? 0.95 : 0.7}
                filter={reduceMotion ? undefined : `url(#${haloId})`}
              />
              <circle cx={pt.x} cy={pt.y} r="5" fill={phaseColor} opacity="0.95" />
            </g>
          ))}

          {/* Core orb */}
          <circle
            cx="120" cy="172" r="28"
            fill={`url(#${auraId})`}
            opacity={completed ? 0.95 : 0.75}
            filter={reduceMotion ? undefined : `url(#${haloId})`}
            style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
          />
          <circle cx="120" cy="172" r="14" fill="none" stroke={phaseColor} strokeWidth="1.5" opacity="0.85" />

          {/* Feet anchors */}
          {[
            { x1: 84, x2: 110 },
            { x1: 130, x2: 156 },
          ].map((seg, i) => (
            <g key={`ft-${i}`}>
              <ellipse
                cx={(seg.x1 + seg.x2) / 2} cy="320" rx="18" ry="3"
                fill={`url(#${auraId})`}
                opacity={completed ? 0.95 : 0.7}
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

        {/* Hold-press button (Phase B only) — bottom of body */}
        {macroPhase === "B" && (
          <button
            type="button"
            data-testid="steel-core-column-commitment-hold-button"
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

      {/* Body anchor / Mantra — emerges word-by-word during hold */}
      <span
        data-testid="steel-core-column-commitment-body-anchor"
        aria-live="polite"
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: macroPhase === "B" && wordsRevealed > 0 ? typography.weight.medium : typography.weight.light,
          letterSpacing: "-0.01em",
          color: macroPhase === "B" && wordsRevealed > 0 ? phaseColor : colors.text.secondary,
          opacity: macroPhase === "A"
            ? 0.78
            : (wordsRevealed === 0 ? 0.40 : 0.95),
          textAlign: "center",
          minHeight: 26,
          maxWidth: 300,
          transition: reduceMotion ? "none" : "opacity 220ms ease-out, color 220ms ease-out",
        }}
      >
        {bodyAnchor}
      </span>
    </div>
  );
}
