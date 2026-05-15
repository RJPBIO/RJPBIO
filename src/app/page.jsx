import Link from "next/link";
import dynamic from "next/dynamic";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font, bioSignal, radius } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";
import { EVIDENCE } from "@/lib/evidence";
import { P as PROTOCOLS } from "@/lib/protocols";
import { PRICE_PEEK, PARTNER_COPY, DESIGN_PARTNER } from "@/lib/pricing";
// Above-the-fold (eager — necesarios para LCP):
import SensoryHero from "@/components/brand/SensoryHero";
import IgnitionReveal from "@/components/brand/IgnitionReveal";
import CountUp from "@/components/brand/CountUp";
import CohortCountdown from "@/components/brand/CohortCountdown";
import SectionKicker from "@/components/brand/SectionKicker";
import { BioGlyph } from "@/components/BioIgnicionMark";

// Below-the-fold (lazy — chunks separados, no bloquean initial paint).
// next/dynamic con ssr:true preserva HTML render (SEO intacto) pero el
// JS de hidratación va a chunks aparte → main bundle más pequeño →
// menos main-thread work al cargar la landing.
const PartnerApplyModal = dynamic(() => import("@/components/ui/PartnerApplyModal"));
const SpotlightGrid = dynamic(() => import("@/components/brand/SpotlightGrid"));
const PWAShowcase = dynamic(() => import("@/components/brand/PWAShowcase"));
const ProductEvidence = dynamic(() => import("@/components/brand/ProductEvidence"));

export const metadata = {
  title: { absolute: "BIO-IGNICIÓN — Neural Performance" },
  description: "Plataforma B2B de neural adaptation. HRV medible, intervención sensorial (audio + haptics + binaural) y compliance de grado empresarial (SOC 2 · HIPAA · NOM-035).",
  alternates: { canonical: "/" },
  openGraph: {
    title: "BIO-IGNICIÓN — Neural Performance",
    description: "Se siente. Se mide. Se firma. El primer instrumento neural B2B con recibos — HRV medible, pulso háptico, NOM-035 firmable. 3 minutos pre y post turno.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
};

const COPY = {
  es: {
    hero: {
      kicker: "INSTRUMENTO NEURAL · B2B",
      title1: "Se siente. Se mide.",
      title2: "Se firma.",
      sub: "El operador resetea su sistema nervioso en 60–180 segundos. Tu compliance officer recibe el recibo firmado. Una PWA local-first y una consola enterprise — la misma plataforma.",
      buttonIdle: "Activar pulso",
      buttonPulsing: "Sintiendo…",
      buttonAria: "Activar pulso sensorial de 3 segundos",
      hint: "3 segundos · audio + vibración",
      afterLine: "Sentiste el pulso. Eso apenas es uno de tres.",
      secondaryCta: "Ver demo en vivo · 30 min",
      secondaryHref: "/demo",
      chips: ["SOC 2", "HIPAA-ready", "GDPR", "NOM-035", "Zero telemetry"],
      chipsLabel: "Compliance y confianza",
      partnerChip: `Design Partner · ${DESIGN_PARTNER.slotsTotal} cupos · cohorte Q2 2026 · −${DESIGN_PARTNER.discountPct}% × ${DESIGN_PARTNER.termMonths}m`,
      partnerChipHref: "/pricing#design-partner",
      partnerChipAria: `Ver programa Design Partner: ${DESIGN_PARTNER.slotsTotal} cupos abiertos para cohorte Q2 2026 con ${DESIGN_PARTNER.discountPct}% de descuento por ${DESIGN_PARTNER.termMonths} meses`,
    },

    proofKicker: "LO QUE EL CÓDIGO SOSTIENE",
    proof: {
      s1Label: "protocolos neuro-fisiológicos · 60–180 s",
      s1Sub:   (n) => `${n} con mecanismo documentado · catálogo en src/lib/protocols.js`,
      s2Label: "estudios peer-reviewed con DOI verificable",
      s2Sub:   "Balban 2023 · Lehrer 2014 · Goessl 2017 d=0.83 · auditables en /evidencia",
      s3Value: "k≥5",
      s3Label: "umbral de agregación · cero datos individuales crudos",
      s3Sub:   "El admin ve señales de equipo, nunca a una persona",
      s4Label: "cohorte piloto Q2 2026 · 12 organizaciones",
      s4Sub:   "Cierra cohorte / abre Q3 con pricing +12 %",
    },

    twoKicker: "UNA PLATAFORMA · DOS SUPERFICIES",
    twoH: "El operador y su compliance officer. La misma demo.",
    twoSub: "Casi toda plataforma de bienestar le habla a uno o al otro. Bio-Ignición es una sola pieza de software con dos caras: la que el equipo abre en 60 segundos, y la que RRHH y seguridad auditan.",
    twoSurfaces: [
      {
        tag: "SUPERFICIE 1 · EL OPERADOR",
        title: "La PWA neural",
        body: "Local-first, sin app store. El operador abre, mide su HRV — cámara PPG propia o strap BLE — y corre un protocolo de 60–180 s con audio binaural, haptics al milisegundo y voz guiada. El dato individual nunca sale del dispositivo.",
        points: [
          "23 protocolos · motor adaptativo bandit UCB",
          "HRV por cámara PPG propia o strap BLE",
          "IndexedDB cifrado AES-GCM 256 · offline-first",
        ],
      },
      {
        tag: "SUPERFICIE 2 · COMPLIANCE",
        title: "La consola enterprise",
        body: "24 páginas de administración. RRHH recibe agregados k-anónimos ≥ 5 y el reporte NOM-035 STPS firmable. Seguridad recibe SCIM 2.0, SSO federado, MFA con passkeys y un audit log con hash chain verificable.",
        points: [
          "NOM-035 STPS · export ECO37 firmado SHA-256",
          "SCIM 2.0 · SSO Google · Azure · Okta · Apple",
          "Audit hash-chain · DSAR GDPR Art. 15/17/20",
        ],
      },
    ],

    sectorsKicker: "DISEÑADO PARA · CONTEXTOS OPERATIVOS",
    sectorsH: "Donde la fatiga no es métrica de wellness — es riesgo de incidente.",
    sectorsSub: "8 verticales con guía de implementación dedicada. No es 'enterprise wellness' genérico: cada uno toca un caso real (pre-shift de aviación, on-call de tech, turnos clínicos, traders en cierre).",
    sectors: [
      { slug: "/for-aviation",      label: "Aviación",       sub: "Pilotos · tripulación · pre-shift" },
      { slug: "/for-healthcare",    label: "Salud",          sub: "Clínicos en turno · enfermería" },
      { slug: "/for-finance",       label: "Finanzas",       sub: "Trading · risk · cierre" },
      { slug: "/for-tech",          label: "Tecnología",     sub: "Ingeniería · on-call · SRE" },
      { slug: "/for-energy",        label: "Energía",        sub: "Operadores de planta · turnos" },
      { slug: "/for-manufacturing", label: "Manufactura",    sub: "Línea de producción · supervisión" },
      { slug: "/for-logistics",     label: "Logística",      sub: "Conductores · centros · supervisión" },
      { slug: "/for-public-sector", label: "Sector público", sub: "Operativos · primera respuesta" },
    ],

    voiceLine: "Construimos esto porque la \"wellness corporativa\" era teatro. Si tu compliance officer no firma el recibo al cierre del trimestre, no pasó.",
    voiceAttribution: "— Equipo Bio-Ignición",

    evidenceKicker: "EVIDENCIA OPERATIVA · EL FORMATO DE LOS ARTIFACTS",
    evidenceH: "Tres recibos. Este es su formato exacto.",
    evidenceSub: "El export NOM-035, el JSON GDPR disociado y el audit log que la plataforma produce — en su formato real. Los valores son ilustrativos; la estructura, el firmado SHA-256 y el hash chain son exactos.",
    evidence: {
      nomKicker: "NOM-035 STPS · EXPORT ECO37",
      nomTitle: "El reporte que tu compliance officer firma.",
      nomCaption: "Export automatizado · firmado por clinical lead · listo para auditoría STPS.",
      nomLines: [
        { text: "REPORTE NOM-035 · ECO37",                       kind: "kicker" },
        { text: "Organización: Empresa Ejemplo · 2026-Q1",        kind: "meta" },
        { text: "Rango: 2026-01-01 → 2026-03-31",                 kind: "meta" },
        { text: "Cohorte: 47 usuarios activos · k-anon ≥ 5",      kind: "meta" },
        { text: "" },
        { text: "DOMINIO         BASELINE   Δ 90d   CONF",        kind: "meta" },
        { text: "─────────────────────────────────────────",      kind: "rule" },
        { text: "Carga           68 → 71    +3      ±1.8" },
        { text: "Autonomía       72 → 76    +4      ±2.1" },
        { text: "Apoyo           65 → 69    +4      ±2.4" },
        { text: "Reconocimiento  70 → 73    +3      ±2.0" },
        { text: "" },
        { text: "Firmado: clinical_lead@empresa.ejemplo",         kind: "meta" },
        { text: "SHA-256: d4e5f6…c8a2 · verificable",             kind: "hash" },
      ],

      exportKicker: "EXPORT GDPR · DATOS DISOCIADOS",
      exportTitle: "El JSON que le entregas a tu DPO.",
      exportCaption: "Local-first · la señal individual nunca sale del dispositivo · solo agregados k-anónimos ≥ 5.",
      exportLines: [
        { text: "{",                                               kind: "value" },
        { text: '  "schema": "bio-ignicion/export/v2",' },
        { text: '  "cohort": "team-ops-2026q1",' },
        { text: '  "k_anonymity": 5,' },
        { text: '  "period": "2026-01-01/2026-03-31",' },
        { text: '  "protocols_active": 14,' },
        { text: '  "sessions_total": 3247,' },
        { text: '  "hrv": {' },
        { text: '    "rmssd": { "mean": 41.2, "sd": 8.4 },' },
        { text: '    "sdnn":  { "mean": 52.7, "sd": 11.9 }' },
        { text: '  },' },
        { text: '  "baseline_delta": +4.3,',                      kind: "delta" },
        { text: '  "signature": "sha256:b7c4…a9f1"',              kind: "hash" },
        { text: "}",                                               kind: "value" },
      ],

      auditKicker: "AUDIT LOG · HASH CHAIN",
      auditTitle: "Cada operación queda firmada.",
      auditCaption: "Toda acción sensible se registra y encadena · hash verificable en tiempo real desde /trust.",
      auditLines: [
        { text: "#00412  2026-04-22T09:14:03Z",                   kind: "kicker" },
        { text: "  actor:  admin@empresa.ejemplo",                kind: "meta" },
        { text: "  action: export.sign.nom035" },
        { text: "  scope:  team-ops-2026q1" },
        { text: "  prev:   8b7c4e…",                              kind: "hash" },
        { text: "  hash:   d4e5f6…c8a2",                          kind: "hash" },
        { text: "  ok:     verified",                             kind: "ok" },
        { text: "" },
        { text: "#00413  2026-04-22T09:14:47Z",                   kind: "kicker" },
        { text: "  actor:  clinical.lead@empresa.ejemplo",        kind: "meta" },
        { text: "  action: baseline.review.approve" },
        { text: "  prev:   d4e5f6…",                              kind: "hash" },
        { text: "  hash:   a1b2c3…",                              kind: "hash" },
        { text: "  ok:     verified",                             kind: "ok" },
      ],
    },


    howKicker: "CÓMO FUNCIONA",
    howH: "Tres pasos. Cero abstracciones.",
    howSub: "Mide, ejecuta, firma — con mecanismo y evidencia citada en cada paso. El motor adaptativo elige el protocolo correcto según tu HRV, tu sueño y tu hora pico. Sin blackbox.",
    how: [
      {
        n: "01",
        t: "Mide.",
        d: "El operador mide su HRV: cámara PPG con algoritmo propio o strap BLE (Polar / Wahoo / Garmin HRM). RMSSD + SDNN al milisegundo. El dato individual nunca sale del dispositivo.",
        cite: "Lehrer & Gevirtz, 2014 · Frontiers in Psychology",
        citeHref: "https://doi.org/10.3389/fpsyg.2014.00756",
      },
      {
        n: "02",
        t: "Ejecuta.",
        d: "23 protocolos de 60–180 s con visualización dedicada por fase. El motor adaptativo elige según HRV, sueño y hora pico. Audio binaural, haptics al milisegundo y voz guiada.",
        cite: "Balban et al., 2023 · Cell Reports Medicine · n=114, d≈0.45",
        citeHref: "https://doi.org/10.1016/j.xcrm.2022.100895",
      },
      {
        n: "03",
        t: "Firma.",
        d: "Export NOM-035 STPS automatizado, agregados k-anónimos ≥ 5, audit log con hash chain verificable. Lo firma tu compliance officer — nosotros solo producimos el artifact.",
        cite: "Goessl, Curtiss & Hofmann, 2017 · Psychological Medicine · meta-análisis n=1868, d=0.83",
        citeHref: "https://doi.org/10.1017/S0033291717001003",
      },
    ],
    howCapabilities: [
      { k: "Offline-first", v: "PWA sin instalar" },
      { k: "Local-first",   v: "IndexedDB cifrado" },
      { k: "Telemetría",    v: "Opt-in, cero por defecto" },
      { k: "Export",        v: "JSON firmado · <24h" },
      { k: "Idiomas",       v: "Español · English" },
      { k: "Audit log",     v: "Hash chain verificable" },
    ],
    howFootnote: "Mecanismos y citas completas en ",
    howFootnoteLink: "/evidencia",

    personaKicker: "PARA QUIÉN",
    personaH: "Tres escritorios. Tres preguntas, contestadas con lo que el código sostiene.",
    personas: [
      {
        role: "CHRO · PEOPLE OPS",
        title: "¿Cómo mido bienestar sin invadir?",
        body: "Panel de equipo con k-anonymity ≥ 5: si no hay 5 personas, no hay número. Reporte NOM-035 STPS automatizado — aplicador de 46 ítems, Guía II/III — con export ECO37 firmado SHA-256.",
        points: ["NOM-035 STPS · 46 ítems · export firmado", "Agregados solo con n ≥ 5 · cero datos crudos", "3 instrumentos validados: PSS-4 · SWEMWBS-7 · PHQ-2"],
        outcome: "Día 90: primer reporte NOM-035 firmado y adherencia por equipo medible.",
      },
      {
        role: "VP PEOPLE · L&D",
        title: "¿Cómo logro adopción sin forzar?",
        body: "Tap-to-Ignite en estaciones físicas NFC/QR firmadas con HMAC: 15 segundos por pulso, sin login. Integración con Slack y Google Calendar para nudges que respetan la agenda — no la interrumpen.",
        points: ["Estaciones NFC/QR · firma HMAC + replay-guard", "Slack + Google Calendar · nudges no intrusivos", "Sesiones de 60–180 s — caben en lo que tardas en un café"],
        outcome: "Día 90: cohorte activa a ≥ 3 pulsos/semana sin comunicados forzados.",
      },
      {
        role: "CISO · IT SECURITY",
        title: "¿Y tu historia de seguridad?",
        body: "SSO federado con 4 proveedores OIDC (Google · Azure · Okta · Apple) más SAML. SCIM 2.0 completo para provisioning. MFA TOTP + passkeys WebAuthn. Audit log con hash chain — corre verify:audit para tu evidence pack.",
        points: ["SCIM 2.0 · SSO 4 proveedores OIDC · SAML", "WebAuthn passkeys + TOTP MFA · ipAllowlist por org", "Audit hash-chain verificable · DSAR GDPR · SOC 2 en auditoría"],
        outcome: "Día 60: SSO federado en producción, SCIM provisionando y audit log auditable.",
      },
    ],

    intKicker: "ECOSISTEMA",
    intH: "Habla con las herramientas que ya usas.",
    integrations: [
      "Slack", "Google Calendar", "Google SSO", "Microsoft SSO", "Okta", "BLE strap (Polar/Wahoo/Garmin HRM)", "Cámara PPG (algoritmo propio)", "Whoop · webhook", "Oura · webhook", "Fitbit · webhook", "Webhooks HMAC", "REST API", "SCIM 2.0",
    ],

    trustKicker: "CUMPLIMIENTO",
    trust: [
      { label: "SOC 2 Type II",  status: "en auditoría",       tone: "pending" },
      { label: "HIPAA · BAA",    status: "firmable · Enterprise", tone: "ready"   },
      { label: "GDPR · UE",      status: "residencia opcional",   tone: "ready"   },
      { label: "NOM-035 STPS",   status: "reporte automatizado",  tone: "ready"   },
      { label: "CFDI 4.0",       status: "todos los planes",      tone: "ready"   },
      { label: "Audit log",      status: "hash chain verificable", tone: "ready"  },
    ],
    trustNote: "Estado en vivo · detalle firmado en",
    trustNoteLink: "/trust",
    intNote: "Integraciones disponibles y roadmap público en",
    intNoteLink: "/changelog",

    priceKicker: "PRECIOS · EN LA LUZ",
    priceH: "Starter. Growth. Enterprise.",
    priceSub: "Por usuario activo. 20 % off anual. Volume discount hasta −20 %. MXN · USD · EUR. Cero setup oculto.",
    priceCta: "Ver precios completos",
    priceNote: "Starter trial 14 d · Growth piloto 30 d · Enterprise 60 d con DPA",
    trialKicker: "PARA EVALUACIÓN INDIVIDUAL",
    trialBody: "Empieza un Starter trial 14 días sin tarjeta. Mide tu baseline antes de pitchear internamente.",
    trialCtaInline: "Empezar trial 14 d · sin tarjeta",

    cinePauseLine: "Ya viste cómo late. Ahora tócalo.",

    finalKicker: "SIGUIENTE",
    finalH1: "Esto no es wellness.",
    finalH2: "Es pre-shift physiological instrumentation.",
    finalBody: "30 minutos · una sesión en vivo · 12 cupos cohorte Q2 2026. Sin slides. Corremos un protocolo contigo, leemos tu HRV y respondemos todo sobre seguridad.",
    finalCta: "Agendar demo",
    trialCta: "Empezar gratis · 14 d",
    trialSub: "Plan Starter · sin tarjeta",
    shipChip: "Últimos envíos · changelog",

    pwa: {
      kicker: "EL MOTOR · EN TU BOLSILLO",
      headline: "Tu app neural. Instalable en iOS y Android. Sin app store.",
      sub: "BIO-IGNICIÓN es una Progressive Web App. Se instala desde el navegador en 15 segundos — Safari en iOS, Chrome en Android. Cero descarga desde tienda. Cero revisiones de Apple o Google. Cero actualizaciones forzadas. El motor vive en el bolsillo de tu equipo en minutos, no en semanas.",
      benefitsAria: "Beneficios clave de la PWA",
      benefits: [
        { glyph: "download", t: "iOS + Android · 15 s", d: "Safari → Compartir → Añadir a inicio. Chrome → Instalar. Se comporta como una app nativa sin pasar por tienda." },
        { glyph: "wifi-off", t: "Offline-first", d: "Respira sin señal. Service worker cachea protocolos, audios y tu baseline. Úsala en vuelo o en zona sin cobertura." },
        { glyph: "lock",     t: "Local-first · cifrado", d: "Tu HRV y baseline viven en IndexedDB cifrado en el dispositivo. Cero telemetría por defecto. Export firmado en <24 h." },
        { glyph: "brain",    t: "Motor adaptativo", d: "Tras 3 sesiones detecta tu hora pico, tu respuesta a cada protocolo y qué sensorialidad te ancla. Deja de ser plantilla." },
        { glyph: "waves",    t: "Audio · Haptics · Binaural", d: "Sincronizados al milisegundo. Wake-lock para que la pantalla no se apague. Cada fase cita el estudio detrás." },
        { glyph: "clock",    t: "<60 s por pulso", d: "Cabe en lo que tardas en preparar café. Hasta 800+ sesiones por usuario al año sin robar tiempo al equipo." },
      ],
      platformsAria: "Cómo instalar en tu plataforma",
      platforms: {
        ios:     { label: "Disponible en iOS",     sub: "Safari → Compartir → Añadir a inicio" },
        android: { label: "Disponible en Android", sub: "Chrome → Menú → Instalar app" },
        web:     { label: "Abrir en navegador",    sub: "Funciona sin instalar — cualquier dispositivo" },
      },
      fomo: `Design Partner · ${DESIGN_PARTNER.slotsTotal} cupos · −${DESIGN_PARTNER.discountPct}% por ${DESIGN_PARTNER.termMonths} meses`,
      ctaPrimary: "Activar mi motor · 60 s · gratis",
      ctaSecondary: "Agendar demo · 30 min",
      ctaFoot: "Sin tarjeta · sin instalación · corre en tu navegador",
    },
  },
  en: {
    hero: {
      kicker: "NEURAL INSTRUMENT · B2B",
      title1: "Felt. Measured.",
      title2: "Signed.",
      sub: "The operator resets their nervous system in 60–180 seconds. Your compliance officer gets the signed receipt. A local-first PWA and an enterprise console — one platform.",
      buttonIdle: "Activate pulse",
      buttonPulsing: "Feeling…",
      buttonAria: "Activate 3-second sensory pulse",
      hint: "3 seconds · audio + haptics",
      afterLine: "You felt the pulse. That's only one of three.",
      secondaryCta: "See a live demo · 30 min",
      secondaryHref: "/demo",
      chips: ["SOC 2", "HIPAA-ready", "GDPR", "NOM-035", "Zero telemetry"],
      chipsLabel: "Compliance and trust",
      partnerChip: `Design Partner · ${DESIGN_PARTNER.slotsTotal} slots · Q2 2026 cohort · −${DESIGN_PARTNER.discountPct}% × ${DESIGN_PARTNER.termMonths}mo`,
      partnerChipHref: "/pricing#design-partner",
      partnerChipAria: `See Design Partner program: ${DESIGN_PARTNER.slotsTotal} slots open for Q2 2026 cohort at ${DESIGN_PARTNER.discountPct}% off for ${DESIGN_PARTNER.termMonths} months`,
    },

    proofKicker: "WHAT THE CODE BACKS",
    proof: {
      s1Label: "neuro-physiological protocols · 60–180 s",
      s1Sub:   (n) => `${n} with documented mechanism · catalog in src/lib/protocols.js`,
      s2Label: "peer-reviewed studies with verifiable DOI",
      s2Sub:   "Balban 2023 · Lehrer 2014 · Goessl 2017 d=0.83 · auditable at /evidencia",
      s3Value: "k≥5",
      s3Label: "aggregation threshold · zero raw individual data",
      s3Sub:   "The admin sees team signals, never one person",
      s4Label: "Q2 2026 pilot cohort · 12 organizations",
      s4Sub:   "Cohort closes / Q3 opens at +12 % pricing",
    },

    twoKicker: "ONE PLATFORM · TWO SURFACES",
    twoH: "The operator and their compliance officer. Same demo.",
    twoSub: "Almost every wellness platform talks to one or the other. Bio-Ignición is a single piece of software with two faces: the one your team opens in 60 seconds, and the one HR and security audit.",
    twoSurfaces: [
      {
        tag: "SURFACE 1 · THE OPERATOR",
        title: "The neural PWA",
        body: "Local-first, no app store. The operator opens it, measures HRV — in-house camera PPG or BLE strap — and runs a 60–180 s protocol with binaural audio, millisecond haptics and guided voice. Individual data never leaves the device.",
        points: [
          "23 protocols · bandit-UCB adaptive engine",
          "HRV via in-house camera PPG or BLE strap",
          "AES-GCM 256 encrypted IndexedDB · offline-first",
        ],
      },
      {
        tag: "SURFACE 2 · COMPLIANCE",
        title: "The enterprise console",
        body: "24 admin pages. HR gets k-anonymous ≥ 5 aggregates and the signable NOM-035 STPS report. Security gets SCIM 2.0, federated SSO, MFA with passkeys and an audit log with verifiable hash chain.",
        points: [
          "NOM-035 STPS · ECO37 export signed SHA-256",
          "SCIM 2.0 · SSO Google · Azure · Okta · Apple",
          "Audit hash-chain · DSAR GDPR Art. 15/17/20",
        ],
      },
    ],

    sectorsKicker: "BUILT FOR · OPERATIONAL CONTEXTS",
    sectorsH: "Where fatigue isn't a wellness metric — it's incident risk.",
    sectorsSub: "8 verticals with dedicated implementation playbooks. Not generic enterprise wellness: each one hits a real case (aviation pre-shift, tech on-call, clinical shifts, traders at close).",
    sectors: [
      { slug: "/for-aviation",      label: "Aviation",       sub: "Pilots · crew · pre-shift" },
      { slug: "/for-healthcare",    label: "Healthcare",     sub: "Clinicians on shift · nursing" },
      { slug: "/for-finance",       label: "Finance",        sub: "Trading · risk · close" },
      { slug: "/for-tech",          label: "Technology",     sub: "Engineering · on-call · SRE" },
      { slug: "/for-energy",        label: "Energy",         sub: "Plant operators · shifts" },
      { slug: "/for-manufacturing", label: "Manufacturing",  sub: "Production line · supervision" },
      { slug: "/for-logistics",     label: "Logistics",      sub: "Drivers · centers · supervision" },
      { slug: "/for-public-sector", label: "Public sector",  sub: "Operations · first response" },
    ],

    voiceLine: "We built this because \"corporate wellness\" was theater. If your compliance officer doesn't sign the receipt at quarter close, it didn't happen.",
    voiceAttribution: "— The Bio-Ignición team",

    evidenceKicker: "OPERATIONAL EVIDENCE · THE ARTIFACT FORMAT",
    evidenceH: "Three receipts. This is their exact format.",
    evidenceSub: "The NOM-035 export, the disassociated GDPR JSON and the audit log the platform produces — in their real format. Values are illustrative; the structure, the SHA-256 signing and the hash chain are exact.",
    evidence: {
      nomKicker: "NOM-035 STPS · ECO37 EXPORT",
      nomTitle: "The report your compliance officer signs.",
      nomCaption: "Automated export · signed by clinical lead · ready for STPS audit.",
      nomLines: [
        { text: "NOM-035 REPORT · ECO37",                         kind: "kicker" },
        { text: "Organization: Example Corp · 2026-Q1",           kind: "meta" },
        { text: "Window: 2026-01-01 → 2026-03-31",                kind: "meta" },
        { text: "Cohort: 47 active users · k-anon ≥ 5",           kind: "meta" },
        { text: "" },
        { text: "DOMAIN          BASELINE   Δ 90d   CONF",        kind: "meta" },
        { text: "─────────────────────────────────────────",      kind: "rule" },
        { text: "Load            68 → 71    +3      ±1.8" },
        { text: "Autonomy        72 → 76    +4      ±2.1" },
        { text: "Support         65 → 69    +4      ±2.4" },
        { text: "Recognition     70 → 73    +3      ±2.0" },
        { text: "" },
        { text: "Signed: clinical_lead@example.corp",             kind: "meta" },
        { text: "SHA-256: d4e5f6…c8a2 · verifiable",              kind: "hash" },
      ],

      exportKicker: "GDPR EXPORT · DISASSOCIATED DATA",
      exportTitle: "The JSON you hand your DPO.",
      exportCaption: "Local-first · individual signal never leaves the device · only k-anonymous aggregates ≥ 5.",
      exportLines: [
        { text: "{",                                               kind: "value" },
        { text: '  "schema": "bio-ignition/export/v2",' },
        { text: '  "cohort": "team-ops-2026q1",' },
        { text: '  "k_anonymity": 5,' },
        { text: '  "period": "2026-01-01/2026-03-31",' },
        { text: '  "protocols_active": 14,' },
        { text: '  "sessions_total": 3247,' },
        { text: '  "hrv": {' },
        { text: '    "rmssd": { "mean": 41.2, "sd": 8.4 },' },
        { text: '    "sdnn":  { "mean": 52.7, "sd": 11.9 }' },
        { text: '  },' },
        { text: '  "baseline_delta": +4.3,',                      kind: "delta" },
        { text: '  "signature": "sha256:b7c4…a9f1"',              kind: "hash" },
        { text: "}",                                               kind: "value" },
      ],

      auditKicker: "AUDIT LOG · HASH CHAIN",
      auditTitle: "Every operation is signed.",
      auditCaption: "Every sensitive action is logged and chained · hash verifiable in real time from /trust.",
      auditLines: [
        { text: "#00412  2026-04-22T09:14:03Z",                   kind: "kicker" },
        { text: "  actor:  admin@example.corp",                   kind: "meta" },
        { text: "  action: export.sign.nom035" },
        { text: "  scope:  team-ops-2026q1" },
        { text: "  prev:   8b7c4e…",                              kind: "hash" },
        { text: "  hash:   d4e5f6…c8a2",                          kind: "hash" },
        { text: "  ok:     verified",                             kind: "ok" },
        { text: "" },
        { text: "#00413  2026-04-22T09:14:47Z",                   kind: "kicker" },
        { text: "  actor:  clinical.lead@example.corp",           kind: "meta" },
        { text: "  action: baseline.review.approve" },
        { text: "  prev:   d4e5f6…",                              kind: "hash" },
        { text: "  hash:   a1b2c3…",                              kind: "hash" },
        { text: "  ok:     verified",                             kind: "ok" },
      ],
    },


    howKicker: "HOW IT WORKS",
    howH: "Three steps. Zero abstractions.",
    howSub: "Measure, execute, sign — with mechanism and cited evidence at every step. The adaptive engine picks the right protocol from your HRV, sleep and peak hour. No blackbox.",
    how: [
      {
        n: "01",
        t: "Measure.",
        d: "The operator measures HRV: in-house camera PPG algorithm or BLE strap (Polar / Wahoo / Garmin HRM). RMSSD + SDNN to the millisecond. Individual data never leaves the device.",
        cite: "Lehrer & Gevirtz, 2014 · Frontiers in Psychology",
        citeHref: "https://doi.org/10.3389/fpsyg.2014.00756",
      },
      {
        n: "02",
        t: "Execute.",
        d: "23 protocols of 60–180 s with phase-dedicated visualization. The adaptive engine picks from HRV, sleep and peak hour. Binaural audio, millisecond haptics and guided voice.",
        cite: "Balban et al., 2023 · Cell Reports Medicine · n=114, d≈0.45",
        citeHref: "https://doi.org/10.1016/j.xcrm.2022.100895",
      },
      {
        n: "03",
        t: "Sign.",
        d: "Automated NOM-035 STPS export, k-anonymous ≥ 5 aggregates, audit log with verifiable hash chain. Your compliance officer signs it — we just produce the artifact.",
        cite: "Goessl, Curtiss & Hofmann, 2017 · Psychological Medicine · meta-analysis n=1868, d=0.83",
        citeHref: "https://doi.org/10.1017/S0033291717001003",
      },
    ],
    howCapabilities: [
      { k: "Offline-first", v: "PWA, no install" },
      { k: "Local-first",   v: "Encrypted IndexedDB" },
      { k: "Telemetry",     v: "Opt-in, zero by default" },
      { k: "Export",        v: "Signed JSON · <24h" },
      { k: "Languages",     v: "Español · English" },
      { k: "Audit log",     v: "Verifiable hash chain" },
    ],
    howFootnote: "Full mechanisms and citations at ",
    howFootnoteLink: "/evidencia",

    personaKicker: "FOR WHO",
    personaH: "Three desks. Three questions, answered with what the code backs.",
    personas: [
      {
        role: "CHRO · PEOPLE OPS",
        title: "How do I measure wellbeing without invading?",
        body: "Team panel with k-anonymity ≥ 5: no 5 people, no number. Automated NOM-035 STPS report — 46-item applicator, Guide II/III — with ECO37 export signed SHA-256.",
        points: ["NOM-035 STPS · 46 items · signed export", "Aggregates only at n ≥ 5 · zero raw data", "3 validated instruments: PSS-4 · SWEMWBS-7 · PHQ-2"],
        outcome: "Day 90: first signed NOM-035 report and measurable team adherence.",
      },
      {
        role: "VP PEOPLE · L&D",
        title: "How do I drive adoption without forcing it?",
        body: "Tap-to-Ignite at physical NFC/QR stations signed with HMAC: 15 seconds per pulse, no login. Slack and Google Calendar integration for nudges that respect the calendar — not interrupt it.",
        points: ["NFC/QR stations · HMAC signature + replay-guard", "Slack + Google Calendar · non-intrusive nudges", "60–180 s sessions — they fit in a coffee break"],
        outcome: "Day 90: active cohort at ≥ 3 pulses/week without mandated rollouts.",
      },
      {
        role: "CISO · IT SECURITY",
        title: "What's your security story?",
        body: "Federated SSO with 4 OIDC providers (Google · Azure · Okta · Apple) plus SAML. Full SCIM 2.0 provisioning. TOTP MFA + WebAuthn passkeys. Audit log with hash chain — run verify:audit for your evidence pack.",
        points: ["SCIM 2.0 · SSO 4 OIDC providers · SAML", "WebAuthn passkeys + TOTP MFA · per-org ipAllowlist", "Verifiable audit hash-chain · DSAR GDPR · SOC 2 in audit"],
        outcome: "Day 60: federated SSO in production, SCIM provisioning and auditable audit log.",
      },
    ],

    intKicker: "ECOSYSTEM",
    intH: "Speaks to the tools you already use.",
    integrations: [
      "Slack", "Google Calendar", "Google SSO", "Microsoft SSO", "Okta", "BLE strap (Polar/Wahoo/Garmin HRM)", "Camera PPG (in-house algorithm)", "Whoop · webhook", "Oura · webhook", "Fitbit · webhook", "HMAC Webhooks", "REST API", "SCIM 2.0",
    ],

    trustKicker: "COMPLIANCE",
    trust: [
      { label: "SOC 2 Type II",  status: "audit in progress",       tone: "pending" },
      { label: "HIPAA · BAA",    status: "signable · Enterprise",   tone: "ready"   },
      { label: "GDPR · EU",      status: "optional residency",      tone: "ready"   },
      { label: "NOM-035 STPS",   status: "automated report",        tone: "ready"   },
      { label: "CFDI 4.0",       status: "all plans",               tone: "ready"   },
      { label: "Audit log",      status: "verifiable hash chain",   tone: "ready"   },
    ],
    trustNote: "Live status · signed detail at",
    trustNoteLink: "/trust",
    intNote: "Live integrations and public roadmap at",
    intNoteLink: "/changelog",

    priceKicker: "PRICING · IN THE OPEN",
    priceH: "Starter. Growth. Enterprise.",
    priceSub: "Per active user. 20% off annual. Volume discount up to −20%. MXN · USD · EUR. Zero hidden setup.",
    priceCta: "See full pricing",
    priceNote: "Starter trial 14 d · Growth pilot 30 d · Enterprise 60 d with DPA",
    trialKicker: "FOR INDIVIDUAL EVALUATION",
    trialBody: "Start a 14-day Starter trial — no card. Measure your baseline before pitching internally.",
    trialCtaInline: "Start 14-day trial · no card",

    cinePauseLine: "You've seen the pulse. Now touch it.",

    finalKicker: "NEXT",
    finalH1: "This is not wellness.",
    finalH2: "It's pre-shift physiological instrumentation.",
    finalBody: "30 minutes · a live session · 12 seats Q2 2026 cohort. No slides. We run a protocol with you, read your HRV and answer everything about security.",
    finalCta: "Book a demo",
    trialCta: "Start free · 14 d",
    trialSub: "Starter plan · no card",
    shipChip: "Latest ships · changelog",

    pwa: {
      kicker: "THE ENGINE · IN YOUR POCKET",
      headline: "Your neural app. Installs on iOS and Android. No app store.",
      sub: "BIO-IGNICIÓN is a Progressive Web App. It installs from the browser in 15 seconds — Safari on iOS, Chrome on Android. No store download. No Apple or Google review cycle. No forced updates. The engine lives in your team's pocket in minutes, not weeks.",
      benefitsAria: "Key PWA benefits",
      benefits: [
        { glyph: "download", t: "iOS + Android · 15 s",  d: "Safari → Share → Add to Home Screen. Chrome → Install. Behaves like a native app without the store." },
        { glyph: "wifi-off", t: "Offline-first",          d: "Breathes without signal. Service worker caches protocols, audio and your baseline. Use it on a flight or off-grid." },
        { glyph: "lock",     t: "Local-first · encrypted", d: "Your HRV and baseline live in encrypted IndexedDB on the device. Zero telemetry by default. Signed export within 24 h." },
        { glyph: "brain",    t: "Adaptive engine",        d: "After 3 sessions it detects your peak hour, your response to each protocol and which sensory modality anchors you. No more one-size-fits-all." },
        { glyph: "waves",    t: "Audio · Haptics · Binaural", d: "Synchronized to the millisecond. Wake-lock so the screen stays on. Every phase cites the study behind it." },
        { glyph: "clock",    t: "<60 s per pulse",        d: "Fits in the time it takes to brew coffee. Up to 800+ sessions per user per year without stealing team time." },
      ],
      platformsAria: "How to install on your platform",
      platforms: {
        ios:     { label: "Available on iOS",     sub: "Safari → Share → Add to Home Screen" },
        android: { label: "Available on Android", sub: "Chrome → Menu → Install app" },
        web:     { label: "Open in browser",      sub: "Works without installing — any device" },
      },
      fomo: `Design Partner · ${DESIGN_PARTNER.slotsTotal} slots · −${DESIGN_PARTNER.discountPct}% for ${DESIGN_PARTNER.termMonths} months`,
      ctaPrimary: "Activate my engine · 60 s · free",
      ctaSecondary: "Book a demo · 30 min",
      ctaFoot: "No card · no install · runs in your browser",
    },

  },
};

export default async function HomePage() {
  const locale = await getServerLocale();
  const lang = locale === "en" ? "en" : "es";
  const T = COPY[lang];
  const pricePeek = PRICE_PEEK[lang];
  const partner = PARTNER_COPY[lang];

  // Datos precisos derivados del código — no del marketing.
  //   protocolCount: catálogo real en src/lib/protocols.js (23 protocolos
  //     activos; antes el home contaba EVIDENCE.length = 10, una métrica
  //     distinta — familias de evidencia, no protocolos).
  //   studyCount: estudios peer-reviewed con DOI citados en src/lib/evidence.js.
  const evidenceEntries = Object.values(EVIDENCE);
  const protocolCount = PROTOCOLS.length;
  const studyCount = evidenceEntries.reduce((n, e) => n + (e.studies?.length || 0), 0);

  return (
    <PublicShell activePath="/">
      <SensoryHero T={T.hero} />

      <section aria-label={T.proofKicker}>
        <Container size="xl" style={{ paddingInline: 0 }}>
          <div className="bi-proof-stats">
            <div>
              <span className="v"><CountUp value={protocolCount} /></span>
              <span className="l">{T.proof.s1Label}</span>
              <span className="s">{T.proof.s1Sub(protocolCount)}</span>
            </div>
            <div>
              <span className="v"><CountUp value={studyCount} /></span>
              <span className="l">{T.proof.s2Label}</span>
              <span className="s">{T.proof.s2Sub}</span>
            </div>
            <div>
              <span className="v">{T.proof.s3Value}</span>
              <span className="l">{T.proof.s3Label}</span>
              <span className="s">{T.proof.s3Sub}</span>
            </div>
            <div>
              <span className="v" style={{ fontSize: "clamp(20px, 2.4vw, 28px)" }}>
                <CohortCountdown locale={lang} />
              </span>
              <span className="l">{T.proof.s4Label}</span>
              <span className="s">{T.proof.s4Sub}</span>
            </div>
          </div>
        </Container>
      </section>

      {/* ═══ Dos superficies — la verdad estructural del producto ═══
          SYSTEM_OVERVIEW.md lo dice explícito: "Vendemos al CHRO y al CISO
          en la misma demo." Una sola pieza de software, dos caras. Esta
          sección es el bloque conceptual que faltaba — antes el home
          asumía que el visitante ya sabía qué tipo de producto era. */}
      <section aria-labelledby="two-surfaces" style={{ paddingBlock: "clamp(48px, 5vw, 80px)", paddingInline: space[5] }}>
        <Container size="xl">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[8] }}>
              <SectionKicker>{T.twoKicker}</SectionKicker>
              <h3 id="two-surfaces" style={sectionHeading}>{T.twoH}</h3>
              <p style={{
                marginBlockStart: space[3],
                marginInline: "auto",
                maxInlineSize: 660,
                color: cssVar.textDim,
                fontSize: font.size.md,
                lineHeight: 1.55,
              }}>
                {T.twoSub}
              </p>
            </div>
            {/* SP-MKT 9.5 — Two surfaces split composition. Antes eran 2
                cards genéricas con top-border accent. Ahora es un diptych
                editorial: columnas tipográficas a cada lado de un spine
                central hairline gradient cyan→violet (literalmente "una
                plataforma, dos superficies"). Sin cajas, sin chrome — el
                contenido tiene presencia, el spine hace la composición.
                Mobile: el grid template colapsa via .bi-two-surfaces-split. */}
            <div className="bi-two-surfaces-split">
              <SurfaceColumn surface={T.twoSurfaces[0]} accent={bioSignal.phosphorCyan} accentInk={bioSignal.phosphorCyanInk} />
              <span aria-hidden className="bi-two-surfaces-spine" style={{
                background: `linear-gradient(to bottom, transparent, ${bioSignal.phosphorCyan} 12%, ${bioSignal.neuralViolet} 88%, transparent)`,
              }} />
              <SurfaceColumn surface={T.twoSurfaces[1]} accent={bioSignal.neuralViolet} accentInk={bioSignal.neuralViolet} />
            </div>
          </IgnitionReveal>
        </Container>
      </section>

      {/* SP-MKT 10/10 — Sectores servidos strip. Social proof de fit
          honesto: no afirmamos "used by Apple" (no tenemos clientes
          aún), sí afirmamos "diseñado para estos contextos operativos"
          con 8 verticales que tienen guía de implementación dedicada
          (rutas /for-* reales). Es lo que Linear hace con sus "Built
          for [logos]" — pero anclado a contextos verificables. */}
      <section aria-labelledby="sectors" style={{ paddingBlock: "clamp(48px, 5vw, 80px)", paddingInline: space[5] }}>
        <Container size="xl">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ marginBlockEnd: space[8], maxInlineSize: 720 }}>
              <SectionKicker align="left">{T.sectorsKicker}</SectionKicker>
              <h3 id="sectors" style={{ ...sectionHeading, marginInline: 0 }}>{T.sectorsH}</h3>
              <p style={{
                marginBlockStart: space[3],
                color: cssVar.textDim,
                fontSize: font.size.md,
                lineHeight: 1.6,
                maxInlineSize: 640,
              }}>
                {T.sectorsSub}
              </p>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1px",
              background: cssVar.border,
              border: `1px solid ${cssVar.border}`,
              borderRadius: radius.lg,
              overflow: "hidden",
            }}>
              {T.sectors.map((s) => (
                <Link key={s.slug} href={s.slug} style={{
                  display: "block",
                  padding: `${space[5]}px ${space[5]}px`,
                  background: cssVar.bg,
                  textDecoration: "none",
                  transition: "background 180ms var(--bi-ease-breath)",
                }} className="bi-sector-cell">
                  <div style={{
                    fontFamily: cssVar.fontMono,
                    fontSize: 11,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    fontWeight: font.weight.bold,
                    color: bioSignal.phosphorCyanInk,
                    marginBlockEnd: space[2],
                  }}>
                    {s.label}
                  </div>
                  <div style={{
                    color: cssVar.textDim,
                    fontSize: font.size.sm,
                    lineHeight: 1.4,
                  }}>
                    {s.sub}
                  </div>
                </Link>
              ))}
            </div>
          </IgnitionReveal>
        </Container>
      </section>

      {/* Evidence as the first of three dark moments on /home.
          Thematically fits: these are terminal/monospace receipts,
          darkness is their native habitat. Header colors bumped to
          dark-bg-safe variants — phosphorCyan (not cyanInk) reads
          fine on the dark frame; heading + sub use explicit light
          colors so they don't inherit from the light-theme cascade. */}
      <section aria-labelledby="evidence" className="bi-darkframe">
        <Container size="xl">
          <div style={{ textAlign: "center", marginBlockEnd: space[8] }}>
            <SectionKicker tone="bright">{T.evidenceKicker}</SectionKicker>
            <h3 id="evidence" style={{ ...sectionHeading, color: "#E6F1EA" }}>{T.evidenceH}</h3>
            <p style={{
              marginBlockStart: space[3],
              marginInline: "auto",
              maxInlineSize: 640,
              color: "#A7F3D0",
              fontSize: font.size.md,
              lineHeight: 1.55,
            }}>
              {T.evidenceSub}
            </p>
          </div>
          <ProductEvidence T={T.evidence} />
        </Container>
      </section>

      {/* SP-MKT recorte — sección Bento (6 cards "Tres señales") eliminada.
          Era el bloque más redundante del page: privacy/evidence/protocols/
          adoption ya los cubren How it works + Evidence + Personas. Los 2
          claims únicos — motor adaptativo + metering transparente — se
          preservan: el motor adaptativo se fundió en el sub de How it works;
          el metering vive junto a Pricing. Apple-grade = no tres patrones
          distintos para explicar features (grid + steps + personas). */}

      <section aria-labelledby="how-it-works" style={{ paddingBlock: "clamp(48px, 5vw, 80px)", paddingInline: space[5] }}>
        <Container size="xl">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[8] }}>
              <SectionKicker>{T.howKicker}</SectionKicker>
              <h3 id="how-it-works" style={sectionHeading}>{T.howH}</h3>
              <p style={{
                marginBlockStart: space[3],
                marginInline: "auto",
                maxInlineSize: 640,
                color: cssVar.textDim,
                fontSize: font.size.md,
                lineHeight: 1.55,
              }}>
                {T.howSub}
              </p>
            </div>

            {/* SP-MKT reconstrucción — MockupFrame screenshots eliminados.
                Las capturas iPhone no comunicaban bien y dependían de assets
                generados aparte. El número de fase (01/02/03) ya lo renderiza
                el counter CSS `.bi-how-step::before` — cero assets externos,
                el texto hace el trabajo. */}
            <div className="bi-how-grid" role="list">
              {T.how.map((s) => (
                <article key={s.t} className="bi-how-step" role="listitem">
                  <h4>{s.t}</h4>
                  <p>{s.d}</p>
                  <div className="bi-how-cite">
                    <span>
                      <a href={s.citeHref} target="_blank" rel="noopener noreferrer">{s.cite}</a>
                    </span>
                  </div>
                </article>
              ))}
            </div>

            <div className="bi-how-capabilities" aria-label={T.howKicker}>
              {T.howCapabilities.map((c) => (
                <div key={c.k} className="bi-how-cap">
                  <span className="k">{c.k}</span>
                  <span className="v">{c.v}</span>
                </div>
              ))}
            </div>

            {/* SP-MKT honestidad — DashboardMockup eliminado. El componente
                se autodescribía "stand-in until we can ship a pixel render of
                the real dashboard" y mostraba datos 100% fabricados (58 ms,
                84 %, 12/12). Un mockup falso presentado como "lo que tu admin
                ve" contradice el thesis "evidencia, no promesas". La consola
                admin ya se explica con honestidad en la sección "Dos
                superficies" y su formato real en "Evidencia operativa". */}

            <p style={{
              marginBlockStart: space[8],
              textAlign: "center",
              fontFamily: cssVar.fontMono,
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: cssVar.textMuted,
            }}>
              {T.howFootnote}
              <Link href={T.howFootnoteLink} style={{
                color: bioSignal.phosphorCyan,
                textDecoration: "underline",
                textUnderlineOffset: 3,
                fontWeight: 700,
              }}>
                {T.howFootnoteLink}
              </Link>
            </p>
          </IgnitionReveal>
        </Container>
      </section>

      {/* PWA Showcase runs as an intentional dark moment inside the
          light home — Stripe/Linear-style section alternation. It's
          also thematically right: the PWA itself runs in theme-dark
          so the marketing preview breathes the same color field the
          user will land in when they install. The component was
          already authored with dark-bg colors; this wrapper gives it
          the surface it was designed for. */}
      <section aria-labelledby="pwa-showcase" className="bi-darkframe">
        <Container size="xl">
          <IgnitionReveal sparkOrigin="50% 30%">
            <PWAShowcase T={T.pwa} />
          </IgnitionReveal>
        </Container>
      </section>

      {/* SP-MKT 9.5 — Personas header pasa a left-aligned para crear ritmo
          editorial. Hasta ahora todas las secciones llevaban textAlign:
          center, lo cual aplana la jerarquía y hace que la página entera
          lea como "variaciones del mismo template". Alternar centered
          (focal moments) ↔ left (info-dense) es como Linear/Stripe dan
          textura sin que cada sección invente su propio sistema. */}
      <section style={{ paddingBlock: "clamp(48px, 5vw, 80px)", paddingInline: space[5] }}>
        <Container size="xl">
          <IgnitionReveal sparkOrigin="50% 40%">
            <div style={{ marginBlockEnd: space[8], maxInlineSize: 640 }}>
              <SectionKicker align="left">{T.personaKicker}</SectionKicker>
              <h3 style={{ ...sectionHeading, marginInline: 0 }}>{T.personaH}</h3>
            </div>
            <SpotlightGrid className="bi-persona-grid">
              {T.personas.map((p) => (
                <article key={p.role} className="bi-persona-card bi-spot">
                  <span className="pk">{p.role}</span>
                  <h4>{p.title}</h4>
                  <p>{p.body}</p>
                  <ul>
                    {p.points.map((pt) => <li key={pt}>{pt}</li>)}
                  </ul>
                  {p.outcome && (
                    <div className="bi-persona-outcome">
                      <span className="dot" aria-hidden />
                      {p.outcome}
                    </div>
                  )}
                </article>
              ))}
            </SpotlightGrid>
          </IgnitionReveal>
        </Container>
      </section>

      {/* Science pull-quote lived here — cut. The claim it makes
          ("HRV / breathing / binaurals are not placebo, they're 40
          years of peer-reviewed literature") is already built into
          the /why thesis and the citations attached to each step of
          "How it works" above. Repeating it as a giant italic
          centerpiece inflated scroll length for a signal the reader
          already got. */}

      <section aria-label={T.intKicker} style={{ paddingBlock: space[10], paddingInline: 0 }}>
        <Container size="xl" style={{ paddingInline: space[5] }}>
          <IgnitionReveal sparkOrigin="50% 40%">
            <div style={{ textAlign: "center", marginBlockEnd: space[5] }}>
              <SectionKicker>{T.intKicker}</SectionKicker>
              <h3 style={{
                margin: `${space[2]}px 0 0`,
                fontSize: "clamp(22px, 3vw, 32px)",
                letterSpacing: "-0.02em",
                fontWeight: font.weight.black,
                color: cssVar.text,
              }}>
                {T.intH}
              </h3>
            </div>
          </IgnitionReveal>
        </Container>
        <div className="bi-int-strip">
          {T.integrations.map((i) => (
            <span key={i} className="bi-int-item">{i}</span>
          ))}
        </div>
        <Container size="xl" style={{ paddingInline: space[5] }}>
          <p className="bi-strip-footnote">
            {T.intNote}{" "}
            <Link href={T.intNoteLink}>{T.intNoteLink}</Link>
          </p>

          <div className="bi-trust-block" aria-label={T.trustKicker}>
            <div className="bi-trust-kicker"><SectionKicker>{T.trustKicker}</SectionKicker></div>
            <div className="bi-trust-strip" role="list">
              {T.trust.map((t) => (
                <span
                  key={t.label}
                  className="bi-trust-chip"
                  role="listitem"
                  data-tone={t.tone}
                  title={`${t.label} · ${t.status}`}
                >
                  <span className="dot" aria-hidden />
                  <span className="trust-label">{t.label}</span>
                  <span className="trust-status" aria-hidden>{t.status}</span>
                </span>
              ))}
            </div>
            <p className="bi-strip-footnote">
              {T.trustNote}{" "}
              <Link href={T.trustNoteLink}>{T.trustNoteLink}</Link>
            </p>
          </div>
        </Container>
      </section>

      {/* Credibility 6-artifact grid lived here — cut. Every link
          (evidencia / OpenAPI / changelog / status / security.txt /
          trust) is already in the site footer AND prominently on
          /trust. Duplicating a full section on home just to repeat
          those six links inflated the scroll.

          FAQ section also lived here — cut. The same 5 questions now
          live on /pricing where a buyer is actually evaluating. Home
          FAQ is a Stripe/Linear anti-pattern (neither does it on the
          current 2026 homepage). */}
      <section style={{ paddingBlock: "clamp(48px, 5vw, 80px)", paddingInline: space[5] }}>
        <Container size="lg">
          <IgnitionReveal sparkOrigin="50% 40%">
            <div style={{ textAlign: "center", marginBlockEnd: space[6] }}>
              <SectionKicker>{T.priceKicker}</SectionKicker>
              <h3 style={sectionHeading}>{T.priceH}</h3>
              <p style={{
                marginBlockStart: space[3],
                color: cssVar.textDim,
                fontSize: font.size.md,
                maxInlineSize: 640,
                marginInline: "auto",
                lineHeight: 1.55,
              }}>
                {T.priceSub}
              </p>
            </div>

            <div className="bi-pricing-peek" aria-label={T.priceH}>
              {pricePeek.map((t) => (
                <div key={t.name} className="bi-pricing-peek-tier" data-featured={t.featured ? "true" : undefined}>
                  <span className="name">{t.name}</span>
                  <span className="price">{t.price}</span>
                  <span className="unit">{t.unit}</span>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", marginBlockStart: space[5], display: "flex", flexDirection: "column", alignItems: "center", gap: space[3] }}>
              <Link href="/pricing" className="bi-pricing-peek-cta">
                {T.priceCta} →
              </Link>
              <span style={{
                fontFamily: cssVar.fontMono,
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: cssVar.textMuted,
              }}>
                {T.priceNote}
              </span>
            </div>

            {/* B2C funnel — D2 locked. Trial CTA subtle below pricing peek
                para que un champion individual evalúe baseline antes de
                pitchear internamente. Banner intencionalmente bajo en
                jerarquía visual (border-top hairline + mono caps kicker)
                — no compite con el CTA B2B principal arriba. */}
            <div style={{
              marginBlockStart: space[8],
              paddingBlockStart: space[6],
              borderBlockStart: `1px solid ${cssVar.border}`,
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: space[3], textAlign: "center",
            }}>
              <span style={{
                fontFamily: cssVar.fontMono,
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: font.weight.bold,
                color: bioSignal.phosphorCyanInk,
              }}>
                {T.trialKicker}
              </span>
              <p style={{
                margin: 0,
                maxInlineSize: 480,
                color: cssVar.textDim,
                fontSize: font.size.base,
                lineHeight: 1.55,
              }}>
                {T.trialBody}
              </p>
              <Link href="/signup?plan=starter" className="bi-trial-cta-inline" style={{
                marginBlockStart: space[2],
                display: "inline-flex",
                alignItems: "center",
                gap: space[2],
                paddingBlock: space[3],
                paddingInline: space[5],
                borderRadius: radius.full,
                border: `1px solid ${bioSignal.phosphorCyan}`,
                background: `color-mix(in srgb, ${bioSignal.phosphorCyan} 8%, transparent)`,
                color: bioSignal.phosphorCyanInk,
                fontWeight: font.weight.bold,
                fontSize: font.size.sm,
                textDecoration: "none",
                letterSpacing: "0.01em",
              }}>
                {T.trialCtaInline}
                <span aria-hidden>→</span>
              </Link>
            </div>
          </IgnitionReveal>
        </Container>
      </section>

      {/* SP-MKT 10/10 — Voz editorial / manifesto line. Las páginas top-tier
          tienen voz humana en algún punto (Apple: el "It just works." chip,
          Linear: "Built by Linear", Stripe: párrafo de fundador). Este
          home no tenía ninguna voz hasta ahora — solo postura editorial
          impersonal. Una línea honesta, atribuida, anchored a lo que el
          producto realmente es: anti-teatro. */}
      <section aria-labelledby="manifesto" style={{ paddingBlock: "clamp(56px, 7vw, 96px)", paddingInline: space[5] }}>
        <Container size="md">
          <IgnitionReveal sparkOrigin="50% 40%">
            <div style={{
              maxInlineSize: "32ch",
              marginInline: "auto",
              textAlign: "center",
            }}>
              <p id="manifesto" style={{
                margin: 0,
                fontFamily: "var(--font-editorial), 'Instrument Serif', Georgia, serif",
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: "clamp(22px, 2.6vw, 32px)",
                lineHeight: 1.32,
                letterSpacing: "-0.018em",
                color: cssVar.text,
              }}>
                {T.voiceLine}
              </p>
              <p style={{
                margin: `${space[5]}px 0 0`,
                fontFamily: cssVar.fontMono,
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: font.weight.bold,
                color: bioSignal.phosphorCyanInk,
              }}>
                {T.voiceAttribution}
              </p>
            </div>
          </IgnitionReveal>
        </Container>
      </section>

      {/* SP-MKT recorte — sección "Cinematic pause" standalone eliminada.
          La línea editorial ("Ya viste cómo late. Ahora tócalo.") + el
          BioGlyph se fundieron como lead-in DENTRO del Final CTA darkframe
          abajo: un solo cierre, con más peso. */}

      {/* Final CTA — the close. Light hero opens, dark CTA closes the
          narrative bracket. Lleads in with the BioGlyph + editorial line
          (absorbed from the retired cinematic pause), then the category
          contrast statement + CTAs. */}
      <section className="bi-darkframe" style={{ textAlign: "center" }}>
        <Container size="md">
          <IgnitionReveal sparkOrigin="50% 40%">
            <div style={{
              display: "inline-flex",
              color: "var(--bi-phosphor-cyan)",
              marginBlockEnd: space[5],
              filter: "drop-shadow(0 0 22px color-mix(in srgb, #22D3EE 45%, transparent))",
            }}>
              <BioGlyph size={64} />
            </div>
            <p style={{
              margin: `0 auto ${space[8]}px`,
              maxInlineSize: "20ch",
              fontFamily: "var(--font-editorial), 'Instrument Serif', Georgia, serif",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "clamp(26px, 4vw, 44px)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "#E6F1EA",
            }}>
              {T.cinePauseLine}
            </p>
            <SectionKicker tone="bright">{T.finalKicker}</SectionKicker>
            <h3 style={{
              margin: 0,
              fontSize: "clamp(40px, 6vw, 72px)",
              lineHeight: 1.05,
              letterSpacing: "-0.035em",
              fontWeight: font.weight.black,
              color: "#E6F1EA",
            }}>
              {T.finalH1}
              <br />
              <span style={{
                background: `linear-gradient(120deg, ${bioSignal.phosphorCyan}, ${bioSignal.neuralViolet})`,
                WebkitBackgroundClip: "text", backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>{T.finalH2}</span>
            </h3>
            <p style={{
              marginBlockStart: space[5],
              marginInline: "auto",
              maxInlineSize: 560,
              fontSize: font.size.lg,
              lineHeight: 1.5,
              color: "#A7F3D0",
            }}>
              {T.finalBody}
            </p>
            <div style={{
              marginBlockStart: space[7],
              display: "flex",
              flexWrap: "wrap",
              gap: space[3],
              justifyContent: "center",
              alignItems: "center",
            }}>
              <Link href="/demo" className="bi-pricing-peek-cta">
                {T.finalCta}
              </Link>
              <Link href="/signup?plan=starter" className="bi-trial-cta">
                {T.trialCta}
                <span className="bi-trial-sub">{T.trialSub}</span>
              </Link>
              <PartnerApplyModal
                triggerLabel={partner.cta}
                chipLabel={partner.chip}
                dialogTitle={partner.title}
                dialogBody={partner.body}
                locale={lang}
              />
            </div>
            <Link
              href="/changelog"
              style={{
                marginBlockStart: space[6],
                display: "inline-flex",
                alignItems: "center",
                gap: space[2],
                padding: `6px 14px`,
                borderRadius: radius.full,
                background: `color-mix(in srgb, ${bioSignal.phosphorCyan} 12%, transparent)`,
                border: `1px solid color-mix(in srgb, ${bioSignal.phosphorCyan} 40%, rgba(255,255,255,0.16))`,
                // Dark-frame: use light mint text (theme-dark text-dim) so the
                // changelog chip stays legible against the dark gradient.
                color: "#A7F3D0",
                fontFamily: cssVar.fontMono,
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                textDecoration: "none",
                fontWeight: font.weight.bold,
              }}
            >
              <span aria-hidden style={{
                inlineSize: 6, blockSize: 6, borderRadius: "50%",
                background: bioSignal.phosphorCyan,
                boxShadow: `0 0 10px ${bioSignal.phosphorCyan}`,
              }} />
              {T.shipChip}
            </Link>
          </IgnitionReveal>
        </Container>
      </section>
    </PublicShell>
  );
}

/* SP-MKT — SectionKicker movido a src/components/brand/SectionKicker.jsx
   para reuso desde /why y otras páginas marketing. */

const sectionHeading = {
  margin: 0,
  fontSize: "clamp(30px, 4vw, 46px)",
  lineHeight: 1.12,
  letterSpacing: "-0.032em",
  fontWeight: font.weight.black,
  color: cssVar.text,
  maxInlineSize: 720,
  marginInline: "auto",
};

/* SP-MKT 9.5 — SurfaceColumn = una mitad del diptych "Dos superficies".
   Sin caja, sin border, sin background — solo tipografía + accent rule
   horizontal arriba. La composición la hace el spine vertical entre
   columnas en el padre. Cada columna lleva su acento (cyan o violet)
   para que el contraste cromático refuerce "operador vs compliance". */
function SurfaceColumn({ surface, accent, accentInk }) {
  return (
    <article style={{
      display: "flex", flexDirection: "column", gap: space[4],
      paddingBlock: space[2],
    }}>
      <span aria-hidden style={{
        inlineSize: 40, blockSize: 2,
        background: accent,
        borderRadius: 2,
        marginBlockEnd: space[1],
      }} />
      <span style={{
        fontFamily: cssVar.fontMono,
        fontSize: 11,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        fontWeight: font.weight.bold,
        color: accentInk,
      }}>
        {surface.tag}
      </span>
      <h4 style={{
        margin: 0,
        fontSize: "clamp(24px, 2.6vw, 32px)",
        lineHeight: 1.12,
        letterSpacing: "-0.025em",
        fontWeight: font.weight.black,
        color: cssVar.text,
      }}>
        {surface.title}
      </h4>
      <p style={{
        margin: 0,
        color: cssVar.textDim,
        fontSize: font.size.base,
        lineHeight: 1.65,
        maxInlineSize: "44ch",
      }}>
        {surface.body}
      </p>
      <ul style={{
        listStyle: "none", padding: 0, margin: `${space[2]}px 0 0`,
        display: "grid", gap: space[2],
        borderBlockStart: `1px solid ${cssVar.border}`,
        paddingBlockStart: space[4],
      }}>
        {surface.points.map((pt) => (
          <li key={pt} style={{
            display: "flex", alignItems: "flex-start", gap: space[3],
            fontFamily: cssVar.fontMono,
            fontSize: 12.5,
            color: cssVar.text,
            lineHeight: 1.5,
          }}>
            <span aria-hidden style={{
              color: accent,
              fontWeight: font.weight.bold,
              flexShrink: 0,
              marginBlockStart: 2,
            }}>—</span>
            <span>{pt}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

/* SP-MKT recorte — BentoCard component eliminado junto con la sección Bento.
   La sección era el bloque más redundante del page (privacy/evidence/protocols/
   adoption ya cubiertos por How it works + Evidence + Personas). Los 2 claims
   únicos se preservaron: motor adaptativo → sub de How it works; metering →
   junto a Pricing. Histórico del component en git. */
