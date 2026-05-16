"use client";
/* ═══════════════════════════════════════════════════════════════
   EmotionalDischargePercussionPrimitive — Phase 7 SP-H-1
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 1 "Percusión Atencional" del
   protocolo #7 HyperShift "Descarga emocional rápida".

   Combo motor periférico (yemas tap esternón 150bpm) + respiratory
   3-2-5 + somatic anchor sternum contact. Compound exercise único
   bio-ignición Tier 2.

   Mecanismo:
     - Percusión esternal rítmica funciona como anclaje atencional
       somático (yemas dedos = receptores táctiles densos).
     - Breath 3-2-5 ratio 1:1.67 con hold breve = parasympathetic shift
       lento + activación atencional moderada.
     - Compound: motor + respiratory + somatic simultaneous "descarga
       emocional rápida" (catálogo identity).

   Diferenciación vs Tier 1A+1B Phase 1 modalities:
     - #1 Box, #2 HeartMath, #3 1:3, #4 motor bilateral, #5 visual
       paradox, #6 proprioceptivo body scan
     - **#7 COMPOUND motor sternum + respiratory 3-2-5** ← NUEVO

   Multi-exercise tracks layered (6):
     1. PRIMARY motor: sternum tap zone visual con ring pulse 150bpm
        rhythm guide (2.5 taps/sec).
     2. VISUAL chest indicator: simple sternum SVG icon zona central.
     3. RESPIRATORIO: dynamic state INHALA/MANTÉN/EXHALA con countdown
        exacto sincronizado per phase (3s/2s/5s).
     4. BODY anchor sustained: "Yemas en esternón · 2-3 toques/s".
     5. PARTICLES bio-synced.
     6. PHASE label "Percusión Atencional" cyan-deep.

   Functional human logic:
     - Mientras tap esternón con yemas (motor + somatic), respira
       3-2-5 (respiratory). Compound coherent.
     - Ring pulse 150bpm guía ritmo tap externo.
     - Breath state cambia per phase con countdown exacto.

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - Yemas tap esternón = mano libre del celular (otra puede
       sostener device).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hapticProtocolSignature, speak } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

// Breath constants 3-2-5.
const INHALE_MS = 3000;
const HOLD_MS = 2000;
const EXHALE_MS = 5000;
const CYCLE_MS = INHALE_MS + HOLD_MS + EXHALE_MS; // 10000ms

const PHASE_LABEL = "Percusión Atencional";
// Lenguaje común explícito (lección user feedback: "yemas/esternón" técnicos).
const INSTRUCTION = "Toca con los dedos el centro del pecho · Inhala 3 · Mantén 2 · Exhala 5";
const BODY_ANCHOR_CUE = "Toques en el centro del pecho · 2 a 3 por segundo";

const DEFAULT_DURATION_MS = 30000;
const DEFAULT_BPM = 150;
const RING_SIZE = 220;
const RING_RADIUS = 100;

/**
 * @param {object} props
 * @param {number} [props.bpm=150]
 * @param {number} [props.duration_ms=30000]
 * @param {boolean} [props.audioEnabled=true]
 * @param {boolean} [props.hapticEnabled=true]
 * @param {boolean} [props.voiceEnabled=false]
 * @param {()=>void} [props.onComplete]
 */
export default function EmotionalDischargePercussionPrimitive({
  bpm = DEFAULT_BPM,
  duration_ms = DEFAULT_DURATION_MS,
  audioEnabled = true,  
  hapticEnabled = true,
  voiceEnabled = false,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const phaseColor = getCyanForPhase(0); // cyan-deep #0E7490

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // ─── Breath state + countdown sync 3-2-5 ──────────────────────────
  const [breathPhase, setBreathPhase] = useState("inhale"); // "inhale" | "hold" | "exhale"
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(3);
  const [progress, setProgress] = useState(0);
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
      const cycleElapsed = elapsed % CYCLE_MS;

      let phase, secsLeft;
      if (cycleElapsed < INHALE_MS) {
        phase = "inhale";
        secsLeft = Math.max(1, Math.ceil((INHALE_MS - cycleElapsed) / 1000));
      } else if (cycleElapsed < INHALE_MS + HOLD_MS) {
        phase = "hold";
        secsLeft = Math.max(1, Math.ceil((INHALE_MS + HOLD_MS - cycleElapsed) / 1000));
      } else {
        phase = "exhale";
        secsLeft = Math.max(1, Math.ceil((CYCLE_MS - cycleElapsed) / 1000));
      }

      const pct = Math.min(1, elapsed / duration_ms);
      setProgress(pct);
      setBreathPhase((prev) => (prev !== phase ? phase : prev));
      setPhaseSecondsLeft((prev) => (prev !== secsLeft ? secsLeft : prev));

      if (elapsed >= duration_ms) {
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
  }, [duration_ms, hapticEnabled, reduceMotion]);

  // Voice TTS opt-in.
  useEffect(() => {
    if (!voiceEnabled) return undefined;
    try {
      const phaseText = breathPhase === "inhale" ? "inhala"
        : breathPhase === "hold" ? "mantén"
        : "exhala";
      speak(phaseText, { rate: 0.9 });
    } catch {}
    return undefined;
  }, [breathPhase, voiceEnabled]);

  // ─── Track 1: ring pulse 150bpm rhythm guide ──────────────────────
  const ringPulseRef = useRef(null);
  useEffect(() => {
    if (reduceMotion) return undefined;
    let stopped = false;
    let raf;
    const startTime = performance.now();
    const intervalMs = Math.max(150, 60000 / bpm); // 150bpm = 400ms
    const tick = (now) => {
      if (stopped) return;
      const elapsed = now - startTime;
      const cyclePhase = (elapsed % intervalMs) / intervalMs;
      const intensity = Math.max(0, 1 - cyclePhase);
      const scale = 1.0 + intensity * 0.10;
      const opacity = 0.35 + intensity * 0.40;
      const el = ringPulseRef.current;
      if (el) {
        el.style.transform = `scale(${scale.toFixed(4)})`;
        el.style.opacity = opacity.toFixed(3);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [bpm, reduceMotion]);

  // ─── Particles ambient ────────────────────────────────────────────
  const particleCanvasRef = useRef(null);
  const particleSysRef = useRef(null);
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return undefined;
    canvas.width = 320;
    canvas.height = 280;
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

  const breathLabel = breathPhase === "inhale" ? "Inhala"
    : breathPhase === "hold" ? "Mantén"
    : "Exhala";

  return (
    <div
      data-v2-emotional-discharge-percussion
      data-breath-phase={breathPhase}
      data-completed={completed ? "true" : "false"}
      data-testid="emotional-discharge-percussion-primitive"
      role="region"
      aria-label="Percusión Atencional, toques en el centro del pecho con respiración 3-2-5"
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
        data-testid="emotional-discharge-percussion-phase-label"
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
        data-testid="emotional-discharge-percussion-instruction"
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

      {/* Visual stack: ring pulse + sternum SVG indicator + particles */}
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
          data-testid="emotional-discharge-percussion-particles"
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

        {/* BPM ring pulse rhythm guide 150bpm */}
        <div
          ref={ringPulseRef}
          data-testid="emotional-discharge-percussion-ring-pulse"
          aria-hidden="true"
          style={{
            position: "absolute",
            width: 180,
            height: 180,
            borderRadius: "50%",
            border: `1px solid ${phaseColor}`,
            opacity: 0.4,
            transition: "none",
            willChange: "transform, opacity",
            transform: "scale(1.0)",
          }}
        />

        {/* Sternum tap zone indicator (concrete metaphor) */}
        <svg
          width="100"
          height="120"
          viewBox="0 0 100 120"
          aria-label="Centro del pecho — zona de toques"
          style={{ position: "relative", zIndex: 1 }}
        >
          {/* Body torso outline (very subtle) */}
          <rect x="18" y="10" width="64" height="100" rx="20"
                fill="rgba(255,255,255,0.02)"
                stroke="rgba(245,245,247,0.18)"
                strokeWidth="0.5" />
          {/* Sternum tap zone — center vertical strip */}
          <rect x="42" y="20" width="16" height="60" rx="6"
                fill={`rgba(14,116,144,0.30)`}
                stroke={phaseColor}
                strokeWidth="1.5" />
          {/* Tap dot — center marker */}
          <circle cx="50" cy="50" r="4" fill={phaseColor} opacity="0.9" />
        </svg>
      </div>

      {/* Dynamic breath state + countdown exacto */}
      <span
        data-testid="emotional-discharge-percussion-breath-state"
        data-seconds-left={phaseSecondsLeft}
        aria-live="polite"
        style={{
          fontFamily: typography.family,
          fontSize: 26,
          fontWeight: typography.weight.light,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: phaseColor,
          opacity: 0.92,
          minWidth: 220,
          textAlign: "center",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {breathLabel} · {phaseSecondsLeft}
      </span>

      {/* Body anchor sustained */}
      <span
        data-testid="emotional-discharge-percussion-body-anchor"
        aria-live="polite"
        style={{
          fontFamily: typography.family,
          fontSize: 14,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.01em",
          color: colors.text.secondary,
          opacity: 0.75,
          textAlign: "center",
        }}
      >
        {BODY_ANCHOR_CUE}
      </span>

      {/* Overall progress countdown */}
      <span
        data-testid="emotional-discharge-percussion-overall-countdown"
        aria-label={`${Math.max(0, Math.ceil((1 - progress) * (duration_ms / 1000)))} segundos restantes`}
        style={{
          fontFamily: typography.familyMono,
          fontSize: 11,
          letterSpacing: "0.12em",
          color: colors.text.muted,
          opacity: 0.55,
        }}
      >
        {completed ? "Listo" : `${Math.max(0, Math.ceil((1 - progress) * (duration_ms / 1000)))}s`}
      </span>
    </div>
  );
}
