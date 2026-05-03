/* Cron · Weekly LLM summary (Sprint S5.3)
 *
 * Cadencia: lunes 14:00 UTC.
 * Para cada user activo (sesión en últimas 7 días), genera resumen
 * narrativo 3-frases con Claude Haiku 4.5 sobre su semana neural.
 * Encola push notification con el resumen + link a /app.
 *
 * Uso de Haiku (no Sonnet) intencional:
 *  - Resumen es input-bound, no output-bound (3 frases max).
 *  - Costo Haiku ~5x menor que Sonnet.
 *  - Latencia menor permite procesar 1000s de users en una corrida.
 *
 * Privacy: no enviamos data sensible (HRV bruto, mood individual)
 * al LLM si no es necesario. Resumimos pre-LLM en agregados:
 *  - sessionCountWeek
 *  - topIntent (de bandit topArms)
 *  - moodTrend (subiendo/estable/bajando)
 *  - vCoresEarned
 *
 * Sin ANTHROPIC_API_KEY, el cron skipea con error claro.
 */

import "server-only";
import { db } from "../db";
import { auditLog } from "../audit";
import { enqueuePush } from "../push-delivery";
import { topArms } from "../../lib/neural/bandit";

const WEEK_MS = 7 * 86400_000;
const BATCH = 100;

export async function runWeeklySummary() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      processed: 0,
      errors: 1,
      details: { errorMessage: "ANTHROPIC_API_KEY not configured" },
    };
  }

  const orm = await db();
  const now = new Date();
  const since = new Date(now.getTime() - WEEK_MS);

  // Users con al menos 1 sesión en últimos 7d.
  const recentUserIds = await orm.neuralSession.findMany({
    where: { completedAt: { gte: since } },
    select: { userId: true },
    distinct: ["userId"],
    take: 5000,
  }).then((r) => r.map((x) => x.userId)).catch(() => []);

  if (recentUserIds.length === 0) {
    return { processed: 0, errors: 0, details: { activeUsers: 0 } };
  }

  let processed = 0;
  let pushed = 0;
  let errors = 0;

  for (const userId of recentUserIds.slice(0, BATCH)) {
    try {
      const stats = await summarizeUserWeek(orm, userId, since, now);
      if (!stats) continue;
      const summary = await generateNarrative(stats, apiKey);
      if (!summary) continue;

      await enqueuePush(userId, {
        title: "Tu resumen semanal",
        body: summary.slice(0, 240),
        href: "/app",
        kind: "weekly-digest",
      });
      pushed += 1;
      processed += 1;
    } catch {
      errors += 1;
    }
  }

  await auditLog({
    action: "cron.weekly-summary.tick",
    payload: { activeUsers: recentUserIds.length, pushed, errors },
  }).catch(() => {});

  return {
    processed,
    errors,
    details: { activeUsers: recentUserIds.length, pushed, batch: BATCH },
  };
}

async function summarizeUserWeek(orm, userId, since, now) {
  const sessions = await orm.neuralSession.findMany({
    where: { userId, completedAt: { gte: since } },
    select: { protocolId: true, moodPre: true, moodPost: true, completedAt: true, durationSec: true },
  }).catch(() => []);
  if (!sessions.length) return null;

  const moods = sessions
    .filter((s) => typeof s.moodPre === "number" && typeof s.moodPost === "number")
    .map((s) => s.moodPost - s.moodPre);
  const avgDelta = moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null;

  const protoCounts = {};
  for (const s of sessions) protoCounts[s.protocolId] = (protoCounts[s.protocolId] || 0) + 1;
  const topProto = Object.entries(protoCounts).sort((a, b) => b[1] - a[1])[0];

  // Lookup banditArms del user para top intent.
  const user = await orm.user.findUnique({
    where: { id: userId },
    select: { neuralState: true },
  }).catch(() => null);
  const arms = user?.neuralState?.banditArms || {};
  const top = topArms(arms, 1);
  const topIntent = top[0]?.id?.split(":")[0] || null;

  return {
    userId,
    sessionCount: sessions.length,
    topProtocol: topProto?.[0] || null,
    topIntent,
    avgMoodDelta: avgDelta !== null ? +avgDelta.toFixed(2) : null,
    totalMinutes: Math.round(sessions.reduce((a, s) => a + (s.durationSec || 0), 0) / 60),
  };
}

async function generateNarrative(stats, apiKey) {
  const prompt = `Eres el coach de BIO-IGNICIÓN. Genera UN resumen de exactamente 3 frases sobre la semana del operador.

Tono: cálido, accionable, sin jerga clínica. En español neutro.

Stats:
- Sesiones: ${stats.sessionCount}
- Intent dominante: ${stats.topIntent || "varios"}
- Δ mood promedio: ${stats.avgMoodDelta != null ? (stats.avgMoodDelta > 0 ? "+" : "") + stats.avgMoodDelta : "n/a"}
- Minutos totales: ${stats.totalMinutes}

Frase 1: lo que hizo bien.
Frase 2: insight observable de los datos.
Frase 3: micro-acción para la próxima semana.`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        temperature: 0.5,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!r.ok) return null;
    const json = await r.json();
    return json?.content?.[0]?.text?.trim() || null;
  } catch {
    return null;
  }
}
