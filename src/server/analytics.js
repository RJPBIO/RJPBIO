/* ═══════════════════════════════════════════════════════════════
   Analytics con k-anonymity (k=5) y noise diferencial opcional.
   Resultado: agregados por cohorte nunca exponen usuarios únicos.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";

function dayKey(d) { return new Date(d).toISOString().slice(0, 10); }

function laplaceNoise(scale) {
  const u = Math.random() - 0.5;
  return -Math.sign(u) * scale * Math.log(1 - 2 * Math.abs(u));
}

export function anonymize(rows, { k = 5, epsilon } = {}) {
  if (!rows.length) return { buckets: [], suppressed: 0, totalSessions: 0 };
  const buckets = new Map();
  for (const r of rows) {
    const key = `${dayKey(r.completedAt)}|${r.teamId || "org"}`;
    if (!buckets.has(key)) buckets.set(key, { day: dayKey(r.completedAt), teamId: r.teamId || null, users: new Set(), sessions: 0, coh: 0, moodDelta: 0, n: 0 });
    const b = buckets.get(key);
    b.users.add(r.userId);
    b.sessions += 1;
    if (typeof r.coherenciaDelta === "number") { b.coh += r.coherenciaDelta; b.n += 1; }
    if (r.moodPre != null && r.moodPost != null) b.moodDelta += r.moodPost - r.moodPre;
  }
  let suppressed = 0;
  const out = [];
  for (const b of buckets.values()) {
    if (b.users.size < k) { suppressed += 1; continue; }
    const avgCoh = b.n ? b.coh / b.n : null;
    const avgMood = b.sessions ? b.moodDelta / b.sessions : null;
    out.push({
      day: b.day,
      teamId: b.teamId,
      uniqueUsers: b.users.size,
      sessions: b.sessions,
      avgCoherenciaDelta: epsilon ? avgCoh + laplaceNoise(1 / epsilon) : avgCoh,
      avgMoodDelta: epsilon ? avgMood + laplaceNoise(1 / epsilon) : avgMood,
    });
  }
  return { buckets: out.sort((a, b) => a.day.localeCompare(b.day)), suppressed, totalSessions: rows.length, k };
}
