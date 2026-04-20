/* ═══════════════════════════════════════════════════════════════
   /roi-calculator — Modelo ROI transparente. Supuestos conservadores,
   fuentes públicas (Deloitte, Gallup, APA, SHRM), caps auditables.
   Corre íntegramente en el navegador. Sin email wall.
   ═══════════════════════════════════════════════════════════════ */

import Link from "next/link";
import RoiCalc from "./RoiCalc";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font, bioSignal } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";
import IgnitionReveal from "@/components/brand/IgnitionReveal";
import BioglyphLattice from "@/components/brand/BioglyphLattice";
import PulseDivider from "@/components/brand/PulseDivider";

export const metadata = {
  title: "Calculadora ROI",
  description:
    "Modelo ROI transparente · supuestos conservadores con caps auditables · fuentes públicas · corre íntegramente en tu navegador sin email wall.",
  alternates: { canonical: "/roi-calculator" },
  openGraph: {
    title: "BIO-IGNICIÓN · Calculadora ROI",
    description: "Corre el cálculo en tu navegador. No guardamos tus inputs.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
};

const MODEL_VERSION = "1.2";
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
    eyebrow: "CALCULADORA ROI · MODELO ABIERTO",
    title: "El ROI que te falta medir.",
    editorial:
      "Pon tus números. El modelo corre en tu navegador, con supuestos conservadores y caps auditables frente a literatura pública.",
    intro:
      "Sin email wall, sin telemetría, sin guardar inputs en servidor. El motor es el mismo que usa el panel de equipo y está documentado línea por línea.",
    metaLocal: "Local-first",
    metaNoWall: "Sin email wall",
    metaOpenModel: "Modelo abierto",

    scarcityLabel: "Q2 2026 · PILOTO ENTERPRISE · CUPO LIMITADO",

    statModel: "Versión del modelo",
    statModelSub: "reviewable en /docs",
    statCap: "Effect-size cap",
    statCapSub: "tope conservador",
    statCompliance: "Cumplimiento base",
    statComplianceSub: "supuesto inferido",
    statResidual: "Persistencia",
    statResidualSub: "efecto residual",

    benchmarkKicker: "CONTEXTO · BENCHMARKS PÚBLICOS",
    benchmarkOmsSrc: "OMS",
    benchmarkOmsV: "$1 T / año",
    benchmarkOmsL: "Pérdida global productividad · depresión y ansiedad · OMS Mental Health at Work 2024",
    benchmarkBaickerSrc: "HARVARD",
    benchmarkBaickerV: "3.27×",
    benchmarkBaickerL: "ROI mediano programas wellness corporativos · Baicker et al., Health Affairs 2010",
    benchmarkGallupSrc: "GALLUP",
    benchmarkGallupV: "41%",
    benchmarkGallupL: "Empleados con estrés diario · State of the Global Workplace 2024",
    benchmarkMercerSrc: "MERCER",
    benchmarkMercerV: "$720–$1,850",
    benchmarkMercerL: "Rango gasto wellness por empleado / año · Mercer Health on Demand 2024",

    peerKicker: "COMPARATIVO · CATEGORÍA WELLNESS",
    peerH: "Dónde caes contra el gasto típico.",
    peerBody:
      "Referencias mediana global; compara seat por seat. Tu número varía por región y tamaño de pool, pero el orden de magnitud es estable.",
    peerColCat: "Categoría",
    peerColCost: "USD / emp / año",
    peerColScope: "Alcance",
    peerRowEapCat: "EAP tradicional",
    peerRowEapCost: "$180",
    peerRowEapScope: "Consejería reactiva · adopción baja (2–6%) · sin instrumentación.",
    peerRowWellnessCat: "Plataforma wellness media",
    peerRowWellnessCost: "$450",
    peerRowWellnessScope: "Retos, contenido, gamificación · sin outcome medible.",
    peerRowMercerCat: "Mediana Fortune 500 wellness",
    peerRowMercerCost: "$900",
    peerRowMercerScope: "Programas completos · sin capa biométrica ni panel operativo.",
    peerRowBioCat: "BIO-IGNICIÓN · Growth",
    peerRowBioCost: "$228",
    peerRowBioScope: "Protocolos HRV · NOM-035 · panel ops · outcome medido seat-a-seat.",
    peerCite: "Fuentes: SHRM 2024, Mercer Health on Demand 2024. Precio BIO Growth vigente (2026-Q2).",

    entKicker: "ENTERPRISE-READY · DUE DILIGENCE",
    entH: "Lo que tu equipo de procurement va a preguntar — ya está respondido.",
    entBody:
      "Cada control representa postura activa o documentada. Los artefactos formales (SOC 2 Type I, DPA, BAA-ready) se entregan bajo NDA a través de Trust Center.",
    entSso: "SSO · SAML 2.0 + OIDC",
    entScim: "SCIM 2.0 · aprovisionamiento",
    entSoc2: "SOC 2 Type I · postura activa",
    entIso: "ISO 27001 · gap analysis",
    entDpa: "DPA · GDPR Recital 26",
    entBaa: "BAA-ready · HIPAA posture",
    entLocale: "ES/EN · localización oficial",
    entSla: "99.9% SLA · enterprise",
    entFoot: "Panel de cumplimiento NOM-035 STPS incluido. Evidencia descargable para auditores 3P.",

    sourcesKicker: "FUENTES · LITERATURA PÚBLICA",
    sourcesH: "De dónde vienen los supuestos.",
    sourcesBody:
      "Los rangos vienen de literatura pública revisada por pares y reportes corporativos abiertos. Las estimaciones dependen de implementación, industria y contexto organizacional — no son garantía de resultados.",
    sourceOms:
      "OMS · Mental Health at Work 2024 · depresión y ansiedad cuestan $1 T USD/año en productividad perdida globalmente · 12 B días laborales perdidos.",
    sourceDeloitte:
      "Deloitte · Mental Health & Employers 2024 · 4.70× ROI agregado en intervenciones de bienestar mental con >12 meses de madurez (mediana UK).",
    sourceGallup:
      "Gallup · State of the Global Workplace 2024 · +23% productividad en equipos con alto engagement; 41% empleados reportan estrés diario.",
    sourceAPA:
      "Goessl et al. · Psychological Medicine 2017 · meta-análisis d=0.50 reducción ansiedad con HRV biofeedback (n=482). Nuestro cap 0.35 ≈ 70% del efecto observado.",
    sourceSHRM:
      "SHRM · 2024 Cost of Turnover · reemplazar un colaborador ≈ 50–200% del salario anual. Base para hourlyCost = salario + beneficios + overhead.",
    sourceStps:
      "NOM-035 STPS · vigente desde 2019 · evaluación de factores de riesgo psicosocial obligatoria · centros laborales en México sin excepción.",

    calcKicker: "EJECUCIÓN · EN TU NAVEGADOR",
    calcH: "Ajusta los inputs. Los resultados se recalculan en vivo.",
    calcBody:
      "Todo el cálculo ocurre del lado del cliente. Nada se envía al servidor. Cierra la pestaña y los inputs se quedan en tu dispositivo; si autorizas, los preservamos en localStorage para tu siguiente visita.",

    modelKicker: "TRANSPARENCIA · FÓRMULA",
    modelH: "Cómo se calcula, en una línea.",
    modelFormula:
      "recoveredHoursPerEmp = (sessionsPerDay × sessionMinutes × workDays × compliance × min(observedLift, cap) × residual) ÷ 60",
    modelStep1: "1. Tiempo adherido: sesiones/día × minutos/sesión × días laborales × tasa de cumplimiento.",
    modelStep2: "2. Efecto neto: mínimo entre el lift observado y el cap conservador (0.35).",
    modelStep3: "3. Persistencia: multiplicador residual por beneficios que se extienden más allá de la sesión.",
    modelStep4: "4. Valor: horas recuperadas × hourlyCost totalmente cargado.",
    modelStep5: "5. Neto: valor bruto menos licencia anual (seats × precio × 12).",
    modelFullLink: "Ver documentación completa del modelo →",

    closingKicker: "PRÓXIMO PASO",
    closingHLead: "Agenda con estos supuestos.",
    closingHBody: "Un cierre de 45 min para validar contra tu caso real.",
    closingBody:
      "Llevamos tu salida de la calculadora al escritorio de procurement — ajustamos los supuestos a tu industria, mostramos el panel operativo y respondemos el pliego. El cohorte piloto Q2 2026 está limitado a 12 organizaciones.",
    closingPrimary: "Agenda demo con estos supuestos",
    closingSecondary: "Ver modelo en /docs",
    closingTertiary: "Trust Center · due diligence",
    closingAvail: "Modelo revisado",
    closingContact: "enterprise@bio-ignicion.app",

    disclaimerH: "Nota legal · lectura en 30 s",
    disclaimer1:
      "Las cifras son estimaciones a partir de literatura pública, no garantías. Los resultados reales dependen de implementación, industria, cumplimiento efectivo y contexto organizacional.",
    disclaimer2:
      "El múltiplo de ROI compara valor bruto anualizado contra costo de licencia anual. No incluye costos de onboarding, integración, gestión del cambio ni variabilidad individual.",
    disclaimer3:
      "Effect-size capado en 0.35 (techo conservador vs. d=0.50 publicado en Psychol Med 2017). Factor de persistencia 2× aplicado solo sobre tiempo adherido al protocolo.",
    disclaimer4:
      "Enterprise se muestra como estimación de trabajo ($29/mes aprox.); el precio real se cotiza por separado. La vista a 3 años asume adopción y efecto estables (sin crecimiento ni decaimiento compuesto).",
    disclaimer5:
      "Los benchmarks de terceros (OMS, Harvard, Gallup, Mercer, SHRM) se citan bajo fair-use académico. Las marcas son propiedad de sus titulares y su inclusión no implica endoso.",
  },
  en: {
    eyebrow: "ROI CALCULATOR · OPEN MODEL",
    title: "The ROI you're not measuring.",
    editorial:
      "Enter your numbers. The model runs in your browser, with conservative assumptions and caps auditable against public literature.",
    intro:
      "No email wall, no telemetry, no inputs stored on the server. The engine is the same one the team dashboard uses and it's documented line by line.",
    metaLocal: "Local-first",
    metaNoWall: "No email wall",
    metaOpenModel: "Open model",

    scarcityLabel: "Q2 2026 · ENTERPRISE PILOT · LIMITED COHORT",

    statModel: "Model version",
    statModelSub: "reviewable in /docs",
    statCap: "Effect-size cap",
    statCapSub: "conservative ceiling",
    statCompliance: "Base compliance",
    statComplianceSub: "inferred assumption",
    statResidual: "Persistence",
    statResidualSub: "residual effect",

    benchmarkKicker: "CONTEXT · PUBLIC BENCHMARKS",
    benchmarkOmsSrc: "WHO",
    benchmarkOmsV: "$1 T / yr",
    benchmarkOmsL: "Global productivity loss · depression & anxiety · WHO Mental Health at Work 2024",
    benchmarkBaickerSrc: "HARVARD",
    benchmarkBaickerV: "3.27×",
    benchmarkBaickerL: "Median corporate wellness ROI · Baicker et al., Health Affairs 2010",
    benchmarkGallupSrc: "GALLUP",
    benchmarkGallupV: "41%",
    benchmarkGallupL: "Employees reporting daily stress · State of the Global Workplace 2024",
    benchmarkMercerSrc: "MERCER",
    benchmarkMercerV: "$720–$1,850",
    benchmarkMercerL: "Wellness spend range per employee / year · Mercer Health on Demand 2024",

    peerKicker: "COMPARISON · WELLNESS CATEGORY",
    peerH: "Where you land against typical spend.",
    peerBody:
      "Global median references; compare seat by seat. Your actual figure varies by region and pool size, but the order of magnitude is stable.",
    peerColCat: "Category",
    peerColCost: "USD / emp / yr",
    peerColScope: "Scope",
    peerRowEapCat: "Traditional EAP",
    peerRowEapCost: "$180",
    peerRowEapScope: "Reactive counseling · low adoption (2–6%) · no instrumentation.",
    peerRowWellnessCat: "Average wellness platform",
    peerRowWellnessCost: "$450",
    peerRowWellnessScope: "Challenges, content, gamification · no measurable outcome.",
    peerRowMercerCat: "Fortune 500 wellness median",
    peerRowMercerCost: "$900",
    peerRowMercerScope: "Comprehensive programs · no biometric layer or ops dashboard.",
    peerRowBioCat: "BIO-IGNICIÓN · Growth",
    peerRowBioCost: "$228",
    peerRowBioScope: "HRV protocols · NOM-035 · ops dashboard · outcome measured seat-by-seat.",
    peerCite: "Sources: SHRM 2024, Mercer Health on Demand 2024. BIO Growth pricing current (2026-Q2).",

    entKicker: "ENTERPRISE-READY · DUE DILIGENCE",
    entH: "Everything procurement will ask — already answered.",
    entBody:
      "Each control represents an active or documented posture. Formal artifacts (SOC 2 Type I, DPA, BAA-ready) are delivered under NDA via Trust Center.",
    entSso: "SSO · SAML 2.0 + OIDC",
    entScim: "SCIM 2.0 · provisioning",
    entSoc2: "SOC 2 Type I · active posture",
    entIso: "ISO 27001 · gap analysis",
    entDpa: "DPA · GDPR Recital 26",
    entBaa: "BAA-ready · HIPAA posture",
    entLocale: "ES/EN · official localization",
    entSla: "99.9% SLA · enterprise",
    entFoot: "NOM-035 STPS compliance dashboard included. Downloadable evidence for 3P auditors.",

    sourcesKicker: "SOURCES · PUBLIC LITERATURE",
    sourcesH: "Where the assumptions come from.",
    sourcesBody:
      "Ranges come from peer-reviewed public literature and open corporate reports. Estimates depend on implementation, industry and organizational context — not a guarantee of results.",
    sourceOms:
      "WHO · Mental Health at Work 2024 · depression and anxiety cost the global economy $1 T USD/yr in lost productivity · 12 B lost work days.",
    sourceDeloitte:
      "Deloitte · Mental Health & Employers 2024 · 4.70× aggregate ROI on mental wellbeing interventions with >12 months maturity (UK median).",
    sourceGallup:
      "Gallup · State of the Global Workplace 2024 · +23% productivity in high-engagement teams; 41% of employees report daily stress.",
    sourceAPA:
      "Goessl et al. · Psychological Medicine 2017 · meta-analysis d=0.50 anxiety reduction via HRV biofeedback (n=482). Our 0.35 cap ≈ 70% of the observed effect.",
    sourceSHRM:
      "SHRM · 2024 Cost of Turnover · replacing a knowledge worker costs 50–200% of annual salary. Basis for hourlyCost = salary + benefits + overhead.",
    sourceStps:
      "NOM-035 STPS · in force since 2019 · mandatory psychosocial risk factor evaluation · all Mexican workplaces without exception.",

    calcKicker: "EXECUTION · IN YOUR BROWSER",
    calcH: "Adjust the inputs. Results recalculate live.",
    calcBody:
      "The whole computation happens client-side. Nothing is sent to the server. Close the tab and inputs stay on your device; if you allow it, we preserve them in localStorage for your next visit.",

    modelKicker: "TRANSPARENCY · FORMULA",
    modelH: "How it's calculated, in one line.",
    modelFormula:
      "recoveredHoursPerEmp = (sessionsPerDay × sessionMinutes × workDays × compliance × min(observedLift, cap) × residual) ÷ 60",
    modelStep1: "1. Adhered time: sessions/day × minutes/session × work days × compliance rate.",
    modelStep2: "2. Net effect: minimum of observed lift and the conservative cap (0.35).",
    modelStep3: "3. Persistence: residual multiplier for benefits extending beyond the session.",
    modelStep4: "4. Value: recovered hours × fully-loaded hourlyCost.",
    modelStep5: "5. Net: gross value minus annual license (seats × price × 12).",
    modelFullLink: "See full model documentation →",

    closingKicker: "NEXT STEP",
    closingHLead: "Book a demo with these assumptions.",
    closingHBody: "A 45-min closing to validate against your real case.",
    closingBody:
      "We bring your calculator output to the procurement desk — we tune assumptions to your industry, walk through the operating dashboard and answer the RFP. The Q2 2026 pilot cohort is limited to 12 organizations.",
    closingPrimary: "Book demo with these assumptions",
    closingSecondary: "See model in /docs",
    closingTertiary: "Trust Center · due diligence",
    closingAvail: "Model reviewed",
    closingContact: "enterprise@bio-ignicion.app",

    disclaimerH: "Legal note · 30-sec read",
    disclaimer1:
      "Figures are estimates based on public literature, not guarantees. Actual results depend on implementation, industry, effective compliance and organizational context.",
    disclaimer2:
      "The ROI multiple compares annualized gross value against annual license cost. It excludes onboarding, integration, change-management costs and individual variability.",
    disclaimer3:
      "Effect-size capped at 0.35 (conservative ceiling vs. d=0.50 published in Psychol Med 2017). Persistence factor 2× applied only over time adhered to protocol.",
    disclaimer4:
      "Enterprise shown as a working estimate ($29/mo approx.); real pricing is quoted separately. 3-year view assumes stable adoption and effect (no compound growth or decay).",
    disclaimer5:
      "Third-party benchmarks (WHO, Harvard, Gallup, Mercer, SHRM) cited under academic fair-use. Marks are property of their respective holders; inclusion does not imply endorsement.",
  },
};

export default async function RoiPage() {
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
    <PublicShell activePath="/roi-calculator">
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
                  fontSize: "clamp(36px, 5.2vw, 64px)",
                  letterSpacing: "-0.035em",
                  lineHeight: 1.02,
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
                  maxWidth: "48ch",
                  margin: `0 auto ${space[4]}px`,
                  textAlign: "center",
                }}
              >
                {c.editorial}
              </p>
              <p style={{ color: cssVar.textDim, maxWidth: "62ch", margin: "0 auto", textAlign: "center" }}>
                {c.intro}
              </p>
              <ul className="bi-roi-meta" aria-label="calc-meta">
                <li><span className="dot" aria-hidden /> {c.metaLocal}</li>
                <li><span className="dot" aria-hidden /> {c.metaNoWall}</li>
                <li><span className="dot" aria-hidden /> {c.metaOpenModel}</li>
              </ul>
              <div className="bi-roi-scarcity" aria-label={c.scarcityLabel}>
                <span className="bi-roi-scarcity-label">{c.scarcityLabel}</span>
              </div>
            </IgnitionReveal>
          </div>
        </header>
      </Container>

      {/* ═══ Stat strip ═══ */}
      <section aria-label={c.eyebrow} style={{ marginBlockStart: space[7] }}>
        <Container size="xl" style={{ paddingInline: 0 }}>
          <div className="bi-proof-stats bi-proof-stats--label">
            <div>
              <span className="v">v{MODEL_VERSION}</span>
              <span className="l">{c.statModel}</span>
              <span className="s">{c.statModelSub}</span>
            </div>
            <div>
              <span className="v">0.35</span>
              <span className="l">{c.statCap}</span>
              <span className="s">{c.statCapSub}</span>
            </div>
            <div>
              <span className="v">60%</span>
              <span className="l">{c.statCompliance}</span>
              <span className="s">{c.statComplianceSub}</span>
            </div>
            <div>
              <span className="v">2×</span>
              <span className="l">{c.statResidual}</span>
              <span className="s">{c.statResidualSub}</span>
            </div>
          </div>
        </Container>
      </section>

      {/* ═══ Benchmark strip (public figures) ═══ */}
      <section aria-label={c.benchmarkKicker} style={{ marginBlockStart: space[6] }}>
        <Container size="xl" style={{ paddingInline: 0 }}>
          <div style={{ ...kickerStyle, textAlign: "center", marginBlockEnd: space[4] }}>
            {c.benchmarkKicker}
          </div>
          <div className="bi-roi-benchmark-strip">
            <div className="bi-roi-benchmark-cell">
              <div className="src">{c.benchmarkOmsSrc}</div>
              <span className="v">{c.benchmarkOmsV}</span>
              <span className="l">{c.benchmarkOmsL}</span>
            </div>
            <div className="bi-roi-benchmark-cell">
              <div className="src">{c.benchmarkBaickerSrc}</div>
              <span className="v">{c.benchmarkBaickerV}</span>
              <span className="l">{c.benchmarkBaickerL}</span>
            </div>
            <div className="bi-roi-benchmark-cell">
              <div className="src">{c.benchmarkGallupSrc}</div>
              <span className="v">{c.benchmarkGallupV}</span>
              <span className="l">{c.benchmarkGallupL}</span>
            </div>
            <div className="bi-roi-benchmark-cell">
              <div className="src">{c.benchmarkMercerSrc}</div>
              <span className="v">{c.benchmarkMercerV}</span>
              <span className="l">{c.benchmarkMercerL}</span>
            </div>
          </div>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      {/* ═══ Calculator ═══ */}
      <Container size="lg" className="bi-prose">
        <section aria-labelledby="roi-calc-heading" className="bi-roicc-section">
          <div style={kickerStyle}>{c.calcKicker}</div>
          <h2 id="roi-calc-heading" style={sectionHeading}>{c.calcH}</h2>
          <p style={{ marginBlockStart: space[3], color: cssVar.textDim, maxWidth: "62ch" }}>
            {c.calcBody}
          </p>
          <div style={{ marginBlockStart: space[6] }}>
            <RoiCalc />
          </div>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ Peer comparison ═══ */}
        <section aria-labelledby="roi-peer-heading" className="bi-roi-peer">
          <div style={kickerStyle}>{c.peerKicker}</div>
          <h2 id="roi-peer-heading" style={sectionHeading}>{c.peerH}</h2>
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
                  <td data-label={c.peerColCat}><span className="bi-roi-peer-label">{c.peerRowMercerCat}</span></td>
                  <td data-label={c.peerColCost}>{c.peerRowMercerCost}</td>
                  <td data-label={c.peerColScope}><span className="bi-roi-peer-hint">{c.peerRowMercerScope}</span></td>
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

        {/* ═══ Model transparency ═══ */}
        <section aria-labelledby="roi-model-heading" className="bi-roi-model">
          <div style={kickerStyle}>{c.modelKicker}</div>
          <h2 id="roi-model-heading" style={sectionHeading}>{c.modelH}</h2>
          <pre className="bi-roi-formula" aria-label="formula">
            <code>{c.modelFormula}</code>
          </pre>
          <ol className="bi-roi-steps">
            <li>{c.modelStep1}</li>
            <li>{c.modelStep2}</li>
            <li>{c.modelStep3}</li>
            <li>{c.modelStep4}</li>
            <li>{c.modelStep5}</li>
          </ol>
          <p style={{ marginBlockStart: space[4] }}>
            <Link href="/docs#roi-model" className="bi-roi-link">{c.modelFullLink}</Link>
          </p>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ Sources ═══ */}
        <section aria-labelledby="roi-sources-heading" className="bi-roi-sources">
          <div style={kickerStyle}>{c.sourcesKicker}</div>
          <h2 id="roi-sources-heading" style={sectionHeading}>{c.sourcesH}</h2>
          <p style={{ marginBlockStart: space[3], color: cssVar.textDim, maxWidth: "66ch" }}>
            {c.sourcesBody}
          </p>
          <ul className="bi-roi-source-list">
            <li><span className="bi-roi-source-tag">WHO</span><span>{c.sourceOms}</span></li>
            <li><span className="bi-roi-source-tag">DELOITTE</span><span>{c.sourceDeloitte}</span></li>
            <li><span className="bi-roi-source-tag">GALLUP</span><span>{c.sourceGallup}</span></li>
            <li><span className="bi-roi-source-tag">APA</span><span>{c.sourceAPA}</span></li>
            <li><span className="bi-roi-source-tag">SHRM</span><span>{c.sourceSHRM}</span></li>
            <li><span className="bi-roi-source-tag">STPS</span><span>{c.sourceStps}</span></li>
          </ul>
        </section>

        {/* ═══ Enterprise readiness rail ═══ */}
        <section aria-labelledby="roi-ent-heading" className="bi-roi-ent">
          <div style={kickerStyle}>{c.entKicker}</div>
          <h2 id="roi-ent-heading" style={sectionHeading}>{c.entH}</h2>
          <p style={{ marginBlockStart: space[3], color: cssVar.textDim, maxWidth: "66ch" }}>
            {c.entBody}
          </p>
          <ul className="bi-roi-ent-grid" aria-label={c.entKicker}>
            <li className="bi-roi-ent-chip">{c.entSso}</li>
            <li className="bi-roi-ent-chip">{c.entScim}</li>
            <li className="bi-roi-ent-chip">{c.entSoc2}</li>
            <li className="bi-roi-ent-chip">{c.entIso}</li>
            <li className="bi-roi-ent-chip">{c.entDpa}</li>
            <li className="bi-roi-ent-chip">{c.entBaa}</li>
            <li className="bi-roi-ent-chip">{c.entLocale}</li>
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

      {/* ═══ Closing CTA ═══ */}
      <section aria-labelledby="roi-closing" className="bi-demo-closing-section">
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

              <h2 id="roi-closing" className="bi-demo-closing-h">
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
                <Link href="/docs#roi-model" className="bi-demo-closing-ghost">
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
                  <span className="bi-demo-closing-sig-name">v{MODEL_VERSION}</span>
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
