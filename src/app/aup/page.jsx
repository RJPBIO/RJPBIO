/* ═══════════════════════════════════════════════════════════════
   /aup — Política de uso aceptable. Prohibiciones categorizadas
   (compliance · abuso · técnico · comercial), canal de reporte,
   consecuencias graduadas.
   ═══════════════════════════════════════════════════════════════ */

import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font, bioSignal } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";
import IgnitionReveal from "@/components/brand/IgnitionReveal";
import BioglyphLattice from "@/components/brand/BioglyphLattice";
import PulseDivider from "@/components/brand/PulseDivider";

export const metadata = {
  title: "Política de Uso Aceptable",
  description: "Política de uso aceptable · cuatro categorías de prohibiciones · canal abuse@ con respuesta en <72 h.",
  alternates: { canonical: "/aup" },
};

const LAST_UPDATED = "2026-04-20";
const VERSION = "1.1";
const EFFECTIVE_FROM = "2026-04-01";

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
  fontSize: "clamp(22px, 2.6vw, 28px)",
  letterSpacing: "-0.02em",
  lineHeight: 1.2,
  fontWeight: font.weight.black,
  color: cssVar.text,
};

const COPY = {
  es: {
    eyebrow: "POLÍTICA DE USO ACEPTABLE",
    title: "Para qué se usa. Y para qué no.",
    editorial: "Una herramienta clínica seria necesita reglas claras. Estas.",
    intro:
      "Esta política define el uso inaceptable del servicio. Complementa los Términos de Servicio. El incumplimiento puede implicar suspensión inmediata o cierre de cuenta, según gravedad.",
    updated: "Actualizado",
    version: "Versión",
    effective: "Vigente desde",

    statCategories: "Categorías",
    statCategoriesSub: "compliance · abuso · técnico · comercial",
    statChannel: "Canal de reporte",
    statChannelSub: "abuse@bio-ignicion.app",
    statResponse: "Primera respuesta",
    statResponseSub: "< 72 h laborales",
    statEffect: "Medidas graduadas",
    statEffectSub: "aviso · suspensión · cierre",

    s1Kicker: "01 · COMPLIANCE",
    s1H: "Lo que afecta la base legal del tratamiento.",
    s1L1: "Almacenar datos personales sin base legal válida (consentimiento, contrato, obligación legal, interés legítimo o vital).",
    s1L2: "Procesar categorías especiales (salud, biometría, datos sensibles) sin BAA/DPA firmado y sin consentimiento explícito del titular.",
    s1L3: "Transferir datos a jurisdicciones sin garantías adecuadas (SCC, adequacy decision).",
    s1L4: "Usar el servicio para actividades ilegales en tu jurisdicción o la nuestra.",

    s2Kicker: "02 · ABUSO",
    s2H: "Lo que daña a otros usuarios o a terceros.",
    s2L1: "Enviar malware, phishing, spam, o cualquier código malicioso desde la infraestructura de BIO-IGNICIÓN.",
    s2L2: "Intentos de acceso no autorizado a cuentas ajenas, credential stuffing, enumeración de usuarios.",
    s2L3: "Acoso, doxxing o amenazas usando los canales de comunicación del servicio.",
    s2L4: "Impersonación de terceros o emisión de contenido que suplante identidad ajena.",

    s3Kicker: "03 · TÉCNICO",
    s3H: "Lo que rompe o degrada la plataforma.",
    s3L1: "Evadir rate-limits, cuotas de API o controles de seguridad por medios no documentados.",
    s3L2: "Scraping masivo o cargas sintéticas más allá de lo razonable para tu caso de uso.",
    s3L3: "Ingeniería inversa, desensamblado, o intento de extraer secretos (claves, modelos, tokens).",
    s3L4: "Pruebas de seguridad (pentesting) sin autorización previa por escrito — escribe a security@ para coordinar.",

    s4Kicker: "04 · COMERCIAL",
    s4H: "Lo que cruza la frontera del acuerdo comercial.",
    s4L1: "Revender el servicio, reempaquetarlo o licenciar acceso a terceros sin acuerdo explícito.",
    s4L2: "Usar el servicio para entrenar modelos de IA que compitan directamente con BIO-IGNICIÓN.",
    s4L3: "Representar falsamente partnership, endorsement o integración oficial donde no exista.",

    s5Kicker: "05 · CONSECUENCIAS",
    s5H: "Medidas graduadas, proporcionadas al incumplimiento.",
    s5L1: "Incumplimiento leve o ambiguo: aviso escrito con plazo de subsanación.",
    s5L2: "Incumplimiento material o reiterado: suspensión inmediata del servicio.",
    s5L3: "Fraude, actividad ilegal o riesgo crítico de seguridad: cierre de cuenta sin previo aviso, con retención de datos conforme a obligaciones legales.",
    s5L4: "Cooperamos con autoridades competentes cuando lo exija la ley.",

    s6Kicker: "06 · REPORTAR ABUSO",
    s6H: "Cómo y dónde reportas un incumplimiento.",
    s6Body:
      "Si detectas uso abusivo originado desde nuestra infraestructura — phishing, spam, acceso no autorizado — escríbenos con evidencia (headers, URLs, timestamps ISO). Acusamos recibo en ",
    s6BodyCont: ". Investigación privada; comunicamos resolución al reportante cuando corresponda.",
    s6Email: "abuse@bio-ignicion.app",

    relatedKicker: "DOCUMENTOS RELACIONADOS",
    relatedH: "Contrato completo.",
    relatedBody:
      "Esta AUP se lee junto con los Términos de Servicio y el Aviso de Privacidad.",
    linkTerms: "Términos de servicio",
    linkPrivacy: "Aviso de privacidad",
    linkCookies: "Política de cookies",
    linkDpa: "DPA (descargable)",
    linkSubs: "Subprocesadores",
    linkTrust: "Trust Center",
  },
  en: {
    eyebrow: "ACCEPTABLE USE POLICY",
    title: "What it's for. And what it isn't.",
    editorial: "A serious clinical tool needs clear rules. These.",
    intro:
      "This policy defines unacceptable use of the service. It complements the Terms of Service. Non-compliance may result in immediate suspension or account closure, depending on severity.",
    updated: "Updated",
    version: "Version",
    effective: "Effective from",

    statCategories: "Categories",
    statCategoriesSub: "compliance · abuse · technical · commercial",
    statChannel: "Report channel",
    statChannelSub: "abuse@bio-ignicion.app",
    statResponse: "First response",
    statResponseSub: "< 72 business hours",
    statEffect: "Graduated measures",
    statEffectSub: "notice · suspension · closure",

    s1Kicker: "01 · COMPLIANCE",
    s1H: "What affects the lawful basis of processing.",
    s1L1: "Store personal data without a valid lawful basis (consent, contract, legal obligation, legitimate or vital interest).",
    s1L2: "Process special categories (health, biometrics, sensitive data) without a signed BAA/DPA and without explicit data-subject consent.",
    s1L3: "Transfer data to jurisdictions without adequate safeguards (SCCs, adequacy decision).",
    s1L4: "Use the service for activities illegal in your jurisdiction or ours.",

    s2Kicker: "02 · ABUSE",
    s2H: "What harms other users or third parties.",
    s2L1: "Send malware, phishing, spam or any malicious code from BIO-IGNICIÓN infrastructure.",
    s2L2: "Unauthorized access attempts on third-party accounts, credential stuffing, user enumeration.",
    s2L3: "Harassment, doxxing or threats using the service's communication channels.",
    s2L4: "Impersonation of third parties or issuing content that spoofs external identity.",

    s3Kicker: "03 · TECHNICAL",
    s3H: "What breaks or degrades the platform.",
    s3L1: "Evade rate limits, API quotas or security controls through undocumented means.",
    s3L2: "Mass scraping or synthetic load beyond what is reasonable for your use case.",
    s3L3: "Reverse engineering, disassembly, or attempts to extract secrets (keys, models, tokens).",
    s3L4: "Security testing (pentesting) without prior written authorization — write to security@ to coordinate.",

    s4Kicker: "04 · COMMERCIAL",
    s4H: "What crosses the commercial-agreement line.",
    s4L1: "Resell the service, repackage or license access to third parties without an explicit agreement.",
    s4L2: "Use the service to train AI models that directly compete with BIO-IGNICIÓN.",
    s4L3: "Falsely represent partnership, endorsement or official integration where none exists.",

    s5Kicker: "05 · CONSEQUENCES",
    s5H: "Graduated measures, proportionate to the breach.",
    s5L1: "Minor or ambiguous breach: written notice with cure period.",
    s5L2: "Material or repeated breach: immediate service suspension.",
    s5L3: "Fraud, illegal activity or critical security risk: account closure without prior notice, with data retention per legal obligations.",
    s5L4: "We cooperate with competent authorities where the law requires it.",

    s6Kicker: "06 · REPORT ABUSE",
    s6H: "How and where to report a breach.",
    s6Body:
      "If you detect abusive use originating from our infrastructure — phishing, spam, unauthorized access — write to us with evidence (headers, URLs, ISO timestamps). We acknowledge receipt at ",
    s6BodyCont: ". Private investigation; we communicate resolution to the reporter when applicable.",
    s6Email: "abuse@bio-ignicion.app",

    relatedKicker: "RELATED DOCUMENTS",
    relatedH: "Full contract.",
    relatedBody:
      "This AUP is read alongside the Terms of Service and the Privacy Notice.",
    linkTerms: "Terms of service",
    linkPrivacy: "Privacy notice",
    linkCookies: "Cookie policy",
    linkDpa: "DPA (downloadable)",
    linkSubs: "Subprocessors",
    linkTrust: "Trust Center",
  },
};

export default async function AupPage() {
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

  const sectionIds = ["compliance", "abuso", "tecnico", "comercial", "consecuencias", "reportar"];
  const sections = Array.from({ length: 6 }, (_, i) => {
    const n = i + 1;
    const kicker = c[`s${n}Kicker`];
    if (!kicker) return null;
    const [num, title] = kicker.split(" · ");
    return { id: sectionIds[i], num, title };
  }).filter(Boolean);

  return (
    <PublicShell activePath="/aup">
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
              <span className="v">4</span>
              <span className="l">{c.statCategories}</span>
              <span className="s">{c.statCategoriesSub}</span>
            </div>
            <div>
              <span className="v">abuse@</span>
              <span className="l">{c.statChannel}</span>
              <span className="s">{c.statChannelSub}</span>
            </div>
            <div>
              <span className="v">&lt; 72 h</span>
              <span className="l">{c.statResponse}</span>
              <span className="s">{c.statResponseSub}</span>
            </div>
            <div>
              <span className="v">3 {en ? "tiers" : "niveles"}</span>
              <span className="l">{c.statEffect}</span>
              <span className="s">{c.statEffectSub}</span>
            </div>
          </div>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      {/* ═══ Sections ═══ */}
      <Container size="lg" className="bi-prose">
        <nav aria-label={en ? "Table of contents" : "Índice"} className="bi-legal-toc">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="bi-legal-toc-chip">
              <span className="num">{s.num}</span>
              <span>{s.title}</span>
            </a>
          ))}
        </nav>

        <section id="compliance" className="bi-legal-section">
          <div style={kickerStyle}>{c.s1Kicker}</div>
          <h2 style={sectionHeading}>{c.s1H}</h2>
          <ul className="bi-legal-list">
            <li>{c.s1L1}</li>
            <li>{c.s1L2}</li>
            <li>{c.s1L3}</li>
            <li>{c.s1L4}</li>
          </ul>
        </section>

        <section id="abuso" className="bi-legal-section">
          <div style={kickerStyle}>{c.s2Kicker}</div>
          <h2 style={sectionHeading}>{c.s2H}</h2>
          <ul className="bi-legal-list">
            <li>{c.s2L1}</li>
            <li>{c.s2L2}</li>
            <li>{c.s2L3}</li>
            <li>{c.s2L4}</li>
          </ul>
        </section>

        <section id="tecnico" className="bi-legal-section">
          <div style={kickerStyle}>{c.s3Kicker}</div>
          <h2 style={sectionHeading}>{c.s3H}</h2>
          <ul className="bi-legal-list">
            <li>{c.s3L1}</li>
            <li>{c.s3L2}</li>
            <li>{c.s3L3}</li>
            <li>{c.s3L4}</li>
          </ul>
        </section>

        <section id="comercial" className="bi-legal-section">
          <div style={kickerStyle}>{c.s4Kicker}</div>
          <h2 style={sectionHeading}>{c.s4H}</h2>
          <ul className="bi-legal-list">
            <li>{c.s4L1}</li>
            <li>{c.s4L2}</li>
            <li>{c.s4L3}</li>
          </ul>
        </section>

        <section id="consecuencias" className="bi-legal-section">
          <div style={kickerStyle}>{c.s5Kicker}</div>
          <h2 style={sectionHeading}>{c.s5H}</h2>
          <ul className="bi-legal-list">
            <li>{c.s5L1}</li>
            <li>{c.s5L2}</li>
            <li>{c.s5L3}</li>
            <li>{c.s5L4}</li>
          </ul>
        </section>

        <section id="reportar" className="bi-legal-section">
          <div style={kickerStyle}>{c.s6Kicker}</div>
          <h2 style={sectionHeading}>{c.s6H}</h2>
          <aside className="bi-legal-callout bi-legal-callout--moat" style={{ marginBlockStart: space[3] }}>
            <div className="bi-legal-callout-kicker">{en ? "ABUSE CHANNEL · < 72 h" : "CANAL DE ABUSO · < 72 h"}</div>
            <p>
              {c.s6Body}
              <a href={`mailto:${c.s6Email}`} className="bi-legal-link">{c.s6Email}</a>
              {c.s6BodyCont}
            </p>
          </aside>
        </section>
      </Container>

      <PulseDivider intensity="dim" />

      {/* ═══ Related legal docs ═══ */}
      <Container size="lg" className="bi-prose">
        <section aria-labelledby="aup-related" className="bi-legal-related">
          <div style={kickerStyle}>{c.relatedKicker}</div>
          <h2 id="aup-related" style={sectionHeading}>{c.relatedH}</h2>
          <p style={{ marginBlockStart: space[3], color: cssVar.textDim, maxWidth: "58ch" }}>{c.relatedBody}</p>
          <ul className="bi-legal-related-grid">
            <li><a href="/terms" className="bi-legal-related-card">{c.linkTerms}</a></li>
            <li><a href="/privacy" className="bi-legal-related-card">{c.linkPrivacy}</a></li>
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
