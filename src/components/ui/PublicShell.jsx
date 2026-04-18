import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import LocaleSelect from "./LocaleSelect";
import CommandPaletteTrigger from "./CommandPaletteTrigger";
import { Container } from "./Container";
import { cssVar, radius, space, font } from "./tokens";
import { tLocale } from "@/lib/i18n";
import { getServerLocale } from "@/lib/locale-server";

const NAV_ITEMS = [
  { href: "/pricing",   key: "nav.pricing" },
  { href: "/learn",     key: "nav.learn",     fallback: "Aprende" },
  { href: "/docs",      key: "nav.docs" },
  { href: "/changelog", key: "nav.changelog" },
  { href: "/trust",     key: "nav.trust" },
  { href: "/status",    key: "nav.status" },
];

const FOOTER_LINKS = {
  product: [
    { href: "/pricing",        labelKey: "nav.pricing",    fallback: "Precios" },
    { href: "/demo",           labelKey: "nav.demo",       fallback: "Demo" },
    { href: "/learn",          labelKey: "nav.learn",      fallback: "Aprende" },
    { href: "/evidencia",      labelKey: null,             fallback: "Evidencia" },
    { href: "/roi-calculator", labelKey: "nav.roi",        fallback: "ROI" },
    { href: "/changelog",      labelKey: "nav.changelog",  fallback: "Changelog" },
  ],
  developers: [
    { href: "/docs",         labelKey: "nav.docs",   fallback: "Docs API" },
    { href: "/api/openapi",  labelKey: null,         fallback: "OpenAPI" },
    { href: "/status",       labelKey: "nav.status", fallback: "Status" },
  ],
  legal: [
    { href: "/privacy", labelKey: "privacy.title", fallback: "Privacidad" },
    { href: "/terms",   labelKey: null,            fallback: "Términos" },
    { href: "/aup",     labelKey: null,            fallback: "Uso aceptable" },
    { href: "/cookies", labelKey: null,            fallback: "Cookies" },
  ],
  trust: [
    { href: "/trust",                  labelKey: null, fallback: "Trust Center" },
    { href: "/trust/dpa",              labelKey: null, fallback: "DPA" },
    { href: "/trust/subprocessors",    labelKey: null, fallback: "Subprocesadores" },
    { href: "/.well-known/security.txt", labelKey: null, fallback: "security.txt" },
  ],
};

/**
 * PublicShell — layout server-component para rutas de marketing.
 * Resuelve locale server-side y traduce nav/footer antes del paint.
 */
export async function PublicShell({ children, activePath }) {
  const locale = await getServerLocale();
  const T = (k, fb) => tLocale(locale, k) !== k ? tLocale(locale, k) : (fb ?? k);

  return (
    <>
      <header
        role="banner"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 60,
          backdropFilter: "saturate(180%) blur(12px)",
          background: "color-mix(in srgb, var(--bi-bg) 82%, transparent)",
          borderBottom: `1px solid ${cssVar.border}`,
        }}
      >
        <Container size="xl" style={{ paddingBlock: space[3], display: "flex", alignItems: "center", gap: space[4], flexWrap: "wrap" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: space[2], textDecoration: "none", color: cssVar.text }} aria-label={T("shell.brandHome", "BIO-IGNICIÓN")}>
            <span aria-hidden style={{
              width: 22, height: 22, borderRadius: radius.sm,
              background: `conic-gradient(from 180deg, var(--bi-accent), #22D3EE, #FDE68A, var(--bi-accent))`,
              boxShadow: `0 0 18px var(--bi-accent)`,
            }} />
            <span style={{ fontWeight: font.weight.black, letterSpacing: "1px", fontSize: font.size.lg }}>BIO-IGN</span>
          </Link>
          <nav aria-label={T("shell.nav", "Principal")} style={{ display: "flex", gap: space[4], marginInlineStart: "auto", flexWrap: "wrap" }}>
            {NAV_ITEMS.map((n) => {
              const active = activePath === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  style={{
                    color: active ? cssVar.text : cssVar.textDim,
                    textDecoration: "none",
                    fontSize: font.size.lg,
                    fontWeight: font.weight.semibold,
                    borderBottom: active ? `2px solid ${cssVar.accent}` : "2px solid transparent",
                    paddingBlock: 2,
                  }}
                >
                  {T(n.key, n.fallback)}
                </Link>
              );
            })}
          </nav>
          <CommandPaletteTrigger />
          <LocaleSelect variant="compact" />
          <ThemeToggle />
          <Link
            href="/signin"
            style={{
              padding: `${space[1.5]}px ${space[3]}px`,
              borderRadius: radius.full,
              background: cssVar.accent,
              color: cssVar.accentInk,
              textDecoration: "none",
              fontWeight: font.weight.bold,
              fontSize: font.size.md,
            }}
          >
            {T("shell.signin", "Entrar")}
          </Link>
        </Container>
      </header>

      <div style={{ minHeight: "calc(100dvh - 200px)" }}>
        {children}
      </div>

      <footer role="contentinfo" style={{ borderTop: `1px solid ${cssVar.border}`, marginTop: space[12], background: cssVar.surface }}>
        <Container size="xl" style={{ paddingBlock: space[10] }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: space[8] }}>
            <FooterCol T={T} title={T("footer.product", "Producto")}      links={FOOTER_LINKS.product} />
            <FooterCol T={T} title={T("footer.developers", "Desarrolladores")} links={FOOTER_LINKS.developers} />
            <FooterCol T={T} title={T("footer.legal", "Legal")}            links={FOOTER_LINKS.legal} />
            <FooterCol T={T} title={T("footer.trust", "Confianza")}        links={FOOTER_LINKS.trust} />
          </div>
          <hr style={{ border: 0, borderTop: `1px solid ${cssVar.border}`, margin: `${space[8]}px 0 ${space[4]}px` }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: space[3], alignItems: "center", justifyContent: "space-between", color: cssVar.textMuted, fontSize: font.size.sm }}>
            <span>© {new Date().getFullYear()} BIO-IGNICIÓN · {T("footer.handcrafted", "Hecho con rigor en Chihuahua, MX")}</span>
            <span>
              <address style={{ display: "inline", fontStyle: "normal" }}>
                <a href="mailto:hello@bio-ignicion.app" style={{ color: cssVar.textDim }}>hello@bio-ignicion.app</a>
              </address>
            </span>
          </div>
        </Container>
      </footer>
    </>
  );
}

function FooterCol({ title, links, T }) {
  return (
    <div>
      <div style={{ fontSize: font.size.sm, fontWeight: font.weight.bold, color: cssVar.accent, textTransform: "uppercase", letterSpacing: "2px", marginBottom: space[3] }}>
        {title}
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: space[2] }}>
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} style={{ color: cssVar.textDim, textDecoration: "none", fontSize: font.size.lg }}>
              {l.labelKey ? T(l.labelKey, l.fallback) : l.fallback}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
