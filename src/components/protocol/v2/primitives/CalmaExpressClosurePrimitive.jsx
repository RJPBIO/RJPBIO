"use client";
/* ═══════════════════════════════════════════════════════════════
   CalmaExpressClosurePrimitive — Phase 7 SP-N-2
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 3 "Cierre Express" del protocolo
   #15 Suspiro Fisiológico. Visual signature: body silhouette +
   2-word mantra "Calmo. Sigo." emerging secuencial durante hold +
   2 calm waves emanating outward + hold-press 5s + palmas conflict
   prevention (7ª vez consecutiva).

   Macro-phase A→B (5s + 23s):
     Phase A — Antes de seguir (0-5s):
       - Primary: "Listo. Antes de seguir..."
       - Body anchor: "Toma un instante"
       - Body silhouette + settling halo subtle + button hidden.
     Phase B — Mantén · Calmo. Sigo. (5-28s):
       - Primary: "Mantén · Repite mentalmente"
       - Body anchor: "Calmo. Sigo." (emerge word-by-word)
       - Hold-press 5s ring progress.
       - Mantra reveals: 50% → "Calmo." · 100% → "Calmo. Sigo."
       - On complete: 2 calm waves emanating outward + release.

   Differentiation vs other commitment primitives:
     - #15 (este): SHORTEST commitment (5s hold) + 2-word mantra +
       calm waves out (settling-focused, no dramatic ascent/anchor).
     - Otros primitives son más dramáticos (4-6s hold + visual rich).
     - #15 cierre express = LIGHT, GENTLE, RAPID closure.

   Multi-exercise tracks layered (8):
     1. BODY silhouette (canon).
     2. CENTRAL settling halo breath rhythm pulse subtle.
     3. 2-word MANTRA emerging "Calmo." → "Calmo. Sigo."
     4. HOLD-PRESS button con ring 5s.
     5. 2 CALM WAVES emanating outward on complete.
     6. PRIMARY prompt cambia per macro-phase.
     7. BODY anchor evolutivo.
     8. PHASE label "Cierre Express" cyan-warm.

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - Mantra mental silencioso 2 palabras.
     - SIN body anchor manos extras (palmas conflict 7ª vez).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const PHASE_LABEL = "Cierre Express";
const PHASE_A_PROMPT = "Listo. Antes de seguir...";
const PHASE_B_PROMPT = "Mantén · Repite mentalmente";
const PHASE_A_BODY_ANCHOR = "Toma un instante";

const RELEASE_DEFAULT = "Calmo. Sigo.";

const PHASE_A_END_MS = 5000;
const HOLD_SIZE = 110;
const HOLD_RADIUS = 50;

const MANTRA_WORDS = ["Calmo.", "Sigo."];

/**
 * @param {object} props
 * @param {string} [props.label="MANTÉN"]
 * @param {number} [props.min_hold_ms=5000]
 * @param {string} [props.release_message]
 * @param {boolean} [props.audioEnabled]
 * @param {boolean} [props.hapticEnabled]
 * @param {boolean} [props.voiceEnabled]
 * @param {(s:object)=>void} [props.onSignal]
 * @param {()=>void} [props.onComplete]
 * @param {()=>void} [props.onCancel]
 */
export default function CalmaExpressClosurePrimitive({
  label = "MANTÉN",
  min_hold_ms = 5000,
  release_message = RELEASE_DEFAULT,
  audioEnabled = true,  
  hapticEnabled = true,
  voiceEnabled = false,  
  onSignal,
  onComplete,
  onCancel,
}) {
  const reduceMotion = useReducedMotion();
  const phaseColor = getCyanForPhase(2); // cyan-warm phase3 #06B6D4
  const uid = useId();
  const haloId = `ccBlur-${uid}`;
  const vignetteId = `ccVignette-${uid}`;
  const auraId = `ccAura-${uid}`;

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
  const [orbPulse, setOrbPulse] = useState(0);
  const startRef = useRef(0);
  const rafRef = useRef(null);
  const orbRafRef = useRef(null);
  const lastWordRef = useRef(0);

  const stopAnim = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  useEffect(() => () => {
    stopAnim();
    if (orbRafRef.current) cancelAnimationFrame(orbRafRef.current);
  }, []);

  // Orb pulse ticker (calm breath rhythm)
  useEffect(() => {
    if (reduceMotion) return undefined;
    let stopped = false;
    let raf;
    const start = performance.now();
    const tick = (now) => {
      if (stopped) return;
      const t = ((now - start) / 5000) % 1;
      const pulse = Math.sin(t * Math.PI * 2);
      setOrbPulse((prev) => (Math.abs(prev - pulse) > 0.05 ? pulse : prev));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    orbRafRef.current = raf;
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [reduceMotion]);

  const tick = () => {
    const elapsed = Date.now() - startRef.current;
    const pct = Math.min(1, elapsed / min_hold_ms);
    setProgress(pct);

    // Reveal words: word 1 at 50%, word 2 at 100%
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
      if (hapticEnabled) {
        try { hapticSignature("award"); } catch {}
      }
      setShowRelease(true);
      try {
        if (typeof onSignalRef.current === "function") {
          onSignalRef.current({ holdMs: min_hold_ms });
        }
      } catch {}
      setTimeout(() => {
        try {
          if (typeof onCompleteRef.current === "function") onCompleteRef.current();
        } catch {}
      }, 1400);
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
    canvas.width = 280;
    canvas.height = 360;
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
        : "Calmo. Sigo.");

  const orbScale = 1.0 + orbPulse * 0.06;

  return (
    <div
      data-v2-calma-express-closure
      data-macro-phase={macroPhase}
      data-completed={completed ? "true" : "false"}
      data-pressing={pressing ? "true" : "false"}
      data-words-revealed={wordsRevealed}
      data-testid="calma-express-closure-primitive"
      role="region"
      aria-label="Cierre express, mantén y repite mentalmente calmo sigo"
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
        data-testid="calma-express-closure-phase-label"
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
        data-testid="calma-express-closure-primary-prompt"
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
          width: 280,
          height: 360,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <canvas
          ref={particleCanvasRef}
          data-testid="calma-express-closure-particles"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: reduceMotion ? 0 : 0.16,
            transition: "opacity 200ms ease-out",
          }}
        />

        <svg
          data-testid="calma-express-closure-silhouette"
          aria-hidden="true"
          width="240"
          height="340"
          viewBox="0 0 240 340"
          style={{ position: "absolute" }}
        >
          <defs>
            <filter id={haloId} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
            <radialGradient id={vignetteId} cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.06" />
              <stop offset="60%" stopColor={phaseColor} stopOpacity="0.02" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.55" />
              <stop offset="50%" stopColor={phaseColor} stopOpacity="0.18" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="120" cy="170" rx="110" ry="160" fill={`url(#${vignetteId})`} />

          {/* Body silhouette */}
          <path
            d="M 120 36
               C 109 36, 100 46, 100 60
               C 100 70, 104 79, 110 84
               L 110 90
               C 100 92, 86 96, 82 108
               C 78 122, 76 138, 76 158
               L 76 196
               C 76 210, 78 222, 84 234
               L 88 248
               C 88 260, 90 270, 90 280
               L 90 308
               C 90 314, 94 318, 100 318
               L 108 318
               C 110 314, 112 308, 112 300
               L 112 250
               L 128 250
               L 128 300
               C 128 308, 130 314, 132 318
               L 140 318
               C 146 318, 150 314, 150 308
               L 150 280
               C 150 270, 152 260, 152 248
               L 156 234
               C 162 222, 164 210, 164 196
               L 164 158
               C 164 138, 162 122, 158 108
               C 154 96, 140 92, 130 90
               L 130 84
               C 136 79, 140 70, 140 60
               C 140 46, 131 36, 120 36 Z"
            fill="none"
            stroke={phaseColor}
            strokeWidth="0.9"
            opacity={completed ? 0.85 : (macroPhase === "B" ? 0.55 + progress * 0.30 : 0.50)}
            style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
          />

          {/* Central settling halo (breath rhythm) */}
          <circle
            cx="120" cy="170" r="50"
            fill={`url(#${auraId})`}
            opacity={completed ? 0.85 : (macroPhase === "B" ? 0.45 + progress * 0.40 : 0.40)}
            filter={reduceMotion ? undefined : `url(#${haloId})`}
            style={{
              transform: `scale(${orbScale.toFixed(3)})`,
              transformOrigin: "120px 170px",
              transition: reduceMotion ? "none" : "transform 100ms linear, opacity 600ms ease-out",
            }}
          />
          {/* Inner core dot */}
          <circle
            cx="120" cy="170" r="8"
            fill={phaseColor}
            opacity="0.85"
            style={{
              transform: `scale(${orbScale.toFixed(3)})`,
              transformOrigin: "120px 170px",
              transition: reduceMotion ? "none" : "transform 100ms linear",
            }}
          />

          {/* Static landmarks */}
          <circle cx="120" cy="58" r="20" fill="none" stroke={phaseColor} strokeWidth="1.2" opacity="0.55" />
          {[{ x: 86, y: 100 }, { x: 154, y: 100 }].map((pt, i) => (
            <circle key={`sh-${i}`} cx={pt.x} cy={pt.y} r="5" fill={phaseColor} opacity="0.75" />
          ))}
          {[{ x1: 84, x2: 110 }, { x1: 130, x2: 156 }].map((seg, i) => (
            <line key={`ft-${i}`}
              x1={seg.x1} y1="320" x2={seg.x2} y2="320"
              stroke={phaseColor} strokeWidth="2" strokeLinecap="round"
              opacity="0.65"
            />
          ))}

          {/* CALM WAVES on completed — 2 outward */}
          {completed && [0, 1].map((i) => (
            <circle
              key={`calm-wave-${i}`}
              cx="120" cy="170"
              r={50}
              fill="none"
              stroke={phaseColor}
              strokeWidth="0.8"
              opacity="0"
              style={{
                animation: reduceMotion ? "none" : `ccCalmWave 1800ms ease-out ${i * 400}ms 1 forwards`,
              }}
            />
          ))}
        </svg>

        {/* Hold-press button (Phase B only) */}
        {macroPhase === "B" && (
          <button
            type="button"
            data-testid="calma-express-closure-hold-button"
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
              transition: "background 120ms linear, border-color 120ms linear",
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
          @keyframes ccCalmWave {
            0% { r: 50; opacity: 0.85; }
            100% { r: 120; opacity: 0; }
          }
        `}</style>
      </div>

      {/* Body anchor / Mantra */}
      <span
        data-testid="calma-express-closure-body-anchor"
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
