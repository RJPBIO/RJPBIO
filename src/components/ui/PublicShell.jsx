import Link from "next/link";
import { cookies } from "next/headers";
import ThemeToggle from "./ThemeToggle";
import LocaleSelect from "./LocaleSelect";
import CommandPaletteTrigger from "./CommandPaletteTrigger";
import ShellMobileNav from "./ShellMobileNav";
import NavDropdown from "./NavDropdown";
import { Container } from "./Container";
import { cssVar, space, font } from "./tokens";
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
  {
    href: "/for", key: "nav.for", fallback: "Por sector",
    submenu: [
      { href: "/for-healthcare",    title: "Salud",          titleEn: "Healthcare",     desc: "Patient safety y HIPAA",        descEn: "Patient safety & HIPAA",        icon: "✚" },
      { href: "/for-manufacturing", title: "Manufactura",    titleEn: "Manufacturing",  desc: "Occupational safety y OSHA",     descEn: "Occupational safety & OSHA",    icon: "⬢" },
      { href: "/for-finance",       title: "Finanzas",       titleEn: "Finance",        desc: "Trading risk y SOC 2",           descEn: "Trading risk & SOC 2",          icon: "◈" },
      { href: "/for-logistics",     title: "Logística",      titleEn: "Logistics",      desc: "DOT y fleet safety",             descEn: "DOT & fleet safety",            icon: "▸" },
      { href: "/for-tech",          title: "Tech · SRE",     titleEn: "Tech · SRE",     desc: "SRE incident risk",              descEn: "SRE incident risk",             icon: "◉" },
      { href: "/for-aviation",      title: "Aviación",       titleEn: "Aviation",       desc: "Flight safety y FRMS",           descEn: "Flight safety & FRMS",          icon: "◬" },
      { href: "/for-energy",        title: "Energía",        titleEn: "Energy",         desc: "Process safety y API 755",       descEn: "Process safety & API 755",      icon: "⌁" },
      { href: "/for-public-sector", title: "Sector público", titleEn: "Public sector",  desc: "NIST y mission-critical",        descEn: "NIST & mission-critical",       icon: "★" },
    ],
  },
  {
    href: "/learn", key: "nav.learn", fallback: "Aprende",
    submenu: [
      { href: "/learn",                       title: "Hub",                  desc: "Panorama de aprendizaje",        descEn: "Learning overview",            icon: "✦" },
      { href: "/learn/cronotipo",             title: "Cronotipo",            desc: "Descubre tu ventana ignición",    descEn: "Find your ignition window",    icon: "◐" },
      { href: "/learn/hrv-basics",            title: "HRV básico",           desc: "Coherencia cardíaca en 3 min",    descEn: "Cardiac coherence in 3 min",   icon: "♡" },
      { href: "/learn/respiracion-resonante", title: "Respiración resonante", desc: "6 rpm, el patrón madre",         descEn: "6 bpm, the master pattern",    icon: "∿" },
    ],
  },
  { href: "/docs",      key: "nav.docs" },
  { href: "/changelog", key: "nav.changelog" },
  { href: "/trust",     key: "nav.trust" },
  { href: "/status",    key: "nav.status" },
];

const FOOTER_LINKS = {
  product: [
    { href: "/pricing",        labelKey: "nav.pricing",    fallback: "Precios" },
    { href: "/for",            labelKey: "nav.for",        fallback: "Por sector" },
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
      <header role="banner" className="bi-shell-header">
        <span aria-hidden className="bi-shell-header-aura" />
        <span aria-hidden className="bi-shell-header-aura bi-shell-header-aura-end" />
        <Container size="xl" className="bi-shell-header-row">
          <Link href="/" className="bi-shell-brand" aria-label={T("shell.brandHome", "BIO-IGNICIÓN")}>
            <span aria-hidden className="bi-shell-brand-glyph"><BioGlyph size={42} /></span>
            <span aria-hidden className="bi-shell-wordmark">
              <span className="bi-wm-bio">BIO</span>
              <span className="bi-wm-dash">—</span>
              <span className="bi-wm-main">IGNICIÓN</span>
            </span>
          </Link>

          <nav aria-label={T("shell.nav", "Principal")} className="bi-shell-nav bi-shell-nav-desktop">
            {NAV_ITEMS.map((n) => {
              const active = activePath === n.href || (n.submenu && activePath?.startsWith(n.href + "/"));
              const label = T(n.key, n.fallback);
              if (n.submenu) {
                const items = n.submenu.map((s) => ({
                  href: s.href,
                  title: locale === "en" ? (s.titleEn || s.title) : s.title,
                  desc: locale === "en" ? (s.descEn || s.desc) : s.desc,
                  icon: s.icon,
                }));
                return <NavDropdown key={n.href} label={label} href={n.href} active={active} items={items} />;
              }
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className="bi-shell-navlink"
                  data-active={active ? "true" : undefined}
                >
                  <span className="bi-shell-navlink-dot" aria-hidden />
                  <span className="bi-shell-navlink-label">{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="bi-shell-actions">
            <ShellMobileNav
              items={resolvedNav}
              activePath={activePath}
              triggerLabel={T("shell.menu", "Menú")}
              closeLabel={T("shell.close", "Cerrar")}
            />
            <CommandPaletteTrigger searchLabel={T("shell.search", locale === "en" ? "Search" : "Buscar")} />
            <span aria-hidden className="bi-shell-divider" />
            <LocaleSelect variant="compact" />
            <ThemeToggle />
            <Link href={ctaHref} className="bi-nav-cta" aria-label={ctaLabel}>
              <span className="bi-nav-cta-label">{ctaLabel}</span>
              <svg aria-hidden width="12" height="12" viewBox="0 0 12 12" className="bi-nav-cta-arrow">
                <path d="M1.75 6h7.8M6.9 2.75L9.75 6 6.9 9.25" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </Link>
          </div>
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
