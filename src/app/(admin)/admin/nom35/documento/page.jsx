import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { aggregateScores } from "@/lib/nom35/scoring";
import Nom35DocumentClient from "./Nom35DocumentClient";
import { cssVar } from "@/components/ui/tokens";

export const metadata = { title: "Documento NOM-035 · Admin" };
export const dynamic = "force-dynamic";

const ALLOWED = new Set(["OWNER", "ADMIN"]);

export default async function Nom35DocumentoPage() {
  const session = await auth();
  const mem = (session?.memberships || []).find((m) => ALLOWED.has(m.role));
  if (!mem) return <p style={{ color: cssVar.textMuted }}>Sólo OWNER/ADMIN pueden generar el documento.</p>;

  const orm = await db();
  const [org, members, responses] = await Promise.all([
    orm.org.findUnique({ where: { id: mem.orgId } }),
    orm.membership.count({ where: { orgId: mem.orgId } }),
    orm.nom35Response.findMany({
      where: { orgId: mem.orgId },
      select: { total: true, porDominio: true, porCategoria: true, nivel: true, completedAt: true },
      orderBy: { completedAt: "desc" },
      take: 5000,
    }),
  ]);

  const agg = aggregateScores(responses, { minN: 5 });
  const evaluaciones = responses.map((r) => ({
    fecha: r.completedAt.toISOString().slice(0, 10),
    nivel: r.nivel,
    total: r.total,
  }));

  return (
    <Nom35DocumentClient
      orgName={org?.name || ""}
      orgRegion={org?.region || "MX"}
      totalMembers={members}
      totalResponses={responses.length}
      aggregate={agg}
      evaluaciones={evaluaciones.slice(0, 100)}
      adminName={session.user?.name || session.user?.email || ""}
    />
  );
}
