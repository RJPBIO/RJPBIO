"use client";
/* ═══════════════════════════════════════════════════════════════
   EVIDENCE CARD — scientific citations per protocol
   Every claim has a study; every effect has a number.
   ═══════════════════════════════════════════════════════════════ */

import { useState } from "react";
import Icon from "./Icon";
import { resolveTheme, withAlpha, font, brand } from "../lib/theme";
import { semantic } from "../lib/tokens";

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
            <div style={{ fontSize: 13, fontWeight: font.weight.bold, color: t1 }}>{evidence.title}</div>
            <div style={{ fontSize: 10, color, marginBlockStart: 2, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 }}>
              {LEVEL_LABEL[evidence.evidenceLevel]}
            </div>
          </div>
        </div>
        <Icon name={expanded ? "chevron-down" : "chevron"} size={14} color={t3} aria-hidden="true" />
      </button>

      {expanded && (
        <div id={`evid-${evidence.id}`} style={{ marginBlockStart: 14, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <p style={{ color: t3, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", marginBlockEnd: 6 }}>Mecanismo</p>
            <p style={{ color: t1, fontSize: 12, lineHeight: 1.6, margin: 0 }}>{evidence.mechanism}</p>
          </div>

          <div>
            <p style={{ color: t3, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", marginBlockEnd: 6 }}>
              Qué esperar
            </p>
            <p style={{ color: t1, fontSize: 12, lineHeight: 1.6, margin: 0 }}>{evidence.expect}</p>
          </div>

          <div>
            <p style={{ color: t3, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", marginBlockEnd: 6 }}>Limitación</p>
            <p style={{ color: t2, fontSize: 11, lineHeight: 1.6, fontStyle: "italic", margin: 0 }}>{evidence.limitation}</p>
          </div>

          <div>
            <p style={{ color: t3, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", marginBlockEnd: 8 }}>
              Estudios ({evidence.studies.length})
            </p>
            <ol style={{ listStyle: "decimal", paddingInlineStart: 18, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {evidence.studies.map((s, i) => (
                <li key={i} style={{ color: t1, fontSize: 11, lineHeight: 1.55 }}>
                  <div style={{ fontWeight: 700 }}>{s.authors} ({s.year})</div>
                  <div style={{ color: t2, marginBlockStart: 2 }}>{s.title}</div>
                  <div style={{ color: t3, fontStyle: "italic", marginBlockStart: 2 }}>
                    {s.journal}{s.n ? ` · N=${s.n}` : ""}
                  </div>
                  {s.effect && (
                    <div style={{ color: t1, marginBlockStart: 4, background: withAlpha(color, 8), padding: 8, borderRadius: 6, borderInlineStart: `2px solid ${color}` }}>
                      {s.effect}
                    </div>
                  )}
                  {s.doi && (
                    <div style={{ color: t3, fontSize: 10, marginBlockStart: 3, fontFamily: "monospace" }}>
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
