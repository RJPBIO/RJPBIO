import RoiCalc from "./RoiCalc";

export const metadata = {
  title: "Calculadora ROI · BIO-IGNICIÓN",
  description: "Estima horas recuperadas y valor anual con supuestos conservadores. Sin email wall.",
};

export default function RoiPage() {
  return (
    <main style={page}>
      <header style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: "#6EE7B7", textTransform: "uppercase", letterSpacing: 2 }}>Calculadora</div>
        <h1 style={{ fontSize: 34, fontWeight: 800, margin: "6px 0" }}>ROI de BIO-IGNICIÓN</h1>
        <p style={{ color: "#A7F3D0", maxWidth: 680, lineHeight: 1.55 }}>
          Supuestos conservadores, datos tuyos, cálculo transparente. No guardamos tus inputs — todo corre en el navegador.
          El modelo es el mismo que usa el panel de equipo (<a href="/docs#roi-model" style={link}>ver documentación</a>).
        </p>
      </header>

      <RoiCalc />

      <section style={{ marginTop: 40, padding: 16, borderTop: "1px solid #064E3B", fontSize: 12, color: "#6B7280", lineHeight: 1.7 }}>
        <b style={{ color: "#A7F3D0" }}>Cómo leer estos números:</b>{" "}
        Las "horas recuperadas" no son tiempo extra de trabajo — son horas con mejor foco, estado y toma de decisiones,
        expresadas en equivalente monetario. El múltiplo de ROI es orientativo: compara valor bruto contra licencia,
        ignora costos de onboarding y variabilidad individual. Para un análisis empresarial completo,
        <a href="/demo" style={link}> agenda una sesión</a>.
      </section>
    </main>
  );
}

const page = { minHeight: "100dvh", background: "#0B0E14", color: "#ECFDF5", padding: "48px 24px", maxWidth: 1060, margin: "0 auto" };
const link = { color: "#6EE7B7", textDecoration: "underline" };
