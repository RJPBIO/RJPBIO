export const metadata = {
  title: "Privacidad",
  description: "Política de privacidad de BIO-IGNICIÓN",
};

export default function PrivacyPage() {
  return (
    <article
      style={{
        maxWidth: 720, margin: "0 auto", padding: "32px 20px",
        color: "#E2E8F0", fontFamily: "system-ui, sans-serif", lineHeight: 1.6,
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Privacidad</h1>
      <p style={{ color: "#94A3B8", marginTop: 0 }}>Actualizado: 2026-04-16</p>

      <h2>Principios</h2>
      <ul>
        <li><strong>Local-first:</strong> tus sesiones viven en tu dispositivo, cifradas con AES-GCM 256.</li>
        <li><strong>Sin telemetría por defecto:</strong> no enviamos nada hasta que aceptas.</li>
        <li><strong>Portabilidad total:</strong> exporta o borra tus datos en un clic.</li>
      </ul>

      <h2>Datos que guardamos</h2>
      <ul>
        <li>Sesiones completadas, duración, protocolo y estado emocional autorreportado.</li>
        <li>Preferencias: tema, sonido, haptics, idioma.</li>
        <li>Línea base neural calibrada.</li>
      </ul>

      <h2>Datos que NO guardamos</h2>
      <ul>
        <li>Datos biométricos reales (ritmo cardíaco, HRV) salvo conexión explícita a wearable.</li>
        <li>Ubicación, contactos, cámara, micrófono.</li>
        <li>Identificadores publicitarios.</li>
      </ul>

      <h2>Tus derechos</h2>
      <p>Acceso, rectificación, portabilidad, olvido. Desde <a href="/?tab=perfil" style={{ color: "#10B981" }}>Perfil → Exportar / Borrar</a>.</p>

      <h2>Contacto</h2>
      <p>dpo@bio-ignicion.example</p>
    </article>
  );
}
