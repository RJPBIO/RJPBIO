import { cssVar, space, font } from "@/components/ui/tokens";

export const metadata = { title: "Política de Uso Aceptable" };

export default function AUP() {
  return (
    <article style={{
      maxWidth: 760,
      margin: "0 auto",
      padding: `${space[6]}px ${space[4]}px`,
      color: cssVar.text,
      fontFamily: cssVar.fontSans,
      lineHeight: 1.6,
    }}>
      <h1 style={{
        fontSize: font.size["2xl"],
        fontWeight: font.weight.black,
        letterSpacing: font.tracking.tight,
        margin: 0,
      }}>
        Política de Uso Aceptable (AUP)
      </h1>

      <p style={{ marginTop: space[3] }}>No está permitido usar BIO-IGNICIÓN para:</p>
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
  );
}
