import Link from "next/link";
import { headers } from "next/headers";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font, bioSignal } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";
import IgnitionReveal from "@/components/brand/IgnitionReveal";
import BioglyphLattice from "@/components/brand/BioglyphLattice";
import PulseDivider from "@/components/brand/PulseDivider";
import StickySectionNav from "@/components/brand/StickySectionNav";

const CADENCE_ICONS = {
  reid: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 4v4h-4" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 20v-4h4" />
    </svg>
  ),
  trauma: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 10v5" />
      <circle cx="12" cy="17.5" r="0.9" fill="currentColor" />
    </svg>
  ),
  org: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="13" width="4" height="8" rx="1" />
      <rect x="10" y="8" width="4" height="13" rx="1" />
      <rect x="17" y="3" width="4" height="18" rx="1" />
    </svg>
  ),
  archive: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
      <path d="M10 12h4" />
    </svg>
  ),
};

export const metadata = {
  title: "NOM-035 · Auditoría lista para firma",
  description:
    "NOM-035-STPS-2018 completa: aplicación, agregación anónima N≥5, reporte por dominio y evidencia firmada para tu auditor. Guía II y III.",
  alternates: { canonical: "/nom35" },
  openGraph: {
    title: "BIO-IGNICIÓN · NOM-035",
    description:
      "La auditoría de NOM-035, lista para firma — con aplicación, agregación anónima y evidencia firmada.",
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

const COPY = {
  es: {
    eyebrow: "B2B · NOM-035-STPS-2018",
    h1: "La NOM-035, lista para firma.",
    editorial: "Identificación, análisis y evidencia — no un checklist en Excel.",
    p: "Aplicamos las Guías II y III oficiales de la STPS con agregación anónima desde N≥5, generamos el reporte por dominio y entregamos el paquete de evidencia que tu auditor espera. Sin papel, sin hojas de cálculo, sin consultora externa.",
    heroCtaPrimary: "Agendar piloto de 30 días",
    heroCtaSecondary: "Ver el aplicador",
    heroCtaNote: "Piloto sin costo para equipos de ≤50 colaboradores. Respuesta en < 24 h hábiles.",
    heroRiskLead: "Multa STPS · 50 a 5,000 UMAs por trabajador afectado (LFT · marco sancionatorio) ≈ $5,657 a $565,700 MXN a valor UMA 2025.",

    metaUpdatedLabel: "ÚLTIMA REVISIÓN",
    metaUpdatedDate: "2026-04-20",
    metaUpdatedFmt: "20 · abril · 2026",
    metaScopeLabel: "APLICA A",
    metaScopeValue: "Centros de trabajo · MX",
    metaDeliverLabel: "ENTREGABLE",
    metaDeliverValue: "Evidencia firmada",
    metaContactLabel: "Contacto",
    metaContactEmail: "nom035@bio-ignicion.app",

    proofKicker: "LO QUE SE AUDITA",
    proofStats: [
      { v: "5", l: "Categorías oficiales", s: "ambiente, factores propios, organización del tiempo, liderazgo, entorno organizacional" },
      { v: "10", l: "Dominios medidos", s: "condiciones, carga, falta de control, jornada, interferencia, liderazgo, relaciones, violencia, reconocimiento, pertenencia" },
      { v: "72", l: "Ítems · Guía III", s: "46 ítems en Guía II · centros de trabajo de 15 a 50 personas" },
      { v: "N ≥ 5", l: "Mínimo de anonimato", s: "ningún reporte por debajo de este piso — ni siquiera agregado" },
      { v: "15 min", l: "Tiempo por colaborador", s: "promedio; se puede pausar y reanudar desde cualquier dispositivo" },
    ],

    riskKicker: "EL COSTO DE NO CUMPLIR",
    riskH: "La STPS no propone — sanciona.",
    riskIntro: "El marco sancionatorio de la Ley Federal del Trabajo faculta a la autoridad laboral a imponer multas de 50 a 5,000 UMAs por cada trabajador afectado cuando detecta incumplimiento de una NOM. Calculadas a valor UMA 2025 ($113.14 MXN), van de $5,657 a $565,700 MXN por colaborador. En un centro de 200 personas sin evidencia, la exposición teórica máxima supera $113 millones de pesos.",
    riskItems: [
      {
        k: "Multa mínima",
        v: "50 UMAs · por trabajador",
        note: "≈ $5,657 MXN (UMA 2025) · acto administrativo documentable en expediente.",
        ref: "LFT · Título Dieciséis",
      },
      {
        k: "Multa máxima",
        v: "5,000 UMAs · por trabajador",
        note: "≈ $565,700 MXN (UMA 2025) · reincidencia o daño comprobado.",
        ref: "LFT · Título Dieciséis",
      },
      {
        k: "Emplazamiento",
        v: "Hasta 30 días para subsanar",
        note: "Medidas específicas con evidencia documental y re-inspección programada.",
        ref: "Reglamento General de Inspección del Trabajo",
      },
      {
        k: "Publicidad",
        v: "Sanciones firmes son públicas",
        note: "Impacta licitaciones, compras gubernamentales y due diligence de M&A.",
        ref: "LGTAIP · Art. 70, fracción XXX",
      },
    ],
    riskFoot: "Cifras ilustrativas a valor UMA 2025 ($113.14 MXN, DOF 10/I/2025). El valor UMA se actualiza anualmente; confirma con asesor laboral vigente. La aplicación concreta depende del artículo específico imputado y de la discrecionalidad del inspector.",

    tldrKicker: "TL;DR · TRES FASES · 30 DÍAS",
    tldrItems: [
      { n: "01", k: "Identificar", v: "Aplicación del cuestionario oficial (Guía II o III según tamaño) con consentimiento explícito." },
      { n: "02", k: "Analizar", v: "Reporte agregado por dominio y categoría — sin PII, con historial longitudinal auditable." },
      { n: "03", k: "Remediar", v: "Plan de acción con evidencia firmada + protocolos BIO sesgados al dominio dominante." },
    ],

    regulationKicker: "LA NORMA",
    regulationH: "Lo que pide la NOM-035 — sin interpretación creativa.",
    regulationIntro: "La Norma Oficial Mexicana NOM-035-STPS-2018 obliga a identificar factores de riesgo psicosocial en todo centro de trabajo con colaboradores. Se aplica por tamaño con tres guías oficiales publicadas por la STPS.",
    guides: [
      {
        k: "Guía I",
        scope: "≤ 15 colaboradores",
        body: "Entrevistas individuales estructuradas. Aplicable a micronegocios.",
        status: "En roadmap · 2026-Q3",
        tone: "todo",
      },
      {
        k: "Guía II",
        scope: "15 – 50 colaboradores",
        body: "46 ítems en 5 categorías. Exigida para empresas pequeñas + evaluación de acontecimientos traumáticos severos.",
        status: "Disponible",
        tone: "ready",
      },
      {
        k: "Guía III",
        scope: "> 50 colaboradores",
        body: "72 ítems en 10 dominios. Agrega Entorno Organizacional — exigido para medianas y grandes empresas.",
        status: "Disponible",
        tone: "ready",
      },
    ],
    regulationFoot: "Fuente: Norma Oficial Mexicana NOM-035-STPS-2018 publicada en el DOF el 23 de octubre de 2018 · vigente.",

    howKicker: "CÓMO FUNCIONA",
    howH: "Cuatro pasos — del envío al archivo del auditor.",
    howSteps: [
      { k: "Invitar", v: "Tu equipo de RH envía el link a colaboradores por email, intranet o QR. Cada colaborador responde desde su propio dispositivo — BIO nunca ve quién responde qué." },
      { k: "Responder", v: "Cuestionario oficial con escala Likert de 5. El borrador se guarda localmente en el dispositivo hasta que el colaborador da «Enviar» con consentimiento expreso." },
      { k: "Agregar", v: "Resultados agregados desde N≥5 por dominio. Reporte automático por categoría, dominio y nivel de riesgo (nulo · bajo · medio · alto · muy alto)." },
      { k: "Firmar", v: "Paquete de evidencia con timestamps, consentimientos, DPA firmado y reporte PDF/CSV listo para la carpeta del auditor." },
    ],

    diffKicker: "POR QUÉ NO EXCEL · POR QUÉ NO CONSULTORA",
    diffH: "Tres caminos comunes — y por qué ninguno es el óptimo.",
    diffIntro: "Comparativo informativo basado en el funcionamiento común de cada alternativa. Cualquier proveedor específico puede diferir; confirma con el tuyo.",
    diffItems: [
      {
        k: "Excel / Google Forms",
        tone: "bad",
        pros: ["Costo cero en licencias", "Familiar para RH"],
        cons: ["Sin anonimato verificable", "Sin agregación automática por dominio", "Sin evidencia firmada ni timestamps", "Sin historial longitudinal auditable"],
      },
      {
        k: "Consultora tradicional",
        tone: "mid",
        pros: ["Acompañamiento humano", "Entrega impresa"],
        cons: ["Costo alto por aplicación", "No advertido: remediación tecnológica post-aplicación", "Ciclos anuales sin trend intermedio", "Dependencia de agendas externas"],
      },
      {
        k: "BIO-IGNICIÓN",
        tone: "good",
        pros: [
          "Agregación anónima desde N≥5 con auditoría append-only",
          "Evidencia firmada con timestamps y cadena SHA-256",
          "Historial trimestral para medir progreso",
          "Protocolos de remediación ligados al dominio dominante",
        ],
        cons: ["Requiere dispositivo con navegador moderno por colaborador"],
      },
    ],

    evidenceKicker: "PAQUETE DE EVIDENCIA",
    evidenceH: "Qué recibe tu auditor — en una carpeta, no en un email disperso.",
    evidenceIntro: "Cada aplicación genera un paquete inmutable con los artefactos que la STPS y tu auditor interno esperan. Exportable en PDF y CSV.",
    evidenceItems: [
      { k: "Reporte agregado", v: "PDF con nivel por dominio, por categoría y agregado global. N mínimo visible por dominio." },
      { k: "Dataset CSV", v: "Datos agregados por dominio y categoría — sin PII. Compatible con análisis longitudinal." },
      { k: "Timeline de aplicación", v: "Inicio, fin y ventanas de envío con timestamps UTC + hash SHA-256 por batch." },
      { k: "Consentimientos", v: "Registro de consentimiento individual (anónimo) con hash de la política aceptada." },
      { k: "DPA firmado", v: "Anexo al contrato de servicios — BIO-IGNICIÓN como encargado, tu empresa como controlador." },
      { k: "Política de remediación", v: "Plan de acción sugerido por dominio dominante, con protocolos BIO asociados y métrica de seguimiento." },
    ],
    evidenceCta: "Ver ejemplo del reporte",
    evidenceCtaHref: "mailto:nom035@bio-ignicion.app?subject=Sample%20NOM-035%20report",
    evidenceCtaNote: "Enviamos el sample bajo NDA; simula 40 respuestas sintéticas para ilustrar la estructura sin exponer datos reales.",

    confKicker: "ARQUITECTURA DE CONFIDENCIALIDAD",
    confH: "El piso N≥5 no es decorativo — es lo que hace que la gente responda honestamente.",
    confBody: "La tasa de participación sube cuando los colaboradores confían en que RH no verá su respuesta individual. BIO-IGNICIÓN nunca publica resultados por debajo de N≥5 por dominio, ni siquiera a admins. Si un dominio no alcanza el piso, se marca explícitamente como «N insuficiente» en el reporte.",
    confPrinciples: [
      { k: "Borrador local-first", v: "Las respuestas viven en el dispositivo del colaborador hasta que éste envía con consentimiento expreso. RH nunca ve borradores." },
      { k: "PII separada por diseño", v: "El cuestionario no pide nombre ni correo. El vínculo entre respuesta y empresa es únicamente un código de aplicación opaco." },
      { k: "N ≥ 5 por dominio", v: "Ningún reporte agregado se publica si un dominio tiene menos de cinco respuestas. Se indica explícitamente en el PDF." },
      { k: "Auditoría append-only", v: "Cada envío genera un hash SHA-256 encadenado. Nadie — ni BIO — puede reescribir un reporte después de la firma." },
    ],

    integrationKicker: "LA INTEGRACIÓN ÚNICA",
    integrationH: "El reporte no muere en la carpeta del auditor — entrena el motor de BIO.",
    integrationBody: "Una vez identificado el dominio dominante por colaborador (con su consentimiento), el motor neural de BIO-IGNICIÓN puede sesgar los protocolos sugeridos en la app: si el dominio crítico es «jornada», prioriza protocolos de recuperación; si es «falta de control», prioriza protocolos de agencia y respiración resonante. La NOM-035 deja de ser un trámite anual y se convierte en el input de la remediación diaria.",
    integrationBullets: [
      "Perfilado por dominio al 100% opt-in; revocable en cualquier momento.",
      "El sesgo neural es transparente: la app muestra «sugerido por tu perfil NOM-035» cuando aplica.",
      "Ningún dato del perfil individual sale del dispositivo del colaborador — solo el agregado anónimo.",
      "Si el colaborador revoca el consentimiento, las recomendaciones vuelven al default inmediatamente.",
    ],

    cadenceKicker: "CADENCIA OBLIGATORIA",
    cadenceH: "La NOM-035 no es un trámite único — es operación continua.",
    cadenceIntro: "La norma establece al menos cuatro ciclos obligatorios. Sin registro documental, cada ciclo que se pierde se acumula como evidencia de incumplimiento ante inspección.",
    cadenceItems: [
      { k: "Re-identificación de riesgos", v: "Al menos cada 2 años", note: "Aplicar la Guía oficial correspondiente al tamaño del centro y registrar hallazgos.", ref: "NOM-035 §7", icon: "reid" },
      { k: "Acontecimientos traumáticos severos", v: "Evaluación en ≤ 7 días", note: "Identificar colaboradores expuestos a eventos graves y canalizar atención.", ref: "NOM-035 §5.6", icon: "trauma" },
      { k: "Análisis del entorno organizacional", v: "Cada 2 años · ≥ 50 trabajadores", note: "Guía III completa con los 10 dominios, incluido entorno organizacional.", ref: "NOM-035 §5.2", icon: "org" },
      { k: "Conservación de registros", v: "Disponibles para inspección", note: "Resultados, plan de acción y evidencia deben estar accesibles al inspector STPS.", ref: "NOM-035 §8 · LFT Art. 804", icon: "archive" },
    ],
    cadenceFoot: "Cada ciclo documentado en BIO-IGNICIÓN genera un hash SHA-256 encadenado al anterior. El historial es auditable sin depender de memoria institucional ni de quién siga en RH.",

    pricingKicker: "PRECIO",
    pricingH: "Tres tiers — con piloto sin costo para equipos ≤50.",
    pricingItems: [
      {
        k: "Piloto",
        meta: "30 días",
        v: "≤ 50 colaboradores",
        note: "Aplicación Guía II completa, reporte agregado, evidencia firmada. Sin compromiso.",
        cta: "Solicitar piloto",
        ctaHref: "mailto:nom035@bio-ignicion.app?subject=Pilot%20NOM-035",
      },
      {
        k: "Growth",
        meta: "suscripción anual",
        v: "50 – 500 colaboradores",
        note: "Guía III + dashboard trimestral + integración con BIO-IGNICIÓN para protocolos de remediación.",
        cta: "Ver precio",
        ctaHref: "/pricing#growth",
      },
      {
        k: "Enterprise",
        meta: "contrato maestro",
        v: "> 500 colaboradores",
        note: "Todo lo de Growth + DPA firmado + SSO/SAML + BYOK opcional + residencia de datos seleccionable.",
        cta: "Hablar con ventas",
        ctaHref: "mailto:ventas@bio-ignicion.app?subject=Enterprise%20NOM-035",
      },
    ],

    faqKicker: "PREGUNTAS FRECUENTES DE RH",
    faqH: "Lo que pregunta legal antes de firmar.",
    faq: [
      {
        q: "¿El aplicador cumple textualmente con la Guía III oficial publicada por la STPS?",
        a: "Sí. Los 72 ítems respetan la redacción oficial y la escala Likert de 5 puntos. El orden de presentación puede variar para reducir fatiga de respuesta, pero la numeración y el texto de cada ítem es el publicado en el DOF 2018.",
      },
      {
        q: "¿Qué pasa si un dominio no alcanza N ≥ 5?",
        a: "Se marca explícitamente como «N insuficiente» en el reporte y no se publica ningún valor agregado para ese dominio. Es la única forma de proteger el anonimato de equipos pequeños.",
      },
      {
        q: "¿Cómo notifican brechas al contacto de la empresa?",
        a: "Dentro de 72 horas al contacto designado en el DPA, con información suficiente para que el controlador cumpla sus obligaciones bajo LFPDPPP y NOM-035.",
      },
      {
        q: "¿Tienen DPA firmable y listan subencargados?",
        a: "Sí. El DPA vigente está en /trust/dpa y la lista completa y auditable de subencargados en /trust/subprocessors. Notificamos altas con 30 días de antelación.",
      },
      {
        q: "¿Qué tan defendible es la evidencia ante una auditoría de la STPS?",
        a: "La evidencia incluye timestamps UTC, cadena SHA-256 append-only y consentimientos individuales. La estructura replica el índice de evidencia que piden los inspectores de la STPS en auditoría. Defendibilidad depende también del plan de acción posterior, que el reporte documenta.",
      },
      {
        q: "¿Qué sucede al término del contrato con los datos acumulados?",
        a: "Devolución o supresión certificada dentro de 30 días, según instrucciones documentadas del cliente. El historial trimestral puede exportarse en CSV antes del cierre.",
      },
      {
        q: "¿Entrenan modelos de IA con los datos?",
        a: "No. El DPA lo formaliza por escrito. El motor de recomendación de BIO-IGNICIÓN es determinístico — no usa LLM sobre datos de clientes. La funcionalidad de LLM Coach es opt-in y separada.",
      },
      {
        q: "¿Soportan SSO / SAML para admin empresarial?",
        a: "Sí en tiers Growth y Enterprise. OIDC + SAML con SCIM para provisioning. Detalle en /trust.",
      },
    ],

    ctaFinalKicker: "SIGUIENTE PASO",
    ctaFinalH: "30 minutos, una videollamada, cero papeleo.",
    ctaFinalBody: "Te mostramos el aplicador con una empresa simulada, el paquete de evidencia completo y el roadmap de remediación con BIO. Si tiene sentido, arrancamos piloto en la misma semana.",
    ctaFinalPrimary: "Agendar demo · 30 min",
    ctaFinalPrimaryHref: "mailto:nom035@bio-ignicion.app?subject=Demo%2030min%20NOM-035",
    ctaFinalSecondary: "Ver el aplicador",
    ctaFinalSecondaryHref: "/nom35/aplicador",
    ctaFinalNote: "Sin recording por defecto — producto pre-GA con datos simulados. Enviamos recap escrito < 24 h.",

    legalKicker: "AVISO LEGAL · ALCANCE",
    legalHint: "Leer",
    legalItems: [
      "Esta página describe cómo BIO-IGNICIÓN implementa la aplicación, agregación y evidencia para apoyar el cumplimiento de la NOM-035-STPS-2018. El cumplimiento final depende también de la política interna, el plan de acción y la respuesta de la empresa ante los resultados — obligaciones que corresponden al centro de trabajo, no al proveedor tecnológico.",
      "Las categorías, dominios y textos de ítems citados siguen la Guía II y la Guía III publicadas por la Secretaría del Trabajo y Previsión Social de México en el Diario Oficial de la Federación el 23 de octubre de 2018. La Guía I (entrevistas ≤15 personas) está en roadmap y se indica como tal.",
      "No vendemos ni cedemos datos personales de colaboradores a terceros para marketing ni venta. Los subencargados operacionales necesarios para prestar el servicio están listados en /trust/subprocessors y sujetos al DPA.",
      "No entrenamos modelos de IA con datos de clientes — el DPA lo formaliza por escrito. El motor de recomendación es determinístico; la funcionalidad de LLM Coach es opt-in y separada, detallada en /trust/subprocessors.",
      "Los tiempos, porcentajes y número de ítems citados reflejan la versión vigente del aplicador al 2026-04-20. Cambios materiales se documentan en el changelog público.",
      "Las cifras de multas (50 a 5,000 UMAs) y el valor UMA 2025 ($113.14 MXN, DOF 10/I/2025) son ilustrativos. La aplicación concreta depende del artículo específico imputado, del centro de trabajo y de la discrecionalidad del inspector STPS. Confirma el marco sancionatorio y el valor UMA vigente con tu asesor laboral antes de cualquier cálculo.",
      "Las referencias a artículos del cuerpo normativo (NOM-035 §5.2, §5.6, §7, §8 · LFT Art. 804 · Reglamento General de Inspección del Trabajo · LGTAIP Art. 70) se proporcionan para facilitar verificación. El cumplimiento final sigue siendo responsabilidad del centro de trabajo y de su asesor jurídico.",
      "STPS, SHRM, Aflac, APA, Gallup, Deloitte y cualquier otra marca mencionada pertenecen a sus respectivos titulares. Su mención tiene propósito referencial informativo y no implica asociación ni respaldo.",
      "La comparativa con «Excel / Google Forms» y «Consultora tradicional» describe el funcionamiento típico y no pretende evaluar a un proveedor específico; usa «No advertido» donde una alternativa no publicita una función — no implica ausencia absoluta.",
    ],
    legalTailLink: "Documentos vinculantes:",
    legalTailLinks: [
      { label: "Trust Center", href: "/trust" },
      { label: "DPA", href: "/trust/dpa" },
      { label: "Subprocesadores", href: "/trust/subprocessors" },
      { label: "Privacidad", href: "/privacy" },
    ],
    navAria: "Secciones · NOM-035",
    navItems: [
      { id: "nom-risk", label: "Riesgo" },
      { id: "nom-regulation", label: "La norma" },
      { id: "nom-how", label: "Cómo funciona" },
      { id: "nom-evidence", label: "Evidencia" },
      { id: "nom-cadence", label: "Cadencia" },
      { id: "nom-pricing", label: "Precio" },
      { id: "nom-faq", label: "FAQ" },
    ],
  },

  en: {
    eyebrow: "B2B · NOM-035-STPS-2018",
    h1: "NOM-035, ready to sign.",
    editorial: "Identification, analysis and evidence — not an Excel checklist.",
    p: "We run Mexico's official STPS Guides II and III with anonymous aggregation from N≥5, generate the per-domain report and deliver the evidence package your auditor expects. No paper, no spreadsheets, no external consultant.",
    heroCtaPrimary: "Book a 30-day pilot",
    heroCtaSecondary: "See the questionnaire",
    heroCtaNote: "Free pilot for teams ≤50 employees. Response in < 24 business hours.",
    heroRiskLead: "STPS fine · 50 to 5,000 UMAs per affected worker (LFT · penalty framework) ≈ MXN $5,657 to $565,700 at 2025 UMA.",

    metaUpdatedLabel: "LAST REVIEW",
    metaUpdatedDate: "2026-04-20",
    metaUpdatedFmt: "April 20, 2026",
    metaScopeLabel: "SCOPE",
    metaScopeValue: "Workplaces · Mexico",
    metaDeliverLabel: "DELIVERABLE",
    metaDeliverValue: "Signed evidence",
    metaContactLabel: "Contact",
    metaContactEmail: "nom035@bio-ignicion.app",

    proofKicker: "WHAT GETS AUDITED",
    proofStats: [
      { v: "5", l: "Official categories", s: "environment, job factors, time organization, leadership, organizational environment" },
      { v: "10", l: "Domains measured", s: "conditions, workload, lack of control, shift, interference, leadership, relationships, violence, recognition, belonging" },
      { v: "72", l: "Items · Guide III", s: "46 items in Guide II · workplaces with 15 to 50 employees" },
      { v: "N ≥ 5", l: "Anonymity floor", s: "no report below this floor — not even aggregated" },
      { v: "15 min", l: "Per employee", s: "average; pause and resume from any device" },
    ],

    riskKicker: "THE COST OF NON-COMPLIANCE",
    riskH: "STPS doesn't suggest — it sanctions.",
    riskIntro: "Mexico's Federal Labor Law empowers the labor authority to impose fines of 50 to 5,000 UMAs per affected worker when it detects non-compliance with an Official Standard. Calculated at 2025 UMA (MXN $113.14), this ranges from MXN $5,657 to $565,700 per employee. For a 200-person workplace with no evidence, theoretical maximum exposure exceeds MXN $113 million.",
    riskItems: [
      {
        k: "Minimum fine",
        v: "50 UMAs · per worker",
        note: "≈ MXN $5,657 (2025 UMA) · documentable administrative act in the inspection file.",
        ref: "LFT · Title Sixteen",
      },
      {
        k: "Maximum fine",
        v: "5,000 UMAs · per worker",
        note: "≈ MXN $565,700 (2025 UMA) · recurrence or proven harm.",
        ref: "LFT · Title Sixteen",
      },
      {
        k: "Compliance order",
        v: "Up to 30 days to remediate",
        note: "Specific measures with documented evidence and a scheduled re-inspection.",
        ref: "General Labor Inspection Regulation",
      },
      {
        k: "Publicity",
        v: "Final sanctions are public",
        note: "Affects government procurement, RFPs and M&A due diligence.",
        ref: "Transparency Law · Art. 70, XXX",
      },
    ],
    riskFoot: "Illustrative figures at 2025 UMA (MXN $113.14, DOF 10/I/2025). The UMA is updated annually; confirm the current value with your labor counsel. The concrete application depends on the specific article invoked and the inspector's discretion.",

    tldrKicker: "TL;DR · THREE PHASES · 30 DAYS",
    tldrItems: [
      { n: "01", k: "Identify", v: "Application of the official questionnaire (Guide II or III by headcount) with explicit consent." },
      { n: "02", k: "Analyze", v: "Aggregated report by domain and category — no PII, with auditable longitudinal history." },
      { n: "03", k: "Remediate", v: "Action plan with signed evidence + BIO protocols biased to the dominant domain." },
    ],

    regulationKicker: "THE REGULATION",
    regulationH: "What NOM-035 asks for — without creative interpretation.",
    regulationIntro: "Mexican Official Standard NOM-035-STPS-2018 mandates the identification of psychosocial risk factors in any workplace with employees. It applies by size through three official STPS-published guides.",
    guides: [
      {
        k: "Guide I",
        scope: "≤ 15 employees",
        body: "Individual structured interviews. Applicable to micro-businesses.",
        status: "On roadmap · 2026-Q3",
        tone: "todo",
      },
      {
        k: "Guide II",
        scope: "15 – 50 employees",
        body: "46 items in 5 categories. Required for small businesses + severe traumatic events evaluation.",
        status: "Available",
        tone: "ready",
      },
      {
        k: "Guide III",
        scope: "> 50 employees",
        body: "72 items in 10 domains. Adds Organizational Environment — required for medium and large businesses.",
        status: "Available",
        tone: "ready",
      },
    ],
    regulationFoot: "Source: Mexican Official Standard NOM-035-STPS-2018 published in the DOF on October 23, 2018 · in force.",

    howKicker: "HOW IT WORKS",
    howH: "Four steps — from send-out to the auditor's folder.",
    howSteps: [
      { k: "Invite", v: "Your HR team shares the link with employees via email, intranet or QR. Each employee answers from their own device — BIO never sees who answered what." },
      { k: "Respond", v: "Official questionnaire with 5-point Likert scale. Draft saved locally on the device until the employee hits «Submit» with express consent." },
      { k: "Aggregate", v: "Results aggregated from N≥5 per domain. Automatic report by category, domain and risk level (none · low · medium · high · very high)." },
      { k: "Sign", v: "Evidence package with timestamps, consents, signed DPA and PDF/CSV report ready for the auditor's folder." },
    ],

    diffKicker: "WHY NOT EXCEL · WHY NOT A CONSULTANCY",
    diffH: "Three common paths — and why none is optimal.",
    diffIntro: "Informational comparison based on how each alternative typically operates. Any specific provider may differ; confirm with yours.",
    diffItems: [
      {
        k: "Excel / Google Forms",
        tone: "bad",
        pros: ["Zero license cost", "Familiar for HR"],
        cons: ["No verifiable anonymity", "No automatic per-domain aggregation", "No signed evidence or timestamps", "No auditable longitudinal history"],
      },
      {
        k: "Traditional consultancy",
        tone: "mid",
        pros: ["Human guidance", "Printed delivery"],
        cons: ["High per-application cost", "Not advertised: post-application technological remediation", "Annual cycles with no intermediate trend", "Dependence on external agendas"],
      },
      {
        k: "BIO-IGNICIÓN",
        tone: "good",
        pros: [
          "Anonymous aggregation from N≥5 with append-only audit",
          "Signed evidence with timestamps and SHA-256 chain",
          "Quarterly history to measure progress",
          "Remediation protocols linked to the dominant domain",
        ],
        cons: ["Requires a modern browser device per employee"],
      },
    ],

    evidenceKicker: "EVIDENCE PACKAGE",
    evidenceH: "What your auditor gets — in one folder, not scattered emails.",
    evidenceIntro: "Each application generates an immutable package with the artifacts STPS and your internal auditor expect. Exportable as PDF and CSV.",
    evidenceItems: [
      { k: "Aggregated report", v: "PDF with level by domain, by category and global aggregate. Minimum N visible per domain." },
      { k: "CSV dataset", v: "Aggregated data by domain and category — no PII. Compatible with longitudinal analysis." },
      { k: "Application timeline", v: "Start, end and send-out windows with UTC timestamps + SHA-256 hash per batch." },
      { k: "Consents", v: "Individual (anonymous) consent log with hash of the accepted policy." },
      { k: "Signed DPA", v: "Addendum to the services agreement — BIO-IGNICIÓN as processor, your company as controller." },
      { k: "Remediation plan", v: "Action plan suggested by dominant domain, with associated BIO protocols and tracking metric." },
    ],
    evidenceCta: "Request sample report",
    evidenceCtaHref: "mailto:nom035@bio-ignicion.app?subject=Sample%20NOM-035%20report",
    evidenceCtaNote: "Sample shared under NDA; simulates 40 synthetic responses to illustrate structure without exposing real data.",

    confKicker: "CONFIDENTIALITY ARCHITECTURE",
    confH: "The N≥5 floor is not decorative — it's what makes people answer honestly.",
    confBody: "Participation rate rises when employees trust HR won't see their individual answer. BIO-IGNICIÓN never publishes results below N≥5 per domain, not even to admins. If a domain doesn't meet the floor, it's explicitly flagged as «insufficient N» in the report.",
    confPrinciples: [
      { k: "Local-first draft", v: "Responses live on the employee's device until they submit with express consent. HR never sees drafts." },
      { k: "PII separated by design", v: "The questionnaire doesn't ask for name or email. The link between answer and company is only an opaque application code." },
      { k: "N ≥ 5 per domain", v: "No aggregated report is published if a domain has fewer than five responses. Explicitly flagged in the PDF." },
      { k: "Append-only audit", v: "Each submission generates a chained SHA-256 hash. No one — not even BIO — can rewrite a report after signing." },
    ],

    integrationKicker: "THE UNIQUE INTEGRATION",
    integrationH: "The report doesn't die in the auditor's folder — it trains BIO's engine.",
    integrationBody: "Once the dominant domain per employee is identified (with their consent), BIO-IGNICIÓN's neural engine can bias the protocols suggested in the app: if the critical domain is «shift», it prioritizes recovery protocols; if it's «lack of control», it prioritizes agency and resonant breathing protocols. NOM-035 stops being an annual paperwork exercise and becomes the input for daily remediation.",
    integrationBullets: [
      "Per-domain profiling is 100% opt-in; revocable at any time.",
      "The neural bias is transparent: the app shows «suggested by your NOM-035 profile» when applicable.",
      "No individual profile data leaves the employee's device — only anonymous aggregate.",
      "If the employee revokes consent, recommendations return to default immediately.",
    ],

    cadenceKicker: "MANDATORY CADENCE",
    cadenceH: "NOM-035 is not a one-off — it's continuous operation.",
    cadenceIntro: "The standard establishes at least four mandatory cycles. Without documented record, every missed cycle accumulates as non-compliance evidence before inspection.",
    cadenceItems: [
      { k: "Risk re-identification", v: "At least every 2 years", note: "Apply the official Guide matching your headcount and record findings.", ref: "NOM-035 §7", icon: "reid" },
      { k: "Severe traumatic events", v: "Evaluation in ≤ 7 days", note: "Identify exposed employees and route them to care.", ref: "NOM-035 §5.6", icon: "trauma" },
      { k: "Organizational environment analysis", v: "Every 2 years · ≥ 50 employees", note: "Complete Guide III across the 10 domains, including organizational environment.", ref: "NOM-035 §5.2", icon: "org" },
      { k: "Record retention", v: "Available for inspection", note: "Results, action plan and evidence must be accessible to the STPS inspector.", ref: "NOM-035 §8 · LFT Art. 804", icon: "archive" },
    ],
    cadenceFoot: "Each documented cycle in BIO-IGNICIÓN generates an SHA-256 hash chained to the previous one. History is auditable without depending on institutional memory or on who's next in HR.",

    pricingKicker: "PRICING",
    pricingH: "Three tiers — with a free pilot for teams ≤50.",
    pricingItems: [
      {
        k: "Pilot",
        meta: "30 days",
        v: "≤ 50 employees",
        note: "Complete Guide II application, aggregated report, signed evidence. No commitment.",
        cta: "Request pilot",
        ctaHref: "mailto:nom035@bio-ignicion.app?subject=Pilot%20NOM-035",
      },
      {
        k: "Growth",
        meta: "annual subscription",
        v: "50 – 500 employees",
        note: "Guide III + quarterly dashboard + BIO-IGNICIÓN integration for remediation protocols.",
        cta: "See pricing",
        ctaHref: "/pricing#growth",
      },
      {
        k: "Enterprise",
        meta: "master agreement",
        v: "> 500 employees",
        note: "Everything in Growth + signed DPA + SSO/SAML + optional BYOK + selectable data residency.",
        cta: "Talk to sales",
        ctaHref: "mailto:ventas@bio-ignicion.app?subject=Enterprise%20NOM-035",
      },
    ],

    faqKicker: "HR FREQUENTLY ASKED QUESTIONS",
    faqH: "What legal asks before signing.",
    faq: [
      {
        q: "Does the questionnaire literally comply with the official Guide III published by STPS?",
        a: "Yes. The 72 items respect the official wording and the 5-point Likert scale. Presentation order may vary to reduce response fatigue, but the numbering and text of each item is as published in DOF 2018.",
      },
      {
        q: "What happens if a domain doesn't reach N ≥ 5?",
        a: "It's explicitly flagged as «insufficient N» in the report and no aggregated value is published for that domain. It's the only way to protect the anonymity of small teams.",
      },
      {
        q: "How do you notify breaches to the company contact?",
        a: "Within 72 hours to the designated contact in the DPA, with sufficient information for the controller to meet its obligations under LFPDPPP and NOM-035.",
      },
      {
        q: "Do you have a signable DPA and list subprocessors?",
        a: "Yes. The current DPA is at /trust/dpa and the complete auditable list of subprocessors at /trust/subprocessors. We notify additions with 30 days' advance notice.",
      },
      {
        q: "How defensible is the evidence before an STPS audit?",
        a: "The evidence includes UTC timestamps, append-only SHA-256 chain and individual consents. The structure replicates the evidence index STPS inspectors request in audits. Defensibility also depends on the subsequent action plan, which the report documents.",
      },
      {
        q: "What happens to accumulated data at the end of the contract?",
        a: "Certified return or deletion within 30 days, per the customer's documented instructions. Quarterly history can be exported as CSV before close.",
      },
      {
        q: "Do you train AI models on the data?",
        a: "No. The DPA formalizes this in writing. BIO-IGNICIÓN's recommendation engine is deterministic — no LLM on customer data. The LLM Coach feature is opt-in and separate.",
      },
      {
        q: "Do you support SSO / SAML for enterprise admin?",
        a: "Yes on Growth and Enterprise tiers. OIDC + SAML with SCIM provisioning. Detail at /trust.",
      },
    ],

    ctaFinalKicker: "NEXT STEP",
    ctaFinalH: "30 minutes, one video call, zero paperwork.",
    ctaFinalBody: "We show you the questionnaire with a simulated company, the complete evidence package and the BIO remediation roadmap. If it makes sense, we start the pilot the same week.",
    ctaFinalPrimary: "Book demo · 30 min",
    ctaFinalPrimaryHref: "mailto:nom035@bio-ignicion.app?subject=Demo%2030min%20NOM-035",
    ctaFinalSecondary: "See the questionnaire",
    ctaFinalSecondaryHref: "/nom35/aplicador",
    ctaFinalNote: "No recording by default — pre-GA product with simulated data. Written recap sent < 24 h.",

    legalKicker: "LEGAL NOTICE · SCOPE",
    legalHint: "Read",
    legalItems: [
      "This page describes how BIO-IGNICIÓN implements application, aggregation and evidence to support NOM-035-STPS-2018 compliance. Final compliance also depends on internal policy, the action plan and the company's response to results — obligations that fall on the workplace, not the technology provider.",
      "The categories, domains and item texts cited follow Guide II and Guide III published by Mexico's Ministry of Labor and Social Welfare (STPS) in the Official Gazette of the Federation on October 23, 2018. Guide I (interviews ≤15 people) is on the roadmap and flagged as such.",
      "We do not sell or share employee personal data with third parties for marketing or sale. Operational subprocessors needed to deliver the service are listed at /trust/subprocessors and subject to the DPA.",
      "We do not train AI models on customer data — the DPA formalizes this in writing. The recommendation engine is deterministic; the LLM Coach feature is opt-in and separate, detailed at /trust/subprocessors.",
      "Times, percentages and item counts cited reflect the current version of the questionnaire as of 2026-04-20. Material changes are documented in the public changelog.",
      "Fine figures (50 to 5,000 UMAs) and the 2025 UMA value (MXN $113.14, DOF 10/I/2025) are illustrative. Concrete application depends on the specific article invoked, the workplace and the STPS inspector's discretion. Confirm the current penalty framework and UMA value with your labor counsel before any calculation.",
      "References to specific articles (NOM-035 §5.2, §5.6, §7, §8 · LFT Art. 804 · General Labor Inspection Regulation · Transparency Law Art. 70) are provided to ease verification. Final compliance remains the responsibility of the workplace and its legal counsel.",
      "STPS, SHRM, Aflac, APA, Gallup, Deloitte and any other trademark mentioned belong to their respective owners. Their mention is informational and does not imply partnership or endorsement.",
      "The comparison with «Excel / Google Forms» and «Traditional consultancy» describes typical functioning and does not intend to evaluate a specific provider; uses «Not advertised» where an alternative does not advertise a feature — does not imply absolute absence.",
    ],
    legalTailLink: "Binding documents:",
    legalTailLinks: [
      { label: "Trust Center", href: "/trust" },
      { label: "DPA", href: "/trust/dpa" },
      { label: "Subprocessors", href: "/trust/subprocessors" },
      { label: "Privacy", href: "/privacy" },
    ],
    navAria: "Sections · NOM-035",
    navItems: [
      { id: "nom-risk", label: "Risk" },
      { id: "nom-regulation", label: "The regulation" },
      { id: "nom-how", label: "How it works" },
      { id: "nom-evidence", label: "Evidence" },
      { id: "nom-cadence", label: "Cadence" },
      { id: "nom-pricing", label: "Pricing" },
      { id: "nom-faq", label: "FAQ" },
    ],
  },
};

export default async function Nom35MarketingPage() {
  const locale = await getServerLocale();
  const L = locale === "en" ? "en" : "es";
  const c = COPY[L];
  const nonce = (await headers()).get("x-nonce") || undefined;

  return (
    <PublicShell activePath="/nom35">
      <StickySectionNav items={c.navItems} ariaLabel={c.navAria} />

      {/* ═══ Hero ═══ */}
      <Container size="lg" className="bi-prose">
        <div style={{ position: "relative", paddingBlock: space[8] }}>
          <div aria-hidden className="bi-trust-lattice">
            <BioglyphLattice variant="ambient" />
          </div>

          <IgnitionReveal sparkOrigin="30% 40%">
            <div style={{ position: "relative", zIndex: 1, maxInlineSize: 820 }}>
              <div style={kickerStyle}>{c.eyebrow}</div>
              <h1
                style={{
                  margin: `${space[3]}px 0 ${space[4]}px`,
                  fontSize: "clamp(40px, 6vw, 76px)",
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
              <p style={{ margin: `0 0 ${space[5]}px`, lineHeight: 1.65, color: cssVar.textDim, maxInlineSize: 720 }}>
                {c.p}
              </p>

              <div className="bi-trust-hero-ctas">
                <a
                  className="bi-trust-hero-cta bi-trust-hero-cta--primary"
                  href="mailto:nom035@bio-ignicion.app?subject=NOM-035%20Pilot"
                >
                  {c.heroCtaPrimary}
                  <span className="bi-trust-hero-cta-arrow" aria-hidden>→</span>
                </a>
                <Link className="bi-trust-hero-cta bi-trust-hero-cta--ghost" href="/nom35/aplicador">
                  {c.heroCtaSecondary}
                </Link>
                <span className="bi-trust-hero-cta-note">{c.heroCtaNote}</span>
              </div>

              <p className="bi-nom-hero-risk" role="note">
                <span className="bi-nom-hero-risk-dot" aria-hidden />
                {c.heroRiskLead}
              </p>

              <div className="bi-trust-meta" role="group" aria-label={c.metaUpdatedLabel}>
                <span className="bi-trust-meta-kicker">{c.metaUpdatedLabel}</span>
                <time className="bi-trust-meta-time" dateTime={c.metaUpdatedDate}>{c.metaUpdatedFmt}</time>
                <span className="bi-trust-meta-dot" aria-hidden>·</span>
                <span className="bi-trust-meta-kicker">{c.metaScopeLabel}</span>
                <span className="bi-trust-meta-time">{c.metaScopeValue}</span>
                <span className="bi-trust-meta-dot" aria-hidden>·</span>
                <span className="bi-trust-meta-kicker">{c.metaDeliverLabel}</span>
                <span className="bi-trust-meta-time">{c.metaDeliverValue}</span>
                <span className="bi-trust-meta-dot" aria-hidden>·</span>
                <span className="bi-trust-meta-kicker">{c.metaContactLabel}</span>
                <a className="bi-trust-meta-mail" href={`mailto:${c.metaContactEmail}`}>{c.metaContactEmail}</a>
              </div>
            </div>
          </IgnitionReveal>
        </div>
      </Container>

      {/* ═══ Proof stats ═══ */}
      <section aria-label={c.proofKicker} style={{ marginBlockStart: space[6] }}>
        <Container size="xl" style={{ paddingInline: 0 }}>
          <div className="bi-trust-live-kicker" role="status" aria-live="off">
            <span className="bi-trust-live-dot" aria-hidden />
            <span className="bi-trust-live-label">NOM-035</span>
            <span className="bi-trust-live-sep" aria-hidden>·</span>
            <span className="bi-trust-live-when">{c.metaUpdatedLabel} {c.metaUpdatedFmt}</span>
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

      {/* ═══ Risk · cost of non-compliance ═══ */}
      <section className="bi-trust-section bi-trust-section--tint" aria-labelledby="nom-risk" id="nom-risk" style={{ paddingBlock: space[9], paddingInline: space[5], marginBlockStart: space[7], scrollMarginBlockStart: 80 }}>
        <Container size="lg">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[6] }}>
              <div style={kickerStyle}>{c.riskKicker}</div>
              <h2 id="nom-risk" style={sectionHeading}>{c.riskH}</h2>
              <p style={{
                marginBlockStart: space[3],
                marginInline: "auto",
                maxInlineSize: 720,
                color: cssVar.textDim,
                fontSize: font.size.md,
                lineHeight: 1.6,
              }}>
                {c.riskIntro}
              </p>
            </div>
            <ul className="bi-nom-risk" role="list">
              {c.riskItems.map((r) => (
                <li key={r.k} className="bi-nom-risk-card">
                  <span className="bi-nom-risk-k">{r.k}</span>
                  <div className="bi-nom-risk-v">{r.v}</div>
                  <p className="bi-nom-risk-note">{r.note}</p>
                  <span className="bi-nom-risk-ref">{r.ref}</span>
                </li>
              ))}
            </ul>
            <p className="bi-nom-risk-foot">{c.riskFoot}</p>
          </IgnitionReveal>
        </Container>
      </section>

      {/* ═══ TL;DR ═══ */}
      <section aria-labelledby="nom-tldr" id="nom-tldr" style={{ paddingInline: space[5], paddingBlockStart: space[7], scrollMarginBlockStart: 80 }}>
        <Container size="lg">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div className="bi-trust-tldr">
              <div className="bi-trust-tldr-head">
                <span className="bi-trust-tldr-kicker">{c.tldrKicker}</span>
              </div>
              <ol className="bi-trust-tldr-list" role="list">
                {c.tldrItems.map((t) => (
                  <li key={t.n} className="bi-trust-tldr-item">
                    <span className="bi-trust-tldr-n" aria-hidden>{t.n}</span>
                    <span className="bi-trust-tldr-k">{t.k}</span>
                    <span className="bi-trust-tldr-v">{t.v}</span>
                  </li>
                ))}
              </ol>
            </div>
          </IgnitionReveal>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      {/* ═══ The regulation ═══ */}
      <section className="bi-trust-section bi-trust-section--tint" aria-labelledby="nom-regulation" id="nom-regulation" style={{ paddingBlock: space[9], paddingInline: space[5], scrollMarginBlockStart: 80 }}>
        <Container size="lg">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[7] }}>
              <div style={kickerStyle}>{c.regulationKicker}</div>
              <h2 id="nom-regulation" style={sectionHeading}>{c.regulationH}</h2>
              <p style={{
                marginBlockStart: space[3],
                marginInline: "auto",
                maxInlineSize: 680,
                color: cssVar.textDim,
                fontSize: font.size.md,
                lineHeight: 1.6,
              }}>
                {c.regulationIntro}
              </p>
            </div>
            <ul className="bi-nom-guides" role="list">
              {c.guides.map((g) => (
                <li key={g.k} className="bi-nom-guide" data-tone={g.tone}>
                  <div className="bi-nom-guide-head">
                    <span className="bi-nom-guide-k">{g.k}</span>
                    <span className="bi-nom-guide-scope">{g.scope}</span>
                  </div>
                  <p className="bi-nom-guide-body">{g.body}</p>
                  <span className="bi-nom-guide-status" data-tone={g.tone}>
                    <span className="dot" aria-hidden />
                    {g.status}
                  </span>
                </li>
              ))}
            </ul>
            <p className="bi-nom-foot">{c.regulationFoot}</p>
          </IgnitionReveal>
        </Container>
      </section>

      {/* ═══ How it works ═══ */}
      <section aria-labelledby="nom-how" id="nom-how" style={{ paddingBlock: space[9], paddingInline: space[5], scrollMarginBlockStart: 80 }}>
        <Container size="xl">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[7] }}>
              <div style={kickerStyle}>{c.howKicker}</div>
              <h2 id="nom-how" style={sectionHeading}>{c.howH}</h2>
            </div>
            <div className="bi-how-grid bi-trust-controls-grid" role="list">
              {c.howSteps.map((s) => (
                <article key={s.k} className="bi-how-step" role="listitem">
                  <h4>{s.k}</h4>
                  <p>{s.v}</p>
                </article>
              ))}
            </div>
          </IgnitionReveal>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      {/* ═══ Comparison ═══ */}
      <section className="bi-trust-section bi-trust-section--tint" aria-labelledby="nom-diff" id="nom-diff" style={{ paddingBlock: space[9], paddingInline: space[5], scrollMarginBlockStart: 80 }}>
        <Container size="lg">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[6] }}>
              <div style={kickerStyle}>{c.diffKicker}</div>
              <h2 id="nom-diff" style={sectionHeading}>{c.diffH}</h2>
              <p style={{
                marginBlockStart: space[3],
                marginInline: "auto",
                maxInlineSize: 640,
                color: cssVar.textDim,
                fontSize: font.size.sm,
                lineHeight: 1.6,
              }}>
                {c.diffIntro}
              </p>
            </div>
            <ul className="bi-nom-diff" role="list">
              {c.diffItems.map((d) => (
                <li key={d.k} className="bi-nom-diff-card" data-tone={d.tone}>
                  <h3 className="bi-nom-diff-k">{d.k}</h3>
                  <div className="bi-nom-diff-col">
                    <div className="bi-nom-diff-col-kicker" data-kind="pro">+ Pros</div>
                    <ul className="bi-nom-diff-list">
                      {d.pros.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                  <div className="bi-nom-diff-col">
                    <div className="bi-nom-diff-col-kicker" data-kind="con">− Contras</div>
                    <ul className="bi-nom-diff-list bi-nom-diff-list--con">
                      {d.cons.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                </li>
              ))}
            </ul>
          </IgnitionReveal>
        </Container>
      </section>

      {/* ═══ Evidence package ═══ */}
      <section aria-labelledby="nom-evidence" id="nom-evidence" style={{ paddingBlock: space[9], paddingInline: space[5], scrollMarginBlockStart: 80 }}>
        <Container size="lg">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[6] }}>
              <div style={kickerStyle}>{c.evidenceKicker}</div>
              <h2 id="nom-evidence" style={sectionHeading}>{c.evidenceH}</h2>
              <p style={{
                marginBlockStart: space[3],
                marginInline: "auto",
                maxInlineSize: 640,
                color: cssVar.textDim,
                fontSize: font.size.md,
                lineHeight: 1.6,
              }}>
                {c.evidenceIntro}
              </p>
            </div>
            <ol className="bi-trust-principles" role="list">
              {c.evidenceItems.map((e, i) => (
                <li key={e.k} className="bi-trust-principle">
                  <span className="bi-trust-principle-n" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                  <div className="bi-trust-principle-body">
                    <h3 className="bi-trust-principle-k">{e.k}</h3>
                    <p className="bi-trust-principle-v">{e.v}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="bi-nom-evidence-foot">
              <a className="bi-trust-hero-cta bi-trust-hero-cta--primary" href={c.evidenceCtaHref}>
                {c.evidenceCta}
                <span className="bi-trust-hero-cta-arrow" aria-hidden>→</span>
              </a>
              <span className="bi-trust-hero-cta-note">{c.evidenceCtaNote}</span>
            </div>
          </IgnitionReveal>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      {/* ═══ Confidentiality ═══ */}
      <section className="bi-trust-section bi-trust-section--tint" aria-labelledby="nom-conf" id="nom-conf" style={{ paddingBlock: space[9], paddingInline: space[5], scrollMarginBlockStart: 80 }}>
        <Container size="lg">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[6] }}>
              <div style={kickerStyle}>{c.confKicker}</div>
              <h2 id="nom-conf" style={sectionHeading}>{c.confH}</h2>
              <p style={{
                marginBlockStart: space[3],
                marginInline: "auto",
                maxInlineSize: 680,
                color: cssVar.textDim,
                fontSize: font.size.md,
                lineHeight: 1.6,
              }}>
                {c.confBody}
              </p>
            </div>
            <ul className="bi-trust-highlights" role="list">
              {c.confPrinciples.map((p) => (
                <li key={p.k} className="bi-trust-highlight" style={{ textAlign: "left", alignItems: "flex-start" }}>
                  <span className="bi-trust-highlight-k" style={{ fontSize: "clamp(15px, 1.6vw, 18px)" }}>{p.k}</span>
                  <span className="bi-trust-highlight-v">{p.v}</span>
                </li>
              ))}
            </ul>
          </IgnitionReveal>
        </Container>
      </section>

      {/* ═══ Integration with BIO ═══ */}
      <section aria-labelledby="nom-integration" id="nom-integration" style={{ paddingBlock: space[9], paddingInline: space[5], scrollMarginBlockStart: 80 }}>
        <Container size="lg">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div className="bi-nom-integration">
              <div className="bi-nom-integration-head">
                <span className="bi-nom-integration-kicker">{c.integrationKicker}</span>
                <h2 id="nom-integration" className="bi-nom-integration-title">{c.integrationH}</h2>
              </div>
              <p className="bi-nom-integration-body">{c.integrationBody}</p>
              <ul className="bi-nom-integration-list" role="list">
                {c.integrationBullets.map((b) => (
                  <li key={b}><span aria-hidden>▸</span>{b}</li>
                ))}
              </ul>
            </div>
          </IgnitionReveal>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      {/* ═══ Mandatory cadence ═══ */}
      <section className="bi-trust-section bi-trust-section--tint" aria-labelledby="nom-cadence" id="nom-cadence" style={{ paddingBlock: space[9], paddingInline: space[5], scrollMarginBlockStart: 80 }}>
        <Container size="lg">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[6] }}>
              <div style={kickerStyle}>{c.cadenceKicker}</div>
              <h2 id="nom-cadence" style={sectionHeading}>{c.cadenceH}</h2>
              <p style={{
                marginBlockStart: space[3],
                marginInline: "auto",
                maxInlineSize: 720,
                color: cssVar.textDim,
                fontSize: font.size.md,
                lineHeight: 1.6,
              }}>
                {c.cadenceIntro}
              </p>
            </div>
            <ol className="bi-nom-cadence" role="list">
              {c.cadenceItems.map((ci) => (
                <li key={ci.k} className="bi-nom-cadence-item">
                  <span className="bi-nom-cadence-icon" aria-hidden>{CADENCE_ICONS[ci.icon]}</span>
                  <div className="bi-nom-cadence-body">
                    <div className="bi-nom-cadence-head">
                      <h3 className="bi-nom-cadence-k">{ci.k}</h3>
                      <span className="bi-nom-cadence-v">{ci.v}</span>
                    </div>
                    <p className="bi-nom-cadence-note">{ci.note}</p>
                    <span className="bi-nom-cadence-ref">{ci.ref}</span>
                  </div>
                </li>
              ))}
            </ol>
            <p className="bi-nom-cadence-foot">{c.cadenceFoot}</p>
          </IgnitionReveal>
        </Container>
      </section>

      {/* ═══ Pricing ═══ */}
      <section aria-labelledby="nom-pricing" id="nom-pricing" style={{ paddingBlock: space[9], paddingInline: space[5], scrollMarginBlockStart: 80 }}>
        <Container size="lg">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[7] }}>
              <div style={kickerStyle}>{c.pricingKicker}</div>
              <h2 id="nom-pricing" style={sectionHeading}>{c.pricingH}</h2>
            </div>
            <ul className="bi-nom-pricing" role="list">
              {c.pricingItems.map((p) => {
                const isMail = p.ctaHref.startsWith("mailto:");
                const Tag = isMail ? "a" : Link;
                return (
                  <li key={p.k} className="bi-nom-pricing-card">
                    <div className="bi-nom-pricing-head">
                      <h3 className="bi-nom-pricing-k">{p.k}</h3>
                      <span className="bi-nom-pricing-meta">{p.meta}</span>
                    </div>
                    <div className="bi-nom-pricing-v">{p.v}</div>
                    <p className="bi-nom-pricing-note">{p.note}</p>
                    <Tag href={p.ctaHref} className="bi-nom-pricing-cta">
                      {p.cta}
                      <span aria-hidden>→</span>
                    </Tag>
                  </li>
                );
              })}
            </ul>
          </IgnitionReveal>
        </Container>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="bi-trust-section bi-trust-section--tint" aria-labelledby="nom-faq" id="nom-faq" style={{ paddingBlock: space[9], paddingInline: space[5], scrollMarginBlockStart: 80 }}>
        <Container size="md">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[7] }}>
              <div style={kickerStyle}>{c.faqKicker}</div>
              <h2 id="nom-faq" style={sectionHeading}>{c.faqH}</h2>
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

      {/* ═══ Final CTA ═══ */}
      <section className="bi-trust-section bi-trust-section--tint bi-trust-section--tint-alt" aria-labelledby="nom-cta" id="nom-cta" style={{ paddingBlock: space[8], paddingInline: space[5] }}>
        <Container size="md">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center" }}>
              <div style={kickerStyle}>{c.ctaFinalKicker}</div>
              <h2 id="nom-cta" style={sectionHeading}>{c.ctaFinalH}</h2>
              <p style={{
                marginBlockStart: space[3],
                marginInline: "auto",
                maxInlineSize: 600,
                color: cssVar.textDim,
                fontSize: font.size.md,
                lineHeight: 1.6,
              }}>
                {c.ctaFinalBody}
              </p>
              <div className="bi-trust-hero-ctas" style={{ justifyContent: "center", marginBlockStart: space[5] }}>
                <a className="bi-trust-hero-cta bi-trust-hero-cta--primary" href={c.ctaFinalPrimaryHref}>
                  {c.ctaFinalPrimary}
                  <span className="bi-trust-hero-cta-arrow" aria-hidden>→</span>
                </a>
                <Link className="bi-trust-hero-cta bi-trust-hero-cta--ghost" href={c.ctaFinalSecondaryHref}>
                  {c.ctaFinalSecondary}
                </Link>
              </div>
              <span className="bi-trust-hero-cta-note" style={{ display: "block", marginBlockStart: space[3] }}>
                {c.ctaFinalNote}
              </span>
            </div>
          </IgnitionReveal>
        </Container>
      </section>

      {/* ═══ Legal disclaimer ═══ */}
      <Container size="md" style={{ paddingInline: space[5], paddingBlockEnd: space[8], paddingBlockStart: space[7] }}>
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
            <li>
              {c.legalTailLink}{" "}
              {c.legalTailLinks.map((l, i) => (
                <span key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                  {i < c.legalTailLinks.length - 1 ? " · " : "."}
                </span>
              ))}
            </li>
          </ul>
        </details>
      </Container>

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
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
    </PublicShell>
  );
}
