"use client";
/* ═══════════════════════════════════════════════════════════════
   StreakCalendar — contribution-graph de sesiones.
   Neural-DNA: mono+tabular solo en números, labels sentence case,
   sin corner brackets, sin halos en live-data, sin ▸ glyphs.
   Hoy se marca con outline sólido (no halo).
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { buildStreakCalendar } from "../lib/streakCalendar";
import {
  resolveTheme,
  withAlpha,
  font,
  space,
  radius,
  brand,
  bioSignal,
} from "../lib/theme";

const CELL_SIZE = 12;
const GAP = 3;
const WEEKDAY_LABELS = ["D", "L", "M", "X", "J", "V", "S"];
const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

function monthLabel(date) {
  const s = date.toLocaleDateString("es", { month: "short" }).replace(".", "");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function StreakCalendar({ history, isDark, accent, weeks = 12 }) {
  const { t1, t2, t3, card: cd, border: bd } = resolveTheme(isDark);
  const ac = accent || brand.primary;

  const data = useMemo(
    () => buildStreakCalendar(history || [], { weeks }),
    [history, weeks]
  );

  const palette = useMemo(() => [
    isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
    withAlpha(ac, 22),
    withAlpha(ac, 45),
    withAlpha(ac, 70),
    ac,
  ], [ac, isDark]);

  const todayKey = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  const currentStreak = useMemo(() => {
    const flat = data.weeks.flat().filter((c) => !c.inFuture);
    let run = 0;
    for (let i = flat.length - 1; i >= 0; i--) {
      if (flat[i].count > 0) run += 1;
      else break;
    }
    return run;
  }, [data.weeks]);

  const monthMarkers = useMemo(() => {
    const labels = [];
    let lastMonth = null;
    data.weeks.forEach((w, i) => {
      const first = w[0].date;
      const m = first.getMonth();
      if (m !== lastMonth) {
        labels.push({ idx: i, label: monthLabel(first) });
        lastMonth = m;
      }
    });
    return labels;
  }, [data.weeks]);

  const rule = withAlpha(ac, isDark ? 26 : 20);
  const todayRing = withAlpha(bioSignal.ignition, 90);

  return (
    <article
      aria-label="Calendario de sesiones"
      style={{
        position: "relative",
        padding: space[4],
        background: cd,
        border: `1px solid ${bd}`,
        borderRadius: radius.lg,
        overflow: "hidden",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBlockEnd: space[3],
          gap: space[3],
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: withAlpha(ac, 80),
              letterSpacing: -0.05,
              marginBlockEnd: 2,
            }}
          >
            Últimas{" "}
            <span style={{ fontFamily: MONO, fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>
              {weeks}
            </span>{" "}
            semanas
          </div>
          <h3
            style={{
              fontSize: font.size.md,
              fontWeight: font.weight.bold,
              color: t1,
              margin: 0,
              letterSpacing: -0.2,
            }}
          >
            Tu ignición diaria
          </h3>
        </div>
      </header>

      <div
        role="group"
        aria-label="Resumen de racha"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: space[2],
          marginBlockEnd: space[3],
          paddingBlockEnd: space[3],
          borderBlockEnd: `1px dashed ${rule}`,
        }}
      >
        {[
          { label: "Activos", value: data.activeDays, tone: ac },
          { label: "Mejor", value: data.longestStreak, tone: bioSignal.ignition },
          { label: "Actual", value: currentStreak, tone: currentStreak > 0 ? ac : t3 },
        ].map((stat) => (
          <div key={stat.label} style={{ minInlineSize: 0 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: t3,
                letterSpacing: -0.05,
                marginBlockEnd: 2,
              }}
            >
              {stat.label}
            </div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 22,
                fontWeight: 700,
                color: stat.tone,
                lineHeight: 1,
                letterSpacing: -0.5,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "inline-flex", gap: space[2], minInlineSize: "max-content" }}>
          <div
            aria-hidden
            style={{
              display: "grid",
              gridTemplateRows: `repeat(7, ${CELL_SIZE}px)`,
              gap: GAP,
              paddingBlockStart: 16,
            }}
          >
            {WEEKDAY_LABELS.map((l, i) => (
              <span
                key={i}
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: t3,
                  blockSize: CELL_SIZE,
                  display: "flex",
                  alignItems: "center",
                  inlineSize: 10,
                  letterSpacing: -0.05,
                }}
              >
                {i % 2 === 1 ? l : ""}
              </span>
            ))}
          </div>

          <div>
            <div
              aria-hidden
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${data.weeks.length}, ${CELL_SIZE}px)`,
                gap: GAP,
                blockSize: 14,
                fontSize: 10,
                fontWeight: 600,
                color: t3,
                letterSpacing: -0.05,
              }}
            >
              {data.weeks.map((_, i) => {
                const mk = monthMarkers.find((m) => m.idx === i);
                return (
                  <span key={i} style={{ whiteSpace: "nowrap" }}>
                    {mk ? mk.label : ""}
                  </span>
                );
              })}
            </div>
            <div
              role="grid"
              aria-label="Días con actividad"
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${data.weeks.length}, ${CELL_SIZE}px)`,
                gridAutoFlow: "column",
                gridTemplateRows: `repeat(7, ${CELL_SIZE}px)`,
                gap: GAP,
              }}
            >
              {data.weeks.flat().map((cell) => {
                const color = palette[cell.level] ?? palette[0];
                const isToday = cell.dayKey === todayKey;
                const label = cell.inFuture
                  ? ""
                  : cell.count === 0
                    ? `${cell.dayKey}: sin sesiones${isToday ? " · hoy" : ""}`
                    : `${cell.dayKey}: ${cell.count} ${cell.count === 1 ? "sesión" : "sesiones"}${isToday ? " · hoy" : ""}`;
                return (
                  <div
                    key={cell.dayKey}
                    role="gridcell"
                    aria-label={label}
                    title={label || undefined}
                    style={{
                      position: "relative",
                      inlineSize: CELL_SIZE,
                      blockSize: CELL_SIZE,
                      background: cell.inFuture ? "transparent" : color,
                      borderRadius: 3,
                      border: cell.inFuture
                        ? `1px dashed ${withAlpha(bd, 60)}`
                        : isToday
                          ? `1.5px solid ${todayRing}`
                          : "none",
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <footer
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: space[2],
          marginBlockStart: space[3],
          fontSize: 10,
          fontWeight: 500,
          color: t3,
          letterSpacing: -0.05,
        }}
      >
        <span aria-hidden="true" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              inlineSize: CELL_SIZE,
              blockSize: CELL_SIZE,
              borderRadius: 3,
              border: `1.5px solid ${todayRing}`,
              background: "transparent",
              display: "inline-block",
              boxSizing: "border-box",
            }}
          />
          Hoy
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span>Menos</span>
          {palette.map((c, i) => (
            <span
              key={i}
              aria-hidden
              style={{
                inlineSize: CELL_SIZE,
                blockSize: CELL_SIZE,
                background: c,
                borderRadius: 3,
                display: "inline-block",
              }}
            />
          ))}
          <span>Más</span>
        </span>
      </footer>
    </article>
  );
}
