import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font, bioSignal } from "@/components/ui/tokens";
import IgnitionReveal from "@/components/brand/IgnitionReveal";
import BioglyphLattice from "@/components/brand/BioglyphLattice";

export const metadata = {
  title: "Privacidad",
  description: "Política de privacidad de BIO-IGNICIÓN",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <PublicShell activePath="/privacy">
      <Container size="md" className="bi-prose">
        <article style={{ lineHeight: 1.6 }}>
          <header style={{ position: "relative", marginBottom: space[5] }}>
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: `-${space[3]}px -${space[6]}px auto -${space[6]}px`,
                height: 260,
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
                  PRIVACIDAD
                </div>
                <h1 style={{ ...h1Style, fontSize: "clamp(36px, 5vw, 56px)", letterSpacing: "-0.035em", marginBlock: `${space[2]}px 0` }}>
                  Tu sesión, en tu dispositivo.
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
                  Local-first, cifrada, sin telemetría por defecto.
                </p>
                <p style={{ color: cssVar.textMuted, marginTop: 0, fontSize: font.size.sm }}>
                  Actualizado <time dateTime="2026-04-16">16 abril 2026</time>
                </p>
              </IgnitionReveal>
            </div>
          </header>

          <h2 style={h2Style}>Principios</h2>
          <ul style={ulStyle}>
            <li><strong>Local-first:</strong> tus sesiones viven en tu dispositivo, cifradas con AES-GCM 256.</li>
            <li><strong>Sin telemetría por defecto:</strong> no enviamos nada hasta que aceptas.</li>
            <li><strong>Portabilidad total:</strong> exporta o borra tus datos en un clic.</li>
          </ul>

          <h2 style={h2Style}>Datos que guardamos</h2>
          <ul style={ulStyle}>
            <li>Sesiones completadas, duración, protocolo y estado emocional autorreportado.</li>
            <li>Preferencias: tema, sonido, haptics, idioma.</li>
            <li>Línea base neural calibrada.</li>
          </ul>

          <h2 style={h2Style}>Datos que NO guardamos</h2>
          <ul style={ulStyle}>
            <li>Datos biométricos reales (ritmo cardíaco, HRV) salvo conexión explícita a wearable.</li>
            <li>Ubicación, contactos, cámara, micrófono.</li>
            <li>Identificadores publicitarios.</li>
          </ul>

          <h2 style={h2Style}>Tus derechos</h2>
          <p>
            Acceso, rectificación, portabilidad, olvido. Desde{" "}
            <a href="/?tab=perfil" style={linkStyle}>Perfil → Exportar / Borrar</a>.
          </p>

          <h2 style={h2Style}>Contacto</h2>
          <p>
            <a href="mailto:dpo@bio-ignicion.app" style={linkStyle}>dpo@bio-ignicion.app</a>
          </p>
        </article>
      </Container>
    </PublicShell>
  );
}

const h1Style = {
  fontSize: font.size["2xl"],
  fontWeight: font.weight.black,
  letterSpacing: font.tracking.tight,
  marginBottom: space[2],
};

const h2Style = {
  fontSize: font.size.lg,
  fontWeight: font.weight.bold,
  letterSpacing: font.tracking.tight,
  marginTop: space[5],
  marginBottom: space[2],
};

const ulStyle = {
  paddingInlineStart: space[5],
  lineHeight: 1.7,
  color: cssVar.text,
};

const linkStyle = {
  color: cssVar.accent,
  fontWeight: font.weight.semibold,
};
