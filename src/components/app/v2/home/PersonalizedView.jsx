"use client";
import { typography, spacing } from "../tokens";
import HeroComposite from "./HeroComposite";
import DimensionsRow from "./DimensionsRow";
import ActionCard from "./ActionCard";
import ActiveProgramCard from "./ActiveProgramCard";

// Estado B — personalized (5+ sesiones).
// Saludo + hero composite + 3 dimensiones + accion contextual + programa.

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
      />

      <DimensionsRow
        focus={focus}
        calm={calm}
        energy={energy}
        onSelect={onDimensionSelect}
      />

      {recommendation && (
        <ActionCard
          title={recommendation.title}
          description={recommendation.description}
          onStart={onStartRecommended}
        />
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
