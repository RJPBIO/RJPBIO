/* ═══════════════════════════════════════════════════════════════
   /vs/headspace — Comparison vs Headspace for Work.
   Honest, verifiable, editorial. Architecture over marketing.
   Where Headspace wins, we say so first. Where we differ, we
   cite public information published by the competitor.
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
  title: "BIO-IGNICIÓN vs Headspace for Work",
  description:
    "Comparación honesta con información pública. Headspace es una librería de contenido de meditación; BIO-IGNICIÓN es un instrumento de medición neural. Dónde gana cada uno, cuándo elegir cuál.",
  alternates: { canonical: "/vs/headspace" },
  openGraph: {
    title: "BIO-IGNICIÓN vs Headspace for Work",
    description: "Librería de contenido vs instrumento de medición. Verificable, sin FUD.",
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
    eyebrow: "BIO-IGNICIÓN · vs · HEADSPACE FOR WORK",
    title: "Headspace es una librería. BIO-IGNICIÓN es un instrumento.",
    editorial:
      "Los dos caben en el presupuesto de bienestar corporativo. Pero resuelven problemas distintos, cobran razones distintas, y miden cosas distintas. Acá tienes la diferencia sin adornos.",

    tldrKicker: "TL;DR · 30 SEGUNDOS",
    tldrRows: [
      {
        k: "Modelo",
        hs: "Librería de contenido (miles de meditaciones guiadas, sleepcasts, focus music).",
        bi: "Instrumento (lee HRV, ejecuta protocolo sensorial, mide delta por sesión).",
      },
      {
        k: "Medición",
        hs: "Engagement: minutos escuchados, rachas, adherencia a la app.",
        bi: "Fisiología: HRV (RMSSD, SDNN), coherencia respiratoria, baseline neural composite.",
      },
      {
        k: "Duración típica",
        hs: "10–20 min por sesión guiada.",
        bi: "2–3 min pre-shift · 10 min NSDR profundo.",
      },
      {
        k: "Postura de datos",
        hs: "SaaS centralizado. Datos de uso en sus servidores.",
        bi: "Local-first. Señal fisiológica en el dispositivo (IndexedDB cifrado). Servidor recibe agregados k-anónimos ≥ 5.",
      },
      {
        k: "Compliance mapeado",
        hs: "SOC 2, HIPAA BAA (confirmado por Headspace en su trust center).",
        bi: "SOC 2 (postura activa), ISO 27001/45001 (gap analysis), GDPR Recital 26, NOM-035 STPS · export ECO37, HIPAA-ready + BAA.",
      },
    ],

    whenHsKicker: "CUÁNDO ELEGIR HEADSPACE",
    whenHsH: "Tres escenarios donde ellos ganan. Lo decimos primero.",
    whenHsBody:
      "Headspace es un producto maduro con 10+ años de catálogo. Hay casos donde es la decisión correcta — y acá los listamos antes que los nuestros.",
    whenHsItems: [
      {
        t: "Necesitas volumen de contenido de mindfulness.",
        b: "Miles de sesiones guiadas, instructores reconocidos, catálogo infantil, sleepcasts con celebridades. Si el ROI buscado es 'mi empleado abre una app y escucha algo', Headspace lo hace mejor. Nosotros tenemos 20 protocolos — no competimos en volumen de meditación.",
      },
      {
        t: "Tu empresa ya tiene EAP y quieres añadir coaching + terapia.",
        b: "Headspace Health integra coaching de bienestar y terapia licenciada (vía su adquisición de Ginger). Es el stack para organizaciones que quieren 'app + humano' bajo una sola factura. Nosotros no ofrecemos coaching ni terapia — complementamos a Lyra/Spring, no a Headspace Health.",
      },
      {
        t: "Presupuesto wellness < $100 por empleado / año.",
        b: "El per-seat de un catálogo de contenido es mucho menor que el de un instrumento medible. Si el mandato es 'da algo a todo el mundo al mínimo precio', Headspace es el vehículo adecuado. BIO-IGNICIÓN cobra más porque mide, firma NOM-035, y retiene seat-por-seat.",
      },
    ],

    whenBiKicker: "CUÁNDO ELEGIR BIO-IGNICIÓN",
    whenBiH: "Tres escenarios donde nosotros resolvemos lo que ellos no.",
    whenBiBody:
      "Si tu consejo pide evidencia fisiológica reportable, si operas bajo NOM-035 con auditoría activa, o si tu industria es alto riesgo — el estándar cambia.",
    whenBiItems: [
      {
        t: "Tu consejo exige outcome fisiológico reportable.",
        b: "ISSB S1/S2, SASB, o tu D&O te piden una métrica de bienestar defendible. 'Adoptamos Headspace' no pasa el escrutinio; 'baseline neural +7 puntos en 12 semanas, CSV firmado por clinical lead' sí. Nuestro reporte está diseñado para un board deck de 1 slide.",
      },
      {
        t: "Operas bajo NOM-035 STPS con auditoría activa.",
        b: "México 2026: de cumplimiento documental a inspector presencial. El export ECO37 + Guía III sale nativo de BIO-IGNICIÓN. Headspace for Work está construido sobre estándares US — no tiene el mapping regulatorio mexicano y no firma en español sobre el framework laboral local.",
      },
      {
        t: "Necesitas evidencia seat-por-seat, no engagement de app.",
        b: "Medimos HRV fisiológico (no minutos de uso) y reportamos delta por asiento activo. Si un seat no mueve el marcador en 90 días, no te cobramos ese asiento. Headspace cobra por licencia asignada independiente del uso — modelo de librería, no de instrumento.",
      },
    ],

    archKicker: "ARQUITECTURA · LA DIFERENCIA PROFUNDA",
    archH: "Tres decisiones de producto. Lo demás se deriva.",
    archBody:
      "Las comparaciones feature-por-feature se vuelven viejas en 6 meses. Estas tres diferencias son estructurales — no van a cambiar con un release.",
    archItems: [
      {
        n: "01",
        t: "Librería vs instrumento.",
        b: "Headspace cataloga contenido pre-grabado; el usuario elige qué consumir. BIO-IGNICIÓN lee señal fisiológica en vivo y ejecuta un protocolo que se ajusta a esa señal. El contenido estático escala con volumen; el instrumento escala con precisión.",
      },
      {
        n: "02",
        t: "SaaS central vs local-first.",
        b: "Headspace almacena uso y preferencias en sus servidores. BIO-IGNICIÓN guarda la señal fisiológica del empleado en IndexedDB cifrado en su propio dispositivo. El servidor recibe únicamente agregados k-anónimos ≥ 5. GDPR Recital 26 sin fricción.",
      },
      {
        n: "03",
        t: "Engagement vs outcome.",
        b: "Headspace optimiza adherencia a la app (DAU, minutos/día, racha) — métrica apropiada para librería. BIO-IGNICIÓN optimiza delta por asiento activo — métrica apropiada para instrumento. Son ortogonales: uno mide consumo, el otro mide fisiología.",
      },
    ],

    tableKicker: "PARIDAD DE CAPACIDAD",
    tableH: "Capacidad a capacidad, sin adornos.",
    tableBody:
      "Información pública verificable en ambos lados. Dónde no tenemos algo, ponemos '—'. Donde ellos no lo tienen, también. Fecha de revisión al final.",
    tableHeaderFeature: "Capacidad",
    tableHeaderHs: "Headspace for Work",
    tableHeaderBi: "BIO-IGNICIÓN",
    tableFootnote:
      "Información de Headspace obtenida de headspace.com, Headspace Trust Center y material corporativo publicado. Revisada: 2026-04-22.",
    tableRows: [
      { f: "Catálogo de meditación guiada", hs: "Miles de sesiones", bi: "—" },
      { f: "Sleepcasts / focus music", hs: "Catálogo extenso", bi: "—" },
      { f: "Coaching + terapia licenciada", hs: "Vía Headspace Health (post-Ginger)", bi: "— (complementamos EAP)" },
      { f: "HRV fisiológico (RMSSD + SDNN)", hs: "—", bi: "Nativo · Apple Health, Fitbit, Garmin, Oura" },
      { f: "Protocolo binaural + haptics + voz", hs: "—", bi: "Sincronizado al ms · wake-lock incluido" },
      { f: "Baseline neural composite (0–100)", hs: "—", bi: "Calculado · delta semanal + trimestral" },
      { f: "Local-first · cifrado en dispositivo", hs: "—", bi: "IndexedDB cifrado AES-GCM" },
      { f: "Agregados k-anónimos ≥ 5", hs: "—", bi: "Default · sin nombres, sin crudo" },
      { f: "NOM-035 STPS · export ECO37", hs: "—", bi: "Nativo · firma RH en PDF" },
      { f: "SOC 2", hs: "Type II (publicado en su trust center)", bi: "Postura activa · Type I en 2026" },
      { f: "HIPAA · BAA firmable", hs: "Disponible (Headspace Health)", bi: "Disponible (Enterprise)" },
      { f: "GDPR Recital 26 (datos disociados)", hs: "No declarado explícitamente", bi: "Arquitectura nativa" },
      { f: "SSO · SAML 2.0 + SCIM 2.0", hs: "Disponible Enterprise", bi: "Disponible Enterprise" },
      { f: "Integración Slack + Calendar", hs: "Sí", bi: "Sí" },
      { f: "CFDI 4.0 (facturación México)", hs: "—", bi: "Todos los planes" },
    ],

    philoKicker: "FILOSOFÍA · LADO A LADO",
    philoH: "No es mejor o peor. Es distinto.",
    philoBody:
      "Cada columna respeta la tesis del otro. Headspace está haciendo lo correcto para su modelo; nosotros para el nuestro. La pregunta es cuál encaja en tu operación.",
    philoCols: {
      hs: {
        header: "Headspace for Work",
        tag: "LIBRERÍA · B2B CONTENT",
        bullets: [
          "Pre-graba contenido de alta calidad y lo sirve a miles.",
          "Optimiza adherencia: minutos escuchados, rachas, catálogo explorado.",
          "Modelo probado: 10+ años de marca, catálogo masivo, instructores reconocidos.",
          "Cobra por licencia asignada · escalable a empresas grandes sin fricción.",
          "Añade coaching + terapia vía Headspace Health para cerrar loop clínico.",
        ],
      },
      bi: {
        header: "BIO-IGNICIÓN",
        tag: "INSTRUMENTO · B2B NEURAL",
        bullets: [
          "Lee señal fisiológica del empleado, ejecuta protocolo, mide delta.",
          "Optimiza outcome: HRV, coherencia respiratoria, baseline neural composite.",
          "Modelo joven: enfocado en medición verificable y compliance activo.",
          "Cobra por asiento activo · adoption-guarantee documentado en MSA.",
          "Complementa EAP + wearable existentes — no los reemplaza.",
        ],
      },
    },

    faqKicker: "PREGUNTAS HONESTAS",
    faqH: "Lo que aparece en la call de due diligence.",
    faq: [
      {
        q: "¿Puedo usar los dos?",
        a: "Sí, y varios pilotos lo hacen. Headspace para el contenido genérico accesible; BIO-IGNICIÓN como pre-shift medible en roles críticos. La compatibilidad es obvia: Headspace consume minutos de atención del empleado, nosotros consumimos 3 minutos pre-turno. No compiten por ventana horaria.",
      },
      {
        q: "¿Headspace no tiene también medición?",
        a: "Headspace reporta engagement con la app (minutos, rachas, catálogo explorado). Eso es medición de consumo, no de fisiología. Nosotros reportamos HRV RMSSD + SDNN, coherencia respiratoria, y delta neural por sesión. Dos cosas distintas — ambas tienen su lugar, dependiendo del mandato del consejo.",
      },
      {
        q: "¿Por qué cuestan más si tienen menos contenido?",
        a: "Porque vendemos cosas distintas. Una librería de contenido escala marginal-cero: el costo de agregar un usuario es casi cero. Un instrumento medible con compliance activo no escala marginal-cero — cada seat implica reporte fisiológico, export auditado, y firma NOM-035. Precio refleja arquitectura.",
      },
      {
        q: "¿Su catálogo clínico no pesa más que su medición?",
        a: "En algunos mandatos sí, en otros no. Si tu consejo prioriza 'acceso escalable a contenido wellness', Headspace Health es más completo que nosotros. Si prioriza 'evidencia fisiológica reportable con compliance activo', la balanza se mueve. Te lo decimos en la demo, con tu caso específico.",
      },
      {
        q: "¿Tienen tantos estudios clínicos publicados como Headspace?",
        a: "No. Headspace tiene un catálogo de ensayos clínicos sobre su propia app (décadas de publicación). Nosotros citamos la literatura subyacente sobre HRV (Lehrer & Gevirtz 2014), suspiro fisiológico (Balban et al. 2023), y coherencia cardíaca (Shaffer 2017) — pero los estudios son sobre el mecanismo, no sobre nuestra app específica. Somos honestos: primera cohorte piloto Q2 2026, dossier auditable en septiembre.",
      },
    ],

    closingKicker: "DECISIÓN",
    closingHLead: "Si el mandato es acceso a contenido wellness: Headspace.",
    closingHBody: "Si el mandato es medir y reportar fisiología operativa: nosotros.",
    closingBody:
      "La mayoría de organizaciones top-global que hablamos en Q1 2026 terminan con los dos — catálogo masivo para escala, instrumento medible para roles críticos. No es un versus; es un stack.",
    closingPrimary: "Reservar demo · caso específico",
    closingSecondary: "Ver ROI en tu operación",
    closingTertiary: "Trust Center · due diligence",
    lastReviewed: "Última revisión",

    sourcesKicker: "FUENTES · INFORMACIÓN PÚBLICA",
    sourcesH: "De dónde sacamos lo que dijimos.",
    sourcesBody:
      "Toda referencia a Headspace proviene de material publicado por Headspace Inc. o Headspace Health en sus dominios oficiales. Si detectas un claim desactualizado, escríbenos y corregimos en < 30 días.",
    sources: [
      { label: "Headspace · sitio oficial", url: "https://www.headspace.com/" },
      { label: "Headspace for Work", url: "https://www.headspace.com/work" },
      { label: "Headspace Trust Center", url: "https://www.headspace.com/trust" },
      { label: "Headspace Health (coaching + therapy)", url: "https://www.headspacehealth.com/" },
    ],

    disclaimerH: "Nota legal · lectura en 45 s",
    disclaimer1:
      "Headspace, Headspace for Work y Headspace Health son marcas registradas de Headspace Inc. y/o sus afiliadas. Su uso en esta página es nominativo con fin de comparación editorial — no implica endorsement, afiliación, sociedad ni subordinación comercial con BIO-IGNICIÓN.",
    disclaimer2:
      "BIO-IGNICIÓN es una herramienta de bienestar operativo basada en HRV · NO está autorizada como dispositivo médico por FDA, COFEPRIS, CE, ANMAT, ANVISA ni Health Canada · NO diagnostica, NO trata ni previene condiciones médicas · NO sustituye evaluación clínica ni psiquiátrica.",
    disclaimer3:
      "La información de Headspace fue tomada de sus dominios oficiales con fecha de revisión indicada en la página. Headspace puede cambiar políticas, pricing o feature-set sin previo aviso. Esta comparación se revisa trimestralmente — si necesitas validación en tiempo real, consulta headspace.com/work directamente.",
  },

  en: {
    eyebrow: "BIO-IGNITION · vs · HEADSPACE FOR WORK",
    title: "Headspace is a library. BIO-IGNITION is an instrument.",
    editorial:
      "Both fit inside the corporate wellness budget. But they solve different problems, charge for different reasons, and measure different things. Here's the difference without ornament.",

    tldrKicker: "TL;DR · 30 SECONDS",
    tldrRows: [
      {
        k: "Model",
        hs: "Content library (thousands of guided meditations, sleepcasts, focus music).",
        bi: "Instrument (reads HRV, runs sensory protocol, measures per-session delta).",
      },
      {
        k: "Measurement",
        hs: "Engagement: listened minutes, streaks, app adherence.",
        bi: "Physiology: HRV (RMSSD, SDNN), breathing coherence, neural baseline composite.",
      },
      {
        k: "Typical duration",
        hs: "10–20 min per guided session.",
        bi: "2–3 min pre-shift · 10 min deep NSDR.",
      },
      {
        k: "Data posture",
        hs: "Centralized SaaS. Usage data on their servers.",
        bi: "Local-first. Physiological signal on device (encrypted IndexedDB). Server receives only k-anonymous aggregates ≥ 5.",
      },
      {
        k: "Mapped compliance",
        hs: "SOC 2, HIPAA BAA (per Headspace trust center).",
        bi: "SOC 2 (active posture), ISO 27001/45001 (gap analysis), GDPR Recital 26, NOM-035 STPS · ECO37 export, HIPAA-ready + BAA.",
      },
    ],

    whenHsKicker: "WHEN TO CHOOSE HEADSPACE",
    whenHsH: "Three scenarios where they win. We say so first.",
    whenHsBody:
      "Headspace is a mature product with 10+ years of catalog. There are cases where it's the right call — and we list them before our own.",
    whenHsItems: [
      {
        t: "You need volume of mindfulness content.",
        b: "Thousands of guided sessions, recognized instructors, kids library, sleepcasts with celebrities. If the ROI you're chasing is 'my employee opens an app and listens to something,' Headspace does that better. We have 20 protocols — we don't compete on meditation volume.",
      },
      {
        t: "You have EAP already and want to add coaching + therapy.",
        b: "Headspace Health integrates wellness coaching and licensed therapy (via the Ginger acquisition). It's the stack for orgs that want 'app + human' on a single invoice. We don't offer coaching or therapy — we complement Lyra/Spring, not Headspace Health.",
      },
      {
        t: "Wellness budget < $100 per employee / year.",
        b: "Per-seat on a content catalog is much lower than on a measurable instrument. If the mandate is 'give something to everyone at minimum price,' Headspace is the right vehicle. BIO-IGNITION charges more because it measures, signs NOM-035, and retains seat-by-seat.",
      },
    ],

    whenBiKicker: "WHEN TO CHOOSE BIO-IGNITION",
    whenBiH: "Three scenarios where we solve what they don't.",
    whenBiBody:
      "If your board demands reportable physiological evidence, if you operate under NOM-035 with active audit, or if your industry is high-risk — the standard shifts.",
    whenBiItems: [
      {
        t: "Your board demands reportable physiological outcome.",
        b: "ISSB S1/S2, SASB, or D&O ask for a defensible wellness metric. 'We adopted Headspace' doesn't pass scrutiny; 'neural baseline +7 pts over 12 weeks, CSV signed by clinical lead' does. Our report is designed for a 1-slide board deck.",
      },
      {
        t: "You operate under NOM-035 STPS with active audit.",
        b: "Mexico 2026: from paper compliance to on-site inspector. ECO37 + Guide III export ships natively from BIO-IGNITION. Headspace for Work is built on US standards — no Mexican regulatory mapping and doesn't sign under the local labor framework.",
      },
      {
        t: "You need seat-by-seat evidence, not app engagement.",
        b: "We measure physiological HRV (not minutes of use) and report delta per active seat. If a seat doesn't move the needle in 90 days, we don't charge for it. Headspace charges per assigned license independent of usage — library model, not instrument.",
      },
    ],

    archKicker: "ARCHITECTURE · THE DEEP DIFFERENCE",
    archH: "Three product decisions. Everything else derives.",
    archBody:
      "Feature-by-feature comparisons get stale in 6 months. These three differences are structural — they won't change with a release.",
    archItems: [
      {
        n: "01",
        t: "Library vs instrument.",
        b: "Headspace catalogs pre-recorded content; the user picks what to consume. BIO-IGNITION reads live physiological signal and runs a protocol that adjusts to that signal. Static content scales with volume; the instrument scales with precision.",
      },
      {
        n: "02",
        t: "Central SaaS vs local-first.",
        b: "Headspace stores usage and preferences on their servers. BIO-IGNITION stores the employee's physiological signal in encrypted IndexedDB on their own device. The server only receives k-anonymous aggregates ≥ 5. GDPR Recital 26 without friction.",
      },
      {
        n: "03",
        t: "Engagement vs outcome.",
        b: "Headspace optimizes for app adherence (DAU, min/day, streak) — appropriate metric for a library. BIO-IGNITION optimizes for delta per active seat — appropriate metric for an instrument. They're orthogonal: one measures consumption, the other measures physiology.",
      },
    ],

    tableKicker: "CAPABILITY PARITY",
    tableH: "Capability by capability, without ornament.",
    tableBody:
      "Verifiable public information on both sides. Where we don't have something, we put '—'. Where they don't, same. Review date at the bottom.",
    tableHeaderFeature: "Capability",
    tableHeaderHs: "Headspace for Work",
    tableHeaderBi: "BIO-IGNITION",
    tableFootnote:
      "Headspace information from headspace.com, Headspace Trust Center and published corporate materials. Reviewed: 2026-04-22.",
    tableRows: [
      { f: "Guided meditation catalog", hs: "Thousands of sessions", bi: "—" },
      { f: "Sleepcasts / focus music", hs: "Extensive catalog", bi: "—" },
      { f: "Licensed coaching + therapy", hs: "Via Headspace Health (post-Ginger)", bi: "— (we complement EAP)" },
      { f: "Physiological HRV (RMSSD + SDNN)", hs: "—", bi: "Native · Apple Health, Fitbit, Garmin, Oura" },
      { f: "Binaural + haptics + voice protocol", hs: "—", bi: "Ms-synced · wake-lock included" },
      { f: "Neural baseline composite (0–100)", hs: "—", bi: "Computed · weekly + quarterly delta" },
      { f: "Local-first · encrypted on device", hs: "—", bi: "AES-GCM encrypted IndexedDB" },
      { f: "K-anonymous aggregates ≥ 5", hs: "—", bi: "Default · no names, no raw data" },
      { f: "NOM-035 STPS · ECO37 export", hs: "—", bi: "Native · HR signs PDF" },
      { f: "SOC 2", hs: "Type II (per their trust center)", bi: "Active posture · Type I in 2026" },
      { f: "HIPAA · signable BAA", hs: "Available (Headspace Health)", bi: "Available (Enterprise)" },
      { f: "GDPR Recital 26 (disassociated data)", hs: "Not explicitly declared", bi: "Native architecture" },
      { f: "SSO · SAML 2.0 + SCIM 2.0", hs: "Enterprise available", bi: "Enterprise available" },
      { f: "Slack + Calendar integration", hs: "Yes", bi: "Yes" },
      { f: "CFDI 4.0 (Mexico billing)", hs: "—", bi: "All plans" },
    ],

    philoKicker: "PHILOSOPHY · SIDE BY SIDE",
    philoH: "Not better or worse. Different.",
    philoBody:
      "Each column respects the other's thesis. Headspace is doing the right thing for their model; we for ours. The question is which fits your operation.",
    philoCols: {
      hs: {
        header: "Headspace for Work",
        tag: "LIBRARY · B2B CONTENT",
        bullets: [
          "Pre-records high-quality content and serves it to thousands.",
          "Optimizes adherence: minutes listened, streaks, catalog explored.",
          "Proven model: 10+ years of brand, massive catalog, known instructors.",
          "Charges per assigned license · scales to large enterprises without friction.",
          "Adds coaching + therapy via Headspace Health to close the clinical loop.",
        ],
      },
      bi: {
        header: "BIO-IGNITION",
        tag: "INSTRUMENT · B2B NEURAL",
        bullets: [
          "Reads employee physiological signal, runs protocol, measures delta.",
          "Optimizes outcome: HRV, breathing coherence, neural baseline composite.",
          "Young model: focused on verifiable measurement and active compliance.",
          "Charges per active seat · adoption-guarantee documented in MSA.",
          "Complements existing EAP + wearable — doesn't replace them.",
        ],
      },
    },

    faqKicker: "HONEST QUESTIONS",
    faqH: "What comes up on the due-diligence call.",
    faq: [
      {
        q: "Can I use both?",
        a: "Yes, and several pilots do. Headspace for accessible generic content; BIO-IGNITION as measurable pre-shift for critical roles. The compatibility is obvious: Headspace consumes employee attention minutes, we consume 3 min pre-shift. They don't compete for the same time window.",
      },
      {
        q: "Doesn't Headspace also have measurement?",
        a: "Headspace reports app engagement (minutes, streaks, catalog explored). That's consumption measurement, not physiology. We report HRV RMSSD + SDNN, breathing coherence, and per-session neural delta. Two different things — both have their place depending on board mandate.",
      },
      {
        q: "Why do you cost more if you have less content?",
        a: "Because we sell different things. A content library scales at marginal-zero: adding a user costs nearly nothing. A measurable instrument with active compliance doesn't scale at marginal-zero — every seat implies physiological reporting, audited export, and NOM-035 signature. Price reflects architecture.",
      },
      {
        q: "Doesn't their clinical catalog outweigh your measurement?",
        a: "In some mandates yes, in others no. If your board prioritizes 'scalable access to wellness content,' Headspace Health is more complete than we are. If it prioritizes 'reportable physiological evidence with active compliance,' the scale tips. We tell you during the demo, with your specific case.",
      },
      {
        q: "Do you have as many clinical studies as Headspace?",
        a: "No. Headspace has a catalog of clinical trials on their own app (decades of publication). We cite the underlying literature on HRV (Lehrer & Gevirtz 2014), physiological sigh (Balban et al. 2023), and cardiac coherence (Shaffer 2017) — but the studies are on the mechanism, not on our specific app. We're honest: first pilot cohort Q2 2026, auditable dossier in September.",
      },
    ],

    closingKicker: "DECISION",
    closingHLead: "If the mandate is access to wellness content: Headspace.",
    closingHBody: "If the mandate is to measure and report operational physiology: us.",
    closingBody:
      "Most top-global organizations we spoke with in Q1 2026 end up with both — massive catalog for scale, measurable instrument for critical roles. It's not a versus; it's a stack.",
    closingPrimary: "Book demo · specific case",
    closingSecondary: "See ROI on your operation",
    closingTertiary: "Trust Center · due diligence",
    lastReviewed: "Last reviewed",

    sourcesKicker: "SOURCES · PUBLIC INFORMATION",
    sourcesH: "Where what we said comes from.",
    sourcesBody:
      "Every reference to Headspace comes from material published by Headspace Inc. or Headspace Health on their official domains. If you spot a stale claim, write to us and we fix it in < 30 days.",
    sources: [
      { label: "Headspace · official site", url: "https://www.headspace.com/" },
      { label: "Headspace for Work", url: "https://www.headspace.com/work" },
      { label: "Headspace Trust Center", url: "https://www.headspace.com/trust" },
      { label: "Headspace Health (coaching + therapy)", url: "https://www.headspacehealth.com/" },
    ],

    disclaimerH: "Legal note · 45 s read",
    disclaimer1:
      "Headspace, Headspace for Work, and Headspace Health are registered trademarks of Headspace Inc. and/or its affiliates. Their use on this page is nominative for editorial comparison purposes — no endorsement, affiliation, partnership, or commercial subordination with BIO-IGNITION is implied.",
    disclaimer2:
      "BIO-IGNITION is an operational wellness tool based on HRV · NOT authorized as a medical device by FDA, COFEPRIS, CE, ANMAT, ANVISA, or Health Canada · does NOT diagnose, treat, or prevent medical conditions · does NOT substitute clinical or psychiatric evaluation.",
    disclaimer3:
      "Headspace information was taken from their official domains with the review date indicated on the page. Headspace may change policies, pricing, or feature-set without notice. This comparison is reviewed quarterly — if you need real-time validation, consult headspace.com/work directly.",
  },
};

export default async function VsHeadspacePage() {
  const locale = await getServerLocale();
  const t = COPY[locale === "en" ? "en" : "es"];

  return (
    <PublicShell activePath="/vs/headspace">
      <main id="main-content">
        {/* ═══ HERO ═══ */}
        <section style={{ position: "relative", overflow: "hidden", paddingBlock: `clamp(40px, 6vw, 72px) clamp(40px, 7vw, 80px)` }}>
          <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.55, maskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)" }}>
            <BioglyphLattice variant="ambient" />
          </div>
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

        {/* ═══ WHEN HEADSPACE ═══ */}
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
