"use client";

/**
 * StateOrbs v9 — Ambient Neural Atmosphere
 *
 * Design: Two large diffused orbs create the "mood" of the app.
 * Colors shift based on neural state — user FEELS the change
 * before reading any number.
 *
 * Added: subtle center glow on urgent states,
 * smoother transitions, deeper blur for more organic feel.
 */
export function StateOrbs({ theme, isDark, ac }) {
  const s = theme.state;
  const primary = s === "optimal" ? "#10B981"
    : s === "stressed" ? "#F59E0B"
    : s === "critical" ? "#EF4444"
    : ac;
  const secondary = s === "optimal" ? "#34D399"
    : s === "critical" ? "#F87171"
    : "#818CF8";
  const pulseSpeed = theme.motion?.pulse || "4s";

  // Opacity varies by theme mode — stronger in dark
  const opP = isDark ? "10" : "08";
  const opS = isDark ? "0C" : "06";

  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none",
      zIndex: 0, overflow: "hidden",
    }}>
      {/* Primary orb — top right quadrant */}
      <div style={{
        position: "absolute", top: "-15%", right: "-15%",
        width: "60%", height: "60%", borderRadius: "50%",
        background: `radial-gradient(circle at 40% 40%, ${primary}${opP}, ${primary}06 45%, transparent 70%)`,
        filter: "blur(50px)",
        transition: "background 3s cubic-bezier(0.4, 0, 0.2, 1)",
        animation: `am ${pulseSpeed} ease-in-out infinite`,
        willChange: "transform",
      }} />

      {/* Secondary orb — bottom left quadrant */}
      <div style={{
        position: "absolute", bottom: "-10%", left: "-12%",
        width: "50%", height: "50%", borderRadius: "50%",
        background: `radial-gradient(circle at 60% 60%, ${secondary}${opS}, transparent 65%)`,
        filter: "blur(45px)",
        transition: "background 3s cubic-bezier(0.4, 0, 0.2, 1)",
        animation: `am ${pulseSpeed} ease-in-out infinite reverse`,
        willChange: "transform",
      }} />

      {/* Urgent center glow — appears when stressed/critical */}
      {theme.isUrgent && (
        <div style={{
          position: "absolute", top: "28%", left: "18%",
          width: "64%", height: "44%", borderRadius: "50%",
          background: `radial-gradient(circle, ${primary}05, transparent 55%)`,
          filter: "blur(60px)",
          animation: `pu ${theme.motion?.glow || "1.8s"} ease infinite`,
          transition: "opacity 1.5s ease",
        }} />
      )}
    </div>
  );
}
