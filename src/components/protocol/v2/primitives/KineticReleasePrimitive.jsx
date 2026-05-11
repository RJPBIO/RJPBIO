"use client";
/* ═══════════════════════════════════════════════════════════════
   KineticReleasePrimitive — Phase 7 SP-S-1
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 1 "Sacudida Física" del
   protocolo #20 Block Break (Crisis Cognitiva).

   Mecanismo:
     Sacudida vigorosa de las manos interrumpe la paralysis
     cognitiva y eleva circulación cerebral inmediata.
     Re-arranca activación motora bilateral acelerada (TRE /
     Levine somatic experiencing) que descarga tensión y
     reactiva córtex prefrontal post-bloqueo.

   Single-hand phone resolución:
     Instrucción adapta: "Sacude las manos vigorosamente.
     Si tienes el teléfono, deja o sacude la mano libre."
     No fuerza dejar el teléfono.

   Visual signature — break-pattern vs #19 chain (vagal orbs):
     - Energy core central con jitter de alta frecuencia
       (representa el estado de tensión liberándose).
     - Particles burst que vuelan radialmente hacia afuera
       con trail-blur (kinetic release symbolic).
     - Líneas radiales de energía que pulsan rítmicamente.
     - Contador descendente prominente "25s" → "0s".

   Crisis tier compliance:
     - no_validation, voice TTS, binaural start "energia".
     - Skip option permitida (crisis_no_pressure).
     - Sin sonido emitido por el primitive.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { useMountFade } from "./useMountFade";

const PHASE_LABEL = "Sacudida · Romper Inercia";

const PROMPT_MAIN = "Sacude vigorosamente";
const PROMPT_HINT = "Como si tiraras agua de las manos";
const BODY_ANCHOR = "Mano libre · Brazo suelto";

const PARTICLE_COUNT = 22;
const RADIAL_LINES = 10;
const SPEED_LINE_COUNT = 6;

/**
 * @param {object} props
 * @param {number} [props.durationMs=25000]
 * @param {boolean} [props.hapticEnabled]
 * @param {()=>void} [props.onComplete]
 */
export default function KineticReleasePrimitive({
  durationMs = 25000,
  hapticEnabled = true,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const mountFade = useMountFade({ reduceMotion });
  const phaseColor = getCyanForPhase(0); // deep cyan — energy start of crisis cognitiva chain
  const uid = useId();
  const haloId = `krBlur-${uid}`;
  const vignetteId = `krVignette-${uid}`;
  const auraId = `krAura-${uid}`;

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const [secondsRemaining, setSecondsRemaining] = useState(Math.ceil(durationMs / 1000));
  const [jitterX, setJitterX] = useState(0);
  const [jitterY, setJitterY] = useState(0);
  const [pulseTick, setPulseTick] = useState(0);
  const [coreThrob, setCoreThrob] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Particles state — array of {id, angle, distance, opacity, scale, trail}
  const [particles, setParticles] = useState(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      angle: (i / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.4,
      distance: 24 + Math.random() * 14,
      opacity: 0.55 + Math.random() * 0.30,
      scale: 0.6 + Math.random() * 0.9,
      speed: 1.2 + Math.random() * 1.4,
    }))
  );

  // Speed lines — short radial dashes that flash and fade
  const [speedLines, setSpeedLines] = useState(() =>
    Array.from({ length: SPEED_LINE_COUNT }, (_, i) => ({
      id: i,
      angle: Math.random() * Math.PI * 2,
      length: 14 + Math.random() * 16,
      opacity: 0,
      startR: 40,
    }))
  );

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
    let lastHap = 0;

    const tick = (now) => {
      if (stopped) return;
      const elapsed = now - startTime;
      const ratio = Math.min(elapsed / durationMs, 1);
      // Intensity curve: peak at start (1.5x first 2s), decays to 0.4x at end
      const earlyBoost = Math.max(0, 1 - elapsed / 2000) * 0.5;
      const intensity = (1 - ratio * 0.55) + earlyBoost;

      // Jitter: high-freq random offsets, more violent al inicio
      setJitterX((Math.random() - 0.5) * 11 * intensity);
      setJitterY((Math.random() - 0.5) * 8 * intensity);

      // Pulse tick — 6 Hz radial line pulse
      setPulseTick((elapsed / 160) % 1);

      // Core throb — heartbeat-like 3 Hz fluctuation in core size
      setCoreThrob(Math.sin(elapsed / 320) * 0.5 + 0.5);

      // Particles update — bursting outward con trail decay
      setParticles((prev) =>
        prev.map((p) => {
          const newDistance = p.distance + p.speed * intensity;
          const newOpacity = Math.max(0, p.opacity - 0.022);
          if (newDistance > 130 || newOpacity <= 0.04) {
            return {
              ...p,
              angle: Math.random() * Math.PI * 2,
              distance: 22 + Math.random() * 14,
              opacity: 0.55 + Math.random() * 0.35,
              scale: 0.55 + Math.random() * 1.05,
              speed: 1.2 + Math.random() * 1.5,
            };
          }
          return { ...p, distance: newDistance, opacity: newOpacity };
        })
      );

      // Speed lines — flash radial dashes random angles
      setSpeedLines((prev) =>
        prev.map((s) => {
          const newOp = s.opacity > 0 ? s.opacity - 0.08 : 0;
          if (newOp <= 0 && Math.random() < 0.18 * intensity) {
            return {
              ...s,
              angle: Math.random() * Math.PI * 2,
              length: 14 + Math.random() * 20,
              startR: 44 + Math.random() * 8,
              opacity: 0.60 + Math.random() * 0.30,
            };
          }
          return { ...s, opacity: newOp };
        })
      );

      const secsLeft = Math.max(0, Math.ceil((durationMs - elapsed) / 1000));
      setSecondsRemaining((prev) => (prev !== secsLeft ? secsLeft : prev));

      // Haptic burst cada 2s
      if (hapticEnabled && elapsed - lastHap > 2000 && elapsed < durationMs - 500) {
        lastHap = elapsed;
        try { hap("tap"); } catch {}
      }

      if (elapsed >= durationMs) {
        stopped = true;
        setCompleted(true);
        if (hapticEnabled) {
          try { hapticProtocolSignature(20, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
        }
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [durationMs, hapticEnabled, reduceMotion]);

  return (
    <div
      data-v2-kinetic-release
      data-completed={completed ? "true" : "false"}
      data-testid="kinetic-release-primitive"
      role="region"
      aria-label="Sacudida física vigorosa para romper inercia cognitiva"
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
        data-testid="kinetic-release-phase-label"
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
        data-testid="kinetic-release-instruction"
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
          letterSpacing: "-0.01em",
          color: colors.text.muted,
          opacity: 0.65,
          textAlign: "center",
          maxWidth: 280,
          paddingInline: spacing.s16,
        }}
      >
        {PROMPT_HINT}
      </span>

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
        <svg
          aria-hidden="true"
          width="320"
          height="280"
          viewBox="0 0 320 280"
          style={{
            position: "absolute",
            transform: reduceMotion ? "none" : `translate(${jitterX.toFixed(2)}px, ${jitterY.toFixed(2)}px)`,
          }}
        >
          <defs>
            <filter id={haloId} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="9" />
            </filter>
            <radialGradient id={vignetteId} cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.10" />
              <stop offset="60%" stopColor={phaseColor} stopOpacity="0.03" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.90" />
              <stop offset="60%" stopColor={phaseColor} stopOpacity="0.30" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="160" cy="140" rx="140" ry="120" fill={`url(#${vignetteId})`} />

          {/* 8 radial energy lines pulsing outward */}
          {Array.from({ length: RADIAL_LINES }).map((_, i) => {
            const angle = (i / RADIAL_LINES) * Math.PI * 2;
            const innerR = 35;
            const outerR = 65 + Math.sin(pulseTick * Math.PI * 2 + i) * 10;
            const x1 = 160 + Math.cos(angle) * innerR;
            const y1 = 140 + Math.sin(angle) * innerR;
            const x2 = 160 + Math.cos(angle) * outerR;
            const y2 = 140 + Math.sin(angle) * outerR;
            return (
              <line
                key={`rad-${i}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={phaseColor}
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity={0.50 + Math.sin(pulseTick * Math.PI * 2 + i * 0.7) * 0.25}
              />
            );
          })}

          {/* Bursting particles con trail (segundo circle más pequeño detrás) */}
          {particles.map((p) => {
            const x = 160 + Math.cos(p.angle) * p.distance;
            const y = 140 + Math.sin(p.angle) * p.distance;
            const trailDist = Math.max(p.distance - 8, 26);
            const tx = 160 + Math.cos(p.angle) * trailDist;
            const ty = 140 + Math.sin(p.angle) * trailDist;
            return (
              <g key={`p-${p.id}`}>
                <circle
                  cx={tx.toFixed(2)} cy={ty.toFixed(2)}
                  r={(1.5 * p.scale).toFixed(2)}
                  fill={phaseColor}
                  opacity={(p.opacity * 0.45).toFixed(3)}
                />
                <circle
                  cx={x.toFixed(2)} cy={y.toFixed(2)}
                  r={(2.4 * p.scale).toFixed(2)}
                  fill={phaseColor}
                  opacity={p.opacity.toFixed(3)}
                />
              </g>
            );
          })}

          {/* Speed lines — short radial flashes */}
          {speedLines.map((s) => {
            if (s.opacity <= 0.02) return null;
            const x1 = 160 + Math.cos(s.angle) * s.startR;
            const y1 = 140 + Math.sin(s.angle) * s.startR;
            const x2 = 160 + Math.cos(s.angle) * (s.startR + s.length);
            const y2 = 140 + Math.sin(s.angle) * (s.startR + s.length);
            return (
              <line
                key={`sl-${s.id}`}
                x1={x1.toFixed(2)} y1={y1.toFixed(2)}
                x2={x2.toFixed(2)} y2={y2.toFixed(2)}
                stroke={phaseColor}
                strokeWidth="2"
                strokeLinecap="round"
                opacity={s.opacity.toFixed(3)}
              />
            );
          })}

          {/* Energy core con throb */}
          <circle
            cx="160" cy="140" r="32"
            fill={`url(#${auraId})`}
            opacity={(0.78 + coreThrob * 0.15).toFixed(3)}
            filter={reduceMotion ? undefined : `url(#${haloId})`}
            style={{
              transform: `scale(${(0.95 + coreThrob * 0.12).toFixed(3)})`,
              transformOrigin: "160px 140px",
            }}
          />
          <circle
            cx="160" cy="140" r="12"
            fill={phaseColor}
            opacity={(0.92 + coreThrob * 0.06).toFixed(3)}
            style={{
              transform: `scale(${(0.95 + coreThrob * 0.20).toFixed(3)})`,
              transformOrigin: "160px 140px",
            }}
          />

          {/* Countdown prominente */}
          <text
            x="160" y="240"
            fontSize="22"
            fontFamily={typography.familyMono}
            fontWeight="300"
            fill={phaseColor}
            opacity="0.80"
            textAnchor="middle"
            style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "0.08em" }}
          >
            {secondsRemaining}s
          </text>
        </svg>
      </div>

      <span
        data-testid="kinetic-release-body-anchor"
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.01em",
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
