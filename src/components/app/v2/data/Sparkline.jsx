"use client";
import { useId } from "react";

// Sparkline SVG inline. Sin fill, sin gradient, sin glow.
// stroke + opcionalmente 2 markers (mejor / peor dia).
// Domain auto: min/max del dataset con padding 5% vertical.

export default function Sparkline({
  data = [],            // [{ ts, value }]
  width = 320,
  height = 120,
  strokeColor = "#22D3EE",
  strokeWidth = 1.5,
  showMarkers = false,  // markers en best/worst
  ariaLabel,
}) {
  const id = useId();
  if (!Array.isArray(data) || data.length < 2) {
    return (
      <svg
        role="img"
        aria-label={ariaLabel || "sparkline"}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
      />
    );
  }
  const values = data.map(d => Number(d.value) || 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const padY = range * 0.08;
  const yMin = min - padY;
  const yMax = max + padY;
  const yRange = Math.max(1, yMax - yMin);

  const stepX = width / Math.max(1, data.length - 1);
  const points = data.map((d, i) => {
    const x = i * stepX;
    const y = height - ((Number(d.value) - yMin) / yRange) * height;
    return [x, y];
  });

  const pathD = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");

  let bestIdx = 0;
  let worstIdx = 0;
  values.forEach((v, i) => {
    if (v > values[bestIdx]) bestIdx = i;
    if (v < values[worstIdx]) worstIdx = i;
  });
  const markers = showMarkers
    ? [
        { idx: bestIdx,  color: strokeColor },
        { idx: worstIdx, color: "rgba(255,255,255,0.32)" },
      ]
    : [];

  return (
    <svg
      role="img"
      aria-label={ariaLabel || "sparkline"}
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      style={{ display: "block" }}
    >
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {markers.map((m, i) => {
        const [x, y] = points[m.idx];
        return (
          <circle
            key={`m${id}${i}`}
            cx={x}
            cy={y}
            r={4}
            fill={m.color}
          />
        );
      })}
    </svg>
  );
}
