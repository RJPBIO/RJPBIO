"use client";
/* ═══════════════════════════════════════════════════════════════
   PanoramicVisionPrimitive — Phase 7 SP-F-1 v2
   ───────────────────────────────────────────────────────────────
   Visual primitive dedicated para Visión Periférica — Phase 1
   "Visión Periférica" del protocolo #5 Skyline Focus.

   PARADOX VISUAL: el user debe mirar LEJOS del celular. La pantalla
   por tanto debe ser SUTIL — no atraer atención. Anti-pattern de los
   demás primitives que buscan engagement visual peak.

   Macro-phase choreography (10s + 20s):
     Phase A — Encuentra (0-10s):
       - "Encuentra el punto más lejano"
       - Body anchor: "Pies en el suelo · Hombros sueltos"
       - Horizon line discreto guía mirada al horizonte simbólico.
     Phase B — Sostén + Respira (10-30s):
       - "Sostén la mirada · Respira lento"
       - Body anchor: "Mirada relajada · No fuerces"
       - Breath synergy cue "Inhala lento · Exhala largo" pulsing
         a 5s rate (parasympathetic + ocular relax sinérgico).

   Mecanismo científico (NO surface UI per user feedback):
     - Visión panorámica desfocalizada activa modo "vista periférica"
       (parvocelular vs magnocelular pathway shift).
     - Relaja músculos extraoculares + reduces sympathetic visual
       stress (Huberman 2021).
     - Slow exhale + far-gaze = synergistic vagal afferent + ocular
       relax (Russo 2017 + Huberman 2021).

   Multi-task tracks layered (8):
     1. PHASE label "Visión Periférica" cyan-deep.
     2. PRIMARY prompt cambia per macro-phase A→B (aria-live).
     3. SUB-INSTRUCCIÓN concreta: examples del catálogo.
     4. HORIZON line indicator central — metáfora visual distancia
        (línea horizontal 1px sutil).
     5. BODY anchor cambia per phase (Phase A grounding · Phase B ocular).
     6. BREATH synergy cue (Phase B only) — pulsing "Inhala lento ·
        Exhala largo" 5s rate.
     7. COUNTDOWN ring 30s + "Xs" mono indicator.
     8. PARTICLES atenuadas 12% opacity.

   Functional human logic:
     - Phase A: el user busca el punto lejano + ancla cuerpo (pies +
       hombros). Setup body grounded.
     - Phase B: el user sostiene mirada + respira slow. Synergistic
       parasympathetic + ocular relax.
     - PARADOX preserved: pantalla minimal todo el tiempo.

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - User puede dejar el celular si prefiere.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const PHASE_LABEL = "Visión Periférica";
const SUB_INSTRUCTION = "Ventana · pasillo · horizonte";
const PHASE_A_PROMPT = "Encuentra el punto más lejano";
const PHASE_B_PROMPT = "Sostén la mirada · Respira lento";
const PHASE_A_BODY_ANCHOR = "Pies en el suelo · Hombros sueltos";
const PHASE_B_BODY_ANCHOR = "Mirada relajada · No fuerces";
const BREATH_SYNERGY_CUE = "Inhala lento · Exhala largo";

const DEFAULT_DURATION_MS = 30000;
const PHASE_A_END_MS = 10000;
const RING_SIZE = 240;
const RING_RADIUS = 110;

/**
 * @param {object} props
 * @param {number} [props.duration_ms=30000]
 * @param {boolean} [props.audioEnabled=true]
 * @param {boolean} [props.hapticEnabled=true]
 * @param {boolean} [props.voiceEnabled=false]
 * @param {()=>void} [props.onComplete]
 */
export default function PanoramicVisionPrimitive({
  duration_ms = DEFAULT_DURATION_MS,
  audioEnabled = true, // eslint-disable-line no-unused-vars
  hapticEnabled = true,
  voiceEnabled = false, // eslint-disable-line no-unused-vars
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const phaseColor = getCyanForPhase(0); // cyan-deep #0E7490

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // ─── Macro-phase state (A: encuentra / B: sostén+breath) ──────────
  const [macroPhase, setMacroPhase] = useState("A");
  useEffect(() => {
    if (reduceMotion) {
      const t = setTimeout(() => setMacroPhase("B"), 1500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setMacroPhase("B"), PHASE_A_END_MS);
    return () => clearTimeout(t);
  }, [reduceMotion]);

  // ─── Progress ring + completion ─────────────────────────────────
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(duration_ms / 1000));

  useEffect(() => {
    setProgress(0);
    setCompleted(false);
    setSecondsLeft(Math.ceil(duration_ms / 1000));
    const startTime = Date.now();
    const intervalId = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(1, elapsed / duration_ms);
      setProgress(pct);
      const remaining = Math.max(0, Math.ceil((duration_ms - elapsed) / 1000));
      setSecondsLeft(remaining);
      if (pct >= 1) {
        clearInterval(intervalId);
        setCompleted(true);
        if (hapticEnabled) {
          try {
            hapticProtocolSignature(5, "phase_shift", { reducedMotion: reduceMotion });
          } catch { /* noop */ }
        }
        try {
          if (typeof onCompleteRef.current === "function") onCompleteRef.current();
        } catch { /* noop */ }
      }
    }, 200);
    return () => clearInterval(intervalId);
  }, [duration_ms, hapticEnabled, reduceMotion]);

  // ─── Track 4: minimal anchor dot pulse (very subtle, slow) ─────
  const dotRef = useRef(null);
  useEffect(() => {
    if (reduceMotion) return undefined;
    let stopped = false;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      if (stopped) return;
      const t = ((now - start) / 1000) % 5; // 5s breath rate
      const pulseAmount = Math.sin((t / 5) * Math.PI * 2) * 0.5 + 0.5;
      const dot = dotRef.current;
      if (dot) {
        dot.style.opacity = (0.25 + pulseAmount * 0.25).toFixed(3);
        dot.style.transform = `scale(${(1.0 + pulseAmount * 0.15).toFixed(4)})`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [reduceMotion]);

  // ─── Track 6: breath synergy cue pulse (Phase B only) ───────────
  const breathCueRef = useRef(null);
  useEffect(() => {
    if (reduceMotion) return undefined;
    if (macroPhase !== "B") return undefined;
    let stopped = false;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      if (stopped) return;
      const t = ((now - start) / 1000) % 5; // 5s breath rate (slow)
      // Fade in/out: peak at mid-cycle, fade at edges.
      const fade = Math.sin((t / 5) * Math.PI * 2) * 0.5 + 0.5;
      const opacity = 0.25 + fade * 0.45; // 0.25-0.70
      const el = breathCueRef.current;
      if (el) el.style.opacity = opacity.toFixed(3);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [reduceMotion, macroPhase]);

  // ─── Particles muy atenuadas (12% opacity) ──────────────────────
  const particleCanvasRef = useRef(null);
  const particleSysRef = useRef(null);
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return undefined;
    canvas.width = 300;
    canvas.height = 300;
    try {
      particleSysRef.current = createParticleSystem({ canvas, reducedMotion: reduceMotion });
      if (particleSysRef.current) {
        particleSysRef.current.setPhase("hold", 0);
        particleSysRef.current.start();
      }
    } catch (e) { /* noop */ }
    return () => {
      if (particleSysRef.current) {
        try { particleSysRef.current.stop(); } catch { /* noop */ }
        particleSysRef.current = null;
      }
    };
  }, [reduceMotion]);

  const ringCircumference = 2 * Math.PI * RING_RADIUS;
  const ringDashOffset = ringCircumference * (1 - progress);

  const primaryPrompt = macroPhase === "A" ? PHASE_A_PROMPT : PHASE_B_PROMPT;
  const bodyAnchor = macroPhase === "A" ? PHASE_A_BODY_ANCHOR : PHASE_B_BODY_ANCHOR;

  return (
    <div
      data-v2-panoramic-vision
      data-macro-phase={macroPhase}
      data-completed={completed ? "true" : "false"}
      data-testid="panoramic-vision-primitive"
      role="region"
      aria-label="Visión Periférica, mira lo más lejos posible"
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
      {/* Phase label simple top */}
      <span
        data-testid="panoramic-vision-phase-label"
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

      {/* Primary prompt cambia per macro-phase (aria-live) */}
      <p
        data-testid="panoramic-vision-instruction"
        aria-live="polite"
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: 19,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.02em",
          color: colors.text.strong,
          lineHeight: 1.3,
          textAlign: "center",
          maxWidth: 320,
          paddingInline: spacing.s16,
          transition: reduceMotion ? "none" : "opacity 280ms ease-out",
        }}
      >
        {primaryPrompt}
      </p>

      {/* Sub-instruction concreta (visible Phase A) */}
      {macroPhase === "A" && (
        <p
          data-testid="panoramic-vision-sub-instruction"
          style={{
            margin: 0,
            marginBlockStart: -spacing.s12,
            fontFamily: typography.family,
            fontSize: 14,
            fontWeight: typography.weight.regular,
            letterSpacing: "-0.01em",
            color: colors.text.secondary,
            opacity: 0.78,
            textAlign: "center",
          }}
        >
          {SUB_INSTRUCTION}
        </p>
      )}

      {/* Visual stack: countdown ring + horizon line + minimal dot anchor + particles */}
      <div
        style={{
          position: "relative",
          width: 260,
          height: 260,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Particles muy atenuadas */}
        <canvas
          ref={particleCanvasRef}
          data-testid="panoramic-vision-particles"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: reduceMotion ? 0 : 0.12,
            transition: "opacity 200ms ease-out",
          }}
        />

        {/* Countdown ring SVG */}
        <svg
          data-testid="panoramic-vision-ring"
          aria-hidden="true"
          width={RING_SIZE}
          height={RING_SIZE}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          style={{ position: "absolute", transform: "rotate(-90deg)" }}
        >
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
          />
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            stroke={phaseColor}
            strokeWidth="1"
            strokeLinecap="round"
            strokeDasharray={ringCircumference}
            strokeDashoffset={ringDashOffset}
            style={{
              transition: reduceMotion ? "none" : "stroke-dashoffset 200ms linear",
              opacity: 0.5,
            }}
          />
        </svg>

        {/* Horizon line indicator (NUEVO) — línea horizontal sutil al centro,
            metáfora visual de distancia/horizonte. */}
        <div
          data-testid="panoramic-vision-horizon-line"
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 130,
            height: 1,
            marginLeft: -65,
            background: `linear-gradient(to right, transparent 0%, ${phaseColor} 50%, transparent 100%)`,
            opacity: 0.45,
          }}
        />

        {/* Minimal dot anchor central */}
        <div
          ref={dotRef}
          data-testid="panoramic-vision-dot"
          aria-hidden="true"
          style={{
            position: "absolute",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: phaseColor,
            opacity: 0.35,
            willChange: "transform, opacity",
            transform: "scale(1.0)",
            boxShadow: `0 0 6px ${phaseColor}`,
          }}
        />
      </div>

      {/* Body anchor cambia per macro-phase (aria-live) */}
      <span
        data-testid="panoramic-vision-body-anchor"
        aria-live="polite"
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.01em",
          color: colors.text.secondary,
          opacity: 0.75,
          textAlign: "center",
          transition: reduceMotion ? "none" : "opacity 280ms ease-out",
        }}
      >
        {bodyAnchor}
      </span>

      {/* Breath synergy cue (NUEVO, Phase B only) */}
      {macroPhase === "B" && !completed && (
        <span
          ref={breathCueRef}
          data-testid="panoramic-vision-breath-cue"
          aria-hidden="true"
          style={{
            fontFamily: typography.familyMono,
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: phaseColor,
            opacity: 0.6,
            willChange: "opacity",
          }}
        >
          {BREATH_SYNERGY_CUE}
        </span>
      )}

      {/* Countdown indicator */}
      <span
        data-testid="panoramic-vision-countdown"
        aria-label={`${secondsLeft} segundos restantes`}
        style={{
          fontFamily: typography.familyMono,
          fontSize: 12,
          letterSpacing: "0.08em",
          color: phaseColor,
          opacity: completed ? 0.5 : 0.65,
        }}
      >
        {completed ? "Listo" : `${secondsLeft}s`}
      </span>
    </div>
  );
}
