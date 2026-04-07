/**
 * SectionLabel — Branded section header
 * Consistent across all cards and sections.
 * Optional accent dot for visual anchoring.
 */
export function SectionLabel({ text, color, dot = false }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      marginBottom: 10,
    }}>
      {dot && (
        <div style={{
          width: 4, height: 4, borderRadius: "50%",
          background: color || "#94A3B8",
        }} />
      )}
      <span style={{
        fontSize: 10, fontWeight: 800, letterSpacing: 3,
        color: color || "#94A3B8",
        textTransform: "uppercase",
      }}>{text}</span>
    </div>
  );
}
