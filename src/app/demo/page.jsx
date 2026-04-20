import DemoForm from "./DemoForm";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { cssVar, space, font, bioSignal } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";
import IgnitionReveal from "@/components/brand/IgnitionReveal";
import BioglyphLattice from "@/components/brand/BioglyphLattice";
import PulseDivider from "@/components/brand/PulseDivider";

export const metadata = {
  title: "Demo",
  description: "30 minutos con un especialista. Protocolo en vivo + dashboard de equipo con datos simulados.",
  alternates: { canonical: "/demo" },
  openGraph: {
    title: "BIO-IGNICIÓN · Demo 1:1",
    description: "Ve un protocolo neural en vivo. Sin slides.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
};

const COPY = {
  es: {
    eyebrow: "DEMO 1:1",
    h1: "Sentilo primero. Deciden después.",
    editorial: "30 minutos, en vivo, sin slides — respiras, escuchas, ves el panel.",
    p: "Corremos un protocolo neural contigo — respiración coherente + audio binaural + medición HRV. Te mostramos el panel de equipo con datos simulados reales y respondemos preguntas de seguridad y compliance sobre la mesa.",
    bullets: [
      "Sesión neural en vivo (breath + audio + binaural).",
      "Panel de equipo con k-anonymity ≥5.",
      <>Q&amp;A de SSO, SCIM, DPA, residencia de datos.</>,
      "ROI estimado según tu tamaño de equipo.",
    ],
    stepsTitle: "Qué sigue",
    steps: [
      { t: "Hoy", d: "Envías el formulario." },
      { t: "< 24 h hábiles", d: "Te escribe un humano (no un bot) con 2–3 horarios propuestos." },
      { t: "Día de la demo", d: "30 min por video. Sin slides — sesión en vivo + panel + Q&A." },
      { t: "Después", d: "Sin spam. Si sigue haciendo sentido, te mandamos pilot agreement. Si no, te avisamos por qué." },
    ],
    refs: "Referencias",
    refsBody: (
      <>
        Revisa el <a href="/trust">Trust Center</a>, la <a href="/trust/dpa">DPA</a> y nuestros{" "}
        <a href="/trust/subprocessors">subprocesadores</a> antes de hablar.
      </>
    ),
    formTitle: "Reserva un horario",
  },
  en: {
    eyebrow: "1:1 DEMO",
    h1: "Feel it first. Decide after.",
    editorial: "30 minutes, live, no slides — you breathe, you listen, you see the panel.",
    p: "We run a live neural protocol with you — coherent breathing + binaural audio + HRV measurement. We show you the team panel with real simulated data and answer security & compliance questions on the table.",
    bullets: [
      "Live neural session (breath + audio + binaural).",
      "Team panel with k-anonymity ≥5.",
      <>Q&amp;A on SSO, SCIM, DPA, data residency.</>,
      "Estimated ROI based on your team size.",
    ],
    stepsTitle: "What happens next",
    steps: [
      { t: "Today", d: "You send the form." },
      { t: "< 24 business hours", d: "A human (not a bot) replies with 2–3 proposed time slots." },
      { t: "Demo day", d: "30 min over video. No slides — live session + panel + Q&A." },
      { t: "After", d: "No spam. If it still makes sense, we send the pilot agreement. If not, we tell you why." },
    ],
    refs: "References",
    refsBody: (
      <>
        Check the <a href="/trust">Trust Center</a>, the <a href="/trust/dpa">DPA</a> and our{" "}
        <a href="/trust/subprocessors">subprocessors</a> before we talk.
      </>
    ),
    formTitle: "Book a slot",
  },
};

export default async function DemoPage() {
  const locale = await getServerLocale();
  const c = COPY[locale === "en" ? "en" : "es"];
  return (
    <PublicShell activePath="/demo">
      <Container size="lg" className="bi-prose">
        <div className="bi-split" style={{ position: "relative" }}>
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: `-${space[4]}px -${space[6]}px auto -${space[6]}px`,
              height: 420,
              opacity: 0.22,
              pointerEvents: "none",
              maskImage: "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
              zIndex: 0,
            }}
          >
            <BioglyphLattice variant="ambient" />
          </div>

          <section style={{ position: "relative", zIndex: 1 }}>
            <IgnitionReveal sparkOrigin="20% 25%">
              <div
                style={{
                  fontSize: font.size.xs,
                  fontFamily: cssVar.fontMono,
                  color: bioSignal.phosphorCyan,
                  textTransform: "uppercase",
                  letterSpacing: "0.28em",
                  fontWeight: font.weight.bold,
                }}
              >
                {c.eyebrow}
              </div>
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
                  maxWidth: "40ch",
                }}
              >
                {c.editorial}
              </p>
              <p style={{ marginBlockStart: 0 }}>{c.p}</p>
            </IgnitionReveal>

            <ul style={{ paddingInlineStart: 20, lineHeight: 1.8, fontSize: 14, marginTop: space[4] }}>
              {c.bullets.map((b, i) => <li key={i}>{b}</li>)}
            </ul>

            <div style={{ marginTop: space[5] }}>
              <PulseDivider intensity="dim" />
            </div>

            <div style={{ marginTop: space[5] }}>
              <h2 style={{ fontSize: font.size.md, fontWeight: font.weight.bold, letterSpacing: font.tracking.tight, marginBlock: 0, marginBlockEnd: space[3] }}>
                {c.stepsTitle}
              </h2>
              <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: space[2] }}>
                {c.steps.map((s, i) => (
                  <li key={i} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: space[3], alignItems: "baseline" }}>
                    <span
                      style={{
                        fontSize: font.size.xs,
                        fontFamily: cssVar.fontMono,
                        color: cssVar.accent,
                        fontWeight: font.weight.bold,
                        textTransform: "uppercase",
                        letterSpacing: font.tracking.wide,
                        minWidth: 120,
                      }}
                    >
                      {s.t}
                    </span>
                    <span style={{ color: cssVar.text, fontSize: font.size.sm, lineHeight: 1.5 }}>{s.d}</span>
                  </li>
                ))}
              </ol>
            </div>

            <Card as="aside" style={{ marginTop: space[5] }}>
              <div style={{ fontSize: font.size.sm, color: cssVar.accent, fontWeight: font.weight.bold, textTransform: "uppercase", letterSpacing: "1px" }}>
                {c.refs}
              </div>
              <p style={{ margin: `${space[1.5]}px 0 0`, fontSize: 13 }}>{c.refsBody}</p>
            </Card>
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
            <h2 id="demo-form-title" style={{ margin: `0 0 ${space[4]}px`, letterSpacing: "-0.02em" }}>{c.formTitle}</h2>
            <DemoForm source="demo" locale={locale} />
          </Card>
        </div>
      </Container>
    </PublicShell>
  );
}
