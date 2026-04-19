/* ═══════════════════════════════════════════════════════════════
   coachMemory — contexto longitudinal del coach.

   Toma el estado del store y produce un objeto estructurado con la
   "memoria" que el coach debería tener a mano cuando inicia una
   conversación: qué funcionó, qué no, qué pauta recurrente tiene
   el usuario y cuál fue su última trayectoria.

   Es 100 % puro. No habla con un LLM ni con la UI. Esto permite
   que el mismo contexto alimente tanto el coach heurístico actual
   como un eventual coach LLM (se serializa directo en el prompt).
   ═══════════════════════════════════════════════════════════════ */

const DAY = 86400000;

function mean(arr) {
  if (!arr.length) return null;
  return +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
}

function counter(iter, keyFn) {
  const out = new Map();
  for (const item of iter) {
    const k = keyFn(item);
    if (!k) continue;
    out.set(k, (out.get(k) || 0) + 1);
  }
  return out;
}

function topN(map, n) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }));
}

/**
 * @param {object} st Store state (DS-shaped).
 * @param {object} [opts]
 * @param {number} [opts.now=Date.now()]
 * @returns {{
 *   lastSession: object|null,
 *   recentIntents: Array<{key:string,count:number}>,
 *   favoriteProtocols: Array<{name:string, sessions:number, avgDelta:number|null}>,
 *   worstProtocols: Array<{name:string, sessions:number, avgDelta:number|null}>,
 *   moodTrajectory: {recent:number|null, prior:number|null, delta:number|null},
 *   sessionsLast7: number,
 *   sessionsLast30: number,
 *   instrumentBriefs: { pss4: object|null, wemwbs7: object|null, phq2: object|null },
 *   chronotype: object|null,
 *   resonanceFreq: number|null,
 *   openQuestions: string[]
 * }}
 */
export function buildCoachContext(st, { now = Date.now() } = {}) {
  const safe = st || {};
  const history = Array.isArray(safe.history) ? safe.history : [];
  const moodLog = Array.isArray(safe.moodLog) ? safe.moodLog : [];
  const instruments = Array.isArray(safe.instruments) ? safe.instruments : [];

  const lastSession = history.length ? history[history.length - 1] : null;

  const recent14 = history.filter((h) => typeof h.ts === "number" && now - h.ts <= 14 * DAY);
  const recentIntents = topN(counter(recent14, (h) => h.int), 3);

  const protoAggr = new Map();
  for (const s of history.slice(-60)) {
    if (!s?.p) continue;
    const agg = protoAggr.get(s.p) || { name: s.p, sessions: 0, deltaSum: 0, deltaN: 0 };
    agg.sessions += 1;
    if (typeof s.mPost === "number" && typeof s.mPre === "number") {
      agg.deltaSum += s.mPost - s.mPre;
      agg.deltaN += 1;
    }
    protoAggr.set(s.p, agg);
  }
  const ranked = [...protoAggr.values()]
    .map((p) => ({
      name: p.name,
      sessions: p.sessions,
      avgDelta: p.deltaN > 0 ? +(p.deltaSum / p.deltaN).toFixed(2) : null,
    }))
    .filter((p) => p.sessions >= 2);
  const favoriteProtocols = [...ranked]
    .filter((p) => p.avgDelta !== null && p.avgDelta > 0)
    .sort((a, b) => b.avgDelta - a.avgDelta)
    .slice(0, 3);
  const worstProtocols = [...ranked]
    .filter((p) => p.avgDelta !== null && p.avgDelta <= 0)
    .sort((a, b) => a.avgDelta - b.avgDelta)
    .slice(0, 2);

  const recentMoods = moodLog
    .filter((m) => typeof m?.mood === "number" && typeof m?.ts === "number" && now - m.ts <= 7 * DAY)
    .map((m) => m.mood);
  const priorMoods = moodLog
    .filter((m) => typeof m?.mood === "number" && typeof m?.ts === "number")
    .filter((m) => {
      const age = now - m.ts;
      return age > 7 * DAY && age <= 21 * DAY;
    })
    .map((m) => m.mood);
  const recentMean = mean(recentMoods);
  const priorMean = mean(priorMoods);
  const moodTrajectory = {
    recent: recentMean,
    prior: priorMean,
    delta:
      recentMean !== null && priorMean !== null
        ? +(recentMean - priorMean).toFixed(2)
        : null,
  };

  const sessionsLast7 = history.filter((h) => typeof h.ts === "number" && now - h.ts <= 7 * DAY).length;
  const sessionsLast30 = history.filter((h) => typeof h.ts === "number" && now - h.ts <= 30 * DAY).length;

  function latestOf(id) {
    const entries = instruments.filter((e) => e?.instrumentId === id && typeof e.ts === "number");
    if (!entries.length) return null;
    entries.sort((a, b) => a.ts - b.ts);
    const latest = entries[entries.length - 1];
    const first = entries[0];
    return {
      n: entries.length,
      score: latest.score,
      level: latest.level || null,
      ts: latest.ts,
      delta: typeof first.score === "number" ? +(latest.score - first.score).toFixed(2) : null,
    };
  }
  const instrumentBriefs = {
    pss4: latestOf("pss-4"),
    wemwbs7: latestOf("wemwbs-7"),
    phq2: latestOf("phq-2"),
  };

  // Preguntas abiertas: lagunas de datos que, si las cerráramos, harían
  // un coach mucho más útil. El coach puede elegir pedir UNA por turno.
  const openQuestions = [];
  if (!safe.chronotype) openQuestions.push("chronotype");
  if (!safe.resonanceFreq) openQuestions.push("resonance_freq");
  if (!instrumentBriefs.pss4) openQuestions.push("pss4_baseline");
  if (!safe.lastSleepHours && sessionsLast7 > 0) openQuestions.push("sleep_hours");

  return {
    lastSession,
    recentIntents,
    favoriteProtocols,
    worstProtocols,
    moodTrajectory,
    sessionsLast7,
    sessionsLast30,
    instrumentBriefs,
    chronotype: safe.chronotype || null,
    resonanceFreq: typeof safe.resonanceFreq === "number" ? safe.resonanceFreq : null,
    openQuestions,
  };
}

/**
 * Resume el contexto en una frase humana que puede mostrarse en UI
 * o pasarse al LLM. Consciente de que cualquier dato puede faltar.
 */
export function summarizeContext(ctx) {
  if (!ctx) return "Aún no conozco tu ritmo. Empecemos con una sesión corta.";
  const parts = [];
  if (ctx.sessionsLast7 > 0) {
    parts.push(`${ctx.sessionsLast7} sesión${ctx.sessionsLast7 === 1 ? "" : "es"} esta semana`);
  }
  if (ctx.favoriteProtocols[0]) {
    const f = ctx.favoriteProtocols[0];
    parts.push(`“${f.name}” te ha funcionado (+${f.avgDelta} ánimo en ${f.sessions})`);
  } else if (ctx.worstProtocols[0]) {
    parts.push(`evitemos “${ctx.worstProtocols[0].name}” por ahora`);
  }
  if (ctx.moodTrajectory.delta !== null) {
    const d = ctx.moodTrajectory.delta;
    if (d > 0.3) parts.push("tu ánimo viene subiendo");
    else if (d < -0.3) parts.push("tu ánimo viene bajando");
  }
  if (!parts.length) return "Estamos construyendo tu baseline. Sigamos observando.";
  return parts.join(" · ");
}
