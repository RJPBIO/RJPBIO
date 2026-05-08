"use client";
/* ═══════════════════════════════════════════════════════════════
   FatigueBanner — Phase 6J-2 HIGH-4
   ───────────────────────────────────────────────────────────────
   Surface engine context.fatigue + context.fatigueGuidance cuando
   level !== "none" (mild | severe). El engine ya pre-computa la copy
   via fatigueGuidance() — este componente solo lo renderea.

   Closes Engine Audit HIGH-4 (parte 1): fatigue Sprint 50 invisible
   en mobile. NeuralSettings web action items lo muestran como warn,
   pero PersonalizedView/LearningView/HomeV2 mobile no.

   Pattern reuse de WellbeingBanner (Phase 6F SP-F):
     - marginInline: spacing.s24
     - colors.semantic.* tone
     - eyebrow mono caps
     - title light + body muted
     - cta outlined cyan

   Decision: severe → cyan accent (urgent = brand signal); mild →
   neutral muted. NO emojis (memoria operativa).
   ═══════════════════════════════════════════════════════════════ */
import { colors, typography, spacing, radii, withAlpha } from "../tokens";

export default function FatigueBanner({
  fatigue,
  guidance,
  onCta,
  testid = "fatigue-banner",
}) {
  // Gate: solo render cuando level es mild o severe.
  // context.fatigue.level shape real: "none" | "mild" | "severe"
  if (!fatigue || fatigue.level === "none" || !fatigue.level) return null;
  // guidance es {title, body, cta, severity} pre-computed por engine.
  if (!guidance || !guidance.title) return null;

  const isSevere = fatigue.level === "severe";
  // Cyan para severe (urgent, brand signal); muted neutral para mild.
  const accent = isSevere ? colors.accent.phosphorCyan : colors.text.secondary;
  const accentSurface = isSevere
    ? withAlpha(colors.accent.phosphorCyan, 6)
    : "rgba(255,255,255,0.04)";
  const accentBorder = isSevere
    ? withAlpha(colors.accent.phosphorCyan, 30)
    : colors.separator;

  return (
    <article
      data-v2-fatigue-banner
      data-level={fatigue.level}
      data-testid={testid}
      role="status"
      aria-live="polite"
      style={{
        marginInline: spacing.s24,
        marginBlockStart: spacing.s16,
        marginBlockEnd: 0,
        padding: spacing.s16,
        background: accentSurface,
        border: `0.5px solid ${accentBorder}`,
        borderRadius: radii.panel,
        display: "flex",
        flexDirection: "column",
        gap: spacing.s8,
      }}
    >
      <div
        style={{
          fontFamily: typography.familyMono,
          fontSize: typography.size.microCaps,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: accent,
          fontWeight: typography.weight.medium,
        }}
      >
        Sistema indica · {isSevere ? "atención" : "patrón a observar"}
      </div>
      <h3
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.medium,
          color: colors.text.strong,
          letterSpacing: "-0.005em",
          lineHeight: 1.3,
        }}
      >
        {guidance.title}
      </h3>
      <p
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: typography.size.bodyMin,
          color: colors.text.secondary,
          lineHeight: 1.5,
        }}
      >
        {guidance.body}
      </p>
      {guidance.cta && (
        <div
          style={{
            display: "flex",
            gap: spacing.s8,
            flexWrap: "wrap",
            marginBlockStart: 4,
          }}
        >
          <button
            type="button"
            onClick={onCta}
            data-testid={`${testid}-cta`}
            style={{
              appearance: "none",
              background: "transparent",
              border: `0.5px solid ${colors.accent.phosphorCyan}`,
              borderRadius: 8,
              color: colors.accent.phosphorCyan,
              cursor: "pointer",
              paddingBlock: 10,
              paddingInline: 16,
              minBlockSize: 40,
              fontFamily: typography.family,
              fontSize: 11,
              fontWeight: typography.weight.medium,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {guidance.cta}
          </button>
        </div>
      )}
    </article>
  );
}
