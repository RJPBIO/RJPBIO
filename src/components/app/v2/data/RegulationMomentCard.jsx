"use client";
/* ═══════════════════════════════════════════════════════════════
   RegulationMomentCard — el momento de regulación de ahora.
   ───────────────────────────────────────────────────────────────
   Aparece SOLO cuando se detecta un momento (pre-sueño, transición a casa,
   despertar, ventana creativa) según hora + estado autonómico. Surfacea
   uno solo + lanza su protocolo enmarcado. El outcome se marca en el
   diario, no es el HRV. Modelo: lib/neural/regulationMoments.
   ═══════════════════════════════════════════════════════════════ */
import { useMemo } from "react";
import { detectRegulationMoment } from "@/lib/neural/regulationMoments";
import { colors, typography, spacing } from "../tokens";

const ACCENT = colors.accent.phosphorCyan;

export default function RegulationMomentCard({ hrvLog, onNavigate, now }) {
  const m = useMemo(
    () => detectRegulationMoment({ hrvLog: hrvLog || [], now: now ?? Date.now() }),
    [hrvLog, now]
  );

  if (!m || !m.detected) return null;

  return (
    <section
      data-v2-regulation-moment
      data-moment={m.id}
      style={{
        marginInline: spacing.s24,
        marginBlockStart: spacing.s24,
        padding: spacing.s24,
        borderRadius: 18,
        background: "rgba(34,211,238,0.05)",
        border: `0.5px solid ${colors.separator}`,
        borderInlineStart: `2px solid ${ACCENT}`,
      }}
    >
      <div
        style={{
          fontFamily: typography.familyMono,
          fontSize: typography.size.microCaps,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: ACCENT,
          fontWeight: typography.weight.medium,
          marginBlockEnd: spacing.s12,
        }}
      >
        {m.eyebrow}
      </div>

      <p
        style={{
          margin: 0,
          marginBlockEnd: spacing.s24,
          fontFamily: typography.family,
          fontSize: typography.size.subtitle,
          fontWeight: typography.weight.regular,
          color: colors.text.primary,
          letterSpacing: "-0.01em",
          lineHeight: 1.35,
          maxInlineSize: 480,
        }}
      >
        {m.message}
      </p>

      <button
        type="button"
        onClick={() =>
          onNavigate &&
          onNavigate({ action: "start-protocol", protocolId: m.protocolId, situation: m.situation })
        }
        style={{
          appearance: "none",
          cursor: "pointer",
          padding: "13px 28px",
          background: ACCENT,
          color: "#08080A",
          border: "none",
          borderRadius: 999,
          fontFamily: typography.family,
          fontSize: 14,
          fontWeight: typography.weight.medium,
          letterSpacing: "0.02em",
          minBlockSize: 48,
        }}
      >
        {m.ctaLabel}
      </button>

      <p
        style={{
          margin: 0,
          marginBlockStart: spacing.s16,
          fontFamily: typography.family,
          fontSize: typography.size.caption,
          color: colors.text.muted,
          lineHeight: 1.5,
        }}
      >
        Después, marca cómo te fue en tu diario — eso es lo que de verdad importa.
      </p>
    </section>
  );
}
