"use client";
/* ═══════════════════════════════════════════════════════════════
   CommitmentMotorPrimitive — Phase 7 SP-B-4
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 3 "Dirección y Cierre" del
   protocolo #1 Reinicio Parasimpático. Reemplaza shared
   hold_press_button con primitive multi-task wrapper.

   Phase 3 cierra el ciclo: el usuario visualiza la acción concreta
   identificada en Phase 2 y la ancla con motor commitment (hold-press
   5s). Mecanismo: visualización + anchor motor activa memoria
   procedimental + dopamina direccional (Bryan, Adams, Monin 2013).

   Multi-task tracks simultáneos:
     1. PRIMARY motor-cognitive: hold-press circular 140px con ring
        progress + visualización acción específica (interactive heart).
     2. SECONDARY visual: orb continuation soft (vagal carry-over from
        Phase 1+2 — completa el arco del protocolo).
     3. SECONDARY visual: particle field centrifugal (release/projection
        pattern — particles "lanzan" la acción al mundo, contrasta con
        Phase 2 hold orbital).
     4. SECONDARY cognitive-somatic: body anchor motor "Cierra el puño
        libre" — mano que NO sostiene el celular, evita conflicto con
        hold-press del pulgar.

   Mecanismo científico (NO surface en UI Phase 3 — action phase, evita
   fatiga textual): implementation intentions + visualización activa
   duplica probabilidad de seguimiento (Bryan, Adams, Monin 2013 ·
   Journal of Personality and Social Psychology).

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano: ✅ todos.
     - Hold-press pulgar (mano del celular) + puño cerrado mano libre.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

// Phase 3 es action phase — sin eyebrow científico (causa fatiga textual).
// Body anchor motor: la mano LIBRE (la que no sostiene el celular) cierra
// puño durante el hold-press — anchor motor que NO entra en conflicto con
// el hold-press del pulgar.
const PHASE_3_LABEL = "Dirección y Cierre";
const BODY_ANCHOR_CUE = "Cierra el puño libre";
const VISUALIZATION_PROMPT = "Visualiza la acción.";

// Hold-press button geometry (mirrors HoldPressButton).
const HOLD_SIZE = 140;
const HOLD_RADIUS = 64;

/**
 * @param {object} props
 * @param {string} [props.label="MANTÉN"]
 * @param {number} [props.min_hold_ms=5000]
 * @param {string} [props.release_message="Esa es la acción."]
 * @param {boolean} [props.audioEnabled=true]
 * @param {boolean} [props.hapticEnabled=true]
 * @param {boolean} [props.voiceEnabled=false]
 * @param {(s:object)=>void} [props.onSignal]
 * @param {()=>void} [props.onComplete]
 * @param {()=>void} [props.onCancel]
 */
export default function CommitmentMotorPrimitive({
  label = "MANTÉN",
  min_hold_ms = 5000,
  release_message = "Esa es la acción.",
  audioEnabled = true, // eslint-disable-line no-unused-vars
  hapticEnabled = true,
  voiceEnabled = false, // eslint-disable-line no-unused-vars
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

  // ─── Hold-press state (mirrors HoldPressButton) ─────────────
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
      }, 1200);
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  const startPress = () => {
    if (completed) return;
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

  // ─── Multi-task overlays ───────────────────────────────────
  // Track 2: orb continuation (soft pulse, vagal sustained).
  const orbRef = useRef(null);
  useEffect(() => {
    if (reduceMotion) return undefined;
    let stopped = false;
    const start = performance.now();
    let raf;
    const tickOrb = (now) => {
      if (stopped) return;
      const t = ((now - start) / 1000) % 5; // 5s soft pulse
      const scale = 1.0 + Math.sin((t / 5) * Math.PI * 2) * 0.06; // 0.94-1.06
      const orb = orbRef.current;
      if (orb) orb.style.transform = `scale(${scale.toFixed(4)})`;
      raf = requestAnimationFrame(tickOrb);
    };
    raf = requestAnimationFrame(tickOrb);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [reduceMotion]);

  // Track 3: particle field centrifugal exhale-pattern (release/projection).
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
        // Phase=exhale → particles drift centrifugally (toward edges) ·
        // metaphor: la acción se proyecta al mundo.
        particleSysRef.current.setPhase("exhale", 0.5);
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

  return (
    <div
      data-v2-commitment-motor
      data-completed={completed ? "true" : "false"}
      data-pressing={pressing ? "true" : "false"}
      data-testid="commitment-motor-primitive"
      role="region"
      aria-label="Dirección y cierre, commitment motor"
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
      {/* Phase label simple (zero scientific text per user feedback) */}
      <span
        data-testid="commitment-motor-phase-label"
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
        {PHASE_3_LABEL}
      </span>

      {/* Visualization prompt above the visual stack */}
      <p
        data-testid="commitment-motor-visualization-prompt"
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
        }}
      >
        {VISUALIZATION_PROMPT}
      </p>

      {/* Visual stack: particles + orb continuation (background) + hold-press button (foreground) */}
      <div
        style={{
          position: "relative",
          width: 300,
          height: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Track 3: particles centrifugal (release/projection) */}
        <canvas
          ref={particleCanvasRef}
          data-testid="commitment-motor-particles"
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
        {/* Track 2: orb continuation (subtle vagal sustained) */}
        <div
          ref={orbRef}
          data-testid="commitment-motor-orb"
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

        {/* Track 1: PRIMARY motor-cognitive hold-press (interactive heart) */}
        <button
          type="button"
          data-testid="commitment-motor-hold-button"
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
              ? "rgba(6,182,212,0.20)"
              : completed
                ? "rgba(6,182,212,0.12)"
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
      </div>

      {/* Track 4: SECONDARY cognitive-somatic body anchor sustained */}
      <span
        data-testid="commitment-motor-body-anchor"
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
