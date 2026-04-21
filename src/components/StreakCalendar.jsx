"use client";
/* ═══════════════════════════════════════════════════════════════
   StreakCalendar — contribution-graph de sesiones con identidad
   BIO-IGNICIÓN: corner brackets, hoy marcado, cola de racha
   con halo y estadísticas monumentales en mono blueprint.

   Lógica pura en `buildStreakCalendar`. Este componente sólo
   renderiza y añade la capa de identidad.
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
  return date.toLocaleDateString("es", { month: "short" }).replace(".", "").toUpperCase();
}

function CornerBrackets({ color }) {
  const L = 10;
  const sw = 1;
  const common = {
    position: "absolute",
    inlineSize: L,
    blockSize: L,
    pointerEvents: "none",
  };
  return (
    <>
      <span aria-hidden="true" style={{ ...common, insetInlineStart: 6, insetBlockStart: 6, borderInlineStart: `${sw}px solid ${color}`, borderBlockStart: `${sw}px solid ${color}` }} />
      <span aria-hidden="true" style={{ ...common, insetInlineEnd: 6, insetBlockStart: 6, borderInlineEnd: `${sw}px solid ${color}`, borderBlockStart: `${sw}px solid ${color}` }} />
      <span aria-hidden="true" style={{ ...common, insetInlineStart: 6, insetBlockEnd: 6, borderInlineStart: `${sw}px solid ${color}`, borderBlockEnd: `${sw}px solid ${color}` }} />
      <span aria-hidden="true" style={{ ...common, insetInlineEnd: 6, insetBlockEnd: 6, borderInlineEnd: `${sw}px solid ${color}`, borderBlockEnd: `${sw}px solid ${color}` }} />
    </>
  );
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

  const streakTailKeys = useMemo(() => {
    if (currentStreak <= 0) return new Set();
    const flat = data.weeks.flat().filter((c) => !c.inFuture);
    const tail = flat.slice(-currentStreak).map((c) => c.dayKey);
    return new Set(tail);
  }, [currentStreak, data.weeks]);

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

  const cornerStroke = withAlpha(ac, isDark ? 38 : 30);
  const rule = withAlpha(ac, isDark ? 26 : 20);
  const haloIgnition = withAlpha(bioSignal.ignition, 90);

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
      <CornerBrackets color={cornerStroke} />

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
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: 2,
              color: withAlpha(ac, 80),
              textTransform: "uppercase",
              marginBlockEnd: 2,
            }}
          >
            ▸ Calendario · Últimas {weeks} semanas
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
                fontFamily: MONO,
                fontSize: 9,
                letterSpacing: 2,
                color: t3,
                textTransform: "uppercase",
                marginBlockEnd: 2,
              }}
            >
              ▸ {stat.label}
            </div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 22,
                fontWeight: 700,
                color: stat.tone,
                lineHeight: 1,
                letterSpacing: -0.5,
                textShadow: stat.value > 0 ? `0 0 12px ${withAlpha(stat.tone, 30)}` : "none",
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
                  fontFamily: MONO,
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
                fontFamily: MONO,
                fontSize: 9,
                letterSpacing: 1,
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
                const isToday = cell.dayKey === todayKey;
                const isTail = streakTailKeys.has(cell.dayKey);
                const label = cell.inFuture
                  ? ""
                  : cell.count === 0
                    ? `${cell.dayKey}: sin sesiones${isToday ? " · hoy" : ""}`
                    : `${cell.dayKey}: ${cell.count} ${cell.count === 1 ? "sesión" : "sesiones"}${isToday ? " · hoy" : ""}`;
                let boxShadow = "none";
                if (isToday) {
                  boxShadow = `0 0 0 1.5px ${withAlpha(haloIgnition, 100)}, 0 0 10px ${withAlpha(bioSignal.ignition, 45)}`;
                } else if (isTail) {
                  boxShadow = `0 0 6px ${withAlpha(ac, 55)}`;
                }
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
                      border: cell.inFuture ? `1px dashed ${withAlpha(bd, 60)}` : "none",
                      boxShadow,
                      transition: "box-shadow 200ms ease",
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
          fontFamily: MONO,
          fontSize: 9,
          letterSpacing: 1.5,
          color: t3,
          textTransform: "uppercase",
        }}
      >
        <span aria-hidden="true" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              inlineSize: CELL_SIZE,
              blockSize: CELL_SIZE,
              borderRadius: 3,
              boxShadow: `0 0 0 1.5px ${haloIgnition}, 0 0 8px ${withAlpha(bioSignal.ignition, 40)}`,
              background: "transparent",
              display: "inline-block",
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
