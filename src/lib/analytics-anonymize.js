/* ═══════════════════════════════════════════════════════════════
   Analytics — k-anonymity primitive (pure, testable).
   ═══════════════════════════════════════════════════════════════
   Aplica k-anonymity (default k=5) a sessions agregadas. Cada bucket
   {day, teamId} con menos de k usuarios únicos se SUPPRIME (no se
   incluye en el output). Esto garantiza que ningún row del agregado
   pueda re-identificar a un individuo — base legal para los carve-outs
   de Recital 26 / LFPDPPP Art. 3.VIII / CCPA "deidentified data".

   Differential privacy opcional: si epsilon > 0, agrega noise Laplace
   con scale = 1/epsilon a los promedios. Recomendado epsilon ≤ 1.0
   para guarantees fuertes; >1 da noise mínimo (debugging only).

   Output shape:
     { buckets: [{day, teamId, uniqueUsers, sessions, avgCoherenciaDelta, avgMoodDelta}],
       suppressed: number,        — buckets descartados por k-threshold
       totalSessions: number,     — input total (informational)
       k: number }                — k usado (echo del input)

   Las funciones puras (dayKey, laplaceNoise) están exportadas para
   testing — el server wrapper aplica `"server-only"`.
   ═══════════════════════════════════════════════════════════════ */

export function dayKey(d) {
  return new Date(d).toISOString().slice(0, 10);
}

/* Laplace noise — distribución continua simétrica centrada en 0
   con scale b. Inverse transform sampling: u ~ Uniform(-0.5, 0.5),
   X = -sign(u) * b * ln(1 - 2|u|).
   Variance = 2b². Mean = 0. */
export function laplaceNoise(scale) {
  const u = Math.random() - 0.5;
  return -Math.sign(u) * scale * Math.log(1 - 2 * Math.abs(u));
}

/**
 * Agrega rows de NeuralSession con k-anonymity.
 *
 * @param {Array<{userId, teamId?, completedAt, coherenciaDelta?, moodPre?, moodPost?}>} rows
 * @param {{k?: number, epsilon?: number}} [opts]
 * @returns {{buckets: Array, suppressed: number, totalSessions: number, k: number}}
 */
export function anonymize(rows, { k = 5, epsilon } = {}) {
  if (!rows || !rows.length) {
    return { buckets: [], suppressed: 0, totalSessions: 0, k };
  }
  const buckets = new Map();
  for (const r of rows) {
    const key = `${dayKey(r.completedAt)}|${r.teamId || "org"}`;
    if (!buckets.has(key)) {
      buckets.set(key, {
        day: dayKey(r.completedAt),
        teamId: r.teamId || null,
        users: new Set(),
        sessions: 0,
        coh: 0,
        moodDelta: 0,
        n: 0,
      });
    }
    const b = buckets.get(key);
    b.users.add(r.userId);
    b.sessions += 1;
    if (typeof r.coherenciaDelta === "number") {
      b.coh += r.coherenciaDelta;
      b.n += 1;
    }
    if (r.moodPre != null && r.moodPost != null) {
      b.moodDelta += r.moodPost - r.moodPre;
    }
  }
  let suppressed = 0;
  const out = [];
  for (const b of buckets.values()) {
    if (b.users.size < k) {
      suppressed += 1;
      continue;
    }
    const avgCoh = b.n ? b.coh / b.n : null;
    const avgMood = b.sessions ? b.moodDelta / b.sessions : null;
    out.push({
      day: b.day,
      teamId: b.teamId,
      uniqueUsers: b.users.size,
      sessions: b.sessions,
      avgCoherenciaDelta:
        epsilon && avgCoh != null ? avgCoh + laplaceNoise(1 / epsilon) : avgCoh,
      avgMoodDelta:
        epsilon && avgMood != null ? avgMood + laplaceNoise(1 / epsilon) : avgMood,
    });
  }
  return {
    buckets: out.sort((a, b) => a.day.localeCompare(b.day)),
    suppressed,
    totalSessions: rows.length,
    k,
  };
}
