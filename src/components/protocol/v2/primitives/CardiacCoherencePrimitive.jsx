"use client";
/* ═══════════════════════════════════════════════════════════════
   CardiacCoherencePrimitive — Phase 7 SP-C-1
   ───────────────────────────────────────────────────────────────
   Visual primitive dedicated para Coherencia Cardíaca — Phase 1
   "Coherencia Cardíaca" del protocolo #2 Activación Cognitiva.

   Pattern HeartMath cardiac coherence breathing 6-2-8-0:
     - inhale (6s): orb 1.0 → 1.4 (expansion natural)
     - hold (2s): orb 1.4 sustained (brief settle)
     - exhale (8s): orb 1.4 → 0.85 (descent largo, parasympathetic)
     - empty (0s): no pause — siguiente inhale comienza inmediato
     Total cycle: 16s × 2 ciclos = 32s (alineado a Phase 1 target)

   Diferencia vs #1 (BOX 4-4-4-4 simétrico):
     - 6-2-8-0 asimétrico (long exhale ratio 1:1.3)
     - Inner cardiac pulse dot ~60bpm (heart-brain coupling visual)
     - Body anchor "Mano sobre el corazón" (HeartMath signature)

   Multi-task tracks simultáneos:
     1. PRIMARY visual: outer orb breathing 6-2-8-0 + halo descent.
     2. SECONDARY visual: inner cardiac pulse dot 60bpm (1Hz)
        sustained durante toda la phase — visualiza heart-brain coupling.
     3. SECONDARY visual: particle field bio-synced foundation
        (centripetal inhale / orbital hold / centrifugal exhale).
     4. SECONDARY cognitive-somatic: "Mano sobre el corazón"
        sustained — HeartMath posture, baroreceptor + tactile vagal afferent.
     5. PHASE label simple "Coherencia Cardíaca" (zero scientific text).

   Functional human logic:
     - User sostiene celular con UNA mano + pone OTRA mano sobre corazón
       (mano libre del celular, no conflicto).
     - Mientras respira 6-2-8-0, observa orb + siente pulso bajo palma.
     - Heart-breath coupling se establece via simultaneidad táctil + visual.

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - Mano libre sobre corazón = additive, no conflicto.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hapticProtocolSignature, speak } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

// Cadence constants HeartMath 6-2-8-0.
const INHALE_MS = 6000;
const HOLD_MS = 2000;
const EXHALE_MS = 8000;
const EMPTY_MS = 0;
const CYCLE_MS = INHALE_MS + HOLD_MS + EXHALE_MS + EMPTY_MS; // 16000ms

const DEFAULT_TARGET_CYCLES = 2; // alineado a validate.min_cycles=2

const PHASE_LABEL = "Coherencia Cardíaca";
const BODY_ANCHOR_CUE = "Mano sobre el corazón";
const CARDIAC_PULSE_BPM = 60; // 1Hz heart-brain coupling visualization

/**
 * @param {object} props
 * @param {number} [props.cycleCountTarget=2]
 * @param {boolean} [props.audioEnabled=true]
 * @param {boolean} [props.hapticEnabled=true]
 * @param {boolean} [props.voiceEnabled=false]
 * @param {boolean} [props.showPhaseLabel=true]
 * @param {(n:number)=>void} [props.onCycleComplete]
 * @param {()=>void} [props.onComplete]
 */
export default function CardiacCoherencePrimitive({
  cycleCountTarget = DEFAULT_TARGET_CYCLES,
  audioEnabled = true,  
  hapticEnabled = true,
  voiceEnabled = false,
  showPhaseLabel = true,
  onCycleComplete,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const phaseColor = getCyanForPhase(0); // base phase 1 cyan-deep #0E7490
  const orbRef = useRef(null);
  const haloRef = useRef(null);
  const cardiacPulseRef = useRef(null);

  const [cyclePhase, setCyclePhase] = useState("inhale");
  const [cycleIdx, setCycleIdx] = useState(0);

  const onCycleCompleteRef = useRef(onCycleComplete);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCycleCompleteRef.current = onCycleComplete; }, [onCycleComplete]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // ─── Track 1+2: Outer orb breathing + halo + inner cardiac pulse ────
  useEffect(() => {
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
      const cycleElapsed = elapsed % CYCLE_MS;
      const completedCycles = Math.floor(elapsed / CYCLE_MS);

      // Phase determination + scale.
      let phase, scale, haloScale;
      if (cycleElapsed < INHALE_MS) {
        phase = "inhale";
        const t = cycleElapsed / INHALE_MS;
        const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
        scale = 1.0 + eased * 0.4; // 1.0 → 1.4
        haloScale = 1.0 + eased * 0.15;
      } else if (cycleElapsed < INHALE_MS + HOLD_MS) {
        phase = "hold";
        scale = 1.4;
        const localT = (cycleElapsed - INHALE_MS) / HOLD_MS;
        haloScale = 1.15 + Math.sin(localT * Math.PI * 2) * 0.04; // gentle pulse
      } else {
        phase = "exhale";
        const localT = (cycleElapsed - INHALE_MS - HOLD_MS) / EXHALE_MS;
        const eased = Math.pow(localT, 1.4); // slight ease-in (slow start, faster end)
        scale = 1.4 - eased * 0.55; // 1.4 → 0.85
        haloScale = 1.15 - eased * 0.25;
      }

      const orb = orbRef.current;
      if (orb) orb.style.transform = `scale(${scale.toFixed(4)})`;
      const halo = haloRef.current;
      if (halo) halo.style.transform = `scale(${haloScale.toFixed(4)})`;

      // Inner cardiac pulse 1Hz (60bpm) — independent del breath cycle.
      const pulsePhase = (elapsed / 1000) * (CARDIAC_PULSE_BPM / 60) * Math.PI * 2;
      const pulseScale = 1.0 + Math.sin(pulsePhase) * 0.15;
      const pulseDot = cardiacPulseRef.current;
      if (pulseDot) pulseDot.style.transform = `scale(${pulseScale.toFixed(4)})`;

      // Update phase + cycle state.
      setCyclePhase((prev) => (prev !== phase ? phase : prev));
      setCycleIdx((prev) => (prev !== completedCycles ? completedCycles : prev));

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [reduceMotion]);

  // Cycle complete signal + onComplete gate.
  useEffect(() => {
    if (cycleIdx === 0) return undefined;
    try {
      if (typeof onCycleCompleteRef.current === "function") {
        onCycleCompleteRef.current(cycleIdx);
      }
    } catch { /* noop */ }
    if (hapticEnabled) {
      try {
        hapticProtocolSignature(2, "phase_shift", { reducedMotion: reduceMotion });
      } catch { /* noop */ }
    }
    if (cycleIdx >= cycleCountTarget) {
      try {
        if (typeof onCompleteRef.current === "function") onCompleteRef.current();
      } catch { /* noop */ }
    }
    return undefined;
  }, [cycleIdx, cycleCountTarget, hapticEnabled, reduceMotion]);

  // Voice TTS opt-in (off by default per constraint).
  useEffect(() => {
    if (!voiceEnabled) return undefined;
    try {
      const phaseText = cyclePhase === "inhale" ? "inhala"
        : cyclePhase === "hold" ? "mantén"
        : "exhala";
      speak(phaseText, { rate: 0.85 });
    } catch { /* noop */ }
    return undefined;
  }, [cyclePhase, voiceEnabled]);

  // ─── Track 3: particle field bio-synced foundation ───────────────
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
        particleSysRef.current.setPhase(cyclePhase, 0);
        particleSysRef.current.start();
      }
    } catch (e) { /* noop */ }
    return () => {
      if (particleSysRef.current) {
        try { particleSysRef.current.stop(); } catch { /* noop */ }
        particleSysRef.current = null;
      }
    };
  }, [reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync particle system con cyclePhase changes.
  useEffect(() => {
    if (particleSysRef.current) {
      try { particleSysRef.current.setPhase(cyclePhase, 0); } catch { /* noop */ }
    }
  }, [cyclePhase]);

  return (
    <div
      data-v2-cardiac-coherence
      data-cycle-phase={cyclePhase}
      data-testid="cardiac-coherence-primitive"
      role="region"
      aria-label="Coherencia Cardíaca, respiración 6-2-8"
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
      {showPhaseLabel && (
        <span
          data-testid="cardiac-coherence-eyebrow"
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
      )}

      {/* Visual stack: particles + halo + outer orb + inner cardiac pulse dot */}
      <div
        style={{
          position: "relative",
          width: 300,
          height: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Track 3: particle field bio-synced */}
        <canvas
          ref={particleCanvasRef}
          data-testid="cardiac-coherence-particles"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: reduceMotion ? 0 : 0.45,
            transition: "opacity 200ms ease-out",
          }}
        />

        {/* Halo outer ring (descent emphasis) */}
        <div
          ref={haloRef}
          data-testid="cardiac-coherence-halo"
          aria-hidden="true"
          style={{
            position: "absolute",
            width: 220,
            height: 220,
            borderRadius: "50%",
            border: `0.5px solid ${phaseColor}`,
            opacity: 0.4,
            transition: "none",
            willChange: "transform",
            transform: "scale(1.0)",
          }}
        />

        {/* Track 1: outer orb breathing 6-2-8-0 */}
        <div
          ref={orbRef}
          data-testid="cardiac-coherence-orb"
          aria-hidden="true"
          style={{
            position: "absolute",
            width: 160,
            height: 160,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(14,116,144,0.32) 0%, rgba(14,116,144,0.15) 60%, rgba(14,116,144,0) 100%)",
            border: `1px solid ${phaseColor}`,
            opacity: 0.7,
            transition: "none",
            willChange: "transform",
            transform: "scale(1.0)",
          }}
        />

        {/* Track 2: inner cardiac pulse dot 60bpm */}
        <div
          ref={cardiacPulseRef}
          data-testid="cardiac-coherence-cardiac-pulse"
          aria-hidden="true"
          style={{
            position: "absolute",
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: phaseColor,
            opacity: 0.85,
            transition: "none",
            willChange: "transform",
            transform: "scale(1.0)",
            boxShadow: `0 0 8px ${phaseColor}`,
          }}
        />
      </div>

      {/* Track 4: body anchor sustained "Mano sobre el corazón" */}
      <span
        data-testid="cardiac-coherence-body-anchor"
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
        {BODY_ANCHOR_CUE}
      </span>

      {/* Cycle counter */}
      <span
        data-testid="cardiac-coherence-cycle-counter"
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
    </div>
  );
}
