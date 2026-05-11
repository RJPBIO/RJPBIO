"use client";
/* ═══════════════════════════════════════════════════════════════
   DiaphragmaticAnchorPrimitive — Phase 7 SP-L-1
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 1 "Anclaje Diafragmático" del
   protocolo #11 Body Anchor. Visual unique: body silhouette +
   HAND SVG sobre abdomen + diafragma expansion sync inhale +
   ENERGY DESCENT hacia suelo pélvico durante exhale.

   Cadence 4-0-8-0 (1:2 extendido). 2 cycles × 12s = 24s+.

   Mecanismo: exhalación 1:2 con mano en abdomen + descenso pélvico
   activa parasimpático profundo + propiocepción central.

   Phase tracking dinámico per breath phase:
     Inhale (0-4s):
       - Primary: "Inhala 4 · Siente expansión bajo la mano"
       - Body anchor: "Mano sobre abdomen · Sube suave"
       - Belly: scale 1.0 → 1.18 (visual abdomen expansion)
       - Energy descent: idle.
     Exhale (4-12s):
       - Primary: "EXHALA 8 · Suelta hacia las caderas"
       - Body anchor: "Energía baja al suelo pélvico"
       - Belly: scale 1.18 → 0.95 (release).
       - Energy descent: 5 particles flowing downward sync.

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - 1 mano celular + 1 mano sobre abdomen = perfect fit (no
       requiere ambas manos pinzadas).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const PHASE_LABEL = "Anclaje Diafragmático";

// Primary action — CONSTANT throughout phase (what to DO physically)
const PRIMARY_ACTION = "Pon una mano sobre tu abdomen";
const PRIMARY_RHYTHM = "Inhala 4 · Exhala 8";

// Dynamic per breath phase (what to FEEL right now)
const INHALE_PROMPT = "INHALA · El abdomen sube";
const EXHALE_PROMPT = "EXHALA · Suelta hacia las caderas";
const INHALE_BODY = "Sube suave bajo tu mano";
const EXHALE_BODY = "Energía baja al suelo pélvico";

const DEFAULT_CADENCE = { in: 4, h1: 0, ex: 8, h2: 0 };

const DESCENT_PARTICLE_COUNT = 5;

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
export default function DiaphragmaticAnchorPrimitive({
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
  const haloId = `daBlur-${uid}`;
  const vignetteId = `daVignette-${uid}`;
  const auraId = `daAura-${uid}`;
  const handGradId = `daHandGrad-${uid}`;
  const descentGradId = `daDescentGrad-${uid}`;

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
  const [bellyScale, setBellyScale] = useState(1.0);
  const [exhaleProgress, setExhaleProgress] = useState(0); // 0..1 within exhale phase
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

      let scale = 1.0;
      let phase = "inhale";
      let secsLeft = 0;
      let exProg = 0;

      if (cycleMs < inhaleEndMs) {
        const t = cycleMs / inhaleEndMs;
        // Smooth ease-out expand
        scale = 1.0 + 0.18 * (1 - Math.pow(1 - t, 2));
        phase = "inhale";
        secsLeft = Math.ceil((inhaleEndMs - cycleMs) / 1000);
        exProg = 0;
      } else if (cycleMs < exhaleStartMs) {
        scale = 1.18;
        phase = "hold";
        secsLeft = 0;
        exProg = 0;
      } else if (cycleMs < exhaleEndMs) {
        const t = (cycleMs - exhaleStartMs) / (cadence.ex * 1000);
        // Smooth ease-out release back below baseline (1.18 → 0.95)
        scale = 1.18 - 0.23 * (1 - Math.pow(1 - t, 2));
        phase = "exhale";
        secsLeft = Math.ceil((exhaleEndMs - cycleMs) / 1000);
        exProg = t;
      } else {
        scale = 1.0;
        phase = "rest";
        secsLeft = 0;
        exProg = 0;
      }

      setBellyScale((prev) => (Math.abs(prev - scale) > 0.005 ? scale : prev));
      setExhaleProgress((prev) => (Math.abs(prev - exProg) > 0.02 ? exProg : prev));
      setSecondsRemaining((prev) => (prev !== secsLeft ? secsLeft : prev));

      if (phase !== lastBreathPhaseRef.current) {
        setBreathPhase(phase);
        lastBreathPhaseRef.current = phase;
        if (phase === "exhale" && hapticEnabled) {
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
          try { hapticProtocolSignature(11, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
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

  const primaryPrompt = breathPhase === "inhale" ? INHALE_PROMPT : breathPhase === "exhale" ? EXHALE_PROMPT : "";
  const bodyAnchor = breathPhase === "inhale" ? INHALE_BODY : breathPhase === "exhale" ? EXHALE_BODY : "";
  const cyclesCompleted = Math.min(cycleIdx, cycleCountTarget);

  // Belly center coordinates in SVG
  const bellyCx = 120;
  const bellyCy = 200; // abdomen position
  // Hand position — sitting on belly slightly elevated
  const handCx = 120;
  const handCy = 188;

  return (
    <div
      data-v2-diaphragmatic-anchor
      data-breath-phase={breathPhase}
      data-cycle-idx={cycleIdx}
      data-completed={completed ? "true" : "false"}
      data-testid="diaphragmatic-anchor-primitive"
      role="region"
      aria-label="Anclaje diafragmático, mano en abdomen, inhala 4 expansión, exhala 8 hacia suelo pélvico"
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
        data-testid="diaphragmatic-anchor-phase-label"
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

      {/* PRIMARY ACTION — constant (what to DO with your hand) */}
      <div
        data-testid="diaphragmatic-anchor-instruction"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          paddingInline: spacing.s16,
          minHeight: 48,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: 17,
            fontWeight: typography.weight.medium,
            letterSpacing: "-0.02em",
            color: colors.text.strong,
            lineHeight: 1.3,
            textAlign: "center",
            maxWidth: 320,
          }}
        >
          {PRIMARY_ACTION}
        </p>
        <span
          style={{
            fontFamily: typography.family,
            fontSize: 13,
            fontWeight: typography.weight.light,
            letterSpacing: "-0.01em",
            color: colors.text.secondary,
            opacity: 0.75,
            textAlign: "center",
          }}
        >
          {PRIMARY_RHYTHM}
        </span>
      </div>

      {/* DYNAMIC PROMPT — changes per breath phase (what to FEEL now) */}
      <p
        data-testid="diaphragmatic-anchor-dynamic-prompt"
        aria-live="polite"
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: 14,
          fontWeight: typography.weight.medium,
          letterSpacing: "0.10em",
          color: phaseColor,
          textAlign: "center",
          maxWidth: 320,
          minHeight: 22,
          textTransform: "uppercase",
          opacity: 0.95,
          transition: reduceMotion ? "none" : "opacity 220ms ease-out",
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
          data-testid="diaphragmatic-anchor-particles"
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
          data-testid="diaphragmatic-anchor-silhouette"
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
            <linearGradient id={handGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.85" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0.45" />
            </linearGradient>
            <linearGradient id={descentGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.85" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
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

          {/* Head + shoulders + feet — minimal anchors (canon) */}
          <circle cx="120" cy="58" r="20" fill="none" stroke={phaseColor} strokeWidth="1.2" opacity="0.50" />
          {[{ x: 86, y: 100 }, { x: 154, y: 100 }].map((pt, i) => (
            <circle key={`sh-${i}`} cx={pt.x} cy={pt.y} r="5" fill={phaseColor} opacity="0.55" />
          ))}
          {[
            { x1: 84, x2: 110 },
            { x1: 130, x2: 156 },
          ].map((seg, i) => (
            <line key={`ft-${i}`}
              x1={seg.x1} y1="320" x2={seg.x2} y2="320"
              stroke={phaseColor} strokeWidth="2" strokeLinecap="round"
              opacity="0.55"
            />
          ))}

          {/* DIAPHRAGM/BELLY ZONE — expands on inhale, contracts on exhale */}
          <g style={{ transformOrigin: `${bellyCx}px ${bellyCy}px`, transform: `scale(${bellyScale.toFixed(3)})`, transition: reduceMotion ? "none" : "transform 80ms linear" }}>
            <ellipse
              cx={bellyCx} cy={bellyCy} rx="34" ry="26"
              fill={`url(#${auraId})`}
              opacity={breathPhase === "inhale" ? 0.95 : 0.55}
              filter={reduceMotion ? undefined : `url(#${haloId})`}
              style={{ transition: reduceMotion ? "none" : "opacity 220ms ease-out" }}
            />
            <ellipse
              cx={bellyCx} cy={bellyCy} rx="20" ry="14"
              fill="none"
              stroke={phaseColor}
              strokeWidth="1.2"
              opacity={breathPhase === "inhale" ? 0.85 : 0.45}
              strokeDasharray="3 4"
              style={{ transition: reduceMotion ? "none" : "opacity 220ms ease-out" }}
            />
          </g>

          {/* "HAND HERE" indicator — dashed circle around belly area showing where hand goes */}
          <circle
            cx={bellyCx} cy={bellyCy}
            r="38"
            fill="none"
            stroke={phaseColor}
            strokeWidth="0.8"
            strokeDasharray="3 4"
            opacity="0.40"
          />

          {/* DESCENT COLUMN — vertical gradient channel from belly to pelvic floor */}
          {/* Always visible (subtle), brightens during exhale */}
          <rect
            x="113" y="220" width="14" height="40"
            fill={`url(#${descentGradId})`}
            opacity={breathPhase === "exhale" ? 0.30 + exhaleProgress * 0.55 : 0.20}
            rx="7"
            style={{ transition: reduceMotion ? "none" : "opacity 220ms ease-out" }}
          />

          {/* DESCENT ARROWS — 3 chevrons pointing down (only during exhale) */}
          {breathPhase === "exhale" && [0, 1, 2].map((i) => {
            const yBase = 224 + i * 12;
            // Stagger fade-in based on exhale progress
            const arrowStartT = i * 0.20;
            const arrowOpacity = exhaleProgress > arrowStartT
              ? Math.min(1, (exhaleProgress - arrowStartT) / 0.15)
              : 0;
            return (
              <path
                key={`arr-${i}`}
                d={`M 114 ${yBase} L 120 ${yBase + 5} L 126 ${yBase}`}
                fill="none"
                stroke={phaseColor}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={arrowOpacity * 0.85}
              />
            );
          })}

          {/* Endpoint anchor at descent target — pure visual, no label */}
          <g style={{ transition: reduceMotion ? "none" : "opacity 220ms ease-out" }}>
            <ellipse
              cx="120" cy="262" rx="20" ry="3"
              fill={phaseColor}
              opacity={breathPhase === "exhale" ? 0.45 + exhaleProgress * 0.40 : 0.18}
              filter={reduceMotion ? undefined : `url(#${haloId})`}
            />
            <line
              x1="100" y1="262" x2="140" y2="262"
              stroke={phaseColor}
              strokeWidth="1.2"
              opacity={breathPhase === "exhale" ? 0.55 + exhaleProgress * 0.40 : 0.25}
              strokeLinecap="round"
            />
          </g>

          {/* ENERGY DESCENT particles streaming inside column (exhale only) */}
          {breathPhase === "exhale" && Array.from({ length: DESCENT_PARTICLE_COUNT }).map((_, i) => {
            const offset = i / DESCENT_PARTICLE_COUNT;
            const t = (exhaleProgress + offset) % 1;
            const py = 220 + t * 40;
            const op = (1 - Math.pow(Math.abs(t - 0.5) * 2, 1.6)) * 0.75;
            return (
              <circle
                key={`desc-${i}`}
                cx="120" cy={py}
                r={2.5 + (1 - t) * 1.5}
                fill={phaseColor}
                opacity={op}
                filter={reduceMotion ? undefined : `url(#${haloId})`}
              />
            );
          })}

          {/* Countdown chip top-right */}
          <text
            x="200" y="50"
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
        data-testid="diaphragmatic-anchor-body-anchor"
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
        data-testid="diaphragmatic-anchor-cycle-counter"
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
