"use client";
/* ═══════════════════════════════════════════════════════════════
   PROGRAM BROWSER — 5 programas curados
   ═══════════════════════════════════════════════════════════════
   Se renderiza en la vista idle cuando NO hay activeProgram.
   Muestra los 5 programas como cards con progressive disclosure:
   al tap se expande el card con detalle + CTA "Iniciar".

   Props:
     - isDark
     - programHistory (array) — usado para flag "ya completado"
     - onStart(programId)
   ═══════════════════════════════════════════════════════════════ */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "./Icon";
import { resolveTheme, withAlpha, space, font } from "../lib/theme";
import { useReducedMotion } from "../lib/a11y";
import { PROGRAMS, getProtocolById, programRequiredSessions } from "../lib/programs";
import { semantic } from "../lib/tokens";

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

export default function ProgramBrowser({ isDark, programHistory = [], suggestion = null, onStart }) {
  const reduced = useReducedMotion();
  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  const [expandedId, setExpandedId] = useState(null);

  // Map id → fracción completada histórica (para badge "ya hecho")
  const completionMap = useMemo(() => {
    const map = {};
    programHistory.forEach((h) => {
      if (!h || !h.id) return;
      const prev = map[h.id] || { completed: 0, attempts: 0 };
      map[h.id] = {
        completed: prev.completed + (h.completionFraction === 1 ? 1 : 0),
        attempts: prev.attempts + 1,
      };
    });
    return map;
  }, [programHistory]);

  const toggle = (id) => setExpandedId((cur) => (cur === id ? null : id));

  return (
    <section aria-label="Programas" style={{ marginBlockEnd: space[5] }}>
      <header style={{ marginBlockEnd: space[3], paddingInline: space[1] }}>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: "0.16em",
            color: t3,
            fontWeight: 700,
          }}
        >
          PROGRAMAS
        </div>
        <p
          style={{
            margin: 0,
            marginBlockStart: 2,
            fontSize: 12,
            color: t2,
            lineHeight: 1.45,
          }}
        >
          Trayectorias curadas de varios días. Cada programa usa los 17 protocolos como ingredientes.
        </p>
      </header>

      {suggestion && suggestion.program && (
        <SuggestionBanner
          suggestion={suggestion}
          onStart={() => typeof onStart === "function" && onStart(suggestion.programId)}
          theme={{ t1, t2, t3, cd, bd }}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: space[2] }}>
        {PROGRAMS.map((program) => (
          <ProgramCard
            key={program.id}
            program={program}
            expanded={expandedId === program.id}
            onToggle={() => toggle(program.id)}
            onStart={() => typeof onStart === "function" && onStart(program.id)}
            completionStats={completionMap[program.id]}
            reduced={reduced}
            theme={{ cd, bd, t1, t2, t3 }}
          />
        ))}
      </div>
    </section>
  );
}

function ProgramCard({ program, expanded, onToggle, onStart, completionStats, reduced, theme }) {
  const { cd, bd, t1, t2, t3 } = theme;
  const accent = program.cl || "#22D3EE";
  const required = programRequiredSessions(program);
  const completedBefore = completionStats && completionStats.completed > 0;

  return (
    <article
      role="region"
      aria-label={`Programa: ${program.n}`}
      style={{
        background: cd,
        border: `1px solid ${expanded ? withAlpha(accent, 30) : bd}`,
        borderRadius: 14,
        overflow: "hidden",
        transition: "border-color .2s ease",
      }}
    >
      {/* Header (clickable) */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={`program-detail-${program.id}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: space[3],
          width: "100%",
          padding: space[4],
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {/* Abbrev tile */}
        <div
          style={{
            flexShrink: 0,
            width: 42,
            height: 42,
            borderRadius: 10,
            background: withAlpha(accent, 18),
            border: `1px solid ${withAlpha(accent, 30)}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: MONO,
            fontSize: 11,
            fontWeight: 800,
            color: accent,
            letterSpacing: -0.05,
          }}
        >
          {program.tg}
        </div>
        {/* Title + sub */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBlockEnd: 3,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 700,
                color: t1,
                letterSpacing: -0.15,
              }}
            >
              {program.n}
            </h3>
            {completedBefore && (
              <span
                aria-label="Completado anteriormente"
                style={{
                  fontFamily: MONO,
                  fontSize: 9,
                  fontWeight: 700,
                  color: accent,
                  background: withAlpha(accent, 12),
                  padding: "2px 6px",
                  borderRadius: 6,
                  letterSpacing: "0.06em",
                }}
              >
                ✓ HECHO
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: 11,
              color: t3,
              lineHeight: 1.4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {program.sb}
          </div>
        </div>
        {/* Chevron */}
        <Icon
          name={expanded ? "chevron-down" : "chevron"}
          size={14}
          color={expanded ? accent : t3}
          aria-hidden="true"
        />
      </button>

      {/* Detail (collapsible) */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={`program-detail-${program.id}`}
            key={`detail-${program.id}`}
            initial={reduced ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduced ? { opacity: 0, height: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: reduced ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: `0 ${space[4]}px ${space[4]}px`, borderTop: `1px solid ${bd}` }}>
              <p
                style={{
                  marginBlockStart: space[3],
                  marginBlockEnd: space[3],
                  fontSize: 12,
                  color: t2,
                  lineHeight: 1.55,
                }}
              >
                {program.sb_long}
              </p>

              {/* Meta chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBlockEnd: space[3] }}>
                <Chip label={`${program.duration} días`} color={accent} />
                <Chip label={`${required} sesiones`} color={t3} outlined />
                <Chip label={program.intent} color={accent} outlined />
                {program.window && program.window !== "any" && (
                  <Chip label={program.window === "morning" ? "matutino" : program.window === "afternoon" ? "tarde" : program.window === "evening" ? "noche" : program.window} color={t3} outlined />
                )}
              </div>

              {/* Rationale (colapsado opcional — lo mostramos inline, es breve) */}
              {program.rationale && (
                <details
                  style={{
                    marginBlockEnd: space[3],
                    padding: `${space[2]}px ${space[3]}px`,
                    background: withAlpha(accent, 5),
                    border: `1px solid ${withAlpha(accent, 12)}`,
                    borderRadius: 10,
                  }}
                >
                  <summary
                    style={{
                      cursor: "pointer",
                      fontSize: 11,
                      fontWeight: 700,
                      color: t2,
                      letterSpacing: -0.05,
                      listStyle: "none",
                    }}
                  >
                    Por qué este arco
                  </summary>
                  <p style={{ margin: "8px 0 0", fontSize: 11, color: t2, lineHeight: 1.6 }}>
                    {program.rationale}
                  </p>
                  {program.evidence && (
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontFamily: MONO,
                        fontSize: 10,
                        color: t3,
                        letterSpacing: "0.02em",
                      }}
                    >
                      Evidencia: {program.evidence}
                    </p>
                  )}
                </details>
              )}

              {/* Schedule compacto: lista de primeros 7 días + "+N más" */}
              <ProgramSchedule program={program} accent={accent} t1={t1} t2={t2} t3={t3} />

              {/* CTA */}
              <button
                type="button"
                onClick={onStart}
                style={{
                  marginBlockStart: space[4],
                  width: "100%",
                  padding: `${space[3]}px ${space[4]}px`,
                  background: accent,
                  color: "#0B1320",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  letterSpacing: -0.05,
                  boxShadow: `0 4px 14px -4px ${withAlpha(accent, 60)}`,
                }}
              >
                Iniciar programa
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

function ProgramSchedule({ program, accent, t1, t2, t3 }) {
  // Mostramos los primeros 7 días con sesión + contador de restantes
  const sessions = program.sessions || [];
  const visible = sessions.slice(0, 7);
  const remaining = Math.max(0, sessions.length - visible.length);

  return (
    <div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 9,
          letterSpacing: "0.14em",
          color: t3,
          fontWeight: 700,
          marginBlockEnd: 8,
        }}
      >
        AGENDA
      </div>
      <ol
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {visible.map((s) => {
          const proto = getProtocolById(s.protocolId);
          if (!proto) return null;
          return (
            <li
              key={s.day}
              style={{
                display: "grid",
                gridTemplateColumns: "42px 1fr",
                gap: 10,
                alignItems: "center",
                fontSize: 11,
                lineHeight: 1.3,
              }}
            >
              <span
                style={{
                  fontFamily: MONO,
                  color: t3,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textAlign: "right",
                }}
              >
                Día {s.day}
              </span>
              <span style={{ color: t2 }}>
                <span style={{ color: t1, fontWeight: 600 }}>{proto.n}</span>
                {s.note && <span style={{ color: t3 }}> · {s.note.replace(/^[a-zà-ÿ]+ · /, "")}</span>}
              </span>
            </li>
          );
        })}
      </ol>
      {remaining > 0 && (
        <div
          style={{
            marginBlockStart: 6,
            fontSize: 10,
            color: t3,
            fontWeight: 500,
            paddingLeft: 52,
          }}
        >
          + {remaining} {remaining === 1 ? "sesión más" : "sesiones más"} durante el programa
        </div>
      )}
    </div>
  );
}

function SuggestionBanner({ suggestion, onStart, theme }) {
  const { t1, t2, t3 } = theme;
  const { program, reason, urgency } = suggestion;
  // Urgency → color mapping
  const color =
    urgency === "critical"
      ? semantic.danger
      : urgency === "high"
        ? semantic.warning
        : program.cl || "#22D3EE";
  return (
    <div
      role="region"
      aria-label="Programa recomendado"
      style={{
        background: withAlpha(color, 8),
        border: `1px solid ${withAlpha(color, 30)}`,
        borderRadius: 14,
        padding: space[4],
        marginBlockEnd: space[3],
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 10,
          letterSpacing: "0.16em",
          color,
          fontWeight: 700,
          marginBlockEnd: 6,
        }}
      >
        RECOMENDADO PARA TI
      </div>
      <h4
        style={{
          margin: 0,
          fontSize: 15,
          fontWeight: 800,
          color: t1,
          letterSpacing: -0.2,
          marginBlockEnd: 4,
        }}
      >
        {program.n}
      </h4>
      <p
        style={{
          margin: 0,
          fontSize: 12,
          color: t2,
          lineHeight: 1.5,
          marginBlockEnd: space[3],
        }}
      >
        {reason}
      </p>
      <button
        type="button"
        onClick={onStart}
        style={{
          width: "100%",
          padding: `${space[2.5]}px ${space[4]}px`,
          background: color,
          color: urgency === "critical" || urgency === "high" ? "#fff" : "#0B1320",
          border: "none",
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 800,
          cursor: "pointer",
          letterSpacing: -0.05,
          boxShadow: `0 3px 12px -3px ${withAlpha(color, 50)}`,
        }}
      >
        Empezar ahora
      </button>
    </div>
  );
}

function Chip({ label, color, outlined }) {
  return (
    <span
      style={{
        fontFamily: MONO,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.04em",
        color: outlined ? color : "#0B1320",
        background: outlined ? "transparent" : color,
        border: outlined ? `1px solid ${withAlpha(color, 30)}` : "none",
        padding: "3px 8px",
        borderRadius: 6,
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
  );
}
