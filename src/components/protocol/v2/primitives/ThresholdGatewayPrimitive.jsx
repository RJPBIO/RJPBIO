"use client";
/* ═══════════════════════════════════════════════════════════════
   ThresholdGatewayPrimitive — Phase 7 SP-T-2 + SP-T-3
   ───────────────────────────────────────────────────────────────
   Primitive dedicated DOBLE-MODO para:
     - #21 Phase 2 "Acercamiento" (mode="approach", 40s)
     - #21 Phase 3 "Cruce del Umbral" (mode="cross", 18s)

   Reemplaza el shared `doorway_visualizer` con visual elevado
   y cumple constraint Apple-grade: cinematic boundary metaphor.

   Mecanismo (mismo en ambos modos):
     Visualización de boundary físico (umbral / portal) activa
     event segmentation theory (Zacks 2007) + doorway effect
     (Radvansky 2006/2010/2011). Cruzar el umbral mentalmente
     limpia working memory entre tareas.

   Visual signature:
     - Mode "approach" (40s, breath 4-4 × 4 cycles):
         * Doorway frame central (rectángulo cyan) que escala
           desde 0.32 → 1.0 over duration.
         * 8 perspective lines convergiendo al centro (vanishing
           point dentro del doorway) — refuerzan profundidad.
         * Breath orb pequeño abajo del doorway sincronizando in/ex
           4s/4s con cadencia.
         * Body anchor text "Te acercas".
         * Sin flash — calma constructora.
     - Mode "cross" (18s, breath 4-4):
         * Flash breve cyan-white <250ms al mount (WCAG 2.1
           SC 2.3.1 compliant) — momento de cruce.
         * Doorway escala rápida 1.0 → 1.4 → settle, opacity
           dim hacia el final, perspective lines fade out
           ("dejas atrás").
         * "DEL OTRO LADO" text emerges post-flash.
         * Body anchor "Lo que cargabas se queda atrás".

   Active tier compliance:
     - validate.kind: "min_duration" (no_validation no aplica).
     - voice.enabled_default: false.
     - Flash <250ms WCAG-compliant en mode cross.
     - reduceMotion: skip-friendly.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { useMountFade } from "./useMountFade";

const FLASH_MS = 220; // <250ms WCAG 2.1 SC 2.3.1 compliant

const COPY = {
  approach: {
    label: "Aproximación · Umbral",
    prompt: "Te acercas al umbral",
    hint: "Inhala 4, exhala 4. Cuatro ciclos.",
    body: "Cada respiración te acerca",
  },
  cross: {
    label: "Cruce · Boundary",
    prompt: "Cruzas",
    hint: "En la próxima exhalación",
    body: "Lo que cargabas se queda atrás",
  },
};

/**
 * @param {object} props
 * @param {"approach"|"cross"} [props.mode="approach"]
 * @param {number} [props.durationMs]
 * @param {boolean} [props.flashEnabled=true]
 * @param {boolean} [props.hapticEnabled]
 * @param {()=>void} [props.onComplete]
 */
export default function ThresholdGatewayPrimitive({
  mode = "approach",
  durationMs,
  flashEnabled = true,
  hapticEnabled = true,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const mountFade = useMountFade({ reduceMotion });
  const isApproach = mode === "approach";
  const isCross = mode === "cross";
  const phaseColor = isApproach ? getCyanForPhase(1) : getCyanForPhase(2);
  const totalMs = durationMs ?? (isApproach ? 40000 : 18000);
  const uid = useId();
  const haloId = `tgBlur-${uid}`;
  const vignetteId = `tgVignette-${uid}`;
  const innerGlowId = `tgInner-${uid}`;

  const copy = COPY[mode] || COPY.approach;

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const [progress, setProgress] = useState(0);
  const [breathPhase, setBreathPhase] = useState(0); // 0-1 inhale | 1-0 exhale (sine cycle)
  const [flashing, setFlashing] = useState(isCross && flashEnabled);
  const [completed, setCompleted] = useState(false);

  // Cross mode: forward-streaming particles
  const [streamParticles, setStreamParticles] = useState(() =>
    Array.from({ length: 14 }, (_, i) => ({
      id: i,
      angle: Math.random() * Math.PI * 2,
      r: 8 + Math.random() * 30,
      speed: 1.0 + Math.random() * 1.6,
      opacity: 0.55 + Math.random() * 0.35,
      scale: 0.5 + Math.random() * 1.0,
    }))
  );

  // Cross-mode flash & cue
  useEffect(() => {
    if (!isCross) return undefined;
    if (hapticEnabled) {
      try { hapticProtocolSignature(21, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
      try { hap("tap"); } catch {}
    }
    if (flashEnabled) {
      const t = setTimeout(() => setFlashing(false), FLASH_MS);
      return () => clearTimeout(t);
    }
    setFlashing(false);
    return undefined;
  }, [isCross, flashEnabled, hapticEnabled, reduceMotion]);

  // Progress + breath cycle ticker
  useEffect(() => {
    if (reduceMotion) {
      const t = setTimeout(() => {
        setProgress(1);
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
      const ratio = Math.min(elapsed / totalMs, 1);
      setProgress(ratio);
      // Breath cycle (sine)
      setBreathPhase((Math.sin((elapsed / cycleMs) * Math.PI * 2 - Math.PI / 2) + 1) * 0.5);

      // Cross mode: forward-streaming particles (radial outward from doorway center)
      if (isCross) {
        setStreamParticles((prev) =>
          prev.map((p) => {
            const newR = p.r + p.speed * 1.4;
            const newOpacity = Math.max(0, p.opacity - 0.018);
            if (newR > 150 || newOpacity <= 0.04) {
              return {
                ...p,
                angle: Math.random() * Math.PI * 2,
                r: 6 + Math.random() * 24,
                speed: 1.0 + Math.random() * 1.6,
                opacity: 0.55 + Math.random() * 0.35,
                scale: 0.5 + Math.random() * 1.0,
              };
            }
            return { ...p, r: newR, opacity: newOpacity };
          })
        );
      }
      if (ratio >= 1) {
        stopped = true;
        setCompleted(true);
        if (isApproach && hapticEnabled) {
          try { hap("tap"); } catch {}
        }
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [totalMs, isApproach, hapticEnabled, reduceMotion]);

  // Doorway scale: approach 0.32 → 1.0; cross 1.0 → 1.45 → settle 1.10
  const doorwayScale = isApproach
    ? 0.32 + progress * 0.68
    : (progress < 0.3
        ? 1.0 + progress * 1.5  // first 30%: 1.0 → 1.45
        : 1.45 - Math.min(1, (progress - 0.3) / 0.7) * 0.35); // 70%: 1.45 → 1.10
  const doorwayOpacity = isApproach
    ? 0.45 + progress * 0.50
    : Math.max(0.18, 1.0 - progress * 0.55);

  // Perspective lines: visible always; in cross they fade after flash
  const perspectiveOpacity = isCross
    ? Math.max(0, 0.50 - progress * 0.50)
    : 0.30 + progress * 0.30;

  const breathOpacity = isApproach ? 0.85 : 0;
  const secsRemaining = Math.max(0, Math.ceil((totalMs - progress * totalMs) / 1000));

  return (
    <div
      data-v2-threshold-gateway
      data-mode={mode}
      data-completed={completed ? "true" : "false"}
      data-testid="threshold-gateway-primitive"
      role="region"
      aria-label={isCross ? "Cruce del umbral cognitivo" : "Aproximación al umbral cognitivo"}
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
        data-testid="threshold-gateway-phase-label"
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
        data-testid="threshold-gateway-prompt"
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
          minHeight: 26,
        }}
      >
        {copy.prompt}
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
        {copy.hint}
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
              <feGaussianBlur stdDeviation="9" />
            </filter>
            <radialGradient id={vignetteId} cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.08" />
              <stop offset="60%" stopColor={phaseColor} stopOpacity="0.02" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={innerGlowId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.78" />
              <stop offset="60%" stopColor={phaseColor} stopOpacity="0.20" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="160" cy="140" rx="140" ry="120" fill={`url(#${vignetteId})`} />

          {/* 8 perspective lines convergiendo al vanishing point (160, 140) */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
            const r1 = 38;
            const r2 = 160;
            const x1 = 160 + Math.cos(angle) * r1;
            const y1 = 140 + Math.sin(angle) * r1;
            const x2 = 160 + Math.cos(angle) * r2;
            const y2 = 140 + Math.sin(angle) * r2;
            return (
              <line
                key={`persp-${i}`}
                x1={x1.toFixed(2)} y1={y1.toFixed(2)}
                x2={x2.toFixed(2)} y2={y2.toFixed(2)}
                stroke={phaseColor}
                strokeWidth="0.8"
                opacity={perspectiveOpacity}
                strokeLinecap="round"
              />
            );
          })}

          {/* Doorway con architecture:
              - Arched top (curved D-shape)
              - Vertical body
              - Threshold step at base (small horizontal bar)
              - Inner light beam vertical through center */}
          <g
            style={{
              transform: `scale(${doorwayScale.toFixed(3)})`,
              transformOrigin: "160px 140px",
              transition: reduceMotion ? "none" : "transform 240ms ease-out",
            }}
          >
            {/* Inner glow background (arched shape) */}
            <path
              d="M 124 200 L 124 110 Q 124 80 160 80 Q 196 80 196 110 L 196 200 Z"
              fill={`url(#${innerGlowId})`}
              opacity={doorwayOpacity}
              filter={reduceMotion ? undefined : `url(#${haloId})`}
            />

            {/* Vertical light beam — central column de luz dentro del portal */}
            <rect
              x="156" y="86" width="8" height="108"
              rx="4"
              fill={phaseColor}
              opacity={(doorwayOpacity * 0.45).toFixed(3)}
              style={{ filter: reduceMotion ? "none" : "blur(4px)" }}
            />
            <line
              x1="160" y1="86" x2="160" y2="194"
              stroke={phaseColor}
              strokeWidth="1.2"
              opacity={(doorwayOpacity * 0.55).toFixed(3)}
              strokeLinecap="round"
            />

            {/* Arched doorway frame (D-shape) */}
            <path
              d="M 124 200 L 124 110 Q 124 80 160 80 Q 196 80 196 110 L 196 200"
              fill="none"
              stroke={phaseColor}
              strokeWidth="2.0"
              opacity={Math.min(1, doorwayOpacity + 0.18)}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Threshold step (base — horizontal accent bar) */}
            <line
              x1="118" y1="202" x2="202" y2="202"
              stroke={phaseColor}
              strokeWidth="2.4"
              opacity={Math.min(1, doorwayOpacity + 0.22)}
              strokeLinecap="round"
            />
            {/* Step shadow detail */}
            <line
              x1="122" y1="206" x2="198" y2="206"
              stroke={phaseColor}
              strokeWidth="1"
              opacity={(doorwayOpacity * 0.42).toFixed(3)}
              strokeLinecap="round"
            />
          </g>

          {/* Breath orb (only approach mode) — under the doorway */}
          {isApproach && (
            <g opacity={breathOpacity}>
              <circle
                cx="160" cy="232" r={(8 + breathPhase * 6).toFixed(2)}
                fill={`url(#${innerGlowId})`}
                opacity={(0.45 + breathPhase * 0.35).toFixed(3)}
                filter={reduceMotion ? undefined : `url(#${haloId})`}
              />
              <circle
                cx="160" cy="232" r="4"
                fill={phaseColor}
                opacity="0.95"
                style={{
                  transform: `scale(${(0.9 + breathPhase * 0.30).toFixed(3)})`,
                  transformOrigin: "160px 232px",
                }}
              />
            </g>
          )}

          {/* Cross mode: forward-streaming particles emanando del doorway center
              hacia afuera — simboliza "passing through" */}
          {isCross && !flashing && streamParticles.map((p) => {
            const cx = 160 + Math.cos(p.angle) * p.r;
            const cy = 140 + Math.sin(p.angle) * p.r;
            // Trail (a bit behind)
            const trailR = Math.max(p.r - 10, 6);
            const tx = 160 + Math.cos(p.angle) * trailR;
            const ty = 140 + Math.sin(p.angle) * trailR;
            return (
              <g key={`stream-${p.id}`}>
                <circle
                  cx={tx.toFixed(2)} cy={ty.toFixed(2)}
                  r={(1.4 * p.scale).toFixed(2)}
                  fill={phaseColor}
                  opacity={(p.opacity * 0.40).toFixed(3)}
                />
                <circle
                  cx={cx.toFixed(2)} cy={cy.toFixed(2)}
                  r={(2.2 * p.scale).toFixed(2)}
                  fill={phaseColor}
                  opacity={p.opacity.toFixed(3)}
                />
              </g>
            );
          })}

          {/* Flash overlay (cross mode only) */}
          {isCross && flashing && (
            <rect
              x="0" y="0" width="320" height="280"
              fill={phaseColor}
              opacity="0.55"
              style={{
                pointerEvents: "none",
              }}
            />
          )}

          {/* "DEL OTRO LADO" text emerges post-flash en cross mode */}
          {isCross && !flashing && progress > 0.15 && (
            <text
              x="160" y="248"
              fontSize="13"
              fontFamily={typography.family}
              fontWeight="500"
              fill={phaseColor}
              opacity={(Math.min(1, (progress - 0.15) * 3) * 0.85).toFixed(3)}
              textAnchor="middle"
              style={{ letterSpacing: "0.22em" }}
            >
              DEL OTRO LADO
            </text>
          )}

          {/* Countdown bottom (approach mode only) */}
          {isApproach && (
            <text
              x="160" y="262"
              fontSize="11"
              fontFamily={typography.familyMono}
              fontWeight="300"
              fill={colors.text.muted}
              opacity="0.55"
              textAnchor="middle"
              style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "0.10em" }}
            >
              {secsRemaining}s
            </text>
          )}
        </svg>
      </div>

      <span
        data-testid="threshold-gateway-body-anchor"
        aria-live="polite"
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.01em",
          color: colors.text.secondary,
          opacity: 0.74,
          textAlign: "center",
          minHeight: 22,
          transition: reduceMotion ? "none" : "opacity 220ms ease-out",
        }}
      >
        {copy.body}
      </span>
    </div>
  );
}
