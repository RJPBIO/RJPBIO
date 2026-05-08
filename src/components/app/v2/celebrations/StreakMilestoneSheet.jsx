"use client";
/* ═══════════════════════════════════════════════════════════════
   Phase 6I-2 — StreakMilestoneSheet
   ───────────────────────────────────────────────────────────────
   Sheet bottom-up que celebra streak milestone cross detectado por
   completeSession (7/14/30 días consecutivos por default — config
   en NEURAL_CONFIG.coaching.streakMilestones). Closes finding H-2
   del repo audit: el config existía sin consumer — los logros
   "streak7"/"streak30" se persisten en state.achievements pero
   NUNCA tenían UI feedback al user.

   Pattern reuse 1:1 de CohortCelebrationSheet (Fix3) + Program-
   CompletionSheet (Phase6I-1): mismo 5-stage choreography, mismo
   z-index 1000/1001, mismo a11y triada (useReducedMotion + use-
   FocusTrap + announce). Componente nuevo en lugar de generalizar
   — Decision A1: copy específico per milestone + lifecycle
   independiente del cohort/program.

   Stage 1: backdrop fade-in (180ms)
   Stage 2: sheet slide-up cubic-bezier spring (320ms)
   Stage 3: cyan radial pulse expand+settle (1200ms)
   Stage 4: count-up 0→milestone (650ms cubic ease-out)
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

// Auto-dismiss timing alineado con CohortCelebrationSheet (Fix3) +
// ProgramCompletionSheet (Phase6I-1) Decision E.
const AUTO_DISMISS_MS = 8000;

// Choreography timings — mismo pattern Fix3 + Phase6I-1.
const STAGE_PULSE_DELAY = 80;
const STAGE_COUNT_DELAY = 200;
const STAGE_CTAS_DELAY = 350;
const COUNT_UP_DURATION = 650;

const EASE_OUT_CUBIC = (t) => 1 - Math.pow(1 - t, 3);

// Copy específico per milestone (Decision D del prompt). Cubre los 3
// milestones default del config NEURAL_CONFIG.coaching.streakMilestones
// = [7, 14, 30]. Si futura iteración agrega milestones (60, 90, 180),
// fallback genérico abajo cubre — el user ve mensaje válido siempre.
//
// Eyebrow tier theme: CONSISTENCIA (7) → DISCIPLINA (14) → MAESTRÍA (30).
// Escala progresiva refleja la dificultad incremental del achievement
// (7d = primer hábito, 14d = umbral neuroplasticidad, 30d = identidad
// formada). Copy alineado con literatura habit-formation (Lally 2010).
const STREAK_MILESTONE_COPY = {
  7: {
    eyebrow: "7 DÍAS · CONSISTENCIA",
    title: "Has mantenido 7 días consecutivos.",
    subtitle:
      "Tu sistema neural empieza a reconocer la rutina. La consistencia es el primer hábito formado.",
    statLabel: "DÍAS · STREAK COMPLETO",
    ctaPrimary: "Continuar la racha",
    ctaSecondary: "Continuar",
    srMessage:
      "Streak milestone 7 días alcanzado. Tu sistema neural reconoce la rutina.",
  },
  14: {
    eyebrow: "14 DÍAS · DISCIPLINA",
    title: "Has mantenido 2 semanas consecutivas.",
    subtitle:
      "Has cruzado el umbral de hábito en formación. Tu sistema neural responde con menos esfuerzo cada día.",
    statLabel: "DÍAS · DOS SEMANAS",
    ctaPrimary: "Continuar la racha",
    ctaSecondary: "Continuar",
    srMessage:
      "Streak milestone 14 días alcanzado. Has cruzado el umbral de hábito en formación.",
  },
  30: {
    eyebrow: "30 DÍAS · MAESTRÍA",
    title: "Has mantenido 30 días consecutivos.",
    subtitle:
      "Un mes completo de inversión en tu sistema. Pocos llegan aquí. Tu trayectoria personalizada es ahora tu firma.",
    statLabel: "DÍAS · UN MES COMPLETO",
    ctaPrimary: "Ver mi trayectoria",
    ctaSecondary: "Continuar",
    srMessage:
      "Streak milestone 30 días alcanzado. Un mes completo de inversión sostenida.",
  },
};

// Fallback genérico para milestones futuros (60, 90, 180, etc) que se
// agreguen al config sin copy específico. Future-proof: el helper
// detectStreakMilestone respeta config dinámico, así que cualquier
// milestone nuevo automáticamente activa esta copy fallback.
function buildGenericCopy(milestone) {
  const safe = Number.isFinite(milestone) ? milestone : 0;
  return {
    eyebrow: `${safe} DÍAS · MILESTONE`,
    title: `Has mantenido ${safe} días consecutivos.`,
    subtitle: "Tu disciplina sostenida está formando hábito neural.",
    statLabel: `DÍAS · STREAK ${safe}`,
    ctaPrimary: "Continuar la racha",
    ctaSecondary: "Continuar",
    srMessage: `Streak milestone ${safe} días alcanzado.`,
  };
}

function getMilestoneCopy(milestone) {
  if (typeof milestone !== "number" || !Number.isFinite(milestone)) return null;
  return STREAK_MILESTONE_COPY[milestone] || buildGenericCopy(milestone);
}

export default function StreakMilestoneSheet({
  celebration,
  onPrimaryAction,
  onDismiss,
}) {
  const reduceMotion = useReducedMotion();

  // useFocusTrap activates when celebration truthy. Mismo pattern Fix3 +
  // Phase6I-1: bloquea Tab fuera + restore focus on dismiss + ESC handler.
  const trapRef = useFocusTrap(!!celebration, () => onDismiss?.());

  const [mounted, setMounted] = useState(false);
  const [ctasVisible, setCtasVisible] = useState(false);
  const [countDisplay, setCountDisplay] = useState(0);

  const copy = celebration ? getMilestoneCopy(celebration.milestone) : null;
  const milestone = celebration?.milestone || 0;

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
      setCountDisplay(milestone);
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
    if (!celebration || reduceMotion || milestone <= 0) return;
    let raf = 0;
    let startTs = null;
    const startTimer = setTimeout(() => {
      const tick = (ts) => {
        if (startTs === null) startTs = ts;
        const elapsed = ts - startTs;
        const t = Math.min(1, elapsed / COUNT_UP_DURATION);
        const eased = EASE_OUT_CUBIC(t);
        setCountDisplay(Math.round(milestone * eased));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, STAGE_COUNT_DELAY);
    return () => {
      clearTimeout(startTimer);
      cancelAnimationFrame(raf);
    };
  }, [celebration, milestone, reduceMotion]);

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
    onPrimaryAction?.(milestone);
    onDismiss?.();
  };

  const backdropOpacity = mounted ? 1 : 0;
  const sheetTranslate = mounted ? "translateY(0)" : "translateY(100%)";
  const pulseStyle = reduceMotion
    ? { transform: "scale(1)", opacity: 0.7 }
    : { animation: `v2-streak-milestone-pulse 1200ms ${motionTok.ease.out} ${STAGE_PULSE_DELAY}ms forwards` };

  return (
    <>
      {/* Backdrop */}
      <div
        data-v2-streak-milestone-backdrop
        data-testid="streak-milestone-backdrop"
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
          data-v2-streak-milestone-sheet
          data-milestone={milestone}
          data-testid="streak-milestone-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="v2-streak-milestone-title"
          aria-describedby="v2-streak-milestone-subtitle"
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
            data-v2-streak-milestone-pulse
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
            id="v2-streak-milestone-title"
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
            id="v2-streak-milestone-subtitle"
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
            data-v2-streak-milestone-stat
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
              data-v2-streak-milestone-count
              data-testid="streak-milestone-count"
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
              data-testid="streak-milestone-primary"
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
              data-testid="streak-milestone-dismiss"
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

      {/* Pulse keyframe — distinct keyframe-name del Fix3 (v2-cohort-pulse)
          y Phase6I-1 (v2-program-completion-pulse). Mismo shape (cubic
          ease-out scale 0.55→1.15→1.0 + opacity fade). */}
      <style jsx global>{`
        @keyframes v2-streak-milestone-pulse {
          0%   { transform: scale(0.55); opacity: 0; }
          55%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1.0);  opacity: 0.78; }
        }
      `}</style>
    </>
  );
}
