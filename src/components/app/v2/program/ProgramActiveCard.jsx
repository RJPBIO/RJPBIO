"use client";
/* ═══════════════════════════════════════════════════════════════
   ProgramActiveCard — Phase 6F SP-B
   Card que muestra el programa activo del user con:
     - Eyebrow + nombre + duración
     - Today status: sesión hoy (CTA EMPEZAR) | completada | descanso
     - Lag warning (si isLagging)
     - Re-eval banner (si reEval.isDue && !completed)
     - ProgressBar día X de Y
     - Quick actions: Ver línea de tiempo · Abandonar

   Consume el shape rico del endpoint GET /api/v1/me/program/active
   (server-computed todayStatus / lagStatus / progress / reEval), NO
   el shape Zustand legacy. NO confundir con ActiveProgramCard.jsx
   (button-row legacy en src/components/app/v2/home/ActiveProgramCard.jsx).
   ═══════════════════════════════════════════════════════════════ */

import { ChevronRight } from "lucide-react";
import {
  colors, typography, spacing, radii, surfaces, motion as motionTok, withAlpha,
} from "../tokens";
import { PROGRAM_TAG, PROGRAM_NAME, PROGRAM_DAYS } from "../home/copy";
import { getProtocolById } from "@/lib/programs";

export default function ProgramActiveCard({ activeProgram, onAction }) {
  if (!activeProgram || !activeProgram.programId) return null;

  const programId = activeProgram.programId;
  const programName = PROGRAM_NAME[programId] || programId;
  const totalDays = PROGRAM_DAYS[programId] || activeProgram.progress?.total || 0;
  const tag = PROGRAM_TAG[programId] || programId.slice(0, 2).toUpperCase();

  const todayStatus = activeProgram.todayStatus || { shouldSession: false, day: 1, session: null };
  const lagStatus = activeProgram.lagStatus || { isLagging: false, daysBehind: 0 };
  const progress = activeProgram.progress || { completed: 0, total: totalDays, fraction: 0 };
  const reEval = activeProgram.reEval || null;

  // shouldSession=true → hay sesión hoy y NO está completada
  // shouldSession=false + session!=null → ya completada hoy
  // shouldSession=false + session==null → día de reposo
  const sessionToday = todayStatus.session || null;
  const completedToday = sessionToday && !todayStatus.shouldSession;

  return (
    <article
      data-v2-program-active
      data-program-id={programId}
      style={{
        background: colors.bg.raised,
        border: `0.5px solid ${surfaces.accentBorder}`,
        borderRadius: radii.panelLg,
        padding: spacing.s24 - 4,
        display: "flex",
        flexDirection: "column",
        gap: spacing.s16,
      }}
    >
      {/* Header — eyebrow + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          aria-hidden="true"
          style={{
            width: 36, height: 36,
            background: surfaces.iconBox,
            borderRadius: radii.iconBox,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontFamily: typography.familyMono,
            fontSize: typography.size.caption,
            fontWeight: typography.weight.medium,
            color: colors.text.secondary,
            letterSpacing: "0.04em",
            flexShrink: 0,
          }}
        >
          {tag}
        </span>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
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
            TU PROGRAMA · {totalDays}D
          </span>
          <h3
            style={{
              margin: 0,
              fontFamily: typography.family,
              fontSize: typography.size.subtitleMin,
              fontWeight: typography.weight.medium,
              color: colors.text.strong,
              letterSpacing: "-0.005em",
              lineHeight: 1.25,
            }}
          >
            {programName}
          </h3>
        </div>
      </div>

      {/* Today status */}
      {sessionToday && !completedToday && (
        <TodaySessionBlock
          day={todayStatus.day}
          session={sessionToday}
          onStart={() =>
            onAction?.({
              action: "start-protocol",
              protocolId: sessionToday.protocolId,
              source: "program",
              programId,
              day: todayStatus.day,
            })
          }
        />
      )}
      {completedToday && (
        <CompletedTodayBlock day={todayStatus.day} />
      )}
      {!sessionToday && (
        <RestDayBlock day={todayStatus.day} />
      )}

      {/* Lag warning */}
      {lagStatus.isLagging && (
        <LagWarning
          daysBehind={lagStatus.daysBehind}
          onContinue={() => onAction?.({ action: "continue-program" })}
        />
      )}

      {/* Re-eval due banner */}
      {reEval && reEval.isDue && !reEval.completed && (
        <ReEvalDueBanner
          daysOverdue={Math.max(0, -1 * (reEval.daysUntil ?? 0))}
          onOpen={() => onAction?.({ action: "open-reeval-prompt" })}
        />
      )}

      {/* Progress bar */}
      <ProgressBar
        value={progress.completed || 0}
        max={progress.total || totalDays || 1}
        label={`Día ${todayStatus.day || 1} de ${progress.total || totalDays}`}
        sub={`${progress.completed || 0} sesiones completadas`}
      />

      {/* Quick actions row */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <SecondaryAction
          label="Ver línea de tiempo"
          onClick={() => onAction?.({ target: "/app/program/timeline" })}
        />
        <SecondaryAction
          label="Abandonar programa"
          tone="danger"
          onClick={() => onAction?.({ action: "abandon-program" })}
          testId="program-abandon"
        />
      </div>
    </article>
  );
}

function TodaySessionBlock({ day, session, onStart }) {
  const proto = getProtocolById(session.protocolId);
  const name = proto?.n || session.note || `Protocolo ${session.protocolId}`;
  return (
    <div
      data-v2-today-session
      style={{
        background: withAlpha(colors.accent.phosphorCyanRgb, 6),
        border: `0.5px solid ${withAlpha(colors.accent.phosphorCyanRgb, 18)}`,
        borderRadius: radii.panel,
        padding: spacing.s16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
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
        HOY · DÍA {day}
      </span>
      <h4
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.medium,
          color: colors.text.strong,
          lineHeight: 1.3,
        }}
      >
        {name}
      </h4>
      {session.note && session.note !== name && (
        <span
          style={{
            fontFamily: typography.family,
            fontSize: typography.size.caption,
            color: colors.text.secondary,
            lineHeight: 1.4,
          }}
        >
          {session.note}
        </span>
      )}
      <button
        type="button"
        onClick={onStart}
        data-testid="program-today-cta"
        style={{
          appearance: "none",
          background: colors.accent.phosphorCyan,
          color: colors.bg.base,
          border: "none",
          borderRadius: radii.pill,
          paddingBlock: 12,
          paddingInline: 20,
          minBlockSize: 44,
          fontFamily: typography.family,
          fontSize: 12,
          fontWeight: typography.weight.medium,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          alignSelf: "flex-start",
          cursor: "pointer",
          transitionProperty: "background, transform",
          transitionDuration: `${motionTok.duration.tap}ms`,
          transitionTimingFunction: motionTok.ease.out,
        }}
      >
        Empezar
      </button>
    </div>
  );
}

function CompletedTodayBlock({ day }) {
  return (
    <div
      data-v2-today-completed
      style={{
        background: surfaces.iconBox,
        borderRadius: radii.panel,
        padding: spacing.s16,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
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
        DÍA {day} · COMPLETADO
      </span>
      <span
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.bodyMin,
          color: colors.text.secondary,
          lineHeight: 1.4,
        }}
      >
        Tu sistema está consolidando. Vuelve mañana.
      </span>
    </div>
  );
}

function RestDayBlock({ day }) {
  return (
    <div
      data-v2-today-rest
      style={{
        background: surfaces.iconBox,
        borderRadius: radii.panel,
        padding: spacing.s16,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span
        style={{
          fontFamily: typography.familyMono,
          fontSize: typography.size.microCaps,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: colors.text.muted,
          fontWeight: typography.weight.medium,
        }}
      >
        DÍA {day} · DESCANSO
      </span>
      <span
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.bodyMin,
          color: colors.text.secondary,
          lineHeight: 1.4,
        }}
      >
        Hoy no hay sesión. El reposo es parte del programa.
      </span>
    </div>
  );
}

function LagWarning({ daysBehind, onContinue }) {
  return (
    <div
      data-v2-program-lag
      style={{
        background: withAlpha(colors.semantic.warningRgb, 8),
        border: `0.5px solid ${withAlpha(colors.semantic.warningRgb, 24)}`,
        borderRadius: radii.panel,
        padding: spacing.s16,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <span
        style={{
          fontFamily: typography.familyMono,
          fontSize: typography.size.microCaps,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: colors.semantic.warning,
          fontWeight: typography.weight.medium,
        }}
      >
        AL MARGEN DEL PLAN
      </span>
      <span
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.bodyMin,
          color: colors.text.strong,
          lineHeight: 1.4,
        }}
      >
        Estás {daysBehind} {daysBehind === 1 ? "día" : "días"} atrás. Retoma cuando quieras — el programa se ajusta.
      </span>
      {onContinue && (
        <button
          type="button"
          onClick={onContinue}
          style={{
            appearance: "none",
            background: "transparent",
            border: `0.5px solid ${colors.semantic.warning}`,
            borderRadius: radii.pill,
            color: colors.semantic.warning,
            cursor: "pointer",
            paddingBlock: 10,
            paddingInline: 16,
            minBlockSize: 40,
            fontFamily: typography.family,
            fontSize: 11,
            fontWeight: typography.weight.medium,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            alignSelf: "flex-start",
          }}
        >
          Retomar
        </button>
      )}
    </div>
  );
}

function ReEvalDueBanner({ daysOverdue, onOpen }) {
  return (
    <div
      data-v2-program-reeval-due
      style={{
        background: withAlpha(colors.accent.phosphorCyanRgb, 8),
        border: `0.5px solid ${withAlpha(colors.accent.phosphorCyanRgb, 24)}`,
        borderRadius: radii.panel,
        padding: spacing.s16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
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
        RE-EVALUACIÓN MID-PROGRAMA
      </span>
      <span
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.bodyMin,
          color: colors.text.strong,
          lineHeight: 1.4,
        }}
      >
        PSS-4 (3 minutos) — ajustamos los protocolos finales según tu respuesta.
        {daysOverdue > 0 && ` (${daysOverdue} ${daysOverdue === 1 ? "día" : "días"} desde que está disponible)`}
      </span>
      <button
        type="button"
        onClick={onOpen}
        data-testid="program-reeval-cta"
        style={{
          appearance: "none",
          background: colors.accent.phosphorCyan,
          color: colors.bg.base,
          border: "none",
          borderRadius: radii.pill,
          cursor: "pointer",
          paddingBlock: 12,
          paddingInline: 20,
          minBlockSize: 44,
          fontFamily: typography.family,
          fontSize: 12,
          fontWeight: typography.weight.medium,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          alignSelf: "flex-start",
        }}
      >
        Hacer ahora
      </button>
    </div>
  );
}

function ProgressBar({ value, max, label, sub }) {
  const safeMax = max > 0 ? max : 1;
  const pct = Math.min(100, Math.max(0, (value / safeMax) * 100));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
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
        {sub && (
          <span
            style={{
              fontFamily: typography.family,
              fontSize: typography.size.caption,
              color: colors.text.secondary,
            }}
          >
            {sub}
          </span>
        )}
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={value}
        style={{
          position: "relative",
          height: 4,
          background: surfaces.iconBox,
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: `${pct}%`,
            background: colors.accent.phosphorCyan,
            borderRadius: 999,
            transition: `width ${motionTok.duration.enter}ms ${motionTok.ease.out}`,
          }}
        />
      </div>
    </div>
  );
}

function SecondaryAction({ label, onClick, tone = "default", testId }) {
  const danger = tone === "danger";
  const color = danger ? colors.semantic.danger : colors.text.secondary;
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      style={{
        appearance: "none",
        background: "transparent",
        border: `0.5px solid ${danger ? withAlpha(colors.semantic.dangerRgb, 30) : colors.separator}`,
        borderRadius: radii.pill,
        color,
        cursor: "pointer",
        paddingBlock: 10,
        paddingInline: 14,
        fontFamily: typography.family,
        fontSize: 11,
        fontWeight: typography.weight.medium,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </button>
  );
}
