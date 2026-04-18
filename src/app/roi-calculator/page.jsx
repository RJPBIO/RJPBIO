import RoiCalc from "./RoiCalc";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font } from "@/components/ui/tokens";

export const metadata = {
  title: "Calculadora ROI",
  description: "Estima horas recuperadas y valor anual con supuestos conservadores. Sin email wall.",
  openGraph: {
    title: "BIO-IGNICIÓN · Calculadora ROI",
    description: "Corre el cálculo en tu navegador. No guardamos tus inputs.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
};

export default function RoiPage() {
  return (
    <PublicShell activePath="/roi-calculator">
      <Container size="lg" className="bi-prose">
        <header style={{ marginBottom: space[6] }}>
          <div style={{ fontSize: font.size.sm, color: cssVar.accent, textTransform: "uppercase", letterSpacing: "2px", fontWeight: font.weight.bold }}>
            Calculadora
          </div>
          <h1 style={{ margin: `${space[2]}px 0` }}>ROI de BIO-IGNICIÓN</h1>
          <p style={{ maxWidth: 680 }}>
            Supuestos conservadores, datos tuyos, cálculo transparente. No guardamos tus inputs —
            todo corre en el navegador. El modelo es el mismo que usa el panel de equipo
            (<a href="/docs#roi-model">ver documentación</a>).
          </p>
        </header>

        <RoiCalc />

        <section style={{ marginTop: space[10], padding: `${space[4]}px 0`, borderTop: `1px solid ${cssVar.border}`, fontSize: 12, color: cssVar.textMuted, lineHeight: 1.7 }}>
          <b style={{ color: cssVar.textDim }}>Cómo leer estos números:</b>{" "}
          Las "horas recuperadas" no son tiempo extra de trabajo — son horas con mejor foco,
          estado y toma de decisiones, expresadas en equivalente monetario. El múltiplo de ROI
          es orientativo: compara valor bruto contra licencia, ignora costos de onboarding y
          variabilidad individual. Para un análisis empresarial completo,{" "}
          <a href="/demo">agenda una sesión</a>.
        </section>
      </Container>
    </PublicShell>
  );
}
