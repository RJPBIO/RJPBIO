"use client";
/* ═══════════════════════════════════════════════════════════════
   BIO-SPARKLINE — dataviz con lenguaje de osciloscopio
   ═══════════════════════════════════════════════════════════════
   Lectura tipo instrumento biométrico: línea con glow, gradiente
   de área, pulso en el punto actual, grilla opcional, arrow de
   tendencia y extremos min/max opcionales.

   Props:
   - data: number[]
   - width, height
   - color: trazo principal (default phosphor cyan)
   - showLast: bool (punto brillante en el último valor, con pulso)
   - baseline: number|null (línea punteada horizontal; ej. media)
   - interactive: bool — hover/tap muestra tooltip con valor
   - formatValue: (v, i) => string — label custom en tooltip
   - showGrid: bool — tres rules horizontales sutiles (default false)
   - showExtremes: bool — dots en mín y máx (default false)
   - showTrend: bool — pequeño arrow ascend/desc (default true)
   ═══════════════════════════════════════════════════════════════ */

import { useMemo, useId, useRef, useState, useCallback } from "react";
import { bioSignal } from "../lib/theme";
import { useReducedMotion } from "../lib/a11y";

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

export default function BioSparkline({
  data = [],
  width = 120,
  height = 36,
  color,
  showLast = true,
  baseline = null,
  strokeWidth = 1.5,
  glow = false,
  ariaLabel,
  interactive = true,
  formatValue,
  showGrid = false,
  showExtremes = false,
  showTrend = true,
}) {
  const c = color || bioSignal.phosphorCyan;
  const reactId = useId();
  const glowId = `${reactId}-glow`;
  const areaId = `${reactId}-area`;
  const svgRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(null);
  const reduced = useReducedMotion();

  const { path, pts, bY, lastPt, minPt, maxPt, minIdx, maxIdx } = useMemo(() => {
    if (!data.length) return { path: "", pts: [], bY: null, lastPt: null, minPt: null, maxPt: null, minIdx: -1, maxIdx: -1 };
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
    let mnI = 0, mxI = 0;
    for (let i = 1; i < data.length; i++) {
      if (data[i] < data[mnI]) mnI = i;
      if (data[i] > data[mxI]) mxI = i;
    }
    return {
      path: d,
      pts: coords,
      bY: base,
      lastPt: coords[coords.length - 1],
      minPt: coords[mnI],
      maxPt: coords[mxI],
      minIdx: mnI,
      maxIdx: mxI,
    };
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

  const trend = useMemo(() => {
    if (data.length < 2) return null;
    const first = data[0];
    const last = data[data.length - 1];
    const diff = last - first;
    if (Math.abs(diff) < Math.abs(first) * 0.05) return "estable";
    return diff > 0 ? "ascendente" : "descendente";
  }, [data]);

  const summary = useMemo(() => {
    if (!ariaLabel || !data.length) return undefined;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const avg = data.reduce((a, v) => a + v, 0) / data.length;
    const round = (n) => (Math.abs(n) >= 10 ? Math.round(n) : +n.toFixed(1));
    const parts = [
      `${ariaLabel}`,
      `${data.length} puntos`,
      trend ? `tendencia ${trend}` : null,
      `mín ${round(min)}`,
      `máx ${round(max)}`,
      `promedio ${round(avg)}`,
    ].filter(Boolean);
    return parts.join(". ") + ".";
  }, [ariaLabel, data, trend]);

  if (!data.length) return null;

  const activePt = activeIdx != null ? pts[activeIdx] : null;
  const activeValue = activeIdx != null ? data[activeIdx] : null;
  const tooltipText =
    activeValue != null
      ? (formatValue ? formatValue(activeValue, activeIdx) : String(Math.round(activeValue)))
      : null;

  const trendArrow = showTrend && trend && trend !== "estable" ? (
    <g transform={`translate(${width - 7}, 5)`} opacity="0.55">
      {trend === "ascendente" ? (
        <path d="M0 4 L3 0 L6 4 Z" fill={c} />
      ) : (
        <path d="M0 0 L3 4 L6 0 Z" fill={c} />
      )}
    </g>
  ) : null;

  return (
    <figure role={ariaLabel ? "figure" : "presentation"} aria-label={summary} style={{ position: "relative", display: "inline-block", lineHeight: 0, margin: 0 }}>
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
        <defs>
          <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity="0.28" />
            <stop offset="70%" stopColor={c} stopOpacity="0.05" />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </linearGradient>
          {glow && (
            <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>

        {showGrid && [0.25, 0.5, 0.75].map((frac) => (
          <line
            key={frac}
            x1={0}
            y1={height * frac}
            x2={width}
            y2={height * frac}
            stroke={c}
            strokeWidth="0.4"
            opacity={frac === 0.5 ? 0.14 : 0.07}
            strokeDasharray={frac === 0.5 ? "0" : "1 3"}
          />
        ))}

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
          fill={`url(#${areaId})`}
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

        {showExtremes && minPt && maxPt && minIdx !== maxIdx && (
          <>
            <circle cx={maxPt[0]} cy={maxPt[1]} r="1.6" fill={bioSignal.ignition} opacity="0.85" />
            <circle cx={minPt[0]} cy={minPt[1]} r="1.4" fill={c} opacity="0.55" />
          </>
        )}

        {showLast && lastPt && activeIdx == null && (
          <>
            <circle cx={lastPt[0]} cy={lastPt[1]} r="2.8" fill={c} opacity="0.22" />
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

        {trendArrow}
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
            fontSize: 11,
            fontWeight: 700,
            fontFamily: MONO,
            letterSpacing: -0.1,
            fontVariantNumeric: "tabular-nums",
            padding: "3px 7px",
            borderRadius: 5,
            border: `1px solid ${c}55`,
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
