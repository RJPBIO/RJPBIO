"use client";
import { colors, typography, spacing, radii } from "../tokens";

// NO se envia al LLM. NO se contabiliza en quota.
// Renderiza recursos crisis del coachSafety para el locale.

export default function CrisisCard({ resources = [] }) {
  return (
    <article
      data-v2-coach-crisis
      style={{
        marginInline: spacing.s24,
        marginBlock: spacing.s16,
        background: "transparent",
        border: `0.5px solid ${colors.separator}`,
        borderRadius: radii.panelLg,
        padding: spacing.s24 - 4,
        display: "flex",
        flexDirection: "column",
        gap: spacing.s16,
      }}
    >
      <div
        style={{
          fontFamily: typography.familyMono,
          fontSize: typography.size.microCaps,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.72)",
          fontWeight: typography.weight.medium,
        }}
      >
        ESTOY AQUÍ
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.regular,
          color: "rgba(255,255,255,0.96)",
          lineHeight: 1.6,
        }}
      >
        Lo que dijiste me importa. Si estás pensando en hacerte daño, hablar con un humano ahora puede ayudar.
      </p>
      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {resources.map((r, i) => (
          <li
            key={`${r.label}-${i}`}
            style={{
              paddingBlock: 12,
              borderBlockEnd: i === resources.length - 1 ? "none" : `0.5px solid ${colors.separator}`,
              fontFamily: typography.familyMono,
              fontSize: typography.size.microCaps,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: typography.weight.medium,
              color: colors.accent.phosphorCyan,
            }}
          >
            {r.label} · {r.contact}
          </li>
        ))}
      </ul>
    </article>
  );
}
