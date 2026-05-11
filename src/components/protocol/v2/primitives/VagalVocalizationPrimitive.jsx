"use client";
/* ═══════════════════════════════════════════════════════════════
   VagalVocalizationPrimitive — Phase 7 SP-R-1 (silent variant)
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 1 "Exhalación Vagal Silenciosa"
   del protocolo #19 Panic Interrupt (Crisis tier).

   Mecanismo silencioso (crisis en público, teléfono en mano):
   exhalación larga con lengua firmemente presionada al paladar.
   Activa vago vía baroreceptor (exhalación prolongada, Porges 2009)
   + reflejo trigémino-vagal (compresión lingual, Lemaitre 2008).

   Each cycle (~12s = 4s prep + 8s long silent exhale):
     - Prep (0-4s): inhala suave por nariz, lengua al paladar
     - Sustain (4-12s): exhala largo y silencioso, boca casi cerrada,
       lengua sigue presionada arriba (orb se expande lento)

   Visual signature (legacy "VagalVocalization" name preserved):
     - Central resonance orb expandiendo lento durante exhalación
     - 3 anillos emanando hacia afuera (representan exhalación, no sonido)
     - 3 dots de progreso (cycle indicators)
     - Texto guía "Exhala largo · Silencio"
     - Body anchor: "Lengua firme al paladar"

   Constraint compliance:
     - CRISIS-FRIENDLY: SIN sonido (oficina, transporte público OK).
     - Single-hand phone OK, no equipment.
     - no_validation, self-paced, voice TTS OFF por default.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { useMountFade } from "./useMountFade";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const PHASE_LABEL = "Exhalación Vagal Silenciosa";

const PREP_PROMPT = "Inhala suave · Lengua al paladar";
const SUSTAIN_PROMPT = "Exhala largo · Silencio";
const PREP_BODY = "Toma aire por la nariz";
const SUSTAIN_BODY = "Lengua firme arriba";

const PREP_MS = 4000;
const SUSTAIN_MS = 8000;
const CYCLE_MS = PREP_MS + SUSTAIN_MS;

/**
 * @param {object} props
 * @param {number} [props.cycleCountTarget=3]
 * @param {boolean} [props.hapticEnabled]
 * @param {(n:number)=>void} [props.onCycleComplete]
 * @param {()=>void} [props.onComplete]
 */
export default function VagalVocalizationPrimitive({
  cycleCountTarget = 3,
  hapticEnabled = true,
  onCycleComplete,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const mountFade = useMountFade({ reduceMotion });
  const phaseColor = getCyanForPhase(0); // cyan-deep
  const uid = useId();
  const haloId = `vvBlur-${uid}`;
  const vignetteId = `vvVignette-${uid}`;
  const auraId = `vvAura-${uid}`;

  const onCycleCompleteRef = useRef(onCycleComplete);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCycleCompleteRef.current = onCycleComplete; }, [onCycleComplete]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const totalMs = CYCLE_MS * cycleCountTarget;

  const [phaseState, setPhaseState] = useState("prep");
  const [cycleIdx, setCycleIdx] = useState(0);
  const [orbPulse, setOrbPulse] = useState(0);
  const [vibrationTick, setVibrationTick] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(Math.ceil(PREP_MS / 1000));
  const [completed, setCompleted] = useState(false);

  const lastCycleRef = useRef(0);
  const lastPhaseStateRef = useRef("prep");

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
      const cycleMs = elapsed % CYCLE_MS;
      const currentCycle = Math.floor(elapsed / CYCLE_MS);

      let phase = "prep";
      let secsLeft = 0;
      let pulse = 0;
      let vibT = 0;

      if (cycleMs < PREP_MS) {
        phase = "prep";
        secsLeft = Math.ceil((PREP_MS - cycleMs) / 1000);
        // Slow inhale pulse — orb grows gently 0 → 0.45
        const t = cycleMs / PREP_MS;
        pulse = Math.sin(t * Math.PI * 0.5) * 0.45;
        vibT = 0;
      } else {
        phase = "sustain";
        const sustainMs = cycleMs - PREP_MS;
        secsLeft = Math.ceil((SUSTAIN_MS - sustainMs) / 1000);
        // Long silent exhale — orb contracts slowly + rings emanate outward
        const t = sustainMs / SUSTAIN_MS;
        const exhaleEnvelope = Math.cos(t * Math.PI * 0.5); // 1 → 0 (orb shrinks)
        pulse = exhaleEnvelope * 0.55;
        vibT = (sustainMs / 2400) % 1; // slow ripple ticker (rings emanate gently)
      }

      setOrbPulse((prev) => (Math.abs(prev - pulse) > 0.04 ? pulse : prev));
      setVibrationTick((prev) => (Math.abs(prev - vibT) > 0.02 ? vibT : prev));
      setSecondsRemaining((prev) => (prev !== secsLeft ? secsLeft : prev));

      if (phase !== lastPhaseStateRef.current) {
        setPhaseState(phase);
        lastPhaseStateRef.current = phase;
        if (phase === "sustain" && hapticEnabled) {
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
          try { hapticProtocolSignature(19, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
        }
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [cycleCountTarget, hapticEnabled, reduceMotion, totalMs]);

  // Particles
  const particleCanvasRef = useRef(null);
  const particleSysRef = useRef(null);
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return undefined;
    canvas.width = 320;
    canvas.height = 320;
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

  const primaryPrompt = phaseState === "sustain" ? SUSTAIN_PROMPT : PREP_PROMPT;
  const bodyAnchor = phaseState === "sustain" ? SUSTAIN_BODY : PREP_BODY;
  const cyclesCompleted = Math.min(cycleIdx, cycleCountTarget);
  const isSustain = phaseState === "sustain";
  const orbScale = 1.0 + orbPulse * (isSustain ? 0.28 : 0.15);

  return (
    <div
      data-v2-vagal-vocalization
      data-phase-state={phaseState}
      data-cycle-idx={cycleIdx}
      data-completed={completed ? "true" : "false"}
      data-testid="vagal-vocalization-primitive"
      role="region"
      aria-label="Exhalación vagal silenciosa con lengua al paladar"
      style={{
        width: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.s24,
        opacity: mountFade.opacity,
        transform: mountFade.transform,
      }}
    >
      <span
        data-testid="vagal-vocalization-phase-label"
        style={{
          fontFamily: typography.family,
          fontSize: 11,
          fontWeight: typography.weight.medium,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: phaseColor,
          opacity: 0.70,
        }}
      >
        {PHASE_LABEL}
      </span>

      <p
        data-testid="vagal-vocalization-instruction"
        aria-live="polite"
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: 17,
          fontWeight: isSustain ? typography.weight.medium : typography.weight.light,
          letterSpacing: "-0.02em",
          color: isSustain ? phaseColor : colors.text.strong,
          lineHeight: 1.3,
          textAlign: "center",
          maxWidth: 320,
          paddingInline: spacing.s16,
          minHeight: 24,
          transition: reduceMotion ? "none" : "color 320ms ease-out",
        }}
      >
        {primaryPrompt}
      </p>

      <div
        style={{
          position: "relative",
          width: 320,
          height: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <canvas
          ref={particleCanvasRef}
          data-testid="vagal-vocalization-particles"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: reduceMotion ? 0 : 0.14,
            transition: "opacity 200ms ease-out",
          }}
        />

        <svg
          aria-hidden="true"
          width="320"
          height="320"
          viewBox="0 0 320 320"
          style={{ position: "absolute" }}
        >
          <defs>
            <filter id={haloId} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="12" />
            </filter>
            <radialGradient id={vignetteId} cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.08" />
              <stop offset="60%" stopColor={phaseColor} stopOpacity="0.02" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.85" />
              <stop offset="50%" stopColor={phaseColor} stopOpacity="0.30" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="160" cy="160" rx="140" ry="140" fill={`url(#${vignetteId})`} />

          {/* 3 anillos emanando (representan flujo de aire saliendo) durante exhalación */}
          {isSustain && [0, 1, 2].map((i) => {
            const offset = i / 3;
            const t = (vibrationTick + offset) % 1;
            const r = 60 + t * 90;
            const opacity = (1 - t) * 0.38;
            return (
              <circle
                key={`flow-${i}`}
                cx="160" cy="160" r={r}
                fill="none"
                stroke={phaseColor}
                strokeWidth="1.0"
                opacity={opacity}
              />
            );
          })}

          {/* Resonance orb */}
          <circle
            cx="160" cy="160" r="48"
            fill={`url(#${auraId})`}
            opacity={isSustain ? 0.80 : 0.55}
            filter={reduceMotion ? undefined : `url(#${haloId})`}
            style={{
              transform: `scale(${orbScale.toFixed(3)})`,
              transformOrigin: "160px 160px",
              transition: reduceMotion ? "none" : "transform 220ms ease-out, opacity 320ms ease-out",
            }}
          />
          <circle
            cx="160" cy="160" r="10"
            fill={phaseColor}
            opacity="0.92"
            style={{
              transform: `scale(${orbScale.toFixed(3)})`,
              transformOrigin: "160px 160px",
              transition: reduceMotion ? "none" : "transform 220ms ease-out",
            }}
          />

          {/* 3 cycle progression dots top */}
          {[0, 1, 2].map((i) => (
            <circle
              key={`cy-${i}`}
              cx={144 + i * 16} cy="22" r="3.5"
              fill={phaseColor}
              opacity={i === cyclesCompleted ? 0.95 : i < cyclesCompleted ? 0.55 : 0.20}
              style={{ transition: reduceMotion ? "none" : "opacity 320ms ease-out" }}
            />
          ))}

          {/* Countdown bottom */}
          <text
            x="160" y="300"
            fontSize="13"
            fontFamily={typography.familyMono}
            fontWeight="300"
            fill={colors.text.muted}
            opacity={secondsRemaining > 0 ? 0.65 : 0.20}
            textAnchor="middle"
            style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "0.10em" }}
          >
            {secondsRemaining > 0 ? `${secondsRemaining}s` : ""}
          </text>
        </svg>
      </div>

      {/* Body anchor */}
      <span
        data-testid="vagal-vocalization-body-anchor"
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
        data-testid="vagal-vocalization-cycle-counter"
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
