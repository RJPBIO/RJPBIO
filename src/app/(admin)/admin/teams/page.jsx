export const dynamic = "force-dynamic";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import TeamsClient from "./TeamsClient";

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

  const managerIds = teams.map((t) => t.managerId).filter(Boolean);
  const managers = managerIds.length
    ? await orm.user.findMany({ where: { id: { in: managerIds } }, select: { id: true, email: true } })
    : [];
  const managersById = Object.fromEntries(managers.map((u) => [u.id, u.email]));

  const initial = teams.map((t) => ({ ...t, _members: counts[t.id] || 0 }));

  return (
    <>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Equipos ({teams.length})</h1>
      <p style={{ color: "#A7F3D0", marginTop: 4, fontSize: 13 }}>
        Agrupa a tus miembros para comparar engagement y resultados por cohorte.
        La anonimización <code>k=5</code> requiere al menos 5 personas activas por equipo.
      </p>
      <TeamsClient initial={initial} managersById={managersById} unassigned={unassigned} />
    </>
  );
}
