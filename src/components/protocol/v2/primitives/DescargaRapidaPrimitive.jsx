"use client";
/* ═══════════════════════════════════════════════════════════════
   DescargaRapidaPrimitive — Phase 7 SP-D-1
   ───────────────────────────────────────────────────────────────
   Visual primitive dedicated para Descarga Rápida — Phase 1
   "Descarga Rápida" del protocolo #3 Reset Ejecutivo.

   Pattern asimétrico ratio 1:3 (2-0-6-0):
     - inhale (2s): orb 0.5 → 1.4 RÁPIDO (carga simpática brief)
     - hold (0s): instantáneo, no pause
     - exhale (6s): orb 1.4 → 0.5 LENTO DRAMÁTICO (metáfora globo
       desinflado · vagal afferent prolonged exhale)
     - empty (0s): siguiente ciclo inmediato
     Total cycle: 8s × 3 ciclos = 24s (alineado a Phase 1 30s target).

   Diferencia vs #1 BOX 4-4-4-4 + #2 6-2-8-0:
     - 1:3 ratio (más agresivo descarga simpática que 1:1.3 HeartMath)
     - 0s holds (sin pausa — flow continuo "desinflar")
     - Orb deflate range 0.5-1.4 (dramatic vs 0.85-1.4 de #1+#2)
     - Cycling release cues físicos rotativos per cycle
     - 3 ciclos rápidos vs 2 lentos de #1+#2

   Multi-task tracks simultáneos (ejercicios neurales layered):
     1. RESPIRATORIO primary: breath orb 2-0-6-0 dramatic deflate
        + halo collapse durante exhale.
     2. VISUAL MENTAL: orb metáfora "globo desinflando" — el visual
        literal del catálogo ("como desinflar un globo").
     3. FÍSICO SOMÁTICO rotativo per cycle:
        - Cycle 1: "Hombros caen" (trapezius release)
        - Cycle 2: "Mandíbula suelta" (jaw release)
        - Cycle 3: "Pecho desinflado" (chest cavity release)
     4. VISUAL CONTINUITY: particle field bio-synced (centripetal
        inhale 2s rapid → centrifugal exhale 6s slow).
     5. PHASE label "Descarga Rápida" (zero scientific text).
     6. Progress counter X/3 visible.

   Mecanismos científicos (NO surface en UI per user feedback):
     - Ratio 1:3 inhale:exhale activa tono vagal parasimpático
       en <20s (Russo 2017 · Lehrer 2014).
     - Trapezius release reduces sympathetic activity vía descenso
       cervical somatic (Levine 2010 somatic experiencing).
     - Mandible drop activates parasympathetic vía masseter motor
       relaxation (Pavlov 1927 conditioned response inverse).

   Functional human logic:
     - Mientras inhala 2s rápido, lee cycle release cue.
     - Mientras exhala 6s lento, observa orb deflate + suelta cuerpo.
     - Cycling cues rotan automatic — usuario no decide.

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - Cycling release cues passive (lectura sola, no acción extra).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hapticProtocolSignature, speak } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

// Cadence constants 2-0-6-0 ratio 1:3.
const INHALE_MS = 2000;
const HOLD_MS = 0;
const EXHALE_MS = 6000;
const EMPTY_MS = 0;
const CYCLE_MS = INHALE_MS + HOLD_MS + EXHALE_MS + EMPTY_MS; // 8000ms

const DEFAULT_TARGET_CYCLES = 3; // alineado a validate.min_cycles=3

const PHASE_LABEL = "Descarga Rápida";

// Release cues rotativos per cycle — physical somatic neural biohacking.
// Cycle 1 → trapezius drop, Cycle 2 → mandible release, Cycle 3 → chest cavity release.
// Cada cue activa una región de tensión sympathetic común en líderes bajo presión.
const CYCLE_RELEASE_CUES = [
  "Hombros caen",
  "Mandíbula suelta",
  "Pecho desinflado",
];

/**
 * @param {object} props
 * @param {number} [props.cycleCountTarget=3]
 * @param {boolean} [props.audioEnabled=true]
 * @param {boolean} [props.hapticEnabled=true]
 * @param {boolean} [props.voiceEnabled=false]
 * @param {boolean} [props.showPhaseLabel=true]
 * @param {(n:number)=>void} [props.onCycleComplete]
 * @param {()=>void} [props.onComplete]
 */
export default function DescargaRapidaPrimitive({
  cycleCountTarget = DEFAULT_TARGET_CYCLES,
  audioEnabled = true, // eslint-disable-line no-unused-vars
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

  const [cyclePhase, setCyclePhase] = useState("inhale");
  const [cycleIdx, setCycleIdx] = useState(0);

  const onCycleCompleteRef = useRef(onCycleComplete);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCycleCompleteRef.current = onCycleComplete; }, [onCycleComplete]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // ─── Track 1: Outer orb + halo dramatic deflate ────────────────
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
        const eased = 1 - Math.pow(1 - t, 2.5); // ease-out fast
        // Range 0.5 → 1.4 (rapid expansion, brief simpático charge).
        scale = 0.5 + eased * 0.9;
        haloScale = 0.7 + eased * 0.5;
      } else {
        phase = "exhale";
        const localT = (cycleElapsed - INHALE_MS) / EXHALE_MS;
        const eased = Math.pow(localT, 1.6); // ease-in (slow start, accelerates)
        // Range 1.4 → 0.5 (DRAMATIC slow deflate · "desinflar globo").
        scale = 1.4 - eased * 0.9;
        haloScale = 1.2 - eased * 0.6;
      }

      const orb = orbRef.current;
      if (orb) orb.style.transform = `scale(${scale.toFixed(4)})`;
      const halo = haloRef.current;
      if (halo) halo.style.transform = `scale(${haloScale.toFixed(4)})`;

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
        hapticProtocolSignature(3, "phase_shift", { reducedMotion: reduceMotion });
      } catch { /* noop */ }
    }
    if (cycleIdx >= cycleCountTarget) {
      try {
        if (typeof onCompleteRef.current === "function") onCompleteRef.current();
      } catch { /* noop */ }
    }
    return undefined;
  }, [cycleIdx, cycleCountTarget, hapticEnabled, reduceMotion]);

  // Voice TTS opt-in.
  useEffect(() => {
    if (!voiceEnabled) return undefined;
    try {
      const phaseText = cyclePhase === "inhale" ? "inhala" : "exhala";
      speak(phaseText, { rate: 0.9 });
    } catch { /* noop */ }
    return undefined;
  }, [cyclePhase, voiceEnabled]);

  // ─── Track 4: particle field bio-synced ────────────────────────
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

  useEffect(() => {
    if (particleSysRef.current) {
      try { particleSysRef.current.setPhase(cyclePhase, 0); } catch { /* noop */ }
    }
  }, [cyclePhase]);

  // Track 3: cycling release cue per cycle.
  const releaseCue = CYCLE_RELEASE_CUES[Math.min(cycleIdx, CYCLE_RELEASE_CUES.length - 1)];

  return (
    <div
      data-v2-descarga-rapida
      data-cycle-phase={cyclePhase}
      data-cycle-idx={cycleIdx}
      data-testid="descarga-rapida-primitive"
      role="region"
      aria-label="Descarga Rápida, respiración 2-6 ratio 1:3"
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
          data-testid="descarga-rapida-phase-label"
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

      {/* Visual stack: particles + halo + orb (deflating balloon metaphor) */}
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
        {/* Particles bio-synced */}
        <canvas
          ref={particleCanvasRef}
          data-testid="descarga-rapida-particles"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: reduceMotion ? 0 : 0.4,
            transition: "opacity 200ms ease-out",
          }}
        />

        {/* Halo outer ring (collapses dramatically during exhale) */}
        <div
          ref={haloRef}
          data-testid="descarga-rapida-halo"
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

        {/* Track 1: outer orb breathing 2-0-6-0 with dramatic deflate */}
        <div
          ref={orbRef}
          data-testid="descarga-rapida-orb"
          aria-hidden="true"
          style={{
            position: "absolute",
            width: 160,
            height: 160,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(14,116,144,0.36) 0%, rgba(14,116,144,0.18) 60%, rgba(14,116,144,0) 100%)",
            border: `1px solid ${phaseColor}`,
            opacity: 0.75,
            transition: "none",
            willChange: "transform",
            transform: "scale(1.0)",
          }}
        />
      </div>

      {/* Track 3: cycling release cue per cycle (rotativo) */}
      <span
        data-testid="descarga-rapida-release-cue"
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
        {releaseCue}
      </span>

      {/* Cycle counter */}
      <span
        data-testid="descarga-rapida-cycle-counter"
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
