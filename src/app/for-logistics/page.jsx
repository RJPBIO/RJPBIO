/* ═══════════════════════════════════════════════════════════════
   /for-logistics — Vertical B2B landing for fleets, 3PL operators,
   warehouse networks and last-mile carriers. Thesis: operator
   fatigue is a road-safety and DOT-compliance problem (FMCSA HOS /
   OSHA 1910 / STPS NOM-035), not HR.
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
  title: "Para Logística · Fatiga del operador es seguridad vial y DOT",
  description:
    "Fatiga de driver y warehouse-picker tiene raíz fisiológica común. BIO-IGNICIÓN aporta evidencia compatible con FMCSA Part 395, OSHA recordkeeping y STPS NOM-035 · 3 min pre-ruta · SSO + SCIM.",
  alternates: { canonical: "/for-logistics" },
  openGraph: {
    title: "BIO-IGNICIÓN · Logistics · Fatiga del operador = seguridad vial",
    description:
      "78,800 déficit de drivers (ATA 2022). ~90% rotación en large-carriers. 13% de crashes CMV con fatiga (FMCSA LTCCS). BIO: FMCSA HOS-aligned, OSHA recordkeeping-ready, HRV grado fleet.",
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
    eyebrow: "PARA LOGÍSTICA · FLEET, 3PL, WAREHOUSE & LAST-MILE",
    title: "Fatiga del operador no es HR. Es seguridad vial y compliance DOT.",
    editorial:
      "El crash del driver, el pick error del warehouse y la rotación del CDL viven en el mismo eslabón fisiológico. Se mide en HRV, no en lagging-indicator de OSHA log.",
    intro:
      "BIO-IGNICIÓN se instrumenta en los 3 minutos pre-ruta, en dock-in o en el shift-change huddle. FMCSA HOS-aligned, OSHA recordkeeping-ready, STPS NOM-035 — panel operativo visible al VP Safety / Fleet Director, no a RRHH.",
    metaSoc: "SOC 2 Type I · activo",
    metaFmcsa: "FMCSA Part 395 · HOS-aligned",
    metaOsha: "OSHA 1910 · recordkeeping-ready",
    metaShift: "3 min pre-ruta",

    scarcityLabel: "Q2 2026 · PILOTO FLEET-GRADE · 5 OPERADORES LOGÍSTICOS",

    statShortage: "Déficit de drivers profesionales en EEUU",
    statShortageSub: "ATA Driver Shortage Update · 2022",
    statTurnover: "Rotación anual en large-carriers truckload",
    statTurnoverSub: "ATA rolling data · large-fleet truckload",
    statFatigueCrash: "CMV crashes con fatiga del conductor como factor",
    statFatigueCrashSub: "FMCSA Large Truck Crash Causation Study (LTCCS)",
    statShift: "Incremento riesgo de lesión · turno rotativo",
    statShiftSub: "NIOSH · literatura shift-work · meta-análisis",

    benchmarkKicker: "CONTEXTO · DATA PÚBLICA LOGÍSTICA",
    benchmarkAtaSrc: "ATA",
    benchmarkAtaV: "78,800",
    benchmarkAtaL: "Déficit nacional de conductores profesionales en EEUU · American Trucking Associations Driver Shortage Update 2022 · pico histórico reportado.",
    benchmarkTurnoverSrc: "ATA",
    benchmarkTurnoverV: "83–93%",
    benchmarkTurnoverL: "Rotación anual promedio en large-carriers truckload · American Trucking Associations rolling data · segmento over-the-road.",
    benchmarkFmcsaSrc: "FMCSA",
    benchmarkFmcsaV: "13%",
    benchmarkFmcsaL: "CMV crashes con fatiga como factor asociado al driver · FMCSA Large Truck Crash Causation Study · muestra n≈120k crashes 2001–2003.",
    benchmarkNioshSrc: "NIOSH",
    benchmarkNioshV: "+30%",
    benchmarkNioshL: "Incremento de riesgo de lesión y error bajo turno rotativo nocturno · NIOSH training & literature · meta-análisis shift-work.",

    painKicker: "TESIS · POR QUÉ IMPORTA EN TU OPERACIÓN",
    painH: "La fatiga del operador es un leading indicator de crash y de OSHA-recordable.",
    painBody:
      "DOT recordable, OSHA 300 log y el preventable-crash review son lagging — reportan lo que ya pasó. HRV y la fatiga autonómica del driver / picker / forklift operator se detectan horas antes del incidente. BIO interviene en el eslabón temprano porque ahí se corrige el resto.",
    painP1Title: "1. Fisiología antes del crash o del pick error",
    painP1Body:
      "La microsleep, la lentitud de reacción y la fatiga de decisión son medibles en HRV y en ritmo circadiano antes de manifestarse en DOT-recordable, en warehouse-incident, o en pick-accuracy drop. La literatura en shift-work safety (NIOSH, Williamson & Feyer, OMSJ) correlaciona deuda de sueño con deterioro cognitivo equivalente a alcoholemia legalmente sancionable.",
    painP2Title: "2. HOS log es lagging · HRV es leading",
    painP2Body:
      "FMCSA Part 395 audita horas de servicio — cuántas manejó, cuánto descansó. Es necesario pero no suficiente: dice si el driver tuvo la ventana, no si la usó efectivamente ni si entró a la ruta fatigado por razones fuera del log (commuting, sueño fragmentado, turno rotativo previo). HRV cierra ese gap. BIO aporta evidencia estructurada para programas de fatigue management bajo FMCSA Safety Management Cycle — no sustituye al ELD ni al HOS log.",
    painP3Title: "3. Rotación = fuga de drivers con CDL certificado",
    painP3Body:
      "Cada CDL-A que se va se lleva 12–24 meses de experiencia de ruta, familiaridad con equipo y endorsements acumulados (HazMat, tanker, doubles-triples). Reemplazo cuesta $8k–$15k en reclutamiento + training + DOT physicals + drug screening (ATA cost-per-hire). Reducir rotación 10% en una flota de 200 trucks paga varios ciclos de BIO.",
    painP4Title: "4. DOT + OSHA + STPS es multi-jurisdicción",
    painP4Body:
      "FMCSA Part 395 (HOS), 49 CFR 391 (medical qualification), OSHA 29 CFR 1910 (general industry, aplica a warehouse), STPS NOM-035 (factores psicosociales, obligatorio en operaciones MX), y en EU el Regulation (EC) 561/2006 (tiempos de conducción). BIO aporta evidencia mappable a cada marco — no sustituye al DOT compliance officer, al EHS ni al asesor STPS.",

    fitKicker: "CÓMO ENCAJA · OPERATIVAMENTE",
    fitH: "Se instrumenta en los 3 minutos que ya existen pre-ruta, en dock-in o en shift change.",
    fitBody:
      "No pedimos tiempo extra al driver ni al warehouse associate. Pedimos 3 minutos estructurados pre-ruta, en dock-in o en el shift-change huddle. El impacto se mide en HRV y en near-miss rate, no en engagement.",
    fitL1: "Protocolos respiración resonante 3 min (5.5–6 bpm) validados clínicamente · compatibles con pre-trip inspection o dock huddle · efecto medible en HRV en sesión 1.",
    fitL2: "Dashboard operativo para VP Safety / Fleet Director · agregados anónimos por terminal / ruta / shift · segmentos con k ≥ 5 operadores · sin exponer datos individuales ni geolocalización de unidad.",
    fitL3: "Reportes individuales permanecen privados para el driver/operador · cumple expectativa de confidencialidad equivalente a EAP regulado y evita discrimination claim bajo ADA / USMCA labor chapter.",
    fitL4: "SSO SAML 2.0 + SCIM + audit trail · compatible con IdP enterprise (Okta, Azure AD) y TMS corporativo · provisioning automático y logging DOT-ready.",
    fitL5: "FMCSA / DOT evidence pack · artifacts de fatigue-management program compatibles con FMCSA Safety Management Cycle y NHTSA Behavioral Safety Program review.",
    fitL6: "Exports bajo NDA: SOC 2 Type I, DPA, ISO 27001 gap analysis, OSHA 300/301 recordkeeping mapping, STPS NOM-035 reporte anual.",

    peerKicker: "COMPARATIVO · QUÉ HAY HOY EN TU FLOTA",
    peerH: "Contra lo que ya tienes instalado.",
    peerBody:
      "Referencias de adopción y alcance típico en flotas over-the-road >500 trucks, 3PL operators tier-1 y last-mile networks. Tu mix varía, pero el patrón es estable.",
    peerColCat: "Categoría",
    peerColCost: "USD / operador / año",
    peerColScope: "Alcance",
    peerRowEapCat: "EAP tradicional fleet",
    peerRowEapCost: "$160",
    peerRowEapScope: "Consejería reactiva · adopción 2–5% en drivers · sin instrumentación fisiológica · sin evidencia FMCSA/OSHA.",
    peerRowWellnessCat: "Wellness corporativo (retos, contenido)",
    peerRowWellnessCost: "$420",
    peerRowWellnessScope: "Gamificación · sin outcome operativo medible · abandono a 90 días · no referenciable ante auditor FMCSA.",
    peerRowWearableCat: "Wearables fleet (Smartdrive, Seeing Machines cabin)",
    peerRowWearableCost: "$340",
    peerRowWearableScope: "Detección in-cab post-hoc (eye-tracking, lane-drift) · reacciona al microsleep en curso · no previene · no aplica a warehouse.",
    peerRowBioCat: "BIO-IGNICIÓN · Growth",
    peerRowBioCost: "$228",
    peerRowBioScope: "HRV grado fleet · FMCSA HOS-aligned · OSHA recordkeeping-ready · STPS NOM-035 · panel VP Safety · SSO + SCIM.",
    peerCite: "Fuentes: ATA cost-per-hire 2023, SHRM 2024, FMCSA Safety Measurement System, OSHA SOII. Precio BIO vigente (2026-Q2).",

    sourcesKicker: "FUENTES · LITERATURA LOGÍSTICA & REGULATORIA",
    sourcesH: "De dónde vienen las cifras.",
    sourcesBody:
      "Todas las cifras provienen de literatura revisada por pares, reportes del DOT/FMCSA/OSHA y regulación pública. Citadas bajo fair-use académico.",
    sourceAta:
      "American Trucking Associations · Driver Shortage Update 2022 · déficit histórico 78,800 drivers profesionales; rolling data documenta rotación 83–93% en large truckload carriers (over-the-road segment).",
    sourceFmcsaHos:
      "FMCSA · 49 CFR Part 395 · Hours of Service regulations · límites 11-hour driving, 14-hour on-duty, 30-min break, 60/70-hour weekly · aplica a CMV interstate commerce.",
    sourceFmcsaLtccs:
      "FMCSA · Large Truck Crash Causation Study (LTCCS) · muestra representativa ~120k crashes CMV 2001–2003 · 13% de crashes con fatiga del conductor como factor asociado · publicación conjunta FMCSA / NHTSA.",
    sourceNiosh:
      "NIOSH · Plain Language About Shiftwork & training material · meta-análisis + revisiones sistemáticas documentan incremento ~30% en riesgo de lesión y error en turno rotativo nocturno vs. diurno.",
    sourceBls:
      "BLS · Survey of Occupational Injuries and Illnesses (SOII) · transportation & warehousing consistentemente entre los sectores de mayor TRIR (Total Recordable Incident Rate) a nivel nacional EEUU.",
    sourceStps:
      "STPS México · NOM-035-STPS-2018 · identificación, análisis y prevención de factores de riesgo psicosocial · obligatoria para centros de trabajo con >15 trabajadores · sanción hasta 500 UMAs por incumplimiento.",
    sourceKoenig:
      "Koenig et al. 2016 · meta-análisis HRV biofeedback en población clínica · d = 0.83 reducción ansiedad (efecto grande).",
    sourceGoessl:
      "Goessl et al. · Psychological Medicine 2017 · meta-análisis d = 0.50 reducción ansiedad con HRV biofeedback (n=482). Nuestro cap 0.35 ≈ 70% del observado.",

    entKicker: "COMPLIANCE & PROCUREMENT · LOGÍSTICA",
    entH: "Lo que tu equipo safety, legal y procurement va a pedir — ya está respondido.",
    entBody:
      "Postura documentada para cada control. Artefactos formales (SOC 2 Type I, DPA, ISO 27001 gap, FMCSA fatigue-management mapping, OSHA recordkeeping mapping, STPS NOM-035 reporte) entregados bajo NDA vía Trust Center.",
    entSoc2: "SOC 2 Type I · postura activa",
    entFmcsa: "FMCSA Part 395 · HOS-aligned",
    entOsha: "OSHA 1910 · recordkeeping-ready",
    entNom: "NOM-035 STPS · reporte anual",
    entIso: "ISO 27001 · gap analysis",
    entDpa: "DPA · GDPR Recital 26",
    entSso: "SSO · SAML 2.0 + SCIM",
    entSla: "99.9% SLA · fleet-grade",
    entFoot: "Datos individuales segregados por operador. VP Safety / Fleet Director solo ve agregados anonimizados ≥ 5 operadores por segmento (terminal, ruta, shift). Geolocalización de unidad nunca se toca.",
    entJurisdictions: "Cobertura jurisdiccional · US: FMCSA Part 395 · OSHA 29 CFR 1910 · 49 CFR 391 · EU: Reg. (EC) 561/2006 · EU-OSHA · UK: DVSA HGV · HSE · MX: STPS NOM-035 · SCT · CA: Transport Canada HOS · BR: ANTT / NR-17.",

    disclaimerH: "Nota legal · lectura en 30 s",
    disclaimer1:
      "Las cifras son estimaciones a partir de literatura pública revisada por pares, reportes DOT/FMCSA/OSHA y regulación, no garantías. Los resultados reales dependen de implementación, tamaño de flota, mix OTR/regional/last-mile, tasa de adherencia y contexto operativo.",
    disclaimer2:
      "BIO-IGNICIÓN es una herramienta de bienestar operativo basada en HRV · NO es dispositivo médico, NO diagnostica, NO trata condiciones médicas, NO sustituye el DOT medical examiner ni el fit-for-duty assessment. Complementario al EAP formal de la flota.",
    disclaimer3:
      "El término 'grado fleet' se refiere a la calidad de medición HRV (validación frente a ECG en literatura) y a la robustez operativa y auditable de la plataforma. NO implica autorización regulatoria como dispositivo médico (FDA / COFEPRIS / CE).",
    disclaimer4:
      "'FMCSA HOS-aligned' significa que los exportes y logs de BIO-IGNICIÓN están estructurados de forma compatible con un programa de fatigue management bajo FMCSA Safety Management Cycle. NO implica certificación FMCSA, NO sustituye al ELD ni al HOS log, y NO reemplaza al DOT compliance officer.",
    disclaimer5:
      "'OSHA recordkeeping-ready' significa que los reportes de BIO-IGNICIÓN son estructurables hacia OSHA 300/301 logs. NO implica auditoría OSHA, NO es una atestación, y NO sustituye al programa safety de la operación.",

    closingKicker: "PRÓXIMO PASO · LOGÍSTICO",
    closingHLead: "Agenda con supuestos de flota.",
    closingHBody: "Un cierre de 45 min con tu VP Safety, Fleet Director y legal.",
    closingBody:
      "Llevamos los supuestos a tu contexto real: mix OTR / regional / last-mile, cantidad de terminales, jurisdicciones (DOT, FMCSA, OSHA, STPS, DVSA, Transport Canada, ANTT), regulatorio aplicable (HOS, 1910, NOM-035, Reg. 561/2006). El cohorte piloto Q2 2026 está limitado a 5 operadores logísticos fleet-grade.",
    closingPrimary: "Agenda demo · fleet-grade",
    closingSecondary: "Ver ROI con tu flota",
    closingTertiary: "Trust Center · due diligence",
    closingAvail: "Página revisada",
    closingContact: "logistics@bio-ignicion.app",
  },
  en: {
    eyebrow: "FOR LOGISTICS · FLEET, 3PL, WAREHOUSE & LAST-MILE",
    title: "Operator fatigue isn't HR. It's road safety and DOT compliance.",
    editorial:
      "The driver crash, the warehouse pick error and the CDL turnover live on the same physiological link. It's measured in HRV, not in OSHA-log lagging indicators.",
    intro:
      "BIO-IGNICIÓN instruments the 3 minutes that already exist pre-route, at dock-in or in the shift-change huddle. FMCSA HOS-aligned, OSHA recordkeeping-ready, STPS NOM-035 — operating dashboard visible to VP Safety / Fleet Director, not to HR.",
    metaSoc: "SOC 2 Type I · active",
    metaFmcsa: "FMCSA Part 395 · HOS-aligned",
    metaOsha: "OSHA 1910 · recordkeeping-ready",
    metaShift: "3 min pre-route",

    scarcityLabel: "Q2 2026 · FLEET-GRADE PILOT · 5 LOGISTICS OPERATORS",

    statShortage: "US professional-driver shortage",
    statShortageSub: "ATA Driver Shortage Update · 2022",
    statTurnover: "Annual turnover at large truckload carriers",
    statTurnoverSub: "ATA rolling data · large-fleet truckload",
    statFatigueCrash: "CMV crashes with driver fatigue as an associated factor",
    statFatigueCrashSub: "FMCSA Large Truck Crash Causation Study (LTCCS)",
    statShift: "Injury-risk increase · rotating shift",
    statShiftSub: "NIOSH · shift-work literature · meta-analysis",

    benchmarkKicker: "CONTEXT · PUBLIC LOGISTICS DATA",
    benchmarkAtaSrc: "ATA",
    benchmarkAtaV: "78,800",
    benchmarkAtaL: "US national shortage of professional drivers · American Trucking Associations Driver Shortage Update 2022 · reported historic peak.",
    benchmarkTurnoverSrc: "ATA",
    benchmarkTurnoverV: "83–93%",
    benchmarkTurnoverL: "Average annual turnover at large truckload carriers · American Trucking Associations rolling data · over-the-road segment.",
    benchmarkFmcsaSrc: "FMCSA",
    benchmarkFmcsaV: "13%",
    benchmarkFmcsaL: "CMV crashes with driver fatigue as an associated factor · FMCSA Large Truck Crash Causation Study · sample n≈120k crashes 2001–2003.",
    benchmarkNioshSrc: "NIOSH",
    benchmarkNioshV: "+30%",
    benchmarkNioshL: "Injury-risk and error increase under rotating night shift · NIOSH training & literature · shift-work meta-analysis.",

    painKicker: "THESIS · WHY IT MATTERS AT YOUR OPERATION",
    painH: "Operator fatigue is a leading indicator for crash and for OSHA-recordable.",
    painBody:
      "DOT recordable, OSHA 300 log and preventable-crash review are lagging — they report what already happened. HRV and autonomic fatigue in the driver / picker / forklift operator are detectable hours before the incident. BIO intervenes at the early link because that's where the rest is fixed.",
    painP1Title: "1. Physiology before the crash or the pick error",
    painP1Body:
      "Microsleep, reaction-time decay and decision fatigue are measurable in HRV and circadian rhythm before they show up in a DOT recordable, warehouse incident, or pick-accuracy drop. Shift-work safety literature (NIOSH, Williamson & Feyer, OMSJ) correlates sleep debt with cognitive impairment equivalent to legally actionable blood-alcohol levels.",
    painP2Title: "2. HOS log is lagging · HRV is leading",
    painP2Body:
      "FMCSA Part 395 audits hours of service — how long they drove, how long they rested. Necessary but not sufficient: it tells you if the driver had the window, not if they used it effectively, nor if they started the route fatigued for reasons outside the log (commuting, fragmented sleep, prior rotating shift). HRV closes that gap. BIO provides structured evidence for fatigue-management programs under the FMCSA Safety Management Cycle — it does not replace the ELD nor the HOS log.",
    painP3Title: "3. Turnover = loss of CDL-certified drivers",
    painP3Body:
      "Every CDL-A who leaves takes 12–24 months of route experience, equipment familiarity and accumulated endorsements (HazMat, tanker, doubles-triples) with them. Replacement costs $8k–$15k in recruiting + training + DOT physicals + drug screening (ATA cost-per-hire). A 10% turnover reduction on a 200-truck fleet pays for several BIO cycles.",
    painP4Title: "4. DOT + OSHA + STPS is multi-jurisdiction",
    painP4Body:
      "FMCSA Part 395 (HOS), 49 CFR 391 (medical qualification), OSHA 29 CFR 1910 (general industry, applies to warehouse), STPS NOM-035 (psychosocial factors, mandatory in MX operations), and in the EU Regulation (EC) 561/2006 (driving times). BIO provides evidence mappable to each framework — it does not replace the DOT compliance officer, EHS or the STPS advisor.",

    fitKicker: "HOW IT FITS · OPERATIONALLY",
    fitH: "It instruments the 3 minutes that already exist pre-route, at dock-in or at shift change.",
    fitBody:
      "We don't ask the driver or the warehouse associate for extra time. We ask for 3 structured minutes pre-route, at dock-in or in the shift-change huddle. Impact is measured in HRV and near-miss rate, not engagement.",
    fitL1: "Clinically-validated 3-min resonant-breathing protocols (5.5–6 bpm) · compatible with pre-trip inspection or dock huddle · measurable HRV effect from session 1.",
    fitL2: "Operating dashboard for VP Safety / Fleet Director · anonymized aggregates by terminal / route / shift · segments with k ≥ 5 operators · no individual exposure and never touches unit geolocation.",
    fitL3: "Individual reports stay private to the driver/operator · matches regulated-EAP confidentiality expectation and avoids ADA / USMCA labor-chapter discrimination claims.",
    fitL4: "SSO SAML 2.0 + SCIM + audit trail · compatible with enterprise IdPs (Okta, Azure AD) and corporate TMS · automated provisioning and DOT-ready logging.",
    fitL5: "FMCSA / DOT evidence pack · fatigue-management program artifacts compatible with FMCSA Safety Management Cycle and NHTSA Behavioral Safety Program review.",
    fitL6: "Under-NDA exports: SOC 2 Type I, DPA, ISO 27001 gap analysis, OSHA 300/301 recordkeeping mapping, STPS NOM-035 annual report.",

    peerKicker: "COMPARISON · WHAT'S ALREADY INSTALLED",
    peerH: "Against what your fleet already has.",
    peerBody:
      "Reference adoption and scope at over-the-road fleets >500 trucks, tier-1 3PL operators and last-mile networks. Your mix varies, but the pattern is stable.",
    peerColCat: "Category",
    peerColCost: "USD / operator / yr",
    peerColScope: "Scope",
    peerRowEapCat: "Traditional fleet EAP",
    peerRowEapCost: "$160",
    peerRowEapScope: "Reactive counseling · 2–5% driver adoption · no physiological instrumentation · no FMCSA/OSHA evidence.",
    peerRowWellnessCat: "Corporate wellness (challenges, content)",
    peerRowWellnessCost: "$420",
    peerRowWellnessScope: "Gamification · no measurable operational outcome · 90-day drop-off · not referenceable to an FMCSA auditor.",
    peerRowWearableCat: "Fleet wearables (Smartdrive, Seeing Machines cabin)",
    peerRowWearableCost: "$340",
    peerRowWearableScope: "In-cab post-hoc detection (eye-tracking, lane-drift) · reacts to microsleep in progress · does not prevent · does not apply to warehouse.",
    peerRowBioCat: "BIO-IGNICIÓN · Growth",
    peerRowBioCost: "$228",
    peerRowBioScope: "Fleet-grade HRV · FMCSA HOS-aligned · OSHA recordkeeping-ready · STPS NOM-035 · VP Safety dashboard · SSO + SCIM.",
    peerCite: "Sources: ATA cost-per-hire 2023, SHRM 2024, FMCSA Safety Measurement System, OSHA SOII. BIO pricing current (2026-Q2).",

    sourcesKicker: "SOURCES · LOGISTICS & REGULATORY LITERATURE",
    sourcesH: "Where the figures come from.",
    sourcesBody:
      "All figures come from peer-reviewed literature, DOT/FMCSA/OSHA reports and public regulation. Cited under academic fair-use.",
    sourceAta:
      "American Trucking Associations · Driver Shortage Update 2022 · historic 78,800 professional-driver shortfall; rolling data documents 83–93% turnover in large truckload carriers (over-the-road segment).",
    sourceFmcsaHos:
      "FMCSA · 49 CFR Part 395 · Hours of Service regulations · 11-hour driving, 14-hour on-duty, 30-min break, 60/70-hour weekly limits · applies to CMV interstate commerce.",
    sourceFmcsaLtccs:
      "FMCSA · Large Truck Crash Causation Study (LTCCS) · representative sample of ~120k CMV crashes 2001–2003 · 13% of crashes with driver fatigue as an associated factor · joint FMCSA / NHTSA publication.",
    sourceNiosh:
      "NIOSH · Plain Language About Shiftwork & training material · meta-analyses + systematic reviews document ~30% increase in injury and error risk on rotating night shift vs. day shift.",
    sourceBls:
      "BLS · Survey of Occupational Injuries and Illnesses (SOII) · transportation & warehousing consistently ranks among the highest-TRIR (Total Recordable Incident Rate) sectors nationally in the US.",
    sourceStps:
      "STPS Mexico · NOM-035-STPS-2018 · identification, analysis and prevention of psychosocial risk factors · mandatory at workplaces with >15 workers · penalties up to 500 UMAs for non-compliance.",
    sourceKoenig:
      "Koenig et al. 2016 · HRV biofeedback meta-analysis in clinical populations · d = 0.83 anxiety reduction (large effect).",
    sourceGoessl:
      "Goessl et al. · Psychological Medicine 2017 · meta-analysis d = 0.50 anxiety reduction via HRV biofeedback (n=482). Our 0.35 cap ≈ 70% of observed effect.",

    entKicker: "COMPLIANCE & PROCUREMENT · LOGISTICS",
    entH: "Everything your safety, legal and procurement team will ask — already answered.",
    entBody:
      "Documented posture for each control. Formal artifacts (SOC 2 Type I, DPA, ISO 27001 gap, FMCSA fatigue-management mapping, OSHA recordkeeping mapping, STPS NOM-035 report) delivered under NDA via Trust Center.",
    entSoc2: "SOC 2 Type I · active posture",
    entFmcsa: "FMCSA Part 395 · HOS-aligned",
    entOsha: "OSHA 1910 · recordkeeping-ready",
    entNom: "NOM-035 STPS · annual report",
    entIso: "ISO 27001 · gap analysis",
    entDpa: "DPA · GDPR Recital 26",
    entSso: "SSO · SAML 2.0 + SCIM",
    entSla: "99.9% SLA · fleet-grade",
    entFoot: "Individual data is segregated per operator. The VP Safety / Fleet Director sees only anonymized aggregates of ≥ 5 operators per segment (terminal, route, shift). Unit geolocation is never touched.",
    entJurisdictions: "Jurisdictional coverage · US: FMCSA Part 395 · OSHA 29 CFR 1910 · 49 CFR 391 · EU: Reg. (EC) 561/2006 · EU-OSHA · UK: DVSA HGV · HSE · MX: STPS NOM-035 · SCT · CA: Transport Canada HOS · BR: ANTT / NR-17.",

    disclaimerH: "Legal note · 30-sec read",
    disclaimer1:
      "Figures are estimates from peer-reviewed public literature, DOT/FMCSA/OSHA reports and regulation — not guarantees. Actual results depend on implementation, fleet size, OTR/regional/last-mile mix, adherence rate and operational context.",
    disclaimer2:
      "BIO-IGNICIÓN is an HRV-based operational wellbeing tool · it is NOT a medical device, does NOT diagnose, does NOT treat medical conditions, and does NOT replace the DOT medical examiner nor the fit-for-duty assessment. Complementary to the fleet's formal EAP only.",
    disclaimer3:
      "The term 'fleet-grade' refers to HRV measurement quality (ECG-validated in literature) and platform operational/auditable robustness. It does NOT imply regulatory clearance as a medical device (FDA / COFEPRIS / CE).",
    disclaimer4:
      "'FMCSA HOS-aligned' means BIO-IGNICIÓN exports and logs are structured to be compatible with a fatigue-management program under the FMCSA Safety Management Cycle. It does NOT imply FMCSA certification, does NOT replace the ELD nor the HOS log, and does NOT replace the DOT compliance officer.",
    disclaimer5:
      "'OSHA recordkeeping-ready' means BIO-IGNICIÓN reports are structurable toward OSHA 300/301 logs. It does NOT imply an OSHA audit, is NOT an attestation, and does NOT replace the operation's safety program.",

    closingKicker: "NEXT STEP · LOGISTICS",
    closingHLead: "Book a demo with fleet assumptions.",
    closingHBody: "A 45-min closing with your VP Safety, Fleet Director and legal.",
    closingBody:
      "We bring the assumptions to your real context: OTR / regional / last-mile mix, number of terminals, jurisdictions (DOT, FMCSA, OSHA, STPS, DVSA, Transport Canada, ANTT), applicable regulation (HOS, 1910, NOM-035, Reg. 561/2006). The Q2 2026 pilot cohort is limited to 5 fleet-grade logistics operators.",
    closingPrimary: "Book demo · fleet-grade",
    closingSecondary: "Run ROI with your fleet",
    closingTertiary: "Trust Center · due diligence",
    closingAvail: "Page reviewed",
    closingContact: "logistics@bio-ignicion.app",
  },
};

export default async function ForLogisticsPage() {
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
    <PublicShell activePath="/for-logistics">
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
              <ul className="bi-roi-meta" aria-label="logistics-meta">
                <li><span className="dot" aria-hidden /> {c.metaSoc}</li>
                <li><span className="dot" aria-hidden /> {c.metaFmcsa}</li>
                <li><span className="dot" aria-hidden /> {c.metaOsha}</li>
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
              <span className="v">78,800</span>
              <span className="l">{c.statShortage}</span>
              <span className="s">{c.statShortageSub}</span>
            </div>
            <div>
              <span className="v">83–93%</span>
              <span className="l">{c.statTurnover}</span>
              <span className="s">{c.statTurnoverSub}</span>
            </div>
            <div>
              <span className="v">13%</span>
              <span className="l">{c.statFatigueCrash}</span>
              <span className="s">{c.statFatigueCrashSub}</span>
            </div>
            <div>
              <span className="v">+30%</span>
              <span className="l">{c.statShift}</span>
              <span className="s">{c.statShiftSub}</span>
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
              <div className="src">{c.benchmarkAtaSrc}</div>
              <span className="v">{c.benchmarkAtaV}</span>
              <span className="l">{c.benchmarkAtaL}</span>
            </div>
            <div className="bi-roi-benchmark-cell">
              <div className="src">{c.benchmarkTurnoverSrc}</div>
              <span className="v">{c.benchmarkTurnoverV}</span>
              <span className="l">{c.benchmarkTurnoverL}</span>
            </div>
            <div className="bi-roi-benchmark-cell">
              <div className="src">{c.benchmarkFmcsaSrc}</div>
              <span className="v">{c.benchmarkFmcsaV}</span>
              <span className="l">{c.benchmarkFmcsaL}</span>
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
            <li><span className="bi-roi-source-tag">ATA</span><span>{c.sourceAta}</span></li>
            <li><span className="bi-roi-source-tag">FMCSA · HOS</span><span>{c.sourceFmcsaHos}</span></li>
            <li><span className="bi-roi-source-tag">FMCSA · LTCCS</span><span>{c.sourceFmcsaLtccs}</span></li>
            <li><span className="bi-roi-source-tag">NIOSH</span><span>{c.sourceNiosh}</span></li>
            <li><span className="bi-roi-source-tag">BLS</span><span>{c.sourceBls}</span></li>
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
            <li className="bi-roi-ent-chip">{c.entFmcsa}</li>
            <li className="bi-roi-ent-chip">{c.entOsha}</li>
            <li className="bi-roi-ent-chip">{c.entNom}</li>
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
      <section aria-labelledby="log-closing" className="bi-demo-closing-section">
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

              <h2 id="log-closing" className="bi-demo-closing-h">
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
