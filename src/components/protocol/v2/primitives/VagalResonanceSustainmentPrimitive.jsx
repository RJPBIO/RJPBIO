"use client";
/* ═══════════════════════════════════════════════════════════════
   VagalResonanceSustainmentPrimitive — Phase 7 SP-O-2
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 2 "Sostenimiento" del protocolo
   #16 Resonancia Vagal. Pattern reference: misma canonical orb que
   VagalResonanceCalibrationPrimitive (continuidad visual entre
   Phase 1 → Phase 2).

   4 sub-actos × 120s = 8 minutos sostenimiento total.
   Per bloque: ~10 ciclos a 5.5-5.5 (cyclePeriod 11s).

   Differentiation vs Calibration:
     - Block message at top (cambia per acto: "Bloque 1/2/3/4 ...").
     - Block indicator badge (subtle, 1/4 → 2/4 → 3/4 → 4/4).
     - Cycle counter per bloque (~10 ciclos).
     - Otherwise identical orb + countdown visual.

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";

const DEFAULT_CADENCE = { in: 5.5, h1: 0, ex: 5.5, h2: 0 };
const DEFAULT_SIZE = 220;
const TOTAL_BLOCKS = 4;

// Block messages per subActIdx
const BLOCK_MESSAGES = {
  0: "Bloque 1 · Mantén el ritmo · Sin esfuerzo",
  1: "Bloque 2 · La resonancia se profundiza",
  2: "Bloque 3 · Tu cuerpo entrena · Continúa",
  3: "Bloque 4 · Coherencia profunda · Sigue",
};

/**
 * @param {object} props
 * @param {number} [props.subActIdx=0] — block index 0..3
 * @param {number} [props.cycleCountTarget=10]
 * @param {{in:number,h1:number,ex:number,h2:number}} [props.cadence]
 * @param {boolean} [props.audioEnabled]
 * @param {boolean} [props.hapticEnabled]
 * @param {boolean} [props.voiceEnabled]
 * @param {number} [props.size]
 * @param {(n:number)=>void} [props.onCycleComplete]
 * @param {()=>void} [props.onComplete]
 */
export default function VagalResonanceSustainmentPrimitive({
  subActIdx = 0,
  cycleCountTarget = 10,
  cadence = DEFAULT_CADENCE,
  audioEnabled = true, // eslint-disable-line no-unused-vars
  hapticEnabled = true,
  voiceEnabled = false, // eslint-disable-line no-unused-vars
  size = DEFAULT_SIZE,
  onCycleComplete,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const phaseColor = getCyanForPhase(0); // continuidad cyan-deep canon

  const onCycleCompleteRef = useRef(onCycleComplete);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCycleCompleteRef.current = onCycleComplete; }, [onCycleComplete]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const inhaleEndMs = cadence.in * 1000;
  const exhaleStartMs = (cadence.in + cadence.h1) * 1000;
  const exhaleEndMs = exhaleStartMs + cadence.ex * 1000;
  const cyclePeriodMs = (cadence.in + cadence.h1 + cadence.ex + cadence.h2) * 1000;
  const totalMs = cyclePeriodMs * cycleCountTarget;

  const orbRef = useRef(null);
  const [breathPhase, setBreathPhase] = useState("inhale");
  const [cycleIdx, setCycleIdx] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(Math.ceil(cadence.in));
  const [completed, setCompleted] = useState(false);

  const lastCycleRef = useRef(0);
  const lastBreathPhaseRef = useRef("inhale");

  useEffect(() => {
    if (reduceMotion) {
      const orb = orbRef.current;
      if (orb) orb.style.transform = "scale(1.0)";
      const t = setTimeout(() => {
        setCompleted(true);
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
      }, 1500);
      return () => clearTimeout(t);
    }

    let stopped = false;
    let raf;
    const startTime = performance.now();

    const tick = (now) => {
      if (stopped) return;
      const elapsed = now - startTime;
      const cycleMs = elapsed % cyclePeriodMs;
      const currentCycle = Math.floor(elapsed / cyclePeriodMs);

      let scale = 1.0;
      let phase = "inhale";
      let secsLeft = 0;

      if (cycleMs < inhaleEndMs) {
        const t = cycleMs / inhaleEndMs;
        const eased = 0.5 - Math.cos(t * Math.PI) * 0.5;
        scale = 1.0 + 0.50 * eased;
        phase = "inhale";
        secsLeft = Math.ceil((inhaleEndMs - cycleMs) / 1000);
      } else if (cycleMs < exhaleStartMs) {
        scale = 1.50;
        phase = "hold";
        secsLeft = 0;
      } else if (cycleMs < exhaleEndMs) {
        const t = (cycleMs - exhaleStartMs) / (cadence.ex * 1000);
        const eased = 0.5 - Math.cos(t * Math.PI) * 0.5;
        scale = 1.50 - 0.50 * eased;
        phase = "exhale";
        secsLeft = Math.ceil((exhaleEndMs - cycleMs) / 1000);
      } else {
        scale = 1.0;
        phase = "rest";
        secsLeft = 0;
      }

      const orb = orbRef.current;
      if (orb) orb.style.transform = `scale(${scale.toFixed(3)})`;

      setSecondsRemaining((prev) => (prev !== secsLeft ? secsLeft : prev));

      if (phase !== lastBreathPhaseRef.current) {
        setBreathPhase(phase);
        lastBreathPhaseRef.current = phase;
        if (phase === "exhale" && hapticEnabled) {
          try { hap("tap"); } catch {}
        }
      }

      if (currentCycle !== lastCycleRef.current) {
        lastCycleRef.current = currentCycle;
        setCycleIdx(currentCycle);
        try {
          if (typeof onCycleCompleteRef.current === "function") {
            onCycleCompleteRef.current(currentCycle);
          }
        } catch {}
      }

      if (elapsed >= totalMs) {
        stopped = true;
        setCompleted(true);
        if (hapticEnabled) {
          try { hapticProtocolSignature(16, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
        }
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [
    cycleCountTarget, hapticEnabled, reduceMotion,
    cyclePeriodMs, inhaleEndMs, exhaleStartMs, exhaleEndMs, totalMs,
    cadence.in, cadence.h1, cadence.ex, cadence.h2,
  ]);

  const phaseLabel = breathPhase === "inhale" ? "INHALA" : breathPhase === "exhale" ? "EXHALA" : "—";
  const cyclesCompleted = Math.min(cycleIdx, cycleCountTarget);
  const blockMessage = BLOCK_MESSAGES[subActIdx] || BLOCK_MESSAGES[0];
  const blockIdx = Math.min(TOTAL_BLOCKS - 1, subActIdx);

  return (
    <div
      data-v2-vagal-resonance-sustainment
      data-block-idx={blockIdx}
      data-breath-phase={breathPhase}
      data-cycle-idx={cycleIdx}
      data-completed={completed ? "true" : "false"}
      data-testid="vagal-resonance-sustainment-primitive"
      role="region"
      aria-label={`Sostenimiento resonancia vagal, bloque ${blockIdx + 1} de ${TOTAL_BLOCKS}, ${phaseLabel.toLowerCase()}`}
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
      {/* Block message at top */}
      <p
        data-testid="vagal-resonance-sustainment-block-message"
        aria-live="polite"
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: 15,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.01em",
          color: colors.text.strong,
          lineHeight: 1.4,
          textAlign: "center",
          maxWidth: 320,
          paddingInline: spacing.s16,
          opacity: 0.85,
        }}
      >
        {blockMessage}
      </p>

      <div
        style={{
          width: size,
          height: size,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          ref={orbRef}
          data-testid="vagal-resonance-sustainment-orb"
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(34,211,238,0.40) 0%, rgba(14,116,144,0.20) 60%, rgba(14,116,144,0) 100%)",
            border: `1px solid ${phaseColor}`,
            transition: "none",
            willChange: "transform",
            transform: "scale(1.0)",
          }}
          aria-hidden="true"
        />

        {/* Countdown centered in orb */}
        <span
          data-testid="vagal-resonance-sustainment-countdown"
          aria-hidden="true"
          style={{
            position: "absolute",
            fontFamily: typography.familyMono,
            fontSize: 56,
            fontWeight: typography.weight.light,
            color: phaseColor,
            opacity: secondsRemaining > 0 ? 0.85 : 0.25,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.04em",
            pointerEvents: "none",
            transition: reduceMotion ? "none" : "opacity 220ms ease-out",
          }}
        >
          {secondsRemaining > 0 ? secondsRemaining : "·"}
        </span>
      </div>

      <span
        data-testid="vagal-resonance-sustainment-phase-label"
        aria-live="polite"
        style={{
          fontFamily: typography.familyMono,
          fontSize: typography.size.microCaps,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: colors.text.secondary,
          fontWeight: typography.weight.regular,
          minHeight: 14,
        }}
      >
        {phaseLabel}
      </span>

      {/* Bottom row: cycle counter + block indicator dots */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: spacing.s8,
        }}
      >
        <span
          data-testid="vagal-resonance-sustainment-cycle-counter"
          style={{
            fontFamily: typography.familyMono,
            fontSize: 11,
            letterSpacing: "0.12em",
            color: colors.text.muted,
            opacity: 0.55,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {Math.min(cyclesCompleted + 1, cycleCountTarget)} / {cycleCountTarget}
        </span>

        {/* 4 block indicator dots */}
        <div
          data-testid="vagal-resonance-sustainment-block-dots"
          aria-hidden="true"
          style={{ display: "flex", gap: 8, alignItems: "center" }}
        >
          {Array.from({ length: TOTAL_BLOCKS }).map((_, i) => {
            const isActive = i === blockIdx;
            const isPassed = i < blockIdx;
            return (
              <div
                key={`bk-${i}`}
                style={{
                  width: isActive ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: isActive || isPassed ? phaseColor : "rgba(255,255,255,0.15)",
                  opacity: isActive ? 0.95 : isPassed ? 0.55 : 0.35,
                  transition: reduceMotion ? "none" : "all 320ms ease-out",
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
