"use client";
import { Ic } from "./Icons";

/**
 * StateBar — Top-of-screen neural status bar
 * Always visible. Shows: greeting/time | state badge | protocol indicator
 * Adapts color to brain state. The first thing the user sees.
 */
export function StateBar({ greeting, nSt, theme, pr, ts, isDark, t1, t2, t3, ac, bg, bd }) {
  const stateColor = theme.sa || ac;
  const isSession = ts === "running" || ts === "paused";
  
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 20px 8px",
      position: "relative",
      zIndex: 10,
    }}>
      {/* Left: Greeting or session indicator */}
      <div style={{ flex: 1 }}>
        {isSession ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: ts === "running" ? ac : "#D97706",
              animation: ts === "running" ? `shimDot ${theme.motion.dot} ease infinite` : "pausePulse 1.5s ease infinite",
              boxShadow: `0 0 8px ${ts === "running" ? ac : "#D97706"}40`,
            }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: ts === "running" ? ac : "#D97706" }}>
              {ts === "running" ? "Sesión activa" : "Pausada"}
            </span>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: t1, lineHeight: 1.2 }}>
              {greeting || "BIO-IGNICIÓN"}
            </div>
            <div style={{ fontSize: 10, color: t3, marginTop: 2 }}>
              {new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "short" })}
            </div>
          </div>
        )}
      </div>

      {/* Right: State badge */}
      <div style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "4px 10px",
        borderRadius: 16,
        background: stateColor + "0A",
        border: `1px solid ${stateColor}12`,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: "50%",
          background: stateColor,
          animation: `shimDot ${theme.motion.dot} ease infinite`,
          boxShadow: `0 0 6px ${stateColor}40`,
        }} />
        <span style={{ fontSize: 9, fontWeight: 700, color: stateColor, letterSpacing: 0.5 }}>
          {nSt.label}
        </span>
      </div>
    </div>
  );
}
