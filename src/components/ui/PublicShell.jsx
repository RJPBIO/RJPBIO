import Link from "next/link";
import { cookies } from "next/headers";
import ThemeToggle from "./ThemeToggle";
import LocaleSelect from "./LocaleSelect";
import CommandPaletteTrigger from "./CommandPaletteTrigger";
import ShellMobileNav from "./ShellMobileNav";
import { Container } from "./Container";
import { cssVar, radius, space, font } from "./tokens";
import { tLocale } from "@/lib/i18n";
import { getServerLocale } from "@/lib/locale-server";
import { BioGlyph } from "@/components/BioIgnicionMark";
import AmbientBackdrop from "@/components/brand/AmbientBackdrop";

async function hasSessionCookie() {
  const jar = await cookies();
  return Boolean(jar.get("authjs.session-token") || jar.get("__Secure-authjs.session-token"));
}

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
  const resolvedNav = NAV_ITEMS.map((n) => ({ href: n.href, label: T(n.key, n.fallback) }));
  const authed = await hasSessionCookie();
  const ctaHref = authed ? "/app" : "/signin";
  const ctaLabel = authed
    ? T("shell.openApp", locale === "en" ? "Open app" : "Abrir app")
    : T("shell.signin", "Entrar");

  return (
    <>
      <AmbientBackdrop />
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
          <Link href="/" className="bi-shell-brand" style={{ display: "inline-flex", alignItems: "center", gap: space[2], textDecoration: "none", color: cssVar.text }} aria-label={T("shell.brandHome", "BIO-IGNICIÓN")}>
            <BioGlyph size={24} />
            <span className="bi-shell-wordmark" style={{ fontWeight: font.weight.black, letterSpacing: "0.18em", fontSize: font.size.md }}>BIO-IGNICIÓN</span>
          </Link>
          <nav aria-label={T("shell.nav", "Principal")} className="bi-shell-nav bi-shell-nav-desktop" style={{ display: "flex", gap: space[5], marginInlineStart: "auto", flexWrap: "wrap", rowGap: space[2] }}>
            {NAV_ITEMS.map((n) => {
              const active = activePath === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className="bi-shell-navlink"
                  data-active={active ? "true" : undefined}
                >
                  {T(n.key, n.fallback)}
                </Link>
              );
            })}
          </nav>
          <ShellMobileNav
            items={resolvedNav}
            activePath={activePath}
            triggerLabel={T("shell.menu", "Menú")}
            closeLabel={T("shell.close", "Cerrar")}
          />
          <CommandPaletteTrigger />
          <LocaleSelect variant="compact" />
          <ThemeToggle />
          <Link
            href={ctaHref}
            className="bi-nav-cta"
            style={{
              padding: `${space[2]}px ${space[5]}px`,
              borderRadius: radius.full,
              textDecoration: "none",
              fontWeight: font.weight.bold,
              fontSize: font.size.md,
              minBlockSize: 40,
              display: "inline-flex",
              alignItems: "center",
              gap: space[2],
            }}
          >
            {ctaLabel}
          </Link>
        </Container>
      </header>

      <div style={{ minHeight: "calc(100dvh - 200px)" }}>
        {children}
      </div>

      <footer role="contentinfo" className="bi-footer-root" style={{ marginTop: space[12] }}>
        <Container size="xl" style={{ paddingBlock: space[10] }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: space[8] }}>
            <FooterCol T={T} title={T("footer.product", "Producto")}      links={FOOTER_LINKS.product} />
            <FooterCol T={T} title={T("footer.developers", "Desarrolladores")} links={FOOTER_LINKS.developers} />
            <FooterCol T={T} title={T("footer.legal", "Legal")}            links={FOOTER_LINKS.legal} />
            <FooterCol T={T} title={T("footer.trust", "Confianza")}        links={FOOTER_LINKS.trust} />
          </div>
          <hr style={{ border: 0, borderTop: `1px solid ${cssVar.border}`, margin: `${space[8]}px 0 ${space[4]}px` }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: space[3], alignItems: "center", justifyContent: "space-between", color: cssVar.textMuted, fontSize: font.size.sm }}>
            <span style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
              © {new Date().getFullYear()} BIO-IGNICIÓN · {T("footer.rights", "Todos los derechos reservados")}
            </span>
            <span>
              <address style={{ display: "inline", fontStyle: "normal" }}>
                <a href="mailto:hello@bio-ignicion.app" className="bi-footer-link">hello@bio-ignicion.app</a>
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
    <nav aria-label={title}>
      <h2 className="bi-footer-heading">{title}</h2>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: space[2] }}>
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="bi-footer-link">
              {l.labelKey ? T(l.labelKey, l.fallback) : l.fallback}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
