"use client";
import { Ic } from "./Icons";

/**
 * TabBar v9 — Minimal Premium Navigation
 *
 * Design: Ultra-clean, near-invisible when not needed.
 * Active tab has subtle glow + accent color.
 * No MetricsBar above — removed for cleaner layout.
 * Glass effect with deep blur for depth.
 */
export function TabBar({ tab, switchTab, isDark, bg, bd, t1, t3, ac, theme }) {
  const tabs = [
    { id: "ignicion", lb: "BIO-IGNICIÓN", ic: "bolt", color: ac },
    { id: "dashboard", lb: "OPTIMIZACIÓN", ic: "chart", color: "#6366F1" },
    { id: "perfil", lb: "YO", ic: "user", color: isDark ? "#E8ECF4" : "#0C1222" },
  ];

  return (
    <div style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430,
      background: isDark ? "rgba(6,9,15,0.88)" : "rgba(244,246,250,0.9)",
      backdropFilter: "blur(28px) saturate(1.3)",
      WebkitBackdropFilter: "blur(28px) saturate(1.3)",
      borderTop: `1px solid ${isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.05)"}`,
      padding: "6px 8px calc(12px + env(safe-area-inset-bottom, 0px))",
      display: "flex", justifyContent: "center", zIndex: 60,
    }}>
      {tabs.map(t => {
        const active = tab === t.id;
        return (
          <button key={t.id} onClick={() => switchTab(t.id)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            gap: 3, padding: "8px 0 3px",
            border: "none", cursor: "pointer",
            background: active
              ? `${t.color}08`
              : "transparent",
            borderRadius: 14, margin: "0 2px",
            transition: "all .3s cubic-bezier(.4,0,.2,1)",
          }}>
            {/* Icon container */}
            <div style={{
              width: 34, height: 34, borderRadius: 11,
              background: active ? `${t.color}12` : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all .3s ease",
              boxShadow: active ? `0 0 16px ${t.color}15` : "none",
              position: "relative",
            }}>
              <Ic name={t.ic} size={active ? 17 : 15} color={active ? t.color : t3} />
              {/* Active indicator dot */}
              {active && (
                <div style={{
                  position: "absolute", bottom: -1,
                  width: 3, height: 3, borderRadius: "50%",
                  background: t.color,
                  boxShadow: `0 0 6px ${t.color}50`,
                }} />
              )}
            </div>
            {/* Label */}
            <span style={{
              fontSize: 8, fontWeight: active ? 800 : 600,
              color: active ? (isDark ? "#E8ECF4" : "#0C1222") : t3,
              letterSpacing: active ? 0.8 : 0.3,
              textTransform: "uppercase",
              transition: "all .3s ease",
            }}>{t.lb}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * MetricsBar — Kept for backward compat but simplified.
 * Now only renders if explicitly shown (parent controls visibility).
 */
export function MetricsBar({ coherencia, resiliencia, capacidad, rD, bd, isDark, bg }) {
  const metrics = [
    { v: coherencia, d: rD && rD.c > 0 ? "+" + rD.c : "—", c: "#3B82F6", ic: "focus" },
    { v: resiliencia, d: rD && rD.r > 0 ? "+" + rD.r : "—", c: "#10B981", ic: "calm" },
    { v: capacidad, d: "+2", c: "#D97706", ic: "energy" },
  ];

  return (
    <div style={{
      position: "fixed", bottom: 70, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430, padding: "5px 20px",
      background: isDark ? "rgba(6,9,15,.82)" : "rgba(244,246,250,.85)",
      backdropFilter: "blur(16px)",
      display: "flex", justifyContent: "center", gap: 14,
      zIndex: 50,
      borderTop: `1px solid ${isDark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.04)"}`,
    }}>
      {metrics.map((m, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10 }}>
          {i > 0 && <div style={{ width: 1, height: 12, background: isDark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.05)", margin: "0 5px" }} />}
          <Ic name={m.ic} size={10} color={m.c} />
          <span style={{ color: m.c, fontWeight: 800, fontSize: 11 }}>{m.v}</span>
          <span style={{
            color: m.d.includes("+") ? "#10B981" : (isDark ? "#3E4A60" : "#8B96AA"),
            fontWeight: 600, fontSize: 9,
          }}>{m.d}</span>
        </div>
      ))}
    </div>
  );
}
