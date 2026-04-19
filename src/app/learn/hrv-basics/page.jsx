import Link from "next/link";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { cssVar, space, font } from "@/components/ui/tokens";

export const metadata = {
  title: "HRV 101 · Aprende",
  description:
    "Variabilidad cardíaca (HRV) explicada sin hype: RMSSD, ventana nocturna, lecturas de 60 s y qué hacer con el número.",
  openGraph: {
    title: "HRV 101 — qué es y por qué importa",
    description: "RMSSD, ventana nocturna, lecturas de 60 s. Cómo leer tu HRV sin pseudociencia.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
};

export default function HrvBasicsPage() {
  return (
    <PublicShell activePath="/learn">
      <Container size="md" className="bi-prose">
        <header style={{ marginBlockEnd: space[6] }}>
          <div style={{ fontSize: font.size.sm, color: cssVar.accent, textTransform: "uppercase", letterSpacing: 2, fontWeight: font.weight.bold }}>
            Aprende · 6 min
          </div>
          <h1 style={{ margin: `${space[2]}px 0` }}>HRV 101 — qué es y por qué importa</h1>
          <p style={{ margin: 0, color: cssVar.textMuted, fontSize: font.size.sm }}>
            Actualizado <time dateTime="2026-04-01">abril 2026</time> · revisado contra literatura vigente
          </p>
          <p style={{ color: cssVar.textDim, maxWidth: 640 }}>
            La variabilidad de la frecuencia cardíaca (HRV) mide la diferencia, milisegundo a
            milisegundo, entre latidos consecutivos. Un corazón sano <em>nunca</em> late en
            ritmo perfecto — esa pequeña irregularidad es la firma del nervio vago haciendo su
            trabajo.
          </p>
        </header>

        <Card as="section">
          <h2 style={{ marginBlockStart: 0 }}>RMSSD — la métrica útil</h2>
          <p>
            De las muchas métricas de HRV (SDNN, pNN50, LF/HF), la que más se correlaciona con
            tono parasimpático en ventanas cortas es <strong>RMSSD</strong>: la raíz cuadrada
            del promedio de las diferencias al cuadrado entre latidos sucesivos. Shaffer &amp;
            Ginsberg (2017) la recomiendan como métrica de elección para lecturas de
            conveniencia (&lt; 5 min).
          </p>
          <p>
            Rango típico en adultos sanos: 20–80 ms. Pero el número absoluto importa menos que
            tu <em>baseline individual</em>. Una caída del 15–20 % respecto a tu línea base de
            14 días sugiere fatiga, infección temprana o estrés acumulado — no una tragedia,
            pero sí un dato para decidir cargas.
          </p>
        </Card>

        <Card as="section" style={{ marginBlockStart: space[3] }}>
          <h2 style={{ marginBlockStart: 0 }}>Cuándo medir</h2>
          <p>
            La ventana más reproducible es al despertar, en decúbito supino, antes de
            levantarse o revisar el teléfono. Respiración libre y nasal, 60–90 segundos. Si
            puedes medir <em>durmiendo</em> con un anillo o pulsera, mejor: la HRV nocturna es
            más limpia (Stanley et al., 2013).
          </p>
          <p>
            Evita medir post-ejercicio, durante digestión pesada o tras alcohol — todos
            deprimen RMSSD por razones obvias y confunden tu señal.
          </p>
        </Card>

        <Card as="section" style={{ marginBlockStart: space[3] }}>
          <h2 style={{ marginBlockStart: 0 }}>Qué hacer con el número</h2>
          <p>
            Dos decisiones útiles por la mañana: <strong>(a)</strong> si tu RMSSD está dentro
            de ±10 % del rolling 14-day, entrena normal; <strong>(b)</strong> si cayó &gt; 15 %
            dos días seguidos, prioriza sueño, reduce intensidad y considera una sesión de
            respiración resonante antes de decidir cargas. Plews et al. (2013) mostraron que
            los atletas que ajustan carga por HRV mejoran más que los que siguen un plan fijo.
          </p>
          <p>
            Lo que <em>no</em> debes hacer: perseguir un número alto. HRV muy alta sin contexto
            puede indicar bradicardia patológica, medicación o deshidratación. Es una señal de
            tendencia, no un marcador de virtud.
          </p>
        </Card>

        <Card as="section" style={{ marginBlockStart: space[3] }}>
          <h2 style={{ marginBlockStart: 0 }}>Limitaciones honestas</h2>
          <ul>
            <li>La HRV tiene gran variabilidad intra-día — una sola lectura no dice mucho.</li>
            <li>Mujeres: varía con ciclo menstrual (Tenan et al., 2014). Usa ventanas de 28 días, no de 7.</li>
            <li>Sensores ópticos (PPG) son menos precisos que ECG para RMSSD — sirven para tendencia, no para diagnóstico.</li>
            <li>No es un marcador de "edad biológica". Evita esas extrapolaciones.</li>
          </ul>
        </Card>

        <footer style={{ marginBlockStart: space[6], color: cssVar.textMuted, fontSize: font.size.sm }}>
          <p style={{ margin: 0 }}>
            <strong>Referencias:</strong> Shaffer &amp; Ginsberg, <em>Frontiers in Public Health</em> (2017).
            Stanley et al., <em>Sports Medicine</em> (2013). Plews et al., <em>European Journal of Applied Physiology</em> (2013).
            Tenan et al., <em>Clinical Physiology and Functional Imaging</em> (2014).
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
