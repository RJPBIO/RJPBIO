"use client";
import { TabItem } from "./UIStore";

export function TabBar({ tab, onSwitch, accent, isDark, bg, bd }) {
  const tabs = [
    { id: "ignicion", lb: "Core", ic: "bolt" },
    { id: "dashboard", lb: "Estado", ic: "chart" },
    { id: "perfil", lb: "Yo", ic: "user" },
  ];

  return (
    <div style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430,
      background: isDark ? "rgba(11,14,20,.94)" : "rgba(255,255,255,.94)",
      backdropFilter: "blur(18px)",
      borderTop: `1px solid ${bd}`,
      padding: "3px 10px 10px",
      display: "flex", justifyContent: "center",
      zIndex: 60,
    }}>
      {tabs.map(t => (
        <TabItem
          key={t.id}
          id={t.id}
          label={t.lb}
          icon={t.ic}
          active={tab === t.id}
          accentColor={accent}
          isDark={isDark}
          onClick={() => onSwitch(t.id)}
        />
      ))}
    </div>
  );
}

export default TabBar;
