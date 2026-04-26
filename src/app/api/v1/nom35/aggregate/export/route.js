/* GET /api/v1/nom35/aggregate/export
   ═══════════════════════════════════════════════════════════════
   Export CSV del aggregate NOM-035 para auditors STPS / compliance
   officers. Misma data que el dashboard /admin/nom35 pero en formato
   procesable (Excel, scripts de auditoría).

   Privacy: misma supresión k≥5 que el dashboard. Si la cohorte no
   tiene suficientes respuestas, devuelve CSV con header y mensaje
   explicativo en lugar de exponer datos individuales.

   Auth: OWNER|ADMIN|MANAGER del org. Audit-logged: cada export queda
   trazado para compliance (quién descargó qué cuándo).

   Format: CSV UTF-8 BOM-prefixed para que Excel lo abra correcto en
   regiones con locale es-MX.
   ═══════════════════════════════════════════════════════════════ */
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";
import { aggregateScores } from "@/lib/nom35/scoring";
import { buildNom35CsvExport } from "@/lib/nom35-csv";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_ROLES = new Set(["OWNER", "ADMIN", "MANAGER"]);

export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const memberships = session.memberships || [];
  const url = new URL(request.url);
  const orgIdParam = url.searchParams.get("orgId");
  const mem = orgIdParam
    ? memberships.find((m) => m.orgId === orgIdParam && ALLOWED_ROLES.has(m.role))
    : memberships.find((m) => ALLOWED_ROLES.has(m.role));
  if (!mem) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const orm = await db();
  const since = new Date(Date.now() - 365 * 86400_000);
  const [org, responses, totalSeats] = await Promise.all([
    orm.org.findUnique({ where: { id: mem.orgId }, select: { name: true } }),
    orm.nom35Response.findMany({
      where: { orgId: mem.orgId, completedAt: { gte: since } },
      select: { total: true, porDominio: true, porCategoria: true, nivel: true, completedAt: true },
      orderBy: { completedAt: "desc" },
      take: 5000,
    }),
    orm.membership.count({ where: { orgId: mem.orgId } }),
  ]);

  const agg = aggregateScores(responses, { minN: 5 });
  const { csv, filename } = buildNom35CsvExport({
    orgName: org?.name,
    generatedAt: new Date(),
    totalSeats,
    totalResponses: responses.length,
    agg,
    generatedBy: session.user.email || session.user.id,
    periodDays: 365,
  });

  await auditLog({
    orgId: mem.orgId,
    actorId: session.user.id,
    action: "nom35.aggregate.exported",
    payload: { rows: responses.length, suppressed: !!agg.suppressed },
  }).catch(() => {});

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
