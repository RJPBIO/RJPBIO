import Link from "next/link";
import { cookies } from "next/headers";
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
import ConsentManageLink from "@/components/ConsentManageLink";
import StatusPulse from "@/components/StatusPulse";
import AnnouncementBar from "@/components/AnnouncementBar";
import BookDemoTrigger from "@/components/BookDemoTrigger";
import ScrollChrome from "@/components/ScrollChrome";
import MobileStickyCTA from "@/components/MobileStickyCTA";

async function hasSessionCookie() {
  const jar = await cookies();
  return Boolean(jar.get("authjs.session-token") || jar.get("__Secure-authjs.session-token"));
}

/* ═══ Top nav ═══════════════════════════════════════════════════
   Consolidated from 8 top-level items to 5 (Miller's-law range).
   Docs/Changelog/Status collapse under "Desarrolladores". Por qué /
   Aprende / Evidencia / ROI / Demo / Comparativas collapse under
   "Producto". Por sector stays on its own — the 8-industry flyout
   is a legit sector picker, not a menu dump. */
const NAV_ITEMS = [
  {
    href: "/why",
    key: "nav.product",
    fallback: "Producto",
    submenu: [
      { href: "/why",            title: "Por qué",      titleEn: "Why",          desc: "La tesis B2B",                       descEn: "The B2B thesis",                    icon: "◎" },
      { href: "/vs",             title: "Comparativas", titleEn: "Comparatives", desc: "vs Headspace · Calm · Modern Health", descEn: "vs Headspace · Calm · Modern Health", icon: "▤" },
      { href: "/evidencia",      title: "Evidencia",    titleEn: "Evidence",     desc: "DOIs + mecanismos citados",          descEn: "DOIs + cited mechanisms",           icon: "✎" },
      { href: "/learn",          title: "Aprende",      titleEn: "Learn",        desc: "HRV · cronotipo · resonancia",       descEn: "HRV · chronotype · resonance",      icon: "✦" },
      { href: "/roi-calculator", title: "ROI",          titleEn: "ROI",          desc: "Impacto operativo medible",          descEn: "Measurable operational impact",     icon: "∑" },
      { href: "/demo",           title: "Demo",         titleEn: "Demo",         desc: "30 min · sesión en vivo",            descEn: "30 min · live session",             icon: "▶" },
    ],
  },
  { href: "/pricing", key: "nav.pricing", fallback: "Precios" },
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
    href: "/docs",
    key: "nav.developers",
    fallback: "Desarrolladores",
    submenu: [
      { href: "/docs",        title: "Docs API",  titleEn: "API Docs",  desc: "Endpoints, auth, webhooks",      descEn: "Endpoints, auth, webhooks",        icon: "⌘" },
      { href: "/api/openapi", title: "OpenAPI",   titleEn: "OpenAPI",   desc: "Spec 3.1 versionada",            descEn: "Versioned OpenAPI 3.1",            icon: "{ }" },
      { href: "/changelog",   title: "Changelog", titleEn: "Changelog", desc: "SemVer · RFC 8594 Deprecation",  descEn: "SemVer · RFC 8594 Deprecation",     icon: "◷" },
      { href: "/status",      title: "Estado",    titleEn: "Status",    desc: "Uptime e incidencias en vivo",    descEn: "Live uptime and incidents",         icon: "●" },
    ],
  },
  { href: "/trust", key: "nav.trust", fallback: "Confianza" },
];

/* ═══ Footer ════════════════════════════════════════════════════
   5 balanced columns (Stripe/Linear pattern). Previously Producto
   carried 9 items while Desarrolladores carried 3 — visually
   uneven. New split: Producto (5), Recursos (5), Desarrolladores
   (3), Confianza (3), Legal (4). */
const FOOTER_LINKS = {
  product: [
    { href: "/why",     fallback: "Por qué" },
    { href: "/pricing", fallback: "Precios" },
    { href: "/for",     fallback: "Por sector" },
    { href: "/demo",    fallback: "Demo" },
    { href: "/vs",      fallback: "Comparativas" },
  ],
  resources: [
    { href: "/learn",          fallback: "Aprende" },
    { href: "/evidencia",      fallback: "Evidencia" },
    { href: "/roi-calculator", fallback: "ROI" },
    { href: "/changelog",      fallback: "Changelog" },
    { href: "/status",         fallback: "Estado" },
  ],
  developers: [
    { href: "/docs",                     fallback: "Docs" },
    { href: "/api/openapi",              fallback: "OpenAPI" },
    { href: "/.well-known/security.txt", fallback: "security.txt" },
  ],
  trust: [
    { href: "/trust",               fallback: "Trust Center" },
    { href: "/trust/dpa",           fallback: "DPA" },
    { href: "/trust/subprocessors", fallback: "Subprocesadores" },
  ],
  legal: [
    { href: "/privacy", fallback: "Privacidad" },
    { href: "/terms",   fallback: "Términos" },
    { href: "/aup",     fallback: "Uso aceptable" },
    { href: "/cookies", fallback: "Cookies" },
  ],
};

/**
 * PublicShell — layout server-component para rutas de marketing.
 * Resuelve locale server-side y traduce nav/footer antes del paint.
 */
export async function PublicShell({ children, activePath }) {
  const locale = await getServerLocale();
  const T = (k, fb) => tLocale(locale, k) !== k ? tLocale(locale, k) : (fb ?? k);
  // Desktop nav uses NAV_ITEMS directly. Mobile needs a richer shape
  // so the drawer can group submenu items under their parent section
  // instead of flattening away the hierarchy.
  const resolvedMobileNav = NAV_ITEMS.map((n) => ({
    href: n.href,
    label: T(n.key, n.fallback),
    submenu: n.submenu?.map((s) => ({
      href: s.href,
      label: locale === "en" ? (s.titleEn || s.title) : s.title,
    })),
  }));
  const authed = await hasSessionCookie();
  const ctaHref = authed ? "/app" : "/signin";
  const ctaLabel = authed
    ? T("shell.openApp", locale === "en" ? "Open app" : "Abrir app")
    : T("shell.signin", "Entrar");

  return (
    <>
      <AmbientBackdrop />
      <ScrollChrome />
      <AnnouncementBar
        id="kit-launch-2026-04"
        label={{
          es: "Nuevo · Activation Kit para equipos — QR + NFC · trademark B2B",
          en: "New · Team Activation Kit — QR + NFC · B2B trademark",
        }}
        cta={{ es: "Ver placas", en: "See placards" }}
        href="/kit"
      />
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
              // Active when we're on the parent href, OR on any submenu child,
              // OR on a path that begins with a submenu child's prefix. This
              // keeps "Producto" highlighted on /why, /vs, /vs/headspace, etc.
              const onChild = n.submenu?.some(
                (s) => activePath === s.href || activePath?.startsWith(s.href + "/")
              );
              const active = activePath === n.href || Boolean(onChild);
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
              items={resolvedMobileNav}
              activePath={activePath}
              triggerLabel={T("shell.menu", "Menú")}
              closeLabel={T("shell.close", "Cerrar")}
            />
            <CommandPaletteTrigger searchLabel={T("shell.search", locale === "en" ? "Search" : "Buscar")} />
            <span aria-hidden className="bi-shell-divider" />
            <LocaleSelect variant="compact" />
            <BookDemoTrigger
              label={locale === "en" ? "Book demo" : "Agendar demo"}
              className="bi-nav-cta-ghost"
            />
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

      <MobileStickyCTA
        primaryHref={ctaHref}
        primaryLabel={ctaLabel}
        secondaryHref="/demo"
        secondaryLabel={locale === "en" ? "Book demo" : "Demo"}
      />

      <footer role="contentinfo" className="bi-footer-root" style={{ marginTop: space[12] }}>
        <Container size="xl" style={{ paddingBlock: space[10] }}>
          {/* 5-balanced-column layout. minmax 160px lets the grid wrap
              cleanly at tablet (2×3) and phone (1×5) breakpoints. */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: space[8] }}>
            <FooterCol T={T} title={T("footer.product",      "Producto")}        links={FOOTER_LINKS.product} />
            <FooterCol T={T} title={T("footer.resources",    "Recursos")}        links={FOOTER_LINKS.resources} />
            <FooterCol T={T} title={T("footer.developers",   "Desarrolladores")} links={FOOTER_LINKS.developers} />
            <FooterCol T={T} title={T("footer.trust",        "Confianza")}       links={FOOTER_LINKS.trust} />
            <FooterCol T={T} title={T("footer.legal",        "Legal")}           links={FOOTER_LINKS.legal} />
          </div>
          <hr style={{ border: 0, borderTop: `1px solid ${cssVar.border}`, margin: `${space[8]}px 0 ${space[4]}px` }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: space[3], alignItems: "center", justifyContent: "space-between", color: cssVar.textMuted, fontSize: font.size.sm }}>
            <span style={{ display: "inline-flex", gap: space[4], alignItems: "center", flexWrap: "wrap" }}>
              <StatusPulse
                labelOk={locale === "en" ? "All systems operational" : "Todos los sistemas operativos"}
                labelDegraded={locale === "en" ? "Partial degradation" : "Degradación parcial"}
                labelOutage={locale === "en" ? "Service incident" : "Incidente de servicio"}
                labelChecking={locale === "en" ? "Checking…" : "Verificando…"}
              />
              <span style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
                © {new Date().getFullYear()} BIO-IGNICIÓN · {T("footer.rights", "Todos los derechos reservados")}
              </span>
            </span>
            <span style={{ display: "inline-flex", gap: space[4], alignItems: "center", flexWrap: "wrap" }}>
              <ConsentManageLink label={T("consent.manage", "Gestionar cookies")} className="bi-footer-link" />
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
// Silence unused-var lint on FooterCol's T param when a link has no labelKey.
// (All footer links currently use fallbacks only, but keeping T available
// means future i18n keys drop in without re-plumbing.)
