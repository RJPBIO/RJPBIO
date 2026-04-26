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
import { DOMINIOS, CATEGORIAS } from "@/lib/nom35/items";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_ROLES = new Set(["OWNER", "ADMIN", "MANAGER"]);

function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowsToCsv(rows) {
  return rows.map((r) => r.map(csvEscape).join(",")).join("\r\n");
}

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
  const generatedAt = new Date().toISOString();
  const orgName = org?.name || "Organización";

  // CSV con metadata header + secciones múltiples (estilo informe).
  // BOM ﻿ al inicio para que Excel detecte UTF-8 correctamente.
  const lines = [["BIO-IGNICIÓN — NOM-035 STPS-2018 · Informe Agregado"]];
  lines.push([]);
  lines.push(["Organización", orgName]);
  lines.push(["Generado", generatedAt]);
  lines.push(["Periodo", "Últimos 365 días"]);
  lines.push(["Total miembros", totalSeats]);
  lines.push(["Total respuestas", responses.length]);
  lines.push(["Cobertura %", totalSeats ? Math.round((responses.length / totalSeats) * 100) : 0]);
  lines.push([]);

  if (agg.suppressed) {
    lines.push(["Datos suprimidos por privacidad"]);
    lines.push(["Razón", agg.reason || "Muestra menor a k=5 — el agregado podría reidentificar individuos"]);
    lines.push([]);
  } else {
    lines.push(["RESUMEN GLOBAL"]);
    lines.push(["Puntaje promedio", agg.avgTotal]);
    lines.push(["Nivel promedio", agg.nivelPromedio]);
    lines.push([]);
    lines.push(["DISTRIBUCIÓN DE NIVELES"]);
    lines.push(["Nivel", "Conteo", "Porcentaje"]);
    const total = responses.length;
    for (const nivel of ["nulo", "bajo", "medio", "alto", "muy_alto"]) {
      const n = agg.nivelCounts?.[nivel] || 0;
      const pct = total ? Math.round((n / total) * 100) : 0;
      lines.push([nivel, n, `${pct}%`]);
    }
    lines.push([]);

    if (agg.porDominioAltoRiesgo?.length) {
      lines.push(["DOMINIOS POR RIESGO PROMEDIO (alto a bajo)"]);
      lines.push(["Dominio ID", "Dominio (etiqueta)", "Categoría", "Promedio"]);
      for (const row of agg.porDominioAltoRiesgo) {
        const info = Object.values(DOMINIOS).find((d) => d.id === row.dominio);
        const cat = info && Object.values(CATEGORIAS).find((c) => c.id === info.categoria);
        lines.push([row.dominio, info?.label || "", cat?.label || "", row.avg]);
      }
      lines.push([]);
    }
  }

  lines.push(["Privacidad", `k-anonymity k≥5 aplicada. Buckets con menos de 5 respuestas se suprimen automáticamente.`]);
  lines.push(["Generado por", session.user.email || session.user.id]);

  const csv = "﻿" + rowsToCsv(lines);
  const filename = `nom35-aggregate-${orgName.replace(/\s+/g, "_")}-${generatedAt.slice(0, 10)}.csv`;

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
