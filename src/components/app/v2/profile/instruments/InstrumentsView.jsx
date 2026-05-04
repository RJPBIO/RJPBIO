"use client";
import { useStore } from "@/store/useStore";
import SubRouteHeader from "../SubRouteHeader";
import { Section, Kicker, Card, StatLine, PillButton, ScrollPad } from "../primitives";
import { colors, typography, spacing, radii } from "../../tokens";
import { relativeTime } from "../fixtures";

// Phase 6B SP1 — fixtures → store real.
// Cada card lee la última entrada del log que matche su instrumentId.
// Empty state explícito cuando no hay mediciones — preferible mostrar
// "Sin mediciones" antes que un score falso (estrés=7 hardcoded engaña
// al usuario sobre su estado real).

const ITEMS = [
  {
    id: "pss-4",
    title: "PSS-4 · TEST DE ESTRÉS PERCIBIDO",
    citation: "Cohen 1983 · 4 ítems",
    action: "retake-pss4",
    max: 16,
    levelLabels: { low: "Estrés bajo", moderate: "Estrés moderado", high: "Estrés alto" },
  },
  {
    id: "wemwbs-7",
    title: "SWEMWBS-7 · BIENESTAR MENTAL",
    citation: "Stewart-Brown 2009 · 7 ítems",
    action: "retake-swemwbs",
    max: 35,
    levelLabels: { low: "Bienestar bajo", average: "Bienestar promedio", high: "Bienestar alto" },
  },
  {
    id: "phq-2",
    title: "PHQ-2 · SCREENING DEPRESIÓN",
    citation: "Kroenke 2003 · 2 ítems",
    action: "retake-phq2",
    max: 6,
    levelLabels: { positive: "Screening positivo", negative: "Screening negativo" },
  },
];

export default function InstrumentsView({ onBack, onNavigate }) {
  const instruments = useStore((s) => s.instruments || []);

  const lastOf = (id) => {
    let best = null;
    for (const e of instruments) {
      if (!e || e.instrumentId !== id || typeof e.ts !== "number") continue;
      if (!best || e.ts > best.ts) best = e;
    }
    return best;
  };

  return (
    <>
      <SubRouteHeader title="Instrumentos" onBack={onBack} />
      <ScrollPad>
        {ITEMS.map((it, idx) => {
          const last = lastOf(it.id);
          const isLast = idx === ITEMS.length - 1;
          return (
            <Section key={it.id} paddingBottom={isLast ? 48 : 32}>
              <Kicker>{it.title}</Kicker>
              {last ? (
                <Card>
                  <StatLine
                    value={`Score ${formatScore(last.score)}/${it.max} · ${labelFor(it, last)}`}
                    caption={`${it.citation} · última: ${relativeTime(last.ts)}`}
                  />
                  <PillButton onClick={() => onNavigate && onNavigate({ action: it.action })}>
                    Tomar de nuevo
                  </PillButton>
                </Card>
              ) : (
                <EmptyCard
                  message={`Sin mediciones ${it.title.split(" ·")[0]}`}
                  subMessage={`${it.citation}. Toma el test para registrar tu primera medición.`}
                  ctaLabel="Tomar test"
                  onCtaPress={() => onNavigate && onNavigate({ action: it.action })}
                />
              )}
            </Section>
          );
        })}
      </ScrollPad>
    </>
  );
}

function formatScore(score) {
  if (typeof score !== "number" || !Number.isFinite(score)) return "—";
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

function labelFor(item, entry) {
  const lvl = entry?.level;
  if (!lvl) return "—";
  return item.levelLabels[lvl] || lvl;
}

function EmptyCard({ message, subMessage, ctaLabel, onCtaPress }) {
  return (
    <article
      style={{
        background: "transparent",
        border: `0.5px dashed ${colors.separator}`,
        borderRadius: radii.panelLg,
        padding: spacing.s24 - 4,
        display: "flex",
        flexDirection: "column",
        gap: spacing.s16,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span
          style={{
            fontFamily: typography.family,
            fontSize: typography.size.body,
            fontWeight: typography.weight.medium,
            color: colors.text.secondary,
            letterSpacing: "-0.005em",
            lineHeight: 1.3,
          }}
        >
          {message}
        </span>
        <span
          style={{
            fontFamily: typography.family,
            fontSize: typography.size.caption,
            fontWeight: typography.weight.regular,
            color: colors.text.muted,
            lineHeight: 1.4,
          }}
        >
          {subMessage}
        </span>
      </div>
      <PillButton onClick={onCtaPress}>{ctaLabel}</PillButton>
    </article>
  );
}
