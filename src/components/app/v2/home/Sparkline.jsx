"use client";
/* ═══════════════════════════════════════════════════════════════
   Sparkline — Phase Polish-Tier-2 Gap-4
   ═══════════════════════════════════════════════════════════════
   Custom SVG sparkline minimalista. Sin third-party lib.
   Pattern reuse Apple Health Heart trends (single-line trend
   visualization). Stroke cyan canónico + soft fill area.

   Uso: pasarle `data: [{ value, ts }, ...]` (mínimo 2 puntos
   válidos para render). Min-max scaling automático sobre el
   range de valores recibidos. NO escala global del 0-100; usa
   el rango propio para preservar variación visible aunque los
   valores estén comprimidos en una banda chica.

   Reduced-motion: omite el fade-in animation (a11y).

   API:
     <Sparkline data={[{ value: 65, ts: 123 }, ...]}
                width={120} height={20}
                ariaLabel="Tendencia bio últimos 14 días" />
   ═══════════════════════════════════════════════════════════════ */
import { useMemo } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { colors, easing } from "../tokens";

const MIN_POINTS = 2;

export default function Sparkline({
  data,
  width = 120,
  height = 20,
  strokeColor,
  fillColor,
  showDots = false,
  ariaLabel,
  testid,
}) {
  const reduce = useReducedMotion();

  const computed = useMemo(() => {
    if (!Array.isArray(data) || data.length < MIN_POINTS) return null;
    const values = data
      .map((d) => (typeof d?.value === "number" && Number.isFinite(d.value) ? d.value : null))
      .filter((v) => v !== null);
    if (values.length < MIN_POINTS) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    // Si min===max → flat line al medio (evita div by 0 + sparkline plana
    // visible no colapsada en height=0).
    const range = max - min || 1;
    const flat = max === min;
    const points = values.map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = flat ? height / 2 : height - ((v - min) / range) * height;
      return { x: +x.toFixed(2), y: +y.toFixed(2), value: v };
    });
    const linePath = `M ${points.map((p) => `${p.x},${p.y}`).join(" L ")}`;
    const fillPath = `${linePath} L ${width.toFixed(2)},${height.toFixed(2)} L 0,${height.toFixed(2)} Z`;
    return { points, linePath, fillPath };
  }, [data, width, height]);

  if (!computed) return null;

  const stroke = strokeColor || colors.accent.phosphorCyan;
  // 10% alpha helper sin importar withAlpha (mantenemos fichero ligero).
  const fill = fillColor || `rgba(${colors.accent.phosphorCyanRgb},0.12)`;

  return (
    <svg
      data-v2-sparkline
      data-testid={testid || "sparkline"}
      role="img"
      aria-label={ariaLabel || "Tendencia"}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        animation: reduce
          ? "none"
          : `bi-sparkline-fade-in 600ms ${easing.spring} 200ms both`,
      }}
    >
      <path d={computed.fillPath} fill={fill} />
      <path
        d={computed.linePath}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDots && computed.points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={1.5} fill={stroke} />
      ))}
      <style jsx global>{`
        @keyframes bi-sparkline-fade-in {
          from { opacity: 0; transform: translateY(2px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </svg>
  );
}
