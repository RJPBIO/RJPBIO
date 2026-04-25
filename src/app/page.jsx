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
import PWAShowcase from "@/components/brand/PWAShowcase";
import ProductEvidence from "@/components/brand/ProductEvidence";
import { BioGlyph } from "@/components/BioIgnicionMark";

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
      sub: "El primer instrumento neural B2B con recibos. HRV medible, pulso háptico, export NOM-035 firmable. 3 minutos pre y post turno — no otra app de meditación.",
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

    evidenceKicker: "EVIDENCIA OPERATIVA · LO QUE TU ADMIN VE",
    evidenceH: "Tres receipts, no tres promesas.",
    evidenceSub: "Estos son los artifacts que la plataforma produce desde el primer día. Sin capturas simuladas, sin demos curadas.",
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
        d: "Medimos HRV directamente: strap BLE (Polar, Wahoo, Garmin HRM) o cámara del teléfono (PPG con algoritmo propio). Webhook de ingestión para Whoop / Oura / Fitbit (UI de conexión en roadmap). El motor adaptativo — abierto en /evidencia — elige el protocolo correcto: calma, enfoque, energía o reset. Cada recomendación cita el estudio detrás.",
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

    cineMidLine: "Todo late por una razón.",
    cinePauseLine: "Ya viste cómo late. Ahora tócalo.",

    finalKicker: "SIGUIENTE",
    finalH1: "30 minutos.",
    finalH2: "Una sesión en vivo.",
    finalBody: "Sin slides. Corremos un protocolo contigo, leemos tu HRV y respondemos todo sobre seguridad.",
    finalCta: "Agendar demo",
    trialCta: "Empezar gratis · 14 d",
    trialSub: "Plan Starter · sin tarjeta",
    shipChip: "Últimos envíos · changelog",

    pwa: {
      kicker: "EL MOTOR · EN TU BOLSILLO",
      headline: "Tu app neural. Instalable en iOS y Android. Sin app store.",
      sub: "BIO-IGNICIÓN es una Progressive Web App. Se instala desde el navegador en 15 segundos — Safari en iOS, Chrome en Android. Cero descarga desde tienda. Cero revisiones de Apple o Google. Cero actualizaciones forzadas. El motor vive en el bolsillo de tu equipo en minutos, no en semanas.",
      stageAria: "Vista previa de tres pantallas clave de la PWA: Ignición, sesión en vivo y perfil del operador",
      stageCapsAria: "Qué ves en cada pantalla",
      stageCaps: [
        "Ignición · el motor ya sabe qué protocolo hoy — basado en tu HRV, tu sueño y tu hora pico.",
        "Sesión · respiras con la onda. Audio binaural, haptics y voz guiada laten al milisegundo.",
        "Perfil · tu baseline inicial, composite neural 0–100, racha y delta semanal. Sync opcional.",
      ],
      screens: {
        ignicion: {
          todayLabel: "Enfoque · resonancia",
          todayPhrase: "El viento sigue soplando.",
          protoLabel: "Calma 4·8",
          protoPhases: "3 fases",
        },
        runner: {
          phaseKicker: "FASE · INHALA",
          phase: "Inhala",
          signalBtn: "SIG",
          resetBtn: "RESET",
        },
        perfil: {
          operatorLabel: "Operador Neural",
          statusLabel: "ÓPTIMO · n3",
          syncedName: "Ana · Acme",
          syncedLabel: "Sincronizado",
          compositeLabel: "COMPOSITE · RT · BR · FOC · STR",
        },
      },
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
      sub: "The first B2B neural instrument with receipts. Measurable HRV, haptic pulse, signable NOM-035 export. 3 minutes pre- and post-shift — not another meditation app.",
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

    evidenceKicker: "OPERATIONAL EVIDENCE · WHAT YOUR ADMIN SEES",
    evidenceH: "Three receipts, not three promises.",
    evidenceSub: "These are the artifacts the platform produces from day one. No simulated screenshots, no curated demos.",
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
        d: "Direct HRV: BLE strap (Polar, Wahoo, Garmin HRM) or phone camera (in-house PPG algorithm). Webhook ingestion for Whoop / Oura / Fitbit (connection UI on roadmap). The adaptive engine — open at /evidencia — picks the right protocol: calm, focus, energy or reset. Every recommendation cites the study behind it.",
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

    cineMidLine: "Everything pulses for a reason.",
    cinePauseLine: "You've seen the pulse. Now touch it.",

    finalKicker: "NEXT",
    finalH1: "30 minutes.",
    finalH2: "A live session.",
    finalBody: "No slides. We run a protocol with you, read your HRV and answer everything about security.",
    finalCta: "Book a demo",
    trialCta: "Start free · 14 d",
    trialSub: "Starter plan · no card",
    shipChip: "Latest ships · changelog",

    pwa: {
      kicker: "THE ENGINE · IN YOUR POCKET",
      headline: "Your neural app. Installs on iOS and Android. No app store.",
      sub: "BIO-IGNICIÓN is a Progressive Web App. It installs from the browser in 15 seconds — Safari on iOS, Chrome on Android. No store download. No Apple or Google review cycle. No forced updates. The engine lives in your team's pocket in minutes, not weeks.",
      stageAria: "Preview of three key PWA screens: Ignition, live session and operator profile",
      stageCapsAria: "What you see on each screen",
      stageCaps: [
        "Ignition · the engine already knows which protocol today — based on your HRV, sleep and peak hour.",
        "Session · you breathe with the wave. Binaural audio, haptics and voice cues beat to the millisecond.",
        "Profile · your baseline, 0–100 neural composite, streak and weekly delta. Optional sync.",
      ],
      screens: {
        ignicion: {
          todayLabel: "Focus · resonance",
          todayPhrase: "The wind keeps blowing.",
          protoLabel: "Calma 4·8",
          protoPhases: "3 phases",
        },
        runner: {
          phaseKicker: "PHASE · INHALE",
          phase: "Inhale",
          signalBtn: "SIG",
          resetBtn: "RESET",
        },
        perfil: {
          operatorLabel: "Neural Operator",
          statusLabel: "OPTIMAL · n3",
          syncedName: "Ana · Acme",
          syncedLabel: "Synced",
          compositeLabel: "COMPOSITE · RT · BR · FOC · STR",
        },
      },
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

      <PulseDivider />

      {/* Manifesto section lived here — cut. The full thesis (incl.
          this copy + editorial framing + supporting stats) lives on
          /why. Home's job is to get the prospect into /why or /demo
          faster, not to recite the thesis twice. */}

      {/* Product preview — moved up from post-PWA position so the
          real admin dashboard is visible within the first 2 scrolls.
          Linear/Stripe pattern: ship the product view above the
          value-prop copy, not after it. */}
      <section aria-labelledby="preview" style={{ paddingBlock: "clamp(64px, 9vw, 120px)", paddingInline: space[5] }}>
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

      {/* Evidence as the first of three dark moments on /home.
          Thematically fits: these are terminal/monospace receipts,
          darkness is their native habitat. Header colors bumped to
          dark-bg-safe variants — phosphorCyan (not cyanInk) reads
          fine on the dark frame; heading + sub use explicit light
          colors so they don't inherit from the light-theme cascade. */}
      <section aria-labelledby="evidence" className="bi-darkframe">
        <Container size="xl">
          <div style={{ textAlign: "center", marginBlockEnd: space[8] }}>
            <div style={{ ...kickerStyle, color: bioSignal.phosphorCyan }}>{T.evidenceKicker}</div>
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

      {/* Mid-page cinematic pause — bridges the density of Product
          Evidence (3 monospace receipts) into the density of Bento
          (4-6 feature cards). Same scaffolding as the final pause,
          shorter copy to keep the beat distinct. Replaces the plain
          PulseDivider that lived here. */}
      <section aria-labelledby="cinematic-pause-mid" className="bi-cine-pause bi-cine-pause--mid">
        <div className="bi-cine-pause-glyph">
          <BioGlyph size={76} />
        </div>
        <h2 id="cinematic-pause-mid" className="bi-cine-pause-line">
          {T.cineMidLine}
        </h2>
      </section>

      <section style={{ paddingBlock: "clamp(64px, 9vw, 120px)", paddingInline: space[5] }}>
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

      <section aria-labelledby="how-it-works" style={{ paddingBlock: "clamp(64px, 9vw, 120px)", paddingInline: space[5] }}>
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

      <section style={{ paddingBlock: "clamp(64px, 9vw, 120px)", paddingInline: space[5] }}>
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

      {/* Credibility 6-artifact grid lived here — cut. Every link
          (evidencia / OpenAPI / changelog / status / security.txt /
          trust) is already in the site footer AND prominently on
          /trust. Duplicating a full section on home just to repeat
          those six links inflated the scroll.

          FAQ section also lived here — cut. The same 5 questions now
          live on /pricing where a buyer is actually evaluating. Home
          FAQ is a Stripe/Linear anti-pattern (neither does it on the
          current 2026 homepage). */}
      <PulseDivider intensity="dim" />

      <section style={{ paddingBlock: "clamp(64px, 9vw, 120px)", paddingInline: space[5] }}>
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

      {/* ═══ Cinematic pause ════════════════════════════════════
          Full-bleed breath between dense pricing and the final CTA.
          Single glyph + one editorial sentence in serif italic,
          surrounded by generous whitespace. Stripe/Linear use this
          pattern to break scroll density and give the reader a beat
          of agency before action. Copy echoes the hero verbatim
          ("tócalo" / "touch it") to close the narrative loop. */}
      <section aria-labelledby="cinematic-pause" className="bi-cine-pause">
        <div className="bi-cine-pause-glyph">
          <BioGlyph size={92} />
        </div>
        <h2 id="cinematic-pause" className="bi-cine-pause-line">
          {T.cinePauseLine}
        </h2>
      </section>

      {/* Final CTA as the third dark moment — weight of decision.
          Creates narrative bracket: light hero opens, dark CTA
          closes. Text colors explicit dark-bg-safe; gradient accent
          on "Una sesión en vivo." already works because gradient
          text is self-contained. Button styles get dark-frame
          overrides in globals.css. */}
      <section className="bi-darkframe" style={{ textAlign: "center" }}>
        <Container size="md">
          <IgnitionReveal sparkOrigin="50% 40%">
            <div style={{ ...kickerStyle, color: bioSignal.phosphorCyan }}>{T.finalKicker}</div>
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
