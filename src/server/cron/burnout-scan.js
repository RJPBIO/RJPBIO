/* Cron · burnout-scan (Phase 6F SP-E)
 * ═══════════════════════════════════════════════════════════════
 * Cadencia: 0 5 * * *  (5 UTC ≈ 11pm MX-CST prev day / 12am MX-CDT)
 *
 * Marketing copy: WELLBEING TRENDS · early-warning detection.
 * NO "burnout score" / NO "predicción" / NO "diagnóstico médico".
 *
 * Para cada user activo (sesión en últimos 30 días):
 *   1. buildUserSnapshot(userId, days=28)
 *   2. assessBurnoutEnhanced → level + signals + metrics
 *   3. Persist BurnoutScore (new row cada scan — habilita time-series)
 *   4. Si level ∈ {warn, alert} AND no notificación previa en últimos
 *      7 días (throttle anti-spam) → enqueuePush + mark notifiedAt
 *
 * Throttle 7d: dedup robusto. Sin throttle, un user con level=warn
 * persistente recibiría push diario → spam → opt-out → pérdida del
 * canal. 7d es suficiente: cambios de wellbeing son lentos (semanas).
 *
 * Errores per-user NO abortan el scan completo — el resto de users
 * sigue evaluado (consistente con weekly-summary.js).
 *
 * Privacy: el push body NO contiene PII ni level específico. Solo
 * "Patrones a revisar" / "Tu wellbeing necesita atención" + href a
 * /app/wellbeing (auth gate al click).
 * ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "../db";
import { auditLog } from "../audit";
import { enqueuePush } from "../push-delivery";
import { buildUserSnapshot } from "../snapshot";
import { assessBurnoutEnhanced } from "../../lib/burnoutEnhanced";

const ACTIVE_WINDOW_DAYS = 30;
const ASSESSMENT_WINDOW_DAYS = 28;
const THROTTLE_WINDOW_DAYS = 7;
const BATCH = 1000;
const NOTIFY_LEVELS = new Set(["warn", "alert"]);

export async function runBurnoutScan() {
  const startedAt = Date.now();
  const orm = await db();
  let scanned = 0;
  let scoresCreated = 0;
  let notified = 0;
  let throttled = 0;
  let skipped = 0;
  let errors = 0;

  const sinceActive = new Date(startedAt - ACTIVE_WINDOW_DAYS * 86400_000);
  const throttleSince = new Date(startedAt - THROTTLE_WINDOW_DAYS * 86400_000);

  // Distinct active userIds — Prisma soporta `distinct`. Memory adapter de
  // tests NO; los tests mockean orm directamente (no exercitan este path).
  let activeUserIds = [];
  try {
    const rows = await orm.neuralSession.findMany({
      where: { completedAt: { gte: sinceActive } },
      select: { userId: true },
      distinct: ["userId"],
      take: BATCH,
    });
    activeUserIds = (rows || []).map((r) => r.userId).filter(Boolean);
  } catch {
    activeUserIds = [];
  }

  if (activeUserIds.length === 0) {
    await auditLog({
      action: "cron.burnout-scan.tick",
      payload: {
        scanned: 0,
        scoresCreated: 0,
        notified: 0,
        throttled: 0,
        skipped: 0,
        errors: 0,
        durationMs: Date.now() - startedAt,
      },
    }).catch(() => {});
    return {
      processed: 0,
      errors: 0,
      details: { scanned: 0, scoresCreated: 0, notified: 0, throttled: 0, skipped: 0 },
    };
  }

  for (const userId of activeUserIds) {
    scanned += 1;
    try {
      const snapshot = await buildUserSnapshot(userId, { days: ASSESSMENT_WINDOW_DAYS });
      if (!snapshot) {
        skipped += 1;
        continue;
      }

      const assessment = assessBurnoutEnhanced(snapshot);

      // Persist BurnoutScore (new row cada corrida — time-series).
      let created = null;
      try {
        created = await orm.burnoutScore.create({
          data: {
            userId,
            orgId: snapshot.user?.orgId || null,
            level: assessment.level,
            signals: assessment.signals || [],
            metrics: assessment.metrics || {},
          },
        });
        scoresCreated += 1;
      } catch {
        errors += 1;
        continue;
      }

      // Notification gate: solo warn/alert, con throttle 7d.
      if (!NOTIFY_LEVELS.has(assessment.level)) {
        continue;
      }

      // Throttle: query ANY prior BurnoutScore con notifiedAt en últimos 7d.
      // Memory adapter retorna null cuando match falla — `findFirst` con
      // `notifiedAt: { gte: ... }` filtra rows con notifiedAt undefined/null
      // (undefined >= Date = false). En Prisma, también respeta el filtro.
      let recentlyNotified = null;
      try {
        recentlyNotified = await orm.burnoutScore.findFirst({
          where: { userId, notifiedAt: { gte: throttleSince } },
          orderBy: { notifiedAt: "desc" },
        });
      } catch {
        recentlyNotified = null;
      }

      if (recentlyNotified) {
        throttled += 1;
        continue;
      }

      // Send push + mark notifiedAt en el score recién creado.
      const title = assessment.level === "alert"
        ? "Tu wellbeing necesita atención"
        : "Patrones a revisar";
      const body = assessment.level === "alert"
        ? "Múltiples señales en tu trayectoria reciente."
        : "Detectamos un cambio en tu trayectoria.";

      const enqueued = await enqueuePush(userId, {
        title,
        body,
        href: "/app",
        kind: "wellbeing-trends",
      });

      if (enqueued?.ok) {
        try {
          await orm.burnoutScore.update({
            where: { id: created.id },
            data: { notifiedAt: new Date() },
          });
        } catch { /* best-effort: throttle puede fallar en next run */ }
        notified += 1;
      } else {
        errors += 1;
      }
    } catch {
      errors += 1;
    }
  }

  await auditLog({
    action: "cron.burnout-scan.tick",
    payload: {
      scanned,
      scoresCreated,
      notified,
      throttled,
      skipped,
      errors,
      durationMs: Date.now() - startedAt,
    },
  }).catch(() => {});

  return {
    processed: notified,
    errors,
    details: { scanned, scoresCreated, notified, throttled, skipped, errors },
  };
}
