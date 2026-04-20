/* ═══════════════════════════════════════════════════════════════
   /cookies — Política de cookies. Cuatro cookies, cero terceros,
   cero publicidad. Tabla con nombre, categoría, propósito, duración.
   ═══════════════════════════════════════════════════════════════ */

import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font, bioSignal } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";
import IgnitionReveal from "@/components/brand/IgnitionReveal";
import BioglyphLattice from "@/components/brand/BioglyphLattice";
import PulseDivider from "@/components/brand/PulseDivider";

export const metadata = {
  title: "Política de Cookies",
  description: "4 cookies estrictamente necesarias o de preferencia · 0 de publicidad · 0 de terceros · sin rastreo cross-site.",
  alternates: { canonical: "/cookies" },
};

const LAST_UPDATED = "2026-04-20";
const VERSION = "1.1";

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
    eyebrow: "POLÍTICA DE COOKIES",
    title: "Cuatro, no cuarenta.",
    editorial: "Solo las estrictamente necesarias. Ninguna para publicidad.",
    intro:
      "No usamos cookies para rastreo cross-site ni para publicidad. Tampoco incrustamos pixels de redes sociales ni analytics de marketing. La lista abajo es completa y se actualiza con cada cambio material.",
    updated: "Actualizado",
    version: "Versión",

    statCount: "Cookies totales",
    statCountSub: "2 necesarias · 2 de preferencia",
    statThird: "De terceros",
    statThirdSub: "sin pixels ni analytics de ads",
    statAd: "De publicidad",
    statAdSub: "sin IDFA, AAID, fingerprint",
    statConsent: "Consentimiento",
    statConsentSub: "UI de gestión revocable",

    tableKicker: "01 · INVENTARIO COMPLETO",
    tableH: "Nombre, categoría, propósito, duración.",
    tableBody:
      "Las cookies de categoría \"estrictamente necesaria\" no requieren consentimiento conforme al Art. 5 e-Privacy. Las de preferencia se mantienen bajo consentimiento implícito con UI de revocación visible.",
    tHName: "Nombre",
    tHCat: "Categoría",
    tHPurpose: "Propósito",
    tHDuration: "Duración",

    catNecessary: "Estrictamente necesaria",
    catPreference: "Preferencia",

    cookie1Purpose: "Mantener sesión autenticada (NextAuth).",
    cookie2Purpose: "Protección CSRF (double-submit).",
    cookie3Purpose: "Idioma elegido (ES/EN).",
    cookie4Purpose: "Registrar decisión de consentimiento.",

    manageKicker: "02 · GESTIÓN Y REVOCACIÓN",
    manageH: "Cómo cambiar tu decisión.",
    manageBody:
      "Puedes gestionar o revocar tu consentimiento en cualquier momento desde el selector de cookies al pie de página. También puedes borrar cookies desde los ajustes de tu navegador — no lo consideramos incumplimiento ni limitamos funcionalidad esencial por ello.",

    noTrackKicker: "03 · LO QUE NO HACEMOS",
    noTrackH: "Explícito, no inferido.",
    noTrack1: "No usamos cookies de publicidad ni de remarketing.",
    noTrack2: "No compartimos identificadores con redes publicitarias ni data brokers.",
    noTrack3: "No usamos device fingerprinting ni canvas tracking.",
    noTrack4: "Nuestra telemetría de producto es opt-in explícito y no usa cookies — se envía solo si aceptas.",

    relatedKicker: "DOCUMENTOS RELACIONADOS",
    relatedH: "Paquete legal completo.",
    relatedBody:
      "Esta política se lee junto con el Aviso de Privacidad y los Términos de Servicio.",
    linkPrivacy: "Aviso de privacidad",
    linkTerms: "Términos de servicio",
    linkAup: "Política de uso aceptable",
    linkDpa: "DPA (descargable)",
    linkSubs: "Subprocesadores",
    linkTrust: "Trust Center",
  },
  en: {
    eyebrow: "COOKIE POLICY",
    title: "Four, not forty.",
    editorial: "Only strictly necessary ones. None for advertising.",
    intro:
      "We don't use cookies for cross-site tracking or advertising. We also don't embed social-network pixels or marketing analytics. The list below is exhaustive and updates with every material change.",
    updated: "Updated",
    version: "Version",

    statCount: "Total cookies",
    statCountSub: "2 necessary · 2 preference",
    statThird: "Third-party",
    statThirdSub: "no ad pixels or analytics",
    statAd: "Advertising",
    statAdSub: "no IDFA, AAID, fingerprint",
    statConsent: "Consent",
    statConsentSub: "revocable management UI",

    tableKicker: "01 · COMPLETE INVENTORY",
    tableH: "Name, category, purpose, duration.",
    tableBody:
      "\"Strictly necessary\" cookies do not require consent per Art. 5 e-Privacy. Preference cookies are set under implied consent with a visible revocation UI.",
    tHName: "Name",
    tHCat: "Category",
    tHPurpose: "Purpose",
    tHDuration: "Duration",

    catNecessary: "Strictly necessary",
    catPreference: "Preference",

    cookie1Purpose: "Maintain authenticated session (NextAuth).",
    cookie2Purpose: "CSRF protection (double-submit).",
    cookie3Purpose: "Chosen language (ES/EN).",
    cookie4Purpose: "Record consent decision.",

    manageKicker: "02 · MANAGEMENT AND REVOCATION",
    manageH: "How to change your decision.",
    manageBody:
      "You can manage or revoke consent at any time from the cookie selector in the footer. You can also delete cookies from your browser settings — we don't consider that a breach, nor do we limit essential functionality as a result.",

    noTrackKicker: "03 · WHAT WE DON'T DO",
    noTrackH: "Explicit, not inferred.",
    noTrack1: "We don't use advertising or remarketing cookies.",
    noTrack2: "We don't share identifiers with ad networks or data brokers.",
    noTrack3: "We don't use device fingerprinting or canvas tracking.",
    noTrack4: "Our product telemetry is explicit opt-in and doesn't use cookies — it's sent only if you accept.",

    relatedKicker: "RELATED DOCUMENTS",
    relatedH: "Full legal packet.",
    relatedBody:
      "This policy is read alongside the Privacy Notice and the Terms of Service.",
    linkPrivacy: "Privacy notice",
    linkTerms: "Terms of service",
    linkAup: "Acceptable use policy",
    linkDpa: "DPA (downloadable)",
    linkSubs: "Subprocessors",
    linkTrust: "Trust Center",
  },
};

export default async function CookiesPage() {
  const locale = await getServerLocale();
  const L = locale === "en" ? "en" : "es";
  const c = COPY[L];
  const en = L === "en";

  const updatedFmt = new Date(LAST_UPDATED).toLocaleDateString(en ? "en-US" : "es-MX", {
    year: "numeric", month: "long", day: "numeric",
  });

  const cookies = [
    { name: "authjs.session-token", cat: c.catNecessary, purpose: c.cookie1Purpose, duration: "8 h" },
    { name: "bio-csrf",             cat: c.catNecessary, purpose: c.cookie2Purpose, duration: "8 h" },
    { name: "bio-locale",           cat: c.catPreference, purpose: c.cookie3Purpose, duration: en ? "1 year" : "1 año" },
    { name: "bio-consent",          cat: c.catPreference, purpose: c.cookie4Purpose, duration: en ? "1 year" : "1 año" },
  ];

  const sections = [
    { id: "inventario", num: "01", title: c.tableKicker.split(" · ")[1] },
    { id: "gestion", num: "02", title: c.manageKicker.split(" · ")[1] },
    { id: "no-tracking", num: "03", title: c.noTrackKicker.split(" · ")[1] },
  ];

  return (
    <PublicShell activePath="/cookies">
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
                {c.version} {VERSION} · {c.updated} <time dateTime={LAST_UPDATED}>{updatedFmt}</time>
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
              <span className="l">{c.statCount}</span>
              <span className="s">{c.statCountSub}</span>
            </div>
            <div>
              <span className="v">0</span>
              <span className="l">{c.statThird}</span>
              <span className="s">{c.statThirdSub}</span>
            </div>
            <div>
              <span className="v">0</span>
              <span className="l">{c.statAd}</span>
              <span className="s">{c.statAdSub}</span>
            </div>
            <div>
              <span className="v">UI</span>
              <span className="l">{c.statConsent}</span>
              <span className="s">{c.statConsentSub}</span>
            </div>
          </div>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      {/* ═══ Table of cookies ═══ */}
      <Container size="lg" className="bi-prose">
        <nav aria-label={en ? "Table of contents" : "Índice"} className="bi-legal-toc">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="bi-legal-toc-chip">
              <span className="num">{s.num}</span>
              <span>{s.title}</span>
            </a>
          ))}
        </nav>

        <section id="inventario" className="bi-legal-section">
          <div style={kickerStyle}>{c.tableKicker}</div>
          <h2 style={sectionHeading}>{c.tableH}</h2>
          <p style={{ marginBlockStart: space[3], color: cssVar.textDim, maxWidth: "62ch" }}>
            {c.tableBody}
          </p>
          <div className="bi-legal-table-wrap">
            <table className="bi-legal-table">
              <thead>
                <tr>
                  <th>{c.tHName}</th>
                  <th>{c.tHCat}</th>
                  <th>{c.tHPurpose}</th>
                  <th>{c.tHDuration}</th>
                </tr>
              </thead>
              <tbody>
                {cookies.map((ck) => (
                  <tr key={ck.name}>
                    <td className="bi-legal-table-mono" data-label={c.tHName}>{ck.name}</td>
                    <td className="bi-legal-table-cat" data-label={c.tHCat}>{ck.cat}</td>
                    <td data-label={c.tHPurpose}>{ck.purpose}</td>
                    <td className="bi-legal-table-basis" data-label={c.tHDuration}>
                      <span>{ck.duration}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="gestion" className="bi-legal-section">
          <div style={kickerStyle}>{c.manageKicker}</div>
          <h2 style={sectionHeading}>{c.manageH}</h2>
          <p style={{ marginBlockStart: space[3] }}>{c.manageBody}</p>
        </section>

        <section id="no-tracking" className="bi-legal-section">
          <div style={kickerStyle}>{c.noTrackKicker}</div>
          <h2 style={sectionHeading}>{c.noTrackH}</h2>
          <ul className="bi-legal-list">
            <li>{c.noTrack1}</li>
            <li>{c.noTrack2}</li>
            <li>{c.noTrack3}</li>
            <li>{c.noTrack4}</li>
          </ul>
        </section>
      </Container>

      <PulseDivider intensity="dim" />

      {/* ═══ Related legal docs ═══ */}
      <Container size="lg" className="bi-prose">
        <section aria-labelledby="cookies-related" className="bi-legal-related">
          <div style={kickerStyle}>{c.relatedKicker}</div>
          <h2 id="cookies-related" style={sectionHeading}>{c.relatedH}</h2>
          <p style={{ marginBlockStart: space[3], color: cssVar.textDim, maxWidth: "58ch" }}>{c.relatedBody}</p>
          <ul className="bi-legal-related-grid">
            <li><a href="/privacy" className="bi-legal-related-card">{c.linkPrivacy}</a></li>
            <li><a href="/terms" className="bi-legal-related-card">{c.linkTerms}</a></li>
            <li><a href="/aup" className="bi-legal-related-card">{c.linkAup}</a></li>
            <li><a href="/trust/dpa" className="bi-legal-related-card">{c.linkDpa}</a></li>
            <li><a href="/trust/subprocessors" className="bi-legal-related-card">{c.linkSubs}</a></li>
            <li><a href="/trust" className="bi-legal-related-card">{c.linkTrust}</a></li>
          </ul>
        </section>
      </Container>
    </PublicShell>
  );
}
