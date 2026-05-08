"use client";
/* ═══════════════════════════════════════════════════════════════
   RecalibrationBanner — Phase 6J-2 HIGH-4
   ───────────────────────────────────────────────────────────────
   Surface engine context.recalibration cuando truthy. El engine
   pre-computa el shape via recalibrationGuidance() en staleness.js:
     {severity: "soft"|"hard", title, body, cta, suggestedIntent}

   Closes Engine Audit HIGH-4 (parte 2): Sprint 42 staleness
   invisible en mobile. Solo NeuralSettings web lo surface.

   Pattern reuse de WellbeingBanner + FatigueBanner:
     - severity "hard" (≥30 días pausa) → cyan accent urgent
     - severity "soft" (≥14 días) → muted neutral
   ═══════════════════════════════════════════════════════════════ */
import { colors, typography, spacing, radii, withAlpha } from "../tokens";

export default function RecalibrationBanner({
  recalibration,
  onCta,
  testid = "recalibration-banner",
}) {
  // Gate: el engine pasa null cuando no hay recalibrate. Cuando hay,
  // el shape es {severity, title, body, cta, suggestedIntent, dataConfidence}.
  if (!recalibration || !recalibration.title) return null;

  const isHard = recalibration.severity === "hard";
  const accent = isHard ? colors.accent.phosphorCyan : colors.text.secondary;
  const accentSurface = isHard
    ? withAlpha(colors.accent.phosphorCyan, 6)
    : "rgba(255,255,255,0.04)";
  const accentBorder = isHard
    ? withAlpha(colors.accent.phosphorCyan, 30)
    : colors.separator;

  return (
    <article
      data-v2-recalibration-banner
      data-severity={recalibration.severity}
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
        Motor neural · {isHard ? "recalibración" : "verificación"}
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
        {recalibration.title}
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
        {recalibration.body}
      </p>
      {recalibration.cta && (
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
            {recalibration.cta}
          </button>
        </div>
      )}
    </article>
  );
}
