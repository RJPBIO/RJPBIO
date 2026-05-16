"use client";
/* ═══════════════════════════════════════════════════════════════
   RespiratoryPulseTrainPrimitive — Phase 7 SP-K-1
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 1 "Pulso Respiratorio" del
   protocolo #10 Sensory Wake. Visual signature DISTINCT de
   breath_orb (#1) + smooth exhales (#9 vagal_burst): central orb
   que se expande smooth durante inhale 1s, luego PULSA 4 veces
   staccato durante exhale 2s + pulse train indicator (4 dots
   light up sequentially).

   Cadence: in 1s + ex 2s (4 pulses × 500ms each) = 3s per cycle.
   10 cycles × 3s = 30s.

   Mecanismo: micro-pulsos espiratorios activan coordinación
   neuromotora del diafragma e intercostales.

   Phase tracking dinámico per breath phase:
     Inhale (0-1s):
       - Primary: "Inhala 1 · Por la nariz"
       - Body anchor: "Suave"
       - Orb: smooth expand 1.0 → 1.4
       - Pulse dots: idle.
     Exhale (1-3s):
       - Primary: "EXHALA · 4 pulsos cortos"
       - Body anchor: "Pulsos cortos de aire"
       - Orb: 4 staccato pulses (scale 1.4 → 1.1 → 1.4 each 500ms).
       - Pulse dots: light sequential (1, 2, 3, 4).

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - "Pulsos cortos" = pulsos de aire físicos (no vocal) — silencioso.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const PHASE_LABEL = "Pulso Respiratorio";
const PULSE_COUNT = 4; // 4 sub-pulses during exhale

const INHALE_PROMPT = "Inhala 1 · Por la nariz";
const EXHALE_PROMPT = "EXHALA · 4 pulsos cortos";
const INHALE_BODY = "Suave";
const EXHALE_BODY = "Pulsos cortos de aire";

const DEFAULT_CADENCE = { in: 1, h1: 0, ex: 2, h2: 0 };

/**
 * @param {object} props
 * @param {number} [props.cycleCountTarget=10]
 * @param {{in:number,h1:number,ex:number,h2:number}} [props.cadence]
 * @param {boolean} [props.audioEnabled]
 * @param {boolean} [props.hapticEnabled]
 * @param {boolean} [props.voiceEnabled]
 * @param {(n:number)=>void} [props.onCycleComplete]
 * @param {()=>void} [props.onComplete]
 */
export default function RespiratoryPulseTrainPrimitive({
  cycleCountTarget = 10,
  cadence = DEFAULT_CADENCE,
  audioEnabled = true,  
  hapticEnabled = true,
  voiceEnabled = false,  
  onCycleComplete,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const phaseColor = getCyanForPhase(0); // cyan-deep #0E7490

  const onCycleCompleteRef = useRef(onCycleComplete);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCycleCompleteRef.current = onCycleComplete; }, [onCycleComplete]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const inhaleEndMs = cadence.in * 1000;
  const exhaleStartMs = (cadence.in + cadence.h1) * 1000;
  const exhaleEndMs = exhaleStartMs + cadence.ex * 1000;
  const cyclePeriodMs = (cadence.in + cadence.h1 + cadence.ex + cadence.h2) * 1000;
  const totalMs = cyclePeriodMs * cycleCountTarget;
  const pulseDurationMs = (cadence.ex * 1000) / PULSE_COUNT;

  const [breathPhase, setBreathPhase] = useState("inhale");
  const [cycleIdx, setCycleIdx] = useState(0);
  const [pulseIdx, setPulseIdx] = useState(-1); // -1 inactive, 0..3 active pulse index
  const [completed, setCompleted] = useState(false);

  const orbRef = useRef(null);
  const lastCycleRef = useRef(0);
  const lastPulseIdxRef = useRef(-1);
  const lastBreathPhaseRef = useRef("inhale");

  // RAF tick
  useEffect(() => {
    if (reduceMotion) {
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
      let activePulseIdx = -1;

      if (cycleMs < inhaleEndMs) {
        // Inhale: smooth expand 1.0 → 1.4
        const t = cycleMs / inhaleEndMs;
        scale = 1.0 + 0.40 * (1 - Math.pow(1 - t, 2));
        phase = "inhale";
        activePulseIdx = -1;
      } else if (cycleMs < exhaleStartMs) {
        // Hold (h1) — usually 0
        scale = 1.4;
        phase = "hold";
      } else if (cycleMs < exhaleEndMs) {
        // Exhale: 4 staccato pulses
        const exhaleMs = cycleMs - exhaleStartMs;
        const pulseIndex = Math.min(PULSE_COUNT - 1, Math.floor(exhaleMs / pulseDurationMs));
        const pulseProgress = (exhaleMs % pulseDurationMs) / pulseDurationMs;
        // Each pulse: scale starts at 1.4, dips to 1.10 at midpoint, back up — staccato feel
        const dip = Math.sin(pulseProgress * Math.PI); // 0 → 1 → 0
        scale = 1.4 - 0.30 * dip;
        phase = "exhale";
        activePulseIdx = pulseIndex;
      } else {
        // Hold (h2) — usually 0
        scale = 1.0;
        phase = "rest";
      }

      const orb = orbRef.current;
      if (orb) {
        orb.style.transform = `scale(${scale.toFixed(3)})`;
      }

      if (phase !== lastBreathPhaseRef.current) {
        setBreathPhase(phase);
        lastBreathPhaseRef.current = phase;
      }

      if (activePulseIdx !== lastPulseIdxRef.current) {
        lastPulseIdxRef.current = activePulseIdx;
        setPulseIdx(activePulseIdx);
        if (activePulseIdx > -1 && hapticEnabled) {
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
          try { hapticProtocolSignature(10, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
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
    cyclePeriodMs, inhaleEndMs, exhaleStartMs, exhaleEndMs, pulseDurationMs, totalMs,
    cadence.in, cadence.h1, cadence.ex, cadence.h2,
  ]);

  // Particles ambient
  const particleCanvasRef = useRef(null);
  const particleSysRef = useRef(null);
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return undefined;
    canvas.width = 320;
    canvas.height = 280;
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

  const primaryPrompt = breathPhase === "inhale" ? INHALE_PROMPT : breathPhase === "exhale" ? EXHALE_PROMPT : "";
  const bodyAnchor = breathPhase === "inhale" ? INHALE_BODY : breathPhase === "exhale" ? EXHALE_BODY : "";
  const cyclesCompleted = Math.min(cycleIdx, cycleCountTarget);

  return (
    <div
      data-v2-respiratory-pulse-train
      data-breath-phase={breathPhase}
      data-cycle-idx={cycleIdx}
      data-pulse-idx={pulseIdx}
      data-completed={completed ? "true" : "false"}
      data-testid="respiratory-pulse-train-primitive"
      role="region"
      aria-label="Pulso respiratorio, inhala 1 segundo exhala 2 segundos en cuatro pulsos cortos"
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
        data-testid="respiratory-pulse-train-phase-label"
        style={{
          fontFamily: typography.family,
          fontSize: 11,
          fontWeight: typography.weight.medium,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: phaseColor,
          opacity: 0.75,
        }}
      >
        {PHASE_LABEL}
      </span>

      <p
        data-testid="respiratory-pulse-train-instruction"
        aria-live="polite"
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: 17,
          fontWeight: breathPhase === "exhale" ? typography.weight.medium : typography.weight.light,
          letterSpacing: "-0.02em",
          color: breathPhase === "exhale" ? phaseColor : colors.text.strong,
          lineHeight: 1.3,
          textAlign: "center",
          maxWidth: 320,
          paddingInline: spacing.s16,
          minHeight: 24,
          transition: reduceMotion ? "none" : "color 220ms ease-out, font-weight 220ms ease-out",
        }}
      >
        {primaryPrompt}
      </p>

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
        <canvas
          ref={particleCanvasRef}
          data-testid="respiratory-pulse-train-particles"
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

        {/* Central orb — radial gradient + boxShadow glow peaks during exhale */}
        <div
          ref={orbRef}
          data-testid="respiratory-pulse-train-orb"
          aria-hidden="true"
          style={{
            position: "absolute",
            width: 110,
            height: 110,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${phaseColor} 0%, rgba(14,116,144,0.55) 50%, rgba(14,116,144,0) 100%)`,
            boxShadow: breathPhase === "exhale"
              ? `0 0 50px rgba(14,116,144,0.85), 0 0 90px rgba(14,116,144,0.40)`
              : `0 0 26px rgba(14,116,144,0.55)`,
            opacity: 0.9,
            willChange: "transform, box-shadow",
            transform: "scale(1)",
            transition: reduceMotion ? "none" : "box-shadow 200ms ease-out",
          }}
        />

        {/* Pulse train dots — 4 dots horizontal, light up sequential during exhale */}
        <div
          data-testid="respiratory-pulse-train-pulse-train"
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: 18,
            display: "flex",
            gap: 14,
            alignItems: "center",
          }}
        >
          {Array.from({ length: PULSE_COUNT }).map((_, i) => {
            const active = pulseIdx === i;
            const passed = pulseIdx > i;
            return (
              <div
                key={`pulse-${i}`}
                style={{
                  width: active ? 14 : 8,
                  height: active ? 14 : 8,
                  borderRadius: "50%",
                  background: active || passed ? phaseColor : "rgba(255,255,255,0.10)",
                  opacity: active ? 0.95 : passed ? 0.40 : 0.35,
                  boxShadow: active ? `0 0 14px rgba(14,116,144,0.75)` : "none",
                  transition: reduceMotion ? "none" : "all 100ms ease-out",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Body anchor */}
      <span
        data-testid="respiratory-pulse-train-body-anchor"
        aria-live="polite"
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.01em",
          color: colors.text.secondary,
          opacity: 0.78,
          textAlign: "center",
          minHeight: 22,
          transition: reduceMotion ? "none" : "opacity 220ms ease-out",
        }}
      >
        {bodyAnchor}
      </span>

      {/* Cycle counter */}
      <span
        data-testid="respiratory-pulse-train-cycle-counter"
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
