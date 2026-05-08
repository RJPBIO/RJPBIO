"use client";
import { colors, typography, surfaces, motion as motionTok } from "../tokens";

// Phase 6H Premium-Fix2 — extraído desde LearningView.jsx (Phase 6E SP-A)
// para reuso cross-phase. Misma signature legacy `{ value, max }` para no
// romper LearningView (caller existing); props opcionales `label`, `testid`,
// `variant` para el caso ColdStartView phase=active.
//
// variant:
//   · 'standard' (default) — 4px height bar, identical al original LearningView
//   · 'mini'                — 2px height bar para usos compactos (mini-stats inline)
//
// Mantiene `data-v2-learning-progressbar` selector + `role=progressbar` +
// aria-* attrs para anti-regresión del LearningView.bugfix.test.jsx.
//
// scaleX (no width:%) preserva la animación GPU 60fps (Phase 6H Polish-2).

export default function ProgressBar({
  value,
  max,
  label = null,
  testid = null,
  variant = "standard",
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const isMini = variant === "mini";
  const barHeight = isMini ? 2 : 4;

  return (
    <div
      data-v2-progress-bar
      data-variant={variant}
      data-testid={testid || undefined}
      style={{ display: "flex", flexDirection: "column", gap: isMini ? 4 : 6 }}
    >
      {label && (
        <span
          style={{
            fontFamily: typography.familyMono,
            fontSize: isMini ? 9 : typography.size.microCaps,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: colors.text.muted,
            fontWeight: typography.weight.medium,
          }}
        >
          {label}
        </span>
      )}
      <div
        data-v2-learning-progressbar
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        style={{
          position: "relative",
          height: barHeight,
          background: surfaces.iconBox,
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          data-progress-indicator
          style={{
            position: "absolute",
            insetBlock: 0,
            insetInlineStart: 0,
            inlineSize: "100%",
            transform: `scaleX(${Math.max(0, Math.min(1, pct / 100))})`,
            transformOrigin: "left center",
            background: colors.accent.phosphorCyan,
            borderRadius: 999,
            transition: `transform ${motionTok.duration.enter}ms ${motionTok.ease.out}`,
            willChange: "transform",
          }}
        />
      </div>
    </div>
  );
}
