"use client";
import { colors, typography, spacing, motion as motionTok } from "../tokens";
import { focusDescriptor, calmDescriptor, energyDescriptor } from "./copy";

// 3 dimensiones equidistantes con separadores verticales 0.5px.
// Sin cards. Hover opacity boost 0.05. Tap scale 0.98 120ms.

export default function DimensionsRow({ focus = 0, calm = 0, energy = 0, onSelect }) {
  const items = [
    { id: "foco",    label: "FOCO",    value: focus,  desc: focusDescriptor(focus)  },
    { id: "calma",   label: "CALMA",   value: calm,   desc: calmDescriptor(calm)    },
    { id: "energia", label: "ENERGÍA", value: energy, desc: energyDescriptor(energy) },
  ];
  return (
    <section
      data-v2-dimensions
      style={{
        paddingInline: spacing.s24,
        paddingBlockStart: 0,
        paddingBlockEnd: spacing.s64,
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
      }}
    >
      {items.map((it, i) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onSelect && onSelect(it.id)}
          data-v2-dim={it.id}
          style={{
            appearance: "none",
            background: "transparent",
            border: "none",
            borderInlineStart: i === 0 ? "none" : `0.5px solid ${colors.separator}`,
            color: "inherit",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
            paddingBlock: spacing.s16,
            cursor: "pointer",
            transitionProperty: "opacity, transform",
            transitionDuration: `${motionTok.duration.tap}ms`,
            transitionTimingFunction: motionTok.ease.out,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.95"; }}
          onPointerDown={(e) => { e.currentTarget.style.transform = `scale(${motionTok.tap.scale})`; }}
          onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <span
            style={{
              fontFamily: typography.familyMono,
              fontSize: typography.size.microCaps,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.55)",
              fontWeight: typography.weight.medium,
              marginBlockEnd: 6,
            }}
          >
            {it.label}
          </span>
          <span
            style={{
              fontFamily: typography.family,
              fontSize: 32,
              fontWeight: typography.weight.light,
              letterSpacing: "-0.02em",
              color: "rgba(255,255,255,0.96)",
              lineHeight: 1,
              marginBlockEnd: 4,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {Math.round(it.value)}%
          </span>
          <span
            style={{
              fontFamily: typography.family,
              fontSize: typography.size.caption,
              fontWeight: typography.weight.regular,
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.3,
              textAlign: "center",
              paddingInline: 4,
            }}
          >
            {it.desc}
          </span>
        </button>
      ))}
    </section>
  );
}
