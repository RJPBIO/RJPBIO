"use client";
/* ═══════════════════════════════════════════════════════════════
   HummingPreparationPrimitive — Phase 7 SP-U-1
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 1 "Preparación" del protocolo
   #22 Vagal Hum Reset (active tier, calma intent).

   Mecanismo:
     Preparación postural + respiración nasal 4-4 estabiliza
     estado pre-vocalización (humming). Boca cerrada con lengua
     relajada es prerequisito anatomical para Bhramari pranayama.

   Visual signature — break-pattern vs breath_orb genérico:
     - Central breath orb (4-4 cadence) con halo + inner glow.
     - 3 micro-indicadores posturales arriba (columna · boca ·
       lengua), iluminándose secuencialmente durante prep.
     - Body anchor: "Postura erguida · Listo para humming".
     - Wave 1+2+3 elevadores: mount fade-in, idle breath, etc.

   Active tier compliance:
     - validate.kind: "min_duration", min_ms: 25000.
     - voice.enabled_default: false.
     - binaural.action: "start", type: "calma".
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { useMountFade } from "./useMountFade";

const PHASE_LABEL = "Preparación · Humming";
const PROMPT_MAIN = "Boca cerrada. Respira nasal.";
const PROMPT_HINT = "Inhala 4. Exhala 4.";
const BODY_ANCHOR = "Postura erguida · Listo para humming";

const POSTURE_CHECKS = ["Columna erguida", "Boca cerrada", "Lengua relajada"];

/**
 * @param {object} props
 * @param {number} [props.durationMs=30000]
 * @param {boolean} [props.hapticEnabled]
 * @param {()=>void} [props.onComplete]
 */
export default function HummingPreparationPrimitive({
  durationMs = 30000,
  hapticEnabled = true,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const mountFade = useMountFade({ reduceMotion });
  const phaseColor = getCyanForPhase(0); // deep cyan — entry of #22 chain
  const uid = useId();
  const haloId = `hpBlur-${uid}`;
  const vignetteId = `hpVignette-${uid}`;
  const auraId = `hpAura-${uid}`;

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const [breathPhase, setBreathPhase] = useState(0); // 0-1 sine cycle
  const [postureIdx, setPostureIdx] = useState(-1); // index of last activated check
  const [secondsRemaining, setSecondsRemaining] = useState(Math.ceil(durationMs / 1000));
  const [completed, setCompleted] = useState(false);

  const lastPostureRef = useRef(-1);

  useEffect(() => {
    if (reduceMotion) {
      const t = setTimeout(() => {
        setPostureIdx(POSTURE_CHECKS.length - 1);
        setCompleted(true);
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
      }, 1500);
      return () => clearTimeout(t);
    }

    let stopped = false;
    let raf;
    const startTime = performance.now();
    const cycleMs = 8000; // 4s in + 4s ex

    const tick = (now) => {
      if (stopped) return;
      const elapsed = now - startTime;
      const ratio = Math.min(elapsed / durationMs, 1);

      setBreathPhase((Math.sin((elapsed / cycleMs) * Math.PI * 2 - Math.PI / 2) + 1) * 0.5);

      // Activate posture checks at 25%, 50%, 75% of duration
      const nextPosture = Math.min(POSTURE_CHECKS.length - 1, Math.floor(ratio * 4));
      if (nextPosture !== lastPostureRef.current && nextPosture >= 0) {
        lastPostureRef.current = nextPosture;
        setPostureIdx(nextPosture);
        if (hapticEnabled) {
          try { hap("tap"); } catch {}
        }
      }

      const secs = Math.max(0, Math.ceil((durationMs - elapsed) / 1000));
      setSecondsRemaining((prev) => (prev !== secs ? secs : prev));

      if (ratio >= 1) {
        stopped = true;
        setCompleted(true);
        if (hapticEnabled) {
          try { hapticProtocolSignature(22, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
        }
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [durationMs, hapticEnabled, reduceMotion]);

  // Orb scale: 1.0 (mid) → 1.18 (full inhale) → 1.0 → 0.85 (full exhale) → 1.0
  const orbScale = 1.0 + (breathPhase - 0.5) * 0.36;

  return (
    <div
      data-v2-humming-preparation
      data-completed={completed ? "true" : "false"}
      data-testid="humming-preparation-primitive"
      role="region"
      aria-label="Preparación postural para humming"
      style={{
        width: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.s20,
        opacity: mountFade.opacity,
        transform: mountFade.transform,
      }}
    >
      <span
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
        aria-live="polite"
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: 19,
          fontWeight: typography.weight.medium,
          letterSpacing: "-0.02em",
          color: phaseColor,
          lineHeight: 1.25,
          textAlign: "center",
          maxWidth: 320,
          paddingInline: spacing.s16,
        }}
      >
        {PROMPT_MAIN}
      </p>

      <span
        style={{
          fontFamily: typography.family,
          fontSize: 13,
          fontWeight: typography.weight.light,
          color: colors.text.muted,
          opacity: 0.65,
          textAlign: "center",
        }}
      >
        {PROMPT_HINT}
      </span>

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
        <svg
          aria-hidden="true"
          width="320" height="320" viewBox="0 0 320 320"
          style={{ position: "absolute" }}
        >
          <defs>
            <filter id={haloId} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="8" />
            </filter>
            <radialGradient id={vignetteId} cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.08" />
              <stop offset="60%" stopColor={phaseColor} stopOpacity="0.02" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.55" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`hpSpine-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.0" />
              <stop offset="20%" stopColor={phaseColor} stopOpacity="0.40" />
              <stop offset="50%" stopColor={phaseColor} stopOpacity="0.70" />
              <stop offset="80%" stopColor={phaseColor} stopOpacity="0.40" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <ellipse cx="160" cy="160" rx="140" ry="140" fill={`url(#${vignetteId})`} />

          {/* Vertical posture column — 3 vertebrae horizontal bars conectadas por línea central.
              Cada vertebra activa secuencialmente con el posture check correspondiente.
              Subtle breathing pulse vertical compress/expand. */}

          {/* Head dot (top anchor) */}
          <circle
            cx="160" cy="55" r="5"
            fill={phaseColor}
            opacity={(0.55 + breathPhase * 0.20).toFixed(3)}
          />

          {/* Spine vertical line con gradient (fades top/bottom) */}
          <line
            x1="160" y1="62" x2="160" y2="266"
            stroke={`url(#hpSpine-${uid})`}
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* 3 vertebrae horizontal bars con activation sequential.
              Posiciones: y=100 (Columna), y=160 (Boca), y=220 (Lengua) */}
          {POSTURE_CHECKS.map((check, i) => {
            const vy = 100 + i * 60;
            const active = i <= postureIdx;
            const justActivated = i === postureIdx;
            const barWidth = active ? (justActivated ? 56 : 48) : 28;
            return (
              <g key={`vert-${i}`}>
                {/* Aura glow when active */}
                {active && (
                  <circle
                    cx="160" cy={vy} r={justActivated ? 22 : 14}
                    fill={`url(#${auraId})`}
                    opacity={justActivated ? 0.85 : 0.45}
                    filter={reduceMotion ? undefined : `url(#${haloId})`}
                    style={{ transition: reduceMotion ? "none" : "opacity 380ms ease-out, r 380ms ease-out" }}
                  />
                )}
                {/* Vertebra bar */}
                <line
                  x1={160 - barWidth / 2} y1={vy}
                  x2={160 + barWidth / 2} y2={vy}
                  stroke={phaseColor}
                  strokeWidth={active ? 2.4 : 1.4}
                  strokeLinecap="round"
                  opacity={active ? 0.95 : 0.40}
                  style={{ transition: reduceMotion ? "none" : "opacity 380ms ease-out, stroke-width 380ms ease-out, x1 380ms ease-out, x2 380ms ease-out" }}
                />
                {/* Checkmark micro-glyph centered cuando active */}
                {active && (
                  <circle
                    cx="160" cy={vy} r="2.5"
                    fill={phaseColor}
                    opacity="0.95"
                  />
                )}
              </g>
            );
          })}

          {/* Base dot (bottom anchor) */}
          <circle
            cx="160" cy="273" r="5"
            fill={phaseColor}
            opacity={(0.55 + breathPhase * 0.20).toFixed(3)}
          />

          {/* Posture check labels al lado de cada vertebra */}
          {POSTURE_CHECKS.map((check, i) => {
            const vy = 100 + i * 60;
            const active = i <= postureIdx;
            return (
              <text
                key={`lbl-${i}`}
                x="208" y={vy + 4}
                fontSize="12"
                fontFamily={typography.family}
                fontWeight={active ? "500" : "300"}
                fill={active ? phaseColor : colors.text.muted}
                opacity={active ? 0.95 : 0.40}
                style={{
                  letterSpacing: "-0.01em",
                  transition: reduceMotion ? "none" : "opacity 380ms ease-out, fill 380ms ease-out",
                }}
              >
                {check}
              </text>
            );
          })}

          {/* Countdown bottom */}
          <text
            x="160" y="300"
            fontSize="11"
            fontFamily={typography.familyMono}
            fontWeight="300"
            fill={colors.text.muted}
            opacity="0.50"
            textAnchor="middle"
            style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "0.10em" }}
          >
            {secondsRemaining}s
          </text>
        </svg>
      </div>

      <span
        aria-live="polite"
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.light,
          color: colors.text.secondary,
          opacity: 0.74,
          textAlign: "center",
          minHeight: 22,
        }}
      >
        {BODY_ANCHOR}
      </span>
    </div>
  );
}
