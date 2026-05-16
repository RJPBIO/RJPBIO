"use client";
/* ═══════════════════════════════════════════════════════════════
   NSDRReturnPrimitive — Phase 7 SP-P-4
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 4 "Retorno Gradual" del protocolo
   #17 NSDR 10 min. ÚLTIMA Phase NSDR. 90s gradual return.

   INVERSE de Phase 1: user comienza con ojos cerrados (deepest
   state heredado de Phase 3), gradualmente vuelve a awake mode.

   3-stage gradual return (90s = 30s/stage):
     Stage 1 (0-30s): "Atención vuelve" — mental return, eyes closed
     Stage 2 (30-60s): "Mueve dedos · Estírate" — body return, eyes closed
     Stage 3 (60-90s): "Abre los ojos cuando estés listo" — visual return

   Visual progression: brightness/opacity grows per stage (sleep →
   awake). Particle opacity 0.08 → 0.12 → 0.18. Ambient point
   smaller → larger. Countdown appears ONLY en stage 3.

   Mecanismo: retorno gradual evita disociación post-NSDR + reactiva
   atención exterocéptiva.

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - Voice-led intended (catálogo voice.enabled_default:true).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature, speak } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const PHASE_LABEL = "Retorno Gradual";

// Logic note: removed "abre los ojos" stage — eyes logic causaba
// confusión transversal. User vuelve naturalmente (eyes pueden o no
// haber estado cerrados). Visual progression sleep→awake retained.
const STAGES = [
  {
    key: "attention",
    primary: "Atención vuelve poco a poco",
    subtitle: "Sin prisa",
    anchor: "Nota dónde estás",
    voiceCue: "La atención vuelve poco a poco. Sin prisa.",
    brightness: 0.45, // dim
  },
  {
    key: "move",
    primary: "Mueve los dedos · Estírate",
    subtitle: "Suave · Despierto",
    anchor: "Dedos de manos y pies",
    voiceCue: "Mueve los dedos de manos y pies. Estírate suave.",
    brightness: 0.70, // mid
  },
  {
    key: "back",
    primary: "Toma tu tiempo · Bienvenido",
    subtitle: "Cuerpo descansado",
    anchor: "Mente clara · Listo para seguir",
    voiceCue: "Toma tu tiempo. Bienvenido de vuelta.",
    brightness: 0.95, // full
  },
];

const TOTAL_STAGES = STAGES.length;

/**
 * @param {object} props
 * @param {number} [props.duration_ms=90000]
 * @param {boolean} [props.audioEnabled]
 * @param {boolean} [props.hapticEnabled]
 * @param {boolean} [props.voiceEnabled]
 * @param {()=>void} [props.onComplete]
 */
export default function NSDRReturnPrimitive({
  duration_ms = 90000,
  audioEnabled = true,  
  hapticEnabled = true,
  voiceEnabled = false,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const phaseColor = getCyanForPhase(2); // cyan-warm closing
  const uid = useId();
  const haloId = `nrBlur-${uid}`;
  const vignetteId = `nrVignette-${uid}`;
  const auraId = `nrAura-${uid}`;

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const stageDurationMs = duration_ms / TOTAL_STAGES;

  const [stageIdx, setStageIdx] = useState(0);
  const [pointPulse, setPointPulse] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(Math.ceil(stageDurationMs / 1000));
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
      const inStageMs = elapsed - stage * stageDurationMs;

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

      // Speed up breath rhythm progressively (sleep ~7s → awake ~5s)
      const cyclePeriod = 7000 - (stage * 1000);
      const breathT = (elapsed / cyclePeriod) % 1;
      const pulseVal = Math.sin(breathT * Math.PI * 2);
      setPointPulse((prev) => (Math.abs(prev - pulseVal) > 0.05 ? pulseVal : prev));

      // Countdown only visible in last stage
      const secsLeft = Math.max(0, Math.ceil((stageDurationMs - inStageMs) / 1000));
      setSecondsRemaining((prev) => (prev !== secsLeft ? secsLeft : prev));

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

  const stage = STAGES[stageIdx] || STAGES[0];
  const pointScale = 1.0 + pointPulse * (0.35 + stageIdx * 0.10); // amplitude grows per stage
  const pointSize = 38 + stageIdx * 6; // 38 → 44 → 50
  const innerCoreSize = 4 + stageIdx * 1.5; // 4 → 5.5 → 7
  const particleOpacity = 0.08 + stageIdx * 0.05; // 0.08 → 0.13 → 0.18
  const phaseColorOpacity = 0.55 + stageIdx * 0.15; // 0.55 → 0.70 → 0.85
  const isLastStage = stageIdx === TOTAL_STAGES - 1;

  return (
    <div
      data-v2-nsdr-return
      data-stage-idx={stageIdx}
      data-stage-key={stage.key}
      data-completed={completed ? "true" : "false"}
      data-testid="nsdr-return-primitive"
      role="region"
      aria-label="NSDR retorno gradual, atención vuelve, mueve dedos, abre los ojos"
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
        data-testid="nsdr-return-phase-label"
        style={{
          fontFamily: typography.family,
          fontSize: 11,
          fontWeight: typography.weight.medium,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: phaseColor,
          opacity: phaseColorOpacity,
          transition: reduceMotion ? "none" : "opacity 600ms ease-out",
        }}
      >
        {PHASE_LABEL}
      </span>

      {/* Stage primary + subtitle */}
      <div
        data-testid="nsdr-return-stage"
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
            fontSize: 22,
            fontWeight: typography.weight.light,
            letterSpacing: "-0.02em",
            color: colors.text.strong,
            lineHeight: 1.25,
            textAlign: "center",
            opacity: stage.brightness,
            transition: reduceMotion ? "none" : "opacity 600ms ease-out",
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
            opacity: 0.55 + stageIdx * 0.10,
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
          data-testid="nsdr-return-particles"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: reduceMotion ? 0 : particleOpacity,
            transition: "opacity 600ms ease-out",
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
              <stop offset="0%" stopColor={phaseColor} stopOpacity={0.06 + stageIdx * 0.02} />
              <stop offset="60%" stopColor={phaseColor} stopOpacity="0.02" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity={0.65 + stageIdx * 0.10} />
              <stop offset="50%" stopColor={phaseColor} stopOpacity="0.22" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="160" cy="160" rx="140" ry="140" fill={`url(#${vignetteId})`} />

          {/* Ambient pulsing point — grows per stage */}
          <circle
            cx="160" cy="160" r={pointSize}
            fill={`url(#${auraId})`}
            opacity={0.35 + stageIdx * 0.10}
            filter={reduceMotion ? undefined : `url(#${haloId})`}
            style={{
              transform: `scale(${pointScale.toFixed(3)})`,
              transformOrigin: "160px 160px",
              transition: reduceMotion ? "none" : "transform 200ms linear, opacity 600ms ease-out, r 600ms ease-out",
            }}
          />
          <circle
            cx="160" cy="160" r={innerCoreSize}
            fill={phaseColor}
            opacity={0.70 + stageIdx * 0.08}
            style={{
              transform: `scale(${pointScale.toFixed(3)})`,
              transformOrigin: "160px 160px",
              transition: reduceMotion ? "none" : "transform 200ms linear, opacity 600ms ease-out, r 600ms ease-out",
            }}
          />

          {/* 3 stage progression dots top */}
          {[0, 1, 2].map((i) => (
            <circle
              key={`stage-dot-${i}`}
              cx={144 + i * 16} cy="20" r="3"
              fill={phaseColor}
              opacity={i === stageIdx ? 0.95 : i < stageIdx ? 0.55 : 0.20}
              style={{ transition: reduceMotion ? "none" : "opacity 320ms ease-out" }}
            />
          ))}

          {/* Countdown — visible only en last stage (eyes open, time-aware again) */}
          {isLastStage && (
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
          )}
        </svg>
      </div>

      {/* Body anchor */}
      <span
        data-testid="nsdr-return-body-anchor"
        aria-live="polite"
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.01em",
          color: colors.text.secondary,
          opacity: 0.60 + stageIdx * 0.10,
          textAlign: "center",
          minHeight: 22,
          maxWidth: 320,
          transition: reduceMotion ? "none" : "opacity 600ms ease-out",
        }}
      >
        {stage.anchor}
      </span>
    </div>
  );
}
