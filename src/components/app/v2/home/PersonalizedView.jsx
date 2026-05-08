"use client";
import { typography, spacing } from "../tokens";
import HeroComposite from "./HeroComposite";
import DimensionsRow from "./DimensionsRow";
import ActionCard from "./ActionCard";
import ActiveProgramCard from "./ActiveProgramCard";
// Phase 6I-3 — alternatives card (H-3): expone recommendation.alternatives
// del engine bajo el ActionCard primary cuando recommendationRaw provee
// shape engine real. Sin recommendationRaw o sin alternatives → no renderea.
import RecommendationAlternativesCard from "./RecommendationAlternativesCard";
import RecommendationTransitionWrapper from "./RecommendationTransitionWrapper";
// Phase Polish-Tier-2 Gap-4 — bio sparkline data agregator.
import useHeroSparklineData from "@/hooks/useHeroSparklineData";
// Phase Polish-Tier-4 Capa-2 — per-dimension sparkline aggregator.
import useDimensionsSparklineData from "@/hooks/useDimensionsSparklineData";
// Phase 6J-2 HIGH-4 + HIGH-5 — engine context surface en mobile.
// Hasta ahora context.fatigue / context.recalibration / context.momentum /
// context.burnoutRisk se computaban pero no se renderean en PersonalizedView.
import SystemReadingSubCard from "./SystemReadingSubCard";
import FatigueBanner from "../banners/FatigueBanner";
import RecalibrationBanner from "../banners/RecalibrationBanner";

// Estado B — personalized (5+ sesiones).
// Saludo + hero composite + 3 dimensiones + accion contextual + programa.

// Phase 6H Premium-Fix1 — props nuevos opcionales:
//   · readiness: object extendido (computeReadiness output) que el HeroComposite
//                interpreta para modos partial / empty-state.
//   · dimensionSources: { foco, calma, energia } con valores 'measured'|'partial'|
//                       'fallback' que DimensionsRow usa para B4 logic.
//   · onActivateHRV / onCalibrate: callbacks para CTAs del HeroComposite empty/partial.
// Phase 6I-3 — props nuevos opcionales:
//   · recommendationRaw: raw output de useAdaptiveRecommendation (shape engine
//                        con `alternatives`). El existing prop `recommendation`
//                        es el card transformado (`recCard` post-buildRecommendationCard).
//                        Necesitamos el raw para exponer alternatives via helper.
//   · onStartAlternative(protocolId): handler para tap de un alt row. HomeV2
//                        lo wire a `onNavigate({action: "start-recommended", protocolId})`.
// Estos props son ADITIVOS — cuando ausentes, comportamiento legacy preservado
// (HomeV2 puede invocar PersonalizedView sin readiness sin romper nada).
export default function PersonalizedView({
  greeting,
  subtitle,
  composite,
  primaryLine,
  secondaryLine,
  focus,
  calm,
  energy,
  recommendation,
  activeProgram,
  onDimensionSelect,
  onStartRecommended,
  onOpenProgram,
  // Phase 6H Premium-Fix1
  readiness = null,
  dimensionSources = null,
  onActivateHRV,
  onCalibrate,
  // Phase 6I-3
  recommendationRaw = null,
  onStartAlternative,
  // Phase 6J-2 HIGH-4 — opcional CTA handlers para banners (engine
  // recomienda acción pero el navigation target lo decide el caller).
  onFatigueCta,
  onRecalibrationCta,
}) {
  // Phase 6J-2 HIGH-4 + HIGH-5 — extract engine context.
  // recommendationRaw es el raw output del engine (shape:
  // {primary, alternatives, need, context: {...}}). Defensive: cuando
  // null (devOverride sin readiness, fallback path), todos los signals
  // quedan null → banners/sub-card auto-hide via internal gates.
  const engineContext = recommendationRaw?.context || {};
  const fatigue = engineContext.fatigue || null;
  const fatigueGuidance = engineContext.fatigueGuidance || null;
  const recalibration = engineContext.recalibration || null;
  const momentum = engineContext.momentum;
  const momentumDir = engineContext.momentumDir || null;
  const burnoutRisk = engineContext.burnoutRisk || null;
  // Phase Polish-Tier-2 Gap-4 — bio sparkline data (último 14 entries).
  // Auto-hide vía HeroComposite cuando length < 2.
  const sparklineData = useHeroSparklineData();
  // Phase Polish-Tier-4 Capa-2 — per-dimension sparkline data.
  // Reads h.dimensions del history (populated post v18). Auto-emerge cuando
  // user acumula >= 2 entries con dimensions populated.
  const dimensionsSparklineData = useDimensionsSparklineData();
  return (
    <>
      <section
        data-v2-greeting
        style={{
          paddingInline: spacing.s24,
          paddingBlockStart: spacing.s8,
          paddingBlockEnd: 0,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: 40,
            fontWeight: typography.weight.light,
            letterSpacing: "-0.04em",
            color: "rgba(255,255,255,0.96)",
            lineHeight: 1.05,
          }}
        >
          {greeting}
        </h1>
        {subtitle && (
          <p
            style={{
              marginBlockStart: 8,
              marginBlockEnd: 0,
              fontFamily: typography.family,
              fontSize: typography.size.body,
              fontWeight: typography.weight.regular,
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </p>
        )}
      </section>

      <HeroComposite
        value={composite}
        primaryLine={primaryLine}
        secondaryLine={secondaryLine}
        readiness={readiness}
        onActivateHRV={onActivateHRV}
        onCalibrate={onCalibrate}
        sparklineData={sparklineData}
      />

      {/* Phase 6J-2 HIGH-5 — sub-card lectura del sistema.
          Auto-hide cuando momentum/burnout sin data significativa
          (gate interno via momentumDir validity + burnoutRisk !== "sin datos"). */}
      <SystemReadingSubCard
        momentum={momentum}
        momentumDir={momentumDir}
        burnoutRisk={burnoutRisk}
      />

      <DimensionsRow
        focus={focus}
        calm={calm}
        energy={energy}
        sources={dimensionSources}
        onSelect={onDimensionSelect}
        sparklineData={dimensionsSparklineData}
      />

      {/* Phase 6J-2 HIGH-4 — banners contextuales engine.
          FatigueBanner: auto-hide cuando level === "none".
          RecalibrationBanner: auto-hide cuando context.recalibration === null. */}
      <FatigueBanner
        fatigue={fatigue}
        guidance={fatigueGuidance}
        onCta={onFatigueCta}
      />
      <RecalibrationBanner
        recalibration={recalibration}
        onCta={onRecalibrationCta}
      />

      {recommendation && (
        <RecommendationTransitionWrapper
          transitionKey={recommendation.title || recommendation.protocolId || "reco"}
          testid="personalized-recommendation-transition"
        >
          <ActionCard
            title={recommendation.title}
            description={recommendation.description}
            reason={recommendation.reason}
            onStart={onStartRecommended}
          />
        </RecommendationTransitionWrapper>
      )}

      {/* Phase 6I-3 — alternatives card (H-3). Solo cuando recommendationRaw
          provee shape engine real (con alternatives populadas). En fallback
          path (sin engine), recommendationRaw es null y el component se
          auto-oculta defensive. Wrap div para preservar paddingInline del
          shell (ActionCard usa marginInline interno, alts card no). */}
      {recommendationRaw && (
        <div style={{ paddingInline: spacing.s24, paddingBlockStart: spacing.s8 }}>
          <RecommendationAlternativesCard
            recommendation={recommendationRaw}
            onAction={(item) => {
              if (item?.action === "start-protocol" && item.protocolId != null) {
                onStartAlternative?.(item.protocolId);
              }
            }}
            testid="personalized-recommendation-alternatives"
          />
        </div>
      )}

      {activeProgram && (
        <ActiveProgramCard
          program={activeProgram}
          onOpen={onOpenProgram}
        />
      )}
    </>
  );
}
