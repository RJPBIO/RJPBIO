/* ═══════════════════════════════════════════════════════════════
   /vs/calm — Comparison vs Calm Business.
   Distinct angle from /vs/headspace: Calm is positioned around
   sleep + celebrity-voiced relaxation. We're pre-shift operational.
   Different time of day, different mandate.
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
  title: "BIO-IGNICIÓN vs Calm Business",
  description:
    "Comparación honesta con información pública. Calm termina tu día con Sleep Stories; BIO-IGNICIÓN empieza tu turno con un instrumento medible. Dónde gana cada uno, cuándo elegir cuál.",
  alternates: { canonical: "/vs/calm" },
  openGraph: {
    title: "BIO-IGNICIÓN vs Calm Business",
    description:
      "Sleep Stories vs pre-shift medible. Diferente hora del día, diferente mandato del consejo.",
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
    eyebrow: "BIO-IGNICIÓN · vs · CALM BUSINESS",
    title: "Calm termina tu día. BIO-IGNICIÓN empieza tu turno.",
    editorial:
      "Los dos entran en el presupuesto de bienestar — pero operan en ventanas opuestas del día del empleado y miden cosas distintas. Calm te manda a dormir con Matthew McConaughey. Nosotros te leemos el HRV antes de que operes la decisión.",

    tldrKicker: "TL;DR · 30 SEGUNDOS",
    tldrRows: [
      {
        k: "Ventana horaria",
        hs: "Evening/sleep · Sleep Stories, soundscapes, Daily Calm matutino.",
        bi: "Pre-shift · 3 min antes de operar (turno, cirugía, reunión crítica).",
      },
      {
        k: "Promesa principal",
        hs: "Relajación + dormir mejor vía contenido narrado por talento reconocido.",
        bi: "Baseline fisiológico medible — delta reportable por asiento activo.",
      },
      {
        k: "Medición",
        hs: "Engagement con la app: minutos escuchados, rachas, catálogo explorado.",
        bi: "HRV (RMSSD, SDNN), coherencia respiratoria, baseline neural composite.",
      },
      {
        k: "Postura de datos",
        hs: "SaaS centralizado. Datos de uso en sus servidores.",
        bi: "Local-first. Señal fisiológica en el dispositivo (IndexedDB cifrado). Servidor recibe agregados k-anónimos ≥ 5.",
      },
      {
        k: "Compliance mapeado",
        hs: "SOC 2, HIPAA BAA (confirmado por Calm en su trust center).",
        bi: "SOC 2 (postura activa), ISO 27001/45001 (gap analysis), GDPR Recital 26, NOM-035 STPS · export ECO37, HIPAA-ready + BAA.",
      },
    ],

    whenHsKicker: "CUÁNDO ELEGIR CALM",
    whenHsH: "Tres escenarios donde ellos ganan. Lo decimos primero.",
    whenHsBody:
      "Calm es un producto maduro construido sobre un diferenciador claro: sleep + celebrity voice. Si ese es el mandato, son mejores que nosotros — punto.",
    whenHsItems: [
      {
        t: "Tu mandato es 'mejor sueño en el equipo'.",
        b: "Calm Sleep Stories es la categoría. Matthew McConaughey, Cillian Murphy, Harry Styles — talento reconocido narrando contenido de 20–40 minutos para dormir. Nosotros no hacemos sleep content, ni lo planeamos. Si el CHRO quiere atacar insomnio o higiene de sueño, Calm es el vehículo.",
      },
      {
        t: "Necesitas cobertura family + kids.",
        b: "Calm Kids ofrece Sleep Stories infantiles, meditaciones para edades, y contenido familiar. Muchos programas de bienestar corporativo cubren dependientes — Calm lo hace nativo. Nosotros somos B2B puro adulto.",
      },
      {
        t: "Quieres talento celebrity como parte del package.",
        b: "La biblioteca de Calm incluye voces reconocidas globalmente como feature (no bug). Eso tiene valor de adopción — el empleado abre la app porque reconoce al narrador. Nosotros no vendemos celebrity; vendemos medición.",
      },
    ],

    whenBiKicker: "CUÁNDO ELEGIR BIO-IGNICIÓN",
    whenBiH: "Tres escenarios donde nosotros resolvemos lo que ellos no.",
    whenBiBody:
      "Si tu programa tiene que firmar NOM-035, reportar outcome fisiológico al consejo, o intervenir pre-turno en roles críticos — Calm no está construido para eso.",
    whenBiItems: [
      {
        t: "Turnos críticos · pre-shift operacional.",
        b: "Piloto, cirujano, operario de maquinaria, trader, controlador aéreo. 3 minutos antes del turno, con lectura HRV + protocolo sincronizado + registro auditable. Calm te da una Sleep Story de 25 min — no sirve antes del turno de 6 AM.",
      },
      {
        t: "Evidencia fisiológica reportable · NOM-035 + board deck.",
        b: "Tu compliance officer necesita firmar NOM-035 con evidencia medible. Tu consejo quiere una métrica de bienestar defendible ante ISSB S1/S2 y SASB. Calm reporta minutos escuchados; nosotros reportamos baseline neural composite + delta por asiento — CSV auditado firmado por clinical lead.",
      },
      {
        t: "Local-first por contrato · datos fisiológicos en dispositivo.",
        b: "Si tu legal review requiere que la señal fisiológica del empleado nunca salga del dispositivo, necesitas local-first nativo. Calm es SaaS centralizado con datos de uso en sus servidores. Nosotros guardamos la señal en IndexedDB cifrado AES-GCM — servidor recibe solo agregados k-anónimos ≥ 5.",
      },
    ],

    archKicker: "ARQUITECTURA · LA DIFERENCIA PROFUNDA",
    archH: "Tres decisiones estructurales. Lo demás se deriva.",
    archBody:
      "Igual que con Headspace, las diferencias no son feature-por-feature. Son decisiones de producto que separan 'librería de contenido' de 'instrumento fisiológico'.",
    archItems: [
      {
        n: "01",
        t: "Sleep content vs pre-shift instrument.",
        b: "Calm está construido sobre contenido pre-grabado optimizado para la ventana de dormir (Sleep Stories de 20–40 min). BIO-IGNICIÓN ejecuta un protocolo sincronizado en vivo de 2–3 min antes del turno. Ventanas horarias distintas, objetivos fisiológicos distintos.",
      },
      {
        n: "02",
        t: "SaaS central vs local-first.",
        b: "Calm almacena uso y preferencias en sus servidores — apropiado para servir un catálogo streamed. BIO-IGNICIÓN almacena la señal fisiológica del empleado en IndexedDB cifrado en su propio dispositivo. El servidor recibe únicamente agregados k-anónimos ≥ 5.",
      },
      {
        n: "03",
        t: "Celebrity voice vs measured outcome.",
        b: "Calm optimiza adopción vía talento reconocido — estrategia legítima para librería de contenido. BIO-IGNICIÓN optimiza outcome medible por asiento activo — estrategia legítima para instrumento. Son ortogonales: una cuenta minutos escuchados, la otra cuenta delta de HRV.",
      },
    ],

    tableKicker: "PARIDAD DE CAPACIDAD",
    tableH: "Capacidad a capacidad, sin adornos.",
    tableBody:
      "Información pública verificable en ambos lados. Dónde no tenemos algo, ponemos '—'. Donde ellos no lo tienen, también. Fecha de revisión al final.",
    tableHeaderFeature: "Capacidad",
    tableHeaderHs: "Calm Business",
    tableHeaderBi: "BIO-IGNICIÓN",
    tableFootnote:
      "Información de Calm obtenida de calm.com, calm.com/business, Calm Trust Center y material corporativo publicado. Revisada: 2026-04-22.",
    tableRows: [
      { f: "Sleep Stories (contenido celebrity)", hs: "Catálogo extenso · talento reconocido", bi: "—" },
      { f: "Daily Calm · Daily Jay · Daily Trip", hs: "Series diarias rotativas", bi: "—" },
      { f: "Calm Kids (contenido familiar)", hs: "Nativo", bi: "—" },
      { f: "Soundscapes + música", hs: "Catálogo extenso", bi: "— (binaural sí)" },
      { f: "Meditación guiada", hs: "Miles de sesiones", bi: "—" },
      { f: "HRV fisiológico (RMSSD + SDNN)", hs: "—", bi: "Nativo · Apple Health, Fitbit, Garmin, Oura" },
      { f: "Protocolo binaural + haptics + voz", hs: "—", bi: "Sincronizado al ms · wake-lock incluido" },
      { f: "Pre-shift operacional (2–3 min)", hs: "—", bi: "Protocolo canónico" },
      { f: "Baseline neural composite (0–100)", hs: "—", bi: "Calculado · delta semanal + trimestral" },
      { f: "Local-first · cifrado en dispositivo", hs: "—", bi: "IndexedDB cifrado AES-GCM" },
      { f: "Agregados k-anónimos ≥ 5", hs: "—", bi: "Default · sin nombres, sin crudo" },
      { f: "NOM-035 STPS · export ECO37", hs: "—", bi: "Nativo · firma RH en PDF" },
      { f: "SOC 2", hs: "Type II (publicado en su trust center)", bi: "Postura activa · Type I en 2026" },
      { f: "HIPAA · BAA firmable", hs: "Disponible (Calm Business Enterprise)", bi: "Disponible (Enterprise)" },
      { f: "GDPR Recital 26 (datos disociados)", hs: "No declarado explícitamente", bi: "Arquitectura nativa" },
      { f: "SSO · SAML 2.0 + SCIM 2.0", hs: "Disponible Enterprise", bi: "Disponible Enterprise" },
      { f: "CFDI 4.0 (facturación México)", hs: "—", bi: "Todos los planes" },
    ],

    philoKicker: "FILOSOFÍA · LADO A LADO",
    philoH: "No es mejor o peor. Es distinto.",
    philoBody:
      "Calm está haciendo lo correcto para su modelo: contenido narrado de alta producción para la ventana evening/sleep. Nosotros hacemos lo correcto para el nuestro: instrumento medible pre-shift. No compiten — coexisten.",
    philoCols: {
      hs: {
        header: "Calm Business",
        tag: "LIBRERÍA · SLEEP + RELAX",
        bullets: [
          "Produce contenido narrado con talento reconocido globalmente.",
          "Optimiza la ventana evening/sleep — Sleep Stories de 20–40 min.",
          "Catálogo maduro: Daily Calm, Daily Jay, Calm Kids, Music, Soundscapes.",
          "Modelo de subscripción B2B · scaling basado en licencias asignadas.",
          "Extensión a coaching + therapy vía sus adquisiciones en mental health.",
        ],
      },
      bi: {
        header: "BIO-IGNICIÓN",
        tag: "INSTRUMENTO · PRE-SHIFT",
        bullets: [
          "Lee HRV del empleado, ejecuta protocolo pre-shift, mide delta.",
          "Optimiza la ventana pre-turno — 2–3 min antes de operar.",
          "Catálogo enfocado: 17 protocolos con mecanismo citado en literatura.",
          "Modelo de seat activo · adoption-guarantee documentado en MSA.",
          "Complementa EAP + wearable + contenido (Calm/Headspace) — no los reemplaza.",
        ],
      },
    },

    faqKicker: "PREGUNTAS HONESTAS",
    faqH: "Lo que aparece en la call de due diligence.",
    faq: [
      {
        q: "¿Puedo usar Calm + BIO-IGNICIÓN?",
        a: "Sí — y es la combinación obvia. Calm cubre la ventana evening/sleep; nosotros cubrimos pre-shift. No compiten por hora del día ni por duración. Varios pilotos operativos usan Calm para higiene de sueño general y BIO-IGNICIÓN para los roles críticos que necesitan baseline medible antes del turno.",
      },
      {
        q: "¿Por qué no hacen Sleep Stories ustedes también?",
        a: "Porque ese no es nuestro mandato — y porque Calm lo hace mejor. Agregar contenido narrado celebrity es una decisión de producto que nos saca de ser instrumento medible. Preferimos quedarnos en nuestro lane: leer HRV, ejecutar protocolo breve, reportar delta. Si tu empleado necesita dormirse con una Sleep Story, abre Calm — la experiencia está resuelta.",
      },
      {
        q: "¿Calm no tiene también coaching y terapia?",
        a: "Sí, vía acquisiciones en el espacio de salud mental. Eso los mueve hacia la categoría de Lyra/Spring/Modern Health. Nosotros no somos eso. Si tu mandato es terapia escalable, Calm Business puede ser un vehículo — y complementamos con pre-shift fisiológico en paralelo.",
      },
      {
        q: "¿Su engagement B2C no los hace mejor producto enterprise también?",
        a: "Engagement B2C (mil millones de minutos al año en Calm) no se traduce automáticamente a outcome operacional. Es lo mismo que dijimos con Headspace: minutos escuchados ≠ baseline fisiológico. Ambas métricas son válidas para mandatos distintos. Si tu consejo pide la primera, Calm gana; si pide la segunda, nosotros.",
      },
      {
        q: "¿Tienen el catálogo de talento famoso que tiene Calm?",
        a: "No. Y no vamos a tenerlo. Nuestro protocolo está narrado por voz neutra de instrumento — diseñado para operar en 3 min pre-shift, no para entretener 25 min pre-sueño. Son decisiones de producto opuestas. Si celebrity voice es un must-have, Calm es la respuesta.",
      },
    ],

    closingKicker: "DECISIÓN",
    closingHLead: "Si la ventana es evening/sleep con contenido celebrity: Calm.",
    closingHBody: "Si la ventana es pre-shift con evidencia medible: nosotros.",
    closingBody:
      "La mayoría de operaciones top-global que entrevistamos en Q1 2026 terminan con los dos — Calm/Headspace como cobertura general de contenido wellness, BIO-IGNICIÓN como instrumento medible para roles críticos. No es versus; es un stack coherente en dos ventanas horarias.",
    closingPrimary: "Reservar demo · caso específico",
    closingSecondary: "Ver ROI en tu operación",
    closingTertiary: "Trust Center · due diligence",
    lastReviewed: "Última revisión",

    sourcesKicker: "FUENTES · INFORMACIÓN PÚBLICA",
    sourcesH: "De dónde sacamos lo que dijimos.",
    sourcesBody:
      "Toda referencia a Calm proviene de material publicado por Calm.com Inc. en sus dominios oficiales. Si detectas un claim desactualizado, escríbenos y corregimos en < 30 días.",
    sources: [
      { label: "Calm · sitio oficial", url: "https://www.calm.com/" },
      { label: "Calm Business", url: "https://business.calm.com/" },
      { label: "Calm Trust Center", url: "https://www.calm.com/trust" },
      { label: "Calm Sleep Stories (landing)", url: "https://www.calm.com/sleep-stories" },
    ],

    disclaimerH: "Nota legal · lectura en 45 s",
    disclaimer1:
      "Calm, Calm Business, Sleep Stories, Daily Calm, Calm Kids son marcas registradas de Calm.com Inc. y/o sus afiliadas. Los nombres de talento mencionado (Matthew McConaughey, Cillian Murphy, Harry Styles) se usan bajo doctrina de uso nominativo justo con fin de identificar contenido público de Calm — no implica endorsement, afiliación ni subordinación comercial con BIO-IGNICIÓN por parte de las personas mencionadas.",
    disclaimer2:
      "BIO-IGNICIÓN es una herramienta de bienestar operativo basada en HRV · NO está autorizada como dispositivo médico por FDA, COFEPRIS, CE, ANMAT, ANVISA ni Health Canada · NO diagnostica, NO trata ni previene condiciones médicas · NO sustituye evaluación clínica ni psiquiátrica.",
    disclaimer3:
      "La información de Calm fue tomada de sus dominios oficiales con fecha de revisión indicada en la página. Calm puede cambiar políticas, pricing o feature-set sin previo aviso. Esta comparación se revisa trimestralmente — si necesitas validación en tiempo real, consulta calm.com/business directamente.",
  },

  en: {
    eyebrow: "BIO-IGNITION · vs · CALM BUSINESS",
    title: "Calm ends your day. BIO-IGNITION starts your shift.",
    editorial:
      "Both fit inside the wellness budget — but they operate in opposite windows of the employee's day and measure different things. Calm sends you to sleep with Matthew McConaughey. We read your HRV before you operate the decision.",

    tldrKicker: "TL;DR · 30 SECONDS",
    tldrRows: [
      {
        k: "Time window",
        hs: "Evening/sleep · Sleep Stories, soundscapes, morning Daily Calm.",
        bi: "Pre-shift · 3 min before operating (shift, surgery, critical meeting).",
      },
      {
        k: "Core promise",
        hs: "Relaxation + better sleep via content narrated by recognized talent.",
        bi: "Measurable physiological baseline — reportable delta per active seat.",
      },
      {
        k: "Measurement",
        hs: "App engagement: minutes listened, streaks, catalog explored.",
        bi: "HRV (RMSSD, SDNN), breathing coherence, neural baseline composite.",
      },
      {
        k: "Data posture",
        hs: "Centralized SaaS. Usage data on their servers.",
        bi: "Local-first. Physiological signal on device (encrypted IndexedDB). Server receives only k-anonymous aggregates ≥ 5.",
      },
      {
        k: "Mapped compliance",
        hs: "SOC 2, HIPAA BAA (per Calm trust center).",
        bi: "SOC 2 (active posture), ISO 27001/45001 (gap analysis), GDPR Recital 26, NOM-035 STPS · ECO37 export, HIPAA-ready + BAA.",
      },
    ],

    whenHsKicker: "WHEN TO CHOOSE CALM",
    whenHsH: "Three scenarios where they win. We say so first.",
    whenHsBody:
      "Calm is a mature product built on a clear differentiator: sleep + celebrity voice. If that's the mandate, they're better than us — period.",
    whenHsItems: [
      {
        t: "Your mandate is 'better sleep on the team'.",
        b: "Calm Sleep Stories is the category. Matthew McConaughey, Cillian Murphy, Harry Styles — recognized talent narrating 20–40 minute sleep content. We don't make sleep content, and we don't plan to. If the CHRO wants to attack insomnia or sleep hygiene, Calm is the vehicle.",
      },
      {
        t: "You need family + kids coverage.",
        b: "Calm Kids offers children's Sleep Stories, age-appropriate meditations, and family content. Many corporate wellness programs cover dependents — Calm does it natively. We're pure B2B adult.",
      },
      {
        t: "You want celebrity talent as part of the package.",
        b: "Calm's library features globally recognized voices as a feature (not bug). That has adoption value — employees open the app because they recognize the narrator. We don't sell celebrity; we sell measurement.",
      },
    ],

    whenBiKicker: "WHEN TO CHOOSE BIO-IGNITION",
    whenBiH: "Three scenarios where we solve what they don't.",
    whenBiBody:
      "If your program has to sign NOM-035, report physiological outcome to the board, or intervene pre-shift in critical roles — Calm isn't built for that.",
    whenBiItems: [
      {
        t: "Critical shifts · operational pre-shift.",
        b: "Pilot, surgeon, machinery operator, trader, air traffic controller. 3 minutes before the shift, with HRV reading + synchronized protocol + auditable record. Calm gives you a 25-minute Sleep Story — it doesn't work before the 6 AM shift.",
      },
      {
        t: "Reportable physiological evidence · NOM-035 + board deck.",
        b: "Your compliance officer needs to sign NOM-035 with measurable evidence. Your board wants a defensible wellness metric for ISSB S1/S2 and SASB. Calm reports listened minutes; we report neural baseline composite + delta per seat — audited CSV signed by clinical lead.",
      },
      {
        t: "Local-first by contract · physiological data on device.",
        b: "If your legal review requires that the employee's physiological signal never leave the device, you need native local-first. Calm is centralized SaaS with usage data on their servers. We store the signal in AES-GCM encrypted IndexedDB — server receives only k-anonymous aggregates ≥ 5.",
      },
    ],

    archKicker: "ARCHITECTURE · THE DEEP DIFFERENCE",
    archH: "Three structural decisions. Everything else derives.",
    archBody:
      "Same as with Headspace, the differences aren't feature-by-feature. They're product decisions that separate 'content library' from 'physiological instrument'.",
    archItems: [
      {
        n: "01",
        t: "Sleep content vs pre-shift instrument.",
        b: "Calm is built on pre-recorded content optimized for the sleep window (20–40 min Sleep Stories). BIO-IGNITION runs a live synchronized protocol of 2–3 min before the shift. Different time windows, different physiological objectives.",
      },
      {
        n: "02",
        t: "Central SaaS vs local-first.",
        b: "Calm stores usage and preferences on their servers — appropriate for serving a streamed catalog. BIO-IGNITION stores the employee's physiological signal in encrypted IndexedDB on their own device. The server only receives k-anonymous aggregates ≥ 5.",
      },
      {
        n: "03",
        t: "Celebrity voice vs measured outcome.",
        b: "Calm optimizes adoption via recognized talent — legitimate strategy for a content library. BIO-IGNITION optimizes measurable outcome per active seat — legitimate strategy for an instrument. They're orthogonal: one counts listened minutes, the other counts HRV delta.",
      },
    ],

    tableKicker: "CAPABILITY PARITY",
    tableH: "Capability by capability, without ornament.",
    tableBody:
      "Verifiable public information on both sides. Where we don't have something, we put '—'. Where they don't, same. Review date at the bottom.",
    tableHeaderFeature: "Capability",
    tableHeaderHs: "Calm Business",
    tableHeaderBi: "BIO-IGNITION",
    tableFootnote:
      "Calm information from calm.com, calm.com/business, Calm Trust Center and published corporate materials. Reviewed: 2026-04-22.",
    tableRows: [
      { f: "Sleep Stories (celebrity content)", hs: "Extensive catalog · recognized talent", bi: "—" },
      { f: "Daily Calm · Daily Jay · Daily Trip", hs: "Rotating daily series", bi: "—" },
      { f: "Calm Kids (family content)", hs: "Native", bi: "—" },
      { f: "Soundscapes + music", hs: "Extensive catalog", bi: "— (binaural yes)" },
      { f: "Guided meditation", hs: "Thousands of sessions", bi: "—" },
      { f: "Physiological HRV (RMSSD + SDNN)", hs: "—", bi: "Native · Apple Health, Fitbit, Garmin, Oura" },
      { f: "Binaural + haptics + voice protocol", hs: "—", bi: "Ms-synced · wake-lock included" },
      { f: "Operational pre-shift (2–3 min)", hs: "—", bi: "Canonical protocol" },
      { f: "Neural baseline composite (0–100)", hs: "—", bi: "Computed · weekly + quarterly delta" },
      { f: "Local-first · encrypted on device", hs: "—", bi: "AES-GCM encrypted IndexedDB" },
      { f: "K-anonymous aggregates ≥ 5", hs: "—", bi: "Default · no names, no raw data" },
      { f: "NOM-035 STPS · ECO37 export", hs: "—", bi: "Native · HR signs PDF" },
      { f: "SOC 2", hs: "Type II (per their trust center)", bi: "Active posture · Type I in 2026" },
      { f: "HIPAA · signable BAA", hs: "Available (Calm Business Enterprise)", bi: "Available (Enterprise)" },
      { f: "GDPR Recital 26 (disassociated data)", hs: "Not explicitly declared", bi: "Native architecture" },
      { f: "SSO · SAML 2.0 + SCIM 2.0", hs: "Enterprise available", bi: "Enterprise available" },
      { f: "CFDI 4.0 (Mexico billing)", hs: "—", bi: "All plans" },
    ],

    philoKicker: "PHILOSOPHY · SIDE BY SIDE",
    philoH: "Not better or worse. Different.",
    philoBody:
      "Calm is doing the right thing for their model: high-production narrated content for the evening/sleep window. We're doing the right thing for ours: measurable pre-shift instrument. They don't compete — they coexist.",
    philoCols: {
      hs: {
        header: "Calm Business",
        tag: "LIBRARY · SLEEP + RELAX",
        bullets: [
          "Produces narrated content with globally recognized talent.",
          "Optimizes the evening/sleep window — 20–40 min Sleep Stories.",
          "Mature catalog: Daily Calm, Daily Jay, Calm Kids, Music, Soundscapes.",
          "B2B subscription model · licensing-based scaling.",
          "Extended to coaching + therapy via mental health acquisitions.",
        ],
      },
      bi: {
        header: "BIO-IGNITION",
        tag: "INSTRUMENT · PRE-SHIFT",
        bullets: [
          "Reads employee HRV, runs pre-shift protocol, measures delta.",
          "Optimizes the pre-shift window — 2–3 min before operating.",
          "Focused catalog: 17 protocols with mechanism cited in literature.",
          "Active-seat model · adoption-guarantee documented in MSA.",
          "Complements EAP + wearable + content (Calm/Headspace) — doesn't replace.",
        ],
      },
    },

    faqKicker: "HONEST QUESTIONS",
    faqH: "What comes up on the due-diligence call.",
    faq: [
      {
        q: "Can I use Calm + BIO-IGNITION?",
        a: "Yes — and it's the obvious combination. Calm covers the evening/sleep window; we cover pre-shift. They don't compete for time of day or duration. Several operational pilots use Calm for general sleep hygiene and BIO-IGNITION for critical roles that need measurable baseline before the shift.",
      },
      {
        q: "Why don't you make Sleep Stories too?",
        a: "Because that's not our mandate — and because Calm does it better. Adding celebrity-narrated content is a product decision that pulls us out of being a measurable instrument. We prefer to stay in our lane: read HRV, run brief protocol, report delta. If your employee needs to fall asleep to a Sleep Story, open Calm — the experience is solved.",
      },
      {
        q: "Doesn't Calm also have coaching and therapy?",
        a: "Yes, via acquisitions in the mental health space. That moves them toward the Lyra/Spring/Modern Health category. We're not that. If your mandate is scalable therapy, Calm Business may be a vehicle — and we complement with physiological pre-shift in parallel.",
      },
      {
        q: "Doesn't their B2C engagement make them a better enterprise product too?",
        a: "B2C engagement (billions of minutes per year on Calm) doesn't automatically translate to operational outcome. Same as we said with Headspace: listened minutes ≠ physiological baseline. Both metrics are valid for different mandates. If your board asks for the first, Calm wins; if the second, we do.",
      },
      {
        q: "Do you have the famous-talent catalog Calm has?",
        a: "No. And we won't. Our protocol is narrated by neutral instrument voice — designed to operate in 3 min pre-shift, not to entertain 25 min pre-sleep. Opposite product decisions. If celebrity voice is a must-have, Calm is the answer.",
      },
    ],

    closingKicker: "DECISION",
    closingHLead: "If the window is evening/sleep with celebrity content: Calm.",
    closingHBody: "If the window is pre-shift with measurable evidence: us.",
    closingBody:
      "Most top-global operations we interviewed in Q1 2026 end up with both — Calm/Headspace as general wellness content coverage, BIO-IGNITION as measurable instrument for critical roles. Not versus; a coherent stack across two time windows.",
    closingPrimary: "Book demo · specific case",
    closingSecondary: "See ROI on your operation",
    closingTertiary: "Trust Center · due diligence",
    lastReviewed: "Last reviewed",

    sourcesKicker: "SOURCES · PUBLIC INFORMATION",
    sourcesH: "Where what we said comes from.",
    sourcesBody:
      "Every reference to Calm comes from material published by Calm.com Inc. on their official domains. If you spot a stale claim, write to us and we fix it in < 30 days.",
    sources: [
      { label: "Calm · official site", url: "https://www.calm.com/" },
      { label: "Calm Business", url: "https://business.calm.com/" },
      { label: "Calm Trust Center", url: "https://www.calm.com/trust" },
      { label: "Calm Sleep Stories (landing)", url: "https://www.calm.com/sleep-stories" },
    ],

    disclaimerH: "Legal note · 45 s read",
    disclaimer1:
      "Calm, Calm Business, Sleep Stories, Daily Calm, Calm Kids are registered trademarks of Calm.com Inc. and/or its affiliates. Talent names mentioned (Matthew McConaughey, Cillian Murphy, Harry Styles) are used under fair nominative use to identify Calm's public content — no endorsement, affiliation, or commercial subordination with BIO-IGNITION is implied by the individuals named.",
    disclaimer2:
      "BIO-IGNITION is an operational wellness tool based on HRV · NOT authorized as a medical device by FDA, COFEPRIS, CE, ANMAT, ANVISA, or Health Canada · does NOT diagnose, treat, or prevent medical conditions · does NOT substitute clinical or psychiatric evaluation.",
    disclaimer3:
      "Calm information was taken from their official domains with the review date indicated on the page. Calm may change policies, pricing, or feature-set without notice. This comparison is reviewed quarterly — if you need real-time validation, consult calm.com/business directly.",
  },
};

export default async function VsCalmPage() {
  const locale = await getServerLocale();
  const t = COPY[locale === "en" ? "en" : "es"];

  return (
    <PublicShell activePath="/vs/calm">
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

        {/* ═══ WHEN CALM ═══ */}
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
