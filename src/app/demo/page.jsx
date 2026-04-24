import Link from "next/link";
import { headers } from "next/headers";
import DemoForm from "./DemoForm";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { cssVar, space, font, bioSignal } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";
import IgnitionReveal from "@/components/brand/IgnitionReveal";
import BioglyphLattice from "@/components/brand/BioglyphLattice";
import PulseDivider from "@/components/brand/PulseDivider";
import SpotlightGrid from "@/components/brand/SpotlightGrid";

export const metadata = {
  title: "Reserva demo 1:1 · 30 min sin slides",
  description: "30 minutos con un especialista. Protocolo neural en vivo + panel de equipo con datos simulados. Respuesta humana en < 24 h hábiles.",
  alternates: { canonical: "/demo" },
  openGraph: {
    title: "BIO-IGNICIÓN · Demo 1:1 · 30 min sin slides",
    description: "Ve un protocolo neural en vivo. Sin slides, sin deck, sin bots.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
};

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
  fontSize: "clamp(28px, 3.6vw, 42px)",
  letterSpacing: "-0.025em",
  lineHeight: 1.1,
  fontWeight: font.weight.black,
  color: cssVar.text,
};

const COPY = {
  es: {
    eyebrow: "DEMO 1:1",
    h1: "Vívelo primero. Decide con evidencia.",
    editorial: "30 minutos, en vivo, sin slides — respiras, escuchas, ves el panel.",
    scarcityLabel: "6 VENTANAS ESTA SEMANA · RESPUESTA < 24 H HÁBILES",
    p: "Corremos un protocolo neural contigo — respiración coherente + audio binaural + medición HRV. Te mostramos el panel de equipo con datos simulados reales y respondemos preguntas de seguridad y compliance sobre la mesa.",
    bullets: [
      "Sesión neural en vivo (breath + audio + binaural).",
      "Panel de equipo con k-anonymity ≥5.",
      <>Q&amp;A de SSO, SCIM, DPA, residencia de datos.</>,
      <>ROI estimado según tu tamaño de equipo — <Link href="/roi-calculator">ver calculadora</Link>.</>,
    ],
    formTitle: "Reserva un horario",
    formSubtitle: "Contesta un humano · < 24 h hábiles · Sin bots, sin auto-responders.",

    closingKicker: "LISTO CUANDO TÚ LO ESTÉS",
    closingHLead: "Treinta minutos.",
    closingHBody: "Sin slides. Un humano al otro lado.",
    closingBody: "Sin tarjeta. Sin compromisos. Sin scripts de venta. Si al minuto 15 decides que no aplica, lo cerramos con un resumen útil y seguimos como amigos.",
    closingAvail: "Ventanas abiertas esta semana",
    closingAvailMeta: "LATAM · US Central · EMEA bajo agenda",
    closingSigName: "Equipo de Partnerships",
    closingSigMeta: "Contesta en < 24 h hábiles · Nunca un bot",
    closingPrimary: "Agenda demo",
    closingSecondary: "Prefiero async — escribir a sales",
    closingTertiary: "Mejor pruebo self-serve",

    proofKicker: "LO QUE ESPERAS",
    proofStats: [
      { v: "30", l: "min en vivo", s: "sin slides, sin deck" },
      { v: "—", l: "tarjeta requerida", s: "sólo un email corporativo" },
      { v: "< 24h", l: "respuesta humana", s: "hábiles · no bot" },
      { v: "k ≥ 5", l: "anonimato del panel", s: "agregados, sin nombres" },
    ],

    stepsKicker: "QUÉ SIGUE",
    stepsH: "De hoy a la decisión, con criterios claros.",
    steps: [
      { t: "Hoy", d: "Envías el formulario. Se crea un ticket con tu contexto; sin auto-responders genéricos." },
      { t: "< 24 h hábiles", d: "Te escribe un humano (no un bot) con 2–3 horarios propuestos y la agenda específica según tu rol." },
      { t: "Día de la demo", d: "30 min por video. Sin slides — sesión en vivo + panel + Q&A (agenda detallada abajo)." },
      { t: "Después", d: "Sin spam. Si sigue teniendo sentido, te enviamos el Pilot Agreement; si no, te explicamos por qué — con nombre y apellido. Tu contexto queda confidencial (ver FAQ)." },
    ],
    agendaKicker: "AGENDA DEL 30 MIN",
    agendaH: "Minuto a minuto, sin deck.",
    agenda: [
      { t: "0 – 5 min", d: "Contexto breve del equipo y del problema que quieres resolver." },
      { t: "5 – 20 min", d: "Protocolo neural en vivo: respiración resonante + audio binaural + HRV." },
      { t: "20 – 25 min", d: "Panel de equipo con datos simulados reales (k-anonymity ≥5)." },
      { t: "25 – 30 min", d: "Q&A abierto: SSO, SCIM, DPA, residencia, precios, timelines." },
    ],

    trustKicker: "CUMPLIMIENTO · A LA VISTA",
    trustH: "Cumplimiento con evidencia firmada.",
    trust: [
      { label: "SOC 2 Type II", status: "en auditoría", tone: "pending" },
      { label: "HIPAA · BAA", status: "firmable · Enterprise", tone: "ready" },
      { label: "GDPR · UE", status: "residencia opcional", tone: "ready" },
      { label: "NOM-035 STPS", status: "reporte automatizado", tone: "ready" },
      { label: "CFDI 4.0", status: "todos los planes", tone: "ready" },
      { label: "Audit log", status: "hash chain verificable", tone: "ready" },
    ],
    trustNote: "Estado en vivo y detalle firmado en",
    trustNoteLink: "/trust",

    refsKicker: "LECTURA PREVIA",
    refsH: "Lo que tu equipo legal ya sabe antes de la reunión.",
    refsSub: "Los documentos que tu CISO y tu equipo legal van a pedir — públicos, versionados, con fecha de firma visible.",
    refs: [
      { href: "/trust", label: "Trust Center", meta: "Arquitectura · auditorías · pentest · incident history" },
      { href: "/trust/dpa", label: "DPA · Anexo GDPR", meta: "Data Processing Agreement firmable vía DocuSign" },
      { href: "/trust/subprocessors", label: "Subprocesadores", meta: "Lista en vivo con región, proposito y fecha de alta" },
    ],

    faqKicker: "ANTES DE AGENDAR",
    faqH: "Preguntas frecuentes antes de reservar.",
    faq: [
      {
        q: "¿Quién debería asistir?",
        a: "Ideal: champion + decisor + alguien de IT/Security si tu empresa tiene proceso formal. Mínimo viable: solo tú. La demo se adapta: si vienes solo, profundizamos más en producto; si vienen varios, balanceamos protocolo y Q&A.",
      },
      {
        q: "¿Comparten nuestro contexto con otros prospectos?",
        a: "No. Lo que nos cuentas en el formulario y durante la demo es confidencial por default — no se usa en otras demos, no se cita en marketing ni en materiales comerciales, no se comparte con terceros. Esta política es contractual bajo el DPA estándar, no solo operacional.",
      },
      {
        q: "¿Puedo grabar la sesión?",
        a: "No, la sesión no se graba por ninguna de las dos partes. Son 30 min de producto pre-GA con datos simulados y roadmap en evolución; una grabación podría sacarse de contexto o quedar desactualizada en semanas. A cambio, te enviamos dentro de 24 h un resumen escrito con puntos clave, capturas relevantes y próximos pasos — ese es el artefacto que puedes compartir internamente. Si necesitas un deck resumen bajo NDA, también lo tenemos listo.",
      },
      {
        q: "¿Firman NDA antes de la reunión?",
        a: "No es necesario para una demo estándar — no compartimos nada confidencial de otros clientes y tu contexto queda protegido por default (ver arriba). Si tu equipo legal lo requiere, firmamos tu NDA antes de la reunión; normalmente en < 48 h hábiles.",
      },
      {
        q: "¿Qué necesito del lado técnico?",
        a: "Nada. La demo es por video (Google Meet o tu plataforma preferida). El protocolo corre en nuestro lado — tú solo respiras, escuchas y ves el panel. Si tienes wearable (Apple Watch, Fitbit, Oura), tenlo a mano para HRV en vivo.",
      },
      {
        q: "¿En qué idiomas y horarios?",
        a: "Español, inglés o bilingüe si tu equipo es mixto. Horarios principales: MX/CDMX, US Central y LATAM; EMEA y APAC bajo agenda con 48 h de anticipación. El formulario te propone slots según tu zona horaria.",
      },
      {
        q: "De agendar a firmar, ¿cuánto tarda?",
        a: "Starter: self-serve el mismo día. Growth: piloto 30 d con onboarding guiado, firma de MSA en paralelo. Enterprise: 60 d con DPA firmado, SSO federado y primer reporte NOM-035. Timelines detallados en /pricing.",
      },
    ],

    legalKicker: "Legal · Avisos",
    legalHint: "Leer",
    legalDisclaimer: "Avisos: La disponibilidad semanal (~6 ventanas) es estimación operativa y puede variar por festivo o capacidad del equipo; el SLA de respuesta de < 24 h aplica a días hábiles. Apple Watch, Fitbit, Oura, Google Meet y otras marcas o nombres comerciales citados pertenecen a sus respectivos titulares y se mencionan bajo fair use nominativo (sin afiliación, patrocinio ni endoso). Las estimaciones de ROI mencionadas son cálculos basados en literatura pública y no constituyen garantía ni promesa contractual. La sesión no se graba por ninguna de las partes; el resumen escrito post-demo es el artefacto oficial. Tu contexto durante la demo es confidencial por default bajo DPA estándar. Para términos vinculantes, consulta MSA, DPA y ToS en /trust.",
  },
  en: {
    eyebrow: "1:1 DEMO",
    h1: "Experience it live. Decide with evidence.",
    editorial: "30 minutes, live, no slides — you breathe, you listen, you see the panel.",
    scarcityLabel: "6 WINDOWS THIS WEEK · REPLY WITHIN 24 BUSINESS HOURS",
    p: "We run a live neural protocol with you — coherent breathing + binaural audio + HRV measurement. We show you the team panel with real simulated data and answer security & compliance questions on the table.",
    bullets: [
      "Live neural session (breath + audio + binaural).",
      "Team panel with k-anonymity ≥5.",
      <>Q&amp;A on SSO, SCIM, DPA, data residency.</>,
      <>Estimated ROI based on your team size — <Link href="/roi-calculator">see calculator</Link>.</>,
    ],
    formTitle: "Book a slot",
    formSubtitle: "A human replies · within 24 business hours · No bots, no auto-responders.",

    closingKicker: "READY WHEN YOU ARE",
    closingHLead: "Thirty minutes.",
    closingHBody: "No slides. A human on the other side.",
    closingBody: "No card. No commitment. No sales script. If at minute 15 you decide it doesn't fit, we close with a useful recap and part ways as friends.",
    closingAvail: "Windows open this week",
    closingAvailMeta: "LATAM · US Central · EMEA on request",
    closingSigName: "Partnerships team",
    closingSigMeta: "Replies within 24 business hours · Never a bot",
    closingPrimary: "Book a demo",
    closingSecondary: "I prefer async — email sales",
    closingTertiary: "I'll try self-serve first",

    proofKicker: "WHAT TO EXPECT",
    proofStats: [
      { v: "30", l: "min live", s: "no slides, no deck" },
      { v: "—", l: "card required", s: "just a work email" },
      { v: "< 24h", l: "human reply", s: "business hours · no bot" },
      { v: "k ≥ 5", l: "panel anonymity", s: "aggregates, no names" },
    ],

    stepsKicker: "WHAT HAPPENS NEXT",
    stepsH: "From today to decision, with clear criteria.",
    steps: [
      { t: "Today", d: "You send the form. A ticket is created with your context — no generic auto-responders." },
      { t: "< 24 business hours", d: "A human (not a bot) replies with 2–3 time slots and an agenda shaped to your role." },
      { t: "Demo day", d: "30 min over video. No slides — live session + panel + Q&A (full agenda below)." },
      { t: "After", d: "No spam. If it still makes sense, we send the Pilot Agreement; if not, we tell you why — by name. Your context stays confidential (see FAQ)." },
    ],
    agendaKicker: "30-MIN AGENDA",
    agendaH: "Minute by minute, no deck.",
    agenda: [
      { t: "0 – 5 min", d: "Quick context of your team and the problem you want to solve." },
      { t: "5 – 20 min", d: "Live neural protocol: resonant breathing + binaural audio + HRV." },
      { t: "20 – 25 min", d: "Team panel with real simulated data (k-anonymity ≥5)." },
      { t: "25 – 30 min", d: "Open Q&A: SSO, SCIM, DPA, residency, pricing, timelines." },
    ],

    trustKicker: "COMPLIANCE · IN THE OPEN",
    trustH: "Compliance backed by signed evidence.",
    trust: [
      { label: "SOC 2 Type II", status: "audit in progress", tone: "pending" },
      { label: "HIPAA · BAA", status: "signable · Enterprise", tone: "ready" },
      { label: "GDPR · EU", status: "optional residency", tone: "ready" },
      { label: "NOM-035 STPS", status: "automated report", tone: "ready" },
      { label: "CFDI 4.0", status: "all plans", tone: "ready" },
      { label: "Audit log", status: "verifiable hash chain", tone: "ready" },
    ],
    trustNote: "Live status and signed detail at",
    trustNoteLink: "/trust",

    refsKicker: "PRE-READ",
    refsH: "What your legal team already knows before the meeting.",
    refsSub: "The documents your CISO and legal will ask for — public, versioned, with signing date visible.",
    refs: [
      { href: "/trust", label: "Trust Center", meta: "Architecture · audits · pentest · incident history" },
      { href: "/trust/dpa", label: "DPA · GDPR Annex", meta: "Data Processing Agreement, DocuSign-signable" },
      { href: "/trust/subprocessors", label: "Subprocessors", meta: "Live list with region, purpose and onboarding date" },
    ],

    faqKicker: "BEFORE YOU BOOK",
    faqH: "Common questions before you reserve.",
    faq: [
      {
        q: "Who should attend?",
        a: "Ideal: champion + decision-maker + someone from IT/Security if your company has a formal process. Minimum: just you. The demo adapts — solo sessions go deeper on product; group sessions balance protocol and Q&A.",
      },
      {
        q: "Do you share our context with other prospects?",
        a: "No. What you tell us in the form and during the demo is confidential by default — not used in other demos, not quoted in marketing or sales materials, not shared with third parties. This is contractual under the standard DPA, not just operational.",
      },
      {
        q: "Can I record the session?",
        a: "No — the session is not recorded by either side. These are 30 min of pre-GA product with simulated data and an evolving roadmap; a recording could be taken out of context or go stale in weeks. In exchange, within 24 h you get a written recap with key points, relevant captures and next steps — that's the artifact you can share internally. If you need a summary deck under NDA, we have that ready too.",
      },
      {
        q: "Do we need to sign an NDA first?",
        a: "Not required for a standard demo — we don't share anything confidential from other customers and your context is protected by default (see above). If your legal team needs it, we sign yours before the meeting; usually within 48 business hours.",
      },
      {
        q: "What do I need technically?",
        a: "Nothing. The demo is over video (Google Meet or your preferred platform). The protocol runs on our side — you just breathe, listen, and watch the panel. If you have a wearable (Apple Watch, Fitbit, Oura), have it on hand for live HRV.",
      },
      {
        q: "What languages and time zones?",
        a: "Spanish, English, or bilingual for mixed teams. Primary hours: MX/CDMX, US Central and LATAM; EMEA and APAC on request with 48 h notice. The form proposes slots based on your time zone.",
      },
      {
        q: "From booking to signed — how long?",
        a: "Starter: self-serve the same day. Growth: 30-day pilot with guided onboarding, MSA signed in parallel. Enterprise: 60 days with signed DPA, federated SSO and first NOM-035 report. Detailed timelines at /pricing.",
      },
    ],

    legalKicker: "Legal · Disclaimers",
    legalHint: "Read",
    legalDisclaimer: "Disclaimers: Weekly availability (~6 windows) is an operational estimate and may vary with holidays or team capacity; the < 24 h reply SLA applies to business days. Apple Watch, Fitbit, Oura, Google Meet and other brand or trade names mentioned belong to their respective owners and are cited under nominative fair use (no affiliation, sponsorship or endorsement). ROI estimates mentioned are calculations based on public literature and do not constitute a guarantee or contractual promise. The session is not recorded by either party; the written post-demo recap is the official artifact. Your context during the demo is confidential by default under the standard DPA. For binding terms, see MSA, DPA and ToS at /trust.",
  },
};

export default async function DemoPage() {
  const locale = await getServerLocale();
  const L = locale === "en" ? "en" : "es";
  const c = COPY[L];
  const nonce = (await headers()).get("x-nonce") || undefined;

  return (
    <PublicShell activePath="/demo">
      {/* ═══ Hero + form split ═══ */}
      <Container size="lg" className="bi-prose">
        <div className="bi-split" style={{ position: "relative" }}>
          <div aria-hidden className="bi-demo-lattice">
            <BioglyphLattice variant="ambient" />
          </div>
          <div aria-hidden className="bi-demo-hero-fx" />

          <section style={{ position: "relative", zIndex: 1 }}>
            <IgnitionReveal sparkOrigin="20% 25%">
              <div style={kickerStyle}>{c.eyebrow}</div>
              <h1
                style={{
                  margin: `${space[3]}px 0 ${space[4]}px`,
                  fontSize: "clamp(36px, 5.2vw, 64px)",
                  letterSpacing: "-0.035em",
                  lineHeight: 1.02,
                }}
              >
                {c.h1}
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-editorial), 'Instrument Serif', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: "clamp(18px, 2vw, 24px)",
                  lineHeight: 1.35,
                  color: cssVar.textMuted,
                  margin: `0 0 ${space[4]}px`,
                }}
              >
                {c.editorial}
              </p>
              <p style={{ margin: `0 0 ${space[5]}px`, lineHeight: 1.55 }}>{c.p}</p>

              <ul className="bi-demo-hero-bullets">
                {c.bullets.map((b, i) => <li key={i}>{b}</li>)}
              </ul>

              <div className="bi-roi-scarcity" aria-label={c.scarcityLabel} style={{ marginBlockStart: space[4], marginBlockEnd: space[5] }}>
                <span className="bi-roi-scarcity-label">{c.scarcityLabel}</span>
              </div>

              <div className="bi-demo-hero-chips" aria-label={L === "en" ? "Compliance preview" : "Vista previa de cumplimiento"}>
                {c.trust.slice(0, 3).map((t) => (
                  <span key={t.label} className="bi-demo-hero-chip" data-tone={t.tone}>
                    <span className="dot" aria-hidden />
                    {t.label}
                  </span>
                ))}
                <a href="#demo-trust" className="bi-demo-hero-chip-more">
                  {L === "en" ? "Full list ↓" : "Todos ↓"}
                </a>
              </div>
            </IgnitionReveal>
          </section>

          <Card as="section" padding={7} aria-labelledby="demo-form-title" style={{ position: "relative", zIndex: 1 }}>
            <div
              aria-hidden
              style={{
                position: "absolute",
                insetInlineStart: 0,
                insetBlockStart: 0,
                height: 2,
                width: "38%",
                background: `linear-gradient(90deg, ${bioSignal.phosphorCyan} 0%, ${bioSignal.neuralViolet} 100%)`,
                borderStartStartRadius: "inherit",
              }}
            />
            <h2
              id="demo-form-title"
              style={{
                margin: 0,
                fontSize: "clamp(22px, 2.6vw, 28px)",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                fontWeight: font.weight.black,
                color: cssVar.text,
              }}
            >
              {c.formTitle}
            </h2>
            <p className="bi-demo-form-subtitle">{c.formSubtitle}</p>
            <DemoForm source="demo" locale={locale} />
          </Card>
        </div>
      </Container>

      {/* ═══ Proof stat strip ═══ */}
      <section aria-label={c.proofKicker} style={{ marginBlockStart: space[7] }}>
        <Container size="xl" style={{ paddingInline: 0 }}>
          <div className="bi-proof-stats">
            {c.proofStats.map((s) => (
              <div key={s.l}>
                <span className="v">{s.v}</span>
                <span className="l">{s.l}</span>
                <span className="s">{s.s}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      {/* ═══ What happens next — timeline ═══ */}
      <section aria-labelledby="demo-steps" style={{ paddingBlock: space[9], paddingInline: space[5], scrollMarginBlockStart: 80 }}>
        <Container size="xl">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[7] }}>
              <div style={kickerStyle}>{c.stepsKicker}</div>
              <h2 id="demo-steps" style={sectionHeading}>{c.stepsH}</h2>
            </div>
            <div className="bi-how-grid" role="list">
              {c.steps.map((s) => (
                <article key={s.t} className="bi-how-step" role="listitem">
                  <h4>{s.t}</h4>
                  <p>{s.d}</p>
                </article>
              ))}
            </div>

            {/* ── Dedicated 30-min agenda panel — keeps timeline cards uniform ── */}
            <div className="bi-demo-agenda-panel" aria-labelledby="demo-agenda">
              <div className="bi-demo-agenda-head">
                <div style={kickerStyle}>{c.agendaKicker}</div>
                <h3 id="demo-agenda" className="bi-demo-agenda-title">{c.agendaH}</h3>
              </div>
              <ol className="bi-demo-agenda">
                {c.agenda.map((a) => (
                  <li key={a.t}>
                    <span className="tick">{a.t}</span>
                    <span className="body">{a.d}</span>
                  </li>
                ))}
              </ol>
            </div>
          </IgnitionReveal>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      {/* ═══ Trust chips — compliance at a glance ═══ */}
      <section id="demo-trust" aria-labelledby="demo-trust-h" style={{ paddingBlock: space[9], paddingInline: space[5], scrollMarginBlockStart: 80 }}>
        <Container size="xl">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[6] }}>
              <div style={kickerStyle}>{c.trustKicker}</div>
              <h2 id="demo-trust-h" style={sectionHeading}>{c.trustH}</h2>
            </div>
            <div className="bi-trust-block bi-trust-block--bare">
              <div className="bi-trust-strip" role="list">
                {c.trust.map((t) => (
                  <span
                    key={t.label}
                    className="bi-trust-chip"
                    role="listitem"
                    data-tone={t.tone}
                    title={`${t.label} · ${t.status}`}
                  >
                    <span className="dot" aria-hidden />
                    <span className="trust-label">{t.label}</span>
                    <span className="trust-status" aria-hidden>{t.status}</span>
                  </span>
                ))}
              </div>
              <p className="bi-strip-footnote">
                {c.trustNote}{" "}
                <Link href={c.trustNoteLink}>{c.trustNoteLink}</Link>
              </p>
            </div>
          </IgnitionReveal>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      {/* ═══ References — what legal/CISO will ask for ═══ */}
      <section aria-labelledby="demo-refs" style={{ paddingBlock: space[9], paddingInline: space[5], scrollMarginBlockStart: 80 }}>
        <Container size="xl">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[7] }}>
              <div style={kickerStyle}>{c.refsKicker}</div>
              <h2 id="demo-refs" style={sectionHeading}>{c.refsH}</h2>
              <p style={{
                marginBlockStart: space[3],
                marginInline: "auto",
                maxInlineSize: 580,
                color: cssVar.textDim,
                fontSize: font.size.md,
                lineHeight: 1.55,
              }}>
                {c.refsSub}
              </p>
            </div>

            <SpotlightGrid className="bi-cred-grid" role="list">
              {c.refs.map((r) => (
                <Link key={r.href} href={r.href} className="bi-cred-card bi-spot" role="listitem">
                  <span className="bi-cred-label">{r.label}</span>
                  <span className="bi-cred-meta">{r.meta}</span>
                  <span className="bi-cred-arrow" aria-hidden>→</span>
                </Link>
              ))}
            </SpotlightGrid>
          </IgnitionReveal>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      {/* ═══ FAQ ═══ */}
      <section aria-labelledby="demo-faq" style={{ paddingBlock: space[9], paddingInline: space[5], scrollMarginBlockStart: 80 }}>
        <Container size="md">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[7] }}>
              <div style={kickerStyle}>{c.faqKicker}</div>
              <h2 id="demo-faq" style={sectionHeading}>{c.faqH}</h2>
            </div>
            <div className="bi-faq">
              {c.faq.map((item, i) => (
                <details key={item.q} className="bi-faq-item" open={i === 0}>
                  <summary>
                    <span>{item.q}</span>
                    <span className="chev" aria-hidden>▾</span>
                  </summary>
                  <div className="bi-faq-a">{item.a}</div>
                </details>
              ))}
            </div>
          </IgnitionReveal>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      {/* ═══ Closing CTA — reactivation + human signature for bottom readers ═══ */}
      <section aria-labelledby="demo-closing" className="bi-demo-closing-section">
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

              <h2 id="demo-closing" className="bi-demo-closing-h">
                <span className="bi-demo-closing-h-lead">{c.closingHLead}</span>{" "}
                <span className="bi-demo-closing-h-body">{c.closingHBody}</span>
              </h2>

              <p className="bi-demo-closing-body">{c.closingBody}</p>

              <div className="bi-demo-closing-actions">
                <a href="#demo-form-title" className="bi-demo-closing-primary">
                  <span className="bi-demo-closing-primary-label">{c.closingPrimary}</span>
                  <span aria-hidden className="bi-demo-closing-primary-sep" />
                  <svg aria-hidden width="15" height="15" viewBox="0 0 15 15" className="bi-demo-closing-primary-arrow">
                    <path d="M7.5 11.5V3M4 6.5L7.5 3l3.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </a>
                <a
                  href="mailto:sales@bio-ignicion.app?subject=Async%20demo%20%E2%80%94%20BIO-IGNICI%C3%93N"
                  className="bi-demo-closing-ghost"
                >
                  <svg aria-hidden width="13" height="13" viewBox="0 0 13 13">
                    <path d="M1.5 3.5h10v6a1 1 0 01-1 1h-8a1 1 0 01-1-1v-6z" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round" />
                    <path d="M1.9 3.8l4.6 3.6L11.1 3.8" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>{c.closingSecondary}</span>
                </a>
                <Link href="/signup?plan=starter" className="bi-demo-closing-ghost">
                  <svg aria-hidden width="13" height="13" viewBox="0 0 13 13">
                    <path d="M6.5 1.5v4M6.5 7.5v4M1.5 6.5h4M7.5 6.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
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
                  <span className="bi-demo-closing-avail-meta">{c.closingAvailMeta}</span>
                </div>
                <div className="bi-demo-closing-sig">
                  <span className="bi-demo-closing-sig-name">— {c.closingSigName}</span>
                  <span className="bi-demo-closing-sig-meta">{c.closingSigMeta}</span>
                </div>
              </div>
            </div>
          </IgnitionReveal>
        </Container>
      </section>

      <Container size="lg">
        <details className="bi-pricing-legal" role="note">
          <summary className="bi-pricing-legal-summary">
            <span className="bi-pricing-legal-kicker">{c.legalKicker}</span>
            <span className="bi-pricing-legal-hint">
              {c.legalHint}
              <span className="chev" aria-hidden>▾</span>
            </span>
          </summary>
          <p className="bi-pricing-legal-body">{c.legalDisclaimer}</p>
        </details>
      </Container>

      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: c.faq.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
    </PublicShell>
  );
}
