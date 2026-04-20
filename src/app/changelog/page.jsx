import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { cssVar, space, font, bioSignal } from "@/components/ui/tokens";
import { CHANGELOG_ENTRIES as entries } from "./entries";
import { tLocale, fmtDateL } from "@/lib/i18n";
import { getServerLocale } from "@/lib/locale-server";
import IgnitionReveal from "@/components/brand/IgnitionReveal";
import BioglyphLattice from "@/components/brand/BioglyphLattice";
import PulseDivider from "@/components/brand/PulseDivider";

export const metadata = {
  title: "Changelog",
  description: "Historial público de cambios, nuevas funciones y correcciones.",
  openGraph: {
    title: "BIO-IGNICIÓN · Changelog",
    description: "Qué hay de nuevo.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
  alternates: { canonical: "/changelog", types: { "application/rss+xml": "/changelog.xml" } },
};

const TAG_KEYS = {
  feature:  { labelKey: "changelog.tagFeature",  fallback: "Nuevo" },
  fix:      { labelKey: "changelog.tagFix",      fallback: "Fix" },
  security: { labelKey: "changelog.tagSecurity", fallback: "Seguridad" },
  release:  { labelKey: "changelog.tagRelease",  fallback: "Release" },
};

export default async function ChangelogPage() {
  const locale = await getServerLocale();
  const T = (k, fb) => {
    const v = tLocale(locale, k);
    return v === k ? fb : v;
  };
  const dateOpts = { year: "numeric", month: "long", day: "numeric" };
  return (
    <PublicShell activePath="/changelog">
      <Container size="md" className="bi-prose">
        <header style={{ marginBottom: space[8], position: "relative" }}>
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: `-${space[4]}px -${space[6]}px auto -${space[6]}px`,
              height: 340,
              opacity: 0.2,
              pointerEvents: "none",
              maskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)",
              zIndex: 0,
            }}
          >
            <BioglyphLattice variant="ambient" />
          </div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <IgnitionReveal sparkOrigin="12% 30%">
              <div
                style={{
                  fontSize: font.size.xs,
                  fontFamily: cssVar.fontMono,
                  color: bioSignal.phosphorCyan,
                  textTransform: "uppercase",
                  letterSpacing: "0.28em",
                  fontWeight: font.weight.bold,
                }}
              >
                {T("changelog.title", "CHANGELOG")}
              </div>
              <h1
                style={{
                  margin: `${space[3]}px 0 ${space[4]}px`,
                  fontSize: "clamp(36px, 5.2vw, 64px)",
                  letterSpacing: "-0.035em",
                  lineHeight: 1.02,
                }}
              >
                {T("changelog.heading", "Qué hay de nuevo")}
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
                {locale === "en"
                  ? "SemVer. 6-month Deprecation/Sunset. No silent breakages."
                  : "SemVer. 6 meses de Deprecation/Sunset. Nada rompe en silencio."}
              </p>
              <p style={{ marginBlockStart: 0 }}>
                {T(
                  "changelog.description",
                  "Cada release usa SemVer. Los breaking changes se anuncian con al menos 6 meses de aviso en headers Deprecation/Sunset (RFC 8594) antes de retirarse.",
                )}
              </p>
              <p style={{ fontSize: font.size.sm, color: cssVar.textMuted, marginBlockStart: space[1] }}>
                <a href="https://semver.org" target="_blank" rel="noopener noreferrer">SemVer</a>
                {" · "}
                <a href="/changelog.xml">RSS</a>
                {" · "}
                <a href="/docs">API docs</a>
              </p>
            </IgnitionReveal>
          </div>
        </header>

        <div style={{ marginBlock: space[5] }}>
          <PulseDivider intensity="dim" />
        </div>

        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: space[3] }}>
          {entries.map((e) => {
            const tag = TAG_KEYS[e.tag] || TAG_KEYS.feature;
            return (
              <Card as="li" key={e.version}>
                <div style={{ display: "flex", alignItems: "center", gap: space[2.5], marginBottom: space[2] }}>
                  <span
                    style={{
                      background: e.tag === "release" ? cssVar.accent : cssVar.accentSoft,
                      color: e.tag === "release" ? cssVar.accentInk : cssVar.accent,
                      padding: "2px 10px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: font.weight.bold,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    {T(tag.labelKey, tag.fallback)}
                  </span>
                  <code style={{ color: cssVar.accent, fontFamily: cssVar.fontMono, fontSize: font.size.md }}>v{e.version}</code>
                  <time style={{ color: cssVar.textMuted, fontSize: font.size.md, marginInlineStart: "auto" }} dateTime={e.date}>
                    {fmtDateL(locale, e.date, dateOpts)}
                  </time>
                </div>
                <h2 style={{ margin: `${space[1]}px 0 ${space[2.5]}px`, fontSize: 18 }}>{e.title}</h2>
                <ul style={{ margin: 0, paddingInlineStart: 22, lineHeight: 1.7 }}>
                  {e.notes.map((n, i) => <li key={i}>{n}</li>)}
                </ul>
              </Card>
            );
          })}
        </ol>
      </Container>
    </PublicShell>
  );
}

