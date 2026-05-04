/* /admin/programs/adherence — Phase 6F SP-B
   ─────────────────────────────────────────────────────────────────
   Dashboard B2B de adherencia a programas adaptativos. Sigue el patrón
   establecido por /admin/nom35/page.jsx: server component que consulta
   directo `orm.programAssignment.findMany` con k-anon ≥ 5 enforced,
   role gate OWNER|ADMIN|MANAGER, y renderiza con primitivas admin
   (PageHeader + KPITile) usando tokens admin (cssVar, space, font).

   Privacy: misma supresión k≥5 que el endpoint REST equivalente
   (/api/v1/orgs/[orgId]/programs/adherence). Programas con n<5 se
   muestran como "suprimido" sin métricas individuales.
   ───────────────────────────────────────────────────────────────── */

import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { auditLog } from "@/server/audit";
import { PROGRAMS } from "@/lib/programs";
import { cssVar, radius, space, font } from "@/components/ui/tokens";
import { PageHeader } from "@/components/admin/PageHeader";
import { KPITile } from "@/components/admin/KPITile";

export const metadata = { title: "Adherencia a programas · Admin" };
export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set(["OWNER", "ADMIN", "MANAGER"]);
const MIN_K = 5;
const PERIOD_DAYS = 90;

export default async function ProgramsAdherenceAdminPage() {
  const session = await auth();
  const memberships = session?.memberships || [];
  const mem = memberships.find(
    (m) => ALLOWED_ROLES.has(m.role) && !m.deactivatedAt && !m.org?.personal
  ) || memberships.find((m) => ALLOWED_ROLES.has(m.role) && !m.deactivatedAt);

  if (!mem) {
    return (
      <p style={{ color: cssVar.textMuted }}>
        No tienes permisos para ver este reporte.
      </p>
    );
  }

  const orgId = mem.orgId;
  const orm = await db();
  const since = new Date(Date.now() - PERIOD_DAYS * 86400_000);

  let assignments = [];
  try {
    assignments = await orm.programAssignment.findMany({
      where: { orgId, startedAt: { gte: since } },
    });
  } catch {
    assignments = [];
  }

  // Agregación por programId (mismo cálculo que el endpoint REST).
  const byProgram = new Map();
  for (const a of assignments || []) {
    if (!a || !a.programId) continue;
    const prev = byProgram.get(a.programId) || {
      programId: a.programId,
      n: 0, completed: 0, abandoned: 0, active: 0,
    };
    prev.n += 1;
    if (a.completedAt) prev.completed += 1;
    else if (a.abandonedAt) prev.abandoned += 1;
    else prev.active += 1;
    byProgram.set(a.programId, prev);
  }

  const programs = Array.from(byProgram.values()).map((p) => ({
    ...p,
    suppressed: p.n < MIN_K,
    completionRate: p.n >= MIN_K ? +(p.completed / p.n).toFixed(3) : null,
    abandonRate: p.n >= MIN_K ? +(p.abandoned / p.n).toFixed(3) : null,
  }));

  // Totals (aggregate, no k-anon en KPIs globales — son sumas no comparativas).
  const totalAssignments = assignments.length;
  const totalCompleted = programs.reduce((s, p) => s + (p.completed || 0), 0);
  const totalActive = programs.reduce((s, p) => s + (p.active || 0), 0);
  const overallCompletionRate = totalAssignments >= MIN_K && totalAssignments > 0
    ? +(totalCompleted / totalAssignments).toFixed(3)
    : null;

  // Audit log — patrón consistente con /admin/nom35.
  await auditLog({
    orgId,
    actorId: session.user?.id,
    action: "org.program.adherence.viewed",
    target: orgId,
    payload: {
      periodDays: PERIOD_DAYS,
      totalAssignments,
      programsCount: programs.length,
      suppressedCount: programs.filter((p) => p.suppressed).length,
      surface: "admin-page",
    },
  }).catch(() => {});

  return (
    <>
      <PageHeader
        eyebrow="Programas · Adherencia"
        italic="Adherencia"
        title="agregada por programa."
        subtitle={`Últimos ${PERIOD_DAYS} días. Muestras < ${MIN_K} se suprimen por privacidad (k-anonimato).`}
      />

      <section style={kpiGrid}>
        <KPITile
          label="Asignaciones totales"
          value={totalAssignments}
          sub={`en ${PERIOD_DAYS} días`}
          tone="signal"
        />
        <KPITile
          label="Completadas"
          value={totalCompleted}
          sub={overallCompletionRate != null
            ? `${Math.round(overallCompletionRate * 100)}% del periodo`
            : "Sin muestra suficiente"}
          tone="success"
        />
        <KPITile
          label="Activas"
          value={totalActive}
          sub="programas en curso"
          tone="signal"
        />
        <KPITile
          label="Programas distintos"
          value={programs.length}
          sub={`${programs.filter((p) => p.suppressed).length} suprimidos por k<${MIN_K}`}
          tone="neutral"
        />
      </section>

      <h2 style={h2Style}>Por programa</h2>

      {programs.length === 0 ? (
        <EmptyBlock />
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: space[3],
          marginTop: space[3],
        }}>
          {programs.map((p) => (
            <ProgramCard key={p.programId} program={p} />
          ))}
        </div>
      )}
    </>
  );
}

function ProgramCard({ program }) {
  const catalog = PROGRAMS.find((p) => p.id === program.programId);
  const programName = catalog?.n || program.programId;
  const tag = catalog?.tg || program.programId.slice(0, 2).toUpperCase();
  const duration = catalog?.duration || null;

  if (program.suppressed) {
    return (
      <article
        data-suppressed="true"
        style={cardStyle}
      >
        <div style={cardHeader}>
          <span style={cardTag}>{tag}</span>
          <span style={cardName}>{programName}</span>
        </div>
        <p style={{ ...cardCopy, color: cssVar.textMuted }}>
          Sin muestra suficiente para mostrar (mínimo {MIN_K} personas).
        </p>
        <span style={cardFooter}>k-anonimato</span>
      </article>
    );
  }

  return (
    <article style={cardStyle}>
      <div style={cardHeader}>
        <span style={cardTag}>{tag}</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={cardName}>{programName}</span>
          {duration && (
            <span style={{ color: cssVar.textMuted, fontSize: font.size.xs }}>
              {duration} días · catálogo
            </span>
          )}
        </div>
      </div>

      <div style={statsRow}>
        <Stat label="Asignados" value={program.n} />
        <Stat label="Completados" value={program.completed} tone="success" />
        <Stat label="Activos" value={program.active} tone="signal" />
        <Stat label="Abandonados" value={program.abandoned} tone="warn" />
      </div>

      <ProgressBar
        label={`Completion: ${Math.round((program.completionRate || 0) * 100)}%`}
        value={program.completionRate || 0}
      />
      <ProgressBar
        label={`Abandono: ${Math.round((program.abandonRate || 0) * 100)}%`}
        value={program.abandonRate || 0}
        tone="warn"
      />
    </article>
  );
}

function Stat({ label, value, tone = "neutral" }) {
  const color = tone === "success" ? "#10B981"
    : tone === "warn" ? "#D97706"
    : tone === "danger" ? "#DC2626"
    : tone === "signal" ? "#22D3EE"
    : cssVar.text;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{
        fontSize: font.size.xs, color: cssVar.textMuted,
        textTransform: "uppercase", letterSpacing: font.tracking.wide,
        fontWeight: font.weight.semibold,
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: cssVar.fontMono,
        fontSize: font.size.xl,
        fontWeight: font.weight.black,
        color,
        lineHeight: 1,
      }}>
        {value}
      </span>
    </div>
  );
}

function ProgressBar({ label, value, tone = "signal" }) {
  const color = tone === "warn" ? "#D97706" : "#22D3EE";
  const pct = Math.min(100, Math.max(0, value * 100));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{
        fontSize: font.size.xs, color: cssVar.textMuted,
        textTransform: "uppercase", letterSpacing: font.tracking.wide,
        fontWeight: font.weight.semibold,
      }}>
        {label}
      </span>
      <div style={{
        height: 4,
        background: "rgba(255,255,255,0.06)",
        borderRadius: 999,
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: color,
        }} />
      </div>
    </div>
  );
}

function EmptyBlock() {
  return (
    <div style={{
      marginTop: space[3],
      padding: `${space[5]}px ${space[4]}px`,
      background: cssVar.surface,
      border: `1px solid ${cssVar.border}`,
      borderRadius: radius.md,
      color: cssVar.textMuted,
      textAlign: "center",
    }}>
      No hay asignaciones de programa en el periodo seleccionado.
    </div>
  );
}

const kpiGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: space[3],
  marginTop: space[5],
};

const h2Style = {
  fontSize: font.size.lg,
  fontWeight: font.weight.bold,
  letterSpacing: font.tracking.tight,
  marginTop: space[6],
};

const cardStyle = {
  background: cssVar.surface,
  border: `1px solid ${cssVar.border}`,
  borderRadius: radius.md,
  padding: space[4],
  display: "flex",
  flexDirection: "column",
  gap: space[3],
};

const cardHeader = {
  display: "flex",
  alignItems: "center",
  gap: space[3],
};

const cardTag = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 36, height: 36,
  background: cssVar.surface2,
  borderRadius: radius.sm,
  fontFamily: cssVar.fontMono,
  fontSize: font.size.xs,
  fontWeight: font.weight.bold,
  color: cssVar.textMuted,
  letterSpacing: "0.04em",
};

const cardName = {
  fontSize: font.size.base,
  fontWeight: font.weight.bold,
  color: cssVar.text,
};

const cardCopy = {
  fontSize: font.size.sm,
  lineHeight: 1.5,
  margin: 0,
};

const cardFooter = {
  fontSize: font.size.xs,
  color: cssVar.textMuted,
  textTransform: "uppercase",
  letterSpacing: font.tracking.wide,
  fontWeight: font.weight.semibold,
};

const statsRow = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: space[3],
};
