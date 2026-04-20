/* ═══════════════════════════════════════════════════════════════
   /privacy — Aviso de privacidad. GDPR (UE), LFPDPPP (MX), CCPA (CA).
   Lawful bases explícitas, subprocesadores en /trust/subprocessors,
   DPO de contacto, retención por categoría. Divulgación expresa de
   pipeline de anonimización y retención indefinida de datos disociados
   (GDPR Recital 26 · LFPDPPP Art. 3.VIII). Procurement-ready.
   ═══════════════════════════════════════════════════════════════ */

import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font, bioSignal } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";
import IgnitionReveal from "@/components/brand/IgnitionReveal";
import BioglyphLattice from "@/components/brand/BioglyphLattice";
import PulseDivider from "@/components/brand/PulseDivider";

export const metadata = {
  title: "Privacidad",
  description: "Aviso de privacidad · GDPR, LFPDPPP, CCPA · cifrado AES-GCM 256 · datos anonimizados retenidos para investigación bajo Recital 26.",
  alternates: { canonical: "/privacy" },
};

const LAST_UPDATED = "2026-04-20";
const VERSION = "2.2";

const kickerStyle = {
  fontFamily: cssVar.fontMono,
  fontSize: font.size.xs,
  color: bioSignal.phosphorCyan,
  textTransform: "uppercase",
  letterSpacing: "0.24em",
  fontWeight: font.weight.bold,
  marginBlockEnd: space[3],
};

const sectionHeading = {
  margin: 0,
  fontSize: "clamp(22px, 2.6vw, 28px)",
  letterSpacing: "-0.02em",
  lineHeight: 1.2,
  fontWeight: font.weight.black,
  color: cssVar.text,
};

const COPY = {
  es: {
    eyebrow: "AVISO DE PRIVACIDAD",
    title: "Tu sesión, en tu dispositivo.",
    editorial: "Local-first, cifrada, sin telemetría de marketing por defecto.",
    intro:
      "Este aviso describe qué datos tratamos, con qué base legal, cuánto tiempo los conservamos, cómo ejerces tus derechos y qué hacemos con datos anonimizados. Cumple con GDPR (UE 2016/679), LFPDPPP (México) y CCPA/CPRA (California).",
    updated: "Actualizado",
    version: "Versión",
    toc: "Índice",

    statEncryption: "Cifrado en reposo",
    statEncryptionSub: "local y en servidor",
    statTrackers: "Trackers de terceros",
    statTrackersSub: "sin analytics de marketing",
    statBreach: "Aviso de brecha",
    statBreachSub: "GDPR Art. 33",
    statDPO: "DPO de contacto",
    statDPOSub: "respuesta en <72 h",

    s1Kicker: "01 · PRINCIPIOS",
    s1H: "Tres promesas que sostienen todo lo demás.",
    s1L1: "Local-first: tus sesiones viven en tu dispositivo, cifradas con AES-GCM 256 antes de tocar IndexedDB.",
    s1L2: "Minimización: recolectamos solo lo que necesitamos para operar el servicio e investigar con datos disociados.",
    s1L3: "Portabilidad: exporta o solicita el borrado de tus datos personales identificables en un clic desde Perfil → Exportar/Borrar. El alcance del borrado se describe en § 07.",

    s2Kicker: "02 · DATOS QUE TRATAMOS",
    s2H: "Qué guardamos y con qué base legal.",
    s2Body: "Tratamos estas categorías bajo las bases del Art. 6 GDPR y el Art. 8 LFPDPPP:",
    s2R1Cat: "Cuenta",
    s2R1Data: "Email, nombre, preferencias (tema, sonido, idioma).",
    s2R1Basis: "Contrato (Art. 6.1.b)",
    s2R2Cat: "Uso",
    s2R2Data: "Sesiones completadas, duración, protocolo, estado autorreportado, línea base neural calibrada.",
    s2R2Basis: "Contrato (Art. 6.1.b)",
    s2R3Cat: "Pago",
    s2R3Data: "Identificador de suscripción y recibos. El número de tarjeta lo procesa Stripe (no lo vemos).",
    s2R3Basis: "Obligación legal (Art. 6.1.c)",
    s2R4Cat: "Telemetría",
    s2R4Data: "Métricas de uso agregadas — solo si activas el opt-in explícito.",
    s2R4Basis: "Consentimiento (Art. 6.1.a)",
    s2R5Cat: "Logs de seguridad",
    s2R5Data: "IP truncada, user-agent, evento de auth. Retención 90 días.",
    s2R5Basis: "Interés legítimo (Art. 6.1.f)",
    s2R6Cat: "Prevención de fraude",
    s2R6Data: "Señales agregadas de abuso, device fingerprint reducido (sin cross-site tracking), patrones de uso anómalos.",
    s2R6Basis: "Interés legítimo (Art. 6.1.f)",
    s2TableCat: "Categoría",
    s2TableData: "Qué incluye",
    s2TableBasis: "Base legal",

    s3Kicker: "03 · INVESTIGACIÓN Y MEJORA DEL PRODUCTO",
    s3H: "Datos anonimizados como motor de mejora continua.",
    s3Body1:
      "BIO-IGNICIÓN opera un motor neural adaptativo que mejora con la escala del uso. Para que el motor siga evolucionando — y para que la comunidad de usuarios se beneficie de hallazgos agregados — aplicamos una pipeline de anonimización sobre datos de uso y línea base calibrada. Una vez disociados de tu identidad conforme a GDPR Recital 26 y LFPDPPP Art. 3.VIII, los datos dejan de ser datos personales y su conservación es indefinida.",
    s3Body2:
      "Anonimización irreversible significa: eliminación de identificadores directos (email, nombre, IDs), reducción de cuasi-identificadores (timestamps a bucketing, ubicación a nivel país), aplicación de k-anonimidad ≥5 en cohortes publicadas y ruido diferencial (ε ≤1.0) en métricas agregadas. Auditable bajo NDA para clientes enterprise.",
    s3L1: "Mejora del motor neural: entrenamos modelos internos con datos anonimizados y agregados para refinar la selección adaptativa de protocolos.",
    s3L2: "Benchmarks y publicación: podemos publicar hallazgos agregados (cohortes ≥5 usuarios, sin reidentificación razonable) en papers, changelogs o casos de estudio.",
    s3L3: "No entrenamos modelos de IA con datos personales identificables. No compartimos el dataset con terceros para entrenamiento de modelos competidores.",
    s3L4: "Si prefieres no contribuir: puedes solicitar exclusión explícita escribiendo a dpo@bio-ignicion.app. Tu exclusión aplica desde la solicitud hacia adelante; los datos ya anonimizados e incorporados a agregados estadísticos no son reversibles por definición.",
    s3FootBasis: "Bases legales: interés legítimo (Art. 6.1.f) para datos anonimizados durante la disociación · Recital 26 GDPR y Art. 3.VIII LFPDPPP para datos ya disociados · consentimiento opt-in (Art. 6.1.a) para contribución a cohortes nominadas de investigación.",
    s3FootKicker: "BASES LEGALES · INVESTIGACIÓN",

    s4Kicker: "04 · DATOS QUE NO TRATAMOS",
    s4H: "Lo que nunca capturamos, aunque podríamos.",
    s4L1: "Datos biométricos reales (ritmo cardíaco, HRV) salvo que conectes un wearable con consentimiento explícito.",
    s4L2: "Ubicación GPS precisa, contactos, cámara o micrófono del dispositivo.",
    s4L3: "Identificadores publicitarios (IDFA, AAID) ni huellas de dispositivo para tracking cross-site.",
    s4L4: "No vendemos ni cedemos datos personales identificables a terceros para marketing ni venta. Subprocesadores operacionales listados en el DPA y en § 06.",

    s5Kicker: "05 · RETENCIÓN",
    s5H: "Cuánto tiempo conservamos cada cosa.",
    s5R1: "Datos personales identificables (cuenta, uso, pago): mientras tu cuenta esté activa. Borrado permanente 30 días tras cierre de cuenta.",
    s5R2: "Logs de seguridad: 90 días, luego rotación automática.",
    s5R3: "Facturación: 5 años (obligación fiscal MX, GDPR Art. 6.1.c).",
    s5R4: "Backups cifrados: rotación 35 días, sin acceso restaurable granular tras ese plazo.",
    s5R5: "Señales de prevención de fraude: hasta 24 meses tras el último evento, bajo interés legítimo.",
    s5R6: "Datos anonimizados y disociados · modelos derivados (incluida línea base calibrada tras disociación): retención indefinida. Una vez disociados quedan fuera del ámbito de los derechos ARCO/GDPR sobre datos personales — declarado con transparencia conforme a GDPR Art. 13 y LFPDPPP Art. 16.",
    s5R6Kicker: "RETENCIÓN INDEFINIDA · DATOS DISOCIADOS",

    s6Kicker: "06 · SUBPROCESADORES Y TRANSFERENCIAS",
    s6H: "Con quién compartimos lo mínimo para operar.",
    s6Body:
      "Operamos con subprocesadores acotados y auditados. La lista completa, con país y finalidad, vive en ",
    s6LinkSub: "Trust Center · Subprocesadores",
    s6Transfer:
      "Algunos subprocesadores están en EE. UU. Transferencias internacionales bajo Cláusulas Contractuales Tipo (SCC 2021/914) y evaluaciones de transferencia (TIA) cuando aplica.",

    s7Kicker: "07 · TUS DERECHOS",
    s7H: "ARCO + GDPR + CCPA: alcance y ejercicio.",
    s7Body: "Puedes ejercer estos derechos desde el panel o escribiendo a ",
    s7R1: "Acceso: copia de lo que tenemos sobre ti.",
    s7R2: "Rectificación: corregir datos inexactos.",
    s7R3: "Cancelación / borrado: derecho al olvido (GDPR Art. 17) sobre datos personales identificables.",
    s7R4: "Oposición: detener tratamientos específicos.",
    s7R5: "Portabilidad: exportar en formato estructurado (JSON).",
    s7R6: "Revocar consentimiento: para telemetría u otros consentidos.",
    s7R7: "Presentar queja ante autoridad: INAI (MX) o supervisora UE.",
    s7Caveat:
      "Alcance del borrado: tus derechos aplican sobre datos personales identificables. Datos ya anonimizados e incorporados a agregados estadísticos — conforme a § 03 — no son reversibles por definición técnica ni jurídica (GDPR Recital 26, LFPDPPP Art. 3.VIII). Este estándar industrial se declara aquí con transparencia.",
    s7CaveatKicker: "ALCANCE DEL BORRADO",

    s8Kicker: "08 · MENORES",
    s8H: "No para menores de 16.",
    s8Body:
      "El servicio no está dirigido a menores de 16 años. Si detectas uso por un menor, escríbenos y procederemos a cerrar la cuenta y borrar los datos personales identificables.",

    s9Kicker: "09 · BRECHAS DE SEGURIDAD",
    s9H: "Notificación dentro de 72 horas.",
    s9Body:
      "En caso de incidente que afecte datos personales notificaremos a usuarios y autoridades (GDPR Art. 33/34, LFPDPPP Art. 20) dentro de 72 horas desde el conocimiento del evento, con alcance, impacto y medidas correctivas.",

    s10Kicker: "10 · CAMBIOS A ESTE AVISO",
    s10H: "Versionado y preaviso de 30 días para cambios materiales.",
    s10Body:
      "Mantenemos un historial versionado. Los cambios materiales se notifican por email con al menos 30 días de antelación. La versión activa aparece al inicio de este documento.",

    s11Kicker: "11 · CONTACTO",
    s11H: "DPO y responsable.",
    s11Body1: "Oficial de Protección de Datos (DPO):",
    s11Body2: "Atención a derechos ARCO y dudas generales:",
    s11Body3: "Responsable del tratamiento: BIO-IGNICIÓN, México. Registro en curso ante INAI.",

    relatedKicker: "DOCUMENTOS RELACIONADOS",
    relatedH: "El paquete completo para procurement.",
    relatedBody:
      "Todos los documentos binding para enterprise viven en el Trust Center. Si necesitas DPA firmado, escríbenos.",
    linkTerms: "Términos de servicio",
    linkAup: "Política de uso aceptable",
    linkCookies: "Política de cookies",
    linkDpa: "DPA (descargable)",
    linkSubs: "Subprocesadores",
    linkTrust: "Trust Center",
  },
  en: {
    eyebrow: "PRIVACY NOTICE",
    title: "Your session, on your device.",
    editorial: "Local-first, encrypted, no marketing telemetry by default.",
    intro:
      "This notice describes what data we process, on what lawful basis, how long we keep it, how you exercise your rights and what we do with anonymized data. Complies with GDPR (EU 2016/679), LFPDPPP (Mexico) and CCPA/CPRA (California).",
    updated: "Updated",
    version: "Version",
    toc: "Table of contents",

    statEncryption: "Encryption at rest",
    statEncryptionSub: "local and on server",
    statTrackers: "Third-party trackers",
    statTrackersSub: "no marketing analytics",
    statBreach: "Breach notification",
    statBreachSub: "GDPR Art. 33",
    statDPO: "DPO contact",
    statDPOSub: "response within 72 h",

    s1Kicker: "01 · PRINCIPLES",
    s1H: "Three promises that anchor everything else.",
    s1L1: "Local-first: your sessions live on your device, encrypted with AES-GCM 256 before touching IndexedDB.",
    s1L2: "Minimization: we collect only what we need to operate the service and research with dissociated data.",
    s1L3: "Portability: export or request deletion of your identifiable personal data in one click from Profile → Export/Delete. Scope of deletion described in § 07.",

    s2Kicker: "02 · DATA WE PROCESS",
    s2H: "What we keep and on what lawful basis.",
    s2Body: "We process these categories under GDPR Art. 6 and LFPDPPP Art. 8 bases:",
    s2R1Cat: "Account",
    s2R1Data: "Email, name, preferences (theme, sound, language).",
    s2R1Basis: "Contract (Art. 6.1.b)",
    s2R2Cat: "Usage",
    s2R2Data: "Completed sessions, duration, protocol, self-reported state, calibrated neural baseline.",
    s2R2Basis: "Contract (Art. 6.1.b)",
    s2R3Cat: "Payment",
    s2R3Data: "Subscription ID and receipts. Card numbers are processed by Stripe (we don't see them).",
    s2R3Basis: "Legal obligation (Art. 6.1.c)",
    s2R4Cat: "Telemetry",
    s2R4Data: "Aggregated usage metrics — only if you opt in explicitly.",
    s2R4Basis: "Consent (Art. 6.1.a)",
    s2R5Cat: "Security logs",
    s2R5Data: "Truncated IP, user-agent, auth event. 90-day retention.",
    s2R5Basis: "Legitimate interest (Art. 6.1.f)",
    s2R6Cat: "Fraud prevention",
    s2R6Data: "Aggregated abuse signals, reduced device fingerprint (no cross-site tracking), anomalous usage patterns.",
    s2R6Basis: "Legitimate interest (Art. 6.1.f)",
    s2TableCat: "Category",
    s2TableData: "What it includes",
    s2TableBasis: "Lawful basis",

    s3Kicker: "03 · RESEARCH AND PRODUCT IMPROVEMENT",
    s3H: "Anonymized data as the engine of continuous improvement.",
    s3Body1:
      "BIO-IGNICIÓN operates an adaptive neural engine that improves with the scale of use. To keep the engine evolving — and for the user community to benefit from aggregated findings — we run an anonymization pipeline over usage data and calibrated baseline. Once dissociated from your identity under GDPR Recital 26 and LFPDPPP Art. 3.VIII, the data is no longer personal data and its retention is indefinite.",
    s3Body2:
      "Irreversible anonymization means: removal of direct identifiers (email, name, IDs), reduction of quasi-identifiers (timestamp bucketing, country-level location), k-anonymity ≥5 on published cohorts and differential noise (ε ≤1.0) on aggregated metrics. Auditable under NDA for enterprise customers.",
    s3L1: "Neural engine improvement: we train internal models with anonymized and aggregated data to refine adaptive protocol selection.",
    s3L2: "Benchmarks and publication: we may publish aggregated findings (cohorts ≥5 users, no reasonable reidentification) in papers, changelogs or case studies.",
    s3L3: "We don't train AI models with identifiable personal data. We don't share the dataset with third parties for training competing models.",
    s3L4: "If you prefer not to contribute: you can request explicit opt-out by writing to dpo@bio-ignicion.app. Your opt-out applies from the request forward; data already anonymized and incorporated into statistical aggregates is not reversible by definition.",
    s3FootBasis: "Lawful bases: legitimate interest (Art. 6.1.f) for data anonymized during dissociation · Recital 26 GDPR and Art. 3.VIII LFPDPPP for already dissociated data · opt-in consent (Art. 6.1.a) for contribution to named research cohorts.",
    s3FootKicker: "LAWFUL BASES · RESEARCH",

    s4Kicker: "04 · DATA WE DON'T PROCESS",
    s4H: "What we never capture, even though we could.",
    s4L1: "Real biometric data (heart rate, HRV) unless you connect a wearable with explicit consent.",
    s4L2: "Precise GPS location, contacts, device camera or microphone.",
    s4L3: "Advertising identifiers (IDFA, AAID) or device fingerprints for cross-site tracking.",
    s4L4: "We don't sell or share identifiable personal data with third parties for marketing or sale. Operational subprocessors listed in the DPA and in § 06.",

    s5Kicker: "05 · RETENTION",
    s5H: "How long we keep each thing.",
    s5R1: "Identifiable personal data (account, usage, payment): while your account is active. Permanent deletion 30 days after account closure.",
    s5R2: "Security logs: 90 days, then automatic rotation.",
    s5R3: "Billing: 5 years (MX tax obligation, GDPR Art. 6.1.c).",
    s5R4: "Encrypted backups: 35-day rotation, no granular restore after that window.",
    s5R5: "Fraud-prevention signals: up to 24 months after the last event, under legitimate interest.",
    s5R6: "Anonymized and dissociated data · derived models (including calibrated baseline after dissociation): indefinite retention. Once dissociated they fall outside the scope of ARCO/GDPR rights over personal data — disclosed with transparency per GDPR Art. 13 and LFPDPPP Art. 16.",
    s5R6Kicker: "INDEFINITE RETENTION · DISSOCIATED DATA",

    s6Kicker: "06 · SUBPROCESSORS AND TRANSFERS",
    s6H: "Who we share the minimum with, to operate.",
    s6Body:
      "We operate with bounded, audited subprocessors. The full list, with country and purpose, lives at ",
    s6LinkSub: "Trust Center · Subprocessors",
    s6Transfer:
      "Some subprocessors are in the U.S. International transfers under Standard Contractual Clauses (SCC 2021/914) and transfer impact assessments (TIA) where applicable.",

    s7Kicker: "07 · YOUR RIGHTS",
    s7H: "ARCO + GDPR + CCPA: scope and exercise.",
    s7Body: "You can exercise these rights from the panel or by writing to ",
    s7R1: "Access: copy of what we hold about you.",
    s7R2: "Rectification: correct inaccurate data.",
    s7R3: "Erasure: right to be forgotten (GDPR Art. 17) over identifiable personal data.",
    s7R4: "Objection: stop specific processing.",
    s7R5: "Portability: export in structured format (JSON).",
    s7R6: "Withdraw consent: for telemetry or other consented items.",
    s7R7: "Lodge a complaint: INAI (MX) or EU supervisory authority.",
    s7Caveat:
      "Scope of erasure: your rights apply to identifiable personal data. Data already anonymized and incorporated into statistical aggregates — per § 03 — is not reversible by technical or legal definition (GDPR Recital 26, LFPDPPP Art. 3.VIII). This industry standard is disclosed here with transparency.",
    s7CaveatKicker: "SCOPE OF ERASURE",

    s8Kicker: "08 · MINORS",
    s8H: "Not for under-16s.",
    s8Body:
      "The service is not directed to children under 16. If you detect use by a minor, write to us and we will close the account and delete identifiable personal data.",

    s9Kicker: "09 · SECURITY BREACHES",
    s9H: "Notification within 72 hours.",
    s9Body:
      "In the event of an incident affecting personal data we will notify users and authorities (GDPR Art. 33/34, LFPDPPP Art. 20) within 72 hours of becoming aware, with scope, impact and corrective actions.",

    s10Kicker: "10 · CHANGES TO THIS NOTICE",
    s10H: "Versioned, with 30-day notice for material changes.",
    s10Body:
      "We keep a versioned history. Material changes are notified by email with at least 30 days' advance notice. The active version is shown at the top of this document.",

    s11Kicker: "11 · CONTACT",
    s11H: "DPO and controller.",
    s11Body1: "Data Protection Officer (DPO):",
    s11Body2: "ARCO rights and general questions:",
    s11Body3: "Data controller: BIO-IGNICIÓN, Mexico. INAI registration in progress.",

    relatedKicker: "RELATED DOCUMENTS",
    relatedH: "The full packet for procurement.",
    relatedBody:
      "All binding documents for enterprise live in the Trust Center. If you need a signed DPA, write to us.",
    linkTerms: "Terms of service",
    linkAup: "Acceptable use policy",
    linkCookies: "Cookie policy",
    linkDpa: "DPA (downloadable)",
    linkSubs: "Subprocessors",
    linkTrust: "Trust Center",
  },
};

export default async function PrivacyPage() {
  const locale = await getServerLocale();
  const L = locale === "en" ? "en" : "es";
  const c = COPY[L];
  const en = L === "en";

  const updatedFmt = new Date(LAST_UPDATED).toLocaleDateString(en ? "en-US" : "es-MX", {
    year: "numeric", month: "long", day: "numeric",
  });

  const sections = Array.from({ length: 11 }, (_, i) => {
    const n = i + 1;
    const kicker = c[`s${n}Kicker`];
    if (!kicker) return null;
    const [num, title] = kicker.split(" · ");
    return { id: `s${n}`, num, title };
  }).filter(Boolean);

  const dataRows = [
    { cat: c.s2R1Cat, data: c.s2R1Data, basis: c.s2R1Basis },
    { cat: c.s2R2Cat, data: c.s2R2Data, basis: c.s2R2Basis },
    { cat: c.s2R3Cat, data: c.s2R3Data, basis: c.s2R3Basis },
    { cat: c.s2R4Cat, data: c.s2R4Data, basis: c.s2R4Basis },
    { cat: c.s2R5Cat, data: c.s2R5Data, basis: c.s2R5Basis },
    { cat: c.s2R6Cat, data: c.s2R6Data, basis: c.s2R6Basis },
  ];

  return (
    <PublicShell activePath="/privacy">
      {/* ═══ Hero ═══ */}
      <Container size="lg" className="bi-prose">
        <header className="bi-legal-hero">
          <div aria-hidden className="bi-legal-hero-lattice">
            <BioglyphLattice variant="ambient" />
          </div>
          <span aria-hidden className="bi-legal-hero-aura" />
          <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            <IgnitionReveal sparkOrigin="50% 30%">
              <div style={kickerStyle}>{c.eyebrow}</div>
              <h1
                style={{
                  margin: `${space[3]}px 0 ${space[4]}px`,
                  fontSize: "clamp(36px, 5.2vw, 60px)",
                  letterSpacing: "-0.035em",
                  lineHeight: 1.05,
                }}
              >
                {c.title}
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-editorial), 'Instrument Serif', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: "clamp(18px, 2vw, 22px)",
                  lineHeight: 1.35,
                  color: cssVar.textMuted,
                  maxWidth: "46ch",
                  margin: `0 auto ${space[4]}`,
                }}
              >
                {c.editorial}
              </p>
              <p style={{ color: cssVar.textDim, maxWidth: "62ch", margin: "0 auto" }}>
                {c.intro}
              </p>
              <p style={{ color: cssVar.textMuted, fontSize: font.size.sm, marginBlockStart: space[4], fontFamily: cssVar.fontMono }}>
                {c.version} {VERSION} · {c.updated} <time dateTime={LAST_UPDATED}>{updatedFmt}</time>
              </p>
            </IgnitionReveal>
          </div>
        </header>
      </Container>

      {/* ═══ Stat strip ═══ */}
      <section aria-label={c.eyebrow} style={{ marginBlockStart: space[7] }}>
        <Container size="xl" style={{ paddingInline: 0 }}>
          <div className="bi-proof-stats bi-proof-stats--label">
            <div>
              <span className="v">AES-GCM 256</span>
              <span className="l">{c.statEncryption}</span>
              <span className="s">{c.statEncryptionSub}</span>
            </div>
            <div>
              <span className="v">0</span>
              <span className="l">{c.statTrackers}</span>
              <span className="s">{c.statTrackersSub}</span>
            </div>
            <div>
              <span className="v">&lt; 72 h</span>
              <span className="l">{c.statBreach}</span>
              <span className="s">{c.statBreachSub}</span>
            </div>
            <div>
              <span className="v">dpo@</span>
              <span className="l">{c.statDPO}</span>
              <span className="s">{c.statDPOSub}</span>
            </div>
          </div>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      {/* ═══ TOC ═══ */}
      <Container size="lg" className="bi-prose">
        <nav aria-label={c.toc} className="bi-legal-toc">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="bi-legal-toc-chip">
              <span className="num">{s.num}</span>
              <span>{s.title}</span>
            </a>
          ))}
        </nav>

        {/* ═══ § 01 Principios ═══ */}
        <section id="s1" className="bi-legal-section">
          <div style={kickerStyle}>{c.s1Kicker}</div>
          <h2 style={sectionHeading}>{c.s1H}</h2>
          <ul className="bi-legal-list">
            <li>{c.s1L1}</li>
            <li>{c.s1L2}</li>
            <li>{c.s1L3}</li>
          </ul>
        </section>

        {/* ═══ § 02 Datos que tratamos ═══ */}
        <section id="s2" className="bi-legal-section">
          <div style={kickerStyle}>{c.s2Kicker}</div>
          <h2 style={sectionHeading}>{c.s2H}</h2>
          <p style={{ marginBlockStart: space[3], color: cssVar.textDim }}>{c.s2Body}</p>
          <div className="bi-legal-table-wrap">
            <table className="bi-legal-table">
              <thead>
                <tr>
                  <th>{c.s2TableCat}</th>
                  <th>{c.s2TableData}</th>
                  <th>{c.s2TableBasis}</th>
                </tr>
              </thead>
              <tbody>
                {dataRows.map((r) => (
                  <tr key={r.cat}>
                    <td className="bi-legal-table-cat" data-label={c.s2TableCat}>{r.cat}</td>
                    <td data-label={c.s2TableData}>{r.data}</td>
                    <td className="bi-legal-table-basis" data-label={c.s2TableBasis}>
                      <span>{r.basis}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ═══ § 03 Investigación y mejora ═══ */}
        <section id="s3" className="bi-legal-section">
          <div style={kickerStyle}>{c.s3Kicker}</div>
          <h2 style={sectionHeading}>{c.s3H}</h2>
          <p style={{ marginBlockStart: space[3] }}>{c.s3Body1}</p>
          <p>{c.s3Body2}</p>
          <ul className="bi-legal-list">
            <li>{c.s3L1}</li>
            <li>{c.s3L2}</li>
            <li>{c.s3L3}</li>
            <li>{c.s3L4}</li>
          </ul>
          <aside className="bi-legal-callout bi-legal-callout--moat">
            <div className="bi-legal-callout-kicker">{c.s3FootKicker}</div>
            <p>{c.s3FootBasis}</p>
          </aside>
        </section>

        {/* ═══ § 04 No datos ═══ */}
        <section id="s4" className="bi-legal-section">
          <div style={kickerStyle}>{c.s4Kicker}</div>
          <h2 style={sectionHeading}>{c.s4H}</h2>
          <ul className="bi-legal-list">
            <li>{c.s4L1}</li>
            <li>{c.s4L2}</li>
            <li>{c.s4L3}</li>
            <li>{c.s4L4}</li>
          </ul>
        </section>

        {/* ═══ § 05 Retención ═══ */}
        <section id="s5" className="bi-legal-section">
          <div style={kickerStyle}>{c.s5Kicker}</div>
          <h2 style={sectionHeading}>{c.s5H}</h2>
          <ul className="bi-legal-list">
            <li>{c.s5R1}</li>
            <li>{c.s5R2}</li>
            <li>{c.s5R3}</li>
            <li>{c.s5R4}</li>
            <li>{c.s5R5}</li>
          </ul>
          <aside className="bi-legal-callout bi-legal-callout--moat">
            <div className="bi-legal-callout-kicker">{c.s5R6Kicker}</div>
            <p>{c.s5R6}</p>
          </aside>
        </section>

        {/* ═══ § 06 Subprocesadores ═══ */}
        <section id="s6" className="bi-legal-section">
          <div style={kickerStyle}>{c.s6Kicker}</div>
          <h2 style={sectionHeading}>{c.s6H}</h2>
          <p style={{ marginBlockStart: space[3] }}>
            {c.s6Body}
            <a href="/trust/subprocessors" className="bi-legal-link">{c.s6LinkSub}</a>.
          </p>
          <p style={{ color: cssVar.textDim }}>{c.s6Transfer}</p>
        </section>

        {/* ═══ § 07 Derechos ═══ */}
        <section id="s7" className="bi-legal-section">
          <div style={kickerStyle}>{c.s7Kicker}</div>
          <h2 style={sectionHeading}>{c.s7H}</h2>
          <p style={{ marginBlockStart: space[3] }}>
            {c.s7Body}
            <a href="mailto:dpo@bio-ignicion.app" className="bi-legal-link">dpo@bio-ignicion.app</a>.
          </p>
          <ul className="bi-legal-list">
            <li>{c.s7R1}</li>
            <li>{c.s7R2}</li>
            <li>{c.s7R3}</li>
            <li>{c.s7R4}</li>
            <li>{c.s7R5}</li>
            <li>{c.s7R6}</li>
            <li>{c.s7R7}</li>
          </ul>
          <aside className="bi-legal-callout bi-legal-callout--warn">
            <div className="bi-legal-callout-kicker">{c.s7CaveatKicker}</div>
            <p>{c.s7Caveat}</p>
          </aside>
        </section>

        {/* ═══ § 08 Menores ═══ */}
        <section id="s8" className="bi-legal-section">
          <div style={kickerStyle}>{c.s8Kicker}</div>
          <h2 style={sectionHeading}>{c.s8H}</h2>
          <p style={{ marginBlockStart: space[3] }}>{c.s8Body}</p>
        </section>

        {/* ═══ § 09 Brechas ═══ */}
        <section id="s9" className="bi-legal-section">
          <div style={kickerStyle}>{c.s9Kicker}</div>
          <h2 style={sectionHeading}>{c.s9H}</h2>
          <p style={{ marginBlockStart: space[3] }}>{c.s9Body}</p>
        </section>

        {/* ═══ § 10 Cambios ═══ */}
        <section id="s10" className="bi-legal-section">
          <div style={kickerStyle}>{c.s10Kicker}</div>
          <h2 style={sectionHeading}>{c.s10H}</h2>
          <p style={{ marginBlockStart: space[3] }}>{c.s10Body}</p>
        </section>

        {/* ═══ § 11 Contacto ═══ */}
        <section id="s11" className="bi-legal-section">
          <div style={kickerStyle}>{c.s11Kicker}</div>
          <h2 style={sectionHeading}>{c.s11H}</h2>
          <p style={{ marginBlockStart: space[3] }}>
            {c.s11Body1}{" "}
            <a href="mailto:dpo@bio-ignicion.app" className="bi-legal-link">dpo@bio-ignicion.app</a>
          </p>
          <p>
            {c.s11Body2}{" "}
            <a href="mailto:privacy@bio-ignicion.app" className="bi-legal-link">privacy@bio-ignicion.app</a>
          </p>
          <p style={{ color: cssVar.textDim, fontSize: font.size.sm }}>{c.s11Body3}</p>
        </section>
      </Container>

      <PulseDivider intensity="dim" />

      {/* ═══ Related legal docs ═══ */}
      <Container size="lg" className="bi-prose">
        <section aria-labelledby="privacy-related" className="bi-legal-related">
          <div style={kickerStyle}>{c.relatedKicker}</div>
          <h2 id="privacy-related" style={sectionHeading}>{c.relatedH}</h2>
          <p style={{ marginBlockStart: space[3], color: cssVar.textDim, maxWidth: "58ch" }}>{c.relatedBody}</p>
          <ul className="bi-legal-related-grid">
            <li><a href="/terms" className="bi-legal-related-card">{c.linkTerms}</a></li>
            <li><a href="/aup" className="bi-legal-related-card">{c.linkAup}</a></li>
            <li><a href="/cookies" className="bi-legal-related-card">{c.linkCookies}</a></li>
            <li><a href="/trust/dpa" className="bi-legal-related-card">{c.linkDpa}</a></li>
            <li><a href="/trust/subprocessors" className="bi-legal-related-card">{c.linkSubs}</a></li>
            <li><a href="/trust" className="bi-legal-related-card">{c.linkTrust}</a></li>
          </ul>
        </section>
      </Container>
    </PublicShell>
  );
}
