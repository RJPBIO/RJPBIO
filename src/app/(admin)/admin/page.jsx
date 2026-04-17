import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { anonymize } from "@/server/analytics";

export default async function AdminHome() {
  const session = await auth();
  const orgId = session?.memberships?.[0]?.orgId;
  if (!orgId) return null;
  const orm = await db();
  const [org, members, sessions] = await Promise.all([
    orm.org.findUnique({ where: { id: orgId } }),
    orm.membership.count({ where: { orgId } }),
    orm.neuralSession.findMany({
      where: { orgId, completedAt: { gte: new Date(Date.now() - 30 * 86400_000) } },
    }),
  ]);
  const agg = anonymize(sessions, { k: 5 });

  return (
    <>
      <h1 style={{ fontSize: 26, margin: "0 0 4px" }}>{org?.name}</h1>
      <p style={{ color: "#A7F3D0", marginTop: 0, fontSize: 13 }}>Plan: {org?.plan} · Región: {org?.region}</p>

      <div style={grid}>
        <Card title="Miembros" value={members} sub={`de ${org?.seats || 0} asientos`} />
        <Card title="Sesiones (30d)" value={sessions.length} sub={`${agg.buckets.length} cohortes`} />
        <Card title="Cohortes suprimidas" value={agg.suppressed} sub="k-anonymity k=5" />
        <Card title="Engagement" value={`${Math.round((sessions.length / Math.max(members, 1)))}`} sub="sesiones/miembro" />
      </div>

      <h2 style={{ fontSize: 18, marginTop: 32 }}>Actividad por día (cohortes ≥5)</h2>
      <table style={table}>
        <thead><tr><th>Día</th><th>Equipo</th><th>Usuarios</th><th>Sesiones</th><th>Δ Coherencia</th><th>Δ Mood</th></tr></thead>
        <tbody>
          {agg.buckets.slice(-14).map((b, i) => (
            <tr key={i}>
              <td>{b.day}</td><td>{b.teamId || "org"}</td><td>{b.uniqueUsers}</td>
              <td>{b.sessions}</td>
              <td>{b.avgCoherenciaDelta?.toFixed(1) ?? "—"}</td>
              <td>{b.avgMoodDelta?.toFixed(2) ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function Card({ title, value, sub }) {
  return (
    <div style={card}>
      <div style={{ fontSize: 12, color: "#6EE7B7", textTransform: "uppercase", letterSpacing: 2 }}>{title}</div>
      <div style={{ fontSize: 32, fontWeight: 800, margin: "6px 0" }}>{value}</div>
      <div style={{ fontSize: 12, color: "#A7F3D0" }}>{sub}</div>
    </div>
  );
}

const grid = { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginTop: 20 };
const card = { padding: 18, borderRadius: 16, background: "rgba(5,150,105,.08)", border: "1px solid #064E3B" };
const table = { width: "100%", borderCollapse: "collapse", marginTop: 12, fontSize: 13 };
