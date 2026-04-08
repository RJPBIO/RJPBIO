"use client";

/**
 * RingGauge — Circular progress ring like Apple Health
 * Shows a metric as a filled arc with color and label.
 * Animates on mount.
 */
export function RingGauge({ value = 0, max = 100, size = 72, strokeWidth = 6, color = "#059669", label, sublabel, isDark }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const offset = circ * (1 - pct);
  const bg = isDark ? "#1C2030" : "#E8ECF4";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          {/* Background ring */}
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bg} strokeWidth={strokeWidth} />
          {/* Value ring */}
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)", filter: `drop-shadow(0 0 4px ${color}40)` }} />
        </svg>
        {/* Center value */}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: size > 60 ? 18 : 14, fontWeight: 800, color: color, lineHeight: 1 }}>{value}</span>
          {max !== 100 && <span style={{ fontSize: 8, color: isDark ? "#4B5568" : "#94A3B8" }}>/{max}</span>}
        </div>
      </div>
      {label && <span style={{ fontSize: 10, fontWeight: 700, color: isDark ? "#8B95A8" : "#475569", textAlign: "center" }}>{label}</span>}
      {sublabel && <span style={{ fontSize: 9, color: isDark ? "#4B5568" : "#94A3B8", textAlign: "center" }}>{sublabel}</span>}
    </div>
  );
}

/**
 * MiniRing — Tiny inline ring for compact spaces
 */
export function MiniRing({ value = 0, size = 28, color = "#059669", isDark }) {
  const sw = 3;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(value / 100, 1));
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={isDark ? "#1C2030" : "#E8ECF4"} strokeWidth={sw} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease" }} />
    </svg>
  );
}
