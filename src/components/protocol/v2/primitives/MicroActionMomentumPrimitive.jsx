"use client";
/* ═══════════════════════════════════════════════════════════════
   MicroActionMomentumPrimitive — Phase 7 SP-S-4
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 4 "Acción Micro" del protocolo
   #20 Block Break (Crisis Cognitiva — cierre del protocolo).

   Mecanismo:
     Commitment motor a micro-acción específica + hold press
     sostenido + identificación verbal de UNA acción concreta de
     5 minutos crea momentum y rompe parálisis residual
     (Bryan/Adams/Monin 2013 implementation intentions).

   Palmas conflict resolución (10ª vez consecutiva):
     "Mantén las palmas presionadas" → "Mano libre al pecho.
     Pulgar firme en el botón." Single-hand phone-friendly.

   Visual signature — break-pattern vs:
     #18 P5 (concentric rings), #19 P3 (4 cardinal arcs),
     #20 P1 (kinetic burst), #20 P2 (compress/burst),
     #20 P3 (branching paths).

     - Central hold button (pill-shaped pequeño, distinto de
       círculos de protocolos previos).
     - **Momentum chevrons:** 5 chevrons horizontales abajo del
       botón que se iluminan secuencialmente durante el hold
       (representan los 5 minutos de acción comprometida +
       indicador de movimiento hacia adelante).
     - "5 MIN" label mono cyan prominente arriba del hold.
     - Hold ring de progreso alrededor del botón.

   Crisis tier compliance:
     - no_validation, voice TTS, binaural STOP (cierre audio bed).
     - min_hold 3s (crisis cap ≤3000ms).
     - SIN sonido emitido, single-hand phone OK.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { useMountFade } from "./useMountFade";

const PHASE_LABEL = "Acción · Momentum";

const PROMPT_PRE = "Mano libre al pecho · Pulgar firme";
const PROMPT_HOLD = "Mantén. UNA acción concreta.";
const PROMPT_RELEASE = "5 minutos. Concreto.";

const BODY_PRE = "Una mano en el pecho";
const BODY_HOLD = "Identifica la acción";
const BODY_RELEASE = "Adelante";

const COMMITMENT_LABEL = "5 MIN";
const CHEVRON_COUNT = 5;

/**
 * @param {object} props
 * @param {number} [props.minHoldMs=3000]
 * @param {string} [props.releaseMessage]
 * @param {boolean} [props.hapticEnabled]
 * @param {()=>void} [props.onComplete]
 */
export default function MicroActionMomentumPrimitive({
  minHoldMs = 3000,
  releaseMessage = PROMPT_RELEASE,
  hapticEnabled = true,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const mountFade = useMountFade({ reduceMotion });
  const phaseColor = getCyanForPhase(2); // light cyan — cierre del chain
  const uid = useId();
  const haloId = `mamBlur-${uid}`;
  const vignetteId = `mamVignette-${uid}`;
  const auraId = `mamAura-${uid}`;

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const [phaseState, setPhaseState] = useState("pre"); // pre | hold | release
  const [pressing, setPressing] = useState(false);
  const [holdProgressMs, setHoldProgressMs] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [snapFlash, setSnapFlash] = useState(0); // 0→1→0 punch al cruzar minHold
  const [idleBreath, setIdleBreath] = useState(0);

  const pressStartRef = useRef(0);
  const rafRef = useRef(null);
  const completedRef = useRef(false);

  // Idle breathing pulse (pre-press) — invites interaction
  useEffect(() => {
    if (reduceMotion || pressing || completed) return undefined;
    let stopped = false;
    let raf;
    const startTime = performance.now();
    const breathTick = (now) => {
      if (stopped) return;
      const elapsed = now - startTime;
      setIdleBreath((Math.sin(elapsed / 700) + 1) * 0.5);
      raf = requestAnimationFrame(breathTick);
    };
    raf = requestAnimationFrame(breathTick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [reduceMotion, pressing, completed]);

  useEffect(() => {
    if (!pressing) return undefined;
    let stopped = false;
    const tick = (now) => {
      if (stopped) return;
      const elapsed = now - pressStartRef.current;
      setHoldProgressMs(elapsed);
      if (elapsed >= minHoldMs && !completedRef.current) {
        completedRef.current = true;
        setPhaseState("release");
        setCompleted(true);
        // Snap-in flash punch: 0 → 1 instant → decay to 0 over 280ms
        setSnapFlash(1);
        if (hapticEnabled) {
          try { hap("tap"); } catch {}
          try { hapticProtocolSignature(20, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
        }
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
        const decayStart = performance.now();
        const decay = (n) => {
          const t = Math.min(1, (n - decayStart) / 280);
          setSnapFlash(1 - t);
          if (t < 1) requestAnimationFrame(decay);
        };
        requestAnimationFrame(decay);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { stopped = true; if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [pressing, minHoldMs, hapticEnabled, reduceMotion]);

  const handlePressStart = (e) => {
    if (completed) return;
    if (e?.preventDefault) e.preventDefault();
    pressStartRef.current = performance.now();
    setPressing(true);
    setHoldProgressMs(0);
    setPhaseState("hold");
    if (hapticEnabled) { try { hap("tap"); } catch {} }
  };

  const handlePressEnd = () => {
    setPressing(false);
    if (!completedRef.current) {
      setHoldProgressMs(0);
      setPhaseState("pre");
    }
  };

  const isHold = phaseState === "hold";
  const isRelease = phaseState === "release";
  const holdRatio = Math.min(holdProgressMs / minHoldMs, 1);

  const primaryPrompt =
    isRelease ? releaseMessage :
    isHold ? PROMPT_HOLD :
    PROMPT_PRE;

  const bodyAnchor =
    isRelease ? BODY_RELEASE :
    isHold ? BODY_HOLD :
    BODY_PRE;

  // Chevrons illumination: during hold, sequential lit by holdRatio.
  // En release, all lit at 0.95. Wave-through: chevron recién iluminado
  // gana boost de glow que decae rápido al siguiente.
  const chevronOpacity = (i) => {
    if (isRelease) return 0.95;
    const threshold = (i + 1) / CHEVRON_COUNT;
    if (holdRatio >= threshold) return 0.92;
    const partial = holdRatio - i / CHEVRON_COUNT;
    if (partial > 0) return 0.30 + (partial * CHEVRON_COUNT) * 0.55;
    return 0.18;
  };
  // Glow boost: chevron i recibe boost cuando holdRatio cruza threshold
  // (último chevron iluminado completamente o el actual sub-progresando)
  const chevronGlow = (i) => {
    if (isRelease) return 0;
    const start = i / CHEVRON_COUNT;
    const end = (i + 1) / CHEVRON_COUNT;
    if (holdRatio < start || holdRatio > end + 0.1) return 0;
    // Bell curve centered at end (peak al cruzar threshold)
    const dist = Math.abs(holdRatio - end);
    return Math.max(0, 1 - dist * 12);
  };

  return (
    <div
      data-v2-micro-action-momentum
      data-phase-state={phaseState}
      data-completed={completed ? "true" : "false"}
      data-testid="micro-action-momentum-primitive"
      role="region"
      aria-label="Compromiso a micro-acción de 5 minutos"
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
        data-testid="micro-action-phase-label"
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

      {/* Commitment label "5 MIN" — mono prominente */}
      <span
        data-testid="micro-action-label"
        style={{
          fontFamily: typography.familyMono,
          fontSize: 32,
          fontWeight: typography.weight.light,
          letterSpacing: "0.10em",
          color: phaseColor,
          opacity: 0.88,
          fontVariantNumeric: "tabular-nums",
          marginTop: -4,
        }}
      >
        {COMMITMENT_LABEL}
      </span>

      <p
        data-testid="micro-action-instruction"
        aria-live="polite"
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: 15,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.01em",
          color: colors.text.secondary,
          opacity: 0.78,
          lineHeight: 1.4,
          textAlign: "center",
          maxWidth: 300,
          paddingInline: spacing.s16,
          minHeight: 22,
        }}
      >
        {primaryPrompt}
      </p>

      <div
        style={{
          position: "relative",
          width: 320,
          height: 220,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            position: "relative",
            width: 130,
            height: 130,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            aria-hidden="true"
            width="130" height="130" viewBox="0 0 130 130"
            style={{ position: "absolute" }}
          >
            <defs>
              <filter id={haloId} x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="10" />
              </filter>
              <radialGradient id={vignetteId} cx="50%" cy="50%" r="55%">
                <stop offset="0%" stopColor={phaseColor} stopOpacity="0.10" />
                <stop offset="60%" stopColor={phaseColor} stopOpacity="0.03" />
                <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
              </radialGradient>
              <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={phaseColor} stopOpacity="0.65" />
                <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
              </radialGradient>
            </defs>

            <ellipse cx="65" cy="65" rx="60" ry="60" fill={`url(#${vignetteId})`} />

            {/* Aura halo around button + snap flash overlay */}
            <circle
              cx="65" cy="65" r="48"
              fill={`url(#${auraId})`}
              opacity={(pressing ? 0.80 : 0.40) + snapFlash * 0.55}
              filter={reduceMotion ? undefined : `url(#${haloId})`}
              style={{
                transform: `scale(${(0.92 + holdRatio * 0.16 + snapFlash * 0.18).toFixed(3)})`,
                transformOrigin: "65px 65px",
                transition: reduceMotion ? "none" : "transform 240ms ease-out, opacity 280ms ease-out",
              }}
            />
            {snapFlash > 0.05 && (
              <circle
                cx="65" cy="65" r="44"
                fill="none"
                stroke={phaseColor}
                strokeWidth={(1.6 + snapFlash * 2.4).toFixed(2)}
                opacity={snapFlash.toFixed(3)}
                style={{ pointerEvents: "none" }}
              />
            )}

            {/* Progress ring (circular) around button */}
            <circle
              cx="65" cy="65" r="44"
              fill="none"
              stroke={phaseColor}
              strokeWidth="1.8"
              opacity={pressing ? 0.85 : 0.25}
              strokeDasharray={`${(holdRatio * 276.5).toFixed(1)} 276.5`}
              strokeLinecap="round"
              transform="rotate(-90 65 65)"
              style={{ transition: reduceMotion ? "none" : "opacity 220ms ease-out" }}
            />
          </svg>

          {/* Hold button — pill-shape distinct (rounded rect, not circle) */}
          <button
            type="button"
            data-testid="micro-action-hold-button"
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            onTouchCancel={handlePressEnd}
            disabled={completed}
            aria-pressed={pressing}
            aria-label="Mantén presionado para confirmar acción"
            style={{
              position: "relative",
              zIndex: 2,
              width: 92,
              height: 60,
              borderRadius: 30, // pill — break pattern vs circles
              background: pressing ? `${phaseColor}30` : `${phaseColor}14`,
              border: `${pressing ? 2.5 : 1.6}px solid ${phaseColor}`,
              color: phaseColor,
              fontFamily: typography.family,
              fontSize: 12,
              fontWeight: typography.weight.medium,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor: completed ? "default" : "pointer",
              outline: "none",
              transform: `scale(${pressing ? 1.04 : (completed ? 1.0 : 1.0 + idleBreath * 0.025)})`,
              transition: reduceMotion ? "none" : "transform 180ms ease-out, background-color 220ms ease-out, border-width 220ms ease-out, opacity 320ms ease-out",
              opacity: completed ? 0.78 : 1,
              touchAction: "manipulation",
              userSelect: "none",
            }}
          >
            {completed ? "OK" : "MANTÉN"}
          </button>
        </div>

        {/* Momentum chevrons — 5 horizontal advancing to the right */}
        <div
          aria-hidden="true"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          {Array.from({ length: CHEVRON_COUNT }).map((_, i) => {
            const op = chevronOpacity(i);
            const glow = chevronGlow(i);
            return (
              <svg
                key={`chev-${i}`}
                width="18" height="16" viewBox="0 0 18 16"
                style={{
                  opacity: op,
                  transform: `scale(${(1 + glow * 0.25).toFixed(3)})`,
                  transition: reduceMotion ? "none" : "opacity 220ms ease-out, transform 220ms ease-out",
                  overflow: "visible",
                }}
              >
                {/* Glow underlay (only when boosted) */}
                {glow > 0.05 && (
                  <path
                    d="M 2 2 L 12 8 L 2 14"
                    fill="none"
                    stroke={phaseColor}
                    strokeWidth={(2 + glow * 3).toFixed(2)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={(glow * 0.65).toFixed(3)}
                    style={{ filter: reduceMotion ? "none" : "blur(2.5px)" }}
                  />
                )}
                <path
                  d="M 2 2 L 12 8 L 2 14"
                  fill="none"
                  stroke={phaseColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            );
          })}
        </div>
      </div>

      <span
        data-testid="micro-action-body-anchor"
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
        {bodyAnchor}
      </span>
    </div>
  );
}
