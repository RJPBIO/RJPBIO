"use client";
/* ═══════════════════════════════════════════════════════════════
   EVIDENCE STRIP — dashboard credibility banner
   ═══════════════════════════════════════════════════════════════
   Banner compacto en la vista idle que transmite rigor clínico
   sin friccionar: "X protocolos respaldados por estudios · Y
   instrumentos clínicos · cumplimiento NOM-035 / GDPR".

   Tap expande a un modal/detalle con el stack completo.

   Se renderiza después del ReadinessScore (justo antes del
   ProgramBrowser o el protocol picker). Es decorativo/persuasivo,
   no bloqueante.

   Props:
     - isDark
     - onOpenEvidence  callback opcional para abrir /evidencia
   ═══════════════════════════════════════════════════════════════ */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "./Icon";
import { resolveTheme, withAlpha, space, brand } from "../lib/theme";
import { semantic } from "../lib/tokens";
import { useReducedMotion } from "../lib/a11y";
import { useT } from "../hooks/useT";
import { P as PROTOCOLS } from "../lib/protocols";
import { EVIDENCE, evidenceForProtocol } from "../lib/evidence";

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

// Instrumentos clínicos validados que usa el sistema (replica de
// CLINICAL_STACK en OrgDashboard). Los nombres son siglas estables
// (identificadores clínicos universales, no se traducen); la
// descripción larga se localiza.
const CLINICAL_INSTRUMENTS_LOC = [
  { name: "PSS-4", fullKey: "pss4Full", citeKey: "pss4Cite" },
  { name: "SWEMWBS", fullKey: "swemwbsFull", citeKey: "swemwbsCite" },
  { name: "PHQ-2", fullKey: "phq2Full", citeKey: "phq2Cite" },
  { name: "HRV RMSSD", fullKey: "hrvFull", citeKey: "hrvCite" },
  { name: "NOM-035", fullKey: "nomFull", citeKey: "nomCite" },
];

const COMPLIANCE_KEYS = ["lfpdppp", "gdpr", "kanon"];

// Diccionario local con fallback — las descripciones de instrumentos
// son bilingües y técnicas; las leemos con el mapping abajo.
const INSTRUMENT_FALLBACK = {
  es: {
    pss4Full: "Perceived Stress Scale",
    pss4Cite: "Cohen & Williamson 1988",
    swemwbsFull: "Short Warwick-Edinburgh Well-being Scale",
    swemwbsCite: "Stewart-Brown 2009",
    phq2Full: "Patient Health Questionnaire",
    phq2Cite: "Kroenke et al. 2003",
    hrvFull: "Heart Rate Variability",
    hrvCite: "Task Force 1996 · Shaffer 2017",
    nomFull: "Riesgo psicosocial (Guía II)",
    nomCite: "DOF México · 46 ítems",
  },
  en: {
    pss4Full: "Perceived Stress Scale",
    pss4Cite: "Cohen & Williamson 1988",
    swemwbsFull: "Short Warwick-Edinburgh Well-being Scale",
    swemwbsCite: "Stewart-Brown 2009",
    phq2Full: "Patient Health Questionnaire",
    phq2Cite: "Kroenke et al. 2003",
    hrvFull: "Heart Rate Variability",
    hrvCite: "Task Force 1996 · Shaffer 2017",
    nomFull: "Psychosocial risk (Guide II)",
    nomCite: "DOF Mexico · 46 items",
  },
};

export default function EvidenceStrip({ isDark, onOpenEvidence }) {
  const reduced = useReducedMotion();
  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  const { t, locale } = useT();
  const [expanded, setExpanded] = useState(false);
  const localInstr = INSTRUMENT_FALLBACK[locale] || INSTRUMENT_FALLBACK.en;

  // Cuenta de protocolos con evidencia high/moderate (los que muestran
  // badge). Usamos evidenceForProtocol (name-match) igual que EvidenceCard.
  const counts = useMemo(() => {
    let high = 0, moderate = 0, total = 0;
    PROTOCOLS.forEach((p) => {
      const ev = evidenceForProtocol(p);
      if (!ev) return;
      total++;
      if (ev.evidenceLevel === "high") high++;
      else if (ev.evidenceLevel === "moderate") moderate++;
    });
    // Total estudios = suma de studies[] por cada card único
    const seen = new Set();
    let totalStudies = 0;
    Object.values(EVIDENCE).forEach((card) => {
      if (seen.has(card.id)) return;
      seen.add(card.id);
      totalStudies += (card.studies || []).length;
    });
    return { high, moderate, total, totalStudies, instrumentCount: CLINICAL_INSTRUMENTS_LOC.length };
  }, []);

  return (
    <section
      aria-label="Respaldo clínico"
      style={{
        background: cd,
        border: `1px solid ${bd}`,
        borderRadius: 14,
        marginBlockEnd: space[4],
        overflow: "hidden",
      }}
    >
      {/* Header (clickable) */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls="evidence-strip-detail"
        style={{
          display: "flex",
          alignItems: "center",
          gap: space[3],
          width: "100%",
          padding: `${space[3]}px ${space[4]}px`,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            flexShrink: 0,
            inlineSize: 32,
            blockSize: 32,
            borderRadius: 10,
            background: withAlpha(brand.primary, 12),
            border: `1px solid ${withAlpha(brand.primary, 25)}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="fingerprint" size={14} color={brand.primary} />
        </div>
        <div style={{ flex: 1, minInlineSize: 0 }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: "0.14em",
              color: t3,
              fontWeight: 700,
              marginBlockEnd: 2,
            }}
          >
            {t("evidence.stripLabel")}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 13,
                fontWeight: 800,
                color: t1,
                letterSpacing: -0.3,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {counts.totalStudies}
            </span>
            <span style={{ fontSize: 12, color: t2 }}>
              {t("evidence.studiesWord")} · {counts.instrumentCount} {t("evidence.instrumentsWord")}
            </span>
          </div>
        </div>
        <Icon
          name={expanded ? "chevron-down" : "chevron"}
          size={14}
          color={t3}
          aria-hidden="true"
        />
      </button>

      {/* Detail (collapsible) */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id="evidence-strip-detail"
            initial={reduced ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduced ? { opacity: 0, height: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: reduced ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                padding: `0 ${space[4]}px ${space[4]}px`,
                borderTop: `1px solid ${bd}`,
              }}
            >
              {/* Protocolos con evidencia */}
              <div style={{ marginBlockStart: space[3] }}>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 9,
                    letterSpacing: "0.14em",
                    color: t3,
                    fontWeight: 700,
                    marginBlockEnd: 6,
                  }}
                >
                  {t("evidence.protocolsBackedLabel")}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <PillStat count={counts.high} label={t("evidence.tier.clinical")} color={brand.primary} />
                  <PillStat count={counts.moderate} label={t("evidence.tier.validated")} color={semantic.info} />
                </div>
              </div>

              {/* Instrumentos clínicos */}
              <div style={{ marginBlockStart: space[3] }}>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 9,
                    letterSpacing: "0.14em",
                    color: t3,
                    fontWeight: 700,
                    marginBlockEnd: 8,
                  }}
                >
                  {t("evidence.instrumentsLabel")}
                </div>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {CLINICAL_INSTRUMENTS_LOC.map((ins) => (
                    <li
                      key={ins.name}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "90px 1fr",
                        gap: 10,
                        fontSize: 11,
                        lineHeight: 1.45,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: MONO,
                          fontWeight: 800,
                          color: t1,
                          letterSpacing: "0.02em",
                        }}
                      >
                        {ins.name}
                      </span>
                      <span style={{ color: t2 }}>
                        {localInstr[ins.fullKey]} · <span style={{ color: t3 }}>{localInstr[ins.citeKey]}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Compliance */}
              <div style={{ marginBlockStart: space[3] }}>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 9,
                    letterSpacing: "0.14em",
                    color: t3,
                    fontWeight: 700,
                    marginBlockEnd: 8,
                  }}
                >
                  {t("evidence.complianceLabel")}
                </div>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  {COMPLIANCE_KEYS.map((key) => (
                    <li
                      key={key}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 6,
                        fontSize: 11,
                        color: t2,
                        lineHeight: 1.45,
                      }}
                    >
                      <Icon name="check" size={12} color={brand.primary} aria-hidden="true" />
                      <span>{t(`evidence.compliance.${key}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA a /evidencia */}
              {typeof onOpenEvidence === "function" && (
                <button
                  type="button"
                  onClick={onOpenEvidence}
                  style={{
                    marginBlockStart: space[3],
                    width: "100%",
                    padding: `${space[2]}px ${space[3]}px`,
                    background: "transparent",
                    border: `1px solid ${bd}`,
                    borderRadius: 10,
                    color: t2,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    letterSpacing: -0.05,
                  }}
                >
                  {t("evidence.viewAll")}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function PillStat({ count, label, color }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        color,
        background: withAlpha(color, 10),
        border: `1px solid ${withAlpha(color, 25)}`,
        paddingInline: 8,
        paddingBlock: 3,
        borderRadius: 999,
      }}
    >
      <span
        style={{
          fontFamily: MONO,
          fontWeight: 800,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {count}
      </span>
      <span style={{ fontWeight: 600 }}>{label}</span>
    </span>
  );
}
