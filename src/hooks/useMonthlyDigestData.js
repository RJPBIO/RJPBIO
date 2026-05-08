"use client";
/* ═══════════════════════════════════════════════════════════════
   useMonthlyDigestData — Phase Polish-Tier-3
   ═══════════════════════════════════════════════════════════════
   Aggregate del último período de 30 días (rolling window) para
   el monthly digest sheet (Whoop-style summary). Soporta offsets
   negativos para permitir consumir digests previos en futuro.

   Scope honesto:
   · El history entry shape (lib/neural.js _buildHistoryEntry) NO
     guarda dimensions per-session. Avg de foco/calma/energia por
     mes NO es derivable sin persistir nuevo data — out of scope.
     Documentado como Tier 4 future work.
   · Métricas honestas que SÍ podemos derivar:
       - sessionsCount
       - topProtocols by name (h.p) — top 3 por frequency
       - avgBioQ (h.bioQ promedio numérico)
       - avgCoherence (h.c promedio)
       - totalDuration (suma h.dur)
       - avgMood (moodLog filtrado por mes)
       - achievementsCount (state.achievements length is running aggregate;
         para este SP usamos length actual — un per-month timeline real
         requeriría persistir achievement timestamps, también Tier 4).
       - avgDimensions (Polish-Tier-4 Capa-2): cuando ≥ 5 entries del mes
         tienen `dimensions` populated (post v18), retorna avg per-dim.
         Threshold 5 = sample mínimo para que el promedio sea informativo
         (consistente con k-anon-like minimum que B2B reports usan).
         null cuando insufficient sample (no inflamos data).

   Returns:
     null cuando no hay sesiones en el período (history vacío o
       todas fuera del window) — caller hace null-check.
     {
       monthOffset,
       monthStart, monthEnd,                  // ms epoch
       sessionsCount,
       topProtocols,                          // [['Reset', 5], ...]
       avgBioQ, avgCoherence,
       totalDurationSec,
       avgMood,                               // null si moodLog vacío
       achievementsTotal,                     // running count (no per-month)
     }
   ═══════════════════════════════════════════════════════════════ */
import { useMemo } from "react";
import { useStore } from "@/store/useStore";

const DAY_MS = 86_400_000;
const WINDOW_DAYS = 30;
const TOP_PROTOCOLS_LIMIT = 3;
// Polish-Tier-4 Capa-2 — sample mínimo para reportar avgDimensions honesto.
// Bajo este threshold, la media es ruido (no representativa). Inspirado
// en k-anon-style minimum que reports B2B usan.
const AVG_DIMENSIONS_MIN_SAMPLE = 5;

export default function useMonthlyDigestData(monthOffset = 0) {
  const history = useStore((s) => s.history);
  const moodLog = useStore((s) => s.moodLog);
  const achievements = useStore((s) => s.achievements);

  return useMemo(() => {
    if (!Array.isArray(history) || history.length === 0) return null;

    const safeOffset = Math.max(0, Math.floor(monthOffset || 0));
    const now = Date.now();
    // Rolling 30-day buckets desde "ahora" hacia atrás.
    // offset 0 → últimos 30 días. offset 1 → días 31-60 atrás. etc.
    const monthEnd = now - safeOffset * WINDOW_DAYS * DAY_MS;
    const monthStart = monthEnd - WINDOW_DAYS * DAY_MS;

    const sessionsInMonth = history.filter(
      (h) => typeof h?.ts === "number" && h.ts >= monthStart && h.ts <= monthEnd,
    );
    if (sessionsInMonth.length === 0) return null;

    const sessionsCount = sessionsInMonth.length;

    const protocolCounts = {};
    for (const h of sessionsInMonth) {
      const name = typeof h?.p === "string" && h.p.length > 0 ? h.p : null;
      if (!name) continue;
      protocolCounts[name] = (protocolCounts[name] || 0) + 1;
    }
    const topProtocols = Object.entries(protocolCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_PROTOCOLS_LIMIT);

    const sumBioQ = sessionsInMonth.reduce((acc, h) => {
      return acc + (typeof h?.bioQ === "number" ? h.bioQ : 0);
    }, 0);
    const validBioQ = sessionsInMonth.filter((h) => typeof h?.bioQ === "number").length;
    const avgBioQ = validBioQ > 0 ? Math.round(sumBioQ / validBioQ) : null;

    const sumCoh = sessionsInMonth.reduce((acc, h) => {
      return acc + (typeof h?.c === "number" ? h.c : 0);
    }, 0);
    const validCoh = sessionsInMonth.filter((h) => typeof h?.c === "number").length;
    const avgCoherence = validCoh > 0 ? Math.round(sumCoh / validCoh) : null;

    const totalDurationSec = sessionsInMonth.reduce((acc, h) => {
      return acc + (typeof h?.dur === "number" ? h.dur : 0);
    }, 0);

    let avgMood = null;
    if (Array.isArray(moodLog) && moodLog.length > 0) {
      const moodInMonth = moodLog.filter(
        (m) => typeof m?.ts === "number" && m.ts >= monthStart && m.ts <= monthEnd,
      );
      const validMoods = moodInMonth
        .map((m) => (typeof m?.mood === "number" ? m.mood : null))
        .filter((v) => v !== null);
      if (validMoods.length > 0) {
        const sum = validMoods.reduce((a, b) => a + b, 0);
        avgMood = Math.round((sum / validMoods.length) * 10) / 10;
      }
    }

    const achievementsTotal = Array.isArray(achievements) ? achievements.length : 0;

    // Polish-Tier-4 Capa-2 — avgDimensions honest: sólo cuando ≥ 5 entries
    // del mes tienen dimensions populated. Filter defensive contra null.
    let avgDimensions = null;
    const withDims = sessionsInMonth.filter((h) => {
      const d = h?.dimensions;
      return (
        d &&
        typeof d === "object" &&
        typeof d.foco === "number" &&
        typeof d.calma === "number" &&
        typeof d.energia === "number"
      );
    });
    if (withDims.length >= AVG_DIMENSIONS_MIN_SAMPLE) {
      const sum = withDims.reduce(
        (acc, h) => ({
          foco: acc.foco + h.dimensions.foco,
          calma: acc.calma + h.dimensions.calma,
          energia: acc.energia + h.dimensions.energia,
        }),
        { foco: 0, calma: 0, energia: 0 },
      );
      const n = withDims.length;
      avgDimensions = {
        foco: Math.round(sum.foco / n),
        calma: Math.round(sum.calma / n),
        energia: Math.round(sum.energia / n),
      };
    }

    return {
      monthOffset: safeOffset,
      monthStart,
      monthEnd,
      sessionsCount,
      topProtocols,
      avgBioQ,
      avgCoherence,
      totalDurationSec,
      avgMood,
      achievementsTotal,
      avgDimensions,
    };
  }, [history, moodLog, achievements, monthOffset]);
}
