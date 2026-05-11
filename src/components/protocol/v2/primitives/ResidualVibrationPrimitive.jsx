"use client";
/* ═══════════════════════════════════════════════════════════════
   ResidualVibrationPrimitive — Phase 7 SP-U-3
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 3 "Sostén Interocéptivo" del
   protocolo #22 Vagal Hum Reset (active tier, calma intent).

   Mecanismo:
     Interocepción post-vocalización consolida cambio fisiológico
     vía ínsula anterior (Khalsa 2018 Roadmap interoception).
     User mantiene atención silenciosa a vibración residual en
     cara y pecho post-humming.

   Visual signature — break-pattern vs silence_cyan_minimal:
     - Central faded orb (residual del humming previo, no activo).
     - Slow-decaying rings sutiles que se atenúan over time
       (visualizan la vibración residual disipándose).
     - Body region indicator: small chest/face glyph con sutile
       glow que también decae (interocepción focus zone).
     - Text "Vibración residual." emerges fade-in.
     - Sin counters de cycle, sin actions interactivas — pure
       interoception sostained.

   Active tier compliance:
     - validate.kind: "min_duration", min_ms: 28000.
     - voice.enabled_default: false.
     - binaural.action: "continue".
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { useMountFade } from "./useMountFade";

const PHASE_LABEL = "Interocepción · Residual";
const PROMPT_MAIN = "Atención a la vibración";
const PROMPT_HINT = "Cara y pecho. Sin humming.";
const BODY_ANCHOR = "Sentir lo que queda";

/**
 * @param {object} props
 * @param {number} [props.durationMs=35000]
 * @param {string} [props.text]
 * @param {boolean} [props.hapticEnabled]
 * @param {()=>void} [props.onComplete]
 */
export default function ResidualVibrationPrimitive({
  durationMs = 35000,
  text = "Vibración residual.",
  hapticEnabled = true,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const mountFade = useMountFade({ reduceMotion });
  const phaseColor = getCyanForPhase(2); // light cyan — interoception phase
  const uid = useId();
  const haloId = `rvBlur-${uid}`;
  const vignetteId = `rvVignette-${uid}`;
  const auraId = `rvAura-${uid}`;

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const [progress, setProgress] = useState(0);
  const [ringTick, setRingTick] = useState(0);
  const [scanPos, setScanPos] = useState(0); // 0-1 sine, traveling between face/chest zones
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

    const tick = (now) => {
      if (stopped) return;
      const elapsed = now - startTime;
      const ratio = Math.min(elapsed / durationMs, 1);
      setProgress(ratio);
      setRingTick((elapsed / 3200) % 1); // slow ring tick
      // Scan pulse: travels up-down between zones (5s cycle)
      setScanPos((Math.sin((elapsed / 5000) * Math.PI * 2 - Math.PI / 2) + 1) * 0.5);

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

  // Residual decay: rings opacity decays as progress moves forward
  const ringIntensity = Math.max(0.10, 1 - progress * 0.75);
  // Orb decay: also decreasing
  const orbOpacity = 0.65 - progress * 0.30;

  return (
    <div
      data-v2-residual-vibration
      data-completed={completed ? "true" : "false"}
      data-testid="residual-vibration-primitive"
      role="region"
      aria-label="Sostén interocéptivo: vibración residual"
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
          fontWeight: typography.weight.light,
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
          height: 280,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          aria-hidden="true"
          width="320" height="280" viewBox="0 0 320 280"
          style={{ position: "absolute" }}
        >
          <defs>
            <filter id={haloId} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="14" />
            </filter>
            <radialGradient id={vignetteId} cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.06" />
              <stop offset="60%" stopColor={phaseColor} stopOpacity="0.02" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.70" />
              <stop offset="60%" stopColor={phaseColor} stopOpacity="0.20" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="160" cy="140" rx="140" ry="120" fill={`url(#${vignetteId})`} />

          {/* 2 body zones (cara arriba en y=78, pecho abajo en y=200) — visibles
              siempre con strokeDasharray subtle. Mejor anchor que rings concentric. */}
          {/* Cara zone */}
          <ellipse
            cx="160" cy="78" rx="46" ry="28"
            fill="none"
            stroke={phaseColor}
            strokeWidth="0.7"
            opacity={(0.22 * ringIntensity).toFixed(3)}
            strokeDasharray="3 5"
          />
          {/* Pecho zone */}
          <ellipse
            cx="160" cy="200" rx="58" ry="34"
            fill="none"
            stroke={phaseColor}
            strokeWidth="0.7"
            opacity={(0.22 * ringIntensity).toFixed(3)}
            strokeDasharray="3 5"
          />

          {/* Vertical body axis (subtle column entre cara y pecho) */}
          <line
            x1="160" y1="106" x2="160" y2="170"
            stroke={phaseColor}
            strokeWidth="0.6"
            opacity={(0.18 * ringIntensity).toFixed(3)}
            strokeDasharray="2 4"
          />

          {/* Traveling scan pulse — horizontal cyan bar que viaja entre zonas.
              scanPos: 0 → cara (y=78), 1 → pecho (y=200). */}
          {(() => {
            const scanY = 78 + scanPos * 122; // 78 → 200
            const scanGlowOpacity = (0.50 + Math.sin(scanPos * Math.PI) * 0.30) * ringIntensity;
            const scanWidth = 60 + Math.sin(scanPos * Math.PI) * 14; // wider at midpoint
            return (
              <g>
                {/* Glow underlay */}
                <line
                  x1={160 - scanWidth / 2} y1={scanY}
                  x2={160 + scanWidth / 2} y2={scanY}
                  stroke={phaseColor}
                  strokeWidth="3.5"
                  opacity={(scanGlowOpacity * 0.45).toFixed(3)}
                  strokeLinecap="round"
                  style={{ filter: reduceMotion ? "none" : "blur(3px)" }}
                />
                {/* Main scan bar */}
                <line
                  x1={160 - scanWidth / 2} y1={scanY}
                  x2={160 + scanWidth / 2} y2={scanY}
                  stroke={phaseColor}
                  strokeWidth="1.4"
                  opacity={scanGlowOpacity.toFixed(3)}
                  strokeLinecap="round"
                />
                {/* Center dot on scan line */}
                <circle
                  cx="160" cy={scanY} r="2.5"
                  fill={phaseColor}
                  opacity={(0.85 * ringIntensity).toFixed(3)}
                />
              </g>
            );
          })()}

          {/* Subtle ambient ring (single, slow) — apoyo de fondo, no protagonista */}
          {(() => {
            const t = ringTick;
            const r = 50 + t * 90;
            const opacity = (1 - t) * 0.16 * ringIntensity;
            return (
              <circle
                cx="160" cy="140" r={r}
                fill="none"
                stroke={phaseColor}
                strokeWidth="0.6"
                opacity={opacity}
              />
            );
          })()}

          {/* "Vibración residual." text emerges */}
          <text
            x="160" y="245"
            fontSize="13"
            fontFamily={typography.family}
            fontWeight="400"
            fill={phaseColor}
            opacity={Math.min(1, progress * 4) * 0.85}
            textAnchor="middle"
            style={{ letterSpacing: "0.15em" }}
          >
            {text.toUpperCase()}
          </text>

          {/* Countdown */}
          <text
            x="160" y="265"
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
