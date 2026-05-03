"use client";
import { useEffect } from "react";
import { Home, BarChart2, MessageCircle, User } from "lucide-react";
import { colors, typography, spacing, layout, surfaces, motion as motionTok, icon } from "./tokens";

const TABS = [
  { id: "hoy",    label: "Hoy",    Icon: Home },
  { id: "datos",  label: "Datos",  Icon: BarChart2 },
  { id: "coach",  label: "Coach",  Icon: MessageCircle },
  { id: "perfil", label: "Perfil", Icon: User },
];

export default function BottomNavV2({ active = "hoy", onSelect }) {
  useEffect(() => { console.log("[v2] BottomNavV2 active"); }, []);
  return (
    <nav
      data-v2-nav
      aria-label="Navegacion principal"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        height: layout.bottomNavHeight,
        background: surfaces.navBg,
        backdropFilter: surfaces.navBlur,
        WebkitBackdropFilter: surfaces.navBlur,
        borderTop: `0.5px solid ${colors.separator}`,
        display: "grid",
        gridTemplateColumns: `repeat(${TABS.length}, 1fr)`,
        zIndex: 50,
        paddingBlockEnd: "env(safe-area-inset-bottom)",
      }}
    >
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        const tone = isActive ? colors.accent.phosphorCyan : "rgba(255,255,255,0.32)";
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect && onSelect(tab.id)}
            data-v2-tab={tab.id}
            data-active={isActive ? "true" : "false"}
            aria-current={isActive ? "page" : undefined}
            style={{
              appearance: "none",
              background: "transparent",
              border: "none",
              color: tone,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              padding: spacing.s8,
              transitionProperty: "color, transform",
              transitionDuration: `${motionTok.duration.tap}ms`,
              transitionTimingFunction: motionTok.ease.out,
            }}
            onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.95)"; }}
            onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: icon.size, height: icon.size }}>
              {isActive && (
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: -8,
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: colors.accent.phosphorCyan,
                  }}
                />
              )}
              <tab.Icon size={icon.size} strokeWidth={icon.strokeWidth} />
            </span>
            <span
              style={{
                fontFamily: typography.familyMono,
                fontSize: typography.size.microCaps,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: typography.weight.medium,
                color: tone,
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export { TABS as V2_TABS };
