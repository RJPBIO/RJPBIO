export const metadata = { title: "Política de Uso Aceptable" };

export default function AUP() {
  return (
    <article style={{ maxWidth: 760, margin: "0 auto", padding: "36px 24px", color: "#E2E8F0", fontFamily: "system-ui", lineHeight: 1.6 }}>
      <h1>Política de Uso Aceptable (AUP)</h1>
      <p>No está permitido usar BIO-IGNICIÓN para:</p>
      <ul>
        <li>Almacenar datos cuya recolección no tenga base legal (consentimiento, contrato, interés legítimo, etc.).</li>
        <li>Procesar datos de categorías especiales (salud, biometría) sin BAA/DPA firmado.</li>
        <li>Enviar malware, phishing, spam, o intentos de acceso no autorizado.</li>
        <li>Evadir límites de tasa, abusar de APIs, realizar scraping masivo.</li>
        <li>Revender el servicio sin acuerdo explícito.</li>
        <li>Ingeniería inversa, desensamblado o intento de extraer secretos.</li>
      </ul>
      <p>Incumplimiento = suspensión inmediata. Reporta abuso: <a href="mailto:abuse@bio-ignicion.app" style={{ color: "#10B981" }}>abuse@bio-ignicion.app</a>.</p>
    </article>
  );
}
