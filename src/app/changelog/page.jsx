export const metadata = {
  title: "Changelog · BIO-IGNICIÓN",
  description: "Historial público de cambios, nuevas funciones y correcciones.",
};

// Curated public changelog. Cambios internos (refactors, bumps de deps sin
// impacto visible) no aparecen aquí — para eso está el repo.
const entries = [
  {
    version: "1.2.0",
    date: "2026-04-17",
    tag: "feature",
    title: "Tap-to-Ignite · estaciones NFC/QR",
    notes: [
      "Estaciones físicas con URL estática (tap → sesión en 1 seg).",
      "Políticas por estación: entrada/salida, solo mañana, solo tarde, cualquier horario.",
      "Clave rotable sin reimprimir QR.",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-03-10",
    tag: "feature",
    title: "Panel de equipo con k-anonymity ≥5",
    notes: [
      "Managers ven tendencias agregadas sin poder identificar individuos.",
      "Noise diferencial (ε=1.0) sobre deltas de coherencia y mood.",
      "Cohortes con <5 usuarios se suprimen automáticamente.",
    ],
  },
  {
    version: "1.0.3",
    date: "2026-02-18",
    tag: "security",
    title: "CSRF double-submit Edge-compatible",
    notes: [
      "Token opaco emitido por middleware Edge (Web Crypto only).",
      "Header x-csrf-token requerido en POST/PUT/PATCH/DELETE navegador→servidor.",
      "Bearer API keys exentas (server-to-server).",
    ],
  },
  {
    version: "1.0.2",
    date: "2026-01-28",
    tag: "fix",
    title: "AudioContext zombie recovery",
    notes: [
      "Detecta AC en estado closed y lo reconstruye sin requerir reload.",
      "Binaural rotatePan captura gain local para evitar fugas de rAF entre ciclos.",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-01-15",
    tag: "release",
    title: "Lanzamiento público",
    notes: [
      "PWA local-first con IndexedDB cifrado.",
      "Motor neural adaptativo (prescriptor de protocolos).",
      "SSO (SAML/OIDC), SCIM 2.0, WebAuthn + TOTP.",
      "Audit log con hash chain SHA-256 verificable.",
      "Trust Center, DPA descargable, exports GDPR.",
    ],
  },
];

const TAG_STYLES = {
  feature:  { bg: "#064E3B", fg: "#6EE7B7", label: "Nuevo" },
  fix:      { bg: "#1F2937", fg: "#FCA5A5", label: "Fix" },
  security: { bg: "#422006", fg: "#FDBA74", label: "Seguridad" },
  release:  { bg: "#10B981", fg: "#052E16", label: "Release" },
};

export default function ChangelogPage() {
  return (
    <main style={page}>
      <header style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, color: "#6EE7B7", textTransform: "uppercase", letterSpacing: 2 }}>Changelog</div>
        <h1 style={{ margin: "6px 0", fontSize: 34, fontWeight: 800 }}>Qué hay de nuevo</h1>
        <p style={{ color: "#A7F3D0", maxWidth: 640 }}>
          Versionado <a href="https://semver.org" style={link} rel="noopener noreferrer">SemVer</a>.
          Feed RSS: <a href="/changelog.xml" style={link}>/changelog.xml</a> (próximamente) ·
          Docs API: <a href="/docs" style={link}>/docs</a>
        </p>
      </header>

      <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {entries.map((e) => {
          const t = TAG_STYLES[e.tag] || TAG_STYLES.feature;
          return (
            <li key={e.version} style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ background: t.bg, color: t.fg, padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                  {t.label}
                </span>
                <code style={{ color: "#6EE7B7", fontSize: 13 }}>v{e.version}</code>
                <time style={{ color: "#6B7280", fontSize: 12, marginLeft: "auto" }} dateTime={e.date}>
                  {new Date(e.date).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}
                </time>
              </div>
              <h2 style={{ margin: "4px 0 10px", fontSize: 18, fontWeight: 700 }}>{e.title}</h2>
              <ul style={{ margin: 0, paddingLeft: 22, lineHeight: 1.7, color: "#D1FAE5", fontSize: 14 }}>
                {e.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </li>
          );
        })}
      </ol>
    </main>
  );
}

const page = { minHeight: "100dvh", background: "#0B0E14", color: "#ECFDF5", padding: "40px 24px", maxWidth: 760, margin: "0 auto" };
const card = { padding: 18, marginBottom: 14, background: "rgba(5,150,105,.06)", border: "1px solid #064E3B", borderRadius: 14 };
const link = { color: "#6EE7B7", textDecoration: "underline" };
