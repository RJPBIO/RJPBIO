"use client";
/* ═══════════════════════════════════════════════════════════════
   PostureVisual — figura sentada con 5 puntos de alineación
   Highlight secuencial: pies, glúteos, columna, hombros, cabeza.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { colors, typography, spacing } from "../../../app/v2/tokens";

const ACCENT = colors.accent.phosphorCyan;

const POINT_BY_KEY = {
  feet:      { cx: 110, cy: 250, r: 6, label: "Pies firmes" },
  hips:      { cx: 80,  cy: 170, r: 6, label: "Glúteos en silla" },
  spine:     { cx: 70,  cy: 120, r: 6, label: "Columna recta" },
  shoulders: { cx: 60,  cy: 80,  r: 6, label: "Hombros un poco atrás" },
  head:      { cx: 56,  cy: 38,  r: 6, label: "Cabeza alineada" },
};

const DEFAULT_SEQUENCE = ["feet", "hips", "spine", "shoulders", "head"];

export default function PostureVisual({
  points = DEFAULT_SEQUENCE,
  transition_ms = 7000,
  onComplete,
}) {
  const [idx, setIdx] = useState(0);
  const current = points[idx];

  // Quick fix post-SP5 — ref pattern.
  const onCompleteRef = useRef(onComplete);
  const transitionMsRef = useRef(transition_ms);
  useEffect(() => { onCompleteRef.current = onComplete; });
  useEffect(() => { transitionMsRef.current = transition_ms; }, [transition_ms]);

  useEffect(() => {
    if (idx >= points.length) {
      if (typeof onCompleteRef.current === "function") onCompleteRef.current();
      return undefined;
    }
    const id = setTimeout(() => setIdx((i) => i + 1), transitionMsRef.current);
    return () => clearTimeout(id);
  }, [idx, points.length]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.s16 }}>
      <svg viewBox="0 0 200 280" width="200" height="280" aria-label="Postura sentada — alineación 5 puntos">
        <path
          d="M 56 24 Q 56 56 60 80 Q 65 110 70 130 Q 75 150 80 168 L 110 250"
          fill="none"
          stroke="rgba(245,245,247,0.28)"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <circle cx="56" cy="20" r="14" fill="none" stroke="rgba(245,245,247,0.28)" strokeWidth="1" />
        <line x1="60" y1="80" x2="100" y2="92" stroke="rgba(245,245,247,0.20)" strokeWidth="1" />
        <line x1="80" y1="170" x2="155" y2="170" stroke="rgba(245,245,247,0.20)" strokeWidth="1" />
        <line x1="155" y1="170" x2="155" y2="250" stroke="rgba(245,245,247,0.20)" strokeWidth="1" />
        {Object.entries(POINT_BY_KEY).map(([key, p]) => {
          const isActive = key === current;
          return (
            <g key={key}>
              <circle
                cx={p.cx}
                cy={p.cy}
                r={p.r}
                fill={isActive ? ACCENT : "rgba(34,211,238,0.25)"}
                opacity={isActive ? 1 : 0.4}
              />
              {isActive && (
                <circle
                  cx={p.cx}
                  cy={p.cy}
                  r={p.r + 6}
                  fill="none"
                  stroke={ACCENT}
                  strokeWidth="0.8"
                  opacity="0.6"
                />
              )}
            </g>
          );
        })}
      </svg>
      <p style={{
        margin: 0,
        fontFamily: typography.family,
        fontWeight: typography.weight.regular,
        fontSize: 14,
        color: colors.text.secondary,
        letterSpacing: "0.02em",
      }}>
        {POINT_BY_KEY[current]?.label || ""}
      </p>
    </div>
  );
}
