"use client";

/**
 * BreathSync — The UI breathes with the user
 * Wraps content and applies subtle scale/opacity animation
 * synchronized with the breathing engine (bS = breath scale 1.0-1.25).
 * 
 * During idle: gentle ambient pulse
 * During session: synced with actual breathing
 * This is invisible consciously but felt subconsciously.
 */
export function BreathSync({ bS = 1, isActive = false, children }) {
  // During session: follow breathing scale (subtle)
  // During idle: ambient pulse via CSS animation
  const scale = isActive ? 1 + (bS - 1) * 0.08 : 1; // 8% of breath scale = subtle
  const opacity = isActive ? 0.92 + (bS - 1) * 0.32 : 1; // slightly dimmer on exhale

  return (
    <div style={{
      transform: `scale(${scale})`,
      opacity,
      transition: isActive 
        ? "transform 1.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 1.3s ease"
        : "none",
      transformOrigin: "center center",
      animation: isActive ? "none" : "breathAmbient 6s ease-in-out infinite",
    }}>
      {children}
    </div>
  );
}
