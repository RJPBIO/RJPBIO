import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font } from "@/components/ui/tokens";

export const metadata = { title: "Política de Uso Aceptable", alternates: { canonical: "/aup" } };

export default function AUP() {
  return (
    <PublicShell activePath="/aup">
      <Container size="md" className="bi-prose">
        <article style={{ lineHeight: 1.6 }}>
          <h1 style={{
            fontSize: font.size["2xl"],
            fontWeight: font.weight.black,
            letterSpacing: font.tracking.tight,
            margin: 0,
          }}>
            Política de Uso Aceptable (AUP)
          </h1>
          <p style={{ color: cssVar.textMuted, fontSize: font.size.sm, marginTop: space[2] }}>
            Versión 1.0 · vigente desde <time dateTime="2026-04-01">1 abril 2026</time>
          </p>

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
