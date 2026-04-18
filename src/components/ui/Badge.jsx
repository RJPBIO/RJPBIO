import { cssVar, radius, space, font } from "./tokens";

/**
 * Badge — pill tokenizado para roles, estados, etiquetas.
 * Variantes: neutral (default), accent, success, warn, danger, soft.
 */
export function Badge({ children, variant = "neutral", size = "md", style, className = "" }) {
  const variants = {
    neutral: { bg: cssVar.surface2,                                          border: cssVar.border,  color: cssVar.textDim },
    accent:  { bg: cssVar.accentSoft,                                        border: cssVar.accent,  color: cssVar.accent  },
    success: { bg: "color-mix(in srgb, var(--bi-accent) 14%, transparent)",  border: cssVar.accent,  color: cssVar.accent  },
    warn:    { bg: "color-mix(in srgb, var(--bi-warn) 14%, transparent)",    border: cssVar.warn,    color: cssVar.warn    },
    danger:  { bg: "color-mix(in srgb, var(--bi-danger) 14%, transparent)",  border: cssVar.danger,  color: cssVar.danger  },
    soft:    { bg: "transparent",                                            border: cssVar.border,  color: cssVar.textDim },
  };
  const sizes = {
    sm: { padding: `2px ${space[2]}px`, fontSize: font.size.xs, minHeight: 18 },
    md: { padding: `${space[0.5]}px ${space[2.5]}px`, fontSize: font.size.sm, minHeight: 22 },
  };
  const p = variants[variant] || variants.neutral;
  return (
    <span
      className={`bi-badge bi-badge-${variant} ${className}`}
      style={{
        display: "inline-flex", alignItems: "center", gap: space[1],
        background: p.bg,
        border: `1px solid ${p.border}`,
        color: p.color,
        borderRadius: radius.full,
        fontWeight: font.weight.semibold,
        letterSpacing: font.tracking.wide,
        textTransform: "uppercase",
        ...sizes[size],
        ...style,
      }}
    >
      {children}
    </span>
  );
}
