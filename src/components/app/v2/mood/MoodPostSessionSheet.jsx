"use client";
/* ═══════════════════════════════════════════════════════════════
   Phase 6J-1 Group A — MoodPostSessionSheet
   ───────────────────────────────────────────────────────────────
   Sheet bottom-up que captura mood post-sesión. Closes Engine Audit
   CRITICAL-1 (state.moodLog empty) + CRITICAL-2 (bandit reward null).

   Pattern reuse 1:1 de StreakMilestoneSheet (Phase 6I-2):
     - z-index 1000/1001
     - useFocusTrap(active, onEscape) para a11y dialog
     - useReducedMotion respect
     - announce sr-live polite
     - bottom-up slide + backdrop fade

   ADN visual:
     - Iconos brand-DNA via lucide-react (stress/drain/neutral/sharp/peak)
       de MOODS constant en lib/constants.js. NO emojis (memoria
       feedback_no_emojis_no_generic_glyphs). Mismo registry que el
       legacy PostSessionFlow.jsx.
     - phosphorCyan accent en mood seleccionado (border + bg suave)
     - typography.familyMono caps eyebrow + caption
   ═══════════════════════════════════════════════════════════════ */
import { useEffect, useRef, useState } from "react";
import { Frown, Meh, Minus, Eye, Smile } from "lucide-react";
import { announce, useFocusTrap, useReducedMotion } from "@/lib/a11y";
import {
  colors,
  typography,
  spacing,
  radii,
  motion as motionTok,
  touchTarget,
} from "../tokens";

// Mood scale 1–5 con icons brand-DNA. Matchea MOODS constant en
// lib/constants.js (stress/drain/neutral/sharp/peak) — los mismos
// que el legacy PostSessionFlow.jsx usa via Icon.jsx wrapper.
//
// Decisión consciente: NO emojis literales (😞😕😐🙂😊). La memoria
// feedback_no_emojis_no_generic_glyphs es absoluta para toda la PWA.
// Lucide icons tienen brand DNA strokes 1.6 + cyan tint cuando active.
const MOOD_OPTIONS = [
  { value: 1, Icon: Frown, label: "Tensión alta",  ariaLabel: "Mood 1, tensión alta" },
  { value: 2, Icon: Meh,   label: "Agotamiento",   ariaLabel: "Mood 2, agotamiento" },
  { value: 3, Icon: Minus, label: "Estable",       ariaLabel: "Mood 3, estable" },
  { value: 4, Icon: Eye,   label: "Enfocado",      ariaLabel: "Mood 4, enfocado" },
  { value: 5, Icon: Smile, label: "Óptimo",        ariaLabel: "Mood 5, óptimo" },
];

/**
 * @param {object} props
 * @param {boolean} props.isOpen        Mount/unmount gate
 * @param {(mood:number)=>void} props.onSubmit   Tap REGISTRAR con selectedMood
 * @param {()=>void} props.onSkip       Tap "Saltar por ahora" o ESC o backdrop
 * @param {object} [props.proto]        Protocol object {n, int, ...} para context
 */
export default function MoodPostSessionSheet({
  isOpen,
  onSubmit,
  onSkip,
  proto = null,
}) {
  const reduceMotion = useReducedMotion();
  const trapRef = useFocusTrap(!!isOpen, () => onSkip?.());

  const [selectedMood, setSelectedMood] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Reset state on unmount/remount.
  useEffect(() => {
    if (!isOpen) {
      setSelectedMood(null);
      setMounted(false);
      return;
    }
    if (reduceMotion) {
      setMounted(true);
      return;
    }
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, [isOpen, reduceMotion]);

  // sr-live announcement on open.
  useEffect(() => {
    if (isOpen) {
      announce("¿Cómo te sientes ahora? Tu respuesta entrena tu motor neural.", "polite");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && onSkip) onSkip();
  };

  const handleSubmit = () => {
    if (typeof selectedMood === "number" && selectedMood >= 1 && selectedMood <= 5) {
      onSubmit?.(selectedMood);
    }
  };

  const backdropOpacity = mounted ? 1 : 0;
  const sheetTranslate = mounted ? "translateY(0)" : "translateY(100%)";

  return (
    <>
      {/* Backdrop */}
      <div
        data-v2-mood-post-backdrop
        data-testid="mood-post-backdrop"
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
        <aside
          ref={trapRef}
          data-v2-mood-post-sheet
          data-testid="mood-post-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="v2-mood-post-title"
          aria-describedby="v2-mood-post-subtitle"
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
          }}
        >
          {/* Drag handle */}
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
            DESPUÉS DE LA SESIÓN
          </span>

          {/* Title */}
          <h2
            id="v2-mood-post-title"
            style={{
              margin: 0,
              marginBlockStart: spacing.s12,
              fontFamily: typography.family,
              fontSize: 24,
              fontWeight: typography.weight.light,
              letterSpacing: "-0.02em",
              color: colors.text.strong,
              lineHeight: 1.2,
              textAlign: "center",
              maxWidth: 320,
            }}
          >
            ¿Cómo te sientes ahora?
          </h2>

          {/* Subtitle */}
          <p
            id="v2-mood-post-subtitle"
            style={{
              margin: 0,
              marginBlockStart: spacing.s8,
              fontFamily: typography.family,
              fontSize: typography.size.body,
              fontWeight: typography.weight.regular,
              color: colors.text.secondary,
              lineHeight: 1.45,
              textAlign: "center",
              maxWidth: 320,
            }}
          >
            Tu respuesta entrena tu motor neural personalizado.
          </p>

          {/* Mood icon row */}
          <div
            data-v2-mood-icons
            data-testid="mood-post-icons"
            role="radiogroup"
            aria-labelledby="v2-mood-post-title"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: spacing.s8,
              marginBlockStart: spacing.s32,
              maxWidth: 320,
              width: "100%",
            }}
          >
            {MOOD_OPTIONS.map(({ value, Icon, label, ariaLabel }) => {
              const isActive = selectedMood === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  aria-label={ariaLabel}
                  data-testid={`mood-post-option-${value}`}
                  data-active={isActive ? "true" : "false"}
                  onClick={() => setSelectedMood(value)}
                  style={{
                    background: isActive
                      ? "rgba(34,211,238,0.12)"
                      : "transparent",
                    border: isActive
                      ? `1px solid ${colors.accent.phosphorCyan}`
                      : `0.5px solid ${colors.separator}`,
                    borderRadius: radii.pill,
                    paddingBlock: spacing.s12,
                    paddingInline: spacing.s4,
                    cursor: "pointer",
                    minHeight: touchTarget.preferred,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: spacing.s8,
                    transition: reduceMotion ? "none" : `all 180ms ${motionTok.ease.out}`,
                    fontFamily: typography.family,
                  }}
                >
                  <Icon
                    size={24}
                    strokeWidth={1.6}
                    color={isActive ? colors.accent.phosphorCyan : colors.text.secondary}
                    aria-hidden="true"
                  />
                  <span
                    style={{
                      fontFamily: typography.familyMono,
                      fontSize: 9,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: isActive ? colors.accent.phosphorCyan : colors.text.muted,
                      lineHeight: 1.2,
                      textAlign: "center",
                    }}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* CTAs */}
          <div
            style={{
              marginBlockStart: spacing.s32,
              width: "100%",
              maxWidth: 320,
              display: "flex",
              flexDirection: "column",
              gap: spacing.s8,
            }}
          >
            <button
              type="button"
              data-testid="mood-post-submit"
              disabled={selectedMood == null}
              onClick={handleSubmit}
              style={{
                background: selectedMood != null
                  ? colors.accent.phosphorCyan
                  : "rgba(255,255,255,0.08)",
                color: selectedMood != null
                  ? "#041019"
                  : colors.text.muted,
                border: "none",
                borderRadius: 999,
                paddingBlock: spacing.s14,
                paddingInline: spacing.s24,
                fontFamily: typography.familyMono,
                fontSize: 12,
                fontWeight: typography.weight.medium,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                cursor: selectedMood != null ? "pointer" : "not-allowed",
                minHeight: touchTarget.preferred,
                transition: reduceMotion ? "none" : `all 180ms ${motionTok.ease.out}`,
              }}
            >
              Registrar
            </button>
            <button
              type="button"
              data-testid="mood-post-skip"
              onClick={onSkip}
              style={{
                background: "transparent",
                border: "none",
                paddingBlock: spacing.s12,
                paddingInline: spacing.s16,
                color: colors.text.muted,
                fontFamily: typography.family,
                fontSize: typography.size.caption,
                fontWeight: typography.weight.regular,
                cursor: "pointer",
                minHeight: touchTarget.min,
              }}
            >
              Saltar por ahora
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
