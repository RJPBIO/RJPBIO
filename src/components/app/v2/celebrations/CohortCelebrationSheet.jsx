"use client";
/* ═══════════════════════════════════════════════════════════════
   Phase 6H Premium-Fix3 — CohortCelebrationSheet
   ───────────────────────────────────────────────────────────────
   Sheet bottom-up que celebra cohort transition cross detectada
   por completeSession (cold-start→learning a N=5, learning→
   personalized a N=14). Choreography multi-stage (Decision D3):

   Stage 1: backdrop fade-in (180ms)
   Stage 2: sheet slide-up con cubic-bezier spring-feel (320ms)
   Stage 3: cyan radial pulse expand+settle (1200ms)
   Stage 4: count-up 0→targetN sesiones (650ms cubic ease-out)
   Stage 5: CTAs fade-in stagger (180ms+220ms)

   Auto-dismiss 8s · ESC dismiss · backdrop click dismiss · primary
   CTA dismiss + onPrimaryAction. useFocusTrap blocks tab fuera.
   announce() escribe sr-live message.

   prefers-reduced-motion respect (useReducedMotion lib/a11y.js):
   - Skip todas las animaciones
   - Mount instantáneo sin transforms ni opacity transitions
   - Count-up se setea directamente al target (no animate)

   Sin framer-motion (v2 shell pattern) — CSS animations + RAF.
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

// Auto-dismiss timer en ms. 8s da espacio para read+absorber sin sentirse
// como un takeover. Decision E del prompt.
const AUTO_DISMISS_MS = 8000;

// Choreography timings (Stage 2-5). Stage 1 (backdrop) y Stage 2 (sheet)
// usan transición CSS directa via styles inline. Stage 3 + 4 + 5 son
// staged via setTimeout en useEffect.
const STAGE_PULSE_DELAY = 80;     // ms tras mount
const STAGE_COUNT_DELAY = 200;    // ms tras mount
const STAGE_CTAS_DELAY = 350;     // ms tras mount

// Count-up duration (igual a HeroComposite Phase 6H Premium-Fix1).
const COUNT_UP_DURATION = 650;

const EASE_OUT_CUBIC = (t) => 1 - Math.pow(1 - t, 3);

const CELEBRATION_COPY = {
  learning: {
    eyebrow: "TRAYECTORIA EN APRENDIZAJE",
    title: "Tu trayectoria personalizada está aprendiendo.",
    subtitle:
      "Has completado tu calibración inicial. Tu sistema neural empieza a recolectar tu baseline.",
    statValue: 5,
    statLabel: "SESIONES · BASELINE",
    ctaPrimary: "Ver mi lectura",
    ctaSecondary: "Continuar",
    srMessage:
      "Trayectoria en aprendizaje desbloqueada. Has completado 5 sesiones de calibración inicial.",
  },
  personalized: {
    eyebrow: "TRAYECTORIA PERSONALIZADA",
    title: "Tu trayectoria personalizada se activó.",
    subtitle:
      "Tu sistema neural tiene data suficiente para recomendaciones precisas y ajustes adaptativos.",
    statValue: 14,
    statLabel: "SESIONES · PERSONALIZADO",
    ctaPrimary: "Ver mi sistema",
    ctaSecondary: "Continuar",
    srMessage:
      "Trayectoria personalizada activada. Has completado 14 sesiones. Tu sistema neural opera con personalización completa.",
  },
};

export default function CohortCelebrationSheet({
  celebration,
  onPrimaryAction,
  onDismiss,
}) {
  const reduceMotion = useReducedMotion();

  // useFocusTrap activates when celebration truthy. Si celebration null,
  // ref no se asigna → trap inactivo.
  const trapRef = useFocusTrap(!!celebration, () => onDismiss?.());

  // Mounted flag — se vuelve true 1 frame post-montaje. Permite que las
  // CSS transitions arranquen desde estado inicial (oculto) → final.
  const [mounted, setMounted] = useState(false);
  // CTAs visibility flag — staged in (Stage 5).
  const [ctasVisible, setCtasVisible] = useState(false);
  // Count-up display value (Stage 4).
  const [countDisplay, setCountDisplay] = useState(0);

  const cohort = celebration?.to;
  const copy = cohort ? CELEBRATION_COPY[cohort] : null;

  // Stage 1+2 — mount transition. Reduce-motion → instant true.
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
      setCountDisplay(copy?.statValue || 0);
      return;
    }
    // Force a paint with mounted=false initial, then flip to mounted=true
    // next frame so CSS transition triggers from initial state.
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
    // copy is derived from celebration; reduceMotion stable from hook
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebration, reduceMotion]);

  // Stage 5 — CTAs fade-in stagger.
  useEffect(() => {
    if (!celebration || reduceMotion) return;
    const timer = setTimeout(() => setCtasVisible(true), STAGE_CTAS_DELAY);
    return () => clearTimeout(timer);
  }, [celebration, reduceMotion]);

  // Stage 4 — count-up animation (reduce-motion → instant en mount effect).
  useEffect(() => {
    if (!celebration || !copy || reduceMotion) return;
    const target = copy.statValue;
    let raf = 0;
    let startTs = null;
    const startTimer = setTimeout(() => {
      const tick = (ts) => {
        if (startTs === null) startTs = ts;
        const elapsed = ts - startTs;
        const t = Math.min(1, elapsed / COUNT_UP_DURATION);
        const eased = EASE_OUT_CUBIC(t);
        setCountDisplay(Math.round(target * eased));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, STAGE_COUNT_DELAY);
    return () => {
      clearTimeout(startTimer);
      cancelAnimationFrame(raf);
    };
  }, [celebration, copy, reduceMotion]);

  // sr-live announcement when celebration mounts.
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
    onPrimaryAction?.(cohort);
    onDismiss?.();
  };

  // Backdrop opacity goes 0→1 via mounted flag.
  const backdropOpacity = mounted ? 1 : 0;
  // Sheet translateY — slides up from 100% to 0.
  const sheetTranslate = mounted ? "translateY(0)" : "translateY(100%)";
  // Pulse scale + opacity — Stage 3.
  const pulseStyle = reduceMotion
    ? { transform: "scale(1)", opacity: 0.7 }
    : { animation: `v2-cohort-pulse 1200ms ${motionTok.ease.out} ${STAGE_PULSE_DELAY}ms forwards` };

  return (
    <>
      {/* Backdrop */}
      <div
        data-v2-celebration-backdrop
        data-testid="cohort-celebration-backdrop"
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
          data-v2-cohort-celebration-sheet
          data-cohort={cohort}
          data-testid="cohort-celebration-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="v2-cohort-celebration-title"
          aria-describedby="v2-cohort-celebration-subtitle"
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
          {/* Drag handle (puramente decorativo — confirma sheet pattern) */}
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
            data-v2-celebration-pulse
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
            id="v2-cohort-celebration-title"
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
            id="v2-cohort-celebration-subtitle"
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
            data-v2-celebration-stat
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
              data-v2-celebration-count
              data-testid="cohort-celebration-count"
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
              data-testid="cohort-celebration-primary"
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
              data-testid="cohort-celebration-dismiss"
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

      {/* Pulse keyframe — scoped via :global jsx isolation. Si el componente
          se monta múltiples veces el keyframe-name colision es safe (mismo
          shape). */}
      <style jsx global>{`
        @keyframes v2-cohort-pulse {
          0%   { transform: scale(0.55); opacity: 0; }
          55%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1.0);  opacity: 0.78; }
        }
      `}</style>
    </>
  );
}
