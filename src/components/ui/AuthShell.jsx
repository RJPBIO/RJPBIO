import Link from "next/link";
import LocaleSelect from "./LocaleSelect";
import { cssVar, radius, space, font, bioSignal } from "./tokens";
import { BioGlyph } from "@/components/BioIgnicionMark";
import BioglyphLattice from "@/components/brand/BioglyphLattice";

const DEFAULT_FOOTER_I18N = {
  es: { privacy: "Privacidad", terms: "Términos", trust: "Confianza" },
  en: { privacy: "Privacy", terms: "Terms", trust: "Trust" },
};

/* ═══════════════════════════════════════════════════════════════
   AuthShell — quiet stage for a single confident gesture.
   When `hero` is supplied, the shell renders a ≥1100px split:
   full-bleed brand panel on the left, form stack on the right.
   Below 1100px, hero hides and the form takes full width.
   ═══════════════════════════════════════════════════════════════ */
export function AuthShell({ children, title, subtitle, kicker, footer, size = "md", side, locale = "es", hero }) {
  const widths = { sm: 380, md: 440, lg: 560 };
  const panelWidth = widths[size] || widths.md;
  const L = locale === "en" ? "en" : "es";
  const FT = DEFAULT_FOOTER_I18N[L];

  return (
    <main className={`bi-authshell-root ${hero ? "has-hero" : ""}`} style={{ fontFamily: cssVar.fontSans }}>
      {hero && <aside className="bi-authshell-hero">{hero}</aside>}

      <div className="bi-authshell-stack">
        {/* Ambient halo behind the form card. Quiet. */}
        <div
          aria-hidden
          style={{
            position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
            backgroundImage: `radial-gradient(60% 50% at 50% 40%, ${bioSignal.phosphorCyan}10, transparent 65%)`,
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
            opacity: 0.22,
            maskImage: "radial-gradient(ellipse at 50% 45%, #000 0%, #000 30%, transparent 72%)",
            WebkitMaskImage: "radial-gradient(ellipse at 50% 45%, #000 0%, #000 30%, transparent 72%)",
          }}
        >
          <BioglyphLattice variant="ambient" />
        </div>

        <header
          style={{
            position: "relative", zIndex: 2,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: `${space[6]}px ${space[7]}px ${space[4]}px`,
            gap: space[4],
          }}
        >
          {/* Always render the brand link — CSS hides it only when the split
              layout is active (≥1100px with hero), so below that breakpoint
              the form side isn't left with the locale/theme controls adrift. */}
          <Link
            href="/"
            className={hero ? "bi-authshell-brand-link" : ""}
            style={{ display: "inline-flex", alignItems: "center", gap: space[3], textDecoration: "none", color: cssVar.text }}
          >
            <BioGlyph size={36} />
            <span
              className="bi-shell-wordmark"
              style={{ fontWeight: font.weight.black, letterSpacing: "0.18em", fontSize: font.size.md }}
            >
              BIO-IGNICIÓN
            </span>
          </Link>
          <div style={{ display: "inline-flex", gap: space[2], alignItems: "center" }}>
            <LocaleSelect variant="compact" />
          </div>
        </header>

        <section
          style={{
            position: "relative", zIndex: 1,
            display: "grid",
            placeItems: "center",
            padding: `${space[4]}px ${space[4]}px ${space[8]}px`,
          }}
        >
          <div
            className="bi-stagger"
            style={{
              position: "relative",
              width: "min(92vw, " + panelWidth + "px)",
              padding: `${space[8]}px ${space[7]}px`,
              background: "color-mix(in srgb, var(--bi-surface) 92%, transparent)",
              border: `1px solid ${cssVar.border}`,
              borderRadius: radius.xl,
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              boxShadow: `0 28px 80px -40px color-mix(in srgb, #000 55%, transparent)`,
            }}
          >
            {title && (
              <header style={{ marginBottom: space[6] }}>
                {kicker && (
                  <div style={{
                    fontFamily: cssVar.fontMono,
                    fontSize: font.size.xs,
                    color: bioSignal.phosphorCyan,
                    textTransform: "uppercase",
                    letterSpacing: "0.22em",
                    fontWeight: font.weight.bold,
                    marginBlockEnd: space[4],
                  }}>
                    {kicker}
                  </div>
                )}
                <h1 style={{
                  margin: 0,
                  fontSize: "clamp(30px, 3.4vw, 40px)",
                  fontWeight: font.weight.black,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.05,
                  color: cssVar.text,
                }}>
                  {title}
                </h1>
                {subtitle && (
                  <p style={{
                    margin: `${space[3]}px 0 0`,
                    color: cssVar.textDim,
                    fontFamily: cssVar.fontSans,
                    fontSize: font.size.md,
                    lineHeight: 1.5,
                    fontWeight: font.weight.regular,
                  }}>
                    {subtitle}
                  </p>
                )}
              </header>
            )}
            {children}
            {side && <div style={{ marginTop: space[6], paddingTop: space[5], borderTop: `1px solid ${cssVar.border}` }}>{side}</div>}
          </div>
        </section>

        <footer
          style={{
            position: "relative", zIndex: 2,
            textAlign: "center",
            padding: `${space[4]}px ${space[6]}px ${space[6]}px`,
            color: cssVar.textMuted,
            fontSize: font.size.sm,
          }}
        >
          {footer || (
            <span>
              <Link href="/privacy" className="bi-auth-link" style={{ color: cssVar.textMuted, marginInline: space[2] }}>{FT.privacy}</Link>·
              <Link href="/terms"   className="bi-auth-link" style={{ color: cssVar.textMuted, marginInline: space[2] }}>{FT.terms}</Link>·
              <Link href="/trust"   className="bi-auth-link" style={{ color: cssVar.textMuted, marginInline: space[2] }}>{FT.trust}</Link>
            </span>
          )}
        </footer>
      </div>
    </main>
  );
}
