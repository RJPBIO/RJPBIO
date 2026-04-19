import Link from "next/link";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { cssVar, space, font } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";

export const metadata = {
  title: "Aprende · Fundamentos neurales",
  description:
    "Artículos evergreen sobre HRV, cronotipo y respiración resonante. Basados en literatura revisada por pares — sin hype, con citas.",
  alternates: { canonical: "/learn" },
  openGraph: {
    title: "BIO-IGNICIÓN · Aprende",
    description: "HRV, cronotipo, respiración resonante — fundamentos con evidencia.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
};

const ARTICLES = [
  {
    slug: "hrv-basics",
    title: { es: "HRV 101 — qué es y por qué importa", en: "HRV 101 — what it is and why it matters" },
    blurb: {
      es: "RMSSD, ventana nocturna, lecturas de 60 s. Cómo leer tu variabilidad cardíaca sin pseudociencia.",
      en: "RMSSD, nocturnal window, 60-second readings. How to read your heart-rate variability without pseudoscience.",
    },
    minutes: 6,
  },
  {
    slug: "cronotipo",
    title: { es: "Cronotipo — tu reloj interno en la práctica", en: "Chronotype — your inner clock in practice" },
    blurb: {
      es: "MEQ, genotipo PER3, ventanas de enfoque. Qué puedes y qué NO puedes cambiar de tu curva diurna.",
      en: "MEQ, PER3 genotype, focus windows. What you can and cannot change about your diurnal curve.",
    },
    minutes: 5,
  },
  {
    slug: "respiracion-resonante",
    title: { es: "Respiración resonante — por qué ~0.1 Hz", en: "Resonant breathing — why ~0.1 Hz" },
    blurb: {
      es: "El punto donde HRV, presión arterial y baroreflejo entran en fase. La fisiología detrás del número.",
      en: "Where HRV, blood pressure and baroreflex come into phase. The physiology behind the number.",
    },
    minutes: 7,
  },
];

export default async function LearnHubPage() {
  const locale = await getServerLocale();
  const en = locale === "en";

  return (
    <PublicShell activePath="/learn">
      <Container size="lg" className="bi-prose">
        <header style={{ marginBottom: space[6] }}>
          <div style={{ fontSize: font.size.sm, color: cssVar.accent, textTransform: "uppercase", letterSpacing: "2px", fontWeight: font.weight.bold }}>
            {en ? "Learn" : "Aprende"}
          </div>
          <h1 style={{ margin: `${space[2]}px 0` }}>
            {en ? "Fundamentals, not folk wisdom" : "Fundamentos, no folklore"}
          </h1>
          <p style={{ maxWidth: 680 }}>
            {en
              ? "Short, dense explainers for the science behind each protocol. Every claim cites its source. When the literature moves, we update the article — not just the date."
              : "Explicadores cortos y densos sobre la ciencia detrás de cada protocolo. Cada afirmación cita su fuente. Cuando la literatura cambia, actualizamos el artículo — no sólo la fecha."}
          </p>
        </header>

        <div style={{ display: "grid", gap: space[4], gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {ARTICLES.map((a) => (
            <Link
              key={a.slug}
              href={`/learn/${a.slug}`}
              className="bi-card-link"
              aria-label={`${en ? a.title.en : a.title.es} — ${a.minutes} min`}
            >
              <Card as="article" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: font.size.sm, color: cssVar.textMuted, marginBottom: space[1], textTransform: "uppercase", letterSpacing: 1.5, fontWeight: font.weight.semibold }}>
                  {a.minutes} min · {en ? "read" : "lectura"}
                </div>
                <h2 style={{ margin: `0 0 ${space[2]}px`, fontSize: font.size.xl, color: cssVar.text, lineHeight: 1.25 }}>
                  {en ? a.title.en : a.title.es}
                </h2>
                <p style={{ color: cssVar.textDim, margin: `0 0 ${space[3]}px`, flex: 1 }}>
                  {en ? a.blurb.en : a.blurb.es}
                </p>
                <span
                  aria-hidden="true"
                  style={{
                    color: cssVar.accent,
                    fontSize: font.size.md,
                    fontWeight: font.weight.bold,
                    marginTop: "auto",
                  }}
                >
                  {en ? "Read →" : "Leer →"}
                </span>
              </Card>
            </Link>
          ))}
        </div>

        <footer style={{ marginTop: space[8], color: cssVar.textMuted, fontSize: font.size.md }}>
          {en ? "See the full " : "Consulta la "}
          <Link href="/evidencia" style={{ color: cssVar.accent }}>
            {en ? "evidence library" : "biblioteca de evidencia"}
          </Link>
          {en ? " for raw studies behind each protocol." : " para los estudios crudos detrás de cada protocolo."}
        </footer>
      </Container>
    </PublicShell>
  );
}
