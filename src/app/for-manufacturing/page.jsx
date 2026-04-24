/* ═══════════════════════════════════════════════════════════════
   /for-manufacturing — Vertical B2B landing for industrial operators,
   plant safety leaders (EHS) and VP Operations. Thesis: operational
   fatigue is an occupational-safety problem, not a culture line-item.
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
  title: "Para Manufactura · Fatiga operativa es seguridad ocupacional",
  description:
    "TRIR, DART y rotación tienen raíz fisiológica común: fatiga acumulada medible en HRV. BIO-IGNICIÓN se instrumenta en 3 min de briefing de seguridad · OSHA recordkeeping-ready · NOM-035 STPS · SSO + SCIM enterprise.",
  alternates: { canonical: "/for-manufacturing" },
  openGraph: {
    title: "BIO-IGNICIÓN · Manufactura · Fatiga operativa = seguridad ocupacional",
    description:
      "TRIR 3.2 en manufactura (BLS 2023). $167B/año en lesiones US (NSC). +30% riesgo turno rotativo (NIOSH). BIO: HRV leading indicator, OSHA recordkeeping-ready, NOM-035 STPS.",
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
    eyebrow: "PARA MANUFACTURA · PERSONAL OPERATIVO",
    title: "Fatiga operativa no es cultura. Es seguridad ocupacional.",
    editorial:
      "La fatiga acumulada precede al incidente. Se mide en HRV semanas antes de que aparezca en el TRIR.",
    intro:
      "BIO-IGNICIÓN se instrumenta en los 3 minutos que ya existen en el briefing de seguridad, el cambio de turno o la pausa de máquina. OSHA recordkeeping-ready, NOM-035 STPS dashboard, visible al Director de EHS — no al analista de RRHH.",
    metaOsha: "OSHA recordkeeping-ready",
    metaNom: "NOM-035 STPS",
    metaHrv: "HRV grado industrial",
    metaShift: "3 min en briefing",

    scarcityLabel: "Q2 2026 · PILOTO PLANT-GRADE · 5 OPERADORES INDUSTRIALES",

    statTrir: "TRIR manufactura US",
    statTrirSub: "BLS · 2023",
    statCost: "Costo anual lesiones laborales US",
    statCostSub: "NSC Injury Facts · 2023",
    statShift: "Aumento riesgo turno rotativo",
    statShiftSub: "NIOSH · literatura 2004–2020",
    statTurnover: "Rotación anual manufactura US",
    statTurnoverSub: "MAPI / Deloitte · 2021",

    benchmarkKicker: "CONTEXTO · DATA PÚBLICA INDUSTRIAL",
    benchmarkBlsSrc: "BLS",
    benchmarkBlsV: "3.2 / 100 FTE",
    benchmarkBlsL: "Total Recordable Incident Rate manufactura US · Bureau of Labor Statistics 2023 (SOII)",
    benchmarkNioshSrc: "NIOSH",
    benchmarkNioshV: "+30%",
    benchmarkNioshL: "Incremento de riesgo de lesión en turno nocturno/rotativo vs. diurno · NIOSH Work Schedules reviews",
    benchmarkNscSrc: "NSC",
    benchmarkNscV: "$167 B / año",
    benchmarkNscL: "Costo total anual de lesiones laborales US (directo + indirecto) · National Safety Council Injury Facts 2023",
    benchmarkMapiSrc: "MAPI",
    benchmarkMapiV: "40%",
    benchmarkMapiL: "Rotación anual promedio en manufactura US post-pandemia · MAPI / Deloitte Skills Gap & Future of Work 2021",

    painKicker: "TESIS · POR QUÉ IMPORTA EN TU PLANTA",
    painH: "La fatiga operativa es un leading indicator de incidente.",
    painBody:
      "TRIR, DART y LTIR son lagging — reportan lo que ya pasó. HRV y la fatiga autonómica se detectan semanas antes del near-miss. BIO interviene en el eslabón temprano porque ahí se previene el resto.",
    painP1Title: "1. Fisiología antes que feelings",
    painP1Body:
      "La fatiga acumulada por turno rotativo, calor, ruido y carga física es medible en HRV y cortisol circadiano. Los self-reports sub-reportan por cultura operativa (\"aguantar\"); la fisiología no miente.",
    painP2Title: "2. Incidente como consecuencia de fatiga",
    painP2Body:
      "Literatura NIOSH y revisiones académicas vinculan turno nocturno, turno rotativo y horas extendidas con incremento medible en lesiones, errores de operación y near-miss. Cambiar cultura sin medir fisiología deja el leading indicator ciego.",
    painP3Title: "3. Rotación = pérdida de know-how técnico",
    painP3Body:
      "Cada operador certificado que se va se lleva 12–36 meses de entrenamiento en la línea, el tooling y los SOP de seguridad. En plantas con 40% de rotación anual (MAPI 2021), reducirla 10% libera presupuesto equivalente a varios ciclos de BIO.",
    painP4Title: "4. NOM-035 STPS no es opcional en México",
    painP4Body:
      "Evaluación de factores de riesgo psicosocial obligatoria para centros de trabajo >15 personas (STPS, vigente 2019+). Sanciones por incumplimiento alcanzan 500 UMAs por trabajador afectado. BIO aporta evidencia auditable, no sustituye la evaluación formal.",

    fitKicker: "CÓMO ENCAJA · OPERATIVAMENTE",
    fitH: "Se instrumenta en los 3 minutos que ya existen en el briefing de seguridad.",
    fitBody:
      "No pedimos tiempo extra al operador. Pedimos 3 minutos estructurados dentro del safety huddle, cambio de turno o pausa de máquina. El impacto se mide en HRV, no en engagement.",
    fitL1: "Protocolos respiración resonante 3 min (5.5–6 bpm) validados clínicamente · compatibles con briefing de seguridad estándar · efecto medible en HRV en sesión 1.",
    fitL2: "Dashboard EHS para jefatura operativa · agregados anónimos por turno / línea / planta · segmentos con k ≥ 5 personas · sin exponer datos individuales.",
    fitL3: "Reportes individuales permanecen privados para el operador · cumple expectativa de confidencialidad equivalente a EAP industrial.",
    fitL4: "SSO SAML 2.0 + SCIM · compatible con IdP enterprise (Okta, Ping, Azure AD) · provisioning automático para plantas >5k headcount.",
    fitL5: "NOM-035 STPS dashboard · evidencia descargable para auditor STPS · incluida en plan Growth.",
    fitL6: "Exports bajo NDA: OSHA recordkeeping-ready format, SOC 2 Type I posture, DPA, ISO 27001 gap analysis.",

    peerKicker: "COMPARATIVO · QUÉ HAY HOY EN TU PLANTA",
    peerH: "Contra lo que ya tienes instalado.",
    peerBody:
      "Referencias de adopción y alcance típico en plantas de >1,000 FTE en manufactura discreta y de proceso. Tu mix varía, pero el patrón es estable.",
    peerColCat: "Categoría",
    peerColCost: "USD / emp / año",
    peerColScope: "Alcance",
    peerRowEapCat: "EAP industrial tradicional",
    peerRowEapCost: "$180",
    peerRowEapScope: "Consejería reactiva · adopción operativa 2–6% · sin instrumentación fisiológica · sin dashboard EHS.",
    peerRowWellnessCat: "Wellness corporativo (retos, contenido)",
    peerRowWellnessCost: "$450",
    peerRowWellnessScope: "Gamificación · sin outcome ocupacional medible · abandono a 90 días · no referenciable ante auditor.",
    peerRowWearableCat: "Wearables fragmentados (Fitbit, Oura enterprise)",
    peerRowWearableCost: "$280",
    peerRowWearableScope: "Datos individuales sin agregación por línea / turno · sin integración EHS · sin NOM-035.",
    peerRowBioCat: "BIO-IGNICIÓN · Growth",
    peerRowBioCost: "$228",
    peerRowBioScope: "HRV grado industrial · NOM-035 STPS · dashboard EHS · OSHA recordkeeping-ready · SSO + SCIM.",
    peerCite: "Fuentes: SHRM 2024, KFF Employer Health Benefits 2024, MAPI 2021. Precio BIO vigente (2026-Q2).",

    sourcesKicker: "FUENTES · LITERATURA OCUPACIONAL",
    sourcesH: "De dónde vienen las cifras.",
    sourcesBody:
      "Todas las cifras provienen de reportes gubernamentales (BLS, NIOSH, STPS), literatura revisada por pares y reportes corporativos abiertos. Citadas bajo fair-use académico.",
    sourceBls:
      "Bureau of Labor Statistics · Survey of Occupational Injuries and Illnesses (SOII) 2023 · TRIR manufactura US 3.2 / 100 FTE.",
    sourceNiosh:
      "NIOSH · Work Schedules: Shift Work and Long Work Hours · revisiones 2004–2020 · turno nocturno/rotativo +30% riesgo de lesión vs. diurno.",
    sourceNsc:
      "National Safety Council · Injury Facts 2023 · costo total anual lesiones laborales US $167 B (directo + indirecto + pérdida productividad).",
    sourceMapi:
      "MAPI / Deloitte · 2021 Manufacturing Skills Gap and Future of Work · rotación anual promedio 40% post-pandemia en manufactura US.",
    sourceKoenig:
      "Koenig et al. 2016 · meta-análisis HRV biofeedback en población clínica · d = 0.83 reducción ansiedad (efecto grande).",
    sourceGoessl:
      "Goessl et al. · Psychological Medicine 2017 · meta-análisis d = 0.50 reducción ansiedad con HRV biofeedback (n=482). Nuestro cap 0.35 ≈ 70% del observado.",
    sourceStps:
      "NOM-035-STPS-2018 · vigente 2019+ · evaluación obligatoria de factores de riesgo psicosocial en centros de trabajo >15 personas. Sanción hasta 500 UMAs por trabajador afectado.",

    entKicker: "COMPLIANCE & PROCUREMENT · INDUSTRIAL",
    entH: "Lo que tu equipo legal y procurement va a pedir — ya está respondido.",
    entBody:
      "Postura documentada para cada control. Artefactos formales (OSHA recordkeeping mapping, SOC 2 Type I, DPA, ISO 27001 gap) entregados bajo NDA vía Trust Center.",
    entOsha: "OSHA · recordkeeping-ready",
    entSoc2: "SOC 2 Type I · postura activa",
    entNom: "NOM-035 STPS · dashboard + evidencia",
    entIso: "ISO 27001 · gap analysis",
    entDpa: "DPA · GDPR Recital 26",
    entNist: "NIST CSF · mapping documentado",
    entSso: "SSO · SAML 2.0 + SCIM",
    entSla: "99.9% SLA · plant-grade",
    entFoot: "Datos individuales segregados por operador. Director de EHS solo ve agregados anonimizados ≥ 5 personas por segmento (turno, línea, planta).",

    disclaimerH: "Nota legal · lectura en 30 s",
    disclaimer1:
      "Las cifras son estimaciones a partir de literatura pública revisada por pares y reportes gubernamentales, no garantías. Los resultados reales dependen de implementación, tamaño del pool, tasa de adherencia y contexto operativo.",
    disclaimer2:
      "BIO-IGNICIÓN es una herramienta de bienestar operativo basada en HRV · NO es dispositivo médico, NO diagnostica, NO trata condiciones médicas, NO sustituye evaluación médica ocupacional. Uso complementario al programa formal de seguridad y salud.",
    disclaimer3:
      "El término 'grado industrial' se refiere a la calidad de medición HRV (validación frente a ECG en literatura) y a la robustez operativa de la plataforma, NO implica autorización regulatoria como dispositivo médico (FDA / COFEPRIS / CE).",
    disclaimer4:
      "'OSHA recordkeeping-ready' significa que los exportes de BIO-IGNICIÓN están estructurados de forma compatible con requerimientos OSHA 29 CFR Part 1904 para correlación con el registro formal del empleador; no implica certificación OSHA ni sustitución del Form 300/300A/301 oficial.",
    disclaimer5:
      "NOM-035-STPS-2018 requiere evaluación formal de factores de riesgo psicosocial por tercero autorizado según el tamaño del centro de trabajo. BIO-IGNICIÓN aporta evidencia auditable complementaria; NO sustituye la evaluación oficial ni la responsabilidad del patrón.",

    closingKicker: "PRÓXIMO PASO · INDUSTRIAL",
    closingHLead: "Agenda con supuestos industriales.",
    closingHBody: "Un cierre de 45 min con tu Director de EHS y VP de Operaciones.",
    closingBody:
      "Llevamos los supuestos a tu contexto real: mix operario/técnico/administrativo, turnos, calor/ruido/carga física, región, regulatorio aplicable (OSHA, STPS, EU-OSHA). El cohorte piloto Q2 2026 está limitado a 5 operadores industriales plant-grade.",
    closingPrimary: "Agenda demo · plant-grade",
    closingSecondary: "Ver ROI con tus números",
    closingTertiary: "Trust Center · due diligence",
    closingAvail: "Página revisada",
    closingContact: "manufacturing@bio-ignicion.app",
  },
  en: {
    eyebrow: "FOR MANUFACTURING · OPERATIONAL WORKFORCE",
    title: "Operational fatigue isn't culture. It's occupational safety.",
    editorial:
      "Accumulated fatigue precedes the incident. It's measured in HRV weeks before it shows up in the TRIR.",
    intro:
      "BIO-IGNICIÓN instruments the 3 minutes that already exist in the safety briefing, shift change or machine pause. OSHA recordkeeping-ready, NOM-035 STPS dashboard, visible to the EHS Director — not to the HR analyst.",
    metaOsha: "OSHA recordkeeping-ready",
    metaNom: "NOM-035 STPS",
    metaHrv: "Industrial-grade HRV",
    metaShift: "3 min in briefing",

    scarcityLabel: "Q2 2026 · PLANT-GRADE PILOT · 5 INDUSTRIAL OPERATORS",

    statTrir: "US manufacturing TRIR",
    statTrirSub: "BLS · 2023",
    statCost: "Annual US cost of workplace injuries",
    statCostSub: "NSC Injury Facts · 2023",
    statShift: "Rotating-shift injury risk uplift",
    statShiftSub: "NIOSH · literature 2004–2020",
    statTurnover: "Annual US manufacturing turnover",
    statTurnoverSub: "MAPI / Deloitte · 2021",

    benchmarkKicker: "CONTEXT · PUBLIC INDUSTRIAL DATA",
    benchmarkBlsSrc: "BLS",
    benchmarkBlsV: "3.2 / 100 FTE",
    benchmarkBlsL: "Total Recordable Incident Rate US manufacturing · Bureau of Labor Statistics 2023 (SOII)",
    benchmarkNioshSrc: "NIOSH",
    benchmarkNioshV: "+30%",
    benchmarkNioshL: "Injury risk increase in night/rotating shift vs. day shift · NIOSH Work Schedules reviews",
    benchmarkNscSrc: "NSC",
    benchmarkNscV: "$167 B / yr",
    benchmarkNscL: "Total annual US cost of workplace injuries (direct + indirect) · National Safety Council Injury Facts 2023",
    benchmarkMapiSrc: "MAPI",
    benchmarkMapiV: "40%",
    benchmarkMapiL: "Average annual turnover in US manufacturing post-pandemic · MAPI / Deloitte Skills Gap & Future of Work 2021",

    painKicker: "THESIS · WHY IT MATTERS AT YOUR PLANT",
    painH: "Operational fatigue is a leading indicator for incidents.",
    painBody:
      "TRIR, DART and LTIR are lagging — they report what already happened. HRV and autonomic fatigue are detectable weeks before the near-miss. BIO intervenes at the early link because that's where the rest is prevented.",
    painP1Title: "1. Physiology before feelings",
    painP1Body:
      "Accumulated fatigue from rotating shifts, heat, noise and physical load is measurable in HRV and circadian cortisol. Self-reports under-report due to operational culture (\"tough it out\"); physiology doesn't lie.",
    painP2Title: "2. Incident as a fatigue consequence",
    painP2Body:
      "NIOSH literature and peer-reviewed reviews tie night shifts, rotating schedules and extended hours to measurable increases in injuries, operational errors and near-misses. Changing culture without measuring physiology leaves the leading indicator blind.",
    painP3Title: "3. Turnover = loss of technical know-how",
    painP3Body:
      "Every certified operator who leaves takes 12–36 months of line, tooling and safety SOP training with them. At plants with 40% annual turnover (MAPI 2021), a 10% reduction frees budget equivalent to several BIO cycles.",
    painP4Title: "4. NOM-035 STPS is not optional in Mexico",
    painP4Body:
      "Psychosocial risk factor evaluation is mandatory for workplaces >15 people (STPS, in force since 2019). Non-compliance fines reach 500 UMAs per affected worker. BIO delivers auditable evidence; it does not replace the formal evaluation.",

    fitKicker: "HOW IT FITS · OPERATIONALLY",
    fitH: "It instruments the 3 minutes that already exist in the safety briefing.",
    fitBody:
      "We don't ask the operator for extra time. We ask for 3 structured minutes inside the safety huddle, shift change or machine pause. Impact is measured in HRV, not engagement.",
    fitL1: "Clinically-validated 3-min resonant-breathing protocols (5.5–6 bpm) · compatible with standard safety briefing · measurable HRV effect from session 1.",
    fitL2: "EHS operating dashboard for plant leadership · anonymized aggregates by shift / line / plant · segments with k ≥ 5 people · no individual exposure.",
    fitL3: "Individual reports stay private to the operator · matches industrial-EAP confidentiality expectation.",
    fitL4: "SSO SAML 2.0 + SCIM · compatible with enterprise IdPs (Okta, Ping, Azure AD) · automated provisioning for >5k-headcount plants.",
    fitL5: "NOM-035 STPS dashboard · downloadable evidence for STPS auditors · included in Growth plan.",
    fitL6: "Under-NDA exports: OSHA recordkeeping-ready format, SOC 2 Type I posture, DPA, ISO 27001 gap analysis.",

    peerKicker: "COMPARISON · WHAT'S ALREADY INSTALLED",
    peerH: "Against what your plant already has.",
    peerBody:
      "Reference adoption and scope at >1,000-FTE plants in discrete and process manufacturing. Your mix varies, but the pattern is stable.",
    peerColCat: "Category",
    peerColCost: "USD / emp / yr",
    peerColScope: "Scope",
    peerRowEapCat: "Traditional industrial EAP",
    peerRowEapCost: "$180",
    peerRowEapScope: "Reactive counseling · 2–6% operational adoption · no physiological instrumentation · no EHS dashboard.",
    peerRowWellnessCat: "Corporate wellness (challenges, content)",
    peerRowWellnessCost: "$450",
    peerRowWellnessScope: "Gamification · no measurable occupational outcome · 90-day drop-off · not auditor-ready.",
    peerRowWearableCat: "Fragmented wearables (Fitbit, Oura enterprise)",
    peerRowWearableCost: "$280",
    peerRowWearableScope: "Individual data without line/shift aggregation · no EHS integration · no NOM-035 support.",
    peerRowBioCat: "BIO-IGNICIÓN · Growth",
    peerRowBioCost: "$228",
    peerRowBioScope: "Industrial-grade HRV · NOM-035 STPS · EHS dashboard · OSHA recordkeeping-ready · SSO + SCIM.",
    peerCite: "Sources: SHRM 2024, KFF Employer Health Benefits 2024, MAPI 2021. BIO pricing current (2026-Q2).",

    sourcesKicker: "SOURCES · OCCUPATIONAL LITERATURE",
    sourcesH: "Where the figures come from.",
    sourcesBody:
      "All figures come from government reports (BLS, NIOSH, STPS), peer-reviewed literature and open corporate reports. Cited under academic fair-use.",
    sourceBls:
      "Bureau of Labor Statistics · Survey of Occupational Injuries and Illnesses (SOII) 2023 · US manufacturing TRIR 3.2 / 100 FTE.",
    sourceNiosh:
      "NIOSH · Work Schedules: Shift Work and Long Work Hours · 2004–2020 reviews · night/rotating shift +30% injury risk vs. day shift.",
    sourceNsc:
      "National Safety Council · Injury Facts 2023 · total annual US cost of workplace injuries $167 B (direct + indirect + productivity loss).",
    sourceMapi:
      "MAPI / Deloitte · 2021 Manufacturing Skills Gap and Future of Work · 40% average annual turnover in US manufacturing post-pandemic.",
    sourceKoenig:
      "Koenig et al. 2016 · HRV biofeedback meta-analysis in clinical populations · d = 0.83 anxiety reduction (large effect).",
    sourceGoessl:
      "Goessl et al. · Psychological Medicine 2017 · meta-analysis d = 0.50 anxiety reduction via HRV biofeedback (n=482). Our 0.35 cap ≈ 70% of observed effect.",
    sourceStps:
      "NOM-035-STPS-2018 · in force since 2019 · mandatory evaluation of psychosocial risk factors at workplaces >15 people. Fines up to 500 UMAs per affected worker.",

    entKicker: "COMPLIANCE & PROCUREMENT · INDUSTRIAL",
    entH: "Everything your legal and procurement team will ask — already answered.",
    entBody:
      "Documented posture for each control. Formal artifacts (OSHA recordkeeping mapping, SOC 2 Type I, DPA, ISO 27001 gap) delivered under NDA via Trust Center.",
    entOsha: "OSHA · recordkeeping-ready",
    entSoc2: "SOC 2 Type I · active posture",
    entNom: "NOM-035 STPS · dashboard + evidence",
    entIso: "ISO 27001 · gap analysis",
    entDpa: "DPA · GDPR Recital 26",
    entNist: "NIST CSF · documented mapping",
    entSso: "SSO · SAML 2.0 + SCIM",
    entSla: "99.9% SLA · plant-grade",
    entFoot: "Individual data is operator-segregated. The EHS Director sees only anonymized aggregates of ≥ 5 people per segment (shift, line, plant).",

    disclaimerH: "Legal note · 30-sec read",
    disclaimer1:
      "Figures are estimates from peer-reviewed public literature and government reports, not guarantees. Actual results depend on implementation, pool size, adherence rate and operational context.",
    disclaimer2:
      "BIO-IGNICIÓN is an HRV-based operational wellbeing tool · it is NOT a medical device, does NOT diagnose, does NOT treat medical conditions, and does NOT replace formal occupational medical evaluation. Complementary to the formal safety and health program only.",
    disclaimer3:
      "The term 'industrial-grade' refers to HRV measurement quality (ECG-validated in literature) and platform operational robustness. It does NOT imply regulatory clearance as a medical device (FDA / COFEPRIS / CE).",
    disclaimer4:
      "'OSHA recordkeeping-ready' means BIO-IGNICIÓN exports are structured to be compatible with OSHA 29 CFR Part 1904 requirements for correlation with the employer's formal recordkeeping. It does NOT imply OSHA certification or replacement of the official Form 300/300A/301.",
    disclaimer5:
      "NOM-035-STPS-2018 requires formal psychosocial risk evaluation by an authorized third party depending on workplace size. BIO-IGNICIÓN provides complementary auditable evidence; it does NOT replace the official evaluation nor the employer's legal responsibility.",

    closingKicker: "NEXT STEP · INDUSTRIAL",
    closingHLead: "Book a demo with industrial assumptions.",
    closingHBody: "A 45-min closing with your EHS Director and VP Operations.",
    closingBody:
      "We bring the assumptions to your real context: operator/technical/admin mix, shifts, heat/noise/physical load, region, applicable regulation (OSHA, STPS, EU-OSHA). The Q2 2026 pilot cohort is limited to 5 plant-grade industrial operators.",
    closingPrimary: "Book demo · plant-grade",
    closingSecondary: "Run ROI with your numbers",
    closingTertiary: "Trust Center · due diligence",
    closingAvail: "Page reviewed",
    closingContact: "manufacturing@bio-ignicion.app",
  },
};

export default async function ForManufacturingPage() {
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
    <PublicShell activePath="/for-manufacturing">
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
              <ul className="bi-roi-meta" aria-label="manufacturing-meta">
                <li><span className="dot" aria-hidden /> {c.metaOsha}</li>
                <li><span className="dot" aria-hidden /> {c.metaNom}</li>
                <li><span className="dot" aria-hidden /> {c.metaHrv}</li>
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
              <span className="v">3.2 / 100</span>
              <span className="l">{c.statTrir}</span>
              <span className="s">{c.statTrirSub}</span>
            </div>
            <div>
              <span className="v">$167 B</span>
              <span className="l">{c.statCost}</span>
              <span className="s">{c.statCostSub}</span>
            </div>
            <div>
              <span className="v">+30%</span>
              <span className="l">{c.statShift}</span>
              <span className="s">{c.statShiftSub}</span>
            </div>
            <div>
              <span className="v">40%</span>
              <span className="l">{c.statTurnover}</span>
              <span className="s">{c.statTurnoverSub}</span>
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
              <div className="src">{c.benchmarkBlsSrc}</div>
              <span className="v">{c.benchmarkBlsV}</span>
              <span className="l">{c.benchmarkBlsL}</span>
            </div>
            <div className="bi-roi-benchmark-cell">
              <div className="src">{c.benchmarkNioshSrc}</div>
              <span className="v">{c.benchmarkNioshV}</span>
              <span className="l">{c.benchmarkNioshL}</span>
            </div>
            <div className="bi-roi-benchmark-cell">
              <div className="src">{c.benchmarkNscSrc}</div>
              <span className="v">{c.benchmarkNscV}</span>
              <span className="l">{c.benchmarkNscL}</span>
            </div>
            <div className="bi-roi-benchmark-cell">
              <div className="src">{c.benchmarkMapiSrc}</div>
              <span className="v">{c.benchmarkMapiV}</span>
              <span className="l">{c.benchmarkMapiL}</span>
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
            <li><span className="bi-roi-source-tag">BLS</span><span>{c.sourceBls}</span></li>
            <li><span className="bi-roi-source-tag">NIOSH</span><span>{c.sourceNiosh}</span></li>
            <li><span className="bi-roi-source-tag">NSC</span><span>{c.sourceNsc}</span></li>
            <li><span className="bi-roi-source-tag">MAPI</span><span>{c.sourceMapi}</span></li>
            <li><span className="bi-roi-source-tag">KOENIG</span><span>{c.sourceKoenig}</span></li>
            <li><span className="bi-roi-source-tag">GOESSL</span><span>{c.sourceGoessl}</span></li>
            <li><span className="bi-roi-source-tag">STPS</span><span>{c.sourceStps}</span></li>
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
            <li className="bi-roi-ent-chip">{c.entOsha}</li>
            <li className="bi-roi-ent-chip">{c.entSoc2}</li>
            <li className="bi-roi-ent-chip">{c.entNom}</li>
            <li className="bi-roi-ent-chip">{c.entIso}</li>
            <li className="bi-roi-ent-chip">{c.entDpa}</li>
            <li className="bi-roi-ent-chip">{c.entNist}</li>
            <li className="bi-roi-ent-chip">{c.entSso}</li>
            <li className="bi-roi-ent-chip">{c.entSla}</li>
          </ul>
          <p className="bi-roi-ent-foot">{c.entFoot}</p>
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
      <section aria-labelledby="mfg-closing" className="bi-demo-closing-section">
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

              <h2 id="mfg-closing" className="bi-demo-closing-h">
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
