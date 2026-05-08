"use client";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/store/useStore";
import { useReadiness } from "@/hooks/useReadiness";
import { useAdaptiveRecommendation } from "@/hooks/useAdaptiveRecommendation";
import { evaluateEngineHealth, suggestOptimalTime } from "@/lib/neural";
import { P as PROTOCOLS } from "@/lib/protocols";
import {
  extractPrimaryProtocol,
  extractPrimaryProtocolId,
  extractPrimaryReason,
} from "@/lib/recommendationExtract";
import HeaderV2 from "./home/HeaderV2";
import ColdStartView from "./home/ColdStartView";
import LearningView from "./home/LearningView";
import PersonalizedView from "./home/PersonalizedView";
// Phase 6J-1 Group C — pre-session mood picker (chip-row inline).
// Closes Engine Audit CRITICAL-4 (`currentMood` engine input sin UI).
import MoodPrePicker from "./mood/MoodPrePicker";
// Phase 6J-2 HIGH-2 — NOM-35 profile hook personal.
// Closes Engine Audit HIGH-2: nom35Bias dead runtime — el hook lee el
// resultado más reciente de state.nom035Results y lo propaga al engine
// como nom35Dominios → activa _generateReason rama "Tu perfil NOM-035".
import { useNom35Profile } from "@/hooks/useNom35Profile";
// Phase 6F SP-F — Decision A3: WellbeingBanner solo cuando totalSessions ≥ 1.
// Decision B3: persistent banner + drawer on-demand (no auto-mount).
// El componente internamente verifica el gate como safety net.
import WellbeingBanner from "./wellbeing/WellbeingBanner";
// Phase 6H Premium-Fix3 — sheet de celebración cohort transition.
import CohortCelebrationSheet from "./celebrations/CohortCelebrationSheet";
// Phase 6I-1 — sheet de celebración program completion (H-1).
import ProgramCompletionSheet from "./celebrations/ProgramCompletionSheet";
// Phase 6I-2 — sheet de celebración streak milestones (H-2 — config consumer).
import StreakMilestoneSheet from "./celebrations/StreakMilestoneSheet";
import { devLog } from "@/lib/dev-utils";
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
  useEffect(() => { devLog("[v2] HomeV2 active", { devOverride }); }, [devOverride]);

  // Phase 6J-1 Group C — currentMood (1-5 | null) capturado por
  // MoodPrePicker. Local state ephemeral: NO persiste en store, se
  // resetea al cambiar branch o tab. Cuando user inicia protocolo,
  // se propaga a onNavigate({preMood: currentMood}) → AppV2Root
  // launchProtocol → handlePlayerComplete usa para deltaMood.
  // Engine input: useAdaptiveRecommendation({currentMood}) activa el
  // branch moodIsExplicit en adaptiveProtocolEngine (override del
  // primaryNeed según mood declarado).
  const [currentMood, setCurrentMood] = useState(null);

  const realState = store;
  const realHealth = useMemo(() => evaluateEngineHealth(realState), [realState]);
  const realReadiness = useReadiness(realState);
  // Phase 6J-2 HIGH-2 — NOM-35 dominios from latest state.nom035Results.
  // Cuando user sin nom035 history → nom35Dominios=null → engine
  // ignora silenciosamente (back-compat: protocolBiasFromDomain returns null).
  const { nom35Dominios } = useNom35Profile();
  const realRecommendation = useAdaptiveRecommendation(realState, {
    readiness: realReadiness,
    currentMood,
    nom35Dominios,
  });
  const optimalWindow = useMemo(() => safeOptimal(realState, devOverride), [realState, devOverride]);

  const { health, readiness, recommendation, activeProgram, focusVal, calmVal, energyVal } =
    applyDevOverride({ devOverride, realHealth, realReadiness, realRecommendation, realState });

  // Phase 6H Premium-Fix3 — cohort celebration mount/dismiss handlers.
  // pendingCelebration es seteado por completeSession action al cruzar
  // threshold (5/14). Una vez mostrado, markCelebrationShown(cohort)
  // limpia pendingCelebration + persiste cohortCelebrationDoneAt para
  // dedup (no re-trigger en reload ni subsequent sesiones del mismo cohort).
  const pendingCelebration = devOverride ? null : realState?.pendingCelebration || null;
  const markCelebrationShown = useStore((s) => s.markCelebrationShown);
  const dismissPendingCelebration = useStore((s) => s.dismissPendingCelebration);

  const handleCelebrationDismiss = () => {
    // Mark done + clear pending. Idempotente: si user click dismiss varias
    // veces (race con auto-dismiss), markCelebrationShown ya null-checks.
    if (pendingCelebration?.to) {
      markCelebrationShown(pendingCelebration.to);
    } else {
      dismissPendingCelebration();
    }
  };
  const handleCelebrationPrimary = (cohort) => {
    // Por ahora primary CTA simplemente cierra y se queda en /app.
    // El user ya está en la view correspondiente (LearningView post-N=5,
    // PersonalizedView post-N=14). Futuro: scroll-into-view del hero o
    // navegación a /app/data. Mantenemos minimalist por ahora — Decision
    // E del prompt no obliga a navigation específico, solo CTA visible.
    devLog("[v2] cohort celebration primary action", { cohort });
  };

  const celebrationSheet = pendingCelebration ? (
    <CohortCelebrationSheet
      celebration={pendingCelebration}
      onPrimaryAction={handleCelebrationPrimary}
      onDismiss={handleCelebrationDismiss}
    />
  ) : null;

  // Phase 6I-1 — program completion celebration mount/dismiss handlers.
  // pendingProgramCompletionCelebration es seteado por finalizeProgram al
  // cruzar progress=100%. markProgramCompletionCelebrationShown limpia
  // pending + persiste programCompletionCelebrationDoneAt[programId] para
  // dedup (no re-trigger en reload ni re-completion del mismo programa).
  // Mismo pattern Fix3 con scope per-programId en lugar de per-cohort.
  const pendingProgramCompletion = devOverride
    ? null
    : realState?.pendingProgramCompletionCelebration || null;
  const markProgramCompletionShown = useStore((s) => s.markProgramCompletionCelebrationShown);
  const dismissPendingProgramCompletion = useStore((s) => s.dismissPendingProgramCompletionCelebration);

  const handleProgramCompletionDismiss = () => {
    // Mark done + clear pending. Idempotente — markProgramCompletionShown
    // whitelist-checks contra catalog para evitar pollution doneAt.
    if (pendingProgramCompletion?.programId) {
      markProgramCompletionShown(pendingProgramCompletion.programId);
    } else {
      dismissPendingProgramCompletion();
    }
  };
  const handleProgramCompletionPrimary = (programId) => {
    // Phase 6I-1 minimal: dismiss + log. Futuro Phase 6I+ podría navegar a
    // /app/data#programs (mostrar programHistory post-completion) o a un
    // detail page del programa archivado. Mantenemos no-op visible por ahora
    // — sheet cierra y user vuelve a la view actual (que ya refleja
    // activeProgram=null + new achievement post-finalizeProgram).
    devLog("[v2] program completion primary action", { programId });
  };

  const programCompletionSheet = pendingProgramCompletion ? (
    <ProgramCompletionSheet
      celebration={pendingProgramCompletion}
      onPrimaryAction={handleProgramCompletionPrimary}
      onDismiss={handleProgramCompletionDismiss}
    />
  ) : null;

  // Phase 6I-2 — streak milestone celebration mount/dismiss handlers.
  // pendingStreakMilestoneCelebration es seteado por completeSession action
  // cuando state.streak cruza un milestone configurado en NEURAL_CONFIG.
  // markStreakMilestoneShown limpia pending + persiste streakMilestoneDoneAt
  // [milestone] para dedup (no re-trigger en reload ni reconstrucción de
  // streak post-break del mismo milestone). Mismo pattern Fix3 + Phase6I-1
  // con scope per-milestone numérico en lugar de per-cohort/per-programId.
  const pendingStreakMilestone = devOverride
    ? null
    : realState?.pendingStreakMilestoneCelebration || null;
  const markStreakMilestoneShown = useStore((s) => s.markStreakMilestoneShown);
  const dismissPendingStreakMilestone = useStore((s) => s.dismissPendingStreakMilestoneCelebration);

  const handleStreakMilestoneDismiss = () => {
    // Mark done + clear pending. Idempotente — markStreakMilestoneShown
    // whitelist-checks contra config para evitar pollution doneAt.
    if (typeof pendingStreakMilestone?.milestone === "number") {
      markStreakMilestoneShown(pendingStreakMilestone.milestone);
    } else {
      dismissPendingStreakMilestone();
    }
  };
  const handleStreakMilestonePrimary = (milestone) => {
    // Phase 6I-2 minimal: dismiss + log. Futuro Phase 6I+ podría navegar a
    // /app/data#streak para mostrar streak history visual / motivar siguiente
    // milestone. Mantenemos no-op visible — sheet cierra y user vuelve a la
    // view actual (que ya refleja streak persisted post-completeSession).
    devLog("[v2] streak milestone primary action", { milestone });
  };

  const streakMilestoneSheet = pendingStreakMilestone ? (
    <StreakMilestoneSheet
      celebration={pendingStreakMilestone}
      onPrimaryAction={handleStreakMilestonePrimary}
      onDismiss={handleStreakMilestoneDismiss}
    />
  ) : null;

  const now = new Date();
  const hour = now.getHours();
  const greeting = greetingForHour(hour);

  if (health.dataMaturity === "cold-start") {
    // Phase 6H Premium-Fix2 — wiring para phase=active (totalSessions ≥ 1).
    // recommendation: leverage realRecommendation (ya computado) — engine puede
    //   retornar null en cold-start (k<minSamples), ColdStartView fallback a
    //   firstProtocolForIntent internamente.
    // streak: leído del store (set por engine completeSession).
    // nextWindow: derivado de optimalWindow.hour (ya en HomeV2 vía safeOptimal).
    //   Format "HH:00" — null cuando no hay window data.
    const coldStartNextWindow = optimalWindow?.hour != null
      ? `${String(optimalWindow.hour).padStart(2, "0")}:00`
      : null;
    // Phase 6J-1 Group C — MoodPrePicker visible solo en cold-start active
    // (totalSessions ≥ 1). En cold-start fresh (N=0) NO mostramos: el user
    // está en su primera sesión genuina, agregar UI extra incrementa
    // friction sin payoff (engine ignora currentMood en cold-start fresh
    // porque no tiene historial para contextualizar).
    const showPrePicker = (health.totalSessions || 0) >= 1;
    return (
      <>
        <HeaderV2 onBellClick={onBellClick} />
        {/* Phase 6F SP-F · Decision A3: banner solo si user tiene actividad. */}
        <WellbeingBanner totalSessions={health.totalSessions} />
        {showPrePicker && (
          <MoodPrePicker value={currentMood} onChange={setCurrentMood} testid="home-mood-pre-picker" />
        )}
        <ColdStartView
          greeting={greeting}
          totalSessions={health.totalSessions}
          onAction={(item) => onNavigate && onNavigate({ ...item, preMood: currentMood })}
          recommendation={recommendation}
          streak={Number.isFinite(realState?.streak) ? realState.streak : 0}
          nextWindow={coldStartNextWindow}
        />
        {celebrationSheet}
        {programCompletionSheet}
        {streakMilestoneSheet}
      </>
    );
  }

  // Phase 6E SP-A — branch "learning" (5 ≤ totalSessions < 14).
  // Phase 6F bug-fix runtime — threshold para "personalized" bajado
  // de 20 a 14 (alineado con engine interno neural.js:1012). Antes
  // 20 era arbitrario y NO sustentado por config — solo conservador.
  // 14 = 2 semanas uso diario, 3/5 personalization signals activos.
  // LearningView muestra progress hacia baseline + next recommendation
  // con fallback + mini-stats acumulados (Bug-48).
  if (health.dataMaturity === "learning") {
    return (
      <>
        <HeaderV2 onBellClick={onBellClick} />
        <WellbeingBanner totalSessions={health.totalSessions} />
        {/* Phase 6J-1 Group C — pre-picker. En learning siempre visible:
            el user ya tiene baseline y el engine puede explotar el
            currentMood signal para override del primaryNeed. */}
        <MoodPrePicker value={currentMood} onChange={setCurrentMood} testid="home-mood-pre-picker" />
        <LearningView
          greeting={greeting}
          subtitle={null}
          onAction={(item) => onNavigate && onNavigate({ ...item, preMood: currentMood })}
          onNavigate={onNavigate}
        />
        {celebrationSheet}
        {programCompletionSheet}
        {streakMilestoneSheet}
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

  // Phase 6H Premium-Fix1 — derivar dimensionSources desde el shape del store
  // y la flag readiness.partial. Lógica:
  //   · No hay sesiones reales (history vacío) → 'fallback' (oculta dimensión)
  //   · Sesiones reales + readiness.partial → 'partial' (muestra ESTIMADO)
  //   · Sesiones reales + readiness full → 'measured' (descriptor humano normal)
  //   · Sesiones reales + readiness null (devOverride sin readiness) → 'measured'
  // El gate principal de visibilidad es history.length>0 + valor numérico finito.
  const dimensionSources = computeDimensionSources({
    realState,
    readinessPartial: !!readiness?.partial,
    devOverride,
  });

  // Phase 6H Premium-Fix1 — handlers para CTAs del HeroComposite empty/partial.
  // /app/data es destino canónico para acceder a HRV widget + cronotipo + PSS-4
  // (Tab Datos hosting tools que el user puede ejecutar standalone). Misma
  // semántica que onDimensionSelect — leverage existing nav route en lugar de
  // inventar /app/hrv y /app/calibration que no existen.
  const handleActivateHRV = () => onNavigate && onNavigate({ target: "/app/data#hrv" });
  const handleCalibrate   = () => onNavigate && onNavigate({ target: "/app/data#calibracion" });

  return (
    <>
      <HeaderV2 onBellClick={onBellClick} />
      <WellbeingBanner totalSessions={health.totalSessions} />
      {/* Phase 6J-1 Group C — pre-picker en personalized branch. El
          engine usa currentMood para override del primaryNeed cuando es
          explícito (mood=1 → calma, mood=5 → energia). */}
      <MoodPrePicker value={currentMood} onChange={setCurrentMood} testid="home-mood-pre-picker" />
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
        readiness={devOverride ? null : readiness}
        dimensionSources={dimensionSources}
        onActivateHRV={handleActivateHRV}
        onCalibrate={handleCalibrate}
        onDimensionSelect={(id) => onNavigate && onNavigate({ target: `/app/data?dimension=${id}` })}
        onStartRecommended={() => onNavigate && onNavigate({
          action: "start-recommended",
          protocolId: extractPrimaryProtocolId(recommendation) || recommendation?.id,
          preMood: currentMood, // Phase 6J-1 Group C — propaga mood pre-sesión
        })}
        onOpenProgram={() => onNavigate && onNavigate({ target: "/app/data#programs" })}
        recommendationRaw={devOverride ? null : recommendation}
        onStartAlternative={(protocolId) => onNavigate && onNavigate({
          action: "start-recommended",
          protocolId,
          preMood: currentMood, // Phase 6J-1 Group C
        })}
      />
      {celebrationSheet}
      {programCompletionSheet}
      {streakMilestoneSheet}
    </>
  );
}

// Phase 6H Premium-Fix1 — sources por dimensión.
// devOverride='personalized' / 'with-program' simulan signals reales para
// preview, así que reportamos 'measured' (preserva expectativa de smoke
// test que asume composite 62 + 3 dimensiones visibles). devOverride='cold-start'
// no llega a este branch (HomeV2 retorna antes en cold-start branch).
function computeDimensionSources({ realState, readinessPartial, devOverride }) {
  if (devOverride === "personalized" || devOverride === "with-program") {
    return { foco: "measured", calma: "measured", energia: "measured" };
  }
  const hist = Array.isArray(realState?.history) ? realState.history : [];
  const hasSessions = hist.length > 0;
  if (!hasSessions) {
    return { foco: "fallback", calma: "fallback", energia: "fallback" };
  }
  // Si engine retornó score derivado de coherence-only fallback, marcamos
  // las 3 dimensiones como 'partial' (engine sin HRV/sleep/mood significa
  // que coherencia/resiliencia/capacidad están menos calibradas).
  const tag = readinessPartial ? "partial" : "measured";
  return { foco: tag, calma: tag, energia: tag };
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
  if (!rec) return null;
  // Phase 6H Fix-A1 — extraction defensive via helper centralizado.
  // ANTES (Premium-Fix4): `primary.id` era undefined siempre porque shape
  // real engine es `primary.protocol.id`. Resultado: PROTOCOLS.find devolvía
  // undefined, fallback caía a `primary` que también era inválido → reco
  // card mostraba "Sesión · 120s" + "calma · 2 min" genérico (de defaults
  // `proto.n || "Sesión"` y `proto.d || 120`).
  // AHORA (Fix-A1): helper retorna Protocol object real desde
  // `primary.protocol`, exposing engine title + duration + intent.
  const protoFromEngine = extractPrimaryProtocol(rec);
  const proto = protoFromEngine
    ? (PROTOCOLS.find((p) => p.id === protoFromEngine.id) || protoFromEngine)
    : null;
  if (!proto) return null;
  const minutes = Math.max(1, Math.round((proto.d || 120) / 60));
  // Engine reason ("Por qué" personalizado): "Tu historial muestra +1.2 puntos
  // con este protocolo", "Readiness elevado (78): ventana para trabajo cognitivo
  // exigente", "Reportaste tensión alta: regulación parasimpática antes de
  // cualquier carga". Cuando null (legacy mock o fallback), ActionCard oculta
  // el caption italic — backwards compat.
  return {
    title: `${proto.n || "Sesión"} · ${proto.d || 120}s`,
    description: `${humanIntentLabel(proto.int)} · ${minutes} min`,
    reason: extractPrimaryReason(rec),
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
