"use client";

/**
 * NeuralBackground v9 — Living Neural Atmosphere
 *
 * Design: Fewer elements, more impact. Each particle is a neuron.
 * Connections pulse like synaptic transmissions.
 * Two ambient nebulae create depth and state-reactive atmosphere.
 *
 * Performance: Pure CSS/SVG, GPU-accelerated, no canvas.
 * Particles use will-change for compositor promotion.
 */
export function NeuralBackground({ ac, isDark, theme }) {
  const color = ac || "#10B981";
  const secondary = "#6366F1";
  const tertiary = "#D97706";
  const opacity = isDark ? 1 : 0.4;
  const pulseSpeed = theme.motion?.pulse || "5s";

  // 8 particles (down from 12) — each positioned for visual balance
  const particles = [
    { x: 10, y: 6,  s: 3.5, dur: 18, del: 0,   c: 0 },
    { x: 88, y: 10, s: 2.5, dur: 22, del: 1.5, c: 1 },
    { x: 22, y: 38, s: 4,   dur: 20, del: 0.8, c: 0 },
    { x: 75, y: 30, s: 2,   dur: 16, del: 2.5, c: 2 },
    { x: 6,  y: 62, s: 3,   dur: 24, del: 1.2, c: 1 },
    { x: 92, y: 55, s: 2.5, dur: 19, del: 3,   c: 0 },
    { x: 45, y: 78, s: 3,   dur: 21, del: 0.5, c: 1 },
    { x: 70, y: 88, s: 2,   dur: 17, del: 2,   c: 2 },
  ];

  const colors = [color, secondary, tertiary];

  // 6 synaptic connections — fewer but more visible
  const connections = [
    { x1: 10, y1: 6,  x2: 22, y2: 38 },
    { x1: 88, y1: 10, x2: 75, y2: 30 },
    { x1: 22, y1: 38, x2: 45, y2: 78 },
    { x1: 75, y1: 30, x2: 92, y2: 55 },
    { x1: 6,  y1: 62, x2: 45, y2: 78 },
    { x1: 45, y1: 78, x2: 70, y2: 88 },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
      overflow: "hidden", opacity,
      transition: "opacity 1.5s ease",
    }}>
      {/* SVG synaptic network */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        <defs>
          {/* Gradient for connections — creates energy flow illusion */}
          <linearGradient id="syn1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.06" />
            <stop offset="50%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0.03" />
          </linearGradient>
          <linearGradient id="syn2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={secondary} stopOpacity="0.04" />
            <stop offset="50%" stopColor={secondary} stopOpacity="0.12" />
            <stop offset="100%" stopColor={secondary} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {connections.map((c, i) => (
          <line key={"c" + i}
            x1={c.x1 + "%"} y1={c.y1 + "%"}
            x2={c.x2 + "%"} y2={c.y2 + "%"}
            stroke={`url(#syn${i % 2 === 0 ? "1" : "2"})`}
            strokeWidth="0.6"
            style={{
              animation: `ecgDraw ${10 + i * 3}s ease-in-out infinite ${i * 1.2}s`,
            }}
          />
        ))}
      </svg>

      {/* Floating neuron particles */}
      {particles.map((p, i) => (
        <div key={"p" + i} style={{
          position: "absolute",
          left: p.x + "%", top: p.y + "%",
          width: p.s, height: p.s,
          borderRadius: "50%",
          background: colors[p.c],
          opacity: 0.12 + (i % 3) * 0.06,
          animation: `orbFloat ${p.dur}s ease-in-out infinite ${p.del}s`,
          boxShadow: `0 0 ${p.s * 3}px ${colors[p.c]}25`,
          willChange: "transform",
        }} />
      ))}

      {/* ═══ NEBULA 1 — Top right, primary state color ═══ */}
      <div style={{
        position: "absolute", top: "-15%", right: "-20%",
        width: "55%", height: "55%", borderRadius: "50%",
        background: `radial-gradient(circle at 35% 40%, ${color}08, ${color}03 45%, transparent 70%)`,
        filter: "blur(50px)",
        animation: `am ${pulseSpeed} ease-in-out infinite`,
        transition: "background 2.5s ease",
      }} />

      {/* ═══ NEBULA 2 — Bottom left, secondary accent ═══ */}
      <div style={{
        position: "absolute", bottom: "-10%", left: "-15%",
        width: "45%", height: "45%", borderRadius: "50%",
        background: `radial-gradient(circle at 60% 55%, ${secondary}06, transparent 65%)`,
        filter: "blur(45px)",
        animation: `am ${pulseSpeed} ease-in-out infinite reverse`,
        transition: "background 2.5s ease",
      }} />

      {/* ═══ CENTER VIGNETTE — subtle depth ═══ */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at 50% 45%, transparent 30%, ${isDark ? "rgba(6,9,15,.4)" : "rgba(244,246,250,.3)"} 100%)`,
        pointerEvents: "none",
      }} />
    </div>
  );
}
