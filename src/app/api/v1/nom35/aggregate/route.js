/* API v1 — NOM-035 aggregate (admin/manager)
   GET /api/v1/nom35/aggregate — promedios por dominio + conteos por nivel.
   Se omite si N < minN (default 5) para proteger la privacidad. */
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { aggregateScores } from "@/lib/nom35/scoring";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_ROLES = new Set(["OWNER", "ADMIN", "MANAGER"]);

export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const memberships = session.memberships || [];
  const url = new URL(request.url);
  const orgIdParam = url.searchParams.get("orgId");
  const mem = orgIdParam
    ? memberships.find((m) => m.orgId === orgIdParam && ALLOWED_ROLES.has(m.role))
    : memberships.find((m) => ALLOWED_ROLES.has(m.role));
  if (!mem) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const orm = await db();
  const rows = await orm.nom35Response.findMany({
    where: { orgId: mem.orgId },
    select: { total: true, porDominio: true, porCategoria: true, nivel: true },
  });
  // Rehidratar forma esperada por aggregateScores (ya tiene el shape correcto).
  const agg = aggregateScores(rows, { minN: 5 });
  return NextResponse.json({ orgId: mem.orgId, ...agg });
}
