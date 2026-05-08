"use client";
/* ═══════════════════════════════════════════════════════════════
   useHeroSparklineData — Phase Polish-Tier-2 Gap-4
   ═══════════════════════════════════════════════════════════════
   Aggregate de los últimos N entries de history para el sparkline
   bio (single trend bajo el HeroComposite big number).

   Scope honesto: el history entry (lib/neural.js _buildHistoryEntry)
   guarda `bioQ` como número plano (NO objeto con dimensions). Por
   eso este hook expone una sola serie `bio` derivada de h.bioQ.

   Dimensiones por sesión (foco/calma/energia) NO existen en el
   history entry — son cómputo running del state. Sparklines por
   dimensión requerirían persistir nuevo data per session: out of
   scope para este SP. Documentado como Tier 4 future work.

   Returns:
     { bio: [{ value, ts }, ...] }   // hasta últimas 14 sesiones
     bio puede estar vacío (history < 2 puntos) — Sparkline auto-hide.
   ═══════════════════════════════════════════════════════════════ */
import { useMemo } from "react";
import { useStore } from "@/store/useStore";

const MAX_POINTS = 14;

export default function useHeroSparklineData() {
  const history = useStore((s) => s.history);

  return useMemo(() => {
    if (!Array.isArray(history) || history.length < 2) {
      return { bio: [] };
    }
    const recent = history.slice(-MAX_POINTS);
    const bio = recent
      .map((h) => {
        const value = typeof h?.bioQ === "number" ? h.bioQ : null;
        const ts = typeof h?.ts === "number" ? h.ts : null;
        if (value === null || ts === null) return null;
        return { value, ts };
      })
      .filter(Boolean);
    return { bio };
  }, [history]);
}
