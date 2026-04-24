import Link from "next/link";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font, bioSignal } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";
import IgnitionReveal from "@/components/brand/IgnitionReveal";
import BioglyphLattice from "@/components/brand/BioglyphLattice";
import PulseDivider from "@/components/brand/PulseDivider";

export const metadata = {
  title: "DPA — Data Processing Addendum",
  description: "Acuerdo de procesamiento de datos. GDPR, LFPDPPP, LGPD, CCPA. SCCs 2021/914. Notificación de brechas en 72h.",
  alternates: { canonical: "/trust/dpa" },
  openGraph: {
    title: "BIO-IGNICIÓN · DPA",
    description: "Acuerdo de procesamiento de datos — vigente y firmable bajo contrato.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
};

const kickerStyle = {
  fontSize: font.size.xs,
  fontFamily: cssVar.fontMono,
  color: bioSignal.phosphorCyanInk,
  textTransform: "uppercase",
  letterSpacing: "0.28em",
  fontWeight: font.weight.bold,
};

const sectionHeading = {
  margin: 0,
  fontSize: "clamp(26px, 3.2vw, 36px)",
  letterSpacing: "-0.025em",
  lineHeight: 1.12,
  fontWeight: font.weight.black,
  color: cssVar.text,
};

const COPY = {
  es: {
    crumbKicker: "TRUST ·",
    crumbLabel: "DPA",
    crumbBack: "← Volver al Trust Center",
    eyebrow: "TRUST · DPA",
    h1: "Data Processing Addendum.",
    editorial: "El anexo que firma tu DPO — con fechas, con SCCs, con ventanas.",
    p: "Este documento resume el DPA que firmamos con clientes como anexo al contrato de servicios. Aplica GDPR, LFPDPPP (MX), LGPD (BR) y CCPA (CA). El contenido vinculante es la versión firmada; cualquier discrepancia con este resumen se resuelve a favor del texto firmado.",
    versionLabel: "VERSIÓN",
    version: "1.2",
    effectiveLabel: "VIGENTE DESDE",
    effectiveDate: "2026-04-01",
    effectiveLabelFmt: "1 · abril · 2026",
    lastUpdatedLabel: "ÚLTIMA ACTUALIZACIÓN",
    lastUpdatedDate: "2026-04-20",
    lastUpdatedFmt: "20 · abril · 2026",
    contactLabel: "Legal",
    contactEmail: "legal@bio-ignicion.app",
    governingLaw: "Regido por las leyes de México; idiomas equivalentes ES/EN.",

    tldrKicker: "TL;DR · SI SOLO LEES TRES COSAS",
    tldrItems: [
      { n: "01", k: "72 h", v: "Notificación de brechas al contacto designado." },
      { n: "02", k: "30 días", v: "Aviso anticipado antes de un nuevo subencargado." },
      { n: "03", k: "Cero", v: "Entrenamiento de IA con datos de clientes." },
    ],

    navKicker: "SALTAR A",
    navItems: [
      { label: "TL;DR", href: "#dpa-tldr" },
      { label: "Compromisos", href: "#dpa-highlights" },
      { label: "Configuración", href: "#dpa-group-setup" },
      { label: "Seguridad", href: "#dpa-group-security" },
      { label: "Operación", href: "#dpa-group-ops" },
      { label: "Auditoría", href: "#dpa-audit" },
      { label: "Firmar", href: "#dpa-cta" },
    ],

    highlightsKicker: "COMPROMISOS CLAVE",
    highlightsH: "Cuatro ventanas que tu DPO puede auditar.",
    highlights: [
      { k: "72 h", v: "Ventana de notificación de brechas al contacto designado." },
      { k: "30 días", v: "Aviso anticipado antes de incorporar un nuevo subencargado." },
      { k: "SCCs UE 2021/914", v: "Cláusulas tipo para transferencias internacionales + TIA cuando aplique." },
      { k: "4 regiones", v: "Residencia de datos seleccionable: US · EU · APAC · LATAM." },
    ],

    clausesKicker: "CLÁUSULAS",
    clausesH: "Diez bloques — en el orden que tu legal los revisa.",
    clausesIntro: "Los títulos siguen la estructura estándar EDPB. Las cláusulas firmadas contienen el lenguaje completo; este resumen no las sustituye. Cada bloque es citable por su ID (#clause-01).",
    clauseGroups: [
      { id: "setup", kicker: "CONFIGURACIÓN", label: "Partes, instrucciones y personal" },
      { id: "security", kicker: "SEGURIDAD", label: "Medidas, subencargados y transferencias" },
      { id: "ops", kicker: "OPERACIÓN", label: "Derechos, brechas, auditoría y cierre" },
    ],
    clauses: [
      { n: "01", g: "setup", k: "Roles", v: "El cliente es controlador; BIO-IGNICIÓN es encargado/procesador. Ambos mantienen sus responsabilidades originales bajo la ley aplicable." },
      { n: "02", g: "setup", k: "Instrucciones documentadas", v: "Procesamos datos personales solo conforme a las instrucciones documentadas del cliente, salvo obligación legal preexistente que el encargado notifica antes de cumplirla." },
      { n: "03", g: "setup", k: "Confidencialidad del personal", v: "Todo el personal con acceso a datos personales firma acuerdos de confidencialidad perpetuos. Acceso revocado el mismo día al cese o cambio de rol." },
      { n: "04", g: "security", k: "Medidas técnicas y organizativas", v: "TLS 1.3, AES-256-GCM en reposo, SSO/SAML, MFA obligatorio para admin, auditoría append-only con cadena SHA-256, RLS en Postgres, BYOK opcional en tiers habilitados. Detalle en el Trust Center." },
      { n: "05", g: "security", k: "Subencargados", v: "Lista completa y auditable en /trust/subprocessors. Notificamos altas o cambios materiales con 30 días de antelación vía email y en la página pública — el cliente puede objetar por escrito." },
      { n: "06", g: "security", k: "Transferencias internacionales", v: "SCCs UE 2021/914 para datos que salen del EEE, más evaluación de impacto de transferencia (TIA) cuando el régimen jurídico de destino lo requiera. Residencia seleccionable por proyecto." },
      { n: "07", g: "ops", k: "Derechos del titular", v: "Asistencia al cliente para atender solicitudes de acceso, rectificación, supresión, portabilidad y objeción. Endpoints de exportación y borrado documentados en la API pública." },
      { n: "08", g: "ops", k: "Notificación de brechas", v: "Notificación sin demora injustificada y en cualquier caso dentro de las 72 horas al contacto designado, con información suficiente para que el controlador cumpla sus obligaciones." },
      { n: "09", g: "ops", k: "Auditoría", v: "Reportes de auditoría independiente (SOC 2 Type II una vez emitido el informe inicial) compartidos bajo NDA. Auditoría in-situ cuando la ley aplicable lo requiera, con aviso razonable y durante horario laboral." },
      { n: "10", g: "ops", k: "Retención y devolución", v: "Devolución o supresión certificada de los datos del cliente dentro de 30 días al término del contrato, salvo obligación legal de retención — documentada por escrito al cliente." },
    ],
    anchorLabel: "Copiar enlace permanente",

    auditKicker: "ESTADO DE AUDITORÍA",
    auditH: "Lo que existe hoy — y lo que aún no.",
    auditBody: "Este DPA es vinculante una vez firmado, con independencia del estado de las certificaciones. Los reportes externos refuerzan pero no sustituyen las obligaciones contractuales.",
    auditItems: [
      { k: "SOC 2 Type II", v: "En auditoría. Reporte compartible bajo NDA una vez emitido.", tone: "inprogress", meta: "ETA 2026-Q4" },
      { k: "ISO 27001 / 27701", v: "Gap assessment en curso. Fecha objetivo pública en /trust.", tone: "todo", meta: "ETA 2027-Q2" },
      { k: "HIPAA BAA", v: "Firmable en tiers Enterprise+ con controles específicos documentados.", tone: "ready", meta: "Enterprise+" },
      { k: "DPIA · EIPD", v: "Evaluaciones de impacto disponibles a petición para procesamientos de alto riesgo.", tone: "ready", meta: "a petición" },
    ],

    ctaKicker: "FIRMAR",
    ctaH: "Para recibir el DPA firmado.",
    ctaBody: "Escribe a Legal con el nombre de tu entidad, país de registro y contacto del DPO. Normalmente respondemos en < 48 h hábiles con la versión para firma.",
    ctaPrimary: "Solicitar DPA firmado",
    ctaPrimaryHref: "mailto:legal@bio-ignicion.app?subject=DPA%20signature%20request",
    ctaSecondary: "Lista de subencargados",
    ctaSecondaryHref: "/trust/subprocessors",
    ctaNote: "El DPA se firma como anexo al contrato maestro. No hay costo por firma.",

    legalKicker: "AVISO LEGAL · ALCANCE",
    legalHint: "Leer",
    legalItems: [
      "Este resumen no sustituye el DPA firmado. En caso de conflicto con el contenido vinculante, prevalece la versión firmada entre BIO-IGNICIÓN y el cliente.",
      "No vendemos ni cedemos datos personales a terceros para marketing ni venta. Los subencargados operacionales necesarios para prestar el servicio se listan en /trust/subprocessors y están sujetos a este DPA.",
      "No entrenamos modelos de IA con datos de clientes — el DPA lo formaliza por escrito. La funcionalidad de LLM Coach es opt-in y usa Anthropic como subencargado con política de zero-retention.",
      "Ley aplicable y jurisdicción: regido por las leyes de México, salvo que el contrato firmado con el cliente establezca expresamente otra jurisdicción. Los textos ES y EN son equivalentes; en caso de divergencia, prevalece el idioma designado en el contrato firmado.",
      "Las fechas citadas (vigencia, última actualización, objetivos de certificación) reflejan el estado al 2026-04-20 y se actualizan al menos cada trimestre.",
      "SOC 2, ISO 27001, GDPR, HIPAA, LFPDPPP, LGPD y CCPA se mencionan únicamente para describir el marco normativo aplicable; no constituyen certificaciones activas salvo que se indique expresamente en /trust.",
    ],
    legalTailLink: "Binding documents:",
    legalTailLinks: [
      { label: "Trust Center", href: "/trust" },
      { label: "Política de privacidad", href: "/privacy" },
      { label: "Términos", href: "/terms" },
    ],
  },

  en: {
    crumbKicker: "TRUST ·",
    crumbLabel: "DPA",
    crumbBack: "← Back to Trust Center",
    eyebrow: "TRUST · DPA",
    h1: "Data Processing Addendum.",
    editorial: "The addendum your DPO signs — with dates, with SCCs, with windows.",
    p: "This document summarizes the DPA we sign with customers as an addendum to the services agreement. It applies GDPR, LFPDPPP (MX), LGPD (BR) and CCPA (CA). The binding text is the signed version; any discrepancy with this summary is resolved in favor of the signed document.",
    versionLabel: "VERSION",
    version: "1.2",
    effectiveLabel: "EFFECTIVE FROM",
    effectiveDate: "2026-04-01",
    effectiveLabelFmt: "April 1, 2026",
    lastUpdatedLabel: "LAST UPDATED",
    lastUpdatedDate: "2026-04-20",
    lastUpdatedFmt: "April 20, 2026",
    contactLabel: "Legal",
    contactEmail: "legal@bio-ignicion.app",
    governingLaw: "Governed by Mexican law; ES/EN texts are equivalent.",

    tldrKicker: "TL;DR · IF YOU ONLY READ THREE THINGS",
    tldrItems: [
      { n: "01", k: "72 h", v: "Breach notification to the designated contact." },
      { n: "02", k: "30 days", v: "Advance notice before a new subprocessor." },
      { n: "03", k: "Zero", v: "AI model training on customer data." },
    ],

    navKicker: "JUMP TO",
    navItems: [
      { label: "TL;DR", href: "#dpa-tldr" },
      { label: "Commitments", href: "#dpa-highlights" },
      { label: "Setup", href: "#dpa-group-setup" },
      { label: "Security", href: "#dpa-group-security" },
      { label: "Operations", href: "#dpa-group-ops" },
      { label: "Audit", href: "#dpa-audit" },
      { label: "Signing", href: "#dpa-cta" },
    ],

    highlightsKicker: "KEY COMMITMENTS",
    highlightsH: "Four windows your DPO can audit.",
    highlights: [
      { k: "72 h", v: "Breach notification window to the customer's designated contact." },
      { k: "30 days", v: "Advance notice before onboarding a new subprocessor." },
      { k: "EU SCCs 2021/914", v: "Standard clauses for international transfers + TIA when required." },
      { k: "4 regions", v: "Selectable data residency: US · EU · APAC · LATAM." },
    ],

    clausesKicker: "CLAUSES",
    clausesH: "Ten blocks — in the order your legal team reviews them.",
    clausesIntro: "Titles follow the standard EDPB structure. The signed clauses contain the full language; this summary does not replace them. Each block is citable by its ID (#clause-01).",
    clauseGroups: [
      { id: "setup", kicker: "SETUP", label: "Parties, instructions and personnel" },
      { id: "security", kicker: "SECURITY", label: "Measures, subprocessors and transfers" },
      { id: "ops", kicker: "OPERATIONS", label: "Rights, breaches, audit and closing" },
    ],
    clauses: [
      { n: "01", g: "setup", k: "Roles", v: "The customer is controller; BIO-IGNICIÓN is processor. Each party retains its original responsibilities under applicable law." },
      { n: "02", g: "setup", k: "Documented instructions", v: "We process personal data only under the customer's documented instructions, save for pre-existing legal obligations which the processor notifies before complying." },
      { n: "03", g: "setup", k: "Personnel confidentiality", v: "All personnel with access to personal data sign perpetual confidentiality agreements. Access revoked same-day upon termination or role change." },
      { n: "04", g: "security", k: "Technical & organizational measures", v: "TLS 1.3, AES-256-GCM at rest, SSO/SAML, mandatory admin MFA, append-only audit log with SHA-256 chain, Postgres RLS, optional BYOK on enabled tiers. Detail in the Trust Center." },
      { n: "05", g: "security", k: "Subprocessors", v: "Complete auditable list at /trust/subprocessors. Additions or material changes notified 30 days in advance via email and public page — customer may object in writing." },
      { n: "06", g: "security", k: "International transfers", v: "EU SCCs 2021/914 for data leaving the EEA, plus Transfer Impact Assessment (TIA) when the destination legal regime requires it. Residency selectable per project." },
      { n: "07", g: "ops", k: "Data subject rights", v: "Customer assistance for access, rectification, erasure, portability and objection requests. Export and deletion endpoints documented in the public API." },
      { n: "08", g: "ops", k: "Breach notification", v: "Notification without undue delay and in any event within 72 hours to the designated contact, with sufficient information for the controller to meet its own obligations." },
      { n: "09", g: "ops", k: "Audit", v: "Independent audit reports (SOC 2 Type II once the initial report is issued) shared under NDA. On-site audit when applicable law requires, with reasonable notice during business hours." },
      { n: "10", g: "ops", k: "Retention & return", v: "Certified return or deletion of customer data within 30 days of contract termination, except for legal retention obligations — documented in writing to the customer." },
    ],
    anchorLabel: "Copy permanent link",

    auditKicker: "AUDIT STATUS",
    auditH: "What exists today — and what doesn't yet.",
    auditBody: "This DPA is binding once signed, regardless of certification status. External reports reinforce but do not replace contractual obligations.",
    auditItems: [
      { k: "SOC 2 Type II", v: "In audit. Report shareable under NDA once issued.", tone: "inprogress", meta: "ETA 2026-Q4" },
      { k: "ISO 27001 / 27701", v: "Gap assessment in progress. Public target date in /trust.", tone: "todo", meta: "ETA 2027-Q2" },
      { k: "HIPAA BAA", v: "Signable on Enterprise+ tiers with documented controls.", tone: "ready", meta: "Enterprise+" },
      { k: "DPIA", v: "Impact assessments available on request for high-risk processing.", tone: "ready", meta: "on request" },
    ],

    ctaKicker: "SIGNING",
    ctaH: "To receive the signed DPA.",
    ctaBody: "Email Legal with your entity name, country of registration and DPO contact. We typically respond within < 48 business hours with the version for signature.",
    ctaPrimary: "Request signed DPA",
    ctaPrimaryHref: "mailto:legal@bio-ignicion.app?subject=DPA%20signature%20request",
    ctaSecondary: "Subprocessor list",
    ctaSecondaryHref: "/trust/subprocessors",
    ctaNote: "The DPA is signed as an addendum to the master agreement. There is no signing fee.",

    legalKicker: "LEGAL NOTICE · SCOPE",
    legalHint: "Read",
    legalItems: [
      "This summary does not replace the signed DPA. In case of conflict with binding content, the version signed between BIO-IGNICIÓN and the customer prevails.",
      "We do not sell or share personal data with third parties for marketing or sale. Operational subprocessors needed to deliver the service are listed at /trust/subprocessors and are subject to this DPA.",
      "We do not train AI models on customer data — the DPA formalizes this in writing. The LLM Coach feature is opt-in and uses Anthropic as a subprocessor with a zero-retention policy.",
      "Governing law and jurisdiction: governed by the laws of Mexico, unless the signed customer agreement expressly establishes another jurisdiction. The ES and EN texts are equivalent; in case of divergence, the language designated in the signed contract prevails.",
      "Cited dates (effective date, last update, certification targets) reflect status as of 2026-04-20 and are updated at least quarterly.",
      "SOC 2, ISO 27001, GDPR, HIPAA, LFPDPPP, LGPD and CCPA are mentioned only to describe the applicable regulatory framework; they do not constitute active certifications unless explicitly stated in /trust.",
    ],
    legalTailLink: "Binding documents:",
    legalTailLinks: [
      { label: "Trust Center", href: "/trust" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
};

export default async function DPA() {
  const locale = await getServerLocale();
  const L = locale === "en" ? "en" : "es";
  const c = COPY[L];

  return (
    <PublicShell activePath="/trust/dpa">
      {/* ═══ Hero ═══ */}
      <Container size="lg" className="bi-prose">
        <div style={{ position: "relative", paddingBlock: space[8] }}>
          <div aria-hidden className="bi-trust-lattice">
            <BioglyphLattice variant="ambient" />
          </div>

          <IgnitionReveal sparkOrigin="30% 40%">
            <div style={{ position: "relative", zIndex: 1, maxInlineSize: 760 }}>
              <Link href="/trust" className="bi-trust-crumb">
                <span aria-hidden>←</span> {c.crumbBack}
              </Link>
              <div style={{ ...kickerStyle, marginBlockStart: space[3] }}>{c.eyebrow}</div>
              <h1
                style={{
                  margin: `${space[3]}px 0 ${space[4]}px`,
                  fontSize: "clamp(36px, 5.2vw, 62px)",
                  letterSpacing: "-0.035em",
                  lineHeight: 1.04,
                }}
              >
                {c.h1}
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-editorial), 'Instrument Serif', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: "clamp(18px, 2.2vw, 22px)",
                  lineHeight: 1.35,
                  color: cssVar.textMuted,
                  margin: `0 0 ${space[4]}px`,
                }}
              >
                {c.editorial}
              </p>
              <p style={{ margin: `0 0 ${space[5]}px`, lineHeight: 1.6, color: cssVar.textDim }}>
                {c.p}
              </p>

              <div className="bi-trust-meta" role="group" aria-label={c.versionLabel}>
                <span className="bi-trust-meta-kicker">{c.versionLabel}</span>
                <span className="bi-trust-meta-time">{c.version}</span>
                <span className="bi-trust-meta-dot" aria-hidden>·</span>
                <span className="bi-trust-meta-kicker">{c.effectiveLabel}</span>
                <time className="bi-trust-meta-time" dateTime={c.effectiveDate}>{c.effectiveLabelFmt}</time>
                <span className="bi-trust-meta-dot" aria-hidden>·</span>
                <span className="bi-trust-meta-kicker">{c.lastUpdatedLabel}</span>
                <time className="bi-trust-meta-time" dateTime={c.lastUpdatedDate}>{c.lastUpdatedFmt}</time>
                <span className="bi-trust-meta-dot" aria-hidden>·</span>
                <span className="bi-trust-meta-kicker">{c.contactLabel}</span>
                <a className="bi-trust-meta-mail" href={`mailto:${c.contactEmail}`}>{c.contactEmail}</a>
              </div>
              <p className="bi-trust-fineprint">{c.governingLaw}</p>
            </div>
          </IgnitionReveal>
        </div>
      </Container>

      {/* ═══ TL;DR strip ═══ */}
      <section aria-labelledby="dpa-tldr" id="dpa-tldr" style={{ paddingInline: space[5], paddingBlockStart: space[5], scrollMarginBlockStart: 80 }}>
        <Container size="lg">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div className="bi-trust-tldr">
              <div className="bi-trust-tldr-head">
                <span className="bi-trust-tldr-kicker">{c.tldrKicker}</span>
              </div>
              <ol className="bi-trust-tldr-list" role="list">
                {c.tldrItems.map((t) => (
                  <li key={t.n} className="bi-trust-tldr-item">
                    <span className="bi-trust-tldr-n" aria-hidden>{t.n}</span>
                    <span className="bi-trust-tldr-k">{t.k}</span>
                    <span className="bi-trust-tldr-v">{t.v}</span>
                  </li>
                ))}
              </ol>
            </div>
          </IgnitionReveal>
        </Container>
      </section>

      {/* ═══ Quick-nav chip strip ═══ */}
      <nav aria-label={c.navKicker} className="bi-trust-nav-wrap">
        <Container size="lg">
          <div className="bi-trust-nav">
            <span className="bi-trust-nav-kicker" aria-hidden>{c.navKicker}</span>
            <ul className="bi-trust-nav-list" role="list">
              {c.navItems.map((n) => (
                <li key={n.href}>
                  <a className="bi-trust-nav-chip" href={n.href}>{n.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </nav>

      {/* ═══ Key commitments chip strip ═══ */}
      <section aria-labelledby="dpa-highlights" id="dpa-highlights" style={{ paddingInline: space[5], paddingBlockStart: space[7], scrollMarginBlockStart: 80 }}>
        <Container size="lg">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[6] }}>
              <div style={kickerStyle}>{c.highlightsKicker}</div>
              <h2 style={sectionHeading}>{c.highlightsH}</h2>
            </div>
            <ul className="bi-trust-highlights" role="list">
              {c.highlights.map((h) => (
                <li key={h.k} className="bi-trust-highlight">
                  <span className="bi-trust-highlight-k">{h.k}</span>
                  <span className="bi-trust-highlight-v">{h.v}</span>
                </li>
              ))}
            </ul>
          </IgnitionReveal>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      {/* ═══ Clauses (grouped) ═══ */}
      <section className="bi-trust-section bi-trust-section--tint" aria-labelledby="dpa-clauses" style={{ paddingBlock: space[9], paddingInline: space[5], scrollMarginBlockStart: 80 }}>
        <Container size="lg">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[7] }}>
              <div style={kickerStyle}>{c.clausesKicker}</div>
              <h2 id="dpa-clauses" style={sectionHeading}>{c.clausesH}</h2>
              <p style={{
                marginBlockStart: space[3],
                marginInline: "auto",
                maxInlineSize: 640,
                color: cssVar.textDim,
                fontSize: font.size.md,
                lineHeight: 1.6,
              }}>
                {c.clausesIntro}
              </p>
            </div>
            {c.clauseGroups.map((group) => {
              const items = c.clauses.filter((x) => x.g === group.id);
              return (
                <div key={group.id} className="bi-trust-clause-group">
                  <div className="bi-trust-clause-group-head" id={`dpa-group-${group.id}`}>
                    <span className="bi-trust-clause-group-kicker">{group.kicker}</span>
                    <span className="bi-trust-clause-group-label">{group.label}</span>
                    <span className="bi-trust-clause-group-rule" aria-hidden />
                  </div>
                  <ol className="bi-trust-principles" role="list">
                    {items.map((p) => (
                      <li key={p.n} className="bi-trust-principle" id={`clause-${p.n}`}>
                        <span className="bi-trust-principle-n" aria-hidden>{p.n}</span>
                        <div className="bi-trust-principle-body">
                          <h3 className="bi-trust-principle-k">
                            {p.k}
                            <a className="bi-trust-anchor" href={`#clause-${p.n}`} aria-label={c.anchorLabel}>#</a>
                          </h3>
                          <p className="bi-trust-principle-v">{p.v}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
          </IgnitionReveal>
        </Container>
      </section>

      {/* ═══ Audit status ═══ */}
      <section aria-labelledby="dpa-audit-h" id="dpa-audit" style={{ paddingBlock: space[9], paddingInline: space[5], scrollMarginBlockStart: 80 }}>
        <Container size="lg">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[6] }}>
              <div style={kickerStyle}>{c.auditKicker}</div>
              <h2 id="dpa-audit-h" style={sectionHeading}>{c.auditH}</h2>
              <p style={{
                marginBlockStart: space[3],
                marginInline: "auto",
                maxInlineSize: 620,
                color: cssVar.textDim,
                fontSize: font.size.md,
                lineHeight: 1.6,
              }}>
                {c.auditBody}
              </p>
            </div>
            <ul className="bi-trust-audit-grid" role="list">
              {c.auditItems.map((a) => (
                <li key={a.k} className="bi-trust-audit-item" data-tone={a.tone}>
                  <span className="bi-trust-audit-dot" aria-hidden />
                  <span className="bi-trust-audit-k">{a.k}</span>
                  <span className="bi-trust-audit-meta">{a.meta}</span>
                  <span className="bi-trust-audit-v">{a.v}</span>
                </li>
              ))}
            </ul>
          </IgnitionReveal>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      {/* ═══ CTA ═══ */}
      <section className="bi-trust-section bi-trust-section--tint bi-trust-section--tint-alt" aria-labelledby="dpa-cta" style={{ paddingBlock: space[8], paddingInline: space[5] }}>
        <Container size="md">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center" }}>
              <div style={kickerStyle}>{c.ctaKicker}</div>
              <h2 id="dpa-cta" style={sectionHeading}>{c.ctaH}</h2>
              <p style={{
                marginBlockStart: space[3],
                marginInline: "auto",
                maxInlineSize: 600,
                color: cssVar.textDim,
                fontSize: font.size.md,
                lineHeight: 1.6,
              }}>
                {c.ctaBody}
              </p>
              <div className="bi-trust-hero-ctas" style={{ justifyContent: "center", marginBlockStart: space[5] }}>
                <a className="bi-trust-hero-cta bi-trust-hero-cta--primary" href={c.ctaPrimaryHref}>
                  {c.ctaPrimary}
                  <span className="bi-trust-hero-cta-arrow" aria-hidden>→</span>
                </a>
                <Link className="bi-trust-hero-cta bi-trust-hero-cta--ghost" href={c.ctaSecondaryHref}>
                  {c.ctaSecondary}
                </Link>
              </div>
              <span className="bi-trust-hero-cta-note" style={{ display: "block", marginBlockStart: space[3] }}>
                {c.ctaNote}
              </span>
            </div>
          </IgnitionReveal>
        </Container>
      </section>

      {/* ═══ Legal disclaimer (collapsible) ═══ */}
      <Container size="md" style={{ paddingInline: space[5], paddingBlockEnd: space[8], paddingBlockStart: space[7] }}>
        <details className="bi-pricing-legal" role="note">
          <summary className="bi-pricing-legal-summary">
            <span className="bi-pricing-legal-kicker">{c.legalKicker}</span>
            <span className="bi-pricing-legal-hint">
              {c.legalHint}
              <span className="chev" aria-hidden>▾</span>
            </span>
          </summary>
          <ul className="bi-trust-legal-list">
            {c.legalItems.map((item, i) => <li key={i}>{item}</li>)}
            <li>
              {c.legalTailLink}{" "}
              {c.legalTailLinks.map((l, i) => (
                <span key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                  {i < c.legalTailLinks.length - 1 ? " · " : "."}
                </span>
              ))}
            </li>
          </ul>
        </details>
      </Container>
    </PublicShell>
  );
}
