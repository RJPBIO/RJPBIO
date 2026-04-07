"use client";

/**
 * StatusBadge — Neural state indicator
 * Replaces the basic dot + text with a richer, more alive indicator.
 * The dot pulses at brain-state-driven speed.
 */
export function StatusBadge({ label, color, theme, size = "default" }) {
  const isSmall = size === "small";
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: isSmall ? 4 : 6,
      padding: isSmall ? "2px 8px" : "4px 12px",
      background: color + "0C",
      borderRadius: 20,
      border: `1px solid ${color}18`,
      transition: "all 0.6s ease",
    }}>
      <div style={{
        width: isSmall ? 6 : 9,
        height: isSmall ? 6 : 9,
        borderRadius: "50%",
        background: color,
        animation: `shimDot ${theme.motion.dot} ease infinite`,
        boxShadow: `0 0 ${isSmall ? 4 : 8}px ${color}40`,
      }} />
      <span style={{
        fontSize: isSmall ? 9 : 11,
        fontWeight: 700,
        color: color,
        letterSpacing: isSmall ? 0 : 0.5,
      }}>{label}</span>
    </div>
  );
}
