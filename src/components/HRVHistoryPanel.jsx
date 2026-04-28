"use client";
/* ═══════════════════════════════════════════════════════════════
   HRV HISTORY PANEL — Sprint 74→75 (production polish a 10/10)

   Stats + sparkline + tabla agrupada por día + vínculo con sesiones
   + baseline ±SD + export CSV. Toda la lógica vive en lib/hrvStats.js
   (puro, testable). Este componente es PRESENTACIONAL.

   Nuevo en Sprint 75:
   · Tendencia con min N=3 en cada bucket de 7d (antes ruido con n=1)
   · Mediciones agrupadas por día con headers Hoy/Ayer/fecha
   · Cada fila vinculada con la sesión más cercana → badge "post-Reset
     Ejecutivo" — diferenciador único vs Calm/Headspace
   · Personal baseline ±SD line en sparkline
   · Export CSV botón en header
   · Responsive sparkline (viewBox + preserveAspectRatio)
   · Safe-area inset para sticky footer en iPhone notch
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { motion } from "framer-motion";
import Icon from "./Icon";
import IllustratedEmpty from "./IllustratedEmpty";
import { resolveTheme, withAlpha, font, brand } from "../lib/theme";
import { useReducedMotion, useFocusTrap } from "../lib/a11y";
import {
  computeHrvStats,
  groupByDay,
  findSessionContext,
  buildBaseline,
  relativeTime,
  toCSV,
} from "../lib/hrvStats";

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

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
function fmtDateTime(ts) {
  return new Date(ts).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

// SVG sparkline responsive (viewBox + 100% width). Si baseline existe,
// dibuja una línea horizontal sutil con la media + banda ±SD.
function Sparkline({ values, baseline, color = brand.primary }) {
  if (!Array.isArray(values) || values.length < 2) return null;
  const W = 1000; // viewBox virtual (cualquier ancho real escala)
  const H = 120;
  const max = Math.max(...values, baseline ? baseline.mean + (baseline.sd || 0) * 2 : -Infinity);
  const min = Math.min(...values, baseline ? baseline.mean - (baseline.sd || 0) * 2 : Infinity);
  const range = max - min || 1;
  const stepX = W / (values.length - 1);
  const yOf = (v) => H - ((v - min) / range) * H;
  const points = values.map((v, i) => `${(i * stepX).toFixed(1)},${yOf(v).toFixed(1)}`);

  const blMeanY = baseline ? yOf(baseline.mean) : null;
  const blPlusY = baseline ? yOf(baseline.mean + baseline.sd) : null;
  const blMinusY = baseline ? yOf(baseline.mean - baseline.sd) : null;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      width="100%"
      height="64"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="hrv-spark-fill-v2" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Baseline ± SD band (si hay) */}
      {baseline && blPlusY != null && blMinusY != null && (
        <rect
          x="0"
          y={blPlusY}
          width={W}
          height={Math.max(0, blMinusY - blPlusY)}
          fill={withAlpha(color, 6)}
        />
      )}
      {baseline && blMeanY != null && (
        <line
          x1="0"
          x2={W}
          y1={blMeanY}
          y2={blMeanY}
          stroke={color}
          strokeWidth="0.8"
          strokeDasharray="4 4"
          opacity="0.45"
        />
      )}
      {/* Fill bajo la línea */}
      <polyline
        points={`0,${H} ${points.join(" ")} ${W},${H}`}
        fill="url(#hrv-spark-fill-v2)"
        stroke="none"
      />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Último punto */}
      {(() => {
        const i = values.length - 1;
        const x = i * stepX;
        const y = yOf(values[i]);
        return <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r="6" fill={color} />;
      })()}
    </svg>
  );
}

function downloadCSV(filename, csv) {
  if (typeof window === "undefined") return;
  try {
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    // Silent fail — botón de export es opcional.
  }
}

export default function HRVHistoryPanel({
  show,
  isDark,
  hrvLog,
  history,
  onClose,
  onMeasureNew,
}) {
  const reduced = useReducedMotion();
  const ref = useFocusTrap(show, onClose);
  const { bg, card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);

  const stats = useMemo(() => computeHrvStats(hrvLog), [hrvLog]);
  const baseline = useMemo(() => buildBaseline(hrvLog), [hrvLog]);
  const grouped = useMemo(() => {
    if (!Array.isArray(hrvLog)) return [];
    return groupByDay(hrvLog).slice(0, 14); // últimos 14 días con mediciones
  }, [hrvLog]);

  if (!show) return null;

  const hasData = stats.total > 0;
  const trendColor =
    stats.trendDir === "mejora" ? "#059669"
    : stats.trendDir === "baja" ? "#DC2626"
    : t3;
  const trendArrow =
    stats.trendDir === "mejora" ? "↑"
    : stats.trendDir === "baja" ? "↓"
    : stats.trendDir === "estable" ? "→"
    : "·";
  const trendValue =
    stats.trendDir == null
      ? "—"
      : stats.trendDelta == null
      ? trendArrow
      : `${trendArrow} ${stats.trendDelta > 0 ? "+" : ""}${Math.round(stats.trendDelta)}`;
  const trendSub =
    stats.trendDir
      ? stats.trendDir + " · " + (stats.trendDelta != null ? "vs 7d previos" : "")
      : stats.trendReason === "insufficient_recent"
      ? `Necesita ≥3 mediciones en últimos 7d (tienes ${stats.avg7Count})`
      : stats.trendReason === "insufficient_baseline"
      ? `Necesita ≥3 mediciones en 7d previos (tienes ${stats.avgPrev7Count})`
      : "Sin datos suficientes";

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
        padding: "20px 20px 100px",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBlockEnd: 18, gap: 8 }}>
        <h2 style={{ fontSize: 14, fontWeight: font.weight.black, color: t1, margin: 0, letterSpacing: 0.4 }}>
          HRV · Historial
        </h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {hasData && (
            <button
              type="button"
              onClick={() => downloadCSV(`bio-hrv-${new Date().toISOString().split("T")[0]}.csv`, toCSV(stats.sortedAsc))}
              aria-label="Exportar historial como CSV"
              style={{
                background: "transparent",
                color: t2,
                border: `1px solid ${bd}`,
                borderRadius: 8,
                paddingBlock: 6,
                paddingInline: 10,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.6,
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              CSV
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Cerrar historial HRV"
            style={{ border: "none", background: "transparent", color: t2, padding: 8, cursor: "pointer", minInlineSize: 44, minBlockSize: 44, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
          >
            <Icon name="close" size={20} color={t2} aria-hidden="true" />
          </button>
        </div>
      </header>

      {!hasData ? (
        <section style={{ maxInlineSize: 420, marginInline: "auto", marginBlockStart: 32 }}>
          {/* Sprint 89 — refactor a IllustratedEmpty para Apple-grade
              empty state. Antes: Icon plano + texto. Ahora: ilustración
              SignalField animada (wave + spark moving) que comunica
              visualmente "señal en espera". */}
          <IllustratedEmpty
            illustration="signal"
            title="Aún no tienes mediciones"
            body="Mide tu HRV con la cámara durante 60 segundos. Tu primera medición establece la línea base; las siguientes muestran tu evolución."
            actionLabel={onMeasureNew ? "Medir ahora" : undefined}
            action={onMeasureNew ? () => { onClose?.(); onMeasureNew(); } : undefined}
            textPrimary={t1}
            textMuted={t2}
          />
        </section>
      ) : (
        <section style={{ maxInlineSize: 540, marginInline: "auto" }}>
          {/* Stats summary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBlockEnd: 18 }}>
            <StatCard
              label="Última"
              value={`${Math.round(stats.last.rmssd)} ms`}
              sub={relativeTime(stats.last.ts)}
              color={brand.primary}
              cd={cd} bd={bd} t1={t1} t3={t3}
            />
            <StatCard
              label="Promedio 7d"
              value={stats.avg7 != null ? `${Math.round(stats.avg7)} ms` : "—"}
              sub={`${stats.avg7Count} ${stats.avg7Count === 1 ? "medición" : "mediciones"}`}
              color={t1}
              cd={cd} bd={bd} t1={t1} t3={t3}
            />
            <StatCard
              label="Tendencia"
              value={trendValue}
              sub={trendSub}
              color={trendColor}
              cd={cd} bd={bd} t1={t1} t3={t3}
            />
          </div>

          {/* Baseline si hay */}
          {baseline && (
            <div
              style={{
                background: cd,
                border: `1px solid ${bd}`,
                borderRadius: 12,
                padding: "10px 12px",
                marginBlockEnd: 14,
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: t3, letterSpacing: 1.2, textTransform: "uppercase", marginBlockEnd: 2 }}>
                  Tu baseline · {baseline.days}d
                </div>
                <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: t1, fontVariantNumeric: "tabular-nums" }}>
                  {Math.round(baseline.mean)} ms · ±{Math.round(baseline.sd)}
                </div>
              </div>
              <div style={{ fontSize: 10, color: t3, textAlign: "end", lineHeight: 1.4 }}>
                {baseline.n} mediciones<br />n=últimos {baseline.days}d
              </div>
            </div>
          )}

          {/* Sparkline */}
          {stats.sortedAsc.length >= 2 && (
            <div style={{ background: cd, border: `1px solid ${bd}`, borderRadius: 14, padding: 14, marginBlockEnd: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBlockEnd: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: t3, letterSpacing: 1.2, textTransform: "uppercase" }}>
                  RMSSD · {stats.sortedAsc.length} mediciones
                </span>
                <span style={{ fontFamily: MONO, fontSize: 10, color: t3 }}>ms</span>
              </div>
              <Sparkline
                values={stats.sortedAsc.map((e) => e.rmssd).filter((v) => typeof v === "number")}
                baseline={baseline}
                color={brand.primary}
              />
              {baseline && (
                <p style={{ fontSize: 9, color: t3, marginBlockStart: 6, lineHeight: 1.4 }}>
                  Línea punteada y banda: tu baseline ±SD ({Math.round(baseline.mean)} ms ±{Math.round(baseline.sd)}). Variabilidad fuera de la banda merece atención.
                </p>
              )}
            </div>
          )}

          {/* Tabla agrupada por día */}
          <div style={{ marginBlockEnd: 30 }}>
            <span style={{ display: "block", fontSize: 10, fontWeight: 700, color: t3, letterSpacing: 1.2, textTransform: "uppercase", marginBlockEnd: 10 }}>
              Mediciones por día
            </span>
            {grouped.map((group) => (
              <DayGroup
                key={group.key}
                group={group}
                history={history}
                cd={cd}
                bd={bd}
                t1={t1}
                t2={t2}
                t3={t3}
              />
            ))}
            {stats.total > grouped.reduce((a, g) => a + g.entries.length, 0) && (
              <p style={{ fontSize: 10, color: t3, textAlign: "center", marginBlockStart: 8 }}>
                Mostrando {grouped.length} días con mediciones. El historial completo (hasta 365 entradas) se conserva en tu dispositivo.
              </p>
            )}
          </div>

          {/* CTA sticky con safe-area-inset para iPhone */}
          {onMeasureNew && (
            <div
              style={{
                position: "fixed",
                insetBlockEnd: 0,
                insetInline: 0,
                padding: "12px 20px max(18px, env(safe-area-inset-bottom))",
                background: bg,
                borderBlockStart: `1px solid ${bd}`,
                zIndex: 5,
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
    <div style={{ background: cd, border: `1px solid ${bd}`, borderRadius: 12, padding: "10px 12px" }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: t3, letterSpacing: 1.2, textTransform: "uppercase", marginBlockEnd: 4 }}>
        {label}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 800, color: color || t1, letterSpacing: -0.5, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: t3, marginBlockStart: 4, lineHeight: 1.3 }}>
        {sub}
      </div>
    </div>
  );
}

function DayGroup({ group, history, cd, bd, t1, t2, t3 }) {
  return (
    <section style={{ marginBlockEnd: 14 }}>
      <h3
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: t2,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          marginBlockEnd: 6,
          paddingInlineStart: 4,
        }}
      >
        {group.label}
        <span style={{ marginInlineStart: 8, fontWeight: 600, color: t3 }}>
          {group.entries.length} {group.entries.length === 1 ? "medición" : "mediciones"}
        </span>
      </h3>
      <div style={{ background: cd, border: `1px solid ${bd}`, borderRadius: 12, overflow: "hidden" }}>
        {group.entries.map((entry, i) => (
          <HrvRow
            key={`${entry.ts}-${i}`}
            entry={entry}
            history={history}
            isLast={i === group.entries.length - 1}
            t1={t1}
            t2={t2}
            t3={t3}
          />
        ))}
      </div>
    </section>
  );
}

function HrvRow({ entry, history, isLast, t1, t2, t3 }) {
  const ctx = useMemo(() => findSessionContext(entry, history), [entry, history]);
  const rhr = entry.rhr ?? (typeof entry.meanHR === "number" ? Math.round(entry.meanHR) : null);
  const sqiBand = entry.sqiBand || null;

  return (
    <div
      role="row"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto auto",
        gap: 10,
        padding: "10px 12px",
        borderBlockEnd: isLast ? "none" : `1px solid ${withAlpha(t1, 4)}`,
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minInlineSize: 0 }}>
        <span style={{ fontSize: 12, color: t1, fontWeight: 600, fontFamily: MONO, fontVariantNumeric: "tabular-nums" }}>
          {fmtDateTime(entry.ts)}
        </span>
        {ctx.protocol && (
          <span
            title={`${ctx.phase === "post" ? "post-" : "pre-"}${ctx.protocol}`}
            style={{
              fontSize: 10,
              color: ctx.phase === "post" ? "#059669" : "#6366F1",
              fontWeight: 700,
              letterSpacing: 0.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {ctx.phase === "post" ? "↑ post" : "↓ pre"} · {ctx.protocol}
          </span>
        )}
      </div>
      <div style={{ textAlign: "end" }}>
        <div style={{ fontFamily: MONO, fontSize: 13, color: t1, fontWeight: 800, fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>
          {entry.rmssd != null ? `${Math.round(entry.rmssd)}` : "—"}
          <span style={{ fontSize: 9, color: t3, marginInlineStart: 2 }}>ms</span>
        </div>
        {rhr != null && (
          <div style={{ fontFamily: MONO, fontSize: 10, color: t2, marginBlockStart: 2 }}>
            {rhr} bpm
          </div>
        )}
      </div>
      <div style={{ minInlineSize: 50, textAlign: "end" }}>
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
      </div>
    </div>
  );
}
