export const CHANGELOG_ENTRIES = [
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
      "Managers ven tendencias agregadas sin identificar individuos.",
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
