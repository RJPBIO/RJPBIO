"use client";
/* ═══════════════════════════════════════════════════════════════
   FocalAnchorMantraPrimitive — Phase 7 SP-I-2
   ───────────────────────────────────────────────────────────────
   Visual primitive dedicated para Phase 2 "Fijación + Mantra" del
   protocolo #8 Lightning Focus. Combina fijación visual sostenida
   + mantra repetitivo sincrónico con exhalación.

   Two modes (one per sub-acto en Phase 2):
     mode="fixation" (sub-acto 0, 0-30s):
       - Punto focal lejano + halo radial peak.
       - Prompt: "Mira el punto sin parpadear · Lo que puedas"
       - Body anchor: "Punto fijo · Mirada lejana"
       - Concentric rings expand subtle (timing cue silenciosa).
       - Progress bar bottom + countdown chip.

     mode="mantra" (sub-acto 1, 30-60s):
       - Mismo punto focal pero pulsa con breath cadence.
       - Word "AHORA" emerges centro fade-in/hold/fade-out per exhale.
       - Body anchor: "En cada exhalación · Una palabra"
       - Mantra count chip "X/N".
       - Breath ring pulsa sync inhale/exhale.

   Multi-exercise tracks layered (8):
     1. PRIMARY visual: focal point radial gradient + boxShadow peak.
     2. CONCENTRIC rings (fixation) o BREATH ring (mantra) sync.
     3. WORD overlay (mantra mode) fade per exhale.
     4. DYNAMIC primary prompt cambia per mode.
     5. BODY anchor evolutivo.
     6. PROGRESS bar (fixation) o MANTRA counter (mantra).
     7. COUNTDOWN chip (fixation).
     8. PHASE label "Fijación" o "Mantra".

   Functional human logic:
     - Fijación: corteza prefrontal dorsolateral activada por sostener
       gaze sin pestañeo (atención top-down genuina).
     - Mantra: una palabra por exhalación elimina multitarea neural.

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const PHASE_LABEL_FIXATION = "Fijación";
const PHASE_LABEL_MANTRA = "Mantra";
const FIXATION_PROMPT = "Mira el punto sin parpadear · Lo que puedas";
const FIXATION_BODY = "Punto fijo · Mirada lejana";

// Mantra prompts now interpolate the actual word so user knows what to say.
const buildMantraPrompt = (word) =>
  `Repite mentalmente "${word}" · Una vez por exhalación`;
const buildMantraBody = (word) =>
  `En cada exhalación: "${word}"`;

const DEFAULT_DURATION_MS = 30000;
const DEFAULT_CADENCE = { in: 4, h1: 0, ex: 4, h2: 0 };
const RING_PULSE_INTERVAL_MS = 5000; // ring expansion every 5s in fixation

/**
 * @param {object} props
 * @param {"fixation"|"mantra"} [props.mode]
 * @param {number} [props.duration_ms]
 * @param {string} [props.mantra]
 * @param {{in:number,h1:number,ex:number,h2:number}} [props.breathCadence]
 * @param {boolean} [props.audioEnabled]
 * @param {boolean} [props.hapticEnabled]
 * @param {boolean} [props.voiceEnabled]
 * @param {()=>void} [props.onComplete]
 */
export default function FocalAnchorMantraPrimitive({
  mode = "fixation",
  duration_ms = DEFAULT_DURATION_MS,
  mantra = "Ahora.",
  breathCadence = DEFAULT_CADENCE,
  audioEnabled = true,  
  hapticEnabled = true,
  voiceEnabled = false,  
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const phaseColor = getCyanForPhase(1); // cyan-cool #67E8F9

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // ─── Common state ─────────────────────────────────────────────
  const [elapsedMs, setElapsedMs] = useState(0);
  const [completed, setCompleted] = useState(false);
  const focalRef = useRef(null);
  const startTimeRef = useRef(null);

  // ─── Mantra-specific state ────────────────────────────────────
  const [breathPhase, setBreathPhase] = useState("inhale"); // inhale | exhale
  const [wordOpacity, setWordOpacity] = useState(0);
  const [mantraCount, setMantraCount] = useState(0);

  const cyclePeriodMs = (breathCadence.in + breathCadence.h1 + breathCadence.ex + breathCadence.h2) * 1000;
  const totalMantras = Math.max(1, Math.floor(duration_ms / cyclePeriodMs));

  // ─── Main RAF tick ────────────────────────────────────────────
  useEffect(() => {
    if (reduceMotion) {
      const t = setTimeout(() => {
        setCompleted(true);
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
      }, 1500);
      return () => clearTimeout(t);
    }
    let stopped = false;
    let raf;
    startTimeRef.current = performance.now();

    const inhaleEndMs = breathCadence.in * 1000;
    const exhaleStartMs = (breathCadence.in + breathCadence.h1) * 1000;
    const exhaleEndMs = exhaleStartMs + breathCadence.ex * 1000;

    let lastBreathPhase = "inhale";
    let lastMantraCount = 0;

    const tick = (now) => {
      if (stopped) return;
      const elapsed = now - startTimeRef.current;
      setElapsedMs((prev) => (Math.abs(prev - elapsed) > 50 ? elapsed : prev));

      // ─── Focal pulse for mantra mode (breath sync) ──────────
      if (mode === "mantra") {
        const cycleMs = elapsed % cyclePeriodMs;
        const cycleIdx = Math.floor(elapsed / cyclePeriodMs);

        let scale = 1;
        let phase = "inhale";
        let wordOp = 0;

        if (cycleMs < inhaleEndMs) {
          // INHALE: scale grows
          const t = cycleMs / inhaleEndMs;
          scale = 1 + 0.18 * t;
          phase = "inhale";
          wordOp = 0;
        } else if (cycleMs < exhaleStartMs) {
          // HOLD (h1)
          scale = 1.18;
          phase = "hold";
          wordOp = 0;
        } else if (cycleMs < exhaleEndMs) {
          // EXHALE: scale shrinks + word fades in/out
          const t = (cycleMs - exhaleStartMs) / (breathCadence.ex * 1000);
          scale = 1.18 - 0.18 * t;
          phase = "exhale";
          // Bell curve fade: 0 → 1 at midway → 0
          wordOp = Math.sin(t * Math.PI);
        } else {
          // HOLD (h2)
          scale = 1;
          phase = "rest";
          wordOp = 0;
        }

        const focal = focalRef.current;
        if (focal) {
          focal.style.transform = `scale(${scale.toFixed(3)})`;
          focal.style.opacity = phase === "exhale" ? "0.95" : "1";
        }

        if (phase !== lastBreathPhase) {
          setBreathPhase(phase);
          lastBreathPhase = phase;
        }
        setWordOpacity((prev) => (Math.abs(prev - wordOp) > 0.05 ? wordOp : prev));

        if (cycleIdx !== lastMantraCount) {
          setMantraCount(cycleIdx);
          lastMantraCount = cycleIdx;
        }
      } else {
        // ─── Fixation mode: focal subtle gentle pulse ─────────
        const subtleScale = 1 + 0.012 * Math.sin((elapsed / 1800) * 2 * Math.PI);
        const focal = focalRef.current;
        if (focal) {
          focal.style.transform = `scale(${subtleScale.toFixed(3)})`;
        }
      }

      if (elapsed >= duration_ms) {
        stopped = true;
        setCompleted(true);
        if (hapticEnabled) {
          try { hapticProtocolSignature(8, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
        }
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [
    mode, duration_ms, hapticEnabled, reduceMotion,
    cyclePeriodMs, breathCadence.in, breathCadence.h1, breathCadence.ex, breathCadence.h2,
  ]);

  // ─── Particles ambient ───────────────────────────────────────
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
    } catch (e) {}
    return () => {
      if (particleSysRef.current) {
        try { particleSysRef.current.stop(); } catch {}
        particleSysRef.current = null;
      }
    };
  }, [reduceMotion]);

  // ─── Concentric rings ticker (fixation only) ─────────────────
  const [ringTick, setRingTick] = useState(0);
  useEffect(() => {
    if (mode !== "fixation" || reduceMotion) return undefined;
    const id = setInterval(() => setRingTick((n) => n + 1), RING_PULSE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [mode, reduceMotion]);

  const primaryPrompt = mode === "fixation" ? FIXATION_PROMPT : buildMantraPrompt(mantra);
  const bodyAnchor = mode === "fixation" ? FIXATION_BODY : buildMantraBody(mantra);
  const phaseLabel = mode === "fixation" ? PHASE_LABEL_FIXATION : PHASE_LABEL_MANTRA;

  const remainingS = Math.max(0, Math.ceil((duration_ms - elapsedMs) / 1000));
  const progressPct = Math.min(100, (elapsedMs / duration_ms) * 100);
  const mantrasCompleted = Math.min(mantraCount, totalMantras);

  return (
    <div
      data-v2-focal-anchor-mantra
      data-mode={mode}
      data-breath-phase={breathPhase}
      data-mantra-count={mantraCount}
      data-completed={completed ? "true" : "false"}
      data-testid="focal-anchor-mantra-primitive"
      role="region"
      aria-label={mode === "fixation"
        ? "Fijación visual sostenida sin parpadeo"
        : "Mantra repetido una vez por exhalación"}
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
      <span
        data-testid="focal-anchor-mantra-phase-label"
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
        {phaseLabel}
      </span>

      <p
        data-testid="focal-anchor-mantra-instruction"
        aria-live="polite"
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
          transition: reduceMotion ? "none" : "opacity 220ms ease-out",
        }}
      >
        {primaryPrompt}
      </p>

      <div
        style={{
          position: "relative",
          width: 320,
          height: 220,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <canvas
          ref={particleCanvasRef}
          data-testid="focal-anchor-mantra-particles"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: reduceMotion ? 0 : 0.18,
            transition: "opacity 200ms ease-out",
          }}
        />

        {/* Concentric rings (fixation mode) — gentle expand cue */}
        {mode === "fixation" && [0, 1, 2].map((i) => (
          <div
            key={`ring-${ringTick}-${i}`}
            aria-hidden="true"
            style={{
              position: "absolute",
              width: 60 + i * 30,
              height: 60 + i * 30,
              borderRadius: "50%",
              border: `1px solid ${phaseColor}`,
              opacity: 0,
              animation: reduceMotion
                ? "none"
                : `focalRingExpand 4500ms cubic-bezier(0.22,1,0.36,1) ${i * 350}ms 1`,
            }}
          />
        ))}

        {/* Breath ring (mantra mode) — pulsa sync */}
        {mode === "mantra" && (
          <div
            aria-hidden="true"
            data-testid="focal-anchor-mantra-breath-ring"
            style={{
              position: "absolute",
              width: 110,
              height: 110,
              borderRadius: "50%",
              border: `1px solid ${phaseColor}`,
              opacity: breathPhase === "inhale" ? 0.55 : 0.30,
              transform: breathPhase === "inhale"
                ? "scale(1.18)"
                : breathPhase === "hold"
                  ? "scale(1.18)"
                  : "scale(1)",
              transition: reduceMotion ? "none" : "transform 600ms cubic-bezier(0.22,1,0.36,1), opacity 600ms ease-out",
            }}
          />
        )}

        {/* Focal point — radial gradient + peak glow */}
        <div
          ref={focalRef}
          data-testid="focal-anchor-mantra-focal"
          aria-hidden="true"
          style={{
            position: "absolute",
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${phaseColor} 0%, ${phaseColor} 45%, rgba(103,232,249,0) 100%)`,
            boxShadow: `0 0 26px rgba(103,232,249,0.85), 0 0 52px rgba(103,232,249,0.45)`,
            willChange: "transform",
            transform: "scale(1)",
            opacity: 1,
          }}
        />

        {/* Word overlay (mantra mode only) */}
        {mode === "mantra" && (
          <span
            data-testid="focal-anchor-mantra-word"
            aria-live="polite"
            style={{
              position: "absolute",
              top: "calc(50% + 60px)",
              fontFamily: typography.family,
              fontSize: 22,
              fontWeight: typography.weight.medium,
              letterSpacing: "0.06em",
              color: phaseColor,
              opacity: wordOpacity,
              transition: reduceMotion ? "none" : "opacity 120ms ease-out",
              textShadow: `0 0 12px rgba(103,232,249,${(wordOpacity * 0.6).toFixed(2)})`,
              pointerEvents: "none",
            }}
          >
            {mantra}
          </span>
        )}
      </div>

      {/* Body anchor */}
      <span
        data-testid="focal-anchor-mantra-body-anchor"
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
        {bodyAnchor}
      </span>

      {/* Bottom row: progress bar / mantra counter / countdown */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: spacing.s8,
          width: 220,
        }}
      >
        {mode === "fixation" && (
          <>
            <div
              data-testid="focal-anchor-mantra-progress"
              aria-hidden="true"
              style={{
                width: "100%",
                height: 2,
                background: "rgba(255,255,255,0.08)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progressPct.toFixed(1)}%`,
                  background: phaseColor,
                  opacity: 0.85,
                  transition: reduceMotion ? "none" : "width 120ms linear",
                }}
              />
            </div>
            <span
              data-testid="focal-anchor-mantra-countdown"
              style={{
                fontFamily: typography.familyMono,
                fontSize: 11,
                letterSpacing: "0.12em",
                color: colors.text.muted,
                opacity: 0.55,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {remainingS}s
            </span>
          </>
        )}

        {mode === "mantra" && (
          <span
            data-testid="focal-anchor-mantra-counter"
            aria-label={`${mantrasCompleted} de ${totalMantras} repeticiones`}
            style={{
              fontFamily: typography.familyMono,
              fontSize: 11,
              letterSpacing: "0.12em",
              color: colors.text.muted,
              opacity: 0.55,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {mantrasCompleted} / {totalMantras}
          </span>
        )}
      </div>

      <style jsx>{`
        @keyframes focalRingExpand {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          25% {
            opacity: 0.35;
          }
          100% {
            opacity: 0;
            transform: scale(1.6);
          }
        }
      `}</style>
    </div>
  );
}
