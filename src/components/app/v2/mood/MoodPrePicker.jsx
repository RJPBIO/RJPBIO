"use client";
/* ═══════════════════════════════════════════════════════════════
   Phase 6J-1 Group C — MoodPrePicker
   ───────────────────────────────────────────────────────────────
   Chip-row inline en HomeV2 que captura mood pre-sesión (1-5).
   Closes Engine Audit CRITICAL-4 (`currentMood` engine input
   sin UI).

   Tap → onChange(value); re-tap mismo mood → onChange(null) toggle
   off. Value se propaga al hook useAdaptiveRecommendation que
   activa el branch `moodIsExplicit` en adaptiveProtocolEngine
   (neural.js:644-690): override del primaryNeed según mood declarado
   (mood=1 → calma, mood=5 → energia, etc).

   ADN visual:
     - Chips circulares 44×44 (touchTarget.min Apple HIG)
     - Iconos brand-DNA via lucide-react (mismos que MoodPostSessionSheet:
       stress/drain/neutral/sharp/peak). NO emojis literales.
     - phosphorCyan accent en mood seleccionado
     - Eyebrow mono caps centrado tipo Hero pattern
   ═══════════════════════════════════════════════════════════════ */
import { Frown, Meh, Minus, Eye, Smile } from "lucide-react";
import {
  colors,
  typography,
  spacing,
  motion as motionTok,
  touchTarget,
} from "../tokens";

const MOOD_OPTIONS = [
  { value: 1, Icon: Frown, label: "Tensión alta",  ariaLabel: "Mood 1, tensión alta" },
  { value: 2, Icon: Meh,   label: "Agotamiento",   ariaLabel: "Mood 2, agotamiento" },
  { value: 3, Icon: Minus, label: "Estable",       ariaLabel: "Mood 3, estable" },
  { value: 4, Icon: Eye,   label: "Enfocado",      ariaLabel: "Mood 4, enfocado" },
  { value: 5, Icon: Smile, label: "Óptimo",        ariaLabel: "Mood 5, óptimo" },
];

/**
 * @param {object} props
 * @param {number|null} props.value     Mood actual (1-5) o null si nada seleccionado
 * @param {(v:number|null)=>void} props.onChange  Tap handler (re-tap mismo → null toggle)
 * @param {string} [props.testid]       Test id base (default "mood-pre-picker")
 */
export default function MoodPrePicker({
  value = null,
  onChange,
  testid = "mood-pre-picker",
}) {
  const handleTap = (v) => {
    onChange?.(v === value ? null : v);
  };

  return (
    <section
      data-v2-mood-pre-picker
      data-testid={testid}
      aria-label="Mood pre-sesión"
      style={{
        paddingInline: spacing.s24,
        paddingBlock: spacing.s12,
      }}
    >
      <div
        style={{
          fontFamily: typography.familyMono,
          fontSize: typography.size.microCaps,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: colors.text.muted,
          fontWeight: typography.weight.medium,
          marginBlockEnd: spacing.s12,
          textAlign: "center",
        }}
      >
        ¿Cómo te sientes ahora?
      </div>

      <div
        role="radiogroup"
        aria-label="Estado de ánimo"
        style={{
          display: "flex",
          justifyContent: "center",
          gap: spacing.s8,
        }}
      >
        {MOOD_OPTIONS.map(({ value: v, Icon, ariaLabel, label }) => {
          const isActive = value === v;
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={ariaLabel}
              title={label}
              data-testid={`${testid}-${v}`}
              data-active={isActive ? "true" : "false"}
              onClick={() => handleTap(v)}
              style={{
                background: isActive
                  ? "rgba(34,211,238,0.12)"
                  : "transparent",
                border: isActive
                  ? `1px solid ${colors.accent.phosphorCyan}`
                  : `0.5px solid ${colors.separator}`,
                borderRadius: 999,
                width: touchTarget.min,
                height: touchTarget.min,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: `all 180ms ${motionTok.ease.out}`,
                fontFamily: typography.family,
              }}
            >
              <Icon
                size={20}
                strokeWidth={1.6}
                color={isActive ? colors.accent.phosphorCyan : colors.text.secondary}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
