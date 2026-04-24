/* ═══════════════════════════════════════════════════════════════
   /for-energy — Vertical B2B landing for oil & gas, refining,
   petrochem and utility operators. Thesis: operator fatigue is a
   process-safety and API RP 755-compliance problem (OSHA PSM /
   Seveso III / COMAH), not HR — codified by the CSB investigation
   of the 2005 BP Texas City incident (15 fatalities, 29 consecutive
   12-hr shifts).
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
  title: "Para Energía · Fatiga del operador es process safety",
  description:
    "Fatiga en panel-operator, field operator y maintenance crew tiene raíz fisiológica común. BIO-IGNICIÓN aporta evidencia compatible con API RP 755, OSHA PSM y NOM-035 · 3 min pre-shift · SSO + SCIM.",
  alternates: { canonical: "/for-energy" },
  openGraph: {
    title: "BIO-IGNICIÓN · Energy · Fatiga del operador = process safety",
    description:
      "Texas City 2005: 15 muertes, 12h × 29 días consecutivos (CSB). API RP 755 (2ª ed 2019) post-incident. BIO: process-grade, API 755-aligned, OSHA PSM-ready.",
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
    eyebrow: "PARA ENERGÍA · OIL & GAS, REFINING, PETROCHEM & UTILITIES",
    title: "Fatiga del operador no es HR. Es process safety y compliance API 755.",
    editorial:
      "El override de alarmas, el error en lineup de turnaround y la rotación del panel-operator certificado viven en el mismo eslabón fisiológico. Se mide en HRV, no en Tier 3/4 leading indicator.",
    intro:
      "BIO-IGNICIÓN se instrumenta en los 3 minutos pre-shift, en tour handoff o en turnaround lineup. API RP 755-aligned, OSHA PSM-ready, panel operativo visible al HSE Director / PSM Coordinator — no al analista de RRHH.",
    metaSoc: "SOC 2 Type I · activo",
    metaApi: "API RP 755 · FRMS-aligned",
    metaPsm: "OSHA PSM · 1910.119-ready",
    metaShift: "3 min pre-shift",

    scarcityLabel: "Q2 2026 · PILOTO PROCESS-GRADE · 5 OPERADORES ENERGÉTICOS",

    statTexasCity: "Fatalities · Texas City refinery 2005",
    statTexasCitySub: "CSB · investigación formal · post-blast inquiry",
    statShifts: "Días consecutivos · 12-hr shifts reportados por operators",
    statShiftsSub: "CSB · Texas City investigation findings",
    statApi: "API RP 755 · 2ª edición vigente",
    statApiSub: "API · FRMS post-CSB · mayo 2019",
    statShiftRisk: "Incremento riesgo lesión y error · turno rotativo",
    statShiftRiskSub: "NIOSH · literatura shift-work · meta-análisis",

    benchmarkKicker: "CONTEXTO · DATA PÚBLICA DE PROCESS SAFETY",
    benchmarkCsbSrc: "CSB",
    benchmarkCsbV: "15 / 180",
    benchmarkCsbL: "Fatalities y heridos en la explosión de BP Texas City 2005 · CSB identificó operators trabajando 12-hr shifts por hasta 29 días consecutivos · origen de la recomendación que dio lugar a API RP 755.",
    benchmarkApiSrc: "API",
    benchmarkApiV: "RP 755",
    benchmarkApiL: "Fatigue Risk Management Systems for Personnel in the Refining and Petrochemical Industries · 2ª ed. mayo 2019 · aplicable a facilities cubiertas por OSHA PSM 29 CFR 1910.119.",
    benchmarkOshaSrc: "OSHA",
    benchmarkOshaV: "1910.119",
    benchmarkOshaL: "Process Safety Management of Highly Hazardous Chemicals (PSM) · framework regulatorio que engloba facilities de refining, petrochem y chemical · el control environment incluye factores humanos.",
    benchmarkNioshSrc: "NIOSH",
    benchmarkNioshV: "+30%",
    benchmarkNioshL: "Incremento de riesgo de lesión y error bajo turno rotativo nocturno vs. diurno · NIOSH training & literature · meta-análisis shift-work.",

    painKicker: "TESIS · POR QUÉ IMPORTA EN TU PLANT",
    painH: "La fatiga del operador es un leading indicator de Tier 1 PSE y de OSHA PSM finding.",
    painBody:
      "Tier 1/2 Process Safety Events, OSHA citations y near-miss logs son lagging — reportan lo que ya pasó en el plant. HRV y la fatiga autonómica del panel-operator, field operator y maintenance crew se detectan horas antes del override de alarm, del mis-lineup de turnaround o del bypass del interlock. BIO interviene en el eslabón temprano porque ahí se corrige el resto.",
    painP1Title: "1. Texas City 2005 · caso canónico de fatiga → PSE",
    painP1Body:
      "CSB documentó operators trabajando 12-hr shifts por hasta 29 días consecutivos en BP Texas City · 15 muertes, 180 heridos, miles de millones en impacto económico. La investigación llevó directamente a la recomendación que dio origen a API RP 755. Fatiga no fue factor único pero sí contributor formalmente identificado. BIO existe para aportar el leading signal que ese caso pide en retrospectiva.",
    painP2Title: "2. API RP 755 · data-driven FRMS en refining & petrochem",
    painP2Body:
      "API RP 755 (2ª ed. 2019) exige un FRMS estructurado para personnel en facilities cubiertas por OSHA PSM (29 CFR 1910.119). La literatura crítica (incl. CSB) ha observado que las hours limits de RP 755 son más permisivas que el scientific knowledge actual — eso eleva la expectativa del leading indicator, no la baja. HRV cierra ese gap. BIO aporta evidencia estructurada del FRMS — no sustituye al PSM Coordinator, al Process Hazard Analysis ni al BSEE / EPA inspector para offshore o emissions.",
    painP3Title: "3. Rotación = fuga del panel-operator certificado",
    painP3Body:
      "Cada panel-operator o board-qualified engineer que se va se lleva 2–5 años de familiaridad con unit P&ID, historia de turnaround y memoria de abnormal operation. Reemplazo en senior refining/petrochem operator cae en el rango de $40k–$80k de recruiting + 12–18 meses de ramp a board-qualified. Reducir rotación 10% en una planta con 150 board-qualified operators paga múltiples ciclos de BIO.",
    painP4Title: "4. OSHA PSM + Seveso III + COMAH + STPS = multi-jurisdicción",
    painP4Body:
      "OSHA PSM (29 CFR 1910.119, US), BSEE para offshore (30 CFR 250), Seveso III Directive 2012/18/EU (EU), COMAH 2015 (UK), STPS NOM-028 (MX integridad mecánica) + NOM-035 (psicosocial), MHFR (AU). Cada uno exige gestión de factores humanos en el control environment. BIO aporta evidencia mappable — no sustituye al PSM Coordinator, al Competent Authority ni al Safety Report formal bajo Seveso.",

    fitKicker: "CÓMO ENCAJA · OPERATIVAMENTE",
    fitH: "Se instrumenta en los 3 minutos que ya existen pre-shift, en tour handoff o en turnaround lineup.",
    fitBody:
      "No pedimos tiempo extra al operator ni al maintenance tech. Pedimos 3 minutos estructurados pre-shift, en tour handoff (panel-to-panel) o en el lineup pre-turnaround. El impacto se mide en HRV y en Tier 3/4 leading indicator trend, no en engagement score.",
    fitL1: "Protocolos respiración resonante 3 min (5.5–6 bpm) validados clínicamente · compatibles con pre-shift stretch, tour handoff o turnaround lineup · efecto medible en HRV en sesión 1.",
    fitL2: "Dashboard operativo para HSE Director / PSM Coordinator · agregados anónimos por unit / tour / discipline · segmentos con k ≥ 5 operators · sin exponer datos individuales ni asignaciones de panel.",
    fitL3: "Reportes individuales permanecen privados para el operator · cumple expectativa de confidencialidad equivalente a EAP regulado · evita retaliation claim bajo Whistleblower Protection bajo OSHA 11(c) y bajo programas de near-miss reporting.",
    fitL4: "SSO SAML 2.0 + SCIM + audit trail · compatible con IdP enterprise y con plant access control · provisioning automático y logging PSM-ready.",
    fitL5: "API RP 755 evidence pack · artifacts de FRMS + fatigue risk register + training compliance · descargables bajo NDA para PSM auditor o OSHA inspector.",
    fitL6: "Exports bajo NDA: SOC 2 Type I, DPA, ISO 45001 mapping, ISO 27001 gap analysis, NOM-035 STPS reporte anual (si aplica México).",

    peerKicker: "COMPARATIVO · QUÉ HAY HOY EN TU PLANT",
    peerH: "Contra lo que ya tienes instalado.",
    peerBody:
      "Referencias de adopción y alcance típico en refining mainstream, midstream, upstream + offshore y petrochem tier-1. Tu mix varía, pero el patrón es estable.",
    peerColCat: "Categoría",
    peerColCost: "USD / operator / año",
    peerColScope: "Alcance",
    peerRowEapCat: "EAP tradicional industrial (contract EAP)",
    peerRowEapCost: "$170",
    peerRowEapScope: "Consejería reactiva · adopción 2–6% en field operators · sin instrumentación fisiológica · no referenciable para API RP 755 FRMS.",
    peerRowWellnessCat: "Wellness corporativo (retos, contenido)",
    peerRowWellnessCost: "$430",
    peerRowWellnessScope: "Gamificación · sin outcome operativo medible · abandono a 90 días · no referenciable ante PSM auditor ni en Safety Report Seveso.",
    peerRowWearableCat: "Industrial wearables (Kenzen heat-stress, Guardhat)",
    peerRowWearableCost: "$320",
    peerRowWearableScope: "Detección de heat-stress / fall / proximity · no mide HRV circadiana · reacciona al stress térmico/mecánico · no aplica a panel-room ni a decision fatigue.",
    peerRowBioCat: "BIO-IGNICIÓN · Growth",
    peerRowBioCost: "$228",
    peerRowBioScope: "HRV grado process · API RP 755-aligned · OSHA PSM-ready · STPS NOM-035 · panel HSE/PSM · SSO + SCIM.",
    peerCite: "Fuentes: SHRM 2024, KFF Employer Health Benefits 2024, API RP 755 fact sheet, CSB Texas City final report. Precio BIO vigente (2026-Q2).",

    sourcesKicker: "FUENTES · LITERATURA ENERGY & REGULATORIA",
    sourcesH: "De dónde vienen las cifras.",
    sourcesBody:
      "Todas las cifras provienen de literatura revisada por pares, reportes oficiales CSB/OSHA/API y regulación pública. Citadas bajo fair-use académico.",
    sourceCsb:
      "U.S. Chemical Safety and Hazard Investigation Board (CSB) · Investigation Report on BP Texas City refinery explosion 2005 · 15 fatalities, 180 injuries · CSB identificó operators trabajando 12-hr shifts por hasta 29 días consecutivos · recomendación directa que originó API RP 755.",
    sourceApi:
      "API · RP 755 · 2ª edición mayo 2019 · Fatigue Risk Management Systems for Personnel in the Refining and Petrochemical Industries · aplicable a facilities cubiertas por OSHA PSM (29 CFR 1910.119). Framework de referencia para FRMS en downstream.",
    sourceOshaPsm:
      "OSHA · 29 CFR 1910.119 Process Safety Management of Highly Hazardous Chemicals · framework regulatorio para facilities con chemicals en los listados de PSM · el control environment incluye factores humanos.",
    sourceSeveso:
      "Seveso III Directive · Directive 2012/18/EU · control of major-accident hazards involving dangerous substances · exige Safety Report formal y Safety Management System con competent-authority oversight.",
    sourceComah:
      "COMAH 2015 · Control of Major Accident Hazards Regulations · implementación UK de Seveso III · ejecutada por Competent Authority (HSE + Environment Agency).",
    sourceNiosh:
      "NIOSH · Plain Language About Shiftwork & training material · meta-análisis + revisiones sistemáticas documentan incremento ~30% en riesgo de lesión y error en turno rotativo nocturno vs. diurno.",
    sourceStps:
      "STPS México · NOM-028-STPS (seguridad en procesos químicos) + NOM-035-STPS-2018 (factores psicosociales) · obligatorias en operaciones de riesgo; sanción hasta 500 UMAs por NOM-035.",
    sourceKoenig:
      "Koenig et al. 2016 · meta-análisis HRV biofeedback en población clínica · d = 0.83 reducción ansiedad (efecto grande).",
    sourceGoessl:
      "Goessl et al. · Psychological Medicine 2017 · meta-análisis d = 0.50 reducción ansiedad con HRV biofeedback (n=482). Nuestro cap 0.35 ≈ 70% del observado.",

    entKicker: "COMPLIANCE & PROCUREMENT · ENERGY",
    entH: "Lo que tu equipo HSE, legal y procurement va a pedir — ya está respondido.",
    entBody:
      "Postura documentada para cada control. Artefactos formales (SOC 2 Type I, DPA, ISO 27001 gap, API RP 755 FRMS mapping, OSHA PSM alignment, NOM-035 STPS reporte) entregados bajo NDA vía Trust Center.",
    entSoc2: "SOC 2 Type I · postura activa",
    entApi: "API RP 755 · FRMS-aligned",
    entOshaPsm: "OSHA PSM 1910.119 · ready",
    entNom: "NOM-035 STPS · reporte anual",
    entIso45001: "ISO 45001 · mapping documentado",
    entDpa: "DPA · GDPR Recital 26",
    entSso: "SSO · SAML 2.0 + SCIM",
    entSla: "99.9% SLA · process-grade",
    entFoot: "Datos individuales segregados por operator. HSE Director / PSM Coordinator solo ve agregados anonimizados ≥ 5 operators por segmento (unit, tour, discipline). Asignaciones de panel nunca se exponen individualmente.",
    entJurisdictions: "Cobertura jurisdiccional · US: OSHA 29 CFR 1910.119 · BSEE 30 CFR 250 (offshore) · EU: Seveso III Directive 2012/18 · UK: COMAH 2015 · MX: STPS NOM-028 · NOM-035 · CA: TSSA · CNSC · AU: MHFR · IOGP como referencia internacional.",

    disclaimerH: "Nota legal · lectura en 30 s",
    disclaimer1:
      "Las cifras son estimaciones a partir de literatura pública revisada por pares, reportes oficiales CSB/OSHA/API y regulación, no garantías. Los resultados reales dependen de implementación, tamaño de plant, mix downstream/upstream/petrochem, tasa de adherencia y contexto operativo.",
    disclaimer2:
      "BIO-IGNICIÓN es una herramienta de bienestar operativo basada en HRV · NO es dispositivo médico, NO diagnostica, NO trata condiciones médicas, NO sustituye evaluación clínica ni el fitness-for-duty assessment del plant medical. Complementario al EAP formal de la operación.",
    disclaimer3:
      "El término 'grado process' se refiere a la calidad de medición HRV (validación frente a ECG en literatura) y a la robustez operativa y auditable de la plataforma. NO implica autorización regulatoria como dispositivo médico (FDA / COFEPRIS / CE) ni certificación ATEX / IECEx / Class I Div 1–2 para uso en zonas clasificadas.",
    disclaimer4:
      "'API RP 755-aligned' significa que los exportes y logs de BIO-IGNICIÓN están estructurados de forma compatible con indicadores de un FRMS bajo API RP 755 (2ª ed. 2019). NO implica endorsement de API, NO sustituye al FRMS program owner del operador, al PSM Coordinator ni al auditor PSM/OSHA externo.",
    disclaimer5:
      "'OSHA PSM 1910.119-ready' significa que los reportes de BIO-IGNICIÓN son estructurables como evidencia de factores humanos dentro del control environment PSM. NO implica compliance PSM ni es una atestación, y NO sustituye al Safety Report bajo Seveso III / COMAH ni al Process Hazard Analysis formal.",

    closingKicker: "PRÓXIMO PASO · ENERGY",
    closingHLead: "Agenda con supuestos de plant.",
    closingHBody: "Un cierre de 45 min con tu HSE Director, PSM Coordinator y legal.",
    closingBody:
      "Llevamos los supuestos a tu contexto real: mix refining / petrochem / upstream / offshore / utilities, cantidad de units, jurisdicciones (OSHA, BSEE, Seveso, COMAH, STPS, MHFR), regulatorio aplicable (PSM, RP 755, NOM-028, NOM-035). El cohorte piloto Q2 2026 está limitado a 5 operadores energéticos process-grade.",
    closingPrimary: "Agenda demo · process-grade",
    closingSecondary: "Ver ROI con tu plant",
    closingTertiary: "Trust Center · due diligence",
    closingAvail: "Página revisada",
    closingContact: "energy@bio-ignicion.app",
  },
  en: {
    eyebrow: "FOR ENERGY · OIL & GAS, REFINING, PETROCHEM & UTILITIES",
    title: "Operator fatigue isn't HR. It's process safety and API 755 compliance.",
    editorial:
      "Alarm override, turnaround-lineup error and board-qualified operator churn live on the same physiological link. It's measured in HRV, not in Tier 3/4 leading indicators.",
    intro:
      "BIO-IGNICIÓN instruments the 3 minutes that already exist pre-shift, at tour handoff or at turnaround lineup. API RP 755-aligned, OSHA PSM-ready, operating dashboard visible to the HSE Director / PSM Coordinator — not to the HR analyst.",
    metaSoc: "SOC 2 Type I · active",
    metaApi: "API RP 755 · FRMS-aligned",
    metaPsm: "OSHA PSM · 1910.119-ready",
    metaShift: "3 min pre-shift",

    scarcityLabel: "Q2 2026 · PROCESS-GRADE PILOT · 5 ENERGY OPERATORS",

    statTexasCity: "Fatalities · Texas City refinery 2005",
    statTexasCitySub: "CSB · formal investigation · post-blast inquiry",
    statShifts: "Consecutive days · 12-hr shifts reported for operators",
    statShiftsSub: "CSB · Texas City investigation findings",
    statApi: "API RP 755 · 2nd edition in force",
    statApiSub: "API · post-CSB FRMS · May 2019",
    statShiftRisk: "Injury and error risk increase · rotating shift",
    statShiftRiskSub: "NIOSH · shift-work literature · meta-analysis",

    benchmarkKicker: "CONTEXT · PUBLIC PROCESS-SAFETY DATA",
    benchmarkCsbSrc: "CSB",
    benchmarkCsbV: "15 / 180",
    benchmarkCsbL: "Fatalities and injuries in the BP Texas City 2005 explosion · CSB identified operators working 12-hr shifts for up to 29 consecutive days · origin of the recommendation that led to API RP 755.",
    benchmarkApiSrc: "API",
    benchmarkApiV: "RP 755",
    benchmarkApiL: "Fatigue Risk Management Systems for Personnel in the Refining and Petrochemical Industries · 2nd ed. May 2019 · applicable to facilities covered by OSHA PSM 29 CFR 1910.119.",
    benchmarkOshaSrc: "OSHA",
    benchmarkOshaV: "1910.119",
    benchmarkOshaL: "Process Safety Management of Highly Hazardous Chemicals (PSM) · regulatory framework covering refining, petrochem and chemical facilities · the control environment includes human factors.",
    benchmarkNioshSrc: "NIOSH",
    benchmarkNioshV: "+30%",
    benchmarkNioshL: "Injury-risk and error increase under rotating night shift vs. day shift · NIOSH training & literature · shift-work meta-analysis.",

    painKicker: "THESIS · WHY IT MATTERS AT YOUR PLANT",
    painH: "Operator fatigue is a leading indicator for Tier 1 PSE and OSHA PSM findings.",
    painBody:
      "Tier 1/2 Process Safety Events, OSHA citations and near-miss logs are lagging — they report what already happened at the plant. HRV and autonomic fatigue in panel operator, field operator and maintenance crew are detectable hours before an alarm override, a turnaround-lineup mis-call or an interlock bypass. BIO intervenes at the early link because that's where the rest is fixed.",
    painP1Title: "1. Texas City 2005 · canonical fatigue → PSE case",
    painP1Body:
      "CSB documented operators working 12-hr shifts for up to 29 consecutive days at BP Texas City · 15 fatalities, 180 injuries, billions in economic impact. The investigation led directly to the recommendation that gave rise to API RP 755. Fatigue was not the sole factor but was a formally identified contributor. BIO exists to provide the leading signal that case calls for in retrospect.",
    painP2Title: "2. API RP 755 · data-driven FRMS in refining & petrochem",
    painP2Body:
      "API RP 755 (2nd ed. 2019) requires a structured FRMS for personnel in facilities covered by OSHA PSM (29 CFR 1910.119). Critical literature (incl. CSB) has noted RP 755's hours limits are more permissive than current scientific knowledge — raising the expectation of the leading indicator, not lowering it. HRV closes that gap. BIO provides structured FRMS evidence — it does not replace the PSM Coordinator, the Process Hazard Analysis, nor the BSEE / EPA inspector for offshore or emissions.",
    painP3Title: "3. Turnover = loss of board-qualified operators",
    painP3Body:
      "Every panel operator or board-qualified engineer who leaves takes 2–5 years of unit P&ID familiarity, turnaround history and abnormal-operation memory with them. Replacement for a senior refining/petrochem operator lands in the $40k–$80k recruiting range + 12–18 months ramp to board-qualified. A 10% turnover reduction at a plant with 150 board-qualified operators pays for multiple BIO cycles.",
    painP4Title: "4. OSHA PSM + Seveso III + COMAH + STPS = multi-jurisdiction",
    painP4Body:
      "OSHA PSM (29 CFR 1910.119, US), BSEE for offshore (30 CFR 250), Seveso III Directive 2012/18/EU (EU), COMAH 2015 (UK), STPS NOM-028 (MX mechanical integrity) + NOM-035 (psychosocial), MHFR (AU). Each demands human-factors management in the control environment. BIO provides mappable evidence — it does not replace the PSM Coordinator, the Competent Authority nor the formal Safety Report under Seveso.",

    fitKicker: "HOW IT FITS · OPERATIONALLY",
    fitH: "It instruments the 3 minutes that already exist pre-shift, at tour handoff or at turnaround lineup.",
    fitBody:
      "We don't ask the operator or maintenance tech for extra time. We ask for 3 structured minutes pre-shift, at tour handoff (panel-to-panel) or at pre-turnaround lineup. Impact is measured in HRV and Tier 3/4 leading-indicator trend, not engagement score.",
    fitL1: "Clinically-validated 3-min resonant-breathing protocols (5.5–6 bpm) · compatible with pre-shift stretch, tour handoff or turnaround lineup · measurable HRV effect from session 1.",
    fitL2: "Operating dashboard for HSE Director / PSM Coordinator · anonymized aggregates by unit / tour / discipline · segments with k ≥ 5 operators · no individual exposure and panel assignments never surfaced.",
    fitL3: "Individual reports stay private to the operator · matches regulated-EAP confidentiality expectation · avoids retaliation claims under OSHA 11(c) Whistleblower Protection and near-miss reporting programs.",
    fitL4: "SSO SAML 2.0 + SCIM + audit trail · compatible with enterprise IdPs and plant access control · automated provisioning and PSM-ready logging.",
    fitL5: "API RP 755 evidence pack · FRMS + fatigue risk register + training-compliance artifacts · downloadable under NDA for PSM auditor or OSHA inspector.",
    fitL6: "Under-NDA exports: SOC 2 Type I, DPA, ISO 45001 mapping, ISO 27001 gap analysis, STPS NOM-035 annual report (if Mexico applies).",

    peerKicker: "COMPARISON · WHAT'S ALREADY INSTALLED",
    peerH: "Against what your plant already has.",
    peerBody:
      "Reference adoption and scope at mainstream refining, midstream, upstream + offshore, and tier-1 petrochem. Your mix varies, but the pattern is stable.",
    peerColCat: "Category",
    peerColCost: "USD / operator / yr",
    peerColScope: "Scope",
    peerRowEapCat: "Traditional industrial EAP (contract EAP)",
    peerRowEapCost: "$170",
    peerRowEapScope: "Reactive counseling · 2–6% field-operator adoption · no physiological instrumentation · not referenceable as API RP 755 FRMS.",
    peerRowWellnessCat: "Corporate wellness (challenges, content)",
    peerRowWellnessCost: "$430",
    peerRowWellnessScope: "Gamification · no measurable operational outcome · 90-day drop-off · not referenceable to a PSM auditor nor in a Seveso Safety Report.",
    peerRowWearableCat: "Industrial wearables (Kenzen heat-stress, Guardhat)",
    peerRowWearableCost: "$320",
    peerRowWearableScope: "Heat-stress / fall / proximity detection · does not measure circadian HRV · reacts to thermal/mechanical stress · does not apply to panel room or decision fatigue.",
    peerRowBioCat: "BIO-IGNICIÓN · Growth",
    peerRowBioCost: "$228",
    peerRowBioScope: "Process-grade HRV · API RP 755-aligned · OSHA PSM-ready · STPS NOM-035 · HSE/PSM dashboard · SSO + SCIM.",
    peerCite: "Sources: SHRM 2024, KFF Employer Health Benefits 2024, API RP 755 fact sheet, CSB Texas City final report. BIO pricing current (2026-Q2).",

    sourcesKicker: "SOURCES · ENERGY & REGULATORY LITERATURE",
    sourcesH: "Where the figures come from.",
    sourcesBody:
      "All figures come from peer-reviewed literature, official CSB/OSHA/API reports and public regulation. Cited under academic fair-use.",
    sourceCsb:
      "U.S. Chemical Safety and Hazard Investigation Board (CSB) · Investigation Report on BP Texas City refinery explosion 2005 · 15 fatalities, 180 injuries · CSB identified operators working 12-hr shifts for up to 29 consecutive days · direct recommendation that originated API RP 755.",
    sourceApi:
      "API · RP 755 · 2nd edition May 2019 · Fatigue Risk Management Systems for Personnel in the Refining and Petrochemical Industries · applicable to facilities covered by OSHA PSM (29 CFR 1910.119). Reference framework for FRMS in downstream.",
    sourceOshaPsm:
      "OSHA · 29 CFR 1910.119 Process Safety Management of Highly Hazardous Chemicals · regulatory framework for facilities with PSM-listed chemicals · the control environment includes human factors.",
    sourceSeveso:
      "Seveso III Directive · Directive 2012/18/EU · control of major-accident hazards involving dangerous substances · requires formal Safety Report and Safety Management System with competent-authority oversight.",
    sourceComah:
      "COMAH 2015 · Control of Major Accident Hazards Regulations · UK implementation of Seveso III · enforced by Competent Authority (HSE + Environment Agency).",
    sourceNiosh:
      "NIOSH · Plain Language About Shiftwork & training material · meta-analyses + systematic reviews document ~30% increase in injury and error risk on rotating night shift vs. day shift.",
    sourceStps:
      "STPS Mexico · NOM-028-STPS (safety in chemical processes) + NOM-035-STPS-2018 (psychosocial factors) · mandatory for risk operations; penalties up to 500 UMAs under NOM-035.",
    sourceKoenig:
      "Koenig et al. 2016 · HRV biofeedback meta-analysis in clinical populations · d = 0.83 anxiety reduction (large effect).",
    sourceGoessl:
      "Goessl et al. · Psychological Medicine 2017 · meta-analysis d = 0.50 anxiety reduction via HRV biofeedback (n=482). Our 0.35 cap ≈ 70% of observed effect.",

    entKicker: "COMPLIANCE & PROCUREMENT · ENERGY",
    entH: "Everything your HSE, legal and procurement team will ask — already answered.",
    entBody:
      "Documented posture for each control. Formal artifacts (SOC 2 Type I, DPA, ISO 27001 gap, API RP 755 FRMS mapping, OSHA PSM alignment, STPS NOM-035 report) delivered under NDA via Trust Center.",
    entSoc2: "SOC 2 Type I · active posture",
    entApi: "API RP 755 · FRMS-aligned",
    entOshaPsm: "OSHA PSM 1910.119 · ready",
    entNom: "NOM-035 STPS · annual report",
    entIso45001: "ISO 45001 · documented mapping",
    entDpa: "DPA · GDPR Recital 26",
    entSso: "SSO · SAML 2.0 + SCIM",
    entSla: "99.9% SLA · process-grade",
    entFoot: "Individual data is segregated per operator. The HSE Director / PSM Coordinator sees only anonymized aggregates of ≥ 5 operators per segment (unit, tour, discipline). Panel assignments are never surfaced individually.",
    entJurisdictions: "Jurisdictional coverage · US: OSHA 29 CFR 1910.119 · BSEE 30 CFR 250 (offshore) · EU: Seveso III Directive 2012/18 · UK: COMAH 2015 · MX: STPS NOM-028 · NOM-035 · CA: TSSA · CNSC · AU: MHFR · IOGP as international reference.",

    disclaimerH: "Legal note · 30-sec read",
    disclaimer1:
      "Figures are estimates from peer-reviewed public literature, official CSB/OSHA/API reports and regulation — not guarantees. Actual results depend on implementation, plant size, downstream/upstream/petrochem mix, adherence rate and operational context.",
    disclaimer2:
      "BIO-IGNICIÓN is an HRV-based operational wellbeing tool · it is NOT a medical device, does NOT diagnose, does NOT treat medical conditions, and does NOT replace clinical evaluation nor the plant-medical fitness-for-duty assessment. Complementary to the operation's formal EAP only.",
    disclaimer3:
      "The term 'process-grade' refers to HRV measurement quality (ECG-validated in literature) and platform operational/auditable robustness. It does NOT imply regulatory clearance as a medical device (FDA / COFEPRIS / CE) nor ATEX / IECEx / Class I Div 1–2 certification for use in classified zones.",
    disclaimer4:
      "'API RP 755-aligned' means BIO-IGNICIÓN exports and logs are structured to be compatible with indicators of an FRMS under API RP 755 (2nd ed. 2019). It does NOT imply API endorsement, does NOT replace the operator's FRMS program owner, the PSM Coordinator, nor the external PSM/OSHA auditor.",
    disclaimer5:
      "'OSHA PSM 1910.119-ready' means BIO-IGNICIÓN reports are structurable as human-factors evidence within the PSM control environment. It does NOT imply PSM compliance and is NOT an attestation, and does NOT replace the Safety Report under Seveso III / COMAH nor the formal Process Hazard Analysis.",

    closingKicker: "NEXT STEP · ENERGY",
    closingHLead: "Book a demo with plant assumptions.",
    closingHBody: "A 45-min closing with your HSE Director, PSM Coordinator and legal.",
    closingBody:
      "We bring the assumptions to your real context: refining / petrochem / upstream / offshore / utilities mix, number of units, jurisdictions (OSHA, BSEE, Seveso, COMAH, STPS, MHFR), applicable regulation (PSM, RP 755, NOM-028, NOM-035). The Q2 2026 pilot cohort is limited to 5 process-grade energy operators.",
    closingPrimary: "Book demo · process-grade",
    closingSecondary: "Run ROI with your plant",
    closingTertiary: "Trust Center · due diligence",
    closingAvail: "Page reviewed",
    closingContact: "energy@bio-ignicion.app",
  },
};

export default async function ForEnergyPage() {
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
    <PublicShell activePath="/for-energy">
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
              <ul className="bi-roi-meta" aria-label="energy-meta">
                <li><span className="dot" aria-hidden /> {c.metaSoc}</li>
                <li><span className="dot" aria-hidden /> {c.metaApi}</li>
                <li><span className="dot" aria-hidden /> {c.metaPsm}</li>
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
              <span className="v">15</span>
              <span className="l">{c.statTexasCity}</span>
              <span className="s">{c.statTexasCitySub}</span>
            </div>
            <div>
              <span className="v">29 días</span>
              <span className="l">{c.statShifts}</span>
              <span className="s">{c.statShiftsSub}</span>
            </div>
            <div>
              <span className="v">RP 755</span>
              <span className="l">{c.statApi}</span>
              <span className="s">{c.statApiSub}</span>
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
              <div className="src">{c.benchmarkCsbSrc}</div>
              <span className="v">{c.benchmarkCsbV}</span>
              <span className="l">{c.benchmarkCsbL}</span>
            </div>
            <div className="bi-roi-benchmark-cell">
              <div className="src">{c.benchmarkApiSrc}</div>
              <span className="v">{c.benchmarkApiV}</span>
              <span className="l">{c.benchmarkApiL}</span>
            </div>
            <div className="bi-roi-benchmark-cell">
              <div className="src">{c.benchmarkOshaSrc}</div>
              <span className="v">{c.benchmarkOshaV}</span>
              <span className="l">{c.benchmarkOshaL}</span>
            </div>
            <div className="bi-roi-benchmark-cell">
              <div className="src">{c.benchmarkNioshSrc}</div>
              <span className="v">{c.benchmarkNioshV}</span>
              <span className="l">{c.benchmarkNioshL}</span>
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
            <li><span className="bi-roi-source-tag">CSB</span><span>{c.sourceCsb}</span></li>
            <li><span className="bi-roi-source-tag">API · RP 755</span><span>{c.sourceApi}</span></li>
            <li><span className="bi-roi-source-tag">OSHA · PSM</span><span>{c.sourceOshaPsm}</span></li>
            <li><span className="bi-roi-source-tag">SEVESO III</span><span>{c.sourceSeveso}</span></li>
            <li><span className="bi-roi-source-tag">COMAH 2015</span><span>{c.sourceComah}</span></li>
            <li><span className="bi-roi-source-tag">NIOSH</span><span>{c.sourceNiosh}</span></li>
            <li><span className="bi-roi-source-tag">STPS</span><span>{c.sourceStps}</span></li>
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
            <li className="bi-roi-ent-chip">{c.entApi}</li>
            <li className="bi-roi-ent-chip">{c.entOshaPsm}</li>
            <li className="bi-roi-ent-chip">{c.entNom}</li>
            <li className="bi-roi-ent-chip">{c.entIso45001}</li>
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
          </ol>
        </details>
      </Container>

      <PulseDivider intensity="dim" />

      {/* ═══ Closing CTA (shared pattern) ═══ */}
      <section aria-labelledby="en-closing" className="bi-demo-closing-section">
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

              <h2 id="en-closing" className="bi-demo-closing-h">
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
