"use client";
/* ═══════════════════════════════════════════════════════════════
   EmptyProgramState — Phase 6G Fix2 P1-2

   Empty state reusable cuando user NO tiene programa activo.
   Reemplaza los blocks inline NoActiveBlock/Block que duplicaban
   ~40 líneas en today + timeline pages.

   ADN tokens v2 estricto. CTA primary cyan outline → /app/programs.
   ═══════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { colors, typography, spacing, radii } from "../tokens";

const COPY = {
  today: {
    eyebrow: "SIN PROGRAMA ACTIVO",
    title: "Empieza un programa",
    body:
      "Los programas estructuran tu trayectoria con sesiones diarias y re-evaluación intermedia. Elige uno cuando estés listo.",
    ctaLabel: "EXPLORAR PROGRAMAS",
  },
  timeline: {
    eyebrow: "SIN PROGRAMA ACTIVO",
    title: "Sin línea de tiempo",
    body: "Para ver tu progreso día a día, primero inicia un programa.",
    ctaLabel: "EXPLORAR PROGRAMAS",
  },
};

export default function EmptyProgramState({ context = "today" }) {
  const c = COPY[context] || COPY.today;
  return (
    <article
      data-v2-empty-program-state
      data-context={context}
      style={{
        background: colors.bg.raised,
        border: `0.5px solid ${colors.separator}`,
        borderRadius: radii.panelLg,
        padding: spacing.s24,
        display: "flex",
        flexDirection: "column",
        gap: spacing.s16,
      }}
    >
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
        {c.eyebrow}
      </span>
      <h2
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: 22,
          fontWeight: typography.weight.light,
          color: colors.text.strong,
          letterSpacing: "-0.01em",
          lineHeight: 1.2,
        }}
      >
        {c.title}
      </h2>
      <p
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: typography.size.body,
          color: colors.text.secondary,
          lineHeight: typography.lineHeight.body,
        }}
      >
        {c.body}
      </p>
      <Link
        href="/app/programs"
        data-testid="empty-program-cta"
        style={{
          appearance: "none",
          background: "transparent",
          border: `0.5px solid ${colors.accent.phosphorCyan}`,
          borderRadius: radii.pill,
          color: colors.accent.phosphorCyan,
          cursor: "pointer",
          paddingBlock: 14,
          paddingInline: 20,
          minBlockSize: 48,
          fontFamily: typography.family,
          fontSize: 12,
          fontWeight: typography.weight.medium,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          alignSelf: "flex-start",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {c.ctaLabel}
      </Link>
    </article>
  );
}
