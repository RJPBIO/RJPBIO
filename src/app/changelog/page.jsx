import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { cssVar, space, font } from "@/components/ui/tokens";
import { CHANGELOG_ENTRIES as entries } from "./entries";
import { tLocale, fmtDateL } from "@/lib/i18n";
import { getServerLocale } from "@/lib/locale-server";

export const metadata = {
  title: "Changelog",
  description: "Historial público de cambios, nuevas funciones y correcciones.",
  openGraph: {
    title: "BIO-IGNICIÓN · Changelog",
    description: "Qué hay de nuevo.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
  alternates: { types: { "application/rss+xml": "/changelog.xml" } },
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
        <header style={{ marginBottom: space[8] }}>
          <div style={{ fontSize: font.size.sm, color: cssVar.accent, textTransform: "uppercase", letterSpacing: "2px", fontWeight: font.weight.bold }}>
            {T("changelog.title", "Changelog")}
          </div>
          <h1 style={{ margin: `${space[2]}px 0` }}>{T("changelog.heading", "Qué hay de nuevo")}</h1>
          <p>
            {T("changelog.description", "Historial público de cambios. RSS disponible.")} ·{" "}
            <a href="https://semver.org" rel="noopener noreferrer">SemVer</a> · RSS:{" "}
            <a href="/changelog.xml">/changelog.xml</a> · <a href="/docs">/docs</a>
          </p>
        </header>

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

