"use client";
/* ═══════════════════════════════════════════════════════════════
   CalmCommitmentPrimitive — Phase 7 SP-U-4
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 4 "Cierre Calmo" del protocolo
   #22 Vagal Hum Reset (active tier — cierre del protocolo).

   Mecanismo:
     Anclaje propioceptivo + verbalización consolida estado calmo
     post-humming (Bryan/Adams/Monin 2013).

   Palmas conflict resolución (12ª vez consecutiva):
     "Mantén las palmas firmes contra el pecho" → "Mano libre al
     pecho · Pulgar firme en el botón". Patrón consistente.

   Visual signature — break-pattern vs commitment chain:
     - #18 P5 concentric rings · #19 P3 cardinal arcs · #20 P4
       chevrons · #21 P4 perspective fan-out
     - **#22 P4: SLOW BREATHING HALO** — 3 concentric soft rings
       que pulsan al ritmo de respiración natural (calma) durante
       el hold. Diferente de las anteriores por la cadencia
       breathing-locked, no por número/forma.
     - Mantra word-by-word "Calma sostenida. Sigo." (4 palabras,
       stagger 1.0s).
     - Snap-flash + idle breath patterns aplicados.

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

const PHASE_LABEL = "Calma · Cierre";
const MANTRA_WORDS = ["Calma", "sostenida.", "Sigo."];
const WORD_STAGGER_MS = 1100;

const PROMPT_PRE = "Mano libre al pecho · Pulgar firme";
const PROMPT_HOLD = "Mantén. Calma sostenida.";

const BODY_PRE = "Una mano en el pecho";
const BODY_HOLD = "Pulgar firme en el botón";
const BODY_RELEASE = "Estado calmo consolidado";

const SPOKE_COUNT = 12;

/**
 * @param {object} props
 * @param {number} [props.minHoldMs=5000]
 * @param {string} [props.releaseMessage]
 * @param {boolean} [props.hapticEnabled]
 * @param {()=>void} [props.onComplete]
 */
export default function CalmCommitmentPrimitive({
  minHoldMs = 5000,
  releaseMessage = "Calma. Sigo.",
  hapticEnabled = true,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const mountFade = useMountFade({ reduceMotion });
  const phaseColor = getCyanForPhase(2); // light cyan — cierre
  const uid = useId();
  const haloId = `ccBlur-${uid}`;
  const vignetteId = `ccVignette-${uid}`;
  const auraId = `ccAura-${uid}`;

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const [phaseState, setPhaseState] = useState("pre");
  const [wordIdx, setWordIdx] = useState(-1);
  const [holdProgressMs, setHoldProgressMs] = useState(0);
  const [pressing, setPressing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [snapFlash, setSnapFlash] = useState(0);
  const [idleBreath, setIdleBreath] = useState(0);
  const [breathHalo, setBreathHalo] = useState(0); // 0-1 sine, slow breath cycle for halo rings

  const pressStartRef = useRef(0);
  const rafRef = useRef(null);
  const completedRef = useRef(false);

  // Mantra reveal
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

  // Idle breath (pre-press)
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

  // Breath halo ticker — siempre activo, controla las 3 concentric rings
  useEffect(() => {
    if (reduceMotion) return undefined;
    let stopped = false;
    let raf;
    const startTime = performance.now();
    const tick = (now) => {
      if (stopped) return;
      const elapsed = now - startTime;
      // Slow ~5.5 rpm respiración (≈11s cycle)
      setBreathHalo((Math.sin((elapsed / 5500) * Math.PI * 2 - Math.PI / 2) + 1) * 0.5);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [reduceMotion]);

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
          try { hapticProtocolSignature(22, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
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

  const idleScale = pressing || completed ? 1.0 : 1.0 + idleBreath * 0.025;
  const buttonScale = pressing ? 1.06 : idleScale;
  const ringWeight = pressing ? 2.5 : 1.5 + (pressing || completed ? 0 : idleBreath * 0.3);

  return (
    <div
      data-v2-calm-commitment
      data-phase-state={phaseState}
      data-completed={completed ? "true" : "false"}
      data-testid="calm-commitment-primitive"
      role="region"
      aria-label="Cierre calmo: mantén pulsado para consolidar"
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

      <div
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
        aria-live="polite"
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: 14,
          fontWeight: typography.weight.light,
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
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 200,
            height: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            aria-hidden="true"
            width="200" height="200" viewBox="0 0 200 200"
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

            <ellipse cx="100" cy="100" rx="95" ry="95" fill={`url(#${vignetteId})`} />

            {/* 12 radial spokes que respiran @5.5rpm — break-pattern vs concentric
                rings. Spokes se extienden outward durante inhale (breathHalo↑) y
                se contraen durante exhale, simbolizando expansion/contracción
                de la calma. Pattern radial único en el catálogo Phase 7. */}
            {Array.from({ length: SPOKE_COUNT }).map((_, i) => {
              const angle = (i / SPOKE_COUNT) * Math.PI * 2;
              const innerR = 58;
              const outerR = 70 + breathHalo * 22; // 70 → 92 over breath
              const x1 = 100 + Math.cos(angle) * innerR;
              const y1 = 100 + Math.sin(angle) * innerR;
              const x2 = 100 + Math.cos(angle) * outerR;
              const y2 = 100 + Math.sin(angle) * outerR;
              const op = 0.22 + breathHalo * 0.32;
              return (
                <line
                  key={`spoke-${i}`}
                  x1={x1.toFixed(2)} y1={y1.toFixed(2)}
                  x2={x2.toFixed(2)} y2={y2.toFixed(2)}
                  stroke={phaseColor}
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  opacity={op.toFixed(3)}
                />
              );
            })}
            {/* Subtle inner ring que respira sutilmente (anchor) */}
            <circle
              cx="100" cy="100" r="56"
              fill="none"
              stroke={phaseColor}
              strokeWidth="0.8"
              opacity={(0.18 + breathHalo * 0.15).toFixed(3)}
            />

            {/* Aura halo + snap flash */}
            <circle
              cx="100" cy="100" r="50"
              fill={`url(#${auraId})`}
              opacity={(pressing ? 0.78 : 0.38) + snapFlash * 0.50}
              filter={reduceMotion ? undefined : `url(#${haloId})`}
              style={{
                transform: `scale(${(0.92 + holdRatio * 0.16 + snapFlash * 0.18).toFixed(3)})`,
                transformOrigin: "100px 100px",
                transition: reduceMotion ? "none" : "transform 240ms ease-out, opacity 280ms ease-out",
              }}
            />
            {snapFlash > 0.05 && (
              <circle
                cx="100" cy="100" r="46"
                fill="none"
                stroke={phaseColor}
                strokeWidth={(1.8 + snapFlash * 2.6).toFixed(2)}
                opacity={snapFlash.toFixed(3)}
                style={{ pointerEvents: "none" }}
              />
            )}

            {/* Progress ring */}
            <circle
              cx="100" cy="100" r="46"
              fill="none"
              stroke={phaseColor}
              strokeWidth="1.8"
              opacity={pressing ? 0.85 : 0.25}
              strokeDasharray={`${(holdRatio * 289.0).toFixed(1)} 289.0`}
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
            />
          </svg>

          <button
            type="button"
            data-testid="calm-commitment-hold-button"
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
          transition: reduceMotion ? "none" : "opacity 220ms ease-out",
        }}
      >
        {bodyAnchor}
      </span>
    </div>
  );
}
