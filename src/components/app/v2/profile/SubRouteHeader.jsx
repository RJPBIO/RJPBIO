"use client";
import { ArrowLeft } from "lucide-react";
import { colors, typography, spacing, icon } from "../tokens";

export default function SubRouteHeader({ title, onBack, action }) {
  return (
    <header
      data-v2-subroute-header
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "44px 1fr 44px",
        alignItems: "center",
        paddingInline: spacing.s16,
        paddingBlock: spacing.s24,
        borderBlockEnd: `0.5px solid ${colors.separator}`,
      }}
    >
      <button
        type="button"
        onClick={onBack}
        aria-label="Volver"
        style={{
          appearance: "none",
          background: "transparent",
          border: "none",
          color: "rgba(255,255,255,0.72)",
          cursor: "pointer",
          width: 44,
          height: 44,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "flex-start",
          padding: 0,
        }}
      >
        <ArrowLeft size={icon.size} strokeWidth={icon.strokeWidth} />
      </button>
      <h2
        style={{
          margin: 0,
          textAlign: "center",
          fontFamily: typography.family,
          fontSize: typography.size.subtitleMin,
          fontWeight: typography.weight.medium,
          color: "rgba(255,255,255,0.96)",
          letterSpacing: "-0.005em",
          lineHeight: 1.2,
        }}
      >
        {title}
      </h2>
      <div style={{ width: 44, height: 44, display: "inline-flex", alignItems: "center", justifyContent: "flex-end" }}>
        {action || null}
      </div>
    </header>
  );
}
