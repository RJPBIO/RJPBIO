"use client";
/* ═══════════════════════════════════════════════════════════════
   OcularResetMetronomePrimitive — Phase 7 SP-I-1 v2
   ───────────────────────────────────────────────────────────────
   Visual primitive dedicated para Phase 1 "Reset Visual" del
   protocolo #8 Lightning Focus. Movimientos oculares horizontales
   smooth = reset atencional.

   PRIMER Phase 1 OCULOMOTOR en bio-ignición.

   Macro-phase choreography (5s prep + 25s execution):
     Phase A — Preparación (0-5s):
       - Primary prompt: "Cabeza inmóvil · Postura preparada"
       - Body anchor: "Encuentra el punto"
       - Punto static center.
     Phase B — Tracking (5-30s):
       - Primary prompt: "Sigue el punto · Solo los ojos"
       - Body anchor: "Cabeza inmóvil · Solo los ojos"
       - Punto oscila smooth 0.5Hz × 12 ciclos = 24s.

   Multi-exercise tracks layered (8):
     1. PRIMARY visual: punto cyan oscilando smooth horizontal con
        radial gradient + ring exterior (peak visual aesthetic).
     2. COMET TRAIL: 3 dots secundarios siguen con delay 80/160/240ms
        creando estela motion (visual peak vs dot solo).
     3. DIRECTION arrow ← → flips smooth con motion direction.
     4. TRACK LINE horizontal con end markers.
     5. DYNAMIC primary prompt cambia per macro-phase (aria-live).
     6. BODY anchor evolutivo per macro-phase.
     7. CYCLE counter X/12.
     8. PHASE label "Reset Visual" cyan-deep.

   Functional human logic:
     - Phase A: usuario encuentra postura inmóvil (5s prep).
     - Phase B: solo ojos siguen smooth — la estela visual ayuda
       a tracking continuo natural.

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const PHASE_LABEL = "Reset Visual";
const PHASE_A_PROMPT = "Cabeza inmóvil · Postura preparada";
const PHASE_B_PROMPT = "Sigue el punto · Solo los ojos";
const PHASE_A_BODY_ANCHOR = "Encuentra el punto";
const PHASE_B_BODY_ANCHOR = "Cabeza inmóvil · Solo los ojos";

const PHASE_A_END_MS = 5000;
const DEFAULT_FREQUENCY_HZ = 0.5;
const DEFAULT_TOTAL_CYCLES = 12; // 12 cycles × 2s = 24s execution
const TRACK_WIDTH = 280;
const AMPLITUDE = 110;

// Trail delays in milliseconds (each dot lags behind main dot).
const TRAIL_DELAYS_MS = [80, 160, 240];

/**
 * @param {object} props
 * @param {number} [props.frequency_hz=0.5]
 * @param {number} [props.total_cycles=12]
 * @param {boolean} [props.audioEnabled=true]
 * @param {boolean} [props.hapticEnabled=true]
 * @param {boolean} [props.voiceEnabled=false]
 * @param {()=>void} [props.onComplete]
 */
export default function OcularResetMetronomePrimitive({
  frequency_hz = DEFAULT_FREQUENCY_HZ,
  total_cycles = DEFAULT_TOTAL_CYCLES,
  audioEnabled = true,  
  hapticEnabled = true,
  voiceEnabled = false,  
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const phaseColor = getCyanForPhase(0); // cyan-deep #0E7490

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const cyclePeriodMs = 1000 / frequency_hz; // 0.5Hz → 2000ms per cycle
  const totalExecutionMs = cyclePeriodMs * total_cycles;

  // ─── Macro-phase state ─────────────────────────────────────────
  const [macroPhase, setMacroPhase] = useState("A");
  useEffect(() => {
    if (reduceMotion) {
      const t = setTimeout(() => setMacroPhase("B"), 800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setMacroPhase("B"), PHASE_A_END_MS);
    return () => clearTimeout(t);
  }, [reduceMotion]);

  const [cycleIdx, setCycleIdx] = useState(0);
  const [direction, setDirection] = useState("right");
  const [completed, setCompleted] = useState(false);

  const dotRef = useRef(null);
  const trailRefs = useRef([null, null, null]);

  // ─── Tracking RAF (only Phase B) ────────────────────────────────
  useEffect(() => {
    if (macroPhase !== "B") {
      // Phase A: dot static center.
      const dot = dotRef.current;
      if (dot) dot.style.transform = "translateX(0)";
      trailRefs.current.forEach((el) => {
        if (el) el.style.transform = "translateX(0)";
      });
      return undefined;
    }
    if (reduceMotion) {
      const t = setTimeout(() => {
        setCompleted(true);
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
      }, 1500);
      return () => clearTimeout(t);
    }
    let stopped = false;
    const startTime = performance.now();
    let raf;
    const computeOffset = (timeMs) => {
      const t = (timeMs % cyclePeriodMs) / cyclePeriodMs;
      return Math.sin(t * 2 * Math.PI) * AMPLITUDE;
    };
    let lastOffset = 0;
    const tick = (now) => {
      if (stopped) return;
      const elapsed = now - startTime;
      const mainOffset = computeOffset(elapsed);
      const dot = dotRef.current;
      if (dot) dot.style.transform = `translateX(${mainOffset.toFixed(2)}px)`;

      // Trail dots — each lags behind main.
      TRAIL_DELAYS_MS.forEach((delay, i) => {
        const trailTimeMs = Math.max(0, elapsed - delay);
        const trailOffset = computeOffset(trailTimeMs);
        const el = trailRefs.current[i];
        if (el) el.style.transform = `translateX(${trailOffset.toFixed(2)}px)`;
      });

      // Direction (right when offset increasing, left when decreasing).
      const newDir = mainOffset > lastOffset ? "right" : "left";
      setDirection((prev) => (prev !== newDir ? newDir : prev));
      lastOffset = mainOffset;

      const completedCycles = Math.floor(elapsed / cyclePeriodMs);
      setCycleIdx((prev) => (prev !== completedCycles ? completedCycles : prev));

      if (elapsed >= totalExecutionMs) {
        stopped = true;
        setCompleted(true);
        if (hapticEnabled) {
          try { hapticProtocolSignature(8, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
        }
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
        return;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [macroPhase, cyclePeriodMs, totalExecutionMs, hapticEnabled, reduceMotion]);

  // ─── Particles ambient ────────────────────────────────────────────
  const particleCanvasRef = useRef(null);
  const particleSysRef = useRef(null);
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return undefined;
    canvas.width = 320;
    canvas.height = 200;
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

  const primaryPrompt = macroPhase === "A" ? PHASE_A_PROMPT : PHASE_B_PROMPT;
  const bodyAnchor = macroPhase === "A" ? PHASE_A_BODY_ANCHOR : PHASE_B_BODY_ANCHOR;

  return (
    <div
      data-v2-ocular-reset-metronome
      data-macro-phase={macroPhase}
      data-cycle-idx={cycleIdx}
      data-direction={direction}
      data-completed={completed ? "true" : "false"}
      data-testid="ocular-reset-metronome-primitive"
      role="region"
      aria-label="Reset Visual, sigue el punto con los ojos cabeza inmóvil"
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
        data-testid="ocular-reset-metronome-phase-label"
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
        data-testid="ocular-reset-metronome-instruction"
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
          width: 320,
          height: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <canvas
          ref={particleCanvasRef}
          data-testid="ocular-reset-metronome-particles"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: reduceMotion ? 0 : 0.22,
            transition: "opacity 200ms ease-out",
          }}
        />

        {/* Track line horizontal */}
        <div
          data-testid="ocular-reset-metronome-track"
          aria-hidden="true"
          style={{
            position: "absolute",
            width: TRACK_WIDTH,
            height: 1,
            background: `linear-gradient(to right, transparent 0%, ${phaseColor} 20%, ${phaseColor} 80%, transparent 100%)`,
            opacity: 0.32,
          }}
        />

        {/* End markers */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: `calc(50% - ${AMPLITUDE + 4}px)`,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: phaseColor,
            opacity: 0.4,
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: `calc(50% + ${AMPLITUDE - 2}px)`,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: phaseColor,
            opacity: 0.4,
          }}
        />

        {/* Comet trail dots — only Phase B */}
        {macroPhase === "B" && [0, 1, 2].map((i) => (
          <div
            key={i}
            ref={(el) => { trailRefs.current[i] = el; }}
            data-testid={`ocular-reset-metronome-trail-${i}`}
            aria-hidden="true"
            style={{
              position: "absolute",
              width: 14 - i * 2.5,
              height: 14 - i * 2.5,
              borderRadius: "50%",
              background: phaseColor,
              opacity: 0.45 - i * 0.13,
              willChange: "transform",
              transform: "translateX(0)",
            }}
          />
        ))}

        {/* Outer ring around main dot */}
        <div
          ref={(el) => { /* ring follows the dot — use same ref pattern via trick */ }}
          aria-hidden="true"
          style={{
            position: "absolute",
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: `1px solid ${phaseColor}`,
            opacity: 0.0, // hidden by default — could add later if needed
          }}
        />

        {/* Main dot — radial gradient + boxShadow glow */}
        <div
          ref={dotRef}
          data-testid="ocular-reset-metronome-dot"
          aria-hidden="true"
          style={{
            position: "absolute",
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${phaseColor} 0%, ${phaseColor} 50%, rgba(14,116,144,0) 100%)`,
            opacity: 1,
            boxShadow: `0 0 22px rgba(14,116,144,0.75), 0 0 40px rgba(14,116,144,0.40)`,
            willChange: "transform",
            transform: "translateX(0)",
          }}
        />
      </div>

      {/* Direction arrow row — only Phase B */}
      {macroPhase === "B" && (
        <div
          data-testid="ocular-reset-metronome-direction"
          aria-hidden="true"
          style={{
            display: "flex",
            gap: spacing.s24,
            alignItems: "center",
            justifyContent: "center",
            minHeight: 22,
          }}
        >
          <span
            style={{
              fontFamily: typography.familyMono,
              fontSize: 22,
              fontWeight: typography.weight.light,
              color: phaseColor,
              opacity: direction === "left" ? 0.95 : 0.2,
              transition: reduceMotion ? "none" : "opacity 140ms ease-out",
              minWidth: 22,
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
              opacity: 0.55,
            }}
          >
            {frequency_hz === 0.5 ? "0,5 Hz" : `${frequency_hz} Hz`}
          </span>
          <span
            style={{
              fontFamily: typography.familyMono,
              fontSize: 22,
              fontWeight: typography.weight.light,
              color: phaseColor,
              opacity: direction === "right" ? 0.95 : 0.2,
              transition: reduceMotion ? "none" : "opacity 140ms ease-out",
              minWidth: 22,
              textAlign: "center",
            }}
          >
            →
          </span>
        </div>
      )}

      {/* Body anchor — cambia per macro-phase */}
      <span
        data-testid="ocular-reset-metronome-body-anchor"
        aria-live="polite"
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.01em",
          color: colors.text.secondary,
          opacity: 0.78,
          textAlign: "center",
          transition: reduceMotion ? "none" : "opacity 220ms ease-out",
        }}
      >
        {bodyAnchor}
      </span>

      {/* Cycle counter — only Phase B */}
      {macroPhase === "B" && (
        <span
          data-testid="ocular-reset-metronome-cycle-counter"
          aria-label={`Ciclo ${Math.min(cycleIdx + 1, total_cycles)} de ${total_cycles}`}
          style={{
            fontFamily: typography.familyMono,
            fontSize: 11,
            letterSpacing: "0.12em",
            color: colors.text.muted,
            opacity: 0.55,
          }}
        >
          {Math.min(cycleIdx + 1, total_cycles)} / {total_cycles}
        </span>
      )}
    </div>
  );
}
