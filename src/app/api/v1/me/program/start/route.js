/* POST /api/v1/me/program/start — Phase 6F SP-A
   ═══════════════════════════════════════════════════════════════
   Inicia un nuevo programa para el user autenticado.
     - Body: { programId: string, source?: string, meta?: object }
     - Si ya existe activeProgram → se marca abandonedAt antes de crear.
     - Si programa tiene reEvalEvery (Burnout Recovery) → calcula reEvalAt.
     - orgId persiste si user pertenece a org no-personal (para B2B
       adherence agregada).

   Validaciones:
     - 401 si no hay sesión
     - 400 si programId no existe en catálogo (lib/programs.js)
     - 400 si source no es uno de los valores permitidos

   Audit log: action "program.started" con payload { programId, source }.
   ═══════════════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";
import { getProgramById } from "@/lib/programs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID_SOURCES = new Set([
  "self-selected",
  "suggested-burnout-alert",
  "suggested-onboarding",
  "suggested-cooldown",
  "suggested-recovery",
]);

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const programId = typeof body?.programId === "string" ? body.programId.trim() : "";
  const source = typeof body?.source === "string" ? body.source : "self-selected";
  const meta = body?.meta && typeof body.meta === "object" ? body.meta : null;

  // Validate programId existe en catalog (single source of truth)
  const program = getProgramById(programId);
  if (!program) {
    return NextResponse.json({ error: "invalid_program", programId }, { status: 400 });
  }

  if (!VALID_SOURCES.has(source)) {
    return NextResponse.json({ error: "invalid_source", source }, { status: 400 });
  }

  const orm = await db();
  const userId = session.user.id;

  // Resolve orgId no-personal si user pertenece a uno (preferido para B2B
  // aggregation). Si todas son personales o no hay memberships, orgId null
  // — el programa se asigna individualmente.
  const memberships = session.memberships || [];
  const m =
    memberships.find((mm) => mm.org && !mm.org.personal) ||
    memberships[0];
  const orgId = m?.orgId || null;

  // Si hay activeProgram (sin completedAt ni abandonedAt) → marcarlo abandoned.
  // Sólo puede haber 1 activeProgram a la vez por user.
  try {
    const existing = await orm.programAssignment.findFirst({
      where: { userId, completedAt: null, abandonedAt: null },
      orderBy: { startedAt: "desc" },
    });
    if (existing) {
      await orm.programAssignment.update({
        where: { id: existing.id },
        data: { abandonedAt: new Date() },
      });
    }
  } catch {
    // Best-effort cleanup; si falla, el create continúa y queda un duplicado
    // que el cliente puede resolver. No bloqueamos el start.
  }

  // Calcular reEvalAt si el programa tiene reEvalEvery (sólo Burnout Recovery
  // por ahora). Si usuario empieza programa Día 0, reEval cae Día program.reEvalEvery.
  const now = new Date();
  const reEvalAt = program.reEvalEvery && program.reEvalEvery > 0
    ? new Date(now.getTime() + program.reEvalEvery * 86400_000)
    : null;

  let assignment;
  try {
    assignment = await orm.programAssignment.create({
      data: {
        userId,
        orgId,
        programId,
        startedAt: now,
        completedDays: [],
        reEvalAt,
        source,
        meta,
      },
    });
  } catch {
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }

  await auditLog({
    orgId: orgId || undefined,
    actorId: userId,
    action: "program.started",
    target: assignment.id,
    payload: { programId, source, reEvalAt: reEvalAt ? reEvalAt.toISOString() : null },
  }).catch(() => {});

  return NextResponse.json({ ok: true, assignment }, { status: 201 });
}
