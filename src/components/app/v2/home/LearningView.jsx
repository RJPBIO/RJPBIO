"use client";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/store/useStore";
import { useReadiness } from "@/hooks/useReadiness";
import { useAdaptiveRecommendation } from "@/hooks/useAdaptiveRecommendation";
import { useActiveProgram } from "@/hooks/useActiveProgram";
import { P as PROTOCOLS } from "@/lib/protocols";
import { firstProtocolForIntent, DEFAULT_FIRST_PROTOCOL_ID } from "@/lib/first-protocol";
import {
  extractPrimaryProtocol,
  extractPrimaryReason,
  isEngineRecommendation,
} from "@/lib/recommendationExtract";
import { NEURAL_CONFIG } from "@/lib/neural/config";
import { csrfFetch } from "@/components/app/v2/profile/modals/ModalShell";
import ProgramActiveCard from "../program/ProgramActiveCard";
import ProgramReEvalPrompt from "../program/ProgramReEvalPrompt";
import ProgressBar from "./ProgressBar";
// Phase 6I-3 — alternatives card (H-3): expone recommendation.alternatives
// del engine bajo el primary recommendation card cuando recoFromEngine=true.
import RecommendationAlternativesCard from "./RecommendationAlternativesCard";
import RecommendationTransitionWrapper from "./RecommendationTransitionWrapper";
import { colors, typography, spacing, radii, surfaces, motion as motionTok } from "../tokens";

// Phase 6F SP-B — Decision A locked: cuando hay programa activo (server),
// LearningView reemplaza la sección "TU PRÓXIMA SESIÓN" (engine recommendation)
// con ProgramActiveCard. El programa es commitment explícito; el engine
// recommendation diluiría la disciplina del arco. Si user quiere flexibilidad,
// abandona el programa.
//
// Phase 6F SP-B — Decision C locked para re-eval: banner suave en day reEvalAt
// (manejado dentro de ProgramActiveCard); auto-modal interruptivo si pasaron
// ≥3 días desde reEvalAt sin completar (manejado en useEffect abajo).
const REEVAL_AUTO_MODAL_DAYS_OVERDUE = 3;
// Cota superior: si la re-eval está MUY vencida (usuario volvió tras un hueco
// largo), el programa está efectivamente abandonado — no emboscar con el modal
// al abrir la app. Por encima de esto se ofrece de forma pasiva, no automática.
const REEVAL_AUTO_MODAL_MAX_OVERDUE = 21;

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

export default function LearningView({
  greeting,
  subtitle,
  onAction,
  onNavigate,
  // Phase 6J-5 — currentMood prop desde HomeV2 (donde MoodPrePicker vive).
  // Cierra finding emergente del live validation (Motor 98% report CP3):
  // pre-Phase 6J-5 LearningView llamaba useAdaptiveRecommendation sin
  // currentMood → mood pre-picker NO afectaba recommendation en cohort
  // learning (5-13 sesiones). Default null preserva back-compat con
  // tests existentes que no pasan el prop.
  currentMood = null,
}) {
  // Selectores granulares.
  const history = useStore((s) => s.history);
  const streak = useStore((s) => s.streak);
  const coherencia = useStore((s) => s.coherencia);
  const firstIntent = useStore((s) => s.firstIntent);
  const store = useStore();

  const totalSessions = Array.isArray(history) ? history.length : 0;
  // Phase 6F bug-fix runtime — threshold para "personalized" branch
  // alineado con NEURAL_CONFIG.health.learningSessions (14, antes 20).
  // El motor interno declara "personalized" con hist.length >= 14
  // (neural.js:1012) — el UI ahora coincide. Si el config cambia, este
  // valor debe leerse de ahí en lugar de hardcodearlo.
  const PERSONALIZED_THRESHOLD = NEURAL_CONFIG.health.learningSessions;
  const sessionsToPersonalized = Math.max(0, PERSONALIZED_THRESHOLD - totalSessions);

  // Engine puede retornar null si k<minSamples (cold-start del propio
  // engine, no del UI). Fallback al protocolo del firstIntent del user
  // PERO con diversidad contra los últimos 3 protocols — sin esto
  // siempre recomienda el mismo per-intent cuando bandit está vacío.
  // Phase 6J-5 — currentMood propagado para activar engine moodIsExplicit
  // branch (override primaryNeed según mood declarado en pre-picker).
  const readiness = useReadiness(store);
  const recommendation = useAdaptiveRecommendation(store, { readiness, currentMood });
  const recoProtocol = useMemo(() => {
    // Phase 6H Fix-A1 — extraction defensive via helper centralizado.
    // ANTES (Phase 6F): `fromEngine?.id != null` siempre falso porque shape
    // real engine es `primary.protocol.id`, NO `primary.id` flat. Resultado:
    // siempre caía a la rotación intent-pool fallback, perdiendo engine
    // recommendations personalizadas. AHORA: helper retorna engine Protocol
    // cuando shape válido, fallback rotation preservado en branch else.
    const protoFromEngine = extractPrimaryProtocol(recommendation);
    if (protoFromEngine) {
      return PROTOCOLS.find((p) => p.id === protoFromEngine.id) || protoFromEngine;
    }
    // Engine sin reco útil → rotar protocolos del firstIntent evitando last-3.
    // Bug raíz histórico (pre-Fix-A1): antes retornaba `firstProtocolForIntent(firstIntent)`
    // que es FIJO per-intent → user veía siempre Reinicio Parasimpático para
    // calma, siempre Pulse Shift para energia, etc.
    const last3Names = Array.isArray(history) ? history.slice(-3).map((h) => h.p) : [];
    const intentPool = PROTOCOLS.filter((p) => p.int === firstIntent && !last3Names.includes(p.n));
    return intentPool[0] || firstProtocolForIntent(firstIntent);
  }, [recommendation, firstIntent, history]);
  // Phase 6H Fix-A1 — recoSource correcto via helper. Engine real shape es
  // `primary.protocol`; legacy/mock con `primary.id` flat retorna false aquí
  // (correctamente — no es engine recommendation).
  const recoFromEngine = isEngineRecommendation(recommendation);

  // Phase 6F SP-B — programa activo (server source of truth) + handlers.
  const { data: activeProgram, refetch: refetchProgram } = useActiveProgram();
  const [reEvalModalOpen, setReEvalModalOpen] = useState(false);

  // Decision C: auto-modal si reEval está overdue ≥3 días sin completar.
  // reEval.daysUntil es ≥0 (server-clamped); para "overdue" usamos el delta
  // entre now y reEvalAt manualmente.
  useEffect(() => {
    if (!activeProgram?.reEvalAt) return;
    if (activeProgram.reEvalCompletedAt) return;
    if (!activeProgram.reEval?.isDue) return;
    const reEvalAtMs = new Date(activeProgram.reEvalAt).getTime();
    if (!Number.isFinite(reEvalAtMs)) return;
    const daysOverdue = Math.floor((Date.now() - reEvalAtMs) / 86400_000);
    // Solo auto-abrir en la ventana [3, 21] días. Más allá = regreso tras hueco
    // largo → no emboscar; el programa se maneja pasivamente / se puede abandonar.
    if (daysOverdue >= REEVAL_AUTO_MODAL_DAYS_OVERDUE && daysOverdue <= REEVAL_AUTO_MODAL_MAX_OVERDUE) {
      setReEvalModalOpen(true);
    }
  }, [activeProgram]);

  const handleProgramAction = async (item) => {
    if (!item || typeof item !== "object") return;
    if (item.action === "open-reeval-prompt") {
      setReEvalModalOpen(true);
      return;
    }
    if (item.action === "abandon-program") {
      const ok = typeof window !== "undefined"
        ? window.confirm("¿Abandonar el programa actual? Tu progreso se archiva.")
        : true;
      if (!ok) return;
      try {
        const res = await csrfFetch("/api/v1/me/program/abandon", { method: "POST" });
        if (res.ok) refetchProgram();
      } catch {
        // best-effort; refetch para reconciliar estado real
        refetchProgram();
      }
      return;
    }
    // Navigation targets (e.g. /app/program/timeline) → forward al parent.
    if (item.target) {
      onNavigate?.(item);
      return;
    }
    // start-protocol y demás → forward al parent (HomeV2 → AppV2Root)
    onAction?.(item);
  };

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
          Sesión {totalSessions} de {PERSONALIZED_THRESHOLD} hasta tu trayectoria personalizada
        </h2>
        <ProgressBar value={totalSessions} max={PERSONALIZED_THRESHOLD} />
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
          {sessionsToPersonalized > 0
            ? `${sessionsToPersonalized} ${sessionsToPersonalized === 1 ? "sesión" : "sesiones"} más para tu trayectoria personalizada.`
            : "Tu próxima sesión cierra tu calibración. Pronto verás tu trayectoria completa."}
        </p>
      </section>

      <section
        data-v2-learning-recommendation
        aria-label={activeProgram ? "Tu programa activo" : "Tu próxima sesión"}
        style={{
          paddingInline: spacing.s24,
          paddingBlockEnd: spacing.s32,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {activeProgram ? (
          <ProgramActiveCard
            activeProgram={activeProgram}
            onAction={handleProgramAction}
          />
        ) : (
          <>
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
            <RecommendationTransitionWrapper
              transitionKey={recoProtocol?.id ?? "fallback"}
              testid="learning-recommendation-transition"
            >
              <RecommendationCard
                protocol={recoProtocol}
                source={recoFromEngine ? "engine" : "fallback"}
                reason={recoFromEngine ? extractPrimaryReason(recommendation) : null}
                onStart={() => {
                  const protocolId = recoProtocol?.id ?? DEFAULT_FIRST_PROTOCOL_ID;
                  onAction?.({ action: "start-protocol", protocolId });
                }}
              />
            </RecommendationTransitionWrapper>
            {/* Phase 6I-3 — alternatives card (H-3). Solo cuando recoFromEngine
                (engine real produjo recommendation con shape primary.protocol).
                En fallback path (firstProtocolForIntent rotation), el shape NO
                tiene `alternatives` válidas — extractAlternatives retorna [] y
                el component se auto-oculta defensive. Aceptamos `recommendation`
                completo para que el helper pueda leer `alternatives`. */}
            {recoFromEngine && (
              <RecommendationAlternativesCard
                recommendation={recommendation}
                onAction={onAction}
                testid="learning-recommendation-alternatives"
              />
            )}
          </>
        )}
      </section>

      {reEvalModalOpen && activeProgram && (
        <ProgramReEvalPrompt
          activeProgram={activeProgram}
          onClose={() => setReEvalModalOpen(false)}
          onComplete={() => {
            // Refetch para que reEvalCompletedAt persista en el state hook.
            refetchProgram();
          }}
        />
      )}

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

// Phase 6H Premium-Fix2 — ProgressBar extraído a ./ProgressBar.jsx para
// reuse en ColdStartView phase=active. La definición inline original vivía
// aquí con animation scaleX GPU 60fps (Phase 6H Polish-2). Selector
// `data-v2-learning-progressbar` + role=progressbar + aria preservados en
// el componente compartido.

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

// Phase 6H Premium-Fix4 M-1 — `reason` opcional. Engine adaptive devuelve
// recommendation.primary.reason con copy contextual ("Tu historial muestra
// +1.2 puntos con este protocolo", "Readiness elevado: ventana óptima").
// LearningView solo lo pasa cuando recoFromEngine === true (no en fallback
// firstProtocolForIntent), evitando reasons inválidas.
function RecommendationCard({ protocol, source, reason = null, onStart }) {
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
        {reason && (
          <span
            data-v2-recommendation-reason
            style={{
              marginBlockStart: 4,
              fontFamily: typography.family,
              fontSize: typography.size.caption,
              fontStyle: "italic",
              fontWeight: typography.weight.regular,
              color: colors.text.muted,
              lineHeight: 1.45,
            }}
          >
            {reason}
          </span>
        )}
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
