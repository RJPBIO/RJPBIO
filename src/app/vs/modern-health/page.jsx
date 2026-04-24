/* ═══════════════════════════════════════════════════════════════
   /vs/modern-health — Third comparative. Distinct angle from
   /vs/headspace and /vs/calm: Modern Health is a clinical services
   platform (therapy + coaching + psychiatry), not a content library.
   We are explicitly NOT clinical. This page leans into the
   complementarity — most orgs end up with both, in different slots
   of the same wellbeing stack.
   ═══════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font, bioSignal, radius } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";
import IgnitionReveal from "@/components/brand/IgnitionReveal";
import BioglyphLattice from "@/components/brand/BioglyphLattice";
import PulseDivider from "@/components/brand/PulseDivider";

export const metadata = {
  title: "BIO-IGNICIÓN vs Modern Health",
  description:
    "Comparación honesta: Modern Health es plataforma clínica (terapia + coaching + psiquiatría). BIO-IGNICIÓN es instrumento pre-turno medible. Más complementarios que competidores — y lo decimos.",
  alternates: { canonical: "/vs/modern-health" },
  openGraph: {
    title: "BIO-IGNICIÓN vs Modern Health",
    description:
      "Terapia humana escalable vs pre-shift medible. Stack completo = los dos.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
};

const LAST_REVIEWED = "2026-04-22";

const kickerStyle = {
  fontFamily: cssVar.fontMono,
  fontSize: font.size.xs,
  color: bioSignal.phosphorCyanInk,
  textTransform: "uppercase",
  letterSpacing: "0.26em",
  fontWeight: font.weight.bold,
  marginBlockEnd: space[3],
};

const kickerStyleMuted = {
  ...kickerStyle,
  color: cssVar.textMuted,
  letterSpacing: "0.24em",
};

const h1Style = {
  margin: 0,
  fontSize: "clamp(36px, 5.2vw, 62px)",
  letterSpacing: "-0.035em",
  lineHeight: 1.04,
  fontWeight: font.weight.black,
  color: cssVar.text,
};

const editorialStyle = {
  margin: `${space[5]}px 0 0`,
  fontFamily: "var(--font-editorial)",
  fontStyle: "italic",
  fontSize: "clamp(18px, 2.2vw, 22px)",
  lineHeight: 1.45,
  color: cssVar.textMuted,
  maxWidth: "62ch",
};

const sectionHeading = {
  margin: 0,
  fontSize: "clamp(26px, 3.6vw, 40px)",
  letterSpacing: "-0.028em",
  lineHeight: 1.08,
  fontWeight: font.weight.black,
  color: cssVar.text,
};

const sectionSub = {
  margin: `${space[3]}px 0 0`,
  color: cssVar.textMuted,
  fontSize: font.size.base,
  lineHeight: font.leading.relaxed,
  maxWidth: "64ch",
};

const cardStyle = {
  border: `1px solid ${cssVar.border}`,
  borderRadius: radius.xl,
  padding: space[6],
  background: cssVar.surface,
  display: "grid",
  gap: space[3],
};

const COPY = {
  es: {
    eyebrow: "BIO-IGNICIÓN · vs · MODERN HEALTH",
    title: "Modern Health interviene. BIO-IGNICIÓN previene.",
    editorial:
      "Este es el comparativo más honesto de los tres. Modern Health es una plataforma clínica con terapeutas humanos, coaches y psiquiatras — escalable a 1 000+ empresas. Nosotros somos un instrumento pre-turno. No competimos: vivimos en slots distintos del mismo stack de bienestar.",

    honestUpfrontKicker: "HONESTIDAD UPFRONT",
    honestUpfrontH: "Este versus no debería existir — pero lo pediste.",
    honestUpfrontBody:
      "Modern Health resuelve salud mental clínica a escala: terapia licenciada, coaching profesional, psiquiatría, cobertura global en múltiples idiomas. Si tu due diligence los compara con nosotros, es porque tu presupuesto de bienestar tiene que elegir — y acá te decimos por qué probablemente no tengas que elegir.",

    tldrKicker: "TL;DR · 30 SEGUNDOS",
    tldrRows: [
      {
        k: "Categoría",
        hs: "Plataforma clínica de salud mental (terapia + coaching + psiquiatría).",
        bi: "Instrumento operativo pre-turno (HRV + protocolo + baseline medible).",
      },
      {
        k: "Intervención",
        hs: "Humano (terapeuta, coach, psiquiatra) resuelve sesión 1:1.",
        bi: "Protocolo sensorial (binaural + haptics + voz) ejecuta 3 min.",
      },
      {
        k: "Trigger",
        hs: "Empleado solicita ayuda · self-guided content → coaching → terapia.",
        bi: "Empleado entra al turno · lectura HRV → protocolo → registro.",
      },
      {
        k: "Medición",
        hs: "Outcome clínico (PHQ-9, GAD-7, retención, return-to-work).",
        bi: "Outcome fisiológico (HRV RMSSD/SDNN, coherencia, baseline composite).",
      },
      {
        k: "Cuándo usa el empleado",
        hs: "Cuando hay malestar, estrés agudo, necesidad clínica.",
        bi: "Cuando empieza su turno crítico · ritual operacional, no reactivo.",
      },
      {
        k: "Compliance mapeado",
        hs: "SOC 2 Type II, HIPAA BAA (publicado por Modern Health).",
        bi: "SOC 2 (postura activa), ISO 27001/45001 (gap analysis), GDPR Recital 26, NOM-035 STPS, HIPAA-ready + BAA.",
      },
    ],

    whenHsKicker: "CUÁNDO ELEGIR MODERN HEALTH",
    whenHsH: "Tres escenarios donde ganan — sin discusión.",
    whenHsBody:
      "Si tu mandato entra en cualquiera de estas tres, Modern Health es la respuesta correcta. Nosotros no competimos en clínico.",
    whenHsItems: [
      {
        t: "Terapia escalable en múltiples idiomas.",
        b: "Modern Health tiene red global de terapeutas licenciados, soporte en múltiples idiomas, culturally responsive care. Si tu operación es multinacional y el mandato es cobertura clínica para 5 000+ empleados en 20 países, ellos resuelven lo que nosotros no. Se acabó la discusión.",
      },
      {
        t: "Return-to-work post-diagnóstico clínico.",
        b: "Empleado con diagnóstico de ansiedad, depresión, o burnout clínico necesita tratamiento licenciado + seguimiento. Modern Health lo cubre con terapeuta + psiquiatra + medicación coordinada. Nosotros no somos eso — y nuestro disclaimer médico lo dice en cada página.",
      },
      {
        t: "Reporte clínico de outcome (PHQ-9, GAD-7, remission rates).",
        b: "Si tu consejo o tu aseguradora pide métricas clínicas validadas para reportar ROI del programa de salud mental, Modern Health las publica (remission rates, clinical improvement). Nosotros reportamos HRV, no escalas clínicas — son cosas distintas.",
      },
    ],

    whenBiKicker: "CUÁNDO ELEGIR BIO-IGNICIÓN",
    whenBiH: "Tres escenarios donde entramos antes del clínico.",
    whenBiBody:
      "La pregunta no es 'clínico vs no-clínico'. Es 'intervención reactiva vs ritual preventivo'. Modern Health entra cuando el empleado pide ayuda. Nosotros entramos antes de que empiece el turno.",
    whenBiItems: [
      {
        t: "Pre-shift en roles críticos · antes de que haya crisis.",
        b: "Piloto, cirujano, operario de maquinaria, trader, controlador aéreo. No es 'necesito terapia' — es 'necesito entrar al turno con HRV estable'. 3 minutos antes del turno, con lectura fisiológica + protocolo sincronizado + registro auditable. Modern Health no tiene ese producto, ni lo planea.",
      },
      {
        t: "NOM-035 STPS · prevención documental con evidencia.",
        b: "México 2026: la ley de riesgos psicosociales requiere evidencia preventiva documentable, no solo intervención clínica. Nuestro export ECO37 + Guía III sale nativo y se firma en el ciclo. Modern Health tiene infra clínica US-centric — cobertura STPS mexicana no es su stack.",
      },
      {
        t: "Complemento explícito · no sustituto de terapia.",
        b: "Si ya pagas Modern Health (o Lyra, o Spring), nuestro caso de uso es el slot que ellos no ocupan: 3 min antes del turno. No te vendemos terapia — te vendemos un ritual fisiológico que reduce el funnel de empleados que llegan a necesitar la sesión clínica.",
      },
    ],

    archKicker: "ARQUITECTURA · LA DIFERENCIA PROFUNDA",
    archH: "Tres decisiones estructurales. No son competitivas — son ortogonales.",
    archBody:
      "Con Calm y Headspace la diferencia era librería vs instrumento. Con Modern Health la diferencia es plataforma clínica humana vs instrumento fisiológico operacional. Coexisten en slots distintos del mismo stack.",
    archItems: [
      {
        n: "01",
        t: "Humano clínico vs instrumento fisiológico.",
        b: "Modern Health construye sobre red de terapeutas licenciados, coaches profesionales, psiquiatras. Nosotros construimos sobre HRV leído del dispositivo + protocolo sensorial sincronizado al milisegundo. Son modelos de unit-economics distintos: ellos pagan humanos por hora, nosotros ejecutamos código en el cliente.",
      },
      {
        n: "02",
        t: "Intervención reactiva vs ritual preventivo.",
        b: "Modern Health entra cuando el empleado solicita — tier self-guided → coaching → terapia → psiquiatría escala según necesidad. BIO-IGNICIÓN entra cuando el empleado empieza su turno — ritual operacional de 3 min, no gatillado por malestar. Diferentes triggers, diferentes ventanas temporales.",
      },
      {
        n: "03",
        t: "Remote + SaaS central vs local-first + edge.",
        b: "Modern Health es plataforma SaaS con sesión de video + portal web + datos clínicos en sus servidores (HIPAA-compliant). BIO-IGNICIÓN es PWA local-first con señal fisiológica en IndexedDB cifrado en el dispositivo del empleado. Servidor recibe únicamente agregados k-anónimos ≥ 5. Arquitecturas opuestas.",
      },
    ],

    tableKicker: "PARIDAD DE CAPACIDAD",
    tableH: "Capacidad a capacidad, sin adornos.",
    tableBody:
      "Información pública verificable en ambos lados. Donde ellos tienen algo que nosotros no (la mayoría del clínico), decimos '—'. Donde nosotros tenemos algo que ellos no (pre-shift, HRV, NOM-035), igual. Sin FUD.",
    tableHeaderFeature: "Capacidad",
    tableHeaderHs: "Modern Health",
    tableHeaderBi: "BIO-IGNICIÓN",
    tableFootnote:
      "Información de Modern Health obtenida de modernhealth.com y material corporativo publicado. Revisada: 2026-04-22.",
    tableRows: [
      { f: "Terapia licenciada 1:1", hs: "Red global · múltiples idiomas", bi: "—" },
      { f: "Coaching profesional certificado", hs: "Tier coaching nativo", bi: "—" },
      { f: "Psiquiatría + medicación", hs: "Disponible Enterprise", bi: "—" },
      { f: "Culturally responsive care", hs: "Publicado como feature", bi: "—" },
      { f: "Outcome clínico (PHQ-9, GAD-7)", hs: "Medido y reportado", bi: "— (medimos HRV)" },
      { f: "Cobertura multi-idioma global", hs: "Sí · 35+ idiomas publicados", bi: "ES · EN (roadmap PT/FR/DE)" },
      { f: "HRV fisiológico (RMSSD + SDNN)", hs: "—", bi: "Nativo · Apple Health, Fitbit, Garmin, Oura" },
      { f: "Protocolo binaural + haptics + voz", hs: "—", bi: "Sincronizado al ms · wake-lock incluido" },
      { f: "Pre-shift operacional (2–3 min)", hs: "—", bi: "Protocolo canónico · ritual, no reactivo" },
      { f: "Baseline neural composite (0–100)", hs: "—", bi: "Calculado · delta semanal + trimestral" },
      { f: "Local-first · cifrado en dispositivo", hs: "—", bi: "IndexedDB cifrado AES-GCM" },
      { f: "NOM-035 STPS · export ECO37", hs: "— (stack US-centric)", bi: "Nativo · firma RH en PDF" },
      { f: "SOC 2", hs: "Type II (publicado)", bi: "Postura activa · Type I en 2026" },
      { f: "HIPAA · BAA firmable", hs: "Nativo · EHR-grade", bi: "Disponible (Enterprise)" },
      { f: "GDPR Recital 26 (datos disociados)", hs: "No declarado explícitamente", bi: "Arquitectura nativa" },
      { f: "SSO · SAML 2.0 + SCIM 2.0", hs: "Enterprise", bi: "Enterprise" },
      { f: "CFDI 4.0 (facturación México)", hs: "— (roadmap no publicado)", bi: "Todos los planes" },
    ],

    philoKicker: "FILOSOFÍA · LADO A LADO",
    philoH: "Stack complementario, no competitivo.",
    philoBody:
      "La mayor diferencia con Calm/Headspace: con Modern Health no hay 'o uno u otro'. Son slots distintos del mismo programa de bienestar. Si tu CHRO está enfrentando estos dos, probablemente el presupuesto alcanza para ambos — y el stack queda más sólido.",
    philoCols: {
      hs: {
        header: "Modern Health",
        tag: "PLATAFORMA CLÍNICA · B2B",
        bullets: [
          "Red de terapeutas, coaches, psiquiatras — escalada humana.",
          "Tier clínico: self-guided → coaching → terapia → psiquiatría.",
          "Cobertura global multi-idioma · culturally responsive care.",
          "Outcome clínico medido (PHQ-9, GAD-7, remission rates).",
          "Entra cuando el empleado solicita · modelo reactivo + escalado.",
        ],
      },
      bi: {
        header: "BIO-IGNICIÓN",
        tag: "INSTRUMENTO · PRE-SHIFT",
        bullets: [
          "HRV + protocolo sensorial · instrumento fisiológico, no humano.",
          "Un slot operacional: 3 min pre-turno con registro medible.",
          "Local-first · señal en dispositivo · agregados k-anónimos ≥ 5.",
          "Outcome fisiológico (HRV RMSSD/SDNN, baseline neural composite).",
          "Entra cuando el turno empieza · ritual preventivo, no reactivo.",
        ],
      },
    },

    faqKicker: "PREGUNTAS HONESTAS",
    faqH: "Lo que aparece en la call de due diligence.",
    faq: [
      {
        q: "¿Puedo usar Modern Health + BIO-IGNICIÓN?",
        a: "Sí, y es la combinación que tiene más sentido de las tres que hemos publicado. Modern Health ocupa el slot clínico (crisis, terapia, coaching). Nosotros ocupamos el slot operacional (pre-shift, HRV, ritual). No compiten por hora del día ni por mandato. Tu compliance officer firma NOM-035 con nuestro export; tu clinical lead reporta outcome clínico con el de ellos.",
      },
      {
        q: "¿Ustedes reemplazan terapia?",
        a: "No, y nuestro disclaimer médico lo dice en cada página: no somos dispositivo médico, no diagnosticamos, no tratamos, no sustituimos evaluación clínica. Si tu empleado necesita terapia, Modern Health (o Lyra, o Spring Health) es la respuesta. Nosotros medimos HRV antes del turno — no cubrimos depresión mayor ni trastorno de ansiedad.",
      },
      {
        q: "¿Modern Health no tiene también contenido self-guided?",
        a: "Sí, lo ofrecen como tier 0 de su escalado clínico (antes de que el empleado hable con un humano). Eso los acerca a Calm/Headspace en contenido, pero el diferenciador sigue siendo la red de humanos. Nosotros no competimos en contenido self-guided — tenemos 17 protocolos, no miles de sesiones narradas.",
      },
      {
        q: "¿Por qué cuestan tanto más que Calm/Headspace?",
        a: "Porque su unit-economics incluye pagar terapeutas por hora. Un tier clínico con red global no escala marginal-cero como un catálogo de contenido — cada sesión tiene costo variable humano. Nosotros cobramos menos porque somos instrumento (cercano a marginal-cero), pero cobramos más que Calm/Headspace porque somos medibles + compliance activo. Tres modelos distintos.",
      },
      {
        q: "Si ya pago Modern Health, ¿necesito BIO-IGNICIÓN?",
        a: "Depende del mandato. Si tu operación no tiene roles críticos (turnos de alta consecuencia), no. Si tu consejo no pide NOM-035 ni outcome fisiológico reportable, no. Si tu presupuesto es ajustado, tampoco. Te agregamos valor cuando: (a) hay turnos críticos que necesitan ritual pre-shift, (b) tienes mandato NOM-035 con auditoría activa, (c) tu board quiere un KPI fisiológico complementario al clínico.",
      },
    ],

    closingKicker: "DECISIÓN",
    closingHLead: "Si el mandato es salud mental clínica escalable: Modern Health.",
    closingHBody: "Si el mandato también incluye ritual pre-shift fisiológico: los dos.",
    closingBody:
      "De las tres comparativas que hemos publicado, esta es la más clara: no hay 'o uno u otro'. Modern Health resuelve salud mental clínica, nosotros resolvemos pre-turno fisiológico. Stack completo = ambos, en slots distintos. Si tu consejo exige solo uno, probablemente es Modern Health — y estamos bien con eso. Nuestro slot llega después, cuando añades roles críticos o NOM-035.",
    closingPrimary: "Reservar demo · caso específico",
    closingSecondary: "Ver ROI en tu operación",
    closingTertiary: "Trust Center · due diligence",
    lastReviewed: "Última revisión",

    sourcesKicker: "FUENTES · INFORMACIÓN PÚBLICA",
    sourcesH: "De dónde sacamos lo que dijimos.",
    sourcesBody:
      "Toda referencia a Modern Health proviene de material publicado por Modern Health Inc. en sus dominios oficiales. Si detectas un claim desactualizado, escríbenos y corregimos en < 30 días.",
    sources: [
      { label: "Modern Health · sitio oficial", url: "https://www.modernhealth.com/" },
      { label: "Modern Health · for Employers", url: "https://www.modernhealth.com/why-modern-health" },
      { label: "Modern Health · Research & Outcomes", url: "https://www.modernhealth.com/research" },
      { label: "Modern Health · Security", url: "https://www.modernhealth.com/security" },
    ],

    disclaimerH: "Nota legal · lectura en 45 s",
    disclaimer1:
      "Modern Health es marca registrada de Modern Health Inc. Su uso en esta página es nominativo con fin de comparación editorial — no implica endorsement, afiliación, sociedad ni subordinación comercial con BIO-IGNICIÓN.",
    disclaimer2:
      "BIO-IGNICIÓN es una herramienta de bienestar operativo basada en HRV · NO está autorizada como dispositivo médico por FDA, COFEPRIS, CE, ANMAT, ANVISA ni Health Canada · NO diagnostica, NO trata ni previene condiciones médicas · NO sustituye terapia, evaluación clínica ni psiquiátrica. Si necesitas atención clínica escalable, Modern Health, Lyra Health, o Spring Health son categorías apropiadas — nosotros no.",
    disclaimer3:
      "La información de Modern Health fue tomada de sus dominios oficiales con fecha de revisión indicada en la página. Modern Health puede cambiar políticas, pricing o feature-set sin previo aviso. Esta comparación se revisa trimestralmente — si necesitas validación en tiempo real, consulta modernhealth.com directamente.",
  },

  en: {
    eyebrow: "BIO-IGNITION · vs · MODERN HEALTH",
    title: "Modern Health intervenes. BIO-IGNITION prevents.",
    editorial:
      "This is the most honest of the three comparatives. Modern Health is a clinical platform with human therapists, coaches, and psychiatrists — scaled to 1 000+ employers. We are a pre-shift instrument. We don't compete: we live in different slots of the same wellbeing stack.",

    honestUpfrontKicker: "HONESTY UPFRONT",
    honestUpfrontH: "This versus shouldn't exist — but you asked for it.",
    honestUpfrontBody:
      "Modern Health solves clinical mental health at scale: licensed therapy, professional coaching, psychiatry, global multi-language coverage. If your due diligence compares them to us, it's because your wellbeing budget has to pick — and here we tell you why you probably don't have to.",

    tldrKicker: "TL;DR · 30 SECONDS",
    tldrRows: [
      {
        k: "Category",
        hs: "Clinical mental health platform (therapy + coaching + psychiatry).",
        bi: "Operational pre-shift instrument (HRV + protocol + measurable baseline).",
      },
      {
        k: "Intervention",
        hs: "Human (therapist, coach, psychiatrist) runs 1:1 session.",
        bi: "Sensory protocol (binaural + haptics + voice) runs 3 min.",
      },
      {
        k: "Trigger",
        hs: "Employee requests help · self-guided content → coaching → therapy.",
        bi: "Employee starts the shift · HRV reading → protocol → record.",
      },
      {
        k: "Measurement",
        hs: "Clinical outcome (PHQ-9, GAD-7, retention, return-to-work).",
        bi: "Physiological outcome (HRV RMSSD/SDNN, coherence, baseline composite).",
      },
      {
        k: "When employee uses it",
        hs: "When there's distress, acute stress, clinical need.",
        bi: "When their critical shift starts · operational ritual, not reactive.",
      },
      {
        k: "Mapped compliance",
        hs: "SOC 2 Type II, HIPAA BAA (per Modern Health).",
        bi: "SOC 2 (active posture), ISO 27001/45001 (gap analysis), GDPR Recital 26, NOM-035 STPS, HIPAA-ready + BAA.",
      },
    ],

    whenHsKicker: "WHEN TO CHOOSE MODERN HEALTH",
    whenHsH: "Three scenarios where they win — no argument.",
    whenHsBody:
      "If your mandate falls in any of these three, Modern Health is the right answer. We don't compete on clinical.",
    whenHsItems: [
      {
        t: "Scalable therapy in multiple languages.",
        b: "Modern Health has a global network of licensed therapists, multi-language support, culturally responsive care. If your operation is multinational and the mandate is clinical coverage for 5 000+ employees across 20 countries, they solve what we don't. End of discussion.",
      },
      {
        t: "Return-to-work post clinical diagnosis.",
        b: "Employee diagnosed with anxiety, depression, or clinical burnout needs licensed treatment + follow-up. Modern Health covers it with therapist + psychiatrist + coordinated medication. We're not that — and our medical disclaimer says so on every page.",
      },
      {
        t: "Clinical outcome reporting (PHQ-9, GAD-7, remission rates).",
        b: "If your board or insurer asks for validated clinical metrics to report mental health program ROI, Modern Health publishes them (remission rates, clinical improvement). We report HRV, not clinical scales — different things.",
      },
    ],

    whenBiKicker: "WHEN TO CHOOSE BIO-IGNITION",
    whenBiH: "Three scenarios where we enter before the clinical tier.",
    whenBiBody:
      "The question isn't 'clinical vs non-clinical'. It's 'reactive intervention vs preventive ritual'. Modern Health enters when the employee asks for help. We enter before the shift begins.",
    whenBiItems: [
      {
        t: "Pre-shift in critical roles · before there's a crisis.",
        b: "Pilot, surgeon, machinery operator, trader, air traffic controller. Not 'I need therapy' — it's 'I need to start the shift with stable HRV'. 3 minutes before, with physiological reading + synchronized protocol + auditable record. Modern Health doesn't have that product, nor do they plan to.",
      },
      {
        t: "NOM-035 STPS · documentable prevention with evidence.",
        b: "Mexico 2026: the psychosocial risk law requires documentable preventive evidence, not just clinical intervention. Our ECO37 + Guide III export ships natively and signs on cycle. Modern Health has US-centric clinical infra — Mexican STPS coverage isn't their stack.",
      },
      {
        t: "Explicit complement · not a therapy substitute.",
        b: "If you already pay Modern Health (or Lyra, or Spring), our use case is the slot they don't fill: 3 min pre-shift. We don't sell therapy — we sell a physiological ritual that reduces the funnel of employees who reach the point of needing a clinical session.",
      },
    ],

    archKicker: "ARCHITECTURE · THE DEEP DIFFERENCE",
    archH: "Three structural decisions. Not competitive — orthogonal.",
    archBody:
      "With Calm and Headspace the difference was library vs instrument. With Modern Health the difference is human clinical platform vs operational physiological instrument. They coexist in different slots of the same stack.",
    archItems: [
      {
        n: "01",
        t: "Clinical human vs physiological instrument.",
        b: "Modern Health is built on a network of licensed therapists, professional coaches, psychiatrists. We're built on HRV read from device + sensory protocol synced to the millisecond. Different unit-economics: they pay humans by the hour, we run code on the client.",
      },
      {
        n: "02",
        t: "Reactive intervention vs preventive ritual.",
        b: "Modern Health enters when the employee requests — self-guided → coaching → therapy → psychiatry escalates with need. BIO-IGNITION enters when the employee starts their shift — 3-min operational ritual, not triggered by distress. Different triggers, different time windows.",
      },
      {
        n: "03",
        t: "Remote + central SaaS vs local-first + edge.",
        b: "Modern Health is a SaaS platform with video session + web portal + clinical data on their servers (HIPAA-compliant). BIO-IGNITION is a local-first PWA with physiological signal in AES-GCM encrypted IndexedDB on the employee's device. Server receives only k-anonymous aggregates ≥ 5. Opposite architectures.",
      },
    ],

    tableKicker: "CAPABILITY PARITY",
    tableH: "Capability by capability, without ornament.",
    tableBody:
      "Verifiable public information on both sides. Where they have something we don't (most of the clinical), we say '—'. Where we have something they don't (pre-shift, HRV, NOM-035), same. No FUD.",
    tableHeaderFeature: "Capability",
    tableHeaderHs: "Modern Health",
    tableHeaderBi: "BIO-IGNITION",
    tableFootnote:
      "Modern Health information from modernhealth.com and published corporate materials. Reviewed: 2026-04-22.",
    tableRows: [
      { f: "Licensed 1:1 therapy", hs: "Global network · multi-language", bi: "—" },
      { f: "Certified professional coaching", hs: "Native coaching tier", bi: "—" },
      { f: "Psychiatry + medication", hs: "Enterprise available", bi: "—" },
      { f: "Culturally responsive care", hs: "Published as feature", bi: "—" },
      { f: "Clinical outcome (PHQ-9, GAD-7)", hs: "Measured and reported", bi: "— (we measure HRV)" },
      { f: "Multi-language global coverage", hs: "Yes · 35+ languages published", bi: "ES · EN (roadmap PT/FR/DE)" },
      { f: "Physiological HRV (RMSSD + SDNN)", hs: "—", bi: "Native · Apple Health, Fitbit, Garmin, Oura" },
      { f: "Binaural + haptics + voice protocol", hs: "—", bi: "Ms-synced · wake-lock included" },
      { f: "Operational pre-shift (2–3 min)", hs: "—", bi: "Canonical protocol · ritual, not reactive" },
      { f: "Neural baseline composite (0–100)", hs: "—", bi: "Computed · weekly + quarterly delta" },
      { f: "Local-first · encrypted on device", hs: "—", bi: "AES-GCM encrypted IndexedDB" },
      { f: "NOM-035 STPS · ECO37 export", hs: "— (US-centric stack)", bi: "Native · HR signs PDF" },
      { f: "SOC 2", hs: "Type II (published)", bi: "Active posture · Type I in 2026" },
      { f: "HIPAA · signable BAA", hs: "Native · EHR-grade", bi: "Available (Enterprise)" },
      { f: "GDPR Recital 26 (disassociated data)", hs: "Not explicitly declared", bi: "Native architecture" },
      { f: "SSO · SAML 2.0 + SCIM 2.0", hs: "Enterprise", bi: "Enterprise" },
      { f: "CFDI 4.0 (Mexico billing)", hs: "— (not on published roadmap)", bi: "All plans" },
    ],

    philoKicker: "PHILOSOPHY · SIDE BY SIDE",
    philoH: "Complementary stack, not competitive.",
    philoBody:
      "The biggest difference from Calm/Headspace: with Modern Health there's no 'one or the other'. They're different slots of the same wellbeing program. If your CHRO is comparing these two, the budget probably covers both — and the stack ends up stronger.",
    philoCols: {
      hs: {
        header: "Modern Health",
        tag: "CLINICAL PLATFORM · B2B",
        bullets: [
          "Network of therapists, coaches, psychiatrists — human-scaled.",
          "Clinical tier: self-guided → coaching → therapy → psychiatry.",
          "Global multi-language coverage · culturally responsive care.",
          "Clinical outcome measured (PHQ-9, GAD-7, remission rates).",
          "Enters when the employee requests · reactive + escalated model.",
        ],
      },
      bi: {
        header: "BIO-IGNITION",
        tag: "INSTRUMENT · PRE-SHIFT",
        bullets: [
          "HRV + sensory protocol · physiological instrument, not human.",
          "One operational slot: 3 min pre-shift with measurable record.",
          "Local-first · signal on device · k-anonymous aggregates ≥ 5.",
          "Physiological outcome (HRV RMSSD/SDNN, neural baseline composite).",
          "Enters when the shift begins · preventive ritual, not reactive.",
        ],
      },
    },

    faqKicker: "HONEST QUESTIONS",
    faqH: "What comes up on the due-diligence call.",
    faq: [
      {
        q: "Can I use Modern Health + BIO-IGNITION?",
        a: "Yes, and it's the combination that makes the most sense of the three we've published. Modern Health fills the clinical slot (crisis, therapy, coaching). We fill the operational slot (pre-shift, HRV, ritual). They don't compete for time of day or mandate. Your compliance officer signs NOM-035 with our export; your clinical lead reports clinical outcome with theirs.",
      },
      {
        q: "Do you replace therapy?",
        a: "No, and our medical disclaimer says so on every page: we're not a medical device, don't diagnose, don't treat, don't substitute clinical evaluation. If your employee needs therapy, Modern Health (or Lyra, or Spring Health) is the answer. We measure HRV before the shift — we don't cover major depression or anxiety disorders.",
      },
      {
        q: "Doesn't Modern Health also have self-guided content?",
        a: "Yes, they offer it as tier 0 of their clinical escalation (before the employee speaks with a human). That brings them closer to Calm/Headspace on content, but the differentiator remains the human network. We don't compete on self-guided content — we have 17 protocols, not thousands of narrated sessions.",
      },
      {
        q: "Why do they cost so much more than Calm/Headspace?",
        a: "Because their unit-economics includes paying therapists by the hour. A clinical tier with a global network doesn't scale at marginal-zero like a content catalog — each session carries variable human cost. We charge less because we're an instrument (close to marginal-zero), but more than Calm/Headspace because we're measurable + active compliance. Three different models.",
      },
      {
        q: "If I already pay Modern Health, do I need BIO-IGNITION?",
        a: "Depends on the mandate. If your operation doesn't have critical roles (high-consequence shifts), no. If your board doesn't ask for NOM-035 or reportable physiological outcome, no. If your budget is tight, also no. We add value when: (a) critical shifts need a pre-shift ritual, (b) you have an active-audit NOM-035 mandate, (c) your board wants a physiological KPI complementary to the clinical one.",
      },
    ],

    closingKicker: "DECISION",
    closingHLead: "If the mandate is scalable clinical mental health: Modern Health.",
    closingHBody: "If the mandate also includes a pre-shift physiological ritual: both.",
    closingBody:
      "Of the three comparatives we've published, this is the clearest: there's no 'one or the other'. Modern Health solves clinical mental health, we solve pre-shift physiological. Full stack = both, in different slots. If your board demands only one, it's probably Modern Health — and we're fine with that. Our slot comes later, when you add critical roles or NOM-035.",
    closingPrimary: "Book demo · specific case",
    closingSecondary: "See ROI on your operation",
    closingTertiary: "Trust Center · due diligence",
    lastReviewed: "Last reviewed",

    sourcesKicker: "SOURCES · PUBLIC INFORMATION",
    sourcesH: "Where what we said comes from.",
    sourcesBody:
      "Every reference to Modern Health comes from material published by Modern Health Inc. on their official domains. If you spot a stale claim, write to us and we fix it in < 30 days.",
    sources: [
      { label: "Modern Health · official site", url: "https://www.modernhealth.com/" },
      { label: "Modern Health · for Employers", url: "https://www.modernhealth.com/why-modern-health" },
      { label: "Modern Health · Research & Outcomes", url: "https://www.modernhealth.com/research" },
      { label: "Modern Health · Security", url: "https://www.modernhealth.com/security" },
    ],

    disclaimerH: "Legal note · 45 s read",
    disclaimer1:
      "Modern Health is a registered trademark of Modern Health Inc. Its use on this page is nominative for editorial comparison — no endorsement, affiliation, partnership, or commercial subordination with BIO-IGNITION is implied.",
    disclaimer2:
      "BIO-IGNITION is an operational wellness tool based on HRV · NOT authorized as a medical device by FDA, COFEPRIS, CE, ANMAT, ANVISA, or Health Canada · does NOT diagnose, treat, or prevent medical conditions · does NOT substitute therapy, clinical, or psychiatric evaluation. If you need scalable clinical care, Modern Health, Lyra Health, or Spring Health are appropriate categories — we're not.",
    disclaimer3:
      "Modern Health information was taken from their official domains with the review date indicated on the page. Modern Health may change policies, pricing, or feature-set without notice. This comparison is reviewed quarterly — if you need real-time validation, consult modernhealth.com directly.",
  },
};

export default async function VsModernHealthPage() {
  const locale = await getServerLocale();
  const t = COPY[locale === "en" ? "en" : "es"];

  return (
    <PublicShell activePath="/vs/modern-health">
      <main id="main-content">
        {/* ═══ HERO ═══ */}
        <section style={{ position: "relative", paddingBlock: `clamp(40px, 6vw, 72px) clamp(40px, 7vw, 80px)` }}>
          <BioglyphLattice variant="ambient" />
          <Container size="xl" style={{ position: "relative", zIndex: 1, paddingBlock: 0 }}>
            <IgnitionReveal sparkOrigin="22% 30%">
              <p style={kickerStyle}>{t.eyebrow}</p>
              <h1 style={h1Style}>{t.title}</h1>
              <p style={editorialStyle}>{t.editorial}</p>
              <div style={{ marginBlockStart: space[8], display: "flex", flexWrap: "wrap", gap: space[3] }}>
                <Link href="/demo" className="bi-demo-closing-primary">{t.closingPrimary}</Link>
                <Link href="/roi-calculator" className="bi-demo-closing-secondary">{t.closingSecondary}</Link>
              </div>
            </IgnitionReveal>
          </Container>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ HONESTY UPFRONT ═══ */}
        <section style={{ paddingBlock: space[10] }}>
          <Container size="xl">
            <p style={kickerStyle}>{t.honestUpfrontKicker}</p>
            <h2 style={sectionHeading}>{t.honestUpfrontH}</h2>
            <p style={sectionSub}>{t.honestUpfrontBody}</p>
          </Container>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ TL;DR ═══ */}
        <section style={{ paddingBlock: space[12] }}>
          <Container size="xl">
            <p style={kickerStyle}>{t.tldrKicker}</p>
            <div className="bi-roi-peer-table-wrap" style={{ marginBlockStart: space[6] }}>
              <table className="bi-roi-peer-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>{t.tableHeaderHs}</th>
                    <th>{t.tableHeaderBi}</th>
                  </tr>
                </thead>
                <tbody>
                  {t.tldrRows.map((r) => (
                    <tr key={r.k}>
                      <td>
                        <span className="bi-roi-peer-label">{r.k}</span>
                      </td>
                      <td style={{ color: cssVar.textMuted, fontSize: font.size.sm, lineHeight: font.leading.relaxed }}>
                        {r.hs}
                      </td>
                      <td style={{ color: cssVar.text, fontSize: font.size.sm, lineHeight: font.leading.relaxed, fontWeight: font.weight.medium }}>
                        {r.bi}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Container>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ WHEN MODERN HEALTH ═══ */}
        <section style={{ paddingBlock: space[12] }}>
          <Container size="xl">
            <p style={kickerStyleMuted}>{t.whenHsKicker}</p>
            <h2 style={sectionHeading}>{t.whenHsH}</h2>
            <p style={sectionSub}>{t.whenHsBody}</p>
            <div
              style={{
                marginBlockStart: space[8],
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: space[4],
              }}
            >
              {t.whenHsItems.map((it) => (
                <article key={it.t} style={cardStyle}>
                  <h3 style={{ margin: 0, fontSize: font.size.lg, fontWeight: font.weight.bold, color: cssVar.text, letterSpacing: "-0.01em" }}>
                    {it.t}
                  </h3>
                  <p style={{ margin: 0, color: cssVar.textMuted, fontSize: font.size.sm, lineHeight: font.leading.relaxed }}>
                    {it.b}
                  </p>
                </article>
              ))}
            </div>
          </Container>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ WHEN BIO-IGNICIÓN ═══ */}
        <section style={{ paddingBlock: space[12] }}>
          <Container size="xl">
            <p style={kickerStyle}>{t.whenBiKicker}</p>
            <h2 style={sectionHeading}>{t.whenBiH}</h2>
            <p style={sectionSub}>{t.whenBiBody}</p>
            <div
              style={{
                marginBlockStart: space[8],
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: space[4],
              }}
            >
              {t.whenBiItems.map((it) => (
                <article key={it.t} style={cardStyle}>
                  <h3 style={{ margin: 0, fontSize: font.size.lg, fontWeight: font.weight.bold, color: cssVar.text, letterSpacing: "-0.01em" }}>
                    {it.t}
                  </h3>
                  <p style={{ margin: 0, color: cssVar.textMuted, fontSize: font.size.sm, lineHeight: font.leading.relaxed }}>
                    {it.b}
                  </p>
                </article>
              ))}
            </div>
          </Container>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ ARCHITECTURE ═══ */}
        <section style={{ paddingBlock: space[12] }}>
          <Container size="xl">
            <p style={kickerStyleMuted}>{t.archKicker}</p>
            <h2 style={sectionHeading}>{t.archH}</h2>
            <p style={sectionSub}>{t.archBody}</p>
            <div
              style={{
                marginBlockStart: space[8],
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: space[4],
              }}
            >
              {t.archItems.map((it) => (
                <article key={it.n} style={cardStyle}>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: cssVar.fontMono,
                      fontSize: 10,
                      fontWeight: font.weight.bold,
                      letterSpacing: "0.26em",
                      color: bioSignal.phosphorCyanInk,
                      textTransform: "uppercase",
                    }}
                  >
                    {it.n}
                  </p>
                  <h3 style={{ margin: 0, fontSize: font.size.lg, fontWeight: font.weight.bold, color: cssVar.text, letterSpacing: "-0.01em" }}>
                    {it.t}
                  </h3>
                  <p style={{ margin: 0, color: cssVar.textMuted, fontSize: font.size.sm, lineHeight: font.leading.relaxed }}>
                    {it.b}
                  </p>
                </article>
              ))}
            </div>
          </Container>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ CAPABILITY TABLE ═══ */}
        <section style={{ paddingBlock: space[12] }}>
          <Container size="xl">
            <p style={kickerStyle}>{t.tableKicker}</p>
            <h2 style={sectionHeading}>{t.tableH}</h2>
            <p style={sectionSub}>{t.tableBody}</p>
            <div className="bi-roi-peer-table-wrap" style={{ marginBlockStart: space[8] }}>
              <table className="bi-roi-peer-table">
                <thead>
                  <tr>
                    <th>{t.tableHeaderFeature}</th>
                    <th>{t.tableHeaderHs}</th>
                    <th>{t.tableHeaderBi}</th>
                  </tr>
                </thead>
                <tbody>
                  {t.tableRows.map((r) => (
                    <tr key={r.f}>
                      <td>
                        <span className="bi-roi-peer-label">{r.f}</span>
                      </td>
                      <td style={{ color: r.hs === "—" ? cssVar.textMuted : cssVar.text, fontSize: font.size.sm, lineHeight: font.leading.relaxed }}>
                        {r.hs}
                      </td>
                      <td style={{ color: r.bi === "—" ? cssVar.textMuted : cssVar.text, fontSize: font.size.sm, lineHeight: font.leading.relaxed, fontWeight: r.bi === "—" ? font.weight.normal : font.weight.medium }}>
                        {r.bi}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p
              style={{
                margin: `${space[4]}px 0 0`,
                fontFamily: cssVar.fontMono,
                fontSize: font.size.xs,
                color: cssVar.textMuted,
                letterSpacing: "0.04em",
              }}
            >
              {t.tableFootnote}
            </p>
          </Container>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ PHILOSOPHY SIDE BY SIDE ═══ */}
        <section style={{ paddingBlock: space[12] }}>
          <Container size="xl">
            <p style={kickerStyleMuted}>{t.philoKicker}</p>
            <h2 style={sectionHeading}>{t.philoH}</h2>
            <p style={sectionSub}>{t.philoBody}</p>
            <div
              style={{
                marginBlockStart: space[8],
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: space[4],
              }}
            >
              {[t.philoCols.hs, t.philoCols.bi].map((col, idx) => (
                <article
                  key={col.header}
                  style={{
                    ...cardStyle,
                    borderColor: idx === 1 ? bioSignal.phosphorCyanInk + "55" : cssVar.border,
                    background: idx === 1 ? cssVar.surface : cssVar.surface2,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontFamily: cssVar.fontMono,
                      fontSize: 10,
                      fontWeight: font.weight.bold,
                      letterSpacing: "0.24em",
                      color: idx === 1 ? bioSignal.phosphorCyanInk : cssVar.textMuted,
                      textTransform: "uppercase",
                    }}
                  >
                    {col.tag}
                  </p>
                  <h3 style={{ margin: 0, fontSize: font.size.xl, fontWeight: font.weight.black, color: cssVar.text, letterSpacing: "-0.015em" }}>
                    {col.header}
                  </h3>
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: `${space[2]}px 0 0`,
                      display: "grid",
                      gap: space[2],
                    }}
                  >
                    {col.bullets.map((b) => (
                      <li
                        key={b}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: space[2],
                          color: cssVar.text,
                          fontSize: font.size.sm,
                          lineHeight: font.leading.relaxed,
                        }}
                      >
                        <span
                          aria-hidden
                          style={{
                            color: idx === 1 ? bioSignal.phosphorCyan : cssVar.textMuted,
                            fontFamily: cssVar.fontMono,
                            fontWeight: font.weight.bold,
                            flexShrink: 0,
                          }}
                        >
                          ▸
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </Container>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ FAQ ═══ */}
        <section style={{ paddingBlock: space[12] }}>
          <Container size="xl">
            <p style={kickerStyle}>{t.faqKicker}</p>
            <h2 style={sectionHeading}>{t.faqH}</h2>
            <div
              style={{
                marginBlockStart: space[8],
                display: "grid",
                gap: space[3],
                maxWidth: "72ch",
              }}
            >
              {t.faq.map((f) => (
                <details
                  key={f.q}
                  className="bi-pricing-legal"
                  style={{
                    border: `1px solid ${cssVar.border}`,
                    borderRadius: radius.xl,
                    padding: `${space[4]}px ${space[5]}px`,
                    background: cssVar.surface,
                  }}
                >
                  <summary
                    style={{
                      cursor: "pointer",
                      fontSize: font.size.base,
                      fontWeight: font.weight.bold,
                      color: cssVar.text,
                      letterSpacing: "-0.01em",
                      listStyle: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: space[3],
                    }}
                  >
                    <span>{f.q}</span>
                    <span className="bi-pricing-legal-hint" aria-hidden>
                      <span className="chev">▾</span>
                    </span>
                  </summary>
                  <p
                    style={{
                      margin: `${space[3]}px 0 0`,
                      color: cssVar.textMuted,
                      fontSize: font.size.sm,
                      lineHeight: font.leading.relaxed,
                    }}
                  >
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </Container>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ CLOSING ═══ */}
        <section style={{ paddingBlock: `${space[12]}px ${space[16]}px` }}>
          <Container size="xl">
            <p style={kickerStyle}>{t.closingKicker}</p>
            <h2 style={{ ...sectionHeading, fontSize: "clamp(28px, 4.4vw, 48px)" }}>
              {t.closingHLead}
              <br />
              <span style={{ color: bioSignal.phosphorCyanInk }}>{t.closingHBody}</span>
            </h2>
            <p style={sectionSub}>{t.closingBody}</p>
            <div style={{ marginBlockStart: space[8], display: "flex", flexWrap: "wrap", gap: space[3] }}>
              <Link href="/demo" className="bi-demo-closing-primary">{t.closingPrimary}</Link>
              <Link href="/roi-calculator" className="bi-demo-closing-secondary">{t.closingSecondary}</Link>
              <Link href="/trust" className="bi-demo-closing-secondary">{t.closingTertiary}</Link>
            </div>
            <p
              style={{
                margin: `${space[6]}px 0 0`,
                fontFamily: cssVar.fontMono,
                fontSize: font.size.xs,
                color: cssVar.textMuted,
                letterSpacing: "0.08em",
              }}
            >
              {t.lastReviewed} · {LAST_REVIEWED}
            </p>
          </Container>
        </section>

        {/* ═══ SOURCES ═══ */}
        <section style={{ paddingBlockEnd: space[12] }}>
          <Container size="xl">
            <p style={kickerStyleMuted}>{t.sourcesKicker}</p>
            <h2 style={{ ...sectionHeading, fontSize: "clamp(20px, 2.4vw, 26px)" }}>{t.sourcesH}</h2>
            <p style={sectionSub}>{t.sourcesBody}</p>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: `${space[5]}px 0 0`,
                display: "grid",
                gap: space[2],
              }}
            >
              {t.sources.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "var(--bi-link, var(--bi-accent))",
                      fontSize: font.size.sm,
                      textDecoration: "underline",
                      textUnderlineOffset: "3px",
                      fontFamily: cssVar.fontMono,
                    }}
                  >
                    {s.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        {/* ═══ DISCLAIMER ═══ */}
        <section style={{ paddingBlockEnd: space[16] }}>
          <Container size="xl">
            <aside className="bi-legal-callout bi-legal-callout--info" style={{ marginBlockStart: 0 }}>
              <div className="bi-legal-callout-kicker">{t.disclaimerH}</div>
              <p style={{ margin: `${space[2]}px 0 0`, color: cssVar.textMuted, fontSize: font.size.xs, lineHeight: font.leading.relaxed }}>
                {t.disclaimer1}
              </p>
              <p style={{ margin: `${space[2]}px 0 0`, color: cssVar.textMuted, fontSize: font.size.xs, lineHeight: font.leading.relaxed }}>
                {t.disclaimer2}
              </p>
              <p style={{ margin: `${space[2]}px 0 0`, color: cssVar.textMuted, fontSize: font.size.xs, lineHeight: font.leading.relaxed }}>
                {t.disclaimer3}
              </p>
            </aside>
          </Container>
        </section>
      </main>
    </PublicShell>
  );
}
