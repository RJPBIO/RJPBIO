/* ═══════════════════════════════════════════════════════════════
   /evidencia — Biblioteca pública de evidencia científica.

   Server-component: lista todos los estudios citados en el registro
   local (`lib/evidence.js`) con autor, año, revista, N y tamaño de
   efecto cuando están disponibles. Ningún claim sin cita.

   Esta ruta existe para ser linkeable (desde dentro de la app, pero
   también desde mercadotecnia y el footer público). Un profesional
   debe poder auditar la ciencia sin crear cuenta.
   ═══════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font, bioSignal } from "@/components/ui/tokens";
import { EVIDENCE, EVIDENCE_LAST_REVIEWED } from "../../lib/evidence";
import { getServerLocale } from "@/lib/locale-server";
import IgnitionReveal from "@/components/brand/IgnitionReveal";
import BioglyphLattice from "@/components/brand/BioglyphLattice";
import PulseDivider from "@/components/brand/PulseDivider";

export const metadata = {
  title: "Evidencia científica · BIO-IGNICIÓN",
  description:
    "Estudios revisados por pares detrás de cada protocolo. Efectos reportados, tamaños de muestra y DOIs — sin claims sin cita.",
  alternates: { canonical: "/evidencia" },
  openGraph: {
    title: "BIO-IGNICIÓN · Evidencia",
    description: "Estudios revisados por pares detrás de cada protocolo.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
};

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
  fontSize: "clamp(28px, 3.6vw, 42px)",
  letterSpacing: "-0.025em",
  lineHeight: 1.1,
  fontWeight: font.weight.black,
  color: cssVar.text,
};

const COPY = {
  es: {
    eyebrow: "BIBLIOTECA DE EVIDENCIA",
    title: "Citadas, no declamadas.",
    editorial: "Cada afirmación con autoría, año, revista, N y efecto reportado.",
    intro:
      "Cada protocolo parte de literatura revisada por pares. Esta biblioteca expone mecanismo, muestra, efecto reportado y DOI por estudio. Clasificamos con prudencia: degradamos cuando la evidencia no sostiene lo que una app suele prometer.",

    statProtocols: "Protocolos",
    statProtocolsSub: (h, m, l) => `${h} alta · ${m} moderada · ${l} limitada`,
    statStudies: "Estudios revisados por pares",
    statStudiesSub: "de revistas indexadas",
    statDois: "DOIs verificables",
    statDoisSub: "un clic desde cada cita",
    statRange: "Rango temporal",
    statRangeMeta: (min, max) => `${min} – ${max}`,
    statRangeSub: "años de publicación cubiertos",

    methodKicker: "CÓMO CLASIFICAMOS",
    methodH: "Tres niveles. Con criterios públicos.",
    methodBody:
      "Esquema inspirado en GRADE, adaptado al dominio de intervenciones fisiológicas no farmacológicas. Esta biblioteca informa decisiones; no sustituye juicio clínico ni consulta profesional.",
    methodLevels: [
      {
        key: "high",
        label: "Evidencia alta",
        rule: "Meta-análisis o múltiples ensayos controlados aleatorizados con efecto consistente y bajo riesgo de sesgo.",
      },
      {
        key: "moderate",
        label: "Evidencia moderada",
        rule: "Uno o más ensayos de buena calidad; efecto replicado pero con heterogeneidad o muestras pequeñas.",
      },
      {
        key: "limited",
        label: "Evidencia limitada",
        rule: "Estudios piloto, observacionales o evidencia indirecta. Marcados para re-evaluación al aparecer nuevos datos.",
      },
    ],
    methodNote:
      "Cuando surge evidencia contraria de mayor calidad, degradamos el nivel públicamente. El historial completo queda versionado en el repositorio.",

    toc: "Protocolos",
    levelHigh: "Evidencia alta",
    levelModerate: "Evidencia moderada",
    levelLimited: "Evidencia limitada",
    mechanism: "Mecanismo",
    expect: "Qué esperar",
    limitation: "Limitación",
    studies: (n) => `Estudios (${n})`,
    permalink: "Enlace permanente",
    cardMeta: (nStudies, yMin, yMax) =>
      `${nStudies} ${nStudies === 1 ? "estudio" : "estudios"} · ${yMin === yMax ? yMin : `${yMin}–${yMax}`}`,

    closingKicker: "SIGUIENTE PASO",
    closingHLead: "Ya revisaste la evidencia.",
    closingHBody: "Ahora mira el producto.",
    closingBody:
      "30 minutos en vivo para ver cómo estos estudios se traducen en protocolos medibles. Sin slides, sin adornos.",
    closingPrimary: "Agenda demo",
    closingSecondary: "Planes y precios",
    closingTertiary: "Arquitectura y DPA",

    footerReviewed: "Última revisión del registro",
    footerReviewedNote: "Fecha de la última curaduría; el historial completo vive versionado en el repositorio.",
    footerOpen: "Registro abierto",
    footerOpenNote: "Si falta un estudio o detectas un nivel mal calibrado, abre un issue. La misma fuente alimenta esta página y el producto.",
  },
  en: {
    eyebrow: "EVIDENCE LIBRARY",
    title: "Cited, not claimed.",
    editorial: "Every claim with authorship, year, journal, N and reported effect.",
    intro:
      "Every protocol starts from peer-reviewed literature. This library exposes mechanism, sample, reported effect and DOI for each study. We classify cautiously: we downgrade whenever the evidence doesn't sustain what apps usually promise.",

    statProtocols: "Protocols",
    statProtocolsSub: (h, m, l) => `${h} high · ${m} moderate · ${l} limited`,
    statStudies: "Peer-reviewed studies",
    statStudiesSub: "from indexed journals",
    statDois: "Verifiable DOIs",
    statDoisSub: "one click from each citation",
    statRange: "Time span",
    statRangeMeta: (min, max) => `${min} – ${max}`,
    statRangeSub: "publication years covered",

    methodKicker: "HOW WE CLASSIFY",
    methodH: "Three levels. With public criteria.",
    methodBody:
      "GRADE-inspired scheme, adapted to the domain of non-pharmacological physiological interventions. This library informs decisions; it does not replace clinical judgment or professional consultation.",
    methodLevels: [
      {
        key: "high",
        label: "High evidence",
        rule: "Meta-analyses or multiple randomized controlled trials with consistent effect and low risk of bias.",
      },
      {
        key: "moderate",
        label: "Moderate evidence",
        rule: "One or more good-quality trials; effect replicated but with heterogeneity or small samples.",
      },
      {
        key: "limited",
        label: "Limited evidence",
        rule: "Pilot studies, observational work or indirect evidence. Flagged for re-evaluation as new data arrives.",
      },
    ],
    methodNote:
      "When higher-quality contrary evidence emerges, we downgrade the level publicly. Full history lives versioned in the repository.",

    toc: "Protocols",
    levelHigh: "High evidence",
    levelModerate: "Moderate evidence",
    levelLimited: "Limited evidence",
    mechanism: "Mechanism",
    expect: "What to expect",
    limitation: "Limitation",
    studies: (n) => `Studies (${n})`,
    permalink: "Permalink",
    cardMeta: (nStudies, yMin, yMax) =>
      `${nStudies} ${nStudies === 1 ? "study" : "studies"} · ${yMin === yMax ? yMin : `${yMin}–${yMax}`}`,

    closingKicker: "NEXT STEP",
    closingHLead: "You've reviewed the evidence.",
    closingHBody: "Now see the product.",
    closingBody:
      "30 live minutes to watch these studies translate into measurable protocols. No slides, no polish.",
    closingPrimary: "Book a demo",
    closingSecondary: "Plans & pricing",
    closingTertiary: "Architecture & DPA",

    footerReviewed: "Registry last reviewed",
    footerReviewedNote: "Date of the most recent curation; full history lives versioned in the repository.",
    footerOpen: "Open registry",
    footerOpenNote: "If a study is missing or you spot a miscalibrated level, open an issue. The same source feeds this page and the product.",
  },
};

const LEVEL_ACCENT = {
  high: "#22D3EE",
  moderate: "#818CF8",
  limited: "#FBBF24",
};

export default async function EvidenciaPage() {
  const locale = await getServerLocale();
  const L = locale === "en" ? "en" : "es";
  const c = COPY[L];
  const entries = Object.values(EVIDENCE);
  const counts = entries.reduce(
    (acc, e) => {
      acc[e.evidenceLevel] = (acc[e.evidenceLevel] || 0) + 1;
      return acc;
    },
    { high: 0, moderate: 0, limited: 0 }
  );
  const totalStudies = entries.reduce((n, e) => n + (e.studies?.length || 0), 0);
  const totalDois = entries.reduce(
    (n, e) => n + (e.studies?.filter((s) => s.doi).length || 0),
    0
  );
  const allYears = entries.flatMap((e) => (e.studies || []).map((s) => s.year).filter(Boolean));
  const yearMin = allYears.length ? Math.min(...allYears) : null;
  const yearMax = allYears.length ? Math.max(...allYears) : null;

  const LEVEL_ORDER = ["high", "moderate", "limited"];
  const grouped = LEVEL_ORDER.map((level) => ({
    level,
    label: level === "high" ? c.levelHigh : level === "moderate" ? c.levelModerate : c.levelLimited,
    items: entries.filter((e) => e.evidenceLevel === level),
  })).filter((g) => g.items.length > 0);

  const levelPct = {
    high: Math.round((counts.high / entries.length) * 100),
    moderate: Math.round((counts.moderate / entries.length) * 100),
    limited: Math.round((counts.limited / entries.length) * 100),
  };

  const reviewedDate = new Date(EVIDENCE_LAST_REVIEWED).toLocaleDateString(
    L === "en" ? "en-US" : "es-MX",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <PublicShell activePath="/evidencia">
      {/* ═══ Hero + ambient lattice ═══ */}
      <Container size="lg" className="bi-prose">
        <header className="bi-evid-hero">
          <div aria-hidden className="bi-evid-hero-lattice">
            <BioglyphLattice variant="ambient" />
          </div>
          <span aria-hidden className="bi-evid-hero-aura" />
          <div style={{ position: "relative", zIndex: 1 }}>
            <IgnitionReveal sparkOrigin="12% 30%">
              <div style={kickerStyle}>{c.eyebrow}</div>
              <h1
                style={{
                  margin: `${space[3]}px 0 ${space[4]}px`,
                  fontSize: "clamp(36px, 5.2vw, 64px)",
                  letterSpacing: "-0.035em",
                  lineHeight: 1.02,
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
                  maxWidth: "44ch",
                  margin: `0 0 ${space[4]}px`,
                }}
              >
                {c.editorial}
              </p>
              <p style={{ color: cssVar.textDim, maxWidth: "62ch", marginBlockStart: 0 }}>{c.intro}</p>
            </IgnitionReveal>
          </div>
        </header>
      </Container>

      {/* ═══ Stat strip — proof via real numbers ═══ */}
      <section aria-label={c.statProtocols} style={{ marginBlockStart: space[7] }}>
        <Container size="xl" style={{ paddingInline: 0 }}>
          <div className="bi-proof-stats">
            <div>
              <span className="v">{entries.length}</span>
              <span className="l">{c.statProtocols}</span>
              <span className="s">{c.statProtocolsSub(counts.high, counts.moderate, counts.limited)}</span>
            </div>
            <div>
              <span className="v">{totalStudies}</span>
              <span className="l">{c.statStudies}</span>
              <span className="s">{c.statStudiesSub}</span>
            </div>
            <div>
              <span className="v">{totalDois}</span>
              <span className="l">{c.statDois}</span>
              <span className="s">{c.statDoisSub}</span>
            </div>
            <div>
              <span className="v">{yearMin && yearMax ? c.statRangeMeta(yearMin, yearMax) : "—"}</span>
              <span className="l">{c.statRange}</span>
              <span className="s">{c.statRangeSub}</span>
            </div>
          </div>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      {/* ═══ Methodology — explicit classification criteria ═══ */}
      <section aria-labelledby="evid-method" className="bi-evid-method-section">
        <div aria-hidden className="bi-evid-method-lattice">
          <BioglyphLattice variant="ambient" />
        </div>
        <Container size="lg">
          <IgnitionReveal sparkOrigin="50% 20%">
            <div style={{ textAlign: "center", marginBlockEnd: space[7] }}>
              <div style={kickerStyle}>{c.methodKicker}</div>
              <h2 id="evid-method" style={sectionHeading}>{c.methodH}</h2>
              <p style={{
                marginBlockStart: space[3],
                marginInline: "auto",
                maxInlineSize: "58ch",
                color: cssVar.textDim,
                fontSize: font.size.md,
                lineHeight: 1.6,
              }}>
                {c.methodBody}
              </p>
            </div>

            <div className="bi-evid-method-grid" role="list">
              {c.methodLevels.map((lvl) => (
                <article key={lvl.key} className="bi-evid-method-card" data-level={lvl.key} role="listitem">
                  <header className="bi-evid-method-head">
                    <span className="bi-evid-method-pct">{levelPct[lvl.key]}%</span>
                    <span className="bi-evid-method-label" style={{ color: LEVEL_ACCENT[lvl.key] }}>
                      {lvl.label}
                    </span>
                  </header>
                  <p className="bi-evid-method-rule">{lvl.rule}</p>
                  <div className="bi-evid-method-bar" aria-hidden>
                    <span
                      className="bi-evid-method-bar-fill"
                      style={{ inlineSize: `${levelPct[lvl.key]}%`, background: LEVEL_ACCENT[lvl.key] }}
                    />
                  </div>
                  <span className="bi-evid-method-count" aria-hidden>
                    {counts[lvl.key]} / {entries.length}
                  </span>
                </article>
              ))}
            </div>
            <p className="bi-evid-method-note">{c.methodNote}</p>
          </IgnitionReveal>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      {/* ═══ TOC + protocol cards ═══ */}
      <Container size="lg" className="bi-prose">
        <nav aria-labelledby="toc-heading" className="bi-evid-toc">
          <h2 id="toc-heading" className="bi-evid-toc-h">{c.toc}</h2>
          <ul className="bi-evid-toc-list">
            {grouped.map((g) => (
              <li key={g.level}>
                <span className="bi-evid-toc-level" style={{ color: LEVEL_ACCENT[g.level] }}>
                  {g.label}
                </span>
                <span className="bi-evid-toc-items">
                  {g.items.map((e, i) => (
                    <a key={e.id} href={`#${e.id}`} className="bi-evid-toc-link">
                      {e.title}
                      {i < g.items.length - 1 && <span aria-hidden className="bi-evid-toc-sep">·</span>}
                    </a>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </nav>

        <div className="bi-evid-cards">
          {entries.map((e) => {
            const accent = LEVEL_ACCENT[e.evidenceLevel];
            const levelLabel =
              e.evidenceLevel === "high" ? c.levelHigh :
              e.evidenceLevel === "moderate" ? c.levelModerate : c.levelLimited;
            const studyYears = (e.studies || []).map((s) => s.year).filter(Boolean);
            const yMin = studyYears.length ? Math.min(...studyYears) : null;
            const yMax = studyYears.length ? Math.max(...studyYears) : null;

            return (
              <article
                key={e.id}
                id={e.id}
                aria-labelledby={`${e.id}-title`}
                className="bi-evid-card"
                data-level={e.evidenceLevel}
                style={{ "--evid-accent": accent }}
              >
                <header className="bi-evid-card-head">
                  <span className="bi-evid-card-level">
                    <span aria-hidden className="bi-evid-card-level-dot" />
                    {levelLabel}
                  </span>
                  <a
                    href={`#${e.id}`}
                    aria-label={c.permalink}
                    title={c.permalink}
                    className="bi-evid-card-permalink"
                  >
                    #{e.id}
                  </a>
                </header>

                <h2 id={`${e.id}-title`} className="bi-evid-card-title">{e.title}</h2>

                <p className="bi-evid-card-meta" aria-hidden>
                  {yMin && yMax ? c.cardMeta(e.studies.length, yMin, yMax) : `${e.studies.length}`}
                </p>

                <div className="bi-evid-card-block">
                  <span className="bi-evid-card-label">{c.mechanism}</span>
                  <p>{e.mechanism}</p>
                </div>

                <div className="bi-evid-card-block">
                  <span className="bi-evid-card-label">{c.expect}</span>
                  <p>{e.expect}</p>
                </div>

                <div className="bi-evid-card-block">
                  <span className="bi-evid-card-label">{c.limitation}</span>
                  <p className="bi-evid-card-lim">{e.limitation}</p>
                </div>

                <div className="bi-evid-card-block">
                  <span className="bi-evid-card-label">{c.studies(e.studies.length)}</span>
                  <ol className="bi-evid-studies">
                    {e.studies.map((s, i) => (
                      <li key={i} className="bi-evid-study">
                        <div className="bi-evid-study-cite">
                          <span className="bi-evid-study-author">{s.authors}</span>
                          <span className="bi-evid-study-year">{s.year}</span>
                        </div>
                        <div className="bi-evid-study-title">{s.title}</div>
                        <div className="bi-evid-study-journal">
                          {s.journal}
                          {s.n ? <span className="bi-evid-study-n">N = {s.n}</span> : null}
                        </div>
                        {s.effect && <div className="bi-evid-study-effect">{s.effect}</div>}
                        {s.doi && (
                          <a
                            href={`https://doi.org/${s.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bi-evid-study-doi"
                          >
                            DOI: {s.doi}
                            <svg aria-hidden width="11" height="11" viewBox="0 0 11 11">
                              <path d="M4 2h5v5M9 2L3.5 7.5M2 5v4h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            </svg>
                          </a>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              </article>
            );
          })}
        </div>
      </Container>

      <PulseDivider intensity="dim" />

      {/* ═══ Closing CTA — science read, product next ═══ */}
      <section aria-labelledby="evid-closing" className="bi-demo-closing-section">
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

              <h2 id="evid-closing" className="bi-demo-closing-h">
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
                <Link href="/pricing" className="bi-demo-closing-ghost">
                  <svg aria-hidden width="13" height="13" viewBox="0 0 13 13">
                    <path d="M6.5 1.5v10M2.5 4.5h6M4.5 9.5h6" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" />
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
                  <span className="bi-demo-closing-avail-label">{c.footerReviewed}</span>
                  <span className="bi-demo-closing-avail-meta">{reviewedDate}</span>
                </div>
                <div className="bi-demo-closing-sig">
                  <span className="bi-demo-closing-sig-name">{c.footerOpen}</span>
                  <span className="bi-demo-closing-sig-meta">{c.footerOpenNote}</span>
                </div>
              </div>
            </div>
          </IgnitionReveal>
        </Container>
      </section>
    </PublicShell>
  );
}
