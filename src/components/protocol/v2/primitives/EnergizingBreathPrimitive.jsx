"use client";
/* ═══════════════════════════════════════════════════════════════
   EnergizingBreathPrimitive — Phase 7 SP-V-2
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 2 "Respiración Energizante" del
   protocolo #23 Power Pose Activation (active tier, energia).

   Mecanismo:
     Respiración 4:4 simétrica con postura erguida activa simpático
     moderado + oxigenación. Vigor en inhale (NO suave como calma)
     + firme en exhale (NO largo como reset).

   Visual signature — distinto a breath_orb genérico:
     - Orb central con **sharp edges** (border crisp, no fade
       diffuse) — visual energético, no suave.
     - **4 directional arrows** en cardinales (N, E, S, W) que
       pulsan outward durante inhale + contraen durante exhale.
       Simbolizan "expansión vigorosa".
     - Cycle count 4 dots integrados como satélites superior.
     - Energy core con throb más agresivo (no calmoso).

   Active tier compliance:
     - validate.kind: "breath_cycles", min_cycles: 4.
     - voice.enabled_default: false (active tier default).
     - binaural.action: "continue" (cadena energia P1).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { useMountFade } from "./useMountFade";

const PHASE_LABEL = "Respiración · Energía";
const PROMPT_INHALE = "Inhala 4 con vigor";
const PROMPT_EXHALE = "Exhala 4 firme";
const BODY_INHALE = "Pecho expande";
const BODY_EXHALE = "Postura firme";

const IN_MS = 4000;
const EX_MS = 4000;
const CYCLE_MS = IN_MS + EX_MS;
const TARGET_CYCLES = 4;

/**
 * @param {object} props
 * @param {number} [props.targetCycles=4]
 * @param {boolean} [props.hapticEnabled]
 * @param {(n:number)=>void} [props.onCycleComplete]
 * @param {()=>void} [props.onComplete]
 */
export default function EnergizingBreathPrimitive({
  targetCycles = TARGET_CYCLES,
  hapticEnabled = true,
  onCycleComplete,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const mountFade = useMountFade({ reduceMotion });
  const phaseColor = getCyanForPhase(1); // mid cyan
  const uid = useId();
  const haloId = `ebBlur-${uid}`;
  const vignetteId = `ebVignette-${uid}`;
  const auraId = `ebAura-${uid}`;

  const onCompleteRef = useRef(onComplete);
  const onCycleCompleteRef = useRef(onCycleComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onCycleCompleteRef.current = onCycleComplete; }, [onCycleComplete]);

  const totalMs = CYCLE_MS * targetCycles;

  const [phaseState, setPhaseState] = useState("inhale");
  const [cycleIdx, setCycleIdx] = useState(0);
  const [breathPhase, setBreathPhase] = useState(0);
  const [arrowReach, setArrowReach] = useState(0);
  const [peakFlash, setPeakFlash] = useState(0); // brief flash al peak del inhale
  const [secondsRemaining, setSecondsRemaining] = useState(Math.ceil(IN_MS / 1000));
  const [completed, setCompleted] = useState(false);

  const lastCycleRef = useRef(0);
  const lastPhaseRef = useRef("inhale");

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

    const tick = (now) => {
      if (stopped) return;
      const elapsed = now - startTime;
      const cycleMs = elapsed % CYCLE_MS;
      const currentCycle = Math.floor(elapsed / CYCLE_MS);

      let phase = "inhale";
      let secsLeft = 0;
      let bp = 0;
      let reach = 0;

      if (cycleMs < IN_MS) {
        phase = "inhale";
        secsLeft = Math.ceil((IN_MS - cycleMs) / 1000);
        const t = cycleMs / IN_MS;
        // Energetic ease — quick start, sustained expansion
        bp = t; // 0 → 1 linear (vigor)
        reach = Math.pow(t, 0.6); // ease out fast
      } else {
        phase = "exhale";
        const exMs = cycleMs - IN_MS;
        secsLeft = Math.ceil((EX_MS - exMs) / 1000);
        const t = exMs / EX_MS;
        bp = 1 - t;
        reach = 1 - Math.pow(t, 0.7);
      }

      setBreathPhase((prev) => (Math.abs(prev - bp) > 0.02 ? bp : prev));
      setArrowReach((prev) => (Math.abs(prev - reach) > 0.02 ? reach : prev));
      setSecondsRemaining((prev) => (prev !== secsLeft ? secsLeft : prev));

      if (phase !== lastPhaseRef.current) {
        setPhaseState(phase);
        lastPhaseRef.current = phase;
        if (phase === "inhale" && hapticEnabled) {
          try { hap("tap"); } catch {}
        }
        // Peak flash al transitar de inhale → exhale (peak del inhale alcanzado)
        if (phase === "exhale") {
          setPeakFlash(1);
          const decayStart = performance.now();
          const decay = (n) => {
            const t = Math.min(1, (n - decayStart) / 320);
            setPeakFlash(1 - t);
            if (t < 1 && !stopped) requestAnimationFrame(decay);
          };
          requestAnimationFrame(decay);
        }
      }

      if (currentCycle !== lastCycleRef.current) {
        lastCycleRef.current = currentCycle;
        setCycleIdx(currentCycle);
        try {
          if (typeof onCycleCompleteRef.current === "function") {
            onCycleCompleteRef.current(currentCycle);
          }
        } catch {}
      }

      if (elapsed >= totalMs) {
        stopped = true;
        setCompleted(true);
        if (hapticEnabled) {
          try { hapticProtocolSignature(23, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
        }
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [totalMs, hapticEnabled, reduceMotion]);

  const isInhale = phaseState === "inhale";
  const primaryPrompt = isInhale ? PROMPT_INHALE : PROMPT_EXHALE;
  const bodyAnchor = isInhale ? BODY_INHALE : BODY_EXHALE;
  const cyclesCompleted = Math.min(cycleIdx, targetCycles);
  // Sharp orb scale (snappier than calma orb)
  const orbScale = 0.85 + breathPhase * 0.45;

  return (
    <div
      data-v2-energizing-breath
      data-phase-state={phaseState}
      data-cycle-idx={cycleIdx}
      data-completed={completed ? "true" : "false"}
      data-testid="energizing-breath-primitive"
      role="region"
      aria-label="Respiración energizante 4-4 con postura erguida"
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
        {primaryPrompt}
      </p>

      <div
        style={{
          position: "relative",
          width: 320,
          height: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          aria-hidden="true"
          width="320" height="320" viewBox="0 0 320 320"
          style={{ position: "absolute" }}
        >
          <defs>
            <filter id={haloId} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="8" />
            </filter>
            <radialGradient id={vignetteId} cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.10" />
              <stop offset="60%" stopColor={phaseColor} stopOpacity="0.02" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.90" />
              <stop offset="50%" stopColor={phaseColor} stopOpacity="0.40" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="160" cy="160" rx="140" ry="140" fill={`url(#${vignetteId})`} />

          {/* 4 directional arrows (N, E, S, W) que pulsan outward durante inhale */}
          {[0, 90, 180, 270].map((deg, i) => {
            const angle = (deg * Math.PI) / 180;
            const innerR = 56;
            const outerR = innerR + 14 + arrowReach * 36; // 70 → 106
            const x1 = 160 + Math.cos(angle) * innerR;
            const y1 = 160 + Math.sin(angle) * innerR;
            const x2 = 160 + Math.cos(angle) * outerR;
            const y2 = 160 + Math.sin(angle) * outerR;
            // Arrow head perpendicular
            const headLen = 8;
            const headAngle = Math.PI / 6;
            const hx1 = x2 - Math.cos(angle - headAngle) * headLen;
            const hy1 = y2 - Math.sin(angle - headAngle) * headLen;
            const hx2 = x2 - Math.cos(angle + headAngle) * headLen;
            const hy2 = y2 - Math.sin(angle + headAngle) * headLen;
            const op = 0.40 + arrowReach * 0.45;
            return (
              <g key={`arr-${i}`}>
                <line
                  x1={x1.toFixed(2)} y1={y1.toFixed(2)}
                  x2={x2.toFixed(2)} y2={y2.toFixed(2)}
                  stroke={phaseColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity={op.toFixed(3)}
                />
                <path
                  d={`M ${hx1.toFixed(2)} ${hy1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)} L ${hx2.toFixed(2)} ${hy2.toFixed(2)}`}
                  fill="none"
                  stroke={phaseColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={op.toFixed(3)}
                />
              </g>
            );
          })}

          {/* Energy orb — sharper edges (no diffuse halo) + aura */}
          <circle
            cx="160" cy="160" r="44"
            fill={`url(#${auraId})`}
            opacity={(0.70 + breathPhase * 0.20 + peakFlash * 0.30).toFixed(3)}
            filter={reduceMotion ? undefined : `url(#${haloId})`}
            style={{
              transform: `scale(${(orbScale + peakFlash * 0.18).toFixed(3)})`,
              transformOrigin: "160px 160px",
              transition: reduceMotion ? "none" : "transform 180ms ease-out, opacity 220ms ease-out",
            }}
          />
          {/* Peak flash ring (al cruzar peak inhale) */}
          {peakFlash > 0.05 && (
            <circle
              cx="160" cy="160" r="50"
              fill="none"
              stroke={phaseColor}
              strokeWidth={(2.0 + peakFlash * 3.0).toFixed(2)}
              opacity={peakFlash.toFixed(3)}
              style={{ pointerEvents: "none" }}
            />
          )}
          {/* Sharp inner core */}
          <circle
            cx="160" cy="160" r="14"
            fill={phaseColor}
            opacity={(0.95 + peakFlash * 0.05).toFixed(3)}
            stroke={phaseColor}
            strokeWidth="1.5"
            style={{
              transform: `scale(${(orbScale + peakFlash * 0.10).toFixed(3)})`,
              transformOrigin: "160px 160px",
              transition: reduceMotion ? "none" : "transform 180ms ease-out",
            }}
          />

          {/* 4 cycle dots como satélites superior arc */}
          {Array.from({ length: targetCycles }).map((_, i) => {
            const angleDeg = -125 + i * (50 / Math.max(1, targetCycles - 1));
            const angle = (angleDeg * Math.PI) / 180;
            const r = 110;
            const cx = 160 + Math.cos(angle) * r;
            const cy = 160 + Math.sin(angle) * r;
            const isActive = i === cyclesCompleted;
            const isPast = i < cyclesCompleted;
            return (
              <circle
                key={`cy-${i}`}
                cx={cx.toFixed(2)} cy={cy.toFixed(2)}
                r={isActive ? 4.0 : 3.0}
                fill={phaseColor}
                opacity={isActive ? 0.95 : isPast ? 0.60 : 0.22}
                style={{ transition: reduceMotion ? "none" : "opacity 320ms ease-out, r 220ms ease-out" }}
              />
            );
          })}

          {/* Countdown */}
          <text
            x="160" y="298"
            fontSize="13"
            fontFamily={typography.familyMono}
            fontWeight="300"
            fill={colors.text.muted}
            opacity="0.60"
            textAnchor="middle"
            style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "0.10em" }}
          >
            {secondsRemaining}s
          </text>
        </svg>
      </div>

      <span
        aria-live="polite"
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.light,
          color: colors.text.secondary,
          opacity: 0.78,
          textAlign: "center",
          minHeight: 22,
        }}
      >
        {bodyAnchor}
      </span>

      <span
        aria-label={`Ciclo ${Math.min(cyclesCompleted + 1, targetCycles)} de ${targetCycles}`}
        style={{
          fontFamily: typography.familyMono,
          fontSize: 11,
          letterSpacing: "0.12em",
          color: colors.text.muted,
          opacity: 0.55,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {Math.min(cyclesCompleted + 1, targetCycles)} / {targetCycles}
      </span>
    </div>
  );
}
