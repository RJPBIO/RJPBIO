"use client";
/* ═══════════════════════════════════════════════════════════════
   SteelCoreActivationPrimitive — Phase 7 SP-J-2 v2 (premium)
   ───────────────────────────────────────────────────────────────
   Primitive dedicated dual-mode para Phase 2 "Núcleo de Acero" del
   protocolo #9 Steel Core Reset.

   v2 elevation: Apple-grade premium visual signature.
     - Energy column vertical (gradient lineal cyan) que se ilumina
       progressive per stage = "núcleo de acero" como columna real.
     - Anchor orbs (head/shoulders/core/feet) con halos blur.
     - Energy wave trail (luz que viaja bottom-up durante stage
       transitions — visual bottom→top progression).
     - Ribs lateral expansion: arcs sofisticados (no flechas crudas)
       que respiran sync con cadence.
     - Cinematic backdrop: radial vignette + scanline subtle.
     - SVG defs + blur filters + linear/radial gradients.

   Two modes:
     mode="activation" (sub-acto 0, 0-25s):
       5-stage progression (5s each) feet → core → spine → shoulders → head.
       Energy wave travels up per transition.
       Vertical core column llena progressive.

     mode="lateral_breath" (sub-acto 1, 0-20s):
       Body silhouette completa persiste (continuity).
       Ribs lateral arcs expand sync inhale/contract sync exhale.
       Vertical core remains FIRM (estable) — visualiza estabilidad.
       Cycle counter X/2.

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - Body silhouette mental, NO required physical posture extra.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const PHASE_LABEL = "Núcleo de Acero";
const DEFAULT_CADENCE = { in: 4, h1: 0, ex: 6, h2: 0 };

const STAGES = [
  { key: "feet",      prompt: "Pies firmes en el suelo",      anchor: "Apoyo · Sentir el peso" },
  { key: "core",      prompt: "Ombligo hacia adentro suave",  anchor: "Centro activado" },
  { key: "spine",     prompt: "Columna alineada · vertical",  anchor: "Eje firme" },
  { key: "shoulders", prompt: "Hombros sueltos · sin tensión", anchor: "Hombros abajo" },
  { key: "head",      prompt: "Cabeza alineada · al frente",  anchor: "Cabeza arriba" },
];

const STAGE_DURATION_MS = 5000;
const TOTAL_STAGES = STAGES.length;

const LATERAL_INHALE_PROMPT = "Inhala 4 · Costillas a los lados";
const LATERAL_EXHALE_PROMPT = "Exhala 6 · Núcleo firme";
const LATERAL_INHALE_BODY = "Costillas se abren · No el pecho";
const LATERAL_EXHALE_BODY = "Suelta · Núcleo se mantiene";

/**
 * @param {object} props
 * @param {"activation"|"lateral_breath"} [props.mode]
 * @param {number} [props.duration_ms]
 * @param {{in:number,h1:number,ex:number,h2:number}} [props.breathCadence]
 * @param {boolean} [props.audioEnabled]
 * @param {boolean} [props.hapticEnabled]
 * @param {boolean} [props.voiceEnabled]
 * @param {()=>void} [props.onComplete]
 */
export default function SteelCoreActivationPrimitive({
  mode = "activation",
  duration_ms,
  breathCadence = DEFAULT_CADENCE,
  audioEnabled = true,  
  hapticEnabled = true,
  voiceEnabled = false,  
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const phaseColor = getCyanForPhase(1); // cyan-cool #67E8F9
  const uid = useId();
  const blurId = `scaBlur-${uid}`;
  const haloId = `scaHalo-${uid}`;
  const vignetteId = `scaVignette-${uid}`;
  const coreId = `scaCore-${uid}`;
  const auraId = `scaAura-${uid}`;

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const totalDurationMs = duration_ms || (mode === "activation"
    ? STAGE_DURATION_MS * TOTAL_STAGES
    : 20000);

  const cyclePeriodMs = (breathCadence.in + breathCadence.h1 + breathCadence.ex + breathCadence.h2) * 1000;
  const totalCycles = Math.max(1, Math.floor(totalDurationMs / cyclePeriodMs));

  const [completed, setCompleted] = useState(false);
  const [stageIdx, setStageIdx] = useState(0);
  const [stageProgress, setStageProgress] = useState(0); // 0-1 within current stage
  const [breathPhase, setBreathPhase] = useState("inhale");
  const [cycleIdx, setCycleIdx] = useState(0);
  const [lateralExpansion, setLateralExpansion] = useState(0);
  const [waveY, setWaveY] = useState(null); // null = no wave; number = svg y

  const lastStageRef = useRef(-1);
  const lastBreathPhaseRef = useRef("inhale");
  const lastCycleRef = useRef(0);
  const stageStartTimeRef = useRef(0);

  // Energy wave animation: when stage transitions, wave travels up
  const triggerEnergyWave = (newStage) => {
    if (reduceMotion) return;
    // Wave starts at the new stage's body Y position
    const stageYMap = {
      0: 285, // feet
      1: 160, // core
      2: 130, // spine
      3: 90,  // shoulders
      4: 55,  // head
    };
    setWaveY(stageYMap[newStage] ?? 285);
    setTimeout(() => setWaveY(null), 1400);
  };

  // Main RAF tick
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
    stageStartTimeRef.current = startTime;

    const inhaleEndMs = breathCadence.in * 1000;
    const exhaleStartMs = (breathCadence.in + breathCadence.h1) * 1000;
    const exhaleEndMs = exhaleStartMs + breathCadence.ex * 1000;

    const tick = (now) => {
      if (stopped) return;
      const elapsed = now - startTime;

      if (mode === "activation") {
        const stage = Math.min(TOTAL_STAGES - 1, Math.floor(elapsed / STAGE_DURATION_MS));
        const inStageMs = elapsed - stage * STAGE_DURATION_MS;
        const progress = Math.min(1, inStageMs / STAGE_DURATION_MS);
        if (stage !== lastStageRef.current) {
          lastStageRef.current = stage;
          setStageIdx(stage);
          triggerEnergyWave(stage);
          if (hapticEnabled && stage > 0) {
            try { hap("tap"); } catch {}
          }
        }
        setStageProgress((prev) => (Math.abs(prev - progress) > 0.02 ? progress : prev));
      } else {
        const cycleMs = elapsed % cyclePeriodMs;
        const currentCycle = Math.floor(elapsed / cyclePeriodMs);

        let phase = "inhale";
        let expansion = 0;
        if (cycleMs < inhaleEndMs) {
          const t = cycleMs / inhaleEndMs;
          expansion = 1 - Math.pow(1 - t, 2.2);
          phase = "inhale";
        } else if (cycleMs < exhaleStartMs) {
          expansion = 1;
          phase = "hold";
        } else if (cycleMs < exhaleEndMs) {
          const t = (cycleMs - exhaleStartMs) / (breathCadence.ex * 1000);
          expansion = Math.pow(1 - t, 1.6);
          phase = "exhale";
        } else {
          expansion = 0;
          phase = "rest";
        }

        if (phase !== lastBreathPhaseRef.current) {
          setBreathPhase(phase);
          lastBreathPhaseRef.current = phase;
        }
        setLateralExpansion((prev) => (Math.abs(prev - expansion) > 0.015 ? expansion : prev));

        if (currentCycle !== lastCycleRef.current) {
          lastCycleRef.current = currentCycle;
          setCycleIdx(currentCycle);
        }
      }

      if (elapsed >= totalDurationMs) {
        stopped = true;
        setCompleted(true);
        if (hapticEnabled) {
          try { hapticProtocolSignature(9, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
        }
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [
    mode, totalDurationMs, hapticEnabled, reduceMotion,
    cyclePeriodMs, breathCadence.in, breathCadence.h1, breathCadence.ex, breathCadence.h2,
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

  // Compute prompt + body anchor
  let primaryPrompt = "";
  let bodyAnchor = "";
  if (mode === "activation") {
    const stage = STAGES[stageIdx] || STAGES[0];
    primaryPrompt = stage.prompt;
    bodyAnchor = stage.anchor;
  } else {
    if (breathPhase === "inhale") {
      primaryPrompt = LATERAL_INHALE_PROMPT;
      bodyAnchor = LATERAL_INHALE_BODY;
    } else if (breathPhase === "exhale") {
      primaryPrompt = LATERAL_EXHALE_PROMPT;
      bodyAnchor = LATERAL_EXHALE_BODY;
    } else {
      primaryPrompt = LATERAL_INHALE_PROMPT;
      bodyAnchor = LATERAL_INHALE_BODY;
    }
  }

  // Body part lit state
  const stageActive = (key) => {
    if (mode === "activation") {
      const idx = STAGES.findIndex((s) => s.key === key);
      return stageIdx >= idx;
    }
    return true; // lateral_breath: full body lit (post-activation)
  };

  // Stage-specific intensity (current active stage = 1.0; passed = 0.7)
  const stageIntensity = (key) => {
    const idx = STAGES.findIndex((s) => s.key === key);
    if (mode !== "activation") return 0.85;
    if (stageIdx === idx) return 1.0;
    if (stageIdx > idx) return 0.65;
    return 0.0;
  };

  // Core column fill height (activation: progressive 0→1; lateral: 1)
  const coreColumnFill = mode === "activation"
    ? (stageIdx + stageProgress) / TOTAL_STAGES
    : 1;

  return (
    <div
      data-v2-steel-core-activation
      data-mode={mode}
      data-stage-idx={stageIdx}
      data-stage-key={STAGES[stageIdx]?.key}
      data-breath-phase={breathPhase}
      data-cycle-idx={cycleIdx}
      data-completed={completed ? "true" : "false"}
      data-testid="steel-core-activation-primitive"
      role="region"
      aria-label={mode === "activation"
        ? "Activación postural ascendente, pies a cabeza"
        : "Respiración lateral con núcleo activado"}
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
        data-testid="steel-core-activation-phase-label"
        style={{
          fontFamily: typography.family,
          fontSize: 11,
          fontWeight: typography.weight.medium,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: phaseColor,
          opacity: 0.7,
        }}
      >
        {PHASE_LABEL}
      </span>

      <p
        data-testid="steel-core-activation-instruction"
        aria-live="polite"
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: 17,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.02em",
          color: colors.text.strong,
          lineHeight: 1.3,
          textAlign: "center",
          maxWidth: 320,
          paddingInline: spacing.s16,
          transition: reduceMotion ? "none" : "opacity 220ms ease-out",
          minHeight: 24,
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
          data-testid="steel-core-activation-particles"
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

        {/* Premium SVG body — anatomically suggestive but stylized */}
        <svg
          data-testid="steel-core-activation-silhouette"
          aria-hidden="true"
          width="240"
          height="340"
          viewBox="0 0 240 340"
          style={{ position: "absolute" }}
        >
          <defs>
            <filter id={blurId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
            <filter id={haloId} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
            <radialGradient id={vignetteId} cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.06" />
              <stop offset="60%" stopColor={phaseColor} stopOpacity="0.02" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
            {/* Core column gradient — fills bottom-up per progress */}
            <linearGradient id={coreId} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0" />
              <stop offset={`${Math.max(0.001, coreColumnFill * 100 - 5)}%`} stopColor={phaseColor} stopOpacity="0" />
              <stop offset={`${Math.max(0.002, coreColumnFill * 100)}%`} stopColor={phaseColor} stopOpacity="0.9" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </linearGradient>
            <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.45" />
              <stop offset="50%" stopColor={phaseColor} stopOpacity="0.15" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Cinematic vignette behind silhouette */}
          <ellipse cx="120" cy="170" rx="110" ry="160" fill={`url(#${vignetteId})`} />

          {/* Outer body silhouette — head + torso + legs single closed path.
              Crotch flat (no upward peak) — connects inner legs at y=248 horizontally. */}
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
            opacity={mode === "activation" ? 0.22 + (stageIdx / TOTAL_STAGES) * 0.30 : 0.55}
            style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
          />

          {/* Vertical CORE energy column — center spine + extends to feet floor */}
          <rect
            x="116" y="40" width="8" height="280"
            fill={`url(#${coreId})`}
            rx="4"
            opacity="0.95"
            style={{ transition: reduceMotion ? "none" : "all 400ms ease-out" }}
          />
          <rect
            x="113" y="40" width="14" height="280"
            fill="none"
            stroke={phaseColor}
            strokeWidth="0.5"
            opacity={coreColumnFill * 0.40}
            rx="6"
            style={{ transition: reduceMotion ? "none" : "opacity 400ms ease-out" }}
          />

          {/* HEAD — circle + halo */}
          <circle
            cx="120" cy="58" r="20"
            fill={phaseColor}
            opacity={stageActive("head") ? stageIntensity("head") * 0.18 : 0.04}
            style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
          />
          <circle
            cx="120" cy="58" r="20"
            fill="none"
            stroke={phaseColor}
            strokeWidth="1.2"
            opacity={stageActive("head") ? stageIntensity("head") * 0.85 : 0.20}
            style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
          />
          {stageActive("head") && (
            <circle
              cx="120" cy="58" r="32"
              fill={`url(#${auraId})`}
              opacity={stageIntensity("head")}
              filter={reduceMotion ? undefined : `url(#${haloId})`}
              style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
            />
          )}

          {/* SHOULDER orbs — left+right with halos */}
          {[
            { x: 86, y: 100 },
            { x: 154, y: 100 },
          ].map((pt, i) => (
            <g key={`sh-${i}`}>
              <circle
                cx={pt.x} cy={pt.y} r="14"
                fill={`url(#${auraId})`}
                opacity={stageActive("shoulders") ? stageIntensity("shoulders") * 0.85 : 0}
                filter={reduceMotion ? undefined : `url(#${haloId})`}
                style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
              />
              <circle
                cx={pt.x} cy={pt.y} r="5"
                fill={phaseColor}
                opacity={stageActive("shoulders") ? stageIntensity("shoulders") * 0.95 : 0.20}
                style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
              />
            </g>
          ))}

          {/* CORE orb — central abdomen, gradient + pulse */}
          <circle
            cx="120" cy="172" r="28"
            fill={`url(#${auraId})`}
            opacity={stageActive("core") ? stageIntensity("core") * 0.85 : 0.10}
            filter={reduceMotion ? undefined : `url(#${haloId})`}
            style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
          />
          <circle
            cx="120" cy="172" r="14"
            fill="none"
            stroke={phaseColor}
            strokeWidth="1.5"
            opacity={stageActive("core") ? stageIntensity("core") * 0.85 : 0.18}
            style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
          />
          {stageActive("core") && stageIdx === 1 && (
            // Inward indicator (visual cue "ombligo adentro") — subtle inward arrow ring
            <circle
              cx="120" cy="172" r="10"
              fill="none"
              stroke={phaseColor}
              strokeWidth="0.5"
              strokeDasharray="2 4"
              opacity="0.55"
            />
          )}

          {/* RIBS lateral expansion arcs (lateral_breath mode only) */}
          {mode === "lateral_breath" && (
            <>
              {/* Left rib arc — opens outward on inhale */}
              <path
                d={`M 96 130
                    Q ${96 - 10 - lateralExpansion * 14} 145, 96 160`}
                fill="none"
                stroke={phaseColor}
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity={0.45 + lateralExpansion * 0.40}
                style={{ transition: reduceMotion ? "none" : "opacity 220ms ease-out" }}
              />
              {/* Left rib echo */}
              <path
                d={`M 90 138
                    Q ${90 - 12 - lateralExpansion * 18} 152, 90 168`}
                fill="none"
                stroke={phaseColor}
                strokeWidth="1"
                strokeLinecap="round"
                opacity={(0.30 + lateralExpansion * 0.35) * 0.85}
                style={{ transition: reduceMotion ? "none" : "opacity 220ms ease-out" }}
              />
              {/* Right rib arc */}
              <path
                d={`M 144 130
                    Q ${144 + 10 + lateralExpansion * 14} 145, 144 160`}
                fill="none"
                stroke={phaseColor}
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity={0.45 + lateralExpansion * 0.40}
                style={{ transition: reduceMotion ? "none" : "opacity 220ms ease-out" }}
              />
              {/* Right rib echo */}
              <path
                d={`M 150 138
                    Q ${150 + 12 + lateralExpansion * 18} 152, 150 168`}
                fill="none"
                stroke={phaseColor}
                strokeWidth="1"
                strokeLinecap="round"
                opacity={(0.30 + lateralExpansion * 0.35) * 0.85}
                style={{ transition: reduceMotion ? "none" : "opacity 220ms ease-out" }}
              />
            </>
          )}

          {/* FEET — solid floor anchor lines + glow */}
          {[
            { x1: 84, x2: 110 },
            { x1: 130, x2: 156 },
          ].map((seg, i) => (
            <g key={`ft-${i}`}>
              <ellipse
                cx={(seg.x1 + seg.x2) / 2} cy="320" rx="18" ry="3"
                fill={`url(#${auraId})`}
                opacity={stageActive("feet") ? stageIntensity("feet") * 0.85 : 0}
                filter={reduceMotion ? undefined : `url(#${haloId})`}
                style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
              />
              <line
                x1={seg.x1} y1="320" x2={seg.x2} y2="320"
                stroke={phaseColor} strokeWidth="2.5" strokeLinecap="round"
                opacity={stageActive("feet") ? stageIntensity("feet") * 0.95 : 0.20}
                style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
              />
            </g>
          ))}

          {/* Energy wave — traveling pulse durante stage transition */}
          {waveY !== null && (
            <ellipse
              cx="120" cy={waveY} rx="40" ry="6"
              fill={phaseColor}
              opacity="0.55"
              filter={reduceMotion ? undefined : `url(#${haloId})`}
              style={{
                animation: reduceMotion ? "none" : "scaWavePulse 1400ms ease-out 1",
              }}
            />
          )}
        </svg>

        <style jsx>{`
          @keyframes scaWavePulse {
            0% { opacity: 0; transform: scaleY(0.5); }
            30% { opacity: 0.85; transform: scaleY(1); }
            100% { opacity: 0; transform: scaleY(1.4); }
          }
        `}</style>
      </div>

      {/* Body anchor */}
      <span
        data-testid="steel-core-activation-body-anchor"
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

      {/* Bottom counter */}
      {mode === "activation" ? (
        <span
          data-testid="steel-core-activation-stage-counter"
          aria-label={`Etapa ${stageIdx + 1} de ${TOTAL_STAGES}`}
          style={{
            fontFamily: typography.familyMono,
            fontSize: 11,
            letterSpacing: "0.12em",
            color: colors.text.muted,
            opacity: 0.55,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {stageIdx + 1} / {TOTAL_STAGES}
        </span>
      ) : (
        <span
          data-testid="steel-core-activation-cycle-counter"
          aria-label={`Ciclo ${Math.min(cycleIdx + 1, totalCycles)} de ${totalCycles}`}
          style={{
            fontFamily: typography.familyMono,
            fontSize: 11,
            letterSpacing: "0.12em",
            color: colors.text.muted,
            opacity: 0.55,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {Math.min(cycleIdx + 1, totalCycles)} / {totalCycles}
        </span>
      )}
    </div>
  );
}
