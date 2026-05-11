"use client";
/* ═══════════════════════════════════════════════════════════════
   PresenceAnchorCommitmentPrimitive — Phase 7 SP-Q-5
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 5 "¿Estoy Aquí?" del protocolo
   #18 Emergency Reset (última Phase Crisis tier).

   Lección palmas conflict aplicada preventively (8ª vez consecutiva)
   ⚠️: catálogo decía "Mantén las palmas firmes contra tu cuerpo" —
   REMOVIDO. Body anchor mental + hold-press único anchor motor.

   Macro-phase A→B (5s + 30s):
     Phase A — Encuentra centro (0-5s):
       - Primary: "Encuentra tu centro"
       - Body anchor: "Estás aquí"
       - Concentric presence rings emanating subtle
       - Hold-press hidden
     Phase B — Mantén · Mantra word-by-word (5-35s):
       - Primary: "Mantén · Repite mentalmente"
       - Body anchor: mantra emerge per repetition
       - Hold-press 3s ring progress (shortest hold — crisis-friendly)
       - Mantra "Estoy aquí. En este momento." reveals word-by-word

   Differentiation vs other commitment primitives (7 previos):
     - #7-#12+#15: orb/badge/axis/beam/roots/checkmarks/waves
     - #18 (este): PRESENCE RINGS concéntricas emanating + central
       calming dot + word-by-word mantra (5 words)

   Multi-exercise tracks layered (8):
     1. Cinematic backdrop vignette (calming).
     2. Central presence dot + halo pulse breath rhythm.
     3. 3 concentric presence rings emanating outward continuously.
     4. Hold-press button con ring progress 3s (shortest crisis-friendly).
     5. Primary prompt cambia per macro-phase.
     6. Body anchor / mantra emerge word-by-word.
     7. Release message "Estás aquí · Ahora" peak.
     8. Phase label "¿Estoy Aquí?" cyan-warm.

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - Crisis-friendly: 3s hold corto + no pressure + mantra mental silencioso.
     - SIN body anchor manos extras (palmas conflict 8ª vez).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const PHASE_LABEL = "¿Estoy Aquí?";
const PHASE_A_PROMPT = "Encuentra tu centro";
const PHASE_B_PROMPT = "Mantén · Repite mentalmente";
const PHASE_A_BODY_ANCHOR = "Estás aquí · Presente";
const RELEASE_DEFAULT = "Estás aquí · Ahora";

const PHASE_A_END_MS = 5000;
const HOLD_SIZE = 110;
const HOLD_RADIUS = 50;

// Mantra emerges word-by-word during hold (5 segments).
const MANTRA_WORDS = ["Estoy", "aquí.", "En", "este", "momento."];

/**
 * @param {object} props
 * @param {string} [props.label="MANTÉN"]
 * @param {number} [props.min_hold_ms=3000]
 * @param {string} [props.release_message]
 * @param {boolean} [props.audioEnabled]
 * @param {boolean} [props.hapticEnabled]
 * @param {boolean} [props.voiceEnabled]
 * @param {(s:object)=>void} [props.onSignal]
 * @param {()=>void} [props.onComplete]
 * @param {()=>void} [props.onCancel]
 */
export default function PresenceAnchorCommitmentPrimitive({
  label = "MANTÉN",
  min_hold_ms = 3000,
  release_message = RELEASE_DEFAULT,
  audioEnabled = true, // eslint-disable-line no-unused-vars
  hapticEnabled = true,
  voiceEnabled = false, // eslint-disable-line no-unused-vars
  onSignal,
  onComplete,
  onCancel,
}) {
  const reduceMotion = useReducedMotion();
  const phaseColor = getCyanForPhase(2); // cyan-warm phase3/4 commitment closing
  const uid = useId();
  const haloId = `paBlur-${uid}`;
  const vignetteId = `paVignette-${uid}`;
  const auraId = `paAura-${uid}`;

  const onSignalRef = useRef(onSignal);
  const onCompleteRef = useRef(onComplete);
  const onCancelRef = useRef(onCancel);
  useEffect(() => { onSignalRef.current = onSignal; }, [onSignal]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onCancelRef.current = onCancel; }, [onCancel]);

  const [macroPhase, setMacroPhase] = useState("A");
  useEffect(() => {
    if (reduceMotion) {
      const t = setTimeout(() => setMacroPhase("B"), 800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setMacroPhase("B"), PHASE_A_END_MS);
    return () => clearTimeout(t);
  }, [reduceMotion]);

  const [pressing, setPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showRelease, setShowRelease] = useState(false);
  const [wordsRevealed, setWordsRevealed] = useState(0);
  const [centerPulse, setCenterPulse] = useState(0);
  const [ringTick, setRingTick] = useState(0);
  const [snapFlash, setSnapFlash] = useState(0);
  const [idleBreath, setIdleBreath] = useState(0);
  const startRef = useRef(0);
  const rafRef = useRef(null);
  const ambientRafRef = useRef(null);
  const lastWordRef = useRef(0);

  const stopAnim = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  useEffect(() => () => {
    stopAnim();
    if (ambientRafRef.current) cancelAnimationFrame(ambientRafRef.current);
  }, []);

  // Idle breathing pulse (pre-press) — invites interaction
  useEffect(() => {
    if (reduceMotion || pressing || completed) return undefined;
    let stopped = false;
    let raf;
    const startTime = performance.now();
    const breathTick = (now) => {
      if (stopped) return;
      const elapsed = now - startTime;
      setIdleBreath((Math.sin(elapsed / 700) + 1) * 0.5);
      raf = requestAnimationFrame(breathTick);
    };
    raf = requestAnimationFrame(breathTick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [reduceMotion, pressing, completed]);

  // Ambient ticker (slow breath rhythm ~6s + ring ticker ~10s continuous)
  useEffect(() => {
    if (reduceMotion) return undefined;
    let stopped = false;
    let raf;
    const start = performance.now();
    const tick = (now) => {
      if (stopped) return;
      const elapsed = now - start;
      const breathT = (elapsed / 6000) % 1;
      setCenterPulse((prev) => {
        const v = Math.sin(breathT * Math.PI * 2);
        return Math.abs(prev - v) > 0.05 ? v : prev;
      });
      const ringT = (elapsed / 10000) % 1;
      setRingTick((prev) => (Math.abs(prev - ringT) > 0.02 ? ringT : prev));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    ambientRafRef.current = raf;
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [reduceMotion]);

  const tick = () => {
    const elapsed = Date.now() - startRef.current;
    const pct = Math.min(1, elapsed / min_hold_ms);
    setProgress(pct);

    // Reveal mantra words progressively
    const targetWords = Math.min(MANTRA_WORDS.length, Math.floor(pct * MANTRA_WORDS.length) + (pct > 0 ? 1 : 0));
    if (targetWords !== lastWordRef.current && targetWords > 0) {
      lastWordRef.current = targetWords;
      setWordsRevealed(targetWords);
      if (hapticEnabled) {
        try { hap("tap"); } catch {}
      }
    }

    if (pct >= 1) {
      stopAnim();
      setCompleted(true);
      setPressing(false);
      setWordsRevealed(MANTRA_WORDS.length);
      setSnapFlash(1);
      if (hapticEnabled) {
        try { hapticSignature("award"); } catch {}
      }
      setShowRelease(true);
      const decayStart = performance.now();
      const decay = (n) => {
        const t = Math.min(1, (n - decayStart) / 320);
        setSnapFlash(1 - t);
        if (t < 1) requestAnimationFrame(decay);
      };
      requestAnimationFrame(decay);
      try {
        if (typeof onSignalRef.current === "function") {
          onSignalRef.current({ holdMs: min_hold_ms });
        }
      } catch {}
      setTimeout(() => {
        try {
          if (typeof onCompleteRef.current === "function") onCompleteRef.current();
        } catch {}
      }, 1500);
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  const startPress = () => {
    if (completed) return;
    if (macroPhase !== "B") return;
    setPressing(true);
    startRef.current = Date.now();
    lastWordRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);
  };

  const cancelPress = () => {
    if (completed || !pressing) return;
    const elapsed = Date.now() - startRef.current;
    stopAnim();
    setPressing(false);
    if (elapsed < min_hold_ms) {
      if (hapticEnabled) {
        try { hap("error"); } catch {}
      }
      setProgress(0);
      setWordsRevealed(0);
      lastWordRef.current = 0;
      try {
        if (typeof onCancelRef.current === "function") onCancelRef.current();
      } catch {}
    }
  };

  // Particles
  const particleCanvasRef = useRef(null);
  const particleSysRef = useRef(null);
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return undefined;
    canvas.width = 320;
    canvas.height = 320;
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

  const circumference = 2 * Math.PI * HOLD_RADIUS;
  const dashOffset = circumference * (1 - progress);

  const primaryPrompt = macroPhase === "A" ? PHASE_A_PROMPT : PHASE_B_PROMPT;
  const bodyAnchor = macroPhase === "A"
    ? PHASE_A_BODY_ANCHOR
    : (wordsRevealed > 0
        ? MANTRA_WORDS.slice(0, wordsRevealed).join(" ")
        : "Estoy aquí. En este momento.");

  const centerScale = 1.0 + centerPulse * 0.08;

  return (
    <div
      data-v2-presence-anchor-commitment
      data-macro-phase={macroPhase}
      data-completed={completed ? "true" : "false"}
      data-pressing={pressing ? "true" : "false"}
      data-words-revealed={wordsRevealed}
      data-testid="presence-anchor-commitment-primitive"
      role="region"
      aria-label="Presencia anchor, mantén y repite mentalmente estoy aquí en este momento"
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
        data-testid="presence-anchor-commitment-phase-label"
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

      <p
        data-testid="presence-anchor-commitment-primary-prompt"
        aria-live="polite"
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: 17,
          fontWeight: macroPhase === "B" ? typography.weight.medium : typography.weight.light,
          letterSpacing: "-0.02em",
          color: macroPhase === "B" ? phaseColor : colors.text.strong,
          lineHeight: 1.3,
          textAlign: "center",
          maxWidth: 320,
          paddingInline: spacing.s16,
          minHeight: 24,
          transition: reduceMotion ? "none" : "color 320ms ease-out, font-weight 320ms ease-out",
        }}
      >
        {primaryPrompt}
      </p>

      <div
        style={{
          position: "relative",
          width: 320,
          height: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <canvas
          ref={particleCanvasRef}
          data-testid="presence-anchor-commitment-particles"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: reduceMotion ? 0 : 0.14,
            transition: "opacity 200ms ease-out",
          }}
        />

        <svg
          aria-hidden="true"
          width="320"
          height="320"
          viewBox="0 0 320 320"
          style={{ position: "absolute" }}
        >
          <defs>
            <filter id={haloId} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="12" />
            </filter>
            <radialGradient id={vignetteId} cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.08" />
              <stop offset="60%" stopColor={phaseColor} stopOpacity="0.02" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.85" />
              <stop offset="50%" stopColor={phaseColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="160" cy="160" rx="140" ry="140" fill={`url(#${vignetteId})`} />

          {/* 3 concentric PRESENCE rings emanating outward continuously */}
          {[0, 1, 2].map((i) => {
            const offset = i / 3;
            const t = (ringTick + offset) % 1;
            const r = 50 + t * 90;
            const opacity = (1 - t) * 0.30 * (completed ? 1.15 : 1);
            return (
              <circle
                key={`ring-${i}`}
                cx="160" cy="160" r={r}
                fill="none"
                stroke={phaseColor}
                strokeWidth="0.8"
                opacity={opacity}
              />
            );
          })}

          {/* Outer presence aura */}
          <circle
            cx="160" cy="160" r="46"
            fill={`url(#${auraId})`}
            opacity={(completed ? 0.95 : (macroPhase === "B" ? 0.55 + progress * 0.35 : 0.45)) + snapFlash * 0.40}
            filter={reduceMotion ? undefined : `url(#${haloId})`}
            style={{
              transform: `scale(${(centerScale + snapFlash * 0.20).toFixed(3)})`,
              transformOrigin: "160px 160px",
              transition: reduceMotion ? "none" : "transform 200ms linear, opacity 600ms ease-out",
            }}
          />
          {snapFlash > 0.05 && (
            <circle
              cx="160" cy="160" r="50"
              fill="none"
              stroke={phaseColor}
              strokeWidth={(2.0 + snapFlash * 2.8).toFixed(2)}
              opacity={snapFlash.toFixed(3)}
              style={{ pointerEvents: "none" }}
            />
          )}

          {/* Central presence dot */}
          <circle
            cx="160" cy="160" r="8"
            fill={phaseColor}
            opacity="0.95"
            style={{
              transform: `scale(${centerScale.toFixed(3)})`,
              transformOrigin: "160px 160px",
              transition: reduceMotion ? "none" : "transform 200ms linear",
            }}
          />

          {/* Crosshair "here" indicator subtle */}
          <line
            x1="160" y1="142" x2="160" y2="148"
            stroke={phaseColor} strokeWidth="1" strokeLinecap="round"
            opacity={completed ? 0.85 : 0.55}
          />
          <line
            x1="160" y1="172" x2="160" y2="178"
            stroke={phaseColor} strokeWidth="1" strokeLinecap="round"
            opacity={completed ? 0.85 : 0.55}
          />
          <line
            x1="142" y1="160" x2="148" y2="160"
            stroke={phaseColor} strokeWidth="1" strokeLinecap="round"
            opacity={completed ? 0.85 : 0.55}
          />
          <line
            x1="172" y1="160" x2="178" y2="160"
            stroke={phaseColor} strokeWidth="1" strokeLinecap="round"
            opacity={completed ? 0.85 : 0.55}
          />

          {/* Confirmation rings on completed peak */}
          {completed && !reduceMotion && [0, 1].map((i) => (
            <circle
              key={`confirm-${i}`}
              cx="160" cy="160"
              r="50"
              fill="none"
              stroke={phaseColor}
              strokeWidth="0.8"
              opacity="0"
              style={{
                animation: `paConfirmRing 1800ms ease-out ${i * 350}ms 1 forwards`,
              }}
            />
          ))}
        </svg>

        {/* Hold-press button (Phase B only) */}
        {macroPhase === "B" && (
          <button
            type="button"
            data-testid="presence-anchor-commitment-hold-button"
            aria-label={label}
            onPointerDown={startPress}
            onPointerUp={cancelPress}
            onPointerLeave={cancelPress}
            onPointerCancel={cancelPress}
            style={{
              appearance: "none",
              position: "absolute",
              bottom: -16,
              inlineSize: HOLD_SIZE,
              blockSize: HOLD_SIZE,
              borderRadius: "50%",
              background: pressing
                ? "rgba(6,182,212,0.22)"
                : completed
                  ? "rgba(6,182,212,0.16)"
                  : "rgba(255,255,255,0.04)",
              border: `0.5px solid ${pressing || completed ? phaseColor : colors.separator}`,
              color: pressing || completed ? phaseColor : colors.text.secondary,
              fontFamily: typography.family,
              fontWeight: typography.weight.medium,
              fontSize: 11,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              cursor: completed ? "default" : "pointer",
              touchAction: "none",
              transform: pressing || completed || reduceMotion ? "scale(1)" : `scale(${(1 + idleBreath * 0.025).toFixed(3)})`,
              transition: "background 120ms linear, border-color 120ms linear, transform 220ms ease-out",
              zIndex: 2,
              padding: 0,
            }}
          >
            <svg
              aria-hidden="true"
              width={HOLD_SIZE}
              height={HOLD_SIZE}
              viewBox={`0 0 ${HOLD_SIZE} ${HOLD_SIZE}`}
              style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}
            >
              <circle
                cx={HOLD_SIZE / 2}
                cy={HOLD_SIZE / 2}
                r={HOLD_RADIUS}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="2"
              />
              <circle
                cx={HOLD_SIZE / 2}
                cy={HOLD_SIZE / 2}
                r={HOLD_RADIUS}
                fill="none"
                stroke={phaseColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: "stroke-dashoffset 80ms linear" }}
              />
            </svg>
            <span
              style={{
                position: "relative",
                zIndex: 1,
                paddingInline: 4,
                lineHeight: 1.2,
              }}
            >
              {showRelease ? release_message : label}
            </span>
          </button>
        )}

        <style jsx>{`
          @keyframes paConfirmRing {
            0% { opacity: 0; r: 50; }
            30% { opacity: 0.70; }
            100% { opacity: 0; r: 130; }
          }
        `}</style>
      </div>

      {/* Body anchor / Mantra emerge word-by-word */}
      <span
        data-testid="presence-anchor-commitment-body-anchor"
        aria-live="polite"
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: macroPhase === "B" && wordsRevealed > 0 ? typography.weight.medium : typography.weight.light,
          letterSpacing: "-0.01em",
          color: macroPhase === "B" && wordsRevealed > 0 ? phaseColor : colors.text.secondary,
          opacity: macroPhase === "A"
            ? 0.78
            : (wordsRevealed === 0 ? 0.40 : 0.95),
          textAlign: "center",
          minHeight: 22,
          transition: reduceMotion ? "none" : "opacity 220ms ease-out, color 220ms ease-out",
        }}
      >
        {bodyAnchor}
      </span>
    </div>
  );
}
