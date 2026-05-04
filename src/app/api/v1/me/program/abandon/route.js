/* POST /api/v1/me/program/abandon — Phase 6F SP-A
   ═══════════════════════════════════════════════════════════════
   Marca el activeProgram del user como abandonedAt = now.
   No-op si no hay activeProgram (404).

   Auth: cualquier sesión válida.
   Audit log: action "program.abandoned" con assignment id.
   ═══════════════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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

  try {
    await orm.programAssignment.update({
      where: { id: active.id },
      data: { abandonedAt: new Date() },
    });
  } catch {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  await auditLog({
    orgId: active.orgId || undefined,
    actorId: userId,
    action: "program.abandoned",
    target: active.id,
    payload: { programId: active.programId },
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
