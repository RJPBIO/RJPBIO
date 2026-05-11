"use client";
/* ═══════════════════════════════════════════════════════════════
   CognitiveOpeningPrimitive — Phase 7 SP-M-3
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 3 "Apertura Cognitiva" del
   protocolo #12 Neural Ascension. PRIMER primitive cognitivo
   (no body-focused) en cadena Tier 2 dedicated. Central focal
   orb + thought waves radiantes + question text emphasis con
   3-stage reflection per micro-time window.

   Mecanismo: atención focalizada single-task reduce decision
   fatigue (Baumeister 2008).

   3-stage reflection (25s total):
     Stage A — Pregunta (0-8s):
       - Primary big: "¿Qué decisión necesito tomar con claridad?"
       - Subtitle: "Una sola."
       - Body anchor: "Abre la mente · Sin prisa"
       - Orb: gentle pulse expand
       - Waves: subtle radial expand
     Stage B — Identifica (8-16s):
       - Primary big: "Identifica UNA decisión concreta"
       - Subtitle: "La que importa ahora"
       - Body anchor: "Una sola decisión emerge"
       - Orb: peak intensity
       - Waves: brighter
     Stage C — Mantén (16-25s):
       - Primary big: "Mantén la decisión clara"
       - Subtitle: "Sin dudar · Sin cambiar"
       - Body anchor: "Esa es · Mantén el foco"
       - Orb: steady glow
       - Waves: settled

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - Reflexión mental — sin acción física requerida.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const PHASE_LABEL = "Apertura Cognitiva";

const STAGES = [
  {
    key: "question",
    primary: "¿Qué decisión necesito tomar con claridad?",
    subtitle: "Una sola.",
    anchor: "Abre la mente · Sin prisa",
  },
  {
    key: "identify",
    primary: "Identifica UNA decisión concreta",
    subtitle: "La que importa ahora",
    anchor: "Una sola decisión emerge",
  },
  {
    key: "hold",
    primary: "Mantén la decisión clara",
    subtitle: "Sin dudar · Sin cambiar",
    anchor: "Esa es · Mantén el foco",
  },
];

const TOTAL_STAGES = STAGES.length;

/**
 * @param {object} props
 * @param {number} [props.duration_ms=25000]
 * @param {boolean} [props.audioEnabled]
 * @param {boolean} [props.hapticEnabled]
 * @param {boolean} [props.voiceEnabled]
 * @param {()=>void} [props.onComplete]
 */
export default function CognitiveOpeningPrimitive({
  duration_ms = 25000,
  audioEnabled = true, // eslint-disable-line no-unused-vars
  hapticEnabled = true,
  voiceEnabled = false, // eslint-disable-line no-unused-vars
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const phaseColor = getCyanForPhase(2); // cyan-warm phase3 #06B6D4
  const uid = useId();
  const haloId = `coBlur-${uid}`;
  const vignetteId = `coVignette-${uid}`;
  const auraId = `coAura-${uid}`;

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

      // Orb pulse — gentle breath rhythm (~6s cycle)
      const orbT = (elapsed / 6000) % 1;
      const pulseVal = Math.sin(orbT * Math.PI * 2);
      setOrbPulse((prev) => (Math.abs(prev - pulseVal) > 0.05 ? pulseVal : prev));

      // Wave tick — slow continuous (~10s)
      const wTick = (elapsed / 10000) % 1;
      setWaveTick((prev) => (Math.abs(prev - wTick) > 0.02 ? wTick : prev));

      const secsLeft = Math.max(0, Math.ceil((duration_ms - elapsed) / 1000));
      setSecondsRemaining((prev) => (prev !== secsLeft ? secsLeft : prev));

      if (elapsed >= duration_ms) {
        stopped = true;
        setCompleted(true);
        if (hapticEnabled) {
          try { hapticProtocolSignature(12, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
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

  // Stage intensity — peaks at identify, settles at hold
  const stageIntensity = stageIdx === 0 ? 0.55 : stageIdx === 1 ? 0.95 : 0.80;

  // Orb scale: 1.0 base + breath pulse 0.06 amplitude
  const orbScale = 1.0 + orbPulse * 0.06;

  return (
    <div
      data-v2-cognitive-opening
      data-stage-idx={stageIdx}
      data-stage-key={stage.key}
      data-completed={completed ? "true" : "false"}
      data-testid="cognitive-opening-primitive"
      role="region"
      aria-label="Apertura cognitiva, identifica una decisión con claridad"
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
        data-testid="cognitive-opening-phase-label"
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

      {/* PRIMARY QUESTION — large emphasis text */}
      <div
        data-testid="cognitive-opening-question"
        aria-live="polite"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          paddingInline: spacing.s16,
          minHeight: 72,
          maxWidth: 340,
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
            transition: reduceMotion ? "none" : "color 320ms ease-out",
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
          width: 320,
          height: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <canvas
          ref={particleCanvasRef}
          data-testid="cognitive-opening-particles"
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

        <svg
          aria-hidden="true"
          width="320"
          height="320"
          viewBox="0 0 320 320"
          style={{ position: "absolute" }}
        >
          <defs>
            <filter id={haloId} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="8" />
            </filter>
            <radialGradient id={vignetteId} cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.08" />
              <stop offset="60%" stopColor={phaseColor} stopOpacity="0.02" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.85" />
              <stop offset="40%" stopColor={phaseColor} stopOpacity="0.45" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Vignette */}
          <ellipse cx="160" cy="160" rx="140" ry="140" fill={`url(#${vignetteId})`} />

          {/* THOUGHT WAVES — 3 concentric radial waves expanding outward continuously */}
          {[0, 1, 2].map((i) => {
            const offset = i / 3;
            const t = (waveTick + offset) % 1;
            const waveR = 60 + t * 100;
            const waveOpacity = (1 - t) * 0.35 * stageIntensity;
            return (
              <circle
                key={`wave-${i}`}
                cx="160" cy="160" r={waveR}
                fill="none"
                stroke={phaseColor}
                strokeWidth="0.8"
                opacity={waveOpacity}
                strokeDasharray="3 4"
              />
            );
          })}

          {/* Outer halo aura */}
          <circle
            cx="160" cy="160" r="80"
            fill={`url(#${auraId})`}
            opacity={stageIntensity * 0.55}
            filter={reduceMotion ? undefined : `url(#${haloId})`}
            style={{
              transform: `scale(${orbScale.toFixed(3)})`,
              transformOrigin: "160px 160px",
              transition: reduceMotion ? "none" : "transform 100ms linear, opacity 320ms ease-out",
            }}
          />

          {/* CENTRAL FOCAL ORB */}
          <circle
            cx="160" cy="160" r="36"
            fill={`url(#${auraId})`}
            opacity={stageIntensity * 0.95}
            style={{
              transform: `scale(${orbScale.toFixed(3)})`,
              transformOrigin: "160px 160px",
              transition: reduceMotion ? "none" : "transform 100ms linear, opacity 320ms ease-out",
            }}
          />

          {/* Inner core dot */}
          <circle
            cx="160" cy="160" r="6"
            fill={phaseColor}
            opacity={0.95}
            style={{
              transform: `scale(${orbScale.toFixed(3)})`,
              transformOrigin: "160px 160px",
              transition: reduceMotion ? "none" : "transform 100ms linear",
            }}
          />

          {/* Stage progression dots — 3 dots at top showing stage position */}
          {[0, 1, 2].map((i) => (
            <circle
              key={`stage-dot-${i}`}
              cx={144 + i * 16} cy="40" r="3"
              fill={phaseColor}
              opacity={i === stageIdx ? 0.95 : i < stageIdx ? 0.55 : 0.20}
              style={{ transition: reduceMotion ? "none" : "opacity 320ms ease-out" }}
            />
          ))}

          {/* Countdown chip top-right */}
          <text
            x="290" y="50"
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
        data-testid="cognitive-opening-body-anchor"
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
          transition: reduceMotion ? "none" : "opacity 320ms ease-out",
        }}
      >
        {stage.anchor}
      </span>

      {/* Stage counter */}
      <span
        data-testid="cognitive-opening-stage-counter"
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
