/* GET /api/v1/orgs/[orgId]/burnout/aggregate — Phase 6F SP-E
   ═══════════════════════════════════════════════════════════════
   Wellbeing trends agregado del org (early-warning detection).
   Reservado a roles OWNER | ADMIN | MANAGER. K-anon ≥ 5:
     · n total < 5            → suppressed top-level
     · band con count < 5     → null en distribution (oculta el count
       aunque expone el band; mantiene info "hay scores" sin individual)
     · signal con count < 5   → null en topSignals

   Query params:
     · days (7..90, default 28)  ventana de scores recientes

   NO retorna nombres, userIds, ni tendencias individuales.
   Audit log: action "org.burnout.aggregate.viewed".
   ═══════════════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_ROLES = new Set(["OWNER", "ADMIN", "MANAGER"]);
const MIN_K = 5;
const DEFAULT_DAYS = 28;
const MIN_DAYS = 7;
const MAX_DAYS = 90;

const COMPLIANCE_DISCLAIMER =
  "Datos agregados con anonimización k≥5 · LFPDPPP / GDPR Art-89 compliant · " +
  "Bio-Ignición no es dispositivo médico ni sustituye atención profesional. " +
  "Indicador retrospectivo, no diagnóstico.";

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

  const url = new URL(request.url);
  const daysRaw = Number(url.searchParams.get("days") || DEFAULT_DAYS);
  const days = Number.isFinite(daysRaw) && daysRaw > 0
    ? Math.min(MAX_DAYS, Math.max(MIN_DAYS, Math.floor(daysRaw)))
    : DEFAULT_DAYS;
  const since = new Date(Date.now() - days * 86400_000);

  const orm = await db();

  // Get org members (active).
  let members = [];
  try {
    members = await orm.membership.findMany({
      where: { orgId, deactivatedAt: null },
    });
  } catch {
    members = [];
  }
  const userIds = members.map((m) => m.userId).filter(Boolean);

  if (userIds.length < MIN_K) {
    await auditLog({
      orgId,
      actorId: session.user.id,
      action: "org.burnout.aggregate.viewed",
      target: orgId,
      payload: { days, suppressed: true, reason: "k_anonymity_members", n: userIds.length },
    }).catch(() => {});
    return NextResponse.json({
      orgId,
      suppressed: true,
      reason: "k_anonymity",
      message: `Reporte requiere mínimo ${MIN_K} miembros activos. Tu organización tiene ${userIds.length}.`,
      period: { days },
      snapshot: { kAnonThreshold: MIN_K, disclaimer: COMPLIANCE_DISCLAIMER },
    });
  }

  // Get latest BurnoutScore per user in window.
  let scores = [];
  try {
    scores = await orm.burnoutScore.findMany({
      where: { userId: { in: userIds }, computedAt: { gte: since } },
      orderBy: { computedAt: "desc" },
    });
  } catch {
    scores = [];
  }

  // Reduce to most-recent per userId.
  const latestByUser = new Map();
  for (const s of scores) {
    if (!s?.userId) continue;
    const ts = s.computedAt instanceof Date ? s.computedAt.getTime() : Date.parse(s.computedAt);
    const prev = latestByUser.get(s.userId);
    const prevTs = prev?.computedAt instanceof Date
      ? prev.computedAt.getTime()
      : Date.parse(prev?.computedAt || 0);
    if (!prev || ts > prevTs) latestByUser.set(s.userId, s);
  }
  const latestScores = Array.from(latestByUser.values());

  // Distribution by level con k-anon ≥5 per band.
  const rawDistribution = { ok: 0, watch: 0, warn: 0, alert: 0 };
  for (const s of latestScores) {
    if (rawDistribution[s.level] !== undefined) {
      rawDistribution[s.level] += 1;
    }
  }
  const distribution = {};
  for (const [level, count] of Object.entries(rawDistribution)) {
    distribution[level] = count >= MIN_K ? count : null;
  }

  // Top signals (count across all latest scores). K-anon a nivel signal.
  const signalCounts = new Map();
  for (const s of latestScores) {
    const sigs = Array.isArray(s.signals)
      ? s.signals
      : (() => {
          try { return JSON.parse(s.signals); } catch { return []; }
        })();
    for (const sig of sigs) {
      signalCounts.set(sig, (signalCounts.get(sig) || 0) + 1);
    }
  }
  const topSignals = Array.from(signalCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([signal, count]) => ({
      signal,
      count: count >= MIN_K ? count : null,
      suppressed: count < MIN_K,
    }));

  await auditLog({
    orgId,
    actorId: session.user.id,
    action: "org.burnout.aggregate.viewed",
    target: orgId,
    payload: {
      days,
      n: latestScores.length,
      members: userIds.length,
      suppressedBands: Object.values(distribution).filter((v) => v == null).length,
    },
  }).catch(() => {});

  return NextResponse.json({
    orgId,
    period: { days },
    n: latestScores.length,
    members: userIds.length,
    distribution,
    topSignals,
    snapshot: {
      computedAt: new Date(),
      kAnonThreshold: MIN_K,
      disclaimer: COMPLIANCE_DISCLAIMER,
    },
  });
}
