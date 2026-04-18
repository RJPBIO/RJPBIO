import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { anonymize } from "@/server/analytics";

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, margin: "0 0 4px" }}>{org?.name}</h1>
          <p style={{ color: "#A7F3D0", marginTop: 0, fontSize: 13 }}>
            Plan: <strong>{org?.plan}</strong> · Región: {org?.region || "—"}
          </p>
        </div>
        <nav aria-label="Periodo" style={{ display: "flex", gap: 4, background: "#052E16", padding: 4, borderRadius: 999, border: "1px solid #064E3B" }}>
          {Object.entries(PERIODS).map(([k, p]) => {
            const active = k === periodKey;
            return (
              <a key={k} href={`/admin?period=${k}`} style={{
                padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700, textDecoration: "none",
                color: active ? "#052E16" : "#A7F3D0",
                background: active ? "linear-gradient(135deg,#34D399,#10B981)" : "transparent",
              }}>
                {p.label}
              </a>
            );
          })}
        </nav>
      </div>

      <div style={grid}>
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
      </div>

      <h2 style={{ fontSize: 18, marginTop: 32 }}>Actividad por día (cohortes ≥5)</h2>
      {agg.buckets.length === 0 ? (
        <p style={{ color: "#94A3B8", fontSize: 13 }}>
          Sin datos suficientes para el periodo seleccionado. Prueba un rango más amplio.
        </p>
      ) : (
        <div className="bi-table-wrap">
          <table style={table}>
            <thead>
              <tr style={{ color: "#6EE7B7" }}>
                <th style={th}>Día</th>
                <th style={th}>Equipo</th>
                <th style={th}>Usuarios</th>
                <th style={th}>Sesiones</th>
                <th style={th}>Δ Coherencia</th>
                <th style={th}>Δ Mood</th>
              </tr>
            </thead>
            <tbody>
              {agg.buckets.slice(-14).map((b, i) => (
                <tr key={i} style={{ borderTop: "1px solid #064E3B" }}>
                  <td style={td}>{b.day}</td>
                  <td style={td}>{b.teamId || "org"}</td>
                  <td style={td}>{b.uniqueUsers}</td>
                  <td style={td}>{b.sessions}</td>
                  <td style={td}>{b.avgCoherenciaDelta?.toFixed(1) ?? "—"}</td>
                  <td style={td}>{b.avgMoodDelta?.toFixed(2) ?? "—"}</td>
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
  const color = tone === "up" ? "#34D399" : tone === "down" ? "#FBBF24" : "#A7F3D0";
  return (
    <div style={card}>
      <div style={{ fontSize: 12, color: "#6EE7B7", textTransform: "uppercase", letterSpacing: 2 }}>{title}</div>
      <div style={{ fontSize: 32, fontWeight: 800, margin: "6px 0" }}>{value}</div>
      <div style={{ fontSize: 12, color }}>{sub}</div>
    </div>
  );
}

const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginTop: 20 };
const card = { padding: 18, borderRadius: 16, background: "rgba(5,150,105,.08)", border: "1px solid #064E3B" };
const table = { width: "100%", borderCollapse: "collapse", marginTop: 12, fontSize: 13 };
const th = { textAlign: "left", padding: "8px 10px", fontSize: 12, borderBottom: "1px solid #064E3B" };
const td = { padding: "10px" };
