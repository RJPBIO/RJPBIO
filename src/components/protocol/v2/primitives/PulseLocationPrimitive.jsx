"use client";
/* ═══════════════════════════════════════════════════════════════
   PulseLocationPrimitive — Phase 7 SP-X-1
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 1 "Encontrar Pulso" del protocolo
   #25 Cardiac Pulse Match (active tier, calma intent).

   Mecanismo (Garfinkel 2015 Biological Psychology):
     Localización pulso radial con dedos índice+medio activa
     interocepción cardíaca explícita pre-task. Prerequisito para
     heartbeat detection accuracy en Phase 2.

   Visual signature:
     - **Wrist zone abstract** — rectángulo cyan horizontal (muñeca)
       con 2 puntos pequeños (placement de los 2 dedos índice+medio).
     - **Radial pulse indicator** pulsante (small cyan dot que late
       @72 bpm) abajo de los dedos = location del pulso radial.
     - Pulse cycle visualizada con sutil "wave" line debajo.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { useMountFade } from "./useMountFade";

const PHASE_LABEL = "Pulso · Localización";
const PROMPT_MAIN = "Encuentra el pulso radial";
const PROMPT_HINT = "Dedos índice y medio en muñeca opuesta";
const BODY_ANCHOR = "Siente el latido bajo los dedos";

export default function PulseLocationPrimitive({
  durationMs = 22000,
  hapticEnabled = true,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const mountFade = useMountFade({ reduceMotion });
  const phaseColor = getCyanForPhase(0);
  const uid = useId();
  const haloId = `plBlur-${uid}`;
  const vignetteId = `plVignette-${uid}`;
  const auraId = `plAura-${uid}`;

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const [pulsePhase, setPulsePhase] = useState(0); // 0-1 sine @72bpm
  const [waveTick, setWaveTick] = useState(0); // waveform sweep
  const [secondsRemaining, setSecondsRemaining] = useState(Math.ceil(durationMs / 1000));
  const [completed, setCompleted] = useState(false);

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
    const heartPeriodMs = 60000 / 72; // 72 bpm = 833ms per beat
    const tick = (now) => {
      if (stopped) return;
      const elapsed = now - startTime;
      // Sharp pulse: short peak, long valley (heartbeat-like)
      const beatPhase = (elapsed % heartPeriodMs) / heartPeriodMs;
      // Bell curve centered at 0.15 (sharp systole)
      const dist = Math.min(beatPhase, 1 - beatPhase);
      setPulsePhase(Math.max(0, 1 - dist * 6));
      setWaveTick((elapsed / 1800) % 1);
      const secs = Math.max(0, Math.ceil((durationMs - elapsed) / 1000));
      setSecondsRemaining((prev) => (prev !== secs ? secs : prev));
      if (elapsed >= durationMs) {
        stopped = true;
        setCompleted(true);
        if (hapticEnabled) { try { hapticProtocolSignature(25, "phase_shift", { reducedMotion: reduceMotion }); } catch {} }
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
      data-v2-pulse-location
      data-completed={completed ? "true" : "false"}
      data-testid="pulse-location-primitive"
      role="region"
      aria-label="Localizar pulso radial"
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
          color: phaseColor,
          textAlign: "center",
          maxWidth: 320,
          paddingInline: spacing.s16,
          letterSpacing: "-0.02em",
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

      <div style={{ position: "relative", width: 320, height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg aria-hidden="true" width="320" height="280" viewBox="0 0 320 280" style={{ position: "absolute" }}>
          <defs>
            <filter id={haloId} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
            <radialGradient id={vignetteId} cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.08" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.85" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="160" cy="140" rx="140" ry="100" fill={`url(#${vignetteId})`} />

          {/* Wrist zone abstract — horizontal rounded rectangle (la muñeca) */}
          <rect
            x="80" y="110" width="160" height="50"
            rx="20"
            fill="none"
            stroke={phaseColor}
            strokeWidth="1.4"
            opacity="0.50"
          />
          {/* Inner pulse vessel line (radial artery) — sutil cyan line */}
          <line
            x1="92" y1="135" x2="228" y2="135"
            stroke={phaseColor}
            strokeWidth="0.8"
            opacity="0.30"
            strokeDasharray="3 4"
          />

          {/* 2 finger placement indicators (indice + medio) — small dashed circles */}
          <circle
            cx="150" cy="135" r="9"
            fill="none"
            stroke={phaseColor}
            strokeWidth="1.4"
            opacity="0.85"
            strokeDasharray="2 3"
          />
          <circle
            cx="172" cy="135" r="9"
            fill="none"
            stroke={phaseColor}
            strokeWidth="1.4"
            opacity="0.85"
            strokeDasharray="2 3"
          />
          {/* Finger labels — unified arriba de los 2 dedos */}
          <text x="161" y="103" fontSize="9" fontFamily={typography.familyMono} fontWeight="500"
                fill={phaseColor} opacity="0.70" textAnchor="middle" style={{ letterSpacing: "0.14em" }}>
            ÍNDICE + MEDIO
          </text>

          {/* Radial pulse dot — pulsa al ritmo de 72 bpm, abajo de los dedos */}
          <circle
            cx="161" cy="135"
            r={(2.5 + pulsePhase * 6).toFixed(2)}
            fill={`url(#${auraId})`}
            opacity={(0.45 + pulsePhase * 0.45).toFixed(3)}
            filter={reduceMotion ? undefined : `url(#${haloId})`}
          />
          <circle
            cx="161" cy="135"
            r={(1.6 + pulsePhase * 2.5).toFixed(2)}
            fill={phaseColor}
            opacity={(0.78 + pulsePhase * 0.15).toFixed(3)}
          />

          {/* ECG-like waveform sweep abajo del wrist */}
          {(() => {
            // 4 segments of a stylized ECG waveform
            const baseY = 192;
            const sweepX = waveTick * 280;
            const segments = [
              { x: 30, dy: 0 }, { x: 70, dy: 0 },
              { x: 90, dy: -3 }, { x: 100, dy: 8 }, { x: 110, dy: -15 },
              { x: 120, dy: 12 }, { x: 130, dy: 0 }, { x: 200, dy: 0 },
              { x: 215, dy: -2 }, { x: 222, dy: 4 }, { x: 228, dy: -8 },
              { x: 234, dy: 6 }, { x: 240, dy: 0 }, { x: 290, dy: 0 },
            ];
            const d = segments.map((s, i) => `${i === 0 ? "M" : "L"} ${s.x} ${baseY + s.dy}`).join(" ");
            return (
              <g>
                <path
                  d={d}
                  fill="none"
                  stroke={phaseColor}
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.55"
                />
                {/* Sweep dot que viaja por la línea */}
                {!reduceMotion && (
                  <circle
                    cx={30 + sweepX}
                    cy={baseY}
                    r="3"
                    fill={phaseColor}
                    opacity="0.75"
                  />
                )}
              </g>
            );
          })()}

          {/* Countdown */}
          <text
            x="160" y="240"
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
