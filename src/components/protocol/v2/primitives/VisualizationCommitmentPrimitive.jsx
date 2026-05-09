"use client";
/* ═══════════════════════════════════════════════════════════════
   VisualizationCommitmentPrimitive — Phase 7 SP-C-3
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 3 "Visualización Dirigida" del
   protocolo #2 Activación Cognitiva. Reemplaza shared
   hold_press_button con primitive multi-task wrapper que LAYERS
   múltiples ejercicios neurales biohacking simultáneo.

   Phase 3 cierra el ciclo cognitivo del protocolo activando
   integración bi-hemisférica + commitment motor + sello vagal.
   Es el peak neural de la sesión: visualización + bilateral eye
   saccades + hold-press + humming exhale.

   Timeline 30s (Phase A 0-21s + Phase B 21-30s):
     Phase A — Preparación + Integración (0-21s):
       - Visualization prompt sustained: "Visualízate en 2 horas
         con tu tarea principal completada".
       - Bilateral eye saccades L-R 1Hz (2 dots alternating) —
         activa corpus callosum + integración hemisférica
         (Shapiro 1989 EMDR mechanism).
       - Body anchor "Mano abierta lista".
       - Orb continuation Phase 1+2 carry-over soft pulse.
       - Particles orbital.

     Phase B — Commitment + Sello Vagal (21-30s):
       - Hold-press button activo + ring progress.
       - Body anchor "Presiona + exhala mmm" — humming exhale cue
         (laryngeal vibration vagal stimulation, Bhramari pranayama).
       - Visualization sostenida.
       - Bilateral saccades pausados (foco motor consolidación).
       - Release: "Hoy avanzas, paso a paso."

   Multi-exercise layered:
     1. MENTAL (cognitive): visualization sustained 30s.
     2. VISUAL INTEGRATION (bi-hemisférica): bilateral saccades 0-21s.
     3. MOTOR (physical commitment): hold-press 6s en Phase B.
     4. RESPIRATORY + VAGAL (humming): "exhala mmm" cue during hold.
     5. SOMATIC: body anchor evolutivo per phase.
     6. VISUAL CONTINUITY: orb continuation Phase 1+2.

   Mecanismos científicos (NO surface en UI per user feedback):
     - Bilateral eye movements: Shapiro 1989 EMDR · Andrade 1997
       working memory integration.
     - Humming exhale: Bhramari pranayama · vagal afferent via
       laryngeal vibration · Kalyani 2011 nitric oxide.
     - Visualization + commitment motor: Bryan Adams Monin 2013.

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - Hold-press pulgar mismo brazo del celular.
     - Bilateral saccades: ojos solo, no movimiento físico.
     - Humming cue: opcional (texto guía, sin volumen forzado).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const PHASE_LABEL = "Visualización Dirigida";
const VISUALIZATION_PROMPT = "Visualízate en 2 horas con tu tarea principal completada.";
const HUMMING_CUE = "Exhala con mmm";

const PHASE_A_END_MS = 21000; // 21s preparación + saccades
const TOTAL_PHASE_MS = 30000; // 30s total

const HOLD_SIZE = 130;
const HOLD_RADIUS = 60;

// Bilateral saccade dots geometry.
const SACCADE_BPM = 60; // 1Hz alternating L-R
const SACCADE_AMPLITUDE = 80; // pixel offset from center

/**
 * @param {object} props
 * @param {string} [props.label="MANTÉN"]
 * @param {number} [props.min_hold_ms=6000]
 * @param {string} [props.release_message="Hoy avanzas, paso a paso."]
 * @param {boolean} [props.audioEnabled=true]
 * @param {boolean} [props.hapticEnabled=true]
 * @param {boolean} [props.voiceEnabled=false]
 * @param {(s:object)=>void} [props.onSignal]
 * @param {()=>void} [props.onComplete]
 */
export default function VisualizationCommitmentPrimitive({
  label = "MANTÉN",
  min_hold_ms = 6000,
  release_message = "Hoy avanzas, paso a paso.",
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

  // ─── Macro-phase state (A: prep+saccades / B: hold+humming) ───────
  const [macroPhase, setMacroPhase] = useState("A"); // "A" | "B"
  const macroStartRef = useRef(0);

  useEffect(() => {
    macroStartRef.current = performance.now();
    if (reduceMotion) {
      // Reduced motion: fast-forward to Phase B en 1s para no bloquear interaction.
      const t = setTimeout(() => setMacroPhase("B"), 1000);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setMacroPhase("B"), PHASE_A_END_MS);
    return () => clearTimeout(t);
  }, [reduceMotion]);

  // ─── Hold-press state (mirror HoldPressButton anti-trampa) ────────
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
    if (macroPhase !== "B") return; // hold-press solo activo en Phase B
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

  // ─── Multi-task overlays ──────────────────────────────────────────

  // Track 1 (orb continuation Phase 1+2 carry-over).
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

  // Track 2: bilateral eye saccade dots (L-R alternating 1Hz Phase A).
  const leftDotRef = useRef(null);
  const rightDotRef = useRef(null);
  useEffect(() => {
    if (reduceMotion) return undefined;
    if (macroPhase !== "A") return undefined; // saccades solo Phase A
    let stopped = false;
    const start = performance.now();
    let raf;
    const tickSaccade = (now) => {
      if (stopped) return;
      const elapsed = (now - start) / 1000;
      const cyclePhase = (elapsed * (SACCADE_BPM / 60)) % 1; // 0-1 within cycle
      // Left dot bright on first half, right dot bright on second half.
      const leftActive = cyclePhase < 0.5;
      const rightActive = !leftActive;
      const leftDot = leftDotRef.current;
      const rightDot = rightDotRef.current;
      if (leftDot) {
        leftDot.style.opacity = leftActive ? "0.95" : "0.25";
        leftDot.style.transform = `scale(${leftActive ? 1.3 : 1.0})`;
      }
      if (rightDot) {
        rightDot.style.opacity = rightActive ? "0.95" : "0.25";
        rightDot.style.transform = `scale(${rightActive ? 1.3 : 1.0})`;
      }
      raf = requestAnimationFrame(tickSaccade);
    };
    raf = requestAnimationFrame(tickSaccade);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [macroPhase, reduceMotion]);

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

  // Body anchor evoluciona por macro-phase + completion.
  const bodyAnchor = completed
    ? "Listo"
    : macroPhase === "A"
      ? "Mano abierta lista"
      : "Presiona + exhala mmm";

  const circumference = 2 * Math.PI * HOLD_RADIUS;
  const dashOffset = circumference * (1 - progress);

  return (
    <div
      data-v2-visualization-commitment
      data-macro-phase={macroPhase}
      data-completed={completed ? "true" : "false"}
      data-pressing={pressing ? "true" : "false"}
      data-testid="visualization-commitment-primitive"
      role="region"
      aria-label="Visualización Dirigida, integración bilateral + commitment motor"
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
        data-testid="visualization-commitment-phase-label"
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

      {/* Visualization prompt */}
      <p
        data-testid="visualization-commitment-prompt"
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: 17,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.02em",
          color: colors.text.strong,
          lineHeight: 1.35,
          textAlign: "center",
          maxWidth: 320,
          paddingInline: spacing.s16,
        }}
      >
        {VISUALIZATION_PROMPT}
      </p>

      {/* Visual stack: particles + orb + bilateral saccades + hold-press */}
      <div
        style={{
          position: "relative",
          width: 320,
          height: 280,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Particle field background */}
        <canvas
          ref={particleCanvasRef}
          data-testid="visualization-commitment-particles"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: reduceMotion ? 0 : 0.4,
            transition: "opacity 200ms ease-out",
          }}
        />

        {/* Orb continuation soft pulse */}
        <div
          ref={orbRef}
          data-testid="visualization-commitment-orb"
          aria-hidden="true"
          style={{
            position: "absolute",
            width: 180,
            height: 180,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(6,182,212,0.20) 0%, rgba(14,116,144,0.08) 60%, rgba(14,116,144,0) 100%)",
            border: `1px solid ${phaseColor}`,
            opacity: 0.5,
            transition: "none",
            willChange: "transform",
            transform: "scale(1.0)",
          }}
        />

        {/* Bilateral eye saccade dots — solo visible en Phase A */}
        {macroPhase === "A" && (
          <>
            <div
              ref={leftDotRef}
              data-testid="visualization-commitment-saccade-left"
              aria-hidden="true"
              style={{
                position: "absolute",
                left: `calc(50% - ${SACCADE_AMPLITUDE}px)`,
                top: "50%",
                width: 18,
                height: 18,
                marginLeft: -9,
                marginTop: -9,
                borderRadius: "50%",
                background: phaseColor,
                opacity: 0.25,
                transition: reduceMotion ? "none" : "opacity 80ms linear, transform 80ms linear",
                willChange: "transform, opacity",
                boxShadow: `0 0 12px ${phaseColor}`,
              }}
            />
            <div
              ref={rightDotRef}
              data-testid="visualization-commitment-saccade-right"
              aria-hidden="true"
              style={{
                position: "absolute",
                left: `calc(50% + ${SACCADE_AMPLITUDE}px)`,
                top: "50%",
                width: 18,
                height: 18,
                marginLeft: -9,
                marginTop: -9,
                borderRadius: "50%",
                background: phaseColor,
                opacity: 0.25,
                transition: reduceMotion ? "none" : "opacity 80ms linear, transform 80ms linear",
                willChange: "transform, opacity",
                boxShadow: `0 0 12px ${phaseColor}`,
              }}
            />
          </>
        )}

        {/* Hold-press button — solo activable en Phase B */}
        {macroPhase === "B" && (
          <button
            type="button"
            data-testid="visualization-commitment-hold-button"
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
                ? "rgba(6,182,212,0.22)"
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
        )}
      </div>

      {/* Body anchor evolutivo */}
      <span
        data-testid="visualization-commitment-body-anchor"
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
        {bodyAnchor}
      </span>

      {/* Humming respiratory cue — solo visible en Phase B (sub-label discreto) */}
      {macroPhase === "B" && !completed && (
        <span
          data-testid="visualization-commitment-humming-cue"
          aria-hidden="true"
          style={{
            fontFamily: typography.familyMono,
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: phaseColor,
            opacity: 0.55,
          }}
        >
          {HUMMING_CUE}
        </span>
      )}
    </div>
  );
}
