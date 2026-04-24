/* ═══════════════════════════════════════════════════════════════
   /vs — Comparatives hub. Linear-style index: honest, verifiable,
   non-defensive. We only ship comparisons we can substantiate
   with public info published by the competitor themselves.
   Follows 23-point ADN canon and reuses cinematic DNA.
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
  title: "Comparativas · BIO-IGNICIÓN vs alternativas B2B",
  description:
    "Comparativas honestas con información pública y verificable. Dónde BIO-IGNICIÓN gana, dónde la alternativa gana, y cuándo elegir cuál. Sin FUD, sin straw-man.",
  alternates: { canonical: "/vs" },
  openGraph: {
    title: "BIO-IGNICIÓN · Comparativas honestas",
    description: "Linear hace /vs/jira. Nosotros hacemos /vs/headspace. Verificable, sin humo.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
};

const LAST_REVIEWED = "2026-04-22";

const kickerStyle = {
  fontFamily: cssVar.fontMono,
  fontSize: font.size.xs,
  color: bioSignal.phosphorCyanInk,
  textTransform: "uppercase",
  letterSpacing: "0.26em",
  fontWeight: font.weight.bold,
  marginBlockEnd: space[3],
};

const h1Style = {
  margin: 0,
  fontSize: "clamp(36px, 5.2vw, 62px)",
  letterSpacing: "-0.035em",
  lineHeight: 1.04,
  fontWeight: font.weight.black,
  color: cssVar.text,
};

const editorialStyle = {
  margin: `${space[5]}px 0 0`,
  fontFamily: "var(--font-editorial)",
  fontStyle: "italic",
  fontSize: "clamp(18px, 2.2vw, 22px)",
  lineHeight: 1.45,
  color: cssVar.textMuted,
  maxWidth: "62ch",
};

const sectionHeading = {
  margin: 0,
  fontSize: "clamp(24px, 3vw, 32px)",
  letterSpacing: "-0.025em",
  lineHeight: 1.12,
  fontWeight: font.weight.black,
  color: cssVar.text,
};

const sectionSub = {
  margin: `${space[3]}px 0 0`,
  color: cssVar.textMuted,
  fontSize: font.size.base,
  lineHeight: font.leading.relaxed,
  maxWidth: "64ch",
};

const COPY = {
  es: {
    eyebrow: "COMPARATIVAS · INFORMACIÓN PÚBLICA",
    title: "Contra quién vas a compararnos.",
    editorial:
      "No vendemos en contra de nadie. Pero el CHRO que nos evalúa ya tiene tres nombres en la servilleta — y merece ver cada uno al lado, con datos que puede verificar él mismo.",

    ruleKicker: "REGLA",
    ruleH: "Cómo construimos cada comparación.",
    ruleItems: [
      {
        t: "Solo información pública.",
        b: "Usamos únicamente lo que el competidor publica en su propio sitio, press kit, SEC filings, o docs técnicos. Citamos el enlace y la fecha de revisión en cada tabla.",
      },
      {
        t: "Donde ellos ganan, lo decimos.",
        b: "Ningún straw-man. Si Headspace tiene 100× más contenido de meditación que nosotros, eso es un hecho — y lo ponemos arriba.",
      },
      {
        t: "Diferencias de arquitectura, no de marketing.",
        b: "Evitamos 'feature X vs feature X' cuando la comparación real es filosófica: librería vs instrumento, SaaS vs local-first, contenido vs medición.",
      },
      {
        t: "Revisión trimestral.",
        b: "Cada página lleva fecha de última revisión. Si el competidor cambia de modelo o compliance, la actualizamos en < 30 días.",
      },
    ],

    indexKicker: "ÍNDICE",
    indexH: "Qué comparaciones están publicadas.",
    indexBody:
      "Enviamos una comparación nueva cada trimestre. Si estás evaluando algo que no está acá, escríbenos — la agregamos al roadmap público.",

    items: [
      {
        slug: "/vs/headspace",
        competitor: "Headspace for Work",
        status: "live",
        statusLabel: "Publicada",
        oneLiner: "Librería de contenido de meditación vs instrumento de medición neural.",
        angle: "Content library · B2B meditation",
      },
      {
        slug: "/vs/calm",
        competitor: "Calm Business",
        status: "live",
        statusLabel: "Publicada",
        oneLiner: "Sleep Stories + evening content vs pre-shift medible. Ventanas horarias opuestas.",
        angle: "Content library · sleep + relax",
      },
      {
        slug: "/vs/modern-health",
        competitor: "Modern Health",
        status: "live",
        statusLabel: "Publicada",
        oneLiner: "Plataforma clínica (terapia + coaching + psiquiatría) vs instrumento pre-turno. Complementarios — viven en slots distintos del mismo stack.",
        angle: "Clinical services platform",
      },
    ],

    cannotKicker: "LO QUE NO COMPARAMOS",
    cannotH: "Dos mercados donde no entramos — y por qué.",
    cannotBody:
      "Hay dos categorías donde comparar sería mala fe: nosotros no resolvemos lo que ellas resuelven. Las nombramos para que tu due diligence quede completo.",
    cannotItems: [
      {
        t: "EAP clínico (Lyra, Spring Health).",
        b: "Resuelven salud mental clínica con terapia + psiquiatría escalable. Nosotros no somos eso. Si tu programa necesita terapia a demanda, ellos son la respuesta — y nosotros complementamos con pre-shift fisiológico.",
      },
      {
        t: "Wearable de consumidor (Oura, WHOOP).",
        b: "Generan señal HRV excelente. Nosotros la leemos vía Apple Health / Fitbit / Garmin / Oura — no competimos con el sensor. Somos la capa de protocolo + adopción + compliance que el wearable solo no hace.",
      },
    ],

    closingKicker: "DECISIÓN",
    closingH: "La comparación honesta empieza acá.",
    closingBody:
      "Abre la primera comparación. Si tu CHRO / CISO / CFO llega con una alternativa que no esté en esta página, escríbenos y la subimos al roadmap — con la información pública del competidor, no la nuestra.",
    closingPrimary: "Ver /vs/headspace",
    closingSecondary: "Pedir una comparación nueva",
    closingTertiary: "Trust Center · due diligence",
    lastReviewed: "Última revisión",

    disclaimerH: "Nota editorial · lectura en 30 s",
    disclaimerBody:
      "Las marcas mencionadas (Headspace, Calm, Modern Health, Lyra Health, Spring Health, Oura, WHOOP) se referencian bajo doctrina de uso nominativo justo con fin de comparación editorial. No implica endorsement, afiliación ni subordinación comercial con BIO-IGNICIÓN. Toda la información de los competidores proviene de fuentes publicadas por ellos mismos — enlazamos cada claim verificable en la página de detalle.",
  },

  en: {
    eyebrow: "COMPARATIVES · PUBLIC INFORMATION",
    title: "Who you're going to compare us against.",
    editorial:
      "We don't sell against anyone. But the CHRO evaluating us already has three names on the napkin — and deserves to see each side-by-side, with data they can verify themselves.",

    ruleKicker: "RULE",
    ruleH: "How we build each comparison.",
    ruleItems: [
      {
        t: "Public information only.",
        b: "We only use what the competitor publishes on their own site, press kit, SEC filings, or technical docs. We cite link and review date in every table.",
      },
      {
        t: "Where they win, we say it.",
        b: "No straw-man. If Headspace has 100× more meditation content than we do, that's a fact — and we put it at the top.",
      },
      {
        t: "Architectural, not marketing, differences.",
        b: "We avoid 'feature X vs feature X' when the real comparison is philosophical: library vs instrument, SaaS vs local-first, content vs measurement.",
      },
      {
        t: "Quarterly review.",
        b: "Each page carries a last-reviewed date. If the competitor changes model or compliance posture, we update it within 30 days.",
      },
    ],

    indexKicker: "INDEX",
    indexH: "Which comparisons are published.",
    indexBody:
      "We ship one new comparison per quarter. If you're evaluating something that isn't here, write to us — we'll add it to the public roadmap.",

    items: [
      {
        slug: "/vs/headspace",
        competitor: "Headspace for Work",
        status: "live",
        statusLabel: "Live",
        oneLiner: "Meditation content library vs neural measurement instrument.",
        angle: "Content library · B2B meditation",
      },
      {
        slug: "/vs/calm",
        competitor: "Calm Business",
        status: "live",
        statusLabel: "Live",
        oneLiner: "Sleep Stories + evening content vs measurable pre-shift. Opposite time windows.",
        angle: "Content library · sleep + relax",
      },
      {
        slug: "/vs/modern-health",
        competitor: "Modern Health",
        status: "live",
        statusLabel: "Live",
        oneLiner: "Clinical platform (therapy + coaching + psychiatry) vs pre-shift instrument. Complementary — different slots of the same stack.",
        angle: "Clinical services platform",
      },
    ],

    cannotKicker: "WHAT WE DON'T COMPARE",
    cannotH: "Two markets we don't enter — and why.",
    cannotBody:
      "There are two categories where comparing would be bad faith: we don't solve what they solve. We name them so your due diligence stays complete.",
    cannotItems: [
      {
        t: "Clinical EAP (Lyra, Spring Health).",
        b: "They resolve clinical mental health with scalable therapy + psychiatry. We're not that. If your program needs on-demand therapy, they're the answer — we complement with physiological pre-shift.",
      },
      {
        t: "Consumer wearables (Oura, WHOOP).",
        b: "They generate excellent HRV signal. We read it via Apple Health / Fitbit / Garmin / Oura — we don't compete with the sensor. We're the protocol + adoption + compliance layer the wearable alone doesn't provide.",
      },
    ],

    closingKicker: "DECISION",
    closingH: "Honest comparison starts here.",
    closingBody:
      "Open the first comparison. If your CHRO / CISO / CFO arrives with an alternative not on this page, write to us and we'll add it to the public roadmap — with the competitor's own public information, not ours.",
    closingPrimary: "See /vs/headspace",
    closingSecondary: "Request a new comparison",
    closingTertiary: "Trust Center · due diligence",
    lastReviewed: "Last reviewed",

    disclaimerH: "Editorial note · 30 s read",
    disclaimerBody:
      "The brands mentioned (Headspace, Calm, Modern Health, Lyra Health, Spring Health, Oura, WHOOP) are referenced under fair nominative use for editorial comparison purposes. No endorsement, affiliation, or commercial subordination with BIO-IGNICIÓN is implied. All competitor information comes from sources published by the competitors themselves — we link every verifiable claim on the detail page.",
  },
};

export default async function VsIndexPage() {
  const locale = await getServerLocale();
  const t = COPY[locale === "en" ? "en" : "es"];

  return (
    <PublicShell activePath="/vs">
      <main id="main-content">
        {/* ═══ HERO ═══ */}
        <section style={{ position: "relative", paddingBlock: `${space[16]}px ${space[10]}px` }}>
          <BioglyphLattice variant="ambient" />
          <Container size="xl" style={{ position: "relative", zIndex: 1 }}>
            <IgnitionReveal sparkOrigin="22% 30%">
              <p style={kickerStyle}>{t.eyebrow}</p>
              <h1 style={h1Style}>{t.title}</h1>
              <p style={editorialStyle}>{t.editorial}</p>
            </IgnitionReveal>
          </Container>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ RULE ═══ */}
        <section style={{ paddingBlock: space[12] }}>
          <Container size="xl">
            <p style={kickerStyle}>{t.ruleKicker}</p>
            <h2 style={sectionHeading}>{t.ruleH}</h2>
            <div
              style={{
                marginBlockStart: space[8],
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: space[4],
              }}
            >
              {t.ruleItems.map((r) => (
                <article
                  key={r.t}
                  style={{
                    border: `1px solid ${cssVar.border}`,
                    borderRadius: radius.xl,
                    padding: space[6],
                    background: cssVar.surface,
                    display: "grid",
                    gap: space[3],
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: font.size.lg,
                      fontWeight: font.weight.bold,
                      color: cssVar.text,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {r.t}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      color: cssVar.textMuted,
                      fontSize: font.size.sm,
                      lineHeight: font.leading.relaxed,
                    }}
                  >
                    {r.b}
                  </p>
                </article>
              ))}
            </div>
          </Container>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ INDEX ═══ */}
        <section style={{ paddingBlock: space[12] }}>
          <Container size="xl">
            <p style={kickerStyle}>{t.indexKicker}</p>
            <h2 style={sectionHeading}>{t.indexH}</h2>
            <p style={sectionSub}>{t.indexBody}</p>

            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: `${space[8]}px 0 0`,
                display: "grid",
                gap: space[3],
              }}
            >
              {t.items.map((it) => {
                const isLive = it.status === "live";
                const inner = (
                  <article
                    style={{
                      position: "relative",
                      border: isLive
                        ? `1px solid ${cssVar.border}`
                        : `1px dashed ${cssVar.border}`,
                      borderRadius: radius.xl,
                      padding: `${space[5]}px ${space[6]}px`,
                      background: isLive ? cssVar.surface : "transparent",
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 1fr) auto",
                      alignItems: "center",
                      gap: space[4],
                      transition: "border-color 160ms ease, transform 160ms ease",
                    }}
                  >
                    <div style={{ display: "grid", gap: space[2], minInlineSize: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "baseline",
                          gap: space[3],
                        }}
                      >
                        <span
                          style={{
                            fontFamily: cssVar.fontMono,
                            fontSize: 10,
                            fontWeight: font.weight.bold,
                            letterSpacing: "0.24em",
                            textTransform: "uppercase",
                            color: isLive ? bioSignal.phosphorCyanInk : cssVar.textMuted,
                          }}
                        >
                          BIO-IGNICIÓN · vs
                        </span>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: font.size.xl,
                            fontWeight: font.weight.black,
                            color: cssVar.text,
                            letterSpacing: "-0.015em",
                          }}
                        >
                          {it.competitor}
                        </h3>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          color: cssVar.text,
                          fontSize: font.size.base,
                          lineHeight: font.leading.relaxed,
                        }}
                      >
                        {it.oneLiner}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontFamily: cssVar.fontMono,
                          fontSize: font.size.xs,
                          color: cssVar.textMuted,
                          letterSpacing: "0.04em",
                        }}
                      >
                        {it.angle}
                      </p>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: space[3],
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: cssVar.fontMono,
                          fontSize: 10,
                          fontWeight: font.weight.bold,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          padding: `${space[1]}px ${space[3]}px`,
                          borderRadius: radius.pill,
                          border: `1px solid ${cssVar.border}`,
                          background: isLive ? cssVar.surface2 : "transparent",
                          color: isLive ? bioSignal.phosphorCyanInk : cssVar.textMuted,
                        }}
                      >
                        {it.statusLabel}
                      </span>
                      {isLive && (
                        <span
                          aria-hidden
                          style={{
                            fontFamily: cssVar.fontMono,
                            fontSize: font.size.base,
                            color: bioSignal.phosphorCyanInk,
                            fontWeight: font.weight.bold,
                          }}
                        >
                          →
                        </span>
                      )}
                    </div>
                  </article>
                );
                return (
                  <li key={it.competitor}>
                    {isLive && it.slug ? (
                      <Link
                        href={it.slug}
                        style={{
                          display: "block",
                          textDecoration: "none",
                          color: "inherit",
                        }}
                        className="bi-card-link"
                      >
                        {inner}
                      </Link>
                    ) : (
                      inner
                    )}
                  </li>
                );
              })}
            </ul>
          </Container>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ WHAT WE DON'T COMPARE ═══ */}
        <section style={{ paddingBlock: space[12] }}>
          <Container size="xl">
            <p style={kickerStyle}>{t.cannotKicker}</p>
            <h2 style={sectionHeading}>{t.cannotH}</h2>
            <p style={sectionSub}>{t.cannotBody}</p>
            <div
              style={{
                marginBlockStart: space[8],
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: space[4],
              }}
            >
              {t.cannotItems.map((c) => (
                <article
                  key={c.t}
                  style={{
                    border: `1px solid ${cssVar.border}`,
                    borderRadius: radius.xl,
                    padding: space[6],
                    background: cssVar.surface,
                    display: "grid",
                    gap: space[3],
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: font.size.lg,
                      fontWeight: font.weight.bold,
                      color: cssVar.text,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {c.t}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      color: cssVar.textMuted,
                      fontSize: font.size.sm,
                      lineHeight: font.leading.relaxed,
                    }}
                  >
                    {c.b}
                  </p>
                </article>
              ))}
            </div>
          </Container>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ CLOSING ═══ */}
        <section style={{ paddingBlock: `${space[12]}px ${space[16]}px` }}>
          <Container size="xl">
            <p style={kickerStyle}>{t.closingKicker}</p>
            <h2 style={{ ...sectionHeading, fontSize: "clamp(28px, 4vw, 44px)" }}>{t.closingH}</h2>
            <p style={sectionSub}>{t.closingBody}</p>
            <div
              style={{
                marginBlockStart: space[8],
                display: "flex",
                flexWrap: "wrap",
                gap: space[3],
              }}
            >
              <Link href="/vs/headspace" className="bi-demo-closing-primary">
                {t.closingPrimary}
              </Link>
              <a href="mailto:hello@bio-ignicion.app?subject=Comparison%20request" className="bi-demo-closing-secondary">
                {t.closingSecondary}
              </a>
              <Link href="/trust" className="bi-demo-closing-secondary">
                {t.closingTertiary}
              </Link>
            </div>
            <p
              style={{
                margin: `${space[6]}px 0 0`,
                fontFamily: cssVar.fontMono,
                fontSize: font.size.xs,
                color: cssVar.textMuted,
                letterSpacing: "0.08em",
              }}
            >
              {t.lastReviewed} · {LAST_REVIEWED}
            </p>
          </Container>
        </section>

        {/* ═══ DISCLAIMER ═══ */}
        <section style={{ paddingBlockEnd: space[16] }}>
          <Container size="xl">
            <aside
              className="bi-legal-callout bi-legal-callout--info"
              style={{ marginBlockStart: 0 }}
            >
              <div className="bi-legal-callout-kicker">{t.disclaimerH}</div>
              <p
                style={{
                  margin: `${space[2]}px 0 0`,
                  color: cssVar.textMuted,
                  fontSize: font.size.xs,
                  lineHeight: font.leading.relaxed,
                }}
              >
                {t.disclaimerBody}
              </p>
            </aside>
          </Container>
        </section>
      </main>
    </PublicShell>
  );
}
