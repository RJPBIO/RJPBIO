/* ═══════════════════════════════════════════════════════════════
   /why — The convincing page. Brutal B2B thesis: why
   BIO-IGNICIÓN exists, why now, why not the alternatives, and
   what compounds. Follows the 23-point ADN canon and reuses the
   cinematic DNA + .bi-roi-* / .bi-pricing-legal primitives.
   No new CSS — pure composition.
   ═══════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font, bioSignal, radius } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";
import IgnitionReveal from "@/components/brand/IgnitionReveal";
import BioglyphLattice from "@/components/brand/BioglyphLattice";
import PulseDivider from "@/components/brand/PulseDivider";
import { BioGlyph } from "@/components/BioIgnicionMark";

export const metadata = {
  title: "Por qué BIO-IGNICIÓN · la tesis detrás del sistema",
  description:
    "Mientras otros entrenan la cabeza, nosotros entrenamos el sistema operativo. Tesis, evidencia, y la razón por la que ahora es el momento. Cohorte piloto Q2 2026 · 12 orgs.",
  alternates: { canonical: "/why" },
  openGraph: {
    title: "Por qué BIO-IGNICIÓN · la tesis",
    description:
      "Por qué existe, por qué ahora, por qué no alternativas. Evidencia, no narrativa. Outcome, no wellness theater.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
};

const LAST_REVIEWED = "2026-04-21";

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
  /* Monumental — /why is the thesis, it earns the weight. Upper clamp
     110 stays under home's 128 so the hero hierarchy across routes
     holds. -0.045em tightens large-body lockup. */
  fontSize: "clamp(40px, 8vw, 110px)",
  letterSpacing: "-0.045em",
  lineHeight: 1.02,
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
  maxWidth: "70ch",
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
    eyebrow: "POR QUÉ · LA TESIS · B2B ENTERPRISE",
    title1: "Entrenan la cabeza.",
    title2: "Nosotros el sistema operativo.",
    editorial:
      "Mientras otros compran apps de meditación y cuestionarios trimestrales, nosotros medimos la fisiología que precede a la decisión y actuamos 3 minutos antes del turno. El rendimiento humano no se resuelve con contenido; se resuelve con instrumentación.",
    scarcity: "COHORTE PILOTO · Q2 2026 · 12 ORGS · RESERVA ABIERTA",
    heroBullets: [
      "HRV-first · no cuestionarios autorreportados",
      "3 min pre-shift · no sesiones de 30 min",
      "Local-first · datos del usuario en el dispositivo",
      "Outcome seat-por-seat · no PDF de bienestar",
    ],
    heroCompliance: [
      "SOC 2 · ISO 27001 · ISO 45001",
      "NOM-035 STPS · GDPR · HIPAA-ready",
      "k-anonymity ≥ 5 · DPA + BAA",
    ],
    heroPrimaryCta: "Reservar piloto Q2 2026",
    heroSecondaryCta: "Ver ROI en tu operación",

    costKicker: "EL COSTO QUE NADIE MIDE",
    costH: "Tu P&L ya paga el burnout. Solo no lo ve.",
    costBody:
      "El agotamiento operativo no aparece como línea contable — pero se esconde en rotación, incidentes, reclamos, primas de seguro y reuniones que se alargan el doble. La literatura pública es clara; el management rara vez la traduce.",
    stats: [
      { v: "$1 T", l: "Productividad perdida al año a nivel global", s: "WHO + ILO · 2024" },
      { v: "41 %", l: "Fuerza laboral reporta estrés 'muy alto' el último año", s: "Gallup · State of Workplace 2024" },
      { v: "2–6 %", l: "Adopción real de EAP clásicos tras el onboarding", s: "SHRM · 2023 benchmark" },
      { v: "3–5 ×", l: "Mayor probabilidad de incidente en equipos con fatiga crónica", s: "NIOSH · meta-analysis 2023" },
    ],

    whyNowKicker: "POR QUÉ AHORA",
    whyNowH: "Cuatro vectores que se alinean en 2026. No antes.",
    whyNowBody:
      "No es tendencia. Es convergencia regulatoria, actuarial y clínica que empuja hacia evidencia fisiológica accionable — con ventana de implementación angosta.",
    whyNowItems: [
      {
        k: "NOM-035 CON DIENTES",
        t: "STPS México · auditorías 2026",
        b: "De cumplimiento documental a auditoría activa con inspector. Empresas > 50 trabajadores necesitan evidencia medible, no solo cuestionarios archivados.",
      },
      {
        k: "EU AI ACT · ART. 5 + 6",
        t: "Agosto 2026 · alto riesgo laboral",
        b: "Evaluación de personas en el workplace entra como alto riesgo. Psicometría opaca queda bajo escrutinio. Señal fisiológica con consentimiento explícito se vuelve defendible.",
      },
      {
        k: "PRIMAS DE SEGURO",
        t: "Workers' comp + D&O 2025→",
        b: "Aseguradoras empiezan a premiar evidencia operativa de fatiga management — no solo póliza EAP. Un pre-shift reading medible baja la base actuarial.",
      },
      {
        k: "POST-PANDEMIA · SALUD MENTAL",
        t: "Board-level mandate",
        b: "Consejos piden métricas de bienestar reportables a accionistas (SASB + ISSB S1/S2). 'Adoptamos app X' ya no basta — piden outcome measurable y trimestral.",
      },
    ],

    pillarsKicker: "4 PILARES",
    pillarsH: "La arquitectura que nos separa del resto del mercado.",
    pillarsBody:
      "Cada pilar es una decisión de producto que cuesta caro si la inviertes — y por eso casi nadie la toma.",
    pillars: [
      {
        n: "01",
        t: "Evidencia, no narrativa.",
        b: "Nada de 'sentirse mejor'. Medimos HRV (RMSSD + SDNN), coherencia respiratoria, y carga autonómica. Todo exportable como CSV auditado, no como screenshot de feel-good.",
      },
      {
        n: "02",
        t: "Outcome seat-por-seat.",
        b: "Pagas por el asiento que entra. No por el que tienes en el directorio. ROI es por usuario activo, medido con TTV (time-to-value) < 14 días — o no es suya la factura.",
      },
      {
        n: "03",
        t: "Local-first.",
        b: "Los datos de señal fisiológica viven en el dispositivo del empleado (IndexedDB cifrado). El servidor solo recibe agregados k-anónimos ≥ 5. El empleado es dueño del CSV.",
      },
      {
        n: "04",
        t: "Compliance-nativo.",
        b: "DPA, BAA, SOC 2, ISO 27001/45001, NOM-035, GDPR Recital 26 — todo mapeado en día cero. No lo pegamos al final; es el andamio.",
      },
    ],

    vsKicker: "CONTRA LAS ALTERNATIVAS",
    vsH: "Ya probaste tres cosas. Te explicamos por qué ninguna cerró.",
    vsBody:
      "Comparamos con honestidad. Cada alternativa resuelve un pedazo — pero ninguna cierra el loop físico → decisión → evidencia. Hoy tenemos 3 comparativas publicadas, vendor por vendor, con la información pública que ellos mismos publican.",
    vsCta: "Ver las 3 comparativas",
    vsVendors: [
      { slug: "/vs/headspace",      name: "vs Headspace",      angle: "Librería de contenido vs instrumento medible" },
      { slug: "/vs/calm",           name: "vs Calm",           angle: "Evening/sleep vs pre-turno medible" },
      { slug: "/vs/modern-health",  name: "vs Modern Health",  angle: "Plataforma clínica vs instrumento operativo" },
    ],
    cinePauseLine: "El momento es angosto.",
    // Full peer comparison table retired — vendor-by-vendor detail now
    // lives on /vs/headspace, /vs/calm, /vs/modern-health.

    compoundKicker: "LO QUE COMPUESTA",
    compoundH: "Cinco outcomes que crecen juntos en 18 meses.",
    compoundBody:
      "Efecto compuesto: cada uno se refuerza con los demás. Los pilotos Q4 2025 reportaron tracción simultánea — no uno a costa de otro.",
    compound: [
      {
        k: "+18 pp",
        t: "Retención 12 m en roles críticos",
        b: "Benchmark Gartner HR 2024 · el burnout sale del top-3 de exit interviews cuando hay pre-shift activo.",
      },
      {
        k: "−9 %",
        t: "Prima workers' comp renegociada",
        b: "Aseguradoras empiezan a reconocer evidencia operativa de fatiga mgmt. Rango observado en pilotos 2024 — no garantizado.",
      },
      {
        k: "100 %",
        t: "Firma NOM-035 STPS sin hallazgos",
        b: "Export trimestral ya mapeado al ECO37 + Guía III. Tu compliance officer deja de reescribirlo cada ciclo.",
      },
      {
        k: "Board deck · 1 slide",
        t: "Métrica reportable a accionistas",
        b: "Un número trimestral (BioSignal Index) que tu CFO puede defender ante ISSB S1/S2 y SASB. No narrativa.",
      },
      {
        k: "Employer brand · tier-1",
        t: "Glassdoor + LinkedIn signal",
        b: "'Mi empresa mide mi fatiga y me deja decidir entrar al turno' es el #1 menciona en reviews positivas de los pilotos.",
      },
    ],

    notForKicker: "CUÁNDO NO",
    notForH: "Tres razones para no llamarnos. Te las decimos primero.",
    notForBody:
      "Preferimos perder la venta a perder el piloto. Si tu operación encaja en alguna de estas, hoy no es el momento — y así lo decimos.",
    notForItems: [
      {
        t: "Quieres resolver salud mental clínica.",
        b: "Eso es psiquiatría + EAP serio. Nosotros complementamos — no sustituimos. Si buscas terapia escalable, llama a Lyra o Spring Health.",
      },
      {
        t: "No tienes comprometido un champion operativo.",
        b: "Pre-shift de 3 min sin ritual organizacional muere en 6 semanas. Si HR no tiene quién sostenga el protocolo, abortamos el piloto.",
      },
      {
        t: "Tu consejo exige 'IA explicable al 100 %' hoy.",
        b: "Publicamos pesos y arquitectura del motor neural, pero el GBDT adaptativo no es 100 % causal. Si necesitas causal inference puro, hoy no somos.",
      },
    ],

    cohortKicker: "COHORTE PILOTO · Q2 2026",
    cohortH: "12 organizaciones. Ni una más, ni una menos.",
    cohortBody:
      "Piloto capado para mantener calidad de implementación. Cada cohorte incluye champion assignment, protocol mapping, 90-day outcome report auditable, y lock-in de pricing Q2.",
    cohortRows: [
      { k: "CUPO", v: "12 / 12 · reservamos 4 al cierre" },
      { k: "VENTANA", v: "Activación 15 · mayo → cierre 31 · julio 2026" },
      { k: "ONBOARDING", v: "Week-1 champion + week-2 HR + week-4 go-live" },
      { k: "REPORTE", v: "90-day outcome dossier · firmado por clinical lead" },
      { k: "LOCK-IN", v: "Pricing Q2 2026 · 18 m · renovación transparente" },
      { k: "EXIT", v: "Cancelas con 30 días · CSV completo al empleado" },
    ],
    cohortCta: "Aplicar a la cohorte",
    cohortCtaHint: "Revisión inicial en 24 h hábiles. Sin slides, sin vendedor.",
    cohortTimelineLabel: "Cadencia del piloto",
    // Rendered as a compact 4-step strip inside the Cohorte dark
    // frame — the old standalone TIMELINE section was redundant with
    // cohortRows' ONBOARDING + REPORTE lines. Now they live together.
    cohortTimeline: [
      { k: "D0",  t: "Kick-off + DPA",     b: "Champion asignado · legal review en < 5 días · SSO activado." },
      { k: "D14", t: "Go-live · 1 turno",   b: "10–30 usuarios · pre-shift instalado · dashboard HR en vivo." },
      { k: "D45", t: "Expansión turno",     b: "Outcome parcial revisado · protocolo afinado al contexto." },
      { k: "D90", t: "Outcome dossier",      b: "Reporte firmado · decisión de escala · pricing Q2 locked." },
    ],
    // COMPLIANCE RAIL section cut — the 4 Pilares already name "Compliance-nativo"
    // as Pillar 04 and /trust carries the full posture detail.

    faqKicker: "OBJECIONES FRECUENTES",
    faqH: "Las cinco preguntas que aparecen en el call de due diligence.",
    faq: [
      {
        q: "¿No es esto otra wellness app con mejor packaging?",
        a: "No. Wellness app optimiza retención y engagement. Nosotros medimos HRV fisiológico, exportamos a CSV auditado y firmamos NOM-035. Si nuestra métrica no mueve el outcome seat-por-seat en 90 días, canceas con 30 días.",
      },
      {
        q: "¿Por qué no construirlo in-house? Tenemos el equipo.",
        a: "Build interno: 12–24 m, $500K–$2M, y drift de compliance al siguiente re-org. Nosotros ya cargamos el audit trail, el motor neural y el mapping regulatorio. Tu equipo hace lo que solo tu equipo puede: integrarlo a tu operación.",
      },
      {
        q: "¿Qué defiende esto cuando una app de $5/mes copie la UI?",
        a: "Tres foso: (1) evidencia acumulada por org — cuanta más data, más preciso el motor adaptativo; (2) compliance activo con auditores nombrados; (3) export nativo a frameworks B2B regulados que ningún clon B2C va a firmar.",
      },
      {
        q: "¿Y si el equipo no lo adopta? Ya pasó con la app anterior.",
        a: "Si adopción < 35 % en día 45 pausamos el piloto y no cobramos el resto. Adoption-guarantee documentado en MSA. La clave: pre-shift es 3 min operativo — no un 'extra' en la agenda del empleado.",
      },
      {
        q: "¿Cómo se relaciona con nuestro EAP existente?",
        a: "Complementa, no sustituye. EAP resuelve crisis; nosotros prevenimos la fatiga que la dispara. Muchos pilotos terminan con EAP reportando −30 % de intake porque el BIO-IGNICIÓN captura antes.",
      },
    ],

    closingKicker: "DECISIÓN",
    closingHLead: "Puedes seguir midiendo encuestas trimestrales.",
    closingHBody: "O empezar a medir la fisiología que precede al incidente.",
    closingBody:
      "La cohorte piloto Q2 2026 cierra el 15 de mayo. Después abrimos Q3 con precio +12 %. Si tu consejo te va a pedir outcome fisiológico reportable en 2026 — y te lo va a pedir — hoy es el momento barato.",
    closingPrimary: "Aplicar a cohorte Q2 2026",
    closingSecondary: "Ver ROI con tu operación",
    closingTertiary: "Trust Center · due diligence",
    closingAvail: "Página revisada",

    disclaimerH: "Nota legal · lectura en 45 s",
    disclaimer1:
      "Todas las cifras estadísticas provienen de fuentes públicas revisadas por pares o reportes oficiales (WHO, ILO, Gallup, SHRM, NIOSH, Gartner HR) y tienen carácter de estimación — no son garantía de resultado en tu organización específica. El outcome real depende de contexto operativo, comprometido del champion, y tasa de adherencia.",
    disclaimer2:
      "BIO-IGNICIÓN es una herramienta de bienestar operativo basada en HRV · NO está autorizada como dispositivo médico por FDA, COFEPRIS, CE, ANMAT, ANVISA ni Health Canada · NO diagnostica, NO trata ni previene condiciones médicas · NO sustituye evaluación clínica, psiquiátrica ni fitness-for-duty formal. Es complementaria al EAP/FEAP y al programa de salud ocupacional de tu organización.",
    disclaimer3:
      "Las marcas referidas (Lyra Health, Spring Health, Calm, Headspace, Oura, WHOOP, Apple Watch, Fitbit, SHRM, Gallup, WHO, ILO, NIOSH, Gartner, ISSB, SASB) se usan bajo doctrina de uso nominativo justo con fin de comparación editorial. No implican endorsement, afiliación, sociedad ni subordinación comercial con BIO-IGNICIÓN.",
    disclaimer4:
      "Los porcentajes de outcome (+18 pp retención, −9 % prima) corresponden a rangos observados en pilotos internos 2024–2025 y literatura sectorial — no se presentan como garantía contractual. La adoption-guarantee y el exit de 30 días se documentan explícitamente en el MSA correspondiente.",
    disclaimer5:
      "Los términos 'outcome seat-por-seat', 'compliance-nativo' y 'evidencia, no narrativa' describen la arquitectura del producto y la postura operativa; no sustituyen el SLA, DPA, BAA o MSA firmado que constituye la relación contractual definitiva.",

    jsonLdName: "Por qué BIO-IGNICIÓN · la tesis detrás del sistema",
    jsonLdDesc:
      "La tesis B2B enterprise: evidencia fisiológica, outcome seat-por-seat, local-first y compliance-nativo.",
  },

  en: {
    eyebrow: "WHY · THE THESIS · B2B ENTERPRISE",
    title1: "They train the head.",
    title2: "We train the operating system.",
    editorial:
      "While others buy meditation apps and quarterly surveys, we measure the physiology that precedes the decision and act 3 minutes before the shift. Human performance isn't solved with content — it's solved with instrumentation.",
    scarcity: "PILOT COHORT · Q2 2026 · 12 ORGS · INTAKE OPEN",
    heroBullets: [
      "HRV-first · no self-reported questionnaires",
      "3-min pre-shift · no 30-minute sessions",
      "Local-first · user data on the device",
      "Seat-by-seat outcome · no wellness PDF",
    ],
    heroCompliance: [
      "SOC 2 · ISO 27001 · ISO 45001",
      "NOM-035 STPS · GDPR · HIPAA-ready",
      "k-anonymity ≥ 5 · DPA + BAA",
    ],
    heroPrimaryCta: "Reserve Q2 2026 pilot",
    heroSecondaryCta: "See ROI on your ops",

    costKicker: "THE COST NOBODY MEASURES",
    costH: "Your P&L is already paying for burnout. It just doesn't see it.",
    costBody:
      "Operational exhaustion doesn't show up as a line item — but it hides in turnover, incidents, claims, insurance premiums, and meetings that run twice as long. The public literature is clear; management rarely translates it.",
    stats: [
      { v: "$1T", l: "Global productivity lost per year", s: "WHO + ILO · 2024" },
      { v: "41 %", l: "Workforce reporting 'very high' stress last year", s: "Gallup · State of Workplace 2024" },
      { v: "2–6 %", l: "Real EAP adoption after onboarding", s: "SHRM · 2023 benchmark" },
      { v: "3–5×", l: "Incident odds in chronically fatigued teams", s: "NIOSH · meta-analysis 2023" },
    ],

    whyNowKicker: "WHY NOW",
    whyNowH: "Four vectors align in 2026. Not before.",
    whyNowBody:
      "This isn't trend. It's regulatory, actuarial, and clinical convergence pushing toward actionable physiological evidence — with a narrow implementation window.",
    whyNowItems: [
      {
        k: "NOM-035 WITH TEETH",
        t: "STPS Mexico · 2026 audits",
        b: "From paperwork compliance to active audit with inspector. Orgs > 50 employees need measurable evidence, not archived surveys.",
      },
      {
        k: "EU AI ACT · ART. 5 + 6",
        t: "August 2026 · high-risk workplace",
        b: "Workplace evaluation enters high-risk tier. Opaque psychometrics fall under scrutiny. Consented physiological signal becomes defensible.",
      },
      {
        k: "INSURANCE PREMIUMS",
        t: "Workers' comp + D&O 2025→",
        b: "Carriers beginning to reward operational fatigue-mgmt evidence — not just an EAP policy. A measurable pre-shift reading lowers actuarial base.",
      },
      {
        k: "POST-PANDEMIC · MENTAL HEALTH",
        t: "Board-level mandate",
        b: "Boards demand wellbeing metrics reportable to shareholders (SASB + ISSB S1/S2). 'We adopted app X' no longer suffices — quarterly outcome required.",
      },
    ],

    pillarsKicker: "4 PILLARS",
    pillarsH: "The architecture that separates us from the rest of the market.",
    pillarsBody:
      "Each pillar is a product decision that's expensive to reverse — which is why almost nobody takes it.",
    pillars: [
      {
        n: "01",
        t: "Evidence, not narrative.",
        b: "No 'feel better'. We measure HRV (RMSSD + SDNN), breathing coherence, autonomic load. Everything exportable as audited CSV — not a feel-good screenshot.",
      },
      {
        n: "02",
        t: "Seat-by-seat outcome.",
        b: "You pay for the seat that shows up. Not the one on the directory. ROI per active user, measured with TTV (time-to-value) < 14 days — or the invoice isn't yours.",
      },
      {
        n: "03",
        t: "Local-first.",
        b: "Physiological signal lives on the employee's device (encrypted IndexedDB). The server receives only k-anonymous ≥ 5 aggregates. The employee owns the CSV.",
      },
      {
        n: "04",
        t: "Compliance-native.",
        b: "DPA, BAA, SOC 2, ISO 27001/45001, NOM-035, GDPR Recital 26 — all mapped day zero. Not pasted on at the end; it's the scaffold.",
      },
    ],

    vsKicker: "VS THE ALTERNATIVES",
    vsH: "You already tried three things. Here's why none closed the loop.",
    vsBody:
      "Honest comparison. Each alternative solves a slice — but none closes the physiology → decision → evidence loop. We've published three head-to-head comparisons, using public information each vendor publishes themselves.",
    vsCta: "See all 3 comparisons",
    vsVendors: [
      { slug: "/vs/headspace",     name: "vs Headspace",     angle: "Content library vs measurable instrument" },
      { slug: "/vs/calm",          name: "vs Calm",          angle: "Evening/sleep vs pre-shift measurable" },
      { slug: "/vs/modern-health", name: "vs Modern Health", angle: "Clinical platform vs operational instrument" },
    ],
    cinePauseLine: "The window is narrow.",

    compoundKicker: "WHAT COMPOUNDS",
    compoundH: "Five outcomes that grow together over 18 months.",
    compoundBody:
      "Compound effect: each reinforces the others. Q4 2025 pilots reported simultaneous traction — not one at the cost of another.",
    compound: [
      {
        k: "+18 pp",
        t: "12-month retention in critical roles",
        b: "Gartner HR 2024 benchmark · burnout exits top-3 of exit interviews when pre-shift is active.",
      },
      {
        k: "−9 %",
        t: "Workers' comp premium renegotiated",
        b: "Carriers beginning to recognize operational fatigue-mgmt evidence. Range observed in 2024 pilots — not guaranteed.",
      },
      {
        k: "100 %",
        t: "NOM-035 STPS sign-off with zero findings",
        b: "Quarterly export already mapped to ECO37 + Guide III. Your compliance officer stops rewriting it every cycle.",
      },
      {
        k: "Board deck · 1 slide",
        t: "Shareholder-reportable metric",
        b: "A quarterly number (BioSignal Index) your CFO can defend to ISSB S1/S2 and SASB. No narrative.",
      },
      {
        k: "Tier-1 employer brand",
        t: "Glassdoor + LinkedIn signal",
        b: "'My company measures my fatigue and lets me decide to work the shift' is the #1 mention in pilot positive reviews.",
      },
    ],

    notForKicker: "WHEN NOT",
    notForH: "Three reasons not to call us. We say them first.",
    notForBody:
      "We'd rather lose the sale than lose the pilot. If your ops fits any of these, today isn't the moment — and we'll say so.",
    notForItems: [
      {
        t: "You want to solve clinical mental health.",
        b: "That's psychiatry + serious EAP. We complement — we don't substitute. If you need scalable therapy, call Lyra or Spring Health.",
      },
      {
        t: "You don't have a committed operational champion.",
        b: "3-min pre-shift without organizational ritual dies in 6 weeks. If HR doesn't have someone to sustain the protocol, we abort the pilot.",
      },
      {
        t: "Your board demands 100 % explainable AI today.",
        b: "We publish the neural engine's weights and architecture, but the adaptive GBDT isn't 100 % causal. If you need pure causal inference, we're not for you today.",
      },
    ],

    cohortKicker: "PILOT COHORT · Q2 2026",
    cohortH: "12 organizations. Not one more, not one less.",
    cohortBody:
      "Pilot capped to maintain implementation quality. Each cohort includes champion assignment, protocol mapping, auditable 90-day outcome report, and Q2 pricing lock-in.",
    cohortRows: [
      { k: "SEATS", v: "12 / 12 · reserving 4 at close" },
      { k: "WINDOW", v: "Activation May 15 → close July 31, 2026" },
      { k: "ONBOARDING", v: "Week-1 champion + week-2 HR + week-4 go-live" },
      { k: "REPORT", v: "90-day outcome dossier · signed by clinical lead" },
      { k: "LOCK-IN", v: "Q2 2026 pricing · 18 m · transparent renewal" },
      { k: "EXIT", v: "Cancel on 30-day notice · full CSV to the employee" },
    ],
    cohortCta: "Apply to cohort",
    cohortCtaHint: "Initial review in 24 business hours. No slides, no rep.",
    cohortTimelineLabel: "Pilot cadence",
    cohortTimeline: [
      { k: "D0",  t: "Kick-off + DPA",       b: "Champion assigned · legal review < 5 days · SSO activated." },
      { k: "D14", t: "Go-live · one shift",   b: "10–30 users · pre-shift installed · live HR dashboard." },
      { k: "D45", t: "Full shift rollout",    b: "Interim outcome reviewed · protocol tuned to ops context." },
      { k: "D90", t: "Outcome dossier",        b: "Signed report · scale decision · Q2 2026 pricing locked." },
    ],

    faqKicker: "FREQUENT OBJECTIONS",
    faqH: "The five questions that come up in the due-diligence call.",
    faq: [
      {
        q: "Isn't this just another wellness app with better packaging?",
        a: "No. Wellness apps optimize retention and engagement. We measure physiological HRV, export to audited CSV, and sign NOM-035. If our metric doesn't move seat-by-seat outcome in 90 days, you cancel on 30-day notice.",
      },
      {
        q: "Why not build in-house? We have the team.",
        a: "Internal build: 12–24 m, $500K–$2M, and compliance drift at next re-org. We already carry the audit trail, neural engine, and regulatory mapping. Your team does what only your team can: integrate it to your ops.",
      },
      {
        q: "What defends this when a $5/mo app copies the UI?",
        a: "Three moats: (1) per-org accumulated evidence — more data, more precise adaptive engine; (2) active compliance with named auditors; (3) native export to regulated B2B frameworks no B2C clone will ever sign.",
      },
      {
        q: "What if the team doesn't adopt? Happened with our last app.",
        a: "If adoption < 35 % at day 45 we pause the pilot and don't bill the rest. Adoption-guarantee documented in MSA. Key: pre-shift is 3 operational minutes — not an 'extra' on the employee's schedule.",
      },
      {
        q: "How does this relate to our existing EAP?",
        a: "It complements, doesn't replace. EAP resolves crisis; we prevent the fatigue that triggers it. Many pilots end with EAP reporting −30 % intake because BIO-IGNITION catches upstream.",
      },
    ],

    closingKicker: "DECISION",
    closingHLead: "You can keep running quarterly surveys.",
    closingHBody: "Or start measuring the physiology that precedes the incident.",
    closingBody:
      "The Q2 2026 pilot cohort closes May 15. After that we open Q3 at +12 % price. If your board will ask for reportable physiological outcome in 2026 — and they will — today is the cheap moment.",
    closingPrimary: "Apply to Q2 2026 cohort",
    closingSecondary: "See ROI on your ops",
    closingTertiary: "Trust Center · due diligence",
    closingAvail: "Page reviewed",

    disclaimerH: "Legal note · 45-second read",
    disclaimer1:
      "All statistical figures come from public peer-reviewed sources or official reports (WHO, ILO, Gallup, SHRM, NIOSH, Gartner HR) and are estimates — not a guarantee in your specific organization. Real outcome depends on operational context, champion commitment, and adherence rate.",
    disclaimer2:
      "BIO-IGNITION is an operational wellness tool based on HRV · NOT cleared as a medical device by FDA, COFEPRIS, CE, ANMAT, ANVISA or Health Canada · does NOT diagnose, treat or prevent medical conditions · does NOT substitute for clinical, psychiatric or formal fitness-for-duty evaluation. Complementary to your organization's EAP/FEAP and occupational health program.",
    disclaimer3:
      "Referenced marks (Lyra Health, Spring Health, Calm, Headspace, Oura, WHOOP, Apple Watch, Fitbit, SHRM, Gallup, WHO, ILO, NIOSH, Gartner, ISSB, SASB) are used under fair nominative use for editorial comparison. No endorsement, affiliation, partnership or commercial subordination with BIO-IGNITION is implied.",
    disclaimer4:
      "Outcome percentages (+18 pp retention, −9 % premium) correspond to ranges observed in internal 2024–2025 pilots and sector literature — not presented as contractual guarantee. The adoption-guarantee and 30-day exit are documented explicitly in the corresponding MSA.",
    disclaimer5:
      "Terms 'seat-by-seat outcome', 'compliance-native' and 'evidence, not narrative' describe product architecture and operational posture; they do not substitute the SLA, DPA, BAA or signed MSA that constitutes the definitive contractual relationship.",

    jsonLdName: "Why BIO-IGNITION · the thesis behind the system",
    jsonLdDesc:
      "The B2B enterprise thesis: physiological evidence, seat-by-seat outcome, local-first, and compliance-native.",
  },
};

export default async function WhyPage() {
  const locale = await getServerLocale();
  const t = COPY[locale === "en" ? "en" : "es"];

  return (
    <PublicShell activePath="/why">
      <main id="main-content">
        {/* ═══ HERO ═══ */}
        {/* Hero paddings tightened — the default <Container> adds its own
            clamp(32–64) block padding, which was stacking on top of the
            section padding and leaving visible dead space above the
            eyebrow. Section alone now owns the hero offset; Container
            block padding is zeroed to prevent the double-padding. */}
        <section style={{ position: "relative", overflow: "hidden", paddingBlock: `clamp(40px, 6vw, 72px) clamp(48px, 8vw, 96px)` }}>
          {/* Ambient lattice is decorative — absolute so it doesn't
              inflate the hero's in-flow height (the SVG viewBox scales
              to section width otherwise, producing ~100vh of dead
              space before the content). */}
          <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.55, maskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)" }}>
            <BioglyphLattice variant="ambient" />
          </div>
          <Container size="xl" style={{ position: "relative", zIndex: 1, paddingBlock: 0 }}>
            <IgnitionReveal sparkOrigin="18% 28%">
              <p style={kickerStyle}>{t.eyebrow}</p>
              {/* Two-line H1 with gradient on line 2 — mirrors home's
                  hero structure so the brand signature ("sans black
                  first clause + cyan→violet accent on second clause")
                  carries across both the sensory landing and the
                  thesis page. Gradient lands on "sistema operativo" —
                  the proprietary term we're staking as our category. */}
              <h1 style={h1Style}>
                {t.title1}
                <br />
                <span
                  style={{
                    background: `linear-gradient(120deg, ${bioSignal.phosphorCyan}, ${bioSignal.neuralViolet})`,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {t.title2}
                </span>
              </h1>
              <p style={editorialStyle}>{t.editorial}</p>

              <div style={{ marginBlockStart: space[6] }}>
                <span className="bi-roi-scarcity">{t.scarcity}</span>
              </div>

              <ul style={{
                listStyle: "none", padding: 0, margin: `${space[8]}px 0 0`,
                display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: space[3],
              }}>
                {t.heroBullets.map((b) => (
                  <li key={b} style={{
                    display: "flex", alignItems: "flex-start", gap: space[2],
                    color: cssVar.text, fontSize: font.size.base, lineHeight: font.leading.relaxed,
                  }}>
                    <span aria-hidden style={{ color: bioSignal.phosphorCyanInk, fontFamily: cssVar.fontMono, fontWeight: font.weight.bold }}>▸</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div style={{
                marginBlockStart: space[6], display: "flex", flexWrap: "wrap", gap: space[2],
                fontFamily: cssVar.fontMono, fontSize: font.size.xs, color: cssVar.textMuted,
                letterSpacing: "0.08em",
              }}>
                {t.heroCompliance.map((c, i) => (
                  <span key={c} style={{
                    padding: `${space[1]}px ${space[3]}px`,
                    border: `1px solid ${cssVar.border}`, borderRadius: radius.pill,
                    background: cssVar.surface2,
                  }}>{c}</span>
                ))}
              </div>

              <div style={{ marginBlockStart: space[8], display: "flex", flexWrap: "wrap", gap: space[3] }}>
                <Link href="/demo" className="bi-demo-closing-primary">{t.heroPrimaryCta}</Link>
                <Link href="/roi-calculator" className="bi-demo-closing-secondary">{t.heroSecondaryCta}</Link>
              </div>
            </IgnitionReveal>
          </Container>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ COST NOBODY MEASURES ═══ */}
        <section style={{ paddingBlock: "clamp(64px, 9vw, 120px)" }}>
          <Container size="xl">
            <p style={kickerStyleMuted}>{t.costKicker}</p>
            <h2 style={sectionHeading}>{t.costH}</h2>
            <p style={sectionSub}>{t.costBody}</p>
            <div className="bi-proof-stats" style={{ marginBlockStart: space[8] }}>
              {t.stats.map((s) => (
                <div key={s.l}>
                  <div className="v">{s.v}</div>
                  <div className="l">{s.l}</div>
                  <div className="s">{s.s}</div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ WHY NOW ═══ */}
        <section style={{ paddingBlock: "clamp(64px, 9vw, 120px)" }}>
          <Container size="xl">
            <p style={kickerStyleMuted}>{t.whyNowKicker}</p>
            <h2 style={sectionHeading}>{t.whyNowH}</h2>
            <p style={sectionSub}>{t.whyNowBody}</p>
            <div style={{
              marginBlockStart: space[8], display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: space[4],
            }}>
              {t.whyNowItems.map((it) => (
                <article key={it.t} style={cardStyle}>
                  <p style={{ ...kickerStyle, margin: 0, fontSize: "10px" }}>{it.k}</p>
                  <h3 style={{
                    margin: 0, fontSize: font.size.lg, fontWeight: font.weight.bold,
                    color: cssVar.text, letterSpacing: "-0.01em",
                  }}>{it.t}</h3>
                  <p style={{ margin: 0, color: cssVar.textMuted, fontSize: font.size.sm, lineHeight: font.leading.relaxed }}>{it.b}</p>
                </article>
              ))}
            </div>
          </Container>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ 4 PILLARS ═══ */}
        <section style={{ paddingBlock: "clamp(64px, 9vw, 120px)" }}>
          <Container size="xl">
            <p style={kickerStyleMuted}>{t.pillarsKicker}</p>
            <h2 style={sectionHeading}>{t.pillarsH}</h2>
            <p style={sectionSub}>{t.pillarsBody}</p>
            <div style={{
              marginBlockStart: space[8], display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: space[4],
            }}>
              {t.pillars.map((p) => (
                <article key={p.n} style={{
                  ...cardStyle,
                  borderInlineStart: `3px solid ${bioSignal.phosphorCyan}`,
                }}>
                  <div style={{
                    fontFamily: cssVar.fontMono, fontSize: font.size.xs,
                    color: bioSignal.phosphorCyanInk, letterSpacing: "0.2em", fontWeight: font.weight.bold,
                  }}>{p.n}</div>
                  <h3 style={{
                    margin: 0, fontSize: font.size.lg, fontWeight: font.weight.black,
                    color: cssVar.text, letterSpacing: "-0.015em",
                  }}>{p.t}</h3>
                  <p style={{ margin: 0, color: cssVar.textMuted, fontSize: font.size.sm, lineHeight: font.leading.relaxed }}>{p.b}</p>
                </article>
              ))}
            </div>
          </Container>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ VS ALTERNATIVES — compact callout, not table ═══
            Full vendor-by-vendor comparisons now live on /vs/headspace,
            /vs/calm, /vs/modern-health. /why carries the editorial
            summary + three doorways; avoids duplicating content that
            drifts out of sync between pages. */}
        <section style={{ paddingBlock: "clamp(64px, 9vw, 120px)" }}>
          <Container size="xl">
            <p style={kickerStyleMuted}>{t.vsKicker}</p>
            <h2 style={sectionHeading}>{t.vsH}</h2>
            <p style={sectionSub}>{t.vsBody}</p>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: `${space[8]}px 0 0`,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: space[3],
              }}
            >
              {t.vsVendors.map((v) => (
                <li key={v.slug}>
                  <Link
                    href={v.slug}
                    className="bi-card-link"
                    style={{
                      display: "block",
                      padding: space[5],
                      borderRadius: radius.xl,
                      border: `1px solid ${cssVar.border}`,
                      background: cssVar.surface,
                      textDecoration: "none",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: cssVar.fontMono,
                        fontSize: 11,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color: bioSignal.phosphorCyanInk,
                        fontWeight: font.weight.bold,
                        marginBlockEnd: space[2],
                      }}
                    >
                      BIO-IGNICIÓN {v.name}
                    </div>
                    <div
                      style={{
                        color: cssVar.text,
                        fontSize: font.size.base,
                        fontWeight: font.weight.bold,
                        letterSpacing: "-0.01em",
                        marginBlockEnd: space[1],
                      }}
                    >
                      {v.angle}
                    </div>
                    <div
                      style={{
                        fontFamily: cssVar.fontMono,
                        fontSize: 11,
                        color: "var(--bi-link, var(--bi-accent))",
                        fontWeight: font.weight.bold,
                      }}
                    >
                      {v.slug} →
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <div style={{ marginBlockStart: space[6], textAlign: "center" }}>
              <Link
                href="/vs"
                className="bi-demo-closing-secondary"
                style={{ display: "inline-flex", alignItems: "center", gap: space[2] }}
              >
                {t.vsCta} →
              </Link>
            </div>
          </Container>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ WHAT COMPOUNDS ═══ */}
        <section style={{ paddingBlock: "clamp(64px, 9vw, 120px)" }}>
          <Container size="xl">
            <p style={kickerStyleMuted}>{t.compoundKicker}</p>
            <h2 style={sectionHeading}>{t.compoundH}</h2>
            <p style={sectionSub}>{t.compoundBody}</p>
            <div className="bi-roi-benchmark-strip" style={{ marginBlockStart: space[8] }}>
              {t.compound.map((c) => (
                <div key={c.t} style={{
                  border: `1px solid ${cssVar.border}`, borderRadius: radius.lg,
                  padding: space[5], background: cssVar.surface, display: "grid", gap: space[2],
                }}>
                  <div style={{
                    fontFamily: cssVar.fontMono, fontSize: "22px", fontWeight: font.weight.black,
                    color: bioSignal.phosphorCyanInk, letterSpacing: "-0.01em",
                  }}>{c.k}</div>
                  <div style={{ fontSize: font.size.sm, fontWeight: font.weight.bold, color: cssVar.text }}>{c.t}</div>
                  <div style={{ fontSize: font.size.xs, color: cssVar.textMuted, lineHeight: font.leading.relaxed }}>{c.b}</div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ WHEN NOT ═══ */}
        <section style={{ paddingBlock: "clamp(64px, 9vw, 120px)" }}>
          <Container size="xl">
            <p style={kickerStyleMuted}>{t.notForKicker}</p>
            <h2 style={sectionHeading}>{t.notForH}</h2>
            <p style={sectionSub}>{t.notForBody}</p>
            <div style={{
              marginBlockStart: space[8], display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: space[4],
            }}>
              {t.notForItems.map((it) => (
                <article key={it.t} style={{
                  ...cardStyle,
                  borderInlineStart: `3px solid #F59E0B`,
                }}>
                  <h3 style={{
                    margin: 0, fontSize: font.size.base, fontWeight: font.weight.bold,
                    color: cssVar.text, letterSpacing: "-0.01em",
                  }}>{it.t}</h3>
                  <p style={{ margin: 0, color: cssVar.textMuted, fontSize: font.size.sm, lineHeight: font.leading.relaxed }}>{it.b}</p>
                </article>
              ))}
            </div>
          </Container>
        </section>

        {/* Cinematic pause — bridges "Cuándo NO" (honesty) into
            "Cohorte Piloto" (action). The beat of "if you're still
            here after we told you not to buy, the pilot wants you." */}
        <section aria-labelledby="why-cine-pause" className="bi-cine-pause bi-cine-pause--mid">
          <div className="bi-cine-pause-glyph">
            <BioGlyph size={76} />
          </div>
          <h2 id="why-cine-pause" className="bi-cine-pause-line">
            {t.cinePauseLine}
          </h2>
        </section>

        {/* ═══ COHORT PILOT — dark moment ═══
            Action/decision weight. Mirrors /home's Final CTA dark-frame
            pattern: the place where the visitor is asked to commit.
            Inline D0→D90 strip absorbs the old standalone TIMELINE —
            same data, no standalone section. Text colors explicit
            dark-bg-safe so children don't inherit light-theme cascade. */}
        <section aria-labelledby="cohort" className="bi-darkframe">
          <Container size="xl">
            <p style={{ ...kickerStyle, color: bioSignal.phosphorCyan }}>{t.cohortKicker}</p>
            <h2 id="cohort" style={{ ...sectionHeading, color: "#E6F1EA" }}>{t.cohortH}</h2>
            <p style={{ ...sectionSub, color: "#A7F3D0" }}>{t.cohortBody}</p>
            <div style={{
              marginBlockStart: space[8], display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: space[2],
              border: "1px solid rgba(34, 211, 238, 0.18)",
              borderRadius: radius.xl,
              padding: space[6],
              background: "rgba(34, 211, 238, 0.04)",
            }}>
              {t.cohortRows.map((r) => (
                <div key={r.k} style={{
                  padding: `${space[3]}px ${space[4]}px`,
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: radius.md,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}>
                  <div style={{
                    fontFamily: cssVar.fontMono, fontSize: font.size.xs,
                    color: bioSignal.phosphorCyan, letterSpacing: "0.2em", fontWeight: font.weight.bold,
                    marginBlockEnd: space[1],
                  }}>{r.k}</div>
                  <div style={{ color: "#E6F1EA", fontSize: font.size.sm, lineHeight: font.leading.relaxed }}>{r.v}</div>
                </div>
              ))}
            </div>

            {/* D0→D90 inline strip — absorbed from the retired TIMELINE
                section. Horizontal 4-step cadence with delta marker. */}
            <div style={{ marginBlockStart: space[6] }}>
              <div style={{
                fontFamily: cssVar.fontMono, fontSize: 11, letterSpacing: "0.18em",
                textTransform: "uppercase", color: bioSignal.phosphorCyan,
                fontWeight: font.weight.bold, marginBlockEnd: space[3],
              }}>
                {t.cohortTimelineLabel}
              </div>
              <ol style={{
                listStyle: "none", padding: 0, margin: 0,
                display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: space[2],
              }}>
                {t.cohortTimeline.map((step) => (
                  <li key={step.k} style={{
                    padding: `${space[3]}px ${space[4]}px`,
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: radius.md,
                    border: "1px solid rgba(255,255,255,0.08)",
                    display: "grid", gap: 4,
                  }}>
                    <div style={{
                      fontFamily: cssVar.fontMono, fontWeight: font.weight.black,
                      color: bioSignal.phosphorCyan, fontSize: 15, letterSpacing: "-0.01em",
                    }}>{step.k}</div>
                    <div style={{
                      color: "#E6F1EA", fontSize: font.size.sm,
                      fontWeight: font.weight.bold, letterSpacing: "-0.005em",
                    }}>{step.t}</div>
                    <div style={{
                      color: "#A7F3D0", fontSize: font.size.xs,
                      lineHeight: font.leading.relaxed,
                    }}>{step.b}</div>
                  </li>
                ))}
              </ol>
            </div>

            <div style={{ marginBlockStart: space[7], display: "flex", gap: space[3], alignItems: "center", flexWrap: "wrap" }}>
              <Link href="/demo" className="bi-demo-closing-primary">{t.cohortCta}</Link>
              <span style={{ color: "#A7F3D0", fontSize: font.size.sm }}>{t.cohortCtaHint}</span>
            </div>
          </Container>
        </section>

        {/* ═══ FAQ / OBJECTIONS ═══ */}
        <section style={{ paddingBlock: "clamp(64px, 9vw, 120px)" }}>
          <Container size="xl">
            <p style={kickerStyleMuted}>{t.faqKicker}</p>
            <h2 style={sectionHeading}>{t.faqH}</h2>
            <div style={{ marginBlockStart: space[8], display: "grid", gap: space[3] }}>
              {t.faq.map((f, i) => (
                <details key={i} style={{
                  border: `1px solid ${cssVar.border}`, borderRadius: radius.lg,
                  padding: `${space[4]}px ${space[5]}px`, background: cssVar.surface,
                }}>
                  <summary style={{
                    cursor: "pointer", fontWeight: font.weight.bold, fontSize: font.size.base,
                    color: cssVar.text, listStyle: "none", display: "flex", gap: space[3], alignItems: "flex-start",
                  }}>
                    <span aria-hidden style={{ color: bioSignal.phosphorCyanInk, fontFamily: cssVar.fontMono, fontSize: font.size.sm }}>Q{String(i + 1).padStart(2, "0")}</span>
                    <span>{f.q}</span>
                  </summary>
                  <p style={{
                    margin: `${space[3]}px 0 0`, color: cssVar.textMuted,
                    fontSize: font.size.sm, lineHeight: font.leading.relaxed,
                  }}>{f.a}</p>
                </details>
              ))}
            </div>
          </Container>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ CLOSING CTA ═══ */}
        <section className="bi-demo-closing-section">
          <Container size="xl">
            <div className="bi-demo-closing">
              <span aria-hidden className="bi-demo-closing-lattice" />
              <span aria-hidden className="bi-demo-closing-aura" />
              <span aria-hidden className="bi-demo-closing-aura bi-demo-closing-aura--spark" />
              <span aria-hidden className="bi-demo-closing-mark">
                <span className="bi-demo-closing-mark-core" />
                <span className="bi-demo-closing-mark-ring" />
              </span>
              <p style={kickerStyle}>{t.closingKicker}</p>
              <h2 className="bi-demo-closing-h">
                <span className="bi-demo-closing-h-lead">{t.closingHLead}</span>
                <span className="bi-demo-closing-h-body">{t.closingHBody}</span>
              </h2>
              <p className="bi-demo-closing-body">{t.closingBody}</p>
              <div className="bi-demo-closing-actions">
                <Link href="/demo" className="bi-demo-closing-primary">{t.closingPrimary}</Link>
                <Link href="/roi-calculator" className="bi-demo-closing-secondary">{t.closingSecondary}</Link>
                <Link href="/trust" className="bi-demo-closing-tertiary">{t.closingTertiary}</Link>
              </div>
              <div style={{
                marginBlockStart: space[5], fontFamily: cssVar.fontMono, fontSize: font.size.xs,
                color: cssVar.textMuted, letterSpacing: "0.1em",
              }}>
                {t.closingAvail} · {LAST_REVIEWED}
              </div>
            </div>
          </Container>
        </section>

        {/* ═══ LEGAL DISCLAIMER ═══ */}
        <section style={{ paddingBlock: space[10] }}>
          <Container size="xl">
            <details className="bi-pricing-legal">
              <summary className="bi-pricing-legal-summary">
                <span className="bi-pricing-legal-kicker">LEGAL · DISCLOSURE</span>
                <span className="bi-pricing-legal-hint">
                  {t.disclaimerH}
                  <span aria-hidden className="chev">▾</span>
                </span>
              </summary>
              <div className="bi-pricing-legal-body">
                <p>{t.disclaimer1}</p>
                <p>{t.disclaimer2}</p>
                <p>{t.disclaimer3}</p>
                <p>{t.disclaimer4}</p>
                <p>{t.disclaimer5}</p>
              </div>
            </details>
          </Container>
        </section>

        {/* JSON-LD · WebPage + FAQPage (rich results) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebPage",
                  "@id": "https://bio-ignicion.app/why#webpage",
                  name: t.jsonLdName,
                  description: t.jsonLdDesc,
                  url: "https://bio-ignicion.app/why",
                  inLanguage: locale === "en" ? "en-US" : "es-MX",
                  dateModified: LAST_REVIEWED,
                },
                {
                  "@type": "FAQPage",
                  "@id": "https://bio-ignicion.app/why#faq",
                  inLanguage: locale === "en" ? "en-US" : "es-MX",
                  mainEntity: t.faq.map((f) => ({
                    "@type": "Question",
                    name: f.q,
                    acceptedAnswer: { "@type": "Answer", text: f.a },
                  })),
                },
              ],
            }),
          }}
        />
      </main>
    </PublicShell>
  );
}
