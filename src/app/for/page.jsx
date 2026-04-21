/* ═══════════════════════════════════════════════════════════════
   /for — Vertical index. Catalogs the 8 B2B sector landings in
   one navigable page with a unified compliance rail. Reuses the
   cinematic DNA (IgnitionReveal, BioglyphLattice, PulseDivider)
   and existing .bi-roi- / .bi-legal- primitives. No new CSS.
   ═══════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font, bioSignal, radius } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";
import IgnitionReveal from "@/components/brand/IgnitionReveal";
import BioglyphLattice from "@/components/brand/BioglyphLattice";
import PulseDivider from "@/components/brand/PulseDivider";

export const metadata = {
  title: "Para qué sector · 8 verticales B2B",
  description:
    "BIO-IGNICIÓN para healthcare, manufacturing, finance, logistics, tech, aviation, energy y public sector. La fatiga fisiológica no distingue sector — el regulatorio sí.",
  alternates: { canonical: "/for" },
  openGraph: {
    title: "BIO-IGNICIÓN · 8 verticales B2B",
    description:
      "Healthcare · Manufacturing · Finance · Logistics · Tech · Aviation · Energy · Public Sector. Cada una con su compliance específico.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
};

const LAST_REVIEWED = "2026-04-20";

const kickerStyle = {
  fontFamily: cssVar.fontMono,
  fontSize: font.size.xs,
  color: bioSignal.phosphorCyan,
  textTransform: "uppercase",
  letterSpacing: "0.24em",
  fontWeight: font.weight.bold,
  marginBlockEnd: space[3],
};

const sectionHeading = {
  margin: 0,
  fontSize: "clamp(24px, 3vw, 34px)",
  letterSpacing: "-0.025em",
  lineHeight: 1.15,
  fontWeight: font.weight.black,
  color: cssVar.text,
};

const COPY = {
  es: {
    eyebrow: "PARA QUÉ SECTOR · 8 VERTICALES B2B ACTIVAS",
    title: "La fatiga fisiológica no distingue de sector. El regulatorio sí.",
    editorial:
      "HRV es el eslabón común — desde el quirófano hasta el panel-operator, desde el trading desk hasta la cabina de vuelo. Lo que cambia por sector es el regulatorio que enmarca la evidencia.",
    intro:
      "BIO-IGNICIÓN se adapta al compliance de cada sector sin rediseñar la plataforma. Mismo motor HRV, mismo protocolo de 3 min pre-shift — distintos exports, distinto dashboard, distinto marco legal. Elige tu sector para ver la tesis, los benchmarks y el piloto disponible.",
    metaCount: "8 verticales live",
    metaShift: "3 min pre-shift",
    metaPrim: "Zero new CSS · 100% primitives",
    metaLang: "ES / EN parity",

    cardsKicker: "CATÁLOGO · ELIGE TU SECTOR",
    cardsBody:
      "Cada tarjeta abre una página dedicada con benchmarks citados, peer comparison, compliance rail y cohorte piloto Q2 2026 específica.",
    cardCta: "Ver vertical →",

    railKicker: "MARCO REGULATORIO UNIVERSAL",
    railH: "Lo que soportamos en todas las verticales, de base.",
    railBody:
      "Controles transversales presentes en las 8 verticales. Los exports específicos por sector (API RP 755 evidence pack, NIST 800-53 mapping, DOT HOS report, FAA FRMS pack, etc.) se encuentran en cada vertical individual.",
    railSoc: "SOC 2 Type I · postura activa",
    railIso27001: "ISO 27001 · gap analysis documentado",
    railIso45001: "ISO 45001 · mapping occupational",
    railDpa: "DPA · GDPR Recital 26",
    railSso: "SSO · SAML 2.0 + SCIM",
    railSla: "99.9% SLA · monitored",
    railNom035: "NOM-035 STPS · México",
    railK5: "k-anonymity ≥ 5 · no individual surfacing",

    disclaimerH: "Nota legal · lectura en 30 s",
    disclaimer1:
      "Todas las cifras presentes en las verticales provienen de literatura pública revisada por pares, reportes oficiales (CSB, NTSB, OPM, GAO, OSHA, FAA, EASA, ICAO, CDC/NIOSH) y regulación — no son garantías. Los resultados reales dependen de implementación, contexto operativo y tasa de adherencia.",
    disclaimer2:
      "BIO-IGNICIÓN es una herramienta de bienestar operativo basada en HRV · NO es dispositivo médico, NO diagnostica, NO trata condiciones médicas, NO sustituye evaluación clínica ni fitness-for-duty formal. Complementario al EAP/FEAP de la organización.",
    disclaimer3:
      "Los sufijos 'grade' (clinical-grade, process-grade, flight-grade, mission-grade, infra-grade, fleet-grade) se refieren a la calidad de medición HRV y a la robustez operativa/auditable. NO implican autorización regulatoria como dispositivo médico ni ATO/certificaciones sectoriales específicas (FedRAMP ATO, ATEX/IECEx, DO-178C, etc.) salvo donde se declare expresamente en cada vertical.",
    disclaimer4:
      "Los términos 'X-aligned' y 'X-ready' significan que los exports y la postura están estructurados compatibles con el framework referido. NO implican endorsement del organismo emisor ni sustituyen la evaluación formal por 3PAO, auditor externo, competent authority o regulador aplicable.",

    closingKicker: "PRÓXIMO PASO",
    closingHLead: "No sabes cuál aplica primero.",
    closingHBody: "Agenda 45 min y lo mapeamos a tu operación real.",
    closingBody:
      "Muchas organizaciones cruzan dos o tres verticales (healthcare + public sector; logistics + energy; finance + tech). Llevamos los supuestos a tu mix real y te mostramos la cohorte piloto Q2 2026 que mejor encaja.",
    closingPrimary: "Agenda demo · cross-vertical",
    closingSecondary: "Ver ROI con tu operación",
    closingTertiary: "Trust Center · due diligence",
    closingAvail: "Página revisada",
    closingContact: "b2b@bio-ignicion.app",
  },
  en: {
    eyebrow: "FOR WHICH SECTOR · 8 LIVE B2B VERTICALS",
    title: "Physiological fatigue doesn't distinguish by sector. Regulation does.",
    editorial:
      "HRV is the common link — from the OR to the panel operator, from the trading desk to the flight deck. What changes per sector is the regulatory framing of the evidence.",
    intro:
      "BIO-IGNICIÓN adapts to each sector's compliance without redesigning the platform. Same HRV engine, same 3-min pre-shift protocol — different exports, different dashboard, different legal frame. Pick your sector for the thesis, benchmarks and available pilot.",
    metaCount: "8 verticals live",
    metaShift: "3 min pre-shift",
    metaPrim: "Zero new CSS · 100% primitives",
    metaLang: "ES / EN parity",

    cardsKicker: "CATALOG · PICK YOUR SECTOR",
    cardsBody:
      "Each card opens a dedicated page with cited benchmarks, peer comparison, compliance rail and sector-specific Q2 2026 pilot cohort.",
    cardCta: "Open vertical →",

    railKicker: "UNIVERSAL REGULATORY FRAME",
    railH: "What we support across all verticals, by default.",
    railBody:
      "Transversal controls present in the 8 verticals. Sector-specific exports (API RP 755 evidence pack, NIST 800-53 mapping, DOT HOS report, FAA FRMS pack, etc.) are available on each vertical page.",
    railSoc: "SOC 2 Type I · active posture",
    railIso27001: "ISO 27001 · documented gap analysis",
    railIso45001: "ISO 45001 · occupational mapping",
    railDpa: "DPA · GDPR Recital 26",
    railSso: "SSO · SAML 2.0 + SCIM",
    railSla: "99.9% SLA · monitored",
    railNom035: "NOM-035 STPS · Mexico",
    railK5: "k-anonymity ≥ 5 · no individual surfacing",

    disclaimerH: "Legal note · 30-sec read",
    disclaimer1:
      "All figures present across verticals come from peer-reviewed public literature, official reports (CSB, NTSB, OPM, GAO, OSHA, FAA, EASA, ICAO, CDC/NIOSH) and regulation — not guarantees. Actual results depend on implementation, operational context and adherence.",
    disclaimer2:
      "BIO-IGNICIÓN is an HRV-based operational wellbeing tool · it is NOT a medical device, does NOT diagnose, does NOT treat medical conditions, and does NOT replace clinical evaluation or formal fitness-for-duty. Complementary to the organization's EAP/FEAP only.",
    disclaimer3:
      "The 'grade' suffixes (clinical-grade, process-grade, flight-grade, mission-grade, infra-grade, fleet-grade) refer to HRV measurement quality and operational/auditable robustness. They do NOT imply regulatory medical-device clearance nor sector-specific ATO/certifications (FedRAMP ATO, ATEX/IECEx, DO-178C, etc.) except where explicitly declared in each vertical.",
    disclaimer4:
      "The terms 'X-aligned' and 'X-ready' mean exports and posture are structured compatible with the referenced framework. They do NOT imply endorsement by the issuing body nor replace the formal assessment by 3PAO, external auditor, competent authority or applicable regulator.",

    closingKicker: "NEXT STEP",
    closingHLead: "Not sure which applies first.",
    closingHBody: "Book 45 min and we map it to your real operation.",
    closingBody:
      "Many organizations cross two or three verticals (healthcare + public sector; logistics + energy; finance + tech). We bring the assumptions to your real mix and show which Q2 2026 pilot cohort fits best.",
    closingPrimary: "Book demo · cross-vertical",
    closingSecondary: "Run ROI with your op",
    closingTertiary: "Trust Center · due diligence",
    closingAvail: "Page reviewed",
    closingContact: "b2b@bio-ignicion.app",
  },
};

const VERTICALS_ES = [
  { slug: "for-healthcare",     sector: "HEALTHCARE",     title: "Para Salud",          thesis: "Fatiga clínica no es RRHH. Es patient safety.",                tags: ["HIPAA", "Joint Commission", "clinical-grade"] },
  { slug: "for-manufacturing",  sector: "MANUFACTURING",  title: "Para Manufactura",    thesis: "Fatiga del operador no es RRHH. Es occupational safety.",       tags: ["OSHA", "ANSI Z10", "ISO 45001"] },
  { slug: "for-finance",        sector: "FINANCE",        title: "Para Finanzas",       thesis: "Fatiga no es HR. Es operational risk y trading error.",          tags: ["SOC 2", "ISO 27001", "MAS · FCA"] },
  { slug: "for-logistics",      sector: "LOGISTICS",      title: "Para Logística",      thesis: "Fatiga del driver no es HR. Es seguridad vial y DOT.",           tags: ["DOT · FMCSA", "HOS", "NOM-087"] },
  { slug: "for-tech",           sector: "TECH · SRE",     title: "Para Tech",           thesis: "Fatiga de on-call no es cultura. Es SRE incident risk.",         tags: ["SOC 2", "ISO 27035", "NIST 800-61"] },
  { slug: "for-aviation",       sector: "AVIATION",       title: "Para Aviación",       thesis: "Fatiga de tripulación no es cultura. Es flight safety.",         tags: ["FAA Part 117", "EASA FTL", "ICAO FRMS"] },
  { slug: "for-energy",         sector: "ENERGY",         title: "Para Energía",        thesis: "Fatiga del operador no es HR. Es process safety y API 755.",    tags: ["API RP 755", "OSHA PSM", "Seveso III"] },
  { slug: "for-public-sector",  sector: "PUBLIC SECTOR",  title: "Para Sector Público", thesis: "Fatiga del servidor no es retórica. Es mission-critical risk.",  tags: ["NIST 800-53", "FedRAMP moderate-ready", "NFPA 1582"] },
];

const VERTICALS_EN = [
  { slug: "for-healthcare",     sector: "HEALTHCARE",     title: "For Healthcare",      thesis: "Clinician fatigue isn't HR. It's patient safety.",              tags: ["HIPAA", "Joint Commission", "clinical-grade"] },
  { slug: "for-manufacturing",  sector: "MANUFACTURING",  title: "For Manufacturing",   thesis: "Operator fatigue isn't HR. It's occupational safety.",          tags: ["OSHA", "ANSI Z10", "ISO 45001"] },
  { slug: "for-finance",        sector: "FINANCE",        title: "For Finance",         thesis: "Fatigue isn't HR. It's operational and trading risk.",           tags: ["SOC 2", "ISO 27001", "MAS · FCA"] },
  { slug: "for-logistics",      sector: "LOGISTICS",      title: "For Logistics",       thesis: "Driver fatigue isn't HR. It's road safety and DOT.",             tags: ["DOT · FMCSA", "HOS", "NOM-087"] },
  { slug: "for-tech",           sector: "TECH · SRE",     title: "For Tech",            thesis: "On-call fatigue isn't culture. It's SRE incident risk.",         tags: ["SOC 2", "ISO 27035", "NIST 800-61"] },
  { slug: "for-aviation",       sector: "AVIATION",       title: "For Aviation",        thesis: "Crew fatigue isn't culture. It's flight safety.",                tags: ["FAA Part 117", "EASA FTL", "ICAO FRMS"] },
  { slug: "for-energy",         sector: "ENERGY",         title: "For Energy",          thesis: "Operator fatigue isn't HR. It's process safety and API 755.",   tags: ["API RP 755", "OSHA PSM", "Seveso III"] },
  { slug: "for-public-sector",  sector: "PUBLIC SECTOR",  title: "For Public Sector",   thesis: "Public-servant fatigue isn't rhetoric. It's mission-critical.",  tags: ["NIST 800-53", "FedRAMP moderate-ready", "NFPA 1582"] },
];

const cardStyle = {
  display: "block",
  position: "relative",
  padding: `${space[5]}px ${space[5]}px ${space[4]}px`,
  background: `color-mix(in oklab, ${cssVar.surface} 85%, transparent)`,
  border: `1px solid ${cssVar.border}`,
  borderRadius: radius.lg,
  textDecoration: "none",
  color: "inherit",
  transition: "border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
};

export default async function ForIndexPage() {
  const locale = await getServerLocale();
  const L = locale === "en" ? "en" : "es";
  const c = COPY[L];
  const en = L === "en";
  const VERTICALS = en ? VERTICALS_EN : VERTICALS_ES;

  const reviewedFmt = new Date(LAST_REVIEWED).toLocaleDateString(en ? "en-US" : "es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <PublicShell activePath="/for">
      {/* ═══ Hero ═══ */}
      <Container size="lg" className="bi-prose">
        <header className="bi-roi-hero">
          <div aria-hidden className="bi-roi-hero-lattice">
            <BioglyphLattice variant="ambient" />
          </div>
          <span aria-hidden className="bi-roi-hero-aura" />
          <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            <IgnitionReveal sparkOrigin="50% 30%">
              <div style={kickerStyle}>{c.eyebrow}</div>
              <h1
                style={{
                  margin: `${space[3]}px 0 ${space[4]}px`,
                  fontSize: "clamp(34px, 5vw, 60px)",
                  letterSpacing: "-0.035em",
                  lineHeight: 1.04,
                  maxWidth: "22ch",
                  marginInline: "auto",
                }}
              >
                {c.title}
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-editorial), 'Instrument Serif', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: "clamp(18px, 2vw, 24px)",
                  lineHeight: 1.35,
                  color: cssVar.textMuted,
                  maxWidth: "52ch",
                  margin: `0 auto ${space[4]}px`,
                  textAlign: "center",
                }}
              >
                {c.editorial}
              </p>
              <p style={{ color: cssVar.textDim, maxWidth: "62ch", margin: "0 auto", textAlign: "center" }}>
                {c.intro}
              </p>
              <ul className="bi-roi-meta" aria-label="for-index-meta">
                <li><span className="dot" aria-hidden /> {c.metaCount}</li>
                <li><span className="dot" aria-hidden /> {c.metaShift}</li>
                <li><span className="dot" aria-hidden /> {c.metaPrim}</li>
                <li><span className="dot" aria-hidden /> {c.metaLang}</li>
              </ul>
            </IgnitionReveal>
          </div>
        </header>
      </Container>

      <PulseDivider intensity="dim" />

      {/* ═══ Vertical cards grid ═══ */}
      <section aria-labelledby="cards-heading" style={{ marginBlockStart: space[6] }}>
        <Container size="xl">
          <div style={{ ...kickerStyle, textAlign: "center", marginBlockEnd: space[3] }}>
            {c.cardsKicker}
          </div>
          <h2 id="cards-heading" style={{ ...sectionHeading, textAlign: "center", marginBlockEnd: space[3] }}>
            {c.title}
          </h2>
          <p style={{
            color: cssVar.textDim, maxWidth: "62ch",
            margin: `0 auto ${space[6]}px`, textAlign: "center",
          }}>
            {c.cardsBody}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: space[4],
            }}
          >
            {VERTICALS.map((v) => (
              <Link key={v.slug} href={`/${v.slug}`} style={cardStyle} aria-label={`${v.title} — ${v.thesis}`}>
                <div
                  style={{
                    fontFamily: cssVar.fontMono,
                    fontSize: font.size.xs,
                    color: bioSignal.phosphorCyan,
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    fontWeight: font.weight.bold,
                    marginBlockEnd: space[2],
                  }}
                >
                  {v.sector}
                </div>
                <h3
                  style={{
                    margin: `0 0 ${space[2]}px`,
                    fontSize: "clamp(18px, 2vw, 22px)",
                    lineHeight: 1.2,
                    fontWeight: font.weight.black,
                    color: cssVar.text,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {v.title}
                </h3>
                <p
                  style={{
                    margin: `0 0 ${space[4]}px`,
                    color: cssVar.textDim,
                    fontSize: font.size.md,
                    lineHeight: 1.45,
                  }}
                >
                  {v.thesis}
                </p>
                <ul
                  aria-label={`${v.sector} compliance`}
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: `0 0 ${space[4]}px`,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: space[2],
                  }}
                >
                  {v.tags.map((tag) => (
                    <li
                      key={tag}
                      style={{
                        padding: "4px 10px",
                        borderRadius: radius.full,
                        border: `1px solid ${cssVar.border}`,
                        background: cssVar.surface2,
                        color: cssVar.textMuted,
                        fontFamily: cssVar.fontMono,
                        fontSize: font.size.xs,
                        fontWeight: font.weight.medium,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
                <span
                  style={{
                    color: bioSignal.phosphorCyan,
                    fontFamily: cssVar.fontMono,
                    fontSize: font.size.sm,
                    fontWeight: font.weight.bold,
                    letterSpacing: "0.06em",
                  }}
                >
                  {c.cardCta}
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      <Container size="lg" className="bi-prose">
        {/* ═══ Universal compliance rail ═══ */}
        <section aria-labelledby="rail-heading" className="bi-roi-ent">
          <div style={kickerStyle}>{c.railKicker}</div>
          <h2 id="rail-heading" style={sectionHeading}>{c.railH}</h2>
          <p style={{ marginBlockStart: space[3], color: cssVar.textDim, maxWidth: "66ch" }}>
            {c.railBody}
          </p>
          <ul className="bi-roi-ent-grid" aria-label={c.railKicker}>
            <li className="bi-roi-ent-chip">{c.railSoc}</li>
            <li className="bi-roi-ent-chip">{c.railIso27001}</li>
            <li className="bi-roi-ent-chip">{c.railIso45001}</li>
            <li className="bi-roi-ent-chip">{c.railDpa}</li>
            <li className="bi-roi-ent-chip">{c.railSso}</li>
            <li className="bi-roi-ent-chip">{c.railSla}</li>
            <li className="bi-roi-ent-chip">{c.railNom035}</li>
            <li className="bi-roi-ent-chip">{c.railK5}</li>
          </ul>
        </section>

        {/* ═══ Disclaimer (collapsible) ═══ */}
        <details className="bi-roi-disclaimer">
          <summary>
            <span className="bi-roi-disclaimer-kicker">DISCLAIMER · 30 s</span>
            <span className="bi-roi-disclaimer-h">{c.disclaimerH}</span>
          </summary>
          <ol>
            <li>{c.disclaimer1}</li>
            <li>{c.disclaimer2}</li>
            <li>{c.disclaimer3}</li>
            <li>{c.disclaimer4}</li>
          </ol>
        </details>
      </Container>

      <PulseDivider intensity="dim" />

      {/* ═══ Closing CTA (shared pattern) ═══ */}
      <section aria-labelledby="for-closing" className="bi-demo-closing-section">
        <Container size="lg" style={{ paddingBlock: `clamp(48px, 7vw, 96px)` }}>
          <IgnitionReveal sparkOrigin="50% 20%">
            <div className="bi-demo-closing">
              <div aria-hidden className="bi-demo-closing-lattice">
                <BioglyphLattice variant="ambient" />
              </div>
              <span aria-hidden className="bi-demo-closing-aura" />
              <span aria-hidden className="bi-demo-closing-aura bi-demo-closing-aura--spark" />

              <div className="bi-demo-closing-mark" aria-hidden>
                <span className="bi-demo-closing-mark-core" />
                <span className="bi-demo-closing-mark-ring" />
              </div>

              <div style={{ ...kickerStyle, marginBottom: space[4] }}>{c.closingKicker}</div>

              <h2 id="for-closing" className="bi-demo-closing-h">
                <span className="bi-demo-closing-h-lead">{c.closingHLead}</span>{" "}
                <span className="bi-demo-closing-h-body">{c.closingHBody}</span>
              </h2>

              <p className="bi-demo-closing-body">{c.closingBody}</p>

              <div className="bi-demo-closing-actions">
                <Link href="/demo" className="bi-demo-closing-primary">
                  <span className="bi-demo-closing-primary-label">{c.closingPrimary}</span>
                  <span aria-hidden className="bi-demo-closing-primary-sep" />
                  <svg aria-hidden width="15" height="15" viewBox="0 0 15 15" className="bi-demo-closing-primary-arrow">
                    <path d="M3 7.5h9M8.5 3.5l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </Link>
                <Link href="/roi-calculator" className="bi-demo-closing-ghost">
                  <svg aria-hidden width="13" height="13" viewBox="0 0 13 13">
                    <path d="M2 2h9v9H2zM4.5 5h4M4.5 7h4M4.5 9h2.5" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>{c.closingSecondary}</span>
                </Link>
                <Link href="/trust" className="bi-demo-closing-ghost">
                  <svg aria-hidden width="13" height="13" viewBox="0 0 13 13">
                    <path d="M6.5 1.5L11 3.5v4c0 2.5-2 4.5-4.5 5C4 12 2 10 2 7.5v-4L6.5 1.5z" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round" />
                  </svg>
                  <span>{c.closingTertiary}</span>
                </Link>
              </div>

              <div className="bi-demo-closing-meta">
                <div className="bi-demo-closing-avail">
                  <span aria-hidden className="bi-demo-closing-avail-pulse">
                    <span className="bi-demo-closing-avail-dot" />
                  </span>
                  <span className="bi-demo-closing-avail-label">{c.closingAvail}</span>
                  <span className="bi-demo-closing-avail-meta">
                    <time dateTime={LAST_REVIEWED}>{reviewedFmt}</time>
                  </span>
                </div>
                <div className="bi-demo-closing-sig">
                  <a href={`mailto:${c.closingContact}`} className="bi-demo-closing-sig-link">
                    {c.closingContact}
                  </a>
                </div>
              </div>
            </div>
          </IgnitionReveal>
        </Container>
      </section>
    </PublicShell>
  );
}
