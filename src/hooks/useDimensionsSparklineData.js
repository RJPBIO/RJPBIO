"use client";
/* ═══════════════════════════════════════════════════════════════
   useDimensionsSparklineData — Phase Polish-Tier-4 Capa 2
   ═══════════════════════════════════════════════════════════════
   Aggregate de los últimos N entries con dimensions populated para
   mini-sparklines per-chip en DimensionsRow. Defensive: filtra
   entries pre-Tier-4 (dimensions null) — sparklines auto-emergen
   conforme nuevos entries con dimensions van llegando.

   Returns:
     { foco: [{value, ts}, ...], calma: [...], energia: [...] }
     Cada array puede estar vacío (history < 2 puntos válidos) — el
     componente Sparkline auto-hide.

   Design rationale:
   · MAX_POINTS = 14 (mismo que useHeroSparklineData consistencia).
   · NO synthetic backfill (preserva data trust principle Tier 2/3).
   · Pre-Tier-4 entries (dimensions:null) filtrados → sparklines
     emergen gradualmente en próximas sesiones del user.
   ═══════════════════════════════════════════════════════════════ */
import { useMemo } from "react";
import { useStore } from "@/store/useStore";

const MAX_POINTS = 14;
const DIMS = ["foco", "calma", "energia"];

export default function useDimensionsSparklineData() {
  const history = useStore((s) => s.history);

  return useMemo(() => {
    const empty = { foco: [], calma: [], energia: [] };
    if (!Array.isArray(history) || history.length < 2) return empty;

    const recent = history.slice(-MAX_POINTS);
    const out = { foco: [], calma: [], energia: [] };

    for (const h of recent) {
      const d = h?.dimensions;
      const ts = typeof h?.ts === "number" ? h.ts : null;
      if (ts === null || !d || typeof d !== "object") continue;
      for (const k of DIMS) {
        const v = d[k];
        if (typeof v === "number" && Number.isFinite(v)) {
          out[k].push({ value: v, ts });
        }
      }
    }
    return out;
  }, [history]);
}
