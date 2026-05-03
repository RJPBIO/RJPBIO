/* GET /api/v1/me/neural-health (Sprint S4.1)
 *
 * Devuelve el snapshot del motor neural per-user calculado por
 * `evaluateEngineHealth` (lib/neural/health.js). Hasta ahora estaba
 * construido pero NO se exponía: la PWA no podía mostrar al usuario
 * el estado real de su motor (cold-start vs personalized, prediction
 * accuracy, recommendation acceptance, staleness, fatigue).
 *
 * El endpoint es lectura pura sobre `User.neuralState` JSON; no
 * dispara cálculos en DB. Latencia esperada: <30ms.
 */

import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { evaluateEngineHealth } from "@/lib/neural/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const orm = await db();
  const user = await orm.user.findUnique({
    where: { id: session.user.id },
    select: { neuralState: true, lastSyncedAt: true },
  });
  if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const state = user.neuralState && typeof user.neuralState === "object" ? user.neuralState : {};
  const health = evaluateEngineHealth(state);

  return NextResponse.json({
    health,
    lastSyncedAt: user.lastSyncedAt?.toISOString() || null,
    serverTime: new Date().toISOString(),
  });
}
