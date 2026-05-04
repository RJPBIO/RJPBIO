/* GET /api/v1/me/program/active — Phase 6F SP-A
   ═══════════════════════════════════════════════════════════════
   Retorna el programa activo del user autenticado con todayStatus,
   lagStatus, progress y reEvalDue resueltos server-side.

   Si no hay programa activo retorna { active: null }. Esto NO es 404
   — es un estado normal (mayoría de users no tienen programa activo
   en cualquier momento dado).

   Auth: cualquier sesión válida. Datos retornados son del user mismo.
   ═══════════════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { buildUserSnapshot } from "@/server/snapshot";
import { assignmentToActiveProgram } from "@/server/programs-adapter";
import {
  programTodayStatus,
  programLagStatus,
  programProgress,
  nextProgramReEval,
} from "@/lib/programs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const snap = await buildUserSnapshot(session.user.id, { days: 90 });
  if (!snap) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (!snap.activeProgram) {
    return NextResponse.json({ active: null });
  }

  const adapted = assignmentToActiveProgram(snap.activeProgram);
  const now = Date.now();
  const todayStatus = programTodayStatus(adapted, now);
  const lagStatus = programLagStatus(adapted, now);
  const progress = programProgress(adapted);
  const reEval = nextProgramReEval(snap.activeProgram, now);

  return NextResponse.json({
    active: {
      id: snap.activeProgram.id,
      programId: snap.activeProgram.programId,
      startedAt: snap.activeProgram.startedAt,
      completedDays: adapted.completedSessionDays,
      reEvalAt: snap.activeProgram.reEvalAt,
      reEvalCompletedAt: snap.activeProgram.reEvalCompletedAt,
      source: snap.activeProgram.source,
      todayStatus,
      lagStatus,
      progress,
      reEval,
    },
  });
}
