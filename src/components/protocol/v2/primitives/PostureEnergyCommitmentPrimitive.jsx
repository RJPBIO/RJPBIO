"use client";
/* ═══════════════════════════════════════════════════════════════
   PostureEnergyCommitmentPrimitive — Phase 7 SP-V-4
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 4 "Anclaje Energético" del
   protocolo #23 Power Pose Activation (active tier — cierre).

   Mecanismo:
     Postura sostenida + commitment motor (pulgar firme) +
     verbalización "Próxima hora activa." consolida estado
     activado post-postura (Bryan/Adams/Monin 2013).

   Palmas conflict resolución (13ª vez consecutiva).

   Visual signature distintivo:
     - **8 energy rays diagonales** emanando radialmente del button
       con ambient slow rotation (3°/s) + intensifican durante hold
       (energy build-up).
     - Mantra word-by-word "Próxima hora activa." (3 palabras).
     - Snap flash + idle breath + glow underlay.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { useMountFade } from "./useMountFade";

const PHASE_LABEL = "Energía · Cierre";
const MANTRA_WORDS = ["Próxima", "hora", "activa."];
const WORD_STAGGER_MS = 1200;

const PROMPT_PRE = "Mano libre al pecho · Pulgar firme";
const PROMPT_HOLD = "Mantén. Próxima hora activa.";

const BODY_PRE = "Una mano en el pecho";
const BODY_HOLD = "Postura sostenida";
const BODY_RELEASE = "Energía consolidada";

const RAY_COUNT = 8;

export default function PostureEnergyCommitmentPrimitive({
  minHoldMs = 5000,
  releaseMessage = "Próxima hora activa.",
  hapticEnabled = true,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const mountFade = useMountFade({ reduceMotion });
  const phaseColor = getCyanForPhase(2);
  const uid = useId();
  const haloId = `peaBlur-${uid}`;
  const vignetteId = `peaVignette-${uid}`;
  const auraId = `peaAura-${uid}`;

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const [phaseState, setPhaseState] = useState("pre");
  const [wordIdx, setWordIdx] = useState(-1);
  const [holdProgressMs, setHoldProgressMs] = useState(0);
  const [pressing, setPressing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [snapFlash, setSnapFlash] = useState(0);
  const [idleBreath, setIdleBreath] = useState(0);
  const [rayRotation, setRayRotation] = useState(0);
  const [pulseWave, setPulseWave] = useState(0); // 0-1 traveling pulse along rays

  // Random brightness offset per ray (constant per primitive instance)
  const rayBrightnessRef = useRef(
    Array.from({ length: 8 }, () => 0.7 + Math.random() * 0.6) // 0.7-1.3 multiplier
  );

  const pressStartRef = useRef(0);
  const rafRef = useRef(null);
  const completedRef = useRef(false);

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
    if (reduceMotion) return undefined;
    let stopped = false;
    let raf;
    const startTime = performance.now();
    const tick = (now) => {
      if (stopped) return;
      const elapsed = now - startTime;
      setRayRotation((elapsed / 1000) * 3);
      // Pulse wave traveling outward along rays (2.5s cycle)
      setPulseWave((elapsed / 2500) % 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [reduceMotion]);

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
          try { hapticProtocolSignature(23, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
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
  const rayIntensity = (isRelease ? 1 : holdRatio) + snapFlash * 0.5;

  return (
    <div
      data-v2-posture-energy-commitment
      data-phase-state={phaseState}
      data-completed={completed ? "true" : "false"}
      data-testid="posture-energy-commitment-primitive"
      role="region"
      aria-label="Anclaje energético: mantén pulsado para consolidar"
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
          height: 240,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 220,
            height: 220,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            aria-hidden="true"
            width="220" height="220" viewBox="0 0 220 220"
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

            <ellipse cx="110" cy="110" rx="105" ry="105" fill={`url(#${vignetteId})`} />

            {/* 8 energy rays radiating outward — slow ambient rotation +
                intensifican durante hold */}
            <g style={{ transform: `rotate(${rayRotation.toFixed(2)}deg)`, transformOrigin: "110px 110px" }}>
              {Array.from({ length: RAY_COUNT }).map((_, i) => {
                const angle = (i / RAY_COUNT) * Math.PI * 2;
                const innerR = 64;
                const outerR = 84 + rayIntensity * 24;
                const x1 = 110 + Math.cos(angle) * innerR;
                const y1 = 110 + Math.sin(angle) * innerR;
                const x2 = 110 + Math.cos(angle) * outerR;
                const y2 = 110 + Math.sin(angle) * outerR;
                // Brightness variation: cada ray tiene multiplier estable [0.7-1.3]
                const brightnessMult = rayBrightnessRef.current[i] || 1.0;
                const op = (0.30 + rayIntensity * 0.55) * brightnessMult;
                // Pulse wave dot: travels along ray (innerR → outerR) with staggered phase
                const staggerPhase = (pulseWave + i / RAY_COUNT) % 1;
                const pulseR = innerR + staggerPhase * (outerR - innerR);
                const pulseX = 110 + Math.cos(angle) * pulseR;
                const pulseY = 110 + Math.sin(angle) * pulseR;
                const pulseOp = Math.sin(staggerPhase * Math.PI) * 0.85; // bell curve
                return (
                  <g key={`ray-${i}`}>
                    {rayIntensity > 0.1 && (
                      <line
                        x1={x1.toFixed(2)} y1={y1.toFixed(2)}
                        x2={x2.toFixed(2)} y2={y2.toFixed(2)}
                        stroke={phaseColor}
                        strokeWidth={(2 + rayIntensity * 2.5).toFixed(2)}
                        strokeLinecap="round"
                        opacity={(rayIntensity * 0.35 * brightnessMult).toFixed(3)}
                        style={{ filter: reduceMotion ? "none" : "blur(3px)" }}
                      />
                    )}
                    <line
                      x1={x1.toFixed(2)} y1={y1.toFixed(2)}
                      x2={x2.toFixed(2)} y2={y2.toFixed(2)}
                      stroke={phaseColor}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      opacity={op.toFixed(3)}
                    />
                    {/* Pulse wave dot traveling outward along this ray */}
                    {!reduceMotion && pulseOp > 0.05 && (
                      <circle
                        cx={pulseX.toFixed(2)} cy={pulseY.toFixed(2)}
                        r="2.2"
                        fill={phaseColor}
                        opacity={(pulseOp * brightnessMult * (0.4 + rayIntensity * 0.5)).toFixed(3)}
                      />
                    )}
                  </g>
                );
              })}
            </g>

            <circle
              cx="110" cy="110" r="54"
              fill={`url(#${auraId})`}
              opacity={(pressing ? 0.80 : 0.40) + snapFlash * 0.50}
              filter={reduceMotion ? undefined : `url(#${haloId})`}
              style={{
                transform: `scale(${(0.92 + holdRatio * 0.16 + snapFlash * 0.18).toFixed(3)})`,
                transformOrigin: "110px 110px",
                transition: reduceMotion ? "none" : "transform 240ms ease-out, opacity 280ms ease-out",
              }}
            />
            {snapFlash > 0.05 && (
              <circle
                cx="110" cy="110" r="50"
                fill="none"
                stroke={phaseColor}
                strokeWidth={(1.8 + snapFlash * 2.6).toFixed(2)}
                opacity={snapFlash.toFixed(3)}
                style={{ pointerEvents: "none" }}
              />
            )}

            <circle
              cx="110" cy="110" r="50"
              fill="none"
              stroke={phaseColor}
              strokeWidth="1.8"
              opacity={pressing ? 0.85 : 0.25}
              strokeDasharray={`${(holdRatio * 314.2).toFixed(1)} 314.2`}
              strokeLinecap="round"
              transform="rotate(-90 110 110)"
            />
          </svg>

          <button
            type="button"
            data-testid="posture-energy-hold-button"
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
        }}
      >
        {bodyAnchor}
      </span>
    </div>
  );
}
