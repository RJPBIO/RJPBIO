"use client";
/* ═══════════════════════════════════════════════════════════════
   HeartbeatCountPrimitive — Phase 7 SP-X-2
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 2 "Conteo de Latidos" del
   protocolo #25 Cardiac Pulse Match (active tier, calma intent).

   Mecanismo (Garfinkel 2015 Biological Psychology + Schandry 1981
   Psychophysiology):
     Heartbeat detection task valida accuracy interocéptiva +
     activa ínsula posterior. User cuenta latidos durante 30s
     fixed-window tapping cada latido sentido.

   Visual signature:
     - **Central heartbeat orb** que pulsa @72 bpm reference rate.
     - Counter "X latidos" prominente debajo.
     - Tap button grande con label "TAP LATIDO".
     - 30s countdown timer arriba.
     - **Ínsula glow** sutil — small lateral cyan glow al tap
       (representa activación de la ínsula posterior).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { useMountFade } from "./useMountFade";

const PHASE_LABEL = "Conteo · Interocepción";
const PROMPT_MAIN = "Cuenta los latidos";
const PROMPT_HINT = "Tap cada latido sentido durante 30s";
const BODY_PRE = "Mantén dedos en pulso";
const BODY_DONE = "Conteo completo";

const INTERVAL_MS = 30000;

export default function HeartbeatCountPrimitive({
  intervalMs = INTERVAL_MS,
  hapticEnabled = true,
  onTap,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const mountFade = useMountFade({ reduceMotion });
  const phaseColor = getCyanForPhase(1);
  const uid = useId();
  const haloId = `hbcBlur-${uid}`;
  const vignetteId = `hbcVignette-${uid}`;
  const auraId = `hbcAura-${uid}`;

  const onCompleteRef = useRef(onComplete);
  const onTapRef = useRef(onTap);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onTapRef.current = onTap; }, [onTap]);

  const [count, setCount] = useState(0);
  const [pulsePhase, setPulsePhase] = useState(0);
  const [insulaFlash, setInsulaFlash] = useState(0); // 0-1 burst on tap
  const [secondsRemaining, setSecondsRemaining] = useState(Math.ceil(intervalMs / 1000));
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      const t = setTimeout(() => {
        setCompleted(true);
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
      }, 1500);
      return () => clearTimeout(t);
    }
    let stopped = false;
    let raf;
    const startTime = performance.now();
    const heartPeriodMs = 60000 / 72;
    const tick = (now) => {
      if (stopped) return;
      const elapsed = now - startTime;
      const beatPhase = (elapsed % heartPeriodMs) / heartPeriodMs;
      const dist = Math.min(beatPhase, 1 - beatPhase);
      setPulsePhase(Math.max(0, 1 - dist * 6));
      const secs = Math.max(0, Math.ceil((intervalMs - elapsed) / 1000));
      setSecondsRemaining((prev) => (prev !== secs ? secs : prev));
      if (elapsed >= intervalMs) {
        stopped = true;
        setCompleted(true);
        if (hapticEnabled) { try { hapticProtocolSignature(25, "phase_shift", { reducedMotion: reduceMotion }); } catch {} }
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [intervalMs, hapticEnabled, reduceMotion]);

  const handleTap = () => {
    if (completed) return;
    setCount((prev) => prev + 1);
    if (hapticEnabled) { try { hap("tap"); } catch {} }
    try { if (typeof onTapRef.current === "function") onTapRef.current(count + 1); } catch {}
    // Insula flash burst
    if (!reduceMotion) {
      setInsulaFlash(1);
      const decayStart = performance.now();
      const decay = (n) => {
        const t = Math.min(1, (n - decayStart) / 320);
        setInsulaFlash(1 - t);
        if (t < 1) requestAnimationFrame(decay);
      };
      requestAnimationFrame(decay);
    }
  };

  const bodyAnchor = completed ? BODY_DONE : BODY_PRE;

  return (
    <div
      data-v2-heartbeat-count
      data-count={count}
      data-completed={completed ? "true" : "false"}
      data-testid="heartbeat-count-primitive"
      role="region"
      aria-label="Conteo de latidos cardíacos"
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

      <div style={{ position: "relative", width: 320, height: 320, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <svg aria-hidden="true" width="320" height="220" viewBox="0 0 320 220" style={{ position: "absolute", top: 0 }}>
          <defs>
            <filter id={haloId} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="10" />
            </filter>
            <radialGradient id={vignetteId} cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.08" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.85" />
              <stop offset="60%" stopColor={phaseColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="160" cy="110" rx="140" ry="100" fill={`url(#${vignetteId})`} />

          {/* 2 lateral ínsula glow indicators — pulsan brevemente al tap */}
          {insulaFlash > 0.05 && [40, 280].map((cx, i) => (
            <circle
              key={`ins-${i}`}
              cx={cx} cy="110"
              r={(8 + insulaFlash * 8).toFixed(2)}
              fill={phaseColor}
              opacity={(insulaFlash * 0.45).toFixed(3)}
              style={{ filter: reduceMotion ? "none" : "blur(3px)" }}
            />
          ))}

          {/* Central heartbeat orb */}
          <circle
            cx="160" cy="110"
            r={(48 + pulsePhase * 12).toFixed(2)}
            fill={`url(#${auraId})`}
            opacity={(0.55 + pulsePhase * 0.30).toFixed(3)}
            filter={reduceMotion ? undefined : `url(#${haloId})`}
          />
          <circle
            cx="160" cy="110"
            r={(12 + pulsePhase * 4).toFixed(2)}
            fill={phaseColor}
            opacity={(0.92 + pulsePhase * 0.05).toFixed(3)}
          />

          {/* Count text inside orb */}
          <text
            x="160" y="118"
            fontSize="26"
            fontFamily={typography.familyMono}
            fontWeight="300"
            fill="#FFFFFF"
            opacity="0.92"
            textAnchor="middle"
            style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "0.04em" }}
          >
            {count}
          </text>

          {/* Countdown */}
          <text
            x="160" y="200"
            fontSize="11"
            fontFamily={typography.familyMono}
            fontWeight="300"
            fill={colors.text.muted}
            opacity="0.55"
            textAnchor="middle"
            style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "0.10em" }}
          >
            {secondsRemaining}s
          </text>
        </svg>

        {/* Tap button */}
        <button
          type="button"
          data-testid="heartbeat-count-tap-button"
          onClick={handleTap}
          disabled={completed}
          aria-label="Tap cada latido sentido"
          style={{
            position: "absolute",
            bottom: 20,
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
          }}
        >
          <span>{completed ? "OK" : "TAP LATIDO"}</span>
        </button>
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
