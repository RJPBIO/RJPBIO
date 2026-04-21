/* ═══════════════════════════════════════════════════════════════
   /for-public-sector — Vertical B2B landing for federal, state,
   local, defense-civilian, intelligence-community and mission-
   critical public operators (PSAPs, first responders, corrections,
   incident command). Thesis: workforce fatigue is operational
   risk and mission-assurance — framed by NIOSH ERHMS, NFPA 1582,
   NIST 800-53 control families and OPM FEVS as the engagement
   reference.
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
  title: "Para Sector Público · Fatiga del servidor es operational risk",
  description:
    "Fatiga en first responders, PSAP dispatchers, corrections y mission-critical civilians tiene raíz fisiológica común. BIO-IGNICIÓN aporta evidencia compatible con NIST 800-53, NIOSH ERHMS y NFPA 1582 · 3 min pre-shift · FedRAMP moderate-ready.",
  alternates: { canonical: "/for-public-sector" },
  openGraph: {
    title: "BIO-IGNICIÓN · Public Sector · Fatiga = operational risk",
    description:
      "OPM FEVS 2023: engagement 72/100, 625k respondents, 39% response. NIOSH ERHMS post-9/11. BIO: mission-grade, NIST 800-53-aligned, FedRAMP moderate-ready.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
};

const LAST_REVIEWED = "2026-04-20";

const kickerStyle = {
  fontFamily: cssVar.fontMono,
  fontSize: font.size.xs,
  color: bioSignal.phosphorCyan,
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
    eyebrow: "PARA SECTOR PÚBLICO · FEDERAL, STATE, LOCAL, DEFENSE-CIVILIAN & MISSION-CRITICAL",
    title: "Fatiga del servidor público no es retórica. Es operational risk en mission-critical.",
    editorial:
      "El call center PSAP, el incident commander en shift 18-sobre-24, el analyst con clearance y el corrections officer en rotación viven en el mismo eslabón fisiológico. Se mide en HRV, no en engagement score FEVS.",
    intro:
      "BIO-IGNICIÓN se instrumenta en los 3 minutos pre-shift, en briefing de incident command o en turno PSAP. NIST 800-53-aligned, FedRAMP moderate-ready, panel operativo visible al Chief Human Capital Officer / Safety & Occupational Health Manager — no al analista de encuesta anual.",
    metaSoc: "SOC 2 Type I · activo",
    metaFed: "FedRAMP · moderate-ready",
    metaNist: "NIST 800-53 · aligned",
    metaShift: "3 min pre-shift",

    scarcityLabel: "Q2 2026 · PILOTO MISSION-GRADE · 5 AGENCIAS",

    statFevs: "OPM FEVS 2023 · engagement global",
    statFevsSub: "OPM · 625k respondents · 39% response rate",
    statErhms: "Framework NIOSH · emergency responders",
    statErhmsSub: "ERHMS · post-9/11 · CDC/NIOSH · 2012",
    statNfpa: "NFPA 1582 · standard médico",
    statNfpaSub: "Fire dept occupational medical program · NFPA",
    statShiftRisk: "Incremento riesgo lesión y error · turno rotativo",
    statShiftRiskSub: "NIOSH · literatura shift-work · meta-análisis",

    benchmarkKicker: "CONTEXTO · DATA PÚBLICA DE MISIÓN",
    benchmarkFevsSrc: "OPM",
    benchmarkFevsV: "72 / 100",
    benchmarkFevsL: "OPM Federal Employee Viewpoint Survey 2023 · engagement score 72 · 625,000 respondents · 39% response rate · referencia pública del estado de la workforce federal.",
    benchmarkErhmsSrc: "NIOSH",
    benchmarkErhmsV: "ERHMS",
    benchmarkErhmsL: "Emergency Responder Health Monitoring and Surveillance · CDC/NIOSH framework post-9/11 para monitoreo de fatiga, estrés y exposure en incident response extendido.",
    benchmarkNfpaSrc: "NFPA",
    benchmarkNfpaV: "1582",
    benchmarkNfpaL: "Standard on Comprehensive Occupational Medical Program for Fire Departments · referencia de referencia para mission-readiness y fitness-for-duty en first-responder.",
    benchmarkNistSrc: "NIST",
    benchmarkNistV: "800-53",
    benchmarkNistL: "Security and Privacy Controls for Information Systems and Organizations · Rev. 5 · el control environment PS/AC/AU incluye personnel reliability y operational readiness como factor humano.",

    painKicker: "TESIS · POR QUÉ IMPORTA EN TU AGENCIA",
    painH: "La fatiga del servidor público es un leading indicator de incident y de mission failure.",
    painBody:
      "After-action reviews, IG reports y audit findings son lagging — reportan lo que ya pasó en el field. HRV y la fatiga autonómica del PSAP dispatcher, incident commander, corrections officer y mission-critical civilian se detectan horas antes del mis-routing de despacho, del mis-call en incident command o del near-miss con inmate. BIO interviene en el eslabón temprano porque ahí se corrige el resto.",
    painP1Title: "1. Mission assurance · fatiga como leading indicator",
    painP1Body:
      "GAO, IG reports y after-action reviews convergen: en eventos de mission failure, fatiga del operator aparece repetidamente en la causal chain — PSAP mis-dispatch, corrections assault, wildland-fire entrapment, cyber-incident mishandling. Leading indicator HRV cierra el gap entre wellness encuesta-anual y operational readiness real. BIO aporta evidencia estructurada — no sustituye al Chief Safety Officer, al Incident Commander ni al IG investigator.",
    painP2Title: "2. NIST 800-53 + FedRAMP · control environment personnel-facing",
    painP2Body:
      "NIST 800-53 Rev. 5 (PS/AC/AU control families) trata personnel reliability y operational availability como parte del control environment formal. FedRAMP moderate exige evidencia continua de ese environment. BIO-IGNICIÓN se estructura como evidencia humana compatible — exports auditables, segregation of duty, logs con integrity. Estamos trabajando postura FedRAMP moderate-ready; no implica autorización ATO vigente sin el 3PAO formal.",
    painP3Title: "3. Rotación = fuga de servidor público con clearance / institucional memory",
    painP3Body:
      "Cada PSAP senior, corrections sergeant, security-cleared analyst o incident commander que se va se lleva 5–15 años de policy familiarity, community relations y tribal knowledge operacional. OPM estima time-to-hire en ~100 días para posiciones federal estándar y substancialmente mayor para roles con clearance TS/SCI. Reducir rotación voluntaria 10% en una agencia de 5,000 paga múltiples ciclos de BIO.",
    painP4Title: "4. Federal + state/local + defense-civilian = multi-jurisdicción",
    painP4Body:
      "US federal (NIST 800-53, FedRAMP, OPM, 5 U.S.C., OSH Act federal-employee coverage vía EO 12196), state/local (NFPA 1582 para fire, POST standards para law enforcement, PSAP standards APCO/NENA), defense-civilian (DFARS NIST 800-171), UK (Civil Service HSE), EU (EU-OSHA), MX (SFP + STPS NOM-035). Cada uno exige gestión de factores humanos en el control environment. BIO aporta evidencia mappable — no sustituye al Agency Safety Officer, al IG ni al Competent Authority.",

    fitKicker: "CÓMO ENCAJA · OPERATIVAMENTE",
    fitH: "Se instrumenta en los 3 minutos que ya existen pre-shift, en briefing o en call-line check-in.",
    fitBody:
      "No pedimos tiempo extra al servidor público ni al first responder. Pedimos 3 minutos estructurados pre-shift, en briefing de incident command o en call-line check-in PSAP. El impacto se mide en HRV y en operational-readiness trend, no en FEVS score.",
    fitL1: "Protocolos respiración resonante 3 min (5.5–6 bpm) validados clínicamente · compatibles con pre-shift briefing, PSAP check-in o incident-command handoff · efecto medible en HRV en sesión 1.",
    fitL2: "Dashboard operativo para Chief Human Capital Officer / Safety & Occupational Health Manager · agregados anónimos por unit / shift / discipline · segmentos con k ≥ 5 servidores · sin exponer datos individuales ni asignaciones de puesto.",
    fitL3: "Reportes individuales permanecen privados para el servidor · cumple expectativa de confidencialidad equivalente a EAP federal (FEAP) · evita retaliation claim bajo Whistleblower Protection Act (5 U.S.C. § 2302) y bajo NIST SP 800-53 AC-22 public-access-controlled information.",
    fitL4: "SSO SAML 2.0 + SCIM + audit trail · compatible con Login.gov / PIV / CAC / IdP enterprise · provisioning automático y logging NIST AU-family-ready.",
    fitL5: "NIST 800-53 evidence pack · artifacts de operational-readiness + fatigue risk register + personnel-reliability training-compliance · descargables bajo NDA para IG auditor o 3PAO assessor.",
    fitL6: "Exports bajo NDA: SOC 2 Type I, DPA, ISO 27001 gap analysis, NIST 800-53 mapping, FedRAMP moderate readiness assessment (status: ready, no ATO).",

    peerKicker: "COMPARATIVO · QUÉ HAY HOY EN TU AGENCIA",
    peerH: "Contra lo que ya tienes instalado.",
    peerBody:
      "Referencias de adopción y alcance típico en agencia federal mainstream, state/local de ciudad mediana-grande y defense-civilian tier-1. Tu mix varía, pero el patrón es estable.",
    peerColCat: "Categoría",
    peerColCost: "USD / servidor / año",
    peerColScope: "Alcance",
    peerRowEapCat: "FEAP / EAP gubernamental (contract)",
    peerRowEapCost: "$165",
    peerRowEapScope: "Consejería reactiva · adopción 3–7% en federal workforce · sin instrumentación fisiológica · no referenciable para NIST 800-53 evidence pack.",
    peerRowWellnessCat: "Wellness federal (FedEx + contratistas wellness)",
    peerRowWellnessCost: "$380",
    peerRowWellnessScope: "Gamificación · sin outcome operativo medible · abandono a 90 días · no referenciable ante IG ni en FedRAMP assessment.",
    peerRowWearableCat: "Responder wearables (Hexoskin · Equivital · ZOLL)",
    peerRowWearableCost: "$520",
    peerRowWearableScope: "Detección de heat-stress / cardiac / proximity · uso en tactical & wildland-fire · no cubre PSAP ni mission-critical civilian · supply-chain NDAA §889 caveat variable.",
    peerRowBioCat: "BIO-IGNICIÓN · Growth",
    peerRowBioCost: "$228",
    peerRowBioScope: "HRV grado mission · NIST 800-53-aligned · FedRAMP moderate-ready · NIOSH ERHMS · NFPA 1582-compatible · panel Safety/HCO · SSO + PIV/CAC + SCIM.",
    peerCite: "Fuentes: SHRM 2024 public-sector cut, OPM FEVS 2023 technical report, NFPA 1582 standard abstract. Precio BIO vigente (2026-Q2).",

    sourcesKicker: "FUENTES · LITERATURA PUBLIC-SECTOR & REGULATORIA",
    sourcesH: "De dónde vienen las cifras.",
    sourcesBody:
      "Todas las cifras provienen de literatura revisada por pares, reportes oficiales OPM/GAO/IG, publicaciones NIST/NIOSH y standards NFPA. Citadas bajo fair-use académico.",
    sourceFevs:
      "Office of Personnel Management (OPM) · Federal Employee Viewpoint Survey 2023 Results · engagement score 72/100 · 625,000 respondents · 39% response rate · referencia pública estándar de la federal workforce.",
    sourceNist:
      "NIST · SP 800-53 Rev. 5 Security and Privacy Controls · control families PS (Personnel Security), AC (Access Control), AU (Audit & Accountability) · base regulatoria del federal control environment.",
    sourceFedramp:
      "FedRAMP · Federal Risk and Authorization Management Program · moderate impact level · requiere 3PAO assessment + authorization-to-operate (ATO). BIO-IGNICIÓN postura: moderate-ready, no ATO vigente.",
    sourceErhms:
      "NIOSH · Emergency Responder Health Monitoring and Surveillance (ERHMS) · CDC/NIOSH/NIEHS framework post-9/11 · diseñado para incident response extendido y exposure de fatiga / estrés / HAZMAT.",
    sourceNfpa:
      "NFPA · Standard 1582 Comprehensive Occupational Medical Program for Fire Departments · referencia de mission-readiness y fitness-for-duty para first responder · amplia adopción en state/local US fire service.",
    sourceNiosh:
      "NIOSH · Plain Language About Shiftwork & training material · meta-análisis + revisiones sistemáticas documentan incremento ~30% en riesgo de lesión y error en turno rotativo nocturno vs. diurno.",
    sourceNdaa889:
      "NDAA Section 889 (FY 2019) · prohíbe uso federal de telecommunications/video equipment de ciertos vendors · BIO-IGNICIÓN opera sin dependencias hardware directas de esos vendors.",
    sourceKoenig:
      "Koenig et al. 2016 · meta-análisis HRV biofeedback en población clínica · d = 0.83 reducción ansiedad (efecto grande).",
    sourceGoessl:
      "Goessl et al. · Psychological Medicine 2017 · meta-análisis d = 0.50 reducción ansiedad con HRV biofeedback (n=482). Nuestro cap 0.35 ≈ 70% del observado.",

    entKicker: "COMPLIANCE & PROCUREMENT · PUBLIC SECTOR",
    entH: "Lo que tu Contracting Officer, IG y Chief Security Officer va a pedir — ya está respondido.",
    entBody:
      "Postura documentada para cada control. Artefactos formales (SOC 2 Type I, DPA, ISO 27001 gap, NIST 800-53 mapping, FedRAMP moderate readiness, NFPA 1582 compatibility note) entregados bajo NDA vía Trust Center.",
    entSoc2: "SOC 2 Type I · postura activa",
    entFedramp: "FedRAMP · moderate-ready (no ATO)",
    entNist: "NIST 800-53 · Rev. 5 aligned",
    entErhms: "NIOSH ERHMS · compatible",
    entNfpa: "NFPA 1582 · compatible",
    entDpa: "DPA · GDPR Recital 26",
    entSso: "SSO · SAML 2.0 + SCIM + PIV/CAC",
    entSla: "99.9% SLA · mission-grade",
    entFoot: "Datos individuales segregados por servidor. Chief Human Capital Officer / Safety & Occupational Health Manager solo ve agregados anonimizados ≥ 5 servidores por segmento (unit, shift, discipline). Clearance level y asignación específica nunca se exponen individualmente.",
    entJurisdictions: "Cobertura jurisdiccional · US: NIST 800-53 · FedRAMP moderate-ready · OPM · EO 12196 (federal OSH) · state/local: NFPA 1582 · POST · APCO/NENA PSAP · defense-civilian: DFARS + NIST 800-171 · UK: Civil Service HSE · EU: EU-OSHA · MX: SFP + STPS NOM-035.",

    disclaimerH: "Nota legal · lectura en 30 s",
    disclaimer1:
      "Las cifras son estimaciones a partir de literatura pública revisada por pares, reportes oficiales OPM/GAO/NIST/NIOSH y standards NFPA, no garantías. Los resultados reales dependen de implementación, tipo de agencia (federal / state / local / defense-civilian), misión, tasa de adherencia y contexto operativo.",
    disclaimer2:
      "BIO-IGNICIÓN es una herramienta de bienestar operativo basada en HRV · NO es dispositivo médico, NO diagnostica, NO trata condiciones médicas, NO sustituye evaluación clínica ni el fitness-for-duty assessment bajo NFPA 1582 ni el federal occupational health exam bajo 5 U.S.C. § 7901. Complementario al FEAP / EAP formal de la agencia.",
    disclaimer3:
      "El término 'grado mission' se refiere a la calidad de medición HRV (validación frente a ECG en literatura) y a la robustez operativa y auditable de la plataforma. NO implica autorización regulatoria como dispositivo médico (FDA / COFEPRIS / CE) ni ATO FedRAMP vigente ni acreditación DoD RMF.",
    disclaimer4:
      "'FedRAMP moderate-ready' significa que la postura de BIO-IGNICIÓN está estructurada contra el baseline moderate; NO implica authorization-to-operate (ATO) vigente ni listing en FedRAMP Marketplace. El 3PAO assessment formal es prerequisito de ATO y está fuera del scope actual.",
    disclaimer5:
      "'NIST 800-53-aligned' y 'NIOSH ERHMS-compatible' significan que los exportes y logs de BIO-IGNICIÓN están estructurados de forma compatible con el control environment respectivo. NO implican endorsement de NIST, de CDC/NIOSH ni de NFPA, y NO sustituyen al assessment formal por 3PAO, Agency Safety Officer, IG ni Competent Authority.",
    disclaimer6:
      "BIO-IGNICIÓN NO sustituye el Whistleblower Protection Act (5 U.S.C. § 2302), el MSPB ni los canales formales de IG. Reportes individuales del servidor permanecen privados y son no-retaliable por diseño del panel agregado (k ≥ 5).",

    closingKicker: "PRÓXIMO PASO · PUBLIC SECTOR",
    closingHLead: "Agenda con supuestos de agencia.",
    closingHBody: "Un cierre de 45 min con tu Chief Human Capital Officer, Safety Officer y Contracting.",
    closingBody:
      "Llevamos los supuestos a tu contexto real: tipo de agencia (federal / state / local / defense-civilian), misión (PSAP, first response, corrections, mission-critical civilian, cyber), clearance environment, regulatorio aplicable (NIST 800-53, FedRAMP, NFPA 1582, NIOSH ERHMS, OPM). El cohorte piloto Q2 2026 está limitado a 5 agencias mission-grade.",
    closingPrimary: "Agenda demo · mission-grade",
    closingSecondary: "Ver ROI con tu agencia",
    closingTertiary: "Trust Center · due diligence",
    closingAvail: "Página revisada",
    closingContact: "publicsector@bio-ignicion.app",
  },
  en: {
    eyebrow: "FOR PUBLIC SECTOR · FEDERAL, STATE, LOCAL, DEFENSE-CIVILIAN & MISSION-CRITICAL",
    title: "Public-servant fatigue isn't rhetoric. It's operational risk in mission-critical.",
    editorial:
      "The PSAP dispatcher, the incident commander on an 18-of-24 shift, the cleared analyst and the corrections officer on rotation live on the same physiological link. It's measured in HRV, not FEVS engagement score.",
    intro:
      "BIO-IGNICIÓN instruments the 3 minutes that already exist pre-shift, at incident-command briefing or at PSAP check-in. NIST 800-53-aligned, FedRAMP moderate-ready, operating dashboard visible to the Chief Human Capital Officer / Safety & Occupational Health Manager — not to the annual-survey analyst.",
    metaSoc: "SOC 2 Type I · active",
    metaFed: "FedRAMP · moderate-ready",
    metaNist: "NIST 800-53 · aligned",
    metaShift: "3 min pre-shift",

    scarcityLabel: "Q2 2026 · MISSION-GRADE PILOT · 5 AGENCIES",

    statFevs: "OPM FEVS 2023 · global engagement",
    statFevsSub: "OPM · 625k respondents · 39% response rate",
    statErhms: "NIOSH framework · emergency responders",
    statErhmsSub: "ERHMS · post-9/11 · CDC/NIOSH · 2012",
    statNfpa: "NFPA 1582 · medical standard",
    statNfpaSub: "Fire dept occupational medical program · NFPA",
    statShiftRisk: "Injury and error risk increase · rotating shift",
    statShiftRiskSub: "NIOSH · shift-work literature · meta-analysis",

    benchmarkKicker: "CONTEXT · PUBLIC MISSION DATA",
    benchmarkFevsSrc: "OPM",
    benchmarkFevsV: "72 / 100",
    benchmarkFevsL: "OPM Federal Employee Viewpoint Survey 2023 · engagement score 72 · 625,000 respondents · 39% response rate · standard public reference for the federal-workforce state.",
    benchmarkErhmsSrc: "NIOSH",
    benchmarkErhmsV: "ERHMS",
    benchmarkErhmsL: "Emergency Responder Health Monitoring and Surveillance · CDC/NIOSH framework post-9/11 for fatigue, stress and exposure monitoring in extended incident response.",
    benchmarkNfpaSrc: "NFPA",
    benchmarkNfpaV: "1582",
    benchmarkNfpaL: "Standard on Comprehensive Occupational Medical Program for Fire Departments · reference baseline for mission-readiness and fitness-for-duty in first responders.",
    benchmarkNistSrc: "NIST",
    benchmarkNistV: "800-53",
    benchmarkNistL: "Security and Privacy Controls for Information Systems and Organizations · Rev. 5 · the PS/AC/AU control environment includes personnel reliability and operational readiness as human factors.",

    painKicker: "THESIS · WHY IT MATTERS AT YOUR AGENCY",
    painH: "Public-servant fatigue is a leading indicator of incidents and mission failure.",
    painBody:
      "After-action reviews, IG reports and audit findings are lagging — they report what already happened in the field. HRV and autonomic fatigue in PSAP dispatcher, incident commander, corrections officer and mission-critical civilian are detectable hours before a dispatch mis-routing, an incident-command mis-call or an inmate near-miss. BIO intervenes at the early link because that's where the rest is fixed.",
    painP1Title: "1. Mission assurance · fatigue as leading indicator",
    painP1Body:
      "GAO, IG reports and after-action reviews converge: in mission-failure events, operator fatigue repeatedly appears in the causal chain — PSAP mis-dispatch, corrections assault, wildland-fire entrapment, cyber-incident mishandling. A leading HRV indicator closes the gap between annual-survey wellness and real operational readiness. BIO provides structured evidence — it does not replace the Chief Safety Officer, the Incident Commander nor the IG investigator.",
    painP2Title: "2. NIST 800-53 + FedRAMP · personnel-facing control environment",
    painP2Body:
      "NIST 800-53 Rev. 5 (PS/AC/AU control families) treats personnel reliability and operational availability as part of the formal control environment. FedRAMP moderate requires continuous evidence of that environment. BIO-IGNICIÓN is structured as compatible human evidence — auditable exports, segregation of duty, integrity-logged. We are working a FedRAMP moderate-ready posture; this does NOT imply a current ATO without the formal 3PAO.",
    painP3Title: "3. Turnover = loss of cleared and institutional-memory workforce",
    painP3Body:
      "Every senior PSAP, corrections sergeant, security-cleared analyst or incident commander who leaves takes 5–15 years of policy familiarity, community relations and operational tribal knowledge with them. OPM estimates time-to-hire at ~100 days for standard federal positions and substantially longer for TS/SCI-cleared roles. A 10% voluntary-turnover reduction at a 5,000-employee agency pays for multiple BIO cycles.",
    painP4Title: "4. Federal + state/local + defense-civilian = multi-jurisdiction",
    painP4Body:
      "US federal (NIST 800-53, FedRAMP, OPM, 5 U.S.C., federal-employee OSH Act coverage via EO 12196), state/local (NFPA 1582 for fire, POST standards for law enforcement, APCO/NENA PSAP standards), defense-civilian (DFARS NIST 800-171), UK (Civil Service HSE), EU (EU-OSHA), MX (SFP + STPS NOM-035). Each demands human-factors management in the control environment. BIO provides mappable evidence — it does not replace the Agency Safety Officer, the IG nor the Competent Authority.",

    fitKicker: "HOW IT FITS · OPERATIONALLY",
    fitH: "It instruments the 3 minutes that already exist pre-shift, at briefing or at call-line check-in.",
    fitBody:
      "We don't ask the public servant or first responder for extra time. We ask for 3 structured minutes pre-shift, at incident-command briefing or at PSAP call-line check-in. Impact is measured in HRV and operational-readiness trend, not FEVS score.",
    fitL1: "Clinically-validated 3-min resonant-breathing protocols (5.5–6 bpm) · compatible with pre-shift briefing, PSAP check-in or incident-command handoff · measurable HRV effect from session 1.",
    fitL2: "Operating dashboard for Chief Human Capital Officer / Safety & Occupational Health Manager · anonymized aggregates by unit / shift / discipline · segments with k ≥ 5 servants · no individual exposure and duty assignments never surfaced.",
    fitL3: "Individual reports stay private to the servant · matches federal EAP (FEAP) confidentiality expectation · avoids retaliation claims under the Whistleblower Protection Act (5 U.S.C. § 2302) and NIST SP 800-53 AC-22 public-access-controlled information.",
    fitL4: "SSO SAML 2.0 + SCIM + audit trail · compatible with Login.gov / PIV / CAC / enterprise IdPs · automated provisioning and NIST AU-family-ready logging.",
    fitL5: "NIST 800-53 evidence pack · operational-readiness + fatigue risk register + personnel-reliability training-compliance artifacts · downloadable under NDA for IG auditor or 3PAO assessor.",
    fitL6: "Under-NDA exports: SOC 2 Type I, DPA, ISO 27001 gap analysis, NIST 800-53 mapping, FedRAMP moderate readiness assessment (status: ready, no ATO).",

    peerKicker: "COMPARISON · WHAT'S ALREADY INSTALLED",
    peerH: "Against what your agency already has.",
    peerBody:
      "Reference adoption and scope at a mainstream federal agency, mid-to-large state/local, and tier-1 defense-civilian. Your mix varies, but the pattern is stable.",
    peerColCat: "Category",
    peerColCost: "USD / servant / yr",
    peerColScope: "Scope",
    peerRowEapCat: "FEAP / government-contract EAP",
    peerRowEapCost: "$165",
    peerRowEapScope: "Reactive counseling · 3–7% adoption in federal workforce · no physiological instrumentation · not referenceable as NIST 800-53 evidence pack.",
    peerRowWellnessCat: "Federal wellness (FedEx + wellness contractors)",
    peerRowWellnessCost: "$380",
    peerRowWellnessScope: "Gamification · no measurable operational outcome · 90-day drop-off · not referenceable to an IG nor in a FedRAMP assessment.",
    peerRowWearableCat: "Responder wearables (Hexoskin · Equivital · ZOLL)",
    peerRowWearableCost: "$520",
    peerRowWearableScope: "Heat-stress / cardiac / proximity detection · used in tactical & wildland-fire · does not cover PSAP nor mission-critical civilians · supply-chain NDAA §889 caveat varies.",
    peerRowBioCat: "BIO-IGNICIÓN · Growth",
    peerRowBioCost: "$228",
    peerRowBioScope: "Mission-grade HRV · NIST 800-53-aligned · FedRAMP moderate-ready · NIOSH ERHMS · NFPA 1582-compatible · Safety/HCO dashboard · SSO + PIV/CAC + SCIM.",
    peerCite: "Sources: SHRM 2024 public-sector cut, OPM FEVS 2023 technical report, NFPA 1582 standard abstract. BIO pricing current (2026-Q2).",

    sourcesKicker: "SOURCES · PUBLIC-SECTOR & REGULATORY LITERATURE",
    sourcesH: "Where the figures come from.",
    sourcesBody:
      "All figures come from peer-reviewed literature, official OPM/GAO/IG reports, NIST/NIOSH publications and NFPA standards. Cited under academic fair-use.",
    sourceFevs:
      "Office of Personnel Management (OPM) · Federal Employee Viewpoint Survey 2023 Results · engagement score 72/100 · 625,000 respondents · 39% response rate · standard public reference of the federal workforce.",
    sourceNist:
      "NIST · SP 800-53 Rev. 5 Security and Privacy Controls · control families PS (Personnel Security), AC (Access Control), AU (Audit & Accountability) · regulatory baseline of the federal control environment.",
    sourceFedramp:
      "FedRAMP · Federal Risk and Authorization Management Program · moderate impact level · requires 3PAO assessment + authorization-to-operate (ATO). BIO-IGNICIÓN posture: moderate-ready, no ATO in force.",
    sourceErhms:
      "NIOSH · Emergency Responder Health Monitoring and Surveillance (ERHMS) · CDC/NIOSH/NIEHS framework post-9/11 · designed for extended incident response and fatigue / stress / HAZMAT exposure.",
    sourceNfpa:
      "NFPA · Standard 1582 Comprehensive Occupational Medical Program for Fire Departments · reference for mission-readiness and fitness-for-duty in first responders · broad adoption across US state/local fire service.",
    sourceNiosh:
      "NIOSH · Plain Language About Shiftwork & training material · meta-analyses + systematic reviews document ~30% increase in injury and error risk on rotating night shift vs. day shift.",
    sourceNdaa889:
      "NDAA Section 889 (FY 2019) · bans federal use of telecommunications/video equipment from certain vendors · BIO-IGNICIÓN operates without direct hardware dependencies on those vendors.",
    sourceKoenig:
      "Koenig et al. 2016 · HRV biofeedback meta-analysis in clinical populations · d = 0.83 anxiety reduction (large effect).",
    sourceGoessl:
      "Goessl et al. · Psychological Medicine 2017 · meta-analysis d = 0.50 anxiety reduction via HRV biofeedback (n=482). Our 0.35 cap ≈ 70% of observed effect.",

    entKicker: "COMPLIANCE & PROCUREMENT · PUBLIC SECTOR",
    entH: "Everything your Contracting Officer, IG and Chief Security Officer will ask — already answered.",
    entBody:
      "Documented posture for each control. Formal artifacts (SOC 2 Type I, DPA, ISO 27001 gap, NIST 800-53 mapping, FedRAMP moderate readiness, NFPA 1582 compatibility note) delivered under NDA via Trust Center.",
    entSoc2: "SOC 2 Type I · active posture",
    entFedramp: "FedRAMP · moderate-ready (no ATO)",
    entNist: "NIST 800-53 · Rev. 5 aligned",
    entErhms: "NIOSH ERHMS · compatible",
    entNfpa: "NFPA 1582 · compatible",
    entDpa: "DPA · GDPR Recital 26",
    entSso: "SSO · SAML 2.0 + SCIM + PIV/CAC",
    entSla: "99.9% SLA · mission-grade",
    entFoot: "Individual data is segregated per servant. The Chief Human Capital Officer / Safety & Occupational Health Manager sees only anonymized aggregates of ≥ 5 servants per segment (unit, shift, discipline). Clearance level and specific assignment are never surfaced individually.",
    entJurisdictions: "Jurisdictional coverage · US: NIST 800-53 · FedRAMP moderate-ready · OPM · EO 12196 (federal OSH) · state/local: NFPA 1582 · POST · APCO/NENA PSAP · defense-civilian: DFARS + NIST 800-171 · UK: Civil Service HSE · EU: EU-OSHA · MX: SFP + STPS NOM-035.",

    disclaimerH: "Legal note · 30-sec read",
    disclaimer1:
      "Figures are estimates from peer-reviewed public literature, official OPM/GAO/NIST/NIOSH reports and NFPA standards — not guarantees. Actual results depend on implementation, agency type (federal / state / local / defense-civilian), mission, adherence rate and operational context.",
    disclaimer2:
      "BIO-IGNICIÓN is an HRV-based operational wellbeing tool · it is NOT a medical device, does NOT diagnose, does NOT treat medical conditions, and does NOT replace clinical evaluation, NFPA 1582 fitness-for-duty assessment nor the federal occupational-health exam under 5 U.S.C. § 7901. Complementary to the agency's formal FEAP / EAP only.",
    disclaimer3:
      "The term 'mission-grade' refers to HRV measurement quality (ECG-validated in literature) and platform operational/auditable robustness. It does NOT imply regulatory clearance as a medical device (FDA / COFEPRIS / CE), nor a current FedRAMP ATO, nor DoD RMF accreditation.",
    disclaimer4:
      "'FedRAMP moderate-ready' means BIO-IGNICIÓN's posture is structured against the moderate baseline; it does NOT imply a current authorization-to-operate (ATO) nor listing on the FedRAMP Marketplace. The formal 3PAO assessment is a prerequisite for ATO and is outside current scope.",
    disclaimer5:
      "'NIST 800-53-aligned' and 'NIOSH ERHMS-compatible' mean BIO-IGNICIÓN exports and logs are structured to be compatible with the respective control environment. They do NOT imply endorsement by NIST, CDC/NIOSH or NFPA, and do NOT replace the formal assessment by 3PAO, Agency Safety Officer, IG or Competent Authority.",
    disclaimer6:
      "BIO-IGNICIÓN does NOT replace the Whistleblower Protection Act (5 U.S.C. § 2302), MSPB nor the formal IG channels. Individual servant reports stay private and are non-retaliable by aggregated-panel design (k ≥ 5).",

    closingKicker: "NEXT STEP · PUBLIC SECTOR",
    closingHLead: "Book a demo with agency assumptions.",
    closingHBody: "A 45-min closing with your Chief Human Capital Officer, Safety Officer and Contracting.",
    closingBody:
      "We bring the assumptions to your real context: agency type (federal / state / local / defense-civilian), mission (PSAP, first response, corrections, mission-critical civilian, cyber), clearance environment, applicable regulation (NIST 800-53, FedRAMP, NFPA 1582, NIOSH ERHMS, OPM). The Q2 2026 pilot cohort is limited to 5 mission-grade agencies.",
    closingPrimary: "Book demo · mission-grade",
    closingSecondary: "Run ROI with your agency",
    closingTertiary: "Trust Center · due diligence",
    closingAvail: "Page reviewed",
    closingContact: "publicsector@bio-ignicion.app",
  },
};

export default async function ForPublicSectorPage() {
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
    <PublicShell activePath="/for-public-sector">
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
              <ul className="bi-roi-meta" aria-label="public-sector-meta">
                <li><span className="dot" aria-hidden /> {c.metaSoc}</li>
                <li><span className="dot" aria-hidden /> {c.metaFed}</li>
                <li><span className="dot" aria-hidden /> {c.metaNist}</li>
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
              <span className="v">72 / 100</span>
              <span className="l">{c.statFevs}</span>
              <span className="s">{c.statFevsSub}</span>
            </div>
            <div>
              <span className="v">ERHMS</span>
              <span className="l">{c.statErhms}</span>
              <span className="s">{c.statErhmsSub}</span>
            </div>
            <div>
              <span className="v">1582</span>
              <span className="l">{c.statNfpa}</span>
              <span className="s">{c.statNfpaSub}</span>
            </div>
            <div>
              <span className="v">+30%</span>
              <span className="l">{c.statShiftRisk}</span>
              <span className="s">{c.statShiftRiskSub}</span>
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
              <div className="src">{c.benchmarkFevsSrc}</div>
              <span className="v">{c.benchmarkFevsV}</span>
              <span className="l">{c.benchmarkFevsL}</span>
            </div>
            <div className="bi-roi-benchmark-cell">
              <div className="src">{c.benchmarkErhmsSrc}</div>
              <span className="v">{c.benchmarkErhmsV}</span>
              <span className="l">{c.benchmarkErhmsL}</span>
            </div>
            <div className="bi-roi-benchmark-cell">
              <div className="src">{c.benchmarkNfpaSrc}</div>
              <span className="v">{c.benchmarkNfpaV}</span>
              <span className="l">{c.benchmarkNfpaL}</span>
            </div>
            <div className="bi-roi-benchmark-cell">
              <div className="src">{c.benchmarkNistSrc}</div>
              <span className="v">{c.benchmarkNistV}</span>
              <span className="l">{c.benchmarkNistL}</span>
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
                  <td data-label={c.peerColCat}><span className="bi-roi-peer-label">{c.peerRowWearableCat}</span></td>
                  <td data-label={c.peerColCost}>{c.peerRowWearableCost}</td>
                  <td data-label={c.peerColScope}><span className="bi-roi-peer-hint">{c.peerRowWearableScope}</span></td>
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
            <li><span className="bi-roi-source-tag">OPM · FEVS</span><span>{c.sourceFevs}</span></li>
            <li><span className="bi-roi-source-tag">NIST · 800-53</span><span>{c.sourceNist}</span></li>
            <li><span className="bi-roi-source-tag">FedRAMP</span><span>{c.sourceFedramp}</span></li>
            <li><span className="bi-roi-source-tag">NIOSH · ERHMS</span><span>{c.sourceErhms}</span></li>
            <li><span className="bi-roi-source-tag">NFPA 1582</span><span>{c.sourceNfpa}</span></li>
            <li><span className="bi-roi-source-tag">NIOSH</span><span>{c.sourceNiosh}</span></li>
            <li><span className="bi-roi-source-tag">NDAA §889</span><span>{c.sourceNdaa889}</span></li>
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
            <li className="bi-roi-ent-chip">{c.entFedramp}</li>
            <li className="bi-roi-ent-chip">{c.entNist}</li>
            <li className="bi-roi-ent-chip">{c.entErhms}</li>
            <li className="bi-roi-ent-chip">{c.entNfpa}</li>
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
      <section aria-labelledby="ps-closing" className="bi-demo-closing-section">
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

              <h2 id="ps-closing" className="bi-demo-closing-h">
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
