/* GET /api/v1/orgs/[orgId]/programs/adherence — Phase 6F SP-A
   ═══════════════════════════════════════════════════════════════
   Adherence agregada a programas dentro de la org. Reservado a
   roles OWNER | ADMIN | MANAGER. K-anon ≥ MIN_K (5) por programa
   — programas con n<5 se devuelven con `suppressed:true` y sin
   métricas para preservar privacidad individual.

   Por programa retorna:
     n              — total assignments en ventana
     completed      — completedAt set
     abandoned      — abandonedAt set
     active         — sin completed ni abandoned
     completionRate — completed/n (0..1)
     abandonRate    — abandoned/n (0..1)

   NO retorna nombres, userIds, ni timeseries individuales.
   Audit log: action "org.program.adherence.viewed".
   ═══════════════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_ROLES = new Set(["OWNER", "ADMIN", "MANAGER"]);
const MIN_K = 5;
const DEFAULT_DAYS = 90;
const MAX_DAYS = 730; // 2 años — cap defensivo para evitar full table scans

export async function GET(request, ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Next 16 — params es Promise
  const params = await ctx.params;
  const orgId = params?.orgId;
  if (!orgId || typeof orgId !== "string") {
    return NextResponse.json({ error: "invalid_org" }, { status: 400 });
  }

  // Role gate: usuario debe tener role permitido en la org solicitada.
  const memberships = session.memberships || [];
  const mem = memberships.find(
    (m) => m.orgId === orgId && ALLOWED_ROLES.has(m.role) && !m.deactivatedAt
  );
  if (!mem) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Ventana: ?days=N (default 90, cap 730)
  const url = new URL(request.url);
  const daysRaw = Number(url.searchParams.get("days") || DEFAULT_DAYS);
  const days = Number.isFinite(daysRaw) && daysRaw > 0
    ? Math.min(Math.max(1, Math.floor(daysRaw)), MAX_DAYS)
    : DEFAULT_DAYS;
  const since = new Date(Date.now() - days * 86400_000);

  const orm = await db();
  let assignments = [];
  try {
    assignments = await orm.programAssignment.findMany({
      where: { orgId, startedAt: { gte: since } },
    });
  } catch {
    assignments = [];
  }

  // Agrupar por programId.
  const byProgram = new Map();
  for (const a of assignments) {
    if (!a || !a.programId) continue;
    const agg = byProgram.get(a.programId) || {
      programId: a.programId,
      n: 0,
      completed: 0,
      abandoned: 0,
      active: 0,
    };
    agg.n += 1;
    if (a.completedAt) agg.completed += 1;
    else if (a.abandonedAt) agg.abandoned += 1;
    else agg.active += 1;
    byProgram.set(a.programId, agg);
  }

  // K-anon enforcement: si n < MIN_K → suprimir métricas.
  // Mantenemos el programId visible (no es PII) para que el admin sepa
  // que algo se está haciendo en ese programa, pero NO los counts.
  const programs = Array.from(byProgram.values()).map((p) => {
    if (p.n < MIN_K) {
      return {
        programId: p.programId,
        suppressed: true,
        reason: "k_anonymity",
        minK: MIN_K,
      };
    }
    return {
      programId: p.programId,
      suppressed: false,
      n: p.n,
      completed: p.completed,
      abandoned: p.abandoned,
      active: p.active,
      completionRate: +(p.completed / p.n).toFixed(3),
      abandonRate: +(p.abandoned / p.n).toFixed(3),
    };
  });

  await auditLog({
    orgId,
    actorId: session.user.id,
    action: "org.program.adherence.viewed",
    target: orgId,
    payload: {
      periodDays: days,
      totalAssignments: assignments.length,
      programsCount: programs.length,
      suppressedCount: programs.filter((p) => p.suppressed).length,
    },
  }).catch(() => {});

  return NextResponse.json({
    orgId,
    periodDays: days,
    minK: MIN_K,
    programs,
    totalAssignments: assignments.length,
  });
}
