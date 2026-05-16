"use client";
/* ═══════════════════════════════════════════════════════════════
   CognitiveResetCommitmentPrimitive — Phase 7 SP-H-3
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 3 "Reset Cognitivo" del protocolo
   #7 HyperShift. Reemplaza shared hold_press_button con primitive
   multi-exercise wrapper RESET-IDENTIFY-driven.

   Lección palmas conflict aplicada preventively ⚠️:
   El catálogo dice "Mantén las palmas presionadas mientras la visualizas"
   — MISMO conflict #4/#5/#7. Aplicado fix: cue "palmas presionadas"
   removido del UI (usuario sostiene celular con una mano + otra mano
   libre). Body anchor primary mental ("Algo cambia ahora").

   Macro-phase A→B (5s + 25s):
     Phase A — Identifica (0-5s):
       - Primary: "Identifica una cosa diferente que harás al volver"
       - Body anchor: "Pensamiento claro"
       - Hold-press hidden.
     Phase B — Mantén + Visualiza (5-30s):
       - Primary: "Algo cambia ahora"
       - Hold-press 6s ring progress.
       - Body anchor: "Visualiza esa una cosa"

   Identity #7 = "Descarga emocional rápida" + commitment cognitivo
   reset. Phase 3 cierra el ciclo con identification single-task
   different (Bryan Adams Monin 2013).

   Multi-exercise tracks layered (5):
     1. MENTAL primary: viz prompt cambia per macro-phase.
     2. MOTOR: hold-press 6s anti-trampa.
     3. VISUAL continuity: orb continuation Phase 1+2 carry-over.
     4. VISUAL particles: centrifugal projection (proyecta cambio).
     5. PHASE label "Reset Cognitivo" cyan-warm.

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - SIN body anchor manos extras (lección persistente palmas).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const PHASE_LABEL = "Reset Cognitivo";
const PHASE_A_PROMPT = "Identifica una cosa diferente que harás al volver";
const PHASE_B_PROMPT = "Algo cambia ahora";
const PHASE_A_BODY_ANCHOR = "Pensamiento claro";
const PHASE_B_BODY_ANCHOR = "Visualiza esa una cosa";

const PHASE_A_END_MS = 5000;
const HOLD_SIZE = 130;
const HOLD_RADIUS = 60;

/**
 * @param {object} props
 * @param {string} [props.label="MANTÉN"]
 * @param {number} [props.min_hold_ms=6000]
 * @param {string} [props.release_message="Algo cambia ahora."]
 * @param {boolean} [props.audioEnabled=true]
 * @param {boolean} [props.hapticEnabled=true]
 * @param {boolean} [props.voiceEnabled=false]
 * @param {(s:object)=>void} [props.onSignal]
 * @param {()=>void} [props.onComplete]
 */
export default function CognitiveResetCommitmentPrimitive({
  label = "MANTÉN",
  min_hold_ms = 6000,
  release_message = "Algo cambia ahora.",
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
        try { hap("tap"); } catch {}
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
        try { hap("error"); } catch {}
      }
      setProgress(0);
      try {
        if (typeof onCancelRef.current === "function") onCancelRef.current();
      } catch {}
    }
  };

  // Orb continuation.
  const orbRef = useRef(null);
  useEffect(() => {
    if (reduceMotion) return undefined;
    let stopped = false;
    const start = performance.now();
    let raf;
    const tickOrb = (now) => {
      if (stopped) return;
      const t = ((now - start) / 1000) % 5;
      const scale = 1.0 + Math.sin((t / 5) * Math.PI * 2) * 0.05;
      const orb = orbRef.current;
      if (orb) orb.style.transform = `scale(${scale.toFixed(4)})`;
      raf = requestAnimationFrame(tickOrb);
    };
    raf = requestAnimationFrame(tickOrb);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [reduceMotion]);

  // Particles centrifugal.
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
        particleSysRef.current.setPhase("exhale", 0.5);
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

  return (
    <div
      data-v2-cognitive-reset-commitment
      data-macro-phase={macroPhase}
      data-completed={completed ? "true" : "false"}
      data-pressing={pressing ? "true" : "false"}
      data-testid="cognitive-reset-commitment-primitive"
      role="region"
      aria-label="Reset Cognitivo, identifica una cosa diferente y mantén"
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
        data-testid="cognitive-reset-commitment-phase-label"
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
        data-testid="cognitive-reset-commitment-primary-prompt"
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
        <canvas
          ref={particleCanvasRef}
          data-testid="cognitive-reset-commitment-particles"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: reduceMotion ? 0 : 0.42,
            transition: "opacity 200ms ease-out",
          }}
        />

        <div
          ref={orbRef}
          data-testid="cognitive-reset-commitment-orb"
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

        {macroPhase === "B" && (
          <button
            type="button"
            data-testid="cognitive-reset-commitment-hold-button"
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

      <span
        data-testid="cognitive-reset-commitment-body-anchor"
        aria-live="polite"
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.01em",
          color: colors.text.secondary,
          opacity: 0.75,
          textAlign: "center",
          transition: reduceMotion ? "none" : "opacity 220ms ease-out",
        }}
      >
        {bodyAnchor}
      </span>
    </div>
  );
}
