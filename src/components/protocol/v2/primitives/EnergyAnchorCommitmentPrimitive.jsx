"use client";
/* ═══════════════════════════════════════════════════════════════
   EnergyAnchorCommitmentPrimitive — Phase 7 SP-E-3
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 3 "Anclaje Energético" del
   protocolo #4 Pulse Shift. Reemplaza shared hold_press_button
   con primitive multi-exercise wrapper energy-driven (postura
   erguida activa + visualización siguiente bloque + palmas
   presionadas + hold-press commitment seal).

   Diferenciación vs Tier 1A Phase 3 commitment primitives:
     - #1 CommitmentMotor: cierra puño libre + viz acción simple.
     - #2 VisualizationCommitment: bilateral saccades + humming.
     - #3 ExecutiveCommitment: triple-seal + 60-min ultradian anchor.
     - #4 EnergyAnchorCommitment: postura erguida ACTIVA + viz
       siguiente bloque + palmas presionadas seal — energy-driven
       commitment (vs parasympathetic/cognitive de los anteriores).

   Macro-phase A→B (5s + 25s):
     Phase A — Postura + Preparación (0-5s):
       - Instrucción prep: "Hombros atrás · Mirada al frente"
       - Body anchor sustained "Postura erguida activa"
       - Hold-press button hidden (no presionable)
       - Viz prompt fade-in
     Phase B — Visualización + Hold (5-30s):
       - Hold-press activable (6s)
       - Body anchor sustained
       - Visualiza prompt prominent
       - Palmas press cue secundario

   Multi-exercise tracks layered (6):
     1. POSTURA físico activa: "Hombros atrás · Mirada al frente"
        sustained — power pose preparation (Carney Cuddy Yap 2010
        cognitive priming validated).
     2. MOTOR primary: hold-press button 6s con ring progress
        (anti-trampa pattern, pulgar mano celular).
     3. MENTAL anchor: "Visualiza siguiente bloque · con energía"
        prompt prominente (verbalización mental anchor).
     4. VISUAL continuity: orb continuation Phase 1+2 carry-over.
     5. VISUAL particles: centrifugal projection — commitment
        proyecta hacia próximo bloque.
     6. PHASE label "Anclaje Energético" cyan-warm.

   NOTA: el cue "palmas presionadas" del catálogo se removió del UI
   por conflicto físico con el hold-press (no puedes presionar palmas
   juntas mientras pulgar sostiene botón). El catálogo se preservó
   pero el primitive prioriza UX coherent. La postura erguida +
   hold-press + viz cubren el commitment seal sin conflicto.

   Functional human logic:
     - Phase A: postura activates body (5s setup) + lee instrucción.
     - Phase B: hold-press pulgar (motor) + visualiza energía
       siguiente bloque (mental) + postura erguida sustained (somatic).
     - Postura erguida sostenida throughout: ENERGY-driven (no
       parasympathetic relaxation).

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - Postura erguida sustained passive (sin esfuerzo continuo).
     - Hold-press pulgar; otra mano puede presionar palma libre.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const PHASE_LABEL = "Anclaje Energético";
const VIZ_PROMPT = "Visualiza tu siguiente bloque con energía.";
const POSTURA_ANCHOR = "Postura erguida activa";
const POSTURA_INSTRUCTION = "Hombros atrás · Mirada al frente";
// NOTA: el cue "palmas presionadas" del catálogo entra en conflicto
// con el hold-press (pulgar mano celular). Removido del UI. La postura
// erguida + hold-press + viz cubren el commitment seal sin conflicto.

const PHASE_A_END_MS = 5000;
const HOLD_SIZE = 130;
const HOLD_RADIUS = 60;

/**
 * @param {object} props
 * @param {string} [props.label="MANTÉN"]
 * @param {number} [props.min_hold_ms=6000]
 * @param {string} [props.release_message="Listo para el siguiente bloque."]
 * @param {boolean} [props.audioEnabled=true]
 * @param {boolean} [props.hapticEnabled=true]
 * @param {boolean} [props.voiceEnabled=false]
 * @param {(s:object)=>void} [props.onSignal]
 * @param {()=>void} [props.onComplete]
 */
export default function EnergyAnchorCommitmentPrimitive({
  label = "MANTÉN",
  min_hold_ms = 6000,
  release_message = "Listo para el siguiente bloque.",
  audioEnabled = true,  
  hapticEnabled = true,
  voiceEnabled = false,  
  onSignal,
  onComplete,
  onCancel,
}) {
  const reduceMotion = useReducedMotion();
  const phaseColor = getCyanForPhase(2); // cyan-warm #06B6D4 phase3

  const onSignalRef = useRef(onSignal);
  const onCompleteRef = useRef(onComplete);
  const onCancelRef = useRef(onCancel);
  useEffect(() => { onSignalRef.current = onSignal; }, [onSignal]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onCancelRef.current = onCancel; }, [onCancel]);

  // ─── Macro-phase state (A: prep / B: hold) ─────────────────────────
  const [macroPhase, setMacroPhase] = useState("A");
  useEffect(() => {
    if (reduceMotion) {
      const t = setTimeout(() => setMacroPhase("B"), 800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setMacroPhase("B"), PHASE_A_END_MS);
    return () => clearTimeout(t);
  }, [reduceMotion]);

  // ─── Hold-press state (anti-trampa pattern) ────────────────────────
  const [pressing, setPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showRelease, setShowRelease] = useState(false);
  const startRef = useRef(0);
  const rafRef = useRef(null);
  const tickRef = useRef(null);

  const stopAnim = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    rafRef.current = null;
    tickRef.current = null;
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
        try { hapticSignature("award"); } catch { /* noop */ }
      }
      setShowRelease(true);
      try {
        if (typeof onSignalRef.current === "function") {
          onSignalRef.current({ holdMs: min_hold_ms });
        }
      } catch { /* noop */ }
      setTimeout(() => {
        try {
          if (typeof onCompleteRef.current === "function") onCompleteRef.current();
        } catch { /* noop */ }
      }, 1400);
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
    if (hapticEnabled) {
      tickRef.current = setInterval(() => {
        try { hap("tap"); } catch { /* noop */ }
      }, 200);
    }
  };

  const cancelPress = () => {
    if (completed || !pressing) return;
    const elapsed = Date.now() - startRef.current;
    stopAnim();
    setPressing(false);
    if (elapsed < min_hold_ms) {
      if (hapticEnabled) {
        try { hap("error"); } catch { /* noop */ }
      }
      setProgress(0);
      try {
        if (typeof onCancelRef.current === "function") onCancelRef.current();
      } catch { /* noop */ }
    }
  };

  // ─── Multi-task overlays ───────────────────────────────────────────

  // Track 5: orb continuation (Phase 1+2 carry-over).
  const orbRef = useRef(null);
  useEffect(() => {
    if (reduceMotion) return undefined;
    let stopped = false;
    const start = performance.now();
    let raf;
    const tickOrb = (now) => {
      if (stopped) return;
      const t = ((now - start) / 1000) % 5;
      const scale = 1.0 + Math.sin((t / 5) * Math.PI * 2) * 0.06;
      const orb = orbRef.current;
      if (orb) orb.style.transform = `scale(${scale.toFixed(4)})`;
      raf = requestAnimationFrame(tickOrb);
    };
    raf = requestAnimationFrame(tickOrb);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [reduceMotion]);

  // Track 6: particles centrifugal projection.
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
        particleSysRef.current.setPhase("exhale", 0.6);
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

  const circumference = 2 * Math.PI * HOLD_RADIUS;
  const dashOffset = circumference * (1 - progress);

  // Phase A instruction vs Phase B viz prompt.
  const primaryPrompt = macroPhase === "A" ? POSTURA_INSTRUCTION : VIZ_PROMPT;

  return (
    <div
      data-v2-energy-anchor-commitment
      data-macro-phase={macroPhase}
      data-completed={completed ? "true" : "false"}
      data-pressing={pressing ? "true" : "false"}
      data-testid="energy-anchor-commitment-primitive"
      role="region"
      aria-label="Anclaje Energético, postura erguida + visualiza siguiente bloque"
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
        data-testid="energy-anchor-commitment-phase-label"
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

      {/* Primary prompt — el QUÉ-hacer per macro-phase (cambia A→B) */}
      <p
        data-testid="energy-anchor-commitment-primary-prompt"
        aria-live="polite"
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: 18,
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

      {/* Visual stack: particles + orb + hold-press */}
      <div
        style={{
          position: "relative",
          width: 300,
          height: 280,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Particles centrifugal */}
        <canvas
          ref={particleCanvasRef}
          data-testid="energy-anchor-commitment-particles"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: reduceMotion ? 0 : 0.45,
            transition: "opacity 200ms ease-out",
          }}
        />

        {/* Orb continuation Phase 1+2 carry-over */}
        <div
          ref={orbRef}
          data-testid="energy-anchor-commitment-orb"
          aria-hidden="true"
          style={{
            position: "absolute",
            width: 200,
            height: 200,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(6,182,212,0.22) 0%, rgba(14,116,144,0.10) 60%, rgba(14,116,144,0) 100%)",
            border: `1px solid ${phaseColor}`,
            opacity: 0.55,
            transition: "none",
            willChange: "transform",
            transform: "scale(1.0)",
          }}
        />

        {/* Hold-press button — solo activable Phase B */}
        {macroPhase === "B" && (
          <button
            type="button"
            data-testid="energy-anchor-commitment-hold-button"
            aria-label={label}
            onPointerDown={startPress}
            onPointerUp={cancelPress}
            onPointerLeave={cancelPress}
            onPointerCancel={cancelPress}
            style={{
              appearance: "none",
              position: "relative",
              inlineSize: HOLD_SIZE,
              blockSize: HOLD_SIZE,
              borderRadius: "50%",
              background: pressing
                ? "rgba(6,182,212,0.24)"
                : completed
                  ? "rgba(6,182,212,0.14)"
                  : "rgba(255,255,255,0.04)",
              border: `0.5px solid ${pressing || completed ? phaseColor : colors.separator}`,
              color: pressing || completed ? phaseColor : colors.text.secondary,
              fontFamily: typography.family,
              fontWeight: typography.weight.medium,
              fontSize: 13,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              cursor: completed ? "default" : "pointer",
              touchAction: "none",
              transition: "background 120ms linear, border-color 120ms linear",
              zIndex: 1,
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
            <span style={{ position: "relative", zIndex: 1 }}>
              {showRelease ? release_message : label}
            </span>
          </button>
        )}
      </div>

      {/* Body anchor sustained "Postura erguida activa" */}
      <span
        data-testid="energy-anchor-commitment-body-anchor"
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
        {POSTURA_ANCHOR}
      </span>

    </div>
  );
}
