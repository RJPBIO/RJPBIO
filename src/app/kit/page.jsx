/* ═══════════════════════════════════════════════════════════════
   /kit — Workplace Activation Kit (QR + NFC cards).
   B2B top-global positioning: "Activación física. Un tap.
   Toda la organización adentro." Visual showcase + fleet tiers.
   ═══════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font, bioSignal } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";
import { DESIGN_PARTNER } from "@/lib/pricing";
import IgnitionReveal from "@/components/brand/IgnitionReveal";
import BioglyphLattice from "@/components/brand/BioglyphLattice";
import PulseDivider from "@/components/brand/PulseDivider";
import ActivationKit from "@/components/brand/ActivationKit";

export const metadata = {
  title: "Kit de Activación · QR + NFC para workplaces",
  description:
    "Tarjetas y placas BIO-IGNICIÓN con QR + NFC pre-registrados a tu organización. Aluminio anodizado, grabado láser phosphor cyan, NFC NTAG-424 DNA. Instalación en 15 segundos, compatible con SSO.",
  alternates: { canonical: "/kit" },
  openGraph: {
    title: "BIO-IGNICIÓN · Kit de Activación",
    description:
      "Activación física con trademark BIO-IGNICIÓN. Tap NFC o escaneo QR para onboarding neural en segundos.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
};

const LAST_REVIEWED = "2026-04-21";

const COPY = {
  es: {
    hero: {
      kicker: "KIT DE ACTIVACIÓN · WORKPLACES",
      h1: "Activación física. Un tap. Toda la organización adentro.",
      italic: "Sin instalación. Sin escritorio IT. Sin CSV.",
      sub: "Tarjetas y placas con QR y NFC pre-registrados a tu organización. Se activan con el teléfono del operador en segundos. Cada kit es trazable, asignable por equipo y compatible con tu SSO corporativo.",
      ctaPrimary: "Solicitar kit · 30 min",
      ctaSecondary: "Ver precio por volumen",
    },
    kit: {
      kicker: "DISEÑO · TRADEMARK · BIO-IGNICIÓN",
      headline: "Aluminio anodizado. Grabado láser phosphor cyan. Un objeto al que quieres acercar el teléfono.",
      sub: "Cada tarjeta es un punto de activación neural registrado. NFC NTAG-424 DNA para autenticación por tap, QR dinámico versión 1 ECL-H para escaneo, y un identificador de fleet grabado en la base que liga cada activación a un operador y a un equipo.",
      heroAria: "Tarjeta de escritorio, anverso y reverso",
      captions: {
        front: "Anverso · zona NFC y QR equilibrados en diagonal cinematográfica",
        back: "Reverso · instrucciones grabadas y número de serie por fleet",
      },
      variantsAria: "Variantes del kit · pared, escritorio y laptop",
      variants: {
        wall: { t: "Placa Mural · A5", d: "Para salas de juntas, pasillos y espacios colaborativos", m: "210 × 148 mm" },
        desk: { t: "Tarjeta de Escritorio · CR80", d: "Formato tarjeta de crédito · para gafetes y mesas individuales", m: "85.6 × 54 mm" },
        disc: { t: "Disco Laptop · 60 mm", d: "Adhesivo industrial para equipos móviles y dispositivos personales", m: "Ø 60 mm" },
      },
      serial: "KIT · 24.104 · FLEET-ACME",
      front: {
        ariaFront: "Tarjeta frontal · BIO-IGNICIÓN · NFC y QR",
        tapSub: "Acerca el teléfono",
        scanSub: "Apunta la cámara",
      },
      back: {
        ariaBack: "Reverso de tarjeta · instrucciones de instalación",
        backHeader: "INSTALACIÓN · 15 S",
        installTitle: "INSTALA EN TRES PASOS",
        steps: [
          { t: "DESPEGA", d1: "Adhesivo 3M VHB", d2: "industrial · sin residuo" },
          { t: "PEGA", d1: "Escritorio, pared,", d2: "laptop o gafete" },
          { t: "ACTIVA", d1: "Tap NFC o escanea QR", d2: "con el operador" },
        ],
        backLegal1: "Patent pending · hecho en México",
      },
      wall: {
        ariaWall: "Placa mural · formato A5",
        orLabel: "O BIEN",
      },
      disc: {
        ariaDisc: "Disco laptop · 60 mm",
        discSub: "laptop edition",
      },
      context: {
        ariaDesk: "Escena · tarjeta sobre escritorio",
        deskCaption: "ESCRITORIO · OPERADOR · ACME HQ · PISO 04",
      },
      specsAria: "Especificaciones técnicas del kit",
      specs: [
        { k: "Sustrato", v: "Aluminio anodizado · matte black" },
        { k: "Grabado", v: "Láser phosphor cyan · sin tinta" },
        { k: "Chip NFC", v: "NTAG 424 DNA · 144 B · tap-auth" },
        { k: "Código QR", v: "v1 · ECL-H · dinámico · trazable" },
        { k: "Adhesivo", v: "3M VHB · residue-free · indoor" },
        { k: "Cumplimiento", v: "Ligable a SSO · SCIM · auditoría" },
      ],
      fleetAria: "Cotización por volumen",
      fleetTitle: "VOLUMEN · FLEET · ENTERPRISE",
      fleet: [
        { q: "10", t: "Starter · piloto", off: "" },
        { q: "50", t: "Team · un piso", off: "-15%", featured: true },
        { q: "200", t: "Fleet · una sede", off: "-25%" },
        { q: "500+", t: "Enterprise · global", off: "custom" },
      ],
      fomo: `Design Partner · ${DESIGN_PARTNER.slotsTotal} cupos · kit de 20 incluido sin costo · ${DESIGN_PARTNER.termMonths} meses`,
      ctaPrimary: "Solicitar cotización · 24 h",
      ctaSecondary: "Ver paquetes fleet",
      ctaFoot: "Precios por volumen · envío a México, LATAM y USA · garantía 24 meses",
      legal: "Las marcas de terceros mencionadas (3M, VHB, NXP, NTAG) son propiedad de sus respectivos titulares y se usan con fines puramente descriptivos bajo fair-use de referencia técnica.",
    },
    how: {
      kicker: "FLUJO · OPERADOR · 15 SEGUNDOS",
      h: "Del tap al motor encendido. Sin fricción, sin descargas.",
      steps: [
        {
          n: "01",
          t: "El operador toca el NFC",
          d: "iOS 14+ y Android desbloquean la web directo al flujo de activación. Sin app store, sin descarga. En campo: 3–5 s.",
        },
        {
          n: "02",
          t: "El fleet ID se auto-asigna",
          d: "La tarjeta pre-registrada identifica al equipo y al operador via SSO corporativo. Cero captura manual, cero CSV.",
        },
        {
          n: "03",
          t: "El motor se instala en la pantalla",
          d: "La PWA se añade a la pantalla de inicio y el primer ciclo HRV arranca. El operador termina su onboarding antes de guardar el teléfono.",
        },
      ],
    },
    why: {
      kicker: "POR QUÉ FÍSICO · CUANDO TODO ES DIGITAL",
      h: "Porque el adoption rate sube cuando el punto de activación es un objeto en su escritorio.",
      bullets: [
        { t: "Onboarding observado", d: "Activación física presencial sube 3× la tasa de onboarding vs link por email, medido en pilotos 2025." },
        { t: "Trazabilidad fleet", d: "Cada tarjeta lleva un ID único. Sabes qué operador, qué equipo y qué sede activaron. Exportable a tu HRIS." },
        { t: "Seguridad NFC", d: "El chip NTAG 424 DNA firma cada tap con autenticación criptográfica. No es una URL pegada, es un handshake." },
        { t: "Marca tangible", d: "Un objeto de oficina con el trademark BIO-IGNICIÓN. Recordatorio diario del compromiso con el equipo." },
      ],
    },
    faq: {
      kicker: "PREGUNTAS · COMPRAS · COMPLIANCE",
      h: "Lo que RH, IT y compras quieren saber.",
      items: [
        {
          q: "¿Qué pasa si un operador sale de la organización?",
          a: "El admin revoca el fleet ID desde el dashboard en un clic. La tarjeta física puede reasignarse al reemplazo sin pedir un reenvío.",
        },
        {
          q: "¿Los datos personales viven en la tarjeta?",
          a: "No. La tarjeta lleva un identificador anónimo. Toda la identidad vive en tu IdP via SSO. La NFC firma, no transporta PII.",
        },
        {
          q: "¿Es compatible con Apple Wallet o Google Wallet?",
          a: "El flujo de activación no requiere Wallet. La PWA se instala nativamente desde Safari o Chrome sin pasar por tiendas ni billeteras.",
        },
        {
          q: "¿Soportan co-branding del equipo de compras?",
          a: "Sí desde el tier Fleet en adelante. Grabado láser adicional con el logo del cliente, manteniendo el trademark BIO-IGNICIÓN visible.",
        },
      ],
    },
    closing: {
      kicker: "SIGUIENTE PASO",
      h: "Pide un kit piloto de 20 tarjetas. Mide la tasa de activación. Decide con evidencia.",
      p: "Los Design Partners reciben el kit piloto sin costo dentro del programa. El resto de las organizaciones reciben cotización en menos de 24 horas hábiles con envío a México, LATAM y Estados Unidos.",
      ctaPrimary: "Agendar demo · 30 min",
      ctaSecondary: "Ver programa Design Partner",
    },
  },
  en: {
    hero: {
      kicker: "ACTIVATION KIT · WORKPLACES",
      h1: "Physical activation. One tap. Your whole org inside.",
      italic: "No install. No IT desk. No CSV.",
      sub: "Cards and plaques with QR and NFC pre-registered to your organization. Operators activate with their phone in seconds. Every kit is traceable, team-assignable and compatible with your corporate SSO.",
      ctaPrimary: "Request a kit · 30 min",
      ctaSecondary: "See volume pricing",
    },
    kit: {
      kicker: "DESIGN · TRADEMARK · BIO-IGNICIÓN",
      headline: "Anodized aluminum. Phosphor-cyan laser etch. An object you want to bring your phone close to.",
      sub: "Every card is a registered neural activation point. NFC NTAG-424 DNA for tap authentication, dynamic QR v1 ECL-H for scan, plus an engraved fleet ID that ties each activation back to an operator and a team.",
      heroAria: "Desk card, front and back",
      captions: {
        front: "Front · NFC and QR balanced on a cinematic diagonal",
        back: "Back · engraved install steps and per-fleet serial number",
      },
      variantsAria: "Kit variants · wall, desk and laptop",
      variants: {
        wall: { t: "Wall Placard · A5", d: "Meeting rooms, hallways and collaborative spaces", m: "210 × 148 mm" },
        desk: { t: "Desk Card · CR80", d: "Credit-card format · for badges and individual desks", m: "85.6 × 54 mm" },
        disc: { t: "Laptop Disc · 60 mm", d: "Industrial adhesive for mobile devices and personal gear", m: "Ø 60 mm" },
      },
      serial: "KIT · 24.104 · FLEET-ACME",
      front: {
        ariaFront: "Card front · BIO-IGNICIÓN · NFC and QR",
        tapSub: "Bring your phone close",
        scanSub: "Aim your camera",
      },
      back: {
        ariaBack: "Card back · install instructions",
        backHeader: "INSTALL · 15 S",
        installTitle: "INSTALL IN THREE STEPS",
        steps: [
          { t: "PEEL", d1: "3M VHB industrial", d2: "adhesive · no residue" },
          { t: "STICK", d1: "Desk, wall,", d2: "laptop or badge" },
          { t: "ACTIVATE", d1: "Tap NFC or scan QR", d2: "with the operator" },
        ],
        backLegal1: "Patent pending · made in Mexico",
      },
      wall: {
        ariaWall: "Wall placard · A5 format",
        orLabel: "OR",
      },
      disc: {
        ariaDisc: "Laptop disc · 60 mm",
        discSub: "laptop edition",
      },
      context: {
        ariaDesk: "Scene · card on desk",
        deskCaption: "DESK · OPERATOR · ACME HQ · FLOOR 04",
      },
      specsAria: "Kit technical specifications",
      specs: [
        { k: "Substrate", v: "Anodized aluminum · matte black" },
        { k: "Etch", v: "Phosphor cyan laser · no ink" },
        { k: "NFC chip", v: "NTAG 424 DNA · 144 B · tap-auth" },
        { k: "QR code", v: "v1 · ECL-H · dynamic · traceable" },
        { k: "Adhesive", v: "3M VHB · residue-free · indoor" },
        { k: "Compliance", v: "SSO · SCIM · audit-ready" },
      ],
      fleetAria: "Volume pricing",
      fleetTitle: "VOLUME · FLEET · ENTERPRISE",
      fleet: [
        { q: "10", t: "Starter · pilot", off: "" },
        { q: "50", t: "Team · one floor", off: "-15%", featured: true },
        { q: "200", t: "Fleet · one site", off: "-25%" },
        { q: "500+", t: "Enterprise · global", off: "custom" },
      ],
      fomo: `Design Partner · ${DESIGN_PARTNER.slotsTotal} seats · 20-card kit included · ${DESIGN_PARTNER.termMonths} months`,
      ctaPrimary: "Request quote · 24 h",
      ctaSecondary: "See fleet packages",
      ctaFoot: "Volume pricing · ships to Mexico, LATAM and USA · 24-month warranty",
      legal: "Third-party marks referenced (3M, VHB, NXP, NTAG) are property of their respective owners and used descriptively under technical-reference fair use.",
    },
    how: {
      kicker: "FLOW · OPERATOR · 15 SECONDS",
      h: "From tap to engine running. Zero friction, zero downloads.",
      steps: [
        {
          n: "01",
          t: "Operator taps NFC",
          d: "iOS 14+ and Android unlock straight into the activation flow. No app store, no download. In the field: 3–5 s.",
        },
        {
          n: "02",
          t: "Fleet ID auto-assigns",
          d: "The pre-registered card identifies team and operator via corporate SSO. Zero manual capture, zero CSV.",
        },
        {
          n: "03",
          t: "Engine installs to home screen",
          d: "PWA lands on the home screen and the first HRV cycle runs. Operator finishes onboarding before putting the phone away.",
        },
      ],
    },
    why: {
      kicker: "WHY PHYSICAL · WHEN EVERYTHING IS DIGITAL",
      h: "Because adoption rate rises when the activation point is an object on the desk.",
      bullets: [
        { t: "Observed onboarding", d: "In-person physical activation lifts onboarding 3× vs email-link, measured across 2025 pilots." },
        { t: "Fleet traceability", d: "Each card has a unique ID. You know which operator, team and site activated. Exportable to your HRIS." },
        { t: "NFC security", d: "NTAG 424 DNA cryptographically signs every tap. Not a stuck URL — a handshake." },
        { t: "Tangible brand", d: "An office object bearing the BIO-IGNICIÓN trademark. A daily reminder of the commitment to the team." },
      ],
    },
    faq: {
      kicker: "QUESTIONS · PROCUREMENT · COMPLIANCE",
      h: "What HR, IT and Procurement want to know.",
      items: [
        {
          q: "What happens if an operator leaves the organization?",
          a: "Admin revokes the fleet ID from the dashboard in one click. The physical card can be reassigned to the replacement with no resend.",
        },
        {
          q: "Does personal data live on the card?",
          a: "No. The card carries an anonymous identifier. All identity lives in your IdP via SSO. NFC signs, it does not transport PII.",
        },
        {
          q: "Is it compatible with Apple Wallet or Google Wallet?",
          a: "The activation flow does not require Wallet. The PWA installs natively from Safari or Chrome without going through stores or wallets.",
        },
        {
          q: "Do you support procurement co-branding?",
          a: "Yes, from the Fleet tier onwards. Additional laser etch with the client logo, keeping the BIO-IGNICIÓN trademark visible.",
        },
      ],
    },
    closing: {
      kicker: "NEXT STEP",
      h: "Order a 20-card pilot kit. Measure activation rate. Decide on evidence.",
      p: "Design Partners receive the pilot kit at no cost as part of the program. Every other organization gets a quote in less than 24 business hours, shipping to Mexico, LATAM and the USA.",
      ctaPrimary: "Book demo · 30 min",
      ctaSecondary: "See Design Partner program",
    },
  },
};

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

export default async function KitPage() {
  const locale = await getServerLocale();
  const c = COPY[locale] || COPY.es;

  return (
    <PublicShell activePath="/kit">
      <Container size="lg" className="bi-prose">
        <header className="bi-roi-hero">
          <div aria-hidden className="bi-roi-hero-lattice">
            <BioglyphLattice variant="ambient" />
          </div>
          <span aria-hidden className="bi-roi-hero-aura" />
          <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            <IgnitionReveal sparkOrigin="50% 30%">
              <div style={kickerStyle}>{c.hero.kicker}</div>
              <h1
                style={{
                  margin: `${space[3]}px auto ${space[4]}px`,
                  fontSize: "clamp(34px, 5vw, 60px)",
                  letterSpacing: "-0.035em",
                  lineHeight: 1.04,
                  maxWidth: "22ch",
                }}
              >
                {c.hero.h1}
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-editorial), 'Instrument Serif', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: "clamp(17px, 1.6vw, 20px)",
                  color: cssVar.textDim,
                  margin: `0 auto ${space[5]}px`,
                  maxWidth: "38ch",
                }}
              >
                {c.hero.italic}
              </p>
              <p
                style={{
                  fontSize: "clamp(15px, 1.4vw, 18px)",
                  color: cssVar.textDim,
                  margin: `0 auto ${space[6]}px`,
                  maxWidth: "58ch",
                  lineHeight: 1.6,
                }}
              >
                {c.hero.sub}
              </p>
              <div style={{ display: "inline-flex", gap: space[3], flexWrap: "wrap", justifyContent: "center" }}>
                <Link href="/demo" className="bi-kit-cta-primary">
                  {c.hero.ctaPrimary}
                  <span aria-hidden="true" className="arrow">→</span>
                </Link>
                <Link href="/pricing#fleet" className="bi-kit-cta-secondary">
                  {c.hero.ctaSecondary}
                </Link>
              </div>
            </IgnitionReveal>
          </div>
        </header>
      </Container>

      <PulseDivider intensity="dim" />

      <section aria-labelledby="kit-h" style={{ paddingBlock: space[10], paddingInline: space[5] }}>
        <Container size="xl">
          <IgnitionReveal sparkOrigin="50% 30%">
            <ActivationKit T={c.kit} />
          </IgnitionReveal>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      <section aria-labelledby="kit-how" style={{ paddingBlock: space[10], paddingInline: space[5] }}>
        <Container size="lg">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[7] }}>
              <div style={kickerStyle}>{c.how.kicker}</div>
              <h3 id="kit-how" style={sectionHeading}>{c.how.h}</h3>
            </div>
            <ol className="bi-kit-flow">
              {c.how.steps.map((s, i) => (
                <li key={i} className="bi-kit-flow-step">
                  <span className="n" aria-hidden="true">{s.n}</span>
                  <div>
                    <div className="t">{s.t}</div>
                    <div className="d">{s.d}</div>
                  </div>
                </li>
              ))}
            </ol>
          </IgnitionReveal>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      <section aria-labelledby="kit-why" style={{ paddingBlock: space[10], paddingInline: space[5] }}>
        <Container size="lg">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[7] }}>
              <div style={kickerStyle}>{c.why.kicker}</div>
              <h3 id="kit-why" style={sectionHeading}>{c.why.h}</h3>
            </div>
            <ul className="bi-kit-why">
              {c.why.bullets.map((b, i) => (
                <li key={i}>
                  <div className="t">{b.t}</div>
                  <div className="d">{b.d}</div>
                </li>
              ))}
            </ul>
          </IgnitionReveal>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      <section aria-labelledby="kit-faq" style={{ paddingBlock: space[10], paddingInline: space[5] }}>
        <Container size="lg">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[7] }}>
              <div style={kickerStyle}>{c.faq.kicker}</div>
              <h3 id="kit-faq" style={sectionHeading}>{c.faq.h}</h3>
            </div>
            <dl className="bi-kit-faq">
              {c.faq.items.map((it, i) => (
                <div key={i} className="bi-kit-faq-item">
                  <dt>{it.q}</dt>
                  <dd>{it.a}</dd>
                </div>
              ))}
            </dl>
          </IgnitionReveal>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      <section aria-labelledby="kit-close" style={{ paddingBlock: space[10], paddingInline: space[5] }}>
        <Container size="md">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div className="bi-kit-close">
              <div style={kickerStyle}>{c.closing.kicker}</div>
              <h3 id="kit-close" style={{ ...sectionHeading, marginBlockEnd: space[4] }}>{c.closing.h}</h3>
              <p style={{ color: cssVar.textDim, lineHeight: 1.65, marginBlockEnd: space[6] }}>
                {c.closing.p}
              </p>
              <div style={{ display: "inline-flex", gap: space[3], flexWrap: "wrap" }}>
                <Link href="/demo" className="bi-kit-cta-primary">
                  {c.closing.ctaPrimary}
                  <span aria-hidden="true" className="arrow">→</span>
                </Link>
                <Link href="/pricing" className="bi-kit-cta-secondary">
                  {c.closing.ctaSecondary}
                </Link>
              </div>
              <p style={{ marginBlockStart: space[6], fontSize: font.size.xs, color: cssVar.textMuted, fontFamily: cssVar.fontMono }}>
                Última revisión: {LAST_REVIEWED}
              </p>
            </div>
          </IgnitionReveal>
        </Container>
      </section>
    </PublicShell>
  );
}
