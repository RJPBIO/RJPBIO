"use client";
import { useEffect, useMemo } from "react";
import { useStore } from "@/store/useStore";
import { useReadiness } from "@/hooks/useReadiness";
import { useAdaptiveRecommendation } from "@/hooks/useAdaptiveRecommendation";
import { evaluateEngineHealth, suggestOptimalTime } from "@/lib/neural";
import { P as PROTOCOLS } from "@/lib/protocols";
import HeaderV2 from "./home/HeaderV2";
import ColdStartView from "./home/ColdStartView";
import PersonalizedView from "./home/PersonalizedView";
import {
  greetingForHour,
  primaryLineForState,
  secondaryLineForState,
  humanIntentLabel,
} from "./home/copy";

// Tab Hoy v2 — orquestador.
// Detecta dataMaturity via evaluateEngineHealth(state).
// devOverride: 'cold-start' | 'personalized' | 'with-program' | null
//   forza la vista para preview sin necesidad de data real.

export default function HomeV2({ devOverride = null, onNavigate, onBellClick }) {
  const store = useStore();
  useEffect(() => { console.log("[v2] HomeV2 active", { devOverride }); }, [devOverride]);

  const realState = store;
  const realHealth = useMemo(() => evaluateEngineHealth(realState), [realState]);
  const realReadiness = useReadiness(realState);
  const realRecommendation = useAdaptiveRecommendation(realState, { readiness: realReadiness });
  const optimalWindow = useMemo(() => safeOptimal(realState, devOverride), [realState, devOverride]);

  const { health, readiness, recommendation, activeProgram, focusVal, calmVal, energyVal } =
    applyDevOverride({ devOverride, realHealth, realReadiness, realRecommendation, realState });

  const now = new Date();
  const hour = now.getHours();
  const greeting = greetingForHour(hour);

  if (health.dataMaturity === "cold-start") {
    return (
      <>
        <HeaderV2 onBellClick={onBellClick} />
        <ColdStartView
          greeting={greeting}
          onAction={(item) => onNavigate && onNavigate(item)}
        />
      </>
    );
  }

  const composite = Number.isFinite(readiness?.score) ? readiness.score : 0;
  const primaryLine = primaryLineForState({
    dataMaturity: health.dataMaturity,
    composite,
  });
  const secondaryLine = secondaryLineForState({
    dataMaturity: health.dataMaturity,
    optimalWindow,
    totalSessions: health.totalSessions,
  });

  const recCard = recommendation ? buildRecommendationCard(recommendation) : null;

  return (
    <>
      <HeaderV2 onBellClick={onBellClick} />
      <PersonalizedView
        greeting={greeting}
        composite={composite}
        primaryLine={primaryLine}
        secondaryLine={secondaryLine}
        focus={focusVal}
        calm={calmVal}
        energy={energyVal}
        recommendation={recCard}
        activeProgram={activeProgram}
        onDimensionSelect={(id) => onNavigate && onNavigate({ target: `/app/data?dimension=${id}` })}
        onStartRecommended={() => onNavigate && onNavigate({ action: "start-recommended", protocolId: recommendation?.primary?.id || recommendation?.id })}
        onOpenProgram={() => onNavigate && onNavigate({ target: "/app/data#programs" })}
      />
    </>
  );
}

// ---- helpers ------------------------------------------------------

function safeOptimal(state, devOverride) {
  if (devOverride === "personalized" || devOverride === "with-program") {
    // Ventana mock estable para preview.
    return { hour: 6, avgCoherence: 78 };
  }
  try { return suggestOptimalTime(state)?.best || null; } catch { return null; }
}

function buildRecommendationCard(rec) {
  const primary = rec.primary || rec;
  if (!primary) return null;
  const proto = PROTOCOLS.find((p) => p.id === primary.id) || primary;
  const minutes = Math.max(1, Math.round((proto.d || 120) / 60));
  return {
    title: `${proto.n || "Sesión"} · ${proto.d || 120}s`,
    description: `${humanIntentLabel(proto.int)} · ${minutes} min`,
  };
}

function applyDevOverride({ devOverride, realHealth, realReadiness, realRecommendation, realState }) {
  if (!devOverride) {
    return {
      health: realHealth,
      readiness: realReadiness,
      recommendation: realRecommendation,
      activeProgram: realState?.activeProgram || null,
      focusVal: Number.isFinite(realState?.coherencia) ? realState.coherencia : 50,
      calmVal: Number.isFinite(realState?.resiliencia) ? realState.resiliencia : 50,
      energyVal: Number.isFinite(realState?.capacidad) ? realState.capacidad : 50,
    };
  }
  if (devOverride === "cold-start") {
    return {
      health: { dataMaturity: "cold-start", totalSessions: 0 },
      readiness: null,
      recommendation: null,
      activeProgram: null,
      focusVal: 50, calmVal: 50, energyVal: 50,
    };
  }
  // personalized + with-program comparten composite simulado 62.
  const personalized = {
    health: { dataMaturity: "personalized", totalSessions: 42 },
    readiness: { score: 62 },
    recommendation: {
      primary: PROTOCOLS.find((p) => p.n === "Pulse Shift") || null,
    },
    activeProgram: null,
    focusVal: 72,
    calmVal: 58,
    energyVal: 64,
  };
  if (devOverride === "with-program") {
    personalized.activeProgram = {
      id: "neural-baseline",
      startedAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // dia 4
      completedSessionDays: [1, 2, 3],
    };
  }
  return personalized;
}
