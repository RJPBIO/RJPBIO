"use client";

/**
 * StateOrbs — Ambient atmospheric background
 * Changes color/intensity based on neural state.
 * The user FEELS the state before reading any number.
 */
export function StateOrbs({ theme, isDark, ac }) {
  const s = theme.state;
  const primary = s === "optimal" ? "#059669" : s === "stressed" ? "#D97706" : s === "critical" ? "#DC2626" : ac;
  const secondary = s === "optimal" ? "#34D399" : s === "critical" ? "#F87171" : "#818CF8";
  const opP = isDark ? "14" : "0A";
  const opS = isDark ? "10" : "08";

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      {/* Primary orb — top right */}
      <div style={{
        position: "absolute", top: "-12%", right: "-12%",
        width: "55%", height: "55%", borderRadius: "50%",
        background: `radial-gradient(circle at 40% 40%, ${primary}${opP}, ${primary}08 50%, transparent 72%)`,
        filter: "blur(40px)",
        transition: "background 2.5s cubic-bezier(0.4, 0, 0.2, 1)",
        animation: `am ${theme.motion.pulse} ease-in-out infinite`,
      }} />
      {/* Secondary orb — bottom left */}
      <div style={{
        position: "absolute", bottom: "-8%", left: "-10%",
        width: "45%", height: "45%", borderRadius: "50%",
        background: `radial-gradient(circle at 60% 60%, ${secondary}${opS}, transparent 65%)`,
        filter: "blur(35px)",
        transition: "background 2.5s cubic-bezier(0.4, 0, 0.2, 1)",
        animation: `am ${theme.motion.pulse} ease-in-out infinite reverse`,
      }} />
      {/* Center glow — very subtle, state-colored */}
      {theme.isUrgent && (
        <div style={{
          position: "absolute", top: "30%", left: "20%",
          width: "60%", height: "40%", borderRadius: "50%",
          background: `radial-gradient(circle, ${primary}06, transparent 60%)`,
          filter: "blur(60px)",
          animation: `pu ${theme.motion.glow} ease infinite`,
        }} />
      )}
    </div>
  );
}
