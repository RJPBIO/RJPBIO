"use client";
/* ═══════════════════════════════════════════════════════════════
   ApneaFrontalPressPrimitive — Phase 7 SP-R-2
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 2 "Apnea + Frente" del
   protocolo #19 Panic Interrupt (Crisis tier).

   Mecanismo silencioso de doble activación vagal:
     - Apnea voluntaria breve eleva tono vagal por reflejo
       barorreceptor durante pausa inspiratoria (Lemaitre 2008).
     - Presión frontal con dedos durante apnea estimula
       indirectamente el nervio trigémino sin estrés térmico
       (Russo 2017, extensión exhalatoria parasimpática).

   Cycle (~14s): in(3s) → hold(5s, frontal press) → ex(6s)
   3 ciclos × 14s = 42s total.

   Visual signature:
     - Orb central que crece durante inhalación,
       sostiene tamaño máximo + pulso trigeminal durante apnea
       (3 satélites pulsando alrededor del orb representando
       los puntos de presión frontal), contrae durante exhalación.
     - 3 cycle dots top + countdown segundos.
     - 3 prompts secuenciales (in / hold / ex) con body anchor.

   Crisis tier compliance:
     - no_validation, voice TTS, binaural continue.
     - Single-hand phone OK (other hand presiona frente).
     - SIN sonido emitido por el primitive ni requerido al user.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { useMountFade } from "./useMountFade";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const PHASE_LABEL = "Apnea · Presión Frente";

const PROMPT_IN = "Inhala suave por la nariz";
const PROMPT_HOLD = "Sostén · Dedos firmes en frente";
const PROMPT_EX = "Exhala largo · Suelta";

const BODY_IN = "Por la nariz, sin fuerza";
const BODY_HOLD = "3 dedos en la frente";
const BODY_EX = "Boca relajada";

const IN_MS = 3000;
const HOLD_MS = 5000;
const EX_MS = 6000;
const CYCLE_MS = IN_MS + HOLD_MS + EX_MS;

/**
 * @param {object} props
 * @param {number} [props.cycleCountTarget=3]
 * @param {boolean} [props.hapticEnabled]
 * @param {(n:number)=>void} [props.onCycleComplete]
 * @param {()=>void} [props.onComplete]
 */
export default function ApneaFrontalPressPrimitive({
  cycleCountTarget = 3,
  hapticEnabled = true,
  onCycleComplete,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const mountFade = useMountFade({ reduceMotion });
  const phaseColor = getCyanForPhase(1); // mid cyan — break-pattern vs Phase 1 (deep)
  const uid = useId();
  const haloId = `afBlur-${uid}`;
  const vignetteId = `afVignette-${uid}`;
  const auraId = `afAura-${uid}`;

  const onCycleCompleteRef = useRef(onCycleComplete);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCycleCompleteRef.current = onCycleComplete; }, [onCycleComplete]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const totalMs = CYCLE_MS * cycleCountTarget;

  const [phaseState, setPhaseState] = useState("in"); // in | hold | ex
  const [cycleIdx, setCycleIdx] = useState(0);
  const [orbScaleRaw, setOrbScaleRaw] = useState(0);
  const [trigeminalPulse, setTrigeminalPulse] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(Math.ceil(IN_MS / 1000));
  const [completed, setCompleted] = useState(false);

  const lastCycleRef = useRef(0);
  const lastPhaseStateRef = useRef("in");

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

      let phase = "in";
      let secsLeft = 0;
      let scale = 0;
      let trigPulse = 0;

      if (cycleMs < IN_MS) {
        phase = "in";
        secsLeft = Math.ceil((IN_MS - cycleMs) / 1000);
        const t = cycleMs / IN_MS;
        scale = Math.sin(t * Math.PI * 0.5); // 0 → 1
      } else if (cycleMs < IN_MS + HOLD_MS) {
        phase = "hold";
        const holdMs = cycleMs - IN_MS;
        secsLeft = Math.ceil((HOLD_MS - holdMs) / 1000);
        scale = 1.0; // sostenido al máximo
        // Trigeminal pulse — 2 Hz subtle
        trigPulse = (Math.sin((holdMs / 500) * Math.PI) + 1) * 0.5;
      } else {
        phase = "ex";
        const exMs = cycleMs - IN_MS - HOLD_MS;
        secsLeft = Math.ceil((EX_MS - exMs) / 1000);
        const t = exMs / EX_MS;
        scale = Math.cos(t * Math.PI * 0.5); // 1 → 0
      }

      setOrbScaleRaw((prev) => (Math.abs(prev - scale) > 0.02 ? scale : prev));
      setTrigeminalPulse((prev) => (Math.abs(prev - trigPulse) > 0.04 ? trigPulse : prev));
      setSecondsRemaining((prev) => (prev !== secsLeft ? secsLeft : prev));

      if (phase !== lastPhaseStateRef.current) {
        setPhaseState(phase);
        lastPhaseStateRef.current = phase;
        if (phase === "hold" && hapticEnabled) {
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

  // Particles ambient
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

  const primaryPrompt =
    phaseState === "hold" ? PROMPT_HOLD :
    phaseState === "ex" ? PROMPT_EX :
    PROMPT_IN;

  const bodyAnchor =
    phaseState === "hold" ? BODY_HOLD :
    phaseState === "ex" ? BODY_EX :
    BODY_IN;

  const cyclesCompleted = Math.min(cycleIdx, cycleCountTarget);
  const isHold = phaseState === "hold";
  const orbScale = 0.65 + orbScaleRaw * 0.55; // 0.65 → 1.20

  // 3 satélites = 3 dedos en frente — sólo visibles durante apnea
  const satelliteOpacity = isHold ? 0.55 + trigeminalPulse * 0.35 : 0;

  return (
    <div
      data-v2-apnea-frontal-press
      data-phase-state={phaseState}
      data-cycle-idx={cycleIdx}
      data-completed={completed ? "true" : "false"}
      data-testid="apnea-frontal-press-primitive"
      role="region"
      aria-label="Apnea voluntaria con presión frontal trigeminal"
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
        data-testid="apnea-frontal-phase-label"
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
        data-testid="apnea-frontal-instruction"
        aria-live="polite"
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: 17,
          fontWeight: isHold ? typography.weight.medium : typography.weight.light,
          letterSpacing: "-0.02em",
          color: isHold ? phaseColor : colors.text.strong,
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
          data-testid="apnea-frontal-particles"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: reduceMotion ? 0 : 0.13,
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

          {/* Orb central */}
          <circle
            cx="160" cy="160" r="48"
            fill={`url(#${auraId})`}
            opacity={isHold ? 0.88 : 0.65}
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
            opacity="0.93"
            style={{
              transform: `scale(${orbScale.toFixed(3)})`,
              transformOrigin: "160px 160px",
              transition: reduceMotion ? "none" : "transform 220ms ease-out",
            }}
          />

          {/* 3 satélites en arco superior — representan los 3 dedos en la frente.
              Solo visibles durante apnea con pulso trigeminal. */}
          {[0, 1, 2].map((i) => {
            // Arc top from -65° to -115° (over the head/forehead region)
            const angleDeg = -90 + (i - 1) * 18; // -108, -90, -72
            const angle = (angleDeg * Math.PI) / 180;
            const radius = 78;
            const cx = 160 + Math.cos(angle) * radius;
            const cy = 160 + Math.sin(angle) * radius;
            const pulseScale = 1.0 + trigeminalPulse * 0.25;
            return (
              <g key={`sat-${i}`} opacity={satelliteOpacity}
                 style={{ transition: reduceMotion ? "none" : "opacity 300ms ease-out" }}>
                <circle
                  cx={cx} cy={cy} r="9"
                  fill={phaseColor}
                  opacity="0.18"
                  style={{
                    transform: `scale(${pulseScale.toFixed(3)})`,
                    transformOrigin: `${cx.toFixed(2)}px ${cy.toFixed(2)}px`,
                    transition: reduceMotion ? "none" : "transform 220ms ease-out",
                  }}
                />
                <circle
                  cx={cx} cy={cy} r="4"
                  fill={phaseColor}
                  opacity="0.85"
                />
              </g>
            );
          })}

          {/* Arc sutil conectando satélites — solo en apnea */}
          {isHold && (
            <path
              d={`M ${160 + Math.cos((-108 * Math.PI) / 180) * 78} ${160 + Math.sin((-108 * Math.PI) / 180) * 78}
                  Q 160 ${160 + Math.sin((-90 * Math.PI) / 180) * 95} ${160 + Math.cos((-72 * Math.PI) / 180) * 78} ${160 + Math.sin((-72 * Math.PI) / 180) * 78}`}
              fill="none"
              stroke={phaseColor}
              strokeWidth="1"
              opacity={0.30 + trigeminalPulse * 0.20}
              strokeDasharray="2 4"
            />
          )}

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
        data-testid="apnea-frontal-body-anchor"
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
        data-testid="apnea-frontal-cycle-counter"
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
