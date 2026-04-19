import Link from "next/link";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { BioGlyph } from "@/components/BioIgnicionMark";
import { cssVar, radius, space, font } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "404",
  description: "La ruta no existe o fue movida.",
  robots: { index: false, follow: true },
};

const GROUPS = {
  es: [
    {
      title: "Producto",
      links: [
        { href: "/", label: "App neural" },
        { href: "/pricing", label: "Planes y precios" },
        { href: "/demo", label: "Agendar demo" },
        { href: "/roi-calculator", label: "Calculadora ROI" },
      ],
    },
    {
      title: "Recursos",
      links: [
        { href: "/learn", label: "Aprende" },
        { href: "/evidencia", label: "Biblioteca de evidencia" },
        { href: "/docs", label: "API & SDK" },
        { href: "/changelog", label: "Changelog" },
      ],
    },
    {
      title: "Confianza",
      links: [
        { href: "/trust", label: "Trust Center" },
        { href: "/status", label: "Status en vivo" },
        { href: "/privacy", label: "Privacidad" },
        { href: "/terms", label: "Términos" },
      ],
    },
  ],
  en: [
    {
      title: "Product",
      links: [
        { href: "/", label: "Neural app" },
        { href: "/pricing", label: "Plans & pricing" },
        { href: "/demo", label: "Book a demo" },
        { href: "/roi-calculator", label: "ROI calculator" },
      ],
    },
    {
      title: "Resources",
      links: [
        { href: "/learn", label: "Learn" },
        { href: "/evidencia", label: "Evidence library" },
        { href: "/docs", label: "API & SDK" },
        { href: "/changelog", label: "Changelog" },
      ],
    },
    {
      title: "Trust",
      links: [
        { href: "/trust", label: "Trust Center" },
        { href: "/status", label: "Live status" },
        { href: "/privacy", label: "Privacy" },
        { href: "/terms", label: "Terms" },
      ],
    },
  ],
};

export default async function NotFound() {
  const locale = await getServerLocale();
  const en = locale === "en";
  const groups = GROUPS[en ? "en" : "es"];

  return (
    <PublicShell activePath="">
      <Container size="lg" className="bi-prose">
        <section style={{ textAlign: "center", marginBlock: space[8] }}>
          <div style={{ display: "inline-flex", marginBlockEnd: space[4] }}>
            <BioGlyph size={56} />
          </div>
          <div style={{
            fontSize: font.size.sm,
            color: cssVar.accent,
            textTransform: "uppercase",
            letterSpacing: "2px",
            fontWeight: font.weight.bold,
            fontFamily: cssVar.fontMono,
          }}>
            404
          </div>
          <h1 style={{
            margin: `${space[2]}px 0`,
            fontSize: font.size["3xl"],
            fontWeight: font.weight.black,
            letterSpacing: font.tracking.tight,
          }}>
            {en ? "This route does not exist" : "Esta ruta no existe"}
          </h1>
          <p style={{ color: cssVar.textDim, fontSize: font.size.md, maxWidth: 520, margin: "0 auto" }}>
            {en
              ? "Either it never existed, or we moved it. Common routes are below."
              : "O nunca existió, o la movimos. Aquí están las rutas más comunes."}
          </p>
        </section>

        <div style={{
          display: "grid",
          gap: space[5],
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}>
          {groups.map((g) => (
            <nav key={g.title} aria-label={g.title}>
              <h2 style={{
                fontSize: font.size.xs,
                color: cssVar.textDim,
                textTransform: "uppercase",
                letterSpacing: font.tracking.wide,
                fontWeight: font.weight.semibold,
                marginBlock: 0,
                paddingBlockEnd: space[2],
                borderBlockEnd: `1px solid ${cssVar.border}`,
              }}>
                {g.title}
              </h2>
              <ul style={{ listStyle: "none", padding: 0, marginBlockStart: space[3], display: "flex", flexDirection: "column", gap: space[2] }}>
                {g.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      style={{
                        color: cssVar.text,
                        fontSize: font.size.md,
                        fontWeight: font.weight.semibold,
                        textDecoration: "none",
                      }}
                    >
                      {l.label}
                      <span aria-hidden="true" style={{ color: cssVar.accent, marginInlineStart: space[1] }}>→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p style={{
          marginBlockStart: space[8],
          textAlign: "center",
          color: cssVar.textMuted,
          fontSize: font.size.sm,
        }}>
          {en ? "Found a broken link? " : "¿Viste un enlace roto? "}
          <a href="mailto:soporte@bio-ignicion.app" style={{ color: cssVar.accent, fontWeight: font.weight.semibold }}>
            soporte@bio-ignicion.app
          </a>
        </p>
      </Container>
    </PublicShell>
  );
}
