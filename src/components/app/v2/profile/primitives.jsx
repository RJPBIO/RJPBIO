"use client";
import { colors, typography, spacing, radii } from "../tokens";

export function Section({ children, paddingBottom = spacing.s48 }) {
  return (
    <section
      style={{
        paddingInline: spacing.s24,
        paddingBlockStart: spacing.s32,
        paddingBlockEnd: paddingBottom,
        borderBlockEnd: `0.5px solid ${colors.separator}`,
      }}
    >
      {children}
    </section>
  );
}

export function Kicker({ children, tone = "muted" }) {
  const color = tone === "cyan"
    ? colors.accent.phosphorCyan
    : "rgba(255,255,255,0.55)";
  return (
    <div
      style={{
        fontFamily: typography.familyMono,
        fontSize: typography.size.microCaps,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color,
        fontWeight: typography.weight.medium,
        marginBlockEnd: spacing.s16,
      }}
    >
      {children}
    </div>
  );
}

export function Card({ children, padding = spacing.s24 - 4, transparent = false }) {
  return (
    <article
      style={{
        background: transparent ? "transparent" : colors.bg.raised,
        border: `0.5px solid ${colors.separator}`,
        borderRadius: radii.panelLg,
        padding,
        display: "flex",
        flexDirection: "column",
        gap: spacing.s16,
      }}
    >
      {children}
    </article>
  );
}

export function StatLine({ value, caption }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.subtitleMin,
          fontWeight: typography.weight.medium,
          color: "rgba(255,255,255,0.96)",
          letterSpacing: "-0.005em",
          lineHeight: 1.2,
        }}
      >
        {value}
      </span>
      {caption && (
        <span
          style={{
            fontFamily: typography.family,
            fontSize: typography.size.caption,
            fontWeight: typography.weight.regular,
            color: "rgba(255,255,255,0.55)",
            lineHeight: 1.4,
          }}
        >
          {caption}
        </span>
      )}
    </div>
  );
}

export function PillButton({ children, onClick, variant = "primary", disabled = false }) {
  const isPrimary = variant === "primary";
  const isOutlined = variant === "outlined";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        appearance: "none",
        padding: "12px 20px",
        background: disabled
          ? "rgba(255,255,255,0.06)"
          : isPrimary ? colors.accent.phosphorCyan : "transparent",
        color: disabled
          ? "rgba(255,255,255,0.32)"
          : isPrimary ? "#08080A" : "rgba(255,255,255,0.96)",
        border: isOutlined ? `0.5px solid ${colors.separator}` : "none",
        borderRadius: radii.pill,
        fontFamily: typography.family,
        fontSize: typography.size.bodyMin,
        fontWeight: typography.weight.medium,
        cursor: disabled ? "not-allowed" : "pointer",
        alignSelf: "flex-start",
      }}
    >
      {children}
    </button>
  );
}

export function TextLink({ children, onClick, tone = "muted" }) {
  const color = tone === "cyan"
    ? colors.accent.phosphorCyan
    : "rgba(255,255,255,0.55)";
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        appearance: "none",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color,
        fontFamily: typography.familyMono,
        fontSize: typography.size.microCaps,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        fontWeight: typography.weight.medium,
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}

export function Row({ children, between = false }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: between ? "space-between" : "flex-start",
        gap: spacing.s16,
      }}
    >
      {children}
    </div>
  );
}

export function ScrollPad({ children }) {
  // Padding inferior para que el contenido respire encima del bottom nav.
  return (
    <div style={{ paddingBlockEnd: spacing.s96 }}>
      {children}
    </div>
  );
}
