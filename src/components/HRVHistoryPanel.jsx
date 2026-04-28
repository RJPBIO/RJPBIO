"use client";
/* ═══════════════════════════════════════════════════════════════
   HRV HISTORY PANEL — comparativa de mediciones HRV en el tiempo

   Sprint 74. Antes el user solo veía "última HRV: X ms · hace Yh"
   en el caption del botón quick-action. No había manera de comparar
   evolución, ver tendencia, o validar que sus mediciones persistían.
   Esto es el panel comparativo: stats + sparkline + tabla.

   Datos: hrvLog del store (hasta 365 entradas, ordenadas por ts).
   Cada entry: { ts, rmssd, rhr, meanHR, sdnn, pnn50, sqi, sqiBand,
   source, durationSec }.
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { motion } from "framer-motion";
import Icon from "./Icon";
import { resolveTheme, withAlpha, font, brand } from "../lib/theme";
import { useReducedMotion, useFocusTrap } from "../lib/a11y";

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

function formatRelative(ts) {
  const now = Date.now();
  const ms = now - ts;
  if (ms < 60_000) return "ahora";
  if (ms < 3_600_000) return `hace ${Math.round(ms / 60_000)} min`;
  if (ms < 86_400_000) return `hace ${Math.round(ms / 3_600_000)} h`;
  if (ms < 604_800_000) return `hace ${Math.round(ms / 86_400_000)} d`;
  return new Date(ts).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}

function formatDateTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString("es-MX", {
    day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

function sqiColor(band) {
  if (band === "good" || band === "high") return "#059669";
  if (band === "ok" || band === "medium") return "#D97706";
  return "#DC2626";
}

function sqiLabel(band) {
  if (band === "good" || band === "high") return "buena";
  if (band === "ok" || band === "medium") return "media";
  return "baja";
}

function average(values) {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function sparkline(values, width = 280, height = 60, color = brand.primary) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);
  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" style={{ display: "block" }}>
      <defs>
        <linearGradient id="hrv-spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={`0,${height} ${points.join(" ")} ${width},${height}`}
        fill="url(#hrv-spark-fill)"
        stroke="none"
      />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Último punto destacado */}
      {values.length > 0 && (() => {
        const i = values.length - 1;
        const x = i * stepX;
        const y = height - ((values[i] - min) / range) * height;
        return <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r="3" fill={color} />;
      })()}
    </svg>
  );
}

export default function HRVHistoryPanel({ show, isDark, hrvLog, onClose, onMeasureNew }) {
  const reduced = useReducedMotion();
  const ref = useFocusTrap(show, onClose);
  const { bg, card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);

  const stats = useMemo(() => {
    const log = Array.isArray(hrvLog) ? hrvLog : [];
    const sorted = [...log].sort((a, b) => a.ts - b.ts);
    const now = Date.now();
    const last7d = sorted.filter((e) => now - e.ts < 7 * 86_400_000);
    const prev7d = sorted.filter((e) => {
      const age = now - e.ts;
      return age >= 7 * 86_400_000 && age < 14 * 86_400_000;
    });
    const last = sorted[sorted.length - 1] || null;
    const avg7 = average(last7d.map((e) => e.rmssd).filter((v) => typeof v === "number"));
    const avgPrev7 = average(prev7d.map((e) => e.rmssd).filter((v) => typeof v === "number"));
    const trendDelta = avg7 != null && avgPrev7 != null ? avg7 - avgPrev7 : null;
    const trendDir = trendDelta == null
      ? null
      : Math.abs(trendDelta) < 1.5 ? "estable"
      : trendDelta > 0 ? "mejora"
      : "baja";
    return {
      total: log.length,
      last,
      avg7,
      avg7Count: last7d.length,
      trendDelta,
      trendDir,
      sortedAsc: sorted,
      lastN: sorted.slice(-15).reverse(),
    };
  }, [hrvLog]);

  if (!show) return null;

  const hasData = stats.total > 0;
  const trendColor = stats.trendDir === "mejora" ? "#059669"
                   : stats.trendDir === "baja" ? "#DC2626"
                   : t3;
  const trendArrow = stats.trendDir === "mejora" ? "↑"
                   : stats.trendDir === "baja" ? "↓"
                   : "→";

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label="Historial HRV"
      initial={reduced ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: "fixed",
        inset: 0,
        background: bg,
        zIndex: 220,
        padding: 20,
        overflowY: "auto",
      }}
    >
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBlockEnd: 18 }}>
        <h2 style={{ fontSize: 14, fontWeight: font.weight.black, color: t1, margin: 0, letterSpacing: 0.4 }}>
          HRV · Historial
        </h2>
        <button
          onClick={onClose}
          aria-label="Cerrar historial HRV"
          style={{
            border: "none",
            background: "transparent",
            color: t2,
            padding: 8,
            cursor: "pointer",
          }}
        >
          <Icon name="close" size={20} color={t2} aria-hidden="true" />
        </button>
      </header>

      {!hasData ? (
        <section style={{ maxInlineSize: 420, marginInline: "auto", textAlign: "center", marginBlockStart: 60 }}>
          <Icon name="predict" size={36} color={t3} aria-hidden="true" />
          <h3 style={{ color: t1, fontSize: 17, fontWeight: font.weight.bold, marginBlockStart: 16, marginBlockEnd: 8 }}>
            Aún no tienes mediciones
          </h3>
          <p style={{ color: t2, fontSize: 13, lineHeight: 1.55, marginBlockEnd: 24 }}>
            Mide tu HRV con la cámara durante 60 segundos. Tu primera medición establece la línea base; las siguientes muestran tu evolución.
          </p>
          {onMeasureNew && (
            <button
              onClick={() => { onClose?.(); onMeasureNew(); }}
              style={{
                paddingBlock: 14,
                paddingInline: 28,
                background: brand.primary,
                color: "#fff",
                border: "none",
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: -0.05,
                cursor: "pointer",
              }}
            >
              Medir ahora
            </button>
          )}
        </section>
      ) : (
        <section style={{ maxInlineSize: 540, marginInline: "auto" }}>
          {/* Stats summary */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 10,
              marginBlockEnd: 20,
            }}
          >
            <StatCard
              label="Última"
              value={`${Math.round(stats.last.rmssd)} ms`}
              sub={formatRelative(stats.last.ts)}
              color={brand.primary}
              cd={cd}
              bd={bd}
              t1={t1}
              t3={t3}
            />
            <StatCard
              label="Promedio 7d"
              value={stats.avg7 != null ? `${Math.round(stats.avg7)} ms` : "—"}
              sub={`${stats.avg7Count} ${stats.avg7Count === 1 ? "medición" : "mediciones"}`}
              color={t1}
              cd={cd}
              bd={bd}
              t1={t1}
              t3={t3}
            />
            <StatCard
              label="Tendencia"
              value={stats.trendDir == null ? "—" : `${trendArrow} ${stats.trendDelta > 0 ? "+" : ""}${Math.round(stats.trendDelta)}`}
              sub={stats.trendDir || "Sin datos previos"}
              color={trendColor}
              cd={cd}
              bd={bd}
              t1={t1}
              t3={t3}
            />
          </div>

          {/* Sparkline */}
          {stats.sortedAsc.length >= 2 && (
            <div
              style={{
                background: cd,
                border: `1px solid ${bd}`,
                borderRadius: 14,
                padding: 14,
                marginBlockEnd: 20,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBlockEnd: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: t3, letterSpacing: 1.2, textTransform: "uppercase" }}>
                  RMSSD · {stats.sortedAsc.length} mediciones
                </span>
                <span style={{ fontFamily: MONO, fontSize: 10, color: t3 }}>ms</span>
              </div>
              {sparkline(
                stats.sortedAsc.map((e) => e.rmssd).filter((v) => typeof v === "number"),
                540 - 28, 64, brand.primary
              )}
            </div>
          )}

          {/* Tabla comparativa */}
          <div style={{ marginBlockEnd: 80 }}>
            <span
              style={{
                display: "block",
                fontSize: 10,
                fontWeight: 700,
                color: t3,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                marginBlockEnd: 8,
              }}
            >
              Mediciones recientes
            </span>
            <div role="table" aria-label="Tabla de mediciones HRV" style={{ background: cd, border: `1px solid ${bd}`, borderRadius: 14, overflow: "hidden" }}>
              {/* Header */}
              <div
                role="row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 0.9fr 0.9fr 0.8fr",
                  gap: 8,
                  padding: "10px 12px",
                  background: withAlpha(t1, 4),
                  borderBlockEnd: `1px solid ${bd}`,
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, color: t3, letterSpacing: 0.8, textTransform: "uppercase" }}>Cuándo</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: t3, letterSpacing: 0.8, textTransform: "uppercase", textAlign: "end" }}>RMSSD</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: t3, letterSpacing: 0.8, textTransform: "uppercase", textAlign: "end" }}>RHR</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: t3, letterSpacing: 0.8, textTransform: "uppercase", textAlign: "end" }}>Calidad</span>
              </div>
              {stats.lastN.map((entry, i) => {
                const rhr = entry.rhr ?? (entry.meanHR ? Math.round(entry.meanHR) : null);
                const sqiBand = entry.sqiBand || null;
                return (
                  <div
                    key={`${entry.ts}-${i}`}
                    role="row"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.4fr 0.9fr 0.9fr 0.8fr",
                      gap: 8,
                      padding: "12px",
                      borderBlockEnd: i < stats.lastN.length - 1 ? `1px solid ${withAlpha(t1, 4)}` : "none",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 12, color: t1, fontWeight: 600 }}>
                      {formatDateTime(entry.ts)}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 13, color: t1, fontWeight: 700, textAlign: "end", fontVariantNumeric: "tabular-nums" }}>
                      {entry.rmssd != null ? `${Math.round(entry.rmssd)}` : "—"}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 12, color: t2, textAlign: "end", fontVariantNumeric: "tabular-nums" }}>
                      {rhr != null ? rhr : "—"}
                    </span>
                    <span style={{ textAlign: "end" }}>
                      {sqiBand ? (
                        <span
                          style={{
                            display: "inline-block",
                            paddingBlock: 2,
                            paddingInline: 6,
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: 0.4,
                            color: sqiColor(sqiBand),
                            background: withAlpha(sqiColor(sqiBand), 12),
                          }}
                        >
                          {sqiLabel(sqiBand)}
                        </span>
                      ) : (
                        <span style={{ color: t3, fontSize: 10 }}>—</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
            {stats.total > stats.lastN.length && (
              <p style={{ fontSize: 10, color: t3, textAlign: "center", marginBlockStart: 8 }}>
                Mostrando últimas {stats.lastN.length} de {stats.total} mediciones. El historial completo (hasta 365 entradas) se conserva en tu dispositivo.
              </p>
            )}
          </div>

          {/* CTA pie */}
          {onMeasureNew && (
            <div
              style={{
                position: "fixed",
                insetBlockEnd: 0,
                insetInline: 0,
                padding: "12px 20px 18px",
                background: bg,
                borderBlockStart: `1px solid ${bd}`,
              }}
            >
              <button
                onClick={() => { onClose?.(); onMeasureNew(); }}
                style={{
                  inlineSize: "100%",
                  minBlockSize: 48,
                  paddingBlock: 14,
                  background: brand.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: 14,
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: -0.1,
                  cursor: "pointer",
                }}
              >
                Medir de nuevo
              </button>
            </div>
          )}
        </section>
      )}
    </motion.div>
  );
}

function StatCard({ label, value, sub, color, cd, bd, t1, t3 }) {
  return (
    <div
      style={{
        background: cd,
        border: `1px solid ${bd}`,
        borderRadius: 12,
        padding: "10px 12px",
      }}
    >
      <div style={{ fontSize: 9, fontWeight: 700, color: t3, letterSpacing: 1.2, textTransform: "uppercase", marginBlockEnd: 4 }}>
        {label}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 800, color: color || t1, letterSpacing: -0.5, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: t3, marginBlockStart: 4 }}>
        {sub}
      </div>
    </div>
  );
}
