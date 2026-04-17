"use client";
/* ═══════════════════════════════════════════════════════════════
   BIO-SPARKLINE — dataviz con lenguaje de osciloscopio
   ═══════════════════════════════════════════════════════════════
   Sustituye sparklines genéricas por una lectura tipo instrumento
   biométrico: línea con glow, puntos-señal en extremos/actuales,
   línea base discreta. Identidad de firma visual para HRV, mood
   log, weekly data, cualquier serie temporal pequeña.

   Props:
   - data: number[]
   - width, height
   - color: trazo principal (default phosphor cyan)
   - showLast: bool (punto brillante en el último valor)
   - baseline: number|null (línea punteada horizontal; ej. media)
   ═══════════════════════════════════════════════════════════════ */

import { useMemo, useId } from "react";
import { bioSignal } from "../lib/theme";

export default function BioSparkline({
  data = [],
  width = 120,
  height = 36,
  color,
  showLast = true,
  baseline = null,
  strokeWidth = 1.5,
  glow = true,
  ariaLabel,
}) {
  const c = color || bioSignal.phosphorCyan;
  const glowId = useId();

  const { path, pts, bY, lastPt } = useMemo(() => {
    if (!data.length) return { path: "", pts: [], bY: null, lastPt: null };
    const n = data.length;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padY = 3;
    const usableH = height - padY * 2;
    const toXY = (v, i) => {
      const x = (i / (n - 1 || 1)) * width;
      const y = padY + usableH - ((v - min) / range) * usableH;
      return [x, y];
    };
    const coords = data.map(toXY);
    const d =
      coords
        .map(([x, y], i) => {
          if (i === 0) return `M${x.toFixed(1)},${y.toFixed(1)}`;
          // Catmull-Rom-ish smoothing for organic feel
          const [px, py] = coords[i - 1];
          const cx = (px + x) / 2;
          return `Q${cx.toFixed(1)},${py.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");
    const base =
      baseline != null
        ? padY + usableH - ((baseline - min) / range) * usableH
        : null;
    return { path: d, pts: coords, bY: base, lastPt: coords[coords.length - 1] };
  }, [data, width, height, baseline]);

  if (!data.length) return null;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role={ariaLabel ? "img" : "presentation"}
      aria-label={ariaLabel}
      style={{ display: "block", overflow: "visible" }}
    >
      {glow && (
        <defs>
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}

      {/* Línea base (mitad inferior, opcional) */}
      {bY != null && (
        <line
          x1={0}
          y1={bY}
          x2={width}
          y2={bY}
          stroke={c}
          strokeWidth="0.5"
          strokeDasharray="2 3"
          opacity="0.35"
        />
      )}

      {/* Área bajo la curva — glow plasma sutil */}
      <path
        d={`${path} L${width},${height} L0,${height} Z`}
        fill={c}
        opacity="0.08"
      />

      {/* Trazo principal */}
      <path
        d={path}
        fill="none"
        stroke={c}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={glow ? `url(#${glowId})` : undefined}
      />

      {/* Punto-señal en el último valor */}
      {showLast && lastPt && (
        <>
          <circle cx={lastPt[0]} cy={lastPt[1]} r="3.5" fill={c} opacity="0.25" />
          <circle cx={lastPt[0]} cy={lastPt[1]} r="1.8" fill={bioSignal.ignition} />
        </>
      )}
    </svg>
  );
}
