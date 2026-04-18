/* ═══════════════════════════════════════════════════════════════
   quarterlyReport — agregador puro para el informe trimestral.

   Toma el estado completo del store y devuelve un objeto serializable
   con las métricas clave del periodo (sesiones, ánimo, HRV, instrumentos
   validados y puntajes neurales). La UI se limita a renderizar.

   Diseñado para que un profesional (terapeuta, médico, coach) pueda
   leer el progreso en 30 segundos y decidir si intervenir.
   ═══════════════════════════════════════════════════════════════ */

const DAY = 86400000;

function inRange(ts, start, end) {
  return typeof ts === "number" && ts >= start && ts <= end;
}

function mean(arr) {
  if (!arr.length) return null;
  return +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
}

function trendOf(series) {
  if (!Array.isArray(series) || series.length < 4) return "insuficiente";
  const mid = Math.floor(series.length / 2);
  const a = mean(series.slice(0, mid));
  const b = mean(series.slice(mid));
  if (a === null || b === null) return "insuficiente";
  const diff = b - a;
  if (diff > 0.3) return "ascendente";
  if (diff < -0.3) return "descendente";
  return "estable";
}

function instrumentSummary(instruments, id, start, end) {
  const entries = (instruments || [])
    .filter((e) => e && e.instrumentId === id && inRange(e.ts, start, end) && typeof e.score === "number")
    .sort((a, b) => a.ts - b.ts);
  if (!entries.length) return { n: 0, first: null, latest: null, delta: null };
  const first = entries[0];
  const latest = entries[entries.length - 1];
  return {
    n: entries.length,
    first: { ts: first.ts, score: first.score, level: first.level ?? null },
    latest: { ts: latest.ts, score: latest.score, level: latest.level ?? null },
    delta: +(latest.score - first.score).toFixed(2),
  };
}

/**
 * @param {object} st  Estado del store (DS-shaped).
 * @param {object} [opts]
 * @param {number} [opts.now=Date.now()]
 * @param {number} [opts.days=90]
 */
export function buildQuarterlyReport(st, { now = Date.now(), days = 90 } = {}) {
  const safe = st || {};
  const end = now;
  const start = end - days * DAY;

  const history = Array.isArray(safe.history) ? safe.history : [];
  const moodLog = Array.isArray(safe.moodLog) ? safe.moodLog : [];
  const hrvLog = Array.isArray(safe.hrvLog) ? safe.hrvLog : [];
  const instruments = Array.isArray(safe.instruments) ? safe.instruments : [];

  const sessionsInRange = history.filter((h) => inRange(h?.ts, start, end));
  const byIntent = { calma: 0, enfoque: 0, energia: 0, reset: 0 };
  const byProto = new Map();
  let totalTimeSec = 0;
  for (const s of sessionsInRange) {
    if (s.int && byIntent[s.int] !== undefined) byIntent[s.int] += 1;
    if (typeof s.d === "number") totalTimeSec += s.d;
    if (s.p) {
      const agg = byProto.get(s.p) || { name: s.p, count: 0, deltaSum: 0, deltaN: 0 };
      agg.count += 1;
      if (typeof s.mPost === "number" && typeof s.mPre === "number") {
        agg.deltaSum += s.mPost - s.mPre;
        agg.deltaN += 1;
      }
      byProto.set(s.p, agg);
    }
  }
  const topProtocols = Array.from(byProto.values())
    .map((p) => ({
      name: p.name,
      count: p.count,
      avgDelta: p.deltaN > 0 ? +(p.deltaSum / p.deltaN).toFixed(2) : null,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const moodsInRange = moodLog.filter((m) => inRange(m?.ts, start, end) && typeof m?.mood === "number");
  const moodSeries = moodsInRange.map((m) => m.mood);
  const avgMood = mean(moodSeries);
  const moodTrend = trendOf(moodSeries);

  const hrvInRange = hrvLog.filter((h) => inRange(h?.ts, start, end) && typeof h?.rmssd === "number");
  const rmssdSeries = hrvInRange.map((h) => h.rmssd);
  const avgRmssd = mean(rmssdSeries);
  const rmssdTrend = trendOf(rmssdSeries);

  const pss4 = instrumentSummary(instruments, "pss-4", start, end);
  const wemwbs7 = instrumentSummary(instruments, "wemwbs-7", start, end);
  const phq2 = instrumentSummary(instruments, "phq-2", start, end);

  const warnings = [];
  if (phq2.latest && typeof phq2.latest.score === "number" && phq2.latest.score >= 3) {
    warnings.push({
      severity: "high",
      code: "phq2_positive",
      message: "PHQ-2 ≥ 3: screening positivo para depresión. Considera evaluación profesional.",
    });
  }
  if (pss4.latest && pss4.latest.level === "high") {
    warnings.push({
      severity: "moderate",
      code: "pss4_high",
      message: "PSS-4 en rango alto: estrés percibido elevado. Prioriza protocolos de calma.",
    });
  }
  if (rmssdTrend === "descendente" && rmssdInRange(avgRmssd)) {
    warnings.push({
      severity: "moderate",
      code: "hrv_down",
      message: "HRV (RMSSD) en descenso durante el trimestre. Revisa sueño y carga.",
    });
  }

  return {
    period: { start, end, days },
    sessions: {
      count: sessionsInRange.length,
      totalTimeSec,
      byIntent,
      topProtocols,
    },
    mood: { avg: avgMood, trend: moodTrend, n: moodSeries.length },
    hrv: { avgRmssd, trend: rmssdTrend, n: rmssdSeries.length },
    instruments: { pss4, wemwbs7, phq2 },
    scores: {
      coherencia: typeof safe.coherencia === "number" ? safe.coherencia : null,
      resiliencia: typeof safe.resiliencia === "number" ? safe.resiliencia : null,
      capacidad: typeof safe.capacidad === "number" ? safe.capacidad : null,
    },
    streak: {
      current: typeof safe.streak === "number" ? safe.streak : 0,
      best: typeof safe.bestStreak === "number" ? safe.bestStreak : 0,
    },
    warnings,
  };
}

// Guard: no emitimos warning de HRV si no hay dato real.
function rmssdInRange(avg) {
  return typeof avg === "number" && isFinite(avg) && avg > 0;
}
