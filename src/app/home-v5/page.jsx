import Link from "next/link";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font, bioSignal, radius } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";
import SensoryHero from "./SensoryHero";
import IgnitionReveal from "./IgnitionReveal";
import BioglyphLattice from "./BioglyphLattice";
import PulseDivider from "./PulseDivider";

export const metadata = {
  title: "BIO-IGNICIÓN",
  description: "Siente el motor. Un pulso háptico, tres segundos de binaural, una onda que respira contigo.",
  alternates: { canonical: "/home-v5" },
  robots: { index: false, follow: false },
};

const COPY = {
  es: {
    hero: {
      kicker: "NUEVO · MOTOR SENSORIAL",
      title1: "Siente el motor.",
      title2: "No lo expliques, tócalo.",
      sub: "Un pulso háptico, tres segundos de binaural y una onda que respira contigo. Toca el botón — funciona en tu navegador, sin instalar nada.",
      buttonIdle: "Activar pulso",
      buttonPulsing: "Sintiendo…",
      buttonAria: "Activar pulso sensorial de 3 segundos",
      hint: "3 segundos · audio + vibración",
      afterLine: "Ese es el motor. Ahora imagina una sesión completa.",
    },

    manifestoKicker: "MANIFIESTO",
    manifesto1: "La optimización no se grafica.",
    manifesto2: "Se siente.",
    manifestoBody: "Los datos existen para ajustar el pulso — no para decorar un dashboard. Si no podemos convertir un marcador en una acción sensorial, no lo mostramos.",

    bentoKicker: "POR DENTRO",
    bentoH: "Tres señales. Un lenguaje. Tu sistema nervioso.",
    bento: {
      neural: { t: "El motor te escucha", d: "Tu HRV, tu respiración, tu sueño. Tres pulsos entran. Uno sale sintonizado a ti — no a la mediana." },
      privacy: { t: "Tus datos no respiran fuera", d: "Cifrado en tu dispositivo. Cero telemetría hasta que tú digas sí. Exporta o borra en menos de veinticuatro horas." },
      protocols: { t: "Cuatro pulsos. Un vocabulario.", d: "Calma. Enfoque. Energía. Reset. Audio binaural, voz guiada y haptics laten en la misma cadencia." },
      evidence: { t: "Cada pulso cita su estudio", d: "Evidencia alta, moderada o limitada — lo decimos. Si la literatura titubea, también titubeamos." },
    },

    scienceEyebrow: "CIENCIA",
    scienceQuote: "HRV, respiración resonante y binaurals no son placebo — son cuarenta años de literatura revisada. Lo que cambia aquí es que los convertimos en un pulso que puedes sentir, no en un gráfico que tienes que interpretar.",
    scienceAttr: "Principio de diseño · BIO-IGNICIÓN",

    ladderEyebrow: "PLANES",
    ladderH: "Enciéndelo donde estés.",
    ladderSub: "Pilotos de 25 usuarios sin compromiso anual.",
    plans: [
      { name: "Starter", price: "$19", unit: "/usuario/mes", features: ["Hasta 25 usuarios", "Protocolos base", "Dashboard individual"], cta: "Encender", href: "/signup" },
      { name: "Growth", price: "$39", unit: "/usuario/mes", features: ["Hasta 500 usuarios", "Panel de equipo", "Integraciones wearable", "SSO (Google)"], cta: "Encender", href: "/signup", highlight: true },
      { name: "Enterprise", price: "Custom", unit: "contacto", features: ["Usuarios ilimitados", "SSO · SCIM · Okta · Azure", "DPA personalizado", "Residencia a elección"], cta: "Hablar", href: "/demo" },
    ],

    finalKicker: "SIGUIENTE",
    finalH1: "30 minutos.",
    finalH2: "Una sesión en vivo.",
    finalBody: "Sin slides. Corremos un protocolo contigo, leemos tu HRV y respondemos todo sobre seguridad.",
    finalCta: "Agendar demo",
  },
  en: {
    hero: {
      kicker: "NEW · SENSORY ENGINE",
      title1: "Feel the engine.",
      title2: "Don't explain it. Touch it.",
      sub: "One haptic pulse, three seconds of binaural and a wave that breathes with you. Tap the button — runs in your browser, nothing to install.",
      buttonIdle: "Activate pulse",
      buttonPulsing: "Feeling…",
      buttonAria: "Activate 3-second sensory pulse",
      hint: "3 seconds · audio + haptics",
      afterLine: "That's the engine. Now imagine a full session.",
    },

    manifestoKicker: "MANIFESTO",
    manifesto1: "Optimization isn't plotted.",
    manifesto2: "It's felt.",
    manifestoBody: "Data exists to tune the pulse — not to decorate a dashboard. If we can't turn a metric into a sensory action, we don't show it.",

    bentoKicker: "INSIDE",
    bentoH: "Three signals. One language. Your nervous system.",
    bento: {
      neural: { t: "The engine listens to you", d: "Your HRV, your breath, your sleep. Three pulses in. One comes out tuned to you — not to the median." },
      privacy: { t: "Your data doesn't breathe outside", d: "Encrypted on your device. Zero telemetry until you say yes. Export or erase in under twenty-four hours." },
      protocols: { t: "Four pulses. One vocabulary.", d: "Calm. Focus. Energy. Reset. Binaural audio, guided voice and haptics beat in the same cadence." },
      evidence: { t: "Every pulse cites its study", d: "Evidence high, moderate or limited — we say it. If the literature hesitates, we hesitate too." },
    },

    scienceEyebrow: "SCIENCE",
    scienceQuote: "HRV, resonance breathing and binaurals aren't placebo — they're forty years of reviewed literature. What changes here is that we turn them into a pulse you can feel, not a chart you have to interpret.",
    scienceAttr: "Design principle · BIO-IGNICIÓN",

    ladderEyebrow: "PLANS",
    ladderH: "Ignite it where you are.",
    ladderSub: "25-user pilots with no annual commitment.",
    plans: [
      { name: "Starter", price: "$19", unit: "/user/month", features: ["Up to 25 users", "Core protocols", "Individual dashboard"], cta: "Ignite", href: "/signup" },
      { name: "Growth", price: "$39", unit: "/user/month", features: ["Up to 500 users", "Team panel", "Wearable integrations", "SSO (Google)"], cta: "Ignite", href: "/signup", highlight: true },
      { name: "Enterprise", price: "Custom", unit: "contact", features: ["Unlimited users", "SSO · SCIM · Okta · Azure", "Custom DPA", "Residency of choice"], cta: "Talk", href: "/demo" },
    ],

    finalKicker: "NEXT",
    finalH1: "30 minutes.",
    finalH2: "A live session.",
    finalBody: "No slides. We run a protocol with you, read your HRV and answer everything about security.",
    finalCta: "Book a demo",
  },
};

export default async function HomeV5Page() {
  const locale = await getServerLocale();
  const T = COPY[locale === "en" ? "en" : "es"];

  return (
    <PublicShell activePath="/home-v5">
      {/* Interactive sensory hero */}
      <SensoryHero T={T.hero} />

      <PulseDivider intensity="dim" />

      {/* Manifesto pillar */}
      <section style={{
        paddingBlock: "clamp(80px, 12vw, 160px)",
        paddingInline: space[5],
        textAlign: "center",
      }}>
        <Container size="md">
          <IgnitionReveal sparkOrigin="50% 40%">
            <div style={{
              fontFamily: cssVar.fontMono, fontSize: font.size.xs,
              color: cssVar.textMuted,
              textTransform: "uppercase", letterSpacing: font.tracking.caps,
              fontWeight: font.weight.bold,
              marginBlockEnd: space[5],
            }}>
              {T.manifestoKicker}
            </div>
            <h2 style={{
              margin: 0,
              fontSize: "clamp(40px, 6vw, 72px)",
              lineHeight: 1.05,
              letterSpacing: "-0.035em",
              fontWeight: font.weight.black,
              color: cssVar.text,
            }}>
              {T.manifesto1}
              <br />
              <span style={{ color: cssVar.textDim }}>{T.manifesto2}</span>
            </h2>
            <p style={{
              marginBlockStart: space[6],
              marginInline: "auto",
              maxInlineSize: 620,
              fontSize: font.size.lg,
              lineHeight: 1.55,
              color: cssVar.textDim,
            }}>
              {T.manifestoBody}
            </p>
          </IgnitionReveal>
        </Container>
      </section>

      <PulseDivider />

      {/* Bento */}
      <section style={{ paddingBlock: space[12], paddingInline: space[5] }}>
        <Container size="xl">
          <IgnitionReveal sparkOrigin="50% 50%">
            <div style={{ marginBlockEnd: space[8], textAlign: "center" }}>
              <div style={{
                fontFamily: cssVar.fontMono, fontSize: font.size.xs,
                color: cssVar.textMuted,
                textTransform: "uppercase", letterSpacing: font.tracking.caps,
                fontWeight: font.weight.bold,
                marginBlockEnd: space[3],
              }}>
                {T.bentoKicker}
              </div>
              <h3 style={{
                margin: 0,
                fontSize: "clamp(28px, 4vw, 44px)",
                lineHeight: 1.15,
                letterSpacing: "-0.025em",
                fontWeight: font.weight.black,
                color: cssVar.text,
                maxInlineSize: 720, marginInline: "auto",
              }}>
                {T.bentoH}
              </h3>
            </div>
          </IgnitionReveal>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(12, 1fr)",
            gap: space[4],
          }}>
            <BentoCard col={7} row={2} variant="hero" title={T.bento.neural.t} body={T.bento.neural.d} lattice="neural" delay={0} />
            <BentoCard col={5} title={T.bento.privacy.t} body={T.bento.privacy.d} lattice="privacy" delay={0.12} />
            <BentoCard col={5} title={T.bento.evidence.t} body={T.bento.evidence.d} lattice="evidence" delay={0.24} />
            <BentoCard col={12} title={T.bento.protocols.t} body={T.bento.protocols.d} lattice="protocols" delay={0.36} wide />
          </div>
        </Container>
      </section>

      {/* Editorial science pull-quote (v2 style) */}
      <section style={{
        position: "relative",
        paddingBlock: "clamp(80px, 12vw, 140px)",
        paddingInline: space[5],
        background: `linear-gradient(180deg, transparent, ${bioSignal.phosphorCyan}08 50%, transparent)`,
        overflow: "hidden",
      }}>
        <div aria-hidden style={{
          position: "absolute", inset: 0, zIndex: 0, opacity: 0.35, pointerEvents: "none",
        }}>
          <BioglyphLattice variant="ambient" />
        </div>
        <Container size="md">
          <IgnitionReveal sparkOrigin="50% 50%">
            <div style={{
              fontFamily: cssVar.fontMono, fontSize: font.size.xs,
              color: bioSignal.phosphorCyan,
              textTransform: "uppercase", letterSpacing: font.tracking.caps,
              fontWeight: font.weight.bold,
              marginBlockEnd: space[5],
              textAlign: "center",
            }}>
              {T.scienceEyebrow}
            </div>
            <blockquote style={{
              margin: 0,
              fontFamily: "var(--font-editorial), 'Instrument Serif', Georgia, serif",
              fontStyle: "italic",
              fontSize: "clamp(28px, 3.6vw, 48px)",
              lineHeight: 1.25,
              color: cssVar.text,
              textAlign: "center",
              letterSpacing: "-0.02em",
              fontWeight: 400,
            }}>
              &ldquo;{T.scienceQuote}&rdquo;
            </blockquote>
            <div style={{
              marginBlockStart: space[5],
              textAlign: "center",
              fontFamily: cssVar.fontMono, fontSize: font.size.xs,
              color: cssVar.textDim,
              textTransform: "uppercase", letterSpacing: font.tracking.caps,
            }}>
              — {T.scienceAttr}
            </div>
          </IgnitionReveal>
        </Container>
      </section>

      <PulseDivider />

      {/* Pricing ladder */}
      <section style={{ paddingBlock: space[14], paddingInline: space[5] }}>
        <Container size="xl">
          <IgnitionReveal sparkOrigin="50% 50%">
            <div style={{ marginBlockEnd: space[8], textAlign: "center" }}>
              <div style={{
                fontFamily: cssVar.fontMono, fontSize: font.size.xs,
                color: cssVar.textMuted,
                textTransform: "uppercase", letterSpacing: font.tracking.caps,
                fontWeight: font.weight.bold,
                marginBlockEnd: space[3],
              }}>
                {T.ladderEyebrow}
              </div>
              <h3 style={{
                margin: 0,
                fontSize: "clamp(32px, 4.5vw, 52px)",
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                fontWeight: font.weight.black,
                color: cssVar.text,
              }}>
                {T.ladderH}
              </h3>
              <p style={{
                marginBlockStart: space[3],
                color: cssVar.textDim,
                fontSize: font.size.md,
              }}>
                {T.ladderSub}
              </p>
            </div>
          </IgnitionReveal>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: space[4],
            alignItems: "stretch",
          }}>
            {T.plans.map((p, i) => (
              <IgnitionReveal key={p.name} delay={i * 0.12} spark={false}>
                <PlanCard plan={p} />
              </IgnitionReveal>
            ))}
          </div>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      {/* Final CTA */}
      <section style={{
        paddingBlock: "clamp(80px, 12vw, 140px)",
        paddingInline: space[5],
        textAlign: "center",
      }}>
        <Container size="md">
          <IgnitionReveal sparkOrigin="50% 40%">
            <div style={{
              fontFamily: cssVar.fontMono, fontSize: font.size.xs,
              color: cssVar.textMuted,
              textTransform: "uppercase", letterSpacing: font.tracking.caps,
              fontWeight: font.weight.bold,
              marginBlockEnd: space[4],
            }}>
              {T.finalKicker}
            </div>
            <h3 style={{
              margin: 0,
              fontSize: "clamp(40px, 6vw, 72px)",
              lineHeight: 1.05,
              letterSpacing: "-0.035em",
              fontWeight: font.weight.black,
              color: cssVar.text,
            }}>
              {T.finalH1}
              <br />
              <span style={{
                background: `linear-gradient(120deg, ${bioSignal.phosphorCyan}, ${bioSignal.neuralViolet})`,
                WebkitBackgroundClip: "text", backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>{T.finalH2}</span>
            </h3>
            <p style={{
              marginBlockStart: space[5],
              marginInline: "auto",
              maxInlineSize: 560,
              fontSize: font.size.lg,
              lineHeight: 1.5,
              color: cssVar.textDim,
            }}>
              {T.finalBody}
            </p>
            <div style={{ marginBlockStart: space[7] }}>
              <Link href="/demo" style={{
                display: "inline-block",
                padding: `${space[3]}px ${space[7]}px`,
                borderRadius: radius.full,
                background: bioSignal.phosphorCyan,
                color: "#0a0d14",
                fontFamily: cssVar.fontMono,
                fontSize: font.size.sm,
                fontWeight: font.weight.black,
                textTransform: "uppercase",
                letterSpacing: font.tracking.caps,
                textDecoration: "none",
                boxShadow: `0 20px 50px -18px ${bioSignal.phosphorCyan}99`,
              }}>
                {T.finalCta}
              </Link>
            </div>
          </IgnitionReveal>
        </Container>
      </section>
    </PublicShell>
  );
}

function BentoCard({ col = 4, row = 1, variant, title, body, lattice, delay = 0, wide }) {
  const isHero = variant === "hero";
  return (
    <div style={{
      gridColumn: `span ${col}`,
      gridRow: `span ${row}`,
      position: "relative",
      padding: space[6],
      borderRadius: radius.lg,
      background: isHero
        ? `linear-gradient(150deg, ${bioSignal.deepField}, #0a0d14)`
        : cssVar.surface,
      border: `1px solid ${isHero ? `color-mix(in srgb, ${bioSignal.phosphorCyan} 22%, transparent)` : cssVar.border}`,
      overflow: "hidden",
      minHeight: isHero ? 380 : wide ? 260 : 220,
      display: "flex", flexDirection: "column",
      justifyContent: "space-between",
      gap: space[5],
    }}>
      <IgnitionReveal delay={delay} sparkOrigin="50% 40%">
        <div style={{
          height: isHero ? 220 : wide ? 160 : 120,
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: 0.95,
        }}>
          <BioglyphLattice variant={lattice} animated />
        </div>
        <div>
          <h4 style={{
            margin: 0,
            fontSize: isHero ? font.size["2xl"] : font.size.xl,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            fontWeight: font.weight.black,
            color: cssVar.text,
          }}>
            {title}
          </h4>
          <p style={{
            marginBlockStart: space[3],
            color: cssVar.textDim,
            fontSize: font.size.sm,
            lineHeight: 1.55,
          }}>
            {body}
          </p>
        </div>
      </IgnitionReveal>
    </div>
  );
}

function PlanCard({ plan }) {
  const h = plan.highlight;
  return (
    <div style={{
      position: "relative",
      padding: space[6],
      borderRadius: radius.lg,
      background: h
        ? `linear-gradient(160deg, ${bioSignal.deepField}, #0a0d14)`
        : cssVar.surface,
      border: `1px solid ${h ? bioSignal.phosphorCyan : cssVar.border}`,
      boxShadow: h ? `0 30px 80px -40px ${bioSignal.phosphorCyan}aa` : "none",
      display: "flex", flexDirection: "column",
      gap: space[5],
    }}>
      {h && (
        <div style={{
          position: "absolute", insetBlockStart: -12, insetInlineStart: space[5],
          padding: `4px 10px`,
          borderRadius: radius.full,
          background: bioSignal.phosphorCyan,
          color: "#0a0d14",
          fontFamily: cssVar.fontMono, fontSize: 10,
          fontWeight: font.weight.black,
          textTransform: "uppercase", letterSpacing: font.tracking.caps,
        }}>
          Popular
        </div>
      )}
      <div>
        <div style={{
          fontFamily: cssVar.fontMono, fontSize: font.size.xs,
          color: cssVar.textMuted,
          textTransform: "uppercase", letterSpacing: font.tracking.caps,
          fontWeight: font.weight.bold,
        }}>
          {plan.name}
        </div>
        <div style={{
          marginBlockStart: space[2],
          display: "flex", alignItems: "baseline", gap: space[2],
        }}>
          <span style={{
            fontSize: font.size["3xl"],
            fontWeight: font.weight.black,
            color: cssVar.text,
            letterSpacing: "-0.03em",
          }}>
            {plan.price}
          </span>
          <span style={{
            fontFamily: cssVar.fontMono,
            color: cssVar.textDim,
            fontSize: font.size.xs,
          }}>
            {plan.unit}
          </span>
        </div>
      </div>
      <ul style={{
        listStyle: "none", padding: 0, margin: 0,
        display: "flex", flexDirection: "column", gap: space[2],
        flex: 1,
      }}>
        {plan.features.map((f, i) => (
          <li key={i} style={{
            display: "flex", alignItems: "flex-start", gap: space[2],
            color: cssVar.textDim,
            fontSize: font.size.sm,
            lineHeight: 1.5,
          }}>
            <span aria-hidden style={{
              color: bioSignal.phosphorCyan,
              fontWeight: font.weight.black,
              marginBlockStart: 1,
            }}>✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link href={plan.href} style={{
        display: "block",
        textAlign: "center",
        padding: `${space[3]}px ${space[5]}px`,
        borderRadius: radius.full,
        background: h ? bioSignal.phosphorCyan : "transparent",
        color: h ? "#0a0d14" : cssVar.text,
        border: h ? "none" : `1px solid ${cssVar.border}`,
        fontFamily: cssVar.fontMono,
        fontSize: font.size.sm,
        fontWeight: font.weight.black,
        textTransform: "uppercase",
        letterSpacing: font.tracking.caps,
        textDecoration: "none",
      }}>
        {plan.cta}
      </Link>
    </div>
  );
}
