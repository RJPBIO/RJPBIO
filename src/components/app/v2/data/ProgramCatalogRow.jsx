"use client";
import { ChevronRight } from "lucide-react";
import { colors, typography, spacing, radii, surfaces, icon, motion as motionTok } from "../tokens";

// Row catalog identica a cold-start cards de Hoy: bg 0.03, border 0.5 0.06, radius 14.

export default function ProgramCatalogRow({ tag, name, descriptor, onTap }) {
  return (
    <button
      type="button"
      onClick={onTap}
      data-v2-catalog-row
      style={{
        appearance: "none",
        textAlign: "start",
        background: colors.bg.raised,
        border: `0.5px solid ${colors.separator}`,
        borderRadius: radii.panel,
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: spacing.s16,
        color: "inherit",
        cursor: "pointer",
        width: "100%",
        transitionProperty: "background, transform",
        transitionDuration: "180ms",
        transitionTimingFunction: motionTok.ease.out,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = surfaces.rowHover; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = colors.bg.raised; }}
      onPointerDown={(e) => { e.currentTarget.style.transform = `scale(${motionTok.tap.scale})`; }}
      onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 36,
          height: 36,
          background: surfaces.iconBox,
          borderRadius: radii.iconBox,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: typography.family,
          fontSize: typography.size.caption,
          fontWeight: typography.weight.medium,
          color: "rgba(255,255,255,0.72)",
          letterSpacing: "0.04em",
          flexShrink: 0,
        }}
      >
        {tag}
      </span>
      <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <span
          style={{
            fontFamily: typography.family,
            fontSize: typography.size.body,
            fontWeight: typography.weight.medium,
            color: "rgba(255,255,255,0.96)",
            letterSpacing: "-0.005em",
            lineHeight: 1.2,
          }}
        >
          {name}
        </span>
        <span
          style={{
            fontFamily: typography.family,
            fontSize: typography.size.caption,
            fontWeight: typography.weight.regular,
            color: "rgba(255,255,255,0.55)",
            lineHeight: 1.4,
          }}
        >
          {descriptor}
        </span>
      </span>
      <ChevronRight
        size={18}
        strokeWidth={icon.strokeWidth}
        color="rgba(255,255,255,0.32)"
        aria-hidden="true"
      />
    </button>
  );
}
