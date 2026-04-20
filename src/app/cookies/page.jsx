import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, radius, space, font, bioSignal } from "@/components/ui/tokens";
import IgnitionReveal from "@/components/brand/IgnitionReveal";
import BioglyphLattice from "@/components/brand/BioglyphLattice";

export const metadata = { title: "Política de Cookies", alternates: { canonical: "/cookies" } };

export default function Cookies() {
  return (
    <PublicShell activePath="/cookies">
      <Container size="md" className="bi-prose">
        <article style={{ lineHeight: 1.6 }}>
          <header style={{ position: "relative", marginBottom: space[5] }}>
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: `-${space[3]}px -${space[6]}px auto -${space[6]}px`,
                height: 240,
                opacity: 0.16,
                pointerEvents: "none",
                maskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)",
                zIndex: 0,
              }}
            >
              <BioglyphLattice variant="ambient" />
            </div>
            <div style={{ position: "relative", zIndex: 1 }}>
              <IgnitionReveal sparkOrigin="10% 40%">
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
                  COOKIES
                </div>
                <h1 style={{
                  fontSize: "clamp(36px, 5vw, 56px)",
                  fontWeight: font.weight.black,
                  letterSpacing: "-0.035em",
                  margin: `${space[2]}px 0 0`,
                }}>
                  Cuatro, no cuarenta.
                </h1>
                <p
                  style={{
                    fontFamily: "var(--font-editorial), 'Instrument Serif', Georgia, serif",
                    fontStyle: "italic",
                    fontSize: "clamp(18px, 1.8vw, 22px)",
                    lineHeight: 1.35,
                    color: cssVar.textMuted,
                    maxWidth: "44ch",
                    margin: `${space[2]}px 0 ${space[3]}px`,
                  }}
                >
                  Solo las estrictamente necesarias. Ninguna para publicidad.
                </p>
                <p style={{ color: cssVar.textMuted, fontSize: font.size.sm, marginTop: space[2] }}>
                  Qué guardamos y por qué · actualizado <time dateTime="2026-04-16">16 abril 2026</time>
                </p>
              </IgnitionReveal>
            </div>
          </header>

          <div style={{
            marginTop: space[4],
            background: cssVar.surface,
            border: `1px solid ${cssVar.border}`,
            borderRadius: radius.md,
            overflow: "hidden",
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: font.size.sm }}>
              <thead>
                <tr style={{ background: cssVar.surface2 }}>
                  <th style={th}>Nombre</th>
                  <th style={th}>Categoría</th>
                  <th style={th}>Propósito</th>
                  <th style={th}>Duración</th>
                </tr>
              </thead>
              <tbody>
                <tr style={tr}><td style={{ ...td, fontFamily: cssVar.fontMono }}>authjs.session-token</td><td style={td}>Estrictamente necesaria</td><td style={td}>Mantener sesión</td><td style={td}>8 h</td></tr>
                <tr style={tr}><td style={{ ...td, fontFamily: cssVar.fontMono }}>bio-csrf</td><td style={td}>Estrictamente necesaria</td><td style={td}>Protección CSRF</td><td style={td}>8 h</td></tr>
                <tr style={tr}><td style={{ ...td, fontFamily: cssVar.fontMono }}>bio-locale</td><td style={td}>Preferencia</td><td style={td}>Idioma elegido</td><td style={td}>1 año</td></tr>
                <tr style={tr}><td style={{ ...td, fontFamily: cssVar.fontMono }}>bio-consent</td><td style={td}>Preferencia</td><td style={td}>Decisión de cookies</td><td style={td}>1 año</td></tr>
              </tbody>
            </table>
          </div>

          <p style={{ color: cssVar.textMuted, marginTop: space[4], fontSize: font.size.sm }}>
            No usamos cookies de publicidad ni rastreo de terceros. Nuestra telemetría es opt-in y se envía solo si consientes.
          </p>
        </article>
      </Container>
    </PublicShell>
  );
}

const th = {
  textAlign: "left",
  padding: `${space[2]}px ${space[3]}px`,
  fontSize: font.size.xs,
  color: cssVar.textDim,
  fontWeight: font.weight.semibold,
  textTransform: "uppercase",
  letterSpacing: font.tracking.wide,
};

const tr = {
  borderBlockStart: `1px solid ${cssVar.border}`,
};

const td = {
  padding: `${space[2]}px ${space[3]}px`,
  color: cssVar.text,
};
