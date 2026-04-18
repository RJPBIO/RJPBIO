import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import LocaleSelect from "./LocaleSelect";
import { cssVar, radius, space, font, bioSignal } from "./tokens";

/**
 * AuthShell — shell compartido para todas las rutas de auth (signin, signup,
 * recover, mfa, verify, account). Centra un panel glass, añade ambient
 * bio-signal radial glow y cabecera mínima con brand + controles de idioma/tema.
 *
 * Server-component. El contenido puede ser client o server.
 */
export function AuthShell({ children, title, subtitle, footer, size = "md", side }) {
  const widths = { sm: 360, md: 420, lg: 520 };
  const panelWidth = widths[size] || widths.md;

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
          <span aria-hidden style={{
            width: 24, height: 24, borderRadius: radius.sm,
            background: `conic-gradient(from 180deg, var(--bi-accent), ${bioSignal.phosphorCyan}, ${bioSignal.ignition}, var(--bi-accent))`,
            boxShadow: `0 0 22px var(--bi-accent)`,
            animation: "orbFloat 6s ease-in-out infinite",
          }} />
          <span style={{ fontWeight: font.weight.black, letterSpacing: font.tracking.wider, fontSize: font.size.lg }}>BIO-IGN</span>
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
            <Link href="/privacy" style={{ color: cssVar.textMuted, marginInline: space[2] }}>Privacidad</Link>·
            <Link href="/terms"   style={{ color: cssVar.textMuted, marginInline: space[2] }}>Términos</Link>·
            <Link href="/trust"   style={{ color: cssVar.textMuted, marginInline: space[2] }}>Confianza</Link>
          </span>
        )}
      </footer>
    </main>
  );
}
