import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import LocaleSelect from "./LocaleSelect";
import { cssVar, radius, space, font, bioSignal } from "./tokens";
import { BioGlyph } from "@/components/BioIgnicionMark";

const DEFAULT_FOOTER_I18N = {
  es: { privacy: "Privacidad", terms: "Términos", trust: "Confianza" },
  en: { privacy: "Privacy", terms: "Terms", trust: "Trust" },
};

export function AuthShell({ children, title, subtitle, footer, size = "md", side, locale = "es" }) {
  const widths = { sm: 360, md: 420, lg: 520 };
  const panelWidth = widths[size] || widths.md;
  const L = locale === "en" ? "en" : "es";
  const FT = DEFAULT_FOOTER_I18N[L];

  return (
    <main
      style={{
        position: "relative",
        minHeight: "100dvh",
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        background: cssVar.bg,
        color: cssVar.text,
        fontFamily: cssVar.fontSans,
        overflow: "hidden",
      }}
    >
      {/* Ambient bio-signal glow */}
      <div
        aria-hidden
        style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: [
            `radial-gradient(60% 50% at 15% 10%, ${bioSignal.phosphorCyan}22, transparent 60%)`,
            `radial-gradient(50% 50% at 85% 0%,  ${bioSignal.neuralViolet}22, transparent 60%)`,
            `radial-gradient(70% 60% at 50% 120%, var(--bi-accent) 18%, transparent 65%)`,
          ].join(","),
          filter: "saturate(1.1)",
          animation: "neuralGlow 12s ease-in-out infinite",
        }}
      />
      <header
        style={{
          position: "relative", zIndex: 2,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: `${space[5]}px ${space[6]}px`,
          gap: space[4],
        }}
      >
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: space[2], textDecoration: "none", color: cssVar.text }}>
          <BioGlyph size={24} />
          <span className="bi-shell-wordmark" style={{ fontWeight: font.weight.black, letterSpacing: "1px", fontSize: font.size.lg }}>BIO-IGNICIÓN</span>
        </Link>
        <div style={{ display: "inline-flex", gap: space[2], alignItems: "center" }}>
          <LocaleSelect variant="compact" />
          <ThemeToggle />
        </div>
      </header>

      <section
        style={{
          position: "relative", zIndex: 1,
          display: "grid",
          placeItems: "center",
          padding: `${space[6]}px ${space[4]}px`,
        }}
      >
        <div
          style={{
            position: "relative",
            width: "min(92vw, " + panelWidth + "px)",
            padding: space[8],
            background: "color-mix(in srgb, var(--bi-surface) 88%, transparent)",
            border: `1px solid ${cssVar.border}`,
            borderRadius: radius.xl,
            backdropFilter: "blur(14px) saturate(140%)",
            WebkitBackdropFilter: "blur(14px) saturate(140%)",
            boxShadow: `0 24px 60px -30px color-mix(in srgb, var(--bi-accent) 40%, transparent), 0 2px 0 0 color-mix(in srgb, var(--bi-surface) 50%, transparent) inset`,
            animation: "phaseEnter 0.5s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {title && (
            <header style={{ marginBottom: space[6] }}>
              <h1 style={{
                margin: 0,
                fontSize: font.size["2xl"],
                fontWeight: font.weight.black,
                letterSpacing: font.tracking.tight,
                lineHeight: font.leading.tight,
                color: cssVar.text,
              }}>
                {title}
              </h1>
              {subtitle && (
                <p style={{ margin: `${space[2]}px 0 0`, color: cssVar.textDim, fontSize: font.size.md, lineHeight: font.leading.normal }}>
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
    </main>
  );
}
