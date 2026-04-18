import { db } from "@/server/db";
import { auth } from "@/server/auth";

export const metadata = { title: "Equipos · Admin" };

export default async function TeamsPage() {
  const session = await auth();
  const orgId = session?.memberships?.find((m) => ["OWNER", "ADMIN"].includes(m.role))?.orgId;
  if (!orgId) return null;
  const orm = await db();
  const [teams, memberships] = await Promise.all([
    orm.team.findMany({ where: { orgId }, orderBy: { name: "asc" } }),
    orm.membership.findMany({ where: { orgId }, select: { teamId: true, userId: true } }),
  ]);
  const counts = memberships.reduce((acc, m) => {
    if (m.teamId) acc[m.teamId] = (acc[m.teamId] || 0) + 1;
    return acc;
  }, {});
  const unassigned = memberships.filter((m) => !m.teamId).length;

  return (
    <>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Equipos ({teams.length})</h1>
      <p style={{ color: "#A7F3D0", marginTop: 4, fontSize: 13 }}>
        Agrupa a tus miembros para comparar engagement y resultados por cohorte.
        La anonimización <code>k=5</code> requiere al menos 5 personas activas por equipo.
      </p>

      <form action="/api/v1/teams" method="post" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8, marginTop: 16, marginBottom: 16 }}>
        <input name="name" placeholder="Nombre (ej. Operaciones)" required maxLength={60} style={input} />
        <input name="managerEmail" placeholder="Email del manager (opcional)" type="email" style={input} />
        <button style={btn}>Crear equipo</button>
      </form>

      <div className="bi-table-wrap">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={th}>Equipo</th>
              <th style={th}>Miembros</th>
              <th style={th}>Manager</th>
              <th style={th}>k-anonymity</th>
            </tr>
          </thead>
          <tbody>
            {teams.length === 0 && (
              <tr><td colSpan={4} style={{ padding: 24, color: "#6B7280", textAlign: "center" }}>
                Sin equipos todavía. Crea el primero arriba.
              </td></tr>
            )}
            {teams.map((t) => {
              const n = counts[t.id] || 0;
              return (
                <tr key={t.id} style={{ borderTop: "1px solid #1F2937" }}>
                  <td style={td}>{t.name}</td>
                  <td style={td}>{n}</td>
                  <td style={td}>{t.managerId ? t.managerId.slice(0, 8) + "…" : "—"}</td>
                  <td style={{ ...td, color: n >= 5 ? "#34D399" : "#F59E0B" }}>
                    {n >= 5 ? "✓ cohorte visible" : `faltan ${5 - n} para reporte`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {unassigned > 0 && (
        <p style={{ marginTop: 12, fontSize: 12, color: "#6EE7B7" }}>
          {unassigned} miembro{unassigned === 1 ? "" : "s"} sin equipo asignado.
          Asigna desde <a href="/admin/members" style={{ color: "#A7F3D0" }}>Miembros</a>.
        </p>
      )}
    </>
  );
}

const input = { padding: "10px 12px", borderRadius: 10, background: "#052E16", color: "#ECFDF5", border: "1px solid #064E3B", fontSize: 14 };
const btn = { ...input, background: "linear-gradient(135deg,#059669,#10B981)", border: 0, cursor: "pointer", fontWeight: 700 };
const th = { textAlign: "left", padding: "8px 10px", fontSize: 12, color: "#6EE7B7", borderBottom: "1px solid #064E3B" };
const td = { padding: "10px", fontSize: 13 };
