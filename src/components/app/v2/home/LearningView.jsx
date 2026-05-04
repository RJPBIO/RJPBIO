"use client";
import { useMemo } from "react";
import { useStore } from "@/store/useStore";
import { useReadiness } from "@/hooks/useReadiness";
import { useAdaptiveRecommendation } from "@/hooks/useAdaptiveRecommendation";
import { P as PROTOCOLS } from "@/lib/protocols";
import { firstProtocolForIntent, DEFAULT_FIRST_PROTOCOL_ID } from "@/lib/first-protocol";
import { colors, typography, spacing, radii, surfaces, motion as motionTok } from "../tokens";

// Phase 6E SP-A — vista intermedia "learning" entre cold-start (0
// sesiones) y personalized (20+ sesiones). Antes el branch 1≤N<20
// caía a PersonalizedView default que requiere data inexistente
// (composite real, recommendation calibrada, activeProgram). El
// resultado: viewport vacío post-primera-acción cuando ColdStart
// también filtraba todas sus cards (Bug-48).
//
// LearningView muestra:
//   - Greeting + subtitle del orquestador (HomeV2)
//   - Progress to baseline: "Sesión X de 5 hasta tu trayectoria personalizada"
//     + barra cyan + copy honesto (no inflate progress)
//   - Recommendation card: useAdaptiveRecommendation con fallback al
//     firstProtocolForIntent del user si engine retorna null (cohorts
//     pre-baseline, k<5 cohort prior, error).
//   - Mini-stats acumulados: sesiones · racha · coherencia (si aplica)
//   - Quick links: "Ver datos" + "Conversar con Coach"
//
// NO renderea HeroComposite (ese requiere baseline maduro). NO renderea
// DimensionsRow (focus/calm/energy reales requieren history extenso).
// LearningView es bridge intencional con copy "en aprendizaje" — no
// pretende ser una versión incompleta de PersonalizedView.

export default function LearningView({ greeting, subtitle, onAction, onNavigate }) {
  // Selectores granulares.
  const history = useStore((s) => s.history);
  const streak = useStore((s) => s.streak);
  const coherencia = useStore((s) => s.coherencia);
  const firstIntent = useStore((s) => s.firstIntent);
  const store = useStore();

  const totalSessions = Array.isArray(history) ? history.length : 0;
  const sessionsToBaseline = Math.max(0, 5 - totalSessions);

  // Engine puede retornar null si k<minSamples (cold-start del propio
  // engine, no del UI). Fallback al protocolo del firstIntent del user.
  const readiness = useReadiness(store);
  const recommendation = useAdaptiveRecommendation(store, { readiness });
  const recoProtocol = useMemo(() => {
    const fromEngine = recommendation?.primary;
    if (fromEngine?.id != null) return PROTOCOLS.find((p) => p.id === fromEngine.id) || fromEngine;
    return firstProtocolForIntent(firstIntent);
  }, [recommendation, firstIntent]);

  return (
    <>
      <section
        data-v2-greeting
        style={{
          paddingInline: spacing.s24,
          paddingBlockStart: spacing.s8,
          paddingBlockEnd: spacing.s32,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: 40,
            fontWeight: typography.weight.light,
            letterSpacing: "-0.04em",
            color: colors.text.strong,
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
              color: colors.text.secondary,
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </p>
        )}
      </section>

      <section
        data-v2-learning-progress
        aria-label="Progreso hacia tu baseline"
        style={{
          paddingInline: spacing.s24,
          paddingBlockEnd: spacing.s32,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: colors.accent.phosphorCyan,
            fontWeight: typography.weight.medium,
          }}
        >
          EN APRENDIZAJE
        </div>
        <h2
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: typography.size.subtitleMin,
            fontWeight: typography.weight.medium,
            color: colors.text.strong,
            letterSpacing: "-0.005em",
            lineHeight: 1.3,
          }}
        >
          Sesión {totalSessions} de 5 hasta tu trayectoria personalizada
        </h2>
        <ProgressBar value={totalSessions} max={5} />
        <p
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: typography.size.bodyMin,
            fontWeight: typography.weight.regular,
            color: colors.text.secondary,
            lineHeight: 1.5,
          }}
        >
          {sessionsToBaseline > 0
            ? `${sessionsToBaseline} ${sessionsToBaseline === 1 ? "sesión" : "sesiones"} más para empezar a personalizar tu coach.`
            : "Tu próxima sesión empieza tu trayectoria personalizada."}
        </p>
      </section>

      <section
        data-v2-learning-recommendation
        aria-label="Tu próxima sesión"
        style={{
          paddingInline: spacing.s24,
          paddingBlockEnd: spacing.s32,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: colors.accent.phosphorCyan,
            fontWeight: typography.weight.medium,
          }}
        >
          TU PRÓXIMA SESIÓN
        </div>
        <RecommendationCard
          protocol={recoProtocol}
          source={recommendation?.primary ? "engine" : "fallback"}
          onStart={() => {
            const protocolId = recoProtocol?.id ?? DEFAULT_FIRST_PROTOCOL_ID;
            onAction?.({ action: "start-protocol", protocolId });
          }}
        />
      </section>

      <section
        data-v2-learning-stats
        aria-label="Tu motor neural"
        style={{
          paddingInline: spacing.s24,
          paddingBlockEnd: spacing.s32,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: colors.text.muted,
            fontWeight: typography.weight.medium,
          }}
        >
          TU MOTOR NEURAL
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
          }}
        >
          <StatCard label="SESIONES" value={String(totalSessions)} />
          <StatCard label="RACHA" value={`${streak || 0}d`} />
          <StatCard
            label="COHERENCIA"
            value={Number.isFinite(coherencia) && coherencia > 0 ? `${Math.round(coherencia)}%` : "—"}
          />
        </div>
      </section>

      <section
        data-v2-learning-links
        aria-label="Explora tu producto"
        style={{
          paddingInline: spacing.s24,
          paddingBlockEnd: spacing.s96,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <QuickLink
          label="Ver datos"
          description="Sesiones, achievements, programas"
          onClick={() => onNavigate?.({ target: "/app/data" })}
        />
        <QuickLink
          label="Conversar con Coach"
          description="Pregunta sobre tu progreso"
          onClick={() => onNavigate?.({ target: "/app/coach" })}
        />
      </section>
    </>
  );
}

function ProgressBar({ value, max }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      data-v2-learning-progressbar
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      style={{
        position: "relative",
        height: 4,
        background: surfaces.iconBox,
        borderRadius: 999,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: `${pct}%`,
          background: colors.accent.phosphorCyan,
          borderRadius: 999,
          transition: `width ${motionTok.duration.enter}ms ${motionTok.ease.out}`,
        }}
      />
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div
      style={{
        background: colors.bg.raised,
        border: `0.5px solid ${colors.separator}`,
        borderRadius: radii.panel,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <span
        style={{
          fontFamily: typography.familyMono,
          fontSize: typography.size.microCaps,
          letterSpacing: "0.12em",
          color: colors.text.muted,
          fontWeight: typography.weight.medium,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: typography.family,
          fontSize: 22,
          fontWeight: typography.weight.light,
          color: colors.text.strong,
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function RecommendationCard({ protocol, source, onStart }) {
  const name = protocol?.n || "Sesión recomendada";
  const duration = protocol?.d || 120;
  const intent = protocol?.int || "calma";
  return (
    <article
      data-v2-recommendation
      data-v2-recommendation-source={source}
      style={{
        background: colors.bg.raised,
        border: `0.5px solid ${surfaces.accentBorder}`,
        borderRadius: radii.panelLg,
        padding: spacing.s24 - 4,
        display: "flex",
        flexDirection: "column",
        gap: spacing.s16,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span
          style={{
            fontFamily: typography.family,
            fontSize: typography.size.subtitleMin,
            fontWeight: typography.weight.medium,
            color: colors.text.strong,
            letterSpacing: "-0.005em",
            lineHeight: 1.25,
          }}
        >
          {name}
        </span>
        <span
          style={{
            fontFamily: typography.family,
            fontSize: typography.size.bodyMin,
            fontWeight: typography.weight.regular,
            color: colors.text.secondary,
            lineHeight: 1.4,
          }}
        >
          {duration}s · {humanIntent(intent)}
        </span>
      </div>
      <button
        type="button"
        onClick={onStart}
        data-testid="learning-recommendation-cta"
        style={{
          appearance: "none",
          background: "transparent",
          border: `0.5px solid ${colors.accent.phosphorCyan}`,
          borderRadius: 8,
          color: colors.accent.phosphorCyan,
          cursor: "pointer",
          paddingBlock: 14,
          paddingInline: 20,
          minBlockSize: 48,
          fontFamily: typography.family,
          fontSize: 12,
          fontWeight: typography.weight.medium,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          alignSelf: "flex-start",
          transitionProperty: "background, transform",
          transitionDuration: `${motionTok.duration.tap}ms`,
          transitionTimingFunction: motionTok.ease.out,
        }}
      >
        Empezar
      </button>
    </article>
  );
}

function QuickLink({ label, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-v2-learning-quicklink
      style={{
        appearance: "none",
        textAlign: "start",
        background: colors.bg.raised,
        border: `0.5px solid ${colors.separator}`,
        borderRadius: radii.panel,
        padding: "14px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        cursor: "pointer",
        transitionProperty: "background, transform",
        transitionDuration: `${motionTok.duration.tap}ms`,
        transitionTimingFunction: motionTok.ease.out,
      }}
    >
      <span
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.medium,
          color: colors.text.strong,
          letterSpacing: "-0.005em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.caption,
          fontWeight: typography.weight.regular,
          color: colors.text.secondary,
          lineHeight: 1.4,
        }}
      >
        {description}
      </span>
    </button>
  );
}

function humanIntent(intent) {
  switch (intent) {
    case "calma": return "calma";
    case "enfoque": return "enfoque";
    case "energia": return "energía";
    case "reset": return "reset";
    case "recuperacion": return "recuperación";
    default: return intent || "sesión";
  }
}
