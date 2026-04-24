/* ═══════════════════════════════════════════════════════════════
   /changelog — Historial público. SemVer 2.0. Deprecation/Sunset
   ≥ 6 meses (RFC 8594). Cada entrada es auditable desde RSS.
   ═══════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { cssVar, space, font, bioSignal } from "@/components/ui/tokens";
import { CHANGELOG_ENTRIES as entries } from "./entries";
import { fmtDateL } from "@/lib/i18n";
import { getServerLocale } from "@/lib/locale-server";
import IgnitionReveal from "@/components/brand/IgnitionReveal";
import BioglyphLattice from "@/components/brand/BioglyphLattice";
import PulseDivider from "@/components/brand/PulseDivider";

export const metadata = {
  title: "Changelog",
  description: "Historial público de cambios. SemVer 2.0, Deprecation/Sunset ≥ 6 meses, feed RSS.",
  openGraph: {
    title: "BIO-IGNICIÓN · Changelog",
    description: "SemVer 2.0. Deprecation/Sunset ≥ 6 meses. Nada rompe en silencio.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
  alternates: { canonical: "/changelog", types: { "application/rss+xml": "/changelog.xml" } },
};

const API_GA_DATE = "2025-11-01";

const kickerStyle = {
  fontFamily: cssVar.fontMono,
  fontSize: font.size.xs,
  color: bioSignal.phosphorCyanInk,
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
    eyebrow: "CHANGELOG · SEMVER 2.0",
    title: "Qué hay de nuevo.",
    editorial: "SemVer. 6 meses de Deprecation/Sunset. Nada rompe en silencio.",
    intro:
      "Cada release sigue SemVer 2.0. Los breaking changes se anuncian con al menos 6 meses de aviso en headers Deprecation/Sunset (RFC 8594) antes de retirarse. Feed RSS para máquinas; email para equipos.",

    statLatest: "Última versión",
    statLatestSub: "GA pública",
    statEntries: "Entradas publicadas",
    statEntriesSub: (since) => `desde ${since}`,
    statPolicy: "Política",
    statPolicySub: "major.minor.patch",
    statWindow: "Aviso de breaking",
    statWindowSub: "RFC 8594 · Deprecation + Sunset",

    policyKicker: "POLÍTICA · DEPRECATION WINDOW",
    policyH: "Cómo anunciamos un cambio que rompe.",
    policyBody:
      "No retiramos un endpoint sin emitir primero los headers Deprecation y Sunset. Entre el aviso y el retiro hay al menos 6 meses — tu integración nunca se entera de un breaking change el día que ocurre.",
    policyStepLive: "v1 · GA",
    policyStepLiveSub: "en producción",
    policyStepDeprec: "Deprecation",
    policyStepDeprecSub: "header emitido",
    policyStepGap: "≥ 6 meses",
    policyStepSunset: "Sunset",
    policyStepSunsetSub: "fecha de retiro",

    releasesKicker: "HISTORIAL · ORDEN CRONOLÓGICO INVERSO",
    releasesH: "Releases publicados.",
    releasesBody:
      "Del más reciente al más antiguo. Cada entrada incluye versión, fecha ISO y notas técnicas verificables contra el código y la OpenAPI spec.",
    tagFeature: "Nuevo",
    tagFix: "Fix",
    tagSecurity: "Seguridad",
    tagRelease: "Release",

    closingKicker: "SUSCRÍBETE",
    closingHLead: "Enterarte del siguiente release.",
    closingHBody: "Feed abierto.",
    closingBody:
      "RSS estándar para máquinas, email para equipos, o consulta la OpenAPI spec cuando necesites diffs exactos. Sin polling, sin spam.",
    closingPrimary: "Feed RSS",
    closingSecondary: "Email",
    closingTertiary: "API docs",

    footerStatus: "Última entrada",
    footerStatusMeta: "",
  },
  en: {
    eyebrow: "CHANGELOG · SEMVER 2.0",
    title: "What's new.",
    editorial: "SemVer. 6-month Deprecation/Sunset. No silent breakages.",
    intro:
      "Every release follows SemVer 2.0. Breaking changes are announced with at least 6 months of lead time via Deprecation and Sunset headers (RFC 8594) before retirement. RSS feed for machines, email for teams.",

    statLatest: "Latest version",
    statLatestSub: "public GA",
    statEntries: "Published entries",
    statEntriesSub: (since) => `since ${since}`,
    statPolicy: "Policy",
    statPolicySub: "major.minor.patch",
    statWindow: "Breaking notice",
    statWindowSub: "RFC 8594 · Deprecation + Sunset",

    policyKicker: "POLICY · DEPRECATION WINDOW",
    policyH: "How we announce a breaking change.",
    policyBody:
      "We never retire an endpoint without first emitting Deprecation and Sunset headers. Between notice and retirement there are at least 6 months — your integration never learns about a breaking change the day it happens.",
    policyStepLive: "v1 · GA",
    policyStepLiveSub: "in production",
    policyStepDeprec: "Deprecation",
    policyStepDeprecSub: "header emitted",
    policyStepGap: "≥ 6 months",
    policyStepSunset: "Sunset",
    policyStepSunsetSub: "retirement date",

    releasesKicker: "HISTORY · REVERSE CHRONOLOGICAL",
    releasesH: "Published releases.",
    releasesBody:
      "Newest to oldest. Each entry carries version, ISO date and technical notes verifiable against the code and the OpenAPI spec.",
    tagFeature: "New",
    tagFix: "Fix",
    tagSecurity: "Security",
    tagRelease: "Release",

    closingKicker: "SUBSCRIBE",
    closingHLead: "Hear about the next release.",
    closingHBody: "Open feed.",
    closingBody:
      "Standard RSS for machines, email for teams, or pull the OpenAPI spec when you need exact diffs. No polling, no spam.",
    closingPrimary: "RSS feed",
    closingSecondary: "Email",
    closingTertiary: "API docs",

    footerStatus: "Latest entry",
    footerStatusMeta: "",
  },
};

export default async function ChangelogPage() {
  const locale = await getServerLocale();
  const L = locale === "en" ? "en" : "es";
  const c = COPY[L];
  const en = L === "en";

  const tagLabel = {
    feature: c.tagFeature,
    fix: c.tagFix,
    security: c.tagSecurity,
    release: c.tagRelease,
  };

  const latest = entries[0];
  const gaDateFmt = new Date(API_GA_DATE).toLocaleDateString(en ? "en-US" : "es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const latestDateFmt = new Date(latest.date).toLocaleDateString(en ? "en-US" : "es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <PublicShell activePath="/changelog">
      {/* ═══ Hero ═══ */}
      <Container size="lg" className="bi-prose">
        <header className="bi-changelog-hero">
          <div aria-hidden className="bi-changelog-hero-lattice">
            <BioglyphLattice variant="ambient" />
          </div>
          <span aria-hidden className="bi-changelog-hero-aura" />
          <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            <IgnitionReveal sparkOrigin="50% 30%">
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
                  maxWidth: "48ch",
                  margin: `0 auto ${space[4]}`,
                }}
              >
                {c.editorial}
              </p>
              <p style={{ color: cssVar.textDim, maxWidth: "62ch", margin: "0 auto" }}>
                {c.intro}
              </p>
              <p
                style={{
                  marginBlockStart: space[5],
                  display: "flex",
                  gap: space[2],
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <Button href="/changelog.xml" size="sm" variant="primary">
                  {c.closingPrimary}
                </Button>
                <Button href="https://semver.org" size="sm" variant="secondary">
                  SemVer 2.0
                </Button>
                <Button href="/docs" size="sm" variant="secondary">
                  {c.closingTertiary}
                </Button>
              </p>
            </IgnitionReveal>
          </div>
        </header>
      </Container>

      {/* ═══ Stat strip ═══ */}
      <section aria-label={c.statLatest} style={{ marginBlockStart: space[7] }}>
        <Container size="xl" style={{ paddingInline: 0 }}>
          <div className="bi-proof-stats bi-proof-stats--label">
            <div>
              <span className="v">v{latest.version}</span>
              <span className="l">{c.statLatest}</span>
              <span className="s">{latestDateFmt}</span>
            </div>
            <div>
              <span className="v">{entries.length}</span>
              <span className="l">{c.statEntries}</span>
              <span className="s">{c.statEntriesSub(gaDateFmt)}</span>
            </div>
            <div>
              <span className="v">SemVer 2.0</span>
              <span className="l">{c.statPolicy}</span>
              <span className="s">{c.statPolicySub}</span>
            </div>
            <div>
              <span className="v">≥ 6 {en ? "months" : "meses"}</span>
              <span className="l">{c.statWindow}</span>
              <span className="s">{c.statWindowSub}</span>
            </div>
          </div>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      {/* ═══ Deprecation policy timeline ═══ */}
      <Container size="lg" className="bi-prose">
        <section aria-labelledby="changelog-policy" style={{ marginBlockEnd: space[7] }}>
          <div style={kickerStyle}>{c.policyKicker}</div>
          <h2 id="changelog-policy" style={sectionHeading}>{c.policyH}</h2>
          <p style={{ marginBlockStart: space[3], color: cssVar.textDim, maxWidth: "62ch" }}>
            {c.policyBody}
          </p>

          <div className="bi-docs-timeline" role="img" aria-label={c.policyH}>
            <div className="bi-docs-timeline-step bi-docs-timeline-step--live">
              <span className="bi-docs-timeline-dot" />
              <span className="bi-docs-timeline-label">{c.policyStepLive}</span>
              <span className="bi-docs-timeline-meta">{gaDateFmt}</span>
            </div>
            <div className="bi-docs-timeline-gap"><span className="bi-docs-timeline-gap-line" /></div>
            <div className="bi-docs-timeline-step bi-docs-timeline-step--future">
              <span className="bi-docs-timeline-dot" />
              <span className="bi-docs-timeline-label">{c.policyStepDeprec}</span>
              <span className="bi-docs-timeline-meta">{c.policyStepDeprecSub}</span>
            </div>
            <div className="bi-docs-timeline-gap">
              <span className="bi-docs-timeline-gap-line" />
              <span className="bi-docs-timeline-gap-label">{c.policyStepGap}</span>
            </div>
            <div className="bi-docs-timeline-step bi-docs-timeline-step--future">
              <span className="bi-docs-timeline-label">{c.policyStepSunset}</span>
              <span className="bi-docs-timeline-meta">{c.policyStepSunsetSub}</span>
            </div>
          </div>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ Release log ═══ */}
        <section aria-labelledby="changelog-releases" style={{ marginBlock: space[7] }}>
          <div style={kickerStyle}>{c.releasesKicker}</div>
          <h2 id="changelog-releases" style={sectionHeading}>{c.releasesH}</h2>
          <p style={{ marginBlockStart: space[3], color: cssVar.textDim, maxWidth: "62ch" }}>
            {c.releasesBody}
          </p>

          <ol className="bi-changelog-releases" aria-label={c.releasesH}>
            {entries.map((e) => (
              <li key={e.version} className="bi-changelog-release" data-tag={e.tag}>
                <span aria-hidden className="bi-changelog-release-marker">
                  <span className="bi-changelog-release-dot" />
                </span>
                <div className="bi-changelog-release-body">
                  <div className="bi-changelog-release-head">
                    <span className="bi-changelog-release-tag" data-tag={e.tag}>{tagLabel[e.tag]}</span>
                    <code className="bi-changelog-release-version">v{e.version}</code>
                    <time className="bi-changelog-release-date" dateTime={e.date}>
                      {fmtDateL(locale, e.date, { year: "numeric", month: "long", day: "numeric" })}
                    </time>
                  </div>
                  <h3 className="bi-changelog-release-title">{e.title}</h3>
                  <ul className="bi-changelog-release-notes">
                    {e.notes.map((n, i) => <li key={i}>{n}</li>)}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </Container>

      <PulseDivider intensity="dim" />

      {/* ═══ Closing CTA ═══ */}
      <section aria-labelledby="changelog-closing" className="bi-demo-closing-section">
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

              <h2 id="changelog-closing" className="bi-demo-closing-h">
                <span className="bi-demo-closing-h-lead">{c.closingHLead}</span>{" "}
                <span className="bi-demo-closing-h-body">{c.closingHBody}</span>
              </h2>

              <p className="bi-demo-closing-body">{c.closingBody}</p>

              <div className="bi-demo-closing-actions">
                <Link href="/changelog.xml" className="bi-demo-closing-primary">
                  <span className="bi-demo-closing-primary-label">{c.closingPrimary}</span>
                  <span aria-hidden className="bi-demo-closing-primary-sep" />
                  <svg aria-hidden width="15" height="15" viewBox="0 0 15 15" className="bi-demo-closing-primary-arrow">
                    <path d="M2 13c0-6 5-11 11-11M2 8c0-3.3 2.7-6 6-6M3 13a1 1 0 100-2 1 1 0 000 2z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                  </svg>
                </Link>
                <Link href="mailto:hello@bio-ignicion.app?subject=Suscripción%20changelog" className="bi-demo-closing-ghost">
                  <svg aria-hidden width="13" height="13" viewBox="0 0 13 13">
                    <path d="M1.5 3.5h10v6h-10z M1.5 3.5l5 3.5 5-3.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
                  </svg>
                  <span>{c.closingSecondary}</span>
                </Link>
                <Link href="/docs" className="bi-demo-closing-ghost">
                  <svg aria-hidden width="13" height="13" viewBox="0 0 13 13">
                    <path d="M2 2h9v9h-9z M2 4.5h9 M4.5 2v9" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
                  </svg>
                  <span>{c.closingTertiary}</span>
                </Link>
              </div>

              <div className="bi-demo-closing-meta">
                <div className="bi-demo-closing-avail">
                  <span aria-hidden className="bi-demo-closing-avail-pulse">
                    <span className="bi-demo-closing-avail-dot" />
                  </span>
                  <span className="bi-demo-closing-avail-label">{c.footerStatus}</span>
                  <span className="bi-demo-closing-avail-meta">v{latest.version} · {latestDateFmt}</span>
                </div>
                <div className="bi-demo-closing-sig">
                  <span className="bi-demo-closing-sig-name">SemVer 2.0</span>
                  <span className="bi-demo-closing-sig-meta">RFC 8594 · Deprecation + Sunset</span>
                </div>
              </div>
            </div>
          </IgnitionReveal>
        </Container>
      </section>
    </PublicShell>
  );
}
