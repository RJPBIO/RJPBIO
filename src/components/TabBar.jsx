"use client";
import { Ic } from "./Icons";

/**
 * TabBar — Bottom navigation with neural identity
 */
export function TabBar({ tab, switchTab, isDark, bg, bd, t1, t3, ac, theme }) {
  const tabs = [
    { id: "ignicion", lb: "Core", ic: "bolt", color: ac },
    { id: "dashboard", lb: "Estado", ic: "chart", color: "#6366F1" },
    { id: "perfil", lb: "Yo", ic: "user", color: t1 },
  ];

  return (
    <div style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430,
      background: isDark ? "rgba(11,14,20,0.92)" : "rgba(255,255,255,0.92)",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      borderTop: `1px solid ${bd}`,
      padding: "4px 10px 10px",
      display: "flex", justifyContent: "center", zIndex: 60,
    }}>
      {tabs.map(t => {
        const a = tab === t.id;
        return (
          <button key={t.id} onClick={() => switchTab(t.id)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            gap: 2, padding: "7px 0 3px",
            border: "none", cursor: "pointer",
            background: a ? (isDark ? "#1A1E28" : "#EEF0F6") : "transparent",
            borderRadius: 12, margin: "0 2px",
            boxShadow: a ? "0 0 14px " + t.color + "15" : "none",
          }}>
            {a && <div style={{
              width: 4, height: 4, borderRadius: "50%",
              background: t.color, marginBottom: 1,
              animation: "shimDot " + (theme && theme.motion ? theme.motion.dot : "2.2s") + " ease infinite",
              boxShadow: "0 0 6px " + t.color + "50",
            }} />}
            <Ic name={t.ic} size={a ? 19 : 16} color={a ? t.color : t3} />
            <span style={{
              fontSize: 9, fontWeight: a ? 800 : 600,
              color: a ? t1 : t3, marginTop: 1,
              letterSpacing: a ? 1 : 0,
            }}>{t.lb}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * MetricsBar — Quick stats bar above the tab bar
 */
export function MetricsBar({ coherencia, resiliencia, capacidad, rD, bd, isDark, bg }) {
  const metrics = [
    { v: coherencia, d: rD && rD.c > 0 ? "+" + rD.c : "—", c: "#3B82F6", ic: "focus" },
    { v: resiliencia, d: rD && rD.r > 0 ? "+" + rD.r : "—", c: "#8B5CF6", ic: "calm" },
    { v: capacidad, d: "+2", c: "#6366F1", ic: "energy" },
  ];

  return (
    <div style={{
      position: "fixed", bottom: 58, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430, padding: "5px 20px",
      background: (bg || "#F0F2F8") + "EB",
      backdropFilter: "blur(14px)",
      display: "flex", justifyContent: "center", gap: 12,
      zIndex: 50, borderTop: "1px solid " + bd,
    }}>
      {metrics.map((m, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10 }}>
          {i > 0 && <div style={{ width: 1, height: 12, background: bd, margin: "0 4px" }} />}
          <Ic name={m.ic} size={10} color={m.c} />
          <span style={{ color: m.c, fontWeight: 800, fontSize: 11 }}>{m.v}</span>
          <span style={{
            color: m.d.includes("+") ? "#059669" : (isDark ? "#4B5568" : "#94A3B8"),
            fontWeight: 600, fontSize: 9,
          }}>{m.d}</span>
        </div>
      ))}
    </div>
  );
}
