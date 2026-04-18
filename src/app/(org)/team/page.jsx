import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { anonymize } from "@/server/analytics";
import { redirect } from "next/navigation";

export const metadata = { title: "Equipo" };
export const dynamic = "force-dynamic";

export default async function TeamPage({ searchParams }) {
  const session = await auth();
  if (!session?.user) redirect("/signin?next=/team");
  const mgr = session.memberships.find((m) => ["OWNER","ADMIN","MANAGER"].includes(m.role));
  if (!mgr) redirect("/");
  const sp = await searchParams;
  const orm = await db();
  const teams = await orm.team.findMany({ where: { orgId: mgr.orgId } });
  const teamId = sp?.team || teams[0]?.id;
  const from = new Date(Date.now() - 30 * 86400_000);
  const sessions = await orm.neuralSession.findMany({
    where: { orgId: mgr.orgId, ...(teamId ? { teamId } : {}), completedAt: { gte: from } },
  });
  const agg = anonymize(sessions, { k: 5, epsilon: 1.0 });

  return (
    <main style={{ padding: "28px 24px", color: "#ECFDF5", background: "#0B0E14", minHeight: "100dvh" }}>
      <h1>Panel de equipo</h1>
      <p style={{ color: "#A7F3D0", fontSize: 13 }}>
        Datos agregados con k-anonymity ≥5 y noise diferencial (ε=1.0). Nunca se identifican individuos.
      </p>
      <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
        {teams.map((t) => (
          <a key={t.id} href={`/team?team=${t.id}`} style={{ padding: "8px 14px", borderRadius: 999, border: "1px solid #064E3B", color: t.id === teamId ? "#10B981" : "#A7F3D0", textDecoration: "none" }}>
            {t.name}
          </a>
        ))}
      </div>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        <Stat label="Sesiones (30d)" v={sessions.length} />
        <Stat label="Cohortes visibles" v={agg.buckets.length} />
        <Stat label="Suprimidas" v={agg.suppressed} sub="<5 usuarios" />
        <Stat label="k" v={agg.k} sub="anonymity" />
      </section>
      <h2 style={{ marginTop: 28, fontSize: 16 }}>Tendencias por día</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead><tr><th>Día</th><th>Usuarios</th><th>Sesiones</th><th>Δ coherencia</th><th>Δ mood</th></tr></thead>
        <tbody>
          {agg.buckets.map((b, i) => (
            <tr key={i}>
              <td>{b.day}</td><td>{b.uniqueUsers}</td><td>{b.sessions}</td>
              <td>{b.avgCoherenciaDelta?.toFixed(1) ?? "—"}</td>
              <td>{b.avgMoodDelta?.toFixed(2) ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

function Stat({ label, v, sub }) {
  return (
    <div style={{ padding: 18, borderRadius: 16, background: "rgba(5,150,105,.08)", border: "1px solid #064E3B" }}>
      <div style={{ fontSize: 12, color: "#6EE7B7", textTransform: "uppercase", letterSpacing: 2 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, margin: "6px 0" }}>{v}</div>
      {sub && <div style={{ fontSize: 12, color: "#A7F3D0" }}>{sub}</div>}
    </div>
  );
}
