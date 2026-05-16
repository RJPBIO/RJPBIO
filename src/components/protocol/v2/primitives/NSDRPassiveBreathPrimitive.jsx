"use client";
/* ═══════════════════════════════════════════════════════════════
   NSDRPassiveBreathPrimitive — Phase 7 SP-P-3
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 3 "Respiración Pasiva" del
   protocolo #17 NSDR 10 min. 150s deepest NSDR observation state.

   IMPORTANT: User has eyes closed throughout (continuación Phase 2
   body scan). DEEPEST relaxation moment of NSDR. Visual ULTRA-
   minimal — voice-led primary, no countdown chip para no distraer
   (deja sumergirse más profundo).

   2-stage observation (150s total):
     Stage 1 (0-75s): "Observa la respiración"
     Stage 2 (75-150s): "Cuenta cada exhalación"

   Mecanismo: observación pasiva de respiración profundiza estado
   parasimpático sin control voluntario (mindfulness protocol).

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - Voice-led intended (catálogo voice.enabled_default:true).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature, speak } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const PHASE_LABEL = "Respiración Pasiva";

const STAGES = [
  {
    key: "observe",
    primary: "Solo observa la respiración",
    subtitle: "Sin controlar · Sin cambiar",
    anchor: "Como un testigo",
    voiceCue: "Solo observa la respiración. Sin controlar.",
  },
  {
    key: "count",
    primary: "Cuenta cada exhalación",
    subtitle: "Uno · Dos · Tres ...",
    anchor: "Si pierdes la cuenta, empieza otra vez",
    voiceCue: "Cuenta cada exhalación. Uno, dos, tres, y sigue.",
  },
];

const TOTAL_STAGES = STAGES.length;

/**
 * @param {object} props
 * @param {number} [props.duration_ms=150000]
 * @param {boolean} [props.audioEnabled]
 * @param {boolean} [props.hapticEnabled]
 * @param {boolean} [props.voiceEnabled]
 * @param {()=>void} [props.onComplete]
 */
export default function NSDRPassiveBreathPrimitive({
  duration_ms = 150000,
  audioEnabled = true,  
  hapticEnabled = true,
  voiceEnabled = false,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const phaseColor = getCyanForPhase(2); // cyan-warm phase3 (closing arc)
  const uid = useId();
  const haloId = `npBlur-${uid}`;
  const vignetteId = `npVignette-${uid}`;
  const auraId = `npAura-${uid}`;

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const stageDurationMs = duration_ms / TOTAL_STAGES;

  const [stageIdx, setStageIdx] = useState(0);
  const [pointPulse, setPointPulse] = useState(0);
  const [completed, setCompleted] = useState(false);

  const lastStageRef = useRef(-1);

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
      const stage = Math.min(TOTAL_STAGES - 1, Math.floor(elapsed / stageDurationMs));

      if (stage !== lastStageRef.current) {
        lastStageRef.current = stage;
        setStageIdx(stage);
        if (hapticEnabled && stage > 0) {
          try { hap("tap"); } catch {}
        }
        if (voiceEnabled) {
          try { speak(STAGES[stage].voiceCue); } catch {}
        }
      }

      // Very slow ambient rhythm (~7s)
      const breathT = (elapsed / 7000) % 1;
      const pulseVal = Math.sin(breathT * Math.PI * 2);
      setPointPulse((prev) => (Math.abs(prev - pulseVal) > 0.05 ? pulseVal : prev));

      if (elapsed >= duration_ms) {
        stopped = true;
        setCompleted(true);
        if (hapticEnabled) {
          try { hapticProtocolSignature(17, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
        }
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [duration_ms, hapticEnabled, voiceEnabled, reduceMotion, stageDurationMs]);

  // Voice cue initial
  useEffect(() => {
    if (voiceEnabled && !reduceMotion) {
      try { speak(STAGES[0].voiceCue); } catch {}
    }
  }, [voiceEnabled, reduceMotion]);

  // Particles ambient very subtle
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

  const stage = STAGES[stageIdx] || STAGES[0];
  const pointScale = 1.0 + pointPulse * 0.45;

  return (
    <div
      data-v2-nsdr-passive-breath
      data-stage-idx={stageIdx}
      data-stage-key={stage.key}
      data-completed={completed ? "true" : "false"}
      data-testid="nsdr-passive-breath-primitive"
      role="region"
      aria-label="NSDR respiración pasiva, observa y cuenta exhalaciones"
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
        data-testid="nsdr-passive-breath-phase-label"
        style={{
          fontFamily: typography.family,
          fontSize: 11,
          fontWeight: typography.weight.medium,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: phaseColor,
          opacity: 0.55,
        }}
      >
        {PHASE_LABEL}
      </span>

      {/* Stage primary + subtitle */}
      <div
        data-testid="nsdr-passive-breath-stage"
        aria-live="polite"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          paddingInline: spacing.s16,
          minHeight: 70,
          maxWidth: 360,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: 24,
            fontWeight: typography.weight.light,
            letterSpacing: "-0.02em",
            color: colors.text.strong,
            lineHeight: 1.25,
            textAlign: "center",
          }}
        >
          {stage.primary}
        </p>
        <span
          style={{
            fontFamily: typography.family,
            fontSize: 12,
            fontWeight: typography.weight.medium,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: phaseColor,
            opacity: 0.70,
          }}
        >
          {stage.subtitle}
        </span>
      </div>

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
          data-testid="nsdr-passive-breath-particles"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: reduceMotion ? 0 : 0.08, // ultra subtle (deepest)
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
              <feGaussianBlur stdDeviation="14" />
            </filter>
            <radialGradient id={vignetteId} cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.07" />
              <stop offset="60%" stopColor={phaseColor} stopOpacity="0.02" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.70" />
              <stop offset="50%" stopColor={phaseColor} stopOpacity="0.20" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="160" cy="160" rx="140" ry="140" fill={`url(#${vignetteId})`} />

          {/* Ambient pulsing point — deepest, smallest */}
          <circle
            cx="160" cy="160" r="38"
            fill={`url(#${auraId})`}
            opacity={0.35}
            filter={reduceMotion ? undefined : `url(#${haloId})`}
            style={{
              transform: `scale(${pointScale.toFixed(3)})`,
              transformOrigin: "160px 160px",
              transition: reduceMotion ? "none" : "transform 200ms linear",
            }}
          />
          <circle
            cx="160" cy="160" r="4"
            fill={phaseColor}
            opacity={0.70}
            style={{
              transform: `scale(${pointScale.toFixed(3)})`,
              transformOrigin: "160px 160px",
              transition: reduceMotion ? "none" : "transform 200ms linear",
            }}
          />

          {/* 2 stage progression dots top */}
          {[0, 1].map((i) => (
            <circle
              key={`stage-dot-${i}`}
              cx={152 + i * 16} cy="20" r="3"
              fill={phaseColor}
              opacity={i === stageIdx ? 0.85 : i < stageIdx ? 0.45 : 0.15}
              style={{ transition: reduceMotion ? "none" : "opacity 320ms ease-out" }}
            />
          ))}
          {/* Note: NO countdown chip — intentional para no distraer del estado profundo */}
        </svg>
      </div>

      {/* Body anchor */}
      <span
        data-testid="nsdr-passive-breath-body-anchor"
        aria-live="polite"
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.01em",
          color: colors.text.secondary,
          opacity: 0.60,
          textAlign: "center",
          minHeight: 22,
          maxWidth: 320,
          transition: reduceMotion ? "none" : "opacity 220ms ease-out",
        }}
      >
        {stage.anchor}
      </span>
    </div>
  );
}
