/* ═══════════════════════════════════════════════════════════════
   /for-aviation — Vertical B2B landing for airlines, business
   aviation, cargo carriers and ATC authorities. Thesis: crew
   fatigue is a flight-safety and FRMS-compliance problem
   (FAA Part 117 / EASA FTL / ICAO Annex 6 Appendix 7), not
   scheduling culture.
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
  title: "Para Aviación · Fatiga de tripulación es seguridad de vuelo",
  description:
    "Fatiga de cockpit crew, cabin crew y ATC tiene raíz fisiológica común. BIO-IGNICIÓN aporta evidencia compatible con FAA Part 117, EASA FTL e ICAO FRMS · 3 min pre-vuelo · SSO + SCIM.",
  alternates: { canonical: "/for-aviation" },
  openGraph: {
    title: "BIO-IGNICIÓN · Aviation · Fatiga de tripulación = flight safety",
    description:
      "4–7% de accidentes civiles con fatiga del piloto (literatura peer-reviewed). FAA Part 117 vigente 2014 · ICAO FRMS Appendix 7 · EASA FTL Reg 83/2014. BIO: flight-grade, FRMS-ready.",
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
    eyebrow: "PARA AVIACIÓN · AIRLINES, BUSINESS AVIATION, CARGO & ATC",
    title: "Fatiga de tripulación no es cultura. Es seguridad de vuelo y compliance FRMS.",
    editorial:
      "El incident bajo fatiga, la decisión táctica deteriorada y el churn de first-officer type-rated viven en el mismo eslabón fisiológico. Se mide en HRV, no en duty-time log.",
    intro:
      "BIO-IGNICIÓN se instrumenta en los 3 minutos pre-vuelo, en turnaround o en briefing de ATC. FAA Part 117 y EASA FTL-aligned, ICAO FRMS-ready, panel operativo visible al VP Flight Ops / FRMS Manager — no al analista de RRHH.",
    metaSoc: "SOC 2 Type I · activo",
    metaPart117: "FAA Part 117 · FTL-aligned",
    metaFrms: "ICAO FRMS · Appendix 7-ready",
    metaShift: "3 min pre-vuelo",

    scarcityLabel: "Q2 2026 · PILOTO FLIGHT-GRADE · 5 OPERADORES AÉREOS",

    statAccidents: "Accidentes civiles atribuibles a fatiga del piloto",
    statAccidentsSub: "literatura peer-reviewed · rango conservador",
    statFatalities: "Fatalities · 16 años · accidentes air-carrier con fatiga",
    statFatalitiesSub: "NTSB · revisión de safety studies",
    statPart117: "Part 117 vigente · carriers Part 121 US",
    statPart117Sub: "FAA · efectivo enero 2014",
    statFrms: "FRMS añadido · ICAO Annex 6 Appendix 7",
    statFrmsSub: "ICAO · 2008 · SARPs globales",

    benchmarkKicker: "CONTEXTO · DATA PÚBLICA DE AVIACIÓN",
    benchmarkAccSrc: "LITERATURA",
    benchmarkAccV: "4–7%",
    benchmarkAccL: "Proporción estimada de accidentes e incidentes civiles atribuibles a fatiga del piloto · rango consistente en literatura peer-reviewed de safety y en revisiones operativas.",
    benchmarkNtsbSrc: "NTSB",
    benchmarkNtsbV: "~250",
    benchmarkNtsbL: "Fatalities asociadas a accidentes de air-carrier con fatiga como factor contribuyente · período de 16 años documentado en safety studies del NTSB.",
    benchmarkFaaSrc: "FAA",
    benchmarkFaaV: "Part 117",
    benchmarkFaaL: "Flight and Duty Limitations + rest requirements para flightcrew members · aplica a 14 CFR Part 121 · efectivo enero 2014 · incluye requisito de FRMS.",
    benchmarkIcaoSrc: "ICAO",
    benchmarkIcaoV: "Annex 6",
    benchmarkIcaoL: "FRMS incorporado en Appendix 7 de Annex 6 (2008) · FRMS definido como 'data-driven means of continuously monitoring and maintaining fatigue related safety risks' · SARPs globales.",

    painKicker: "TESIS · POR QUÉ IMPORTA EN TU OPERACIÓN",
    painH: "La fatiga de tripulación es un leading indicator de incident y de FRMS finding.",
    painBody:
      "ASAP reports, FOQA flags y sim check outcomes son lagging — reportan lo que ya pasó. HRV y la fatiga autonómica del cockpit crew, cabin crew y ATC se detectan horas antes del mis-read de checklist o del altitude bust. BIO interviene en el eslabón temprano porque ahí se corrige el resto.",
    painP1Title: "1. Fisiología antes del incident report",
    painP1Body:
      "El lapso de atención, el decision fatigue y el error de automatización son medibles en HRV y cortisol circadiano antes de manifestarse en un altitude bust, un go-around mal ejecutado o un read-back incorrecto. NASA, NTSB y literatura peer-reviewed de aviation human factors (Caldwell, Rosekind) documentan deterioro cognitivo bajo deuda de sueño equivalente a BAC legalmente sancionable.",
    painP2Title: "2. FRMS es data-driven · duty-time log es prescriptivo",
    painP2Body:
      "FAA Part 117 y EASA FTL auditan horas de servicio — cuántas voló, cuántas descansó. Necesario pero no suficiente: el piloto pudo tener la ventana de rest sin usarla efectivamente (commuting, jet-lag, sueño fragmentado). ICAO FRMS (Annex 6 Appendix 7) exige monitoreo data-driven basado en 'principios científicos'. HRV cierra ese gap. BIO aporta evidencia estructurada para el FRMS del operador — no sustituye al FRMS Manager, al FOQA program, ni al auditor regulatorio.",
    painP3Title: "3. Rotación = fuga de type-rating + route experience",
    painP3Body:
      "Cada FO o Captain type-rated que se va se lleva 6–24 meses de recurrency, familiaridad con fleet y endorsements acumulados (CAT II/III, high-altitude, EASA-B1/FAA ATP). El costo de reemplazo en aviation crew cae en el rango de 1.5–3× salario anual (recruiting + type rating + line-check + ramp). Reducir rotación 10% en una flota de 200 cockpit crew paga múltiples ciclos de BIO.",
    painP4Title: "4. FAA + EASA + ICAO + CAA nacional = multi-jurisdicción",
    painP4Body:
      "FAA Part 117 (US Part 121), EASA FTL (Reg. (EU) No 83/2014), CAA CAP 371 (UK), DGAC NOM-061 (MX), Transport Canada CARs, CASA CASR 48 (AU), y sobre todos ICAO SARPs como referencia global. BIO aporta evidencia mappable a cada marco — no sustituye al FRMS Manager, al accountable executive ni al regulador de la bandera de operación.",

    fitKicker: "CÓMO ENCAJA · OPERATIVAMENTE",
    fitH: "Se instrumenta en los 3 minutos que ya existen pre-vuelo, en turnaround o en ATC briefing.",
    fitBody:
      "No pedimos tiempo extra al crew ni al controlador. Pedimos 3 minutos estructurados pre-vuelo, en turnaround o en el briefing de shift ATC. El impacto se mide en HRV y en FRMS indicator trend, no en engagement.",
    fitL1: "Protocolos respiración resonante 3 min (5.5–6 bpm) validados clínicamente · compatibles con pre-flight briefing, cabin turnaround o ATC shift-change · efecto medible en HRV en sesión 1.",
    fitL2: "Dashboard operativo para FRMS Manager / VP Flight Ops · agregados anónimos por fleet / base / crew rotation · segmentos con k ≥ 5 personas · sin exponer datos individuales ni emparejamientos de cockpit.",
    fitL3: "Reportes individuales permanecen privados para el crew member · cumple expectativa de confidencialidad compatible con ASAP / non-punitive reporting · evita retaliation claim bajo Whistleblower Protection Program (AIR21) y FRMS just-culture.",
    fitL4: "SSO SAML 2.0 + SCIM + audit trail · compatible con IdP enterprise y con airline crew-management systems (Jeppesen, Sabre) · provisioning automático y logging FRMS-ready.",
    fitL5: "FRMS evidence pack · artifacts del programa compatibles con ICAO Annex 6 Appendix 7 · descargables bajo NDA para FAA Part 117 inspector o EASA FTL auditor.",
    fitL6: "Exports bajo NDA: SOC 2 Type I, DPA, ISO 27001 gap analysis, FRMS indicator mapping, NOM-035 STPS reporte anual (si aplica México).",

    peerKicker: "COMPARATIVO · QUÉ HAY HOY EN TU OPERACIÓN",
    peerH: "Contra lo que ya tienes instalado.",
    peerBody:
      "Referencias de adopción y alcance típico en airlines mainline / regional, business aviation tier-1, cargo carriers y ATC authorities. Tu mix varía, pero el patrón es estable.",
    peerColCat: "Categoría",
    peerColCost: "USD / crew / año",
    peerColScope: "Alcance",
    peerRowEapCat: "EAP tradicional aviation (CISM, peer-support)",
    peerRowEapCost: "$200",
    peerRowEapScope: "Peer-support reactivo · adopción 3–8% en crew · sin instrumentación fisiológica · no referenciable para FRMS indicator.",
    peerRowWellnessCat: "Wellness corporativo (retos, contenido)",
    peerRowWellnessCost: "$450",
    peerRowWellnessScope: "Gamificación · sin outcome operativo medible · abandono a 90 días · no referenciable ante FAA inspector ni EASA auditor.",
    peerRowWearableCat: "Fatigue-tracking wearables (Garmin, Astroskin, WHOOP)",
    peerRowWearableCost: "$380",
    peerRowWearableScope: "Monitoreo individual continuo · sin integración con FRMS manager ni con SMS · datos dispersos, sin workflow regulatorio.",
    peerRowBioCat: "BIO-IGNICIÓN · Growth",
    peerRowBioCost: "$228",
    peerRowBioScope: "HRV grado flight · FAA Part 117 / EASA FTL-aligned · ICAO FRMS-ready · panel FRMS Manager · SSO + SCIM.",
    peerCite: "Fuentes: SHRM 2024, KFF Employer Health Benefits 2024, ICAO FRMS Operator Implementation Guide, IATA Fatigue Management Guide. Precio BIO vigente (2026-Q2).",

    sourcesKicker: "FUENTES · LITERATURA DE AVIACIÓN & REGULATORIA",
    sourcesH: "De dónde vienen las cifras.",
    sourcesBody:
      "Todas las cifras provienen de literatura revisada por pares, NTSB / NASA safety studies y regulación pública. Citadas bajo fair-use académico.",
    sourceNtsb:
      "NTSB · safety studies + Most Wanted List ('Reduce Fatigue-Related Accidents') · documentan fatiga como factor contribuyente en ~250 fatalities de accidentes air-carrier durante un período de 16 años referenciado en la literatura.",
    sourceLiterature:
      "Caldwell, Rosekind et al. + revisiones peer-reviewed en International Journal of Aviation · rango 4–7% de accidentes e incidentes civiles atribuibles a fatiga del piloto · rango conservador consistente entre estudios operativos.",
    sourceFaaPart117:
      "FAA · 14 CFR Part 117 · Flight and Duty Limitations and Rest Requirements: Flightcrew Members · efectivo enero 2014 · aplica a Part 121 certificate holders · incluye requisito de FRMS bajo AC 120-103A.",
    sourceEasaFtl:
      "EASA · Flight Time Limitations · Regulation (EU) No 83/2014 · estructura FTL + rest + commander's discretion + FRM provisions · aplicable a commercial air transport en EASA member states.",
    sourceIcaoFrms:
      "ICAO · Annex 6 Appendix 7 + Doc 9966 Manual for the Oversight of FRMS · FRMS añadido en 2008 · definido como 'data-driven means of continuously monitoring and maintaining fatigue related safety risks' · SARPs globales.",
    sourceIata:
      "IATA · Fatigue Management Guide for Airline Operators · documento operacional complementario · alineado con ICAO Doc 9966 · referencia de facto para operators implementando FRMS.",
    sourceKoenig:
      "Koenig et al. 2016 · meta-análisis HRV biofeedback en población clínica · d = 0.83 reducción ansiedad (efecto grande).",
    sourceGoessl:
      "Goessl et al. · Psychological Medicine 2017 · meta-análisis d = 0.50 reducción ansiedad con HRV biofeedback (n=482). Nuestro cap 0.35 ≈ 70% del observado.",

    entKicker: "COMPLIANCE & PROCUREMENT · AVIATION",
    entH: "Lo que tu equipo safety, legal y procurement va a pedir — ya está respondido.",
    entBody:
      "Postura documentada para cada control. Artefactos formales (SOC 2 Type I, DPA, ISO 27001 gap, FRMS indicator mapping, FAA Part 117 / EASA FTL alignment matrix) entregados bajo NDA vía Trust Center.",
    entSoc2: "SOC 2 Type I · postura activa",
    entFaa: "FAA Part 117 · FTL-aligned",
    entEasa: "EASA FTL · Reg 83/2014",
    entIcao: "ICAO FRMS · Appendix 7-ready",
    entIso: "ISO 27001 · gap analysis",
    entDpa: "DPA · GDPR Recital 26",
    entSso: "SSO · SAML 2.0 + SCIM",
    entSla: "99.9% SLA · flight-grade",
    entFoot: "Datos individuales segregados por crew member. FRMS Manager / VP Flight Ops solo ve agregados anonimizados ≥ 5 personas por segmento (fleet, base, crew rotation). Emparejamientos de cockpit nunca se exponen individualmente.",
    entJurisdictions: "Cobertura jurisdiccional · US: FAA 14 CFR Part 117 · NTSB · EU: EASA FTL Reg 83/2014 · UK: CAA CAP 371 · MX: DGAC NOM-061 · CA: Transport Canada CARs · AU: CASA CASR Part 48 · ICAO SARPs como referencia global.",

    disclaimerH: "Nota legal · lectura en 30 s",
    disclaimer1:
      "Las cifras son estimaciones a partir de literatura pública revisada por pares, NTSB / NASA safety studies y regulación, no garantías. Los resultados reales dependen de implementación, tamaño de flota, mix mainline/regional/cargo/ATC, tasa de adherencia y contexto operativo.",
    disclaimer2:
      "BIO-IGNICIÓN es una herramienta de bienestar operativo basada en HRV · NO es dispositivo médico, NO diagnostica, NO trata condiciones médicas, NO sustituye al Aviation Medical Examiner (AME/AeroMedical), al Class-1 medical certificate ni al fitness-for-duty assessment. Complementario al EAP / CISM formal de la operación.",
    disclaimer3:
      "El término 'grado flight' se refiere a la calidad de medición HRV (validación frente a ECG en literatura) y a la robustez operativa y auditable de la plataforma. NO implica autorización regulatoria como dispositivo médico (FDA / COFEPRIS / CE) ni como airborne equipment (DO-178C / DO-254).",
    disclaimer4:
      "'FAA Part 117 / EASA FTL-aligned' significa que los exportes y logs de BIO-IGNICIÓN están estructurados de forma compatible con indicadores de un programa FRMS bajo 14 CFR Part 117 y Regulation (EU) No 83/2014. NO implica certificación FAA, NO es un FAA/EASA-approved FRMS por sí solo, y NO sustituye al FRMS Manager, al Safety Manager ni al accountable executive.",
    disclaimer5:
      "'ICAO FRMS Appendix 7-ready' significa que el diseño de BIO-IGNICIÓN es compatible con las fases del FRMS bajo ICAO Annex 6 Appendix 7 y Doc 9966. NO implica aprobación ICAO per se (ICAO no certifica operadores), sino compatibilidad con la implementación que cada State of the Operator debe aprobar formalmente.",

    closingKicker: "PRÓXIMO PASO · AVIATION",
    closingHLead: "Agenda con supuestos de flota.",
    closingHBody: "Un cierre de 45 min con tu FRMS Manager, VP Flight Ops y legal.",
    closingBody:
      "Llevamos los supuestos a tu contexto real: mix mainline / regional / cargo / ATC, bases, jurisdicciones (FAA, EASA, CAA, DGAC, Transport Canada, CASA), regulatorio aplicable (Part 117, EASA FTL, ICAO FRMS, NOM-061). El cohorte piloto Q2 2026 está limitado a 5 operadores aéreos flight-grade.",
    closingPrimary: "Agenda demo · flight-grade",
    closingSecondary: "Ver ROI con tu flota",
    closingTertiary: "Trust Center · due diligence",
    closingAvail: "Página revisada",
    closingContact: "aviation@bio-ignicion.app",
  },
  en: {
    eyebrow: "FOR AVIATION · AIRLINES, BUSINESS AVIATION, CARGO & ATC",
    title: "Crew fatigue isn't culture. It's flight safety and FRMS compliance.",
    editorial:
      "The fatigued incident, the degraded tactical decision and type-rated first-officer churn live on the same physiological link. It's measured in HRV, not in a duty-time log.",
    intro:
      "BIO-IGNICIÓN instruments the 3 minutes that already exist pre-flight, at turnaround or at ATC briefing. FAA Part 117 and EASA FTL-aligned, ICAO FRMS-ready, operating dashboard visible to VP Flight Ops / FRMS Manager — not to the HR analyst.",
    metaSoc: "SOC 2 Type I · active",
    metaPart117: "FAA Part 117 · FTL-aligned",
    metaFrms: "ICAO FRMS · Appendix 7-ready",
    metaShift: "3 min pre-flight",

    scarcityLabel: "Q2 2026 · FLIGHT-GRADE PILOT · 5 AIR OPERATORS",

    statAccidents: "Civil aviation accidents attributable to pilot fatigue",
    statAccidentsSub: "peer-reviewed literature · conservative range",
    statFatalities: "Fatalities · 16-year period · fatigue-linked air-carrier accidents",
    statFatalitiesSub: "NTSB · safety-study review",
    statPart117: "Part 117 in force · US Part 121 carriers",
    statPart117Sub: "FAA · effective January 2014",
    statFrms: "FRMS added · ICAO Annex 6 Appendix 7",
    statFrmsSub: "ICAO · 2008 · global SARPs",

    benchmarkKicker: "CONTEXT · PUBLIC AVIATION DATA",
    benchmarkAccSrc: "LITERATURE",
    benchmarkAccV: "4–7%",
    benchmarkAccL: "Estimated share of civil aviation accidents and incidents attributable to pilot fatigue · consistent range across peer-reviewed safety literature and operational reviews.",
    benchmarkNtsbSrc: "NTSB",
    benchmarkNtsbV: "~250",
    benchmarkNtsbL: "Fatalities associated with air-carrier accidents with fatigue as a contributing factor · 16-year period documented in NTSB safety studies.",
    benchmarkFaaSrc: "FAA",
    benchmarkFaaV: "Part 117",
    benchmarkFaaL: "Flight and Duty Limitations + rest requirements for flightcrew members · applies to 14 CFR Part 121 · effective January 2014 · includes FRMS requirement.",
    benchmarkIcaoSrc: "ICAO",
    benchmarkIcaoV: "Annex 6",
    benchmarkIcaoL: "FRMS incorporated in Appendix 7 of Annex 6 (2008) · FRMS defined as 'data-driven means of continuously monitoring and maintaining fatigue related safety risks' · global SARPs.",

    painKicker: "THESIS · WHY IT MATTERS AT YOUR OPERATION",
    painH: "Crew fatigue is a leading indicator for incident and for FRMS findings.",
    painBody:
      "ASAP reports, FOQA flags and sim-check outcomes are lagging — they report what already happened. HRV and autonomic fatigue in cockpit crew, cabin crew and ATC are detectable hours before a checklist mis-read or an altitude bust. BIO intervenes at the early link because that's where the rest is fixed.",
    painP1Title: "1. Physiology before the incident report",
    painP1Body:
      "Attention lapses, decision fatigue and automation-induced error are measurable in HRV and circadian cortisol before they materialize in an altitude bust, a mis-executed go-around or an incorrect read-back. NASA, NTSB and peer-reviewed aviation human-factors literature (Caldwell, Rosekind) document cognitive decline under sleep debt equivalent to legally actionable BAC.",
    painP2Title: "2. FRMS is data-driven · duty-time log is prescriptive",
    painP2Body:
      "FAA Part 117 and EASA FTL audit hours of service — how long they flew, how long they rested. Necessary but not sufficient: the pilot may have had the rest window without using it effectively (commuting, jet lag, fragmented sleep). ICAO FRMS (Annex 6 Appendix 7) requires data-driven monitoring based on 'scientific principles'. HRV closes that gap. BIO provides structured evidence for the operator's FRMS — it does not replace the FRMS Manager, the FOQA program or the regulatory auditor.",
    painP3Title: "3. Turnover = loss of type-rating + route experience",
    painP3Body:
      "Every type-rated FO or Captain who leaves takes 6–24 months of recurrency, fleet familiarity and accumulated endorsements with them (CAT II/III, high-altitude, EASA-B1/FAA ATP). Aviation-crew replacement cost lands in the 1.5–3× annual-salary range (recruiting + type rating + line check + ramp). A 10% turnover reduction in a 200-person cockpit-crew fleet pays for multiple BIO cycles.",
    painP4Title: "4. FAA + EASA + ICAO + national CAA = multi-jurisdiction",
    painP4Body:
      "FAA Part 117 (US Part 121), EASA FTL (Reg. (EU) No 83/2014), CAA CAP 371 (UK), DGAC NOM-061 (MX), Transport Canada CARs, CASA CASR Part 48 (AU), and ICAO SARPs as the global reference above them all. BIO provides evidence mappable to each framework — it does not replace the FRMS Manager, the accountable executive or the regulator of the flag of operation.",

    fitKicker: "HOW IT FITS · OPERATIONALLY",
    fitH: "It instruments the 3 minutes that already exist pre-flight, at turnaround or at ATC briefing.",
    fitBody:
      "We don't ask crew or controllers for extra time. We ask for 3 structured minutes pre-flight, at turnaround or at the ATC shift briefing. Impact is measured in HRV and FRMS indicator trend, not engagement.",
    fitL1: "Clinically-validated 3-min resonant-breathing protocols (5.5–6 bpm) · compatible with pre-flight briefing, cabin turnaround or ATC shift-change · measurable HRV effect from session 1.",
    fitL2: "Operating dashboard for FRMS Manager / VP Flight Ops · anonymized aggregates by fleet / base / crew rotation · segments with k ≥ 5 people · no individual exposure and cockpit pairings never surfaced.",
    fitL3: "Individual reports stay private to the crew member · matches ASAP / non-punitive reporting confidentiality expectation · avoids retaliation claims under Whistleblower Protection Program (AIR21) and FRMS just-culture.",
    fitL4: "SSO SAML 2.0 + SCIM + audit trail · compatible with enterprise IdPs and airline crew-management systems (Jeppesen, Sabre) · automated provisioning and FRMS-ready logging.",
    fitL5: "FRMS evidence pack · program artifacts compatible with ICAO Annex 6 Appendix 7 · downloadable under NDA for FAA Part 117 inspector or EASA FTL auditor.",
    fitL6: "Under-NDA exports: SOC 2 Type I, DPA, ISO 27001 gap analysis, FRMS indicator mapping, STPS NOM-035 annual report (if Mexico applies).",

    peerKicker: "COMPARISON · WHAT'S ALREADY INSTALLED",
    peerH: "Against what your operation already has.",
    peerBody:
      "Reference adoption and scope at mainline/regional airlines, tier-1 business aviation, cargo carriers and ATC authorities. Your mix varies, but the pattern is stable.",
    peerColCat: "Category",
    peerColCost: "USD / crew / yr",
    peerColScope: "Scope",
    peerRowEapCat: "Traditional aviation EAP (CISM, peer-support)",
    peerRowEapCost: "$200",
    peerRowEapScope: "Reactive peer-support · 3–8% crew adoption · no physiological instrumentation · not referenceable as an FRMS indicator.",
    peerRowWellnessCat: "Corporate wellness (challenges, content)",
    peerRowWellnessCost: "$450",
    peerRowWellnessScope: "Gamification · no measurable operational outcome · 90-day drop-off · not referenceable to an FAA inspector or EASA auditor.",
    peerRowWearableCat: "Fatigue-tracking wearables (Garmin, Astroskin, WHOOP)",
    peerRowWearableCost: "$380",
    peerRowWearableScope: "Continuous individual monitoring · no integration with FRMS Manager or SMS · scattered data, no regulatory workflow.",
    peerRowBioCat: "BIO-IGNICIÓN · Growth",
    peerRowBioCost: "$228",
    peerRowBioScope: "Flight-grade HRV · FAA Part 117 / EASA FTL-aligned · ICAO FRMS-ready · FRMS Manager dashboard · SSO + SCIM.",
    peerCite: "Sources: SHRM 2024, KFF Employer Health Benefits 2024, ICAO FRMS Operator Implementation Guide, IATA Fatigue Management Guide. BIO pricing current (2026-Q2).",

    sourcesKicker: "SOURCES · AVIATION & REGULATORY LITERATURE",
    sourcesH: "Where the figures come from.",
    sourcesBody:
      "All figures come from peer-reviewed literature, NTSB / NASA safety studies and public regulation. Cited under academic fair-use.",
    sourceNtsb:
      "NTSB · safety studies + Most Wanted List ('Reduce Fatigue-Related Accidents') · document fatigue as a contributing factor in ~250 fatalities across air-carrier accidents over a 16-year period referenced in the literature.",
    sourceLiterature:
      "Caldwell, Rosekind et al. + peer-reviewed reviews in the International Journal of Aviation · 4–7% of civil aviation accidents and incidents attributable to pilot fatigue · conservative range consistent across operational studies.",
    sourceFaaPart117:
      "FAA · 14 CFR Part 117 · Flight and Duty Limitations and Rest Requirements: Flightcrew Members · effective January 2014 · applies to Part 121 certificate holders · includes FRMS requirement under AC 120-103A.",
    sourceEasaFtl:
      "EASA · Flight Time Limitations · Regulation (EU) No 83/2014 · structures FTL + rest + commander's discretion + FRM provisions · applicable to commercial air transport in EASA member states.",
    sourceIcaoFrms:
      "ICAO · Annex 6 Appendix 7 + Doc 9966 Manual for the Oversight of FRMS · FRMS added in 2008 · defined as 'data-driven means of continuously monitoring and maintaining fatigue related safety risks' · global SARPs.",
    sourceIata:
      "IATA · Fatigue Management Guide for Airline Operators · complementary operational document · aligned with ICAO Doc 9966 · de-facto reference for operators implementing FRMS.",
    sourceKoenig:
      "Koenig et al. 2016 · HRV biofeedback meta-analysis in clinical populations · d = 0.83 anxiety reduction (large effect).",
    sourceGoessl:
      "Goessl et al. · Psychological Medicine 2017 · meta-analysis d = 0.50 anxiety reduction via HRV biofeedback (n=482). Our 0.35 cap ≈ 70% of observed effect.",

    entKicker: "COMPLIANCE & PROCUREMENT · AVIATION",
    entH: "Everything your safety, legal and procurement team will ask — already answered.",
    entBody:
      "Documented posture for each control. Formal artifacts (SOC 2 Type I, DPA, ISO 27001 gap, FRMS indicator mapping, FAA Part 117 / EASA FTL alignment matrix) delivered under NDA via Trust Center.",
    entSoc2: "SOC 2 Type I · active posture",
    entFaa: "FAA Part 117 · FTL-aligned",
    entEasa: "EASA FTL · Reg 83/2014",
    entIcao: "ICAO FRMS · Appendix 7-ready",
    entIso: "ISO 27001 · gap analysis",
    entDpa: "DPA · GDPR Recital 26",
    entSso: "SSO · SAML 2.0 + SCIM",
    entSla: "99.9% SLA · flight-grade",
    entFoot: "Individual data is segregated per crew member. The FRMS Manager / VP Flight Ops sees only anonymized aggregates of ≥ 5 people per segment (fleet, base, crew rotation). Cockpit pairings are never surfaced individually.",
    entJurisdictions: "Jurisdictional coverage · US: FAA 14 CFR Part 117 · NTSB · EU: EASA FTL Reg 83/2014 · UK: CAA CAP 371 · MX: DGAC NOM-061 · CA: Transport Canada CARs · AU: CASA CASR Part 48 · ICAO SARPs as the global reference.",

    disclaimerH: "Legal note · 30-sec read",
    disclaimer1:
      "Figures are estimates from peer-reviewed public literature, NTSB / NASA safety studies and regulation — not guarantees. Actual results depend on implementation, fleet size, mainline/regional/cargo/ATC mix, adherence rate and operational context.",
    disclaimer2:
      "BIO-IGNICIÓN is an HRV-based operational wellbeing tool · it is NOT a medical device, does NOT diagnose, does NOT treat medical conditions, and does NOT replace the Aviation Medical Examiner (AME/AeroMedical), the Class-1 medical certificate or the fitness-for-duty assessment. Complementary to the operation's formal EAP / CISM only.",
    disclaimer3:
      "The term 'flight-grade' refers to HRV measurement quality (ECG-validated in literature) and platform operational/auditable robustness. It does NOT imply regulatory clearance as a medical device (FDA / COFEPRIS / CE) nor as airborne equipment (DO-178C / DO-254).",
    disclaimer4:
      "'FAA Part 117 / EASA FTL-aligned' means BIO-IGNICIÓN exports and logs are structured to be compatible with indicators of an FRMS program under 14 CFR Part 117 and Regulation (EU) No 83/2014. It does NOT imply FAA certification, is NOT an FAA/EASA-approved FRMS on its own, and does NOT replace the FRMS Manager, the Safety Manager nor the accountable executive.",
    disclaimer5:
      "'ICAO FRMS Appendix 7-ready' means BIO-IGNICIÓN's design is compatible with the FRMS phases under ICAO Annex 6 Appendix 7 and Doc 9966. It does NOT imply ICAO approval per se (ICAO does not certify operators), rather compatibility with the implementation each State of the Operator must formally approve.",

    closingKicker: "NEXT STEP · AVIATION",
    closingHLead: "Book a demo with fleet assumptions.",
    closingHBody: "A 45-min closing with your FRMS Manager, VP Flight Ops and legal.",
    closingBody:
      "We bring the assumptions to your real context: mainline / regional / cargo / ATC mix, bases, jurisdictions (FAA, EASA, CAA, DGAC, Transport Canada, CASA), applicable regulation (Part 117, EASA FTL, ICAO FRMS, NOM-061). The Q2 2026 pilot cohort is limited to 5 flight-grade air operators.",
    closingPrimary: "Book demo · flight-grade",
    closingSecondary: "Run ROI with your fleet",
    closingTertiary: "Trust Center · due diligence",
    closingAvail: "Page reviewed",
    closingContact: "aviation@bio-ignicion.app",
  },
};

export default async function ForAviationPage() {
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
    <PublicShell activePath="/for-aviation">
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
              <ul className="bi-roi-meta" aria-label="aviation-meta">
                <li><span className="dot" aria-hidden /> {c.metaSoc}</li>
                <li><span className="dot" aria-hidden /> {c.metaPart117}</li>
                <li><span className="dot" aria-hidden /> {c.metaFrms}</li>
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
              <span className="v">4–7%</span>
              <span className="l">{c.statAccidents}</span>
              <span className="s">{c.statAccidentsSub}</span>
            </div>
            <div>
              <span className="v">~250</span>
              <span className="l">{c.statFatalities}</span>
              <span className="s">{c.statFatalitiesSub}</span>
            </div>
            <div>
              <span className="v">2014</span>
              <span className="l">{c.statPart117}</span>
              <span className="s">{c.statPart117Sub}</span>
            </div>
            <div>
              <span className="v">2008</span>
              <span className="l">{c.statFrms}</span>
              <span className="s">{c.statFrmsSub}</span>
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
              <div className="src">{c.benchmarkAccSrc}</div>
              <span className="v">{c.benchmarkAccV}</span>
              <span className="l">{c.benchmarkAccL}</span>
            </div>
            <div className="bi-roi-benchmark-cell">
              <div className="src">{c.benchmarkNtsbSrc}</div>
              <span className="v">{c.benchmarkNtsbV}</span>
              <span className="l">{c.benchmarkNtsbL}</span>
            </div>
            <div className="bi-roi-benchmark-cell">
              <div className="src">{c.benchmarkFaaSrc}</div>
              <span className="v">{c.benchmarkFaaV}</span>
              <span className="l">{c.benchmarkFaaL}</span>
            </div>
            <div className="bi-roi-benchmark-cell">
              <div className="src">{c.benchmarkIcaoSrc}</div>
              <span className="v">{c.benchmarkIcaoV}</span>
              <span className="l">{c.benchmarkIcaoL}</span>
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
            <li><span className="bi-roi-source-tag">NTSB</span><span>{c.sourceNtsb}</span></li>
            <li><span className="bi-roi-source-tag">LITERATURE</span><span>{c.sourceLiterature}</span></li>
            <li><span className="bi-roi-source-tag">FAA · PART 117</span><span>{c.sourceFaaPart117}</span></li>
            <li><span className="bi-roi-source-tag">EASA · FTL</span><span>{c.sourceEasaFtl}</span></li>
            <li><span className="bi-roi-source-tag">ICAO · FRMS</span><span>{c.sourceIcaoFrms}</span></li>
            <li><span className="bi-roi-source-tag">IATA</span><span>{c.sourceIata}</span></li>
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
            <li className="bi-roi-ent-chip">{c.entFaa}</li>
            <li className="bi-roi-ent-chip">{c.entEasa}</li>
            <li className="bi-roi-ent-chip">{c.entIcao}</li>
            <li className="bi-roi-ent-chip">{c.entIso}</li>
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
      <section aria-labelledby="av-closing" className="bi-demo-closing-section">
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

              <h2 id="av-closing" className="bi-demo-closing-h">
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
