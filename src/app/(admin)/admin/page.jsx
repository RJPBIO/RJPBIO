import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { anonymize } from "@/server/analytics";
import { cssVar, radius, space, font } from "@/components/ui/tokens";

const PERIODS = {
  "7":  { days: 7,  label: "7 días"  },
  "30": { days: 30, label: "30 días" },
  "90": { days: 90, label: "90 días" },
};

export default async function AdminHome({ searchParams }) {
  const session = await auth();
  const orgId = session?.memberships?.find((m) => ["OWNER", "ADMIN"].includes(m.role))?.orgId
             ?? session?.memberships?.[0]?.orgId;
  if (!orgId) return null;
  const sp = (await searchParams) || {};
  const periodKey = typeof sp.period === "string" && PERIODS[sp.period] ? sp.period : "30";
  const days = PERIODS[periodKey].days;

  const orm = await db();
  const since = new Date(Date.now() - days * 86400_000);
  const [org, members, sessions, prevSessions] = await Promise.all([
    orm.org.findUnique({ where: { id: orgId } }),
    orm.membership.count({ where: { orgId } }),
    orm.neuralSession.findMany({ where: { orgId, completedAt: { gte: since } } }),
    orm.neuralSession.count({
      where: { orgId, completedAt: { gte: new Date(Date.now() - days * 2 * 86400_000), lt: since } },
    }),
  ]);
  const agg = anonymize(sessions, { k: 5 });
  const delta = prevSessions === 0 ? null : ((sessions.length - prevSessions) / prevSessions) * 100;

  return (
    <>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: space[3],
      }}>
        <div>
          <h1 style={{
            fontSize: font.size["2xl"],
            fontWeight: font.weight.black,
            letterSpacing: font.tracking.tight,
            margin: 0,
            color: cssVar.text,
          }}>
            {org?.name}
          </h1>
          <p style={{
            color: cssVar.textMuted,
            marginTop: space[1],
            fontSize: font.size.sm,
          }}>
            Plan: <strong style={{ color: cssVar.text }}>{org?.plan}</strong> · Región: {org?.region || "—"}
          </p>
        </div>
        <nav
          aria-label="Periodo"
          style={{
            display: "flex",
            gap: space[0.5],
            background: cssVar.surface2,
            padding: space[0.5],
            borderRadius: radius.full,
            border: `1px solid ${cssVar.border}`,
          }}
        >
          {Object.entries(PERIODS).map(([k, p]) => {
            const active = k === periodKey;
            return (
              <a
                key={k}
                href={`/admin?period=${k}`}
                style={{
                  padding: `${space[1.5]}px ${space[3]}px`,
                  borderRadius: radius.full,
                  fontSize: font.size.xs,
                  fontWeight: font.weight.bold,
                  textDecoration: "none",
                  color: active ? cssVar.accentInk : cssVar.textDim,
                  background: active ? cssVar.accent : "transparent",
                  transition: "background .15s ease, color .15s ease",
                }}
              >
                {p.label}
              </a>
            );
          })}
        </nav>
      </div>

      <section style={grid}>
        <Card title="Miembros" value={members} sub={`de ${org?.seats || 0} asientos`} />
        <Card
          title={`Sesiones (${days}d)`}
          value={sessions.length}
          sub={delta == null ? `${agg.buckets.length} cohortes` : `${delta > 0 ? "+" : ""}${delta.toFixed(0)}% vs periodo anterior`}
          tone={delta == null ? null : delta >= 0 ? "up" : "down"}
        />
        <Card title="Cohortes suprimidas" value={agg.suppressed} sub="k-anonymity k=5" />
        <Card
          title="Engagement"
          value={members > 0 ? (sessions.length / members).toFixed(1) : "0"}
          sub="sesiones/miembro"
        />
      </section>

      <h2 style={{
        fontSize: font.size.lg,
        fontWeight: font.weight.bold,
        letterSpacing: font.tracking.tight,
        marginTop: space[6],
      }}>
        Actividad por día (cohortes ≥5)
      </h2>

      {agg.buckets.length === 0 ? (
        <p style={{ color: cssVar.textMuted, fontSize: font.size.sm }}>
          Sin datos suficientes para el periodo seleccionado. Prueba un rango más amplio.
        </p>
      ) : (
        <div style={{
          marginTop: space[3],
          background: cssVar.surface,
          border: `1px solid ${cssVar.border}`,
          borderRadius: radius.md,
          overflow: "hidden",
        }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: cssVar.surface2 }}>
                <th style={thStyle}>Día</th>
                <th style={thStyle}>Equipo</th>
                <th style={thStyle}>Usuarios</th>
                <th style={thStyle}>Sesiones</th>
                <th style={thStyle}>Δ Coherencia</th>
                <th style={thStyle}>Δ Mood</th>
              </tr>
            </thead>
            <tbody>
              {agg.buckets.slice(-14).map((b, i) => (
                <tr key={i} style={{ borderBlockStart: `1px solid ${cssVar.border}` }}>
                  <td style={tdStyle}>{b.day}</td>
                  <td style={{ ...tdStyle, color: cssVar.textMuted }}>{b.teamId || "org"}</td>
                  <td style={{ ...tdStyle, fontFamily: cssVar.fontMono }}>{b.uniqueUsers}</td>
                  <td style={{ ...tdStyle, fontFamily: cssVar.fontMono }}>{b.sessions}</td>
                  <td style={{ ...tdStyle, fontFamily: cssVar.fontMono }}>{b.avgCoherenciaDelta?.toFixed(1) ?? "—"}</td>
                  <td style={{ ...tdStyle, fontFamily: cssVar.fontMono }}>{b.avgMoodDelta?.toFixed(2) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Card({ title, value, sub, tone }) {
  const subColor = tone === "up" ? cssVar.accent : tone === "down" ? cssVar.warn : cssVar.textMuted;
  return (
    <div style={{
      padding: space[4],
      borderRadius: radius.md,
      background: cssVar.accentSoft,
      border: `1px solid ${cssVar.border}`,
    }}>
      <div style={{
        fontSize: font.size.xs,
        color: cssVar.textDim,
        textTransform: "uppercase",
        letterSpacing: font.tracking.wide,
        fontWeight: font.weight.semibold,
      }}>
        {title}
      </div>
      <div style={{
        fontSize: font.size["2xl"],
        fontWeight: font.weight.black,
        margin: `${space[1]}px 0`,
        color: cssVar.text,
        fontFamily: cssVar.fontMono,
      }}>
        {value}
      </div>
      <div style={{ fontSize: font.size.xs, color: subColor }}>{sub}</div>
    </div>
  );
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: space[3],
  marginTop: space[5],
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: font.size.sm,
};

const thStyle = {
  textAlign: "left",
  padding: `${space[3]}px ${space[4]}px`,
  fontSize: font.size.xs,
  color: cssVar.textDim,
  fontWeight: font.weight.semibold,
  textTransform: "uppercase",
  letterSpacing: font.tracking.wide,
};

const tdStyle = {
  padding: `${space[3]}px ${space[4]}px`,
  color: cssVar.text,
};
