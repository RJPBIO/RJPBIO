/* /admin/wellbeing/aggregate — Phase 6F SP-F
   ═══════════════════════════════════════════════════════════════
   Server component dashboard B2B del wellbeing aggregate.
   Patrón clon de /admin/programs/adherence/page.jsx (SP-B):
   auth + db + role gate + agregación inline con k-anon ≥5 +
   audit log + render con admin tokens.

   Marketing copy (D8): "wellbeing trends" / "early-warning detection"
   / NO "burnout score" / NO "predicción". Disclaimer + LFPDPPP/GDPR
   compliance footer obligatorio.

   K-anon multi-nivel:
     · members < 5  → suppressed top-level
     · band count < 5 → null en distribution row
     · signal count < 5 → null en topSignals row
   ═══════════════════════════════════════════════════════════════ */

import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { auditLog } from "@/server/audit";
import { cssVar, radius, space, font } from "@/components/ui/tokens";
import { PageHeader } from "@/components/admin/PageHeader";
import { KPITile } from "@/components/admin/KPITile";

export const metadata = { title: "Wellbeing trends · Admin" };
export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set(["OWNER", "ADMIN", "MANAGER"]);
const MIN_K = 5;
const PERIOD_DAYS = 28;

const LEVEL_LABELS = {
  ok: "Ok",
  watch: "Observación",
  warn: "Atención",
  alert: "Alerta",
};

const LEVEL_TONE = {
  ok: "success",
  watch: "signal",
  warn: "warn",
  alert: "danger",
};

const SIGNAL_LABELS = {
  freqDrop: "Frecuencia ↓",
  moodSlope: "Mood ↓",
  effDrop: "Efectividad ↓",
  hrvDecline: "HRV ↓",
  chronoDyssynchrony: "Cronotipo desalineado",
};

export default async function WellbeingAggregateAdminPage() {
  const session = await auth();
  const memberships = (session?.memberships || []).filter(
    (m) => ALLOWED_ROLES.has(m.role) && !m.deactivatedAt
  );
  const mem =
    memberships.find((m) => m.org && !m.org.personal) ||
    memberships[0];

  if (!mem) {
    return (
      <p style={{ color: cssVar.textMuted }}>
        No tienes permisos para ver este reporte. Reservado a OWNER, ADMIN y MANAGER.
      </p>
    );
  }

  const orgId = mem.orgId;
  const orm = await db();
  const since = new Date(Date.now() - PERIOD_DAYS * 86400_000);

  // Members del org.
  let members = [];
  try {
    members = await orm.membership.findMany({
      where: { orgId, deactivatedAt: null },
    });
  } catch {
    members = [];
  }
  const userIds = members.map((m) => m.userId).filter(Boolean);

  // K-anon top-level.
  if (userIds.length < MIN_K) {
    await auditLog({
      orgId,
      actorId: session.user?.id,
      action: "org.wellbeing.aggregate.viewed",
      target: orgId,
      payload: {
        days: PERIOD_DAYS,
        suppressed: true,
        reason: "k_anonymity_members",
        members: userIds.length,
        surface: "admin-page",
      },
    }).catch(() => {});
    return (
      <>
        <PageHeader
          eyebrow="Wellbeing · early-warning"
          italic="Wellbeing"
          title="trends agregadas."
          subtitle={`${mem.org?.name || "Tu organización"} · ${PERIOD_DAYS} días`}
        />
        <SuppressedBlock n={userIds.length} />
        <ComplianceFooter />
      </>
    );
  }

  // Latest BurnoutScore per user.
  let scores = [];
  try {
    scores = await orm.burnoutScore.findMany({
      where: { userId: { in: userIds }, computedAt: { gte: since } },
      orderBy: { computedAt: "desc" },
    });
  } catch {
    scores = [];
  }

  const latestByUser = new Map();
  for (const s of scores) {
    if (!s?.userId) continue;
    const prev = latestByUser.get(s.userId);
    const ts = s.computedAt instanceof Date ? s.computedAt.getTime() : Date.parse(s.computedAt);
    const prevTs = prev?.computedAt instanceof Date
      ? prev.computedAt.getTime()
      : Date.parse(prev?.computedAt || 0);
    if (!prev || ts > prevTs) latestByUser.set(s.userId, s);
  }
  const latestScores = Array.from(latestByUser.values());

  // Distribution by level.
  const rawDistribution = { ok: 0, watch: 0, warn: 0, alert: 0 };
  for (const s of latestScores) {
    if (rawDistribution[s.level] !== undefined) rawDistribution[s.level] += 1;
  }
  const distribution = {};
  for (const [level, count] of Object.entries(rawDistribution)) {
    distribution[level] = count >= MIN_K ? count : null;
  }

  // Top signals across org (k-anon per signal).
  const signalCounts = new Map();
  for (const s of latestScores) {
    const sigs = Array.isArray(s.signals)
      ? s.signals
      : (() => {
          try { return JSON.parse(s.signals); } catch { return []; }
        })();
    for (const sig of sigs) {
      signalCounts.set(sig, (signalCounts.get(sig) || 0) + 1);
    }
  }
  const topSignals = Array.from(signalCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([signal, count]) => ({
      signal,
      count: count >= MIN_K ? count : null,
      suppressed: count < MIN_K,
    }));

  await auditLog({
    orgId,
    actorId: session.user?.id,
    action: "org.wellbeing.aggregate.viewed",
    target: orgId,
    payload: {
      days: PERIOD_DAYS,
      members: userIds.length,
      n: latestScores.length,
      suppressedBands: Object.values(distribution).filter((v) => v == null).length,
      surface: "admin-page",
    },
  }).catch(() => {});

  return (
    <>
      <PageHeader
        eyebrow="Wellbeing · early-warning"
        italic="Wellbeing"
        title="trends agregadas."
        subtitle={`${mem.org?.name || "Tu organización"} · últimos ${PERIOD_DAYS} días · k-anon ≥ ${MIN_K}`}
      />

      <section style={kpiGrid}>
        <KPITile
          label="Miembros activos"
          value={userIds.length}
          sub="del org"
          tone="signal"
        />
        <KPITile
          label="Scores recientes"
          value={latestScores.length}
          sub={`en ${PERIOD_DAYS} días`}
          tone="neutral"
        />
        <KPITile
          label="Bandas expuestas"
          value={Object.values(distribution).filter((v) => v != null).length}
          sub={`de 4 (k≥${MIN_K})`}
          tone="signal"
        />
      </section>

      <h2 style={h2Style}>Distribución por nivel</h2>
      <div style={tableContainer}>
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: cssVar.surface2 }}>
              <th style={thStyle}>Nivel</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Miembros</th>
              <th style={thStyle}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(distribution).map(([level, count]) => (
              <DistributionRow key={level} level={level} count={count} />
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={h2Style}>Top señales</h2>
      <p style={{ color: cssVar.textMuted, fontSize: font.size.sm, marginBlockStart: -space[2] }}>
        Señales más comunes entre miembros con scores recientes. Suprimidas si N&lt;{MIN_K}.
      </p>
      <div style={tableContainer}>
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: cssVar.surface2 }}>
              <th style={thStyle}>Señal</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Miembros</th>
            </tr>
          </thead>
          <tbody>
            {topSignals.length === 0 ? (
              <tr>
                <td style={{ ...tdStyle, color: cssVar.textMuted }} colSpan={2}>
                  Sin señales detectadas en este periodo.
                </td>
              </tr>
            ) : (
              topSignals.map((s) => <SignalRow key={s.signal} entry={s} />)
            )}
          </tbody>
        </table>
      </div>

      <ComplianceFooter />
    </>
  );
}

function DistributionRow({ level, count }) {
  const label = LEVEL_LABELS[level] || level;
  const tone = LEVEL_TONE[level];
  const dotColor =
    tone === "success" ? "#10B981" :
    tone === "warn" ? "#D97706" :
    tone === "danger" ? "#DC2626" :
    "#22D3EE";
  const display = count == null ? "—" : count;
  return (
    <tr style={{ borderBlockStart: `1px solid ${cssVar.border}` }}>
      <td style={tdStyle}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span aria-hidden="true" style={{
            width: 8, height: 8, borderRadius: "50%",
            background: dotColor,
          }} />
          {label}
        </span>
      </td>
      <td style={{
        ...tdStyle,
        textAlign: "right",
        fontFamily: cssVar.fontMono,
        color: count == null ? cssVar.textMuted : cssVar.text,
      }}>
        {display}
      </td>
      <td style={{ ...tdStyle, color: cssVar.textMuted, fontSize: font.size.sm }}>
        {count == null ? `Suprimido (k<${MIN_K})` : "Expuesto"}
      </td>
    </tr>
  );
}

function SignalRow({ entry }) {
  const label = SIGNAL_LABELS[entry.signal] || entry.signal;
  return (
    <tr style={{ borderBlockStart: `1px solid ${cssVar.border}` }}>
      <td style={tdStyle}>{label}</td>
      <td style={{
        ...tdStyle,
        textAlign: "right",
        fontFamily: cssVar.fontMono,
        color: entry.suppressed ? cssVar.textMuted : cssVar.text,
      }}>
        {entry.suppressed ? `Suprimido (k<${MIN_K})` : entry.count}
      </td>
    </tr>
  );
}

function SuppressedBlock({ n }) {
  return (
    <section style={{
      marginBlockStart: space[5],
      padding: space[5],
      background: cssVar.surface,
      border: `1px solid ${cssVar.border}`,
      borderRadius: radius.md,
      display: "flex",
      flexDirection: "column",
      gap: space[2],
    }}>
      <h3 style={{
        margin: 0,
        fontSize: font.size.lg,
        fontWeight: font.weight.bold,
        color: cssVar.text,
      }}>
        Sin muestra suficiente
      </h3>
      <p style={{ color: cssVar.textMuted, lineHeight: 1.55, margin: 0 }}>
        Reporte requiere mínimo {MIN_K} miembros activos. Tu organización tiene {n}.
        Conforme tu equipo crezca y use Bio-Ignición, el reporte se mostrará automáticamente.
      </p>
    </section>
  );
}

function ComplianceFooter() {
  return (
    <footer style={{
      marginBlockStart: space[6],
      paddingBlockStart: space[4],
      borderBlockStart: `1px solid ${cssVar.border}`,
      display: "flex",
      flexDirection: "column",
      gap: space[2],
      color: cssVar.textMuted,
      fontSize: font.size.xs,
      lineHeight: 1.55,
    }}>
      <p style={{ margin: 0 }}>
        Datos agregados con anonimización k≥{MIN_K} · LFPDPPP / GDPR Art-89 compliant ·
        Bio-Ignición no es dispositivo médico ni sustituye atención profesional.
        Indicador retrospectivo, no diagnóstico.
      </p>
      <p style={{ margin: 0, color: cssVar.textDim }}>
        Methodology: heuristic-retrospective · 5 signals (frecuencia, mood, efectividad,
        HRV, cronotipo) · Maslach&Leiter 2016 informed.
      </p>
    </footer>
  );
}

const kpiGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: space[3],
  marginBlockStart: space[5],
};

const h2Style = {
  fontSize: font.size.lg,
  fontWeight: font.weight.bold,
  letterSpacing: font.tracking.tight,
  marginBlockStart: space[6],
};

const tableContainer = {
  marginBlockStart: space[3],
  background: cssVar.surface,
  border: `1px solid ${cssVar.border}`,
  borderRadius: radius.md,
  overflow: "hidden",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: font.size.sm,
};

const thStyle = {
  textAlign: "left",
  padding: `${space[3]}px ${space[4]}px`,
  fontFamily: cssVar.fontMono,
  fontSize: font.size.xs,
  color: cssVar.textDim,
  fontWeight: font.weight.semibold,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
};

const tdStyle = {
  padding: `${space[3]}px ${space[4]}px`,
  color: cssVar.text,
};
