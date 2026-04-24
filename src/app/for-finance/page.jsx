/* ═══════════════════════════════════════════════════════════════
   /for-finance — Vertical B2B landing for banks, asset managers,
   trading desks and insurance carriers. Thesis: financial fatigue
   is an operational-risk problem (Basel / SOX / FINRA control
   environment), not a performance line-item.
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
  title: "Para Finanzas · Fatiga financiera es riesgo operativo",
  description:
    "Fat-finger, decisión de riesgo deteriorada y rotación de analistas tienen raíz fisiológica común. BIO-IGNICIÓN aporta control-environment evidence compatible con SOX 404 y FINRA Rule 3110 · 3 min pre-market · SSO + SCIM.",
  alternates: { canonical: "/for-finance" },
  openGraph: {
    title: "BIO-IGNICIÓN · Finance · Fatiga financiera = riesgo operativo",
    description:
      "77% burnout en servicios financieros (Deloitte 2022). 95h/semana junior banker (Goldman 2021). BIO: SOX audit-trail-ready, FINRA supervision-aligned, HRV grado institucional.",
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
    eyebrow: "PARA FINANZAS · BANCA, TRADING, ASSET MGMT & SEGUROS",
    title: "Fatiga financiera no es performance. Es riesgo operativo.",
    editorial:
      "El fat-finger, la decisión de riesgo deteriorada y el churn de analistas viven en el mismo eslabón fisiológico. Se mide en HRV, no en P&L.",
    intro:
      "BIO-IGNICIÓN se instrumenta en los 3 minutos pre-market, entre deals o en el post-close huddle. SOX audit-trail-ready, FINRA supervision-aligned, panel operativo visible al CRO/COO — no al analista de RRHH.",
    metaSoc: "SOC 2 Type I · activo",
    metaSox: "SOX · audit-trail-ready",
    metaFinra: "FINRA supervision-aligned",
    metaShift: "3 min pre-market",

    scarcityLabel: "Q2 2026 · PILOTO TIER-1 · 5 INSTITUCIONES FINANCIERAS",

    statBurnout: "Burnout Gen Z workforce (45% Millennials)",
    statBurnoutSub: "Deloitte Gen Z & Millennial Survey · 2022",
    statHours: "Semana laboral promedio junior banker",
    statHoursSub: "Goldman Sachs internal survey · 2021",
    statStress: "Estrés diario global workforce (récord histórico)",
    statStressSub: "Gallup State of the Global Workplace · 2023",
    statTurnover: "Costo reemplazo analista mid-level",
    statTurnoverSub: "SHRM · 2024",

    benchmarkKicker: "CONTEXTO · DATA PÚBLICA FINANCIERA",
    benchmarkDeloitteSrc: "DELOITTE",
    benchmarkDeloitteV: "46%",
    benchmarkDeloitteL: "Burnout en Gen Z (45% Millennials) por intensidad laboral · Deloitte Gen Z & Millennial Survey 2022 · muestra global multi-sector",
    benchmarkGallupSrc: "GALLUP",
    benchmarkGallupV: "44%",
    benchmarkGallupL: "Estrés diario global workforce · récord histórico empatado con 2021 · State of the Global Workplace Report 2023",
    benchmarkGoldmanSrc: "GOLDMAN",
    benchmarkGoldmanV: "95 h / sem",
    benchmarkGoldmanL: "Semana laboral promedio reportada por analistas junior · Goldman Sachs internal survey 2021 (filtrada, de dominio público)",
    benchmarkShrmSrc: "SHRM",
    benchmarkShrmV: "$50k–$75k",
    benchmarkShrmL: "Costo de reemplazo de un analista mid-level en servicios financieros · SHRM 2024 · compensación + ramp + lost productivity",

    painKicker: "TESIS · POR QUÉ IMPORTA EN TU FIRMA",
    painH: "La fatiga financiera es un leading indicator de riesgo operativo.",
    painBody:
      "P&L, VaR y compliance breaches son lagging — reportan lo que ya pasó. HRV y la fatiga autonómica del trader / analista / PM se detectan semanas antes del mis-trade, el miss en el modelo o la renuncia. BIO interviene en el eslabón temprano porque ahí se corrige el resto.",
    painP1Title: "1. Fisiología antes que P&L",
    painP1Body:
      "El fat-finger, el override emocional del risk limit y la fatiga de decisión son medibles en HRV y cortisol circadiano antes de manifestarse en pérdida. La literatura en neurofinance (Coates & Herbert, PNAS 2008; Kandasamy et al., PNAS 2014) correlaciona cortisol y fatiga autonómica con toma de riesgo deteriorada en trading floor real.",
    painP2Title: "2. Operational risk event = consecuencia de fatiga",
    painP2Body:
      "Basel II/III clasifica 'Employment Practices & Workplace Safety' como una de las 7 loss event type categories de operational risk — con cargo de capital formal bajo SMA. SOX 404 exige documentar el control environment, incluyendo factores humanos. Solvency II Pillar II extiende el mismo principio a carriers. La literatura op-risk pública (ORX news, Basel event databases) documenta pérdidas materiales trazables a errores operativos bajo carga de fatiga. BIO aporta evidencia estructurada para ese control — no lo sustituye.",
    painP3Title: "3. Rotación = pérdida de IP del trader/analista",
    painP3Body:
      "Cada analista senior que se va se lleva 5–10 años de know-how de producto, book de clientes y modelo mental. El reemplazo cuesta $50k–$75k (SHRM 2024) en mid-level; en senior, múltiplos. Reducir rotación 10% en un desk de 40 personas paga varios ciclos de BIO.",
    painP4Title: "4. SOX / FINRA exigen control environment auditable",
    painP4Body:
      "SOX Section 404 requiere evidencia de efectividad de controles internos, incluyendo el entorno de control (people). FINRA Rule 3110 exige razonable sistema de supervisión. BIO aporta evidencia auditable de 'reasonable care' en wellbeing operativo — no sustituye compliance officer ni registración FINRA.",

    fitKicker: "CÓMO ENCAJA · OPERATIVAMENTE",
    fitH: "Se instrumenta en los 3 minutos que ya existen pre-market, entre deals o en close.",
    fitBody:
      "No pedimos tiempo extra al trader o analista. Pedimos 3 minutos estructurados pre-market, entre deals, o en el post-close huddle. El impacto se mide en HRV, no en engagement.",
    fitL1: "Protocolos respiración resonante 3 min (5.5–6 bpm) validados clínicamente · compatibles con pre-market huddle o deal desk · efecto medible en HRV en sesión 1.",
    fitL2: "Dashboard operativo para CRO / COO · agregados anónimos por desk / book / team · segmentos con k ≥ 5 personas · sin exponer datos individuales ni posición de trading.",
    fitL3: "Reportes individuales permanecen privados para el trader/analista · cumple expectativa de confidencialidad equivalente a EAP regulado.",
    fitL4: "SSO SAML 2.0 + SCIM + audit trail · compatible con IdP enterprise (Okta, Ping, Azure AD) · provisioning automático y logging SOX-ready.",
    fitL5: "SOX 404 evidence pack · artifacts de control environment (people-risk) descargables bajo NDA para auditor externo.",
    fitL6: "Exports bajo NDA: SOC 2 Type I, DPA, ISO 27001 gap analysis, FINRA supervision mapping.",

    peerKicker: "COMPARATIVO · QUÉ HAY HOY EN TU FIRMA",
    peerH: "Contra lo que ya tienes instalado.",
    peerBody:
      "Referencias de adopción y alcance típico en bancos de inversión, asset managers >$100B AUM y carriers tier-1. Tu mix varía, pero el patrón es estable.",
    peerColCat: "Categoría",
    peerColCost: "USD / emp / año",
    peerColScope: "Alcance",
    peerRowEapCat: "EAP tradicional financiero",
    peerRowEapCost: "$180",
    peerRowEapScope: "Consejería reactiva · adopción 2–6% en front office · sin instrumentación fisiológica · sin evidencia SOX/FINRA.",
    peerRowWellnessCat: "Wellness corporativo (retos, contenido)",
    peerRowWellnessCost: "$450",
    peerRowWellnessScope: "Gamificación · sin outcome operativo medible · abandono a 90 días · no referenciable ante auditor externo.",
    peerRowWearableCat: "Wearables fragmentados (Oura, Whoop enterprise)",
    peerRowWearableCost: "$280",
    peerRowWearableScope: "Datos individuales sin agregación por desk / book · sin integración con control environment · sin mapping SOX/FINRA.",
    peerRowBioCat: "BIO-IGNICIÓN · Growth",
    peerRowBioCost: "$228",
    peerRowBioScope: "HRV grado institucional · SOX audit-trail-ready · FINRA supervision-aligned · panel CRO/COO · SSO + SCIM.",
    peerCite: "Fuentes: SHRM 2024, KFF Employer Health Benefits 2024, Deloitte 2022. Precio BIO vigente (2026-Q2).",

    sourcesKicker: "FUENTES · LITERATURA FINANCIERA & REGULATORIA",
    sourcesH: "De dónde vienen las cifras.",
    sourcesBody:
      "Todas las cifras provienen de literatura revisada por pares, reportes corporativos abiertos y regulación pública. Citadas bajo fair-use académico.",
    sourceDeloitte:
      "Deloitte Gen Z & Millennial Survey 2022 · 46% de Gen Z y 45% de Millennials reportan burnout por intensidad laboral · muestra global multi-sector.",
    sourceGallup:
      "Gallup · State of the Global Workplace 2023 · 44% de trabajadores globales reportan estrés diario (récord histórico empatado con 2021) · muestra multinacional.",
    sourceCoates:
      "Coates & Herbert 2008 (PNAS) · 'Endogenous steroids and financial risk taking on a London trading floor'; Kandasamy et al. 2014 (PNAS) · 'Cortisol shifts financial risk preferences' · correlación hormonal y autonómica con toma de riesgo en trading real.",
    sourceGoldman:
      "Goldman Sachs internal analyst survey 2021 · semana laboral promedio 95 h en junior bankers · reporte filtrado y de dominio público; citado bajo fair-use.",
    sourceShrm:
      "SHRM · Human Capital Benchmarking Report 2024 · costo promedio de reemplazo de analista mid-level en servicios financieros $50k–$75k (compensación + ramp + lost productivity).",
    sourceSox:
      "Sarbanes-Oxley Act · Section 404 · exige evaluación anual de efectividad de controles internos incluyendo el control environment · aplica a emisores SEC-registered.",
    sourceFinra:
      "FINRA Rule 3110 · exige sistema razonable de supervisión de personas asociadas · evidencia auditable de supervisión es requerida en examen regulatorio.",
    sourceKoenig:
      "Koenig et al. 2016 · meta-análisis HRV biofeedback en población clínica · d = 0.83 reducción ansiedad (efecto grande).",
    sourceGoessl:
      "Goessl et al. · Psychological Medicine 2017 · meta-análisis d = 0.50 reducción ansiedad con HRV biofeedback (n=482). Nuestro cap 0.35 ≈ 70% del observado.",

    entKicker: "COMPLIANCE & PROCUREMENT · FINANCIERO",
    entH: "Lo que tu equipo legal, compliance y procurement va a pedir — ya está respondido.",
    entBody:
      "Postura documentada para cada control. Artefactos formales (SOC 2 Type I, DPA, ISO 27001 gap, SOX 404 people-risk mapping, FINRA Rule 3110 alignment) entregados bajo NDA vía Trust Center.",
    entSoc2: "SOC 2 Type I · postura activa",
    entSox: "SOX 404 · audit-trail-ready",
    entFinra: "FINRA Rule 3110 · supervision-aligned",
    entIso: "ISO 27001 · gap analysis",
    entDpa: "DPA · GDPR Recital 26",
    entNist: "NIST CSF · mapping documentado",
    entSso: "SSO · SAML 2.0 + SCIM",
    entSla: "99.9% SLA · tier-1-grade",
    entFoot: "Datos individuales segregados por persona asociada. CRO / COO solo ve agregados anonimizados ≥ 5 personas por segmento (desk, book, team). Posición de trading nunca se toca.",
    entJurisdictions: "Cobertura jurisdiccional · EU: MiFID II Art. 16 · Solvency II Pillar II · UK: FCA SYSC 3 · US: SOX 404 · FINRA Rule 3110 · MX: CNBV Circular Única de Bancos · DE: BaFin MaRisk · SG: MAS Risk Management Guidelines.",

    disclaimerH: "Nota legal · lectura en 30 s",
    disclaimer1:
      "Las cifras son estimaciones a partir de literatura pública revisada por pares, reportes corporativos y regulación, no garantías. Los resultados reales dependen de implementación, tamaño del pool, tasa de adherencia y contexto institucional.",
    disclaimer2:
      "BIO-IGNICIÓN es una herramienta de bienestar operativo basada en HRV · NO es dispositivo médico, NO diagnostica, NO trata condiciones médicas, NO sustituye evaluación clínica. Complementario al EAP formal de la firma.",
    disclaimer3:
      "El término 'grado institucional' se refiere a la calidad de medición HRV (validación frente a ECG en literatura) y a la robustez operativa y auditable de la plataforma. NO implica autorización regulatoria como dispositivo médico (FDA / COFEPRIS / CE).",
    disclaimer4:
      "'SOX audit-trail-ready' significa que los exportes y logs de BIO-IGNICIÓN están estructurados de forma compatible con evidencia de control environment bajo Sarbanes-Oxley Section 404. NO implica certificación SOX, atestación ISAE/SSAE ni reemplazo del auditor externo o del SOX program office.",
    disclaimer5:
      "'FINRA supervision-aligned' significa que el diseño de supervisión y logging de BIO-IGNICIÓN es compatible con obligaciones bajo FINRA Rule 3110. NO sustituye al compliance officer, CCO, ni a la registración FINRA correspondiente. Aplicable únicamente a firmas registradas en FINRA / SEC en jurisdicciones donde la regla aplica.",

    closingKicker: "PRÓXIMO PASO · FINANCIERO",
    closingHLead: "Agenda con supuestos de mesa.",
    closingHBody: "Un cierre de 45 min con tu CRO, COO y compliance.",
    closingBody:
      "Llevamos los supuestos a tu contexto real: front / middle / back office, horarios de mesa, jurisdicciones (SEC, FCA, CNBV, FINMA, BaFin, MAS), regulatorio aplicable (SOX, FINRA, Basel III, MiFID II, Solvency II). El cohorte piloto Q2 2026 está limitado a 5 instituciones financieras tier-1 (banca, asset mgmt, seguros).",
    closingPrimary: "Agenda demo · tier-1",
    closingSecondary: "Ver ROI con tus números",
    closingTertiary: "Trust Center · due diligence",
    closingAvail: "Página revisada",
    closingContact: "finance@bio-ignicion.app",
  },
  en: {
    eyebrow: "FOR FINANCE · BANKING, TRADING, ASSET MGMT & INSURANCE",
    title: "Financial fatigue isn't performance. It's operational risk.",
    editorial:
      "The fat-finger, the degraded risk decision and analyst churn live on the same physiological link. It's measured in HRV, not P&L.",
    intro:
      "BIO-IGNICIÓN instruments the 3 minutes that already exist pre-market, between deals or in the post-close huddle. SOX audit-trail-ready, FINRA supervision-aligned, operating dashboard visible to the CRO/COO — not to the HR analyst.",
    metaSoc: "SOC 2 Type I · active",
    metaSox: "SOX · audit-trail-ready",
    metaFinra: "FINRA supervision-aligned",
    metaShift: "3 min pre-market",

    scarcityLabel: "Q2 2026 · TIER-1 PILOT · 5 FINANCIAL INSTITUTIONS",

    statBurnout: "Burnout in Gen Z workforce (45% Millennials)",
    statBurnoutSub: "Deloitte Gen Z & Millennial Survey · 2022",
    statHours: "Average junior-banker work week",
    statHoursSub: "Goldman Sachs internal survey · 2021",
    statStress: "Daily stress in global workforce (record high)",
    statStressSub: "Gallup State of the Global Workplace · 2023",
    statTurnover: "Cost to replace a mid-level analyst",
    statTurnoverSub: "SHRM · 2024",

    benchmarkKicker: "CONTEXT · PUBLIC FINANCIAL DATA",
    benchmarkDeloitteSrc: "DELOITTE",
    benchmarkDeloitteV: "46%",
    benchmarkDeloitteL: "Burnout in Gen Z (45% Millennials) from work intensity · Deloitte Gen Z & Millennial Survey 2022 · global multi-sector sample",
    benchmarkGallupSrc: "GALLUP",
    benchmarkGallupV: "44%",
    benchmarkGallupL: "Daily stress in global workforce · record high tied with 2021 · State of the Global Workplace Report 2023",
    benchmarkGoldmanSrc: "GOLDMAN",
    benchmarkGoldmanV: "95 h / wk",
    benchmarkGoldmanL: "Average work week reported by junior analysts · Goldman Sachs internal survey 2021 (leaked, in the public domain)",
    benchmarkShrmSrc: "SHRM",
    benchmarkShrmV: "$50k–$75k",
    benchmarkShrmL: "Cost of replacing a mid-level analyst in financial services · SHRM 2024 · compensation + ramp + lost productivity",

    painKicker: "THESIS · WHY IT MATTERS AT YOUR FIRM",
    painH: "Financial fatigue is a leading indicator for operational risk.",
    painBody:
      "P&L, VaR and compliance breaches are lagging — they report what already happened. HRV and autonomic fatigue in the trader / analyst / PM are detectable weeks before the mis-trade, the model miss or the resignation. BIO intervenes at the early link because that's where the rest is fixed.",
    painP1Title: "1. Physiology before P&L",
    painP1Body:
      "The fat-finger, the emotional override of a risk limit and decision fatigue are measurable in HRV and circadian cortisol before they materialize in loss. Neurofinance literature (Coates & Herbert, PNAS 2008; Kandasamy et al., PNAS 2014) correlates cortisol and autonomic fatigue with degraded risk-taking on a real trading floor.",
    painP2Title: "2. Operational risk event = fatigue consequence",
    painP2Body:
      "Basel II/III classifies 'Employment Practices & Workplace Safety' as one of operational risk's 7 loss event type categories — carrying a formal capital charge under SMA. SOX 404 requires documenting the control environment including human factors. Solvency II Pillar II extends the same principle to insurance carriers. Public op-risk literature (ORX news, Basel event databases) documents material losses traceable to operational errors under fatigue load. BIO provides structured evidence for that control — not a replacement.",
    painP3Title: "3. Turnover = loss of trader/analyst IP",
    painP3Body:
      "Every senior analyst who leaves takes 5–10 years of product know-how, client book and mental model with them. Mid-level replacement cost is $50k–$75k (SHRM 2024); at senior, multiples of that. A 10% turnover reduction at a 40-person desk pays for several BIO cycles.",
    painP4Title: "4. SOX / FINRA require an auditable control environment",
    painP4Body:
      "SOX Section 404 requires evidence of the effectiveness of internal controls, including the control environment (people). FINRA Rule 3110 requires a reasonable system of supervision. BIO provides auditable evidence of 'reasonable care' in operational wellbeing — it does not replace the compliance officer or FINRA registration.",

    fitKicker: "HOW IT FITS · OPERATIONALLY",
    fitH: "It instruments the 3 minutes that already exist pre-market, between deals or at close.",
    fitBody:
      "We don't ask the trader or analyst for extra time. We ask for 3 structured minutes pre-market, between deals, or in the post-close huddle. Impact is measured in HRV, not engagement.",
    fitL1: "Clinically-validated 3-min resonant-breathing protocols (5.5–6 bpm) · compatible with pre-market huddle or deal desk · measurable HRV effect from session 1.",
    fitL2: "Operating dashboard for CRO / COO · anonymized aggregates by desk / book / team · segments with k ≥ 5 people · no individual exposure and never touches trading position.",
    fitL3: "Individual reports stay private to the trader/analyst · matches regulated-EAP confidentiality expectation.",
    fitL4: "SSO SAML 2.0 + SCIM + audit trail · compatible with enterprise IdPs (Okta, Ping, Azure AD) · automated provisioning and SOX-ready logging.",
    fitL5: "SOX 404 evidence pack · control-environment artifacts (people-risk) downloadable under NDA for external auditor.",
    fitL6: "Under-NDA exports: SOC 2 Type I, DPA, ISO 27001 gap analysis, FINRA supervision mapping.",

    peerKicker: "COMPARISON · WHAT'S ALREADY INSTALLED",
    peerH: "Against what your firm already has.",
    peerBody:
      "Reference adoption and scope at investment banks, asset managers >$100B AUM and tier-1 carriers. Your mix varies, but the pattern is stable.",
    peerColCat: "Category",
    peerColCost: "USD / emp / yr",
    peerColScope: "Scope",
    peerRowEapCat: "Traditional financial EAP",
    peerRowEapCost: "$180",
    peerRowEapScope: "Reactive counseling · 2–6% front-office adoption · no physiological instrumentation · no SOX/FINRA evidence.",
    peerRowWellnessCat: "Corporate wellness (challenges, content)",
    peerRowWellnessCost: "$450",
    peerRowWellnessScope: "Gamification · no measurable operational outcome · 90-day drop-off · not auditor-ready.",
    peerRowWearableCat: "Fragmented wearables (Oura, Whoop enterprise)",
    peerRowWearableCost: "$280",
    peerRowWearableScope: "Individual data without desk/book aggregation · no control-environment integration · no SOX/FINRA mapping.",
    peerRowBioCat: "BIO-IGNICIÓN · Growth",
    peerRowBioCost: "$228",
    peerRowBioScope: "Institutional-grade HRV · SOX audit-trail-ready · FINRA supervision-aligned · CRO/COO dashboard · SSO + SCIM.",
    peerCite: "Sources: SHRM 2024, KFF Employer Health Benefits 2024, Deloitte 2022. BIO pricing current (2026-Q2).",

    sourcesKicker: "SOURCES · FINANCIAL & REGULATORY LITERATURE",
    sourcesH: "Where the figures come from.",
    sourcesBody:
      "All figures come from peer-reviewed literature, open corporate reports and public regulation. Cited under academic fair-use.",
    sourceDeloitte:
      "Deloitte Gen Z & Millennial Survey 2022 · 46% of Gen Z and 45% of Millennials report burnout from work intensity · global multi-sector sample.",
    sourceGallup:
      "Gallup · State of the Global Workplace 2023 · 44% of global workers report daily stress (record high tied with 2021) · multinational sample.",
    sourceCoates:
      "Coates & Herbert 2008 (PNAS) · 'Endogenous steroids and financial risk taking on a London trading floor'; Kandasamy et al. 2014 (PNAS) · 'Cortisol shifts financial risk preferences' · hormonal and autonomic correlates of risk-taking on a real trading floor.",
    sourceGoldman:
      "Goldman Sachs internal analyst survey 2021 · 95 h average work week in junior bankers · leaked report in the public domain; cited under fair-use.",
    sourceShrm:
      "SHRM · Human Capital Benchmarking Report 2024 · average cost of replacing a mid-level financial-services analyst $50k–$75k (compensation + ramp + lost productivity).",
    sourceSox:
      "Sarbanes-Oxley Act · Section 404 · requires annual assessment of internal-control effectiveness including the control environment · applies to SEC-registered issuers.",
    sourceFinra:
      "FINRA Rule 3110 · requires a reasonable system of supervision of associated persons · auditable evidence of supervision is required at regulatory exam.",
    sourceKoenig:
      "Koenig et al. 2016 · HRV biofeedback meta-analysis in clinical populations · d = 0.83 anxiety reduction (large effect).",
    sourceGoessl:
      "Goessl et al. · Psychological Medicine 2017 · meta-analysis d = 0.50 anxiety reduction via HRV biofeedback (n=482). Our 0.35 cap ≈ 70% of observed effect.",

    entKicker: "COMPLIANCE & PROCUREMENT · FINANCIAL",
    entH: "Everything your legal, compliance and procurement team will ask — already answered.",
    entBody:
      "Documented posture for each control. Formal artifacts (SOC 2 Type I, DPA, ISO 27001 gap, SOX 404 people-risk mapping, FINRA Rule 3110 alignment) delivered under NDA via Trust Center.",
    entSoc2: "SOC 2 Type I · active posture",
    entSox: "SOX 404 · audit-trail-ready",
    entFinra: "FINRA Rule 3110 · supervision-aligned",
    entIso: "ISO 27001 · gap analysis",
    entDpa: "DPA · GDPR Recital 26",
    entNist: "NIST CSF · documented mapping",
    entSso: "SSO · SAML 2.0 + SCIM",
    entSla: "99.9% SLA · tier-1-grade",
    entFoot: "Individual data is segregated per associated person. The CRO / COO sees only anonymized aggregates of ≥ 5 people per segment (desk, book, team). Trading position is never touched.",
    entJurisdictions: "Jurisdictional coverage · EU: MiFID II Art. 16 · Solvency II Pillar II · UK: FCA SYSC 3 · US: SOX 404 · FINRA Rule 3110 · MX: CNBV Circular Única de Bancos · DE: BaFin MaRisk · SG: MAS Risk Management Guidelines.",

    disclaimerH: "Legal note · 30-sec read",
    disclaimer1:
      "Figures are estimates from peer-reviewed public literature, corporate reports and regulation — not guarantees. Actual results depend on implementation, pool size, adherence rate and institutional context.",
    disclaimer2:
      "BIO-IGNICIÓN is an HRV-based operational wellbeing tool · it is NOT a medical device, does NOT diagnose, does NOT treat medical conditions, and does NOT replace clinical evaluation. Complementary to the firm's formal EAP only.",
    disclaimer3:
      "The term 'institutional-grade' refers to HRV measurement quality (ECG-validated in literature) and platform operational/auditable robustness. It does NOT imply regulatory clearance as a medical device (FDA / COFEPRIS / CE).",
    disclaimer4:
      "'SOX audit-trail-ready' means BIO-IGNICIÓN exports and logs are structured to be compatible with control-environment evidence under Sarbanes-Oxley Section 404. It does NOT imply SOX certification, ISAE/SSAE attestation, nor replacement of the external auditor or the SOX program office.",
    disclaimer5:
      "'FINRA supervision-aligned' means BIO-IGNICIÓN's supervision and logging design is compatible with obligations under FINRA Rule 3110. It does NOT replace the compliance officer, the CCO, or the firm's FINRA registration. Only applicable to FINRA/SEC-registered firms in jurisdictions where the rule applies.",

    closingKicker: "NEXT STEP · FINANCIAL",
    closingHLead: "Book a demo with desk assumptions.",
    closingHBody: "A 45-min closing with your CRO, COO and compliance.",
    closingBody:
      "We bring the assumptions to your real context: front / middle / back office, desk hours, jurisdictions (SEC, FCA, CNBV, FINMA, BaFin, MAS), applicable regulation (SOX, FINRA, Basel III, MiFID II, Solvency II). The Q2 2026 pilot cohort is limited to 5 tier-1 financial institutions (banking, asset mgmt, insurance).",
    closingPrimary: "Book demo · tier-1",
    closingSecondary: "Run ROI with your numbers",
    closingTertiary: "Trust Center · due diligence",
    closingAvail: "Page reviewed",
    closingContact: "finance@bio-ignicion.app",
  },
};

export default async function ForFinancePage() {
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
    <PublicShell activePath="/for-finance">
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
              <ul className="bi-roi-meta" aria-label="finance-meta">
                <li><span className="dot" aria-hidden /> {c.metaSoc}</li>
                <li><span className="dot" aria-hidden /> {c.metaSox}</li>
                <li><span className="dot" aria-hidden /> {c.metaFinra}</li>
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
              <span className="v">46%</span>
              <span className="l">{c.statBurnout}</span>
              <span className="s">{c.statBurnoutSub}</span>
            </div>
            <div>
              <span className="v">95 h</span>
              <span className="l">{c.statHours}</span>
              <span className="s">{c.statHoursSub}</span>
            </div>
            <div>
              <span className="v">44%</span>
              <span className="l">{c.statStress}</span>
              <span className="s">{c.statStressSub}</span>
            </div>
            <div>
              <span className="v">$50k–$75k</span>
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
              <div className="src">{c.benchmarkDeloitteSrc}</div>
              <span className="v">{c.benchmarkDeloitteV}</span>
              <span className="l">{c.benchmarkDeloitteL}</span>
            </div>
            <div className="bi-roi-benchmark-cell">
              <div className="src">{c.benchmarkGallupSrc}</div>
              <span className="v">{c.benchmarkGallupV}</span>
              <span className="l">{c.benchmarkGallupL}</span>
            </div>
            <div className="bi-roi-benchmark-cell">
              <div className="src">{c.benchmarkGoldmanSrc}</div>
              <span className="v">{c.benchmarkGoldmanV}</span>
              <span className="l">{c.benchmarkGoldmanL}</span>
            </div>
            <div className="bi-roi-benchmark-cell">
              <div className="src">{c.benchmarkShrmSrc}</div>
              <span className="v">{c.benchmarkShrmV}</span>
              <span className="l">{c.benchmarkShrmL}</span>
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
            <li><span className="bi-roi-source-tag">DELOITTE</span><span>{c.sourceDeloitte}</span></li>
            <li><span className="bi-roi-source-tag">GALLUP</span><span>{c.sourceGallup}</span></li>
            <li><span className="bi-roi-source-tag">GOLDMAN</span><span>{c.sourceGoldman}</span></li>
            <li><span className="bi-roi-source-tag">SHRM</span><span>{c.sourceShrm}</span></li>
            <li><span className="bi-roi-source-tag">SOX</span><span>{c.sourceSox}</span></li>
            <li><span className="bi-roi-source-tag">FINRA</span><span>{c.sourceFinra}</span></li>
            <li><span className="bi-roi-source-tag">PNAS</span><span>{c.sourceCoates}</span></li>
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
            <li className="bi-roi-ent-chip">{c.entSox}</li>
            <li className="bi-roi-ent-chip">{c.entFinra}</li>
            <li className="bi-roi-ent-chip">{c.entIso}</li>
            <li className="bi-roi-ent-chip">{c.entDpa}</li>
            <li className="bi-roi-ent-chip">{c.entNist}</li>
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
      <section aria-labelledby="fin-closing" className="bi-demo-closing-section">
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

              <h2 id="fin-closing" className="bi-demo-closing-h">
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
