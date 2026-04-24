/* ═══════════════════════════════════════════════════════════════
   /terms — Términos de servicio. Contrato base para individuos.
   Para enterprise, el MSA + DPA en el Trust Center prevalece.
   ═══════════════════════════════════════════════════════════════ */

import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font, bioSignal } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";
import IgnitionReveal from "@/components/brand/IgnitionReveal";
import BioglyphLattice from "@/components/brand/BioglyphLattice";
import PulseDivider from "@/components/brand/PulseDivider";

export const metadata = {
  title: "Términos de Servicio",
  description: "Contrato de uso de BIO-IGNICIÓN · ley mexicana · MSA/DPA prevalecen para enterprise.",
  alternates: { canonical: "/terms" },
};

const LAST_UPDATED = "2026-04-20";
const VERSION = "1.3";
const EFFECTIVE_FROM = "2026-04-01";

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
  fontSize: "clamp(22px, 2.6vw, 28px)",
  letterSpacing: "-0.02em",
  lineHeight: 1.2,
  fontWeight: font.weight.black,
  color: cssVar.text,
};

const COPY = {
  es: {
    eyebrow: "TÉRMINOS DE SERVICIO",
    title: "El contrato, en voz baja.",
    editorial: "Lo que nos debes, lo que te debemos, sin esconderlo en legal-speak.",
    intro:
      "Este documento rige el uso individual del servicio. Para organizaciones enterprise, el Master Service Agreement (MSA) y el Data Processing Agreement (DPA) firmados prevalecen sobre estos términos.",
    updated: "Actualizado",
    version: "Versión",
    effective: "Vigente desde",
    toc: "Índice",

    statVersion: "Versión activa",
    statVersionSub: "historial versionado",
    statLaw: "Ley aplicable",
    statLawSub: "tribunales CDMX",
    statCap: "Límite de responsabilidad",
    statCapSub: "lo pagado en 12 meses previos",
    statNotice: "Preaviso · cambios materiales",
    statNoticeSub: "30 días por email",

    s1Kicker: "01 · ACEPTACIÓN",
    s1H: "Quién acepta y desde cuándo.",
    s1Body:
      "Al usar BIO-IGNICIÓN aceptas estos términos. Si representas a una organización, declaras tener autoridad para vincularla. Si no aceptas, no uses el servicio — es así de simple.",

    s2Kicker: "02 · CUENTA",
    s2H: "Credenciales, MFA y responsabilidad.",
    s2Body:
      "Eres responsable de proteger tus credenciales. Debes habilitar MFA (TOTP o WebAuthn) si tu plan lo requiere o si tu organización lo exige vía SSO. Las actividades realizadas con tu cuenta te son imputables salvo que demuestres compromiso.",

    s3Kicker: "03 · USO ACEPTABLE",
    s3H: "Qué no puedes hacer con el servicio.",
    s3Body:
      "No puedes usar el servicio para actividades ilegales, automatización abusiva, ingeniería inversa ni para almacenar datos sin base legal. Ver documento específico:",
    s3Link: "Política de uso aceptable (AUP)",

    s4Kicker: "04 · PROPIEDAD INTELECTUAL Y DATOS DERIVADOS",
    s4H: "Tus datos son tuyos. Lo que derivamos, nuestro.",
    s4Body:
      "Conservas todos los derechos sobre los datos personales identificables que introduces. Nos otorgas una licencia mínima, no exclusiva y revocable al cierre de cuenta para operar el servicio a tu favor (almacenamiento, respaldo, visualización).",
    s4BodyDerived:
      "Adicionalmente, nos otorgas una licencia perpetua, irrevocable, mundial, libre de regalías y sub-licenciable para usar datos anonimizados y agregados derivados de tu uso del servicio — incluyendo la mejora del motor neural, el entrenamiento de modelos internos, la investigación estadística, benchmarks y publicaciones académicas. Esta licencia sobrevive a la terminación del acuerdo porque, una vez anonimizados conforme al Aviso de Privacidad § 03, los datos dejan de ser personales (GDPR Recital 26, LFPDPPP Art. 3.VIII) y, por tanto, quedan fuera del alcance de tus derechos ARCO/GDPR.",
    s4BodyAi:
      "No entrenamos modelos de IA con datos personales identificables. Sí entrenamos modelos con datos anonimizados y agregados según se describe arriba. No compartimos el dataset con terceros para entrenamiento de modelos competidores.",
    s4BodyFeedback:
      "Feedback: cualquier sugerencia, idea o comentario que nos comuniques sobre el servicio nos lo cedes en propiedad, sin obligación de atribución, compensación ni confidencialidad, salvo pacto expreso por escrito.",
    s4DerivedKicker: "LICENCIA DE DATOS DERIVADOS · PERPETUA",
    s7L4Kicker: "RETENCIÓN POST-TERMINACIÓN · ANONIMIZADA",
    s14Kicker2: "CESIÓN M&A · VALOR ECONÓMICO",

    s5Kicker: "05 · CONFIDENCIALIDAD",
    s5H: "DPA y aviso de privacidad vinculantes.",
    s5Body: "Aplican los siguientes documentos binding:",
    s5Link1: "Data Processing Agreement (DPA)",
    s5Link2: "Aviso de privacidad",
    s5Link3: "Subprocesadores",

    s6Kicker: "06 · PAGOS Y FACTURACIÓN",
    s6H: "Ciclo, excedentes y créditos SLA.",
    s6L1: "Los planes se facturan por adelantado, mensual o anualmente, en MXN o USD según elijas.",
    s6L2: "Los excedentes de uso (seats adicionales, estaciones NFC, API calls sobre cuota) se miden y cobran al cierre de ciclo.",
    s6L3: "La falta de pago tras 14 días genera suspensión; tras 30 días, cierre de cuenta con retención de datos por otros 30 días para rescate.",
    s6L4: "Tier Enterprise incluye créditos SLA calculados contra el objetivo de disponibilidad publicado en /status.",

    s7Kicker: "07 · TERMINACIÓN",
    s7H: "Cierre por ti o por nosotros.",
    s7L1: "Puedes cerrar tu cuenta en cualquier momento desde Perfil → Cerrar cuenta.",
    s7L2: "Nos reservamos el derecho de suspender servicio por incumplimiento material (fraude, AUP, falta de pago persistente) con aviso previo cuando sea razonable.",
    s7L3: "Tras el cierre: datos personales identificables retenidos 30 días para recuperación, luego borrado permanente salvo obligaciones legales (facturación 5 años, logs de seguridad 90 días, señales anti-fraude 24 meses).",
    s7L4: "Datos anonimizados y modelos derivados (línea base calibrada tras disociación, agregados estadísticos, contribuciones al motor neural) se conservan indefinidamente conforme a la licencia de datos derivados (§ 04) y al Aviso de Privacidad § 03. Esta retención sobrevive a la terminación y es condición material del acuerdo.",

    s8Kicker: "08 · GARANTÍAS Y DESCARGOS",
    s8H: "Qué prometemos y qué no.",
    s8Body:
      "El servicio se provee tal-cual, con esfuerzo comercial razonable de operación. Publicamos objetivos de disponibilidad en /status; el SLA contractual solo aplica en tier Enterprise. Descargos de garantías implícitas de comerciabilidad e idoneidad para propósito particular en la medida máxima permitida por ley.",

    s9Kicker: "09 · LIMITACIÓN DE RESPONSABILIDAD",
    s9H: "Tope contractual y daños excluidos.",
    s9Body:
      "La responsabilidad agregada de BIO-IGNICIÓN por reclamos derivados o relacionados con el servicio no excederá lo pagado por el cliente en los 12 meses previos al evento. Se excluyen daños indirectos, lucro cesante y morales salvo dolo comprobado o lo exigido por normas imperativas del consumidor.",

    s10Kicker: "10 · INDEMNIZACIÓN",
    s10H: "Quién defiende qué.",
    s10L1: "Defenderemos al cliente frente a reclamos de terceros que aleguen que el servicio infringe propiedad intelectual de ese tercero, bajo condiciones estándar de notificación y cooperación.",
    s10L2: "El cliente nos defenderá frente a reclamos derivados de su uso en violación de estos términos o del AUP.",

    s11Kicker: "11 · FUERZA MAYOR",
    s11H: "Eventos fuera de control razonable.",
    s11Body:
      "Ningún lado será responsable por retrasos o fallas derivadas de fuerza mayor: caídas regionales de cloud de escala país, desastres naturales, actos gubernamentales o conflictos armados.",

    s12Kicker: "12 · CAMBIOS A ESTOS TÉRMINOS",
    s12H: "Versionado y preaviso.",
    s12Body:
      "Versionamos estos términos públicamente. Los cambios materiales se notifican por email con al menos 30 días de antelación. Si no aceptas un cambio, puedes cerrar tu cuenta antes de la fecha efectiva sin penalización.",

    s13Kicker: "13 · LEY APLICABLE Y JURISDICCIÓN",
    s13H: "Ley mexicana, tribunales CDMX.",
    s13Body:
      "Estos términos se rigen por la ley mexicana, sin perjuicio de normas imperativas del consumidor en tu país de residencia. Las disputas se someten a los tribunales competentes de la Ciudad de México, salvo arbitraje acordado.",

    s14Kicker: "14 · CESIÓN Y SUCESIÓN",
    s14H: "Qué pasa si la empresa cambia de manos.",
    s14Body:
      "BIO-IGNICIÓN puede ceder este acuerdo a un afiliado, sucesor, adquirente o nueva entidad legal resultante de fusión, escisión, reestructuración corporativa o venta sustancial de activos, mediante notificación previa razonable. La cesión incluye los datos anonimizados, modelos derivados y las licencias otorgadas en § 04, que forman parte del valor económico del negocio. Tú no puedes ceder tus derechos u obligaciones bajo este acuerdo sin nuestro consentimiento previo por escrito.",

    s15Kicker: "15 · CONTACTO",
    s15H: "Dónde nos escribes para todo lo legal.",

    relatedKicker: "DOCUMENTOS RELACIONADOS",
    relatedH: "Paquete completo para procurement.",
    relatedBody:
      "Todos los documentos binding para enterprise viven en el Trust Center. Si necesitas MSA/DPA firmado, escríbenos.",
    linkPrivacy: "Aviso de privacidad",
    linkAup: "Política de uso aceptable",
    linkCookies: "Política de cookies",
    linkDpa: "DPA (descargable)",
    linkSubs: "Subprocesadores",
    linkTrust: "Trust Center",
  },
  en: {
    eyebrow: "TERMS OF SERVICE",
    title: "The contract, in a quiet voice.",
    editorial: "What you owe us, what we owe you — no legal-speak hiding.",
    intro:
      "This document governs individual use of the service. For enterprise organizations, the signed Master Service Agreement (MSA) and Data Processing Agreement (DPA) prevail over these terms.",
    updated: "Updated",
    version: "Version",
    effective: "Effective from",
    toc: "Table of contents",

    statVersion: "Active version",
    statVersionSub: "versioned history",
    statLaw: "Governing law",
    statLawSub: "Mexico City courts",
    statCap: "Liability cap",
    statCapSub: "fees paid in prior 12 months",
    statNotice: "Material-change notice",
    statNoticeSub: "30 days by email",

    s1Kicker: "01 · ACCEPTANCE",
    s1H: "Who accepts and from when.",
    s1Body:
      "By using BIO-IGNICIÓN you accept these terms. If you represent an organization, you declare you have authority to bind it. If you don't accept, don't use the service — that simple.",

    s2Kicker: "02 · ACCOUNT",
    s2H: "Credentials, MFA and responsibility.",
    s2Body:
      "You are responsible for protecting your credentials. You must enable MFA (TOTP or WebAuthn) if your plan requires it or if your organization requires SSO. Activities performed with your account are attributed to you unless you prove compromise.",

    s3Kicker: "03 · ACCEPTABLE USE",
    s3H: "What you can't do with the service.",
    s3Body:
      "You can't use the service for illegal activities, abusive automation, reverse engineering or storing data without a lawful basis. See specific document:",
    s3Link: "Acceptable use policy (AUP)",

    s4Kicker: "04 · INTELLECTUAL PROPERTY AND DERIVED DATA",
    s4H: "Your data is yours. What we derive, ours.",
    s4Body:
      "You retain all rights to identifiable personal data you input. You grant us a minimum, non-exclusive license, revocable upon account termination, solely to operate the service on your behalf (storage, backup, display).",
    s4BodyDerived:
      "Additionally, you grant us a perpetual, irrevocable, worldwide, royalty-free, sublicensable license to use anonymized and aggregated data derived from your use of the service — including neural-engine improvement, internal model training, statistical research, benchmarks and academic publication. This license survives termination of the agreement because, once anonymized per Privacy Notice § 03, the data is no longer personal data (GDPR Recital 26, LFPDPPP Art. 3.VIII) and therefore falls outside the scope of your ARCO/GDPR rights.",
    s4BodyAi:
      "We don't train AI models on identifiable personal data. We do train models on anonymized and aggregated data as described above. We don't share the dataset with third parties for training competing models.",
    s4BodyFeedback:
      "Feedback: any suggestion, idea or comment you communicate to us about the service becomes our property, with no obligation of attribution, compensation or confidentiality, unless expressly agreed in writing.",
    s4DerivedKicker: "DERIVED-DATA LICENSE · PERPETUAL",
    s7L4Kicker: "POST-TERMINATION RETENTION · ANONYMIZED",
    s14Kicker2: "M&A ASSIGNMENT · ECONOMIC VALUE",

    s5Kicker: "05 · CONFIDENTIALITY",
    s5H: "DPA and privacy notice are binding.",
    s5Body: "The following binding documents apply:",
    s5Link1: "Data Processing Agreement (DPA)",
    s5Link2: "Privacy notice",
    s5Link3: "Subprocessors",

    s6Kicker: "06 · PAYMENTS AND BILLING",
    s6H: "Cycle, overages and SLA credits.",
    s6L1: "Plans are billed in advance, monthly or annually, in MXN or USD as you choose.",
    s6L2: "Usage overages (additional seats, NFC stations, API calls over quota) are metered and billed at cycle close.",
    s6L3: "Non-payment after 14 days triggers suspension; after 30 days, account closure with 30-day data-retention for rescue.",
    s6L4: "Enterprise tier includes SLA credits calculated against the availability target published at /status.",

    s7Kicker: "07 · TERMINATION",
    s7H: "Closure by you or by us.",
    s7L1: "You can close your account anytime from Profile → Close account.",
    s7L2: "We reserve the right to suspend service for material breach (fraud, AUP, persistent non-payment) with reasonable prior notice.",
    s7L3: "After closure: identifiable personal data retained 30 days for recovery, then permanent deletion except for legal obligations (billing 5 years, security logs 90 days, anti-fraud signals 24 months).",
    s7L4: "Anonymized data and derived models (calibrated baseline after dissociation, statistical aggregates, neural-engine contributions) are retained indefinitely under the derived-data license (§ 04) and Privacy Notice § 03. This retention survives termination and is a material condition of the agreement.",

    s8Kicker: "08 · WARRANTIES AND DISCLAIMERS",
    s8H: "What we promise and what we don't.",
    s8Body:
      "The service is provided as-is, with reasonable commercial effort of operation. We publish availability targets at /status; the contractual SLA only applies in Enterprise tier. Implied warranties of merchantability and fitness for a particular purpose are disclaimed to the maximum extent permitted by law.",

    s9Kicker: "09 · LIMITATION OF LIABILITY",
    s9H: "Contractual cap and excluded damages.",
    s9Body:
      "BIO-IGNICIÓN's aggregate liability for claims arising from or related to the service shall not exceed the fees paid by the customer in the 12 months prior to the event. Indirect, consequential and moral damages are excluded except for proven willful misconduct or as required by mandatory consumer protection rules.",

    s10Kicker: "10 · INDEMNIFICATION",
    s10H: "Who defends what.",
    s10L1: "We will defend customer against third-party claims alleging that the service infringes that third party's IP, under standard notice and cooperation conditions.",
    s10L2: "Customer will defend us against claims arising from its use in violation of these terms or the AUP.",

    s11Kicker: "11 · FORCE MAJEURE",
    s11H: "Events beyond reasonable control.",
    s11Body:
      "Neither party will be liable for delays or failures caused by force majeure: country-scale regional cloud outages, natural disasters, governmental acts or armed conflict.",

    s12Kicker: "12 · CHANGES TO THESE TERMS",
    s12H: "Versioning and advance notice.",
    s12Body:
      "We version these terms publicly. Material changes are notified by email with at least 30 days' advance notice. If you don't accept a change, you can close your account before the effective date without penalty.",

    s13Kicker: "13 · GOVERNING LAW AND JURISDICTION",
    s13H: "Mexican law, Mexico City courts.",
    s13Body:
      "These terms are governed by Mexican law, without prejudice to mandatory consumer protection rules in your country of residence. Disputes are submitted to the competent courts of Mexico City, except for agreed arbitration.",

    s14Kicker: "14 · ASSIGNMENT AND SUCCESSION",
    s14H: "What happens if the company changes hands.",
    s14Body:
      "BIO-IGNICIÓN may assign this agreement to an affiliate, successor, acquirer or new legal entity resulting from merger, spin-off, corporate restructuring or substantial sale of assets, upon reasonable prior notice. The assignment includes anonymized data, derived models and the licenses granted in § 04, which form part of the economic value of the business. You may not assign your rights or obligations under this agreement without our prior written consent.",

    s15Kicker: "15 · CONTACT",
    s15H: "Where to write us for anything legal.",

    relatedKicker: "RELATED DOCUMENTS",
    relatedH: "Full packet for procurement.",
    relatedBody:
      "All binding documents for enterprise live in the Trust Center. If you need a signed MSA/DPA, write to us.",
    linkPrivacy: "Privacy notice",
    linkAup: "Acceptable use policy",
    linkCookies: "Cookie policy",
    linkDpa: "DPA (downloadable)",
    linkSubs: "Subprocessors",
    linkTrust: "Trust Center",
  },
};

export default async function TermsPage() {
  const locale = await getServerLocale();
  const L = locale === "en" ? "en" : "es";
  const c = COPY[L];
  const en = L === "en";

  const updatedFmt = new Date(LAST_UPDATED).toLocaleDateString(en ? "en-US" : "es-MX", {
    year: "numeric", month: "long", day: "numeric",
  });
  const effectiveFmt = new Date(EFFECTIVE_FROM).toLocaleDateString(en ? "en-US" : "es-MX", {
    year: "numeric", month: "long", day: "numeric",
  });

  const sections = Array.from({ length: 15 }, (_, i) => {
    const n = i + 1;
    const kicker = c[`s${n}Kicker`];
    if (!kicker) return null;
    const [num, title] = kicker.split(" · ");
    return { id: `s${n}`, num, title };
  }).filter(Boolean);

  return (
    <PublicShell activePath="/terms">
      {/* ═══ Hero ═══ */}
      <Container size="lg" className="bi-prose">
        <header className="bi-legal-hero">
          <div aria-hidden className="bi-legal-hero-lattice">
            <BioglyphLattice variant="ambient" />
          </div>
          <span aria-hidden className="bi-legal-hero-aura" />
          <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            <IgnitionReveal sparkOrigin="50% 30%">
              <div style={kickerStyle}>{c.eyebrow}</div>
              <h1
                style={{
                  margin: `${space[3]}px 0 ${space[4]}px`,
                  fontSize: "clamp(36px, 5.2vw, 60px)",
                  letterSpacing: "-0.035em",
                  lineHeight: 1.05,
                }}
              >
                {c.title}
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-editorial), 'Instrument Serif', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: "clamp(18px, 2vw, 22px)",
                  lineHeight: 1.35,
                  color: cssVar.textMuted,
                  maxWidth: "46ch",
                  margin: `0 auto ${space[4]}`,
                }}
              >
                {c.editorial}
              </p>
              <p style={{ color: cssVar.textDim, maxWidth: "62ch", margin: "0 auto" }}>
                {c.intro}
              </p>
              <p style={{ color: cssVar.textMuted, fontSize: font.size.sm, marginBlockStart: space[4], fontFamily: cssVar.fontMono }}>
                {c.version} {VERSION} · {c.effective} <time dateTime={EFFECTIVE_FROM}>{effectiveFmt}</time> · {c.updated} <time dateTime={LAST_UPDATED}>{updatedFmt}</time>
              </p>
            </IgnitionReveal>
          </div>
        </header>
      </Container>

      {/* ═══ Stat strip ═══ */}
      <section aria-label={c.eyebrow} style={{ marginBlockStart: space[7] }}>
        <Container size="xl" style={{ paddingInline: 0 }}>
          <div className="bi-proof-stats bi-proof-stats--label">
            <div>
              <span className="v">v{VERSION}</span>
              <span className="l">{c.statVersion}</span>
              <span className="s">{c.statVersionSub}</span>
            </div>
            <div>
              <span className="v">{en ? "Mexico" : "México"}</span>
              <span className="l">{c.statLaw}</span>
              <span className="s">{c.statLawSub}</span>
            </div>
            <div>
              <span className="v">12 {en ? "months" : "meses"}</span>
              <span className="l">{c.statCap}</span>
              <span className="s">{c.statCapSub}</span>
            </div>
            <div>
              <span className="v">30 {en ? "days" : "días"}</span>
              <span className="l">{c.statNotice}</span>
              <span className="s">{c.statNoticeSub}</span>
            </div>
          </div>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      {/* ═══ TOC ═══ */}
      <Container size="lg" className="bi-prose">
        <nav aria-label={c.toc} className="bi-legal-toc">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="bi-legal-toc-chip">
              <span className="num">{s.num}</span>
              <span>{s.title}</span>
            </a>
          ))}
        </nav>

        {/* ═══ § 1 Aceptación ═══ */}
        <section id="s1" className="bi-legal-section">
          <div style={kickerStyle}>{c.s1Kicker}</div>
          <h2 style={sectionHeading}>{c.s1H}</h2>
          <p style={{ marginBlockStart: space[3] }}>{c.s1Body}</p>
        </section>

        {/* ═══ § 2 Cuenta ═══ */}
        <section id="s2" className="bi-legal-section">
          <div style={kickerStyle}>{c.s2Kicker}</div>
          <h2 style={sectionHeading}>{c.s2H}</h2>
          <p style={{ marginBlockStart: space[3] }}>{c.s2Body}</p>
        </section>

        {/* ═══ § 3 AUP ═══ */}
        <section id="s3" className="bi-legal-section">
          <div style={kickerStyle}>{c.s3Kicker}</div>
          <h2 style={sectionHeading}>{c.s3H}</h2>
          <p style={{ marginBlockStart: space[3] }}>
            {c.s3Body}{" "}
            <a href="/aup" className="bi-legal-link">{c.s3Link}</a>.
          </p>
        </section>

        {/* ═══ § 4 IP + datos derivados ═══ */}
        <section id="s4" className="bi-legal-section">
          <div style={kickerStyle}>{c.s4Kicker}</div>
          <h2 style={sectionHeading}>{c.s4H}</h2>
          <p style={{ marginBlockStart: space[3] }}>{c.s4Body}</p>
          <aside className="bi-legal-callout bi-legal-callout--moat">
            <div className="bi-legal-callout-kicker">{c.s4DerivedKicker}</div>
            <p>{c.s4BodyDerived}</p>
          </aside>
          <p style={{ marginBlockStart: space[4] }}>{c.s4BodyAi}</p>
          <p style={{ color: cssVar.textDim }}>{c.s4BodyFeedback}</p>
        </section>

        {/* ═══ § 5 Confidencialidad ═══ */}
        <section id="s5" className="bi-legal-section">
          <div style={kickerStyle}>{c.s5Kicker}</div>
          <h2 style={sectionHeading}>{c.s5H}</h2>
          <p style={{ marginBlockStart: space[3] }}>{c.s5Body}</p>
          <ul className="bi-legal-list">
            <li><a href="/trust/dpa" className="bi-legal-link">{c.s5Link1}</a></li>
            <li><a href="/privacy" className="bi-legal-link">{c.s5Link2}</a></li>
            <li><a href="/trust/subprocessors" className="bi-legal-link">{c.s5Link3}</a></li>
          </ul>
        </section>

        {/* ═══ § 6 Pagos ═══ */}
        <section id="s6" className="bi-legal-section">
          <div style={kickerStyle}>{c.s6Kicker}</div>
          <h2 style={sectionHeading}>{c.s6H}</h2>
          <ul className="bi-legal-list">
            <li>{c.s6L1}</li>
            <li>{c.s6L2}</li>
            <li>{c.s6L3}</li>
            <li>{c.s6L4}</li>
          </ul>
        </section>

        {/* ═══ § 7 Terminación ═══ */}
        <section id="s7" className="bi-legal-section">
          <div style={kickerStyle}>{c.s7Kicker}</div>
          <h2 style={sectionHeading}>{c.s7H}</h2>
          <ul className="bi-legal-list">
            <li>{c.s7L1}</li>
            <li>{c.s7L2}</li>
            <li>{c.s7L3}</li>
          </ul>
          <aside className="bi-legal-callout bi-legal-callout--moat">
            <div className="bi-legal-callout-kicker">{c.s7L4Kicker}</div>
            <p>{c.s7L4}</p>
          </aside>
        </section>

        {/* ═══ § 8 Garantías ═══ */}
        <section id="s8" className="bi-legal-section">
          <div style={kickerStyle}>{c.s8Kicker}</div>
          <h2 style={sectionHeading}>{c.s8H}</h2>
          <p style={{ marginBlockStart: space[3] }}>{c.s8Body}</p>
        </section>

        {/* ═══ § 9 Limitación ═══ */}
        <section id="s9" className="bi-legal-section">
          <div style={kickerStyle}>{c.s9Kicker}</div>
          <h2 style={sectionHeading}>{c.s9H}</h2>
          <p style={{ marginBlockStart: space[3] }}>{c.s9Body}</p>
        </section>

        {/* ═══ § 10 Indemnización ═══ */}
        <section id="s10" className="bi-legal-section">
          <div style={kickerStyle}>{c.s10Kicker}</div>
          <h2 style={sectionHeading}>{c.s10H}</h2>
          <ul className="bi-legal-list">
            <li>{c.s10L1}</li>
            <li>{c.s10L2}</li>
          </ul>
        </section>

        {/* ═══ § 11 Fuerza mayor ═══ */}
        <section id="s11" className="bi-legal-section">
          <div style={kickerStyle}>{c.s11Kicker}</div>
          <h2 style={sectionHeading}>{c.s11H}</h2>
          <p style={{ marginBlockStart: space[3] }}>{c.s11Body}</p>
        </section>

        {/* ═══ § 12 Cambios ═══ */}
        <section id="s12" className="bi-legal-section">
          <div style={kickerStyle}>{c.s12Kicker}</div>
          <h2 style={sectionHeading}>{c.s12H}</h2>
          <p style={{ marginBlockStart: space[3] }}>{c.s12Body}</p>
        </section>

        {/* ═══ § 13 Ley ═══ */}
        <section id="s13" className="bi-legal-section">
          <div style={kickerStyle}>{c.s13Kicker}</div>
          <h2 style={sectionHeading}>{c.s13H}</h2>
          <p style={{ marginBlockStart: space[3] }}>{c.s13Body}</p>
        </section>

        {/* ═══ § 14 Cesión y sucesión ═══ */}
        <section id="s14" className="bi-legal-section">
          <div style={kickerStyle}>{c.s14Kicker}</div>
          <h2 style={sectionHeading}>{c.s14H}</h2>
          <aside className="bi-legal-callout bi-legal-callout--moat" style={{ marginBlockStart: space[3] }}>
            <div className="bi-legal-callout-kicker">{c.s14Kicker2}</div>
            <p>{c.s14Body}</p>
          </aside>
        </section>

        {/* ═══ § 15 Contacto ═══ */}
        <section id="s15" className="bi-legal-section">
          <div style={kickerStyle}>{c.s15Kicker}</div>
          <h2 style={sectionHeading}>{c.s15H}</h2>
          <p style={{ marginBlockStart: space[3] }}>
            <a href="mailto:legal@bio-ignicion.app" className="bi-legal-link">legal@bio-ignicion.app</a>
          </p>
        </section>
      </Container>

      <PulseDivider intensity="dim" />

      {/* ═══ Related legal docs ═══ */}
      <Container size="lg" className="bi-prose">
        <section aria-labelledby="terms-related" className="bi-legal-related">
          <div style={kickerStyle}>{c.relatedKicker}</div>
          <h2 id="terms-related" style={sectionHeading}>{c.relatedH}</h2>
          <p style={{ marginBlockStart: space[3], color: cssVar.textDim, maxWidth: "58ch" }}>{c.relatedBody}</p>
          <ul className="bi-legal-related-grid">
            <li><a href="/privacy" className="bi-legal-related-card">{c.linkPrivacy}</a></li>
            <li><a href="/aup" className="bi-legal-related-card">{c.linkAup}</a></li>
            <li><a href="/cookies" className="bi-legal-related-card">{c.linkCookies}</a></li>
            <li><a href="/trust/dpa" className="bi-legal-related-card">{c.linkDpa}</a></li>
            <li><a href="/trust/subprocessors" className="bi-legal-related-card">{c.linkSubs}</a></li>
            <li><a href="/trust" className="bi-legal-related-card">{c.linkTrust}</a></li>
          </ul>
        </section>
      </Container>
    </PublicShell>
  );
}
