"use client";
/* ═══════════════════════════════════════════════════════════════
   VagalResonanceCalibrationPrimitive — Phase 7 SP-O-1 v4
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 1 "Calibración" del protocolo
   #16 Resonancia Vagal (HRV training Lehrer 2014).

   Pattern reference: PhysiologicalSighOrb F1 flagship (canonical
   Apple-Mindfulness minimalist orb). Single big orb 200px con
   radial gradient + border + smooth scale, eyebrow scientific
   reference top, phase label mono below.

   Cadence 5.5-0-5.5-0 = 11s per cycle. 5 cycles = 55s.

   Mecanismo: respiración a 5.5rpm maximiza HRV vía resonancia
   barorrefleja (Lehrer & Gevirtz 2014).

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";

const DEFAULT_CADENCE = { in: 5.5, h1: 0, ex: 5.5, h2: 0 };
const DEFAULT_SIZE = 220;

/**
 * @param {object} props
 * @param {number} [props.cycleCountTarget=5]
 * @param {{in:number,h1:number,ex:number,h2:number}} [props.cadence]
 * @param {boolean} [props.audioEnabled]
 * @param {boolean} [props.hapticEnabled]
 * @param {boolean} [props.voiceEnabled]
 * @param {boolean} [props.showEyebrow=true]
 * @param {number} [props.size]
 * @param {(n:number)=>void} [props.onCycleComplete]
 * @param {()=>void} [props.onComplete]
 */
export default function VagalResonanceCalibrationPrimitive({
  cycleCountTarget = 5,
  cadence = DEFAULT_CADENCE,
  audioEnabled = true,  
  hapticEnabled = true,
  voiceEnabled = false,  
  size = DEFAULT_SIZE,
  onCycleComplete,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const phaseColor = getCyanForPhase(0); // cyan-deep phase1

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

  return (
    <div
      data-v2-vagal-resonance-calibration
      data-breath-phase={breathPhase}
      data-cycle-idx={cycleIdx}
      data-completed={completed ? "true" : "false"}
      data-testid="vagal-resonance-calibration-primitive"
      role="region"
      aria-label={`Calibración resonancia vagal, ciclo ${cyclesCompleted + 1} de ${cycleCountTarget}, ${phaseLabel.toLowerCase()}`}
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
          data-testid="vagal-resonance-calibration-orb"
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
          data-testid="vagal-resonance-calibration-countdown"
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
        data-testid="vagal-resonance-calibration-phase-label"
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

      <span
        data-testid="vagal-resonance-calibration-cycle-counter"
        aria-label={`Ciclo ${Math.min(cyclesCompleted + 1, cycleCountTarget)} de ${cycleCountTarget}`}
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
    </div>
  );
}
