"use client";

/**
 * NeuralBackground — Floating neural particles + connections
 * Creates the bio-neural atmosphere seen in the reference.
 * Pure CSS — no canvas, no WebGL, GPU-friendly.
 * Particles drift slowly. Connections pulse.
 */
export function NeuralBackground({ ac, isDark, theme }) {
  const color = ac || "#22D3A0";
  const secondary = "#6366F1";
  const opacity = isDark ? 1 : 0.5;

  // Generate particle positions deterministically
  const particles = [
    { x: 12, y: 8, s: 3, d: 15, del: 0 },
    { x: 85, y: 12, s: 2, d: 18, del: 2 },
    { x: 25, y: 35, s: 4, d: 20, del: 1 },
    { x: 70, y: 28, s: 2.5, d: 16, del: 3 },
    { x: 8, y: 55, s: 3, d: 22, del: 0.5 },
    { x: 92, y: 50, s: 2, d: 17, del: 4 },
    { x: 40, y: 70, s: 3.5, d: 19, del: 1.5 },
    { x: 65, y: 80, s: 2, d: 21, del: 2.5 },
    { x: 18, y: 88, s: 3, d: 16, del: 3.5 },
    { x: 80, y: 92, s: 2.5, d: 18, del: 0.8 },
    { x: 50, y: 15, s: 2, d: 20, del: 1.2 },
    { x: 35, y: 50, s: 3, d: 15, del: 2.8 },
  ];

  // Neural connections (lines between some particles)
  const connections = [
    { x1: 12, y1: 8, x2: 25, y2: 35 },
    { x1: 85, y1: 12, x2: 70, y2: 28 },
    { x1: 25, y1: 35, x2: 40, y2: 70 },
    { x1: 70, y1: 28, x2: 92, y2: 50 },
    { x1: 8, y1: 55, x2: 18, y2: 88 },
    { x1: 65, y1: 80, x2: 80, y2: 92 },
    { x1: 40, y1: 70, x2: 65, y2: 80 },
    { x1: 50, y1: 15, x2: 70, y2: 28 },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
      overflow: "hidden", opacity,
    }}>
      {/* SVG neural network */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        {/* Connections */}
        {connections.map((c, i) => (
          <line key={"c" + i}
            x1={c.x1 + "%"} y1={c.y1 + "%"}
            x2={c.x2 + "%"} y2={c.y2 + "%"}
            stroke={i % 2 === 0 ? color : secondary}
            strokeWidth="0.5"
            opacity="0.06"
            style={{ animation: `ecgDraw ${8 + i * 2}s linear infinite ${i * 0.8}s` }}
          />
        ))}
      </svg>

      {/* Floating particles */}
      {particles.map((p, i) => (
        <div key={"p" + i} style={{
          position: "absolute",
          left: p.x + "%", top: p.y + "%",
          width: p.s, height: p.s,
          borderRadius: "50%",
          background: i % 3 === 0 ? color : i % 3 === 1 ? secondary : "#D97706",
          opacity: 0.15 + (i % 3) * 0.08,
          animation: `orbFloat ${p.d}s ease-in-out infinite ${p.del}s`,
          boxShadow: `0 0 ${p.s * 2}px ${i % 3 === 0 ? color : secondary}30`,
        }} />
      ))}

      {/* Ambient glow orbs */}
      <div style={{
        position: "absolute", top: "-10%", right: "-15%",
        width: "50%", height: "50%", borderRadius: "50%",
        background: `radial-gradient(circle at 40% 40%, ${color}0A, transparent 65%)`,
        filter: "blur(40px)",
        animation: `am ${theme.motion ? theme.motion.pulse : "5s"} ease-in-out infinite`,
      }} />
      <div style={{
        position: "absolute", bottom: "-5%", left: "-10%",
        width: "40%", height: "40%", borderRadius: "50%",
        background: `radial-gradient(circle at 60% 60%, ${secondary}08, transparent 60%)`,
        filter: "blur(35px)",
        animation: `am ${theme.motion ? theme.motion.pulse : "5s"} ease-in-out infinite reverse`,
      }} />
    </div>
  );
}
