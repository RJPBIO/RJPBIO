"use client";
/* ═══════════════════════════════════════════════════════════════
   StableClosingCommitmentPrimitive — Phase 7 SP-W-4
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 4 "Cierre Estable" del protocolo
   #24 Bilateral Walking Meditation (active tier — cierre).

   Mecanismo:
     Detención post-ambulatoria + anclaje propioceptivo (palma libre
     al pecho + pulgar firme en botón) cierra ciclo ambulatorio.

   Palmas conflict resolución (14ª vez consecutiva).

   Visual signature distintivo:
     - **2 grounded footprints** estáticos abajo del button (símbolo
       de detención "pies firmes aquí"). Sin animación lateral.
     - **3 grounding pulse rings** que se contraen DESDE outer HACIA
       el botón (anchor inward, opuesto a chain previo que expandía).
     - Mantra "Aquí. Reset." (2 palabras, stagger 1.4s).
     - Snap flash + idle breath.

   Active tier compliance:
     - validate.kind: "hold_press", min_hold_ms: 5000.
     - binaural.action: "stop", cue.type: "ok".
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { useMountFade } from "./useMountFade";

const PHASE_LABEL = "Aquí · Reset";
const MANTRA_WORDS = ["Aquí.", "Reset."];
const WORD_STAGGER_MS = 1400;

const PROMPT_PRE = "Detente. Mano libre al pecho · Pulgar firme";
const PROMPT_HOLD = "Mantén. Pies firmes. Aquí.";

const BODY_PRE = "Detención · Una mano al pecho";
const BODY_HOLD = "Pulgar firme · Pies anclados";
const BODY_RELEASE = "Ciclo ambulatorio cerrado";

const GROUND_RING_COUNT = 3;

export default function StableClosingCommitmentPrimitive({
  minHoldMs = 5000,
  releaseMessage = "Aquí. Reset.",
  hapticEnabled = true,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const mountFade = useMountFade({ reduceMotion });
  const phaseColor = getCyanForPhase(2);
  const uid = useId();
  const haloId = `scBlur-${uid}`;
  const vignetteId = `scVignette-${uid}`;
  const auraId = `scAura-${uid}`;

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const [phaseState, setPhaseState] = useState("pre");
  const [wordIdx, setWordIdx] = useState(-1);
  const [holdProgressMs, setHoldProgressMs] = useState(0);
  const [pressing, setPressing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [snapFlash, setSnapFlash] = useState(0);
  const [idleBreath, setIdleBreath] = useState(0);
  const [groundTick, setGroundTick] = useState(0);
  const [settleShimmer, setSettleShimmer] = useState(0); // 0→1 on press start, decays

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

  // Ground ring tick (slow inward contraction cycle)
  useEffect(() => {
    if (reduceMotion) return undefined;
    let stopped = false;
    let raf;
    const startTime = performance.now();
    const tick = (now) => {
      if (stopped) return;
      const elapsed = now - startTime;
      setGroundTick((elapsed / 3500) % 1); // 3.5s cycle
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
          try { hapticProtocolSignature(24, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
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
    // Ground settle shimmer: brief vertical wave descendiendo del button hacia el ground line
    if (!reduceMotion) {
      setSettleShimmer(1);
      const decayStart = performance.now();
      const decay = (n) => {
        const t = Math.min(1, (n - decayStart) / 900);
        setSettleShimmer(1 - t);
        if (t < 1) requestAnimationFrame(decay);
      };
      requestAnimationFrame(decay);
    }
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
      data-v2-stable-closing-commitment
      data-phase-state={phaseState}
      data-completed={completed ? "true" : "false"}
      data-testid="stable-closing-commitment-primitive"
      role="region"
      aria-label="Cierre estable: mantén pulsado para anclar"
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
          gap: "6px 10px",
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
              fontSize: 22,
              fontWeight: typography.weight.light,
              letterSpacing: "-0.02em",
              color: i <= wordIdx ? phaseColor : "transparent",
              opacity: i <= wordIdx ? 0.95 : 0,
              transform: i <= wordIdx ? "translateY(0)" : "translateY(6px)",
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

      <div style={{ position: "relative", width: 320, height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", width: 220, height: 240, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <svg aria-hidden="true" width="220" height="240" viewBox="0 0 220 240" style={{ position: "absolute" }}>
            <defs>
              <filter id={haloId} x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="10" />
              </filter>
              <radialGradient id={vignetteId} cx="50%" cy="40%" r="55%">
                <stop offset="0%" stopColor={phaseColor} stopOpacity="0.10" />
                <stop offset="60%" stopColor={phaseColor} stopOpacity="0.03" />
                <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
              </radialGradient>
              <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={phaseColor} stopOpacity="0.65" />
                <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
              </radialGradient>
            </defs>

            <ellipse cx="110" cy="95" rx="100" ry="80" fill={`url(#${vignetteId})`} />

            {/* 3 grounding rings — contract INWARD hacia el button (centro = 110, 95).
                Patrón: cada ring inicia en r=92 y decrece hasta r=58 over groundTick cycle. */}
            {Array.from({ length: GROUND_RING_COUNT }).map((_, i) => {
              const offset = i / GROUND_RING_COUNT;
              const t = (groundTick + offset) % 1;
              const r = 92 - t * 34; // 92 → 58
              const op = (1 - t) * 0.28;
              return (
                <circle
                  key={`ground-${i}`}
                  cx="110" cy="95" r={r.toFixed(2)}
                  fill="none"
                  stroke={phaseColor}
                  strokeWidth="0.9"
                  opacity={op}
                />
              );
            })}

            {/* Aura halo + snap */}
            <circle
              cx="110" cy="95" r="54"
              fill={`url(#${auraId})`}
              opacity={(pressing ? 0.80 : 0.40) + snapFlash * 0.50}
              filter={reduceMotion ? undefined : `url(#${haloId})`}
              style={{
                transform: `scale(${(0.92 + holdRatio * 0.16 + snapFlash * 0.18).toFixed(3)})`,
                transformOrigin: "110px 95px",
                transition: reduceMotion ? "none" : "transform 240ms ease-out, opacity 280ms ease-out",
              }}
            />
            {snapFlash > 0.05 && (
              <circle
                cx="110" cy="95" r="50"
                fill="none"
                stroke={phaseColor}
                strokeWidth={(1.8 + snapFlash * 2.6).toFixed(2)}
                opacity={snapFlash.toFixed(3)}
              />
            )}

            {/* Progress ring */}
            <circle
              cx="110" cy="95" r="50"
              fill="none"
              stroke={phaseColor}
              strokeWidth="1.8"
              opacity={pressing ? 0.85 : 0.25}
              strokeDasharray={`${(holdRatio * 314.2).toFixed(1)} 314.2`}
              strokeLinecap="round"
              transform="rotate(-90 110 95)"
            />

            {/* Settle shimmer — vertical wave descendiendo del button hacia ground
                line al iniciar press. Visualiza "anclar al suelo". */}
            {settleShimmer > 0.05 && (() => {
              // wave travels from y=150 (button base) down to y=205 (above ground line)
              const waveY = 150 + (1 - settleShimmer) * 55;
              const waveOp = Math.sin(settleShimmer * Math.PI) * 0.85;
              return (
                <g>
                  {/* Horizontal bar moving down */}
                  <line
                    x1="60" y1={waveY} x2="160" y2={waveY}
                    stroke={phaseColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity={waveOp.toFixed(3)}
                    style={{ filter: reduceMotion ? "none" : "blur(2px)" }}
                  />
                  {/* Sharper line inner */}
                  <line
                    x1="70" y1={waveY} x2="150" y2={waveY}
                    stroke={phaseColor}
                    strokeWidth="0.8"
                    strokeLinecap="round"
                    opacity={(waveOp * 0.95).toFixed(3)}
                  />
                </g>
              );
            })()}

            {/* 2 grounded footprints abajo (left + right) — estáticos, anchored.
                Settle pulse: brief scale boost al inicio del settle shimmer. */}
            <ellipse
              cx="92" cy="195"
              rx={(9 + settleShimmer * 2.5).toFixed(2)}
              ry={(5 + settleShimmer * 1.4).toFixed(2)}
              fill={phaseColor}
              opacity={(0.55 + settleShimmer * 0.30).toFixed(3)}
              style={{ transition: reduceMotion ? "none" : "rx 220ms ease-out, ry 220ms ease-out" }}
            />
            <ellipse
              cx="128" cy="195"
              rx={(9 + settleShimmer * 2.5).toFixed(2)}
              ry={(5 + settleShimmer * 1.4).toFixed(2)}
              fill={phaseColor}
              opacity={(0.55 + settleShimmer * 0.30).toFixed(3)}
              style={{ transition: reduceMotion ? "none" : "rx 220ms ease-out, ry 220ms ease-out" }}
            />
            {/* Ground line */}
            <line x1="60" y1="210" x2="160" y2="210" stroke={phaseColor} strokeWidth="0.8" opacity="0.30" strokeDasharray="3 5" />
          </svg>

          <button
            type="button"
            data-testid="stable-closing-hold-button"
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            onTouchCancel={handlePressEnd}
            disabled={completed}
            aria-pressed={pressing}
            aria-label="Mantén presionado 5 segundos para anclar"
            style={{
              position: "absolute",
              top: 47,
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
              zIndex: 2,
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
