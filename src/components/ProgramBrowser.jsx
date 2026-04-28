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
import { useT } from "../hooks/useT";
import { PROGRAMS, getProtocolById, programRequiredSessions } from "../lib/programs";
import {
  programDisplayName,
  programDisplaySubtitle,
  programDisplayLong,
  programDisplayRationale,
  programDisplayEvidence,
  protocolDisplayName,
} from "../lib/localize";
import { semantic } from "../lib/tokens";

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

export default function ProgramBrowser({ isDark, programHistory = [], suggestion = null, onStart }) {
  const reduced = useReducedMotion();
  const { t, locale } = useT();
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
          {t("programs.section")}
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
          {t("programs.sectionSub")}
        </p>
      </header>

      {suggestion && suggestion.program && (
        <SuggestionBanner
          suggestion={suggestion}
          onStart={() => typeof onStart === "function" && onStart(suggestion.programId)}
          theme={{ t1, t2, t3, cd, bd }}
          t={t}
          locale={locale}
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
            t={t}
            locale={locale}
          />
        ))}
      </div>
    </section>
  );
}

function ProgramCard({ program, expanded, onToggle, onStart, completionStats, reduced, theme, t, locale }) {
  const { cd, bd, t1, t2, t3 } = theme;
  const accent = program.cl || "#22D3EE";
  const required = programRequiredSessions(program);
  const completedBefore = completionStats && completionStats.completed > 0;
  const displayName = programDisplayName(program, locale);
  const displaySubtitle = programDisplaySubtitle(program, locale);
  const displayLong = programDisplayLong(program, locale);
  const displayRationale = programDisplayRationale(program, locale);
  const displayEvidence = programDisplayEvidence(program, locale);

  return (
    <article
      role="region"
      aria-label={`Programa: ${program.n}`}
      style={{
        background: cd,
        border: `1px solid ${expanded ? withAlpha(accent, 30) : bd}`,
        borderRadius: 14,
        overflow: "hidden",
        transition: "border-color .2s cubic-bezier(0.22, 1, 0.36, 1)",
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
              {displayName}
            </h3>
            {completedBefore && (
              <span
                aria-label={t("programs.doneBadge")}
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
                {t("programs.doneBadge")}
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
            {displaySubtitle}
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
                {displayLong}
              </p>

              {/* Meta chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBlockEnd: space[3] }}>
                <Chip label={`${program.duration} ${t("programs.daysLabel")}`} color={accent} />
                <Chip label={`${required} ${t("programs.sessionsLabel")}`} color={t3} outlined />
                <Chip label={program.intent} color={accent} outlined />
                {program.window && program.window !== "any" && (
                  <Chip label={program.window === "morning" ? t("programs.morning") : program.window === "afternoon" ? t("programs.afternoon") : program.window === "evening" ? t("programs.evening") : program.window} color={t3} outlined />
                )}
              </div>

              {/* Rationale (colapsado opcional — lo mostramos inline, es breve) */}
              {displayRationale && (
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
                    {t("programs.whyArc")}
                  </summary>
                  <p style={{ margin: "8px 0 0", fontSize: 11, color: t2, lineHeight: 1.6 }}>
                    {displayRationale}
                  </p>
                  {displayEvidence && (
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontFamily: MONO,
                        fontSize: 10,
                        color: t3,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {t("programs.evidence")}: {displayEvidence}
                    </p>
                  )}
                </details>
              )}

              {/* Schedule compacto: lista de primeros 7 días + "+N más" */}
              <ProgramSchedule program={program} accent={accent} t1={t1} t2={t2} t3={t3} t={t} locale={locale} />

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
                {t("programs.startButton")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

function ProgramSchedule({ program, accent, t1, t2, t3, t, locale }) {
  // Mostramos los primeros 7 días con sesión + contador de restantes
  const sessions = program.sessions || [];
  const visible = sessions.slice(0, 7);
  const remaining = Math.max(0, sessions.length - visible.length);
  const dayLabel = t("programs.activeBody.day");

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
        {t("programs.schedule")}
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
          const protoName = protocolDisplayName(proto, locale);
          return (
            <li
              key={s.day}
              style={{
                display: "grid",
                gridTemplateColumns: "58px 1fr",
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
                  textTransform: "capitalize",
                }}
              >
                {dayLabel} {s.day}
              </span>
              <span style={{ color: t2 }}>
                <span style={{ color: t1, fontWeight: 600 }}>{protoName}</span>
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
            paddingLeft: 58 + 10,
          }}
        >
          {t("programs.moreSessions", {
            count: remaining,
            label: remaining === 1 ? t("programs.activeBody.day") : t("programs.activeBody.days"),
          })}
        </div>
      )}
    </div>
  );
}

function SuggestionBanner({ suggestion, onStart, theme, t, locale }) {
  const { t1, t2, t3 } = theme;
  const { program, reason, urgency } = suggestion;
  const displayName = programDisplayName(program, locale);
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
        {t("programs.recommendedForYou")}
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
        {displayName}
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
        {t("programs.startNowButton")}
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
