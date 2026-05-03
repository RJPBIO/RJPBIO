"use client";
import { typography, spacing } from "../tokens";

export default function CoachIntro({ hasWeeklySummary }) {
  const subtitle = hasWeeklySummary
    ? "Tu resumen semanal está listo."
    : "Aquí cuando me necesites.";
  return (
    <section
      data-v2-coach-intro
      style={{
        paddingInline: spacing.s24,
        paddingBlockStart: spacing.s32,
        paddingBlockEnd: spacing.s32,
      }}
    >
      <h1
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: 32,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.04em",
          color: "rgba(255,255,255,0.96)",
          lineHeight: 1.05,
        }}
      >
        Coach.
      </h1>
      <p
        style={{
          marginBlockStart: 8,
          marginBlockEnd: 0,
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.regular,
          color: "rgba(255,255,255,0.55)",
          lineHeight: 1.4,
        }}
      >
        {subtitle}
      </p>
    </section>
  );
}
