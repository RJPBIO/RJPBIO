"use client";
/* ═══════════════════════════════════════════════════════════════
   LifeJournalCard — diario autonómico de vida.
   ───────────────────────────────────────────────────────────────
   Break-pattern: una TIMELINE de momentos marcados con su huella
   fisiológica (no anillos, gauges ni curvas). Revela qué contextos
   coinciden con tus mejores/peores estados. Todo local.
   Modelo: lib/autonomicJournal. Acciones: store.logLifeEvent/removeLifeEvent.
   ═══════════════════════════════════════════════════════════════ */
import { useMemo, useState } from "react";
import { useStore } from "@/store/useStore";
import { buildAutonomicJournal } from "@/lib/autonomicJournal";
import { colors, typography, spacing } from "../tokens";
import MarkMomentSheet from "./MarkMomentSheet";

const CYAN = colors.accent.phosphorCyan;
const AMBER = (colors.semantic && colors.semantic.warning) || "#F59E0B";
const MINT = "#5EEAD4";

const eyebrow = {
  fontFamily: typography.familyMono,
  fontSize: typography.size.microCaps,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.55)",
  fontWeight: typography.weight.medium,
};

function relTime(ts, now) {
  const d = Math.floor((now - ts) / 86_400_000);
  if (d <= 0) return "hoy";
  if (d === 1) return "ayer";
  if (d < 7) return `hace ${d} días`;
  if (d < 30) return `hace ${Math.floor(d / 7)} sem`;
  return `hace ${Math.floor(d / 30)} mes`;
}

function footprintParts(z) {
  if (z == null) return null;
  if (z >= 0.5) return { color: MINT, word: "alto" };
  if (z <= -0.5) return { color: AMBER, word: "bajo" };
  return { color: CYAN, word: "en tu base" };
}

export default function LifeJournalCard({ lifeEvents, hrvLog }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const now = Date.now();
  const journal = useMemo(
    () => buildAutonomicJournal(lifeEvents || [], hrvLog || [], { now }),
    [lifeEvents, hrvLog, now]
  );

  const handleSave = (event) => {
    try { useStore.getState().logLifeEvent(event); } catch { /* noop */ }
    setSheetOpen(false);
  };
  const handleRemove = (id) => {
    try { useStore.getState().removeLifeEvent(id); } catch { /* noop */ }
  };

  const hasEvents = journal.entries.length > 0;

  return (
    <section
      data-v2-life-journal
      style={{
        paddingInline: spacing.s24,
        paddingBlockStart: spacing.s48,
        paddingBlockEnd: spacing.s48,
        borderBlockEnd: `0.5px solid ${colors.separator}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: spacing.s16, marginBlockEnd: spacing.s16 }}>
        <span style={eyebrow}>DIARIO AUTONÓMICO</span>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          style={{
            appearance: "none",
            cursor: "pointer",
            padding: "7px 14px",
            borderRadius: 999,
            background: "transparent",
            border: `0.5px solid ${CYAN}`,
            color: CYAN,
            fontFamily: typography.family,
            fontSize: typography.size.caption,
            fontWeight: typography.weight.medium,
          }}
        >
          Marcar momento
        </button>
      </div>

      {journal.insight && (
        <p
          style={{
            margin: 0,
            marginBlockEnd: spacing.s24,
            fontFamily: typography.family,
            fontSize: typography.size.subtitle,
            fontWeight: typography.weight.regular,
            color: colors.text.primary,
            letterSpacing: "-0.01em",
            lineHeight: 1.3,
            maxInlineSize: 520,
          }}
        >
          {journal.insight}
        </p>
      )}

      {!hasEvents ? (
        <p style={{ margin: 0, fontFamily: typography.family, fontSize: typography.size.body, color: colors.text.secondary, lineHeight: 1.5, maxInlineSize: 460 }}>
          Marca tu primer momento — una conversación, una decisión, una pérdida, un logro.
          Con el tiempo verás la huella fisiológica de tu vida.
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" }}>
          {journal.entries.slice(0, 12).map((e, i) => {
            const fp = footprintParts(e.autonomic?.z);
            return (
              <li
                key={e.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: spacing.s16,
                  paddingBlock: spacing.s16,
                  borderBlockStart: i === 0 ? "none" : `0.5px solid ${colors.separator}`,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: typography.family, fontSize: typography.size.body, fontWeight: typography.weight.medium, color: colors.text.primary }}>
                      {e.contextLabel || "Momento"}
                    </span>
                    <span style={{ fontFamily: typography.familyMono, fontSize: 10, letterSpacing: "0.06em", color: colors.text.muted }}>
                      {relTime(e.ts, now)}
                    </span>
                  </div>
                  {e.label && (
                    <div style={{ fontFamily: typography.family, fontSize: typography.size.caption, color: colors.text.secondary, marginBlockStart: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {e.label}
                    </div>
                  )}
                </div>

                {/* Huella */}
                {fp ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: "50%", background: fp.color, boxShadow: `0 0 6px ${fp.color}` }} />
                    <span style={{ fontFamily: typography.familyMono, fontSize: typography.size.caption, color: fp.color }}>{e.autonomic.rmssd} ms</span>
                    <span style={{ fontFamily: typography.family, fontSize: 11, color: colors.text.muted }}>{fp.word}</span>
                  </span>
                ) : (
                  <span style={{ fontFamily: typography.family, fontSize: 11, color: colors.text.muted, flexShrink: 0 }}>sin lectura</span>
                )}

                <button
                  type="button"
                  onClick={() => handleRemove(e.id)}
                  aria-label="Eliminar momento"
                  style={{ appearance: "none", cursor: "pointer", background: "transparent", border: "none", color: "rgba(255,255,255,0.28)", padding: 4, flexShrink: 0, display: "inline-flex" }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p style={{ margin: 0, marginBlockStart: spacing.s24, fontFamily: typography.family, fontSize: typography.size.caption, color: colors.text.muted, lineHeight: 1.5 }}>
        Asocia tu HRV más cercano a cada momento (todo local). Mide alrededor de momentos importantes para ver su huella.
      </p>

      {sheetOpen && <MarkMomentSheet onSave={handleSave} onClose={() => setSheetOpen(false)} />}
    </section>
  );
}
