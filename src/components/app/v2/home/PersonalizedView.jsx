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
}) {
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
      />

      <DimensionsRow
        focus={focus}
        calm={calm}
        energy={energy}
        sources={dimensionSources}
        onSelect={onDimensionSelect}
      />

      {recommendation && (
        <ActionCard
          title={recommendation.title}
          description={recommendation.description}
          reason={recommendation.reason}
          onStart={onStartRecommended}
        />
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
