"use client";
/* ═══════════════════════════════════════════════════════════════
   SystemReadingSubCard — Phase 6J-2 HIGH-5
   ───────────────────────────────────────────────────────────────
   Surface engine context.momentum + context.burnoutRisk como sub-card
   debajo del HeroComposite. Closes Engine Audit HIGH-5: ambos signals
   se computan pero permanecen invisibles en mobile (excepto via reason
   contextual en _generateReason).

   Engine context shapes (verified):
     - context.momentum: NUMBER (score)
     - context.momentumDir: "ascendente" | "descendente" | "estable" | "neutral"
     - context.burnoutRisk: STRING "crítico" | "alto" | "moderado" | "bajo" | "sin datos"

   Decisión visual:
     - Iconos via lucide-react (TrendingUp/TrendingDown/Minus) — brand
       DNA, NO emojis literales (memoria operativa).
     - phosphorCyan único brand signal positivo
     - warning amber para burnout alto/crítico
     - sub-card no card primary — sub-position: sibling al HeroComposite
   ═══════════════════════════════════════════════════════════════ */
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { colors, typography, spacing, radii } from "../tokens";

const MOMENTUM_VISUAL = {
  ascendente: { Icon: TrendingUp, tone: "cyan", label: "Ascendente" },
  descendente: { Icon: TrendingDown, tone: "warn", label: "Descendente" },
  estable: { Icon: Minus, tone: "muted", label: "Estable" },
  neutral: { Icon: Minus, tone: "muted", label: "Neutral" },
};

const BURNOUT_VISUAL = {
  "crítico": { tone: "warn", label: "Crítico" },
  alto: { tone: "warn", label: "Alto" },
  moderado: { tone: "soft", label: "Moderado" },
  bajo: { tone: "muted", label: "Bajo" },
  "sin datos": { tone: "muted", label: "Sin datos" },
};

export default function SystemReadingSubCard({
  momentum = null,
  momentumDir = null,
  burnoutRisk = null,
  testid = "system-reading-subcard",
}) {
  // Gate: solo render cuando al menos uno tiene data significativa.
  // momentum number solo es informativo cuando momentumDir definido y NO neutral
  // (neutral = "Acumulando datos" según calcNeuralMomentum). Mostramos cuando
  // hay direction declared (incluso "estable").
  const showMomentum = typeof momentum === "number" && momentumDir
    && momentumDir !== "neutral";
  // burnoutRisk solo es útil cuando hay datos (skip "sin datos").
  const showBurnout = typeof burnoutRisk === "string"
    && burnoutRisk !== "sin datos"
    && BURNOUT_VISUAL[burnoutRisk];

  if (!showMomentum && !showBurnout) return null;

  const momentumViz = showMomentum
    ? MOMENTUM_VISUAL[momentumDir] || MOMENTUM_VISUAL.estable
    : null;
  const burnoutViz = showBurnout ? BURNOUT_VISUAL[burnoutRisk] : null;

  return (
    <section
      data-v2-system-reading
      data-testid={testid}
      aria-label="Lectura del sistema"
      style={{
        marginInline: spacing.s24,
        marginBlockStart: spacing.s16,
        marginBlockEnd: 0,
        padding: spacing.s16,
        background: colors.bg.raised,
        border: `0.5px solid ${colors.separator}`,
        borderRadius: radii.panel,
        display: "flex",
        flexDirection: "column",
        gap: spacing.s12,
      }}
    >
      <div
        style={{
          fontFamily: typography.familyMono,
          fontSize: typography.size.microCaps,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: colors.text.muted,
          fontWeight: typography.weight.medium,
        }}
      >
        Lectura del sistema
      </div>

      <div
        style={{
          display: "flex",
          gap: spacing.s12,
          flexWrap: "wrap",
        }}
      >
        {showMomentum && (
          <Chip
            label="Momentum"
            value={momentumViz.label}
            detail={`${momentum > 0 ? "+" : ""}${momentum}`}
            tone={momentumViz.tone}
            Icon={momentumViz.Icon}
            testid={`${testid}-momentum-chip`}
          />
        )}
        {showBurnout && (
          <Chip
            label="Burnout"
            value={burnoutViz.label}
            tone={burnoutViz.tone}
            testid={`${testid}-burnout-chip`}
          />
        )}
      </div>
    </section>
  );
}

// ─── Chip primitive interno ──────────────────────────────────────

function Chip({ label, value, detail, tone, Icon, testid }) {
  // Tone → color mapping. phosphorCyan único brand positivo;
  // semantic.warning para warn; secondary para soft; muted neutral.
  const valueColor =
    tone === "warn"
      ? colors.semantic.warning
      : tone === "cyan"
        ? colors.accent.phosphorCyan
        : tone === "soft"
          ? colors.text.primary
          : colors.text.secondary;
  const iconColor = valueColor;

  return (
    <div
      data-testid={testid}
      data-tone={tone}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        paddingInline: spacing.s12,
        paddingBlock: spacing.s10 || 10,
        background: "rgba(255,255,255,0.025)",
        border: `0.5px solid ${colors.separator}`,
        borderRadius: radii.pill,
        minWidth: 96,
      }}
    >
      <span
        style={{
          fontFamily: typography.familyMono,
          fontSize: 9,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: colors.text.muted,
          fontWeight: typography.weight.medium,
          lineHeight: 1.2,
        }}
      >
        {label}
      </span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {Icon && (
          <Icon
            size={14}
            strokeWidth={1.6}
            color={iconColor}
            aria-hidden="true"
          />
        )}
        <span
          style={{
            fontFamily: typography.family,
            fontSize: typography.size.bodyMin,
            fontWeight: typography.weight.medium,
            color: valueColor,
            lineHeight: 1.2,
          }}
        >
          {value}
        </span>
        {detail && (
          <span
            style={{
              fontFamily: typography.familyMono,
              fontSize: 11,
              color: colors.text.muted,
              fontVariantNumeric: "tabular-nums",
              marginInlineStart: 2,
            }}
          >
            {detail}
          </span>
        )}
      </div>
    </div>
  );
}
