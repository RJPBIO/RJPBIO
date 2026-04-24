/* ═══════════════════════════════════════════════════════════════
   /learn/cronotipo — Artículo evergreen sobre cronotipo humano.
   ═══════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font, bioSignal } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";
import IgnitionReveal from "@/components/brand/IgnitionReveal";
import BioglyphLattice from "@/components/brand/BioglyphLattice";
import PulseDivider from "@/components/brand/PulseDivider";

export const metadata = {
  title: "Cronotipo · Aprende",
  description:
    "Matutino, vespertino, intermedio — cómo tu reloj interno marca tu ventana de alto rendimiento y qué puedes (y no puedes) cambiar.",
  alternates: { canonical: "/learn/cronotipo" },
  openGraph: {
    title: "Cronotipo — tu reloj interno en la práctica",
    description: "MEQ, PER3, ventanas de enfoque. Qué puedes y qué no puedes cambiar.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
};

const ARTICLE_LAST_REVIEWED = "2026-04-18";
const ARTICLE_MINUTES = 5;
const ARTICLE_CITATIONS = 5;
const ARTICLE_YEAR_RANGE = "1976–2015";

const ACCENT = "#818CF8";

const kickerStyle = {
  fontFamily: cssVar.fontMono,
  fontSize: font.size.xs,
  color: bioSignal.phosphorCyanInk,
  textTransform: "uppercase",
  letterSpacing: "0.24em",
  fontWeight: font.weight.bold,
  marginBlockEnd: space[3],
};

const COPY = {
  es: {
    trailBack: "APRENDE",
    trailCategory: "CRONOBIOLOGÍA",
    title: "Cronotipo — tu reloj interno en la práctica.",
    editorial: "No es una etiqueta de personalidad: es un parámetro biológico parcialmente genético.",
    lead:
      "Tu cronotipo es la preferencia innata del sistema circadiano para estar alerta temprano, tarde o en medio. Desplaza tu ventana de máximo rendimiento cognitivo y físico entre dos y cuatro horas. Este artículo cubre cómo se mide y qué puedes mover realmente.",

    statMin: "Lectura",
    statMinSub: "densidad editorial alta",
    statCit: "Referencias",
    statCitSub: "revistas indexadas",
    statRange: "Rango temporal",
    statRangeSub: "años cubiertos",
    statLevel: "Nivel de evidencia",
    statLevelVal: "Moderada",
    statLevelSub: "mecanismo sólido, efecto individual variable",

    sections: [
      {
        id: "medicion",
        kicker: "MEDICIÓN",
        h: "Cómo se mide",
        body: (
          <>
            <p>
              El instrumento clásico es el <strong>MEQ de Horne y Östberg (1976)</strong>, 19
              preguntas que ubican al respondiente en un espectro matutino–intermedio–vespertino.
              Más reciente, el <strong>MCTQ</strong> de Roenneberg et al. (2003) usa la hora de
              sueño libre en días sin alarma como proxy objetivo. En la práctica suele ser más
              útil que la auto-percepción.
            </p>
            <p>
              A nivel molecular, polimorfismos en el gen <em>PER3</em> (longitud del VNTR) se
              asocian con cronotipo matutino o vespertino (Archer et al., 2003), aunque el efecto
              explica menos del 10 % de la varianza. Un test genético con promesa mayor a eso
              vende más de lo que la literatura sostiene.
            </p>
          </>
        ),
      },
      {
        id: "ventanas",
        kicker: "VENTANAS",
        h: "Ventanas típicas",
        body: (
          <ul>
            <li>
              <strong>Matutino (~20 % de adultos):</strong> pico cognitivo entre 09:00 y 12:00.
              Fuerza máxima 10:00–13:00. Decaimiento marcado después de las 20:00.
            </li>
            <li>
              <strong>Intermedio (~55 %):</strong> dos picos suaves, mañana y tarde. Flexible a
              entrenar en cualquier ventana si se duerme bien.
            </li>
            <li>
              <strong>Vespertino (~25 %):</strong> pico cognitivo 14:00–20:00. Fuerza máxima por
              la tarde (Facer-Childs y Brandstaetter, 2015). Horarios escolares y laborales
              convencionales los penalizan sistemáticamente.
            </li>
          </ul>
        ),
      },
      {
        id: "cambiar",
        kicker: "PALANCA",
        h: "Qué puedes cambiar",
        body: (
          <>
            <p>
              Puedes <strong>desplazar</strong> tu curva ±1 hora con hábitos firmes: luz brillante
              (&gt; 10 000 lux) en los primeros 30 minutos tras despertar, comida en ventana
              consistente y actividad física matutina.
            </p>
            <p>
              Lo que <em>no</em> puedes es convertir un vespertino genuino en matutino. Intentarlo
              produce <em>jet-lag social</em> (Roenneberg, 2012): un desajuste crónico entre tu
              reloj y el del mundo que tiene costo documentado en salud cardiovascular y ánimo.
            </p>
            <p>
              Recomendación pragmática: identifica tu ventana real y protégela para trabajo
              profundo. Negocia horarios donde puedas; donde no, usa{" "}
              <Link href="/learn/respiracion-resonante">respiración resonante</Link> y sueño
              protegido para minimizar el costo.
            </p>
          </>
        ),
      },
      {
        id: "limites",
        kicker: "LÍMITES",
        h: "Limitaciones honestas",
        body: (
          <ul>
            <li>El cronotipo cambia con la edad: adolescentes se atrasan, adultos mayores se adelantan. El tuyo hoy no es el de siempre.</li>
            <li>Enfermedad aguda, embarazo, estrés crónico y turnos nocturnos distorsionan el MCTQ. Mídelo en ventanas estables.</li>
            <li>Tener un cronotipo no exonera de higiene de sueño. Un matutino con mala higiene rinde peor que un vespertino con buena.</li>
          </ul>
        ),
      },
    ],

    refsLabel: "Referencias",
    refs: [
      {
        authors: "Horne JA, Östberg O.",
        year: "1976",
        title: "A self-assessment questionnaire to determine morningness-eveningness.",
        journal: "International Journal of Chronobiology.",
      },
      {
        authors: "Roenneberg T, Wirz-Justice A, Merrow M.",
        year: "2003",
        title: "Life between clocks: daily temporal patterns of human chronotypes.",
        journal: "Journal of Biological Rhythms.",
        doi: "10.1177/0748730402239679",
      },
      {
        authors: "Archer SN, Robilliard DL, Skene DJ, et al.",
        year: "2003",
        title: "A length polymorphism in the circadian clock gene Per3 is linked to delayed sleep phase syndrome and extreme diurnal preference.",
        journal: "Sleep.",
        doi: "10.1093/sleep/26.4.413",
      },
      {
        authors: "Facer-Childs E, Brandstaetter R.",
        year: "2015",
        title: "The impact of circadian phenotype and time since awakening on diurnal performance in athletes.",
        journal: "Current Biology.",
        doi: "10.1016/j.cub.2014.12.036",
      },
      {
        authors: "Roenneberg T.",
        year: "2012",
        title: "What is chronotype?",
        journal: "Current Biology.",
        doi: "10.1016/j.cub.2012.04.009",
      },
    ],

    relatedLabel: "Siguiente lectura",
    relatedTitle: "HRV 101 — qué es y por qué importa",
    relatedBlurb: "La métrica que te dice cuándo tu cronotipo está bajo carga. 6 min.",

    closingKicker: "SIGUIENTE PASO",
    closingHLead: "Ya conoces tu curva.",
    closingHBody: "Vela trabajar sobre tu agenda.",
    closingBody:
      "30 minutos para ver cómo BIO-IGNICIÓN ubica tu ventana real y protege tus bloques de trabajo profundo sin imponer una hora fija.",
    closingPrimary: "Agenda demo",
    closingSecondary: "Biblioteca de evidencia",
    closingBack: "Volver a Aprende",

    reviewedLabel: "Última revisión",
    disclaimerLabel: "Material educativo",
    disclaimerNote: "No sustituye consulta clínica ni decisiones médicas profesionales.",
  },
  en: {
    trailBack: "LEARN",
    trailCategory: "CHRONOBIOLOGY",
    title: "Chronotype — your inner clock in practice.",
    editorial: "Not a personality label: a partially genetic biological parameter.",
    lead:
      "Your chronotype is the innate preference of the circadian system to be alert early, late or in between. It shifts your peak window of cognitive and physical performance by two to four hours. This article covers how it's measured and what you can actually move.",

    statMin: "Reading",
    statMinSub: "dense editorial",
    statCit: "References",
    statCitSub: "indexed journals",
    statRange: "Time span",
    statRangeSub: "years covered",
    statLevel: "Evidence level",
    statLevelVal: "Moderate",
    statLevelSub: "solid mechanism, variable individual effect",

    sections: [
      {
        id: "medicion",
        kicker: "MEASUREMENT",
        h: "How it's measured",
        body: (
          <>
            <p>
              The classic instrument is the <strong>Horne &amp; Östberg MEQ (1976)</strong>, 19
              questions that place the respondent on a morning–intermediate–evening spectrum. More
              recent, the <strong>MCTQ</strong> by Roenneberg et al. (2003) uses free sleep time
              on alarm-free days as an objective proxy. In practice it is often more useful than
              self-report.
            </p>
            <p>
              At the molecular level, polymorphisms in the <em>PER3</em> gene (VNTR length) are
              associated with morning or evening chronotype (Archer et al., 2003), but explain
              under 10 % of the variance. A genetic test promising more than that oversells what
              the literature supports.
            </p>
          </>
        ),
      },
      {
        id: "ventanas",
        kicker: "WINDOWS",
        h: "Typical windows",
        body: (
          <ul>
            <li>
              <strong>Morning types (~20 % of adults):</strong> cognitive peak 09:00–12:00.
              Strength peak 10:00–13:00. Marked decline after 20:00.
            </li>
            <li>
              <strong>Intermediate (~55 %):</strong> two soft peaks, morning and afternoon.
              Flexible to train in any window if sleep is protected.
            </li>
            <li>
              <strong>Evening types (~25 %):</strong> cognitive peak 14:00–20:00. Strength peak in
              the afternoon (Facer-Childs &amp; Brandstaetter, 2015). Conventional school and work
              schedules penalise them systematically.
            </li>
          </ul>
        ),
      },
      {
        id: "cambiar",
        kicker: "LEVERAGE",
        h: "What you can change",
        body: (
          <>
            <p>
              You can <strong>shift</strong> your curve ±1 hour with firm habits: bright light
              (&gt; 10 000 lux) in the first 30 minutes after waking, a consistent feeding
              window and morning physical activity.
            </p>
            <p>
              What you <em>cannot</em> do is turn a genuine evening type into a morning type.
              Trying produces <em>social jet-lag</em> (Roenneberg, 2012): a chronic misalignment
              between your clock and the world's, with documented cost in cardiovascular health
              and mood.
            </p>
            <p>
              Pragmatic recommendation: identify your real window and protect it for deep work.
              Negotiate hours where you can; where you can't, use{" "}
              <Link href="/learn/respiracion-resonante">resonant breathing</Link> and protected
              sleep to minimise the cost.
            </p>
          </>
        ),
      },
      {
        id: "limites",
        kicker: "LIMITS",
        h: "Honest limitations",
        body: (
          <ul>
            <li>Chronotype shifts with age: adolescents delay, older adults advance. Today's chronotype is not forever.</li>
            <li>Acute illness, pregnancy, chronic stress and night shifts distort the MCTQ. Measure in stable windows.</li>
            <li>Having a chronotype doesn't excuse sleep hygiene. A morning type with poor hygiene underperforms an evening type with good hygiene.</li>
          </ul>
        ),
      },
    ],

    refsLabel: "References",
    refs: [
      {
        authors: "Horne JA, Östberg O.",
        year: "1976",
        title: "A self-assessment questionnaire to determine morningness-eveningness.",
        journal: "International Journal of Chronobiology.",
      },
      {
        authors: "Roenneberg T, Wirz-Justice A, Merrow M.",
        year: "2003",
        title: "Life between clocks: daily temporal patterns of human chronotypes.",
        journal: "Journal of Biological Rhythms.",
        doi: "10.1177/0748730402239679",
      },
      {
        authors: "Archer SN, Robilliard DL, Skene DJ, et al.",
        year: "2003",
        title: "A length polymorphism in the circadian clock gene Per3 is linked to delayed sleep phase syndrome and extreme diurnal preference.",
        journal: "Sleep.",
        doi: "10.1093/sleep/26.4.413",
      },
      {
        authors: "Facer-Childs E, Brandstaetter R.",
        year: "2015",
        title: "The impact of circadian phenotype and time since awakening on diurnal performance in athletes.",
        journal: "Current Biology.",
        doi: "10.1016/j.cub.2014.12.036",
      },
      {
        authors: "Roenneberg T.",
        year: "2012",
        title: "What is chronotype?",
        journal: "Current Biology.",
        doi: "10.1016/j.cub.2012.04.009",
      },
    ],

    relatedLabel: "Next read",
    relatedTitle: "HRV 101 — what it is and why it matters",
    relatedBlurb: "The metric that tells you when your chronotype is under load. 6 min.",

    closingKicker: "NEXT STEP",
    closingHLead: "You know your curve.",
    closingHBody: "See it run against your calendar.",
    closingBody:
      "30 minutes to watch BIO-IGNICIÓN locate your real window and protect deep-work blocks without imposing a fixed hour.",
    closingPrimary: "Book a demo",
    closingSecondary: "Evidence library",
    closingBack: "Back to Learn",

    reviewedLabel: "Last reviewed",
    disclaimerLabel: "Educational material",
    disclaimerNote: "Does not replace clinical consultation or professional medical decisions.",
  },
};

export default async function CronotipoPage() {
  const locale = await getServerLocale();
  const L = locale === "en" ? "en" : "es";
  const c = COPY[L];
  const reviewedDate = new Date(ARTICLE_LAST_REVIEWED).toLocaleDateString(
    L === "en" ? "en-US" : "es-MX",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <PublicShell activePath="/learn">
      <Container size="lg" className="bi-prose">
        <header className="bi-evid-hero">
          <div aria-hidden className="bi-evid-hero-lattice">
            <BioglyphLattice variant="ambient" />
          </div>
          <span aria-hidden className="bi-evid-hero-aura" style={{ background: `radial-gradient(closest-side, color-mix(in srgb, ${ACCENT} 16%, transparent), transparent 70%)` }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <IgnitionReveal sparkOrigin="12% 30%">
              <div style={kickerStyle} className="bi-learn-trail">
                <Link href="/learn" className="bi-learn-trail-link" aria-label={L === "en" ? "Back to Learn" : "Volver a Aprende"}>
                  <svg aria-hidden width="10" height="10" viewBox="0 0 10 10" className="bi-learn-trail-arrow">
                    <path d="M6.5 2L3 5l3.5 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                  {c.trailBack}
                </Link>
                <span aria-hidden className="bi-learn-trail-sep">·</span>
                <span className="bi-learn-trail-cat">{c.trailCategory}</span>
              </div>
              <h1
                style={{
                  margin: `${space[3]}px 0 ${space[4]}px`,
                  fontSize: "clamp(32px, 4.6vw, 56px)",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.04,
                  maxWidth: "22ch",
                }}
              >
                {c.title}
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-editorial), 'Instrument Serif', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: "clamp(18px, 2vw, 22px)",
                  lineHeight: 1.35,
                  color: cssVar.textMuted,
                  maxWidth: "48ch",
                  margin: `0 0 ${space[4]}px`,
                }}
              >
                {c.editorial}
              </p>
              <p style={{ color: cssVar.textDim, maxWidth: "62ch", marginBlockStart: 0 }}>{c.lead}</p>
            </IgnitionReveal>
          </div>
        </header>
      </Container>

      <section aria-label={c.statMin} style={{ marginBlockStart: space[6] }}>
        <Container size="xl" style={{ paddingInline: 0 }}>
          <div className="bi-proof-stats">
            <div>
              <span className="v">{ARTICLE_MINUTES} min</span>
              <span className="l">{c.statMin}</span>
              <span className="s">{c.statMinSub}</span>
            </div>
            <div>
              <span className="v">{ARTICLE_CITATIONS}</span>
              <span className="l">{c.statCit}</span>
              <span className="s">{c.statCitSub}</span>
            </div>
            <div>
              <span className="v">{ARTICLE_YEAR_RANGE}</span>
              <span className="l">{c.statRange}</span>
              <span className="s">{c.statRangeSub}</span>
            </div>
            <div>
              <span className="v" style={{ color: ACCENT }}>{c.statLevelVal}</span>
              <span className="l">{c.statLevel}</span>
              <span className="s">{c.statLevelSub}</span>
            </div>
          </div>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      <Container size="md" className="bi-prose">
        <div className="bi-learn-article" style={{ "--learn-accent": ACCENT }}>
          {c.sections.map((s) => (
            <section key={s.id} id={s.id} className="bi-learn-section">
              <div className="bi-learn-section-kicker">{s.kicker}</div>
              <h2 className="bi-learn-section-h">{s.h}</h2>
              <div className="bi-learn-section-body">{s.body}</div>
            </section>
          ))}
        </div>

        <section aria-labelledby="refs" className="bi-learn-refs">
          <h2 id="refs" className="bi-learn-refs-h">{c.refsLabel}</h2>
          <ol className="bi-learn-refs-list">
            {c.refs.map((r, i) => (
              <li key={i} className="bi-learn-ref">
                <div className="bi-learn-ref-cite">
                  <span className="bi-learn-ref-authors">{r.authors}</span>
                  <span className="bi-learn-ref-year">{r.year}</span>
                </div>
                <div className="bi-learn-ref-title">{r.title}</div>
                <div className="bi-learn-ref-journal">{r.journal}</div>
                {r.doi && (
                  <a
                    href={`https://doi.org/${r.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bi-learn-ref-doi"
                  >
                    DOI: {r.doi}
                    <svg aria-hidden width="11" height="11" viewBox="0 0 11 11">
                      <path d="M4 2h5v5M9 2L3.5 7.5M2 5v4h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </a>
                )}
              </li>
            ))}
          </ol>
        </section>

        <aside className="bi-learn-related">
          <span className="bi-learn-related-kicker">{c.relatedLabel}</span>
          <Link href="/learn/hrv-basics" className="bi-learn-related-link">
            <h3 className="bi-learn-related-title">{c.relatedTitle}</h3>
            <p className="bi-learn-related-blurb">{c.relatedBlurb}</p>
            <span aria-hidden className="bi-learn-related-arrow">
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M3 8h10M8.5 3.5l4.5 4.5-4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </span>
          </Link>
        </aside>
      </Container>

      <PulseDivider intensity="dim" />

      <section aria-labelledby="crono-closing" className="bi-demo-closing-section">
        <Container size="lg" style={{ paddingBlock: `clamp(48px, 7vw, 96px)` }}>
          <IgnitionReveal sparkOrigin="50% 20%">
            <div className="bi-demo-closing">
              <div aria-hidden className="bi-demo-closing-lattice">
                <BioglyphLattice variant="ambient" />
              </div>
              <span aria-hidden className="bi-demo-closing-aura" />
              <span aria-hidden className="bi-demo-closing-aura bi-demo-closing-aura--spark" />

              <div className="bi-demo-closing-mark" aria-hidden>
                <span className="bi-demo-closing-mark-core" />
                <span className="bi-demo-closing-mark-ring" />
              </div>

              <div style={{ ...kickerStyle, marginBottom: space[4] }}>{c.closingKicker}</div>

              <h2 id="crono-closing" className="bi-demo-closing-h">
                <span className="bi-demo-closing-h-lead">{c.closingHLead}</span>{" "}
                <span className="bi-demo-closing-h-body">{c.closingHBody}</span>
              </h2>

              <p className="bi-demo-closing-body">{c.closingBody}</p>

              <div className="bi-demo-closing-actions">
                <Link href="/demo" className="bi-demo-closing-primary">
                  <span className="bi-demo-closing-primary-label">{c.closingPrimary}</span>
                  <span aria-hidden className="bi-demo-closing-primary-sep" />
                  <svg aria-hidden width="15" height="15" viewBox="0 0 15 15" className="bi-demo-closing-primary-arrow">
                    <path d="M3 7.5h9M8.5 3.5l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </Link>
                <Link href="/evidencia" className="bi-demo-closing-ghost">
                  <svg aria-hidden width="13" height="13" viewBox="0 0 13 13">
                    <path d="M2.5 2.5h8v8h-8zM2.5 5.5h8M5.5 2.5v8" stroke="currentColor" strokeWidth="1.2" fill="none" />
                  </svg>
                  <span>{c.closingSecondary}</span>
                </Link>
                <Link href="/learn" className="bi-demo-closing-ghost">
                  <svg aria-hidden width="13" height="13" viewBox="0 0 13 13">
                    <path d="M9.5 3L5 6.5l4.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                  <span>{c.closingBack}</span>
                </Link>
              </div>

              <div className="bi-demo-closing-meta">
                <div className="bi-demo-closing-avail">
                  <span aria-hidden className="bi-demo-closing-avail-pulse">
                    <span className="bi-demo-closing-avail-dot" />
                  </span>
                  <span className="bi-demo-closing-avail-label">{c.reviewedLabel}</span>
                  <span className="bi-demo-closing-avail-meta">{reviewedDate}</span>
                </div>
                <div className="bi-demo-closing-sig">
                  <span className="bi-demo-closing-sig-name">{c.disclaimerLabel}</span>
                  <span className="bi-demo-closing-sig-meta">{c.disclaimerNote}</span>
                </div>
              </div>
            </div>
          </IgnitionReveal>
        </Container>
      </section>
    </PublicShell>
  );
}
