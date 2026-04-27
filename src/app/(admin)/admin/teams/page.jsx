export const dynamic = "force-dynamic";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import TeamsClient from "./TeamsClient";
import { PageHeader } from "@/components/admin/PageHeader";
import { cssVar, space, font } from "@/components/ui/tokens";

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
      <PageHeader
        eyebrow="Personas · cohort analytics"
        italic="Equipos"
        title={`que se miden juntos.`}
        subtitle={
          <>
            Agrupa miembros para comparar engagement y resultados por cohorte.
            Anonimización <code style={{ fontFamily: cssVar.fontMono, color: cssVar.text }}>k=5</code> requiere ≥5 personas activas por equipo.
            <span style={{ marginInlineStart: 8, opacity: 0.7 }}>· {teams.length} equipo(s)</span>
          </>
        }
      />
      <TeamsClient initial={initial} managersById={managersById} unassigned={unassigned} />
    </>
  );
}
