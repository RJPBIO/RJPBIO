/* API v1 — NOM-035 longitudinal compare (admin/manager)
   GET /api/v1/nom35/compare?periodDays=90&orgId=...
   Compara el período actual contra el anterior (dos ventanas contiguas de
   `periodDays`): delta por dominio, nivel-shift y lectura. k-anon ≥5 por
   período — si cualquiera tiene N<5 se suprime (no foto individual). */
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { aggregateScores } from "@/lib/nom35/scoring";
import { compareNom35Aggregates, splitByPeriod } from "@/lib/nom35/longitudinal";

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

  const periodDaysRaw = Number(url.searchParams.get("periodDays"));
  const periodDays =
    Number.isFinite(periodDaysRaw) && periodDaysRaw >= 7 && periodDaysRaw <= 365
      ? Math.round(periodDaysRaw)
      : 90;

  const orm = await db();
  const rows = await orm.nom35Response.findMany({
    where: { orgId: mem.orgId },
    select: { total: true, porDominio: true, porCategoria: true, nivel: true, completedAt: true },
    orderBy: { completedAt: "asc" },
  });

  const { baseline, current } = splitByPeriod(rows, { periodDays });
  const baselineAgg = aggregateScores(baseline, { minN: 5 });
  const currentAgg = aggregateScores(current, { minN: 5 });
  const comparison = compareNom35Aggregates(baselineAgg, currentAgg);

  return NextResponse.json({
    orgId: mem.orgId,
    periodDays,
    baseline: { n: baseline.length, agg: baselineAgg },
    current: { n: current.length, agg: currentAgg },
    comparison,
  });
}
