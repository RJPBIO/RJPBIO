/* ═══════════════════════════════════════════════════════════════
   /for-tech — Vertical B2B landing for engineering orgs with 24/7
   on-call rotation: SaaS, platform, infra, SRE and developer-tools
   companies. Thesis: on-call fatigue is an incident-response-risk
   and SRE-churn problem (SOC 2 CC7.3 / ISO 27035 / NIST 800-61),
   not an engineering-culture problem.
   Reuses .bi-roi-*, .bi-proof-stats, .bi-demo-closing-*, .bi-legal-*
   primitives. No new CSS required.
   ═══════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font, bioSignal } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";
import IgnitionReveal from "@/components/brand/IgnitionReveal";
import BioglyphLattice from "@/components/brand/BioglyphLattice";
import PulseDivider from "@/components/brand/PulseDivider";

export const metadata = {
  title: "Para Tech · Fatiga de on-call es riesgo de incidente",
  description:
    "Alert fatigue, MTTR degradado y churn de SRE senior tienen raíz fisiológica común. BIO-IGNICIÓN aporta evidencia compatible con SOC 2 CC7.3, ISO/IEC 27035 y NIST SP 800-61 · 3 min post-incident · SSO + SCIM.",
  alternates: { canonical: "/for-tech" },
  openGraph: {
    title: "BIO-IGNICIÓN · Tech · Fatiga on-call = riesgo de incidente",
    description:
      "80% de developers descontentos (Stack Overflow 2024, n=65k). 50 alerts/semana on-call, 2–5% accionables (PagerDuty). Límite toil 50% / observado 33% (Google SRE). BIO: SOC 2 CC7.3-aligned, ISO 27035-ready.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
};

const LAST_REVIEWED = "2026-04-20";

const kickerStyle = {
  fontFamily: cssVar.fontMono,
  fontSize: font.size.xs,
  color: bioSignal.phosphorCyanInk,
  textTransform: "uppercase",
  letterSpacing: "0.24em",
  fontWeight: font.weight.bold,
  marginBlockEnd: space[3],
};

const sectionHeading = {
  margin: 0,
  fontSize: "clamp(24px, 3vw, 34px)",
  letterSpacing: "-0.025em",
  lineHeight: 1.15,
  fontWeight: font.weight.black,
  color: cssVar.text,
};

const COPY = {
  es: {
    eyebrow: "PARA TECH · PLATFORM, SRE, DEVTOOLS & SaaS",
    title: "Fatiga de on-call no es cultura. Es riesgo de incidente y churn de SRE.",
    editorial:
      "La alert fatigue, el MTTR degradado y el churn del SRE senior viven en el mismo eslabón fisiológico. Se mide en HRV, no en engagement survey.",
    intro:
      "BIO-IGNICIÓN se instrumenta en los 3 minutos post-incident, pre-handoff o en el sprint retro abierto. SOC 2 CC7.3-aligned, ISO/IEC 27035-ready, panel operativo visible al VP Eng / Head of SRE — no al analista de RRHH.",
    metaSoc: "SOC 2 Type I · activo",
    metaCc73: "SOC 2 CC7.3 · incident response",
    metaIso: "ISO/IEC 27035 · ready",
    metaShift: "3 min post-incident",

    scarcityLabel: "Q2 2026 · PILOTO INFRA-GRADE · 5 ENGINEERING ORGS",

    statUnhappy: "Developers profesionales descontentos",
    statUnhappySub: "Stack Overflow Developer Survey · 2024 · n≈65k",
    statAlerts: "Alerts/semana on-call · solo 2–5% accionables",
    statAlertsSub: "PagerDuty · State of Digital Operations",
    statToil: "Límite de toil · SRE Google (promedio observado 33%)",
    statToilSub: "Google · SRE Workbook · Eliminating Toil",
    statDora: "Más burnout reportado · grupos subrepresentados",
    statDoraSub: "DORA · State of DevOps Report · 2023",

    benchmarkKicker: "CONTEXTO · DATA PÚBLICA TECH",
    benchmarkSoSrc: "STACK OVERFLOW",
    benchmarkSoV: "80%",
    benchmarkSoL: "Developers profesionales reportan descontento laboral · Stack Overflow Developer Survey 2024 · n≈65,000 developers globales, muestra multi-industria.",
    benchmarkPdSrc: "PAGERDUTY",
    benchmarkPdV: "~50 / wk",
    benchmarkPdL: "Alerts que recibe un on-call engineer promedio por semana · solo 2–5% requieren intervención humana · PagerDuty State of Digital Operations.",
    benchmarkSreSrc: "GOOGLE SRE",
    benchmarkSreV: "50% / 33%",
    benchmarkSreL: "Límite declarado de toil (50%) vs. promedio observado en quarterly surveys Google (~33%) · outliers reportan hasta 80% · Google SRE Workbook.",
    benchmarkDoraSrc: "DORA",
    benchmarkDoraV: "+24%",
    benchmarkDoraL: "Más burnout reportado en grupos subrepresentados + 29% más repetitive work · DORA Accelerate State of DevOps Report 2023.",

    painKicker: "TESIS · POR QUÉ IMPORTA EN TU ORG",
    painH: "La fatiga de on-call es un leading indicator de sev-1 escalation y de resignación.",
    painBody:
      "MTTR, change-failure rate y post-mortem quality son lagging — reportan lo que ya pasó en el incidente. HRV y la fatiga autonómica del on-call se detectan horas antes del mis-call en el runbook o del burnout que precede la renuncia. BIO interviene en el eslabón temprano porque ahí se corrige el resto.",
    painP1Title: "1. Fisiología antes del MTTR",
    painP1Body:
      "La lentitud de reacción, el decision fatigue y el override emocional del runbook son medibles en HRV y cortisol circadiano antes de manifestarse en un sev-1 mal escalado. La literatura en cognitive fatigue aplicada a operadores 24/7 (aviation, healthcare, NIOSH shift-work) documenta deterioro de toma de decisiones equivalente a intoxicación legalmente sancionable bajo deuda de sueño.",
    painP2Title: "2. Alert fatigue = deuda de toil invisible",
    painP2Body:
      "El on-call promedio recibe ~50 alerts/semana, de las cuales solo 2–5% requieren intervención humana (PagerDuty). Google SRE fija un techo declarado de 50% toil con promedio observado de 33% — pero con outliers en 80%. Ese delta se paga en HRV baseline suprimido, false-positive response, y eventual mis-call en el sev-1 real. BIO aporta un leading signal para ese delta — no sustituye al incident review ni al toil audit.",
    painP3Title: "3. Rotación = fuga del runbook tribal",
    painP3Body:
      "Cada SRE senior que se va se lleva 3–5 años de context de producción, ownership de runbook y mental model de la arquitectura. El costo de reemplazo en senior engineering cae en el rango de 1.5–2× salario anual (contratación + ramp de 9–12 meses + lost productivity). Reducir rotación 10% en un equipo de 40 SRE/platform engineers paga múltiples ciclos de BIO.",
    painP4Title: "4. SOC 2 / ISO 27035 / NIST 800-61 exigen IR program auditable",
    painP4Body:
      "SOC 2 CC7.3 (incident response) y CC9.1/9.2 (risk mitigation) exigen evidencia de detección, respuesta y recovery. ISO/IEC 27035 y NIST SP 800-61 estructuran el mismo principio. El control environment de un IR program incluye factores humanos — un on-call fatigado es una falla de control. BIO aporta evidencia auditable de 'reasonable care' para el wellbeing operativo del IR team, no sustituye al SOC 2 auditor ni al CISO.",

    fitKicker: "CÓMO ENCAJA · OPERATIVAMENTE",
    fitH: "Se instrumenta en los 3 minutos que ya existen post-incident, pre-handoff o en sprint retro.",
    fitBody:
      "No pedimos tiempo extra al on-call ni al dev. Pedimos 3 minutos estructurados post-incident, en pre-handoff de shift, o en el sprint retro abierto. El impacto se mide en HRV y en MTTR stability, no en engagement score.",
    fitL1: "Protocolos respiración resonante 3 min (5.5–6 bpm) validados clínicamente · compatibles con post-incident review o shift handoff · efecto medible en HRV en sesión 1.",
    fitL2: "Dashboard operativo para VP Eng / Head of SRE · agregados anónimos por squad / pod / on-call rotation · segmentos con k ≥ 5 personas · sin exponer datos individuales ni ownership de runbook.",
    fitL3: "Reportes individuales permanecen privados para el ingeniero · cumple expectativa de confidencialidad equivalente a EAP regulado · evita discrimination claim bajo ADA y permite compatibilidad con GDPR Art. 9 data minimization.",
    fitL4: "SSO SAML 2.0 + SCIM + audit trail · compatible con IdP enterprise (Okta, Ping, Azure AD, Google Workspace) · provisioning automático y logging SOC-2-ready.",
    fitL5: "IR-program evidence pack · artifacts de wellbeing dentro del incident response program · descargables bajo NDA para auditor SOC 2 / ISO 27001.",
    fitL6: "Exports bajo NDA: SOC 2 Type I, DPA, ISO 27001 gap analysis, ISO/IEC 27035 mapping, NIST SP 800-61 alignment matrix.",

    peerKicker: "COMPARATIVO · QUÉ HAY HOY EN TU ORG",
    peerH: "Contra lo que ya tienes instalado.",
    peerBody:
      "Referencias de adopción y alcance típico en engineering orgs con on-call rotation (SaaS maduro, platform teams, devtools, SRE orgs). Tu mix varía, pero el patrón es estable.",
    peerColCat: "Categoría",
    peerColCost: "USD / ingeniero / año",
    peerColScope: "Alcance",
    peerRowEapCat: "EAP tradicional tech",
    peerRowEapCost: "$180",
    peerRowEapScope: "Consejería reactiva · adopción 2–6% en ingeniería · sin instrumentación fisiológica · sin evidencia SOC 2 / ISO 27035.",
    peerRowWellnessCat: "Wellness corporativo (retos, contenido)",
    peerRowWellnessCost: "$450",
    peerRowWellnessScope: "Gamificación · sin outcome operativo medible · abandono a 90 días · no referenciable ante auditor SOC 2.",
    peerRowVelocityCat: "Engineering-velocity tools (Jellyfish, LinearB, Swarmia)",
    peerRowVelocityCost: "$320",
    peerRowVelocityScope: "Miden velocidad, DORA metrics y flow · no miden fisiología del on-call · no aplican a incident-response control environment.",
    peerRowBioCat: "BIO-IGNICIÓN · Growth",
    peerRowBioCost: "$228",
    peerRowBioScope: "HRV grado infra · SOC 2 CC7.3-aligned · ISO 27035-ready · NIST 800-61 mapping · panel VP Eng · SSO + SCIM.",
    peerCite: "Fuentes: SHRM 2024, KFF Employer Health Benefits 2024, Stack Overflow 2024, PagerDuty State of Digital Ops. Precio BIO vigente (2026-Q2).",

    sourcesKicker: "FUENTES · LITERATURA TECH & REGULATORIA",
    sourcesH: "De dónde vienen las cifras.",
    sourcesBody:
      "Todas las cifras provienen de literatura revisada por pares, reportes públicos de la industria y regulación. Citadas bajo fair-use académico.",
    sourceStackOverflow:
      "Stack Overflow · Developer Survey 2024 · n≈65,000 developers profesionales globales · 80% reporta descontento laboral (sum de ligeramente/moderadamente/muy insatisfecho). Muestra auto-reportada multi-industria y multi-seniority.",
    sourcePagerduty:
      "PagerDuty · State of Digital Operations · on-call engineer promedio recibe ~50 alerts/semana; solo 2–5% requiere intervención humana; correlación estadísticamente significativa entre turnover y participación en incidentes fuera de horario.",
    sourceGoogleSre:
      "Google · Site Reliability Engineering Workbook · 'Eliminating Toil' · meta declarada ≤ 50% toil por SRE; quarterly surveys internos reportan ~33% promedio; outliers hasta 80%. Framework público citado bajo fair-use.",
    sourceDora:
      "DORA · Accelerate State of DevOps Report 2023 · grupos subrepresentados reportan +24% burnout y +29% repetitive work; mujeres y personas que auto-describen género reportan +40% repetitive work vs hombres. Muestra global multi-sector.",
    sourceSoc2:
      "AICPA · SOC 2 Trust Service Criteria · CC7.3 (incident response) y CC9.1/9.2 (risk mitigation) exigen evidencia de detección, respuesta y recovery con control environment documentado (incluye factores humanos).",
    sourceIso27035:
      "ISO/IEC 27035-1:2023 · principles of information security incident management · estructura planning, detection, assessment, response, post-incident learning. Complementario a ISO/IEC 27001 ISMS.",
    sourceNist80061:
      "NIST SP 800-61 Rev. 3 · Computer Security Incident Handling Guide · fases preparation, detection & analysis, containment-eradication-recovery, post-incident activity. Referencia de facto para IR programs en US federal y enterprise.",
    sourceKoenig:
      "Koenig et al. 2016 · meta-análisis HRV biofeedback en población clínica · d = 0.83 reducción ansiedad (efecto grande).",
    sourceGoessl:
      "Goessl et al. · Psychological Medicine 2017 · meta-análisis d = 0.50 reducción ansiedad con HRV biofeedback (n=482). Nuestro cap 0.35 ≈ 70% del observado.",

    entKicker: "COMPLIANCE & PROCUREMENT · TECH",
    entH: "Lo que tu equipo security, legal y procurement va a pedir — ya está respondido.",
    entBody:
      "Postura documentada para cada control. Artefactos formales (SOC 2 Type I, DPA, ISO 27001 gap, ISO/IEC 27035 mapping, NIST SP 800-61 alignment matrix) entregados bajo NDA vía Trust Center.",
    entSoc2: "SOC 2 Type I · postura activa",
    entCc73: "SOC 2 CC7.3 · IR-aligned",
    entIso27001: "ISO 27001 · gap analysis",
    entIso27035: "ISO/IEC 27035 · IR-ready",
    entNist: "NIST SP 800-61 · mapping",
    entDpa: "DPA · GDPR Recital 26",
    entSso: "SSO · SAML 2.0 + SCIM",
    entSla: "99.9% SLA · infra-grade",
    entFoot: "Datos individuales segregados por ingeniero. VP Eng / Head of SRE solo ve agregados anonimizados ≥ 5 personas por segmento (squad, pod, on-call rotation). Ownership de runbook nunca se expone.",
    entJurisdictions: "Cobertura jurisdiccional · US: SOC 2 · NIST CSF · EU: NIS2 · EU DORA (Reg. 2022/2554 para entidades financieras ICT) · GDPR Art. 32 · UK: NCSC CAF · MX: INAI LFPDPPP · SG: MAS TRM · AU: Essential 8.",

    disclaimerH: "Nota legal · lectura en 30 s",
    disclaimer1:
      "Las cifras son estimaciones a partir de literatura pública revisada por pares, reportes de industria y regulación, no garantías. Los resultados reales dependen de implementación, tamaño del equipo, carga de on-call, arquitectura de incidents y contexto organizacional.",
    disclaimer2:
      "BIO-IGNICIÓN es una herramienta de bienestar operativo basada en HRV · NO es dispositivo médico, NO diagnostica, NO trata condiciones médicas, NO sustituye evaluación clínica. Complementario al EAP formal de la org.",
    disclaimer3:
      "El término 'grado infra' se refiere a la calidad de medición HRV (validación frente a ECG en literatura) y a la robustez operativa y auditable de la plataforma. NO implica autorización regulatoria como dispositivo médico (FDA / COFEPRIS / CE).",
    disclaimer4:
      "'SOC 2 CC7.3-aligned' significa que los exportes y logs de BIO-IGNICIÓN están estructurados de forma compatible con evidencia de incident response bajo SOC 2 Trust Service Criteria CC7.3. NO implica atestación SOC 2 Type II, NO sustituye al auditor SOC 2 ni al SOC 2 program office del cliente.",
    disclaimer5:
      "'ISO/IEC 27035-ready' y 'NIST SP 800-61 mapping' significan que el diseño de BIO-IGNICIÓN es compatible con las fases del incident management bajo dichos estándares. NO implica certificación ISO 27035, NO sustituye al CISO ni al SOC, y NO es atestación bajo ninguno de estos frameworks.",
    disclaimer6:
      "'DORA' en este contexto refiere exclusivamente a DevOps Research and Assessment · State of DevOps Report. NO debe confundirse con EU DORA (Digital Operational Resilience Act · Regulation (EU) 2022/2554) aplicable a entidades financieras ICT desde enero 2025 — que también cubrimos explícitamente en jurisdicciones.",

    closingKicker: "PRÓXIMO PASO · TECH",
    closingHLead: "Agenda con supuestos de on-call.",
    closingHBody: "Un cierre de 45 min con tu VP Eng, Head of SRE y security.",
    closingBody:
      "Llevamos los supuestos a tu contexto real: tamaño del equipo SRE/platform, shape de on-call rotation (follow-the-sun, tiered), jurisdicciones (SOC 2, ISO 27001, GDPR, NIS2, EU DORA, MAS TRM), volumen histórico de alerts/incidents. El cohorte piloto Q2 2026 está limitado a 5 engineering orgs infra-grade.",
    closingPrimary: "Agenda demo · infra-grade",
    closingSecondary: "Ver ROI con tu equipo",
    closingTertiary: "Trust Center · due diligence",
    closingAvail: "Página revisada",
    closingContact: "tech@bio-ignicion.app",
  },
  en: {
    eyebrow: "FOR TECH · PLATFORM, SRE, DEVTOOLS & SaaS",
    title: "On-call fatigue isn't culture. It's incident risk and SRE churn.",
    editorial:
      "Alert fatigue, degraded MTTR and senior-SRE churn live on the same physiological link. It's measured in HRV, not in engagement survey.",
    intro:
      "BIO-IGNICIÓN instruments the 3 minutes that already exist post-incident, pre-handoff or in the open sprint retro. SOC 2 CC7.3-aligned, ISO/IEC 27035-ready, operating dashboard visible to VP Eng / Head of SRE — not to the HR analyst.",
    metaSoc: "SOC 2 Type I · active",
    metaCc73: "SOC 2 CC7.3 · incident response",
    metaIso: "ISO/IEC 27035 · ready",
    metaShift: "3 min post-incident",

    scarcityLabel: "Q2 2026 · INFRA-GRADE PILOT · 5 ENGINEERING ORGS",

    statUnhappy: "Professional developers reporting unhappiness",
    statUnhappySub: "Stack Overflow Developer Survey · 2024 · n≈65k",
    statAlerts: "Alerts/week on-call · only 2–5% actionable",
    statAlertsSub: "PagerDuty · State of Digital Operations",
    statToil: "Toil cap · Google SRE (observed average 33%)",
    statToilSub: "Google · SRE Workbook · Eliminating Toil",
    statDora: "More burnout reported · underrepresented groups",
    statDoraSub: "DORA · State of DevOps Report · 2023",

    benchmarkKicker: "CONTEXT · PUBLIC TECH DATA",
    benchmarkSoSrc: "STACK OVERFLOW",
    benchmarkSoV: "80%",
    benchmarkSoL: "Professional developers reporting workplace unhappiness · Stack Overflow Developer Survey 2024 · n≈65,000 global developers, multi-industry sample.",
    benchmarkPdSrc: "PAGERDUTY",
    benchmarkPdV: "~50 / wk",
    benchmarkPdL: "Alerts received by the average on-call engineer per week · only 2–5% require human intervention · PagerDuty State of Digital Operations.",
    benchmarkSreSrc: "GOOGLE SRE",
    benchmarkSreV: "50% / 33%",
    benchmarkSreL: "Declared toil cap (50%) vs. observed average in Google quarterly surveys (~33%) · outliers reported up to 80% · Google SRE Workbook.",
    benchmarkDoraSrc: "DORA",
    benchmarkDoraV: "+24%",
    benchmarkDoraL: "More burnout reported in underrepresented groups + 29% more repetitive work · DORA Accelerate State of DevOps Report 2023.",

    painKicker: "THESIS · WHY IT MATTERS AT YOUR ORG",
    painH: "On-call fatigue is a leading indicator for sev-1 escalation and for resignation.",
    painBody:
      "MTTR, change-failure rate and post-mortem quality are lagging — they report what already happened in the incident. HRV and autonomic fatigue in the on-call engineer are detectable hours before a runbook mis-call or the burnout that precedes a resignation. BIO intervenes at the early link because that's where the rest is fixed.",
    painP1Title: "1. Physiology before MTTR",
    painP1Body:
      "Reaction-time decay, decision fatigue and the emotional override of a runbook are measurable in HRV and circadian cortisol before they materialize in a mis-escalated sev-1. Cognitive-fatigue literature applied to 24/7 operators (aviation, healthcare, NIOSH shift-work) documents decision-making impairment under sleep debt equivalent to legally actionable intoxication.",
    painP2Title: "2. Alert fatigue = invisible toil debt",
    painP2Body:
      "The average on-call receives ~50 alerts/week, of which only 2–5% require human intervention (PagerDuty). Google SRE declares a 50% toil cap with an observed average of 33% — with outliers at 80%. That delta is paid in suppressed HRV baseline, false-positive response, and eventually a mis-call in the real sev-1. BIO provides a leading signal for that delta — it does not replace the incident review nor the toil audit.",
    painP3Title: "3. Turnover = loss of tribal runbook knowledge",
    painP3Body:
      "Every senior SRE who leaves takes 3–5 years of production context, runbook ownership and architectural mental model with them. Replacement cost in senior engineering lands in the 1.5–2× annual-salary range (recruiting + 9–12 month ramp + lost productivity). A 10% turnover reduction in a 40-person SRE/platform team pays for multiple BIO cycles.",
    painP4Title: "4. SOC 2 / ISO 27035 / NIST 800-61 require an auditable IR program",
    painP4Body:
      "SOC 2 CC7.3 (incident response) and CC9.1/9.2 (risk mitigation) require evidence of detection, response and recovery. ISO/IEC 27035 and NIST SP 800-61 structure the same principle. An IR program's control environment includes human factors — a fatigued on-call is a control failure. BIO provides auditable evidence of 'reasonable care' for the IR team's operational wellbeing; it does not replace the SOC 2 auditor or the CISO.",

    fitKicker: "HOW IT FITS · OPERATIONALLY",
    fitH: "It instruments the 3 minutes that already exist post-incident, pre-handoff or at sprint retro.",
    fitBody:
      "We don't ask the on-call or the dev for extra time. We ask for 3 structured minutes post-incident, at shift pre-handoff, or in the open sprint retro. Impact is measured in HRV and MTTR stability, not in engagement score.",
    fitL1: "Clinically-validated 3-min resonant-breathing protocols (5.5–6 bpm) · compatible with post-incident review or shift handoff · measurable HRV effect from session 1.",
    fitL2: "Operating dashboard for VP Eng / Head of SRE · anonymized aggregates by squad / pod / on-call rotation · segments with k ≥ 5 people · no individual exposure and runbook ownership never surfaced.",
    fitL3: "Individual reports stay private to the engineer · matches regulated-EAP confidentiality expectation · avoids ADA discrimination claims and supports GDPR Art. 9 data minimization.",
    fitL4: "SSO SAML 2.0 + SCIM + audit trail · compatible with enterprise IdPs (Okta, Ping, Azure AD, Google Workspace) · automated provisioning and SOC-2-ready logging.",
    fitL5: "IR-program evidence pack · wellbeing artifacts inside the incident response program · downloadable under NDA for SOC 2 / ISO 27001 auditor.",
    fitL6: "Under-NDA exports: SOC 2 Type I, DPA, ISO 27001 gap analysis, ISO/IEC 27035 mapping, NIST SP 800-61 alignment matrix.",

    peerKicker: "COMPARISON · WHAT'S ALREADY INSTALLED",
    peerH: "Against what your org already has.",
    peerBody:
      "Reference adoption and scope at engineering orgs with on-call rotation (mature SaaS, platform teams, devtools, SRE orgs). Your mix varies, but the pattern is stable.",
    peerColCat: "Category",
    peerColCost: "USD / engineer / yr",
    peerColScope: "Scope",
    peerRowEapCat: "Traditional tech EAP",
    peerRowEapCost: "$180",
    peerRowEapScope: "Reactive counseling · 2–6% engineering adoption · no physiological instrumentation · no SOC 2 / ISO 27035 evidence.",
    peerRowWellnessCat: "Corporate wellness (challenges, content)",
    peerRowWellnessCost: "$450",
    peerRowWellnessScope: "Gamification · no measurable operational outcome · 90-day drop-off · not referenceable to a SOC 2 auditor.",
    peerRowVelocityCat: "Engineering-velocity tools (Jellyfish, LinearB, Swarmia)",
    peerRowVelocityCost: "$320",
    peerRowVelocityScope: "Measure velocity, DORA metrics and flow · do not measure on-call physiology · do not apply to incident-response control environment.",
    peerRowBioCat: "BIO-IGNICIÓN · Growth",
    peerRowBioCost: "$228",
    peerRowBioScope: "Infra-grade HRV · SOC 2 CC7.3-aligned · ISO 27035-ready · NIST 800-61 mapping · VP Eng dashboard · SSO + SCIM.",
    peerCite: "Sources: SHRM 2024, KFF Employer Health Benefits 2024, Stack Overflow 2024, PagerDuty State of Digital Ops. BIO pricing current (2026-Q2).",

    sourcesKicker: "SOURCES · TECH & REGULATORY LITERATURE",
    sourcesH: "Where the figures come from.",
    sourcesBody:
      "All figures come from peer-reviewed literature, public industry reports and regulation. Cited under academic fair-use.",
    sourceStackOverflow:
      "Stack Overflow · Developer Survey 2024 · n≈65,000 global professional developers · 80% report workplace unhappiness (sum of slightly/moderately/very dissatisfied). Self-reported multi-industry, multi-seniority sample.",
    sourcePagerduty:
      "PagerDuty · State of Digital Operations · average on-call engineer receives ~50 alerts/week; only 2–5% require human intervention; statistically significant correlation between turnover and off-hour incident participation.",
    sourceGoogleSre:
      "Google · Site Reliability Engineering Workbook · 'Eliminating Toil' · declared target ≤ 50% toil per SRE; internal quarterly surveys report ~33% average; outliers up to 80%. Public framework cited under fair-use.",
    sourceDora:
      "DORA · Accelerate State of DevOps Report 2023 · underrepresented groups report +24% burnout and +29% repetitive work; women and gender-self-described report +40% repetitive work vs. men. Global multi-sector sample.",
    sourceSoc2:
      "AICPA · SOC 2 Trust Service Criteria · CC7.3 (incident response) and CC9.1/9.2 (risk mitigation) require evidence of detection, response and recovery with documented control environment (including human factors).",
    sourceIso27035:
      "ISO/IEC 27035-1:2023 · principles of information security incident management · structures planning, detection, assessment, response, post-incident learning. Complementary to ISO/IEC 27001 ISMS.",
    sourceNist80061:
      "NIST SP 800-61 Rev. 3 · Computer Security Incident Handling Guide · phases preparation, detection & analysis, containment-eradication-recovery, post-incident activity. De-facto reference for IR programs in US federal and enterprise.",
    sourceKoenig:
      "Koenig et al. 2016 · HRV biofeedback meta-analysis in clinical populations · d = 0.83 anxiety reduction (large effect).",
    sourceGoessl:
      "Goessl et al. · Psychological Medicine 2017 · meta-analysis d = 0.50 anxiety reduction via HRV biofeedback (n=482). Our 0.35 cap ≈ 70% of observed effect.",

    entKicker: "COMPLIANCE & PROCUREMENT · TECH",
    entH: "Everything your security, legal and procurement team will ask — already answered.",
    entBody:
      "Documented posture for each control. Formal artifacts (SOC 2 Type I, DPA, ISO 27001 gap, ISO/IEC 27035 mapping, NIST SP 800-61 alignment matrix) delivered under NDA via Trust Center.",
    entSoc2: "SOC 2 Type I · active posture",
    entCc73: "SOC 2 CC7.3 · IR-aligned",
    entIso27001: "ISO 27001 · gap analysis",
    entIso27035: "ISO/IEC 27035 · IR-ready",
    entNist: "NIST SP 800-61 · mapping",
    entDpa: "DPA · GDPR Recital 26",
    entSso: "SSO · SAML 2.0 + SCIM",
    entSla: "99.9% SLA · infra-grade",
    entFoot: "Individual data is segregated per engineer. The VP Eng / Head of SRE sees only anonymized aggregates of ≥ 5 people per segment (squad, pod, on-call rotation). Runbook ownership is never surfaced.",
    entJurisdictions: "Jurisdictional coverage · US: SOC 2 · NIST CSF · EU: NIS2 · EU DORA (Reg. 2022/2554 for financial ICT entities) · GDPR Art. 32 · UK: NCSC CAF · MX: INAI LFPDPPP · SG: MAS TRM · AU: Essential 8.",

    disclaimerH: "Legal note · 30-sec read",
    disclaimer1:
      "Figures are estimates from peer-reviewed public literature, industry reports and regulation — not guarantees. Actual results depend on implementation, team size, on-call load, incident architecture and organizational context.",
    disclaimer2:
      "BIO-IGNICIÓN is an HRV-based operational wellbeing tool · it is NOT a medical device, does NOT diagnose, does NOT treat medical conditions, and does NOT replace clinical evaluation. Complementary to the org's formal EAP only.",
    disclaimer3:
      "The term 'infra-grade' refers to HRV measurement quality (ECG-validated in literature) and platform operational/auditable robustness. It does NOT imply regulatory clearance as a medical device (FDA / COFEPRIS / CE).",
    disclaimer4:
      "'SOC 2 CC7.3-aligned' means BIO-IGNICIÓN exports and logs are structured to be compatible with incident-response evidence under SOC 2 Trust Service Criteria CC7.3. It does NOT imply SOC 2 Type II attestation, does NOT replace the SOC 2 auditor nor the customer's SOC 2 program office.",
    disclaimer5:
      "'ISO/IEC 27035-ready' and 'NIST SP 800-61 mapping' mean BIO-IGNICIÓN's design is compatible with the incident-management phases under those standards. It does NOT imply ISO 27035 certification, does NOT replace the CISO or the SOC, and is NOT an attestation under any of these frameworks.",
    disclaimer6:
      "'DORA' in this context refers exclusively to DevOps Research and Assessment · State of DevOps Report. It should NOT be confused with EU DORA (Digital Operational Resilience Act · Regulation (EU) 2022/2554) applicable to financial ICT entities since January 2025 — which we also explicitly cover under jurisdictions.",

    closingKicker: "NEXT STEP · TECH",
    closingHLead: "Book a demo with on-call assumptions.",
    closingHBody: "A 45-min closing with your VP Eng, Head of SRE and security.",
    closingBody:
      "We bring the assumptions to your real context: SRE/platform team size, on-call rotation shape (follow-the-sun, tiered), jurisdictions (SOC 2, ISO 27001, GDPR, NIS2, EU DORA, MAS TRM), historical alert/incident volume. The Q2 2026 pilot cohort is limited to 5 infra-grade engineering orgs.",
    closingPrimary: "Book demo · infra-grade",
    closingSecondary: "Run ROI with your team",
    closingTertiary: "Trust Center · due diligence",
    closingAvail: "Page reviewed",
    closingContact: "tech@bio-ignicion.app",
  },
};

export default async function ForTechPage() {
  const locale = await getServerLocale();
  const L = locale === "en" ? "en" : "es";
  const c = COPY[L];
  const en = L === "en";

  const reviewedFmt = new Date(LAST_REVIEWED).toLocaleDateString(en ? "en-US" : "es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <PublicShell activePath="/for-tech">
      {/* ═══ Hero ═══ */}
      <Container size="lg" className="bi-prose">
        <header className="bi-roi-hero">
          <div aria-hidden className="bi-roi-hero-lattice">
            <BioglyphLattice variant="ambient" />
          </div>
          <span aria-hidden className="bi-roi-hero-aura" />
          <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            <IgnitionReveal sparkOrigin="50% 30%">
              <div style={kickerStyle}>{c.eyebrow}</div>
              <h1
                style={{
                  margin: `${space[3]}px 0 ${space[4]}px`,
                  fontSize: "clamp(34px, 5vw, 60px)",
                  letterSpacing: "-0.035em",
                  lineHeight: 1.04,
                  maxWidth: "22ch",
                  marginInline: "auto",
                }}
              >
                {c.title}
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-editorial), 'Instrument Serif', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: "clamp(18px, 2vw, 24px)",
                  lineHeight: 1.35,
                  color: cssVar.textMuted,
                  maxWidth: "52ch",
                  margin: `0 auto ${space[4]}px`,
                  textAlign: "center",
                }}
              >
                {c.editorial}
              </p>
              <p style={{ color: cssVar.textDim, maxWidth: "62ch", margin: "0 auto", textAlign: "center" }}>
                {c.intro}
              </p>
              <ul className="bi-roi-meta" aria-label="tech-meta">
                <li><span className="dot" aria-hidden /> {c.metaSoc}</li>
                <li><span className="dot" aria-hidden /> {c.metaCc73}</li>
                <li><span className="dot" aria-hidden /> {c.metaIso}</li>
                <li><span className="dot" aria-hidden /> {c.metaShift}</li>
              </ul>
              <div className="bi-roi-scarcity" aria-label={c.scarcityLabel}>
                <span className="bi-roi-scarcity-label">{c.scarcityLabel}</span>
              </div>
            </IgnitionReveal>
          </div>
        </header>
      </Container>

      {/* ═══ Stat strip (hard numbers) ═══ */}
      <section aria-label={c.eyebrow} style={{ marginBlockStart: space[7] }}>
        <Container size="xl" style={{ paddingInline: 0 }}>
          <div className="bi-proof-stats bi-proof-stats--label">
            <div>
              <span className="v">80%</span>
              <span className="l">{c.statUnhappy}</span>
              <span className="s">{c.statUnhappySub}</span>
            </div>
            <div>
              <span className="v">~50</span>
              <span className="l">{c.statAlerts}</span>
              <span className="s">{c.statAlertsSub}</span>
            </div>
            <div>
              <span className="v">50% / 33%</span>
              <span className="l">{c.statToil}</span>
              <span className="s">{c.statToilSub}</span>
            </div>
            <div>
              <span className="v">+24%</span>
              <span className="l">{c.statDora}</span>
              <span className="s">{c.statDoraSub}</span>
            </div>
          </div>
        </Container>
      </section>

      {/* ═══ Benchmark strip (cited public data) ═══ */}
      <section aria-label={c.benchmarkKicker} style={{ marginBlockStart: space[6] }}>
        <Container size="xl" style={{ paddingInline: 0 }}>
          <div style={{ ...kickerStyle, textAlign: "center", marginBlockEnd: space[4] }}>
            {c.benchmarkKicker}
          </div>
          <div className="bi-roi-benchmark-strip">
            <div className="bi-roi-benchmark-cell">
              <div className="src">{c.benchmarkSoSrc}</div>
              <span className="v">{c.benchmarkSoV}</span>
              <span className="l">{c.benchmarkSoL}</span>
            </div>
            <div className="bi-roi-benchmark-cell">
              <div className="src">{c.benchmarkPdSrc}</div>
              <span className="v">{c.benchmarkPdV}</span>
              <span className="l">{c.benchmarkPdL}</span>
            </div>
            <div className="bi-roi-benchmark-cell">
              <div className="src">{c.benchmarkSreSrc}</div>
              <span className="v">{c.benchmarkSreV}</span>
              <span className="l">{c.benchmarkSreL}</span>
            </div>
            <div className="bi-roi-benchmark-cell">
              <div className="src">{c.benchmarkDoraSrc}</div>
              <span className="v">{c.benchmarkDoraV}</span>
              <span className="l">{c.benchmarkDoraL}</span>
            </div>
          </div>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      <Container size="lg" className="bi-prose">
        {/* ═══ Pain / thesis section ═══ */}
        <section aria-labelledby="pain-heading" className="bi-roi-peer" style={{ marginBlock: space[6] }}>
          <div style={kickerStyle}>{c.painKicker}</div>
          <h2 id="pain-heading" style={sectionHeading}>{c.painH}</h2>
          <p style={{ marginBlockStart: space[3], color: cssVar.textDim, maxWidth: "66ch" }}>
            {c.painBody}
          </p>
          <div style={{ marginBlockStart: space[5], display: "grid", gap: space[4] }}>
            {[
              [c.painP1Title, c.painP1Body],
              [c.painP2Title, c.painP2Body],
              [c.painP3Title, c.painP3Body],
              [c.painP4Title, c.painP4Body],
            ].map(([t, b]) => (
              <div key={t} className="bi-legal-callout bi-legal-callout--moat">
                <span className="bi-legal-callout-kicker">{t}</span>
                <p>{b}</p>
              </div>
            ))}
          </div>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ How it fits operationally ═══ */}
        <section aria-labelledby="fit-heading" className="bi-roi-peer">
          <div style={kickerStyle}>{c.fitKicker}</div>
          <h2 id="fit-heading" style={sectionHeading}>{c.fitH}</h2>
          <p style={{ marginBlockStart: space[3], color: cssVar.textDim, maxWidth: "66ch" }}>
            {c.fitBody}
          </p>
          <ul className="bi-legal-list" style={{ marginBlockStart: space[4] }}>
            <li>{c.fitL1}</li>
            <li>{c.fitL2}</li>
            <li>{c.fitL3}</li>
            <li>{c.fitL4}</li>
            <li>{c.fitL5}</li>
            <li>{c.fitL6}</li>
          </ul>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ Peer comparison ═══ */}
        <section aria-labelledby="peer-heading" className="bi-roi-peer">
          <div style={kickerStyle}>{c.peerKicker}</div>
          <h2 id="peer-heading" style={sectionHeading}>{c.peerH}</h2>
          <p style={{ marginBlockStart: space[3], color: cssVar.textDim, maxWidth: "66ch" }}>
            {c.peerBody}
          </p>
          <div className="bi-roi-peer-table-wrap">
            <table className="bi-roi-peer-table">
              <thead>
                <tr>
                  <th scope="col">{c.peerColCat}</th>
                  <th scope="col">{c.peerColCost}</th>
                  <th scope="col">{c.peerColScope}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td data-label={c.peerColCat}><span className="bi-roi-peer-label">{c.peerRowEapCat}</span></td>
                  <td data-label={c.peerColCost}>{c.peerRowEapCost}</td>
                  <td data-label={c.peerColScope}><span className="bi-roi-peer-hint">{c.peerRowEapScope}</span></td>
                </tr>
                <tr>
                  <td data-label={c.peerColCat}><span className="bi-roi-peer-label">{c.peerRowWellnessCat}</span></td>
                  <td data-label={c.peerColCost}>{c.peerRowWellnessCost}</td>
                  <td data-label={c.peerColScope}><span className="bi-roi-peer-hint">{c.peerRowWellnessScope}</span></td>
                </tr>
                <tr>
                  <td data-label={c.peerColCat}><span className="bi-roi-peer-label">{c.peerRowVelocityCat}</span></td>
                  <td data-label={c.peerColCost}>{c.peerRowVelocityCost}</td>
                  <td data-label={c.peerColScope}><span className="bi-roi-peer-hint">{c.peerRowVelocityScope}</span></td>
                </tr>
                <tr className="bio">
                  <td data-label={c.peerColCat}><span className="bi-roi-peer-label">{c.peerRowBioCat}</span></td>
                  <td data-label={c.peerColCost}>{c.peerRowBioCost}</td>
                  <td data-label={c.peerColScope}><span className="bi-roi-peer-hint">{c.peerRowBioScope}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="bi-roi-peer-cite">{c.peerCite}</p>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ Sources ═══ */}
        <section aria-labelledby="sources-heading" className="bi-roi-sources">
          <div style={kickerStyle}>{c.sourcesKicker}</div>
          <h2 id="sources-heading" style={sectionHeading}>{c.sourcesH}</h2>
          <p style={{ marginBlockStart: space[3], color: cssVar.textDim, maxWidth: "66ch" }}>
            {c.sourcesBody}
          </p>
          <ul className="bi-roi-source-list">
            <li><span className="bi-roi-source-tag">STACK OVERFLOW</span><span>{c.sourceStackOverflow}</span></li>
            <li><span className="bi-roi-source-tag">PAGERDUTY</span><span>{c.sourcePagerduty}</span></li>
            <li><span className="bi-roi-source-tag">GOOGLE SRE</span><span>{c.sourceGoogleSre}</span></li>
            <li><span className="bi-roi-source-tag">DORA</span><span>{c.sourceDora}</span></li>
            <li><span className="bi-roi-source-tag">SOC 2</span><span>{c.sourceSoc2}</span></li>
            <li><span className="bi-roi-source-tag">ISO 27035</span><span>{c.sourceIso27035}</span></li>
            <li><span className="bi-roi-source-tag">NIST 800-61</span><span>{c.sourceNist80061}</span></li>
            <li><span className="bi-roi-source-tag">KOENIG</span><span>{c.sourceKoenig}</span></li>
            <li><span className="bi-roi-source-tag">GOESSL</span><span>{c.sourceGoessl}</span></li>
          </ul>
        </section>

        {/* ═══ Enterprise / Compliance rail ═══ */}
        <section aria-labelledby="ent-heading" className="bi-roi-ent">
          <div style={kickerStyle}>{c.entKicker}</div>
          <h2 id="ent-heading" style={sectionHeading}>{c.entH}</h2>
          <p style={{ marginBlockStart: space[3], color: cssVar.textDim, maxWidth: "66ch" }}>
            {c.entBody}
          </p>
          <ul className="bi-roi-ent-grid" aria-label={c.entKicker}>
            <li className="bi-roi-ent-chip">{c.entSoc2}</li>
            <li className="bi-roi-ent-chip">{c.entCc73}</li>
            <li className="bi-roi-ent-chip">{c.entIso27001}</li>
            <li className="bi-roi-ent-chip">{c.entIso27035}</li>
            <li className="bi-roi-ent-chip">{c.entNist}</li>
            <li className="bi-roi-ent-chip">{c.entDpa}</li>
            <li className="bi-roi-ent-chip">{c.entSso}</li>
            <li className="bi-roi-ent-chip">{c.entSla}</li>
          </ul>
          <p className="bi-roi-ent-foot">{c.entFoot}</p>
          <p className="bi-roi-ent-foot" style={{ marginBlockStart: space[3] }}>{c.entJurisdictions}</p>
        </section>

        {/* ═══ Disclaimer (collapsible) ═══ */}
        <details className="bi-roi-disclaimer">
          <summary>
            <span className="bi-roi-disclaimer-kicker">DISCLAIMER · 30 s</span>
            <span className="bi-roi-disclaimer-h">{c.disclaimerH}</span>
          </summary>
          <ol>
            <li>{c.disclaimer1}</li>
            <li>{c.disclaimer2}</li>
            <li>{c.disclaimer3}</li>
            <li>{c.disclaimer4}</li>
            <li>{c.disclaimer5}</li>
            <li>{c.disclaimer6}</li>
          </ol>
        </details>
      </Container>

      <PulseDivider intensity="dim" />

      {/* ═══ Closing CTA (shared pattern) ═══ */}
      <section aria-labelledby="tech-closing" className="bi-demo-closing-section">
        <Container size="lg" style={{ paddingBlock: `clamp(48px, 7vw, 96px)` }}>
          <IgnitionReveal sparkOrigin="50% 20%">
            <div className="bi-demo-closing">
              <div aria-hidden className="bi-demo-closing-lattice">
                <BioglyphLattice variant="ambient" />
              </div>
              <span aria-hidden className="bi-demo-closing-aura" />
              <span aria-hidden className="bi-demo-closing-aura bi-demo-closing-aura--spark" />

              <div className="bi-demo-closing-mark" aria-hidden>
                <span className="bi-demo-closing-mark-core" />
                <span className="bi-demo-closing-mark-ring" />
              </div>

              <div style={{ ...kickerStyle, marginBottom: space[4] }}>{c.closingKicker}</div>

              <h2 id="tech-closing" className="bi-demo-closing-h">
                <span className="bi-demo-closing-h-lead">{c.closingHLead}</span>{" "}
                <span className="bi-demo-closing-h-body">{c.closingHBody}</span>
              </h2>

              <p className="bi-demo-closing-body">{c.closingBody}</p>

              <div className="bi-demo-closing-actions">
                <Link href="/demo" className="bi-demo-closing-primary">
                  <span className="bi-demo-closing-primary-label">{c.closingPrimary}</span>
                  <span aria-hidden className="bi-demo-closing-primary-sep" />
                  <svg aria-hidden width="15" height="15" viewBox="0 0 15 15" className="bi-demo-closing-primary-arrow">
                    <path d="M3 7.5h9M8.5 3.5l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </Link>
                <Link href="/roi-calculator" className="bi-demo-closing-ghost">
                  <svg aria-hidden width="13" height="13" viewBox="0 0 13 13">
                    <path d="M2 2h9v9H2zM4.5 5h4M4.5 7h4M4.5 9h2.5" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>{c.closingSecondary}</span>
                </Link>
                <Link href="/trust" className="bi-demo-closing-ghost">
                  <svg aria-hidden width="13" height="13" viewBox="0 0 13 13">
                    <path d="M6.5 1.5L11 3.5v4c0 2.5-2 4.5-4.5 5C4 12 2 10 2 7.5v-4L6.5 1.5z" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round" />
                  </svg>
                  <span>{c.closingTertiary}</span>
                </Link>
              </div>

              <div className="bi-demo-closing-meta">
                <div className="bi-demo-closing-avail">
                  <span aria-hidden className="bi-demo-closing-avail-pulse">
                    <span className="bi-demo-closing-avail-dot" />
                  </span>
                  <span className="bi-demo-closing-avail-label">{c.closingAvail}</span>
                  <span className="bi-demo-closing-avail-meta">
                    <time dateTime={LAST_REVIEWED}>{reviewedFmt}</time>
                  </span>
                </div>
                <div className="bi-demo-closing-sig">
                  <a href={`mailto:${c.closingContact}`} className="bi-demo-closing-sig-link">
                    {c.closingContact}
                  </a>
                </div>
              </div>
            </div>
          </IgnitionReveal>
        </Container>
      </section>
    </PublicShell>
  );
}
