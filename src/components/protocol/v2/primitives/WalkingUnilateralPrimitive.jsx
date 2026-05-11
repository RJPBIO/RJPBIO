"use client";
/* ═══════════════════════════════════════════════════════════════
   WalkingUnilateralPrimitive — Phase 7 SP-W-2 + SP-W-3
   ───────────────────────────────────────────────────────────────
   Primitive DOBLE-MODO para Phases 2 + 3 del protocolo #24:
     - mode="left"  (Phase 2 "Pie Izquierdo")
     - mode="right" (Phase 3 "Pie Derecho")

   Mecanismo:
     Walking meditation con atención unilateral activa interocepción
     ambulatoria + reduce rumiación (Teut 2013 RCT).
     8 pasos pace 60 bpm (1 paso/segundo) con tap per landing del
     pie atendido.

   Visual signature:
     - **8 footprint outlines** alternados left/right en path horizontal.
     - Solo footprints del lado atendido se ILUMINAN al ser tapped
       (los del otro lado quedan ghost outline).
     - Pace pulse central que late @60bpm (1s ciclo) — guide visual.
     - Tap button grande abajo con label "TAP pie izquierdo" / "TAP pie derecho".
     - Counter "X / 8" visible.

   Active tier compliance:
     - validate.kind: "tap_count", min_taps: 8, bilateral: false.
     - voice.enabled_default: not set (catalog omits).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { useMountFade } from "./useMountFade";

const COPY = {
  left: {
    label: "Pie Izquierdo · Marcha",
    prompt: "Atención al pie izquierdo",
    hint: "8 pasos. Tap al aterrizar.",
    bodyPre: "Pace lento · 1 paso por segundo",
    bodyDone: "8 pasos izquierdos completos",
    tapLabel: "TAP IZQ",
  },
  right: {
    label: "Pie Derecho · Marcha",
    prompt: "Atención al pie derecho",
    hint: "8 pasos. Tap al aterrizar.",
    bodyPre: "Pace lento · 1 paso por segundo",
    bodyDone: "8 pasos derechos completos",
    tapLabel: "TAP DER",
  },
};

const STEP_TARGET = 8;
const PACE_MS = 1000; // 60 bpm

export default function WalkingUnilateralPrimitive({
  mode = "left",
  targetSteps = STEP_TARGET,
  paceBpm = 60,
  hapticEnabled = true,
  onStepTap,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const mountFade = useMountFade({ reduceMotion });
  const phaseColor = mode === "left" ? getCyanForPhase(1) : getCyanForPhase(2);
  const uid = useId();
  const haloId = `wuBlur-${uid}`;
  const vignetteId = `wuVignette-${uid}`;
  const auraId = `wuAura-${uid}`;

  const onCompleteRef = useRef(onComplete);
  const onStepTapRef = useRef(onStepTap);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onStepTapRef.current = onStepTap; }, [onStepTap]);

  const copy = COPY[mode] || COPY.left;
  const paceMs = paceBpm > 0 ? 60000 / paceBpm : PACE_MS;

  const [tapCount, setTapCount] = useState(0);
  const [pulsePhase, setPulsePhase] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [landingFlash, setLandingFlash] = useState(0); // 0→1→0 burst al tap (landing animation)
  const [ghostPulse, setGhostPulse] = useState(0); // ghost row briefly highlight al tap

  useEffect(() => {
    if (reduceMotion) return undefined;
    let stopped = false;
    let raf;
    const startTime = performance.now();
    const tick = (now) => {
      if (stopped) return;
      const elapsed = now - startTime;
      // Pulse 0→1→0 cada paceMs (1s default)
      setPulsePhase((Math.sin((elapsed / paceMs) * Math.PI * 2 - Math.PI / 2) + 1) * 0.5);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [paceMs, reduceMotion]);

  const handleTap = () => {
    if (completed) return;
    const next = Math.min(targetSteps, tapCount + 1);
    setTapCount(next);
    if (hapticEnabled) { try { hap("tap"); } catch {} }
    try {
      if (typeof onStepTapRef.current === "function") onStepTapRef.current(next);
    } catch {}

    // Tap landing animation: scale + ring pulse burst en footprint recién tapped
    if (!reduceMotion) {
      setLandingFlash(1);
      setGhostPulse(1);
      const decayStart = performance.now();
      const decay = (n) => {
        const t = Math.min(1, (n - decayStart) / 420);
        setLandingFlash(1 - t);
        setGhostPulse(Math.max(0, 1 - t * 1.4));
        if (t < 1) requestAnimationFrame(decay);
      };
      requestAnimationFrame(decay);
    }

    if (next >= targetSteps) {
      setCompleted(true);
      if (hapticEnabled) { try { hapticProtocolSignature(24, "phase_shift", { reducedMotion: reduceMotion }); } catch {} }
      setTimeout(() => {
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
      }, 600);
    }
  };

  const bodyAnchor = completed ? copy.bodyDone : copy.bodyPre;

  return (
    <div
      data-v2-walking-unilateral
      data-mode={mode}
      data-tap-count={tapCount}
      data-completed={completed ? "true" : "false"}
      data-testid="walking-unilateral-primitive"
      role="region"
      aria-label={`Caminata unilateral ${mode === "left" ? "izquierda" : "derecha"}`}
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
        {copy.label}
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
        {copy.prompt}
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
        {copy.hint}
      </span>

      <div style={{ position: "relative", width: 320, height: 280, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
        <svg aria-hidden="true" width="320" height="180" viewBox="0 0 320 180" style={{ position: "absolute", top: 0 }}>
          <defs>
            <filter id={haloId} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
            <radialGradient id={vignetteId} cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.08" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.55" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="160" cy="100" rx="150" ry="60" fill={`url(#${vignetteId})`} />

          {/* Pace pulse — central indicator que late @paceBpm */}
          <g>
            <circle
              cx="160" cy="40"
              r={(14 + pulsePhase * 8).toFixed(2)}
              fill={`url(#${auraId})`}
              opacity={(0.40 + pulsePhase * 0.40).toFixed(3)}
              filter={reduceMotion ? undefined : `url(#${haloId})`}
            />
            <circle cx="160" cy="40" r="6" fill={phaseColor} opacity={(0.85 + pulsePhase * 0.10).toFixed(3)} />
          </g>

          {/* 8 protagonist footprints. El justTapped (= tapCount-th) tiene landing
              animation: scale 1.0→1.25→1.0 + ring pulse outward. */}
          {Array.from({ length: targetSteps }).map((_, i) => {
            const x = 28 + i * (264 / Math.max(1, targetSteps - 1));
            const isTapped = (i + 1) <= tapCount;
            const justTapped = (i + 1) === tapCount && landingFlash > 0.05;
            const isCurrent = (i + 1) === tapCount + 1 && !completed;
            const scale = justTapped ? 1.0 + landingFlash * 0.30 : 1.0;
            return (
              <g key={`prot-${i}`}>
                {/* Glow for current step (next to tap) */}
                {isCurrent && (
                  <ellipse
                    cx={x} cy="104" rx="11" ry="8"
                    fill={phaseColor}
                    opacity="0.20"
                    filter={reduceMotion ? undefined : `url(#${haloId})`}
                  />
                )}
                {/* Landing ring pulse cuando just tapped */}
                {justTapped && (
                  <ellipse
                    cx={x} cy="104"
                    rx={(8 + landingFlash * 12).toFixed(2)}
                    ry={(5 + landingFlash * 8).toFixed(2)}
                    fill="none"
                    stroke={phaseColor}
                    strokeWidth={(1.6 + landingFlash * 1.2).toFixed(2)}
                    opacity={(landingFlash * 0.85).toFixed(3)}
                  />
                )}
                <ellipse
                  cx={x} cy="104"
                  rx={(6 * scale).toFixed(2)}
                  ry={(3.8 * scale).toFixed(2)}
                  fill={isTapped ? phaseColor : "none"}
                  stroke={phaseColor}
                  strokeWidth="1.4"
                  opacity={isTapped ? 0.95 : 0.50}
                  style={{ transition: reduceMotion ? "none" : "opacity 380ms ease-out, fill 380ms ease-out" }}
                />
              </g>
            );
          })}

          {/* 8 ghost footprints — pulsan brevemente con cada tap del protagonist
              (alternating attention metaphor). Base opacity baja, peak en ghostPulse. */}
          {Array.from({ length: targetSteps }).map((_, i) => {
            const x = 42 + i * (264 / Math.max(1, targetSteps - 1));
            return (
              <ellipse
                key={`ghost-${i}`}
                cx={x} cy="132" rx="5" ry="3"
                fill="none"
                stroke={phaseColor}
                strokeWidth="0.8"
                opacity={(0.18 + ghostPulse * 0.30).toFixed(3)}
                style={{ transition: reduceMotion ? "none" : "opacity 220ms ease-out" }}
              />
            );
          })}

          {/* Body anchor labels for both rows */}
          <text x="10" y="108" fontSize="9" fontFamily={typography.familyMono} fontWeight="300"
                fill={phaseColor} opacity="0.55" style={{ letterSpacing: "0.08em" }}>
            {mode === "left" ? "IZQ" : "DER"}
          </text>
          <text x="10" y="136" fontSize="9" fontFamily={typography.familyMono} fontWeight="300"
                fill={colors.text.muted} opacity="0.35" style={{ letterSpacing: "0.08em" }}>
            {mode === "left" ? "der" : "izq"}
          </text>
        </svg>

        {/* Tap button */}
        <button
          type="button"
          data-testid="walking-unilateral-tap-button"
          onClick={handleTap}
          disabled={completed}
          aria-label={`Tap ${mode === "left" ? "pie izquierdo" : "pie derecho"} al aterrizar`}
          style={{
            position: "absolute",
            bottom: 6,
            width: 200,
            height: 60,
            borderRadius: 999,
            border: `1.8px solid ${phaseColor}`,
            background: `${phaseColor}14`,
            color: phaseColor,
            fontFamily: typography.family,
            fontSize: 14,
            fontWeight: typography.weight.medium,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            cursor: completed ? "default" : "pointer",
            outline: "none",
            opacity: completed ? 0.55 : 1,
            transition: reduceMotion ? "none" : "opacity 320ms ease-out",
            touchAction: "manipulation",
            userSelect: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <span>{completed ? "OK" : copy.tapLabel}</span>
        </button>

        {/* Counter */}
        <span
          style={{
            position: "absolute",
            bottom: 76,
            fontFamily: typography.familyMono,
            fontSize: 13,
            letterSpacing: "0.12em",
            color: phaseColor,
            opacity: 0.78,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {Math.min(tapCount, targetSteps)} / {targetSteps}
        </span>
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
        {bodyAnchor}
      </span>
    </div>
  );
}
