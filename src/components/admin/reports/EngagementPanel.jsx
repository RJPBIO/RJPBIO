/* EngagementPanel — Phase 6I-4 (cierre H-4 repo audit)
   ═══════════════════════════════════════════════════════════════
   Surface engine-computed engagement object al admin executive
   report. El backend (executiveReport.js buildEngagementMetrics)
   computa estas métricas desde Phase 6F pero ningún panel consumer
   las exponía → invisible para HR / people analytics.

   Métricas:
     · ACTIVOS / 7 DÍAS  (activeUsersLast7d)
     · ACTIVOS / 30 DÍAS (activeUsersLast30d — backend var local
                          mal nombrada wauUsers, pero campo expuesto
                          es activeUsersLast30d)
     · SESIONES / DÍA    (sessionsLast7d / 7, 1 decimal)
     · ACTIVACIÓN        (activationRate × 100, 0 decimal con %)

   Branches:
     · null/undefined    → null (defensive)
     · suppressed:true   → branch SectionHeader "no disponible"
                            (k-anon: <5 sesiones)
     · activeUsersLast7d=0 → empty state "Aún no hay actividad"
     · default           → grid 4-up + secondary caption + k-anon reminder

   Server component: sin hooks, sin recharts, sin client JS.
   Pattern reuse: KpiHero (KpiCard), ProgramsCohortPanel (suppressed
   branch + SectionHeader), CorrelationPanel (subtitle k-anon mention).
   ═══════════════════════════════════════════════════════════════ */

import { cssVar, font, space, radius, bioSignal } from "@/components/ui/tokens";
import SectionHeader from "./SectionHeader";

export default function EngagementPanel({ engagement, totalActiveMembers }) {
  if (!engagement) return null;

  // Suppressed branch: backend retorna { suppressed: true, n }.
  if (engagement.suppressed) {
    return (
      <section
        data-v2-engagement
        data-suppressed="true"
        data-testid="engagement-panel"
        data-state="suppressed"
        style={{ marginBlockStart: space[6], marginBlockEnd: space[5] }}
      >
        <SectionHeader
          eyebrow="Engagement · uso del producto"
          italic="Adopción."
          title="Métricas no disponibles"
          subtitle={`Mínimo 5 sesiones agregadas en periodo — actual: ${engagement.n || 0}`}
        />
      </section>
    );
  }

  // Empty state explícito: cero actividad en últimos 7 días pero tabla
  // sí tenía datos históricos (k≥5). Esto da pie a coach onboarding HR.
  if ((engagement.activeUsersLast7d ?? 0) === 0) {
    return (
      <section
        data-v2-engagement
        data-empty="true"
        data-testid="engagement-panel"
        data-state="empty"
        style={{ marginBlockStart: space[6], marginBlockEnd: space[5] }}
      >
        <SectionHeader
          eyebrow="Engagement · uso del producto"
          italic="Adopción."
          title="Sin actividad en últimos 7 días"
          subtitle={
            engagement.sessionsLast30d > 0
              ? `${engagement.sessionsLast30d} sesiones en los últimos 30 días — el equipo dejó de usar la plataforma esta semana.`
              : "Aún no hay actividad de equipo en el periodo."
          }
        />
      </section>
    );
  }

  // Active state: render grid 4-up + secondary + k-anon reminder.
  const sessionsPerDayAvg = (engagement.sessionsLast7d / 7).toFixed(1);
  const activationPct =
    engagement.activationRate != null && Number.isFinite(engagement.activationRate)
      ? Math.round(engagement.activationRate * 100)
      : null;

  const totalUsers = Number.isFinite(totalActiveMembers) ? totalActiveMembers : null;

  return (
    <section
      data-v2-engagement
      data-testid="engagement-panel"
      data-state="active"
      style={{ marginBlockStart: space[6], marginBlockEnd: space[5] }}
    >
      <SectionHeader
        eyebrow="Engagement · uso del producto"
        italic="Adopción."
        title={`${engagement.activeUsersLast7d} ${engagement.activeUsersLast7d === 1 ? "persona activa" : "personas activas"} esta semana`}
        subtitle={
          totalUsers != null
            ? `${engagement.sessionsLast7d} sesiones en últimos 7 días · ${engagement.activeUsersLast7d}/${totalUsers} miembros del equipo`
            : `${engagement.sessionsLast7d} sesiones en últimos 7 días`
        }
      />
      <article
        style={{
          background: cssVar.surface,
          border: `1px solid ${cssVar.border}`,
          borderRadius: radius.md,
          padding: space[3],
          display: "flex",
          flexDirection: "column",
          gap: space[3],
        }}
      >
        <div
          data-v2-engagement-stats-grid
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 0,
          }}
        >
          <Stat
            label="ACTIVOS / 7 DÍAS"
            value={String(engagement.activeUsersLast7d)}
            testid="engagement-stat-dau"
            showSeparator={false}
          />
          <Stat
            label="ACTIVOS / 30 DÍAS"
            value={String(engagement.activeUsersLast30d ?? 0)}
            testid="engagement-stat-wau"
            showSeparator={true}
          />
          <Stat
            label="SESIONES / DÍA"
            value={sessionsPerDayAvg}
            testid="engagement-stat-sessions-per-day"
            showSeparator={true}
          />
          <Stat
            label="ACTIVACIÓN"
            value={activationPct != null ? `${activationPct}%` : "—"}
            testid="engagement-stat-activation"
            showSeparator={true}
          />
        </div>

        <div
          data-v2-engagement-secondary
          data-testid="engagement-secondary"
          style={{
            fontSize: font.size.xs,
            color: cssVar.textMuted,
            lineHeight: 1.5,
            paddingBlockStart: space[2],
            borderBlockStart: `1px solid ${cssVar.border}`,
          }}
        >
          {engagement.sessionsLast30d} sesiones en últimos 30 días
          {totalUsers != null && ` · ${engagement.activeUsersLast30d ?? 0}/${totalUsers} del equipo en periodo mensual`}
        </div>
      </article>

      <p
        data-v2-engagement-kanon
        data-testid="engagement-kanon-reminder"
        style={{
          marginBlockStart: space[2],
          marginBlockEnd: 0,
          fontFamily: cssVar.fontMono,
          fontSize: font.size.xs,
          color: cssVar.textMuted,
          letterSpacing: "0.06em",
          lineHeight: 1.5,
        }}
      >
        Datos agregados con k-anon ≥ 5 · activación = miembros con ≥1 sesión en últimos 30 días sobre total del equipo.
      </p>
    </section>
  );
}

function Stat({ label, value, testid, showSeparator }) {
  return (
    <div
      data-v2-engagement-stat
      data-testid={testid}
      style={{
        paddingInline: space[3],
        paddingBlock: space[3],
        textAlign: "center",
        borderInlineStart: showSeparator ? `1px solid ${cssVar.border}` : "none",
      }}
    >
      <div
        style={{
          fontFamily: cssVar.fontMono,
          fontSize: font.size.xs,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: cssVar.textDim,
          fontWeight: font.weight.semibold,
          marginBlockEnd: space[2],
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: cssVar.fontSans,
          fontSize: 28,
          fontWeight: 200,
          color: bioSignal.phosphorCyanInk,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
    </div>
  );
}
