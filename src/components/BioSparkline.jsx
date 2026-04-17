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
   - interactive: bool — hover/tap muestra tooltip con valor
   - formatValue: (v, i) => string — label custom en tooltip
   ═══════════════════════════════════════════════════════════════ */

import { useMemo, useId, useRef, useState, useCallback } from "react";
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
  interactive = true,
  formatValue,
}) {
  const c = color || bioSignal.phosphorCyan;
  const glowId = useId();
  const svgRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(null);

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

  const nearestIndex = useCallback(
    (clientX) => {
      if (!svgRef.current || pts.length === 0) return null;
      const rect = svgRef.current.getBoundingClientRect();
      const scale = width / rect.width || 1;
      const localX = (clientX - rect.left) * scale;
      let bestI = 0;
      let bestD = Infinity;
      for (let i = 0; i < pts.length; i++) {
        const d = Math.abs(pts[i][0] - localX);
        if (d < bestD) { bestD = d; bestI = i; }
      }
      return bestI;
    },
    [pts, width]
  );

  const handleMove = (e) => {
    const i = nearestIndex(e.clientX);
    if (i !== null) setActiveIdx(i);
  };
  const handleLeave = () => setActiveIdx(null);

  if (!data.length) return null;

  const activePt = activeIdx != null ? pts[activeIdx] : null;
  const activeValue = activeIdx != null ? data[activeIdx] : null;
  const tooltipText =
    activeValue != null
      ? (formatValue ? formatValue(activeValue, activeIdx) : String(Math.round(activeValue)))
      : null;

  const trend = useMemo(() => {
    if (data.length < 2) return null;
    const first = data[0];
    const last = data[data.length - 1];
    const diff = last - first;
    if (Math.abs(diff) < Math.abs(first) * 0.05) return "estable";
    return diff > 0 ? "ascendente" : "descendente";
  }, [data]);

  return (
    <figure role={ariaLabel ? "figure" : "presentation"} aria-label={ariaLabel ? `${ariaLabel}. Tendencia ${trend || "única"}.` : undefined} style={{ position: "relative", display: "inline-block", lineHeight: 0, margin: 0 }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="presentation"
        aria-hidden="true"
        style={{ display: "block", overflow: "visible", touchAction: interactive ? "none" : undefined, cursor: interactive ? "crosshair" : undefined }}
        onPointerMove={interactive ? handleMove : undefined}
        onPointerDown={interactive ? handleMove : undefined}
        onPointerLeave={interactive ? handleLeave : undefined}
        onPointerCancel={interactive ? handleLeave : undefined}
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

        <path
          d={`${path} L${width},${height} L0,${height} Z`}
          fill={c}
          opacity="0.08"
        />

        <path
          d={path}
          fill="none"
          stroke={c}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={glow ? `url(#${glowId})` : undefined}
        />

        {showLast && lastPt && activeIdx == null && (
          <>
            <circle cx={lastPt[0]} cy={lastPt[1]} r="3.5" fill={c} opacity="0.25" />
            <circle cx={lastPt[0]} cy={lastPt[1]} r="1.8" fill={bioSignal.ignition} />
          </>
        )}

        {activePt && (
          <>
            <line
              x1={activePt[0]}
              y1={0}
              x2={activePt[0]}
              y2={height}
              stroke={c}
              strokeWidth="0.6"
              strokeDasharray="2 2"
              opacity="0.5"
            />
            <circle cx={activePt[0]} cy={activePt[1]} r="4" fill={c} opacity="0.22" />
            <circle cx={activePt[0]} cy={activePt[1]} r="2.2" fill={bioSignal.ignition} />
          </>
        )}
      </svg>

      {activePt && tooltipText != null && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "absolute",
            left: `${(activePt[0] / width) * 100}%`,
            top: -6,
            transform: "translate(-50%, -100%)",
            pointerEvents: "none",
            background: "rgba(13,17,23,0.94)",
            color: "#E8ECF4",
            fontSize: 10,
            fontWeight: 700,
            fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
            letterSpacing: 0.5,
            padding: "3px 6px",
            borderRadius: 4,
            border: `1px solid ${c}55`,
            boxShadow: `0 4px 14px -4px ${c}`,
            whiteSpace: "nowrap",
            zIndex: 2,
          }}
        >
          {tooltipText}
        </div>
      )}
    </figure>
  );
}
