"use client";
/* ═══════════════════════════════════════════════════════════════
   Phase 6I-3 — RecommendationAlternativesCard
   ───────────────────────────────────────────────────────────────
   Card colapsable que expone `recommendation.alternatives` (top-2
   protocolos scored después del primary) — closes finding H-3 del
   repo audit. Engine ya computa alts con reasons contextuales pero
   ningún caller del shell v2 los renderea.

   Pattern progressive disclosure: default colapsada con eyebrow muted
   "OTRAS OPCIONES (N)" + chevron cyan. Tap toggle expande el contenido
   max-height transition (cubic-bezier spring, alineado con sheet
   pattern Fix3 + Phase6I-1/2). Cada alt row tap dispatcha
   `onAction({action: "start-protocol", protocolId})`.

   Reuse pattern Premium-Fix4 M-1: caption italic muted bajo description
   para engine reason — visible solo cuando engine provee reason.
   `data-v2-skip-ghost` no aplica aquí (toggle es CTA semi-secondary,
   no skip). Touch targets ≥44px (Polish-2). prefers-reduced-motion
   respect via lib/a11y.useReducedMotion.

   Sin framer-motion — CSS transition + React useState (v2 shell pattern).
   ═══════════════════════════════════════════════════════════════ */
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  extractAlternatives,
  extractAlternativeProtocol,
  extractAlternativeReason,
} from "@/lib/recommendationExtract";
import { useReducedMotion } from "@/lib/a11y";
import {
  colors,
  typography,
  spacing,
  radii,
  motion as motionTok,
} from "../tokens";

export default function RecommendationAlternativesCard({
  recommendation,
  onAction,
  testid = "recommendation-alternatives",
}) {
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const alternatives = extractAlternatives(recommendation);

  // No renderea cuando no hay alternatives. Esto cubre múltiples casos:
  //   - recommendation null/undefined (fallback firstProtocolForIntent)
  //   - engine returned alternatives empty (cohort cold-start sin signals)
  //   - alternatives all invalid (filtered out por extractAlternatives)
  if (alternatives.length === 0) return null;

  return (
    <section
      data-v2-recommendation-alternatives
      data-testid={testid}
      data-expanded={expanded ? "true" : "false"}
      style={{
        marginBlockStart: spacing.s12,
        background: colors.bg.raised,
        border: `0.5px solid ${colors.separator}`,
        borderRadius: radii.panel,
        overflow: "hidden",
      }}
    >
      {/* Toggle header — eyebrow muted + chevron cyan */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        data-testid={`${testid}-toggle`}
        aria-expanded={expanded}
        aria-controls={`${testid}-content`}
        style={{
          appearance: "none",
          width: "100%",
          background: "transparent",
          border: "none",
          paddingBlock: spacing.s12,
          paddingInline: spacing.s16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          minHeight: 44,
          color: colors.text.muted,
          fontFamily: typography.familyMono,
          fontSize: typography.size.microCaps,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fontWeight: typography.weight.medium,
          transitionProperty: "color, background",
          transitionDuration: `${motionTok.duration.tap}ms`,
          transitionTimingFunction: motionTok.ease.out,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = colors.text.secondary; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = colors.text.muted; }}
      >
        <span>{`Otras opciones (${alternatives.length})`}</span>
        {expanded ? (
          <ChevronUp size={16} strokeWidth={1.6} color={colors.accent.phosphorCyan} aria-hidden="true" />
        ) : (
          <ChevronDown size={16} strokeWidth={1.6} color={colors.accent.phosphorCyan} aria-hidden="true" />
        )}
      </button>

      {/* Collapsible content — max-height transition */}
      <div
        id={`${testid}-content`}
        data-v2-alternatives-content
        style={{
          maxHeight: expanded ? "600px" : "0px",
          overflow: "hidden",
          transition: reduceMotion
            ? "none"
            : "max-height 320ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        <ol
          aria-label="Alternativas recomendadas"
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          {alternatives.map((alt, idx) => (
            <AlternativeRow
              key={`${idx}-${extractAlternativeProtocol(alt)?.id ?? idx}`}
              alt={alt}
              onAction={onAction}
              testid={`${testid}-alt-${idx}`}
              showSeparator={idx > 0}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}

function AlternativeRow({ alt, onAction, testid, showSeparator }) {
  const protocol = extractAlternativeProtocol(alt);
  const reason = extractAlternativeReason(alt);

  if (!protocol) return null;

  const handleClick = () => {
    onAction?.({
      action: "start-protocol",
      protocolId: protocol.id,
    });
  };

  // Duration label: e.g. "120s" o "2 min" — preferimos minutes formato si ≥60s.
  const durationSec = Number.isFinite(protocol.d) ? protocol.d : null;
  const minutes = durationSec ? Math.max(1, Math.round(durationSec / 60)) : null;
  const durationLabel = durationSec
    ? `${durationSec}s · ${minutes} min`
    : null;
  const intentLabel = typeof protocol.int === "string" ? protocol.int : null;

  return (
    <li
      data-v2-alternative-row
      style={{
        margin: 0,
        padding: 0,
      }}
    >
      <button
        type="button"
        onClick={handleClick}
        data-testid={testid}
        data-protocol-id={protocol.id}
        style={{
          appearance: "none",
          width: "100%",
          background: "transparent",
          border: "none",
          borderTop: showSeparator
            ? `0.5px solid ${colors.separator}`
            : "none",
          paddingBlock: spacing.s16,
          paddingInline: spacing.s16,
          textAlign: "start",
          cursor: "pointer",
          minHeight: 44,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          color: "inherit",
          transitionProperty: "background, transform",
          transitionDuration: `${motionTok.duration.tap}ms`,
          transitionTimingFunction: motionTok.ease.out,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        onPointerDown={(e) => { e.currentTarget.style.transform = `scale(${motionTok.tap.scale})`; }}
        onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        <span
          style={{
            fontFamily: typography.familyMono,
            fontSize: 9,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: colors.text.muted,
            fontWeight: typography.weight.medium,
          }}
        >
          Alternativa
        </span>
        <span
          style={{
            fontFamily: typography.family,
            fontSize: typography.size.body,
            fontWeight: typography.weight.medium,
            color: colors.text.strong,
            letterSpacing: "-0.005em",
            lineHeight: 1.2,
          }}
        >
          {protocol.n || "Protocolo"}
        </span>
        {(durationLabel || intentLabel) && (
          <span
            style={{
              fontFamily: typography.family,
              fontSize: typography.size.caption,
              fontWeight: typography.weight.regular,
              color: colors.text.secondary,
              lineHeight: 1.4,
            }}
          >
            {[durationLabel, intentLabel].filter(Boolean).join(" · ")}
          </span>
        )}
        {reason && (
          <span
            data-v2-alternative-reason
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
      </button>
    </li>
  );
}
