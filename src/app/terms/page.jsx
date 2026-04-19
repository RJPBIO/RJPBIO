import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font } from "@/components/ui/tokens";

export const metadata = { title: "Términos de Servicio", alternates: { canonical: "/terms" } };

export default function Terms() {
  return (
    <PublicShell activePath="/terms">
      <Container size="md" className="bi-prose">
        <article style={{ lineHeight: 1.6 }}>
          <h1 style={h1Style}>Términos de Servicio</h1>
          <p style={{ color: cssVar.textMuted, fontSize: font.size.sm, marginTop: space[2] }}>
            Versión 1.0 · vigentes desde <time dateTime="2026-04-01">1 abril 2026</time>
          </p>

          <h2 style={h2Style}>1. Aceptación</h2>
          <p>Al usar BIO-IGNICIÓN aceptas estos términos. Si representas a una organización, declaras tener autoridad para hacerlo.</p>

          <h2 style={h2Style}>2. Cuenta</h2>
          <p>Eres responsable de proteger tus credenciales. Debes habilitar MFA si tu plan lo requiere.</p>

          <h2 style={h2Style}>3. Uso aceptable</h2>
          <p>
            No podrás usar el servicio para actividades ilegales, automatización abusiva, ingeniería inversa, ni
            para almacenar datos para los cuales no tengas base legal. Ver{" "}
            <a href="/aup" style={linkStyle}>AUP</a>.
          </p>

          <h2 style={h2Style}>4. Propiedad intelectual</h2>
          <p>Tú conservas todos los derechos sobre tus datos. Nos otorgas licencia mínima para operar el servicio.</p>

          <h2 style={h2Style}>5. Confidencialidad</h2>
          <p>
            Aplican nuestro <a href="/trust/dpa" style={linkStyle}>DPA</a> y{" "}
            <a href="/privacy" style={linkStyle}>Aviso de Privacidad</a>.
          </p>

          <h2 style={h2Style}>6. Pagos</h2>
          <p>Los planes se facturan por adelantado mensual o anualmente. Los excedentes se miden y cobran al cierre de ciclo.</p>

          <h2 style={h2Style}>7. Terminación</h2>
          <p>Puedes cerrar tu cuenta en cualquier momento. Nos reservamos el derecho de suspender servicio por incumplimiento material.</p>

          <h2 style={h2Style}>8. Limitación de responsabilidad</h2>
          <p>La responsabilidad agregada no excederá lo pagado en los 12 meses previos al evento.</p>

          <h2 style={h2Style}>9. Ley aplicable</h2>
          <p>Ley mexicana y tribunales de CDMX, sin perjuicio de normas imperativas del consumidor.</p>

          <h2 style={h2Style}>10. Contacto</h2>
          <p>
            <a href="mailto:legal@bio-ignicion.app" style={linkStyle}>legal@bio-ignicion.app</a>
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
  margin: 0,
};

const h2Style = {
  fontSize: font.size.lg,
  fontWeight: font.weight.bold,
  letterSpacing: font.tracking.tight,
  marginTop: space[5],
  marginBottom: space[2],
};

const linkStyle = {
  color: cssVar.accent,
  fontWeight: font.weight.semibold,
};
