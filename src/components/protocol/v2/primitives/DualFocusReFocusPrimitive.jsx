"use client";
/* ═══════════════════════════════════════════════════════════════
   DualFocusReFocusPrimitive — Phase 7 SP-F-2
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 2 "Enfoque Dual" del protocolo
   #5 Skyline Focus. Reemplaza shared dual_focus_targets +
   breath_orb + text_emphasis_voice con primitive multi-exercise
   wrapper layered.

   3 sub-actos (controlled via subActIdx prop):
     - subActIdx=0 (30s): dual focus near-far alternating L↔R 5s,
       3 ciclos. Entrena músculos ciliares + flexibilidad atencional.
     - subActIdx=1 (25s): breath 4-4 simétrico stabilization, 3 ciclos.
       Mirada suave al frente sustained.
     - subActIdx=2 (5-8s): cognitive anchor "¿Qué necesita atención?"
       single-task identification (Leroy 2009 attentional residue).

   Multi-exercise tracks per sub-acto:
     subAct 0:
       1. PRIMARY visual: dynamic state CERCA ↔ LEJOS big text.
       2. VISUAL near icon (small dot izquierda) + far ring (grande derecha)
          con active state highlighting.
       3. CYCLE indicator 3 ciclos (3 dots progress).
       4. BODY anchor sustained: "Mueve solo los ojos · No la cabeza".
       5. PHASE label "Enfoque Dual" cyan-cool.
     subAct 1:
       1. PRIMARY visual: orb breath 4-4 simétrico.
       2. DYNAMIC state INHALA/EXHALA big text.
       3. CYCLE counter X/3.
       4. BODY anchor sustained: "Mirada suave al frente" (continuidad
          Phase 1 panoramic).
       5. PHASE label.
     subAct 2:
       1. PRIMARY cognitive prompt + sub.
       2. SINGLE-slot indicator highlighted (mirror PriorityFilter convergence).
       3. BODY anchor: "Quédate con ese pensamiento".
       4. PHASE label.

   Mecanismos científicos (NO surface UI per user feedback):
     - Alternancia near-far entrena músculos ciliares + flexibilidad
       attentional visual.
     - Respiración 4-4 simétrica con mirada al frente estabiliza foco.
     - Single-task identification reduce attentional residue (Leroy 2009).

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - subAct 0: solo ojos mueven, NO cabeza (ergonomic friendly).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hapticProtocolSignature, speak } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

// SubAct 0 (dual focus) constants.
const NEAR_DURATION_MS = 5000;
const FAR_DURATION_MS = 5000;
const SUBACT0_CYCLE_MS = NEAR_DURATION_MS + FAR_DURATION_MS;
const DEFAULT_SUBACT0_CYCLES = 3;

// SubAct 1 (breath 4-4) constants.
const INHALE_MS = 4000;
const EXHALE_MS = 4000;
const SUBACT1_CYCLE_MS = INHALE_MS + EXHALE_MS;
const DEFAULT_SUBACT1_CYCLES = 3;

const PHASE_LABEL = "Enfoque Dual";

const SUBACT0_BODY_ANCHOR = "Mueve solo los ojos · No la cabeza";
const SUBACT1_BODY_ANCHOR = "Mirada suave al frente";
const SUBACT2_BODY_ANCHOR = "Quédate con ese pensamiento";

const SUB_ACTS = [
  { idx: 0, kind: "dual_focus", cycles: DEFAULT_SUBACT0_CYCLES },
  { idx: 1, kind: "breath",     cycles: DEFAULT_SUBACT1_CYCLES },
  { idx: 2, kind: "cognitive",  minDurationMs: 5000 },
];

/**
 * @param {object} props
 * @param {number} [props.subActIdx=0]
 * @param {number} [props.cycles]
 * @param {number} [props.min_duration_ms]
 * @param {boolean} [props.audioEnabled=true]
 * @param {boolean} [props.hapticEnabled=true]
 * @param {boolean} [props.voiceEnabled=false]
 * @param {(s:object)=>void} [props.onSignal]
 * @param {()=>void} [props.onComplete]
 */
export default function DualFocusReFocusPrimitive({
  subActIdx = 0,
  cycles,
  min_duration_ms,
  audioEnabled = true, // eslint-disable-line no-unused-vars
  hapticEnabled = true,
  voiceEnabled = false,
  onSignal, // eslint-disable-line no-unused-vars
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const cfg = SUB_ACTS[subActIdx] || SUB_ACTS[0];
  const phaseColor = getCyanForPhase(1); // cyan-cool #67E8F9 phase2

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // ════ SUB-ACT 0: DUAL FOCUS (CERCA ↔ LEJOS) ════
  const [focusState, setFocusState] = useState("CERCA"); // "CERCA" | "LEJOS"
  const [dualCycleIdx, setDualCycleIdx] = useState(0);
  const targetCyclesSubAct0 = cycles || cfg.cycles || DEFAULT_SUBACT0_CYCLES;

  useEffect(() => {
    if (cfg.kind !== "dual_focus") return undefined;
    if (reduceMotion) {
      // Just complete after a short delay in reduced motion.
      const t = setTimeout(() => {
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch { /* noop */ }
      }, 1500);
      return () => clearTimeout(t);
    }
    const startTime = performance.now();
    let stopped = false;
    let raf;
    const tick = (now) => {
      if (stopped) return;
      const elapsed = now - startTime;
      const cycleElapsed = elapsed % SUBACT0_CYCLE_MS;
      const completedCycles = Math.floor(elapsed / SUBACT0_CYCLE_MS);
      const isCerca = cycleElapsed < NEAR_DURATION_MS;
      setFocusState((prev) => (prev !== (isCerca ? "CERCA" : "LEJOS") ? (isCerca ? "CERCA" : "LEJOS") : prev));
      setDualCycleIdx((prev) => (prev !== completedCycles ? completedCycles : prev));
      if (completedCycles >= targetCyclesSubAct0) {
        stopped = true;
        try {
          if (typeof onCompleteRef.current === "function") onCompleteRef.current();
        } catch { /* noop */ }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [cfg.kind, reduceMotion, targetCyclesSubAct0]);

  // ════ SUB-ACT 1: BREATH 4-4 ════
  const orbRef = useRef(null);
  const [cyclePhase, setCyclePhase] = useState("inhale");
  const [breathCycleIdx, setBreathCycleIdx] = useState(0);
  const targetCyclesSubAct1 = cycles || cfg.cycles || DEFAULT_SUBACT1_CYCLES;

  useEffect(() => {
    if (cfg.kind !== "breath") return undefined;
    if (reduceMotion) {
      const orb = orbRef.current;
      if (orb) orb.style.transform = "scale(1.0)";
      return undefined;
    }
    let stopped = false;
    const startTime = performance.now();
    let raf;
    const tick = (now) => {
      if (stopped) return;
      const elapsed = now - startTime;
      const cycleElapsed = elapsed % SUBACT1_CYCLE_MS;
      const completedCycles = Math.floor(elapsed / SUBACT1_CYCLE_MS);

      let phase, scale;
      if (cycleElapsed < INHALE_MS) {
        phase = "inhale";
        const t = cycleElapsed / INHALE_MS;
        const eased = 1 - Math.pow(1 - t, 2.2);
        scale = 0.85 + eased * 0.55; // 0.85 → 1.4
      } else {
        phase = "exhale";
        const t = (cycleElapsed - INHALE_MS) / EXHALE_MS;
        const eased = Math.pow(t, 1.4);
        scale = 1.4 - eased * 0.55;
      }
      const orb = orbRef.current;
      if (orb) orb.style.transform = `scale(${scale.toFixed(4)})`;

      setCyclePhase((prev) => (prev !== phase ? phase : prev));
      setBreathCycleIdx((prev) => (prev !== completedCycles ? completedCycles : prev));

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [cfg.kind, reduceMotion]);

  useEffect(() => {
    if (cfg.kind !== "breath") return undefined;
    if (breathCycleIdx === 0) return undefined;
    if (hapticEnabled) {
      try {
        hapticProtocolSignature(5, "phase_shift", { reducedMotion: reduceMotion });
      } catch { /* noop */ }
    }
    if (breathCycleIdx >= targetCyclesSubAct1) {
      try {
        if (typeof onCompleteRef.current === "function") onCompleteRef.current();
      } catch { /* noop */ }
    }
    return undefined;
  }, [breathCycleIdx, targetCyclesSubAct1, cfg.kind, hapticEnabled, reduceMotion]);

  useEffect(() => {
    if (cfg.kind !== "breath") return undefined;
    if (!voiceEnabled) return undefined;
    try {
      const phaseText = cyclePhase === "inhale" ? "inhala" : "exhala";
      speak(phaseText, { rate: 0.92 });
    } catch { /* noop */ }
    return undefined;
  }, [cyclePhase, cfg.kind, voiceEnabled]);

  // ════ SUB-ACT 2: COGNITIVE ANCHOR ════
  const [cognitiveTimePassed, setCognitiveTimePassed] = useState(false);
  useEffect(() => {
    if (cfg.kind !== "cognitive") return undefined;
    setCognitiveTimePassed(false);
    const targetMs = min_duration_ms || cfg.minDurationMs || 5000;
    const t = setTimeout(() => {
      setCognitiveTimePassed(true);
      try {
        if (typeof onCompleteRef.current === "function") onCompleteRef.current();
      } catch { /* noop */ }
    }, targetMs);
    return () => clearTimeout(t);
  }, [cfg.kind, min_duration_ms, cfg.minDurationMs]);

  // ─── Particles (ambient continuity, low opacity) ──────────────────
  const particleCanvasRef = useRef(null);
  const particleSysRef = useRef(null);
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return undefined;
    canvas.width = 320;
    canvas.height = 220;
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
  }, [reduceMotion, cfg.kind]); // eslint-disable-line react-hooks/exhaustive-deps

  // Body anchor per sub-act.
  const bodyAnchor = cfg.kind === "dual_focus"
    ? SUBACT0_BODY_ANCHOR
    : cfg.kind === "breath"
      ? SUBACT1_BODY_ANCHOR
      : SUBACT2_BODY_ANCHOR;

  return (
    <div
      data-v2-dual-focus-refocus
      data-sub-act-idx={subActIdx}
      data-sub-act-kind={cfg.kind}
      data-testid="dual-focus-refocus-primitive"
      role="region"
      aria-label={`Enfoque Dual, sub-acto ${subActIdx + 1}, ${cfg.kind}`}
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
        data-testid="dual-focus-refocus-phase-label"
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

      {/* SUB-ACT 0: DUAL FOCUS */}
      {cfg.kind === "dual_focus" && (
        <>
          {/* Instrucción primaria */}
          <p
            data-testid="dual-focus-refocus-instruction"
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
            Alterna mirada · Cerca y lejos
          </p>

          {/* Dynamic state CERCA ↔ LEJOS */}
          <span
            data-testid="dual-focus-refocus-state"
            data-state={focusState}
            aria-live="polite"
            style={{
              fontFamily: typography.family,
              fontSize: 32,
              fontWeight: typography.weight.light,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: phaseColor,
              opacity: 0.95,
              minWidth: 200,
              textAlign: "center",
            }}
          >
            {focusState}
          </span>

          {/* Visual layout: small near icon + large far ring */}
          <div
            data-testid="dual-focus-refocus-targets"
            style={{
              position: "relative",
              width: 320,
              height: 180,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.s48,
            }}
          >
            <canvas
              ref={particleCanvasRef}
              data-testid="dual-focus-refocus-particles"
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

            {/* Near target (small, izquierda — representa mano cerca) */}
            <div
              data-testid="dual-focus-refocus-near"
              data-active={focusState === "CERCA" ? "true" : "false"}
              aria-hidden="true"
              style={{
                position: "relative",
                zIndex: 1,
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: focusState === "CERCA"
                  ? "rgba(103,232,249,0.22)"
                  : "rgba(255,255,255,0.03)",
                border: `1px solid ${focusState === "CERCA" ? phaseColor : colors.separator}`,
                boxShadow: focusState === "CERCA" ? `0 0 16px rgba(103,232,249,0.45)` : "none",
                opacity: focusState === "CERCA" ? 1 : 0.5,
                transition: reduceMotion ? "none" : "all 200ms ease-out",
              }}
            />

            {/* Far target (large, derecha — representa horizonte lejos) */}
            <div
              data-testid="dual-focus-refocus-far"
              data-active={focusState === "LEJOS" ? "true" : "false"}
              aria-hidden="true"
              style={{
                position: "relative",
                zIndex: 1,
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: focusState === "LEJOS"
                  ? "rgba(103,232,249,0.18)"
                  : "rgba(255,255,255,0.03)",
                border: `1px solid ${focusState === "LEJOS" ? phaseColor : colors.separator}`,
                boxShadow: focusState === "LEJOS" ? `0 0 28px rgba(103,232,249,0.40)` : "none",
                opacity: focusState === "LEJOS" ? 1 : 0.55,
                transition: reduceMotion ? "none" : "all 200ms ease-out",
              }}
            />
          </div>

          {/* Cycle indicator (3 dots progress) */}
          <div
            data-testid="dual-focus-refocus-cycle-indicator"
            aria-label={`Ciclo ${Math.min(dualCycleIdx + 1, targetCyclesSubAct0)} de ${targetCyclesSubAct0}`}
            style={{
              display: "flex",
              gap: spacing.s8,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {Array.from({ length: targetCyclesSubAct0 }, (_, i) => {
              const isActive = i === Math.min(dualCycleIdx, targetCyclesSubAct0 - 1);
              const isDone = i < Math.min(dualCycleIdx, targetCyclesSubAct0 - 1);
              return (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: isActive ? phaseColor : isDone ? "rgba(103,232,249,0.55)" : colors.separator,
                    opacity: isActive ? 1 : isDone ? 0.7 : 0.45,
                    boxShadow: isActive ? "0 0 8px rgba(103,232,249,0.5)" : "none",
                    transition: reduceMotion ? "none" : "all 220ms ease-out",
                  }}
                />
              );
            })}
          </div>
        </>
      )}

      {/* SUB-ACT 1: BREATH 4-4 */}
      {cfg.kind === "breath" && (
        <>
          {/* Instrucción primaria */}
          <p
            data-testid="dual-focus-refocus-instruction"
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
            Inhala 4 · Exhala 4
          </p>

          {/* Visual stack: orb breathing + particles */}
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
              data-testid="dual-focus-refocus-breath-particles"
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                opacity: reduceMotion ? 0 : 0.32,
                transition: "opacity 200ms ease-out",
              }}
            />

            <div
              ref={orbRef}
              data-testid="dual-focus-refocus-orb"
              aria-hidden="true"
              style={{
                position: "absolute",
                width: 140,
                height: 140,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(103,232,249,0.30) 0%, rgba(14,116,144,0.14) 60%, rgba(14,116,144,0) 100%)",
                border: `1px solid ${phaseColor}`,
                opacity: 0.78,
                transition: "none",
                willChange: "transform",
                transform: "scale(1.0)",
              }}
            />
          </div>

          {/* Dynamic breath state */}
          <span
            data-testid="dual-focus-refocus-breath-state"
            data-breath-phase={cyclePhase}
            aria-live="polite"
            style={{
              fontFamily: typography.family,
              fontSize: 26,
              fontWeight: typography.weight.light,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: phaseColor,
              opacity: 0.92,
              minWidth: 180,
              textAlign: "center",
            }}
          >
            {cyclePhase === "inhale" ? "Inhala" : "Exhala"}
          </span>

          {/* Cycle counter */}
          <span
            data-testid="dual-focus-refocus-breath-counter"
            aria-label={`Ciclo ${Math.min(breathCycleIdx + 1, targetCyclesSubAct1)} de ${targetCyclesSubAct1}`}
            style={{
              fontFamily: typography.familyMono,
              fontSize: 11,
              letterSpacing: "0.12em",
              color: colors.text.muted,
              opacity: 0.55,
            }}
          >
            {Math.min(breathCycleIdx + 1, targetCyclesSubAct1)} / {targetCyclesSubAct1}
          </span>
        </>
      )}

      {/* SUB-ACT 2: COGNITIVE ANCHOR */}
      {cfg.kind === "cognitive" && (
        <>
          {/* Visual stack: particles + single-slot convergence */}
          <div
            style={{
              position: "relative",
              width: 280,
              height: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <canvas
              ref={particleCanvasRef}
              data-testid="dual-focus-refocus-cognitive-particles"
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

            {/* Question prompt prominent + single-slot indicator */}
            <div
              data-testid="dual-focus-refocus-cognitive-content"
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: spacing.s16,
                maxWidth: 320,
                paddingInline: spacing.s16,
              }}
            >
              <h2
                data-testid="dual-focus-refocus-cognitive-question"
                style={{
                  margin: 0,
                  fontFamily: typography.family,
                  fontSize: 22,
                  fontWeight: typography.weight.light,
                  letterSpacing: "-0.02em",
                  color: colors.text.strong,
                  lineHeight: 1.25,
                  textAlign: "center",
                }}
              >
                ¿Qué necesita tu atención completa ahora?
              </h2>
              <p
                data-testid="dual-focus-refocus-cognitive-sub"
                style={{
                  margin: 0,
                  fontFamily: typography.family,
                  fontSize: typography.size.body,
                  fontWeight: typography.weight.regular,
                  color: colors.text.secondary,
                  lineHeight: 1.45,
                  textAlign: "center",
                }}
              >
                Una sola cosa.
              </p>

              {/* Single-slot indicator (mirror PriorityFilter convergence) */}
              <div
                data-testid="dual-focus-refocus-cognitive-slot"
                aria-label="Tarea convergida"
                style={{
                  marginBlockStart: spacing.s12,
                  width: 88,
                  height: 56,
                  borderRadius: 10,
                  border: `1px solid ${phaseColor}`,
                  background: "rgba(103,232,249,0.14)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: typography.familyMono,
                  fontSize: 18,
                  fontWeight: typography.weight.light,
                  letterSpacing: "0.08em",
                  color: phaseColor,
                  boxShadow: `0 0 14px rgba(103,232,249,0.18)`,
                }}
              >
                1
              </div>
            </div>
          </div>
        </>
      )}

      {/* Body anchor (cambia per sub-act, aria-live) */}
      <span
        data-testid="dual-focus-refocus-body-anchor"
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
        {bodyAnchor}
      </span>
    </div>
  );
}
