"use client";
/* ═══════════════════════════════════════════════════════════════
   EVIDENCE CARD — scientific citations per protocol
   Every claim has a study; every effect has a number.
   ═══════════════════════════════════════════════════════════════ */

import { useState } from "react";
import Icon from "./Icon";
import { resolveTheme, withAlpha, brand } from "../lib/theme";
import { semantic } from "../lib/tokens";

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

const LEVEL_COLOR = {
  high: brand.primary,
  moderate: semantic.info,
  limited: semantic.warning,
};
const LEVEL_LABEL = {
  high: "Evidencia alta",
  moderate: "Evidencia moderada",
  limited: "Evidencia limitada",
};

export default function EvidenceCard({ evidence, isDark, defaultExpanded = false }) {
  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!evidence) return null;

  const color = LEVEL_COLOR[evidence.evidenceLevel] || t3;

  return (
    <section
      aria-label={`Evidencia para ${evidence.title}`}
      style={{ background: cd, border: `1px solid ${bd}`, borderRadius: 14, padding: 14, marginBlockEnd: 14 }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={`evid-${evidence.id}`}
        style={{
          inlineSize: "100%",
          background: "transparent",
          border: "none",
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          color: t1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="fingerprint" size={14} color={color} aria-hidden="true" />
          <div style={{ textAlign: "start" }}>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.1, color: t1 }}>{evidence.title}</div>
            <div style={{ fontSize: 12, color, marginBlockStart: 2, letterSpacing: -0.05, fontWeight: 600 }}>
              {LEVEL_LABEL[evidence.evidenceLevel]}
            </div>
          </div>
        </div>
        <Icon name={expanded ? "chevron-down" : "chevron"} size={14} color={t3} aria-hidden="true" />
      </button>

      {expanded && (
        <div id={`evid-${evidence.id}`} style={{ marginBlockStart: 14, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <p style={{ color: t3, fontSize: 12, letterSpacing: -0.05, fontWeight: 600, margin: 0, marginBlockEnd: 6 }}>Mecanismo</p>
            <p style={{ color: t1, fontSize: 13, lineHeight: 1.6, letterSpacing: -0.05, margin: 0 }}>{evidence.mechanism}</p>
          </div>

          <div>
            <p style={{ color: t3, fontSize: 12, letterSpacing: -0.05, fontWeight: 600, margin: 0, marginBlockEnd: 6 }}>
              Qué esperar
            </p>
            <p style={{ color: t1, fontSize: 13, lineHeight: 1.6, letterSpacing: -0.05, margin: 0 }}>{evidence.expect}</p>
          </div>

          <div>
            <p style={{ color: t3, fontSize: 12, letterSpacing: -0.05, fontWeight: 600, margin: 0, marginBlockEnd: 6 }}>Limitación</p>
            <p style={{ color: t2, fontSize: 12, lineHeight: 1.6, letterSpacing: -0.05, fontStyle: "italic", margin: 0 }}>{evidence.limitation}</p>
          </div>

          <div>
            <p style={{ color: t3, fontSize: 12, letterSpacing: -0.05, fontWeight: 600, margin: 0, marginBlockEnd: 8 }}>
              Estudios <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace", fontVariantNumeric: "tabular-nums" }}>({evidence.studies.length})</span>
            </p>
            <ol style={{ listStyle: "decimal", paddingInlineStart: 18, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {evidence.studies.map((s, i) => (
                <li key={i} style={{ color: t1, fontSize: 12, lineHeight: 1.55, letterSpacing: -0.05 }}>
                  <div style={{ fontWeight: 700 }}>
                    {s.authors} <span style={{ fontFamily: MONO, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>({s.year})</span>
                  </div>
                  <div style={{ color: t2, marginBlockStart: 2 }}>{s.title}</div>
                  <div style={{ color: t3, fontStyle: "italic", marginBlockStart: 2 }}>
                    {s.journal}
                    {s.n ? (
                      <> · <span style={{ fontFamily: MONO, fontStyle: "normal", fontVariantNumeric: "tabular-nums" }}>N={s.n}</span></>
                    ) : null}
                  </div>
                  {s.effect && (
                    <div style={{ color: t1, marginBlockStart: 4, background: withAlpha(color, 8), padding: 8, borderRadius: 6, borderInlineStart: `2px solid ${color}` }}>
                      {s.effect}
                    </div>
                  )}
                  {s.doi && (
                    <div style={{ color: t3, fontSize: 11, marginBlockStart: 3, fontFamily: MONO, letterSpacing: -0.05 }}>
                      DOI: {s.doi}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </section>
  );
}
