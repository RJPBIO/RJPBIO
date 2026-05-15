/* ═══════════════════════════════════════════════════════════════
   PWA Showcase — surfaces the install story on the marketing home.

   SP-MKT honestidad: los 3 "phone mockups" SVG con datos fabricados
   (readiness 72, baseline 78, "42 sesiones") fueron eliminados. Eran
   ilustraciones inventadas presentadas como la app. La sección ahora
   se sostiene en lo que es real y verificable: la PWA se instala sin
   app store, corre offline, cifra local-first. Header + benefits +
   platform badges + CTA — cero assets falsos.

   Pure CSS, no raster assets, no runtime JS work.
   ═══════════════════════════════════════════════════════════════ */

import Link from "next/link";

export default function PWAShowcase({ T }) {
  return (
    <div className="bi-pwa-showcase">
      <div className="bi-pwa-header">
        <div className="bi-pwa-kicker">{T.kicker}</div>
        <h3 id="pwa-showcase" className="bi-pwa-h">{T.headline}</h3>
        <p className="bi-pwa-sub">{T.sub}</p>
      </div>

      <ul className="bi-pwa-benefits" aria-label={T.benefitsAria}>
        {T.benefits.map((b, i) => (
          <li key={i} className="bi-pwa-benefit">
            <span className="bi-pwa-bgl" aria-hidden="true">
              <BenefitGlyph name={b.glyph} />
            </span>
            <div>
              <div className="bi-pwa-bt">{b.t}</div>
              <div className="bi-pwa-bd">{b.d}</div>
            </div>
          </li>
        ))}
      </ul>

      <div className="bi-pwa-platforms" aria-label={T.platformsAria}>
        <PlatformBadge
          icon={<IosGlyph />}
          label={T.platforms.ios.label}
          sub={T.platforms.ios.sub}
          href="/app"
        />
        <PlatformBadge
          icon={<AndroidGlyph />}
          label={T.platforms.android.label}
          sub={T.platforms.android.sub}
          href="/app"
        />
        <PlatformBadge
          icon={<BrowserGlyph />}
          label={T.platforms.web.label}
          sub={T.platforms.web.sub}
          href="/app"
          variant="soft"
        />
      </div>

      <div className="bi-pwa-cta">
        <div className="bi-pwa-fomo" role="status" aria-live="polite">
          <span className="dot" aria-hidden="true" />
          <span className="txt">{T.fomo}</span>
        </div>
        <div className="bi-pwa-cta-row">
          <Link href="/app" className="bi-pwa-cta-primary">
            {T.ctaPrimary}
          </Link>
          <Link href="/demo" className="bi-pwa-cta-secondary">
            {T.ctaSecondary}
          </Link>
        </div>
        <p className="bi-pwa-cta-foot">{T.ctaFoot}</p>
      </div>
    </div>
  );
}

/* ─── Platform badge + glyphs ────────────────────────────────── */

function PlatformBadge({ icon, label, sub, href, variant = "solid" }) {
  return (
    <Link
      href={href}
      className={`bi-pwa-badge ${variant === "soft" ? "is-soft" : ""}`}
      aria-label={`${label} — ${sub}`}
    >
      <span className="bi-pwa-badge-icon" aria-hidden="true">{icon}</span>
      <span className="bi-pwa-badge-text">
        <span className="lbl">{label}</span>
        <span className="sub">{sub}</span>
      </span>
    </Link>
  );
}

function IosGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 12.54c-.03-2.76 2.25-4.09 2.35-4.15-1.28-1.87-3.27-2.13-3.98-2.16-1.7-.17-3.31 1-4.17 1-.87 0-2.19-.97-3.6-.95-1.85.03-3.56 1.07-4.51 2.73-1.92 3.33-.49 8.26 1.39 10.97.92 1.33 2.01 2.82 3.44 2.77 1.38-.05 1.9-.89 3.57-.89 1.66 0 2.13.89 3.6.86 1.49-.02 2.43-1.35 3.34-2.69 1.05-1.54 1.48-3.03 1.51-3.11-.03-.02-2.9-1.11-2.94-4.38zM14.3 4.59c.76-.93 1.28-2.21 1.13-3.49-1.1.05-2.43.73-3.22 1.65-.71.82-1.33 2.13-1.16 3.38 1.23.09 2.48-.62 3.25-1.54z"/>
    </svg>
  );
}

function AndroidGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6.25 8.75h11.5v8.5a1.5 1.5 0 0 1-1.5 1.5H15v2.25a1 1 0 1 1-2 0V18.75h-2v2.25a1 1 0 1 1-2 0V18.75H7.75a1.5 1.5 0 0 1-1.5-1.5v-8.5zM4.75 9a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1zm14.5 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1zM8.25 3.2a.55.55 0 0 1 .76-.2l1.34.77a4.98 4.98 0 0 1 3.3 0l1.34-.77a.55.55 0 1 1 .56.96l-1.18.68A5 5 0 0 1 17 8.1H7a5 5 0 0 1 2.63-3.46l-1.18-.68a.55.55 0 0 1-.2-.76zM9.5 6.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5zm5 0a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5z"/>
    </svg>
  );
}

function BrowserGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

/* ─── Benefit glyphs ─────────────────────────────────────────── */

function BenefitGlyph({ name }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  switch (name) {
    case "download":
      return <svg {...common}><path d="M12 4v12m0 0l-5-5m5 5l5-5M4 20h16"/></svg>;
    case "wifi-off":
      return <svg {...common}><path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 12.5a10 10 0 0 1 3-1.9M19 12.5a10 10 0 0 0-6-2.5"/><circle cx="12" cy="20" r="1"/></svg>;
    case "lock":
      return <svg {...common}><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/></svg>;
    case "brain":
      return <svg {...common}><path d="M9 4a3 3 0 0 1 3 3v10a3 3 0 0 1-6 0v-1a2 2 0 0 1-1-3.5A2 2 0 0 1 6 9a3 3 0 0 1 3-5zM15 4a3 3 0 0 0-3 3v10a3 3 0 0 0 6 0v-1a2 2 0 0 0 1-3.5A2 2 0 0 0 18 9a3 3 0 0 0-3-5z"/></svg>;
    case "waves":
      return <svg {...common}><path d="M3 9c2 0 2.5-2 4.5-2S10 9 12 9s2.5-2 4.5-2S19 9 21 9M3 15c2 0 2.5-2 4.5-2S10 15 12 15s2.5-2 4.5-2S19 15 21 15"/></svg>;
    case "clock":
      return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    default:
      return null;
  }
}
