/* Cron · nom35-reapply-reminder
 * ═══════════════════════════════════════════════════════════════
 * Cadencia sugerida: 0 12 * * 1  (lunes 12:00 UTC ≈ 06:00 MX)
 *
 * NOM-035 como instrumento de gestión, no foto única: para que exista
 * tendencia (delta por dominio), la evaluación debe RE-aplicarse. Este
 * cron encola un push a cada usuario cuya ÚLTIMA evaluación tiene más de
 * `periodDays` (90) días → "re-evaluación disponible".
 *
 * Selección: groupBy userId con _max(completedAt). La lógica pura vive en
 * selectDueForReapplication() (testeable sin DB).
 *
 * Idempotencia: cadencia semanal → a lo sumo 1 push/semana por usuario
 * vencido hasta que reaplique. Sin dedup persistente (aceptable a esa
 * cadencia; hardening futuro: lastReminderAt por usuario).
 *
 * Privacidad: el push NO contiene PII ni resultados. Solo invita a
 * reaplicar. href → /nom35/aplicador.
 * ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "../db";
import { auditLog } from "../audit";
import { enqueuePush } from "../push-delivery";

const PERIOD_DAYS = 90;
const DAY_MS = 86_400_000;

/**
 * Lógica pura: dados los pares { userId, completedAt } de la última
 * evaluación de cada usuario, devuelve los userId vencidos (> periodDays).
 * @param {Array<{userId:string, completedAt:(number|string|Date)}>} latestByUser
 */
export function selectDueForReapplication(latestByUser, { now = Date.now(), periodDays = PERIOD_DAYS } = {}) {
  const cutoff = now - periodDays * DAY_MS;
  const due = [];
  for (const row of latestByUser || []) {
    if (!row || !row.userId) continue;
    const raw = row.completedAt;
    const ts = typeof raw === "number" ? raw : raw ? new Date(raw).getTime() : NaN;
    if (!Number.isFinite(ts)) continue;
    if (ts <= cutoff) due.push(row.userId);
  }
  return due;
}

export async function runNom35ReapplyReminder() {
  const startedAt = Date.now();
  const orm = await db();

  let grouped = [];
  try {
    grouped = await orm.nom35Response.groupBy({
      by: ["userId"],
      _max: { completedAt: true },
    });
  } catch {
    grouped = [];
  }

  const latest = (grouped || []).map((g) => ({
    userId: g.userId,
    completedAt: g._max?.completedAt ?? null,
  }));
  const due = selectDueForReapplication(latest, { now: Date.now(), periodDays: PERIOD_DAYS });

  let pushed = 0;
  let errors = 0;
  for (const userId of due) {
    try {
      await enqueuePush(userId, {
        title: "NOM-035 · re-evaluación disponible",
        body: "Pasaron 90 días desde tu última evaluación. Reaplícala para ver tu tendencia por dominio.",
        href: "/nom35/aplicador",
        kind: "nom35-reapply",
      });
      pushed += 1;
    } catch {
      errors += 1;
    }
  }

  await auditLog({
    action: "cron.nom35-reapply-reminder.tick",
    payload: {
      candidates: latest.length,
      due: due.length,
      pushed,
      errors,
      durationMs: Date.now() - startedAt,
    },
  }).catch(() => {});

  return { processed: pushed, errors, details: { candidates: latest.length, due: due.length } };
}
