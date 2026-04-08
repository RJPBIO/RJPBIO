"use client";

/**
 * RingGauge v9 — Neural Metric Ring
 *
 * Apple Health-inspired circular progress with bioluminescent glow.
 * Smooth animated fill on mount. Center value is large and clear.
 * Drop shadow on the arc creates depth illusion.
 */
export function RingGauge({ value = 0, max = 100, size = 72, strokeWidth = 5, color = "#10B981", label, sublabel, isDark }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const offset = circ * (1 - pct);
  const trackColor = isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.05)";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          {/* Track ring */}
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={trackColor} strokeWidth={strokeWidth} />
          {/* Value ring with glow */}
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 1.4s cubic-bezier(0.4, 0, 0.2, 1)",
              filter: `drop-shadow(0 0 5px ${color}50)`,
            }}
          />
        </svg>
        {/* Center value */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}>
          <span style={{
            fontSize: size > 60 ? 19 : 14,
            fontWeight: 800, color, lineHeight: 1,
            letterSpacing: "-0.5px",
          }}>{value}</span>
          {max !== 100 && (
            <span style={{
              fontSize: 8, fontWeight: 600,
              color: isDark ? "#3E4A60" : "#8B96AA",
            }}>/{max}</span>
          )}
        </div>
      </div>
      {label && (
        <span style={{
          fontSize: 10, fontWeight: 700,
          color: isDark ? "#7B879E" : "#546178",
          textAlign: "center", letterSpacing: 0.3,
        }}>{label}</span>
      )}
      {sublabel && (
        <span style={{
          fontSize: 9, fontWeight: 500,
          color: isDark ? "#3E4A60" : "#8B96AA",
          textAlign: "center",
        }}>{sublabel}</span>
      )}
    </div>
  );
}

/**
 * MiniRing — Compact inline ring for tight spaces
 */
export function MiniRing({ value = 0, size = 28, color = "#10B981", isDark }) {
  const sw = 3;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(value / 100, 1));
  const trackColor = isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.05)";

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={trackColor} strokeWidth={sw} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={sw}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{
          transition: "stroke-dashoffset 1s ease",
          filter: `drop-shadow(0 0 3px ${color}40)`,
        }}
      />
    </svg>
  );
}
