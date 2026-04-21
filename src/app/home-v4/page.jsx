import Link from "next/link";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font, bioSignal, radius } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";
import ShowcaseDevice from "./ShowcaseDevice";

export const metadata = {
  title: "BIO-IGNICIÓN",
  description: "Optimización humana, rediseñada. Evidencia. Privacidad. Precisión.",
  alternates: { canonical: "/home-v4" },
  robots: { index: false, follow: false },
};

const COPY = {
  es: {
    heroKicker: "NUEVO · MOTOR NEURAL",
    h1a: "Optimización humana.",
    h1b: "Rediseñada.",
    sub: "Un instrumento medido. Evidencia revisada. Privacidad por diseño. Todo lo demás, fuera.",
    ctaBuy: "Reservar demo",
    ctaLearn: "Conoce más",

    deviceLive: "EN VIVO",
    deviceSession: "PROTOCOLO · ENFOQUE",
    deviceLabel: "READINESS",
    deviceReady: "Listo para rendir",
    deviceBreath: "Respiración",

    pillarEyebrow: "TRES SEÑALES · UNA HISTORIA",
    pillarH1: "Cada marcador",
    pillarH2: "tiene una razón.",
    pillarBody: "No decoramos datos. Si no podemos explicar por qué cambió, no lo mostramos.",

    bentoEyebrow: "POR DENTRO",
    bentoH: "Construido con la misma obsesión por el detalle que le exiges a tu equipo.",
    bento: {
      readiness: { t: "Readiness compuesto", d: "HRV · sueño · carga previa · respiración." },
      privacy: { t: "Privacidad,", u: "por diseño.", d: "k-anonymity ≥5. IDB cifrado. Sin telemetría por defecto. El usuario es dueño de sus datos — exporta y borra en menos de 24 horas." },
      evidence: { t: "Evidencia revisada", d: "Cada protocolo rastrea a un estudio peer-reviewed. Nivel alto, moderado o limitado — transparente." },
      protocols: { t: "Cuatro protocolos", d: "Calma · Enfoque · Energía · Reset. Adaptan cadencia, frecuencia y duración a ti." },
      integrations: { t: "Se integra con tu ecosistema", d: "Okta · Azure AD · Google · HealthKit · Garmin · Oura · Fitbit." },
      team: { t: "Panel de equipo", d: "Cohortes agregadas. Drift detection. Individuos intactos." },
    },

    highlightEyebrow: "SEGURIDAD",
    highlightH1: "Privacidad, integrada",
    highlightH2: "desde el primer byte.",
    highlightBody: "SOC 2. DPA firmado. SCCs para EU. Residencia US · EU · APAC · LATAM. Un CISO puede dormir.",
    highlightCta: "Trust Center",

    ladderEyebrow: "PLANES",
    ladderH: "Empieza donde estés.",
    ladderSub: "Pilotos de 25 usuarios sin compromiso anual.",
    plans: [
      { name: "Starter", price: "$19", unit: "/usuario/mes", features: ["Hasta 25 usuarios", "Protocolos base", "Dashboard individual"], cta: "Empezar", href: "/signup" },
      { name: "Growth", price: "$39", unit: "/usuario/mes", features: ["Hasta 500 usuarios", "Panel de equipo", "Integraciones wearable", "SSO (Google)"], cta: "Empezar", href: "/signup", highlight: true },
      { name: "Enterprise", price: "Custom", unit: "contacto", features: ["Usuarios ilimitados", "SSO · SCIM · Okta · Azure", "DPA personalizado", "Residencia a elección"], cta: "Contactar", href: "/demo" },
    ],

    finalKicker: "SIGUIENTE",
    finalH: "30 minutos.",
    finalH2: "Una sesión en vivo.",
    finalBody: "Sin slides. Corremos un protocolo contigo, leemos tu HRV y respondemos todo sobre seguridad.",
    finalCta: "Agendar demo",
  },
  en: {
    heroKicker: "NEW · NEURAL ENGINE",
    h1a: "Human performance.",
    h1b: "Redesigned.",
    sub: "A measured instrument. Peer-reviewed evidence. Privacy by design. Everything else, out.",
    ctaBuy: "Book a demo",
    ctaLearn: "Learn more",

    deviceLive: "LIVE",
    deviceSession: "PROTOCOL · FOCUS",
    deviceLabel: "READINESS",
    deviceReady: "Ready to perform",
    deviceBreath: "Breath",

    pillarEyebrow: "THREE SIGNALS · ONE STORY",
    pillarH1: "Every marker",
    pillarH2: "has a reason.",
    pillarBody: "We don't decorate data. If we can't explain the delta, we don't show it.",

    bentoEyebrow: "INSIDE",
    bentoH: "Built with the same obsession for detail you demand of your team.",
    bento: {
      readiness: { t: "Composite readiness", d: "HRV · sleep · prior load · breath." },
      privacy: { t: "Privacy,", u: "by design.", d: "k-anonymity ≥5. Encrypted IDB. No telemetry by default. Users own their data — export and erase in under 24 hours." },
      evidence: { t: "Peer-reviewed evidence", d: "Every protocol traces to a study. Rated high, moderate or limited — transparent." },
      protocols: { t: "Four protocols", d: "Calm · Focus · Energy · Reset. Cadence, frequency and duration adapt to you." },
      integrations: { t: "Fits your ecosystem", d: "Okta · Azure AD · Google · HealthKit · Garmin · Oura · Fitbit." },
      team: { t: "Team dashboard", d: "Aggregated cohorts. Drift detection. Individuals intact." },
    },

    highlightEyebrow: "SECURITY",
    highlightH1: "Privacy, built in",
    highlightH2: "from the first byte.",
    highlightBody: "SOC 2. Signed DPA. SCCs for EU. Residency US · EU · APAC · LATAM. Your CISO can sleep.",
    highlightCta: "Trust Center",

    ladderEyebrow: "PLANS",
    ladderH: "Start where you are.",
    ladderSub: "25-user pilots with no annual commitment.",
    plans: [
      { name: "Starter", price: "$19", unit: "/user/mo", features: ["Up to 25 users", "Core protocols", "Individual dashboard"], cta: "Start", href: "/signup" },
      { name: "Growth", price: "$39", unit: "/user/mo", features: ["Up to 500 users", "Team dashboard", "Wearable integrations", "SSO (Google)"], cta: "Start", href: "/signup", highlight: true },
      { name: "Enterprise", price: "Custom", unit: "contact", features: ["Unlimited users", "SSO · SCIM · Okta · Azure", "Custom DPA", "Residency of choice"], cta: "Contact", href: "/demo" },
    ],

    finalKicker: "NEXT",
    finalH: "30 minutes.",
    finalH2: "A live session.",
    finalBody: "No slides. We run a protocol with you, read your HRV, and answer everything about security.",
    finalCta: "Book a demo",
  },
};

export default async function HomeV4Page() {
  const locale = await getServerLocale();
  const T = COPY[locale === "en" ? "en" : "es"];

  return (
    <PublicShell activePath="/home-v4">
      {/* HERO */}
      <section style={{
        paddingBlock: space[20],
        paddingInline: space[5],
        textAlign: "center",
      }}>
        <Container size="lg">
          <div style={{
            fontFamily: cssVar.fontMono, fontSize: font.size.xs,
            color: bioSignal.phosphorCyan,
            textTransform: "uppercase", letterSpacing: font.tracking.caps,
            fontWeight: font.weight.black,
            marginBlockEnd: space[5],
          }}>
            {T.heroKicker}
          </div>
          <h1 style={{
            margin: 0,
            fontSize: "clamp(52px, 8vw, 112px)",
            lineHeight: 1.02,
            letterSpacing: "-0.045em",
            fontWeight: font.weight.black,
            color: cssVar.text,
          }}>
            <span style={{ display: "block" }}>{T.h1a}</span>
            <span style={{
              display: "block",
              background: `linear-gradient(120deg, ${bioSignal.phosphorCyan}, ${bioSignal.neuralViolet})`,
              WebkitBackgroundClip: "text", backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              {T.h1b}
            </span>
          </h1>
          <p style={{
            marginBlockStart: space[6],
            marginInline: "auto",
            maxInlineSize: 640,
            fontSize: font.size.xl,
            lineHeight: 1.4,
            color: cssVar.textDim,
            fontWeight: font.weight.normal,
          }}>
            {T.sub}
          </p>
          <div style={{
            marginBlockStart: space[8],
            display: "inline-flex", gap: space[5], flexWrap: "wrap",
            justifyContent: "center", alignItems: "center",
          }}>
            <Link href="/demo" style={{
              padding: `${space[3]}px ${space[6]}px`,
              borderRadius: radius.full,
              background: bioSignal.phosphorCyan,
              color: "#0a0d14",
              textDecoration: "none",
              fontWeight: font.weight.bold,
              fontSize: font.size.lg,
            }}>
              {T.ctaBuy}
            </Link>
            <Link href="/evidencia" style={{
              color: bioSignal.phosphorCyan,
              textDecoration: "none",
              fontWeight: font.weight.semibold,
              fontSize: font.size.lg,
              display: "inline-flex", alignItems: "center", gap: space[1],
            }}>
              {T.ctaLearn} <span aria-hidden>›</span>
            </Link>
          </div>
        </Container>
      </section>

      {/* SHOWCASE DEVICE */}
      <section style={{ paddingBlock: space[10], paddingInline: space[5] }}>
        <ShowcaseDevice T={T} />
      </section>

      {/* PILLAR STATEMENT */}
      <section style={{
        paddingBlock: space[20], paddingInline: space[5],
        textAlign: "center",
      }}>
        <Container size="md">
          <div style={{
            fontFamily: cssVar.fontMono, fontSize: font.size.xs,
            color: bioSignal.phosphorCyan,
            textTransform: "uppercase", letterSpacing: font.tracking.caps,
            fontWeight: font.weight.black,
            marginBlockEnd: space[4],
          }}>
            {T.pillarEyebrow}
          </div>
          <h2 style={{
            margin: 0,
            fontSize: "clamp(36px, 5.5vw, 72px)",
            lineHeight: 1.05,
            letterSpacing: "-0.035em",
            fontWeight: font.weight.black,
            color: cssVar.text,
          }}>
            <span style={{ display: "block" }}>{T.pillarH1}</span>
            <span style={{
              display: "block",
              color: cssVar.textDim,
              fontWeight: font.weight.semibold,
            }}>
              {T.pillarH2}
            </span>
          </h2>
          <p style={{
            marginBlockStart: space[6], marginInline: "auto",
            maxInlineSize: 580,
            fontSize: font.size.xl, lineHeight: 1.5,
            color: cssVar.textDim,
          }}>
            {T.pillarBody}
          </p>
        </Container>
      </section>

      {/* BENTO GRID */}
      <section style={{ paddingBlockEnd: space[20], paddingInline: space[5] }}>
        <Container size="xl">
          <div style={{
            fontFamily: cssVar.fontMono, fontSize: font.size.xs,
            color: bioSignal.phosphorCyan,
            textTransform: "uppercase", letterSpacing: font.tracking.caps,
            fontWeight: font.weight.black,
            marginBlockEnd: space[4],
          }}>
            {T.bentoEyebrow}
          </div>
          <h2 style={{
            margin: 0,
            fontSize: "clamp(30px, 4vw, 48px)",
            lineHeight: 1.1,
            letterSpacing: "-0.025em",
            fontWeight: font.weight.bold,
            color: cssVar.text,
            maxInlineSize: 780,
            marginBlockEnd: space[10],
          }}>
            {T.bentoH}
          </h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(12, 1fr)",
            gridAutoRows: "minmax(220px, auto)",
            gap: space[4],
          }}>
            {/* Big left card: Privacy */}
            <BentoCard
              col="span 7"
              row="span 2"
              variant="hero"
              title={T.bento.privacy.t}
              titleUnder={T.bento.privacy.u}
              body={T.bento.privacy.d}
              visual="privacy"
            />

            {/* Top right: Readiness */}
            <BentoCard
              col="span 5"
              title={T.bento.readiness.t}
              body={T.bento.readiness.d}
              visual="readiness"
            />

            {/* Bottom right: Evidence */}
            <BentoCard
              col="span 5"
              title={T.bento.evidence.t}
              body={T.bento.evidence.d}
              visual="evidence"
            />

            {/* Bottom row: Protocols / Integrations / Team */}
            <BentoCard col="span 4" title={T.bento.protocols.t} body={T.bento.protocols.d} visual="protocols" />
            <BentoCard col="span 4" title={T.bento.integrations.t} body={T.bento.integrations.d} visual="integrations" />
            <BentoCard col="span 4" title={T.bento.team.t} body={T.bento.team.d} visual="team" />
          </div>
        </Container>
      </section>

      {/* HIGHLIGHT */}
      <section style={{
        position: "relative",
        paddingBlock: space[20], paddingInline: space[5],
        background: `linear-gradient(180deg, transparent, color-mix(in srgb, ${bioSignal.phosphorCyan} 6%, transparent), transparent)`,
        borderBlock: `1px solid ${cssVar.border}`,
        textAlign: "center",
        overflow: "hidden",
      }}>
        <Container size="md">
          <div style={{
            fontFamily: cssVar.fontMono, fontSize: font.size.xs,
            color: bioSignal.phosphorCyan,
            textTransform: "uppercase", letterSpacing: font.tracking.caps,
            fontWeight: font.weight.black,
            marginBlockEnd: space[4],
          }}>
            {T.highlightEyebrow}
          </div>
          <h2 style={{
            margin: 0,
            fontSize: "clamp(40px, 6vw, 84px)",
            lineHeight: 1.02,
            letterSpacing: "-0.04em",
            fontWeight: font.weight.black,
            color: cssVar.text,
          }}>
            <span style={{ display: "block" }}>{T.highlightH1}</span>
            <span style={{
              display: "block",
              background: `linear-gradient(120deg, ${bioSignal.phosphorCyan}, ${bioSignal.neuralViolet})`,
              WebkitBackgroundClip: "text", backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              {T.highlightH2}
            </span>
          </h2>
          <p style={{
            marginBlockStart: space[6], marginInline: "auto",
            maxInlineSize: 620,
            fontSize: font.size.xl, lineHeight: 1.5,
            color: cssVar.textDim,
          }}>
            {T.highlightBody}
          </p>
          <div style={{ marginBlockStart: space[6] }}>
            <Link href="/trust" style={{
              color: bioSignal.phosphorCyan,
              textDecoration: "none",
              fontWeight: font.weight.semibold,
              fontSize: font.size.lg,
              display: "inline-flex", alignItems: "center", gap: space[1],
            }}>
              {T.highlightCta} <span aria-hidden>›</span>
            </Link>
          </div>
        </Container>
      </section>

      {/* PRICING LADDER */}
      <section style={{ paddingBlock: space[20], paddingInline: space[5] }}>
        <Container size="xl">
          <div style={{ textAlign: "center", marginBlockEnd: space[12] }}>
            <div style={{
              fontFamily: cssVar.fontMono, fontSize: font.size.xs,
              color: bioSignal.phosphorCyan,
              textTransform: "uppercase", letterSpacing: font.tracking.caps,
              fontWeight: font.weight.black,
              marginBlockEnd: space[4],
            }}>
              {T.ladderEyebrow}
            </div>
            <h2 style={{
              margin: 0,
              fontSize: "clamp(36px, 5vw, 64px)",
              lineHeight: 1.05,
              letterSpacing: "-0.035em",
              fontWeight: font.weight.black,
              color: cssVar.text,
            }}>
              {T.ladderH}
            </h2>
            <p style={{
              marginBlockStart: space[4], marginInline: "auto",
              maxInlineSize: 500,
              fontSize: font.size.lg, lineHeight: 1.5,
              color: cssVar.textDim,
            }}>
              {T.ladderSub}
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: space[4],
          }}>
            {T.plans.map((p, i) => (
              <div key={i} style={{
                padding: space[7],
                borderRadius: radius["2xl"],
                background: p.highlight
                  ? `linear-gradient(180deg, color-mix(in srgb, ${bioSignal.phosphorCyan} 14%, transparent), transparent), ${cssVar.surface}`
                  : cssVar.surface,
                border: p.highlight
                  ? `1px solid ${bioSignal.phosphorCyan}`
                  : `1px solid ${cssVar.border}`,
                boxShadow: p.highlight
                  ? `0 30px 80px -40px ${bioSignal.phosphorCyan}60`
                  : "none",
                display: "flex", flexDirection: "column",
              }}>
                <div style={{
                  fontSize: font.size.lg,
                  fontWeight: font.weight.semibold,
                  color: cssVar.text,
                  marginBlockEnd: space[3],
                }}>
                  {p.name}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: space[2], marginBlockEnd: space[5] }}>
                  <span style={{
                    fontSize: "clamp(40px, 5vw, 56px)",
                    lineHeight: 1,
                    fontWeight: font.weight.black,
                    letterSpacing: "-0.035em",
                    color: cssVar.text,
                  }}>
                    {p.price}
                  </span>
                  <span style={{
                    fontSize: font.size.sm,
                    color: cssVar.textMuted,
                  }}>
                    {p.unit}
                  </span>
                </div>
                <ul style={{
                  listStyle: "none", padding: 0, margin: 0,
                  display: "grid", gap: space[2],
                  flex: 1,
                  marginBlockEnd: space[6],
                }}>
                  {p.features.map((f, j) => (
                    <li key={j} style={{
                      display: "grid", gridTemplateColumns: "auto 1fr",
                      gap: space[2],
                      fontSize: font.size.md,
                      color: cssVar.textDim,
                      lineHeight: 1.5,
                    }}>
                      <span aria-hidden style={{ color: bioSignal.phosphorCyan, fontWeight: font.weight.bold }}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={p.href} style={{
                  display: "block",
                  padding: `${space[3]}px ${space[5]}px`,
                  borderRadius: radius.full,
                  textAlign: "center",
                  background: p.highlight ? bioSignal.phosphorCyan : "transparent",
                  color: p.highlight ? "#0a0d14" : cssVar.text,
                  border: p.highlight ? `1px solid ${bioSignal.phosphorCyan}` : `1px solid ${cssVar.borderStrong}`,
                  textDecoration: "none",
                  fontWeight: font.weight.bold,
                  fontSize: font.size.md,
                }}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* FINAL CTA */}
      <section style={{
        paddingBlock: space[20], paddingInline: space[5],
        textAlign: "center",
        borderBlockStart: `1px solid ${cssVar.border}`,
      }}>
        <Container size="md">
          <div style={{
            fontFamily: cssVar.fontMono, fontSize: font.size.xs,
            color: bioSignal.phosphorCyan,
            textTransform: "uppercase", letterSpacing: font.tracking.caps,
            fontWeight: font.weight.black,
            marginBlockEnd: space[4],
          }}>
            {T.finalKicker}
          </div>
          <h2 style={{
            margin: 0,
            fontSize: "clamp(44px, 7vw, 96px)",
            lineHeight: 1,
            letterSpacing: "-0.04em",
            fontWeight: font.weight.black,
            color: cssVar.text,
          }}>
            <span style={{ display: "block" }}>{T.finalH}</span>
            <span style={{
              display: "block",
              color: cssVar.textDim,
              fontWeight: font.weight.semibold,
            }}>
              {T.finalH2}
            </span>
          </h2>
          <p style={{
            marginBlockStart: space[6], marginInline: "auto",
            maxInlineSize: 540,
            fontSize: font.size.xl, lineHeight: 1.5,
            color: cssVar.textDim,
          }}>
            {T.finalBody}
          </p>
          <div style={{ marginBlockStart: space[8] }}>
            <Link href="/demo" style={{
              padding: `${space[3]}px ${space[7]}px`,
              borderRadius: radius.full,
              background: bioSignal.phosphorCyan,
              color: "#0a0d14",
              textDecoration: "none",
              fontWeight: font.weight.bold,
              fontSize: font.size.lg,
              display: "inline-block",
            }}>
              {T.finalCta}
            </Link>
          </div>
        </Container>
      </section>
    </PublicShell>
  );
}

function BentoCard({ col = "span 4", row = "span 1", title, titleUnder, body, variant = "default", visual }) {
  return (
    <article style={{
      gridColumn: col,
      gridRow: row,
      padding: space[7],
      borderRadius: radius["2xl"],
      background: variant === "hero"
        ? `linear-gradient(135deg, color-mix(in srgb, ${bioSignal.phosphorCyan} 8%, transparent), transparent), ${cssVar.surface}`
        : cssVar.surface,
      border: `1px solid ${cssVar.border}`,
      display: "flex", flexDirection: "column",
      position: "relative",
      overflow: "hidden",
      minBlockSize: row === "span 2" ? 480 : 220,
    }}>
      <h3 style={{
        margin: 0,
        fontSize: variant === "hero" ? "clamp(28px, 3.5vw, 44px)" : font.size["2xl"],
        lineHeight: 1.05,
        letterSpacing: "-0.025em",
        fontWeight: font.weight.black,
        color: cssVar.text,
      }}>
        {title}
        {titleUnder && (
          <span style={{
            display: "block",
            color: cssVar.textDim,
            fontWeight: font.weight.semibold,
          }}>
            {titleUnder}
          </span>
        )}
      </h3>
      <p style={{
        margin: `${space[4]}px 0 0`,
        fontSize: variant === "hero" ? font.size.lg : font.size.md,
        lineHeight: 1.5,
        color: cssVar.textDim,
        maxInlineSize: variant === "hero" ? 480 : undefined,
      }}>
        {body}
      </p>
      <BentoVisual kind={visual} />
    </article>
  );
}

function BentoVisual({ kind }) {
  const base = {
    position: "absolute",
    pointerEvents: "none",
    zIndex: 0,
  };

  if (kind === "privacy") {
    return (
      <>
        <div aria-hidden style={{
          ...base,
          insetBlockEnd: -40, insetInlineEnd: -40,
          width: 280, height: 280, borderRadius: "50%",
          background: `radial-gradient(closest-side, ${bioSignal.phosphorCyan}22, transparent 70%)`,
        }} />
        <svg aria-hidden width="160" height="180" viewBox="0 0 160 180" style={{
          position: "absolute", insetBlockEnd: 24, insetInlineEnd: 24, zIndex: 1,
          opacity: 0.9,
        }}>
          <defs>
            <linearGradient id="lock-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={bioSignal.phosphorCyan} />
              <stop offset="100%" stopColor={bioSignal.neuralViolet} />
            </linearGradient>
          </defs>
          <path
            d="M40 80 L40 55 Q40 20 80 20 Q120 20 120 55 L120 80"
            fill="none" stroke="url(#lock-grad)" strokeWidth="6" strokeLinecap="round"
          />
          <rect x="28" y="80" width="104" height="80" rx="12" fill="none" stroke="url(#lock-grad)" strokeWidth="5" />
          <circle cx="80" cy="118" r="8" fill="url(#lock-grad)" />
          <rect x="76" y="118" width="8" height="20" rx="4" fill="url(#lock-grad)" />
        </svg>
      </>
    );
  }

  if (kind === "readiness") {
    return (
      <div aria-hidden style={{
        position: "absolute", insetBlockEnd: 20, insetInlineEnd: 20, zIndex: 1,
        display: "flex", alignItems: "baseline", gap: 6,
      }}>
        <span style={{
          fontSize: 56, fontFamily: "var(--font-mono)",
          fontWeight: 800, letterSpacing: "-0.04em",
          background: `linear-gradient(180deg, ${cssVar.text}, ${bioSignal.phosphorCyan})`,
          WebkitBackgroundClip: "text", backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          lineHeight: 1,
        }}>78</span>
        <span style={{ color: cssVar.textMuted, fontSize: 14, fontFamily: "var(--font-mono)" }}>%</span>
      </div>
    );
  }

  if (kind === "evidence") {
    return (
      <div aria-hidden style={{
        position: "absolute", insetBlockEnd: 20, insetInlineEnd: 20, zIndex: 1,
        display: "flex", gap: 4,
      }}>
        {[1, 1, 1, 0.6, 0.3].map((op, i) => (
          <div key={i} style={{
            width: 10, height: 28,
            background: bioSignal.phosphorCyan,
            opacity: op,
            boxShadow: op > 0.5 ? `0 0 10px ${bioSignal.phosphorCyan}` : "none",
            borderRadius: 2,
          }} />
        ))}
      </div>
    );
  }

  if (kind === "protocols") {
    return (
      <div aria-hidden style={{
        position: "absolute", insetBlockEnd: 20, insetInlineEnd: 20, zIndex: 1,
        display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6,
      }}>
        {[bioSignal.phosphorCyan, bioSignal.neuralViolet, bioSignal.plasmaPink, bioSignal.ignition].map((c, i) => (
          <div key={i} style={{
            width: 18, height: 18, borderRadius: 4,
            background: c,
            boxShadow: `0 0 8px ${c}`,
          }} />
        ))}
      </div>
    );
  }

  if (kind === "integrations") {
    return (
      <div aria-hidden style={{
        position: "absolute", insetBlockEnd: 20, insetInlineEnd: 20, zIndex: 1,
        display: "flex", gap: -8,
      }}>
        {[bioSignal.phosphorCyan, bioSignal.neuralViolet, bioSignal.plasmaPink].map((c, i) => (
          <div key={i} style={{
            width: 28, height: 28, borderRadius: "50%",
            background: `radial-gradient(closest-side, ${c}, transparent 75%)`,
            border: `1px solid ${c}`,
            marginInlineStart: i === 0 ? 0 : -8,
          }} />
        ))}
      </div>
    );
  }

  if (kind === "team") {
    return (
      <div aria-hidden style={{
        position: "absolute", insetBlockEnd: 20, insetInlineEnd: 20, zIndex: 1,
        display: "grid", gap: 4, width: 100,
      }}>
        {[70, 50, 80, 60].map((w, i) => (
          <div key={i} style={{
            height: 6, borderRadius: 3,
            background: `linear-gradient(90deg, ${bioSignal.phosphorCyan}, ${bioSignal.phosphorCyan}33)`,
            width: `${w}%`,
          }} />
        ))}
      </div>
    );
  }

  return null;
}
