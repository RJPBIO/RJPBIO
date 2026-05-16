"use client";
/* ═══════════════════════════════════════════════════════════════
   PhysiologicalSighOrb — Phase 7 F1 Flagship #15
   ───────────────────────────────────────────────────────────────
   Visual primitive dedicated para Suspiro Fisiológico (Stanford 2023,
   Balban et al., Cell Reports Medicine, N=114, 28 días).

   Pattern visualization único en catálogo:
     - 5-cycle pattern (5000ms total per cycle):
       · inhale1 (1000ms): orb 1.0 → 1.30  (primera nasal larga 70%)
       · inhale2 (1000ms): orb 1.30 → 1.50 (top-off corta 30%, doble-inhalación)
       · hold    (1000ms): orb 1.50 sustained
       · exhale  (1500ms): orb 1.50 → 0.85 (exhalación bucal larga)
       · afterwave (500ms): orb 0.85 → 0.95 → 0.85 (settle parasimpático)

     Total: 5 ciclos × 5000ms ≈ 25 segundos (alineado a fase 1 del protocol
     #15 con duration target_ms 30000ms; resto buffered en validation).

   Single-fixation pattern: el orb permanece centrado, no peripheral
   movement → eye-track friendly oficina (constraint usuario duro D6=10).

   Eyebrow inline pre-session: "STANFORD 2023 · CELL REPORTS MEDICINE"
   visible Step 1 mount sin tocar ProtocolPlayer shell.

   Wiring Foundation:
     - Haptic: hapticProtocolSignature(15, ...) F0-4 firma única doble-
       inhalación [40, 20, 30, 20, 80] / exhale [200, 100, 60, 40].
     - Voice: speak("uno"/"dos"/"exhala") TTS minimal, opt-in.
     - Telemetry: F0-2 captura per-act automático via useProtocolPlayer.
     - Feedback: F0-3 5 questions automático tras completion.

   ANTI-REGRESSION: NO toca BreathOrbExtended ni hapticBreath/hapticPhase
   ni primitives/ otras. NO modifica PrimitiveSwitcher shell-level.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hapticProtocolSignature, speak } from "../../../../lib/audio";
import { colors, typography, spacing } from "../../../app/v2/tokens";

// Cycle phase config — duraciones en ms.
const CYCLE_SEQUENCE = [
  { phase: "inhale1",   ms: 1000, scaleFrom: 1.00, scaleTo: 1.30, label: "INHALA · UNO" },
  { phase: "inhale2",   ms: 1000, scaleFrom: 1.30, scaleTo: 1.50, label: "INHALA · DOS" },
  { phase: "hold",      ms: 1000, scaleFrom: 1.50, scaleTo: 1.50, label: "MANTÉN" },
  { phase: "exhale",    ms: 1500, scaleFrom: 1.50, scaleTo: 0.85, label: "EXHALA" },
  { phase: "afterwave", ms:  500, scaleFrom: 0.85, scaleTo: 0.85, label: "·" }, // sine wave en draw
];

const CYCLE_TOTAL_MS = CYCLE_SEQUENCE.reduce((a, b) => a + b.ms, 0); // 5000ms

const DEFAULT_TARGET_CYCLES = 5;

/**
 * @param {object} props
 * @param {number} [props.cycleCountTarget=5]
 * @param {boolean} [props.audioEnabled=true]
 * @param {boolean} [props.hapticEnabled=true]
 * @param {boolean} [props.voiceEnabled=false] — TTS opt-in (3 cues "uno/dos/exhala")
 * @param {boolean} [props.showEyebrow=true]   — Eyebrow Stanford inline
 * @param {(n:number)=>void} [props.onCycleComplete]
 * @param {()=>void} [props.onComplete]
 * @param {number} [props.size=200]
 */
export default function PhysiologicalSighOrb({
  cycleCountTarget = DEFAULT_TARGET_CYCLES,
  audioEnabled = true,  
  hapticEnabled = true,
  voiceEnabled = false,
  showEyebrow = true,
  onCycleComplete,
  onComplete,
  size = 200,
}) {
  const reduceMotion = useReducedMotion();
  const orbRef = useRef(null);
  const rafIdRef = useRef(null);
  const startTsRef = useRef(0);
  const lastPhaseFiredRef = useRef("");
  const onCycleCompleteRef = useRef(onCycleComplete);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCycleCompleteRef.current = onCycleComplete; }, [onCycleComplete]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // Track current phase for eyebrow render + cue dispatch.
  const [currentPhase, setCurrentPhase] = useState(CYCLE_SEQUENCE[0].phase);
  const [cycleIdx, setCycleIdx] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      // Reduced motion path: orb static at neutral 1.0; cycle progression
      // via setInterval (no RAF). Cues still fire por phase boundary.
      const orb = orbRef.current;
      if (orb) {
        orb.style.transform = "scale(1.0)";
      }
      const id = setInterval(() => {
        const elapsed = Date.now() - (startTsRef.current || Date.now());
        if (!startTsRef.current) startTsRef.current = Date.now();
        const totalElapsed = Date.now() - startTsRef.current;
        const cycle = Math.floor(totalElapsed / CYCLE_TOTAL_MS);
        const cycleElapsed = totalElapsed - cycle * CYCLE_TOTAL_MS;
        let acc = 0;
        let active = CYCLE_SEQUENCE[0];
        for (const seg of CYCLE_SEQUENCE) {
          if (cycleElapsed < acc + seg.ms) { active = seg; break; }
          acc += seg.ms;
        }
        setCurrentPhase(active.phase);
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

    // RAF loop — no framer-motion (memoria operativa).
    startTsRef.current = performance.now();
    let stopped = false;
    let lastCycle = -1;

    const tick = (now) => {
      if (stopped) return;
      const totalElapsed = now - startTsRef.current;
      const cycle = Math.floor(totalElapsed / CYCLE_TOTAL_MS);
      const cycleElapsed = totalElapsed - cycle * CYCLE_TOTAL_MS;

      // Find active segment
      let acc = 0;
      let activeSeg = CYCLE_SEQUENCE[0];
      let segElapsed = 0;
      for (const seg of CYCLE_SEQUENCE) {
        if (cycleElapsed < acc + seg.ms) {
          activeSeg = seg;
          segElapsed = cycleElapsed - acc;
          break;
        }
        acc += seg.ms;
      }

      // Compute scale
      const t = activeSeg.ms > 0 ? Math.min(1, segElapsed / activeSeg.ms) : 1;
      let scale;
      if (activeSeg.phase === "afterwave") {
        // Sine wave 0.85 → 0.95 → 0.85
        scale = 0.85 + Math.sin(t * Math.PI) * 0.10;
      } else {
        scale = activeSeg.scaleFrom + (activeSeg.scaleTo - activeSeg.scaleFrom) * t;
      }

      const orb = orbRef.current;
      if (orb) {
        orb.style.transform = `scale(${scale.toFixed(4)})`;
      }

      if (activeSeg.phase !== currentPhase) {
        setCurrentPhase(activeSeg.phase);
      }
      if (cycle !== lastCycle) {
        lastCycle = cycle;
        setCycleIdx(cycle);
        if (cycle > 0 && typeof onCycleCompleteRef.current === "function") {
          // Fire onCycleComplete tras COMPLETAR el ciclo previo (cycle increment).
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
  }, [reduceMotion, cycleCountTarget, currentPhase]);

  // Cue dispatch: haptic + voice on phase boundary (dedup via key).
  useEffect(() => {
    const key = `${cycleIdx}-${currentPhase}`;
    if (lastPhaseFiredRef.current === key) return;
    lastPhaseFiredRef.current = key;

    if (hapticEnabled) {
      try {
        if (currentPhase === "inhale1" || currentPhase === "inhale2") {
          hapticProtocolSignature(15, "breath_inhale", { reducedMotion: reduceMotion });
        } else if (currentPhase === "exhale") {
          hapticProtocolSignature(15, "breath_exhale", { reducedMotion: reduceMotion });
        } else if (currentPhase === "hold") {
          hapticProtocolSignature(15, "breath_hold", { reducedMotion: reduceMotion });
        }
      } catch (e) { /* noop */ }
    }

    if (voiceEnabled) {
      try {
        if (currentPhase === "inhale1") speak("uno");
        else if (currentPhase === "inhale2") speak("dos");
        else if (currentPhase === "exhale") speak("exhala");
      } catch (e) { /* noop */ }
    }
  }, [cycleIdx, currentPhase, hapticEnabled, voiceEnabled, reduceMotion]);

  const activeSeg = CYCLE_SEQUENCE.find((s) => s.phase === currentPhase) || CYCLE_SEQUENCE[0];

  return (
    <div
      data-v2-physiological-sigh-orb
      data-cycle-phase={currentPhase}
      data-cycle-idx={cycleIdx}
      data-testid="physiological-sigh-orb"
      style={{
        width: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.s24,
      }}
      role="img"
      aria-label={`Suspiro Fisiológico, ciclo ${cycleIdx + 1} de ${cycleCountTarget}, fase ${activeSeg.label.toLowerCase()}`}
    >
      {showEyebrow && (
        <span
          data-testid="physiological-sigh-eyebrow"
          style={{
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: colors.accent.phosphorCyan,
            fontWeight: typography.weight.medium,
            opacity: 0.85,
          }}
        >
          STANFORD 2023 · CELL REPORTS MEDICINE
        </span>
      )}

      <div
        style={{
          width: size,
          height: size,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          ref={orbRef}
          data-testid="physiological-sigh-orb-disc"
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(34,211,238,0.40) 0%, rgba(21,94,117,0.20) 60%, rgba(21,94,117,0) 100%)",
            border: `1px solid ${colors.accent.phosphorCyan}`,
            transition: "none",
            willChange: "transform",
            transform: "scale(1.0)",
          }}
          aria-hidden="true"
        />
      </div>

      <span
        data-testid="physiological-sigh-phase-label"
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
        {activeSeg.label}
      </span>
    </div>
  );
}

// Exposed for tests + future SP introspection.
export const __internals = {
  CYCLE_SEQUENCE,
  CYCLE_TOTAL_MS,
  DEFAULT_TARGET_CYCLES,
};
