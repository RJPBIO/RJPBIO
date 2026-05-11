"use client";
/* ═══════════════════════════════════════════════════════════════
   NSDRConfigurationPrimitive — Phase 7 SP-P-1
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 1 "Configuración" del protocolo
   #17 NSDR 10 min (Non-Sleep Deep Rest, voice-led TTS auto-on,
   Huberman 2021).

   Break-pattern intentional: PRIMER primitive sleep/twilight
   aesthetic. NO orb canonical, NO body silhouette. Visual super
   minimal porque user va a cerrar los ojos en seguida.

   3-stage transition (60s total = 20s per stage):
     Stage 1 (0-20s): "Encuentra postura cómoda"
     Stage 2 (20-40s): "Cierra los ojos"
     Stage 3 (40-60s): "Respira natural"

   Visual signature:
     - Ambient particle field muy subtle (sleep-mode aesthetic)
     - Tiny pulsing point centered (~6-7s breath rhythm)
     - Large primary message + subtitle cyan
     - Body anchor
     - 3 stage progression dots
     - Backdrop progressively dimmer per stage (encourages eye closure)

   Mecanismo: postura supina + ojos cerrados activa default mode
   network preparado para body scan profundo (Huberman protocol).

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - Voice-led intended (catálogo voice.enabled_default:true).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature, speak } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const PHASE_LABEL = "Configuración";

// Logic note: removed "cierra los ojos" stage — causaba confusión
// transversal (user opens/closes eyes naturally durante NSDR sin
// instrucción explícita). Voice-led guide handles cuando aplica.
const STAGES = [
  {
    key: "posture",
    primary: "Encuentra una postura cómoda",
    subtitle: "Acuéstate o siéntate",
    anchor: "Sin tensión en el cuerpo",
    voiceCue: "Encuentra una postura cómoda",
  },
  {
    key: "settle",
    primary: "Respira natural",
    subtitle: "Sin controlar",
    anchor: "Suelta el cuerpo",
    voiceCue: "Respira natural · Suelta el cuerpo",
  },
  {
    key: "calm",
    primary: "Deja que la atención se calme",
    subtitle: "La voz te guía",
    anchor: "Sin esfuerzo",
    voiceCue: "Deja que la atención se calme · La voz te guía",
  },
];

const TOTAL_STAGES = STAGES.length;

/**
 * @param {object} props
 * @param {number} [props.duration_ms=60000]
 * @param {boolean} [props.audioEnabled]
 * @param {boolean} [props.hapticEnabled]
 * @param {boolean} [props.voiceEnabled]
 * @param {()=>void} [props.onComplete]
 */
export default function NSDRConfigurationPrimitive({
  duration_ms = 60000,
  audioEnabled = true, // eslint-disable-line no-unused-vars
  hapticEnabled = true,
  voiceEnabled = false,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const phaseColor = getCyanForPhase(0); // cyan-deep phase1
  const uid = useId();
  const haloId = `nsBlur-${uid}`;
  const vignetteId = `nsVignette-${uid}`;
  const auraId = `nsAura-${uid}`;

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const stageDurationMs = duration_ms / TOTAL_STAGES;

  const [stageIdx, setStageIdx] = useState(0);
  const [pointPulse, setPointPulse] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(Math.ceil(duration_ms / 1000));
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

      // Very slow breath rhythm (~7s cycle — closer to natural rest rate)
      const breathT = (elapsed / 7000) % 1;
      const pulseVal = Math.sin(breathT * Math.PI * 2);
      setPointPulse((prev) => (Math.abs(prev - pulseVal) > 0.05 ? pulseVal : prev));

      const secsLeft = Math.max(0, Math.ceil((duration_ms - elapsed) / 1000));
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

  // Voice cue stage 1 (initial mount)
  useEffect(() => {
    if (voiceEnabled && !reduceMotion) {
      try { speak(STAGES[0].voiceCue); } catch {}
    }
  }, [voiceEnabled, reduceMotion]);

  // Particles ambient subtle
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
  const pointScale = 1.0 + pointPulse * 0.5;

  return (
    <div
      data-v2-nsdr-configuration
      data-stage-idx={stageIdx}
      data-stage-key={stage.key}
      data-completed={completed ? "true" : "false"}
      data-testid="nsdr-configuration-primitive"
      role="region"
      aria-label="Configuración NSDR, encuentra postura cómoda y cierra los ojos"
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
        data-testid="nsdr-configuration-phase-label"
        style={{
          fontFamily: typography.family,
          fontSize: 11,
          fontWeight: typography.weight.medium,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: phaseColor,
          opacity: 0.6, // dimmer than usual (sleep mode)
        }}
      >
        {PHASE_LABEL}
      </span>

      {/* Large primary message */}
      <div
        data-testid="nsdr-configuration-message"
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
            fontSize: 26,
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
            opacity: 0.7,
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
          data-testid="nsdr-configuration-particles"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: reduceMotion ? 0 : 0.10, // very subtle (sleep mode)
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
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.08" />
              <stop offset="60%" stopColor={phaseColor} stopOpacity="0.02" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.80" />
              <stop offset="50%" stopColor={phaseColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Cinematic vignette dim */}
          <ellipse cx="160" cy="160" rx="140" ry="140" fill={`url(#${vignetteId})`} />

          {/* Ambient pulsing point — very slow breath rhythm */}
          <circle
            cx="160" cy="160" r="42"
            fill={`url(#${auraId})`}
            opacity={0.40}
            filter={reduceMotion ? undefined : `url(#${haloId})`}
            style={{
              transform: `scale(${pointScale.toFixed(3)})`,
              transformOrigin: "160px 160px",
              transition: reduceMotion ? "none" : "transform 200ms linear",
            }}
          />
          <circle
            cx="160" cy="160" r="5"
            fill={phaseColor}
            opacity={0.75}
            style={{
              transform: `scale(${pointScale.toFixed(3)})`,
              transformOrigin: "160px 160px",
              transition: reduceMotion ? "none" : "transform 200ms linear",
            }}
          />

          {/* 3 stage progression dots top */}
          {[0, 1, 2].map((i) => (
            <circle
              key={`stage-dot-${i}`}
              cx={144 + i * 16} cy="20" r="3"
              fill={phaseColor}
              opacity={i === stageIdx ? 0.85 : i < stageIdx ? 0.50 : 0.18}
              style={{ transition: reduceMotion ? "none" : "opacity 320ms ease-out" }}
            />
          ))}

          {/* Bottom countdown — small mono */}
          <text
            x="160" y="300"
            fontSize="13"
            fontFamily={typography.familyMono}
            fontWeight="300"
            fill={colors.text.muted}
            opacity={secondsRemaining > 0 ? 0.55 : 0.20}
            textAnchor="middle"
            style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "0.10em" }}
          >
            {secondsRemaining > 0 ? `${secondsRemaining}s` : ""}
          </text>
        </svg>
      </div>

      {/* Body anchor */}
      <span
        data-testid="nsdr-configuration-body-anchor"
        aria-live="polite"
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.01em",
          color: colors.text.secondary,
          opacity: 0.65,
          textAlign: "center",
          minHeight: 22,
          transition: reduceMotion ? "none" : "opacity 220ms ease-out",
        }}
      >
        {stage.anchor}
      </span>
    </div>
  );
}
