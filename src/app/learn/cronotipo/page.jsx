import Link from "next/link";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { cssVar, space, font } from "@/components/ui/tokens";

export const metadata = {
  title: "Cronotipo · Aprende",
  description:
    "Matutino, vespertino, intermedio — cómo tu reloj interno marca tu ventana de alto rendimiento y qué puedes (y no puedes) cambiar.",
  openGraph: {
    title: "Cronotipo — tu reloj interno en la práctica",
    description: "MEQ, PER3, ventanas de enfoque. Qué puedes y qué no puedes cambiar.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
};

export default function CronotipoPage() {
  return (
    <PublicShell activePath="/learn">
      <Container size="md" className="bi-prose">
        <header style={{ marginBlockEnd: space[6] }}>
          <div style={{ fontSize: font.size.sm, color: cssVar.accent, textTransform: "uppercase", letterSpacing: 2, fontWeight: font.weight.bold }}>
            Aprende · 5 min
          </div>
          <h1 style={{ margin: `${space[2]}px 0` }}>Cronotipo — tu reloj interno en la práctica</h1>
          <p style={{ color: cssVar.textDim, maxWidth: 640 }}>
            Tu cronotipo es la preferencia innata de tu sistema circadiano para estar alerta
            temprano, tarde, o en medio. No es una etiqueta de personalidad: es un parámetro
            biológico parcialmente genético que desplaza tu ventana de máximo rendimiento
            cognitivo y físico entre 2 y 4 horas.
          </p>
        </header>

        <Card as="section">
          <h2 style={{ marginBlockStart: 0 }}>Cómo se mide</h2>
          <p>
            El instrumento clásico es el <strong>MEQ de Horne &amp; Östberg (1976)</strong>,
            19 preguntas que te colocan en un espectro matutino→intermedio→vespertino. Más
            recientes, el <strong>MCTQ</strong> de Roenneberg et al. (2003) usa tu hora de
            sueño libre en días sin alarma como proxy objetivo — muchas veces más útil que
            auto-percepción.
          </p>
          <p>
            A nivel molecular, polimorfismos en el gen <em>PER3</em> (longitud del VNTR) se
            asocian con cronotipo matutino vs. vespertino (Archer et al., 2003), aunque el
            efecto explica menos del 10 % de la varianza. No pagues por un test genético con
            esa promesa.
          </p>
        </Card>

        <Card as="section" style={{ marginBlockStart: space[3] }}>
          <h2 style={{ marginBlockStart: 0 }}>Ventanas típicas</h2>
          <ul>
            <li>
              <strong>Matutino (≈20 % adultos):</strong> pico cognitivo 9:00–12:00. Fuerza
              máxima 10:00–13:00. Decaimiento evidente tras las 20:00.
            </li>
            <li>
              <strong>Intermedio (≈55 %):</strong> dos picos suaves — mañana y tarde.
              Flexible a entrenar en cualquier ventana si se duerme bien.
            </li>
            <li>
              <strong>Vespertino (≈25 %):</strong> pico cognitivo 14:00–20:00. Fuerza pico
              tarde (Facer-Childs &amp; Brandstaetter, 2015). Horarios escolares y laborales
              los penalizan sistemáticamente.
            </li>
          </ul>
        </Card>

        <Card as="section" style={{ marginBlockStart: space[3] }}>
          <h2 style={{ marginBlockStart: 0 }}>Qué puedes cambiar</h2>
          <p>
            Puedes <strong>desplazar</strong> tu curva ±1 hora con hábitos firmes:
            luz brillante (&gt; 10 000 lux) en los primeros 30 min post-despertar,
            comida en ventana consistente, actividad física matutina.
            Lo que <em>no</em> puedes es convertir un vespertino genuino en matutino
            — lo único que logras es <em>jet-lag social</em> (Roenneberg, 2012), un desajuste
            crónico entre tu reloj y el del mundo que cuesta salud cardiovascular y ánimo.
          </p>
          <p>
            La recomendación pragmática: identifica tu ventana real, y protégela para el
            trabajo profundo. Negocia horarios cuando puedas; para lo que no negocias,
            usa <Link href="/learn/respiracion-resonante">respiración resonante</Link> y
            sueño protegido para minimizar el costo.
          </p>
        </Card>

        <Card as="section" style={{ marginBlockStart: space[3] }}>
          <h2 style={{ marginBlockStart: 0 }}>Limitaciones honestas</h2>
          <ul>
            <li>El cronotipo cambia con la edad: adolescentes se atrasan, adultos mayores se adelantan. El tuyo hoy no es el de siempre.</li>
            <li>Enfermedad aguda, embarazo, estrés crónico y turnos nocturnos distorsionan el MCTQ — mídelo en ventanas estables.</li>
            <li>Tener un cronotipo no te exonera de higiene de sueño. Un matutino con mala higiene rinde peor que un vespertino con buena.</li>
          </ul>
        </Card>

        <footer style={{ marginBlockStart: space[6], color: cssVar.textMuted, fontSize: font.size.sm }}>
          <p style={{ margin: 0 }}>
            <strong>Referencias:</strong> Horne &amp; Östberg, <em>Int. J. Chronobiol.</em> (1976).
            Roenneberg et al., <em>J. Biol. Rhythms</em> (2003). Archer et al., <em>Sleep</em> (2003).
            Facer-Childs &amp; Brandstaetter, <em>Current Biology</em> (2015).
            Roenneberg, <em>Current Biology</em> (2012).
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
