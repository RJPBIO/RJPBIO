import Link from "next/link";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font, bioSignal, radius } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";
import HomeHero from "./HomeHero";
import LiveProtocol from "./LiveProtocol";

export const metadata = {
  title: "BIO-IGNICIÓN · Optimización humana para equipos de alto rendimiento",
  description: "Protocolos neurales adaptativos, evidencia revisada, panel de equipo con k-anonymity. Sin gimmicks — un instrumento, no una app de bienestar.",
  alternates: { canonical: "/home-v2" },
  robots: { index: false, follow: false },
};

const COPY = {
  es: {
    heroAria: "Introducción",
    eyebrow: "Señal · No ruido",
    h1a: "Ingeniería del rendimiento humano,",
    h1b: "medida como un instrumento.",
    sub: "Protocolo neural adaptativo en vivo — respiración, audio binaural y HRV — con evidencia revisada por pares y panel de equipo que respeta la privacidad de cada individuo.",
    ctaPrimary: "Reservar demo",
    ctaSecondary: "Ver evidencia",
    trust1: "k-anonymity ≥5",
    trust2: "SOC 2 · SSO · SCIM",
    trust3: "DPA · Residencia US/EU",

    statsEyebrow: "Por qué es distinto",
    stats: [
      { num: "0", label: "datos clínicos enviados sin consentimiento", fine: "Local-first, cifrado en IndexedDB" },
      { num: "≥5", label: "k-anonymity mínimo en paneles de equipo", fine: "Nadie queda identificado" },
      { num: "24h", label: "respuesta humana a cualquier solicitud DPA", fine: "Sin tickets, sin bots" },
    ],

    protocolEyebrow: "El protocolo",
    protocolH: "Una sesión, cuatro fases.",
    protocolHEm: "Calibrada en tiempo real.",
    protocolBody: "No es meditación genérica. Cada fase se adapta a tu HRV, tu historial y tu objetivo del día.",
    phases: [
      { t: "0 – 2 min", title: "Baseline", d: "Captura de HRV en reposo y ajuste inicial del protocolo." },
      { t: "2 – 8 min", title: "Respiración resonante", d: "Cadencia 5.5–6.5 rpm, guiada por feedback visual y audio." },
      { t: "8 – 14 min", title: "Binaural neural", d: "Frecuencia adaptativa según fase objetivo (calma, enfoque, energía)." },
      { t: "14 – 18 min", title: "Consolidación", d: "Resumen de marcadores y sugerencias para la siguiente sesión." },
    ],

    liveEyebrow: "Sesión en vivo",
    liveH1: "Tus señales,",
    liveH1Em: "leídas como una partitura.",
    liveBody: "El panel no decora: cada marcador es interpretable y trazable. Si no entendemos por qué cambió, no lo mostramos.",
    liveBullets: [
      "HRV (RMSSD) filtrado con ventana móvil de 60 s.",
      "Coherencia respiratoria vs. ritmo objetivo.",
      "Índice de readiness compuesto — explicable.",
    ],
    hudLive: "EN VIVO",
    hudSession: "Protocolo · Enfoque",
    hrvLabel: "HRV · RMSSD (ms)",
    metrics: [
      { label: "HRV", value: "72", unit: "ms RMSSD", color: bioSignal.phosphorCyan },
      { label: "Coherencia", value: "0.84", unit: "0-1", color: bioSignal.neuralViolet },
      { label: "Readiness", value: "91", unit: "0-100", color: bioSignal.ignition },
    ],
    breathLabel: "Respiración guiada",
    breathValue: "5.5 rpm · inhalar 4s / exhalar 7s",

    scienceEyebrow: "Evidencia",
    scienceQuote: "No inventamos protocolos — los estandarizamos. Cada fase rastrea al menos un estudio revisado por pares y su evidencia se clasifica como alta, moderada o limitada.",
    scienceCta: "Leer el dossier completo",

    teamEyebrow: "Para equipos",
    teamH: "Datos agregados.",
    teamHEm: "Individuos intactos.",
    teamBody: "El panel de equipo nunca expone lecturas individuales. Todo bucket con n < 5 se colapsa antes de salir del servidor.",
    teamBullets: [
      "Cohortes por departamento, residencia o tipo de turno.",
      "Exportación CSV con la misma regla de k-anonymity.",
      "Dueño del dato: cada usuario puede descargar o borrar el suyo en <24 h.",
    ],
    teamCta: "Ver panel de equipo",

    trustEyebrow: "Seguridad y cumplimiento",
    trustH: "Construido para que tu CISO duerma.",
    trustItems: [
      { t: "SSO · SCIM", d: "Okta, Azure AD, Google. Aprovisionamiento automático." },
      { t: "DPA firmado", d: "Cláusulas SCCs para EU. Residencia US/EU/APAC/LATAM." },
      { t: "Auditoría continua", d: "Logs inmutables y exportables, retención configurable." },
      { t: "Cifrado", d: "TLS 1.3 en tránsito. AES-256 en reposo. IDB cifrado en cliente." },
    ],
    trustCta: "Trust Center",

    faqEyebrow: "Preguntas directas",
    faqs: [
      { q: "¿Esto es una app de bienestar?", a: "No. Es un instrumento de medición + protocolo adaptativo. Si querés recompensas gamificadas, hay mejores opciones." },
      { q: "¿Qué pasa si mi equipo ya usa wearables?", a: "Nos integramos con HealthKit, Google Fit, Oura, Garmin, Fitbit. Si tu wearable expone HRV, lo consumimos." },
      { q: "¿Puedo probar sin traer a todo el equipo?", a: "Sí. El plan Starter permite pilotos de hasta 25 usuarios sin compromiso anual." },
      { q: "¿Dónde viven los datos?", a: "Donde decidás: US, EU, APAC o LATAM. Se aplica la DPA firmada y SCCs cuando aplica." },
    ],

    finalEyebrow: "Siguiente paso",
    finalH: "30 minutos.",
    finalHEm: "Sin slides.",
    finalBody: "Corremos un protocolo en vivo contigo, te mostramos el panel de equipo con datos simulados y respondemos todas las preguntas de seguridad.",
    finalCta1: "Reservar demo",
    finalCta2: "Ver precios",
  },
  en: {
    heroAria: "Introduction",
    eyebrow: "Signal · Not noise",
    h1a: "Human performance engineering,",
    h1b: "measured like an instrument.",
    sub: "Adaptive neural protocol in real time — breathwork, binaural audio, HRV — backed by peer-reviewed evidence, with a team panel that respects every individual's privacy.",
    ctaPrimary: "Book a demo",
    ctaSecondary: "Read the evidence",
    trust1: "k-anonymity ≥5",
    trust2: "SOC 2 · SSO · SCIM",
    trust3: "DPA · US/EU residency",

    statsEyebrow: "Why it's different",
    stats: [
      { num: "0", label: "clinical data points shared without consent", fine: "Local-first, encrypted IndexedDB" },
      { num: "≥5", label: "minimum k-anonymity in team dashboards", fine: "No individual is identifiable" },
      { num: "24h", label: "human response to any DPA request", fine: "No tickets, no bots" },
    ],

    protocolEyebrow: "The protocol",
    protocolH: "One session, four phases.",
    protocolHEm: "Calibrated in real time.",
    protocolBody: "Not generic meditation. Each phase adapts to your HRV, your history and your target for the day.",
    phases: [
      { t: "0 – 2 min", title: "Baseline", d: "Resting HRV capture and initial protocol tuning." },
      { t: "2 – 8 min", title: "Resonant breathing", d: "5.5–6.5 bpm cadence, guided by visual and audio feedback." },
      { t: "8 – 14 min", title: "Neural binaural", d: "Adaptive frequency based on target state (calm, focus, energy)." },
      { t: "14 – 18 min", title: "Consolidation", d: "Marker summary and suggestions for the next session." },
    ],

    liveEyebrow: "Live session",
    liveH1: "Your signals,",
    liveH1Em: "read like a score.",
    liveBody: "The dashboard doesn't decorate — every marker is interpretable and traceable. If we can't explain why it changed, we don't show it.",
    liveBullets: [
      "HRV (RMSSD) filtered with a 60s rolling window.",
      "Breath coherence vs. target cadence.",
      "Composite readiness index — explainable.",
    ],
    hudLive: "LIVE",
    hudSession: "Protocol · Focus",
    hrvLabel: "HRV · RMSSD (ms)",
    metrics: [
      { label: "HRV", value: "72", unit: "ms RMSSD", color: bioSignal.phosphorCyan },
      { label: "Coherence", value: "0.84", unit: "0-1", color: bioSignal.neuralViolet },
      { label: "Readiness", value: "91", unit: "0-100", color: bioSignal.ignition },
    ],
    breathLabel: "Guided breathing",
    breathValue: "5.5 bpm · inhale 4s / exhale 7s",

    scienceEyebrow: "Evidence",
    scienceQuote: "We don't invent protocols — we standardize them. Every phase traces back to at least one peer-reviewed study, and its evidence is rated high, moderate or limited.",
    scienceCta: "Read the full dossier",

    teamEyebrow: "For teams",
    teamH: "Aggregate data.",
    teamHEm: "Individuals intact.",
    teamBody: "The team panel never exposes individual readings. Any bucket with n < 5 is collapsed before it leaves the server.",
    teamBullets: [
      "Cohorts by department, residency or shift type.",
      "CSV export with the same k-anonymity rule.",
      "Data ownership: each user can download or erase their own in <24h.",
    ],
    teamCta: "See the team panel",

    trustEyebrow: "Security & compliance",
    trustH: "Built so your CISO can sleep.",
    trustItems: [
      { t: "SSO · SCIM", d: "Okta, Azure AD, Google. Automatic provisioning." },
      { t: "Signed DPA", d: "SCCs for EU. Residency US/EU/APAC/LATAM." },
      { t: "Continuous audit", d: "Immutable exportable logs, configurable retention." },
      { t: "Encryption", d: "TLS 1.3 in transit. AES-256 at rest. Encrypted client IDB." },
    ],
    trustCta: "Trust Center",

    faqEyebrow: "Straight answers",
    faqs: [
      { q: "Is this a wellness app?", a: "No. It's a measurement instrument + adaptive protocol. If you want gamified rewards, there are better options." },
      { q: "What if my team already uses wearables?", a: "We integrate with HealthKit, Google Fit, Oura, Garmin, Fitbit. If your wearable exposes HRV, we consume it." },
      { q: "Can I try without rolling out the whole team?", a: "Yes. The Starter plan supports pilots up to 25 users without an annual commitment." },
      { q: "Where does the data live?", a: "Wherever you decide: US, EU, APAC or LATAM. DPA and SCCs apply where relevant." },
    ],

    finalEyebrow: "Next step",
    finalH: "30 minutes.",
    finalHEm: "No slides.",
    finalBody: "We run a live protocol with you, show the team panel with simulated data, and answer every security question on the table.",
    finalCta1: "Book a demo",
    finalCta2: "See pricing",
  },
};

export default async function HomeV2Page() {
  const locale = await getServerLocale();
  const T = COPY[locale === "en" ? "en" : "es"];

  return (
    <PublicShell activePath="/home-v2">
      <HomeHero T={T} />

      {/* Stats band */}
      <section style={{ paddingBlock: space[16], paddingInline: space[5], borderBlock: `1px solid ${cssVar.border}` }}>
        <Container size="xl">
          <div style={{
            fontSize: font.size.sm, color: bioSignal.phosphorCyan,
            textTransform: "uppercase", letterSpacing: font.tracking.caps,
            fontWeight: font.weight.bold, fontFamily: cssVar.fontMono,
            marginBlockEnd: space[6], textAlign: "center",
          }}>
            {T.statsEyebrow}
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: space[10],
          }}>
            {T.stats.map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{
                  fontSize: "clamp(56px, 7vw, 96px)",
                  lineHeight: 1,
                  fontWeight: font.weight.black,
                  letterSpacing: "-0.04em",
                  background: `linear-gradient(180deg, ${cssVar.text}, ${bioSignal.phosphorCyan})`,
                  WebkitBackgroundClip: "text", backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontFamily: cssVar.fontMono,
                }}>
                  {s.num}
                </div>
                <div style={{
                  marginBlockStart: space[3],
                  fontSize: font.size.lg, color: cssVar.text,
                  lineHeight: 1.5,
                  maxInlineSize: 280, margin: `${space[3]}px auto 0`,
                }}>
                  {s.label}
                </div>
                <div style={{
                  marginBlockStart: space[2],
                  fontSize: font.size.sm, color: cssVar.textMuted,
                  fontFamily: cssVar.fontMono,
                }}>
                  {s.fine}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Protocol */}
      <section style={{ paddingBlock: space[20], paddingInline: space[5] }}>
        <Container size="xl">
          <div style={{
            fontSize: font.size.sm, color: bioSignal.phosphorCyan,
            textTransform: "uppercase", letterSpacing: font.tracking.caps,
            fontWeight: font.weight.bold, fontFamily: cssVar.fontMono,
            marginBlockEnd: space[4],
          }}>
            {T.protocolEyebrow}
          </div>
          <h2 style={{
            margin: 0,
            fontSize: "clamp(36px, 5vw, 64px)",
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            fontWeight: font.weight.black,
            color: cssVar.text,
            maxInlineSize: 760,
          }}>
            {T.protocolH}{" "}
            <span style={{
              fontStyle: "italic",
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontWeight: 400,
              color: cssVar.textDim,
            }}>
              {T.protocolHEm}
            </span>
          </h2>
          <p style={{
            marginBlockStart: space[5],
            fontSize: font.size.xl, color: cssVar.textDim,
            lineHeight: 1.55, maxInlineSize: 640,
          }}>
            {T.protocolBody}
          </p>

          <ol style={{
            listStyle: "none", padding: 0, margin: `${space[10]}px 0 0`,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: space[6],
          }}>
            {T.phases.map((p, i) => (
              <li key={i} style={{
                padding: space[5],
                borderRadius: radius.lg,
                background: "color-mix(in srgb, var(--bi-surface) 60%, transparent)",
                border: `1px solid ${cssVar.border}`,
                position: "relative",
              }}>
                <div style={{
                  position: "absolute", top: space[3], insetInlineEnd: space[3],
                  fontSize: font.size["3xl"], fontWeight: font.weight.black,
                  color: cssVar.border, lineHeight: 1,
                  fontFamily: cssVar.fontMono,
                }}>
                  0{i + 1}
                </div>
                <div style={{
                  fontSize: font.size.xs, color: bioSignal.phosphorCyan,
                  textTransform: "uppercase", letterSpacing: font.tracking.caps,
                  fontWeight: font.weight.bold, fontFamily: cssVar.fontMono,
                }}>
                  {p.t}
                </div>
                <h3 style={{
                  margin: `${space[2]}px 0 ${space[2]}px`,
                  fontSize: font.size.xl,
                  fontWeight: font.weight.bold,
                  color: cssVar.text,
                  letterSpacing: font.tracking.tight,
                }}>
                  {p.title}
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: font.size.md, color: cssVar.textDim,
                  lineHeight: 1.6,
                }}>
                  {p.d}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Live protocol demo */}
      <LiveProtocol T={T} />

      {/* Science pull-quote */}
      <section style={{
        paddingBlock: space[20], paddingInline: space[5],
        background: "color-mix(in srgb, var(--bi-surface) 50%, transparent)",
        borderBlock: `1px solid ${cssVar.border}`,
      }}>
        <Container size="lg">
          <div style={{
            fontSize: font.size.sm, color: bioSignal.phosphorCyan,
            textTransform: "uppercase", letterSpacing: font.tracking.caps,
            fontWeight: font.weight.bold, fontFamily: cssVar.fontMono,
            marginBlockEnd: space[6], textAlign: "center",
          }}>
            {T.scienceEyebrow}
          </div>
          <blockquote style={{
            margin: 0,
            fontSize: "clamp(24px, 3.2vw, 38px)",
            lineHeight: 1.35,
            fontWeight: font.weight.normal,
            fontStyle: "italic",
            fontFamily: "'Georgia', 'Times New Roman', serif",
            color: cssVar.text,
            textAlign: "center",
            maxInlineSize: 840, margin: "0 auto",
            letterSpacing: "-0.01em",
          }}>
            <span aria-hidden style={{
              display: "inline-block",
              color: bioSignal.phosphorCyan,
              fontSize: "1.8em", lineHeight: 0.5,
              transform: "translateY(0.3em)",
              marginInlineEnd: space[2],
            }}>"</span>
            {T.scienceQuote}
          </blockquote>
          <div style={{ textAlign: "center", marginBlockStart: space[8] }}>
            <Link href="/evidencia" style={{
              display: "inline-flex", alignItems: "center", gap: space[2],
              color: bioSignal.phosphorCyan,
              fontFamily: cssVar.fontMono, fontSize: font.size.sm,
              textTransform: "uppercase", letterSpacing: font.tracking.caps,
              fontWeight: font.weight.bold,
              textDecoration: "none",
            }}>
              {T.scienceCta} <span aria-hidden>→</span>
            </Link>
          </div>
        </Container>
      </section>

      {/* Team */}
      <section style={{ paddingBlock: space[20], paddingInline: space[5] }}>
        <Container size="xl">
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: space[12], alignItems: "center",
          }}>
            <div>
              <div style={{
                fontSize: font.size.sm, color: bioSignal.phosphorCyan,
                textTransform: "uppercase", letterSpacing: font.tracking.caps,
                fontWeight: font.weight.bold, fontFamily: cssVar.fontMono,
                marginBlockEnd: space[3],
              }}>
                {T.teamEyebrow}
              </div>
              <h2 style={{
                margin: 0,
                fontSize: "clamp(32px, 4.2vw, 52px)",
                lineHeight: 1.08, letterSpacing: "-0.02em",
                fontWeight: font.weight.black, color: cssVar.text,
              }}>
                {T.teamH}{" "}
                <span style={{
                  fontStyle: "italic",
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontWeight: 400,
                  color: cssVar.textDim,
                }}>
                  {T.teamHEm}
                </span>
              </h2>
              <p style={{
                marginBlockStart: space[5],
                fontSize: font.size.lg, color: cssVar.textDim,
                lineHeight: 1.6,
              }}>
                {T.teamBody}
              </p>
              <ul style={{
                listStyle: "none", padding: 0, margin: `${space[6]}px 0 0`,
                display: "grid", gap: space[3],
              }}>
                {T.teamBullets.map((b, i) => (
                  <li key={i} style={{
                    display: "grid", gridTemplateColumns: "auto 1fr", gap: space[3],
                  }}>
                    <span aria-hidden style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: bioSignal.phosphorCyan,
                      boxShadow: `0 0 10px ${bioSignal.phosphorCyan}`,
                      transform: "translateY(6px)",
                    }} />
                    <span style={{ color: cssVar.text, fontSize: font.size.md, lineHeight: 1.6 }}>
                      {b}
                    </span>
                  </li>
                ))}
              </ul>
              <Link href="/team" style={{
                display: "inline-flex", alignItems: "center", gap: space[2],
                marginBlockStart: space[6],
                color: bioSignal.phosphorCyan,
                fontFamily: cssVar.fontMono, fontSize: font.size.sm,
                textTransform: "uppercase", letterSpacing: font.tracking.caps,
                fontWeight: font.weight.bold,
                textDecoration: "none",
              }}>
                {T.teamCta} <span aria-hidden>→</span>
              </Link>
            </div>

            {/* Cohort bars mock */}
            <div style={{
              padding: space[6],
              borderRadius: radius["2xl"],
              background: bioSignal.deepField,
              border: `1px solid ${cssVar.border}`,
              boxShadow: `0 30px 80px -40px ${bioSignal.neuralViolet}40`,
            }}>
              <div style={{
                fontFamily: cssVar.fontMono, fontSize: font.size.xs,
                textTransform: "uppercase", letterSpacing: font.tracking.caps,
                color: cssVar.textMuted, marginBlockEnd: space[4],
                display: "flex", justifyContent: "space-between",
              }}>
                <span>Cohorte · Ingeniería</span>
                <span>n = 42 · k=5</span>
              </div>
              {[
                { label: "HRV", v: 68, max: 100, color: bioSignal.phosphorCyan },
                { label: "Coherence", v: 78, max: 100, color: bioSignal.neuralViolet },
                { label: "Readiness", v: 84, max: 100, color: bioSignal.ignition },
                { label: "Sleep", v: 71, max: 100, color: bioSignal.plasmaPink },
                { label: "Stress", v: 42, max: 100, color: bioSignal.signalAmber },
              ].map((row, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "110px 1fr 52px",
                  gap: space[3], alignItems: "center",
                  paddingBlock: space[2],
                  borderBlockEnd: i === 4 ? "none" : `1px solid ${cssVar.border}`,
                }}>
                  <span style={{
                    fontFamily: cssVar.fontMono, fontSize: font.size.xs,
                    color: cssVar.textDim,
                    textTransform: "uppercase", letterSpacing: font.tracking.caps,
                  }}>
                    {row.label}
                  </span>
                  <div style={{
                    position: "relative", height: 8,
                    borderRadius: radius.full,
                    background: cssVar.surface2,
                    overflow: "hidden",
                  }}>
                    <div style={{
                      position: "absolute", inset: 0,
                      width: `${row.v}%`,
                      background: `linear-gradient(90deg, ${row.color}, ${row.color}aa)`,
                      boxShadow: `0 0 12px ${row.color}80`,
                      borderRadius: radius.full,
                    }} />
                  </div>
                  <span style={{
                    fontFamily: cssVar.fontMono, fontSize: font.size.sm,
                    color: cssVar.text, textAlign: "end",
                    fontWeight: font.weight.bold,
                  }}>
                    {row.v}
                  </span>
                </div>
              ))}
              <div style={{
                marginBlockStart: space[4],
                paddingBlockStart: space[3],
                borderBlockStart: `1px dashed ${cssVar.border}`,
                fontFamily: cssVar.fontMono, fontSize: 10,
                color: cssVar.textMuted, textAlign: "center",
                textTransform: "uppercase", letterSpacing: font.tracking.caps,
              }}>
                Agregados · Sin exposición individual
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Trust grid */}
      <section style={{
        paddingBlock: space[20], paddingInline: space[5],
        background: "color-mix(in srgb, var(--bi-surface) 50%, transparent)",
        borderBlock: `1px solid ${cssVar.border}`,
      }}>
        <Container size="xl">
          <div style={{
            fontSize: font.size.sm, color: bioSignal.phosphorCyan,
            textTransform: "uppercase", letterSpacing: font.tracking.caps,
            fontWeight: font.weight.bold, fontFamily: cssVar.fontMono,
            marginBlockEnd: space[4],
          }}>
            {T.trustEyebrow}
          </div>
          <h2 style={{
            margin: 0,
            fontSize: "clamp(32px, 4.2vw, 52px)",
            lineHeight: 1.08, letterSpacing: "-0.02em",
            fontWeight: font.weight.black, color: cssVar.text,
            maxInlineSize: 640,
          }}>
            {T.trustH}
          </h2>

          <div style={{
            marginBlockStart: space[10],
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: space[5],
          }}>
            {T.trustItems.map((it, i) => (
              <div key={i} style={{
                padding: space[5],
                borderRadius: radius.lg,
                background: cssVar.surface,
                border: `1px solid ${cssVar.border}`,
              }}>
                <div style={{
                  fontFamily: cssVar.fontMono, fontSize: font.size.sm,
                  color: bioSignal.phosphorCyan, fontWeight: font.weight.bold,
                  textTransform: "uppercase", letterSpacing: font.tracking.caps,
                  marginBlockEnd: space[2],
                }}>
                  {it.t}
                </div>
                <p style={{
                  margin: 0, color: cssVar.textDim,
                  fontSize: font.size.md, lineHeight: 1.55,
                }}>
                  {it.d}
                </p>
              </div>
            ))}
          </div>

          <div style={{ marginBlockStart: space[8] }}>
            <Link href="/trust" style={{
              display: "inline-flex", alignItems: "center", gap: space[2],
              color: bioSignal.phosphorCyan,
              fontFamily: cssVar.fontMono, fontSize: font.size.sm,
              textTransform: "uppercase", letterSpacing: font.tracking.caps,
              fontWeight: font.weight.bold,
              textDecoration: "none",
            }}>
              {T.trustCta} <span aria-hidden>→</span>
            </Link>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section style={{ paddingBlock: space[20], paddingInline: space[5] }}>
        <Container size="lg">
          <div style={{
            fontSize: font.size.sm, color: bioSignal.phosphorCyan,
            textTransform: "uppercase", letterSpacing: font.tracking.caps,
            fontWeight: font.weight.bold, fontFamily: cssVar.fontMono,
            marginBlockEnd: space[6],
          }}>
            {T.faqEyebrow}
          </div>
          <div style={{ display: "grid", gap: space[2] }}>
            {T.faqs.map((f, i) => (
              <details key={i} style={{
                padding: `${space[4]}px ${space[5]}px`,
                borderRadius: radius.lg,
                background: "color-mix(in srgb, var(--bi-surface) 60%, transparent)",
                border: `1px solid ${cssVar.border}`,
              }}>
                <summary style={{
                  cursor: "pointer", listStyle: "none",
                  fontSize: font.size.lg, fontWeight: font.weight.semibold,
                  color: cssVar.text,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  gap: space[3],
                }}>
                  {f.q}
                  <span aria-hidden style={{ color: bioSignal.phosphorCyan, fontFamily: cssVar.fontMono }}>+</span>
                </summary>
                <p style={{
                  marginBlockStart: space[3], marginBlockEnd: 0,
                  color: cssVar.textDim, fontSize: font.size.md, lineHeight: 1.6,
                }}>
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      {/* Final CTA */}
      <section style={{
        paddingBlock: space[20], paddingInline: space[5],
        borderBlockStart: `1px solid ${cssVar.border}`,
        position: "relative", overflow: "hidden",
      }}>
        <div aria-hidden style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: `radial-gradient(60% 60% at 50% 100%, ${bioSignal.phosphorCyan}22, transparent 65%)`,
        }} />
        <Container size="md" style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <div style={{
            fontSize: font.size.sm, color: bioSignal.phosphorCyan,
            textTransform: "uppercase", letterSpacing: font.tracking.caps,
            fontWeight: font.weight.bold, fontFamily: cssVar.fontMono,
            marginBlockEnd: space[4],
          }}>
            {T.finalEyebrow}
          </div>
          <h2 style={{
            margin: 0,
            fontSize: "clamp(48px, 7vw, 88px)",
            lineHeight: 1.02, letterSpacing: "-0.03em",
            fontWeight: font.weight.black, color: cssVar.text,
          }}>
            {T.finalH}{" "}
            <span style={{
              fontStyle: "italic",
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontWeight: 400,
              background: `linear-gradient(120deg, ${bioSignal.phosphorCyan}, ${bioSignal.neuralViolet})`,
              WebkitBackgroundClip: "text", backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              {T.finalHEm}
            </span>
          </h2>
          <p style={{
            marginBlockStart: space[5], marginInline: "auto",
            maxInlineSize: 580,
            fontSize: font.size.xl, color: cssVar.textDim,
            lineHeight: 1.55,
          }}>
            {T.finalBody}
          </p>
          <div style={{
            marginBlockStart: space[8],
            display: "inline-flex", gap: space[3], flexWrap: "wrap",
            justifyContent: "center",
          }}>
            <Link href="/demo" style={{
              padding: `${space[3]}px ${space[6]}px`,
              borderRadius: radius.full,
              background: cssVar.accent,
              color: cssVar.accentInk,
              textDecoration: "none",
              fontWeight: font.weight.bold,
              fontSize: font.size.lg,
              boxShadow: `0 12px 40px -12px ${bioSignal.phosphorCyan}80`,
            }}>
              {T.finalCta1} →
            </Link>
            <Link href="/pricing" style={{
              padding: `${space[3]}px ${space[5]}px`,
              borderRadius: radius.full,
              background: "transparent",
              color: cssVar.text,
              textDecoration: "none",
              fontWeight: font.weight.semibold,
              fontSize: font.size.lg,
              border: `1px solid ${cssVar.border}`,
            }}>
              {T.finalCta2}
            </Link>
          </div>
        </Container>
      </section>
    </PublicShell>
  );
}
