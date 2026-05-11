"use client";
/* ═══════════════════════════════════════════════════════════════
   LockInCommitmentPrimitive — Phase 7 SP-I-3
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 3 "Lock-in" del protocolo #8
   Lightning Focus. Reemplaza shared hold_press_button con primitive
   específico de single-task lock-in para los próximos 60 minutos.

   Lección palmas conflict aplicada preventively ⚠️:
   El catálogo decía "Mantén las palmas presionadas mientras visualizas"
   — MISMO conflict #4/#5/#7. Aplicado fix: cue "palmas" REMOVIDO del
   UI (usuario sostiene celular con una mano + otra mano libre). Body
   anchor primary mental ("Una tarea · Una hora").

   Macro-phase A→B (8s + 22s):
     Phase A — Visualiza (0-8s):
       - Primary: "¿Cuál es tu única tarea de la próxima hora?"
       - Body anchor: "Visualiza esa única tarea"
       - 60-min badge static + 12 segmented arcs vacíos.
       - Hold-press hidden.
     Phase B — Bloquea (8-30s):
       - Primary: "Bloquéala · Mantén"
       - Body anchor: "Una tarea · Una hora"
       - Hold-press 6s ring progress.
       - Segmented arcs llenan progressive sync con progress.
       - On complete: "BLOQUEADO · 60 MIN" + todos los arcs verdes.

   Identity #8 = "Lightning Focus" — laser-focused single-task hour.
   Phase 3 cierra el ciclo bloqueando cognitive commitment via motor +
   visual del próximos 60 minutos.

   Multi-exercise tracks layered (7):
     1. CENTRAL badge "60 MIN" stylized.
     2. 12 SEGMENTED arcs (5min each) sync progress during hold.
     3. PRIMARY prompt cambia per macro-phase.
     4. BODY anchor evolutivo per macro-phase.
     5. HOLD-PRESS button con ring progress 6s.
     6. RELEASE message "Bloqueado · 60 min" peak.
     7. PHASE label "Lock-in" cyan-warm.

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - SIN body anchor manos extras (lección persistente palmas).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const PHASE_LABEL = "Lock-in";
const PHASE_A_PROMPT = "¿Cuál es tu única tarea de la próxima hora?";
const PHASE_B_PROMPT = "Bloquéala · Mantén";
const PHASE_A_BODY_ANCHOR = "Visualiza esa única tarea";
const PHASE_B_BODY_ANCHOR = "Una tarea · Una hora";
const RELEASE_DEFAULT = "Bloqueado · 60 min";

const PHASE_A_END_MS = 8000;
const TOTAL_SEGMENTS = 12; // 12 × 5 min = 60 min
const HOLD_SIZE = 130;
const HOLD_RADIUS = 60;
const BADGE_OUTER = 200;
const BADGE_INNER = 76;

/**
 * @param {object} props
 * @param {string} [props.label="BLOQUEAR"]
 * @param {number} [props.min_hold_ms=6000]
 * @param {string} [props.release_message]
 * @param {boolean} [props.audioEnabled]
 * @param {boolean} [props.hapticEnabled]
 * @param {boolean} [props.voiceEnabled]
 * @param {(s:object)=>void} [props.onSignal]
 * @param {()=>void} [props.onComplete]
 * @param {()=>void} [props.onCancel]
 */
export default function LockInCommitmentPrimitive({
  label = "BLOQUEAR",
  min_hold_ms = 6000,
  release_message = RELEASE_DEFAULT,
  audioEnabled = true, // eslint-disable-line no-unused-vars
  hapticEnabled = true,
  voiceEnabled = false, // eslint-disable-line no-unused-vars
  onSignal,
  onComplete,
  onCancel,
}) {
  const reduceMotion = useReducedMotion();
  const phaseColor = getCyanForPhase(2); // cyan-warm #06B6D4 phase3

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
  const startRef = useRef(0);
  const rafRef = useRef(null);
  const tickRef = useRef(null);
  const lastSegmentRef = useRef(-1);

  const stopAnim = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    rafRef.current = null;
    tickRef.current = null;
  };

  useEffect(() => () => stopAnim(), []);

  const tick = () => {
    const elapsed = Date.now() - startRef.current;
    const pct = Math.min(1, elapsed / min_hold_ms);
    setProgress(pct);

    // Haptic per segment locked
    const currentSegment = Math.floor(pct * TOTAL_SEGMENTS);
    if (currentSegment !== lastSegmentRef.current && currentSegment > 0 && hapticEnabled) {
      lastSegmentRef.current = currentSegment;
      try { hap("tap"); } catch {}
    }

    if (pct >= 1) {
      stopAnim();
      setCompleted(true);
      setPressing(false);
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
      }, 1600);
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  const startPress = () => {
    if (completed) return;
    if (macroPhase !== "B") return;
    setPressing(true);
    startRef.current = Date.now();
    lastSegmentRef.current = 0;
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
      lastSegmentRef.current = -1;
      try {
        if (typeof onCancelRef.current === "function") onCancelRef.current();
      } catch {}
    }
  };

  // Particles ambient cyan-warm
  const particleCanvasRef = useRef(null);
  const particleSysRef = useRef(null);
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return undefined;
    canvas.width = 320;
    canvas.height = 300;
    try {
      particleSysRef.current = createParticleSystem({ canvas, reducedMotion: reduceMotion });
      if (particleSysRef.current) {
        particleSysRef.current.setPhase("hold", 0.3);
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
  const bodyAnchor = macroPhase === "A" ? PHASE_A_BODY_ANCHOR : PHASE_B_BODY_ANCHOR;
  const segmentsLocked = Math.floor(progress * TOTAL_SEGMENTS);

  // SVG segmented arc geometry (12 wedges × 30°)
  const segmentAngle = 360 / TOTAL_SEGMENTS;
  const gapDeg = 3; // visual separation between segments

  const polarToCartesian = (cx, cy, r, angleDeg) => {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
  };

  const buildArcPath = (cx, cy, rOuter, rInner, startAngle, endAngle) => {
    const a0 = polarToCartesian(cx, cy, rOuter, startAngle);
    const a1 = polarToCartesian(cx, cy, rOuter, endAngle);
    const b1 = polarToCartesian(cx, cy, rInner, endAngle);
    const b0 = polarToCartesian(cx, cy, rInner, startAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return [
      `M ${a0.x.toFixed(2)} ${a0.y.toFixed(2)}`,
      `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${a1.x.toFixed(2)} ${a1.y.toFixed(2)}`,
      `L ${b1.x.toFixed(2)} ${b1.y.toFixed(2)}`,
      `A ${rInner} ${rInner} 0 ${largeArc} 0 ${b0.x.toFixed(2)} ${b0.y.toFixed(2)}`,
      "Z",
    ].join(" ");
  };

  const segments = [];
  const cx = BADGE_OUTER / 2;
  const cy = BADGE_OUTER / 2;
  const rOuter = BADGE_OUTER / 2 - 6;
  const rInner = BADGE_INNER / 2 + 4;
  for (let i = 0; i < TOTAL_SEGMENTS; i++) {
    const startAngle = i * segmentAngle + gapDeg / 2;
    const endAngle = (i + 1) * segmentAngle - gapDeg / 2;
    segments.push({
      idx: i,
      d: buildArcPath(cx, cy, rOuter, rInner, startAngle, endAngle),
      locked: i < segmentsLocked,
    });
  }

  return (
    <div
      data-v2-lock-in-commitment
      data-macro-phase={macroPhase}
      data-completed={completed ? "true" : "false"}
      data-pressing={pressing ? "true" : "false"}
      data-segments-locked={segmentsLocked}
      data-testid="lock-in-commitment-primitive"
      role="region"
      aria-label="Lock-in, bloquea una sola tarea para la próxima hora"
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
        data-testid="lock-in-commitment-phase-label"
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
        data-testid="lock-in-commitment-primary-prompt"
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
          height: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <canvas
          ref={particleCanvasRef}
          data-testid="lock-in-commitment-particles"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: reduceMotion ? 0 : 0.22,
            transition: "opacity 200ms ease-out",
          }}
        />

        {/* SEGMENTED 60-min ring */}
        <svg
          data-testid="lock-in-commitment-ring"
          aria-hidden="true"
          width={BADGE_OUTER}
          height={BADGE_OUTER}
          viewBox={`0 0 ${BADGE_OUTER} ${BADGE_OUTER}`}
          style={{ position: "absolute" }}
        >
          {segments.map((s) => (
            <path
              key={`seg-${s.idx}`}
              d={s.d}
              fill={s.locked ? phaseColor : "rgba(255,255,255,0.04)"}
              stroke={s.locked ? phaseColor : "rgba(255,255,255,0.12)"}
              strokeWidth="0.5"
              opacity={s.locked ? (completed ? 0.95 : 0.75) : (macroPhase === "A" ? 0.30 : 0.55)}
              style={{
                transition: reduceMotion ? "none" : "opacity 220ms ease-out, fill 220ms ease-out",
              }}
            />
          ))}
          {/* 12 tick numbers (subtle) */}
          {Array.from({ length: 4 }, (_, i) => {
            // 0, 15, 30, 45 min markers
            const angle = i * 90 - 90;
            const r = (BADGE_OUTER / 2 - 6) - 12;
            const rad = (angle * Math.PI) / 180;
            const x = cx + r * Math.cos(rad);
            const y = cy + r * Math.sin(rad);
            const labelText = ["0", "15", "30", "45"][i];
            return (
              <text
                key={`tick-${i}`}
                x={x}
                y={y + 3}
                fontSize="8"
                fontFamily={typography.familyMono}
                fill={colors.text.muted}
                opacity="0.45"
                textAnchor="middle"
              >
                {labelText}
              </text>
            );
          })}
        </svg>

        {/* CENTRAL "60 MIN" badge */}
        <div
          data-testid="lock-in-commitment-badge"
          aria-hidden="true"
          style={{
            position: "absolute",
            width: BADGE_INNER,
            height: BADGE_INNER,
            borderRadius: "50%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.45)",
            border: `0.5px solid ${phaseColor}`,
            opacity: completed ? 1 : 0.85,
            transition: reduceMotion ? "none" : "opacity 220ms ease-out",
          }}
        >
          <span
            style={{
              fontFamily: typography.familyMono,
              fontSize: 22,
              fontWeight: typography.weight.medium,
              color: phaseColor,
              letterSpacing: "0.04em",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
            }}
          >
            60
          </span>
          <span
            style={{
              fontFamily: typography.family,
              fontSize: 9,
              fontWeight: typography.weight.medium,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: colors.text.muted,
              opacity: 0.7,
              marginTop: 1,
            }}
          >
            MIN
          </span>
        </div>

        {/* HOLD-PRESS button (Phase B only) */}
        {macroPhase === "B" && (
          <button
            type="button"
            data-testid="lock-in-commitment-hold-button"
            aria-label={label}
            onPointerDown={startPress}
            onPointerUp={cancelPress}
            onPointerLeave={cancelPress}
            onPointerCancel={cancelPress}
            style={{
              appearance: "none",
              position: "absolute",
              bottom: -10,
              inlineSize: HOLD_SIZE,
              blockSize: HOLD_SIZE,
              borderRadius: "50%",
              background: pressing
                ? "rgba(6,182,212,0.24)"
                : completed
                  ? "rgba(6,182,212,0.18)"
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
      </div>

      <span
        data-testid="lock-in-commitment-body-anchor"
        aria-live="polite"
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.01em",
          color: colors.text.secondary,
          opacity: 0.78,
          textAlign: "center",
          transition: reduceMotion ? "none" : "opacity 220ms ease-out",
        }}
      >
        {bodyAnchor}
      </span>
    </div>
  );
}
