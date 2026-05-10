"use client";
/* ═══════════════════════════════════════════════════════════════
   DeepBreathSettlePrimitive — Phase 7 SP-G-2
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 2 "Respiración Profunda" del
   protocolo #6 Grounded Steel. Reemplaza shared breath_orb 5-7 +
   silence_cyan_minimal con primitive multi-exercise wrapper.

   2 sub-actos (controlled via subActIdx prop):
     - subActIdx=0 (40s): breath 5-7 asimétrico (4 ciclos × 12s) +
       interocepción peso corporal en silla. Visual sink animation
       (orb Y-translate +6px durante exhale = metáfora "hundirse").
     - subActIdx=1 (10s): silence "El peso. Sostén." sustained
       interocéptive consolidation.

   Diferenciación vs Tier 1A+1B breath orbs:
     - #1 BOX 4-4-4-4 simétrico
     - #2 6-2-8-0 (1:1.3 con hold breve)
     - #3 2-0-6-0 (1:3 dramatic)
     - #4 3-3 simétrico energizing
     - **#6 5-7 asimétrico grounding** ← NUEVO ratio 1:1.4 con sink animation

   Multi-exercise tracks per sub-acto:
     subAct 0:
       1. RESPIRATORIO primary: breath orb 5-7 asimétrico.
       2. VISUAL SINK: orb Y-translate +6px exhale (metáfora hundirse).
       3. DYNAMIC state INHALA/EXHALA big text (clarity lessons).
       4. BODY anchor: "Hundes en silla · Siente el peso".
       5. CYCLE counter X/4.
       6. PHASE label "Respiración Profunda" cyan-cool.
       7. Particles bio-synced.
     subAct 1:
       1. PRIMARY text: "El peso. Sostén." prominent.
       2. STATIC orb + glow sustained.
       3. BODY anchor: "Inmóvil · Siente cada gramo".
       4. COUNTDOWN indicator 10s.

   Mecanismo científico (NO surface UI per user feedback):
     - Exhalación prolongada 5:7 + interocepción peso corporal activa
       parasimpático + grounding propioceptivo (Khalsa 2018 + Russo 2017).

   Functional human logic:
     - Sub-act 0: respira 5-7 + observa orb hundirse + siente peso.
     - Sub-act 1: silence — sostén interocéptivo del peso.
     - Continuidad Phase 1 (body scan) → Phase 2 (peso integrado).

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - User permanece inmóvil — solo respira y siente.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hapticProtocolSignature, speak } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

// SubAct 0 (breath 5-7) constants.
const INHALE_MS = 5000;
const EXHALE_MS = 7000;
const CYCLE_MS = INHALE_MS + EXHALE_MS; // 12000ms
const DEFAULT_TARGET_CYCLES = 4;

// SubAct 1 (silence) defaults.
const DEFAULT_SILENCE_MS = 8000;

const PHASE_LABEL = "Respiración Profunda";
// Body anchor sub-act 0 — explícito: el peso DEL CUERPO se apoya en la silla.
const SUBACT0_BODY_ANCHOR = "Apoya el cuerpo en la silla";
const SUBACT0_INSTRUCTION = "Inhala 5 · Exhala 7";
// Sub-act 1 — sostén explícito del cuerpo apoyado.
const SUBACT1_INSTRUCTION = "Cuerpo apoyado · Sostén";
const SUBACT1_BODY_ANCHOR = "Inmóvil · Siente el cuerpo apoyado";

const SUB_ACTS = [
  { idx: 0, kind: "breath",  cycles: DEFAULT_TARGET_CYCLES },
  { idx: 1, kind: "silence", minDurationMs: DEFAULT_SILENCE_MS },
];

/**
 * @param {object} props
 * @param {number} [props.subActIdx=0]
 * @param {number} [props.cycleCountTarget=4]
 * @param {number} [props.min_duration_ms=8000]
 * @param {boolean} [props.audioEnabled=true]
 * @param {boolean} [props.hapticEnabled=true]
 * @param {boolean} [props.voiceEnabled=false]
 * @param {()=>void} [props.onComplete]
 */
export default function DeepBreathSettlePrimitive({
  subActIdx = 0,
  cycleCountTarget = DEFAULT_TARGET_CYCLES,
  min_duration_ms,
  audioEnabled = true, // eslint-disable-line no-unused-vars
  hapticEnabled = true,
  voiceEnabled = false,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const cfg = SUB_ACTS[subActIdx] || SUB_ACTS[0];
  const phaseColor = getCyanForPhase(1); // cyan-cool #67E8F9 phase2

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // ════ SUB-ACT 0: BREATH 5-7 + SINK + EXACT COUNTDOWN ════
  const orbRef = useRef(null);
  const [cyclePhase, setCyclePhase] = useState("inhale");
  const [cycleIdx, setCycleIdx] = useState(0);
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(5); // countdown per breath phase

  useEffect(() => {
    if (cfg.kind !== "breath") return undefined;
    if (reduceMotion) {
      const orb = orbRef.current;
      if (orb) orb.style.transform = "scale(1.0) translateY(0)";
      return undefined;
    }
    let stopped = false;
    const startTime = performance.now();
    let raf;
    const tick = (now) => {
      if (stopped) return;
      const elapsed = now - startTime;
      const cycleElapsed = elapsed % CYCLE_MS;
      const completedCycles = Math.floor(elapsed / CYCLE_MS);

      let phase, scale, translateY, secsLeft;
      if (cycleElapsed < INHALE_MS) {
        phase = "inhale";
        const t = cycleElapsed / INHALE_MS;
        const eased = 1 - Math.pow(1 - t, 2.2);
        scale = 0.85 + eased * 0.55; // 0.85 → 1.4
        translateY = 6 - eased * 6;  // 6 → 0 (rises during inhale)
        // Countdown: ceil((INHALE_MS - cycleElapsed) / 1000), clamped 1..5.
        secsLeft = Math.max(1, Math.ceil((INHALE_MS - cycleElapsed) / 1000));
      } else {
        phase = "exhale";
        const t = (cycleElapsed - INHALE_MS) / EXHALE_MS;
        const eased = Math.pow(t, 1.4);
        scale = 1.4 - eased * 0.55;  // 1.4 → 0.85
        translateY = eased * 6;       // 0 → +6 (sinks during exhale)
        // Countdown: ceil((CYCLE_MS - cycleElapsed) / 1000), clamped 1..7.
        secsLeft = Math.max(1, Math.ceil((CYCLE_MS - cycleElapsed) / 1000));
      }

      const orb = orbRef.current;
      if (orb) orb.style.transform = `translateY(${translateY.toFixed(2)}px) scale(${scale.toFixed(4)})`;

      setCyclePhase((prev) => (prev !== phase ? phase : prev));
      setCycleIdx((prev) => (prev !== completedCycles ? completedCycles : prev));
      setPhaseSecondsLeft((prev) => (prev !== secsLeft ? secsLeft : prev));

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [cfg.kind, reduceMotion]);

  useEffect(() => {
    if (cfg.kind !== "breath") return undefined;
    if (cycleIdx === 0) return undefined;
    if (hapticEnabled) {
      try {
        hapticProtocolSignature(6, "phase_shift", { reducedMotion: reduceMotion });
      } catch { /* noop */ }
    }
    if (cycleIdx >= cycleCountTarget) {
      try {
        if (typeof onCompleteRef.current === "function") onCompleteRef.current();
      } catch { /* noop */ }
    }
    return undefined;
  }, [cycleIdx, cycleCountTarget, cfg.kind, hapticEnabled, reduceMotion]);

  useEffect(() => {
    if (cfg.kind !== "breath") return undefined;
    if (!voiceEnabled) return undefined;
    try {
      const phaseText = cyclePhase === "inhale" ? "inhala" : "exhala";
      speak(phaseText, { rate: 0.85 });
    } catch { /* noop */ }
    return undefined;
  }, [cyclePhase, cfg.kind, voiceEnabled]);

  // ════ SUB-ACT 1: SILENCE SOSTÉN ════
  const [silenceRemaining, setSilenceRemaining] = useState(Math.ceil((min_duration_ms || cfg.minDurationMs || DEFAULT_SILENCE_MS) / 1000));
  const [silenceCompleted, setSilenceCompleted] = useState(false);

  useEffect(() => {
    if (cfg.kind !== "silence") return undefined;
    setSilenceCompleted(false);
    const targetMs = min_duration_ms || cfg.minDurationMs || DEFAULT_SILENCE_MS;
    setSilenceRemaining(Math.ceil(targetMs / 1000));
    const startTime = Date.now();
    const intervalId = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, Math.ceil((targetMs - elapsed) / 1000));
      setSilenceRemaining(remaining);
    }, 250);
    const completeId = setTimeout(() => {
      setSilenceCompleted(true);
      try {
        if (typeof onCompleteRef.current === "function") onCompleteRef.current();
      } catch { /* noop */ }
    }, targetMs);
    return () => {
      clearInterval(intervalId);
      clearTimeout(completeId);
    };
  }, [cfg.kind, min_duration_ms, cfg.minDurationMs]);

  // ─── Particles (low opacity grounding ambient) ──────────────────
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
        particleSysRef.current.setPhase(cfg.kind === "breath" ? cyclePhase : "hold", 0);
        particleSysRef.current.start();
      }
    } catch (e) { /* noop */ }
    return () => {
      if (particleSysRef.current) {
        try { particleSysRef.current.stop(); } catch { /* noop */ }
        particleSysRef.current = null;
      }
    };
  }, [reduceMotion, cfg.kind]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (cfg.kind !== "breath") return undefined;
    if (particleSysRef.current) {
      try { particleSysRef.current.setPhase(cyclePhase, 0); } catch { /* noop */ }
    }
    return undefined;
  }, [cyclePhase, cfg.kind]);

  return (
    <div
      data-v2-deep-breath-settle
      data-sub-act-idx={subActIdx}
      data-sub-act-kind={cfg.kind}
      data-testid="deep-breath-settle-primitive"
      role="region"
      aria-label={`Respiración Profunda, sub-acto ${subActIdx + 1}, ${cfg.kind}`}
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
        data-testid="deep-breath-settle-phase-label"
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

      {/* SUB-ACT 0: BREATH 5-7 + SINK */}
      {cfg.kind === "breath" && (
        <>
          {/* Instrucción primaria */}
          <p
            data-testid="deep-breath-settle-instruction"
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
            }}
          >
            {SUBACT0_INSTRUCTION}
          </p>

          {/* Visual stack: particles + orb breathing + sink animation */}
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
            <canvas
              ref={particleCanvasRef}
              data-testid="deep-breath-settle-particles"
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

            {/* Chair line (visual reference for "sink into chair") */}
            <div
              data-testid="deep-breath-settle-chair-line"
              aria-hidden="true"
              style={{
                position: "absolute",
                bottom: 50,
                left: 60,
                right: 60,
                height: 1,
                background: `linear-gradient(to right, transparent 0%, ${phaseColor} 50%, transparent 100%)`,
                opacity: 0.4,
              }}
            />

            {/* Orb breath con sink Y-translate */}
            <div
              ref={orbRef}
              data-testid="deep-breath-settle-orb"
              aria-hidden="true"
              style={{
                position: "absolute",
                width: 160,
                height: 160,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(103,232,249,0.32) 0%, rgba(14,116,144,0.16) 60%, rgba(14,116,144,0) 100%)",
                border: `1px solid ${phaseColor}`,
                opacity: 0.78,
                transition: "none",
                willChange: "transform",
                transform: "scale(1.0) translateY(0)",
              }}
            />
          </div>

          {/* Dynamic breath state CON countdown sincronizado exacto per phase */}
          <span
            data-testid="deep-breath-settle-breath-state"
            data-breath-phase={cyclePhase}
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
            {cyclePhase === "inhale" ? "Inhala" : "Exhala"} · {phaseSecondsLeft}
          </span>

          {/* Body anchor sustained */}
          <span
            data-testid="deep-breath-settle-body-anchor"
            aria-live="polite"
            style={{
              fontFamily: typography.family,
              fontSize: typography.size.body,
              fontWeight: typography.weight.light,
              letterSpacing: "-0.01em",
              color: colors.text.secondary,
              opacity: 0.78,
              textAlign: "center",
            }}
          >
            {SUBACT0_BODY_ANCHOR}
          </span>

          {/* Cycle counter */}
          <span
            data-testid="deep-breath-settle-cycle-counter"
            aria-label={`Ciclo ${Math.min(cycleIdx + 1, cycleCountTarget)} de ${cycleCountTarget}`}
            style={{
              fontFamily: typography.familyMono,
              fontSize: 11,
              letterSpacing: "0.12em",
              color: colors.text.muted,
              opacity: 0.55,
            }}
          >
            {Math.min(cycleIdx + 1, cycleCountTarget)} / {cycleCountTarget}
          </span>
        </>
      )}

      {/* SUB-ACT 1: SILENCE SOSTÉN */}
      {cfg.kind === "silence" && (
        <>
          {/* Primary instruction prominent */}
          <p
            data-testid="deep-breath-settle-silence-instruction"
            style={{
              margin: 0,
              fontFamily: typography.family,
              fontSize: 22,
              fontWeight: typography.weight.light,
              letterSpacing: "-0.02em",
              color: colors.text.strong,
              lineHeight: 1.3,
              textAlign: "center",
              maxWidth: 320,
              paddingInline: spacing.s16,
            }}
          >
            {SUBACT1_INSTRUCTION}
          </p>

          {/* Visual stack: particles + static orb */}
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
              data-testid="deep-breath-settle-silence-particles"
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                opacity: reduceMotion ? 0 : 0.25,
                transition: "opacity 200ms ease-out",
              }}
            />
            <div
              data-testid="deep-breath-settle-silence-orb"
              aria-hidden="true"
              style={{
                position: "absolute",
                width: 130,
                height: 130,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(103,232,249,0.30) 0%, rgba(14,116,144,0.14) 60%, rgba(14,116,144,0) 100%)",
                border: `1px solid ${phaseColor}`,
                boxShadow: `0 0 22px rgba(103,232,249,0.32)`,
                opacity: 0.72,
              }}
            />
          </div>

          {/* Body anchor sustained */}
          <span
            data-testid="deep-breath-settle-silence-body-anchor"
            aria-live="polite"
            style={{
              fontFamily: typography.family,
              fontSize: typography.size.body,
              fontWeight: typography.weight.light,
              letterSpacing: "-0.01em",
              color: colors.text.secondary,
              opacity: 0.7,
              textAlign: "center",
            }}
          >
            {SUBACT1_BODY_ANCHOR}
          </span>

          {/* Countdown indicator */}
          <span
            data-testid="deep-breath-settle-silence-countdown"
            aria-label={`${silenceRemaining} segundos restantes`}
            style={{
              fontFamily: typography.familyMono,
              fontSize: 14,
              letterSpacing: "0.08em",
              color: phaseColor,
              opacity: silenceCompleted ? 0.5 : 0.85,
            }}
          >
            {silenceCompleted ? "Listo" : `${silenceRemaining}s`}
          </span>
        </>
      )}
    </div>
  );
}
