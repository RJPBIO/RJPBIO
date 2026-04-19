import Link from "next/link";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { cssVar, space, font } from "@/components/ui/tokens";

export const metadata = {
  title: "Respiración resonante · Aprende",
  description:
    "La frecuencia de resonancia (~0.1 Hz) y por qué importa: acople baroreflejo, HRV máxima, y los 6 ciclos por minuto que no son un mito.",
  openGraph: {
    title: "Respiración resonante — por qué ~0.1 Hz",
    description: "Donde HRV, presión arterial y baroreflejo entran en fase.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
};

export default function ResonantePage() {
  return (
    <PublicShell activePath="/learn">
      <Container size="md" className="bi-prose">
        <header style={{ marginBlockEnd: space[6] }}>
          <div style={{ fontSize: font.size.sm, color: cssVar.accent, textTransform: "uppercase", letterSpacing: 2, fontWeight: font.weight.bold }}>
            Aprende · 7 min
          </div>
          <h1 style={{ margin: `${space[2]}px 0` }}>Respiración resonante — por qué ~0.1 Hz</h1>
          <p style={{ margin: 0, color: cssVar.textMuted, fontSize: font.size.sm }}>
            Actualizado <time dateTime="2026-04-01">abril 2026</time> · revisado contra literatura vigente
          </p>
          <p style={{ color: cssVar.textDim, maxWidth: 640 }}>
            Cuando respiras a alrededor de 5.5–6.5 ciclos por minuto (≈0.1 Hz), tu frecuencia
            cardíaca, tu presión arterial y tu baroreflejo entran en fase constructiva. La
            amplitud de tu HRV se dispara — no porque "relajes más", sino porque ese es el
            punto de resonancia del sistema cardiovascular humano. No es místico: es un
            oscilador acoplado.
          </p>
        </header>

        <Card as="section">
          <h2 style={{ marginBlockStart: 0 }}>La física detrás</h2>
          <p>
            El baroreflejo — el bucle reflejo que corrige presión arterial latido a latido —
            tiene un retardo intrínseco. Cuando respiras muy rápido, la ventana de corrección
            no cabe en un ciclo respiratorio; cuando respiras muy lento, el baroreflejo
            "descansa" entre correcciones. En la ventana de 0.1 Hz, las correcciones se
            alinean con la inspiración-espiración y la oscilación se amplifica.
          </p>
          <p>
            Vaschillo et al. (2006) demostraron que la frecuencia resonante individual cae
            entre 4.5 y 6.5 rpm en la mayoría de adultos, con desplazamientos según altura y
            volumen pulmonar. El valor promedio de 6 rpm (5 s inspirar, 5 s espirar) es una
            excelente primera aproximación.
          </p>
        </Card>

        <Card as="section" style={{ marginBlockStart: space[3] }}>
          <h2 style={{ marginBlockStart: 0 }}>Qué efectos tiene</h2>
          <ul>
            <li>
              <strong>Presión arterial:</strong> reducciones de 6–10 mmHg sistólica tras
              8–10 semanas de práctica diaria (Lehrer et al., 2020, meta-análisis).
            </li>
            <li>
              <strong>Ansiedad:</strong> efectos moderados (d ≈ 0.55) sobre escalas como GAD-7
              y STAI en poblaciones no clínicas (Lehrer et al., 2020).
            </li>
            <li>
              <strong>Recuperación post-estrés:</strong> latencia más corta entre pico de
              cortisol y retorno a baseline vs. respiración libre.
            </li>
            <li>
              <strong>Rendimiento cognitivo:</strong> mejoras pequeñas pero replicables en
              atención sostenida y memoria de trabajo (Prinsloo et al., 2011).
            </li>
          </ul>
        </Card>

        <Card as="section" style={{ marginBlockStart: space[3] }}>
          <h2 style={{ marginBlockStart: 0 }}>Cómo practicar</h2>
          <p>
            Siéntate cómodo, nariz libre, hombros bajos. Inhala 5 segundos por la nariz
            llevando el aire al abdomen (no al pecho). Exhala 5 segundos, idealmente por la
            nariz o con labios semi-cerrados. Sin forzar: si te cuesta, empieza en 4+6 y
            construye hasta 5+5.
          </p>
          <p>
            La dosis con mejor evidencia es <strong>20 minutos/día, 5 días/semana, 8 semanas</strong>{" "}
            (Lehrer et al., 2020). Dosis más cortas (5–10 min) funcionan para regulación aguda
            pero no mueven métricas basales tanto.
          </p>
          <p>
            Para encontrar <em>tu</em> frecuencia resonante personal (puede estar en 5.0, 5.5,
            6.0 o 6.5 rpm), mide HRV mientras respiras 2 min a cada frecuencia y quédate con
            la que maximice RMSSD. BIO-IGNICIÓN guarda este valor en{" "}
            <code>state.resonanceFreq</code> y lo usa en la guía de respiración.
          </p>
        </Card>

        <Card as="section" style={{ marginBlockStart: space[3] }}>
          <h2 style={{ marginBlockStart: 0 }}>Limitaciones honestas</h2>
          <ul>
            <li>No es tratamiento médico. Si tienes hipertensión diagnosticada, coordínate con tu médico — no ajustes medicación por cuenta propia.</li>
            <li>En EPOC, asma activa o embarazo avanzado, consulta antes de prolongar ciclos: la mecánica ventilatoria cambia.</li>
            <li>El efecto se pierde rápido al dejar la práctica. Es hábito, no dosis única.</li>
            <li>"Respiración 4-7-8" y similares NO son respiración resonante. Tienen sus propios efectos, distintos.</li>
          </ul>
        </Card>

        <footer style={{ marginBlockStart: space[6], color: cssVar.textMuted, fontSize: font.size.sm }}>
          <p style={{ margin: 0 }}>
            <strong>Referencias:</strong> Vaschillo, Vaschillo &amp; Lehrer,{" "}
            <em>Appl. Psychophysiol. Biofeedback</em> (2006). Lehrer et al., meta-analysis en{" "}
            <em>Appl. Psychophysiol. Biofeedback</em> (2020). Prinsloo et al.,{" "}
            <em>Appl. Cogn. Psychol.</em> (2011).
          </p>
          <p style={{ margin: `${space[3]}px 0 0` }}>
            <Link href="/learn" style={{ color: cssVar.accent }}>← Aprende</Link> ·{" "}
            <Link href="/evidencia" style={{ color: cssVar.accent }}>Biblioteca de evidencia</Link>
          </p>
        </footer>
      </Container>
    </PublicShell>
  );
}
