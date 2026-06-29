"use client";
/* ═══════════════════════════════════════════════════════════════
   ConsistencyHeatmap — mapa de consistencia estilo contribution-graph.
   ───────────────────────────────────────────────────────────────
   Hace tangible "la consistencia es el filtro": una celda por día de
   las últimas N semanas, intensidad phosphorCyan según sesiones ese
   día (nivel 0-4 de lib/streakCalendar.buildStreakCalendar). Sin
   emojis; grid responsive full-width (semanas = columnas, 7 filas).
   ═══════════════════════════════════════════════════════════════ */
import { buildStreakCalendar } from "@/lib/streakCalendar";
import { colors, typography, spacing } from "../tokens";

const WEEKS = 12;
const GAP = 3;

// nivel 0-4 → color de celda. phosphorCyan (#22D3EE = rgb 34,211,238) con
// alpha creciente; vacío = blanco muy tenue; futuro = casi invisible.
function cellColor(level, inFuture) {
  if (inFuture) return "rgba(255,255,255,0.02)";
  switch (level) {
    case 1: return "rgba(34,211,238,0.30)";
    case 2: return "rgba(34,211,238,0.52)";
    case 3: return "rgba(34,211,238,0.74)";
    case 4: return colors.accent.phosphorCyan;
    default: return "rgba(255,255,255,0.05)";
  }
}

export default function ConsistencyHeatmap({ history }) {
  const cal = buildStreakCalendar(Array.isArray(history) ? history : [], { weeks: WEEKS });
  // Sin actividad → no renderizar (DATOS ya muestra empty-state arriba).
  if (!cal || !Array.isArray(cal.weeks) || cal.total < 1) return null;

  const cells = [];
  cal.weeks.forEach((week, wi) => {
    week.forEach((day, di) => {
      cells.push(
        <span
          key={`${wi}-${di}`}
          title={`${day.dayKey} · ${day.count} ${day.count === 1 ? "sesión" : "sesiones"}`}
          aria-hidden="true"
          style={{
            background: cellColor(day.level, day.inFuture),
            borderRadius: 2,
            aspectRatio: "1 / 1",
            width: "100%",
          }}
        />
      );
    });
  });

  const eyebrow = {
    fontFamily: typography.familyMono,
    fontSize: typography.size.microCaps,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.55)",
    fontWeight: typography.weight.medium,
  };

  return (
    <section
      data-v2-consistency-heatmap
      style={{
        paddingInline: spacing.s24,
        paddingBlockStart: spacing.s48,
        paddingBlockEnd: spacing.s48,
        borderBlockEnd: `0.5px solid ${colors.separator}`,
      }}
    >
      <div style={{ ...eyebrow, marginBlockEnd: spacing.s16 }}>
        CONSISTENCIA · {WEEKS} SEMANAS
      </div>

      {/* Grid: semanas = columnas (flujo por columna), 7 filas (días). */}
      <div
        role="img"
        aria-label={`Mapa de consistencia: ${cal.activeDays} días activos en ${WEEKS} semanas, racha más larga ${cal.longestStreak} días`}
        style={{
          display: "grid",
          gridTemplateRows: "repeat(7, 1fr)",
          gridAutoFlow: "column",
          gridAutoColumns: "1fr",
          gap: GAP,
        }}
      >
        {cells}
      </div>

      {/* Stats + leyenda */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBlockStart: spacing.s16,
          gap: spacing.s16,
        }}
      >
        <span
          style={{
            fontFamily: typography.family,
            fontSize: typography.size.caption,
            color: "rgba(255,255,255,0.55)",
            fontWeight: typography.weight.regular,
          }}
        >
          {cal.activeDays} días activos · racha más larga {cal.longestStreak}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <span style={{ ...eyebrow, fontSize: 9 }}>menos</span>
          {[0, 1, 2, 3, 4].map((lv) => (
            <span
              key={lv}
              aria-hidden="true"
              style={{ width: 9, height: 9, borderRadius: 2, background: cellColor(lv, false) }}
            />
          ))}
          <span style={{ ...eyebrow, fontSize: 9 }}>más</span>
        </span>
      </div>
    </section>
  );
}
