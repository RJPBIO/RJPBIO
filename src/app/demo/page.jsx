import DemoForm from "./DemoForm";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { cssVar, space, font } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";

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
    eyebrow: "Demo 1:1",
    h1: "30 minutos para ver si BIO-IGNICIÓN le sirve a tu equipo",
    p: "No es una presentación de slides. Corremos un protocolo neural en vivo contigo, te mostramos el panel de equipo con datos simulados y respondemos preguntas de seguridad y compliance.",
    bullets: [
      "Sesión neural en vivo (breath + audio + binaural).",
      "Panel de equipo con k-anonymity ≥5.",
      <>Q&amp;A de SSO, SCIM, DPA, residencia de datos.</>,
      "ROI estimado según tu tamaño de equipo.",
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
    eyebrow: "1:1 demo",
    h1: "30 minutes to see if BIO-IGNITION fits your team",
    p: "It's not a slide deck. We run a live neural protocol with you, show the team panel with simulated data, and answer security & compliance questions.",
    bullets: [
      "Live neural session (breath + audio + binaural).",
      "Team panel with k-anonymity ≥5.",
      <>Q&amp;A on SSO, SCIM, DPA, data residency.</>,
      "Estimated ROI based on your team size.",
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
        <div className="bi-split">
          <section>
            <div style={{ fontSize: font.size.sm, color: cssVar.accent, textTransform: "uppercase", letterSpacing: "2px", fontWeight: font.weight.bold }}>
              {c.eyebrow}
            </div>
            <h1 style={{ margin: `${space[2]}px 0 ${space[3]}px` }}>{c.h1}</h1>
            <p>{c.p}</p>
            <ul style={{ paddingInlineStart: 20, lineHeight: 1.8, fontSize: 14 }}>
              {c.bullets.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
            <Card as="aside" style={{ marginTop: space[5] }}>
              <div style={{ fontSize: font.size.sm, color: cssVar.accent, fontWeight: font.weight.bold, textTransform: "uppercase", letterSpacing: "1px" }}>
                {c.refs}
              </div>
              <p style={{ margin: `${space[1.5]}px 0 0`, fontSize: 13 }}>{c.refsBody}</p>
            </Card>
          </section>

          <Card as="section" padding={7} aria-labelledby="demo-form-title">
            <h2 id="demo-form-title" style={{ margin: `0 0 ${space[4]}px` }}>{c.formTitle}</h2>
            <DemoForm source="demo" locale={locale} />
          </Card>
        </div>
      </Container>
    </PublicShell>
  );
}
