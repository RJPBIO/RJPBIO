/* GET /api/coach/quota
   ═══════════════════════════════════════════════════════════════
   Phase 6C SP2 — endpoint nuevo para que el cliente pueda mostrar
   la quota REAL al mount del Tab Coach (antes de SP2, CoachV2
   inicializaba con FIXTURE_QUOTA `23/100 PRO` falsa, después
   reemplazada en SP1 por defensiva `0/100 PRO`. Ambas engañosas
   hasta el primer mensaje real).

   Devuelve la usage del mes actual + plan resuelto del user (a
   través de su personal-org si aplica). Usa `evaluateQuota` puro
   para mantener consistencia con el handler POST /api/coach.

   Auth: NextAuth session (no CSRF — este es un GET idempotente).
   Rate limit: 30 req/min/user (más permisivo que POST).
   ═══════════════════════════════════════════════════════════════ */

import { auth } from "../../../../server/auth";
import { db } from "../../../../server/db";
import { check } from "../../../../server/ratelimit";
import { evaluateQuota, currentBillingPeriod, getCoachQuota } from "../../../../lib/coach-quota";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const rl = await check(`coach-quota:${userId}`, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return Response.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)) } }
    );
  }

  try {
    const orm = await db();
    // Resolve plan vía personal-org (creada en signin / sync). Si no existe
    // por alguna razón, fallback a FREE — defensa en profundidad.
    const slug = `personal-${userId}`;
    const personalOrg = await orm.org.findUnique({ where: { slug } }).catch(() => null);
    const plan = (personalOrg?.plan || "FREE").toUpperCase();

    const period = currentBillingPeriod();
    const usage = await orm.coachUsage.findUnique({
      where: { userId_year_month: { userId, year: period.year, month: period.month } },
    }).catch(() => null);

    const quota = evaluateQuota(usage, plan);
    const cap = getCoachQuota(plan);

    // `Infinity` no serializa a JSON nativamente — lo mapeamos a null y el
    // cliente lo interpreta como ilimitado (`max === null` o `=== Infinity`
    // en useState). Mantiene API limpia sin caracter especial.
    const maxOut = quota.max === Infinity ? null : quota.max;

    return Response.json({
      used: quota.used,
      max: maxOut,
      plan,
      period,
      modelTier: cap.modelTier,
      blocked: !quota.ok,
    });
  } catch (e) {
    return Response.json(
      { error: "internal_error", message: "Quota lookup failed" },
      { status: 500 }
    );
  }
}
