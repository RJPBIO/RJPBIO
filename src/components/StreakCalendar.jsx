"use client";
/* ═══════════════════════════════════════════════════════════════
   StreakCalendar — contribution-graph de sesiones para visualizar
   la racha. Cada celda es un día, el color escala con el conteo.

   Construye la rejilla con `buildStreakCalendar` (puro, testeado)
   y se ocupa solo del render. Lee `st.history`.
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { buildStreakCalendar } from "../lib/streakCalendar";
import { resolveTheme, withAlpha, font, space, radius } from "../lib/theme";

const CELL_SIZE = 12;
const GAP = 3;
const WEEKDAY_LABELS = ["D", "L", "M", "X", "J", "V", "S"];

function monthLabel(date) {
  return date.toLocaleDateString("es", { month: "short" }).replace(".", "");
}

export default function StreakCalendar({ history, isDark, accent, weeks = 12 }) {
  const { t1, t2, t3, card: cd, border: bd } = resolveTheme(isDark);
  const data = useMemo(
    () => buildStreakCalendar(history || [], { weeks }),
    [history, weeks]
  );

  const palette = useMemo(() => [
    // nivel 0: celda vacía
    isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
    withAlpha(accent, 22),
    withAlpha(accent, 45),
    withAlpha(accent, 70),
    accent,
  ], [accent, isDark]);

  // Etiquetas de mes: sólo la primera semana que cambia de mes.
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

  return (
    <article
      aria-label="Calendario de sesiones"
      style={{
        padding: space[4],
        background: cd,
        border: `1px solid ${bd}`,
        borderRadius: radius.lg,
        overflowX: "auto",
      }}
    >
      <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBlockEnd: space[3], gap: space[3] }}>
        <div>
          <h3 style={{ fontSize: font.size.md, fontWeight: font.weight.bold, color: t1, margin: 0 }}>
            Tus últimas {weeks} semanas
          </h3>
          <p style={{ fontSize: font.size.sm, color: t2, margin: 0, marginBlockStart: 2 }}>
            {data.activeDays} días con sesión · racha más larga {data.longestStreak} días
          </p>
        </div>
      </header>

      <div style={{ display: "inline-flex", gap: space[2], minInlineSize: "max-content" }}>
        <div aria-hidden style={{ display: "grid", gridTemplateRows: `repeat(7, ${CELL_SIZE}px)`, gap: GAP, paddingBlockStart: 16 }}>
          {WEEKDAY_LABELS.map((l, i) => (
            <span
              key={i}
              style={{
                fontSize: 9,
                color: t3,
                blockSize: CELL_SIZE,
                display: "flex",
                alignItems: "center",
                inlineSize: 10,
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
              fontSize: 9,
              color: t3,
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
              const label = cell.inFuture
                ? ""
                : cell.count === 0
                  ? `${cell.dayKey}: sin sesiones`
                  : `${cell.dayKey}: ${cell.count} ${cell.count === 1 ? "sesión" : "sesiones"}`;
              return (
                <div
                  key={cell.dayKey}
                  role="gridcell"
                  aria-label={label}
                  title={label || undefined}
                  style={{
                    inlineSize: CELL_SIZE,
                    blockSize: CELL_SIZE,
                    background: cell.inFuture ? "transparent" : color,
                    borderRadius: 3,
                    border: cell.inFuture ? `1px dashed ${bd}` : "none",
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      <footer style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: space[2], marginBlockStart: space[3], fontSize: 9, color: t3 }}>
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
      </footer>
    </article>
  );
}
