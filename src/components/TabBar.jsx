"use client";
import { Ic } from "./Icons";

/**
 * TabBar — Premium glass bottom navigation
 * Matches the reference: BIO-IGNICIÓN | OPTIMIZACIÓN | YO
 */
export function TabBar({ tab, switchTab, isDark, bg, bd, t1, t3, ac, theme }) {
  const tabs = [
    { id: "ignicion", lb: "BIO-IGNICIÓN", ic: "bolt", color: ac },
    { id: "dashboard", lb: "OPTIMIZACIÓN", ic: "chart", color: "#6366F1" },
    { id: "perfil", lb: "YO", ic: "user", color: t1 },
  ];

  return (
    <div style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430,
      background: isDark ? "rgba(8,11,18,0.85)" : "rgba(255,255,255,0.85)",
      backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
      borderTop: "1px solid " + (isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.06)"),
      padding: "6px 12px 12px",
      display: "flex", justifyContent: "center", zIndex: 60,
      borderRadius: "20px 20px 0 0",
    }}>
      {tabs.map(t => {
        const a = tab === t.id;
        return (
          <button key={t.id} onClick={() => switchTab(t.id)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            gap: 3, padding: "8px 0 2px",
            border: "none", cursor: "pointer",
            background: a ? (isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.04)") : "transparent",
            borderRadius: 14, margin: "0 3px",
            boxShadow: a ? "0 0 20px " + t.color + "12" : "none",
            transition: "all .3s ease",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: a ? t.color + "18" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all .3s ease",
              boxShadow: a ? "0 0 12px " + t.color + "20" : "none",
            }}>
              <Ic name={t.ic} size={a ? 17 : 15} color={a ? t.color : t3} />
            </div>
            <span style={{
              fontSize: 8, fontWeight: a ? 800 : 600,
              color: a ? t1 : t3,
              letterSpacing: a ? 0.8 : 0.3,
              textTransform: "uppercase",
            }}>{t.lb}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * MetricsBar — Compact neural metrics above tab bar
 */
export function MetricsBar({ coherencia, resiliencia, capacidad, rD, bd, isDark, bg }) {
  const metrics = [
    { v: coherencia, d: rD && rD.c > 0 ? "+" + rD.c : "—", c: "#3B82F6", ic: "focus" },
    { v: resiliencia, d: rD && rD.r > 0 ? "+" + rD.r : "—", c: "#22D3A0", ic: "calm" },
    { v: capacidad, d: "+2", c: "#D97706", ic: "energy" },
  ];

  return (
    <div style={{
      position: "fixed", bottom: 70, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430, padding: "5px 20px",
      background: isDark ? "rgba(8,11,18,.8)" : "rgba(255,255,255,.8)",
      backdropFilter: "blur(14px)",
      display: "flex", justifyContent: "center", gap: 14,
      zIndex: 50, borderTop: "1px solid " + (isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.04)"),
    }}>
      {metrics.map((m, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10 }}>
          {i > 0 && <div style={{ width: 1, height: 12, background: isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.06)", margin: "0 5px" }} />}
          <Ic name={m.ic} size={10} color={m.c} />
          <span style={{ color: m.c, fontWeight: 800, fontSize: 11 }}>{m.v}</span>
          <span style={{
            color: m.d.includes("+") ? "#22D3A0" : (isDark ? "#4B5568" : "#94A3B8"),
            fontWeight: 600, fontSize: 9,
          }}>{m.d}</span>
        </div>
      ))}
    </div>
  );
}
