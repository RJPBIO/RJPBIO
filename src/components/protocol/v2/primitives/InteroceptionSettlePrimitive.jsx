"use client";
/* ═══════════════════════════════════════════════════════════════
   InteroceptionSettlePrimitive — Phase 7 SP-N-1
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 2 "Sostén" del protocolo #15
   Suspiro Fisiológico. Interocepción post-suspiro — sentir qué
   cambió tras la intervención respiratoria.

   Mecanismo: Interocepción post-intervención consolida cambio
   fisiológico vía ínsula anterior (Khalsa 2018).

   3-stage interoception inquiry (30s total):
     Stage A — Atención (0-10s):
       - Primary: "Atención al cuerpo · Sin juzgar"
       - Subtitle: "¿Qué notas?"
       - Body anchor: "Solo observa"
     Stage B — Cambio (10-20s):
       - Primary: "¿Qué ha cambiado?"
       - Subtitle: "Después del suspiro"
       - Body anchor: "Compara con antes"
     Stage C — Sostén (20-30s):
       - Primary: "Quédate ahí · Sin moverte"
       - Subtitle: "Deja que se asiente"
       - Body anchor: "Sostén la calma"

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - Pure observation — no action required.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const PHASE_LABEL = "Sostén";

const STAGES = [
  {
    key: "attention",
    primary: "Atención al cuerpo · Sin juzgar",
    subtitle: "¿Qué notas?",
    anchor: "Solo observa",
  },
  {
    key: "change",
    primary: "¿Qué ha cambiado?",
    subtitle: "Después del suspiro",
    anchor: "Compara con antes",
  },
  {
    key: "settle",
    primary: "Quédate ahí · Sin moverte",
    subtitle: "Deja que se asiente",
    anchor: "Sostén la calma",
  },
];

const TOTAL_STAGES = STAGES.length;

/**
 * @param {object} props
 * @param {number} [props.duration_ms=30000]
 * @param {boolean} [props.audioEnabled]
 * @param {boolean} [props.hapticEnabled]
 * @param {boolean} [props.voiceEnabled]
 * @param {()=>void} [props.onComplete]
 */
export default function InteroceptionSettlePrimitive({
  duration_ms = 30000,
  audioEnabled = true,  
  hapticEnabled = true,
  voiceEnabled = false,  
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const phaseColor = getCyanForPhase(1); // cyan-cool phase 2 #67E8F9
  const uid = useId();
  const haloId = `isBlur-${uid}`;
  const vignetteId = `isVignette-${uid}`;
  const auraId = `isAura-${uid}`;

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const stageDurationMs = duration_ms / TOTAL_STAGES;

  const [stageIdx, setStageIdx] = useState(0);
  const [orbPulse, setOrbPulse] = useState(0);
  const [waveTick, setWaveTick] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(Math.ceil(duration_ms / 1000));
  const [completed, setCompleted] = useState(false);

  const lastStageRef = useRef(-1);

  // Main RAF tick
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
      }

      // Orb pulse — calm breath rhythm (~5s cycle)
      const orbT = (elapsed / 5000) % 1;
      const pulseVal = Math.sin(orbT * Math.PI * 2);
      setOrbPulse((prev) => (Math.abs(prev - pulseVal) > 0.05 ? pulseVal : prev));

      // Slow settling wave (~12s)
      const wTick = (elapsed / 12000) % 1;
      setWaveTick((prev) => (Math.abs(prev - wTick) > 0.02 ? wTick : prev));

      const secsLeft = Math.max(0, Math.ceil((duration_ms - elapsed) / 1000));
      setSecondsRemaining((prev) => (prev !== secsLeft ? secsLeft : prev));

      if (elapsed >= duration_ms) {
        stopped = true;
        setCompleted(true);
        if (hapticEnabled) {
          try { hapticProtocolSignature(15, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
        }
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [duration_ms, hapticEnabled, reduceMotion, stageDurationMs]);

  // Particles
  const particleCanvasRef = useRef(null);
  const particleSysRef = useRef(null);
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return undefined;
    canvas.width = 280;
    canvas.height = 360;
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
  const orbScale = 1.0 + orbPulse * 0.06;

  return (
    <div
      data-v2-interoception-settle
      data-stage-idx={stageIdx}
      data-stage-key={stage.key}
      data-completed={completed ? "true" : "false"}
      data-testid="interoception-settle-primitive"
      role="region"
      aria-label="Sostén interocéptivo, atención al cuerpo, sin moverte"
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
        data-testid="interoception-settle-phase-label"
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

      {/* DYNAMIC inquiry text */}
      <div
        data-testid="interoception-settle-instruction"
        aria-live="polite"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          paddingInline: spacing.s16,
          minHeight: 60,
          maxWidth: 340,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: 19,
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
            fontSize: 13,
            fontWeight: typography.weight.medium,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color: phaseColor,
            opacity: 0.85,
          }}
        >
          {stage.subtitle}
        </span>
      </div>

      <div
        style={{
          position: "relative",
          width: 280,
          height: 360,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <canvas
          ref={particleCanvasRef}
          data-testid="interoception-settle-particles"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: reduceMotion ? 0 : 0.16,
            transition: "opacity 200ms ease-out",
          }}
        />

        <svg
          aria-hidden="true"
          width="240"
          height="340"
          viewBox="0 0 240 340"
          style={{ position: "absolute" }}
        >
          <defs>
            <filter id={haloId} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
            <radialGradient id={vignetteId} cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.06" />
              <stop offset="60%" stopColor={phaseColor} stopOpacity="0.02" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.55" />
              <stop offset="50%" stopColor={phaseColor} stopOpacity="0.18" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="120" cy="170" rx="110" ry="160" fill={`url(#${vignetteId})`} />

          {/* Body silhouette — soft post-intervention glow */}
          <path
            d="M 120 36
               C 109 36, 100 46, 100 60
               C 100 70, 104 79, 110 84
               L 110 90
               C 100 92, 86 96, 82 108
               C 78 122, 76 138, 76 158
               L 76 196
               C 76 210, 78 222, 84 234
               L 88 248
               C 88 260, 90 270, 90 280
               L 90 308
               C 90 314, 94 318, 100 318
               L 108 318
               C 110 314, 112 308, 112 300
               L 112 250
               L 128 250
               L 128 300
               C 128 308, 130 314, 132 318
               L 140 318
               C 146 318, 150 314, 150 308
               L 150 280
               C 150 270, 152 260, 152 248
               L 156 234
               C 162 222, 164 210, 164 196
               L 164 158
               C 164 138, 162 122, 158 108
               C 154 96, 140 92, 130 90
               L 130 84
               C 136 79, 140 70, 140 60
               C 140 46, 131 36, 120 36 Z"
            fill="none"
            stroke={phaseColor}
            strokeWidth="0.8"
            opacity="0.55"
          />

          {/* Static landmarks */}
          <circle cx="120" cy="58" r="20" fill="none" stroke={phaseColor} strokeWidth="1.2" opacity="0.55" />
          {[{ x: 86, y: 100 }, { x: 154, y: 100 }].map((pt, i) => (
            <circle key={`sh-${i}`} cx={pt.x} cy={pt.y} r="5" fill={phaseColor} opacity="0.75" />
          ))}
          {[{ x1: 84, x2: 110 }, { x1: 130, x2: 156 }].map((seg, i) => (
            <line key={`ft-${i}`}
              x1={seg.x1} y1="320" x2={seg.x2} y2="320"
              stroke={phaseColor} strokeWidth="2" strokeLinecap="round"
              opacity="0.65"
            />
          ))}

          {/* CENTRAL settling halo — gentle breath pulse */}
          <circle
            cx="120" cy="170" r="60"
            fill={`url(#${auraId})`}
            opacity={0.55}
            filter={reduceMotion ? undefined : `url(#${haloId})`}
            style={{
              transform: `scale(${orbScale.toFixed(3)})`,
              transformOrigin: "120px 170px",
              transition: reduceMotion ? "none" : "transform 100ms linear",
            }}
          />

          {/* Settling wave — slow continuous outward */}
          {[0, 1].map((i) => {
            const offset = i / 2;
            const t = (waveTick + offset) % 1;
            const waveR = 70 + t * 60;
            const waveOpacity = (1 - t) * 0.25;
            return (
              <circle
                key={`wave-${i}`}
                cx="120" cy="170" r={waveR}
                fill="none"
                stroke={phaseColor}
                strokeWidth="0.6"
                opacity={waveOpacity}
                strokeDasharray="2 5"
              />
            );
          })}

          {/* Central core orb */}
          <circle
            cx="120" cy="170" r="10"
            fill={phaseColor}
            opacity="0.85"
            style={{
              transform: `scale(${orbScale.toFixed(3)})`,
              transformOrigin: "120px 170px",
              transition: reduceMotion ? "none" : "transform 100ms linear",
            }}
          />

          {/* Stage progression dots top */}
          {[0, 1, 2].map((i) => (
            <circle
              key={`stage-dot-${i}`}
              cx={104 + i * 16} cy="40" r="3"
              fill={phaseColor}
              opacity={i === stageIdx ? 0.95 : i < stageIdx ? 0.55 : 0.20}
              style={{ transition: reduceMotion ? "none" : "opacity 320ms ease-out" }}
            />
          ))}

          {/* Countdown top-right */}
          <text
            x="220" y="48"
            fontSize="22"
            fontFamily={typography.familyMono}
            fontWeight="300"
            fill={phaseColor}
            opacity={secondsRemaining > 0 ? 0.75 : 0.20}
            textAnchor="end"
            style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}
          >
            {secondsRemaining > 0 ? `${secondsRemaining}s` : ""}
          </text>
        </svg>
      </div>

      {/* Body anchor */}
      <span
        data-testid="interoception-settle-body-anchor"
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
          maxWidth: 320,
          transition: reduceMotion ? "none" : "opacity 220ms ease-out",
        }}
      >
        {stage.anchor}
      </span>

      {/* Stage counter */}
      <span
        data-testid="interoception-settle-stage-counter"
        aria-label={`Etapa ${stageIdx + 1} de ${TOTAL_STAGES}`}
        style={{
          fontFamily: typography.familyMono,
          fontSize: 11,
          letterSpacing: "0.12em",
          color: colors.text.muted,
          opacity: 0.55,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {stageIdx + 1} / {TOTAL_STAGES}
      </span>
    </div>
  );
}
