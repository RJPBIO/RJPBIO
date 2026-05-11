"use client";
/* ═══════════════════════════════════════════════════════════════
   CoreIsometricPrimitive — Phase 7 SP-V-3
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 3 "Activación Core" del protocolo
   #23 Power Pose Activation (active tier, energia).

   Mecanismo:
     Isometric core activation refuerza propiocepción central +
     estabilidad postural sostenida. 3 ciclos × 10s tense + 5s
     release durante postura erguida sostained.

   Visual signature — distinto a IsometricRelease (#20 P2):
     - **Core zone indicator** (abdominal/central) en lugar de orb
       genérico — forma ovalada horizontal que se contrae durante
       tense y se relaja durante release.
     - 4 lateral compression lines (izq/der) que se contraen hacia
       el core durante tense, expanden durante release.
     - 3 step dots horizontales debajo (hold/release/hold/release/
       hold/release cycle indicator).
     - Sequential 3 holds × 10s + 5s release = 45s total.

   Active tier compliance:
     - validate.kind: "min_duration", min_ms: 25000.
     - voice.enabled_default: false.
     - binaural.action: "continue".
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { useMountFade } from "./useMountFade";

const PHASE_LABEL = "Core · Isometric";
const PROMPT_TENSE = "Aprieta core firme";
const PROMPT_RELEASE = "Suelta · Mantén postura";
const BODY_TENSE = "Abdomen + transverso";
const BODY_RELEASE = "Estabilidad sin tensión";

const HOLD_MS = 10000;
const RELEASE_MS = 5000;
const CYCLE_MS = HOLD_MS + RELEASE_MS;
const TARGET_HOLDS = 3;

/**
 * @param {object} props
 * @param {number} [props.targetHolds=3]
 * @param {number} [props.holdDurationMs=10000]
 * @param {number} [props.releaseDurationMs=5000]
 * @param {boolean} [props.hapticEnabled]
 * @param {()=>void} [props.onComplete]
 */
export default function CoreIsometricPrimitive({
  targetHolds = TARGET_HOLDS,
  holdDurationMs = HOLD_MS,
  releaseDurationMs = RELEASE_MS,
  hapticEnabled = true,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const mountFade = useMountFade({ reduceMotion });
  const phaseColor = getCyanForPhase(2); // light cyan — mid-protocol
  const uid = useId();
  const haloId = `ciBlur-${uid}`;
  const vignetteId = `ciVignette-${uid}`;
  const auraId = `ciAura-${uid}`;

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const cycleTotal = holdDurationMs + releaseDurationMs;
  const totalMs = cycleTotal * targetHolds;

  const [phaseState, setPhaseState] = useState("hold");
  const [cycleIdx, setCycleIdx] = useState(0);
  const [tension, setTension] = useState(0);
  const [releaseBurst, setReleaseBurst] = useState(0); // 0→1→0 burst al transitar a release
  const [secondsRemaining, setSecondsRemaining] = useState(Math.ceil(holdDurationMs / 1000));
  const [completed, setCompleted] = useState(false);

  const lastCycleRef = useRef(0);
  const lastPhaseRef = useRef("hold");

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
      const cycleMs = elapsed % cycleTotal;
      const currentCycle = Math.floor(elapsed / cycleTotal);

      let phase = "hold";
      let secsLeft = 0;
      let tens = 0;

      if (cycleMs < holdDurationMs) {
        phase = "hold";
        secsLeft = Math.ceil((holdDurationMs - cycleMs) / 1000);
        const t = cycleMs / holdDurationMs;
        // Tension builds quickly + plateau + sustains
        tens = Math.min(1, t * 2.5); // ramp up first 40% then plateau
      } else {
        phase = "release";
        const rMs = cycleMs - holdDurationMs;
        secsLeft = Math.ceil((releaseDurationMs - rMs) / 1000);
        const t = rMs / releaseDurationMs;
        tens = Math.max(0, 1 - t * 1.8); // rapid relax
      }

      setTension((prev) => (Math.abs(prev - tens) > 0.025 ? tens : prev));
      setSecondsRemaining((prev) => (prev !== secsLeft ? secsLeft : prev));

      if (phase !== lastPhaseRef.current) {
        setPhaseState(phase);
        lastPhaseRef.current = phase;
        if (hapticEnabled) {
          try { hap("tap"); } catch {}
        }
        // Release burst snap al transitar hold → release (descarga visceral)
        if (phase === "release") {
          setReleaseBurst(1);
          const decayStart = performance.now();
          const decay = (n) => {
            const t = Math.min(1, (n - decayStart) / 700);
            setReleaseBurst(1 - t);
            if (t < 1 && !stopped) requestAnimationFrame(decay);
          };
          requestAnimationFrame(decay);
        }
      }

      if (currentCycle !== lastCycleRef.current) {
        lastCycleRef.current = currentCycle;
        setCycleIdx(currentCycle);
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
  }, [cycleTotal, totalMs, holdDurationMs, releaseDurationMs, hapticEnabled, reduceMotion]);

  const isHold = phaseState === "hold";
  const isRelease = phaseState === "release";
  const primaryPrompt = isHold ? PROMPT_TENSE : PROMPT_RELEASE;
  const bodyAnchor = isHold ? BODY_TENSE : BODY_RELEASE;
  const cyclesCompleted = Math.min(cycleIdx, targetHolds);

  // Core ellipse: scales DOWN during tense (compresses), back to baseline during release
  const coreScale = 1.0 - tension * 0.30;

  return (
    <div
      data-v2-core-isometric
      data-phase-state={phaseState}
      data-cycle-idx={cycleIdx}
      data-completed={completed ? "true" : "false"}
      data-testid="core-isometric-primitive"
      role="region"
      aria-label="Activación core isométrica"
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
          minHeight: 26,
          transition: reduceMotion ? "none" : "color 320ms ease-out",
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
          width="320" height="280" viewBox="0 0 320 280"
          style={{ position: "absolute" }}
        >
          <defs>
            <filter id={haloId} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation={isHold ? "7" : "12"} />
            </filter>
            <radialGradient id={vignetteId} cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.08" />
              <stop offset="60%" stopColor={phaseColor} stopOpacity="0.02" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.85" />
              <stop offset="60%" stopColor={phaseColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="160" cy="140" rx="140" ry="120" fill={`url(#${vignetteId})`} />

          {/* 4 lateral compression lines pointing inward toward core */}
          {[0, 90, 180, 270].map((deg, i) => {
            const angle = (deg * Math.PI) / 180;
            // During tense: lines converge inward; during release: extend outward
            const outerR = 95 + (1 - tension) * 18; // 95-113
            const innerR = 54 - tension * 8;
            const x1 = 160 + Math.cos(angle) * outerR;
            const y1 = 140 + Math.sin(angle) * outerR;
            const x2 = 160 + Math.cos(angle) * innerR;
            const y2 = 140 + Math.sin(angle) * innerR;
            const headLen = 7;
            const headAngle = Math.PI / 6;
            const hx1 = x2 + Math.cos(angle - headAngle - Math.PI) * headLen;
            const hy1 = y2 + Math.sin(angle - headAngle - Math.PI) * headLen;
            const hx2 = x2 + Math.cos(angle + headAngle - Math.PI) * headLen;
            const hy2 = y2 + Math.sin(angle + headAngle - Math.PI) * headLen;
            const op = isHold ? 0.55 + tension * 0.40 : 0.35;
            return (
              <g key={`compr-${i}`}>
                <line
                  x1={x1.toFixed(2)} y1={y1.toFixed(2)}
                  x2={x2.toFixed(2)} y2={y2.toFixed(2)}
                  stroke={phaseColor}
                  strokeWidth={isHold ? 1.8 : 1.2}
                  strokeLinecap="round"
                  opacity={op.toFixed(3)}
                />
                {isHold && (
                  <path
                    d={`M ${hx1.toFixed(2)} ${hy1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)} L ${hx2.toFixed(2)} ${hy2.toFixed(2)}`}
                    fill="none"
                    stroke={phaseColor}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={op.toFixed(3)}
                  />
                )}
              </g>
            );
          })}

          {/* Core zone — horizontal ellipse abdominal que se contrae durante tense */}
          <ellipse
            cx="160" cy="140"
            rx={(46 * coreScale).toFixed(2)}
            ry={(28 * coreScale).toFixed(2)}
            fill={`url(#${auraId})`}
            opacity={(0.50 + tension * 0.35).toFixed(3)}
            filter={reduceMotion ? undefined : `url(#${haloId})`}
          />
          <ellipse
            cx="160" cy="140"
            rx={(46 * coreScale).toFixed(2)}
            ry={(28 * coreScale).toFixed(2)}
            fill="none"
            stroke={phaseColor}
            strokeWidth={isHold ? 2.0 : 1.4}
            opacity={(0.80 + tension * 0.15).toFixed(3)}
          />

          {/* Interior compression lines — visibles solo durante tense, textura tensional
              que llena la ellipse contraída. 5 vertical lines inside con spacing horizontal. */}
          {tension > 0.15 && [-12, -6, 0, 6, 12].map((dx, i) => {
            const x = 160 + dx * coreScale;
            const halfH = 22 * coreScale; // height of the line within ellipse
            const op = tension * 0.55 * (1 - Math.abs(dx) / 16);
            return (
              <line
                key={`comp-${i}`}
                x1={x.toFixed(2)} y1={(140 - halfH).toFixed(2)}
                x2={x.toFixed(2)} y2={(140 + halfH).toFixed(2)}
                stroke={phaseColor}
                strokeWidth="0.8"
                opacity={op.toFixed(3)}
              />
            );
          })}

          {/* Release burst — 12 small particles que vuelan outward al transitar a release.
              Solo visibles durante el burst decay (0.7s). */}
          {releaseBurst > 0.05 && Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * Math.PI * 2 + 0.15;
            const dist = 50 + (1 - releaseBurst) * 60; // expand outward as burst decays
            const x = 160 + Math.cos(angle) * dist;
            const y = 140 + Math.sin(angle) * dist;
            return (
              <circle
                key={`burst-${i}`}
                cx={x.toFixed(2)} cy={y.toFixed(2)}
                r="2.2"
                fill={phaseColor}
                opacity={(releaseBurst * 0.85).toFixed(3)}
              />
            );
          })}

          {/* Core inner dot */}
          <circle
            cx="160" cy="140" r="6"
            fill={phaseColor}
            opacity="0.95"
            style={{
              transform: `scale(${(1 - tension * 0.20 + releaseBurst * 0.25).toFixed(3)})`,
              transformOrigin: "160px 140px",
              transition: reduceMotion ? "none" : "transform 180ms ease-out",
            }}
          />

          {/* 3 step dots horizontal abajo — hold cycle progress */}
          {Array.from({ length: targetHolds }).map((_, i) => {
            const cx = 160 - (targetHolds - 1) * 11 + i * 22;
            const isActive = i === cyclesCompleted;
            const isPast = i < cyclesCompleted;
            return (
              <circle
                key={`step-${i}`}
                cx={cx} cy="232" r={isActive ? 4.0 : 3.0}
                fill={phaseColor}
                opacity={isActive ? 0.95 : isPast ? 0.65 : 0.25}
                style={{ transition: reduceMotion ? "none" : "opacity 320ms ease-out, r 220ms ease-out" }}
              />
            );
          })}

          {/* Countdown */}
          <text
            x="160" y="260"
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
          opacity: 0.74,
          textAlign: "center",
          minHeight: 22,
        }}
      >
        {bodyAnchor}
      </span>

      <span
        aria-label={`Hold ${Math.min(cyclesCompleted + 1, targetHolds)} de ${targetHolds}`}
        style={{
          fontFamily: typography.familyMono,
          fontSize: 11,
          letterSpacing: "0.12em",
          color: colors.text.muted,
          opacity: 0.55,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {Math.min(cyclesCompleted + 1, targetHolds)} / {targetHolds}
      </span>
    </div>
  );
}
