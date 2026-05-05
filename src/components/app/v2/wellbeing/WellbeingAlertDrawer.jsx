"use client";
/* WellbeingAlertDrawer — Phase 6F SP-F
   Drawer/modal con detalle del wellbeing assessment + signals + crisis
   resources prominentes + disclaimer SAPTEL.

   Usa ModalShell (DEFAULT export — Task 0 catched que sub-prompt usaba
   named import erróneo). eyebrowTone solo acepta "cyan"|"danger"|"muted",
   NO "warn" (sub-prompt error catched). */

import ModalShell from "@/components/app/v2/profile/modals/ModalShell";
import WellbeingSignalsList from "./WellbeingSignalsList";
import { colors, typography, spacing, radii, withAlpha } from "../tokens";

export default function WellbeingAlertDrawer({ assessment, copy, onClose }) {
  if (!assessment || !copy) return null;

  const { level, signals, metrics, snapshot } = assessment;
  // ModalShell solo soporta "cyan"|"danger"|"muted". Map level a tone:
  //   alert  → "danger" (rojo)
  //   warn   → "cyan"   (no hay "warn" tone; cyan es el default brand)
  //   else   → "cyan"
  const eyebrowTone = level === "alert" ? "danger" : "cyan";

  return (
    <ModalShell
      title={copy.title}
      eyebrow={`WELLBEING · ${String(level || "").toUpperCase()}`}
      eyebrowTone={eyebrowTone}
      onClose={onClose}
      maxWidth={520}
      testId="wellbeing-drawer"
    >
      <article data-v2-wellbeing-drawer style={{
        display: "flex",
        flexDirection: "column",
        gap: spacing.s24,
      }}>
        {/* Subtitle context */}
        <p style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: typography.size.bodyMin,
          color: colors.text.secondary,
          lineHeight: 1.55,
        }}>
          {copy.subtitle}
        </p>

        {/* Signals breakdown */}
        <section data-v2-drawer-signals style={{
          display: "flex",
          flexDirection: "column",
          gap: spacing.s8,
        }}>
          <div style={eyebrowStyle}>
            Señales detectadas · {Array.isArray(signals) ? signals.length : 0}
          </div>
          <WellbeingSignalsList signals={signals} metrics={metrics} />
        </section>

        {/* Primary CTA */}
        {copy.cta && (
          <a
            href={copy.cta.target}
            data-testid="wellbeing-drawer-primary-cta"
            style={{
              appearance: "none",
              background: colors.accent.phosphorCyan,
              color: colors.bg.base,
              border: "none",
              borderRadius: radii.pill,
              padding: `${spacing.s8 + 4}px ${spacing.s16 + 4}px`,
              fontFamily: typography.family,
              fontSize: 12,
              fontWeight: typography.weight.medium,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              textDecoration: "none",
              alignSelf: "flex-start",
              minBlockSize: 44,
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            {copy.cta.label}
          </a>
        )}

        {/* Crisis resources (Decision C3 — prominentes) */}
        <CrisisResourcesBlock alertLevel={level} />

        {/* Disclaimer obligatorio (D8 — sin lawyer review) */}
        <footer
          data-v2-wellbeing-disclaimer
          style={{
            paddingBlockStart: spacing.s16,
            borderBlockStart: `0.5px solid ${colors.separator}`,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <p style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: typography.size.caption,
            color: colors.text.muted,
            lineHeight: 1.55,
          }}>
            {snapshot?.disclaimer}
          </p>
          {snapshot?.methodology && (
            <p style={{
              margin: 0,
              fontFamily: typography.familyMono,
              fontSize: 10,
              letterSpacing: "0.08em",
              color: colors.text.muted,
              opacity: 0.7,
            }}>
              Methodology: {snapshot.methodology} · Version {snapshot.version || "v1"}
            </p>
          )}
        </footer>
      </article>
    </ModalShell>
  );
}

function CrisisResourcesBlock({ alertLevel }) {
  // En alert level, la línea SAPTEL aparece DESTACADA (background cyan).
  const highlight = alertLevel === "alert";
  return (
    <section
      data-v2-wellbeing-crisis-block
      style={{
        background: highlight
          ? withAlpha(colors.accent.phosphorCyanRgb, 8)
          : colors.bg.raised,
        border: highlight
          ? `0.5px solid ${withAlpha(colors.accent.phosphorCyanRgb, 30)}`
          : `0.5px solid ${colors.separator}`,
        borderRadius: radii.panel,
        padding: spacing.s16,
        display: "flex",
        flexDirection: "column",
        gap: spacing.s8,
      }}
    >
      <div style={{
        ...eyebrowStyle,
        color: colors.accent.phosphorCyan,
      }}>
        Recursos de apoyo · 24/7
      </div>
      <p style={{
        margin: 0,
        fontFamily: typography.family,
        fontSize: typography.size.bodyMin,
        color: colors.text.strong,
        lineHeight: 1.5,
      }}>
        Si necesitas hablar con alguien, estas líneas profesionales son gratuitas y confidenciales:
      </p>
      <ul
        data-v2-crisis-resources
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: spacing.s8,
        }}
      >
        <li style={resourceRowStyle}>
          <span style={resourceNameStyle}>SAPTEL</span>
          <a
            href="tel:8002900024"
            data-testid="wellbeing-saptel-link"
            style={resourcePhoneStyle}
          >
            800 290 0024
          </a>
        </li>
        <li style={resourceRowStyle}>
          <span style={resourceNameStyle}>Línea de la Vida</span>
          <a
            href="tel:8009112000"
            data-testid="wellbeing-linea-vida-link"
            style={resourcePhoneStyle}
          >
            800 911 2000
          </a>
        </li>
        <li>
          <a
            href="/app/resources/crisis"
            data-testid="wellbeing-resources-link"
            style={{
              fontFamily: typography.family,
              fontSize: typography.size.caption,
              color: colors.accent.phosphorCyan,
              textDecoration: "none",
            }}
          >
            Ver más recursos →
          </a>
        </li>
      </ul>
    </section>
  );
}

const eyebrowStyle = {
  fontFamily: typography.familyMono,
  fontSize: typography.size.microCaps,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: colors.text.muted,
  fontWeight: typography.weight.medium,
};

const resourceRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: spacing.s8,
};

const resourceNameStyle = {
  fontFamily: typography.family,
  fontSize: typography.size.bodyMin,
  fontWeight: typography.weight.medium,
  color: colors.text.strong,
};

const resourcePhoneStyle = {
  fontFamily: typography.familyMono,
  fontSize: typography.size.body,
  fontWeight: typography.weight.medium,
  color: colors.accent.phosphorCyan,
  letterSpacing: "0.04em",
  textDecoration: "none",
};
