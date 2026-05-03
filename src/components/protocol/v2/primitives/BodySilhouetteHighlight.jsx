"use client";
/* ═══════════════════════════════════════════════════════════════
   BodySilhouetteHighlight — body scan visual progresivo
   SVG silhouette con highlight secuencial de zonas.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { colors, typography, spacing } from "../../../app/v2/tokens";

const ACCENT = colors.accent.phosphorCyan;

const ZONE_LABELS = {
  head: "Cabeza",
  neck: "Cuello",
  chest: "Pecho",
  shoulders: "Hombros",
  stomach: "Abdomen",
  hips: "Cadera",
  thighs: "Muslos",
  calves: "Pantorrillas",
  feet: "Pies",
};

const ZONE_GEOMETRY = {
  head:      { type: "circle", cx: 100, cy: 30, r: 18 },
  neck:      { type: "rect", x: 92, y: 48, w: 16, h: 10 },
  shoulders: { type: "rect", x: 60, y: 58, w: 80, h: 14 },
  chest:     { type: "rect", x: 70, y: 72, w: 60, h: 38 },
  stomach:   { type: "rect", x: 75, y: 110, w: 50, h: 32 },
  hips:      { type: "rect", x: 70, y: 142, w: 60, h: 18 },
  thighs:    { type: "rect", x: 72, y: 160, w: 56, h: 50 },
  calves:    { type: "rect", x: 76, y: 210, w: 48, h: 50 },
  feet:      { type: "rect", x: 76, y: 260, w: 48, h: 12 },
};

export default function BodySilhouetteHighlight({
  highlight_progression = ["head", "neck", "chest", "shoulders", "stomach", "hips", "thighs", "calves", "feet"],
  transition_ms = 3000,
  onComplete,
}) {
  const [idx, setIdx] = useState(0);
  const current = highlight_progression[idx];

  // Quick fix post-SP5 — ref pattern para evitar re-mount del setTimeout
  // cuando el padre PrimitiveSwitcher entrega nueva onComplete cada render.
  const onCompleteRef = useRef(onComplete);
  const transitionMsRef = useRef(transition_ms);
  useEffect(() => { onCompleteRef.current = onComplete; });
  useEffect(() => { transitionMsRef.current = transition_ms; }, [transition_ms]);

  useEffect(() => {
    if (idx >= highlight_progression.length) {
      if (typeof onCompleteRef.current === "function") onCompleteRef.current();
      return undefined;
    }
    const id = setTimeout(() => setIdx((i) => i + 1), transitionMsRef.current);
    return () => clearTimeout(id);
  }, [idx, highlight_progression.length]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: spacing.s16,
      }}
    >
      <svg
        viewBox="0 0 200 290"
        width="200"
        height="290"
        aria-label="Silueta corporal"
        style={{ overflow: "visible" }}
      >
        {Object.entries(ZONE_GEOMETRY).map(([zone, g]) => {
          const isActive = zone === current;
          const fill = isActive ? "rgba(34,211,238,0.2)" : "transparent";
          const stroke = isActive ? ACCENT : "rgba(245,245,247,0.32)";
          const common = { fill, stroke, strokeWidth: 1, strokeLinejoin: "round" };
          if (g.type === "circle") return <circle key={zone} cx={g.cx} cy={g.cy} r={g.r} {...common} />;
          return <rect key={zone} x={g.x} y={g.y} width={g.w} height={g.h} rx={4} {...common} />;
        })}
      </svg>
      <p
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontWeight: typography.weight.regular,
          fontSize: 14,
          color: colors.text.secondary,
          letterSpacing: "0.02em",
        }}
      >
        Atención en {ZONE_LABELS[current] || current}
      </p>
    </div>
  );
}
