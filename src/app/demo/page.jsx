import DemoForm from "./DemoForm";

export const metadata = {
  title: "Demo · BIO-IGNICIÓN",
  description: "30 minutos con un especialista. Protocolo en vivo + dashboard de equipo con datos simulados.",
};

export default function DemoPage() {
  return (
    <main style={page}>
      <div style={split}>
        <section>
          <div style={{ fontSize: 12, color: "#6EE7B7", textTransform: "uppercase", letterSpacing: 2 }}>Demo 1:1</div>
          <h1 style={{ fontSize: 34, fontWeight: 800, margin: "8px 0 12px" }}>
            30 minutos para ver si BIO-IGNICIÓN le sirve a tu equipo
          </h1>
          <p style={{ color: "#A7F3D0", lineHeight: 1.6, marginBottom: 18 }}>
            No es una presentación de slides. Corremos un protocolo neural en vivo contigo, te mostramos
            el panel de equipo con datos simulados y respondemos preguntas de seguridad / compliance.
          </p>
          <ul style={{ paddingLeft: 20, color: "#D1FAE5", lineHeight: 1.8, fontSize: 14 }}>
            <li>Sesión neural en vivo (breath + audio + binaural).</li>
            <li>Panel de equipo con k-anonymity ≥5.</li>
            <li>Q&amp;A de SSO, SCIM, DPA, residencia de datos.</li>
            <li>ROI estimado según tu tamaño de equipo.</li>
          </ul>
          <div style={{ marginTop: 22, padding: 14, background: "rgba(5,150,105,.06)", border: "1px solid #064E3B", borderRadius: 12 }}>
            <div style={{ fontSize: 12, color: "#6EE7B7", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Referencias</div>
            <p style={{ color: "#D1FAE5", fontSize: 13, lineHeight: 1.6, margin: "6px 0 0" }}>
              Revisa el <a href="/trust" style={link}>Trust Center</a>, la{" "}
              <a href="/trust/dpa" style={link}>DPA</a> y nuestros{" "}
              <a href="/trust/subprocessors" style={link}>subprocesadores</a> antes de hablar.
            </p>
          </div>
        </section>

        <section style={formCard}>
          <h2 style={{ margin: "0 0 18px", fontSize: 20, fontWeight: 700 }}>Reserva un horario</h2>
          <DemoForm source="demo" />
        </section>
      </div>
    </main>
  );
}

const page = { minHeight: "100dvh", background: "#0B0E14", color: "#ECFDF5", padding: "48px 24px" };
const split = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, maxWidth: 1040, margin: "0 auto" };
const formCard = { padding: 28, background: "rgba(5,150,105,.08)", border: "1px solid #064E3B", borderRadius: 18 };
const link = { color: "#6EE7B7", textDecoration: "underline" };
