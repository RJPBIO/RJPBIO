"use client";
/* ═══════════════════════════════════════════════════════════════
   PreambulatoryPrepPrimitive — Phase 7 SP-W-1
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 1 "Preparación" del protocolo
   #24 Bilateral Walking Meditation (active tier, reset intent).

   Mecanismo:
     Cambio de postura sentado→de pie + preparación espacial (8 pasos
     lineal o marcha en el lugar) activa estado pre-ambulatorio.

   Visual signature:
     - 8 footprint dots horizontalmente alineados (la ruta de 8 pasos).
       Cyan trail line conectándolos. Sequential activation (dots
       se iluminan suavemente uno por uno como guía visual).
     - Standing figure abstract (vertical line + head dot) al inicio
       del path — representa user de pie listo para caminar.
     - Body anchor "Espacio: 8 pasos. Sin espacio: marcha en el lugar."
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { useMountFade } from "./useMountFade";

const PHASE_LABEL = "Preparación · Ruta";
const PROMPT_MAIN = "Levántate. Espacio para 8 pasos.";
const PROMPT_HINT = "Sin espacio: marcha en el lugar.";
const BODY_ANCHOR = "De pie · Listo para caminar";

const STEP_COUNT = 8;

export default function PreambulatoryPrepPrimitive({
  durationMs = 30000,
  hapticEnabled = true,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const mountFade = useMountFade({ reduceMotion });
  const phaseColor = getCyanForPhase(0);
  const uid = useId();
  const haloId = `pwBlur-${uid}`;
  const vignetteId = `pwVignette-${uid}`;

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const [stepRevealed, setStepRevealed] = useState(-1);
  const [secondsRemaining, setSecondsRemaining] = useState(Math.ceil(durationMs / 1000));
  const [completed, setCompleted] = useState(false);
  const lastStepRef = useRef(-1);

  useEffect(() => {
    if (reduceMotion) {
      const t = setTimeout(() => {
        setStepRevealed(STEP_COUNT - 1);
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
      const nextStep = Math.min(STEP_COUNT - 1, Math.floor(ratio * (STEP_COUNT + 1)));
      if (nextStep !== lastStepRef.current && nextStep >= 0) {
        lastStepRef.current = nextStep;
        setStepRevealed(nextStep);
        if (hapticEnabled) { try { hap("tap"); } catch {} }
      }
      const secs = Math.max(0, Math.ceil((durationMs - elapsed) / 1000));
      setSecondsRemaining((prev) => (prev !== secs ? secs : prev));
      if (ratio >= 1) {
        stopped = true;
        setCompleted(true);
        if (hapticEnabled) { try { hapticProtocolSignature(24, "phase_shift", { reducedMotion: reduceMotion }); } catch {} }
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
      data-v2-preambulatory-prep
      data-completed={completed ? "true" : "false"}
      data-testid="preambulatory-prep-primitive"
      role="region"
      aria-label="Preparación ambulatoria: ruta de 8 pasos"
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

      <div style={{ position: "relative", width: 320, height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg aria-hidden="true" width="320" height="240" viewBox="0 0 320 240" style={{ position: "absolute" }}>
          <defs>
            <filter id={haloId} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
            <radialGradient id={vignetteId} cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.08" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="160" cy="120" rx="150" ry="80" fill={`url(#${vignetteId})`} />

          {/* Architectural starting setup:
              - Horizon line (subtle horizontal accent arriba del path)
              - Starting line (thicker vertical accent at x=40 indicando "here")
              - Direction arrow forward (apuntando hacia +x al final del path)
              - Path dashed lateral connecting starting line → forward */}

          {/* Horizon line (subtle background accent) */}
          <line
            x1="20" y1="95" x2="300" y2="95"
            stroke={phaseColor}
            strokeWidth="0.6"
            opacity="0.18"
            strokeDasharray="2 6"
          />

          {/* Starting line vertical accent at x=40 (where path begins) */}
          <line
            x1="40" y1="120" x2="40" y2="170"
            stroke={phaseColor}
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0.78"
          />
          {/* "AQUÍ" label arriba del starting line */}
          <text x="40" y="112" fontSize="9" fontFamily={typography.familyMono} fontWeight="500"
                fill={phaseColor} opacity="0.85" textAnchor="middle" style={{ letterSpacing: "0.16em" }}>
            AQUÍ
          </text>

          {/* Path line — dashed walk forward */}
          <line
            x1="44" y1="148" x2="290" y2="148"
            stroke={phaseColor}
            strokeWidth="1.0"
            opacity="0.45"
            strokeDasharray="4 6"
          />

          {/* Direction arrow forward (at x=296, pointing right) */}
          <path
            d="M 286 140 L 298 148 L 286 156"
            fill="none"
            stroke={phaseColor}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.85"
          />
          {/* "8 PASOS" label en el endpoint del arrow */}
          <text x="296" y="172" fontSize="9" fontFamily={typography.familyMono} fontWeight="500"
                fill={phaseColor} opacity="0.75" textAnchor="middle" style={{ letterSpacing: "0.14em" }}>
            8 PASOS
          </text>

          {/* 8 footprint dots — sequential reveal */}
          {Array.from({ length: STEP_COUNT }).map((_, i) => {
            const cx = 60 + i * 30;
            const revealed = i <= stepRevealed;
            const justRevealed = i === stepRevealed;
            // Alternate top/bottom slight to suggest footprints
            const offsetY = i % 2 === 0 ? -4 : 4;
            return (
              <g key={`step-${i}`}>
                {justRevealed && (
                  <circle
                    cx={cx} cy={148 + offsetY} r="11"
                    fill={phaseColor}
                    opacity="0.18"
                    filter={reduceMotion ? undefined : `url(#${haloId})`}
                  />
                )}
                <ellipse
                  cx={cx} cy={148 + offsetY}
                  rx={revealed ? 5 : 3}
                  ry={revealed ? 3.2 : 2}
                  fill={phaseColor}
                  opacity={revealed ? 0.85 : 0.30}
                  style={{ transition: reduceMotion ? "none" : "opacity 380ms ease-out, rx 380ms ease-out, ry 380ms ease-out" }}
                />
                {/* Step number label */}
                <text
                  x={cx} y="180"
                  fontSize="9"
                  fontFamily={typography.familyMono}
                  fontWeight="300"
                  fill={revealed ? phaseColor : colors.text.muted}
                  opacity={revealed ? 0.65 : 0.30}
                  textAnchor="middle"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {i + 1}
                </text>
              </g>
            );
          })}

          {/* Countdown */}
          <text
            x="160" y="220"
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
