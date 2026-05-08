"use client";
/* ═══════════════════════════════════════════════════════════════
   Phase 6I-1 — ProgramCompletionSheet
   ───────────────────────────────────────────────────────────────
   Sheet bottom-up que celebra completion de un programa adaptativo
   (Day 28 Burnout Recovery, Day 5 Focus Sprint, etc) detectada por
   finalizeProgram en el store. Closes finding H-1 del repo audit.

   Pattern reuse 1:1 de CohortCelebrationSheet (Fix3): mismo 5-stage
   choreography, mismo z-index 1000/1001, mismo a11y triada
   (useReducedMotion + useFocusTrap + announce). Componente nuevo
   en lugar de generalizar — Decision A1 del prompt: copy específico
   per programa + lifecycle independiente.

   Stage 1: backdrop fade-in (180ms)
   Stage 2: sheet slide-up cubic-bezier spring (320ms)
   Stage 3: cyan radial pulse expand+settle (1200ms)
   Stage 4: count-up 0→totalDays (650ms cubic ease-out)
   Stage 5: CTAs fade-in stagger (220ms)

   Auto-dismiss 8s · ESC · backdrop click · primary CTA dismiss.
   prefers-reduced-motion respect via useReducedMotion lib/a11y.js.
   Sin framer-motion — CSS plano + RAF (v2 shell pattern).
   ═══════════════════════════════════════════════════════════════ */
import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { announce, useFocusTrap, useReducedMotion } from "@/lib/a11y";
import {
  colors,
  typography,
  spacing,
  radii,
  motion as motionTok,
} from "../tokens";

// Auto-dismiss timing alineado con CohortCelebrationSheet (Fix3 Decision E).
const AUTO_DISMISS_MS = 8000;

// Choreography timings — mismo pattern Fix3.
const STAGE_PULSE_DELAY = 80;
const STAGE_COUNT_DELAY = 200;
const STAGE_CTAS_DELAY = 350;
const COUNT_UP_DURATION = 650;

const EASE_OUT_CUBIC = (t) => 1 - Math.pow(1 - t, 3);

// Copy específico per programa (Decision D del prompt). Cubre los 5 programs
// del catálogo lib/programs.js (neural-baseline 14d · recovery-week 7d ·
// focus-sprint 5d · burnout-recovery 28d · executive-presence 10d). Si llega
// un programId no en el catálogo (futuro programa o test edge), fallback al
// genérico abajo — el user ve un mensaje válido, no un crash.
const PROGRAM_COMPLETION_COPY = {
  "burnout-recovery": {
    eyebrow: "BURNOUT RECOVERY · COMPLETO",
    title: "Has completado tu programa de recuperación.",
    subtitle:
      "28 días de inversión en tu wellbeing. Tu sistema neural muestra adaptación medible.",
    statLabel: "DÍAS · BURNOUT RECOVERY",
    ctaPrimary: "Ver mi progreso",
    ctaSecondary: "Continuar",
    srMessage:
      "Programa Burnout Recovery completado. 28 días de inversión en tu wellbeing.",
  },
  "focus-sprint": {
    eyebrow: "FOCUS SPRINT · COMPLETO",
    title: "Has completado tu sprint de foco.",
    subtitle:
      "5 días de entrenamiento sostenido. Tu capacidad cognitiva refleja el trabajo.",
    statLabel: "DÍAS · FOCUS SPRINT",
    ctaPrimary: "Ver mi progreso",
    ctaSecondary: "Continuar",
    srMessage:
      "Programa Focus Sprint completado. 5 días de entrenamiento sostenido.",
  },
  "recovery-week": {
    eyebrow: "RECOVERY WEEK · COMPLETO",
    title: "Has completado tu semana de recuperación.",
    subtitle:
      "7 días de regulación parasimpática. Tu sistema autónomo recalibrado.",
    statLabel: "DÍAS · RECOVERY WEEK",
    ctaPrimary: "Ver mi progreso",
    ctaSecondary: "Continuar",
    srMessage:
      "Programa Recovery Week completado. 7 días de regulación parasimpática.",
  },
  "neural-baseline": {
    eyebrow: "NEURAL BASELINE · COMPLETO",
    title: "Has establecido tu baseline neural.",
    subtitle:
      "14 días de calibración profunda. Tu sistema tiene firma única ahora.",
    statLabel: "DÍAS · NEURAL BASELINE",
    ctaPrimary: "Ver mi progreso",
    ctaSecondary: "Continuar",
    srMessage:
      "Programa Neural Baseline completado. 14 días de calibración profunda.",
  },
  "executive-presence": {
    eyebrow: "EXECUTIVE PRESENCE · COMPLETO",
    title: "Has completado tu programa de liderazgo neural.",
    subtitle:
      "10 días de cultivar presencia bajo presión. Tu sistema responde con calma.",
    statLabel: "DÍAS · EXECUTIVE PRESENCE",
    ctaPrimary: "Ver mi progreso",
    ctaSecondary: "Continuar",
    srMessage:
      "Programa Executive Presence completado. 10 días de cultivar presencia bajo presión.",
  },
};

// Fallback genérico cuando programId no encontrado en catálogo (defensive
// para futuros programas o test edges). Usa programName + totalDays del
// celebration payload mismo.
function buildGenericCopy(celebration) {
  const name = celebration?.programName || celebration?.programId || "Programa";
  const days = celebration?.totalDays || 0;
  return {
    eyebrow: `${name.toUpperCase()} · COMPLETO`,
    title: `Has completado ${name}.`,
    subtitle: days > 0
      ? `${days} días de trabajo consistente. Tu sistema refleja la inversión.`
      : "Programa completado. Tu sistema refleja la inversión.",
    statLabel: `DÍAS · ${name.toUpperCase()}`,
    ctaPrimary: "Ver mi progreso",
    ctaSecondary: "Continuar",
    srMessage: days > 0
      ? `Programa ${name} completado. ${days} días.`
      : `Programa ${name} completado.`,
  };
}

function getCompletionCopy(celebration) {
  if (!celebration?.programId) return null;
  return PROGRAM_COMPLETION_COPY[celebration.programId] || buildGenericCopy(celebration);
}

export default function ProgramCompletionSheet({
  celebration,
  onPrimaryAction,
  onDismiss,
}) {
  const reduceMotion = useReducedMotion();

  // useFocusTrap activates when celebration truthy. Mismo pattern Fix3.
  const trapRef = useFocusTrap(!!celebration, () => onDismiss?.());

  const [mounted, setMounted] = useState(false);
  const [ctasVisible, setCtasVisible] = useState(false);
  const [countDisplay, setCountDisplay] = useState(0);

  const copy = celebration ? getCompletionCopy(celebration) : null;
  const totalDays = celebration?.totalDays || 0;

  // Stage 1+2 — mount transition.
  useEffect(() => {
    if (!celebration) {
      setMounted(false);
      setCtasVisible(false);
      setCountDisplay(0);
      return;
    }
    if (reduceMotion) {
      setMounted(true);
      setCtasVisible(true);
      setCountDisplay(totalDays);
      return;
    }
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebration, reduceMotion]);

  // Stage 5 — CTAs fade-in stagger.
  useEffect(() => {
    if (!celebration || reduceMotion) return;
    const timer = setTimeout(() => setCtasVisible(true), STAGE_CTAS_DELAY);
    return () => clearTimeout(timer);
  }, [celebration, reduceMotion]);

  // Stage 4 — count-up animation.
  useEffect(() => {
    if (!celebration || reduceMotion || totalDays <= 0) return;
    let raf = 0;
    let startTs = null;
    const startTimer = setTimeout(() => {
      const tick = (ts) => {
        if (startTs === null) startTs = ts;
        const elapsed = ts - startTs;
        const t = Math.min(1, elapsed / COUNT_UP_DURATION);
        const eased = EASE_OUT_CUBIC(t);
        setCountDisplay(Math.round(totalDays * eased));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, STAGE_COUNT_DELAY);
    return () => {
      clearTimeout(startTimer);
      cancelAnimationFrame(raf);
    };
  }, [celebration, totalDays, reduceMotion]);

  // sr-live announcement.
  useEffect(() => {
    if (celebration && copy?.srMessage) {
      announce(copy.srMessage, "polite");
    }
  }, [celebration, copy]);

  // Auto-dismiss timer.
  const onDismissRef = useRef(onDismiss);
  useEffect(() => { onDismissRef.current = onDismiss; }, [onDismiss]);
  useEffect(() => {
    if (!celebration) return;
    const t = setTimeout(() => onDismissRef.current?.(), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [celebration]);

  if (!celebration || !copy) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && onDismiss) onDismiss();
  };
  const handlePrimary = () => {
    onPrimaryAction?.(celebration.programId);
    onDismiss?.();
  };

  const backdropOpacity = mounted ? 1 : 0;
  const sheetTranslate = mounted ? "translateY(0)" : "translateY(100%)";
  const pulseStyle = reduceMotion
    ? { transform: "scale(1)", opacity: 0.7 }
    : { animation: `v2-program-completion-pulse 1200ms ${motionTok.ease.out} ${STAGE_PULSE_DELAY}ms forwards` };

  return (
    <>
      {/* Backdrop */}
      <div
        data-v2-program-completion-backdrop
        data-testid="program-completion-backdrop"
        onClick={handleBackdropClick}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 1000,
          opacity: backdropOpacity,
          transition: reduceMotion ? "none" : `opacity 180ms ${motionTok.ease.out}`,
          pointerEvents: "auto",
        }}
      >
        {/* Sheet container — slide up */}
        <aside
          ref={trapRef}
          data-v2-program-completion-sheet
          data-program-id={celebration.programId}
          data-testid="program-completion-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="v2-program-completion-title"
          aria-describedby="v2-program-completion-subtitle"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            background: colors.bg.raised,
            border: `0.5px solid ${colors.accent.phosphorCyan}`,
            borderBottom: "none",
            borderRadius: `${radii.panelLg}px ${radii.panelLg}px 0 0`,
            paddingInline: spacing.s24,
            paddingBlockStart: spacing.s32,
            paddingBlockEnd: `calc(${spacing.s32}px + env(safe-area-inset-bottom))`,
            zIndex: 1001,
            maxHeight: "85vh",
            overflowY: "auto",
            transform: sheetTranslate,
            transition: reduceMotion
              ? "none"
              : `transform 320ms cubic-bezier(0.32, 0.72, 0, 1)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
          }}
        >
          {/* Drag handle decorativo */}
          <span
            aria-hidden="true"
            style={{
              width: 36,
              height: 4,
              background: "rgba(255,255,255,0.2)",
              borderRadius: 999,
              marginBlockEnd: spacing.s24,
            }}
          />

          {/* Cyan radial pulse */}
          <div
            data-v2-program-completion-pulse
            aria-hidden="true"
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(34,211,238,0.55) 0%, rgba(34,211,238,0.18) 45%, transparent 72%)",
              marginBlockEnd: spacing.s16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...pulseStyle,
            }}
          >
            <Sparkles
              size={28}
              strokeWidth={1.6}
              color={colors.accent.phosphorCyan}
              aria-hidden="true"
            />
          </div>

          {/* Eyebrow */}
          <span
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
            {copy.eyebrow}
          </span>

          {/* Title */}
          <h2
            id="v2-program-completion-title"
            style={{
              margin: 0,
              marginBlockStart: spacing.s12,
              fontFamily: typography.family,
              fontSize: 26,
              fontWeight: typography.weight.light,
              letterSpacing: "-0.02em",
              color: colors.text.strong,
              lineHeight: 1.2,
              textAlign: "center",
              maxWidth: 320,
            }}
          >
            {copy.title}
          </h2>

          {/* Subtitle */}
          <p
            id="v2-program-completion-subtitle"
            style={{
              margin: 0,
              marginBlockStart: spacing.s12,
              fontFamily: typography.family,
              fontSize: typography.size.body,
              fontWeight: typography.weight.regular,
              color: colors.text.secondary,
              lineHeight: 1.45,
              textAlign: "center",
              maxWidth: 320,
            }}
          >
            {copy.subtitle}
          </p>

          {/* Stat panel con count-up */}
          <div
            data-v2-program-completion-stat
            style={{
              marginBlockStart: spacing.s24,
              paddingBlock: spacing.s16,
              paddingInline: spacing.s24,
              borderRadius: radii.panel,
              border: `0.5px solid rgba(34,211,238,0.32)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              minWidth: 200,
            }}
          >
            <span
              data-v2-program-completion-count
              data-testid="program-completion-count"
              style={{
                fontFamily: typography.family,
                fontSize: 56,
                fontWeight: typography.weight.light,
                letterSpacing: "-0.04em",
                color: colors.text.strong,
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {countDisplay}
            </span>
            <span
              style={{
                fontFamily: typography.familyMono,
                fontSize: typography.size.microCaps,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: colors.text.muted,
                fontWeight: typography.weight.medium,
              }}
            >
              {copy.statLabel}
            </span>
          </div>

          {/* CTAs — staged fade-in */}
          <div
            style={{
              width: "100%",
              maxWidth: 320,
              marginBlockStart: spacing.s32,
              display: "flex",
              flexDirection: "column",
              gap: spacing.s12,
              opacity: ctasVisible ? 1 : 0,
              transform: ctasVisible || reduceMotion ? "translateY(0)" : "translateY(8px)",
              transition: reduceMotion
                ? "none"
                : `opacity 220ms ${motionTok.ease.out}, transform 220ms ${motionTok.ease.out}`,
            }}
          >
            <button
              type="button"
              data-testid="program-completion-primary"
              onClick={handlePrimary}
              style={{
                appearance: "none",
                cursor: "pointer",
                background: colors.accent.phosphorCyan,
                border: "none",
                borderRadius: radii.pill,
                color: colors.bg.base,
                fontFamily: typography.familyMono,
                fontSize: typography.size.microCaps,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontWeight: typography.weight.medium,
                paddingBlock: 14,
                paddingInline: 20,
                minHeight: 48,
                transitionProperty: "transform, opacity",
                transitionDuration: `${motionTok.duration.tap}ms`,
                transitionTimingFunction: motionTok.ease.out,
              }}
              onPointerDown={(e) => {
                e.currentTarget.style.transform = `scale(${motionTok.tap.scale})`;
              }}
              onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              {copy.ctaPrimary}
            </button>
            <button
              type="button"
              data-testid="program-completion-dismiss"
              data-v2-skip-ghost
              onClick={() => onDismiss?.()}
              style={{
                appearance: "none",
                cursor: "pointer",
                background: "transparent",
                border: "none",
                color: colors.text.secondary,
                fontFamily: typography.familyMono,
                fontSize: typography.size.microCaps,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: typography.weight.medium,
                paddingBlock: 12,
                paddingInline: 20,
                minHeight: 44,
                transitionProperty: "color, transform",
                transitionDuration: `${motionTok.duration.tap}ms`,
                transitionTimingFunction: motionTok.ease.out,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = colors.text.strong; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = colors.text.secondary; }}
            >
              {copy.ctaSecondary}
            </button>
          </div>
        </aside>
      </div>

      {/* Pulse keyframe — scoped jsx isolation. Distinct keyframe-name del Fix3
          (v2-cohort-pulse) para evitar collision visual aunque shape sea idéntico. */}
      <style jsx global>{`
        @keyframes v2-program-completion-pulse {
          0%   { transform: scale(0.55); opacity: 0; }
          55%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1.0);  opacity: 0.78; }
        }
      `}</style>
    </>
  );
}
