"use client";
/* ═══════════════════════════════════════════════════════════════
   ProgramTimeline — Phase 6F SP-B
   Visualización gantt del programa: días en eje X, dot por sesión.
     - Dot filled cyan       = día completado
     - Dot outlined cyan     = día actual con sesión pendiente
     - Dot outlined dashed   = día futuro con sesión
     - Vacío (sin dot)       = día de reposo (sin entrada en program.sessions)

   Recibe activeProgram con shape del endpoint /api/v1/me/program/active
   (server-computed). Si lib/programs no tiene el id, fallback graceful.
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { colors, typography, spacing, radii, surfaces, withAlpha } from "../tokens";
import { PROGRAM_NAME, PROGRAM_DAYS } from "../home/copy";
import { getProgramById } from "@/lib/programs";

export default function ProgramTimeline({ activeProgram, onDayClick }) {
  const programId = activeProgram?.programId;
  const program = programId ? getProgramById(programId) : null;
  const programName = (programId && PROGRAM_NAME[programId]) || program?.n || programId || "";
  const totalDays = (programId && PROGRAM_DAYS[programId]) || program?.duration || activeProgram?.progress?.total || 0;
  const completedDays = Array.isArray(activeProgram?.completedDays) ? activeProgram.completedDays : [];
  const today = activeProgram?.todayStatus?.day || 1;

  // useMemo MUST be called before any early return (rules-of-hooks).
  // Gracefully handles missing program by returning empty cells; the early
  // return below renders the empty-state article.
  const cells = useMemo(() => {
    if (!program || !totalDays) return [];
    const out = [];
    const sessionsByDay = new Map();
    for (const s of program.sessions || []) {
      sessionsByDay.set(s.day, s);
    }
    for (let day = 1; day <= totalDays; day++) {
      const session = sessionsByDay.get(day) || null;
      const isCompleted = completedDays.includes(day);
      const isToday = day === today;
      const isRest = !session;
      let state;
      if (isRest) state = "rest";
      else if (isCompleted) state = "completed";
      else if (isToday) state = "today";
      else if (day < today) state = "missed";
      else state = "future";
      out.push({ day, session, state });
    }
    return out;
  }, [program, totalDays, completedDays, today]);

  if (!activeProgram || !activeProgram.programId) return null;
  if (!program || !totalDays) {
    return (
      <article data-v2-program-timeline data-empty="true">
        <p style={{ color: colors.text.muted }}>Programa no encontrado en catálogo.</p>
      </article>
    );
  }

  // Compute reasonable column count for grid: caps at 14 per row to keep dots visible.
  const colsPerRow = totalDays <= 14 ? totalDays : 14;

  return (
    <article
      data-v2-program-timeline
      data-program-id={programId}
      style={{
        background: colors.bg.raised,
        border: `0.5px solid ${colors.separator}`,
        borderRadius: radii.panelLg,
        padding: spacing.s24 - 4,
        display: "flex",
        flexDirection: "column",
        gap: spacing.s24,
      }}
    >
      <header style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span
          style={{
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: colors.accent.phosphorCyan,
            fontWeight: typography.weight.medium,
          }}
        >
          LÍNEA DE TIEMPO · {programName.toUpperCase()}
        </span>
        <h2
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: typography.size.subtitle,
            fontWeight: typography.weight.light,
            color: colors.text.strong,
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
          }}
        >
          {totalDays} días
        </h2>
      </header>

      <div
        data-v2-timeline-grid
        role="list"
        aria-label={`Línea de tiempo del programa ${programName}`}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${colsPerRow}, 1fr)`,
          gap: 8,
          alignItems: "center",
          justifyItems: "center",
        }}
      >
        {cells.map((cell) => (
          <DayCell key={cell.day} cell={cell} onClick={onDayClick} />
        ))}
      </div>

      <footer
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          paddingBlockStart: spacing.s8,
          borderBlockStart: `0.5px solid ${colors.separator}`,
        }}
      >
        <Legend variant="completed" label="Completado" />
        <Legend variant="today" label="Hoy" />
        <Legend variant="future" label="Pendiente" />
        <Legend variant="missed" label="Saltado" />
        <Legend variant="rest" label="Reposo" />
      </footer>
    </article>
  );
}

function DayCell({ cell, onClick }) {
  const { day, state, session } = cell;
  const isInteractive = !!session && typeof onClick === "function";

  const dotStyle = stateDotStyle(state);
  const ariaLabel = `Día ${day} ${stateAriaText(state)}`;

  const inner = (
    <span
      data-v2-timeline-day
      data-day={day}
      data-state={state}
      style={{
        width: 18,
        height: 18,
        borderRadius: "50%",
        display: "inline-block",
        ...dotStyle,
      }}
    />
  );

  if (!isInteractive) {
    return (
      <span
        role="listitem"
        aria-label={ariaLabel}
        style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4 }}
      >
        {inner}
        <DayLabel day={day} muted={state === "rest" || state === "missed"} />
      </span>
    );
  }
  return (
    <button
      type="button"
      role="listitem"
      aria-label={ariaLabel}
      onClick={() => onClick(cell)}
      style={{
        appearance: "none",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 0,
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
    >
      {inner}
      <DayLabel day={day} muted={state === "missed"} />
    </button>
  );
}

function DayLabel({ day, muted }) {
  return (
    <span
      style={{
        fontFamily: typography.familyMono,
        fontSize: 9,
        letterSpacing: "0.04em",
        color: muted ? colors.text.muted : colors.text.secondary,
        fontWeight: typography.weight.medium,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {day}
    </span>
  );
}

function stateDotStyle(state) {
  const cyan = colors.accent.phosphorCyan;
  switch (state) {
    case "completed":
      return { background: cyan, border: `2px solid ${cyan}` };
    case "today":
      return {
        background: "transparent",
        border: `2px solid ${cyan}`,
        boxShadow: `0 0 0 3px ${withAlpha(colors.accent.phosphorCyanRgb, 12)}`,
      };
    case "future":
      return { background: "transparent", border: `1px dashed ${withAlpha(colors.accent.phosphorCyanRgb, 60)}` };
    case "missed":
      return { background: "transparent", border: `1px dashed ${colors.text.muted}` };
    case "rest":
    default:
      return { background: surfaces.iconBox, border: `0.5px solid ${colors.separator}`, opacity: 0.4 };
  }
}

function stateAriaText(state) {
  switch (state) {
    case "completed": return "completado";
    case "today":     return "hoy con sesión pendiente";
    case "future":    return "pendiente";
    case "missed":    return "saltado";
    case "rest":      return "reposo";
    default:          return state;
  }
}

function Legend({ variant, label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span
        aria-hidden="true"
        style={{
          width: 10, height: 10, borderRadius: "50%", display: "inline-block",
          ...stateDotStyle(variant),
          // Override boxShadow for legend (smaller dot, no glow)
          boxShadow: "none",
        }}
      />
      <span
        style={{
          fontFamily: typography.familyMono,
          fontSize: typography.size.microCaps,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: colors.text.muted,
          fontWeight: typography.weight.medium,
        }}
      >
        {label}
      </span>
    </span>
  );
}
