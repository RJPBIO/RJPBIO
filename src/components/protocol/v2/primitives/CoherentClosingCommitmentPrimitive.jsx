"use client";
/* ═══════════════════════════════════════════════════════════════
   CoherentClosingCommitmentPrimitive — Phase 7 SP-X-4
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 4 "Cierre Coherente" del protocolo
   #25 Cardiac Pulse Match (active tier — cierre del protocolo).

   Mecanismo:
     Anclaje cardíaco post-coherencia + commitment motor consolida
     estado coherente (Bryan/Adams/Monin 2013).

   Palmas conflict resolución (15ª — última de Phase 7).

   Visual signature distintivo:
     - **Heart rhythm halo**: ECG-like waveform circular alrededor
       del button — visualiza la coherencia cardíaca consolidada.
     - Mantra "Coherencia. Sigo." (2 palabras, stagger 1.4s).
     - Snap flash + idle breath + footprint-style coherence dots.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { useMountFade } from "./useMountFade";

const PHASE_LABEL = "Coherencia · Cierre";
const MANTRA_WORDS = ["Coherencia.", "Sigo."];
const WORD_STAGGER_MS = 1400;

const PROMPT_PRE = "Suelta el pulso. Mano libre al pecho · Pulgar firme";
const PROMPT_HOLD = "Mantén. Coherencia consolidada.";

const BODY_PRE = "Una mano en el pecho";
const BODY_HOLD = "Pulgar firme · Corazón sincronizado";
const BODY_RELEASE = "Estado coherente sostenido";

export default function CoherentClosingCommitmentPrimitive({
  minHoldMs = 5000,
  releaseMessage = "Coherencia. Sigo.",
  hapticEnabled = true,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const mountFade = useMountFade({ reduceMotion });
  const phaseColor = getCyanForPhase(2);
  const uid = useId();
  const haloId = `ccc4Blur-${uid}`;
  const vignetteId = `ccc4Vignette-${uid}`;
  const auraId = `ccc4Aura-${uid}`;

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const [phaseState, setPhaseState] = useState("pre");
  const [wordIdx, setWordIdx] = useState(-1);
  const [holdProgressMs, setHoldProgressMs] = useState(0);
  const [pressing, setPressing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [snapFlash, setSnapFlash] = useState(0);
  const [idleBreath, setIdleBreath] = useState(0);
  const [heartTick, setHeartTick] = useState(0);

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

  // Heart rhythm tick (circular ECG sweep ~5.5rpm coherence rate)
  useEffect(() => {
    if (reduceMotion) return undefined;
    let stopped = false;
    let raf;
    const startTime = performance.now();
    const tick = (now) => {
      if (stopped) return;
      const elapsed = now - startTime;
      // 11s cycle (5.5rpm = coherent resonance rate)
      setHeartTick((elapsed / 11000) % 1);
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
          try { hapticProtocolSignature(25, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
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
      data-v2-coherent-closing
      data-phase-state={phaseState}
      data-completed={completed ? "true" : "false"}
      data-testid="coherent-closing-commitment-primitive"
      role="region"
      aria-label="Cierre coherente: mantén pulsado para consolidar"
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

      <div style={{ position: "relative", width: 320, height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", width: 220, height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg aria-hidden="true" width="220" height="220" viewBox="0 0 220 220" style={{ position: "absolute" }}>
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

            {/* Heart rhythm halo — circular ECG-like waveform que rota lentamente
                alrededor del button. Simboliza coherencia cardíaca sostenida. */}
            {(() => {
              const cx = 110, cy = 110, r = 88;
              // 36 puntos alrededor del círculo, cada uno con elevación ECG-like
              const pts = [];
              const SEGS = 60;
              for (let i = 0; i < SEGS; i++) {
                const t = i / SEGS;
                // Angle (rotating)
                const angle = (t + heartTick) * Math.PI * 2;
                // ECG bump at peak positions (every quarter)
                const beatPos = (t * 4) % 1;
                let radial = r;
                if (beatPos > 0.05 && beatPos < 0.15) {
                  // Sharp R-peak bump outward
                  const peak = Math.sin((beatPos - 0.05) / 0.10 * Math.PI);
                  radial = r + peak * 9;
                } else if (beatPos > 0.15 && beatPos < 0.22) {
                  // S-valley dip inward
                  const dip = Math.sin((beatPos - 0.15) / 0.07 * Math.PI);
                  radial = r - dip * 4;
                }
                const x = cx + Math.cos(angle) * radial;
                const y = cy + Math.sin(angle) * radial;
                pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
              }
              const d = pts.join(" ") + " Z";
              return (
                <path
                  d={d}
                  fill="none"
                  stroke={phaseColor}
                  strokeWidth="1.4"
                  opacity="0.45"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              );
            })()}

            {/* Aura halo + snap */}
            <circle
              cx="110" cy="110" r="50"
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
                cx="110" cy="110" r="46"
                fill="none"
                stroke={phaseColor}
                strokeWidth={(1.8 + snapFlash * 2.6).toFixed(2)}
                opacity={snapFlash.toFixed(3)}
              />
            )}

            {/* Progress ring */}
            <circle
              cx="110" cy="110" r="46"
              fill="none"
              stroke={phaseColor}
              strokeWidth="1.8"
              opacity={pressing ? 0.85 : 0.25}
              strokeDasharray={`${(holdRatio * 289.0).toFixed(1)} 289.0`}
              strokeLinecap="round"
              transform="rotate(-90 110 110)"
            />
          </svg>

          <button
            type="button"
            data-testid="coherent-closing-hold-button"
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            onTouchCancel={handlePressEnd}
            disabled={completed}
            aria-pressed={pressing}
            aria-label="Mantén presionado 5 segundos para consolidar coherencia"
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
