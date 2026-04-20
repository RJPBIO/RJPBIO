import Link from "next/link";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font, bioSignal, radius } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";
import { EVIDENCE } from "@/lib/evidence";
import { PRICE_PEEK, PARTNER_COPY, DESIGN_PARTNER } from "@/lib/pricing";
import SensoryHero from "@/components/brand/SensoryHero";
import IgnitionReveal from "@/components/brand/IgnitionReveal";
import BioglyphLattice from "@/components/brand/BioglyphLattice";
import PulseDivider from "@/components/brand/PulseDivider";
import DashboardMockup from "@/components/brand/DashboardMockup";
import VideoPreview from "@/components/brand/VideoPreview";
import PartnerApplyModal from "@/components/ui/PartnerApplyModal";
import SpotlightGrid from "@/components/brand/SpotlightGrid";
import CountUp from "@/components/brand/CountUp";

export const metadata = {
  title: { absolute: "BIO-IGNICIÓN — Neural Performance" },
  description: "Plataforma B2B de neural adaptation. HRV medible, intervención sensorial (audio + haptics + binaural) y compliance de grado empresarial (SOC 2 · HIPAA · NOM-035).",
  alternates: { canonical: "/" },
  openGraph: {
    title: "BIO-IGNICIÓN — Neural Performance",
    description: "Siente el motor. Un pulso háptico, tres segundos de binaural, una onda que respira contigo.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
};

const COPY = {
  es: {
    hero: {
      kicker: "NUEVO · MOTOR SENSORIAL",
      title1: "Siente el motor.",
      title2: "No lo expliques, tócalo.",
      sub: "Un pulso háptico, tres segundos de binaural y una onda que respira contigo. Toca el botón — funciona en tu navegador, sin instalar nada.",
      buttonIdle: "Activar pulso",
      buttonPulsing: "Sintiendo…",
      buttonAria: "Activar pulso sensorial de 3 segundos",
      hint: "3 segundos · audio + vibración",
      afterLine: "Ese es el motor. Ahora imagina una sesión completa.",
      secondaryCta: "Ver demo en vivo · 30 min",
      secondaryHref: "/demo",
      chips: ["SOC 2", "HIPAA-ready", "GDPR", "NOM-035", "Zero telemetry"],
      chipsLabel: "Compliance y confianza",
    },

    proofKicker: "SEÑALES AUDITABLES",
    proof: {
      s1Label: "protocolos con mecanismo documentado",
      s1Sub:   () => `Revísalos en /evidencia · catálogo en expansión`,
      s2Label: "estudios citados con DOI verificable",
      s2Sub:   "Cohen 1988 · Task Force 1996 · Shaffer 2017…",
      s3Value: "0",
      s3Label: "puntajes propietarios sin referencia pública",
      s3Sub:   "Si aparece en el reporte, su fuente es pública",
    },

    manifestoKicker: "MANIFIESTO",
    manifesto1: "La optimización no se grafica.",
    manifesto2: "Se siente.",
    manifestoBody: "Los datos existen para ajustar el pulso — no para decorar un dashboard. Si no podemos convertir un marcador en una acción sensorial, no lo mostramos.",

    bentoKicker: "POR DENTRO",
    bentoH: "Tres señales. Un lenguaje. Tu sistema nervioso.",
    bento: {
      neural: { t: "El motor te escucha", d: "Tu HRV, tu respiración, tu sueño. Tres pulsos entran. Uno sale sintonizado a ti — no a la mediana." },
      privacy: { t: "Tus datos no respiran fuera", d: "Cifrado en tu dispositivo. Cero telemetría hasta que tú digas sí. Exporta o borra en menos de veinticuatro horas." },
      protocols: { t: "Cuatro pulsos. Un vocabulario.", d: "Calma. Enfoque. Energía. Reset. Audio binaural, voz guiada y haptics laten en la misma cadencia." },
      evidence: { t: "Cada pulso cita su estudio", d: "Evidencia alta, moderada o limitada — lo decimos. Si la literatura titubea, también titubeamos." },
      adoption: { t: "La adopción se mide, no se grafica.", d: "Tap-to-Ignite en lobby y salas: 15 segundos por pulso. Dashboard de uso por equipo con k-anonymity ≥ 5 — sin nombres, sin crudo." },
      meter: { t: "Lo que usas es lo que ves.", d: "Sesiones contadas al segundo. Cap por plan, overage transparente. Cero sobresaltos al cierre del mes — factura CFDI 4.0 o invoice USD/EUR." },
    },

    howKicker: "CÓMO FUNCIONA",
    howH: "Tres pasos. Cero abstracciones.",
    howSub: "De tocar el botón a medir adopción de equipo — con mecanismo y evidencia citada en cada paso. Sin blackbox.",
    how: [
      {
        t: "Tocas. El motor responde.",
        d: "Abre la PWA en cualquier navegador moderno — sin instalar nada. Tap-to-Ignite dispara 15 segundos de audio binaural + haptics + voz guiada sincronizados al ms. Si tu dispositivo tiene motor de vibración, lo usamos; si no, el audio lleva el pulso solo.",
        cite: "Balban et al., 2023 · Cell Reports Medicine · n=114, d≈0.45",
        citeHref: "https://doi.org/10.1016/j.xcrm.2022.100895",
      },
      {
        t: "El motor escucha tu fisiología.",
        d: "Conectamos HRV (Apple Health / Fitbit / Garmin / Oura), respiración guiada a frecuencia de resonancia y patrón de sueño. El motor adaptativo — abierto en /evidencia — elige el protocolo correcto: calma, enfoque, energía o reset. Cada recomendación cita el estudio detrás.",
        cite: "Lehrer & Gevirtz, 2014 · Frontiers in Psychology",
        citeHref: "https://doi.org/10.3389/fpsyg.2014.00756",
      },
      {
        t: "El equipo adopta sin forzar.",
        d: "Estaciones físicas NFC/QR en lobbies y salas. Nudges opcionales vía Slack y Google Calendar. Panel de adopción con k-anonymity ≥5 — sin nombres, sin datos crudos. Reporte NOM-035 STPS automatizado y export firmado para auditoría.",
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

    previewKicker: "EL PRODUCTO · EN 60 SEGUNDOS",
    previewH: "Lo sentiste. Ahora míralo por dentro.",
    previewBody: "HRV en tiempo real, pulsos diarios, adherencia por equipo y evidencia citada. Sin capturas simuladas — la misma vista que abre tu admin el lunes a las 9.",
    previewVideoCta: "Verlo en 90 segundos",
    previewVideoPlaceholder: "Demo en vivo · agenda con un humano para un walkthrough completo.",

    personaKicker: "PARA QUIÉN",
    personaH: "Tres mesas. Tres preguntas que contestamos sin rodeos.",
    personas: [
      {
        role: "CHRO · PEOPLE OPS",
        title: "¿Cómo mido bienestar sin invadir?",
        body: "Panel de equipo con k-anonymity ≥5, reporte NOM-035 automatizado y export firmado para RRHH. Sin nombres, sin datos crudos — solo señales agregadas.",
        points: ["NOM-035 STPS automatizado", "Agregados solo cuando hay ≥5", "Export firmado para auditoría"],
        outcome: "En 90 días: primer reporte NOM-035 firmado y adherencia por equipo medible.",
      },
      {
        role: "VP PEOPLE · L&D",
        title: "¿Cómo adopto sin forzar?",
        body: "Tap-to-Ignite en lobbies y salas: 15 segundos por pulso. Integración con Slack y Calendar para nudges que respetan tu día — no lo interrumpen.",
        points: ["Estaciones NFC/QR físicas", "Slack + Google Calendar", "Nudges no intrusivos"],
        outcome: "En 90 días: cohorte activa con ≥3 pulsos/semana sin comunicados forzados.",
      },
      {
        role: "CISO · IT SECURITY",
        title: "¿Y tu historia de seguridad?",
        body: "SAML 2.0 + SCIM 2.0 + OIDC federado. BAA firmable, residencia US/EU/LATAM, audit log con hash chain verificable. Pentest anual y SOC 2 Type II.",
        points: ["SAML · SCIM · OIDC", "BAA HIPAA · residencia elegible", "Audit log verificable + SOC 2"],
        outcome: "En 60 días: BAA firmado, SSO federado en producción y audit log auditable.",
      },
    ],

    scienceEyebrow: "PRINCIPIO · NEURAL",
    scienceQuote: "HRV, respiración resonante y binaurales no son placebo — son cuarenta años de literatura revisada. Lo que cambia aquí es que los convertimos en un pulso que puedes sentir, no en un gráfico que tienes que interpretar.",
    scienceAttr: "Evidencia revisada por pares",
    scienceAttrHref: "/evidencia",

    intKicker: "ECOSISTEMA",
    intH: "Habla con las herramientas que ya usas.",
    integrations: [
      "Slack", "Google Calendar", "Google SSO", "Microsoft SSO", "Okta", "Apple Health", "Fitbit", "Garmin", "Oura", "Webhooks HMAC", "REST API", "SCIM 2.0",
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

    credKicker: "CREDIBILIDAD · SIN LOGOS FALSOS",
    credH: "Las pruebas que sí puedes abrir.",
    credSub: "Somos pre-lanzamiento — no inventamos testimonios. Todo lo que decimos vive en un artefacto público que puedes inspeccionar ahora mismo.",
    credItems: [
      { href: "/evidencia", label: "Evidencia clínica",  meta: (studies, protos) => `${studies} estudios · ${protos} protocolos · DOI verificable` },
      { href: "/api/openapi", label: "OpenAPI pública",  meta: () => "Spec OpenAPI 3.1 · versionada" },
      { href: "/changelog",  label: "Changelog público", meta: () => "Envíos quincenales · RSS" },
      { href: "/status",     label: "Status del sistema",meta: () => "Uptime e incidencias en vivo" },
      { href: "/.well-known/security.txt", label: "Security.txt", meta: () => "Canal de disclosure responsable" },
      { href: "/trust",      label: "Trust Center",      meta: () => "DPA · subprocesadores · pentest" },
    ],

    priceKicker: "PRECIOS · EN LA LUZ",
    priceH: "Starter. Growth. Enterprise.",
    priceSub: "Por usuario activo. 20 % off anual. Volume discount hasta −20 %. MXN · USD · EUR. Cero setup oculto.",
    priceCta: "Ver precios completos",
    priceNote: "Starter trial 14 d · Growth piloto 30 d · Enterprise 60 d con DPA",

    faqKicker: "PREGUNTAS HONESTAS",
    faqH: "Lo que preguntan antes de comprar.",
    faq: [
      {
        q: "¿Dónde viven los datos?",
        a: "Residencia elegible US · UE · LATAM (AWS). Cifrado en reposo y en tránsito, IndexedDB cifrado en el dispositivo del usuario. Export JSON firmado o borrado en menos de 24 h. Detalle firmado en /trust.",
      },
      {
        q: "¿Es HIPAA y NOM-035?",
        a: "BAA HIPAA firmable en Growth y Enterprise. Reporte NOM-035 STPS automatizado con agregados k-anonymity ≥5 — sin nombres, sin datos crudos. Auditable con hash chain verificable.",
      },
      {
        q: "¿Cómo integra con nuestro stack?",
        a: "SSO vía SAML 2.0, OIDC federado y SCIM 2.0. Slack y Google Calendar para nudges opt-in. Wearables: Apple Health, Fitbit, Garmin, Oura. REST API + Webhooks HMAC. Funciona sin wearable — la PWA lleva el pulso sola.",
      },
      {
        q: "¿Cuánto tarda poner al equipo en marcha?",
        a: "Starter: trial 14 d self-serve, hoy. Growth: piloto 30 d con onboarding guiado. Enterprise: 60 d con DPA firmado, SSO federado y primer reporte NOM-035. Sin setup fees ocultos.",
      },
      {
        q: "¿Puedo cancelar cuando quiera?",
        a: "Starter y Growth: mes a mes o anual, cancelas cuando decidas. Design Partner: 24 meses con 50% off (el compromiso está en la luz en /pricing). Export firmado de todos tus datos antes de salir.",
      },
    ],

    finalKicker: "SIGUIENTE",
    finalH1: "30 minutos.",
    finalH2: "Una sesión en vivo.",
    finalBody: "Sin slides. Corremos un protocolo contigo, leemos tu HRV y respondemos todo sobre seguridad.",
    finalCta: "Agendar demo",
    trialCta: "Empezar gratis · 14 d",
    trialSub: "Plan Starter · sin tarjeta",
    shipChip: "Últimos envíos · changelog",
  },
  en: {
    hero: {
      kicker: "NEW · SENSORY ENGINE",
      title1: "Feel the engine.",
      title2: "Don't explain it. Touch it.",
      sub: "One haptic pulse, three seconds of binaural and a wave that breathes with you. Tap the button — runs in your browser, nothing to install.",
      buttonIdle: "Activate pulse",
      buttonPulsing: "Feeling…",
      buttonAria: "Activate 3-second sensory pulse",
      hint: "3 seconds · audio + haptics",
      afterLine: "That's the engine. Now imagine a full session.",
      secondaryCta: "See a live demo · 30 min",
      secondaryHref: "/demo",
      chips: ["SOC 2", "HIPAA-ready", "GDPR", "NOM-035", "Zero telemetry"],
      chipsLabel: "Compliance and trust",
    },

    proofKicker: "AUDITABLE SIGNALS",
    proof: {
      s1Label: "protocols with documented mechanism",
      s1Sub:   () => `Inspect them at /evidencia · growing catalog`,
      s2Label: "studies cited with verifiable DOIs",
      s2Sub:   "Cohen 1988 · Task Force 1996 · Shaffer 2017…",
      s3Value: "0",
      s3Label: "proprietary scores without public reference",
      s3Sub:   "If it shows up in the report, its source is public",
    },

    manifestoKicker: "MANIFESTO",
    manifesto1: "Optimization isn't plotted.",
    manifesto2: "It's felt.",
    manifestoBody: "Data exists to tune the pulse — not to decorate a dashboard. If we can't turn a metric into a sensory action, we don't show it.",

    bentoKicker: "INSIDE",
    bentoH: "Three signals. One language. Your nervous system.",
    bento: {
      neural: { t: "The engine listens to you", d: "Your HRV, your breath, your sleep. Three pulses in. One comes out tuned to you — not to the median." },
      privacy: { t: "Your data doesn't breathe outside", d: "Encrypted on your device. Zero telemetry until you say yes. Export or erase in under twenty-four hours." },
      protocols: { t: "Four pulses. One vocabulary.", d: "Calm. Focus. Energy. Reset. Binaural audio, guided voice and haptics beat in the same cadence." },
      evidence: { t: "Every pulse cites its study", d: "Evidence high, moderate or limited — we say it. If the literature hesitates, we hesitate too." },
      adoption: { t: "Adoption is measured, not plotted.", d: "Tap-to-Ignite in lobbies and rooms: 15 seconds per pulse. Team usage dashboard with k-anonymity ≥ 5 — no names, no raw data." },
      meter: { t: "What you use is what you see.", d: "Sessions counted to the second. Cap per plan, transparent overage. Zero end-of-month surprises — CFDI 4.0 invoice or USD/EUR invoice." },
    },

    howKicker: "HOW IT WORKS",
    howH: "Three steps. Zero abstractions.",
    howSub: "From tapping the button to measuring team adoption — with mechanism and cited evidence at every step. No blackbox.",
    how: [
      {
        t: "You tap. The engine responds.",
        d: "Open the PWA in any modern browser — no install. Tap-to-Ignite fires 15 seconds of binaural audio + haptics + guided voice synced to the ms. If your device has a vibration motor, we use it; if not, audio carries the pulse alone.",
        cite: "Balban et al., 2023 · Cell Reports Medicine · n=114, d≈0.45",
        citeHref: "https://doi.org/10.1016/j.xcrm.2022.100895",
      },
      {
        t: "The engine listens to your physiology.",
        d: "We connect HRV (Apple Health / Fitbit / Garmin / Oura), resonance-frequency guided breathing and sleep pattern. The adaptive engine — open at /evidencia — picks the right protocol: calm, focus, energy or reset. Every recommendation cites the study behind it.",
        cite: "Lehrer & Gevirtz, 2014 · Frontiers in Psychology",
        citeHref: "https://doi.org/10.3389/fpsyg.2014.00756",
      },
      {
        t: "Your team adopts without forcing it.",
        d: "Physical NFC/QR stations in lobbies and rooms. Optional nudges via Slack and Google Calendar. Adoption panel with k-anonymity ≥5 — no names, no raw data. Automated NOM-035 STPS report and signed export for audit.",
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

    previewKicker: "THE PRODUCT · IN 60 SECONDS",
    previewH: "You felt it. Now look inside.",
    previewBody: "Real-time HRV, daily pulses, team adherence and cited evidence. No stock screenshots — the same view your admin opens at 9 a.m. Monday.",
    previewVideoCta: "See it in 90 seconds",
    previewVideoPlaceholder: "Live demo · book a human for a full walkthrough.",

    personaKicker: "FOR WHO",
    personaH: "Three desks. Three questions we answer without dodging.",
    personas: [
      {
        role: "CHRO · PEOPLE OPS",
        title: "How do I measure wellbeing without invading?",
        body: "Team panel with k-anonymity ≥5, automated NOM-035 report and signed export for HR. No names, no raw data — only aggregated signals.",
        points: ["Automated NOM-035 STPS", "Aggregates only when n ≥ 5", "Signed export for audit"],
        outcome: "In 90 days: first signed NOM-035 report and measurable team adherence.",
      },
      {
        role: "VP PEOPLE · L&D",
        title: "How do I drive adoption without forcing it?",
        body: "Tap-to-Ignite in lobbies and rooms: 15 seconds per pulse. Slack and Calendar integration for nudges that respect the day — not interrupt it.",
        points: ["Physical NFC/QR stations", "Slack + Google Calendar", "Non-intrusive nudges"],
        outcome: "In 90 days: active cohort at ≥3 pulses/week without mandated rollouts.",
      },
      {
        role: "CISO · IT SECURITY",
        title: "What's your security story?",
        body: "SAML 2.0 + SCIM 2.0 + federated OIDC. Signable BAA, US/EU/LATAM residency, audit log with verifiable hash chain. Annual pentest and SOC 2 Type II.",
        points: ["SAML · SCIM · OIDC", "HIPAA BAA · residency of choice", "Verifiable audit log + SOC 2"],
        outcome: "In 60 days: BAA signed, federated SSO in prod and auditable audit log.",
      },
    ],

    scienceEyebrow: "NEURAL PRINCIPLE",
    scienceQuote: "HRV, resonance breathing and binaurals aren't placebo — they're forty years of reviewed literature. What changes here is that we turn them into a pulse you can feel, not a chart you have to interpret.",
    scienceAttr: "Peer-reviewed evidence",
    scienceAttrHref: "/evidencia",

    intKicker: "ECOSYSTEM",
    intH: "Speaks to the tools you already use.",
    integrations: [
      "Slack", "Google Calendar", "Google SSO", "Microsoft SSO", "Okta", "Apple Health", "Fitbit", "Garmin", "Oura", "HMAC Webhooks", "REST API", "SCIM 2.0",
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

    credKicker: "CREDIBILITY · WITHOUT FAKE LOGOS",
    credH: "Proof you can open yourself.",
    credSub: "We're pre-launch — we don't fake testimonials. Everything we claim lives in a public artifact you can inspect right now.",
    credItems: [
      { href: "/evidencia", label: "Clinical evidence",  meta: (studies, protos) => `${studies} studies · ${protos} protocols · verifiable DOIs` },
      { href: "/api/openapi", label: "Public OpenAPI",   meta: () => "OpenAPI 3.1 · versioned" },
      { href: "/changelog",  label: "Public changelog",  meta: () => "Biweekly ships · RSS" },
      { href: "/status",     label: "System status",     meta: () => "Live uptime and incidents" },
      { href: "/.well-known/security.txt", label: "Security.txt", meta: () => "Responsible disclosure channel" },
      { href: "/trust",      label: "Trust Center",      meta: () => "DPA · subprocessors · pentest" },
    ],

    priceKicker: "PRICING · IN THE OPEN",
    priceH: "Starter. Growth. Enterprise.",
    priceSub: "Per active user. 20% off annual. Volume discount up to −20%. MXN · USD · EUR. Zero hidden setup.",
    priceCta: "See full pricing",
    priceNote: "Starter trial 14 d · Growth pilot 30 d · Enterprise 60 d with DPA",

    finalKicker: "NEXT",
    finalH1: "30 minutes.",
    finalH2: "A live session.",
    finalBody: "No slides. We run a protocol with you, read your HRV and answer everything about security.",
    finalCta: "Book a demo",
    trialCta: "Start free · 14 d",
    trialSub: "Starter plan · no card",
    shipChip: "Latest ships · changelog",

    faqKicker: "HONEST QUESTIONS",
    faqH: "What teams ask before they buy.",
    faq: [
      {
        q: "Where does the data live?",
        a: "Choose residency US · EU · LATAM (AWS). Encryption at rest and in transit, encrypted IndexedDB on the user's device. Signed JSON export or full erase in under 24 h. Signed detail at /trust.",
      },
      {
        q: "Is it HIPAA and NOM-035?",
        a: "HIPAA BAA signable on Growth and Enterprise. Automated NOM-035 STPS report with k-anonymity ≥5 aggregates — no names, no raw data. Auditable via verifiable hash chain.",
      },
      {
        q: "How does it integrate with our stack?",
        a: "SSO via SAML 2.0, federated OIDC and SCIM 2.0. Slack and Google Calendar for opt-in nudges. Wearables: Apple Health, Fitbit, Garmin, Oura. REST API + HMAC webhooks. Works with no wearable — the PWA carries the pulse alone.",
      },
      {
        q: "How fast can the team start?",
        a: "Starter: 14 d trial, self-serve, today. Growth: 30 d guided pilot. Enterprise: 60 d with signed DPA, federated SSO and first NOM-035 report. No hidden setup fees.",
      },
      {
        q: "Can I cancel any time?",
        a: "Starter and Growth: monthly or annual, cancel whenever. Design Partner: 24 months at 50% off (the commitment is in the open at /pricing). Signed export of all your data before you leave.",
      },
    ],
  },
};

export default async function HomePage() {
  const locale = await getServerLocale();
  const lang = locale === "en" ? "en" : "es";
  const T = COPY[lang];
  const pricePeek = PRICE_PEEK[lang];
  const partner = PARTNER_COPY[lang];

  const evidenceEntries = Object.values(EVIDENCE);
  const protocolCount = evidenceEntries.length;
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
          </div>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      <section style={{
        paddingBlock: "clamp(80px, 12vw, 160px)",
        paddingInline: space[5],
        textAlign: "center",
      }}>
        <Container size="md">
          <IgnitionReveal sparkOrigin="50% 40%">
            <div style={kickerStyle}>{T.manifestoKicker}</div>
            <h2 style={{
              margin: 0,
              fontSize: "clamp(40px, 6vw, 72px)",
              lineHeight: 1.05,
              letterSpacing: "-0.035em",
              fontWeight: font.weight.black,
              color: cssVar.text,
            }}>
              {T.manifesto1}
              <br />
              <span style={{ color: cssVar.textDim }}>{T.manifesto2}</span>
            </h2>
            <p style={{
              marginBlockStart: space[6],
              marginInline: "auto",
              maxInlineSize: 620,
              fontSize: font.size.lg,
              lineHeight: 1.55,
              color: cssVar.textDim,
            }}>
              {T.manifestoBody}
            </p>
          </IgnitionReveal>
        </Container>
      </section>

      <PulseDivider />

      <section style={{ paddingBlock: space[12], paddingInline: space[5] }}>
        <Container size="xl">
          <IgnitionReveal sparkOrigin="50% 50%">
            <div style={{ marginBlockEnd: space[8], textAlign: "center" }}>
              <div style={kickerStyle}>{T.bentoKicker}</div>
              <h3 style={sectionHeading}>{T.bentoH}</h3>
            </div>
          </IgnitionReveal>

          <SpotlightGrid className="bi-bento-grid">
            <BentoCard col={7} row={2} variant="hero" title={T.bento.neural.t}    body={T.bento.neural.d}    lattice="neural"    delay={0} />
            <BentoCard col={5}        title={T.bento.privacy.t}   body={T.bento.privacy.d}   lattice="privacy"   delay={0.12} />
            <BentoCard col={5}        title={T.bento.evidence.t}  body={T.bento.evidence.d}  lattice="evidence"  delay={0.24} />
            <BentoCard col={6}        title={T.bento.adoption.t}  body={T.bento.adoption.d}  lattice="neural"    delay={0.30} />
            <BentoCard col={6}        title={T.bento.meter.t}     body={T.bento.meter.d}     lattice="privacy"   delay={0.36} />
            <BentoCard col={12}       title={T.bento.protocols.t} body={T.bento.protocols.d} lattice="protocols" delay={0.42} wide />
          </SpotlightGrid>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      <section aria-labelledby="how-it-works" style={{ paddingBlock: space[12], paddingInline: space[5] }}>
        <Container size="xl">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[8] }}>
              <div style={{ ...kickerStyle, color: bioSignal.phosphorCyan }}>{T.howKicker}</div>
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

            <p style={{
              marginBlockStart: space[5],
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

      <section aria-labelledby="preview" style={{ paddingBlock: space[12], paddingInline: space[5] }}>
        <Container size="xl">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[7] }}>
              <div style={{ ...kickerStyle, color: bioSignal.phosphorCyan }}>{T.previewKicker}</div>
              <h3 id="preview" style={sectionHeading}>{T.previewH}</h3>
              <p style={{
                marginBlockStart: space[3],
                marginInline: "auto",
                maxInlineSize: 640,
                color: cssVar.textDim,
                fontSize: font.size.md,
                lineHeight: 1.55,
              }}>
                {T.previewBody}
              </p>
              <div style={{ marginBlockStart: space[5], display: "inline-flex", justifyContent: "center" }}>
                <VideoPreview
                  label={T.previewVideoCta}
                  placeholder={T.previewVideoPlaceholder}
                  title="BIO-IGNICIÓN · 90s overview"
                />
              </div>
            </div>
            <DashboardMockup ariaLabel={T.previewH} />
          </IgnitionReveal>
        </Container>
      </section>

      <section style={{ paddingBlock: space[12], paddingInline: space[5] }}>
        <Container size="xl">
          <IgnitionReveal sparkOrigin="50% 40%">
            <div style={{ marginBlockEnd: space[7], textAlign: "center" }}>
              <div style={kickerStyle}>{T.personaKicker}</div>
              <h3 style={sectionHeading}>{T.personaH}</h3>
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

      <section style={{
        position: "relative",
        paddingBlock: "clamp(80px, 12vw, 140px)",
        paddingInline: space[5],
        background: `linear-gradient(180deg, transparent, ${bioSignal.phosphorCyan}08 50%, transparent)`,
        overflow: "hidden",
      }}>
        <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, opacity: 0.35, pointerEvents: "none" }}>
          <BioglyphLattice variant="ambient" />
        </div>
        <Container size="md">
          <IgnitionReveal sparkOrigin="50% 50%">
            <div style={{ ...kickerStyle, color: bioSignal.phosphorCyan, textAlign: "center" }}>
              {T.scienceEyebrow}
            </div>
            <blockquote style={{
              margin: 0,
              fontFamily: "var(--font-editorial), 'Instrument Serif', Georgia, serif",
              fontStyle: "italic",
              fontSize: "clamp(28px, 3.6vw, 48px)",
              lineHeight: 1.25,
              color: cssVar.text,
              textAlign: "center",
              letterSpacing: "-0.02em",
              fontWeight: 400,
            }}>
              &ldquo;{T.scienceQuote}&rdquo;
            </blockquote>
            <div style={{
              marginBlockStart: space[5],
              textAlign: "center",
              fontFamily: cssVar.fontMono, fontSize: font.size.xs,
              color: cssVar.textDim,
              textTransform: "uppercase", letterSpacing: "0.22em",
            }}>
              —{" "}
              <Link
                href={T.scienceAttrHref}
                style={{
                  color: bioSignal.phosphorCyan,
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                  fontWeight: 700,
                }}
              >
                {T.scienceAttr}
              </Link>
            </div>
          </IgnitionReveal>
        </Container>
      </section>

      <section aria-label={T.intKicker} style={{ paddingBlock: space[10], paddingInline: 0 }}>
        <Container size="xl" style={{ paddingInline: space[5] }}>
          <IgnitionReveal sparkOrigin="50% 40%">
            <div style={{ textAlign: "center", marginBlockEnd: space[5] }}>
              <div style={kickerStyle}>{T.intKicker}</div>
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
            <div className="bi-trust-kicker" style={kickerStyle}>{T.trustKicker}</div>
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

      <PulseDivider intensity="dim" />

      <section aria-labelledby="credibility" style={{ paddingBlock: space[12], paddingInline: space[5] }}>
        <Container size="xl">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[7] }}>
              <div style={{ ...kickerStyle, color: bioSignal.phosphorCyan }}>{T.credKicker}</div>
              <h3 id="credibility" style={sectionHeading}>{T.credH}</h3>
              <p style={{
                marginBlockStart: space[3],
                marginInline: "auto",
                maxInlineSize: 640,
                color: cssVar.textDim,
                fontSize: font.size.md,
                lineHeight: 1.55,
              }}>
                {T.credSub}
              </p>
            </div>
            <SpotlightGrid className="bi-cred-grid" role="list">
              {T.credItems.map((c) => (
                <Link key={c.href} href={c.href} className="bi-cred-card bi-spot" role="listitem">
                  <span className="bi-cred-label">{c.label}</span>
                  <span className="bi-cred-meta">{c.meta(studyCount, protocolCount)}</span>
                  <span className="bi-cred-arrow" aria-hidden>→</span>
                </Link>
              ))}
            </SpotlightGrid>
          </IgnitionReveal>
        </Container>
      </section>

      <PulseDivider />

      <section aria-labelledby="faq" style={{ paddingBlock: space[12], paddingInline: space[5] }}>
        <Container size="md">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[7] }}>
              <div style={kickerStyle}>{T.faqKicker}</div>
              <h3 id="faq" style={sectionHeading}>{T.faqH}</h3>
            </div>
            <div className="bi-faq">
              {T.faq.map((item, i) => (
                <details key={item.q} className="bi-faq-item" open={i === 0}>
                  <summary>
                    <span>{item.q}</span>
                    <span className="chev" aria-hidden>+</span>
                  </summary>
                  <div className="bi-faq-a">{item.a}</div>
                </details>
              ))}
            </div>
          </IgnitionReveal>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      <section style={{ paddingBlock: space[12], paddingInline: space[5] }}>
        <Container size="lg">
          <IgnitionReveal sparkOrigin="50% 40%">
            <div style={{ textAlign: "center", marginBlockEnd: space[6] }}>
              <div style={{ ...kickerStyle, color: bioSignal.phosphorCyan }}>{T.priceKicker}</div>
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
          </IgnitionReveal>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      <section style={{
        paddingBlock: "clamp(80px, 12vw, 140px)",
        paddingInline: space[5],
        textAlign: "center",
      }}>
        <Container size="md">
          <IgnitionReveal sparkOrigin="50% 40%">
            <div style={kickerStyle}>{T.finalKicker}</div>
            <h3 style={{
              margin: 0,
              fontSize: "clamp(40px, 6vw, 72px)",
              lineHeight: 1.05,
              letterSpacing: "-0.035em",
              fontWeight: font.weight.black,
              color: cssVar.text,
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
              color: cssVar.textDim,
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
                background: `color-mix(in srgb, ${bioSignal.phosphorCyan} 8%, transparent)`,
                border: `1px solid color-mix(in srgb, ${bioSignal.phosphorCyan} 30%, ${cssVar.border})`,
                color: cssVar.textDim,
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

const kickerStyle = {
  fontFamily: cssVar.fontMono,
  fontSize: font.size.xs,
  color: cssVar.textMuted,
  textTransform: "uppercase",
  letterSpacing: "0.22em",
  fontWeight: font.weight.bold,
  marginBlockEnd: space[3],
};

const sectionHeading = {
  margin: 0,
  fontSize: "clamp(28px, 4vw, 44px)",
  lineHeight: 1.15,
  letterSpacing: "-0.025em",
  fontWeight: font.weight.black,
  color: cssVar.text,
  maxInlineSize: 720,
  marginInline: "auto",
};

function BentoCard({ col = 4, row = 1, variant, title, body, lattice, delay = 0, wide }) {
  const isHero = variant === "hero";
  return (
    <div
      className="bi-bento-card bi-spot"
      data-col={col}
      data-row={row}
      style={{
        "--bento-col": col,
        "--bento-row": row,
        position: "relative",
        padding: space[6],
        borderRadius: radius.lg,
        background: isHero
          ? `linear-gradient(150deg, ${bioSignal.deepField}, #0a0d14)`
          : cssVar.surface,
        border: `1px solid ${isHero ? `color-mix(in srgb, ${bioSignal.phosphorCyan} 22%, transparent)` : cssVar.border}`,
        overflow: "hidden",
        minHeight: isHero ? 460 : wide ? 260 : 220,
        display: "flex", flexDirection: "column",
        justifyContent: "space-between",
        gap: space[5],
      }}>
      <IgnitionReveal delay={delay} sparkOrigin="50% 40%">
        <div style={{
          height: isHero ? 220 : wide ? 160 : 120,
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: 0.95,
        }}>
          <BioglyphLattice variant={lattice} animated />
        </div>
        <div>
          <h4 style={{
            margin: 0,
            fontSize: isHero ? font.size["2xl"] : font.size.xl,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            fontWeight: font.weight.black,
            color: cssVar.text,
          }}>
            {title}
          </h4>
          <p style={{
            marginBlockStart: space[3],
            color: cssVar.textDim,
            fontSize: font.size.sm,
            lineHeight: 1.55,
          }}>
            {body}
          </p>
        </div>
      </IgnitionReveal>
    </div>
  );
}
