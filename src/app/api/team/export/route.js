import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { anonymize } from "@/server/analytics";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const RANGES = { "7d": 7, "30d": 30, "90d": 90 };

function csvEscape(v) {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req) {
  const session = await auth();
  if (!session?.user) return new Response("unauthorized", { status: 401 });
  const mgr = session.memberships.find((m) => ["OWNER","ADMIN","MANAGER"].includes(m.role));
  if (!mgr) return new Response("forbidden", { status: 403 });

  const url = new URL(req.url);
  const teamId = url.searchParams.get("team") || null;
  const rangeId = url.searchParams.get("range") || "30d";
  const days = RANGES[rangeId] ?? 30;

  const orm = await db();
  const sessions = await orm.neuralSession.findMany({
    where: {
      orgId: mgr.orgId,
      ...(teamId ? { teamId } : {}),
      completedAt: { gte: new Date(Date.now() - days * 86400_000) },
    },
  });
  const agg = anonymize(sessions, { k: 5, epsilon: 1.0 });

  const header = ["day", "weekday", "unique_users", "sessions", "avg_coherencia_delta", "avg_mood_delta"];
  const rows = agg.buckets.map((b) => {
    const wd = WEEKDAYS[new Date(`${b.day}T00:00:00Z`).getUTCDay()];
    return [
      b.day,
      wd,
      b.uniqueUsers,
      b.sessions,
      b.avgCoherenciaDelta?.toFixed(2) ?? "",
      b.avgMoodDelta?.toFixed(3) ?? "",
    ].map(csvEscape).join(",");
  });
  const body = [header.join(","), ...rows].join("\n") + "\n";

  const today = new Date().toISOString().slice(0, 10);
  const name = `bio-ignicion_team${teamId ? `_${teamId}` : ""}_${rangeId}_${today}.csv`;

  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${name}"`,
      "cache-control": "no-store",
    },
  });
}
