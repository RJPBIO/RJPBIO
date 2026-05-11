"use client";
/* ═══════════════════════════════════════════════════════════════
   VerticalBreathAscensionPrimitive — Phase 7 SP-M-1
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 1 "Respiración Vertical" del
   protocolo #12 Neural Ascension. Visual unique: body silhouette
   + VERTICAL BREATH BEAM ascendiendo abdomen→pecho durante inhale
   + sustained beam en chest peak durante hold 2s + descendiendo
   pecho→abdomen durante exhale. Cadence 4-2-6.

   Mecanismo: respiración 4-2-6 con dirección somática reduce
   activación simpática (Zaccaro et al. 2018, Frontiers).

   Phase tracking dinámico per breath phase:
     Inhale (0-4s):
       - Primary: "INHALA · Sube abdomen → pecho"
       - Body anchor: "Atención sube"
       - Beam: rises from belly (y=200) to chest (y=140).
       - Direction arrow: ↑
     Hold (4-6s):
       - Primary: "SOSTÉN · En el pecho"
       - Body anchor: "Mantén · Centro arriba"
       - Beam: full at chest level glow.
       - No arrow.
     Exhale (6-12s):
       - Primary: "EXHALA · Baja pecho → abdomen"
       - Body anchor: "Atención baja"
       - Beam: descends from chest (y=140) to belly (y=200).
       - Direction arrow: ↓

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const PHASE_LABEL = "Respiración Vertical";

const INHALE_PROMPT = "INHALA · Sube abdomen → pecho";
const HOLD_PROMPT = "SOSTÉN · En el pecho";
const EXHALE_PROMPT = "EXHALA · Baja pecho → abdomen";
const INHALE_BODY = "Atención sube · Suave";
const HOLD_BODY = "Mantén · Centro arriba";
const EXHALE_BODY = "Atención baja · Suelta";

const DEFAULT_CADENCE = { in: 4, h1: 2, ex: 6, h2: 0 };

// Body silhouette y-coordinates
const CHEST_Y = 140;
const BELLY_Y = 200;

/**
 * @param {object} props
 * @param {number} [props.cycleCountTarget=2]
 * @param {{in:number,h1:number,ex:number,h2:number}} [props.cadence]
 * @param {boolean} [props.audioEnabled]
 * @param {boolean} [props.hapticEnabled]
 * @param {boolean} [props.voiceEnabled]
 * @param {(n:number)=>void} [props.onCycleComplete]
 * @param {()=>void} [props.onComplete]
 */
export default function VerticalBreathAscensionPrimitive({
  cycleCountTarget = 2,
  cadence = DEFAULT_CADENCE,
  audioEnabled = true, // eslint-disable-line no-unused-vars
  hapticEnabled = true,
  voiceEnabled = false, // eslint-disable-line no-unused-vars
  onCycleComplete,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const phaseColor = getCyanForPhase(0); // cyan-deep #0E7490 phase1
  const uid = useId();
  const haloId = `vbBlur-${uid}`;
  const vignetteId = `vbVignette-${uid}`;
  const auraId = `vbAura-${uid}`;
  const beamGradId = `vbBeamGrad-${uid}`;

  const onCycleCompleteRef = useRef(onCycleComplete);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCycleCompleteRef.current = onCycleComplete; }, [onCycleComplete]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const inhaleEndMs = cadence.in * 1000;
  const exhaleStartMs = (cadence.in + cadence.h1) * 1000;
  const exhaleEndMs = exhaleStartMs + cadence.ex * 1000;
  const cyclePeriodMs = (cadence.in + cadence.h1 + cadence.ex + cadence.h2) * 1000;
  const totalMs = cyclePeriodMs * cycleCountTarget;

  const [breathPhase, setBreathPhase] = useState("inhale");
  const [cycleIdx, setCycleIdx] = useState(0);
  const [beamY, setBeamY] = useState(BELLY_Y); // Top of beam — moves up/down
  const [beamIntensity, setBeamIntensity] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(cadence.in);
  const [completed, setCompleted] = useState(false);

  const lastCycleRef = useRef(0);
  const lastBreathPhaseRef = useRef("inhale");

  // RAF tick
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
      const cycleMs = elapsed % cyclePeriodMs;
      const currentCycle = Math.floor(elapsed / cyclePeriodMs);

      let beamTopY = BELLY_Y;
      let phase = "inhale";
      let secsLeft = 0;
      let intensity = 0.4;

      if (cycleMs < inhaleEndMs) {
        // INHALE: beam top rises BELLY_Y → CHEST_Y
        const t = cycleMs / inhaleEndMs;
        const eased = 1 - Math.pow(1 - t, 2); // ease-out
        beamTopY = BELLY_Y - (BELLY_Y - CHEST_Y) * eased;
        phase = "inhale";
        secsLeft = Math.ceil((inhaleEndMs - cycleMs) / 1000);
        intensity = 0.5 + eased * 0.4;
      } else if (cycleMs < exhaleStartMs) {
        // HOLD: beam stays at CHEST_Y, full intensity
        beamTopY = CHEST_Y;
        phase = "hold";
        secsLeft = Math.ceil((exhaleStartMs - cycleMs) / 1000);
        intensity = 0.95;
      } else if (cycleMs < exhaleEndMs) {
        // EXHALE: beam top descends CHEST_Y → BELLY_Y
        const t = (cycleMs - exhaleStartMs) / (cadence.ex * 1000);
        const eased = 1 - Math.pow(1 - t, 2); // ease-out
        beamTopY = CHEST_Y + (BELLY_Y - CHEST_Y) * eased;
        phase = "exhale";
        secsLeft = Math.ceil((exhaleEndMs - cycleMs) / 1000);
        intensity = 0.85 - eased * 0.45;
      } else {
        beamTopY = BELLY_Y;
        phase = "rest";
        secsLeft = 0;
        intensity = 0.40;
      }

      setBeamY((prev) => (Math.abs(prev - beamTopY) > 0.5 ? beamTopY : prev));
      setBeamIntensity((prev) => (Math.abs(prev - intensity) > 0.03 ? intensity : prev));
      setSecondsRemaining((prev) => (prev !== secsLeft ? secsLeft : prev));

      if (phase !== lastBreathPhaseRef.current) {
        setBreathPhase(phase);
        lastBreathPhaseRef.current = phase;
        if (hapticEnabled && (phase === "exhale" || phase === "hold")) {
          try { hap("tap"); } catch {}
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
          try { hapticProtocolSignature(12, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
        }
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [
    cycleCountTarget, hapticEnabled, reduceMotion,
    cyclePeriodMs, inhaleEndMs, exhaleStartMs, exhaleEndMs, totalMs,
    cadence.in, cadence.h1, cadence.ex, cadence.h2,
  ]);

  // Particles ambient
  const particleCanvasRef = useRef(null);
  const particleSysRef = useRef(null);
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return undefined;
    canvas.width = 280;
    canvas.height = 360;
    try {
      particleSysRef.current = createParticleSystem({ canvas, reducedMotion: reduceMotion });
      if (particleSysRef.current) {
        particleSysRef.current.setPhase("hold", 0);
        particleSysRef.current.start();
      }
    } catch (e) {}
    return () => {
      if (particleSysRef.current) {
        try { particleSysRef.current.stop(); } catch {}
        particleSysRef.current = null;
      }
    };
  }, [reduceMotion]);

  let primaryPrompt = "";
  let bodyAnchor = "";
  if (breathPhase === "inhale") { primaryPrompt = INHALE_PROMPT; bodyAnchor = INHALE_BODY; }
  else if (breathPhase === "hold") { primaryPrompt = HOLD_PROMPT; bodyAnchor = HOLD_BODY; }
  else if (breathPhase === "exhale") { primaryPrompt = EXHALE_PROMPT; bodyAnchor = EXHALE_BODY; }

  const cyclesCompleted = Math.min(cycleIdx, cycleCountTarget);

  return (
    <div
      data-v2-vertical-breath-ascension
      data-breath-phase={breathPhase}
      data-cycle-idx={cycleIdx}
      data-completed={completed ? "true" : "false"}
      data-testid="vertical-breath-ascension-primitive"
      role="region"
      aria-label="Respiración vertical, inhala 4 sube abdomen pecho, sostén 2, exhala 6 baja"
      style={{
        width: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.s24,
      }}
    >
      <span
        data-testid="vertical-breath-ascension-phase-label"
        style={{
          fontFamily: typography.family,
          fontSize: 11,
          fontWeight: typography.weight.medium,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: phaseColor,
          opacity: 0.75,
        }}
      >
        {PHASE_LABEL}
      </span>

      <p
        data-testid="vertical-breath-ascension-instruction"
        aria-live="polite"
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: 16,
          fontWeight: typography.weight.medium,
          letterSpacing: "0.06em",
          color: phaseColor,
          lineHeight: 1.3,
          textAlign: "center",
          maxWidth: 320,
          paddingInline: spacing.s16,
          minHeight: 22,
          textTransform: "uppercase",
          transition: reduceMotion ? "none" : "color 220ms ease-out",
        }}
      >
        {primaryPrompt}
      </p>

      <div
        style={{
          position: "relative",
          width: 280,
          height: 360,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <canvas
          ref={particleCanvasRef}
          data-testid="vertical-breath-ascension-particles"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: reduceMotion ? 0 : 0.16,
            transition: "opacity 200ms ease-out",
          }}
        />

        <svg
          data-testid="vertical-breath-ascension-silhouette"
          aria-hidden="true"
          width="240"
          height="340"
          viewBox="0 0 240 340"
          style={{ position: "absolute" }}
        >
          <defs>
            <filter id={haloId} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
            <radialGradient id={vignetteId} cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.06" />
              <stop offset="60%" stopColor={phaseColor} stopOpacity="0.02" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.45" />
              <stop offset="50%" stopColor={phaseColor} stopOpacity="0.15" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
            <linearGradient id={beamGradId} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={phaseColor} stopOpacity={beamIntensity * 0.15} />
              <stop offset="50%" stopColor={phaseColor} stopOpacity={beamIntensity * 0.85} />
              <stop offset="100%" stopColor={phaseColor} stopOpacity={beamIntensity * 0.95} />
            </linearGradient>
          </defs>

          <ellipse cx="120" cy="170" rx="110" ry="160" fill={`url(#${vignetteId})`} />

          {/* Body silhouette */}
          <path
            d="M 120 36
               C 109 36, 100 46, 100 60
               C 100 70, 104 79, 110 84
               L 110 90
               C 100 92, 86 96, 82 108
               C 78 122, 76 138, 76 158
               L 76 196
               C 76 210, 78 222, 84 234
               L 88 248
               C 88 260, 90 270, 90 280
               L 90 308
               C 90 314, 94 318, 100 318
               L 108 318
               C 110 314, 112 308, 112 300
               L 112 250
               L 128 250
               L 128 300
               C 128 308, 130 314, 132 318
               L 140 318
               C 146 318, 150 314, 150 308
               L 150 280
               C 150 270, 152 260, 152 248
               L 156 234
               C 162 222, 164 210, 164 196
               L 164 158
               C 164 138, 162 122, 158 108
               C 154 96, 140 92, 130 90
               L 130 84
               C 136 79, 140 70, 140 60
               C 140 46, 131 36, 120 36 Z"
            fill="none"
            stroke={phaseColor}
            strokeWidth="0.8"
            opacity="0.50"
          />

          {/* Static body landmarks */}
          <circle cx="120" cy="58" r="20" fill="none" stroke={phaseColor} strokeWidth="1.2" opacity="0.55" />
          {[{ x: 86, y: 100 }, { x: 154, y: 100 }].map((pt, i) => (
            <circle key={`sh-${i}`} cx={pt.x} cy={pt.y} r="5" fill={phaseColor} opacity="0.85" />
          ))}
          {[{ x1: 84, x2: 110 }, { x1: 130, x2: 156 }].map((seg, i) => (
            <line key={`ft-${i}`}
              x1={seg.x1} y1="320" x2={seg.x2} y2="320"
              stroke={phaseColor} strokeWidth="2" strokeLinecap="round"
              opacity="0.65"
            />
          ))}

          {/* CHEST anchor zone (always visible, brightens at peak hold) */}
          <ellipse
            cx="120" cy={CHEST_Y} rx="38" ry="20"
            fill={`url(#${auraId})`}
            opacity={breathPhase === "hold" ? 0.95 : 0.30 + beamIntensity * 0.25}
            filter={reduceMotion ? undefined : `url(#${haloId})`}
            style={{ transition: reduceMotion ? "none" : "opacity 220ms ease-out" }}
          />

          {/* BELLY anchor zone */}
          <ellipse
            cx="120" cy={BELLY_Y} rx="34" ry="22"
            fill={`url(#${auraId})`}
            opacity={breathPhase === "rest" || breathPhase === "exhale" ? 0.55 : 0.30}
            filter={reduceMotion ? undefined : `url(#${haloId})`}
            style={{ transition: reduceMotion ? "none" : "opacity 220ms ease-out" }}
          />

          {/* VERTICAL BREATH BEAM — fills from beamY (top) DOWN to BELLY_Y (base) */}
          {/* Beam represents air column from belly up to current top position */}
          <rect
            x="113" y={beamY} width="14" height={BELLY_Y - beamY}
            fill={`url(#${beamGradId})`}
            rx="7"
            style={{ transition: reduceMotion ? "none" : "y 80ms linear, height 80ms linear" }}
          />

          {/* Beam top glow (bright at the TOP — the moving wavefront) */}
          <circle
            cx="120" cy={beamY}
            r={6 + beamIntensity * 5}
            fill={phaseColor}
            opacity={beamIntensity * 0.85}
            filter={reduceMotion ? undefined : `url(#${haloId})`}
            style={{ transition: reduceMotion ? "none" : "all 80ms linear" }}
          />

          {/* Direction arrow chevrons — UP during inhale, DOWN during exhale */}
          {(breathPhase === "inhale" || breathPhase === "exhale") && [0, 1, 2].map((i) => {
            const yBase = breathPhase === "inhale"
              ? CHEST_Y - 30 - i * 10
              : CHEST_Y + 30 + i * 10;
            const direction = breathPhase === "inhale" ? -1 : 1;
            return (
              <path
                key={`arr-${i}`}
                d={breathPhase === "inhale"
                  ? `M 110 ${yBase + 5} L 120 ${yBase} L 130 ${yBase + 5}`
                  : `M 110 ${yBase} L 120 ${yBase + 5} L 130 ${yBase}`}
                fill="none"
                stroke={phaseColor}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={(0.3 + beamIntensity * 0.45) * (1 - i * 0.25)}
              />
            );
          })}

          {/* Countdown chip top-right */}
          <text
            x="220" y="50"
            fontSize="28"
            fontFamily={typography.familyMono}
            fontWeight="300"
            fill={phaseColor}
            opacity={secondsRemaining > 0 ? 0.85 : 0.20}
            textAnchor="end"
            style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}
          >
            {secondsRemaining > 0 ? secondsRemaining : ""}
          </text>
        </svg>
      </div>

      {/* Body anchor */}
      <span
        data-testid="vertical-breath-ascension-body-anchor"
        aria-live="polite"
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.01em",
          color: colors.text.secondary,
          opacity: 0.78,
          textAlign: "center",
          minHeight: 22,
          transition: reduceMotion ? "none" : "opacity 220ms ease-out",
        }}
      >
        {bodyAnchor}
      </span>

      {/* Cycle counter */}
      <span
        data-testid="vertical-breath-ascension-cycle-counter"
        aria-label={`Ciclo ${Math.min(cyclesCompleted + 1, cycleCountTarget)} de ${cycleCountTarget}`}
        style={{
          fontFamily: typography.familyMono,
          fontSize: 11,
          letterSpacing: "0.12em",
          color: colors.text.muted,
          opacity: 0.55,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {Math.min(cyclesCompleted + 1, cycleCountTarget)} / {cycleCountTarget}
      </span>
    </div>
  );
}
