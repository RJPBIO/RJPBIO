/* GET /api/v1/orgs/[orgId]/reports/executive — Phase 6F SP-C
   ═══════════════════════════════════════════════════════════════
   Reporte ejecutivo NOM-035 + biometría agregada para roles
   OWNER | ADMIN | MANAGER del org.

   Query params:
     · days  (7..365, default 90)   — ventana de recall

   Response shape: ver buildExecutiveReport en src/server/executiveReport.js.
   K-anon ≥ 5 enforced en TODAS las agregaciones.

   Audit log: action "org.executive_report.viewed" — trace de cada lectura
   para compliance + cumple "audit log captura admin viewed report".
   ═══════════════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { auditLog } from "@/server/audit";
import { buildExecutiveReport } from "@/server/executiveReport";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_ROLES = new Set(["OWNER", "ADMIN", "MANAGER"]);
const DEFAULT_DAYS = 90;
const MIN_DAYS = 7;
const MAX_DAYS = 365;

export async function GET(request, ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Next 16 — params es Promise.
  const params = await ctx.params;
  const orgId = params?.orgId;
  if (!orgId || typeof orgId !== "string") {
    return NextResponse.json({ error: "invalid_org" }, { status: 400 });
  }

  // Role gate.
  const memberships = session.memberships || [];
  const mem = memberships.find(
    (m) => m.orgId === orgId && ALLOWED_ROLES.has(m.role) && !m.deactivatedAt
  );
  if (!mem) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Parse + clamp days.
  const url = new URL(request.url);
  const daysRaw = Number(url.searchParams.get("days") || DEFAULT_DAYS);
  const days = Number.isFinite(daysRaw) && daysRaw > 0
    ? Math.min(MAX_DAYS, Math.max(MIN_DAYS, Math.floor(daysRaw)))
    : DEFAULT_DAYS;

  const report = await buildExecutiveReport(orgId, { days });
  if (!report) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await auditLog({
    orgId,
    actorId: session.user.id,
    action: "org.executive_report.viewed",
    target: orgId,
    payload: {
      days,
      suppressed: !!report.suppressed,
      activeMembers: report.org?.activeMembers ?? null,
      surface: "rest-api",
    },
  }).catch(() => {});

  return NextResponse.json(report);
}
