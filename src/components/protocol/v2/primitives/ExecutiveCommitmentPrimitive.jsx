"use client";
/* ═══════════════════════════════════════════════════════════════
   ExecutiveCommitmentPrimitive — Phase 7 SP-D-3
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 3 "Compromiso Motor" del protocolo
   #3 Reset Ejecutivo. Reemplaza shared hold_press_button con
   primitive multi-exercise wrapper layered (motor + somatic + respiratory + 60-min commitment).

   Phase 3 cierra el ciclo ejecutivo activando triple-seal:
   motor (hold-press pulgar) + somatic (free hand fist) +
   respiratory (exhale sync). El catálogo dice literal "Cierra el
   puño con firmeza al exhalar. Los próximos 60 minutos son para
   esto." — primitive lo entrega multi-modal layered.

   Timeline 30s con macro-phase A→B:
     Phase A — Anchor + Preparation (0-5s):
       - 60-minute commitment statement prominent.
       - Body anchor "Puño libre cerrado" preparing.
       - Hold-press button idle (visible, no presionable yet).

     Phase B — Triple-Seal Commitment (5-30s):
       - Hold-press button activable (5s requirement).
       - Sync respiratory cue "Exhala mientras mantienes".
       - Body anchor sustained.
       - Release_message + 60-min countdown indicator.

   Multi-exercise tracks layered (7):
     1. MOTOR primary: hold-press 5s (pulgar mano celular).
     2. SOMÁTICO físico: "Puño libre cerrado" sustained (mano libre,
        commitment seal motor — distinto del hold-press).
     3. RESPIRATORIO: "Exhala mientras mantienes" sync motor + breath
        — vagal afferent durante exhale + motor commitment.
     4. MENTAL anchor: "Próximos 60 minutos para esto" — commitment
        statement prominent (verbalización mental anchored).
     5. VISUAL continuity: orb continuation Phase 1+2 carry-over.
     6. VISUAL particles: centrifugal release pattern (commitment
        proyecta hacia próximos 60 minutos).
     7. PHASE label "Compromiso Motor" cyan-warm phaseIdx={2}.

   Mecanismos científicos (NO surface en UI per user feedback):
     - Implementation intentions + verbal anchor duplica probabilidad
       de seguimiento (Bryan, Adams, Monin 2013 JPSP).
     - Free hand fist + thumb press = bilateral motor commitment
       (corpus callosum integration).
     - Exhale sync con motor act activates parasympathetic confidence
       (Russo 2017 + Lehrer 2014).
     - 60-min time anchor = ultradian rhythm focus block (Kleitman
       1969 BRAC basic rest-activity cycle).

   Functional human logic:
     - Pulgar mano celular sostiene hold-press (motor 1).
     - Mano LIBRE cierra puño firmemente (motor 2 + somatic).
     - Mientras mantienes, EXHALAS (respiratorio).
     - Triple-seal simultaneous: motor + motor + breath = strongest
       commitment activation possible en 5s.
     - "Próximos 60 minutos para esto" verbalizar mentalmente sostiene
       commitment cognitivo post-press.

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - Ambas manos useful (1 hold press celular, 1 fist free).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const PHASE_LABEL = "Compromiso Motor";
const COMMITMENT_STATEMENT = "Próximos 60 minutos para esto.";
const BODY_ANCHOR_CUE = "Puño libre cerrado";
const BREATH_SYNC_CUE = "Exhala mientras mantienes";

const PHASE_A_END_MS = 5000; // 5s preparación + anchor
const HOLD_SIZE = 130;
const HOLD_RADIUS = 60;

/**
 * @param {object} props
 * @param {string} [props.label="MANTÉN"]
 * @param {number} [props.min_hold_ms=5000]
 * @param {string} [props.release_message="60 minutos para esto."]
 * @param {boolean} [props.audioEnabled=true]
 * @param {boolean} [props.hapticEnabled=true]
 * @param {boolean} [props.voiceEnabled=false]
 * @param {(s:object)=>void} [props.onSignal]
 * @param {()=>void} [props.onComplete]
 */
export default function ExecutiveCommitmentPrimitive({
  label = "MANTÉN",
  min_hold_ms = 5000,
  release_message = "60 minutos para esto.",
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

  // ─── Macro-phase state (A: anchor+prep / B: triple-seal) ──────────
  const [macroPhase, setMacroPhase] = useState("A");
  useEffect(() => {
    if (reduceMotion) {
      const t = setTimeout(() => setMacroPhase("B"), 800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setMacroPhase("B"), PHASE_A_END_MS);
    return () => clearTimeout(t);
  }, [reduceMotion]);

  // ─── Hold-press state (anti-trampa pattern) ───────────────────────
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

  // Track 6: particles centrifugal release pattern.
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
        // Centrifugal exhale pattern — proyectar commitment hacia próximos 60 min.
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
      data-v2-executive-commitment
      data-macro-phase={macroPhase}
      data-completed={completed ? "true" : "false"}
      data-pressing={pressing ? "true" : "false"}
      data-testid="executive-commitment-primitive"
      role="region"
      aria-label="Compromiso Motor, triple-seal motor + somatic + respiratorio"
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
        data-testid="executive-commitment-phase-label"
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

      {/* Commitment statement prominent */}
      <p
        data-testid="executive-commitment-statement"
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
        {COMMITMENT_STATEMENT}
      </p>

      {/* Visual stack: particles + orb + hold-press button */}
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
          data-testid="executive-commitment-particles"
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

        {/* Orb continuation Phase 1+2 carry-over */}
        <div
          ref={orbRef}
          data-testid="executive-commitment-orb"
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
            data-testid="executive-commitment-hold-button"
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

      {/* Body anchor sustained: free hand fist */}
      <span
        data-testid="executive-commitment-body-anchor"
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

      {/* Breath sync cue — solo Phase B durante hold (sync respiratorio) */}
      {macroPhase === "B" && !completed && (
        <span
          data-testid="executive-commitment-breath-cue"
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
          {BREATH_SYNC_CUE}
        </span>
      )}
    </div>
  );
}
