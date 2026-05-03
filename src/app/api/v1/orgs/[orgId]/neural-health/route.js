/* GET /api/v1/orgs/[orgId]/neural-health (Sprint S4.1)
 *
 * Devuelve el snapshot org-level del motor adaptativo:
 *   - computeOrgNeuralHealth: maturity distribution, staleness, top
 *     protocols, verdict (at-risk/mature/early/developing), actions.
 *   - computeProtocolEffectiveness: por protocolo Cohen's d, CI95,
 *     hit rate, distinctUsers (k-anon ≥5).
 *
 * RBAC: OWNER | ADMIN | MANAGER del org.
 * K-anonymity: hardcoded ≥5 dentro de cada lib (no override).
 *
 * Hasta ahora estos cálculos estaban construidos pero NO expuestos
 * al frontend admin. Esto desbloquea reporting B2B real con
 * estadística de inferencia (Cohen's d, CI95), no solo conteos.
 */

import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { computeOrgNeuralHealth, computeProtocolEffectiveness } from "@/lib/neural/orgHealth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_ROLES = new Set(["OWNER", "ADMIN", "MANAGER"]);
const SESSIONS_WINDOW_DAYS = 90;

export async function GET(request, { params }) {
  const { orgId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const memberships = session.memberships || [];
  const mem = memberships.find((m) => m.orgId === orgId && ALLOWED_ROLES.has(m.role));
  if (!mem) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const orm = await db();

  // 1) Member roster — incluye inactive + deactivated para verdict accurate.
  const memberRows = await orm.membership.findMany({
    where: { orgId, deactivatedAt: null },
    select: { userId: true },
    take: 5000,
  }).catch(() => []);
  const userIds = memberRows.map((m) => m.userId);
  if (userIds.length === 0) {
    return NextResponse.json({ orgId, neuralHealth: null, protocolEffectiveness: [], reason: "no_members" });
  }

  // 2) Per-user summaries — last session, total sessions, protocol histogram.
  //    Computamos esto desde NeuralSession (no neuralState JSON, que no es
  //    queryable cross-user a escala).
  const sinceWindow = new Date(Date.now() - SESSIONS_WINDOW_DAYS * 86400_000);
  const sessions = await orm.neuralSession.findMany({
    where: {
      orgId,
      userId: { in: userIds },
      completedAt: { gte: sinceWindow },
    },
    select: {
      userId: true,
      protocolId: true,
      moodPre: true,
      moodPost: true,
      coherenciaDelta: true,
      completedAt: true,
    },
    take: 50000, // hard-cap defensivo
  }).catch(() => []);

  // 3) Build per-user summary para computeOrgNeuralHealth.
  const userSummaries = new Map();
  for (const uid of userIds) {
    userSummaries.set(uid, {
      userId: uid,
      totalSessions: 0,
      lastSessionTs: null,
      protocolHistogram: {},
    });
  }
  for (const s of sessions) {
    const u = userSummaries.get(s.userId);
    if (!u) continue;
    u.totalSessions += 1;
    const ts = s.completedAt instanceof Date ? s.completedAt.getTime() : new Date(s.completedAt).getTime();
    if (u.lastSessionTs == null || ts > u.lastSessionTs) u.lastSessionTs = ts;
    const proto = String(s.protocolId || "unknown");
    u.protocolHistogram[proto] = (u.protocolHistogram[proto] || 0) + 1;
  }

  const neuralHealth = computeOrgNeuralHealth(Array.from(userSummaries.values()));
  const protocolEffectiveness = computeProtocolEffectiveness(sessions, { kmin: 5, topN: 10 });

  return NextResponse.json({
    orgId,
    windowDays: SESSIONS_WINDOW_DAYS,
    neuralHealth,
    protocolEffectiveness,
    serverTime: new Date().toISOString(),
  });
}
