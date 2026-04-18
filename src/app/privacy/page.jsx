import { cssVar, space, font } from "@/components/ui/tokens";

export const metadata = {
  title: "Privacidad",
  description: "Política de privacidad de BIO-IGNICIÓN",
};

export default function PrivacyPage() {
  return (
    <article style={wrap}>
      <h1 style={h1Style}>Privacidad</h1>
      <p style={{ color: cssVar.textMuted, marginTop: 0, fontSize: font.size.sm }}>
        Actualizado: 2026-04-16
      </p>

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
      <p>dpo@bio-ignicion.example</p>
    </article>
  );
}

const wrap = {
  maxWidth: 720,
  margin: "0 auto",
  padding: `${space[6]}px ${space[5]}px`,
  color: cssVar.text,
  fontFamily: cssVar.fontSans,
  lineHeight: 1.6,
};

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
