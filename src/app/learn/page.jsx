/* ═══════════════════════════════════════════════════════════════
   /learn — Hub de artículos evergreen.

   Server component. Cada artículo vive como subpágina con sus
   propias referencias revisadas por pares. Este hub sólo indexa.

   ARTICLES es la única fuente de verdad: metadatos (citas, año
   mínimo de referencia, nivel de evidencia) se muestran en la
   tarjeta y se suman para el stat strip. Al agregar un artículo:
   (1) sube la subpágina, (2) añade entrada aquí, (3) sube
   ARTICLES_LAST_REVIEWED.
   ═══════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font, bioSignal } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";
import IgnitionReveal from "@/components/brand/IgnitionReveal";
import BioglyphLattice from "@/components/brand/BioglyphLattice";
import PulseDivider from "@/components/brand/PulseDivider";

export const metadata = {
  title: "Aprende · Fundamentos con evidencia",
  description:
    "Artículos cortos sobre HRV, cronotipo y respiración resonante. Basados en literatura revisada por pares, con citas verificables.",
  alternates: { canonical: "/learn" },
  openGraph: {
    title: "BIO-IGNICIÓN · Aprende",
    description: "HRV, cronotipo, respiración resonante — fundamentos con evidencia.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
};

/** ISO de la última curaduría del índice. Sube al añadir/editar un artículo. */
export const ARTICLES_LAST_REVIEWED = "2026-04-18";

const ARTICLES = [
  {
    slug: "hrv-basics",
    topic: { es: "Fisiología", en: "Physiology" },
    title: { es: "HRV 101 — qué es y por qué importa", en: "HRV 101 — what it is and why it matters" },
    blurb: {
      es: "RMSSD, ventana nocturna, lecturas de 60 s. Cómo leer tu variabilidad cardíaca sin pseudociencia.",
      en: "RMSSD, nocturnal window, 60-second readings. How to read your heart-rate variability without pseudoscience.",
    },
    takeaway: {
      es: "El número absoluto importa menos que tu línea base de 14 días.",
      en: "The absolute number matters less than your 14-day baseline.",
    },
    minutes: 6,
    citations: 4,
    yearMin: 2013,
    yearMax: 2017,
    level: "moderate",
  },
  {
    slug: "cronotipo",
    topic: { es: "Cronobiología", en: "Chronobiology" },
    title: { es: "Cronotipo — tu reloj interno en la práctica", en: "Chronotype — your inner clock in practice" },
    blurb: {
      es: "MEQ, genotipo PER3, ventanas de enfoque. Qué puedes y qué no puedes cambiar de tu curva diurna.",
      en: "MEQ, PER3 genotype, focus windows. What you can and cannot change about your diurnal curve.",
    },
    takeaway: {
      es: "Puedes desplazar tu curva ±1 h con hábitos; no convertir un vespertino en matutino.",
      en: "You can shift your curve ±1 h with habits; you cannot turn an evening type into a morning type.",
    },
    minutes: 5,
    citations: 5,
    yearMin: 1976,
    yearMax: 2015,
    level: "moderate",
  },
  {
    slug: "respiracion-resonante",
    topic: { es: "Autonómico", en: "Autonomic" },
    title: { es: "Respiración resonante — por qué ~0.1 Hz", en: "Resonant breathing — why ~0.1 Hz" },
    blurb: {
      es: "El punto donde HRV, presión arterial y baroreflejo entran en fase. La fisiología detrás del número.",
      en: "Where HRV, blood pressure and baroreflex come into phase. The physiology behind the number.",
    },
    takeaway: {
      es: "20 min/día, 5 días/semana, 8 semanas es la dosis con mejor evidencia.",
      en: "20 min/day, 5 days/week, 8 weeks is the dose with the strongest evidence.",
    },
    minutes: 7,
    citations: 3,
    yearMin: 2006,
    yearMax: 2020,
    level: "high",
  },
];

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

const LEVEL_ACCENT = {
  high: "#22D3EE",
  moderate: "#818CF8",
  limited: "#FBBF24",
};

const COPY = {
  es: {
    eyebrow: "BIBLIOTECA DIDÁCTICA",
    title: "Fundamentos con fuente.",
    editorial: "Cada afirmación cita su fuente. Cuando se mueve la literatura, se mueve el artículo.",
    intro:
      "Artículos breves sobre la fisiología detrás de cada protocolo. Escritos para leerse rápido y citarse con precisión en contextos profesionales.",

    statArticles: "Artículos",
    statArticlesSub: "publicados hasta hoy",
    statMinutes: "Tiempo total de lectura",
    statMinutesSub: "promedio de seis minutos por artículo",
    statCitations: "Referencias revisadas",
    statCitationsSub: "en revistas indexadas",
    statRange: "Rango temporal",
    statRangeSub: "años de publicación cubiertos",

    principlesKicker: "CÓMO ESCRIBIMOS",
    principlesH: "Tres reglas editoriales.",
    principlesBody:
      "Un texto útil distingue fisiología de promesa. Si no hay cita, no hay afirmación.",
    principles: [
      {
        key: "cite",
        label: "Citamos la fuente",
        rule: "Cada mecanismo o efecto cita al menos una referencia con autor, año y revista. La lista completa vive al pie del artículo.",
      },
      {
        key: "honest",
        label: "Nombramos los límites",
        rule: "Cada artículo cierra con una sección de limitaciones explícitas: variabilidad, sesgos conocidos y qué no puede concluirse.",
      },
      {
        key: "update",
        label: "Actualizamos cuando la evidencia se mueve",
        rule: "Cuando aparece un meta-análisis que contradice una afirmación, editamos el artículo y anotamos la fecha de revisión pública.",
      },
    ],
    principlesNote:
      "Estos artículos son material educativo. No sustituyen consulta clínica ni juicio profesional calificado.",

    indexKicker: "ÍNDICE",
    indexH: "Tres artículos, un mismo estándar.",
    indexMeta: (m, c) => `${m} min · ${c} ${c === 1 ? "cita" : "citas"}`,
    read: "Leer",
    takeawayLabel: "Idea clave",

    levelHigh: "Alta",
    levelModerate: "Moderada",
    levelLimited: "Limitada",

    closingKicker: "SIGUIENTE PASO",
    closingHLead: "Terminaste de leer.",
    closingHBody: "Ve cómo se aplica.",
    closingBody:
      "30 minutos en vivo sobre tu dato, no sobre slides: cómo estas bases se traducen en protocolos medibles.",
    closingPrimary: "Agenda demo",
    closingSecondary: "Biblioteca de evidencia",
    closingTertiary: "Precios y planes",

    reviewedLabel: "Última revisión del índice",
    openLabel: "Material educativo",
    openNote: "Para decisiones clínicas consulta a un profesional de la salud.",
  },
  en: {
    eyebrow: "LEARNING LIBRARY",
    title: "Fundamentals, cited.",
    editorial: "Every claim cites its source. When the literature moves, the article moves.",
    intro:
      "Short articles on the physiology behind each protocol. Written to be read quickly and cited accurately in professional settings.",

    statArticles: "Articles",
    statArticlesSub: "published to date",
    statMinutes: "Total reading time",
    statMinutesSub: "roughly six minutes per article",
    statCitations: "Peer-reviewed references",
    statCitationsSub: "in indexed journals",
    statRange: "Time span",
    statRangeSub: "publication years covered",

    principlesKicker: "HOW WE WRITE",
    principlesH: "Three editorial rules.",
    principlesBody:
      "A useful text separates physiology from promise. If there is no citation, there is no claim.",
    principles: [
      {
        key: "cite",
        label: "We cite the source",
        rule: "Every mechanism or effect names at least one reference with author, year and journal. The full list lives at the foot of the article.",
      },
      {
        key: "honest",
        label: "We name the limits",
        rule: "Each article closes with explicit limitations: variability, known biases and what cannot be concluded.",
      },
      {
        key: "update",
        label: "We update when evidence shifts",
        rule: "When a meta-analysis contradicts a claim, we edit the article and note the public revision date.",
      },
    ],
    principlesNote:
      "These articles are educational material. They do not replace clinical consultation or qualified professional judgment.",

    indexKicker: "INDEX",
    indexH: "Three articles, one standard.",
    indexMeta: (m, c) => `${m} min · ${c} ${c === 1 ? "citation" : "citations"}`,
    read: "Read",
    takeawayLabel: "Key idea",

    levelHigh: "High",
    levelModerate: "Moderate",
    levelLimited: "Limited",

    closingKicker: "NEXT STEP",
    closingHLead: "You finished reading.",
    closingHBody: "Now see it applied.",
    closingBody:
      "30 live minutes on your data, not on slides: how these fundamentals translate into measurable protocols.",
    closingPrimary: "Book a demo",
    closingSecondary: "Evidence library",
    closingTertiary: "Plans & pricing",

    reviewedLabel: "Index last reviewed",
    openLabel: "Educational material",
    openNote: "For clinical decisions consult a qualified healthcare professional.",
  },
};

export default async function LearnHubPage() {
  const locale = await getServerLocale();
  const L = locale === "en" ? "en" : "es";
  const c = COPY[L];

  const totalArticles = ARTICLES.length;
  const totalMinutes = ARTICLES.reduce((n, a) => n + a.minutes, 0);
  const totalCitations = ARTICLES.reduce((n, a) => n + a.citations, 0);
  const allYears = ARTICLES.flatMap((a) => [a.yearMin, a.yearMax]).filter(Boolean);
  const yearMin = Math.min(...allYears);
  const yearMax = Math.max(...allYears);

  const levelLabel = (lvl) =>
    lvl === "high" ? c.levelHigh : lvl === "moderate" ? c.levelModerate : c.levelLimited;

  const reviewedDate = new Date(ARTICLES_LAST_REVIEWED).toLocaleDateString(
    L === "en" ? "en-US" : "es-MX",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <PublicShell activePath="/learn">
      {/* ═══ Hero ═══ */}
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

      {/* ═══ Stat strip ═══ */}
      <section aria-label={c.statArticles} style={{ marginBlockStart: space[7] }}>
        <Container size="xl" style={{ paddingInline: 0 }}>
          <div className="bi-proof-stats">
            <div>
              <span className="v">{totalArticles}</span>
              <span className="l">{c.statArticles}</span>
              <span className="s">{c.statArticlesSub}</span>
            </div>
            <div>
              <span className="v">{totalMinutes} min</span>
              <span className="l">{c.statMinutes}</span>
              <span className="s">{c.statMinutesSub}</span>
            </div>
            <div>
              <span className="v">{totalCitations}</span>
              <span className="l">{c.statCitations}</span>
              <span className="s">{c.statCitationsSub}</span>
            </div>
            <div>
              <span className="v">{yearMin}–{yearMax}</span>
              <span className="l">{c.statRange}</span>
              <span className="s">{c.statRangeSub}</span>
            </div>
          </div>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      {/* ═══ Editorial principles ═══ */}
      <section aria-labelledby="learn-principles" className="bi-evid-method-section">
        <div aria-hidden className="bi-evid-method-lattice">
          <BioglyphLattice variant="ambient" />
        </div>
        <Container size="lg">
          <IgnitionReveal sparkOrigin="50% 20%">
            <div style={{ textAlign: "center", marginBlockEnd: space[7] }}>
              <div style={kickerStyle}>{c.principlesKicker}</div>
              <h2 id="learn-principles" style={sectionHeading}>{c.principlesH}</h2>
              <p style={{
                marginBlockStart: space[3],
                marginInline: "auto",
                maxInlineSize: "58ch",
                color: cssVar.textDim,
                fontSize: font.size.md,
                lineHeight: 1.6,
              }}>
                {c.principlesBody}
              </p>
            </div>

            <div className="bi-learn-principles" role="list">
              {c.principles.map((p, i) => (
                <article key={p.key} className="bi-learn-principle" role="listitem">
                  <span className="bi-learn-principle-num" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="bi-learn-principle-label">{p.label}</h3>
                  <p className="bi-learn-principle-rule">{p.rule}</p>
                </article>
              ))}
            </div>
            <p className="bi-evid-method-note">{c.principlesNote}</p>
          </IgnitionReveal>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      {/* ═══ Article index ═══ */}
      <Container size="lg" className="bi-prose">
        <div style={{ marginBlockEnd: space[6] }}>
          <div style={kickerStyle}>{c.indexKicker}</div>
          <h2 style={sectionHeading}>{c.indexH}</h2>
        </div>

        <div className="bi-learn-grid">
          {ARTICLES.map((a) => {
            const accent = LEVEL_ACCENT[a.level];
            return (
              <Link
                key={a.slug}
                href={`/learn/${a.slug}`}
                className="bi-learn-card"
                data-level={a.level}
                style={{ "--learn-accent": accent }}
                aria-label={`${L === "en" ? a.title.en : a.title.es} — ${a.minutes} min`}
              >
                <header className="bi-learn-card-head">
                  <span className="bi-learn-card-topic">{L === "en" ? a.topic.en : a.topic.es}</span>
                  <span className="bi-learn-card-level">
                    <span aria-hidden className="bi-learn-card-level-dot" />
                    {levelLabel(a.level)}
                  </span>
                </header>
                <h3 className="bi-learn-card-title">{L === "en" ? a.title.en : a.title.es}</h3>
                <p className="bi-learn-card-blurb">{L === "en" ? a.blurb.en : a.blurb.es}</p>
                <div className="bi-learn-card-takeaway">
                  <span className="bi-learn-card-takeaway-label">{c.takeawayLabel}</span>
                  <p>{L === "en" ? a.takeaway.en : a.takeaway.es}</p>
                </div>
                <footer className="bi-learn-card-foot">
                  <span className="bi-learn-card-meta">{c.indexMeta(a.minutes, a.citations)}</span>
                  <span className="bi-learn-card-cta" aria-hidden>
                    {c.read}
                    <svg width="13" height="13" viewBox="0 0 13 13">
                      <path d="M2.5 6.5h7M7 4l2.5 2.5L7 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </span>
                </footer>
              </Link>
            );
          })}
        </div>
      </Container>

      <PulseDivider intensity="dim" />

      {/* ═══ Closing CTA ═══ */}
      <section aria-labelledby="learn-closing" className="bi-demo-closing-section">
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

              <h2 id="learn-closing" className="bi-demo-closing-h">
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
                <Link href="/evidencia" className="bi-demo-closing-ghost">
                  <svg aria-hidden width="13" height="13" viewBox="0 0 13 13">
                    <path d="M2.5 2.5h8v8h-8zM2.5 5.5h8M5.5 2.5v8" stroke="currentColor" strokeWidth="1.2" fill="none" />
                  </svg>
                  <span>{c.closingSecondary}</span>
                </Link>
                <Link href="/pricing" className="bi-demo-closing-ghost">
                  <svg aria-hidden width="13" height="13" viewBox="0 0 13 13">
                    <path d="M6.5 1.5v10M2.5 4.5h6M4.5 9.5h6" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" />
                  </svg>
                  <span>{c.closingTertiary}</span>
                </Link>
              </div>

              <div className="bi-demo-closing-meta">
                <div className="bi-demo-closing-avail">
                  <span aria-hidden className="bi-demo-closing-avail-pulse">
                    <span className="bi-demo-closing-avail-dot" />
                  </span>
                  <span className="bi-demo-closing-avail-label">{c.reviewedLabel}</span>
                  <span className="bi-demo-closing-avail-meta">{reviewedDate}</span>
                </div>
                <div className="bi-demo-closing-sig">
                  <span className="bi-demo-closing-sig-name">{c.openLabel}</span>
                  <span className="bi-demo-closing-sig-meta">{c.openNote}</span>
                </div>
              </div>
            </div>
          </IgnitionReveal>
        </Container>
      </section>
    </PublicShell>
  );
}
