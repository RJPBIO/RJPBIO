"use client";
/* ═══════════════════════════════════════════════════════════════
   IsometricDischargePrimitive — Phase 7 SP-H-2
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 2 "Contracción Isométrica" del
   protocolo #7 HyperShift. Reemplaza shared isometric_grip_prompt
   con primitive multi-exercise wrapper con clarity lessons +
   lenguaje común.

   Pattern: 3 ciclos × (10s aprieta + 5s suelta) = 45s.
     APRIETA suave (al 10% de fuerza, NO al máximo) → activa
     propioceptores sin gasto energético (Levine 2010 Somatic
     Experiencing).
     SUELTA completa → release y reset propioceptivo.

   Lenguaje común aplicado:
     - "10% fuerza máxima" → "Aprieta suave · No con fuerza"
     - "Contracción isométrica" → mantener en phase label (brand)
       pero body anchor accesible.

   Multi-exercise tracks layered (6):
     1. PRIMARY motor: SVG fist visual (mano abre/cierra per phase).
     2. DYNAMIC state APRIETA · X / SUELTA · X big text con countdown
        exacto sync inhale-style (clarity lessons SP-G-2 aplicadas).
     3. CYCLE indicator 3 chips active/done/pending.
     4. BODY anchor sustained: "Aprieta suave · No con fuerza".
     5. PARTICLES ambient.
     6. PHASE label "Contracción Isométrica" cyan-cool.

   Functional human logic:
     - APRIETA 10s: cierra puños suave, sin esfuerzo agresivo
       (visual fist closed + countdown 10..1).
     - SUELTA 5s: abre completamente (visual fist open + countdown
       5..1).
     - Repite 3 ciclos.

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - Aprieta puños: AMBOS puños (aunque uno sostenga celular el
       gesto es minimal — apretar dedos con celular en mano sigue
       válido).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const HOLD_MS = 10000;
const RELEASE_MS = 5000;
const CYCLE_MS = HOLD_MS + RELEASE_MS; // 15000ms
const DEFAULT_TARGET_HOLDS = 3;

const PHASE_LABEL = "Contracción Isométrica";
const INSTRUCTION = "Aprieta los puños suave · 10s · Suelta · 5s · Tres ciclos";
const BODY_ANCHOR_CUE = "Aprieta suave · No con fuerza";

/**
 * @param {object} props
 * @param {number} [props.target_holds=3]
 * @param {number} [props.hold_duration_ms=10000]
 * @param {number} [props.release_duration_ms=5000]
 * @param {boolean} [props.audioEnabled=true]
 * @param {boolean} [props.hapticEnabled=true]
 * @param {boolean} [props.voiceEnabled=false]
 * @param {()=>void} [props.onComplete]
 */
export default function IsometricDischargePrimitive({
  target_holds = DEFAULT_TARGET_HOLDS,
  hold_duration_ms = HOLD_MS,
  release_duration_ms = RELEASE_MS,
  audioEnabled = true,  
  hapticEnabled = true,
  voiceEnabled = false,  
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const phaseColor = getCyanForPhase(1); // cyan-cool #67E8F9 phase2

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const cycleMs = hold_duration_ms + release_duration_ms;
  const totalMs = cycleMs * target_holds;

  // ─── Phase state + countdown ─────────────────────────────────────
  const [grip, setGrip] = useState("hold"); // "hold" | "release"
  const [cycleIdx, setCycleIdx] = useState(0);
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(Math.ceil(hold_duration_ms / 1000));
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
    const startTime = performance.now();
    let raf;
    const tick = (now) => {
      if (stopped) return;
      const elapsed = now - startTime;
      const completedCycles = Math.floor(elapsed / cycleMs);
      const cycleElapsed = elapsed % cycleMs;

      let phase, secsLeft;
      if (cycleElapsed < hold_duration_ms) {
        phase = "hold";
        secsLeft = Math.max(1, Math.ceil((hold_duration_ms - cycleElapsed) / 1000));
      } else {
        phase = "release";
        secsLeft = Math.max(1, Math.ceil((cycleMs - cycleElapsed) / 1000));
      }

      setGrip((prev) => (prev !== phase ? phase : prev));
      setCycleIdx((prev) => (prev !== completedCycles ? completedCycles : prev));
      setPhaseSecondsLeft((prev) => (prev !== secsLeft ? secsLeft : prev));

      if (elapsed >= totalMs) {
        stopped = true;
        setCompleted(true);
        if (hapticEnabled) {
          try { hapticProtocolSignature(7, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
        }
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
        return;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [cycleMs, hold_duration_ms, totalMs, hapticEnabled, reduceMotion]);

  // Haptic tap on each phase change.
  useEffect(() => {
    if (!hapticEnabled) return undefined;
    if (completed) return undefined;
    try { hap("tap"); } catch {}
    return undefined;
  }, [grip, hapticEnabled, completed]);

  // ─── Particles ambient ────────────────────────────────────────────
  const particleCanvasRef = useRef(null);
  const particleSysRef = useRef(null);
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return undefined;
    canvas.width = 320;
    canvas.height = 240;
    try {
      particleSysRef.current = createParticleSystem({ canvas, reducedMotion: reduceMotion });
      if (particleSysRef.current) {
        particleSysRef.current.setPhase("hold", 0);
        particleSysRef.current.start();
      }
    } catch (e) { /* noop */ }
    return () => {
      if (particleSysRef.current) {
        try { particleSysRef.current.stop(); } catch {}
        particleSysRef.current = null;
      }
    };
  }, [reduceMotion]);

  const stateLabel = grip === "hold" ? "Aprieta" : "Suelta";

  return (
    <div
      data-v2-isometric-discharge
      data-grip={grip}
      data-completed={completed ? "true" : "false"}
      data-testid="isometric-discharge-primitive"
      role="region"
      aria-label="Contracción Isométrica, aprieta los puños suave 10 segundos, suelta 5 segundos, tres ciclos"
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
      {/* Phase label */}
      <span
        data-testid="isometric-discharge-phase-label"
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

      {/* Instrucción primaria */}
      <p
        data-testid="isometric-discharge-instruction"
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: 16,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.01em",
          color: colors.text.strong,
          lineHeight: 1.35,
          textAlign: "center",
          maxWidth: 320,
          paddingInline: spacing.s16,
        }}
      >
        {INSTRUCTION}
      </p>

      {/* Visual stack: particles + fist SVG abre/cierra */}
      <div
        style={{
          position: "relative",
          width: 280,
          height: 220,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <canvas
          ref={particleCanvasRef}
          data-testid="isometric-discharge-particles"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: reduceMotion ? 0 : 0.30,
            transition: "opacity 200ms ease-out",
          }}
        />

        {/* Hand SVG anatómicamente proporcionada — palma + 4 dedos + pulgar
            + muñeca. Cross-fade entre OPEN (extendida) y CLOSED (puño). */}
        <svg
          width="180"
          height="220"
          viewBox="0 0 200 240"
          aria-label="Mano abierta o cerrada según fase"
          data-testid="isometric-discharge-fist-svg"
          style={{ position: "relative", zIndex: 1 }}
        >
          <defs>
            <filter id="handTensionGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* OPEN HAND — palma + 4 dedos extendidos + pulgar a la derecha */}
          <g
            data-testid="isometric-discharge-open"
            style={{
              opacity: grip === "release" ? 1 : 0,
              transition: reduceMotion ? "none" : "opacity 260ms cubic-bezier(0.32, 0.72, 0, 1)",
            }}
          >
            {/* Muñeca (rect angosto al fondo) */}
            <rect
              x="78" y="200" width="44" height="20" rx="6"
              fill="rgba(103,232,249,0.10)"
              stroke={phaseColor}
              strokeWidth="1"
              opacity="0.7"
            />
            {/* Palma — forma orgánica trapezoidal */}
            <path
              d="M 70 130
                 Q 70 118 80 116
                 L 120 116
                 Q 130 118 130 130
                 L 132 195
                 Q 132 208 118 210
                 L 82 210
                 Q 68 208 68 195
                 Z"
              fill="rgba(103,232,249,0.16)"
              stroke={phaseColor}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            {/* Pinky (meñique) — el más corto, izquierda */}
            <rect
              x="68" y="76" width="12" height="46" rx="6"
              fill="rgba(103,232,249,0.20)"
              stroke={phaseColor}
              strokeWidth="1.2"
            />
            {/* Ring (anular) */}
            <rect
              x="82" y="56" width="12" height="66" rx="6"
              fill="rgba(103,232,249,0.20)"
              stroke={phaseColor}
              strokeWidth="1.2"
            />
            {/* Middle (medio) — el más largo */}
            <rect
              x="96" y="44" width="12" height="78" rx="6"
              fill="rgba(103,232,249,0.20)"
              stroke={phaseColor}
              strokeWidth="1.2"
            />
            {/* Index (índice) */}
            <rect
              x="110" y="56" width="12" height="66" rx="6"
              fill="rgba(103,232,249,0.20)"
              stroke={phaseColor}
              strokeWidth="1.2"
            />
            {/* Thumb (pulgar) — angulado a la derecha */}
            <g transform="rotate(-32 138 142)">
              <rect
                x="130" y="135" width="46" height="14" rx="7"
                fill="rgba(103,232,249,0.20)"
                stroke={phaseColor}
                strokeWidth="1.2"
              />
            </g>
            {/* Línea de los nudillos (sutil) */}
            <path
              d="M 70 122 Q 100 125 130 122"
              fill="none"
              stroke={phaseColor}
              strokeWidth="0.6"
              opacity="0.4"
            />
          </g>

          {/* CLOSED FIST — puño cerrado compacto + nudillos arriba + pulgar wrap */}
          <g
            data-testid="isometric-discharge-closed"
            filter={grip === "hold" ? "url(#handTensionGlow)" : undefined}
            style={{
              opacity: grip === "hold" ? 1 : 0,
              transition: reduceMotion ? "none" : "opacity 260ms cubic-bezier(0.32, 0.72, 0, 1)",
            }}
          >
            {/* Muñeca */}
            <rect
              x="78" y="200" width="44" height="20" rx="6"
              fill="rgba(103,232,249,0.16)"
              stroke={phaseColor}
              strokeWidth="1"
              opacity="0.85"
            />
            {/* Cuerpo del puño — bloque compacto redondeado */}
            <path
              d="M 60 110
                 Q 60 96 80 94
                 L 120 94
                 Q 140 96 140 110
                 L 142 180
                 Q 142 205 118 210
                 L 82 210
                 Q 58 205 58 180
                 Z"
              fill="rgba(103,232,249,0.32)"
              stroke={phaseColor}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* 4 nudillos arriba — cápsulas redondeadas (dedos doblados visibles) */}
            {[
              { x: 66, y: 96, w: 14, h: 18 },  // pinky knuckle
              { x: 84, y: 92, w: 14, h: 22 },  // ring knuckle
              { x: 102, y: 92, w: 14, h: 22 }, // middle knuckle
              { x: 120, y: 96, w: 14, h: 18 }, // index knuckle
            ].map((k, i) => (
              <rect
                key={i}
                x={k.x}
                y={k.y}
                width={k.w}
                height={k.h}
                rx="6"
                fill="rgba(103,232,249,0.42)"
                stroke={phaseColor}
                strokeWidth="0.9"
              />
            ))}
            {/* Líneas de pliegues (dedos doblados — sub-segmentos) */}
            {[126, 142, 158].map((y, i) => (
              <path
                key={i}
                d={`M 70 ${y} Q 100 ${y + 3} 132 ${y}`}
                fill="none"
                stroke={phaseColor}
                strokeWidth="0.7"
                opacity="0.42"
              />
            ))}
            {/* Pulgar — envuelve por delante del puño (curva diagonal) */}
            <path
              d="M 50 138
                 Q 56 158 78 168
                 Q 102 172 116 162
                 Q 120 154 110 150
                 Q 90 156 70 148
                 Q 56 142 50 138 Z"
              fill="rgba(103,232,249,0.30)"
              stroke={phaseColor}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {/* Uña del pulgar (detalle premium) */}
            <ellipse
              cx="56" cy="139" rx="4" ry="3"
              fill="rgba(103,232,249,0.50)"
              stroke={phaseColor}
              strokeWidth="0.6"
            />
          </g>
        </svg>
      </div>

      {/* Dynamic state APRIETA/SUELTA + countdown */}
      <span
        data-testid="isometric-discharge-state"
        data-grip={grip}
        data-seconds-left={phaseSecondsLeft}
        aria-live="polite"
        style={{
          fontFamily: typography.family,
          fontSize: 28,
          fontWeight: typography.weight.light,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: phaseColor,
          opacity: 0.92,
          minWidth: 200,
          textAlign: "center",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {stateLabel} · {phaseSecondsLeft}
      </span>

      {/* Cycle indicator 3 chips */}
      <div
        data-testid="isometric-discharge-cycle-indicator"
        aria-label={`Ciclo ${Math.min(cycleIdx + 1, target_holds)} de ${target_holds}`}
        style={{
          display: "flex",
          gap: spacing.s8,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {Array.from({ length: target_holds }, (_, i) => {
          const isActive = i === Math.min(cycleIdx, target_holds - 1);
          const isDone = i < Math.min(cycleIdx, target_holds - 1);
          return (
            <div
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: isActive ? phaseColor : isDone ? "rgba(103,232,249,0.55)" : colors.separator,
                opacity: isActive ? 1 : isDone ? 0.7 : 0.45,
                boxShadow: isActive ? "0 0 10px rgba(103,232,249,0.5)" : "none",
                transition: reduceMotion ? "none" : "all 220ms ease-out",
              }}
            />
          );
        })}
      </div>

      {/* Body anchor sustained */}
      <span
        data-testid="isometric-discharge-body-anchor"
        aria-live="polite"
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.01em",
          color: colors.text.secondary,
          opacity: 0.75,
          textAlign: "center",
        }}
      >
        {BODY_ANCHOR_CUE}
      </span>
    </div>
  );
}
