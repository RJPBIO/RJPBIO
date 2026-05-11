"use client";
/* ═══════════════════════════════════════════════════════════════
   ThresholdCommitmentPrimitive — Phase 7 SP-T-4
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 4 "Del Otro Lado" del protocolo
   #21 Threshold Crossing (active tier — cierre del protocolo).

   Mecanismo:
     Commitment motor + verbalización de cambio post-boundary
     consolida event boundary cognitivo (Bryan/Adams/Monin 2013).
     Min_hold 5s (active tier — más largo que crisis cap 3s).

   Palmas conflict resolución (11ª vez consecutiva):
     "Mantén las palmas presionadas" → "Mano libre al pecho ·
     Pulgar firme en el botón". Single-hand phone-friendly,
     pattern consistente con #18 P5, #19 P3, #20 P4.

   Visual signature — break-pattern vs commitment chain previa:
     - #18 P5: concentric rings · #19 P3: 4 cardinal arcs ·
       #20 P4: 5 momentum chevrons.
     - #21 P4: **3 horizontal lanes** delante del botón que se
       iluminan secuencialmente al hold (representan "del otro
       lado" — entras a un nuevo corredor cognitivo).
     - Mantra word-by-word reveal "Lo que hago ahora es distinto."
       (6 palabras, stagger 1.0s).
     - Hold button circular + snap-in flash al cruzar minHold.
     - Idle breathing pulse pre-press.

   Active tier compliance:
     - validate.kind: "hold_press", min_hold_ms: 5000.
     - voice.enabled_default: false.
     - binaural.action: "stop", cue.type: "ok".
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { useMountFade } from "./useMountFade";

const PHASE_LABEL = "Distinto · Cierre";

const MANTRA_WORDS = ["Lo", "que", "hago", "ahora", "es", "distinto."];
const WORD_STAGGER_MS = 1000;

const PROMPT_PRE = "Mano libre al pecho · Pulgar firme";
const PROMPT_HOLD = "Mantén. Lo que haces ahora es distinto.";

const BODY_PRE = "Una mano en el pecho";
const BODY_HOLD = "Pulgar firme en el botón";
const BODY_RELEASE = "Corredor nuevo abierto";

const PERSPECTIVE_LINE_COUNT = 7;

/**
 * @param {object} props
 * @param {number} [props.minHoldMs=5000]
 * @param {string} [props.releaseMessage="Distinto."]
 * @param {boolean} [props.hapticEnabled]
 * @param {()=>void} [props.onComplete]
 */
export default function ThresholdCommitmentPrimitive({
  minHoldMs = 5000,
  releaseMessage = "Distinto.",
  hapticEnabled = true,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const mountFade = useMountFade({ reduceMotion });
  const phaseColor = getCyanForPhase(2); // light cyan — cierre del chain
  const uid = useId();
  const haloId = `tcBlur-${uid}`;
  const vignetteId = `tcVignette-${uid}`;
  const auraId = `tcAura-${uid}`;

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

  // Mantra word-by-word reveal
  useEffect(() => {
    if (reduceMotion) {
      setWordIdx(MANTRA_WORDS.length - 1);
      return undefined;
    }
    const timers = MANTRA_WORDS.map((_, i) =>
      setTimeout(() => setWordIdx(i), 500 + i * WORD_STAGGER_MS)
    );
    return () => timers.forEach(clearTimeout);
  }, [reduceMotion]);

  // Idle breathing pulse (pre-press)
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

  // Hold loop
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
          try { hapticProtocolSignature(21, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
        }
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
        const decayStart = performance.now();
        const decay = (n) => {
          const t = Math.min(1, (n - decayStart) / 320);
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

  // Perspective lines fanning OUTward — mirror invertido de approach
  // (que convergía hacia el doorway). Aquí salen del button hacia
  // los lados: "corredor nuevo se abre". Iluminadas sequentially
  // por holdRatio desde el centro hacia los extremos.
  const lineOpacity = (i) => {
    // Distancia del centro: i 0..6 → distance from middle (3)
    const distFromCenter = Math.abs(i - (PERSPECTIVE_LINE_COUNT - 1) / 2);
    const maxDist = (PERSPECTIVE_LINE_COUNT - 1) / 2;
    const normalizedDist = distFromCenter / maxDist; // 0 center → 1 edge
    if (isRelease) return 0.90 - normalizedDist * 0.30;
    // Activation: center first, edges last
    const threshold = normalizedDist; // 0 → 1
    if (holdRatio >= threshold) return 0.82 - normalizedDist * 0.32;
    return 0.15;
  };

  const idleScale = pressing || completed ? 1.0 : 1.0 + idleBreath * 0.025;
  const buttonScale = pressing ? 1.06 : idleScale;
  const ringWeight = pressing ? 2.5 : 1.5 + (pressing || completed ? 0 : idleBreath * 0.3);

  return (
    <div
      data-v2-threshold-commitment
      data-phase-state={phaseState}
      data-completed={completed ? "true" : "false"}
      data-testid="threshold-commitment-primitive"
      role="region"
      aria-label="Cierre threshold: mantén pulsado para consolidar"
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
        data-testid="threshold-commitment-phase-label"
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
        data-testid="threshold-commitment-mantra"
        aria-live="polite"
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "6px 8px",
          maxWidth: 320,
          paddingInline: spacing.s16,
          minHeight: 44,
        }}
      >
        {MANTRA_WORDS.map((w, i) => (
          <span
            key={`mantra-${i}`}
            style={{
              fontFamily: typography.family,
              fontSize: 19,
              fontWeight: typography.weight.light,
              letterSpacing: "-0.02em",
              color: i <= wordIdx ? phaseColor : "transparent",
              opacity: i <= wordIdx ? 0.95 : 0,
              transform: i <= wordIdx ? "translateY(0)" : "translateY(5px)",
              transition: reduceMotion ? "none" : "color 320ms ease-out, opacity 320ms ease-out, transform 420ms ease-out",
            }}
          >
            {w}
          </span>
        ))}
      </div>

      <p
        data-testid="threshold-commitment-instruction"
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
          height: 220,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
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

            <circle
              cx="65" cy="65" r="48"
              fill={`url(#${auraId})`}
              opacity={(pressing ? 0.80 : 0.40) + snapFlash * 0.50}
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
                strokeWidth={(1.8 + snapFlash * 2.6).toFixed(2)}
                opacity={snapFlash.toFixed(3)}
                style={{ pointerEvents: "none" }}
              />
            )}

            {/* Progress ring */}
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

          <button
            type="button"
            data-testid="threshold-commitment-hold-button"
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            onTouchCancel={handlePressEnd}
            disabled={completed}
            aria-pressed={pressing}
            aria-label="Mantén presionado 5 segundos para cerrar"
            style={{
              position: "relative",
              zIndex: 2,
              width: 96,
              height: 96,
              borderRadius: "50%",
              background: pressing ? `${phaseColor}30` : `${phaseColor}14`,
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
        </div>

        {/* Perspective lines fanning OUTward — corredor nuevo del otro lado.
            7 líneas desde el button hacia afuera (mirror invertido del
            approach que convergía). Iluminadas desde centro → extremos. */}
        <svg
          aria-hidden="true"
          width="260" height="58" viewBox="0 0 260 58"
          style={{ marginTop: -6 }}
        >
          {Array.from({ length: PERSPECTIVE_LINE_COUNT }).map((_, i) => {
            const t = i / (PERSPECTIVE_LINE_COUNT - 1); // 0 → 1
            // Origen central + fan outward
            const ox = 130;
            const oy = 6;
            // Endpoints fan outward — angle from -55° to +55°
            const angleDeg = -55 + t * 110;
            const angle = (angleDeg * Math.PI) / 180;
            const length = 46;
            const ex = ox + Math.sin(angle) * length;
            const ey = oy + Math.cos(angle) * length;
            const op = lineOpacity(i);
            return (
              <line
                key={`persp-out-${i}`}
                x1={ox} y1={oy}
                x2={ex.toFixed(2)} y2={ey.toFixed(2)}
                stroke={phaseColor}
                strokeWidth="1.4"
                strokeLinecap="round"
                opacity={op}
                style={{ transition: reduceMotion ? "none" : "opacity 260ms ease-out" }}
              />
            );
          })}
        </svg>
      </div>

      <span
        data-testid="threshold-commitment-body"
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
