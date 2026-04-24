/* ═══════════════════════════════════════════════════════════════
   /for-healthcare — Vertical B2B landing for hospitals, clinical
   groups, and provider organizations. Thesis: clinician burnout is
   a patient-safety and liability problem, not a wellness line-item.
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
  title: "Para Healthcare · Burnout clínico es seguridad del paciente",
  description:
    "Burnout, rotación y errores por fatiga en personal clínico tienen raíz fisiológica común. BIO-IGNICIÓN se instrumenta en los 3 minutos entre turnos · HIPAA BAA-ready · NOM-035 SALUD · HRV grado clínico.",
  alternates: { canonical: "/for-healthcare" },
  openGraph: {
    title: "BIO-IGNICIÓN · Healthcare · Burnout clínico = seguridad del paciente",
    description:
      "62.8% burnout médico (AMA 2023). Turnover de médico $500k–$1M. BIO-IGNICIÓN: HIPAA BAA-ready, HRV grado clínico, 3 min entre turnos.",
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
    eyebrow: "PARA HEALTHCARE · PERSONAL CLÍNICO",
    title: "Burnout clínico no es wellness. Es seguridad del paciente.",
    editorial:
      "62.8% de médicos reportan burnout. La fatiga operativa no se corrige con contenido — se mide en la fisiología.",
    intro:
      "BIO-IGNICIÓN se instrumenta en los 3 minutos que ya existen entre turnos. HIPAA BAA-ready, HRV de grado clínico, panel operativo visible al director médico — no al analista de RRHH.",
    metaHipaa: "HIPAA BAA-ready",
    metaNom: "NOM-035 SALUD",
    metaHrv: "HRV grado clínico",
    metaShift: "3 min entre turnos",

    scarcityLabel: "Q2 2026 · PILOTO HOSPITAL-GRADE · 5 INSTITUCIONES",

    statBurnout: "Burnout médico",
    statBurnoutSub: "AMA · 2023",
    statTurnoverMd: "Costo rotación médico",
    statTurnoverMdSub: "AHA / MGMA",
    statNurseLeave: "Enfermeras que planean dejar",
    statNurseLeaveSub: "NNU · 2023",
    statNurseCost: "Costo rotación RN",
    statNurseCostSub: "NSI Nursing Solutions 2024",

    benchmarkKicker: "CONTEXTO · DATA PÚBLICA CLÍNICA",
    benchmarkAmaSrc: "AMA",
    benchmarkAmaV: "62.8%",
    benchmarkAmaL: "Prevalencia burnout médico post-pandemia · AMA & Mayo Clinic Proc. 2023 (Shanafelt et al.)",
    benchmarkJamaSrc: "JAMA",
    benchmarkJamaV: "d = 0.83",
    benchmarkJamaL: "Reducción ansiedad con HRV biofeedback en población clínica · Koenig et al., meta-análisis 2016",
    benchmarkNamSrc: "NAM",
    benchmarkNamV: "$4.6 B / año",
    benchmarkNamL: "Costo anual US de rotación médica atribuible a burnout · National Academy of Medicine 2019",
    benchmarkNsiSrc: "NSI",
    benchmarkNsiV: "$52,350",
    benchmarkNsiL: "Costo promedio por rotación de enfermera RN · NSI Nursing Solutions Report 2024",

    painKicker: "TESIS · POR QUÉ IMPORTA EN TU HOSPITAL",
    painH: "El burnout clínico es una cadena de costo cuantificable.",
    painBody:
      "No es un ítem de bienestar — es un eslabón directo entre fisiología del personal, errores médicos, rotación y liability. BIO interviene en el primer eslabón porque corrige ahí el resto.",
    painP1Title: "1. Fisiología antes que sentimientos",
    painP1Body:
      "El burnout es fatiga crónica del sistema autónomo, medible en HRV y cortisol circadiano. Los cuestionarios MBI lo detectan tarde; la variabilidad cardíaca lo detecta semanas antes.",
    painP2Title: "2. Error clínico como consecuencia de fatiga",
    painP2Body:
      "Literatura (JAMA Internal Medicine, NEJM) vincula turnos extendidos y fatiga acumulada con aumento medible de errores de diagnóstico, medicación y procedimiento. La liability asociada ya está presupuestada; prevenirla no.",
    painP3Title: "3. Rotación = pérdida de know-how institucional",
    painP3Body:
      "Cada médico que se va se lleva 5–15 años de formación pagada por el hospital. El reemplazo cuesta entre $500k y $1M (AHA/MGMA). Reducir rotación en 10% paga varios ciclos de BIO.",
    painP4Title: "4. Ratios enfermera-paciente bajo presión",
    painP4Body:
      "40% de enfermeras declaran intención de dejar la profesión en 5 años (NNU 2023). El costo por RN reemplazada es $46k–$62k (NSI 2024). El problema no es reclutar más — es retener mejor.",

    fitKicker: "CÓMO ENCAJA · OPERATIVAMENTE",
    fitH: "Se instrumenta en los 3 minutos que ya existen entre turnos.",
    fitBody:
      "No pedimos al personal clínico una hora extra. Pedimos 3 minutos estructurados entre cambio de guardia, huddle o pausa entre pacientes. El impacto se mide en HRV, no en engagement.",
    fitL1: "Protocolos respiración resonante 3 min (5.5–6 bpm) validados clínicamente · efecto medible en HRV en sesión 1.",
    fitL2: "Dashboard operativo para jefatura clínica · agregados anónimos por servicio / turno / especialidad · sin exponer datos individuales.",
    fitL3: "Individual reports permanecen privados para el clínico · cumple expectativa de confidencialidad equivalente a EAP.",
    fitL4: "Integración SSO SAML 2.0 · compatible con IdP hospitalarios (Okta, Ping, Azure AD) · sin cuentas paralelas.",
    fitL5: "NOM-035 SALUD dashboard · evidencia descargable para STPS y auditores terceros · incluida en plan Growth.",
    fitL6: "Exports bajo NDA: SOC 2 Type I posture, HIPAA BAA, DPA, ISO 27001 gap analysis.",

    peerKicker: "COMPARATIVO · QUÉ HAY HOY EN TU HOSPITAL",
    peerH: "Contra lo que ya tienes instalado.",
    peerBody:
      "Referencias de adopción y alcance típico en hospitales de >500 camas. Tu mix varía, pero el patrón es estable.",
    peerColCat: "Categoría",
    peerColCost: "USD / emp / año",
    peerColScope: "Alcance",
    peerRowEapCat: "EAP tradicional hospital",
    peerRowEapCost: "$180",
    peerRowEapScope: "Consejería reactiva · adopción clínica 2–6% · sin instrumentación fisiológica.",
    peerRowWellnessCat: "Wellness corporativo (retos, contenido)",
    peerRowWellnessCost: "$450",
    peerRowWellnessScope: "Gamificación · sin outcome clínico medible · abandono a 90 días.",
    peerRowWearableCat: "Wearables fragmentados (Fitbit, Oura)",
    peerRowWearableCost: "$280",
    peerRowWearableScope: "Datos individuales sin agregación institucional · sin integración HIS.",
    peerRowBioCat: "BIO-IGNICIÓN · Growth",
    peerRowBioCost: "$228",
    peerRowBioScope: "HRV clínico · NOM-035 SALUD · panel operativo · HIPAA BAA-ready.",
    peerCite: "Fuentes: SHRM 2024, KFF Employer Health Benefits 2024, NSI 2024. Precio BIO vigente (2026-Q2).",

    sourcesKicker: "FUENTES · LITERATURA CLÍNICA",
    sourcesH: "De dónde vienen las cifras.",
    sourcesBody:
      "Todas las cifras provienen de literatura revisada por pares y reportes corporativos abiertos. Citadas bajo fair-use académico.",
    sourceAma:
      "AMA & Mayo Clinic Proceedings 2023 (Shanafelt et al.) · prevalencia burnout médico 62.8% post-pandemia · muestra nacional US.",
    sourceNam:
      "National Academy of Medicine 2019 · Taking Action Against Clinician Burnout · costo US $4.6 B/año atribuible a rotación médica.",
    sourceNsi:
      "NSI Nursing Solutions 2024 · National Health Care Retention Report · costo promedio rotación RN $52,350; bedside turnover 27% en primer año.",
    sourceJama:
      "JAMA Internal Medicine / NEJM · correlación fatiga clínica ↔ error médico (diagnóstico, medicación, procedimiento) · múltiples estudios 2014–2023.",
    sourceKoenig:
      "Koenig et al. 2016 · meta-análisis HRV biofeedback en población clínica · d = 0.83 reducción ansiedad (efecto grande).",
    sourceGoessl:
      "Goessl et al. · Psychological Medicine 2017 · meta-análisis d = 0.50 reducción ansiedad con HRV biofeedback (n=482). Nuestro cap 0.35 ≈ 70% del observado.",
    sourceStps:
      "NOM-035 STPS · vigente 2019+ · evaluación psicosocial obligatoria centros laborales México, incluyendo hospitales y clínicas sin excepción.",

    entKicker: "COMPLIANCE & PROCUREMENT · CLÍNICO",
    entH: "Lo que tu equipo legal y procurement va a pedir — ya está respondido.",
    entBody:
      "Postura documentada para cada control. Artefactos formales (HIPAA BAA, SOC 2 Type I, DPA, ISO 27001 gap) entregados bajo NDA vía Trust Center.",
    entHipaa: "HIPAA · BAA-ready",
    entSoc2: "SOC 2 Type I · postura activa",
    entNom: "NOM-035 SALUD · dashboard + evidencia",
    entIso: "ISO 27001 · gap analysis",
    entDpa: "DPA · GDPR Recital 26",
    entNist: "NIST CSF · mapping documentado",
    entSso: "SSO · SAML 2.0 + OIDC",
    entSla: "99.9% SLA · hospital-grade",
    entFoot: "Datos individuales segregados por clínico. Director médico solo ve agregados anonimizados ≥ 5 personas por segmento.",

    disclaimerH: "Nota legal · lectura en 30 s",
    disclaimer1:
      "Las cifras son estimaciones a partir de literatura pública revisada por pares, no garantías. Los resultados reales dependen de implementación, tamaño del pool, tasa de adherencia y contexto institucional.",
    disclaimer2:
      "BIO-IGNICIÓN es una herramienta de bienestar operativo basada en HRV · NO es dispositivo médico, NO diagnostica, NO trata condiciones médicas, NO sustituye consulta clínica. Uso complementario al cuidado formal.",
    disclaimer3:
      "El término 'grado clínico' se refiere a la calidad de medición HRV (validación frente a ECG en literatura) y no implica autorización regulatoria como dispositivo médico (FDA / COFEPRIS / CE).",
    disclaimer4:
      "HIPAA BAA-ready significa que BIO-IGNICIÓN firma Business Associate Agreement con entidades cubiertas bajo plan Enterprise; no implica certificación HIPAA ni auditoría OCR automática.",
    disclaimer5:
      "Marcas de terceros (AMA, Mayo Clinic, NEJM, JAMA, NAM, NSI, Epic, Cerner, Okta, Ping) se citan bajo fair-use académico. Propiedad de sus respectivos titulares; inclusión no implica endoso ni partnership formal.",

    closingKicker: "PRÓXIMO PASO · CLÍNICO",
    closingHLead: "Agenda con supuestos hospitalarios.",
    closingHBody: "Un cierre de 45 min con tu director médico y procurement.",
    closingBody:
      "Llevamos los supuestos a tu contexto real: mix médico/enfermería/administrativo, turnos, región, regulatorio aplicable. El cohorte piloto Q2 2026 está limitado a 5 instituciones hospital-grade.",
    closingPrimary: "Agenda demo · hospital-grade",
    closingSecondary: "Ver ROI con tus números",
    closingTertiary: "Trust Center · due diligence",
    closingAvail: "Página revisada",
    closingContact: "healthcare@bio-ignicion.app",
  },
  en: {
    eyebrow: "FOR HEALTHCARE · CLINICAL STAFF",
    title: "Clinician burnout isn't wellness. It's patient safety.",
    editorial:
      "62.8% of physicians report burnout. Operational fatigue isn't fixed with content — it's measured in physiology.",
    intro:
      "BIO-IGNICIÓN instruments the 3 minutes that already exist between shifts. HIPAA BAA-ready, clinical-grade HRV, operating dashboard visible to the Chief Medical Officer — not to the HR analyst.",
    metaHipaa: "HIPAA BAA-ready",
    metaNom: "NOM-035 SALUD",
    metaHrv: "Clinical-grade HRV",
    metaShift: "3 min between shifts",

    scarcityLabel: "Q2 2026 · HOSPITAL-GRADE PILOT · 5 INSTITUTIONS",

    statBurnout: "Physician burnout",
    statBurnoutSub: "AMA · 2023",
    statTurnoverMd: "Cost per physician turnover",
    statTurnoverMdSub: "AHA / MGMA",
    statNurseLeave: "Nurses planning to leave",
    statNurseLeaveSub: "NNU · 2023",
    statNurseCost: "Cost per RN turnover",
    statNurseCostSub: "NSI Nursing Solutions 2024",

    benchmarkKicker: "CONTEXT · PUBLIC CLINICAL DATA",
    benchmarkAmaSrc: "AMA",
    benchmarkAmaV: "62.8%",
    benchmarkAmaL: "Post-pandemic physician burnout prevalence · AMA & Mayo Clinic Proc. 2023 (Shanafelt et al.)",
    benchmarkJamaSrc: "META",
    benchmarkJamaV: "d = 0.83",
    benchmarkJamaL: "Anxiety reduction via HRV biofeedback in clinical populations · Koenig et al., 2016 meta-analysis",
    benchmarkNamSrc: "NAM",
    benchmarkNamV: "$4.6 B / yr",
    benchmarkNamL: "US annual cost of physician turnover attributable to burnout · National Academy of Medicine 2019",
    benchmarkNsiSrc: "NSI",
    benchmarkNsiV: "$52,350",
    benchmarkNsiL: "Average cost of a single RN turnover · NSI Nursing Solutions Report 2024",

    painKicker: "THESIS · WHY IT MATTERS AT YOUR HOSPITAL",
    painH: "Clinician burnout is a quantifiable cost chain.",
    painBody:
      "It isn't a wellness line-item — it's a direct chain from staff physiology to medical error, turnover and liability. BIO intervenes at the first link because fixing it fixes the rest.",
    painP1Title: "1. Physiology before feelings",
    painP1Body:
      "Burnout is chronic autonomic fatigue, measurable in HRV and circadian cortisol. MBI questionnaires catch it late; heart-rate variability catches it weeks earlier.",
    painP2Title: "2. Clinical error as a fatigue consequence",
    painP2Body:
      "Literature (JAMA Internal Medicine, NEJM) ties extended shifts and accumulated fatigue to measurable increases in diagnostic, medication and procedural errors. The liability is already budgeted; preventing it isn't.",
    painP3Title: "3. Turnover = loss of institutional know-how",
    painP3Body:
      "Every physician who leaves takes 5–15 years of hospital-paid training with them. Replacement costs $500k–$1M (AHA/MGMA). A 10% turnover reduction pays for several BIO cycles.",
    painP4Title: "4. Nurse-to-patient ratios under pressure",
    painP4Body:
      "40% of nurses report intent to leave the profession within 5 years (NNU 2023). Cost per RN replaced is $46k–$62k (NSI 2024). The problem isn't recruiting more — it's retaining better.",

    fitKicker: "HOW IT FITS · OPERATIONALLY",
    fitH: "It instruments the 3 minutes that already exist between shifts.",
    fitBody:
      "We don't ask clinical staff for an extra hour. We ask for 3 structured minutes during handoff, huddle or between-patient pause. Impact is measured in HRV, not engagement.",
    fitL1: "Clinically-validated 3-min resonant-breathing protocols (5.5–6 bpm) · measurable HRV effect from session 1.",
    fitL2: "Operating dashboard for clinical leadership · anonymized aggregates by service / shift / specialty · no individual exposure.",
    fitL3: "Individual reports stay private to the clinician · matches EAP-equivalent confidentiality expectation.",
    fitL4: "SSO SAML 2.0 integration · compatible with hospital IdPs (Okta, Ping, Azure AD) · no parallel accounts.",
    fitL5: "NOM-035 SALUD dashboard · downloadable evidence for STPS and third-party auditors · included in Growth plan.",
    fitL6: "Under-NDA exports: SOC 2 Type I posture, HIPAA BAA, DPA, ISO 27001 gap analysis.",

    peerKicker: "COMPARISON · WHAT'S ALREADY INSTALLED",
    peerH: "Against what your hospital already has.",
    peerBody:
      "Reference adoption and scope at >500-bed hospitals. Your mix varies, but the pattern is stable.",
    peerColCat: "Category",
    peerColCost: "USD / emp / yr",
    peerColScope: "Scope",
    peerRowEapCat: "Traditional hospital EAP",
    peerRowEapCost: "$180",
    peerRowEapScope: "Reactive counseling · 2–6% clinical adoption · no physiological instrumentation.",
    peerRowWellnessCat: "Corporate wellness (challenges, content)",
    peerRowWellnessCost: "$450",
    peerRowWellnessScope: "Gamification · no measurable clinical outcome · 90-day drop-off.",
    peerRowWearableCat: "Fragmented wearables (Fitbit, Oura)",
    peerRowWearableCost: "$280",
    peerRowWearableScope: "Individual data without institutional aggregation · no HIS integration.",
    peerRowBioCat: "BIO-IGNICIÓN · Growth",
    peerRowBioCost: "$228",
    peerRowBioScope: "Clinical HRV · NOM-035 SALUD · operating dashboard · HIPAA BAA-ready.",
    peerCite: "Sources: SHRM 2024, KFF Employer Health Benefits 2024, NSI 2024. BIO pricing current (2026-Q2).",

    sourcesKicker: "SOURCES · CLINICAL LITERATURE",
    sourcesH: "Where the figures come from.",
    sourcesBody:
      "All figures come from peer-reviewed literature and open corporate reports. Cited under academic fair-use.",
    sourceAma:
      "AMA & Mayo Clinic Proceedings 2023 (Shanafelt et al.) · post-pandemic physician burnout prevalence 62.8% · US national sample.",
    sourceNam:
      "National Academy of Medicine 2019 · Taking Action Against Clinician Burnout · US cost $4.6 B/yr attributable to physician turnover.",
    sourceNsi:
      "NSI Nursing Solutions 2024 · National Health Care Retention Report · average RN turnover cost $52,350; bedside turnover 27% in first year.",
    sourceJama:
      "JAMA Internal Medicine / NEJM · correlation between clinical fatigue and medical error (diagnostic, medication, procedural) · multiple studies 2014–2023.",
    sourceKoenig:
      "Koenig et al. 2016 · HRV biofeedback meta-analysis in clinical populations · d = 0.83 anxiety reduction (large effect).",
    sourceGoessl:
      "Goessl et al. · Psychological Medicine 2017 · meta-analysis d = 0.50 anxiety reduction via HRV biofeedback (n=482). Our 0.35 cap ≈ 70% of observed effect.",
    sourceStps:
      "NOM-035 STPS · in force since 2019 · mandatory psychosocial evaluation at Mexican workplaces, including hospitals and clinics without exception.",

    entKicker: "COMPLIANCE & PROCUREMENT · CLINICAL",
    entH: "Everything your legal and procurement team will ask — already answered.",
    entBody:
      "Documented posture for each control. Formal artifacts (HIPAA BAA, SOC 2 Type I, DPA, ISO 27001 gap) delivered under NDA via Trust Center.",
    entHipaa: "HIPAA · BAA-ready",
    entSoc2: "SOC 2 Type I · active posture",
    entNom: "NOM-035 SALUD · dashboard + evidence",
    entIso: "ISO 27001 · gap analysis",
    entDpa: "DPA · GDPR Recital 26",
    entNist: "NIST CSF · documented mapping",
    entSso: "SSO · SAML 2.0 + OIDC",
    entSla: "99.9% SLA · hospital-grade",
    entFoot: "Individual data is clinician-segregated. The CMO sees only anonymized aggregates of ≥ 5 people per segment.",

    disclaimerH: "Legal note · 30-sec read",
    disclaimer1:
      "Figures are estimates from peer-reviewed public literature, not guarantees. Actual results depend on implementation, pool size, adherence rate and institutional context.",
    disclaimer2:
      "BIO-IGNICIÓN is an HRV-based operational wellbeing tool · it is NOT a medical device, does NOT diagnose, does NOT treat medical conditions, and does NOT replace formal clinical care. Complementary to formal care only.",
    disclaimer3:
      "The term 'clinical-grade' refers to HRV measurement quality (ECG-validated in literature) and does NOT imply regulatory clearance as a medical device (FDA / COFEPRIS / CE).",
    disclaimer4:
      "HIPAA BAA-ready means BIO-IGNICIÓN signs a Business Associate Agreement with covered entities under Enterprise plan; it does not imply HIPAA certification or automatic OCR audit.",
    disclaimer5:
      "Third-party marks (AMA, Mayo Clinic, NEJM, JAMA, NAM, NSI, Epic, Cerner, Okta, Ping) cited under academic fair-use. Property of their respective holders; inclusion does not imply endorsement or formal partnership.",

    closingKicker: "NEXT STEP · CLINICAL",
    closingHLead: "Book a demo with hospital assumptions.",
    closingHBody: "A 45-min closing with your CMO and procurement.",
    closingBody:
      "We bring the assumptions to your real context: physician/nurse/admin mix, shifts, region, applicable regulation. The Q2 2026 pilot cohort is limited to 5 hospital-grade institutions.",
    closingPrimary: "Book demo · hospital-grade",
    closingSecondary: "Run ROI with your numbers",
    closingTertiary: "Trust Center · due diligence",
    closingAvail: "Page reviewed",
    closingContact: "healthcare@bio-ignicion.app",
  },
};

export default async function ForHealthcarePage() {
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
    <PublicShell activePath="/for-healthcare">
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
              <ul className="bi-roi-meta" aria-label="healthcare-meta">
                <li><span className="dot" aria-hidden /> {c.metaHipaa}</li>
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
              <span className="v">62.8%</span>
              <span className="l">{c.statBurnout}</span>
              <span className="s">{c.statBurnoutSub}</span>
            </div>
            <div>
              <span className="v">$500k–$1M</span>
              <span className="l">{c.statTurnoverMd}</span>
              <span className="s">{c.statTurnoverMdSub}</span>
            </div>
            <div>
              <span className="v">40%</span>
              <span className="l">{c.statNurseLeave}</span>
              <span className="s">{c.statNurseLeaveSub}</span>
            </div>
            <div>
              <span className="v">$52,350</span>
              <span className="l">{c.statNurseCost}</span>
              <span className="s">{c.statNurseCostSub}</span>
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
              <div className="src">{c.benchmarkAmaSrc}</div>
              <span className="v">{c.benchmarkAmaV}</span>
              <span className="l">{c.benchmarkAmaL}</span>
            </div>
            <div className="bi-roi-benchmark-cell">
              <div className="src">{c.benchmarkJamaSrc}</div>
              <span className="v">{c.benchmarkJamaV}</span>
              <span className="l">{c.benchmarkJamaL}</span>
            </div>
            <div className="bi-roi-benchmark-cell">
              <div className="src">{c.benchmarkNamSrc}</div>
              <span className="v">{c.benchmarkNamV}</span>
              <span className="l">{c.benchmarkNamL}</span>
            </div>
            <div className="bi-roi-benchmark-cell">
              <div className="src">{c.benchmarkNsiSrc}</div>
              <span className="v">{c.benchmarkNsiV}</span>
              <span className="l">{c.benchmarkNsiL}</span>
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
            <li><span className="bi-roi-source-tag">AMA</span><span>{c.sourceAma}</span></li>
            <li><span className="bi-roi-source-tag">NAM</span><span>{c.sourceNam}</span></li>
            <li><span className="bi-roi-source-tag">NSI</span><span>{c.sourceNsi}</span></li>
            <li><span className="bi-roi-source-tag">JAMA</span><span>{c.sourceJama}</span></li>
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
            <li className="bi-roi-ent-chip">{c.entHipaa}</li>
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
      <section aria-labelledby="hc-closing" className="bi-demo-closing-section">
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

              <h2 id="hc-closing" className="bi-demo-closing-h">
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
