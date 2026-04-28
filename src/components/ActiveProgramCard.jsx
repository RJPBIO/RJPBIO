"use client";
/* ═══════════════════════════════════════════════════════════════
   ACTIVE PROGRAM CARD — today's action inside a running program
   ═══════════════════════════════════════════════════════════════
   Se renderiza en la vista idle cuando hay un activeProgram.
   Muestra progreso (ring) + día actual + protocolo sugerido de hoy
   + CTA inmediato para iniciar. Si hoy es día de reposo, lo señala.
   Si el usuario está atrasado, cambia el tono (warning).

   Props:
     - activeProgram  { id, startedAt, completedSessionDays }
     - isDark
     - onStartDay(session, program)  → arranca sesión del día
     - onViewProgram(program)        → abre detalle del programa
     - onAbandon(program)            → confirma abandono (opcional)
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { motion } from "framer-motion";
import Icon from "./Icon";
import { resolveTheme, withAlpha, space, font } from "../lib/theme";
import { semantic } from "../lib/tokens";
import { useReducedMotion } from "../lib/a11y";
import { useT } from "../hooks/useT";
import {
  getProgramById,
  getProtocolById,
  currentProgramDay,
  programSessionForDay,
  programProgress,
  programLagStatus,
} from "../lib/programs";
import { programDisplayName, protocolDisplayName } from "../lib/localize";

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

export default function ActiveProgramCard({
  activeProgram,
  isDark,
  onStartDay,
  onViewProgram,
  onAbandon,
}) {
  const reduced = useReducedMotion();
  const { t, locale } = useT();
  const { card: cd, border: bd, t1, t2, t3, surface } = resolveTheme(isDark);

  const info = useMemo(() => {
    if (!activeProgram || !activeProgram.id) return null;
    const program = getProgramById(activeProgram.id);
    if (!program) return null;
    const day = currentProgramDay(program, activeProgram.startedAt);
    const session = programSessionForDay(program, day);
    const progress = programProgress(activeProgram);
    const lag = programLagStatus(activeProgram);
    const completedToday =
      Array.isArray(activeProgram.completedSessionDays) &&
      activeProgram.completedSessionDays.includes(day);
    const proto = session ? getProtocolById(session.protocolId) : null;
    // Próximo día con sesión (para mostrar en días de reposo)
    const nextSession = session
      ? null
      : program.sessions.find((s) => s.day > day) || null;
    return { program, day, session, progress, lag, completedToday, proto, nextSession };
  }, [activeProgram]);

  if (!info) return null;
  const { program, day, session, progress, lag, completedToday, proto, nextSession } = info;

  const accent = program.cl || "#22D3EE";

  // Estado visual por situación:
  //   — completedToday:   verde suave, "hecho ✓"
  //   — rest day:          neutral, "hoy descansas"
  //   — lagging:           warning, "te faltan X sesiones"
  //   — ready today:       accent, "iniciar día N"
  const stateColor = completedToday
    ? semantic.success
    : lag.isLagging
      ? semantic.warning
      : accent;

  const stateLabel = completedToday
    ? t("programs.activeHeader.doneToday")
    : !session
      ? t("programs.activeHeader.restDay")
      : lag.isLagging
        ? t("programs.activeHeader.lagging", { count: lag.daysBehind })
        : t("programs.activeHeader.todayIs", { day, total: program.duration });

  return (
    <motion.article
      role="region"
      aria-label={`${programDisplayName(program, locale)}`}
      initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: cd,
        border: `1px solid ${withAlpha(stateColor, 35)}`,
        borderRadius: 18,
        padding: space[5],
        marginBlockEnd: space[4],
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top accent bar: ring of progress */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: withAlpha(stateColor, 18),
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.round(progress.fraction * 100)}%`,
            background: stateColor,
            transition: "width .6s cubic-bezier(.16,1,.3,1)",
          }}
        />
      </div>

      {/* Header: state label + program name */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBlockEnd: space[3] }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: "0.14em",
              color: stateColor,
              fontWeight: 700,
              marginBlockEnd: 4,
            }}
          >
            {stateLabel}
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 800,
              color: t1,
              letterSpacing: -0.2,
              lineHeight: 1.25,
            }}
          >
            {programDisplayName(program, locale)}
          </h3>
          <p
            style={{
              margin: 0,
              marginBlockStart: 4,
              fontSize: 11,
              color: t3,
              lineHeight: 1.4,
            }}
          >
            {progress.completed} / {progress.total} {t("programs.sessionsLabel")} · {Math.round(progress.fraction * 100)}%
          </p>
        </div>

        {/* Ring gráfico compacto de progreso */}
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          style={{ flexShrink: 0 }}
          aria-hidden="true"
        >
          <circle cx="24" cy="24" r="20" fill="none" stroke={withAlpha(stateColor, 15)} strokeWidth="3" />
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke={stateColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 20}
            strokeDashoffset={2 * Math.PI * 20 * (1 - progress.fraction)}
            transform="rotate(-90 24 24)"
            style={{ transition: "stroke-dashoffset .6s cubic-bezier(.16,1,.3,1)" }}
          />
          <text
            x="24"
            y="28"
            textAnchor="middle"
            style={{
              fontFamily: MONO,
              fontSize: 11,
              fontWeight: 800,
              fill: t1,
            }}
          >
            {progress.completed}
          </text>
        </svg>
      </div>

      {/* Body: today's action */}
      {completedToday ? (
        <div
          style={{
            padding: `${space[3]}px ${space[4]}px`,
            background: withAlpha(semantic.success, 8),
            border: `1px solid ${withAlpha(semantic.success, 20)}`,
            borderRadius: 12,
            marginBlockEnd: space[3],
            display: "flex",
            alignItems: "center",
            gap: space[2],
          }}
        >
          <Icon name="check" size={16} color={semantic.success} />
          <span style={{ fontSize: 12, color: t2, fontWeight: 600 }}>
            {t("programs.activeBody.doneToday")}
          </span>
        </div>
      ) : session && proto ? (
        <button
          type="button"
          onClick={() => typeof onStartDay === "function" && onStartDay(session, program)}
          aria-label={t("programs.activeCta.startDay", { day, protocol: protocolDisplayName(proto, locale) })}
          style={{
            display: "flex",
            alignItems: "center",
            gap: space[3],
            width: "100%",
            padding: `${space[3]}px ${space[4]}px`,
            background: withAlpha(accent, 10),
            border: `1.5px solid ${withAlpha(accent, 35)}`,
            borderRadius: 14,
            cursor: "pointer",
            textAlign: "left",
            marginBlockEnd: space[3],
            transition: "background .2s cubic-bezier(0.22, 1, 0.36, 1), border-color .2s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: withAlpha(proto.cl || accent, 18),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: MONO,
              fontSize: 10,
              fontWeight: 800,
              color: proto.cl || accent,
              letterSpacing: -0.05,
              flexShrink: 0,
            }}
          >
            {proto.tg}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 10,
                color: t3,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBlockEnd: 2,
              }}
            >
              {t("programs.activeCta.today")} · {proto.ct}
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: t1,
                lineHeight: 1.25,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {protocolDisplayName(proto, locale)}
            </div>
            {session.note && (
              <div
                style={{
                  fontSize: 10,
                  color: t3,
                  marginBlockStart: 2,
                  lineHeight: 1.3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {session.note}
              </div>
            )}
          </div>
          <Icon name="chevron" size={14} color={accent} />
        </button>
      ) : nextSession ? (
        <div
          style={{
            padding: `${space[3]}px ${space[4]}px`,
            background: withAlpha(accent, 6),
            border: `1px solid ${withAlpha(accent, 18)}`,
            borderRadius: 12,
            marginBlockEnd: space[3],
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: t3,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBlockEnd: 4,
            }}
          >
            {t("programs.activeBody.restDay")}
          </div>
          <div style={{ fontSize: 12, color: t2, lineHeight: 1.45 }}>
            {t("programs.activeBody.nextSessionIn", {
              count: nextSession.day - day,
              label: nextSession.day - day === 1 ? t("programs.activeBody.day") : t("programs.activeBody.days"),
            })}
          </div>
        </div>
      ) : null}

      {/* Footer actions */}
      <div style={{ display: "flex", gap: space[2], fontSize: 11 }}>
        {typeof onViewProgram === "function" && (
          <button
            type="button"
            onClick={() => onViewProgram(program)}
            style={{
              flex: 1,
              padding: `${space[2]}px ${space[3]}px`,
              background: "transparent",
              border: `1px solid ${bd}`,
              borderRadius: 10,
              color: t2,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            {t("programs.activeCta.viewProgram")}
          </button>
        )}
        {typeof onAbandon === "function" && (
          <button
            type="button"
            onClick={() => onAbandon(program)}
            style={{
              padding: `${space[2]}px ${space[3]}px`,
              background: "transparent",
              border: `1px solid ${bd}`,
              borderRadius: 10,
              color: t3,
              fontSize: 11,
              fontWeight: 500,
              cursor: "pointer",
            }}
            aria-label={t("programs.activeCta.abandon")}
          >
            {t("programs.activeCta.abandon")}
          </button>
        )}
      </div>
    </motion.article>
  );
}
