"use client";
/* ═══════════════════════════════════════════════════════════════
   ParasympathicResetOrb — Phase 7 F3 Flagship #1
   ───────────────────────────────────────────────────────────────
   Visual primitive dedicated para Reinicio Parasimpático — Phase 1
   "Entrada Vagal" del protocolo (BOX BREATHING 4-4-4-4 con vacío).

   Mecanismos científicos referenciados (eyebrow inline):
     - Porges 2011 (Polyvagal Theory): el patrón box breathing 4-4-4-4
       activa el complejo vagal ventral (rama mielinizada del nervio
       vago responsable de "calma social").
     - Mecanismo barorreflex: la pausa post-inhalación (hold) aumenta
       presión intratorácica y estimula barorreceptores aórticos →
       señales de "seguridad" al tronco cerebral.

   Pattern visualization 4-fase BOX cycle (16s total per cycle):
     - inhale (4s): orb 1.0 → 1.4 (rápido)
     - hold (4s): orb 1.4 sustained + halo expansion sine (vagal tone)
     - exhale (4s): orb 1.4 → 0.85 (descenso parasimpático)
     - empty (4s): orb 0.85 sustained (vacío del ciclo box)

   IMPORTANTE: el catálogo real del protocolo #1 usa BOX 4-4-4-4 (NO
   Weil 4-7-8 como decía el SP spec). SCIENCE_DEEP entry literal dice
   "respiración box (4-4-4-4) activa complejo vagal ventral". Pattern
   visualization corrigió el SP para alinear con catálogo real.

   Cycle: 16s × 7 ciclos ≈ 112s (alineado a Phase 1 32s target_ms en
   2 ciclos breath validation min_cycles:2). Default cycleCountTarget=2
   para validation gate, render continuo hasta onComplete.

   Wiring Foundation:
     - Haptic F0-4: hapticProtocolSignature(1, ...) firma calma soft
       (intensity_modifier 0.85).
     - Voice TTS opt-in: speak("inhala"/"mantén"/"exhala"/"vacío").
     - Telemetry F0-2: useProtocolPlayer captura per-act.

   Daily anchor cohort cold-start: este es el primer protocolo que el
   usuario probable encuentra. Eyebrow + framing científico instalan
   confianza desde sesión 1.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hapticProtocolSignature, speak } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
// Phase 7 SP-B-2 Capa 1 — particle system bio-synced overlay (subtle).
// Foundation reusable from SP-B-1. 12/6/0 particles per device tier.
import { createParticleSystem } from "../../../../lib/animations/particleSystem";
// Phase 7 fix: phase label simple en lugar de scientific eyebrow morph
// (user feedback — ciencia arriba causa fatiga textual, solo phase name).

const INHALE_MS = 4000;
const HOLD_MS = 4000;
const EXHALE_MS = 4000;
const EMPTY_MS = 4000;
const CYCLE_MS = INHALE_MS + HOLD_MS + EXHALE_MS + EMPTY_MS; // 16000ms

const DEFAULT_TARGET_CYCLES = 2; // alineado a validate.min_cycles del catálogo

/**
 * @param {object} props
 * @param {number} [props.cycleCountTarget=2]
 * @param {boolean} [props.audioEnabled=true]
 * @param {boolean} [props.hapticEnabled=true]
 * @param {boolean} [props.voiceEnabled=false]
 * @param {boolean} [props.showEyebrow=true]
 * @param {(n:number)=>void} [props.onCycleComplete]
 * @param {()=>void} [props.onComplete]
 */
export default function ParasympathicResetOrb({
  cycleCountTarget = DEFAULT_TARGET_CYCLES,
  audioEnabled = true,  
  hapticEnabled = true,
  voiceEnabled = false,
  showEyebrow = true,
  onCycleComplete,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const orbRef = useRef(null);
  const haloRef = useRef(null);
  const rafIdRef = useRef(null);
  const startTsRef = useRef(0);
  const lastPhaseFiredRef = useRef("");
  const onCycleCompleteRef = useRef(onCycleComplete);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCycleCompleteRef.current = onCycleComplete; }, [onCycleComplete]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const [cyclePhase, setCyclePhase] = useState("inhale");
  const [cycleIdx, setCycleIdx] = useState(0);

  // Phase 7 SP-B-2 Capa 1 — particle system bio-synced overlay.
  // Subtle background field. Mismas 4 phase behaviors que ParticleSystem
  // foundation pero mapeadas: inhale→inhale (centripetal), hold→hold
  // (orbital), exhale→exhale (centrifugal), empty→empty (damping).
  const particleCanvasRef = useRef(null);
  const particleSysRef = useRef(null);
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return undefined;
    // Use logical size matched to viewport orb area; high-DPI not required for subtle bg.
    canvas.width = 300;
    canvas.height = 300;
    try {
      particleSysRef.current = createParticleSystem({ canvas, reducedMotion: reduceMotion });
      if (particleSysRef.current) {
        particleSysRef.current.setPhase("inhale", 0);
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

  // Sync particles con cyclePhase del breath cycle.
  useEffect(() => {
    if (particleSysRef.current) {
      try { particleSysRef.current.setPhase(cyclePhase, 0.5); } catch { /* noop */ }
    }
  }, [cyclePhase]);

  // Phase 7 SP-B-2 Capa 3 — somatic body scan secondary overlay.
  // Multi-task: usuario respira (primary) + lee body cue (secondary).
  // Cycling instructions cada cycle, alineado al constraint user oficina+
  // sentado+sin volumen+una mano (read-only, no extra interaction).
  // Honest: NO añade interaction, sí añade cognitive layer somatic.
  // Body cues passive — válidos durante todo el ciclo box (16s). Evitamos
  // verbos activos como "expande" que solo aplican al inhale (4s).
  const SOMATIC_CUES = [
    "Hombros sueltos",
    "Mandíbula relajada",
    "Vientre suave",
    "Pecho abierto",
  ];
  const somaticCue = SOMATIC_CUES[cycleIdx % SOMATIC_CUES.length];

  useEffect(() => {
    if (reduceMotion) {
      const orb = orbRef.current;
      const halo = haloRef.current;
      if (orb) orb.style.transform = "scale(1.0)";
      if (halo) { halo.style.transform = "scale(1.0)"; halo.style.opacity = "0"; }

      startTsRef.current = Date.now();
      const id = setInterval(() => {
        const elapsed = Date.now() - startTsRef.current;
        const cycle = Math.floor(elapsed / CYCLE_MS);
        const cycleElapsed = elapsed - cycle * CYCLE_MS;
        let phase;
        if (cycleElapsed < INHALE_MS) phase = "inhale";
        else if (cycleElapsed < INHALE_MS + HOLD_MS) phase = "hold";
        else if (cycleElapsed < INHALE_MS + HOLD_MS + EXHALE_MS) phase = "exhale";
        else phase = "empty";
        setCyclePhase(phase);
        setCycleIdx(cycle);
        if (cycleCountTarget > 0 && cycle >= cycleCountTarget) {
          clearInterval(id);
          if (typeof onCompleteRef.current === "function") {
            queueMicrotask(() => onCompleteRef.current());
          }
        }
      }, 250);
      return () => clearInterval(id);
    }

    // RAF loop (no framer-motion).
    startTsRef.current = performance.now();
    let stopped = false;
    let lastCycle = -1;

    const tick = (now) => {
      if (stopped) return;
      const elapsed = now - startTsRef.current;
      const cycle = Math.floor(elapsed / CYCLE_MS);
      const cycleElapsed = elapsed - cycle * CYCLE_MS;

      let scale, haloScale, haloOpacity, phase;
      if (cycleElapsed < INHALE_MS) {
        const t = cycleElapsed / INHALE_MS;
        scale = 1.0 + t * 0.4;          // 1.0 → 1.4
        haloScale = 1.0;
        haloOpacity = 0;
        phase = "inhale";
      } else if (cycleElapsed < INHALE_MS + HOLD_MS) {
        const t = (cycleElapsed - INHALE_MS) / HOLD_MS;
        scale = 1.4;                     // sustained
        haloScale = 1.0 + t * 0.4;       // 1.0 → 1.4 expands during hold
        haloOpacity = Math.sin(t * Math.PI) * 0.4; // sine 0 → 0.4 → 0
        phase = "hold";
      } else if (cycleElapsed < INHALE_MS + HOLD_MS + EXHALE_MS) {
        const t = (cycleElapsed - INHALE_MS - HOLD_MS) / EXHALE_MS;
        scale = 1.4 - t * 0.55;          // 1.4 → 0.85
        haloScale = 1.0;
        haloOpacity = 0;
        phase = "exhale";
      } else {
        // empty (vacío)
        scale = 0.85;                    // sustained empty
        haloScale = 1.0;
        haloOpacity = 0;
        phase = "empty";
      }

      const orb = orbRef.current;
      const halo = haloRef.current;
      if (orb) orb.style.transform = `scale(${scale.toFixed(4)})`;
      if (halo) {
        halo.style.transform = `scale(${haloScale.toFixed(4)})`;
        halo.style.opacity = haloOpacity.toFixed(3);
      }

      if (phase !== cyclePhase) setCyclePhase(phase);
      if (cycle !== lastCycle) {
        lastCycle = cycle;
        setCycleIdx(cycle);
        if (cycle > 0 && typeof onCycleCompleteRef.current === "function") {
          queueMicrotask(() => onCycleCompleteRef.current(cycle));
        }
        if (cycleCountTarget > 0 && cycle >= cycleCountTarget) {
          stopped = true;
          if (typeof onCompleteRef.current === "function") {
            queueMicrotask(() => onCompleteRef.current());
          }
          return;
        }
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      stopped = true;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [reduceMotion, cycleCountTarget, cyclePhase]);

  // Cue dispatch: haptic + voice on phase boundary.
  useEffect(() => {
    const key = `${cycleIdx}-${cyclePhase}`;
    if (lastPhaseFiredRef.current === key) return;
    lastPhaseFiredRef.current = key;

    if (hapticEnabled) {
      try {
        const phaseKind = cyclePhase === "inhale" ? "breath_inhale"
          : cyclePhase === "hold" ? "breath_hold"
          : cyclePhase === "exhale" ? "breath_exhale"
          : "breath_hold"; // empty cae a hold pattern (similar pause cue)
        hapticProtocolSignature(1, phaseKind, { reducedMotion: reduceMotion });
      } catch (e) { /* noop */ }
    }
    if (voiceEnabled) {
      try {
        if (cyclePhase === "inhale") speak("inhala");
        else if (cyclePhase === "hold") speak("mantén");
        else if (cyclePhase === "exhale") speak("exhala");
        // empty: no voice (silencio respeta el "vacío" del ciclo box)
      } catch (e) { /* noop */ }
    }
  }, [cycleIdx, cyclePhase, hapticEnabled, voiceEnabled, reduceMotion]);

  const phaseLabel = cyclePhase === "inhale" ? "INHALA · 4"
    : cyclePhase === "hold" ? "MANTÉN · 4"
    : cyclePhase === "exhale" ? "EXHALA · 4"
    : "VACÍO · 4";

  return (
    <div
      data-v2-parasympathic-reset
      data-cycle-phase={cyclePhase}
      data-cycle-idx={cycleIdx}
      data-testid="parasympathic-reset-orb"
      role="img"
      aria-label={`Reinicio Parasimpático, ciclo ${cycleIdx + 1} de ${cycleCountTarget}, fase ${cyclePhase}, box 4-4-4-4`}
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
      {showEyebrow && (
        <span
          data-testid="parasympathic-reset-eyebrow"
          style={{
            fontFamily: typography.family,
            fontSize: 11,
            fontWeight: typography.weight.medium,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: getCyanForPhase(0),
            opacity: 0.7,
          }}
        >
          Entrada Vagal
        </span>
      )}

      {/* Orb central + halo expansion durante hold + particle field (SP-B-2 Capa 1) */}
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
        {/* Particle system bio-synced (SP-B-2 Capa 1). Subtle background. */}
        <canvas
          ref={particleCanvasRef}
          data-testid="parasympathic-reset-particles"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: reduceMotion ? 0 : 0.6,
            transition: "opacity 200ms ease-out",
          }}
        />
        {/* Halo expansion durante hold */}
        <div
          ref={haloRef}
          data-testid="parasympathic-reset-halo"
          aria-hidden="true"
          style={{
            position: "absolute",
            width: 240,
            height: 240,
            borderRadius: "50%",
            border: `1px solid ${getCyanForPhase(0)}`,
            opacity: 0,
            transition: "none",
            willChange: "transform, opacity",
            transform: "scale(1.0)",
          }}
        />
        {/* Orb central */}
        <div
          ref={orbRef}
          data-testid="parasympathic-reset-orb-disc"
          aria-hidden="true"
          style={{
            width: 160,
            height: 160,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(14,116,144,0.50) 0%, rgba(14,116,144,0.22) 60%, rgba(14,116,144,0) 100%)",
            border: `1px solid ${getCyanForPhase(0)}`,
            transition: "none",
            willChange: "transform",
            transform: "scale(1.0)",
          }}
        />
      </div>

      <span
        data-testid="parasympathic-reset-phase-label"
        aria-live="polite"
        style={{
          fontFamily: typography.familyMono,
          fontSize: typography.size.microCaps,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: colors.text.secondary,
          fontWeight: typography.weight.regular,
          minHeight: 14,
        }}
      >
        {phaseLabel}
      </span>

      {/* Phase 7 SP-B-2 Capa 3 — Somatic body scan secondary cue.
          Multi-task: usuario respira (primary) + lee body cue (secondary).
          Cycling cada cycle. Read-only, sin extra interaction.
          Constraint compliant (oficina + 1mano + sin volumen + sentado). */}
      <span
        data-testid="parasympathic-reset-somatic-cue"
        aria-live="polite"
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.01em",
          color: colors.text.secondary,
          opacity: 0.7,
          minHeight: 18,
          textAlign: "center",
        }}
      >
        {somaticCue}
      </span>

      <span
        data-testid="parasympathic-reset-cycle-counter"
        style={{
          fontFamily: typography.familyMono,
          fontSize: 12,
          letterSpacing: "0.12em",
          color: colors.text.muted,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {cycleIdx + 1} / {cycleCountTarget}
      </span>
    </div>
  );
}

// Exposed para tests.
export const __internals = {
  INHALE_MS,
  HOLD_MS,
  EXHALE_MS,
  EMPTY_MS,
  CYCLE_MS,
  DEFAULT_TARGET_CYCLES,
};
