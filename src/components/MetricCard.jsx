"use client";

/**
 * MetricCard — State-aware data display
 * Adds depth via subtle inner shadow, state-colored accents,
 * and visual hierarchy that makes numbers scannable.
 */
export function MetricCard({ label, value, suffix, color, trend, isDark, cd, bd, t1, t3, ac, children }) {
  return (
    <div style={{
      background: cd,
      borderRadius: 18,
      padding: "16px 14px",
      border: `1px solid ${bd}`,
      position: "relative",
      overflow: "hidden",
      transition: "border-color 1.5s ease, background 1.5s ease",
    }}>
      {/* Subtle top accent line */}
      {color && <div style={{
        position: "absolute", top: 0, left: "15%", right: "15%", height: 2,
        background: `linear-gradient(90deg, transparent, ${color}30, transparent)`,
        borderRadius: "0 0 4px 4px",
      }} />}
      
      {label && (
        <div style={{
          fontSize: 10, fontWeight: 800, letterSpacing: 2.5,
          color: t3, textTransform: "uppercase", marginBottom: 10,
        }}>{label}</div>
      )}
      
      {value !== undefined && (
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: color || t1 }}>{value}</span>
          {suffix && <span style={{ fontSize: 12, fontWeight: 700, color: color || t3, opacity: 0.7 }}>{suffix}</span>}
          {trend && (
            <span style={{
              fontSize: 10, fontWeight: 700, marginLeft: 6,
              color: trend.startsWith("+") ? "#10B981" : trend === "—" ? t3 : "#DC2626",
            }}>{trend}</span>
          )}
        </div>
      )}
      
      {children}
    </div>
  );
}

/**
 * MetricGrid — Layout wrapper for metric cards
 */
export function MetricGrid({ cols = 3, gap = 8, mb = 14, children }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap,
      marginBottom: mb,
    }}>
      {children}
    </div>
  );
}

/**
 * StatRow — Inline stat with label + value
 */
export function StatRow({ label, value, color, bd, t1, t3, isLast }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "9px 0",
      borderBottom: isLast ? "none" : `1px solid ${bd}`,
    }}>
      <span style={{ fontSize: 11, color: t3, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 800, color: color || t1 }}>{value}</span>
    </div>
  );
}
