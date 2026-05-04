/* POST /api/v1/me/program/reEval — Phase 6F SP-A
   ═══════════════════════════════════════════════════════════════
   Submite la PSS-4 mid-program de un programa con reEvalEvery
   (actualmente sólo Burnout Recovery 28d → día 14).

   Body: { instrumentId: "pss-4", score, level, answers }
     - instrumentId DEBE ser "pss-4" (otros instrumentos no califican
       como re-evaluación de programa por ahora).
     - score / level / answers se persisten en tabla Instrument para
       longitudinal tracking (mismo shape que /api/v1/instruments/*
       habría de usar — no existe ese endpoint todavía).

   Validaciones:
     - 401 si no hay sesión
     - 404 si no hay activeProgram
     - 400 si activeProgram no tiene reEvalAt (programa sin re-eval)
     - 400 si ya se completó la re-eval previamente (reEvalCompletedAt)
     - 400 si instrumentId !== "pss-4" o score/answers inválidos

   Audit log: action "program.reEval.completed" con score+level.
   ═══════════════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MID_PROGRAM_INSTRUMENT = "pss-4";

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

  const instrumentId = typeof body?.instrumentId === "string" ? body.instrumentId : "";
  const score = body?.score;
  const level = typeof body?.level === "string" ? body.level : null;
  const answers = body?.answers;

  if (instrumentId !== MID_PROGRAM_INSTRUMENT) {
    return NextResponse.json(
      { error: "invalid_instrument", expected: MID_PROGRAM_INSTRUMENT },
      { status: 400 }
    );
  }
  if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 16) {
    return NextResponse.json({ error: "invalid_score" }, { status: 400 });
  }
  if (!level || !["low", "moderate", "high"].includes(level)) {
    return NextResponse.json({ error: "invalid_level" }, { status: 400 });
  }
  if (!answers || (typeof answers !== "object" && !Array.isArray(answers))) {
    return NextResponse.json({ error: "invalid_answers" }, { status: 400 });
  }

  const orm = await db();
  const userId = session.user.id;

  let active;
  try {
    active = await orm.programAssignment.findFirst({
      where: { userId, completedAt: null, abandonedAt: null },
      orderBy: { startedAt: "desc" },
    });
  } catch {
    active = null;
  }

  if (!active) {
    return NextResponse.json({ error: "no_active_program" }, { status: 404 });
  }
  if (!active.reEvalAt) {
    return NextResponse.json({ error: "no_reeval_due" }, { status: 400 });
  }
  if (active.reEvalCompletedAt) {
    return NextResponse.json({ error: "reeval_already_completed" }, { status: 400 });
  }

  // Persistir Instrument row + marcar reEvalCompletedAt en transacción
  // best-effort. El caller puede reintentar idempotentemente porque la
  // segunda llamada cae en "reeval_already_completed".
  const now = new Date();
  try {
    await orm.instrument.create({
      data: {
        userId,
        orgId: active.orgId || null,
        instrumentId: MID_PROGRAM_INSTRUMENT,
        score,
        level,
        answers,
        takenAt: now,
      },
    });
  } catch {
    return NextResponse.json({ error: "instrument_create_failed" }, { status: 500 });
  }

  try {
    await orm.programAssignment.update({
      where: { id: active.id },
      data: { reEvalCompletedAt: now },
    });
  } catch {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  await auditLog({
    orgId: active.orgId || undefined,
    actorId: userId,
    action: "program.reEval.completed",
    target: active.id,
    payload: { instrumentId: MID_PROGRAM_INSTRUMENT, score, level, programId: active.programId },
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
