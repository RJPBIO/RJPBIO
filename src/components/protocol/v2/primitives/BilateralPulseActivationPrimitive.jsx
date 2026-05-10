"use client";
/* ═══════════════════════════════════════════════════════════════
   BilateralPulseActivationPrimitive — Phase 7 SP-E-1 (clarified)
   ───────────────────────────────────────────────────────────────
   Visual primitive dedicated para Activación Bilateral — Phase 1
   "Activación Bilateral" del protocolo #4 Pulse Shift.

   Self-contained custom bilateral logic con visuals claros:
     - Big L/R pads con letras prominentes + glow cyan cuando active.
     - Pacer arrow central ←→ indica next tap direction.
     - Instrucción prompt prominente arriba.
     - Counter + progress bar visibles.
     - Body anchor sustained.

   NOTA: NO embed BilateralTapTargets shared — escrito desde cero
   para máxima claridad visual y feedback tap-by-tap directo.
   El shared primitive sigue válido para otros protocolos.

   Pattern bilateral motor (60bpm alternating L-R, 30 taps target):
     - Tap alternado L/R activa coordinación interhemisférica
       (Shapiro 1989 EMDR · van der Kolk 2014).
     - 60bpm = 1Hz pacer = ritmo cardíaco resting natural.
     - 30 taps = ~30s sustained motor activation.

   Multi-exercise tracks layered (5):
     1. PRIMARY motor: bilateral L/R pads tap alternado.
     2. VISUAL PACER: arrow central ←→ + ring pulse 60bpm rhythm guide.
     3. SOMÁTICO: "Postura erguida" sustained body anchor.
     4. VISUAL CONTINUITY: particles ambient + progress bar.
     5. PHASE label "Activación Bilateral".

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - L/R pads adyacentes — pulgar mano celular alterna entre dos.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const PHASE_LABEL = "Activación Bilateral";
const INSTRUCTION = "Tap alternado · Sigue el cyan";
const BODY_ANCHOR_CUE = "Postura erguida";

const DEFAULT_BPM = 60;
const DEFAULT_TARGET_TAPS = 30;
const PAD_SIZE = 140;

/**
 * @param {object} props
 * @param {string} [props.pattern="alternate"]
 * @param {number} [props.bpm=60]
 * @param {number} [props.target_taps=30]
 * @param {boolean} [props.haptic_enabled=true]
 * @param {(side:string)=>void} [props.onTap]
 * @param {()=>void} [props.onComplete]
 */
export default function BilateralPulseActivationPrimitive({
  pattern = "alternate",
  bpm = DEFAULT_BPM,
  target_taps = DEFAULT_TARGET_TAPS,
  haptic_enabled = true,
  onTap,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const phaseColor = getCyanForPhase(0); // cyan-deep #0E7490

  const onTapRef = useRef(onTap);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onTapRef.current = onTap; }, [onTap]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // ─── Active side (auto-rotates per BPM in alternate pattern) ──────
  const [activeSide, setActiveSide] = useState("L");
  useEffect(() => {
    if (pattern !== "alternate") return undefined;
    if (reduceMotion) return undefined;
    const intervalMs = Math.max(150, 60000 / bpm);
    let side = "L";
    setActiveSide(side);
    const id = setInterval(() => {
      side = side === "L" ? "R" : "L";
      setActiveSide(side);
    }, intervalMs);
    return () => clearInterval(id);
  }, [pattern, bpm, reduceMotion]);

  // ─── Tap state + counter ──────────────────────────────────────────
  const [tapCount, setTapCount] = useState(0);
  const [lastTappedSide, setLastTappedSide] = useState(null);
  const completedRef = useRef(false);

  function handleTap(side) {
    if (completedRef.current) return;
    setLastTappedSide(side);
    setTapCount((prev) => {
      const next = prev + 1;
      try {
        if (typeof onTapRef.current === "function") onTapRef.current(side);
      } catch { /* noop */ }
      if (haptic_enabled) {
        try { hap("tap"); } catch { /* noop */ }
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(35);
      }
      if (next >= target_taps && !completedRef.current) {
        completedRef.current = true;
        try { hapticSignature("checkpoint"); } catch { /* noop */ }
        try {
          if (typeof onCompleteRef.current === "function") onCompleteRef.current();
        } catch { /* noop */ }
      }
      return next;
    });
    // Clear lastTappedSide after brief pulse animation.
    setTimeout(() => setLastTappedSide((curr) => (curr === side ? null : curr)), 180);
  }

  // ─── Track 4: particle field ambient continuity ───────────────────
  const particleCanvasRef = useRef(null);
  const particleSysRef = useRef(null);
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return undefined;
    canvas.width = 320;
    canvas.height = 60;
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

  const progressPct = Math.min(100, Math.round((tapCount / target_taps) * 100));

  // Pad render.
  const Pad = ({ side, letter }) => {
    const isActive = activeSide === side;
    const justTapped = lastTappedSide === side;
    const fillBg = isActive
      ? "rgba(14,116,144,0.22)"
      : justTapped
        ? "rgba(14,116,144,0.10)"
        : "rgba(255,255,255,0.03)";
    const borderColor = isActive ? phaseColor : colors.separator;
    const letterColor = isActive ? phaseColor : colors.text.secondary;
    const transformScale = justTapped ? "scale(0.95)" : isActive ? "scale(1.04)" : "scale(1.0)";
    const glow = isActive
      ? `0 0 24px rgba(14,116,144,0.55), inset 0 0 12px rgba(14,116,144,0.18)`
      : "none";
    return (
      <button
        type="button"
        onPointerDown={() => handleTap(side)}
        aria-label={`Tap ${side === "L" ? "izquierda" : "derecha"}`}
        data-active={isActive ? "true" : "false"}
        data-just-tapped={justTapped ? "true" : "false"}
        data-testid={`bilateral-pulse-pad-${side}`}
        style={{
          appearance: "none",
          width: PAD_SIZE,
          height: PAD_SIZE,
          borderRadius: "50%",
          background: fillBg,
          border: `1px solid ${borderColor}`,
          boxShadow: glow,
          color: letterColor,
          fontFamily: typography.family,
          fontWeight: typography.weight.light,
          fontSize: 56,
          letterSpacing: "-0.04em",
          cursor: "pointer",
          touchAction: "manipulation",
          transition: reduceMotion
            ? "none"
            : "background 80ms linear, border-color 80ms linear, box-shadow 120ms linear, transform 80ms linear",
          transform: transformScale,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {letter}
      </button>
    );
  };

  return (
    <div
      data-v2-bilateral-pulse-activation
      data-tap-count={tapCount}
      data-active-side={activeSide}
      data-testid="bilateral-pulse-activation-primitive"
      role="region"
      aria-label="Activación Bilateral, tap alternado izquierda-derecha 60bpm"
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
        data-testid="bilateral-pulse-activation-phase-label"
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

      {/* Instruction prominent */}
      <p
        data-testid="bilateral-pulse-activation-instruction"
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
        }}
      >
        {INSTRUCTION}
      </p>

      {/* Direction pacer arrow + ring (between pads, above visual stack) */}
      <div
        data-testid="bilateral-pulse-activation-pacer-row"
        aria-hidden="true"
        style={{
          width: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.s12,
          minHeight: 28,
        }}
      >
        <span
          data-testid="bilateral-pulse-activation-arrow"
          style={{
            fontFamily: typography.familyMono,
            fontSize: 22,
            fontWeight: typography.weight.light,
            color: phaseColor,
            opacity: activeSide === "L" ? 0.95 : 0.25,
            transition: reduceMotion ? "none" : "opacity 120ms ease-out",
            minWidth: 24,
            textAlign: "center",
          }}
        >
          ←
        </span>
        <span
          style={{
            fontFamily: typography.family,
            fontSize: 11,
            fontWeight: typography.weight.medium,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: colors.text.muted,
            opacity: 0.65,
          }}
        >
          {bpm} bpm
        </span>
        <span
          data-testid="bilateral-pulse-activation-arrow-right"
          style={{
            fontFamily: typography.familyMono,
            fontSize: 22,
            fontWeight: typography.weight.light,
            color: phaseColor,
            opacity: activeSide === "R" ? 0.95 : 0.25,
            transition: reduceMotion ? "none" : "opacity 120ms ease-out",
            minWidth: 24,
            textAlign: "center",
          }}
        >
          →
        </span>
      </div>

      {/* Big L/R pads */}
      <div
        data-testid="bilateral-pulse-activation-pads"
        style={{
          display: "flex",
          gap: spacing.s24,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Pad side="L" letter="L" />
        <Pad side="R" letter="R" />
      </div>

      {/* Particles ambient continuity */}
      <canvas
        ref={particleCanvasRef}
        data-testid="bilateral-pulse-activation-particles"
        aria-hidden="true"
        style={{
          width: 320,
          height: 60,
          opacity: reduceMotion ? 0 : 0.32,
          transition: "opacity 200ms ease-out",
        }}
      />

      {/* Counter prominent */}
      <span
        data-testid="bilateral-pulse-activation-counter"
        aria-label={`${Math.min(tapCount, target_taps)} de ${target_taps} taps`}
        style={{
          fontFamily: typography.familyMono,
          fontSize: 14,
          letterSpacing: "0.06em",
          color: phaseColor,
          opacity: 0.85,
        }}
      >
        {Math.min(tapCount, target_taps)} / {target_taps} taps
      </span>

      {/* Progress bar */}
      <div
        data-testid="bilateral-pulse-activation-progress"
        aria-hidden="true"
        style={{
          width: 240,
          height: 2,
          background: colors.separator,
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progressPct}%`,
            height: "100%",
            background: phaseColor,
            transition: reduceMotion ? "none" : "width 160ms ease-out",
          }}
        />
      </div>

      {/* Body anchor sustained */}
      <span
        data-testid="bilateral-pulse-activation-body-anchor"
        aria-live="polite"
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.01em",
          color: colors.text.secondary,
          opacity: 0.75,
          textAlign: "center",
        }}
      >
        {BODY_ANCHOR_CUE}
      </span>
    </div>
  );
}
