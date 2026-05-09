"use client";
/* ═══════════════════════════════════════════════════════════════
   CardiacPulseMatchVisual — Phase 7 F2 Flagship #25
   ───────────────────────────────────────────────────────────────
   Visual primitive dedicated para Cardiac Pulse Match — Phase 3
   "Sincronía Cardíaca" del protocolo (5.5 rpm resonance breathing
   con interocepción cardíaca).

   Mecanismos científicos referenciados (eyebrow inline):
     - Schandry 1981 (Psychophysiology): heartbeat detection task —
       palpar pulso radial activa interocepción cardíaca explícita.
     - Garfinkel 2015 (Biological Psychology): interoceptive accuracy
       + ínsula posterior activation.
     - Lehrer-Vaschillo 2014 (Frontiers in Psychology): respiración
       a frecuencia de resonancia ~5.5 rpm maximiza HRV vía
       resonancia barorrefleja.

   Pattern visualization 3 elementos:
     1. Heartbeat-pulse central: orb que pulsa siguiendo el ciclo
        respiratorio 5.5 rpm (inhale 5.5s + exhale 5.5s = 11s/cycle).
     2. Resonance pacer ring: halo expandiendo (inhale) + contrayendo
        (exhale). Visual feedback del ritmo target.
     3. Wrist anchor diagram: SVG minimal mostrando localización del
        pulso (radial default; carotid variant accessibility para 10%
        población que no detecta radial fácilmente).

   Variant toggle:
     - radial (default): forearm + dot en muñeca (2 dedos abajo del pulgar)
     - carotid (toggle): neck + dot lateral cuello

   Single-fixation pattern: orb central permanece fijo, no peripheral
   movement → eye-track friendly oficina (D6=10 user constraint).

   Wiring Foundation:
     - Haptic F0-4: hapticProtocolSignature(25, ...) firma única
       heartbeat-matched [80,40,80,40,120] / exhale [120,60,80,60,120].
     - Voice TTS opt-in: speak("siente"/"exhala") cuando voiceEnabled.
     - Telemetry F0-2: useProtocolPlayer captura per-act automático.

   Scope F2: reemplaza SOLO Phase 3 ("Sincronía Cardíaca") del protocolo
   #25. Phase 2 ("Conteo de Latidos", count_only mode) sigue con
   PulseMatchVisual existing (heartbeat detection task no requiere
   resonance pacer).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hapticProtocolSignature, speak } from "../../../../lib/audio";
import { colors, typography, spacing } from "../../../app/v2/tokens";

const INHALE_MS = 5500;
const EXHALE_MS = 5500;
const CYCLE_MS = INHALE_MS + EXHALE_MS;
const DEFAULT_TARGET_CYCLES = 5; // 5 ciclos × 11s ≈ 55s (≈ Phase 3 60s window)

/**
 * @param {object} props
 * @param {number} [props.cycleCountTarget=5]
 * @param {boolean} [props.audioEnabled=true]
 * @param {boolean} [props.hapticEnabled=true]
 * @param {boolean} [props.voiceEnabled=false]
 * @param {boolean} [props.showEyebrow=true]
 * @param {(n:number)=>void} [props.onCycleComplete]
 * @param {()=>void} [props.onComplete]
 */
export default function CardiacPulseMatchVisual({
  cycleCountTarget = DEFAULT_TARGET_CYCLES,
  audioEnabled = true, // eslint-disable-line no-unused-vars
  hapticEnabled = true,
  voiceEnabled = false,
  showEyebrow = true,
  onCycleComplete,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const orbRef = useRef(null);
  const ringRef = useRef(null);
  const rafIdRef = useRef(null);
  const startTsRef = useRef(0);
  const lastPhaseFiredRef = useRef("");
  const onCycleCompleteRef = useRef(onCycleComplete);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCycleCompleteRef.current = onCycleComplete; }, [onCycleComplete]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const [variant, setVariant] = useState("radial"); // 'radial' | 'carotid'
  const [cyclePhase, setCyclePhase] = useState("inhale");
  const [cycleIdx, setCycleIdx] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      // Reduced motion: setInterval-based cycle progression sin animation.
      const orb = orbRef.current;
      const ring = ringRef.current;
      if (orb) orb.style.transform = "scale(1.0)";
      if (ring) ring.style.transform = "scale(1.0)";

      startTsRef.current = Date.now();
      const id = setInterval(() => {
        const elapsed = Date.now() - startTsRef.current;
        const cycle = Math.floor(elapsed / CYCLE_MS);
        const cycleElapsed = elapsed - cycle * CYCLE_MS;
        const phase = cycleElapsed < INHALE_MS ? "inhale" : "exhale";
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

      let scale, ringScale, phase;
      if (cycleElapsed < INHALE_MS) {
        const t = cycleElapsed / INHALE_MS;
        scale = 1.0 + t * 0.4;       // orb 1.0 → 1.4
        ringScale = 1.0 + t * 0.5;   // ring 1.0 → 1.5
        phase = "inhale";
      } else {
        const t = (cycleElapsed - INHALE_MS) / EXHALE_MS;
        scale = 1.4 - t * 0.4;       // orb 1.4 → 1.0
        ringScale = 1.5 - t * 0.5;   // ring 1.5 → 1.0
        phase = "exhale";
      }

      const orb = orbRef.current;
      const ring = ringRef.current;
      if (orb) orb.style.transform = `scale(${scale.toFixed(4)})`;
      if (ring) ring.style.transform = `scale(${ringScale.toFixed(4)})`;

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
        const phaseKind = cyclePhase === "inhale" ? "breath_inhale" : "breath_exhale";
        hapticProtocolSignature(25, phaseKind, { reducedMotion: reduceMotion });
      } catch (e) { /* noop */ }
    }
    if (voiceEnabled) {
      try {
        if (cyclePhase === "inhale") speak("siente");
        else if (cyclePhase === "exhale") speak("exhala");
      } catch (e) { /* noop */ }
    }
  }, [cycleIdx, cyclePhase, hapticEnabled, voiceEnabled, reduceMotion]);

  return (
    <div
      data-v2-cardiac-pulse-match
      data-cycle-phase={cyclePhase}
      data-cycle-idx={cycleIdx}
      data-variant={variant}
      data-testid="cardiac-pulse-match-visual"
      role="img"
      aria-label={`Cardiac Pulse Match, ciclo ${cycleIdx + 1} de ${cycleCountTarget}, fase ${cyclePhase}, pulso ${variant === "radial" ? "radial" : "carotídeo"}`}
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
          data-testid="cardiac-pulse-eyebrow"
          style={{
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: colors.accent.phosphorCyan,
            fontWeight: typography.weight.medium,
            opacity: 0.85,
            textAlign: "center",
            maxWidth: 320,
          }}
        >
          SCHANDRY 1981 · GARFINKEL 2015 · LEHRER-VASCHILLO
        </span>
      )}

      {/* Heartbeat orb + resonance ring */}
      <div
        style={{
          position: "relative",
          width: 240,
          height: 240,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          ref={ringRef}
          data-testid="cardiac-pulse-ring"
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0, left: 0,
            width: 240,
            height: 240,
            borderRadius: "50%",
            border: `1px solid ${colors.accent.phosphorCyan}`,
            opacity: 0.35,
            transition: "none",
            willChange: "transform",
            transform: "scale(1.0)",
          }}
        />
        <div
          ref={orbRef}
          data-testid="cardiac-pulse-orb"
          aria-hidden="true"
          style={{
            width: 160,
            height: 160,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(34,211,238,0.50) 0%, rgba(21,94,117,0.22) 60%, rgba(21,94,117,0) 100%)",
            border: `1px solid ${colors.accent.phosphorCyan}`,
            transition: "none",
            willChange: "transform",
            transform: "scale(1.0)",
          }}
        />
      </div>

      <span
        data-testid="cardiac-pulse-phase-label"
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
        {cyclePhase === "inhale" ? "SIENTE TU PULSO" : "EXHALA"}
      </span>

      {/* Wrist/carotid diagram + variant toggle */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: spacing.s8,
        }}
      >
        <CardiacPulseDiagram variant={variant} />
        <button
          type="button"
          onClick={() => setVariant((v) => (v === "radial" ? "carotid" : "radial"))}
          data-testid="cardiac-pulse-variant-toggle"
          aria-label={variant === "radial" ? "Cambiar a pulso carotídeo" : "Cambiar a pulso radial"}
          style={{
            fontFamily: typography.familyMono,
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontWeight: typography.weight.regular,
            color: colors.text.muted,
            background: "transparent",
            border: "none",
            paddingBlock: spacing.s8,
            paddingInline: spacing.s12,
            cursor: "pointer",
            minHeight: 44,
          }}
        >
          {variant === "radial" ? "NO DETECTO · USAR CUELLO" : "USAR MUÑECA"}
        </button>
      </div>

      {/* Cycle counter */}
      <span
        data-testid="cardiac-pulse-cycle-counter"
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

function CardiacPulseDiagram({ variant }) {
  return (
    <svg
      width={120}
      height={60}
      data-testid="cardiac-pulse-diagram"
      data-diagram-variant={variant}
      aria-hidden="true"
      style={{ opacity: 0.55 }}
    >
      {variant === "radial" ? (
        <g>
          {/* Forearm horizontal line */}
          <line x1={10} y1={32} x2={100} y2={32}
            stroke="rgba(255,255,255,0.5)" strokeWidth={2} strokeLinecap="round" />
          {/* Wrist crease */}
          <line x1={75} y1={26} x2={75} y2={38}
            stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
          {/* Pulse dot — 2 dedos abajo del pulgar */}
          <circle cx={85} cy={32} r={4} fill="#22D3EE" />
          <circle cx={85} cy={32} r={7} fill="none" stroke="#22D3EE" strokeWidth={1} opacity={0.5} />
        </g>
      ) : (
        <g>
          {/* Neck silhouette curve */}
          <path d="M40 8 Q42 24 50 50"
            stroke="rgba(255,255,255,0.5)" strokeWidth={2} fill="none" strokeLinecap="round" />
          <path d="M70 8 Q68 24 60 50"
            stroke="rgba(255,255,255,0.5)" strokeWidth={2} fill="none" strokeLinecap="round" />
          {/* Carotid pulse dot — lateral neck */}
          <circle cx={48} cy={32} r={4} fill="#22D3EE" />
          <circle cx={48} cy={32} r={7} fill="none" stroke="#22D3EE" strokeWidth={1} opacity={0.5} />
        </g>
      )}
    </svg>
  );
}

// Exposed para tests + future SP introspection.
export const __internals = {
  INHALE_MS,
  EXHALE_MS,
  CYCLE_MS,
  DEFAULT_TARGET_CYCLES,
};
