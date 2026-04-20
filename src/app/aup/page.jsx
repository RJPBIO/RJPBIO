import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font, bioSignal } from "@/components/ui/tokens";
import IgnitionReveal from "@/components/brand/IgnitionReveal";
import BioglyphLattice from "@/components/brand/BioglyphLattice";

export const metadata = { title: "Política de Uso Aceptable", alternates: { canonical: "/aup" } };

export default function AUP() {
  return (
    <PublicShell activePath="/aup">
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
                  AUP
                </div>
                <h1 style={{
                  fontSize: "clamp(36px, 5vw, 56px)",
                  fontWeight: font.weight.black,
                  letterSpacing: "-0.035em",
                  margin: `${space[2]}px 0 0`,
                }}>
                  Para qué se usa. Y para qué no.
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
                  Una herramienta clínica seria necesita reglas claras. Estas.
                </p>
                <p style={{ color: cssVar.textMuted, fontSize: font.size.sm, marginTop: space[2] }}>
                  Versión 1.0 · vigente desde <time dateTime="2026-04-01">1 abril 2026</time>
                </p>
              </IgnitionReveal>
            </div>
          </header>

          <p style={{ marginTop: space[4] }}>No está permitido usar BIO-IGNICIÓN para:</p>
          <ul style={{ paddingInlineStart: space[5], lineHeight: 1.7 }}>
            <li>Almacenar datos cuya recolección no tenga base legal (consentimiento, contrato, interés legítimo, etc.).</li>
            <li>Procesar datos de categorías especiales (salud, biometría) sin BAA/DPA firmado.</li>
            <li>Enviar malware, phishing, spam, o intentos de acceso no autorizado.</li>
            <li>Evadir límites de tasa, abusar de APIs, realizar scraping masivo.</li>
            <li>Revender el servicio sin acuerdo explícito.</li>
            <li>Ingeniería inversa, desensamblado o intento de extraer secretos.</li>
          </ul>

          <p style={{ marginTop: space[4] }}>
            Incumplimiento = suspensión inmediata. Reporta abuso:{" "}
            <a href="mailto:abuse@bio-ignicion.app" style={{
              color: cssVar.accent,
              fontWeight: font.weight.semibold,
            }}>
              abuse@bio-ignicion.app
            </a>.
          </p>
        </article>
      </Container>
    </PublicShell>
  );
}
