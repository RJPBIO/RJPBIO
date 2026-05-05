/* GET /api/v1/me/burnout — Phase 6F SP-E
   ═══════════════════════════════════════════════════════════════
   Wellbeing trends del user autenticado (early-warning detection).
   Marketing copy reformulado: NO "burnout score" ni "predicción".

   Query params:
     · days (7..90, default 28)  ventana para HRV+chrono signals

   Response:
     {
       assessment: { level, signals, metrics, n, snapshot:{disclaimer,...} },
       copy: { title, subtitle, cta?, crisisLine?, severity },
       period: { days },
     }

   Auth: cualquier sesión válida. Datos retornados son del user mismo.
   Audit log: action "me.burnout.viewed" con level + signalsCount.
   ═══════════════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { auditLog } from "@/server/audit";
import { buildUserSnapshot } from "@/server/snapshot";
import { assessBurnoutEnhanced, wellbeingCopy } from "@/lib/burnoutEnhanced";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_DAYS = 28;
const MIN_DAYS = 7;
const MAX_DAYS = 90;

export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const daysRaw = Number(url.searchParams.get("days") || DEFAULT_DAYS);
  const days = Number.isFinite(daysRaw) && daysRaw > 0
    ? Math.min(MAX_DAYS, Math.max(MIN_DAYS, Math.floor(daysRaw)))
    : DEFAULT_DAYS;

  const snapshot = await buildUserSnapshot(session.user.id, { days });
  if (!snapshot) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const assessment = assessBurnoutEnhanced(snapshot);
  const copy = wellbeingCopy(assessment.level);

  await auditLog({
    orgId: snapshot.user?.orgId || undefined,
    actorId: session.user.id,
    action: "me.burnout.viewed",
    target: session.user.id,
    payload: {
      level: assessment.level,
      signalsCount: assessment.signals?.length ?? 0,
      days,
    },
  }).catch(() => {});

  return NextResponse.json({
    assessment,
    copy,
    period: { days },
  });
}
