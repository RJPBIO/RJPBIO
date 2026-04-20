import { Fragment } from "react";
import { headers } from "next/headers";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font, radius, bioSignal } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";
import { EVIDENCE } from "@/lib/evidence";
import { PARTNER_COPY } from "@/lib/pricing";
import PricingCards from "./PricingCards";
import PricingROICalc from "./PricingROICalc";
import PrintButton from "./PrintButton";
import PricingSectionNav from "./PricingSectionNav";
import IgnitionReveal from "@/components/brand/IgnitionReveal";
import BioglyphLattice from "@/components/brand/BioglyphLattice";
import PulseDivider from "@/components/brand/PulseDivider";
import CountUp from "@/components/brand/CountUp";
import SpotlightGrid from "@/components/brand/SpotlightGrid";
import PartnerApplyModal from "@/components/ui/PartnerApplyModal";

const kickerStyle = {
  fontFamily: cssVar.fontMono,
  fontSize: font.size.xs,
  color: bioSignal.phosphorCyan,
  textTransform: "uppercase",
  letterSpacing: "0.24em",
  fontWeight: font.weight.bold,
  marginBlockEnd: space[3],
};

const kickerStyleMuted = {
  ...kickerStyle,
  color: cssVar.textMuted,
};

const sectionHeading = {
  margin: 0,
  fontSize: "clamp(28px, 4vw, 44px)",
  letterSpacing: "-0.025em",
  lineHeight: 1.08,
  fontWeight: font.weight.black,
  color: cssVar.text,
};

export const metadata = {
  title: "Precios",
  description: "Planes B2B neurales. Starter $15, Growth $39, Enterprise custom. Sin setup, descuentos por volumen, MXN/USD/EUR.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "BIO-IGNICIÓN · Precios",
    description: "Starter, Growth, Enterprise. Neural adaptation con cumplimiento de grado empresarial.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
};

const COPY = {
  es: {
    kicker: "PRECIOS · B2B NEURAL",
    title: "Enciende al equipo. Paga solo por quien entra.",
    editorial: "Lo que ves es lo que pagas — sin vendedor, sin descuento «especial» en el PDF.",
    sub: "Por usuario activo. 20 % de descuento anual. Sin setup, sin mínimos ocultos — y descuentos por volumen visibles, no negociados bajo la mesa.",
    cadenceLabel: "Facturación",
    cadenceMonthly: "Mensual",
    cadenceAnnual: "Anual · −20 %",
    currencyLabel: "Moneda",
    plansLabel: "Planes",
    unitMonthly: "/usuario · mes",
    unitAnnualBilled: "/usuario · mes · anual",
    unitCustom: "contrato anual",
    annualTotalSuffix: "/ asiento / año · se factura al inicio",
    customHint: "Desde 100 asientos o $30K ARR · MSA negociable",
    featured: "Más elegido",
    savingsHint: "{a} × 12 en vez de {m} × 12 · ahorras 20 % · {code}",
    crossSellHint: "o {a} con facturación anual · −20 % · {code}",
    seatsLabel: "Asientos",
    trialLabel: "Prueba",
    volumeTitle: "Descuento por volumen",
    volumeTiers: [
      { range: "50 + asientos",  off: "−10 %" },
      { range: "100 + asientos", off: "−15 %" },
      { range: "250 + asientos", off: "−20 %" },
    ],
    volumeNote: "Acumulable con facturación anual. Automático al checkout.",
    plans: {
      starter: {
        kicker: "PERSONAL · EQUIPO CHICO",
        tagline: "Para equipos que quieren probar la plataforma sin fricción comercial.",
        seats: "5 – 25",
        trial: "14 d sin tarjeta",
        features: [
          "Protocolos neurales ilimitados",
          "Audio + haptics + binaural + voz",
          "Dashboard personal + histórico 30 d",
          "PWA local-first (offline)",
          "Soporte email · 48 h SLA",
          "Cifrado AES-256 + TLS 1.3",
        ],
        cta: "Empezar trial",
      },
      growth: {
        kicker: "FEATURED · EQUIPOS DISTRIBUIDOS",
        tagline: "Para empresas que miden impacto del sistema nervioso en producción.",
        seats: "10 – 250",
        trial: "Piloto 30 d",
        features: [
          "Todo lo de Starter",
          "Panel de equipo con k-anonymity ≥5",
          "Reporte NOM-035 automatizado",
          "Tap-to-Ignite: 3 estaciones incluidas",
          "Slack + Google Calendar + webhooks HMAC",
          "REST API pública con rate-limit generoso",
          "SSO Google + Microsoft",
          "Chat + email · 24 h SLA",
        ],
        cta: "Agenda demo",
      },
      enterprise: {
        kicker: "REGULADO · IDENTITY FEDERATED",
        tagline: "Para organizaciones con revisión legal, seguridad y cumplimiento formal.",
        seats: "100 + ó $30K ARR",
        trial: "60 d con DPA",
        features: [
          "Todo lo de Growth",
          "SAML 2.0 + SCIM 2.0 + OIDC federado",
          "DPA negociable + BAA firmado (HIPAA)",
          "Audit log verificable (hash chain)",
          "Residencia de datos (US · EU · LATAM)",
          "99.95 % uptime · 4 h soporte crítico",
          "Customer Success dedicado + onboarding guiado",
          "SOC 2 Type II + pentest anual",
        ],
        cta: "Hablar con ventas",
      },
    },
    addOnsTitle: "Add-ons",
    addOnsSub: "Piezas opcionales que se suman a cualquier plan.",
    addOns: [
      { name: "Estación Tap-to-Ignite adicional", price: "$299", unit: "único / estación",   body: "NFC + QR + lector HRV opcional. Para lobbies, oficinas y salas." },
      { name: "Onboarding profesional",            price: "$2,500", unit: "único",             body: "Kickoff dedicado, tracking de adopción y playbook de lanzamiento.", plans: "Growth · Enterprise" },
      { name: "Instancia single-tenant",           price: "$1,500", unit: "/ mes",             body: "Base de datos y workers dedicados. Auditoría de infra por separado.", plans: "Enterprise" },
      { name: "Sesión 1:1 con coach neural",       price: "$149",   unit: "/ sesión / user",   body: "Revisión individual de métricas y ajuste personalizado de protocolo." },
    ],
    categoryTitle: "Dónde estamos en el mapa",
    categorySub: "No somos lo que ya probaste. Éstos son los vecinos — y la distancia honesta con cada uno.",
    categoryCards: [
      { kind: "other", label: "MEDITACIÓN MASIVA",    title: "Calm Business · Headspace",  delta: "Biblioteca de contenido. Minutos meditados como KPI." },
      { kind: "other", label: "WELLNESS CONTENIDO",   title: "Unmind · Thrive Global",     delta: "Cursos + checklists. Analíticas de uso, no de fisiología." },
      { kind: "us",    label: "NEURAL ADAPTATION",    title: "BIO-IGNICIÓN",               delta: "HRV medible + intervención sensorial + NOM-035 + SOC 2 + Tap-to-Ignite físico." },
      { kind: "other", label: "SALUD MENTAL CLÍNICA", title: "Modern Health · Spring",     delta: "Terapia incluida. $30–60/user. Se usa cuando ya hay síntoma." },
      { kind: "other", label: "COACHING 1:1",         title: "BetterUp · Lyra",            delta: "Sesiones humanas. $150–300/user. Alto impacto, alto costo." },
    ],
    roiTitle: "El costo real de no encender",
    roiAnchor: (
      <>
        Un caso de burnout en LATAM/US cuesta entre <em>$15,000 y $45,000</em> por persona entre rotación, reemplazo y productividad perdida (Gallup 2023, Aflac WorkForces 2022, Deloitte MH 2022). Una licencia Growth con facturación anual es <em>$374 / usuario / año</em>.
        El break-even se cruza con <em>1 caso estándar prevenido cada 40 usuarios</em> — o 1 caso senior cada 120.
      </>
    ),
    roiCite: "Fuentes: Gallup State of the Global Workplace 2023 · Aflac WorkForces 2022 · Deloitte Mental Health in the Workplace 2022 · contexto: APA Work in America 2023, WHO Mental Health Report 2022",
    roiCta: "Ver calculadora ROI",
    roiBreakdownLabel: "Desglose: cómo se compone ese $15,000 – $45,000",
    roiBreakdownHint: "5 componentes. Rangos de literatura pública. DOI/links en /evidencia.",
    roiBreakdownCols: ["Componente", "Rango (USD)", "Fuente"],
    roiBreakdownRows: [
      { k: "Rotación voluntaria (finiquito + admin de salida)",        v: "$5,000 – 15,000", s: "SHRM · Cost of Voluntary Turnover 2022" },
      { k: "Reclutamiento + agencia / headhunter",                     v: "$3,000 – 7,000",  s: "SHRM Talent Acquisition Benchmark 2022" },
      { k: "Onboarding + ramp-up del reemplazo (3–6 meses)",           v: "$4,000 – 10,000", s: "Gallup State of the Global Workplace 2023" },
      { k: "Productividad perdida del empleado pre-salida",            v: "$2,000 – 8,000",  s: "Deloitte Mental Health in the Workplace 2022" },
      { k: "Presenteísmo + errores + ausentismo del equipo",           v: "$1,000 – 5,000",  s: "APA Work in America 2023" },
    ],
    roiBreakdownTotal: "Total",
    roiBreakdownTotalValue: "$15,000 – 45,000",
    roiBreakdownNote: "Mínimos suman $15K, máximos suman $45K — coincide con el rango citado arriba. Caso senior o en LATAM alto costo laboral se va al tope; caso estándar IC al piso.",
    compareTitle: "Comparativa completa",
    compareCols: ["Starter", "Growth", "Enterprise"],
    compareGroups: [
      {
        title: "Plataforma",
        rows: [
          ["Protocolos neurales ilimitados", true, true, true],
          ["Audio + haptics + binaural + voz", true, true, true],
          ["PWA offline (local-first)", true, true, true],
          ["Histórico personal", "30 días", "12 meses", "Sin límite"],
          ["Asientos incluidos", "5–25", "10–250", "100+ o $30K ARR"],
        ],
      },
      {
        title: "Equipos y analytics",
        rows: [
          ["Panel de equipo (k-anonymity ≥5)", false, true, true],
          ["Tap-to-Ignite (NFC/QR)", false, "3 incluidas", "Sin límite"],
          ["Reporte NOM-035 automatizado", false, true, true],
          ["Exportación", "Personal", "Equipo", "Organización + BYOK"],
        ],
      },
      {
        title: "API e integraciones",
        rows: [
          ["REST API pública", false, true, true],
          ["Webhooks firmados HMAC", false, true, true],
          ["Slack + Google Calendar", false, true, true],
          ["SSO Google + Microsoft", false, true, true],
          ["SAML 2.0 / OIDC federado", false, false, true],
          ["SCIM 2.0", false, false, true],
        ],
      },
      {
        title: "Seguridad y compliance",
        rows: [
          ["AES-256 en reposo + TLS 1.3", true, true, true],
          ["Audit log (hash chain)", false, "Estándar", "Verificable + export firmado"],
          ["DPA", false, "Estándar", "Negociable + MSA"],
          ["BAA (HIPAA)", false, false, true],
          ["Residencia (US · EU · LATAM)", false, false, true],
          ["SOC 2 Type II + pentest anual", false, false, true],
        ],
      },
      {
        title: "Soporte y SLA",
        rows: [
          ["Respuesta email", "48 h", "24 h", "4 h crítico"],
          ["Chat en vivo", false, true, true],
          ["Customer Success dedicado", false, false, true],
          ["Onboarding", "Self-serve", "Guiado + playbook", "Dedicado"],
          ["Uptime SLA", "99.9 %", "99.9 %", "99.95 %"],
        ],
      },
    ],
    trustTitle: "Cumplimiento y confianza",
    trustSub: "Controles que ya vienen de serie y los que tu plan activa.",
    trustBadges: [
      { label: "SOC 2 Type II",  hint: "En auditoría · Enterprise", tone: "pending" },
      { label: "GDPR",           hint: "Residencia UE opcional" },
      { label: "HIPAA",          hint: "BAA disponible · Enterprise" },
      { label: "NOM-035 STPS",   hint: "Reporte automatizado · Growth+" },
      { label: "CFDI 4.0",       hint: "Facturación MX · todos los tiers" },
      { label: "Audit log",      hint: "Hash chain verificable" },
    ],
    proofTitle: "Por qué puedes creer esto sin un muro de logos",
    proofSub: "Estamos en pre-lanzamiento — no vamos a inventar testimonios. Las señales que importan aquí son auditables, no decorativas.",
    proofStat1Label: "protocolos con mecanismo documentado",
    proofStat2Label: "estudios citados con DOI verificable",
    proofStat3Value: "0",
    proofStat3Label: "puntajes propietarios sin referencia pública",
    proofStat1Sub: (n) => `Ver los ${n} en /evidencia`,
    proofStat2Sub: "Cohen 1988 · Task Force 1996 · Shaffer 2017…",
    proofStat3Sub: "Si aparece en el reporte, su fuente es pública",
    partnerTitle: PARTNER_COPY.es.title,
    partnerBody: PARTNER_COPY.es.body,
    partnerCta: PARTNER_COPY.es.cta,
    founderTitle: "Los fundadores responden directo",
    founderBody: (
      <>
        Si algo no cuadra — técnico, comercial o de privacidad — escribe a{" "}
        <a href="mailto:hello@bio-ignicion.app">hello@bio-ignicion.app</a>. Responde el equipo que construyó esto, no una bandeja compartida.
      </>
    ),

    roiCalcKicker: "CALCULADORA · ROI",
    roiCalcTitle: "Corre los números con tu equipo.",
    roiCalcSub: "Tres componentes por persona · año, todos explícitos: productividad recuperada $240 (0.67 h/mes × $30 cargado), ausentismo evitado $240 (1 día/año × $240), rotación evitada $60 (0.4 % × $15K). Total $540. Deloitte MH 2022 reporta 4.2:1; aquí usamos 1.6:1.",
    roiCalcCopy: {
      defaultSeats: 60, ourPerSeat: 39, altPerSeat: 50, liftPerSeatYr: 540,
      min: 5, max: 500, step: 5,
      seatsLabel: "Tamaño del equipo",
      seatsUnit: "asientos activos",
      volumeApplied: "Volumen aplicado",
      rowOur: "BIO-IGNICIÓN · año (anual)",
      rowAlt: "Alternativa Modern Health-tier",
      rowLift: "Productividad + ausentismo + rotación",
      rowNet: "Neto a favor · año",
      roiMultipleSub: "ROI anual · lift ÷ costo",
      disclosure: "Deloitte \"Mental Health in the Workplace\" 2022 reporta $4.20 por cada $1 invertido; nuestro modelo asume $1.60 — la mitad del promedio, para ser defendible en comité. Agenda un walkthrough con tus datos de rotación e industria para un cálculo exacto.",
    },

    overageKicker: "USO · SOBRE CAP",
    overageTitle: "Si alguien pasa el cap, lo sabes antes que tu CFO.",
    overageSub: "Alertamos al 80 % y al 100 %. Nunca bloqueamos acceso a media sesión. Overage se prorratea al ciclo y el upgrade aplica de inmediato con prorrateo. Una \"sesión\" es un protocolo neural ejecutado de principio a fin — abrir la app sin completar protocolo no cuenta.",
    overageCols: ["Plan", "Cap incluido", "Overage"],
    overageRows: [
      { plan: "Starter",    cap: "600 sesiones / mes",       rate: "$0.12 / sesión extra" },
      { plan: "Growth",     cap: "6,000 sesiones / mes",     rate: "$0.08 / sesión extra" },
      { plan: "Enterprise", cap: "Ilimitado (fair use)",     rate: "Sin overage · incluido" },
    ],

    vsKicker: "COMPARATIVA · CATEGORÍA",
    vsTitle: "Contra los que te van a comparar.",
    vsSub: "Comparación construida a partir de la documentación pública de cada proveedor, consultada el 2026-04-20. \"No advertido\" significa que no aparece en su sitio ni en sus materiales públicos al momento de la revisión — no implica imposibilidad técnica. Si algo no es correcto, escríbenos a hello@bio-ignicion.app con pantallazo y enlace; corregimos en 48 h.",
    vsCols: ["", "BIO-IGNICIÓN", "Modern Health", "Calm for Business", "Unmind"],
    vsNoticeMark: "No advertido",
    vsRows: [
      { k: "Precio público (USD/asiento/mes, tier medio)", vals: [{ t: "$39", kind: "us" }, "$30–60", "$3.50–8", "£8–15"] },
      { k: "HRV · medición activa nativa", vals: [{ t: "✓", kind: "check" }, "No advertido", "No advertido", "No advertido"] },
      { k: "Audio + haptics + binaural + voz", vals: [{ t: "✓", kind: "check" }, "Audio narrado", "Audio narrado", "Audio narrado"] },
      { k: "NOM-035 STPS · reporte automatizado", vals: [{ t: "✓", kind: "check" }, "No advertido", "No advertido", "No advertido"] },
      { k: "SOC 2 Type II", vals: [{ t: "✓", kind: "check" }, { t: "✓", kind: "check" }, { t: "✓", kind: "check" }, { t: "✓", kind: "check" }] },
      { k: "HIPAA · BAA disponible", vals: [{ t: "Enterprise", kind: "check" }, { t: "✓", kind: "check" }, { t: "parcial", kind: "partial" }, "No advertido"] },
      { k: "Audit log hash-chain público", vals: [{ t: "✓", kind: "check" }, "No advertido", "No advertido", "No advertido"] },
      { k: "Hardware NFC/QR (Tap-to-Ignite)", vals: [{ t: "incluido en Growth", kind: "check" }, "No advertido", "No advertido", "No advertido"] },
      { k: "Residencia de datos LATAM (MX)", vals: [{ t: "✓", kind: "check" }, "No advertida", "No advertida", "No advertida"] },
      { k: "CFDI 4.0 (facturación MX)", vals: [{ t: "✓", kind: "check" }, "No advertido", "No advertido", "No advertido"] },
    ],

    guaranteeKicker: "GARANTÍAS · SIN LETRA CHICA",
    guaranteeTitle: "Tres promesas que firmamos en el contrato.",
    guaranteeItems: [
      { title: "30 días reembolso",      body: "Cancela dentro de 30 días desde la primera factura y reembolsamos el 100 %. Sin preguntas, sin fricción legal." },
      { title: "Cero setup oculto",      body: "Implementación guiada incluida en Starter y Growth. Enterprise añade success manager y kickoff SOC 2." },
      { title: "Precio congelado 12 m",  body: "La tarifa por asiento no sube durante el ciclo anual contratado. Si subimos precios, tú entras a los nuevos al renovar — o no." },
    ],

    dataKicker: "DATOS · PROCUREMENT",
    dataTitle: "Lo que tu equipo de seguridad y legal va a preguntar.",
    dataSub: "Respuestas cortas, enlaces verificables y documentos listos para anexar a la requisición.",
    dataItems: [
      { title: "Sin entrenamiento con tus datos", body: "No entrenamos modelos de IA con datos de clientes — el DPA estándar lo formaliza por escrito. Si tu política interna requiere lenguaje específico, lo firmamos en el MSA.", tag: "AI · OPT-OUT POR DEFAULT" },
      { title: "Export y borrado bajo control", body: "Export JSON + CSV desde el panel en cualquier momento. Borrado a los 30 días tras cancelación — inmediato si tu DPA lo requiere.", tag: "GDPR · ART. 17 + 20" },
      { title: "Subprocesadores públicos", body: "Lista pública de subprocesadores con región, propósito y fecha de cambio. Notificación 30 días antes de cualquier cambio.", tag: "/trust/subprocessors", href: "/trust/subprocessors" },
      { title: "DPA + BAA prefirmado", body: "DPA GDPR estándar descargable sin llamar a ventas. BAA HIPAA disponible en Enterprise con redlines negociables.", tag: "/trust/dpa", href: "/trust/dpa" },
    ],
    slaTitle: "Créditos por SLA",
    slaSub: "Si no cumplimos, acreditamos. Automático — no tienes que reclamar.",
    slaRows: [
      { uptime: "< 99.9 %", credit: "10 % del ciclo" },
      { uptime: "< 99.5 %", credit: "25 % del ciclo" },
      { uptime: "< 99.0 %", credit: "50 % del ciclo" },
      { uptime: "< 95.0 %", credit: "100 % + salida sin penalización" },
    ],
    procurementCta: "Ver centro de confianza completo",
    procurementHref: "/trust",

    onePagerTitle: "Descargar one-pager para procurement",
    onePagerBody: "Hoja imprimible con precios, add-ons, seguridad y cláusulas — lista para anexar a la requisición.",
    onePagerCta: "Imprimir / guardar PDF",

    faqTitle: "Preguntas frecuentes",
    faqs: [
      { q: "¿Por qué más caro que Calm o Headspace?", a: "Porque no es contenido. Medimos HRV de forma activa, intervenimos con haptics/binaural/voz, y emitimos reporte NOM-035 con export firmado. Lo más cercano en precio es Modern Health ($30–60) — y no trae Tap-to-Ignite físico ni BAA en el tier medio." },
      { q: "¿Qué pasa si exceden los asientos del plan?", a: "Te avisamos al 80 % y al 100 %. No bloqueamos acceso — facturamos el overage prorrateado al ciclo. Si el crecimiento es estructural, el upgrade aplica de inmediato con prorrateo." },
      { q: "¿Cómo funciona el descuento por volumen?", a: "Automático al checkout: 50+ asientos −10 %, 100+ −15 %, 250+ −20 %. Acumulable con facturación anual (−20 %). Enterprise tiene condiciones individuales en el MSA." },
      { q: "¿Puedo cambiar de plan sin costo?", a: "Sí. Los upgrades aplican de inmediato con prorrateo automático; los downgrades toman efecto al próximo ciclo, sin penalizaciones." },
      { q: "¿Qué pasa con mis datos si cancelo?", a: "Exportas en JSON + CSV desde el panel antes de terminar el ciclo. Eliminamos los datos a los 30 días — o al momento si tu DPA lo especifica." },
      { q: "¿Facturan en MXN / USD / EUR?", a: "Sí, a elección en checkout. Stripe soporta MXN, USD, EUR y CAD. Emitimos CFDI 4.0 para clientes mexicanos; solo necesitamos tu RFC y uso de CFDI." },
      { q: "¿Es HIPAA / GDPR compliant?", a: "Growth y Enterprise cumplen GDPR con residencia de datos en UE opcional. HIPAA requiere BAA firmado — disponible únicamente en Enterprise." },
      { q: "¿Cómo se cuenta un \"usuario activo\"?", a: "Un usuario que completó al menos una sesión en los últimos 30 días. Los invitados que nunca entraron no se cobran." },
      { q: "¿Aceptan transferencia o NET 30?", a: "Enterprise: sí, con factura mensual y términos NET 30. Starter y Growth se pagan con tarjeta vía Stripe." },
      { q: "¿El hardware Tap-to-Ignite viene incluido?", a: "Growth incluye 3 estaciones. Adicionales $299 one-time. Enterprise arma paquete sin límite en el MSA. Cumplen FCC/CE, sin vendor lock-in — hablan HTTP firmado." },
    ],
    effectiveLabel: "Precios vigentes a",
    effectiveDate: "2026-04-20",
    navItems: [
      { id: "plans",      label: "Planes" },
      { id: "addons",     label: "Add-ons" },
      { id: "category",   label: "Categoría" },
      { id: "roi-calc",   label: "ROI" },
      { id: "vs",         label: "Competencia" },
      { id: "compare",    label: "Comparativa" },
      { id: "guarantees", label: "Garantías" },
      { id: "data",       label: "Datos" },
      { id: "faq",        label: "FAQ" },
    ],
    finalCtaKicker: "SIGUIENTE PASO",
    finalCtaTitle: "Cuando tu equipo esté listo para encender.",
    finalCtaSub: "Tres caminos. El mismo punto de partida — con y sin vendedor en la llamada.",
    finalCtaDemo: "Ver demo con el equipo",
    finalCtaTrial: "Empezar Starter",
    finalCtaTrialSub: "14 d · sin tarjeta",
    legalDisclaimer: "Avisos: Las estimaciones de ROI, ahorro y break-even son cálculos basados en literatura pública y no constituyen garantía ni promesa contractual; el resultado real depende de implementación, industria y contexto. Las comparaciones con otros proveedores se construyeron a partir de su documentación pública al 2026-04-20 y reflejan únicamente lo que cada proveedor anuncia en su sitio; \"No advertido\" no implica imposibilidad técnica. Marcas y nombres de terceros se usan bajo fair use comparativo y pertenecen a sus respectivos titulares. Las certificaciones SOC 2, HIPAA, GDPR, NOM-035 y equivalentes aplican en los tiers donde se indican expresamente. Para términos vinculantes, consulta el MSA, DPA y ToS en /trust.",
  },
  en: {
    kicker: "PRICING · NEURAL B2B",
    title: "Ignite the team. Pay only for who shows up.",
    editorial: "What you see is what you pay — no rep, no «special» discount PDF.",
    sub: "Per active user. 20% off on annual billing. No setup, no hidden minimums — and volume discounts in the open, not negotiated under the table.",
    cadenceLabel: "Billing",
    cadenceMonthly: "Monthly",
    cadenceAnnual: "Annual · −20%",
    currencyLabel: "Currency",
    plansLabel: "Plans",
    unitMonthly: "/user · mo",
    unitAnnualBilled: "/user · mo · annual",
    unitCustom: "annual contract",
    annualTotalSuffix: "/ seat / year · billed upfront",
    customHint: "From 100 seats or $30K ARR · negotiable MSA",
    featured: "Most chosen",
    savingsHint: "{a} × 12 instead of {m} × 12 · save 20 % · {code}",
    crossSellHint: "or {a} billed annually · −20 % · {code}",
    seatsLabel: "Seats",
    trialLabel: "Trial",
    volumeTitle: "Volume discount",
    volumeTiers: [
      { range: "50 + seats",  off: "−10 %" },
      { range: "100 + seats", off: "−15 %" },
      { range: "250 + seats", off: "−20 %" },
    ],
    volumeNote: "Stacks with annual billing. Applied automatically at checkout.",
    plans: {
      starter: {
        kicker: "PERSONAL · SMALL TEAM",
        tagline: "For teams that want to test the platform with zero commercial friction.",
        seats: "5 – 25",
        trial: "14 d no card",
        features: [
          "Unlimited neural protocols",
          "Audio + haptics + binaural + voice",
          "Personal dashboard + 30 d history",
          "Local-first PWA (offline)",
          "Email support · 48 h SLA",
          "AES-256 + TLS 1.3 encryption",
        ],
        cta: "Start trial",
      },
      growth: {
        kicker: "FEATURED · DISTRIBUTED TEAMS",
        tagline: "For companies measuring nervous-system impact in production.",
        seats: "10 – 250",
        trial: "30 d pilot",
        features: [
          "Everything in Starter",
          "Team panel with k-anonymity ≥5",
          "Automated NOM-035 report",
          "Tap-to-Ignite: 3 stations included",
          "Slack + Google Calendar + HMAC webhooks",
          "Public REST API with generous rate limit",
          "SSO Google + Microsoft",
          "Chat + email · 24 h SLA",
        ],
        cta: "Book a demo",
      },
      enterprise: {
        kicker: "REGULATED · IDENTITY FEDERATED",
        tagline: "For organizations with legal, security and formal compliance review.",
        seats: "100+ or $30K ARR",
        trial: "60 d with DPA",
        features: [
          "Everything in Growth",
          "SAML 2.0 + SCIM 2.0 + federated OIDC",
          "Negotiable DPA + signed BAA (HIPAA)",
          "Verifiable audit log (hash chain)",
          "Data residency (US · EU · LATAM)",
          "99.95 % uptime · 4 h critical support",
          "Dedicated Customer Success + guided onboarding",
          "SOC 2 Type II + annual pentest",
        ],
        cta: "Talk to sales",
      },
    },
    addOnsTitle: "Add-ons",
    addOnsSub: "Optional pieces that layer on top of any plan.",
    addOns: [
      { name: "Extra Tap-to-Ignite station",  price: "$299",   unit: "one-time / station", body: "NFC + QR + optional HRV reader. For lobbies, offices and meeting rooms." },
      { name: "Professional onboarding",      price: "$2,500", unit: "one-time",           body: "Dedicated kickoff, adoption tracking and launch playbook.", plans: "Growth · Enterprise" },
      { name: "Single-tenant instance",       price: "$1,500", unit: "/ month",            body: "Dedicated database and workers. Separate infra audit trail.", plans: "Enterprise" },
      { name: "1:1 session with neural coach", price: "$149",  unit: "/ session / user",   body: "Individual metric review and personalized protocol adjustment." },
    ],
    categoryTitle: "Where we sit on the map",
    categorySub: "We're not what you already tried. These are the neighbors — and the honest distance from each.",
    categoryCards: [
      { kind: "other", label: "MASS MEDITATION",       title: "Calm Business · Headspace",  delta: "Content library. Meditated minutes as the KPI." },
      { kind: "other", label: "WELLNESS CONTENT",      title: "Unmind · Thrive Global",     delta: "Courses + checklists. Usage analytics, not physiology." },
      { kind: "us",    label: "NEURAL ADAPTATION",     title: "BIO-IGNICIÓN",               delta: "Measurable HRV + sensory intervention + NOM-035 + SOC 2 + physical Tap-to-Ignite." },
      { kind: "other", label: "CLINICAL MENTAL HEALTH", title: "Modern Health · Spring",    delta: "Therapy included. $30–60/user. Used when symptoms already appear." },
      { kind: "other", label: "1:1 COACHING",          title: "BetterUp · Lyra",            delta: "Human sessions. $150–300/user. High impact, high cost." },
    ],
    roiTitle: "The real cost of not igniting",
    roiAnchor: (
      <>
        A single burnout case in LATAM/US costs between <em>$15,000 and $45,000</em> per person across turnover, replacement and lost productivity (Gallup 2023, Aflac WorkForces 2022, Deloitte MH 2022). A Growth license billed annually is <em>$374 / user / year</em>.
        Break-even crosses with <em>1 standard case prevented per 40 users</em> — or 1 senior case per 120.
      </>
    ),
    roiCite: "Sources: Gallup State of the Global Workplace 2023 · Aflac WorkForces 2022 · Deloitte Mental Health in the Workplace 2022 · context: APA Work in America 2023, WHO Mental Health Report 2022",
    roiCta: "See ROI calculator",
    roiBreakdownLabel: "Breakdown: how that $15,000 – $45,000 is composed",
    roiBreakdownHint: "5 components. Ranges from public literature. DOI/links at /evidencia.",
    roiBreakdownCols: ["Component", "Range (USD)", "Source"],
    roiBreakdownRows: [
      { k: "Voluntary turnover (severance + exit admin)",               v: "$5,000 – 15,000", s: "SHRM · Cost of Voluntary Turnover 2022" },
      { k: "Recruitment + agency / headhunter fee",                     v: "$3,000 – 7,000",  s: "SHRM Talent Acquisition Benchmark 2022" },
      { k: "Onboarding + replacement ramp-up (3–6 months)",             v: "$4,000 – 10,000", s: "Gallup State of the Global Workplace 2023" },
      { k: "Pre-exit productivity loss from the employee",              v: "$2,000 – 8,000",  s: "Deloitte Mental Health in the Workplace 2022" },
      { k: "Team-wide presenteeism + errors + absenteeism contagion",   v: "$1,000 – 5,000",  s: "APA Work in America 2023" },
    ],
    roiBreakdownTotal: "Total",
    roiBreakdownTotalValue: "$15,000 – 45,000",
    roiBreakdownNote: "Minimums sum to $15K, maximums sum to $45K — matches the range cited above. A senior role or high-cost-of-labor LATAM market lands at the top; a standard IC at the floor.",
    compareTitle: "Full comparison",
    compareCols: ["Starter", "Growth", "Enterprise"],
    compareGroups: [
      {
        title: "Platform",
        rows: [
          ["Unlimited neural protocols", true, true, true],
          ["Audio + haptics + binaural + voice", true, true, true],
          ["Offline PWA (local-first)", true, true, true],
          ["Personal history", "30 days", "12 months", "Unlimited"],
          ["Seats included", "5–25", "10–250", "100+ or $30K ARR"],
        ],
      },
      {
        title: "Teams & analytics",
        rows: [
          ["Team panel (k-anonymity ≥5)", false, true, true],
          ["Tap-to-Ignite (NFC/QR)", false, "3 included", "Unlimited"],
          ["Automated NOM-035 report", false, true, true],
          ["Export", "Personal", "Team", "Org + BYOK"],
        ],
      },
      {
        title: "API & integrations",
        rows: [
          ["Public REST API", false, true, true],
          ["HMAC-signed webhooks", false, true, true],
          ["Slack + Google Calendar", false, true, true],
          ["SSO Google + Microsoft", false, true, true],
          ["SAML 2.0 / OIDC federation", false, false, true],
          ["SCIM 2.0", false, false, true],
        ],
      },
      {
        title: "Security & compliance",
        rows: [
          ["AES-256 at rest + TLS 1.3", true, true, true],
          ["Audit log (hash chain)", false, "Standard", "Verifiable + signed export"],
          ["DPA", false, "Standard", "Negotiable + MSA"],
          ["BAA (HIPAA)", false, false, true],
          ["Residency (US · EU · LATAM)", false, false, true],
          ["SOC 2 Type II + annual pentest", false, false, true],
        ],
      },
      {
        title: "Support & SLA",
        rows: [
          ["Email response", "48 h", "24 h", "4 h critical"],
          ["Live chat", false, true, true],
          ["Dedicated Customer Success", false, false, true],
          ["Onboarding", "Self-serve", "Guided + playbook", "Dedicated"],
          ["Uptime SLA", "99.9 %", "99.9 %", "99.95 %"],
        ],
      },
    ],
    trustTitle: "Compliance & trust",
    trustSub: "The controls that ship by default — and the ones your plan unlocks.",
    trustBadges: [
      { label: "SOC 2 Type II", hint: "Under audit · Enterprise", tone: "pending" },
      { label: "GDPR",          hint: "Optional EU residency" },
      { label: "HIPAA",         hint: "BAA available · Enterprise" },
      { label: "NOM-035 STPS",  hint: "Automated report · Growth+" },
      { label: "CFDI 4.0",      hint: "MX invoicing · all tiers" },
      { label: "Audit log",     hint: "Verifiable hash chain" },
    ],
    proofTitle: "Why you can trust this without a wall of logos",
    proofSub: "We're pre-launch — we won't fake testimonials. The signals that matter here are auditable, not decorative.",
    proofStat1Label: "protocols with documented mechanism",
    proofStat2Label: "studies cited with verifiable DOIs",
    proofStat3Value: "0",
    proofStat3Label: "proprietary scores without public reference",
    proofStat1Sub: (n) => `See all ${n} at /evidencia`,
    proofStat2Sub: "Cohen 1988 · Task Force 1996 · Shaffer 2017…",
    proofStat3Sub: "If it shows up in the report, its source is public",
    partnerTitle: PARTNER_COPY.en.title,
    partnerBody: PARTNER_COPY.en.body,
    partnerCta: PARTNER_COPY.en.cta,
    founderTitle: "The founders answer directly",
    founderBody: (
      <>
        If something doesn't add up — technical, commercial or privacy — write to{" "}
        <a href="mailto:hello@bio-ignicion.app">hello@bio-ignicion.app</a>. The people who built this answer, not a shared inbox.
      </>
    ),

    roiCalcKicker: "CALCULATOR · ROI",
    roiCalcTitle: "Run the numbers for your team.",
    roiCalcSub: "Three explicit components per person · year: productivity recovered $240 (0.67 h/mo × $30 loaded), absenteeism avoided $240 (1 day/yr × $240), turnover avoided $60 (0.4 % × $15K). Total $540. Deloitte MH 2022 reports 4.2:1; we model 1.6:1.",
    roiCalcCopy: {
      defaultSeats: 60, ourPerSeat: 39, altPerSeat: 50, liftPerSeatYr: 540,
      min: 5, max: 500, step: 5,
      seatsLabel: "Team size",
      seatsUnit: "active seats",
      volumeApplied: "Volume applied",
      rowOur: "BIO-IGNICIÓN · year (annual)",
      rowAlt: "Modern Health-tier alternative",
      rowLift: "Productivity + absenteeism + turnover",
      rowNet: "Net savings · year",
      roiMultipleSub: "Annual ROI · lift ÷ cost",
      disclosure: "Deloitte \"Mental Health in the Workplace\" 2022 reports $4.20 returned per $1 invested; our model assumes $1.60 — half the published average, to stay defensible in committee. Book a walkthrough with your own turnover and industry data for a tailored number.",
    },

    overageKicker: "USAGE · OVER CAP",
    overageTitle: "If someone exceeds the cap, you know before your CFO does.",
    overageSub: "We alert at 80 % and 100 %. We never block access mid-session. Overage is prorated to the cycle and upgrades apply immediately with proration. A \"session\" is a neural protocol executed end to end — opening the app without completing a protocol does not count.",
    overageCols: ["Plan", "Included cap", "Overage"],
    overageRows: [
      { plan: "Starter",    cap: "600 sessions / mo",        rate: "$0.12 / extra session" },
      { plan: "Growth",     cap: "6,000 sessions / mo",      rate: "$0.08 / extra session" },
      { plan: "Enterprise", cap: "Unlimited (fair use)",     rate: "No overage · included" },
    ],

    vsKicker: "COMPARISON · CATEGORY",
    vsTitle: "Against the ones you'll be compared to.",
    vsSub: "Comparison built from each vendor's public documentation, reviewed 2026-04-20. \"Not advertised\" means the capability does not appear on their site or public materials at the time of review — it does not imply technical impossibility. If something is wrong, email hello@bio-ignicion.app with a screenshot and link; we correct within 48 h.",
    vsCols: ["", "BIO-IGNICIÓN", "Modern Health", "Calm for Business", "Unmind"],
    vsNoticeMark: "Not advertised",
    vsRows: [
      { k: "Public price (USD/seat/mo, mid tier)",         vals: [{ t: "$39", kind: "us" }, "$30–60", "$3.50–8", "£8–15"] },
      { k: "Native HRV · active measurement",              vals: [{ t: "✓", kind: "check" }, "Not advertised", "Not advertised", "Not advertised"] },
      { k: "Audio + haptics + binaural + voice",           vals: [{ t: "✓", kind: "check" }, "Narrated audio", "Narrated audio", "Narrated audio"] },
      { k: "NOM-035 STPS · automated report",              vals: [{ t: "✓", kind: "check" }, "Not advertised", "Not advertised", "Not advertised"] },
      { k: "SOC 2 Type II",                                vals: [{ t: "✓", kind: "check" }, { t: "✓", kind: "check" }, { t: "✓", kind: "check" }, { t: "✓", kind: "check" }] },
      { k: "HIPAA · BAA available",                        vals: [{ t: "Enterprise", kind: "check" }, { t: "✓", kind: "check" }, { t: "partial", kind: "partial" }, "Not advertised"] },
      { k: "Public hash-chain audit log",                  vals: [{ t: "✓", kind: "check" }, "Not advertised", "Not advertised", "Not advertised"] },
      { k: "NFC/QR hardware (Tap-to-Ignite)",              vals: [{ t: "included in Growth", kind: "check" }, "Not advertised", "Not advertised", "Not advertised"] },
      { k: "LATAM data residency (MX)",                    vals: [{ t: "✓", kind: "check" }, "Not advertised", "Not advertised", "Not advertised"] },
      { k: "CFDI 4.0 (MX invoicing)",                      vals: [{ t: "✓", kind: "check" }, "Not advertised", "Not advertised", "Not advertised"] },
    ],

    guaranteeKicker: "GUARANTEES · NO FINE PRINT",
    guaranteeTitle: "Three promises we put in writing.",
    guaranteeItems: [
      { title: "30-day refund",          body: "Cancel within 30 days of your first invoice and we refund 100 %. No questions, no legal friction." },
      { title: "Zero hidden setup",      body: "Guided implementation included on Starter and Growth. Enterprise adds success manager and SOC 2 kickoff." },
      { title: "12-month price lock",    body: "Your per-seat rate stays flat for the annual cycle. If we raise prices, you renew into them — or don't." },
    ],

    dataKicker: "DATA · PROCUREMENT",
    dataTitle: "What your security and legal teams will ask.",
    dataSub: "Short answers, verifiable links and documents ready to attach to your requisition.",
    dataItems: [
      { title: "No training on your data", body: "We do not train AI models on customer data — the standard DPA formalizes this in writing. If your internal policy requires specific language, we sign it into the MSA.", tag: "AI · OPT-OUT BY DEFAULT" },
      { title: "Export and deletion you control", body: "Export JSON + CSV from the panel anytime. Deletion within 30 days of cancellation — immediate if your DPA requires it.", tag: "GDPR · ART. 17 + 20" },
      { title: "Public subprocessor list", body: "Public subprocessor list with region, purpose and change date. 30-day notice on any change.", tag: "/trust/subprocessors", href: "/trust/subprocessors" },
      { title: "Pre-signed DPA + BAA", body: "Standard GDPR DPA downloadable without calling sales. HIPAA BAA available on Enterprise with negotiable redlines.", tag: "/trust/dpa", href: "/trust/dpa" },
    ],
    slaTitle: "SLA credits",
    slaSub: "If we miss, we credit. Automatic — no claim required.",
    slaRows: [
      { uptime: "< 99.9 %", credit: "10 % of cycle" },
      { uptime: "< 99.5 %", credit: "25 % of cycle" },
      { uptime: "< 99.0 %", credit: "50 % of cycle" },
      { uptime: "< 95.0 %", credit: "100 % + exit without penalty" },
    ],
    procurementCta: "See the full trust center",
    procurementHref: "/trust",

    onePagerTitle: "Download a one-pager for procurement",
    onePagerBody: "Printable sheet with prices, add-ons, security and clauses — ready to attach to your requisition.",
    onePagerCta: "Print / save as PDF",

    faqTitle: "Frequently asked questions",
    faqs: [
      { q: "Why more expensive than Calm or Headspace?", a: "Because it's not content. We measure HRV actively, intervene with haptics/binaural/voice, and emit a NOM-035 report with signed export. The closest peer on price is Modern Health ($30–60) — and that doesn't include physical Tap-to-Ignite or mid-tier BAA." },
      { q: "What if we exceed plan seats?", a: "We alert you at 80% and 100%. We don't block access — we bill overage prorated to the cycle. If growth is structural, upgrades apply immediately with proration." },
      { q: "How does the volume discount work?", a: "Automatic at checkout: 50+ seats −10%, 100+ −15%, 250+ −20%. Stacks with annual billing (−20%). Enterprise has per-MSA conditions." },
      { q: "Can I change plans at no cost?", a: "Yes. Upgrades apply immediately with automatic proration; downgrades take effect next cycle — no penalties." },
      { q: "What happens to my data if I cancel?", a: "You export JSON + CSV from the panel before your cycle ends. We delete data within 30 days — or immediately if your DPA specifies so." },
      { q: "Do you bill in MXN / USD / EUR?", a: "Yes, your choice at checkout. Stripe supports MXN, USD, EUR and CAD. We issue CFDI 4.0 for Mexican customers — we just need your RFC and CFDI use code." },
      { q: "Is it HIPAA / GDPR compliant?", a: "Growth and Enterprise are GDPR-compliant with optional EU data residency. HIPAA requires a signed BAA — available only on Enterprise." },
      { q: "How is an \"active user\" counted?", a: "A user who completed at least one session in the last 30 days. Invited users who never logged in are not billed." },
      { q: "Do you accept wire transfer or NET 30?", a: "Enterprise: yes, with monthly invoicing and NET 30 terms. Starter and Growth are paid by card via Stripe." },
      { q: "Is the Tap-to-Ignite hardware included?", a: "Growth includes 3 stations. Extras $299 one-time. Enterprise negotiates unlimited in the MSA. FCC/CE certified, no vendor lock-in — they speak signed HTTP." },
    ],
    effectiveLabel: "Pricing effective",
    effectiveDate: "2026-04-20",
    navItems: [
      { id: "plans",      label: "Plans" },
      { id: "addons",     label: "Add-ons" },
      { id: "category",   label: "Category" },
      { id: "roi-calc",   label: "ROI" },
      { id: "vs",         label: "Competitors" },
      { id: "compare",    label: "Compare" },
      { id: "guarantees", label: "Guarantees" },
      { id: "data",       label: "Data" },
      { id: "faq",        label: "FAQ" },
    ],
    finalCtaKicker: "NEXT STEP",
    finalCtaTitle: "When your team is ready to ignite.",
    finalCtaSub: "Three paths. Same starting point — with or without a salesperson on the call.",
    finalCtaDemo: "See the demo with our team",
    finalCtaTrial: "Start Starter",
    finalCtaTrialSub: "14 d · no card",
    legalDisclaimer: "Disclaimers: ROI, savings and break-even estimates are calculations based on public literature and do not constitute guarantees or contractual promises; actual results depend on implementation, industry and context. Competitor comparisons are built from each vendor's public documentation as of 2026-04-20 and reflect only what each vendor advertises on its site; \"Not advertised\" does not imply technical impossibility. Third-party marks and names are used under comparative fair use and belong to their respective owners. SOC 2, HIPAA, GDPR, NOM-035 and equivalent certifications apply in the tiers where explicitly indicated. For binding terms, see the MSA, DPA and ToS at /trust.",
  },
};

export default async function PricingPage() {
  const locale = await getServerLocale();
  const L = locale === "en" ? "en" : "es";
  const c = COPY[L];
  const nonce = (await headers()).get("x-nonce") || undefined;

  const evidenceEntries = Object.values(EVIDENCE);
  const protocolCount = evidenceEntries.length;
  const studyCount = evidenceEntries.reduce((n, e) => n + (e.studies?.length || 0), 0);

  const plans = [
    {
      id: "starter",
      name: "Starter",
      kicker: c.plans.starter.kicker,
      priceMonthly: 15,
      tagline: c.plans.starter.tagline,
      seats: c.plans.starter.seats,
      trial: c.plans.starter.trial,
      features: c.plans.starter.features,
      cta: { href: "/signup?plan=starter", label: c.plans.starter.cta },
      featured: false,
    },
    {
      id: "growth",
      name: "Growth",
      kicker: c.plans.growth.kicker,
      priceMonthly: 39,
      tagline: c.plans.growth.tagline,
      seats: c.plans.growth.seats,
      trial: c.plans.growth.trial,
      features: c.plans.growth.features,
      cta: { href: "/demo", label: c.plans.growth.cta },
      featured: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      kicker: c.plans.enterprise.kicker,
      priceMonthly: null,
      customLabel: "Custom",
      tagline: c.plans.enterprise.tagline,
      seats: c.plans.enterprise.seats,
      trial: c.plans.enterprise.trial,
      features: c.plans.enterprise.features,
      cta: { href: "/demo?tier=enterprise", label: c.plans.enterprise.cta },
      featured: false,
    },
  ];

  const cardsCopy = {
    featured: c.featured,
    cadenceLabel: c.cadenceLabel,
    cadenceMonthly: c.cadenceMonthly,
    cadenceAnnual: c.cadenceAnnual,
    currencyLabel: c.currencyLabel,
    plansLabel: c.plansLabel,
    unitMonthly: c.unitMonthly,
    unitAnnualBilled: c.unitAnnualBilled,
    unitCustom: c.unitCustom,
    annualTotalSuffix: c.annualTotalSuffix,
    customHint: c.customHint,
    savingsHint: c.savingsHint,
    crossSellHint: c.crossSellHint,
    seatsLabel: c.seatsLabel,
    trialLabel: c.trialLabel,
  };

  return (
    <PublicShell activePath="/pricing">
      <Container size="xl" className="bi-prose bi-pricing-root">
        <div style={{ position: "relative", paddingBlockStart: space[8], paddingBlockEnd: space[6] }}>
          <div aria-hidden style={{
            position: "absolute", inset: 0, opacity: 0.16, pointerEvents: "none", zIndex: 0,
          }}>
            <BioglyphLattice variant="ambient" />
          </div>
          <IgnitionReveal sparkOrigin="50% 45%">
            <header style={{ textAlign: "center", marginBottom: space[8], position: "relative", zIndex: 1 }}>
              <div style={{
                fontFamily: cssVar.fontMono,
                fontSize: font.size.xs,
                color: bioSignal.phosphorCyan,
                textTransform: "uppercase",
                letterSpacing: "0.28em",
                fontWeight: font.weight.bold,
                marginBlockEnd: space[4],
              }}>
                {c.kicker}
              </div>
              <h1 style={{
                margin: `${space[2]}px 0`,
                fontSize: "clamp(40px, 6vw, 72px)",
                lineHeight: 1.03,
                letterSpacing: "-0.035em",
                fontWeight: font.weight.black,
              }}>
                {c.title}
              </h1>
              <p style={{
                fontFamily: "var(--font-editorial), 'Instrument Serif', Georgia, serif",
                fontStyle: "italic",
                fontSize: "clamp(18px, 2.2vw, 24px)",
                lineHeight: 1.35,
                color: cssVar.textMuted,
                maxWidth: 720,
                marginInline: "auto",
                margin: `${space[3]}px auto ${space[4]}px`,
              }}>
                {c.editorial}
              </p>
              <p style={{
                maxWidth: 680,
                marginInline: "auto",
                fontSize: font.size.lg,
                color: cssVar.textDim,
                lineHeight: 1.55,
              }}>
                {c.sub}
              </p>
              <div className="bi-price-stamp" aria-label={c.effectiveLabel}>
                <span className="bi-price-stamp-dot" aria-hidden />
                {c.effectiveLabel} <strong>{c.effectiveDate}</strong>
              </div>
            </header>
          </IgnitionReveal>
        </div>

        <PricingSectionNav items={c.navItems} />

        <div id="plans" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: space[5] }}>
          <SpotlightGrid style={{ inlineSize: "100%" }}>
            <PricingCards plans={plans} copy={cardsCopy} />
          </SpotlightGrid>

          <div className="bi-volume-bar" role="note" aria-label={c.volumeTitle}>
            <strong>{c.volumeTitle}</strong>
            {c.volumeTiers.map((t) => (
              <span key={t.range}>{t.range} · <strong style={{ color: bioSignal.phosphorCyan }}>{t.off}</strong></span>
            ))}
            <span style={{ opacity: 0.7 }}>· {c.volumeNote}</span>
          </div>
        </div>

        <PulseDivider />

        <section aria-labelledby="addons" style={{ marginTop: space[8] }}>
         <IgnitionReveal sparkOrigin="50% 40%">
          <header style={{ textAlign: "center", marginBottom: space[6] }}>
            <h2 id="addons" style={sectionHeading}>{c.addOnsTitle}</h2>
            <p style={{ color: cssVar.textDim, marginTop: space[2] }}>{c.addOnsSub}</p>
          </header>
          <SpotlightGrid className="bi-addon-row">
            {c.addOns.map((a) => (
              <article key={a.name} className="bi-addon-card bi-spot">
                <strong>{a.name}</strong>
                <div className="bi-addon-price">
                  {a.price}
                  <span style={{
                    marginInlineStart: 6,
                    fontSize: 12,
                    fontFamily: cssVar.fontMono,
                    fontWeight: font.weight.normal,
                    color: cssVar.textMuted,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}>
                    {a.unit}
                  </span>
                </div>
                <p>{a.body}</p>
                {a.plans && (
                  <span style={{
                    marginTop: 4,
                    fontFamily: cssVar.fontMono,
                    fontSize: 10,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: bioSignal.phosphorCyan,
                    fontWeight: font.weight.bold,
                  }}>
                    Solo · {a.plans}
                  </span>
                )}
              </article>
            ))}
          </SpotlightGrid>
         </IgnitionReveal>
        </section>

        <PulseDivider intensity="dim" />

        <section aria-labelledby="category" style={{ marginTop: space[8] }}>
         <IgnitionReveal sparkOrigin="50% 40%">
          <header style={{ textAlign: "center", marginBottom: space[6] }}>
            <h2 id="category" style={sectionHeading}>{c.categoryTitle}</h2>
            <p style={{ color: cssVar.textDim, marginTop: space[2], maxWidth: 640, marginInline: "auto", lineHeight: 1.5 }}>
              {c.categorySub}
            </p>
          </header>
          <SpotlightGrid className="bi-category-row">
            {c.categoryCards.map((cc) => (
              <div key={cc.title} className="bi-category-card bi-spot" data-kind={cc.kind}>
                <span className="cat-label">{cc.label}</span>
                <span className="cat-title">{cc.title}</span>
                <span className="cat-delta">{cc.delta}</span>
              </div>
            ))}
          </SpotlightGrid>
         </IgnitionReveal>
        </section>

        <PulseDivider />

        <section aria-labelledby="roi" style={{ marginTop: space[8] }}>
         <IgnitionReveal sparkOrigin="50% 40%">
          <div className="bi-roi-card">
            <div style={kickerStyle}>{c.roiTitle}</div>
            <h2 id="roi" className="bi-roi-anchor">{c.roiAnchor}</h2>
            <div className="bi-roi-cite">{c.roiCite}</div>

            <details className="bi-roi-breakdown">
              <summary>
                <span className="bi-roi-breakdown-label">{c.roiBreakdownLabel}</span>
                <span className="bi-roi-breakdown-hint">{c.roiBreakdownHint}</span>
                <span className="bi-roi-breakdown-chev" aria-hidden>＋</span>
              </summary>
              <div className="bi-roi-breakdown-body">
                <table className="bi-roi-breakdown-table">
                  <thead>
                    <tr>{c.roiBreakdownCols.map((h) => <th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {c.roiBreakdownRows.map((row) => (
                      <tr key={row.k}>
                        <td>{row.k}</td>
                        <td className="v">{row.v}</td>
                        <td className="s">{row.s}</td>
                      </tr>
                    ))}
                    <tr className="total">
                      <td>{c.roiBreakdownTotal}</td>
                      <td className="v">{c.roiBreakdownTotalValue}</td>
                      <td />
                    </tr>
                  </tbody>
                </table>
                <p className="bi-roi-breakdown-note">{c.roiBreakdownNote}</p>
              </div>
            </details>
          </div>
         </IgnitionReveal>
        </section>

        <section aria-labelledby="roi-calc" style={{ marginTop: space[8] }}>
         <IgnitionReveal sparkOrigin="50% 30%">
          <header style={{ textAlign: "center", marginBottom: space[6] }}>
            <div style={kickerStyle}>{c.roiCalcKicker}</div>
            <h2 id="roi-calc" style={sectionHeading}>{c.roiCalcTitle}</h2>
            <p style={{ color: cssVar.textDim, marginTop: space[2], maxWidth: 640, marginInline: "auto", lineHeight: 1.5 }}>
              {c.roiCalcSub}
            </p>
          </header>
          <PricingROICalc copy={c.roiCalcCopy} />
         </IgnitionReveal>
        </section>

        <PulseDivider intensity="dim" />

        <section aria-labelledby="overage" style={{ marginTop: space[8] }}>
         <IgnitionReveal sparkOrigin="50% 40%">
          <header style={{ textAlign: "center", marginBottom: space[5] }}>
            <div style={kickerStyleMuted}>{c.overageKicker}</div>
            <h2 id="overage" style={{ ...sectionHeading, fontSize: "clamp(26px, 3.4vw, 38px)", letterSpacing: "-0.02em" }}>{c.overageTitle}</h2>
            <p style={{ color: cssVar.textDim, marginTop: space[2], maxWidth: 640, marginInline: "auto", lineHeight: 1.5 }}>
              {c.overageSub}
            </p>
          </header>
          <table className="bi-overage-table" aria-label={c.overageTitle}>
            <thead>
              <tr>{c.overageCols.map((h) => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {c.overageRows.map((r) => (
                <tr key={r.plan}>
                  <td className="plan">{r.plan}</td>
                  <td>{r.cap}</td>
                  <td className="rate">{r.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
         </IgnitionReveal>
        </section>

        <PulseDivider intensity="dim" />

        <section aria-labelledby="vs" style={{ marginTop: space[8] }}>
         <IgnitionReveal sparkOrigin="50% 40%">
          <header style={{ textAlign: "center", marginBottom: space[6] }}>
            <div style={kickerStyleMuted}>{c.vsKicker}</div>
            <h2 id="vs" style={sectionHeading}>{c.vsTitle}</h2>
            <p style={{ color: cssVar.textDim, marginTop: space[2], maxWidth: 640, marginInline: "auto", lineHeight: 1.5 }}>
              {c.vsSub}
            </p>
          </header>
          <div style={{ overflowX: "auto" }}>
            <table className="bi-compare-vs" aria-label={c.vsTitle}>
              <thead>
                <tr>
                  {c.vsCols.map((col, i) => (
                    <th key={col || i} className={i === 1 ? "us" : undefined}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c.vsRows.map((r) => (
                  <tr key={r.k}>
                    <th scope="row">{r.k}</th>
                    {r.vals.map((v, i) => {
                      const isObj = v && typeof v === "object";
                      const text = isObj ? v.t : v;
                      const kind = isObj ? v.kind : null;
                      const cls = i === 0 ? "us " : "";
                      const kindCls = kind === "check" ? "check" : kind === "partial" ? "partial" : (text === "—" ? "dash" : "");
                      return <td key={i} className={`${cls}${kindCls}`.trim() || undefined}>{text}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
         </IgnitionReveal>
        </section>

        <PulseDivider intensity="dim" />

        <section aria-labelledby="compare" style={{ marginTop: space[8] }}>
          <IgnitionReveal sparkOrigin="50% 50%">
            <h2 id="compare" style={{ ...sectionHeading, marginBottom: space[6], textAlign: "center" }}>{c.compareTitle}</h2>
            <CompareTable groups={c.compareGroups} cols={c.compareCols} />
          </IgnitionReveal>
        </section>

        <PulseDivider intensity="dim" />

        <section aria-labelledby="guarantees" style={{ marginTop: space[8] }}>
         <IgnitionReveal sparkOrigin="50% 40%">
          <header style={{ textAlign: "center", marginBottom: space[6] }}>
            <div style={kickerStyle}>{c.guaranteeKicker}</div>
            <h2 id="guarantees" style={sectionHeading}>{c.guaranteeTitle}</h2>
          </header>
          <SpotlightGrid style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: space[4],
            maxWidth: 980,
            marginInline: "auto",
          }}>
            {c.guaranteeItems.map((g) => (
              <article key={g.title} className="bi-spot" style={{
                padding: space[5],
                borderRadius: radius.md,
                border: `1px solid color-mix(in srgb, ${bioSignal.phosphorCyan} 25%, ${cssVar.border})`,
                background: cssVar.surface,
                display: "flex",
                flexDirection: "column",
                gap: space[2],
              }}>
                <span aria-hidden style={{
                  inlineSize: 36, blockSize: 36, borderRadius: "50%",
                  background: `color-mix(in srgb, ${bioSignal.phosphorCyan} 14%, transparent)`,
                  color: bioSignal.phosphorCyan,
                  display: "grid", placeItems: "center",
                  fontFamily: cssVar.fontMono, fontWeight: font.weight.bold,
                  fontSize: 16,
                }}>✓</span>
                <strong style={{ fontSize: font.size.md, color: cssVar.text, letterSpacing: "-0.01em" }}>
                  {g.title}
                </strong>
                <p style={{ margin: 0, fontSize: font.size.sm, color: cssVar.textDim, lineHeight: 1.5 }}>
                  {g.body}
                </p>
              </article>
            ))}
          </SpotlightGrid>
         </IgnitionReveal>
        </section>

        <PulseDivider intensity="dim" />

        <section aria-labelledby="trust" style={{ marginTop: space[8], textAlign: "center" }}>
         <IgnitionReveal sparkOrigin="50% 40%">
          <h2 id="trust" style={{ ...sectionHeading, marginBottom: space[2] }}>{c.trustTitle}</h2>
          <p style={{ color: cssVar.textDim, maxWidth: 640, marginInline: "auto", marginBlockEnd: space[5] }}>
            {c.trustSub}
          </p>
          <SpotlightGrid
            as="ul"
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: space[3],
              maxWidth: 900,
              marginInline: "auto",
            }}
          >
            {c.trustBadges.map((b) => (
              <li
                key={b.label}
                className="bi-trust-badge bi-spot"
                data-tone={b.tone || undefined}
              >
                <span className="bi-trust-badge-label">{b.label}</span>
                <span className="bi-trust-badge-hint">{b.hint}</span>
              </li>
            ))}
          </SpotlightGrid>
         </IgnitionReveal>
        </section>

        <PulseDivider intensity="dim" />

        <section aria-labelledby="data" style={{ marginTop: space[8], maxWidth: 1040, marginInline: "auto" }}>
         <IgnitionReveal sparkOrigin="50% 40%">
          <header style={{ textAlign: "center", marginBottom: space[6] }}>
            <div style={kickerStyle}>{c.dataKicker}</div>
            <h2 id="data" style={{ ...sectionHeading, marginBottom: space[2] }}>{c.dataTitle}</h2>
            <p style={{ color: cssVar.textDim, maxWidth: 640, marginInline: "auto" }}>
              {c.dataSub}
            </p>
          </header>

          <SpotlightGrid
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: space[3],
              marginBlockEnd: space[6],
            }}
          >
            {c.dataItems.map((item) => {
              const body = (
                <>
                  <div style={{
                    fontFamily: cssVar.fontMono,
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: bioSignal.phosphorCyan,
                    fontWeight: font.weight.bold,
                  }}>{item.tag}</div>
                  <strong style={{
                    fontSize: font.size.md,
                    color: cssVar.text,
                    letterSpacing: "-0.01em",
                    lineHeight: 1.3,
                  }}>{item.title}</strong>
                  <p style={{
                    margin: 0,
                    fontSize: font.size.sm,
                    color: cssVar.textDim,
                    lineHeight: 1.55,
                  }}>{item.body}</p>
                </>
              );
              const shared = {
                className: "bi-spot bi-data-card",
                style: {
                  padding: space[5],
                  borderRadius: radius.lg,
                  border: `1px solid ${cssVar.border}`,
                  background: cssVar.surface,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  textDecoration: "none",
                  color: "inherit",
                },
              };
              return item.href ? (
                <a key={item.title} href={item.href} {...shared}>{body}</a>
              ) : (
                <article key={item.title} {...shared}>{body}</article>
              );
            })}
          </SpotlightGrid>

          <div style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: space[4],
            alignItems: "start",
          }} className="bi-data-sla-grid">
            <article
              className="bi-spot"
              style={{
                padding: space[5],
                borderRadius: radius.lg,
                border: `1px solid ${cssVar.border}`,
                background: cssVar.surface,
              }}
            >
              <h3 style={{
                margin: 0,
                marginBlockEnd: 4,
                fontSize: font.size.lg,
                color: cssVar.text,
                letterSpacing: "-0.01em",
              }}>{c.slaTitle}</h3>
              <p style={{
                margin: 0,
                marginBlockEnd: 12,
                fontSize: font.size.sm,
                color: cssVar.textDim,
                lineHeight: 1.5,
              }}>{c.slaSub}</p>
              <ul style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "grid",
                gap: 6,
              }}>
                {c.slaRows.map((row) => (
                  <li key={row.uptime} style={{
                    display: "grid",
                    gridTemplateColumns: "120px 1fr",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: `1px solid ${cssVar.border}`,
                    background: `color-mix(in srgb, ${bioSignal.phosphorCyan} 3%, transparent)`,
                    fontFamily: cssVar.fontMono,
                    fontSize: 12,
                    alignItems: "baseline",
                  }}>
                    <span style={{
                      color: bioSignal.phosphorCyan,
                      fontWeight: font.weight.bold,
                      letterSpacing: "0.04em",
                    }}>{row.uptime}</span>
                    <span style={{ color: cssVar.text }}>{row.credit}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article
              className="bi-spot"
              style={{
                padding: space[5],
                borderRadius: radius.lg,
                border: `2px solid ${cssVar.accent}`,
                background: cssVar.accentSoft,
                display: "flex",
                flexDirection: "column",
                gap: space[3],
                justifyContent: "space-between",
                minHeight: "100%",
              }}
            >
              <div>
                <h3 style={{
                  margin: 0,
                  marginBlockEnd: 6,
                  fontSize: font.size.lg,
                  color: cssVar.text,
                  letterSpacing: "-0.01em",
                }}>{c.onePagerTitle}</h3>
                <p style={{
                  margin: 0,
                  fontSize: font.size.sm,
                  color: cssVar.textDim,
                  lineHeight: 1.55,
                }}>{c.onePagerBody}</p>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                <PrintButton label={c.onePagerCta} />
                <a href={c.procurementHref} className="bi-partner-trigger" style={{ textDecoration: "none" }}>
                  <span>{c.procurementCta}</span>
                  <span aria-hidden style={{ fontSize: 14, lineHeight: 1 }}>→</span>
                </a>
              </div>
            </article>
          </div>
         </IgnitionReveal>
        </section>

        <PulseDivider />

        <section aria-labelledby="proof" style={{ marginTop: space[8], maxWidth: 960, marginInline: "auto" }}>
         <IgnitionReveal sparkOrigin="50% 40%">
          <header style={{ textAlign: "center", marginBottom: space[6] }}>
            <h2 id="proof" style={{ ...sectionHeading, marginBottom: space[2] }}>{c.proofTitle}</h2>
            <p style={{
              fontFamily: "var(--font-editorial), 'Instrument Serif', Georgia, serif",
              fontStyle: "italic",
              fontSize: "clamp(18px, 2vw, 22px)",
              color: cssVar.textDim,
              maxWidth: 640,
              marginInline: "auto",
              lineHeight: 1.4,
              letterSpacing: "-0.01em",
            }}>{c.proofSub}</p>
          </header>

          <SpotlightGrid
            as="ul"
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: space[3],
              marginBlockEnd: space[6],
            }}
          >
            <ProofStat numeric={protocolCount} label={c.proofStat1Label} sub={c.proofStat1Sub(protocolCount)} />
            <ProofStat numeric={studyCount}    label={c.proofStat2Label} sub={c.proofStat2Sub} />
            <ProofStat value={c.proofStat3Value} label={c.proofStat3Label} sub={c.proofStat3Sub} />
          </SpotlightGrid>

          <SpotlightGrid
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: space[4],
            }}
          >
            <article
              className="bi-spot"
              style={{
                padding: space[6],
                borderRadius: radius.lg,
                border: `2px solid color-mix(in srgb, ${bioSignal.phosphorCyan} 55%, ${cssVar.border})`,
                background: `color-mix(in srgb, ${bioSignal.phosphorCyan} 5%, ${cssVar.surface})`,
                display: "flex",
                flexDirection: "column",
                gap: space[3],
              }}
            >
              <h3 style={{ margin: 0, fontSize: font.size.xl, color: cssVar.text }}>{c.partnerTitle}</h3>
              <p style={{ margin: 0, color: cssVar.textDim, lineHeight: 1.6 }}>{c.partnerBody}</p>
              <div style={{ marginTop: "auto" }}>
                <PartnerApplyModal
                  triggerLabel={c.partnerCta}
                  chipLabel={PARTNER_COPY[L].chip}
                  dialogTitle={c.partnerTitle}
                  dialogBody={c.partnerBody}
                  locale={L}
                />
              </div>
            </article>

            <article
              className="bi-spot"
              style={{
                padding: space[6],
                borderRadius: radius.lg,
                border: `1px solid ${cssVar.border}`,
                background: cssVar.surface,
                display: "flex",
                flexDirection: "column",
                gap: space[3],
              }}
            >
              <h3 style={{ margin: 0, fontSize: font.size.xl, color: cssVar.text }}>{c.founderTitle}</h3>
              <p style={{ margin: 0, color: cssVar.textDim, lineHeight: 1.6 }}>{c.founderBody}</p>
            </article>
          </SpotlightGrid>
         </IgnitionReveal>
        </section>

        <PulseDivider intensity="dim" />

        <section aria-labelledby="faq" style={{ marginTop: space[8], maxWidth: 720, marginInline: "auto" }}>
         <IgnitionReveal sparkOrigin="50% 30%">
          <h2 id="faq" style={{ ...sectionHeading, marginBottom: space[5], textAlign: "center" }}>{c.faqTitle}</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {c.faqs.map((f, i) => (
              <details key={i} className="bi-faq-item" open={i === 0}>
                <summary>
                  <span>{f.q}</span>
                  <span className="chev" aria-hidden>+</span>
                </summary>
                <p className="bi-faq-a">{f.a}</p>
              </details>
            ))}
          </div>
         </IgnitionReveal>
        </section>

        <PulseDivider intensity="dim" />

        <section aria-labelledby="final-cta" className="bi-hide-print" style={{ marginTop: space[8], textAlign: "center" }}>
         <IgnitionReveal sparkOrigin="50% 40%">
          <div style={kickerStyle}>{c.finalCtaKicker}</div>
          <h2 id="final-cta" style={sectionHeading}>{c.finalCtaTitle}</h2>
          <p style={{ color: cssVar.textDim, margin: `${space[2]}px auto ${space[5]}px`, maxWidth: 560, lineHeight: 1.5 }}>
            {c.finalCtaSub}
          </p>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: space[3],
            justifyContent: "center",
            alignItems: "center",
          }}>
            <a href="/demo" className="bi-pricing-peek-cta">{c.finalCtaDemo}</a>
            <a href="/signup?plan=starter" className="bi-trial-cta">
              {c.finalCtaTrial}
              <span className="bi-trial-sub">{c.finalCtaTrialSub}</span>
            </a>
            <PartnerApplyModal
              triggerLabel={c.partnerCta}
              chipLabel={PARTNER_COPY[L].chip}
              dialogTitle={c.partnerTitle}
              dialogBody={c.partnerBody}
              locale={L}
            />
          </div>
         </IgnitionReveal>
        </section>

        <details className="bi-pricing-legal" role="note">
          <summary className="bi-pricing-legal-summary">
            <span className="bi-pricing-legal-kicker">
              {L === "en" ? "Legal · Disclaimers" : "Legal · Avisos"}
            </span>
            <span className="bi-pricing-legal-hint">
              {L === "en" ? "Read" : "Leer"}
              <span className="chev" aria-hidden>▾</span>
            </span>
          </summary>
          <p className="bi-pricing-legal-body">{c.legalDisclaimer}</p>
        </details>

        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: c.faqs.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: typeof f.a === "string" ? f.a : "" },
              })),
            }),
          }}
        />
      </Container>
    </PublicShell>
  );
}

function CompareTable({ groups, cols }) {
  return (
    <div
      className="bi-table-wrap"
      style={{
        borderRadius: radius.lg,
        border: `1px solid ${cssVar.border}`,
        background: cssVar.surface,
        overflow: "auto",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: font.size.sm, minWidth: 640 }}>
        <thead>
          <tr style={{ background: cssVar.surface2 }}>
            <th style={{ ...thStyle, textAlign: "start" }}>&nbsp;</th>
            {cols.map((col, i) => (
              <th key={col} style={{ ...thStyle, color: i === 1 ? cssVar.accent : cssVar.text }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <Fragment key={g.title}>
              <tr>
                <th
                  colSpan={cols.length + 1}
                  scope="colgroup"
                  style={{
                    textAlign: "start",
                    padding: `${space[4]}px ${space[4]}px ${space[2]}px`,
                    fontSize: font.size.xs,
                    fontWeight: font.weight.bold,
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    color: bioSignal.phosphorCyan,
                    fontFamily: cssVar.fontMono,
                    background: cssVar.surface,
                    borderBlockStart: `1px solid ${cssVar.border}`,
                  }}
                >
                  {g.title}
                </th>
              </tr>
              {g.rows.map((row, rIdx) => {
                const [label, ...vals] = row;
                return (
                  <tr key={`r-${g.title}-${rIdx}`}>
                    <th scope="row" style={{ ...tdStyle, textAlign: "start", fontWeight: font.weight.medium, color: cssVar.text }}>
                      {label}
                    </th>
                    {vals.map((v, i) => (
                      <td key={i} style={{ ...tdStyle, textAlign: "center", background: i === 1 ? cssVar.accentSoft : "transparent" }}>
                        <CellValue v={v} emphasis={i === 1} />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProofStat({ value, numeric, label, sub }) {
  return (
    <li
      className="bi-spot"
      style={{
        padding: space[5],
        borderRadius: radius.lg,
        border: `1px solid ${cssVar.border}`,
        background: cssVar.surface,
        display: "flex",
        flexDirection: "column",
        gap: space[1],
      }}
    >
      <span style={{
        fontSize: 44,
        fontWeight: font.weight.black,
        fontFamily: cssVar.fontMono,
        color: cssVar.accent,
        letterSpacing: "-1px",
        lineHeight: 1,
      }}>
        {typeof numeric === "number" ? <CountUp value={numeric} /> : value}
      </span>
      <span style={{ fontSize: font.size.md, color: cssVar.text, fontWeight: font.weight.semibold, lineHeight: 1.3 }}>
        {label}
      </span>
      <span style={{ fontSize: font.size.xs, color: cssVar.textMuted, lineHeight: 1.5 }}>
        {sub}
      </span>
    </li>
  );
}

function CellValue({ v, emphasis }) {
  if (v === true) {
    return <span aria-label="Incluido" style={{ color: bioSignal.phosphorCyan, fontWeight: font.weight.bold, fontSize: 16 }}>✓</span>;
  }
  if (v === false || v == null) {
    return <span aria-label="No incluido" style={{ color: cssVar.textMuted }}>—</span>;
  }
  return <span style={{ fontWeight: emphasis ? font.weight.semibold : font.weight.normal, color: cssVar.text }}>{v}</span>;
}

const thStyle = {
  padding: `${space[3]}px ${space[4]}px`,
  fontSize: font.size.xs,
  fontWeight: font.weight.bold,
  textTransform: "uppercase",
  letterSpacing: "0.2em",
  textAlign: "center",
};

const tdStyle = {
  padding: `${space[3]}px ${space[4]}px`,
  borderBlockStart: `1px solid ${cssVar.border}`,
  color: cssVar.textDim,
};
