"use client";
/* ═══════════════════════════════════════════════════════════════
   PanicAnchorClosurePrimitive — Phase 7 SP-R-3
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 3 "Estás Aquí" del protocolo
   #19 Panic Interrupt (Crisis tier — cierre del protocolo).

   Mecanismo:
     Anclaje propioceptivo central (mano libre al pecho +
     pulgar firme en botón hold) + afirmación de seguridad
     word-by-word reveal "Estoy aquí. Estoy a salvo." consolida
     el estado calmo construido en Phases 1 y 2 + reactivación
     prefrontal por compromiso verbal (Bryan/Adams/Monin 2013).

   Palmas conflict resolución (9ª vez consecutiva):
     "Mantén las palmas firmes contra el pecho" → "Mano libre al
     pecho · pulgar firme en botón". Single-hand phone-friendly:
     la mano que sostiene el teléfono mantiene el press, la otra
     descansa contra el pecho como auto-soothe propioceptivo.

   Visual signature — break-pattern vs #18 P5 (concentric rings):
     - Safety halo cuadrante creciente alrededor del botón:
       4 arcos cardinales (N, E, S, W) expandiéndose durante hold,
       formando un escudo de protección.
     - 4 partículas calmadas orbitando el botón en hold sostenido.
     - Mantra word-by-word con stagger 1.4s: "Estoy" · "aquí" ·
       "Estoy" · "a salvo".
     - Hold press button central con press feedback (scale ×1.06
       + ring weight ↑ durante press).

   Tier crisis compliance:
     - no_validation, voice TTS, binaural STOP (fin del audio bed).
     - 3s min_hold pero ejercicio puede sostenerse hasta 30-45s
       como anchor extendido (release_message al soltar).
     - Skip option permitida (crisis_no_pressure).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { useMountFade } from "./useMountFade";

const PHASE_LABEL = "Anclaje · Cierre";

const MANTRA_WORDS = ["Estoy", "aquí.", "Estoy", "a salvo."];
const WORD_STAGGER_MS = 1400;

const PROMPT_PRE = "Mano libre al pecho · Pulgar firme";
const PROMPT_HOLD = "Mantén. Estoy aquí. Estoy a salvo.";
const PROMPT_RELEASE = "Estás aquí. A salvo.";

const BODY_PRE = "Una mano en el pecho";
const BODY_HOLD = "Pulgar firme en el botón";
const BODY_RELEASE = "Pertenece este momento";

const MIN_HOLD_MS = 3000;

/**
 * @param {object} props
 * @param {number} [props.minHoldMs=3000]
 * @param {string} [props.releaseMessage="Estás aquí. A salvo."]
 * @param {boolean} [props.hapticEnabled]
 * @param {()=>void} [props.onComplete]
 */
export default function PanicAnchorClosurePrimitive({
  minHoldMs = MIN_HOLD_MS,
  releaseMessage = PROMPT_RELEASE,
  hapticEnabled = true,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const mountFade = useMountFade({ reduceMotion });
  const phaseColor = getCyanForPhase(2); // cyan-light — break-pattern vs P1 (deep) y P2 (mid)
  const uid = useId();
  const haloId = `pacBlur-${uid}`;
  const vignetteId = `pacVignette-${uid}`;
  const auraId = `pacAura-${uid}`;

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const [phaseState, setPhaseState] = useState("pre"); // pre | hold | release
  const [wordIdx, setWordIdx] = useState(-1);
  const [holdProgressMs, setHoldProgressMs] = useState(0);
  const [pressing, setPressing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [snapFlash, setSnapFlash] = useState(0);
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

  // Mantra word-by-word reveal — staggered 1.4s
  useEffect(() => {
    if (reduceMotion) {
      setWordIdx(MANTRA_WORDS.length - 1);
      return undefined;
    }
    const timers = MANTRA_WORDS.map((_, i) =>
      setTimeout(() => setWordIdx(i), 600 + i * WORD_STAGGER_MS)
    );
    return () => timers.forEach(clearTimeout);
  }, [reduceMotion]);

  // Hold loop — RAF accumulates ms while pressing
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
        setSnapFlash(1);
        if (hapticEnabled) {
          try { hap("tap"); } catch {}
          try { hapticProtocolSignature(19, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
        }
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
        const decayStart = performance.now();
        const decay = (n) => {
          const t = Math.min(1, (n - decayStart) / 300);
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

  // Safety halo arcs: 4 cardinal arcs that expand during hold
  const arcRadius = 110 + holdRatio * 30;
  const arcOpacity = isHold ? 0.40 + holdRatio * 0.45 : isRelease ? 0.85 : 0.15;
  const arcStroke = 1.2 + holdRatio * 1.6;

  // 4 calm satellites — orbit during hold sustained, fade out on release
  const satelliteOpacity = isHold ? 0.55 * holdRatio : isRelease ? 0.20 : 0;

  const idleScale = pressing || completed ? 1.0 : 1.0 + idleBreath * 0.025;
  const buttonScale = pressing ? 1.06 : idleScale;
  const ringWeight = pressing ? 2.5 : 1.5 + (pressing || completed ? 0 : idleBreath * 0.3);

  return (
    <div
      data-v2-panic-anchor-closure
      data-phase-state={phaseState}
      data-completed={completed ? "true" : "false"}
      data-testid="panic-anchor-closure-primitive"
      role="region"
      aria-label="Anclaje de seguridad: mantén pulsado para cerrar"
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
        data-testid="panic-anchor-phase-label"
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

      {/* Mantra word-by-word reveal */}
      <div
        data-testid="panic-anchor-mantra"
        aria-live="polite"
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "8px 10px",
          maxWidth: 320,
          paddingInline: spacing.s16,
          minHeight: 48,
        }}
      >
        {MANTRA_WORDS.map((w, i) => (
          <span
            key={`mantra-${i}`}
            style={{
              fontFamily: typography.family,
              fontSize: 22,
              fontWeight: typography.weight.light,
              letterSpacing: "-0.02em",
              color: i <= wordIdx ? phaseColor : "transparent",
              opacity: i <= wordIdx ? (i % 2 === 0 ? 0.95 : 1.0) : 0,
              transform: i <= wordIdx ? "translateY(0)" : "translateY(6px)",
              transition: reduceMotion ? "none" : "color 320ms ease-out, opacity 320ms ease-out, transform 420ms ease-out",
            }}
          >
            {w}
          </span>
        ))}
      </div>

      <p
        data-testid="panic-anchor-instruction"
        aria-live="polite"
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: 14,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.01em",
          color: colors.text.secondary,
          opacity: 0.78,
          lineHeight: 1.4,
          textAlign: "center",
          maxWidth: 300,
          paddingInline: spacing.s16,
          minHeight: 20,
        }}
      >
        {primaryPrompt}
      </p>

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
          style={{ position: "absolute" }}
        >
          <defs>
            <filter id={haloId} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="10" />
            </filter>
            <radialGradient id={vignetteId} cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.07" />
              <stop offset="60%" stopColor={phaseColor} stopOpacity="0.02" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.55" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="160" cy="140" rx="140" ry="120" fill={`url(#${vignetteId})`} />

          {/* 4 cardinal safety halo arcs — N, E, S, W */}
          {[0, 90, 180, 270].map((deg, i) => {
            const start = (deg - 30) * Math.PI / 180;
            const end = (deg + 30) * Math.PI / 180;
            const x1 = 160 + Math.cos(start) * arcRadius;
            const y1 = 140 + Math.sin(start) * arcRadius;
            const x2 = 160 + Math.cos(end) * arcRadius;
            const y2 = 140 + Math.sin(end) * arcRadius;
            return (
              <path
                key={`arc-${i}`}
                d={`M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${arcRadius} ${arcRadius} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`}
                fill="none"
                stroke={phaseColor}
                strokeWidth={arcStroke}
                strokeLinecap="round"
                opacity={arcOpacity}
                style={{ transition: reduceMotion ? "none" : "stroke-width 220ms ease-out, opacity 320ms ease-out" }}
              />
            );
          })}

          {/* 4 orbiting calm satellites — diagonal */}
          {[45, 135, 225, 315].map((deg, i) => {
            const r = 70;
            const cx = 160 + Math.cos(deg * Math.PI / 180) * r;
            const cy = 140 + Math.sin(deg * Math.PI / 180) * r;
            return (
              <circle
                key={`sat-${i}`}
                cx={cx} cy={cy} r="2.8"
                fill={phaseColor}
                opacity={satelliteOpacity}
                style={{ transition: reduceMotion ? "none" : "opacity 420ms ease-out" }}
              />
            );
          })}

          {/* Aura halo around button */}
          <circle
            cx="160" cy="140" r="60"
            fill={`url(#${auraId})`}
            opacity={(pressing ? 0.85 : 0.45) + snapFlash * 0.45}
            filter={reduceMotion ? undefined : `url(#${haloId})`}
            style={{
              transform: `scale(${(0.95 + holdRatio * 0.20 + snapFlash * 0.18).toFixed(3)})`,
              transformOrigin: "160px 140px",
              transition: reduceMotion ? "none" : "transform 240ms ease-out, opacity 280ms ease-out",
            }}
          />
          {snapFlash > 0.05 && (
            <circle
              cx="160" cy="140" r="56"
              fill="none"
              stroke={phaseColor}
              strokeWidth={(2.0 + snapFlash * 2.8).toFixed(2)}
              opacity={snapFlash.toFixed(3)}
              style={{ pointerEvents: "none" }}
            />
          )}
        </svg>

        {/* Hold press button */}
        <button
          type="button"
          data-testid="panic-anchor-hold-button"
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          onTouchCancel={handlePressEnd}
          disabled={completed}
          aria-pressed={pressing}
          aria-label="Mantén presionado para anclar"
          style={{
            position: "relative",
            zIndex: 2,
            width: 96,
            height: 96,
            borderRadius: "50%",
            background: `radial-gradient(circle at 50% 38%, ${phaseColor}33, transparent 70%)`,
            backgroundColor: pressing ? `${phaseColor}26` : `${phaseColor}14`,
            border: `${ringWeight}px solid ${phaseColor}`,
            color: phaseColor,
            fontFamily: typography.family,
            fontSize: 13,
            fontWeight: typography.weight.medium,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            cursor: completed ? "default" : "pointer",
            outline: "none",
            transform: `scale(${buttonScale.toFixed(3)})`,
            transition: reduceMotion ? "none" : "transform 180ms ease-out, background-color 220ms ease-out, border-width 220ms ease-out, opacity 320ms ease-out",
            opacity: completed ? 0.78 : 1,
            touchAction: "manipulation",
            userSelect: "none",
          }}
        >
          {completed ? "OK" : "MANTÉN"}
        </button>

        {/* Hold progress ring (around button) */}
        <svg
          aria-hidden="true"
          width="120" height="120" viewBox="0 0 120 120"
          style={{
            position: "absolute",
            pointerEvents: "none",
            transform: "translate(0, -10px) scale(0.95)",
          }}
        >
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke={phaseColor}
            strokeWidth="2"
            opacity={pressing ? 0.85 : 0.25}
            strokeDasharray={`${(holdRatio * 326.7).toFixed(1)} 326.7`}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            style={{ transition: reduceMotion ? "none" : "opacity 220ms ease-out" }}
          />
        </svg>
      </div>

      {/* Body anchor */}
      <span
        data-testid="panic-anchor-body"
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
