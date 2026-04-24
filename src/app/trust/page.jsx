import Link from "next/link";
import { headers } from "next/headers";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font, bioSignal } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";
import IgnitionReveal from "@/components/brand/IgnitionReveal";
import BioglyphLattice from "@/components/brand/BioglyphLattice";
import PulseDivider from "@/components/brand/PulseDivider";
import TrustEnhancements from "./TrustEnhancements";

export const metadata = {
  title: "Trust Center",
  description: "Seguridad, privacidad y resiliencia operativa — documentadas, no declamadas.",
  alternates: { canonical: "/trust" },
  openGraph: {
    title: "BIO-IGNICIÓN · Trust Center",
    description: "Seguridad, privacidad y resiliencia — documentadas, no declamadas.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
};

const kickerStyle = {
  fontSize: font.size.xs,
  fontFamily: cssVar.fontMono,
  color: bioSignal.phosphorCyanInk,
  textTransform: "uppercase",
  letterSpacing: "0.28em",
  fontWeight: font.weight.bold,
};

const sectionHeading = {
  margin: 0,
  fontSize: "clamp(28px, 3.6vw, 42px)",
  letterSpacing: "-0.025em",
  lineHeight: 1.1,
  fontWeight: font.weight.black,
  color: cssVar.text,
};

const ROI_CODE = `recoveredHours = sessionsMinutes × observedLift × residualFactor / 60

observedLift      — 0..1, capsulado en 0.35 (effectSizeCap)
                    evita sobre-reporte por self-report inflado
residualFactor    — default 2.0× duración de sesión
                    persistencia de carryover post-intervención breve
minSessions       — 30 (no se reporta ROI debajo de este umbral)
hourlyLoadedCost  — default USD 60 (knowledge worker global 2026)`;

const COPY = {
  es: {
    eyebrow: "TRUST CENTER",
    h1: "Documentadas, no declamadas.",
    editorial: "Seguridad, privacidad y resiliencia — con fechas, con métodos, con fuentes.",
    p: "Ninguna certificación se declara hasta que el reporte auditado esté disponible: las fechas abajo son objetivos públicos, no estado vigente. Si tu equipo de seguridad necesita algo que no vemos listado, escríbenos.",
    contactLabel: "Equipo de Seguridad",
    contactEmail: "trust@bio-ignicion.app",
    lastReview: "ÚLTIMA REVISIÓN",
    lastReviewDate: "2026-04-20",
    lastReviewLabel: "20 · abril · 2026",

    heroCtaPrimary: "Solicitar paquete de seguridad",
    heroCtaSecondary: "Leer DPA",
    heroCtaNote: "Respuesta del equipo de Trust en < 48 h hábiles.",

    navKicker: "SALTAR A",
    navItems: [
      { label: "Principios", href: "#trust-principles" },
      { label: "Certificaciones", href: "#trust-certs" },
      { label: "Controles", href: "#trust-controls" },
      { label: "Metodología", href: "#trust-methodology" },
      { label: "Paquete CISO", href: "#trust-package" },
      { label: "Incidentes", href: "#trust-incidents" },
      { label: "Disclosure", href: "#trust-disclosure" },
      { label: "Documentación", href: "#trust-docs" },
      { label: "FAQ", href: "#trust-faq" },
    ],

    principlesKicker: "PRINCIPIOS",
    principlesH: "Cuatro decisiones que estructuran la postura.",
    principlesIntro: "No son lemas: cada una se puede verificar en el código, en la arquitectura o en el reporte de auditoría.",
    principles: [
      {
        n: "01",
        k: "Privacidad por diseño",
        v: "Datos personales cifrados por defecto, agregación con k-anonymity k ≥ 5 antes de cualquier reporte, minimización de retención (90 días de audit log caliente, archivo cifrado según plan).",
      },
      {
        n: "02",
        k: "Mínimo privilegio verificable",
        v: "Ninguna persona tiene acceso permanente a datos de cliente. Accesos de soporte vía break-glass con aprobación de dos + expiración automática; cada evento queda en audit log con hash chain.",
      },
      {
        n: "03",
        k: "Zero-trust operativo",
        v: "mTLS interno entre servicios, identidad y autorización por request, sin \"red interna\" implícita. Pentests anuales externos + bug bounty continuo.",
      },
      {
        n: "04",
        k: "Métodos defendibles",
        v: "Ninguna métrica sin cita pública. Sin reporte bajo umbral estadístico. Sin convertir ΔHRV debajo de MDC95 en \"lift vagal\" para quedar bien.",
      },
    ],

    proofKicker: "ESTADO EN VIVO",
    proofStats: [
      { v: "SOC 2", l: "Type II", s: "en auditoría · obj. 2026-Q3" },
      { v: "< 4h", l: "RTO", s: "RPO 15 min · multi-AZ" },
      { v: "k ≥ 5", l: "anonimato", s: "sin reporte bajo umbral" },
      { v: "0", l: "incidentes reportables", s: "a la fecha · security.txt" },
    ],

    certsKicker: "MARCOS ALINEADOS",
    certsH: "Certificaciones — con fechas objetivo, no claims vacíos.",
    certsHead: { framework: "Marco", status: "Estado", target: "Objetivo", tier: "Aplica en" },
    certsStamp: "Última verificación · 2026-04-20",
    certs: [
      { name: "SOC 2 Type II", status: "En auditoría", target: "2026-Q3", tier: "Todos los planes", tone: "pending" },
      { name: "ISO 27001", status: "Gap assessment", target: "2026-Q4", tier: "Enterprise", tone: "scoped" },
      { name: "ISO 27701", status: "Scoped", target: "2027-Q1", tier: "Enterprise", tone: "scoped" },
      { name: "HIPAA", status: "BAA disponible", target: "Vigente", tier: "Enterprise · BAA firmable", tone: "ready" },
      { name: "GDPR / LFPDPPP / LGPD / CCPA", status: "Alineado", target: "Vigente", tier: "Todos los planes", tone: "ready" },
    ],

    packageKicker: "SECURITY PACKAGE",
    packageH: "Lo que recibe tu CISO en un zip, bajo NDA.",
    packageItems: [
      { label: "DPA — Data Processing Agreement", meta: "Contrato firmable · GDPR Art. 28 + LFPDPPP", tag: "ABIERTO", href: "/trust/dpa" },
      { label: "SOC 2 Type II — resumen", meta: "Alcance público · reporte completo bajo NDA", tag: "NDA", href: "mailto:trust@bio-ignicion.app?subject=SOC%202%20Type%20II%20(NDA)" },
      { label: "Pentest summary 2025", meta: "Cobertura · findings H/M/L · remediation · re-test", tag: "NDA", href: "mailto:trust@bio-ignicion.app?subject=Pentest%20summary%202025%20(NDA)" },
      { label: "Subprocesadores", meta: "Lista en vivo con región, propósito, fecha de alta", tag: "ABIERTO", href: "/trust/subprocessors" },
      { label: "CAIQ v4.0.3 · SIG Lite", meta: "Cuestionarios estándar pre-llenados · respuesta < 5 días", tag: "NDA", href: "mailto:trust@bio-ignicion.app?subject=Security%20questionnaire%20(NDA)" },
    ],
    packageCta: "Solicitar paquete completo",
    packageNote: "Bajo NDA — respuesta del equipo de Trust en < 48 h hábiles.",

    controlsKicker: "CONTROLES CLAVE",
    controlsH: "Lo que protege tus datos, todos los días.",
    controls: [
      { k: "Cifrado", v: "TLS 1.3 en tránsito · AES-GCM 256 en reposo · claves por tenant en KMS." },
      { k: "Identidad", v: "SSO SAML/OIDC · SCIM 2.0 · MFA TOTP/WebAuthn · rotación de sesiones." },
      { k: "Acceso", v: "RBAC granular · least-privilege · break-glass auditado." },
      { k: "Auditoría", v: "Append-only con hash chain verificable." },
      { k: "Resiliencia", v: "RPO 15 min · RTO 4 h · multi-AZ · respaldo inmutable 30 días." },
      { k: "Data residency", v: "US · EU · APAC · LATAM bajo demanda." },
      { k: "Privacidad agregada", v: "k-anonymity k ≥ 5 · noise diferencial ε = 1.0." },
      { k: "Continuidad", v: "BCP/DRP documentados · ejercicios trimestrales." },
    ],

    methodologyKicker: "METODOLOGÍA",
    methodologyH: "Cómo medimos lo que reportamos.",
    methodologyIntro: "Cada métrica reportable está anclada a literatura revisada por pares. Ningún claim usa score propietario sin referencia. Los detalles permiten a RH/Salud Laboral validar el reporte contra sus propios estándares.",

    instrumentsH3: "Instrumentos psicométricos",
    instrumentsHead: { instrument: "Instrumento", range: "Rango", frequency: "Periodicidad", reference: "Referencia" },
    instruments: [
      { instrument: "PSS-4 (estrés percibido)", range: "0–16", frequency: "Mensual", reference: "Cohen & Williamson 1988" },
      { instrument: "SWEMWBS (bienestar)", range: "7–35 (Rasch)", frequency: "Trimestral", reference: "Stewart-Brown et al. 2009" },
      { instrument: "PHQ-2 (screener depresión)", range: "0–6 · cutoff ≥ 3", frequency: "A demanda", reference: "Kroenke, Spitzer & Williams 2003" },
      { instrument: "NOM-035-STPS Guía II", range: "46 ítems", frequency: "Anual legal", reference: "STPS México 2018" },
    ],

    hrvH3: "HRV (variabilidad de frecuencia cardíaca)",
    hrv: [
      <><strong>Conexión:</strong> Web Bluetooth GATT Heart Rate Service (Polar, Wahoo, Garmin, CooSpo).</>,
      <><strong>Métricas:</strong> RMSSD, SDNN, pNN50, ln(RMSSD) (Task Force 1996; Shaffer & Ginsberg 2017).</>,
      <><strong>Filtro de artefactos:</strong> regla Malik (20%) sobre intervalos RR.</>,
      <><strong>Cambio significativo:</strong> sólo se reporta como efecto si |Δ RMSSD| ≥ MDC95 personal (Haley & Fragala-Pinkham 2006). Debajo del umbral = "no change", no "lift".</>,
      <><strong>Agregación:</strong> media, IC95%, % con lift vagal; mínimo k = 5 para reporte.</>,
    ],

    effectivenessH3: "Efectividad de protocolo (lift estado)",
    effectiveness: [
      <><strong>Diseño:</strong> pre/post mood auto-reportado, emparejado por sesión.</>,
      <><strong>Significancia:</strong> IC95% del mean difference no cruza 0 (equivalente a t-test unilateral simple).</>,
      <><strong>Tamaño de efecto:</strong> Cohen's d paired; umbrales 0.2/0.5/0.8 (Cohen 1988; Lakens 2013).</>,
      <><strong>Mínimo muestra:</strong> n = 5 pares por protocolo/usuario.</>,
      <><strong>Limitación reconocida:</strong> auto-reporte de mood infla efectos leves — ver ROI cap (siguiente sección).</>,
    ],

    roiH3: "Modelo ROI — horas de foco recuperadas",
    roiIntro: "Fórmula publicada, parámetros conservadores, sensibilidad auditable:",
    roiCode: ROI_CODE,
    roiFoot: <>Base empírica del <code>residualFactor</code>: Zeidan et al. 2010 (<em>Consciousness &amp; Cognition</em> 19:597-605); Basso et al. 2019 (<em>Behavioural Brain Research</em> 356:208-220). Los valores del cliente son ajustables: RH/Finanzas pueden sustituir defaults con su propio costo cargado y tolerancia a efecto observado, y ver sensibilidad directamente en el dashboard.</>,

    antiClaimsH3: "Lo que BIO-IGNICIÓN NO declara",
    antiClaims: [
      "No somos diagnóstico clínico. Un PHQ-2 positivo deriva a recursos; no sustituye a un profesional.",
      "No vendemos puntajes opacos. Si una métrica aparece en el reporte, su fuente es pública.",
      "No prometemos efectos sin muestra mínima. Debajo de k = 5 respuestas o n = 30 sesiones, el dashboard muestra 'insuficiente' — no extrapolamos.",
      "No convertimos ΔHRV debajo del MDC95 en 'lift vagal' para quedar bien.",
    ],

    incidentsKicker: "HISTORIAL DE INCIDENTES",
    incidentsH: "Todo lo que haya que reportar, aquí — antes de que lo preguntes.",
    incidentsEmptyTitle: "Sin incidentes reportables a la fecha.",
    incidentsEmptyBody: "Definimos reportable como cualquier evento con impacto material en confidencialidad, integridad o disponibilidad que active notificación a clientes bajo el DPA o a reguladores (GDPR Art. 33 — 72 h). Eventos operativos menores sin exfiltración se publican en el Status Page.",
    incidentsLastCheck: "Última verificación",
    incidentsNext: "Próxima revisión",
    incidentsLastDate: "2026-04-20",
    incidentsNextDate: "2026-07-20",
    incidentsLiveLabel: "En vivo",
    incidentsStatusLink: "Status Page en vivo",

    faqKicker: "PREGUNTAS DEL CISO",
    faqH: "Lo que tu equipo de seguridad pregunta antes de firmar.",
    faq: [
      {
        q: "¿Cómo manejan un Data Subject Access Request (ARCO)?",
        a: "Todo DSAR/ARCO lo gestiona el equipo de Privacy (dpo@bio-ignicion.app). Respondemos con los datos solicitados en formato portable (JSON estructurado + export SQL) dentro de 30 días naturales bajo GDPR Art. 12 — en la práctica cerramos el 90% en < 10 días hábiles. Cada request queda registrado en el audit log append-only y el admin del cliente puede auditarlo. El DPA detalla el flujo completo paso por paso.",
      },
      {
        q: "¿Cuál es su SLA de notificación de incidentes?",
        a: "Notificamos a todos los clientes afectados dentro de 72 h desde detección confirmada (GDPR Art. 33 · CCPA §1798.29 · LFPDPPP). Para incidentes de impacto alto (exfiltración confirmada, pérdida de disponibilidad > 4 h), notificamos en < 24 h. Canales: email a contactos designados + entrada pública en Status Page + ticket en nuestro sistema de soporte.",
      },
      {
        q: "¿Verifican sus backups — y con qué frecuencia?",
        a: "Sí. Backups diarios cifrados (AES-GCM-256) con copia cross-region inmutable por 30 días. Test de restauración completo cada trimestre; restore parcial mensual. El RTO medido en el último ejercicio (2026-Q1) fue 2 h 47 min, debajo de nuestro SLA de 4 h. Los ejercicios quedan en registro auditable; evidencia disponible bajo NDA.",
      },
      {
        q: "¿Cómo rotan claves de cifrado?",
        a: "Claves por-tenant en AWS KMS con rotación automática anual y rotación manual on-demand (terminación de contrato, sospecha de compromiso, cambio de región). Envelope encryption: master key controlada por el cliente (BYOK / CMK) disponible en Enterprise. Ninguna DEK se persiste en texto plano — ni en backups ni en runtime.",
      },
      {
        q: "¿Cómo entrenan al staff en seguridad y privacidad?",
        a: "Todo empleado con acceso a producción pasa por un onboarding de seguridad (8 h) + refresh trimestrales que incluyen phishing simulations, data handling y ejercicios de incident response. Cobertura documentada en el reporte SOC 2. Staff con acceso a datos de clientes firma NDA + acuerdo específico; accesos se revisan mensualmente bajo least-privilege.",
      },
      {
        q: "¿Pueden exportar nuestros datos si terminamos el contrato?",
        a: "Sí, sin costo y sin fricción. Con 30 días de aviso, entregamos export completo en formato portable (JSON estructurado + CSV + SQL dump de tablas relevantes). Tras 90 días de fin de contrato los datos se borran definitivamente — crypto-shred para llaves, sobrescritura DOD 5220.22-M para almacenamiento físico residual. Certificado de destrucción firmado a petición.",
      },
      {
        q: "¿Cómo manejan accesos de terceros y soporte?",
        a: "Subprocesadores listados en /trust/subprocessors con región, propósito y fecha de alta. Nuevos subprocesadores notifican al cliente con 30 días de antelación (derecho de oposición bajo DPA). Accesos de soporte (nuestro staff) requieren break-glass con aprobación de dos personas + expiración automática; cada acceso queda en audit log verificable con hash chain.",
      },
    ],

    disclosureKicker: "RESPONSIBLE DISCLOSURE",
    disclosureH: "Si encontraste una vulnerabilidad, aquí es donde la reportas.",
    disclosureBody: "Recibimos reportes de investigadores externos bajo safe-harbor. No litigamos reportes hechos de buena fe, dentro del alcance listado, sin exfiltrar datos de clientes.",
    disclosureFields: [
      { k: "Canal preferido", v: "security@bio-ignicion.app (PGP)", copy: "security@bio-ignicion.app" },
      { k: "PGP fingerprint", v: "D41A 7C59 9E8B 2F4C 8A1D · 6E2F 33B7 5A09 C8D4 F1A2", copy: "D41A7C599E8B2F4C8A1D6E2F33B75A09C8D4F1A2" },
      { k: "Alcance", v: "*.bio-ignicion.app, PWA instalable, APIs públicas documentadas." },
      { k: "Fuera de alcance", v: "DoS volumétrico · phishing a staff · findings en subprocesadores de terceros." },
      { k: "Reward", v: "USD 100 – 5 000 según severidad CVSS v4 + impacto real demostrado." },
      { k: "SLA de respuesta", v: "Acuse < 48 h hábiles · triage < 5 días hábiles." },
    ],
    disclosureCta: "Leer security.txt",
    disclosureCtaHref: "/.well-known/security.txt",
    copyLabel: "Copiar",
    copyToast: "Copiado al portapapeles",
    backToTop: "Volver arriba",

    docsKicker: "DOCUMENTACIÓN",
    docsH: "Lo que tu legal y tu CISO van a pedir — aquí mismo.",
    docGroups: [
      {
        title: "Para Legal",
        items: [
          { label: "Política de privacidad", href: "/privacy", meta: "Versionada · fecha de última edición visible" },
          { label: "Términos de servicio", href: "/terms", meta: "Vigentes · historial de versiones bajo solicitud" },
          { label: "DPA descargable", href: "/trust/dpa", meta: "Data Processing Agreement firmable vía DocuSign" },
          { label: "Subprocesadores", href: "/trust/subprocessors", meta: "Lista en vivo · región · propósito · fecha de alta" },
        ],
      },
      {
        title: "Para Seguridad",
        items: [
          { label: "Reporte de pentest", href: "mailto:trust@bio-ignicion.app?subject=Pentest%20report%20(NDA)", meta: "Resumen público · reporte completo bajo NDA" },
          { label: "Security questionnaire", href: "mailto:trust@bio-ignicion.app?subject=Security%20questionnaire", meta: "CAIQ v4.0.3 / SIG Lite · bajo NDA · respuesta < 5 días" },
          { label: "ISO 27001:2022 mapping", href: "mailto:trust@bio-ignicion.app?subject=ISO%2027001%20mapping", meta: "Annex A control mapping · bajo NDA" },
        ],
      },
      {
        title: "Operaciones en vivo",
        items: [
          { label: "Status page", href: "https://status.bio-ignicion.app", meta: "Uptime · incidentes históricos · suscripción RSS", external: true },
          { label: "Changelog de Trust Center", href: "mailto:trust@bio-ignicion.app?subject=Trust%20Center%20updates%20subscription", meta: "Suscripción por correo · notificación de cambios materiales" },
        ],
      },
    ],

    approvalKicker: "REVISIÓN Y APROBACIÓN",
    approvalTitle: "Esta página se aprueba formalmente cada trimestre.",
    approvalBody: "El contenido del Trust Center es revisado y aprobado por el equipo de Trust — Seguridad, Privacidad y Plataforma — al menos cada 90 días. Los cambios materiales se publican en el Changelog y los clientes con DPA firmado reciben notificación por correo.",
    approvalRoles: ["Security Lead", "Data Protection Officer", "Platform Engineering"],
    approvalLastLabel: "ÚLTIMA APROBACIÓN",
    approvalLastDate: "2026-04-20",
    approvalNextLabel: "PRÓXIMA REVISIÓN",
    approvalNextDate: "2026-07-20",
    approvalCta: "Suscribirme a cambios",
    approvalCtaHref: "mailto:trust@bio-ignicion.app?subject=Trust%20Center%20updates%20subscription",

    legalKicker: "AVISO LEGAL · ALCANCE",
    legalHint: "Leer",
    legalItems: [
      "Las certificaciones y controles listados aplican en los planes donde se indica explícitamente. SOC 2 Type II se encuentra en auditoría: el reporte sólo se comparte bajo NDA una vez emitido. ISO 27001/27701 están en gap assessment — las fechas objetivo son públicas, no estado vigente.",
      "Las fechas citadas (última revisión, objetivos de auditoría, próxima verificación) reflejan el estado al 2026-04-20 y se actualizan en cada revisión trimestral.",
      "El modelo ROI es un estimador con parámetros auditables. Los resultados reales dependen de implementación, industria y adopción — no constituyen una garantía.",
      <>AWS KMS, DocuSign, Polar, Wahoo, Garmin y CooSpo son marcas registradas de sus respectivos titulares. Su mención es bajo uso referencial (fair use) y no implica partnership, endorsement ni integración certificada salvo donde se indique explícitamente.</>,
      "PSS-4, SWEMWBS, PHQ-2 y NOM-035-STPS Guía II se usan conforme a sus licencias de investigación públicas y se citan a los autores originales.",
      <>Documentos vinculantes: <Link href="/privacy">política de privacidad</Link>, <Link href="/terms">términos</Link> y <Link href="/trust/dpa">DPA</Link>. En caso de conflicto con el contenido resumido en este Trust Center, prevalecen los documentos firmados.</>,
    ],
  },
  en: {
    eyebrow: "TRUST CENTER",
    h1: "Documented, not declaimed.",
    editorial: "Security, privacy and operational resilience — with dates, with methods, with sources.",
    p: "No certification is declared until the audited report is available: the dates below are public targets, not current status. If your security team needs something not listed, write to us.",
    contactLabel: "Security Team",
    contactEmail: "trust@bio-ignicion.app",
    lastReview: "LAST REVIEW",
    lastReviewDate: "2026-04-20",
    lastReviewLabel: "April 20, 2026",

    heroCtaPrimary: "Request security package",
    heroCtaSecondary: "Read DPA",
    heroCtaNote: "Trust team replies within 48 business hours.",

    navKicker: "JUMP TO",
    navItems: [
      { label: "Principles", href: "#trust-principles" },
      { label: "Certifications", href: "#trust-certs" },
      { label: "Controls", href: "#trust-controls" },
      { label: "Methodology", href: "#trust-methodology" },
      { label: "CISO package", href: "#trust-package" },
      { label: "Incidents", href: "#trust-incidents" },
      { label: "Disclosure", href: "#trust-disclosure" },
      { label: "Documentation", href: "#trust-docs" },
      { label: "FAQ", href: "#trust-faq" },
    ],

    principlesKicker: "PRINCIPLES",
    principlesH: "Four decisions that shape our posture.",
    principlesIntro: "Not slogans: each one is verifiable in the code, the architecture, or the audit report.",
    principles: [
      {
        n: "01",
        k: "Privacy by design",
        v: "Personal data encrypted by default, aggregation with k-anonymity k ≥ 5 before any report, retention minimized (90 days of hot audit log, encrypted archive per plan).",
      },
      {
        n: "02",
        k: "Verifiable least-privilege",
        v: "No person has permanent access to customer data. Support access via break-glass with two-person approval + automatic expiration; every event is recorded in a hash-chain audit log.",
      },
      {
        n: "03",
        k: "Operational zero-trust",
        v: "Internal mTLS between services, identity and authorization per request, no implicit \"internal network\". Annual external pentests + continuous bug bounty.",
      },
      {
        n: "04",
        k: "Defensible methods",
        v: "No metric without a public citation. No report below a statistical threshold. No converting ΔHRV below MDC95 into \"vagal lift\" to look good.",
      },
    ],

    proofKicker: "LIVE STATUS",
    proofStats: [
      { v: "SOC 2", l: "Type II", s: "in audit · target 2026-Q3" },
      { v: "< 4h", l: "RTO", s: "RPO 15 min · multi-AZ" },
      { v: "k ≥ 5", l: "anonymity", s: "no report below threshold" },
      { v: "0", l: "reportable incidents", s: "to date · security.txt" },
    ],

    certsKicker: "FRAMEWORKS ALIGNED",
    certsH: "Certifications — target dates, not empty claims.",
    certsHead: { framework: "Framework", status: "Status", target: "Target", tier: "Applies to" },
    certsStamp: "Last verified · 2026-04-20",
    certs: [
      { name: "SOC 2 Type II", status: "In audit", target: "2026-Q3", tier: "All plans", tone: "pending" },
      { name: "ISO 27001", status: "Gap assessment", target: "2026-Q4", tier: "Enterprise", tone: "scoped" },
      { name: "ISO 27701", status: "Scoped", target: "2027-Q1", tier: "Enterprise", tone: "scoped" },
      { name: "HIPAA", status: "BAA available", target: "Current", tier: "Enterprise · signable BAA", tone: "ready" },
      { name: "GDPR / LFPDPPP / LGPD / CCPA", status: "Aligned", target: "Current", tier: "All plans", tone: "ready" },
    ],

    packageKicker: "SECURITY PACKAGE",
    packageH: "What your CISO receives in a zip, under NDA.",
    packageItems: [
      { label: "DPA — Data Processing Agreement", meta: "Signable contract · GDPR Art. 28 + LFPDPPP", tag: "OPEN", href: "/trust/dpa" },
      { label: "SOC 2 Type II — summary", meta: "Public scope · full report under NDA", tag: "NDA", href: "mailto:trust@bio-ignicion.app?subject=SOC%202%20Type%20II%20(NDA)" },
      { label: "Pentest summary 2025", meta: "Coverage · H/M/L findings · remediation · re-test", tag: "NDA", href: "mailto:trust@bio-ignicion.app?subject=Pentest%20summary%202025%20(NDA)" },
      { label: "Subprocessors", meta: "Live list with region, purpose, onboarding date", tag: "OPEN", href: "/trust/subprocessors" },
      { label: "CAIQ v4.0.3 · SIG Lite", meta: "Pre-filled standard questionnaires · reply < 5 days", tag: "NDA", href: "mailto:trust@bio-ignicion.app?subject=Security%20questionnaire%20(NDA)" },
    ],
    packageCta: "Request full package",
    packageNote: "Under NDA — Trust team replies within 48 business hours.",

    controlsKicker: "KEY CONTROLS",
    controlsH: "What protects your data, every day.",
    controls: [
      { k: "Encryption", v: "TLS 1.3 in transit · AES-GCM 256 at rest · per-tenant keys in KMS." },
      { k: "Identity", v: "SSO SAML/OIDC · SCIM 2.0 · MFA TOTP/WebAuthn · session rotation." },
      { k: "Access", v: "Granular RBAC · least-privilege · audited break-glass." },
      { k: "Audit log", v: "Append-only with verifiable hash chain." },
      { k: "Resilience", v: "RPO 15 min · RTO 4 h · multi-AZ · 30-day immutable backup." },
      { k: "Data residency", v: "US · EU · APAC · LATAM on demand." },
      { k: "Aggregate privacy", v: "k-anonymity k ≥ 5 · differential noise ε = 1.0." },
      { k: "Continuity", v: "BCP/DRP documented · quarterly exercises." },
    ],

    methodologyKicker: "METHODOLOGY",
    methodologyH: "How we measure what we report.",
    methodologyIntro: "Every reportable metric is anchored to peer-reviewed literature. No claim uses a proprietary score without a reference. Details let HR/Occupational Health validate the report against their own standards.",

    instrumentsH3: "Psychometric instruments",
    instrumentsHead: { instrument: "Instrument", range: "Range", frequency: "Frequency", reference: "Reference" },
    instruments: [
      { instrument: "PSS-4 (perceived stress)", range: "0–16", frequency: "Monthly", reference: "Cohen & Williamson 1988" },
      { instrument: "SWEMWBS (wellbeing)", range: "7–35 (Rasch)", frequency: "Quarterly", reference: "Stewart-Brown et al. 2009" },
      { instrument: "PHQ-2 (depression screener)", range: "0–6 · cutoff ≥ 3", frequency: "On demand", reference: "Kroenke, Spitzer & Williams 2003" },
      { instrument: "NOM-035-STPS Guide II", range: "46 items", frequency: "Legally annual", reference: "STPS Mexico 2018" },
    ],

    hrvH3: "HRV (heart rate variability)",
    hrv: [
      <><strong>Connection:</strong> Web Bluetooth GATT Heart Rate Service (Polar, Wahoo, Garmin, CooSpo).</>,
      <><strong>Metrics:</strong> RMSSD, SDNN, pNN50, ln(RMSSD) (Task Force 1996; Shaffer & Ginsberg 2017).</>,
      <><strong>Artifact filter:</strong> Malik rule (20%) over RR intervals.</>,
      <><strong>Significant change:</strong> reported as effect only if |Δ RMSSD| ≥ personal MDC95 (Haley & Fragala-Pinkham 2006). Below the threshold = "no change", not "lift".</>,
      <><strong>Aggregation:</strong> mean, 95% CI, % with vagal lift; minimum k = 5 for reporting.</>,
    ],

    effectivenessH3: "Protocol effectiveness (state lift)",
    effectiveness: [
      <><strong>Design:</strong> self-reported pre/post mood, matched by session.</>,
      <><strong>Significance:</strong> 95% CI of mean difference does not cross 0 (equivalent to simple one-tailed t-test).</>,
      <><strong>Effect size:</strong> paired Cohen's d; thresholds 0.2/0.5/0.8 (Cohen 1988; Lakens 2013).</>,
      <><strong>Minimum sample:</strong> n = 5 pairs per protocol/user.</>,
      <><strong>Acknowledged limitation:</strong> mood self-report inflates mild effects — see ROI cap (next section).</>,
    ],

    roiH3: "ROI model — recovered focus hours",
    roiIntro: "Published formula, conservative parameters, auditable sensitivity:",
    roiCode: ROI_CODE,
    roiFoot: <>Empirical basis for <code>residualFactor</code>: Zeidan et al. 2010 (<em>Consciousness &amp; Cognition</em> 19:597-605); Basso et al. 2019 (<em>Behavioural Brain Research</em> 356:208-220). Client values are adjustable: HR/Finance can replace defaults with their own loaded cost and tolerance for observed effect, and see sensitivity directly in the dashboard.</>,

    antiClaimsH3: "What BIO-IGNICIÓN does NOT claim",
    antiClaims: [
      "We are not a clinical diagnosis. A positive PHQ-2 refers to resources; it does not replace a professional.",
      "We don't sell opaque scores. If a metric appears in the report, its source is public.",
      "We don't promise effects without a minimum sample. Below k = 5 responses or n = 30 sessions, the dashboard shows 'insufficient' — we do not extrapolate.",
      "We don't convert ΔHRV below MDC95 into 'vagal lift' to look good.",
    ],

    incidentsKicker: "INCIDENT HISTORY",
    incidentsH: "Anything reportable, here — before you have to ask.",
    incidentsEmptyTitle: "No reportable incidents to date.",
    incidentsEmptyBody: "We define reportable as any event with material impact on confidentiality, integrity, or availability that triggers customer notification under the DPA or regulator reporting (GDPR Art. 33 — 72 h). Minor operational events without exfiltration are published on the Status Page.",
    incidentsLastCheck: "Last verified",
    incidentsNext: "Next review",
    incidentsLastDate: "2026-04-20",
    incidentsNextDate: "2026-07-20",
    incidentsLiveLabel: "Live",
    incidentsStatusLink: "Live Status Page",

    faqKicker: "CISO QUESTIONS",
    faqH: "What your security team asks before signing.",
    faq: [
      {
        q: "How do you handle a Data Subject Access Request (DSAR)?",
        a: "Every DSAR is handled by the Privacy team (dpo@bio-ignicion.app). We respond with the requested data in a portable format (structured JSON + SQL export) within 30 calendar days under GDPR Art. 12 — in practice we close 90% in < 10 business days. Each request is recorded in the append-only audit log and the customer admin can audit it. The DPA details the end-to-end flow.",
      },
      {
        q: "What is your incident notification SLA?",
        a: "We notify all affected customers within 72 h of confirmed detection (GDPR Art. 33 · CCPA §1798.29 · LFPDPPP). For high-impact incidents (confirmed exfiltration, availability loss > 4 h), we notify in < 24 h. Channels: email to designated contacts + public entry on the Status Page + ticket in our support system.",
      },
      {
        q: "Do you verify your backups — and how often?",
        a: "Yes. Daily encrypted backups (AES-GCM-256) with cross-region immutable copy for 30 days. Full restore test every quarter; partial restore monthly. The RTO measured in the last exercise (2026-Q1) was 2 h 47 min, below our SLA of 4 h. Exercises are recorded in an auditable log; evidence available under NDA.",
      },
      {
        q: "How do you rotate encryption keys?",
        a: "Per-tenant keys in AWS KMS with automatic annual rotation and manual on-demand rotation (contract termination, compromise suspicion, region change). Envelope encryption: customer-controlled master key (BYOK / CMK) available in Enterprise. No DEK is persisted in plaintext — neither in backups nor at runtime.",
      },
      {
        q: "How do you train staff on security and privacy?",
        a: "Every employee with production access goes through a security onboarding (8 h) plus quarterly refreshers covering phishing simulations, data handling and incident response drills. Coverage documented in the SOC 2 report. Staff with customer-data access signs an NDA + specific confidentiality agreement; access is reviewed monthly under least-privilege.",
      },
      {
        q: "Can you export our data if we end the contract?",
        a: "Yes — no cost, no friction. With 30 days' notice, we deliver a complete export in portable format (structured JSON + CSV + SQL dump of relevant tables). After 90 days of contract end the data is permanently erased — crypto-shred for keys, DOD 5220.22-M overwrite for residual physical storage. Signed certificate of destruction available on request.",
      },
      {
        q: "How do you handle third-party and support access?",
        a: "Subprocessors listed at /trust/subprocessors with region, purpose and onboarding date. New subprocessors trigger a 30-day customer notification (right of objection under DPA). Support access (our staff) requires break-glass with two-person approval + automatic expiration; each access is recorded in a verifiable hash-chain audit log.",
      },
    ],

    disclosureKicker: "RESPONSIBLE DISCLOSURE",
    disclosureH: "If you found a vulnerability, this is where to report it.",
    disclosureBody: "We accept reports from external researchers under safe-harbor. We do not litigate good-faith reports within the scope below that do not exfiltrate customer data.",
    disclosureFields: [
      { k: "Preferred channel", v: "security@bio-ignicion.app (PGP)", copy: "security@bio-ignicion.app" },
      { k: "PGP fingerprint", v: "D41A 7C59 9E8B 2F4C 8A1D · 6E2F 33B7 5A09 C8D4 F1A2", copy: "D41A7C599E8B2F4C8A1D6E2F33B75A09C8D4F1A2" },
      { k: "In scope", v: "*.bio-ignicion.app, installable PWA, documented public APIs." },
      { k: "Out of scope", v: "Volumetric DoS · staff phishing · findings on third-party subprocessors." },
      { k: "Reward", v: "USD 100 – 5,000 by CVSS v4 severity + demonstrated real impact." },
      { k: "Response SLA", v: "Acknowledgment < 48 business hours · triage < 5 business days." },
    ],
    disclosureCta: "Read security.txt",
    disclosureCtaHref: "/.well-known/security.txt",
    copyLabel: "Copy",
    copyToast: "Copied to clipboard",
    backToTop: "Back to top",

    docsKicker: "DOCUMENTATION",
    docsH: "What your legal and CISO will ask for — right here.",
    docGroups: [
      {
        title: "For Legal",
        items: [
          { label: "Privacy policy", href: "/privacy", meta: "Versioned · last-edit date visible" },
          { label: "Terms of service", href: "/terms", meta: "Current · version history on request" },
          { label: "Downloadable DPA", href: "/trust/dpa", meta: "Data Processing Agreement, DocuSign-signable" },
          { label: "Subprocessors", href: "/trust/subprocessors", meta: "Live list · region · purpose · onboarding date" },
        ],
      },
      {
        title: "For Security",
        items: [
          { label: "Pentest report", href: "mailto:trust@bio-ignicion.app?subject=Pentest%20report%20(NDA)", meta: "Public summary · full report under NDA" },
          { label: "Security questionnaire", href: "mailto:trust@bio-ignicion.app?subject=Security%20questionnaire", meta: "CAIQ v4.0.3 / SIG Lite · under NDA · reply < 5 days" },
          { label: "ISO 27001:2022 mapping", href: "mailto:trust@bio-ignicion.app?subject=ISO%2027001%20mapping", meta: "Annex A control mapping · under NDA" },
        ],
      },
      {
        title: "Live operations",
        items: [
          { label: "Status page", href: "https://status.bio-ignicion.app", meta: "Uptime · historical incidents · RSS subscription", external: true },
          { label: "Trust Center changelog", href: "mailto:trust@bio-ignicion.app?subject=Trust%20Center%20updates%20subscription", meta: "Email subscription · material-change notifications" },
        ],
      },
    ],

    approvalKicker: "REVIEW AND APPROVAL",
    approvalTitle: "This page is formally approved every quarter.",
    approvalBody: "Trust Center content is reviewed and approved by the Trust team — Security, Privacy and Platform — at least every 90 days. Material changes are published in the Changelog and customers with a signed DPA receive email notification.",
    approvalRoles: ["Security Lead", "Data Protection Officer", "Platform Engineering"],
    approvalLastLabel: "LAST APPROVED",
    approvalLastDate: "2026-04-20",
    approvalNextLabel: "NEXT REVIEW",
    approvalNextDate: "2026-07-20",
    approvalCta: "Subscribe to changes",
    approvalCtaHref: "mailto:trust@bio-ignicion.app?subject=Trust%20Center%20updates%20subscription",

    legalKicker: "LEGAL NOTICE · SCOPE",
    legalHint: "Read",
    legalItems: [
      "Certifications and controls listed apply in the tiers where explicitly indicated. SOC 2 Type II is in audit: the report is shared under NDA only once issued. ISO 27001/27701 are in gap assessment — target dates are public commitments, not current status.",
      "Dates cited (last review, audit targets, next verification) reflect status as of 2026-04-20 and are updated each quarterly review.",
      "The ROI model is an estimator with auditable parameters. Actual results depend on implementation, industry and adoption — they do not constitute a guarantee.",
      <>AWS KMS, DocuSign, Polar, Wahoo, Garmin and CooSpo are trademarks of their respective owners. Their mention is under referential fair use and does not imply partnership, endorsement or certified integration unless explicitly stated.</>,
      "PSS-4, SWEMWBS, PHQ-2 and NOM-035-STPS Guide II are used in accordance with their public research licenses and the original authors are cited.",
      <>Binding documents: <Link href="/privacy">privacy policy</Link>, <Link href="/terms">terms</Link> and <Link href="/trust/dpa">DPA</Link>. In case of conflict with the summary content in this Trust Center, the signed documents prevail.</>,
    ],
  },
};

export default async function TrustCenter() {
  const locale = await getServerLocale();
  const L = locale === "en" ? "en" : "es";
  const c = COPY[L];
  const nonce = (await headers()).get("x-nonce") || undefined;

  return (
    <PublicShell activePath="/trust">
      {/* ═══ Hero ═══ */}
      <Container size="lg" className="bi-prose">
        <div style={{ position: "relative", paddingBlock: space[8] }}>
          <div aria-hidden className="bi-trust-lattice">
            <BioglyphLattice variant="ambient" />
          </div>
          <div aria-hidden className="bi-trust-hero-fx" />

          <IgnitionReveal sparkOrigin="30% 40%">
            <div style={{ position: "relative", zIndex: 1, maxInlineSize: 760 }}>
              <div style={kickerStyle}>{c.eyebrow}</div>
              <h1
                style={{
                  margin: `${space[3]}px 0 ${space[4]}px`,
                  fontSize: "clamp(40px, 6vw, 72px)",
                  letterSpacing: "-0.035em",
                  lineHeight: 1.02,
                }}
              >
                {c.h1}
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-editorial), 'Instrument Serif', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: "clamp(18px, 2.2vw, 24px)",
                  lineHeight: 1.35,
                  color: cssVar.textMuted,
                  margin: `0 0 ${space[4]}px`,
                }}
              >
                {c.editorial}
              </p>
              <p style={{ margin: `0 0 ${space[5]}px`, lineHeight: 1.6, color: cssVar.textDim }}>
                {c.p}
              </p>
              <div className="bi-trust-hero-ctas">
                <a
                  className="bi-trust-hero-cta bi-trust-hero-cta--primary"
                  href="mailto:trust@bio-ignicion.app?subject=Security%20package%20(NDA)"
                >
                  {c.heroCtaPrimary}
                  <span className="bi-trust-hero-cta-arrow" aria-hidden>→</span>
                </a>
                <Link
                  className="bi-trust-hero-cta bi-trust-hero-cta--ghost"
                  href="/trust/dpa"
                >
                  {c.heroCtaSecondary}
                </Link>
                <span className="bi-trust-hero-cta-note">{c.heroCtaNote}</span>
              </div>

              <div className="bi-trust-meta" role="group" aria-label={c.lastReview}>
                <span className="bi-trust-meta-kicker">{c.lastReview}</span>
                <time className="bi-trust-meta-time" dateTime={c.lastReviewDate}>{c.lastReviewLabel}</time>
                <span className="bi-trust-meta-dot" aria-hidden>·</span>
                <span className="bi-trust-meta-kicker">{c.contactLabel}</span>
                <a className="bi-trust-meta-mail" href={`mailto:${c.contactEmail}`}>{c.contactEmail}</a>
              </div>
            </div>
          </IgnitionReveal>
        </div>
      </Container>

      {/* ═══ Proof stat strip ═══ */}
      <section aria-label={c.proofKicker} style={{ marginBlockStart: space[6] }}>
        <Container size="xl" style={{ paddingInline: 0 }}>
          <div className="bi-trust-live-kicker" role="status" aria-live="off">
            <span className="bi-trust-live-dot" aria-hidden />
            <span className="bi-trust-live-label">LIVE</span>
            <span className="bi-trust-live-sep" aria-hidden>·</span>
            <span className="bi-trust-live-when">{c.lastReview} {c.lastReviewLabel}</span>
          </div>
          <div className="bi-proof-stats">
            {c.proofStats.map((s) => (
              <div key={s.l}>
                <span className="v">{s.v}</span>
                <span className="l">{s.l}</span>
                <span className="s">{s.s}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ═══ Quick-nav chip strip ═══ */}
      <nav aria-label={c.navKicker} className="bi-trust-nav-wrap">
        <Container size="lg">
          <div className="bi-trust-nav">
            <span className="bi-trust-nav-kicker" aria-hidden>{c.navKicker}</span>
            <ul className="bi-trust-nav-list" role="list">
              {c.navItems.map((n) => (
                <li key={n.href}>
                  <a className="bi-trust-nav-chip" href={n.href} data-trust-chip>{n.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </nav>

      <PulseDivider intensity="dim" />

      {/* ═══ Principles ═══ */}
      <section className="bi-trust-section bi-trust-section--tint" aria-labelledby="trust-principles" style={{ paddingBlock: space[9], paddingInline: space[5], scrollMarginBlockStart: 80 }}>
        <Container size="lg">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[7] }}>
              <div style={kickerStyle}>{c.principlesKicker}</div>
              <h2 id="trust-principles" style={sectionHeading}>{c.principlesH}</h2>
              <p style={{
                marginBlockStart: space[3],
                marginInline: "auto",
                maxInlineSize: 640,
                color: cssVar.textDim,
                fontSize: font.size.md,
                lineHeight: 1.6,
              }}>
                {c.principlesIntro}
              </p>
            </div>
            <ol className="bi-trust-principles" role="list">
              {c.principles.map((p) => (
                <li key={p.n} className="bi-trust-principle">
                  <span className="bi-trust-principle-n" aria-hidden>{p.n}</span>
                  <div className="bi-trust-principle-body">
                    <h3 className="bi-trust-principle-k">{p.k}</h3>
                    <p className="bi-trust-principle-v">{p.v}</p>
                  </div>
                </li>
              ))}
            </ol>
          </IgnitionReveal>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      {/* ═══ Certifications ═══ */}
      <section aria-labelledby="trust-certs" style={{ paddingBlock: space[9], paddingInline: space[5], scrollMarginBlockStart: 80 }}>
        <Container size="lg">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[6] }}>
              <div style={kickerStyle}>{c.certsKicker}</div>
              <h2 id="trust-certs" style={sectionHeading}>{c.certsH}</h2>
            </div>
            <div className="bi-trust-certs-stamp" aria-hidden>
              <span className="dot" /> {c.certsStamp}
            </div>
            <div className="bi-trust-table-wrap">
              <table className="bi-trust-table bi-trust-table--certs">
                <thead>
                  <tr>
                    <th scope="col">{c.certsHead.framework}</th>
                    <th scope="col">{c.certsHead.status}</th>
                    <th scope="col">{c.certsHead.target}</th>
                    <th scope="col">{c.certsHead.tier}</th>
                  </tr>
                </thead>
                <tbody>
                  {c.certs.map((ct) => (
                    <tr key={ct.name}>
                      <th scope="row" className="bi-trust-table-rowh">{ct.name}</th>
                      <td>
                        <span className="bi-trust-status" data-tone={ct.tone}>
                          <span className="dot" aria-hidden />
                          {ct.status}
                        </span>
                      </td>
                      <td className="bi-trust-table-target">{ct.target}</td>
                      <td className="bi-trust-table-tier">{ct.tier}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </IgnitionReveal>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      {/* ═══ Key controls ═══ */}
      <section aria-labelledby="trust-controls" style={{ paddingBlock: space[9], paddingInline: space[5], scrollMarginBlockStart: 80 }}>
        <Container size="xl">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[7] }}>
              <div style={kickerStyle}>{c.controlsKicker}</div>
              <h2 id="trust-controls" style={sectionHeading}>{c.controlsH}</h2>
            </div>
            <div className="bi-how-grid bi-how-grid--nocount bi-trust-controls-grid" role="list">
              {c.controls.map((ctl) => (
                <article key={ctl.k} className="bi-how-step" role="listitem">
                  <h4>{ctl.k}</h4>
                  <p>{ctl.v}</p>
                </article>
              ))}
            </div>
          </IgnitionReveal>
        </Container>
      </section>

      {/* ═══ Methodology ═══ */}
      <section id="methodology" className="bi-trust-section bi-trust-section--tint" aria-labelledby="trust-methodology" style={{ paddingBlock: space[9], paddingInline: space[5], scrollMarginBlockStart: 80 }}>
        <Container size="lg">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[6] }}>
              <div style={kickerStyle}>{c.methodologyKicker}</div>
              <h2 id="trust-methodology" style={sectionHeading}>{c.methodologyH}</h2>
              <p style={{
                marginBlockStart: space[3],
                marginInline: "auto",
                maxInlineSize: 680,
                color: cssVar.textDim,
                fontSize: font.size.md,
                lineHeight: 1.6,
              }}>
                {c.methodologyIntro}
              </p>
            </div>

            <h3 id="instruments" className="bi-trust-h3">{c.instrumentsH3}</h3>
            <div className="bi-trust-table-wrap">
              <table className="bi-trust-table">
                <thead>
                  <tr>
                    <th scope="col">{c.instrumentsHead.instrument}</th>
                    <th scope="col">{c.instrumentsHead.range}</th>
                    <th scope="col">{c.instrumentsHead.frequency}</th>
                    <th scope="col">{c.instrumentsHead.reference}</th>
                  </tr>
                </thead>
                <tbody>
                  {c.instruments.map((i) => (
                    <tr key={i.instrument}>
                      <th scope="row" className="bi-trust-table-rowh">{i.instrument}</th>
                      <td>{i.range}</td>
                      <td>{i.frequency}</td>
                      <td className="bi-trust-table-ref">{i.reference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 id="hrv" className="bi-trust-h3">{c.hrvH3}</h3>
            <ul className="bi-trust-list">
              {c.hrv.map((n, i) => <li key={i}>{n}</li>)}
            </ul>

            <h3 id="effectiveness" className="bi-trust-h3">{c.effectivenessH3}</h3>
            <ul className="bi-trust-list">
              {c.effectiveness.map((n, i) => <li key={i}>{n}</li>)}
            </ul>

            <h3 id="roi" className="bi-trust-h3">{c.roiH3}</h3>
            <p style={{ color: cssVar.textDim, fontSize: font.size.sm, marginBlock: `${space[2]}px ${space[3]}px` }}>
              {c.roiIntro}
            </p>
            <pre className="bi-trust-code">{c.roiCode}</pre>
            <p style={{ color: cssVar.textMuted, fontSize: font.size.xs, marginBlockStart: space[3], lineHeight: 1.6 }}>
              {c.roiFoot}
            </p>

            <div className="bi-trust-anti" aria-labelledby="anti-claims">
              <h3 id="anti-claims" className="bi-trust-anti-title">{c.antiClaimsH3}</h3>
              <ul className="bi-trust-list bi-trust-list--anti">
                {c.antiClaims.map((n) => <li key={n}>{n}</li>)}
              </ul>
            </div>
          </IgnitionReveal>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      {/* ═══ Security package ═══ */}
      <section aria-labelledby="trust-package" style={{ paddingBlock: space[9], paddingInline: space[5], scrollMarginBlockStart: 80 }}>
        <Container size="lg">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[7] }}>
              <div style={kickerStyle}>{c.packageKicker}</div>
              <h2 id="trust-package" style={sectionHeading}>{c.packageH}</h2>
            </div>
            <ul className="bi-trust-package" role="list">
              {c.packageItems.map((p) => {
                const isMail = p.href.startsWith("mailto:");
                const Tag = isMail ? "a" : Link;
                return (
                  <li key={p.label}>
                    <Tag href={p.href} className="bi-trust-package-item">
                      <span className="bi-trust-package-tag" data-tag={p.tag === "NDA" ? "nda" : "open"}>{p.tag}</span>
                      <span className="bi-trust-package-label">{p.label}</span>
                      <span className="bi-trust-package-meta">{p.meta}</span>
                      <span className="bi-trust-package-arrow" aria-hidden>→</span>
                    </Tag>
                  </li>
                );
              })}
            </ul>
            <div className="bi-trust-package-foot">
              <a
                className="bi-trust-package-cta"
                href="mailto:trust@bio-ignicion.app?subject=Security%20package%20(NDA)"
              >
                {c.packageCta}
              </a>
              <span className="bi-trust-package-note">{c.packageNote}</span>
            </div>
          </IgnitionReveal>
        </Container>
      </section>

      {/* ═══ Incident history ═══ */}
      <section aria-labelledby="trust-incidents" style={{ paddingBlock: space[9], paddingInline: space[5], scrollMarginBlockStart: 80 }}>
        <Container size="lg">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[7] }}>
              <div style={kickerStyle}>{c.incidentsKicker}</div>
              <h2 id="trust-incidents" style={sectionHeading}>{c.incidentsH}</h2>
            </div>
            <div className="bi-trust-incidents">
              <div className="bi-trust-incidents-head">
                <span className="bi-trust-incidents-badge" aria-hidden>
                  <span className="dot" />
                </span>
                <h3 className="bi-trust-incidents-title">{c.incidentsEmptyTitle}</h3>
              </div>
              <p className="bi-trust-incidents-body">{c.incidentsEmptyBody}</p>
              <dl className="bi-trust-incidents-meta">
                <div>
                  <dt>{c.incidentsLastCheck}</dt>
                  <dd><time dateTime={c.incidentsLastDate}>{c.incidentsLastDate}</time></dd>
                </div>
                <div>
                  <dt>{c.incidentsNext}</dt>
                  <dd><time dateTime={c.incidentsNextDate}>{c.incidentsNextDate}</time></dd>
                </div>
                <div>
                  <dt>{c.incidentsLiveLabel}</dt>
                  <dd>
                    <a
                      className="bi-trust-incidents-link"
                      href="https://status.bio-ignicion.app"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {c.incidentsStatusLink} <span aria-hidden>↗</span>
                    </a>
                  </dd>
                </div>
              </dl>
            </div>
          </IgnitionReveal>
        </Container>
      </section>

      {/* ═══ Responsible disclosure ═══ */}
      <section className="bi-trust-section bi-trust-section--tint" aria-labelledby="trust-disclosure" style={{ paddingBlock: space[9], paddingInline: space[5], scrollMarginBlockStart: 80 }}>
        <Container size="lg">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[6] }}>
              <div style={kickerStyle}>{c.disclosureKicker}</div>
              <h2 id="trust-disclosure" style={sectionHeading}>{c.disclosureH}</h2>
              <p style={{
                marginBlockStart: space[3],
                marginInline: "auto",
                maxInlineSize: 640,
                color: cssVar.textDim,
                fontSize: font.size.md,
                lineHeight: 1.6,
              }}>
                {c.disclosureBody}
              </p>
            </div>
            <div className="bi-trust-disclosure">
              <dl className="bi-trust-disclosure-grid">
                {c.disclosureFields.map((f) => (
                  <div key={f.k} className="bi-trust-disclosure-row">
                    <dt>{f.k}</dt>
                    <dd>
                      {f.copy ? (
                        <button
                          type="button"
                          className="bi-trust-copy"
                          data-copy={f.copy}
                          aria-label={`${c.copyLabel}: ${f.v}`}
                        >
                          <span className="bi-trust-copy-text">{f.v}</span>
                          <span className="bi-trust-copy-icon" aria-hidden>⧉</span>
                        </button>
                      ) : (
                        f.v
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
              <a
                className="bi-trust-disclosure-cta"
                href={c.disclosureCtaHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                {c.disclosureCta}
                <span aria-hidden>↗</span>
              </a>
            </div>
          </IgnitionReveal>
        </Container>
      </section>

      {/* ═══ Documentation ═══ */}
      <section aria-labelledby="trust-docs" style={{ paddingBlock: space[9], paddingInline: space[5], scrollMarginBlockStart: 80 }}>
        <Container size="lg">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[7] }}>
              <div style={kickerStyle}>{c.docsKicker}</div>
              <h2 id="trust-docs" style={sectionHeading}>{c.docsH}</h2>
            </div>
            <div className="bi-trust-doc-groups">
              {c.docGroups.map((g) => (
                <div key={g.title} className="bi-trust-doc-group">
                  <h3 className="bi-trust-doc-group-title">{g.title}</h3>
                  <ul className="bi-trust-docs" role="list">
                    {g.items.map((d) => {
                      const isMail = d.href.startsWith("mailto:");
                      const Tag = d.external || isMail ? "a" : Link;
                      const extraProps = d.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {};
                      return (
                        <li key={d.href}>
                          <Tag
                            href={d.href}
                            className="bi-trust-doc"
                            {...extraProps}
                          >
                            <span className="bi-trust-doc-label">{d.label}</span>
                            <span className="bi-trust-doc-meta">{d.meta}</span>
                            <span className="bi-trust-doc-arrow" aria-hidden>
                              {d.external ? "↗" : "→"}
                            </span>
                          </Tag>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </IgnitionReveal>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      {/* ═══ FAQ ═══ */}
      <section aria-labelledby="trust-faq" style={{ paddingBlock: space[9], paddingInline: space[5], scrollMarginBlockStart: 80 }}>
        <Container size="md">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[7] }}>
              <div style={kickerStyle}>{c.faqKicker}</div>
              <h2 id="trust-faq" style={sectionHeading}>{c.faqH}</h2>
            </div>
            <div className="bi-faq">
              {c.faq.map((item, i) => (
                <details key={item.q} className="bi-faq-item" open={i === 0}>
                  <summary>
                    <span className="bi-faq-n" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                    <span className="bi-faq-q">{item.q}</span>
                    <span className="chev" aria-hidden>+</span>
                  </summary>
                  <div className="bi-faq-a">{item.a}</div>
                </details>
              ))}
            </div>
          </IgnitionReveal>
        </Container>
      </section>

      {/* ═══ Review & approval ═══ */}
      <section className="bi-trust-section bi-trust-section--tint bi-trust-section--tint-alt" aria-labelledby="trust-approval" style={{ paddingBlock: space[8], paddingInline: space[5] }}>
        <Container size="lg">
          <div className="bi-trust-approval">
            <div className="bi-trust-approval-head">
              <span className="bi-trust-approval-kicker">{c.approvalKicker}</span>
              <h2 id="trust-approval" className="bi-trust-approval-title">{c.approvalTitle}</h2>
            </div>
            <p className="bi-trust-approval-body">{c.approvalBody}</p>
            <ul className="bi-trust-approval-roles" role="list" aria-label={c.approvalKicker}>
              {c.approvalRoles.map((r) => (
                <li key={r}>
                  <span className="bi-trust-approval-role-dot" aria-hidden />
                  {r}
                </li>
              ))}
            </ul>
            <dl className="bi-trust-approval-meta">
              <div>
                <dt>{c.approvalLastLabel}</dt>
                <dd><time dateTime={c.approvalLastDate}>{c.approvalLastDate}</time></dd>
              </div>
              <div>
                <dt>{c.approvalNextLabel}</dt>
                <dd><time dateTime={c.approvalNextDate}>{c.approvalNextDate}</time></dd>
              </div>
            </dl>
            <a className="bi-trust-approval-cta" href={c.approvalCtaHref}>
              {c.approvalCta}
              <span aria-hidden>→</span>
            </a>
          </div>
        </Container>
      </section>

      {/* ═══ Legal disclaimer (collapsible) ═══ */}
      <Container size="md" style={{ paddingInline: space[5], paddingBlockEnd: space[8] }}>
        <details className="bi-pricing-legal" role="note">
          <summary className="bi-pricing-legal-summary">
            <span className="bi-pricing-legal-kicker">{c.legalKicker}</span>
            <span className="bi-pricing-legal-hint">
              {c.legalHint}
              <span className="chev" aria-hidden>▾</span>
            </span>
          </summary>
          <ul className="bi-trust-legal-list">
            {c.legalItems.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </details>
      </Container>

      <TrustEnhancements copyToast={c.copyToast} topLabel={c.backToTop} />

      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: c.faq.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: {
                "@type": "Answer",
                text: typeof f.a === "string" ? f.a : "",
              },
            })),
          }),
        }}
      />
    </PublicShell>
  );
}
