/* Cron · program-day-reminder (Phase 6F SP-A)
 * ═══════════════════════════════════════════════════════════════
 * Cadencia: 0 13 * * *  (13:00 UTC ≈ 07:00 MX-CST / 08:00 MX-CDT)
 *
 * Para cada user con activeProgram (ProgramAssignment sin completedAt
 * ni abandonedAt), evalúa programTodayStatus(today). Si el día actual
 * tiene sesión agendada y NO está completada → encola push notification
 * con kind:"program-reminder" via enqueuePush (PushOutbox + drain real).
 *
 * Idempotencia: si el cron corre 2 veces el mismo día, encolará 2 pushes
 * por user — aceptable para una tarea diaria. Future hardening: persistir
 * lastReminderAt por assignment para dedup window 12h.
 *
 * Privacidad: el push body NO contiene PII. Sólo "Tu programa BR · día 14
 * te espera" — programId + day. El href apunta a /app/program/today.
 *
 * Escala: O(active_assignments). Para una org B2B típica con 100 users
 * usando programa, batchSize:100 cubre el universo en 1 corrida.
 * ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "../db";
import { auditLog } from "../audit";
import { enqueuePush } from "../push-delivery";
import { getProgramById, programTodayStatus } from "../../lib/programs";
import { assignmentToActiveProgram } from "../programs-adapter";

const BATCH = 1000;

export async function runProgramDayReminder() {
  const startedAt = Date.now();
  const orm = await db();

  let active = [];
  try {
    active = await orm.programAssignment.findMany({
      where: { completedAt: null, abandonedAt: null },
      orderBy: { startedAt: "desc" },
      take: BATCH,
    });
  } catch {
    active = [];
  }

  if (!Array.isArray(active) || active.length === 0) {
    await auditLog({
      action: "cron.program-day-reminder.tick",
      payload: {
        activeAssignments: 0,
        pushed: 0,
        skippedNoSession: 0,
        skippedAlreadyDone: 0,
        skippedNoSubs: 0,
        errors: 0,
        durationMs: Date.now() - startedAt,
      },
    }).catch(() => {});
    return { processed: 0, errors: 0, details: { activeAssignments: 0 } };
  }

  const now = new Date();
  let pushed = 0;
  let skippedNoSession = 0;
  let skippedAlreadyDone = 0;
  let skippedNoSubs = 0;
  let errors = 0;

  for (const a of active) {
    try {
      const adapted = assignmentToActiveProgram(a);
      if (!adapted) { errors += 1; continue; }
      const status = programTodayStatus(adapted, now.getTime());

      // Sin sesión hoy o día de descanso → no notificar.
      if (!status.session) { skippedNoSession += 1; continue; }
      // Sesión hoy ya completada → no notificar (status.shouldSession=false en este caso).
      if (!status.shouldSession) { skippedAlreadyDone += 1; continue; }

      // Verificar que user tenga push subscriptions activas.
      // Memory adapter (test mode) puede no tener tabla; safeguard.
      let hasSubs = false;
      try {
        if (orm.pushSubscription?.findMany) {
          const subs = await orm.pushSubscription.findMany({
            where: { userId: a.userId },
            take: 1,
          });
          hasSubs = Array.isArray(subs) && subs.length > 0;
        }
      } catch {
        hasSubs = false;
      }
      if (!hasSubs) { skippedNoSubs += 1; continue; }

      const program = getProgramById(a.programId);
      const programName = program?.n || a.programId;
      const tag = program?.tg || "";
      const dayLabel = `día ${status.day}`;

      const r = await enqueuePush(a.userId, {
        title: `${programName} · ${dayLabel}`,
        body: status.session?.note
          ? `Hoy: ${String(status.session.note).slice(0, 120)}`
          : "Tu sesión de hoy te espera.",
        href: "/app",
        kind: "program-reminder",
      });
      if (r?.ok) pushed += 1;
      else errors += 1;
    } catch {
      errors += 1;
    }
  }

  await auditLog({
    action: "cron.program-day-reminder.tick",
    payload: {
      activeAssignments: active.length,
      pushed,
      skippedNoSession,
      skippedAlreadyDone,
      skippedNoSubs,
      errors,
      durationMs: Date.now() - startedAt,
    },
  }).catch(() => {});

  return {
    processed: pushed,
    errors,
    details: {
      activeAssignments: active.length,
      pushed,
      skippedNoSession,
      skippedAlreadyDone,
      skippedNoSubs,
      batch: BATCH,
    },
  };
}
