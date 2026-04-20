/* ═══════════════════════════════════════════════════════════════
   /learn/hrv-basics — Artículo evergreen.

   Fuente de referencias al pie. Si se actualiza cualquier
   cita, sube ARTICLE_LAST_REVIEWED y ajusta el texto afectado.
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
  title: "HRV 101 · Aprende",
  description:
    "Variabilidad cardíaca (HRV) con rigor: RMSSD, ventana nocturna, lecturas de 60 s y qué hacer con el número.",
  alternates: { canonical: "/learn/hrv-basics" },
  openGraph: {
    title: "HRV 101 — qué es y por qué importa",
    description: "RMSSD, ventana nocturna, lecturas de 60 s. Cómo leer tu HRV sin pseudociencia.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
};

const ARTICLE_LAST_REVIEWED = "2026-04-18";
const ARTICLE_MINUTES = 6;
const ARTICLE_CITATIONS = 4;
const ARTICLE_YEAR_RANGE = "2013–2017";

const ACCENT = "#818CF8";

const kickerStyle = {
  fontFamily: cssVar.fontMono,
  fontSize: font.size.xs,
  color: bioSignal.phosphorCyan,
  textTransform: "uppercase",
  letterSpacing: "0.24em",
  fontWeight: font.weight.bold,
  marginBlockEnd: space[3],
};

const COPY = {
  es: {
    trailBack: "APRENDE",
    trailCategory: "FISIOLOGÍA",
    title: "HRV 101 — qué es y por qué importa.",
    editorial: "Un corazón sano nunca late en ritmo perfecto: esa pequeña irregularidad es la firma del nervio vago haciendo su trabajo.",
    lead:
      "La variabilidad de la frecuencia cardíaca mide la diferencia, milisegundo a milisegundo, entre latidos consecutivos. Este artículo cubre qué métrica importa, cuándo medir y qué hacer con el número — sin promesas que la literatura no sostiene.",

    statMin: "Lectura",
    statMinSub: "densidad editorial alta",
    statCit: "Referencias",
    statCitSub: "revistas indexadas",
    statRange: "Rango temporal",
    statRangeSub: "años cubiertos",
    statLevel: "Nivel de evidencia",
    statLevelVal: "Moderada",
    statLevelSub: "ensayos replicados, muestras variables",

    sections: [
      {
        id: "rmssd",
        kicker: "MÉTRICA",
        h: "RMSSD — la métrica útil",
        body: (
          <>
            <p>
              De las métricas disponibles (SDNN, pNN50, LF/HF), la que más se correlaciona con
              tono parasimpático en ventanas cortas es <strong>RMSSD</strong>: la raíz cuadrada
              del promedio de las diferencias al cuadrado entre latidos sucesivos. Shaffer y
              Ginsberg (2017) la recomiendan como métrica de elección para lecturas de
              conveniencia menores a cinco minutos.
            </p>
            <p>
              El rango típico en adultos sanos va de 20 a 80 ms, pero el número absoluto importa
              menos que tu línea base individual. Una caída sostenida del 15 al 20 % respecto al
              promedio móvil de 14 días sugiere fatiga acumulada, infección temprana o estrés —
              no una tragedia, sí un dato para modular cargas.
            </p>
          </>
        ),
      },
      {
        id: "ventana",
        kicker: "VENTANA",
        h: "Cuándo medir",
        body: (
          <>
            <p>
              La ventana más reproducible es al despertar, en decúbito supino, antes de
              levantarse o revisar el teléfono. Respiración libre y nasal, 60 a 90 segundos. Si
              puedes medir durmiendo con un anillo o pulsera, mejor: la HRV nocturna es más
              limpia (Stanley et al., 2013).
            </p>
            <p>
              Evita medir post-ejercicio, durante digestión pesada o después de alcohol. Las tres
              condiciones deprimen RMSSD por razones fisiológicas conocidas y confunden la
              tendencia que buscas observar.
            </p>
          </>
        ),
      },
      {
        id: "decision",
        kicker: "DECISIÓN",
        h: "Qué hacer con el número",
        body: (
          <>
            <p>
              Dos decisiones útiles por la mañana. <strong>(a)</strong> Si tu RMSSD está dentro
              de ±10 % del promedio móvil de 14 días, entrena normal.{" "}
              <strong>(b)</strong> Si cae más de 15 % dos días seguidos, prioriza sueño, reduce
              intensidad y considera una sesión de respiración resonante antes de decidir cargas.
              Plews et al. (2013) mostraron que los atletas que ajustan carga por HRV progresan
              más que los que siguen un plan fijo.
            </p>
            <p>
              Lo que <em>no</em> conviene hacer: perseguir un número alto. Una HRV muy elevada
              sin contexto puede reflejar bradicardia, medicación o deshidratación. Es señal de
              tendencia, no marcador de virtud.
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
            <li>La HRV tiene gran variabilidad intra-día; una sola lectura no define tendencia.</li>
            <li>En mujeres varía con el ciclo menstrual (Tenan et al., 2014). Usa ventanas de 28 días, no de 7.</li>
            <li>Sensores ópticos (PPG) son menos precisos que ECG para RMSSD. Sirven para tendencia, no para diagnóstico.</li>
            <li>No es un marcador de "edad biológica". Evita esas extrapolaciones.</li>
          </ul>
        ),
      },
    ],

    refsLabel: "Referencias",
    refs: [
      {
        authors: "Shaffer F, Ginsberg JP.",
        year: "2017",
        title: "An Overview of Heart Rate Variability Metrics and Norms.",
        journal: "Frontiers in Public Health.",
        doi: "10.3389/fpubh.2017.00258",
      },
      {
        authors: "Stanley J, Peake JM, Buchheit M.",
        year: "2013",
        title: "Cardiac parasympathetic reactivation following exercise.",
        journal: "Sports Medicine.",
        doi: "10.1007/s40279-013-0083-4",
      },
      {
        authors: "Plews DJ, Laursen PB, Stanley J, Kilding AE, Buchheit M.",
        year: "2013",
        title: "Training adaptation and heart rate variability in elite endurance athletes.",
        journal: "European Journal of Applied Physiology.",
        doi: "10.1007/s00421-013-2710-z",
      },
      {
        authors: "Tenan MS, Brothers RM, Tweedell AJ, Hackney AC, Griffin L.",
        year: "2014",
        title: "Changes in resting heart rate variability across the menstrual cycle.",
        journal: "Clinical Physiology and Functional Imaging.",
      },
    ],

    relatedLabel: "Siguiente lectura",
    relatedTitle: "Respiración resonante — por qué ~0.1 Hz",
    relatedBlurb: "La práctica diaria que más mueve tu RMSSD basal. 7 min.",

    closingKicker: "SIGUIENTE PASO",
    closingHLead: "Ya entiendes el número.",
    closingHBody: "Velo en vivo sobre tu dato.",
    closingBody:
      "30 minutos para ver cómo BIO-IGNICIÓN calibra tu línea base y traduce variación diaria en decisiones de entrenamiento.",
    closingPrimary: "Agenda demo",
    closingSecondary: "Biblioteca de evidencia",
    closingBack: "Volver a Aprende",

    reviewedLabel: "Última revisión",
    disclaimerLabel: "Material educativo",
    disclaimerNote: "No sustituye consulta clínica ni decisiones médicas profesionales.",
  },
  en: {
    trailBack: "LEARN",
    trailCategory: "PHYSIOLOGY",
    title: "HRV 101 — what it is and why it matters.",
    editorial: "A healthy heart never beats in perfect rhythm: that small irregularity is the vagus nerve at work.",
    lead:
      "Heart-rate variability measures the difference, millisecond by millisecond, between consecutive beats. This article covers which metric to read, when to measure and what to do with the number — without promises the literature won't back.",

    statMin: "Reading",
    statMinSub: "dense editorial",
    statCit: "References",
    statCitSub: "indexed journals",
    statRange: "Time span",
    statRangeSub: "years covered",
    statLevel: "Evidence level",
    statLevelVal: "Moderate",
    statLevelSub: "replicated trials, mixed samples",

    sections: [
      {
        id: "rmssd",
        kicker: "METRIC",
        h: "RMSSD — the useful metric",
        body: (
          <>
            <p>
              Among the available metrics (SDNN, pNN50, LF/HF), the one that best correlates with
              parasympathetic tone over short windows is <strong>RMSSD</strong>: the root mean
              square of successive inter-beat differences. Shaffer &amp; Ginsberg (2017) recommend
              it as the metric of choice for convenience readings under five minutes.
            </p>
            <p>
              The typical range in healthy adults is 20 to 80 ms, but the absolute number matters
              less than your individual baseline. A sustained 15–20 % drop versus your 14-day
              rolling mean suggests accumulated fatigue, early infection or stress — not a
              tragedy, but a data point to modulate load.
            </p>
          </>
        ),
      },
      {
        id: "ventana",
        kicker: "WINDOW",
        h: "When to measure",
        body: (
          <>
            <p>
              The most reproducible window is on waking, lying supine, before getting up or
              checking your phone. Free, nasal breathing, 60 to 90 seconds. If you can measure
              while sleeping with a ring or wristband, better: nocturnal HRV is cleaner
              (Stanley et al., 2013).
            </p>
            <p>
              Avoid measuring post-exercise, during heavy digestion or after alcohol. All three
              depress RMSSD for known physiological reasons and confound the trend you care about.
            </p>
          </>
        ),
      },
      {
        id: "decision",
        kicker: "DECISION",
        h: "What to do with the number",
        body: (
          <>
            <p>
              Two useful morning decisions. <strong>(a)</strong> If your RMSSD is within ±10 % of
              the 14-day rolling mean, train normally. <strong>(b)</strong> If it drops more than
              15 % two days in a row, prioritise sleep, reduce intensity and consider a resonant
              breathing session before deciding loads. Plews et al. (2013) showed that athletes
              who adjust load by HRV progress further than those on a fixed plan.
            </p>
            <p>
              What <em>not</em> to do: chase a high number. Very high HRV without context can
              reflect bradycardia, medication or dehydration. It is a trend signal, not a
              virtue marker.
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
            <li>HRV has large intra-day variability; a single reading does not define a trend.</li>
            <li>In women it varies with the menstrual cycle (Tenan et al., 2014). Use 28-day windows, not 7.</li>
            <li>Optical sensors (PPG) are less accurate than ECG for RMSSD. Fine for trend, not for diagnosis.</li>
            <li>Not a marker of "biological age". Avoid that extrapolation.</li>
          </ul>
        ),
      },
    ],

    refsLabel: "References",
    refs: [
      {
        authors: "Shaffer F, Ginsberg JP.",
        year: "2017",
        title: "An Overview of Heart Rate Variability Metrics and Norms.",
        journal: "Frontiers in Public Health.",
        doi: "10.3389/fpubh.2017.00258",
      },
      {
        authors: "Stanley J, Peake JM, Buchheit M.",
        year: "2013",
        title: "Cardiac parasympathetic reactivation following exercise.",
        journal: "Sports Medicine.",
        doi: "10.1007/s40279-013-0083-4",
      },
      {
        authors: "Plews DJ, Laursen PB, Stanley J, Kilding AE, Buchheit M.",
        year: "2013",
        title: "Training adaptation and heart rate variability in elite endurance athletes.",
        journal: "European Journal of Applied Physiology.",
        doi: "10.1007/s00421-013-2710-z",
      },
      {
        authors: "Tenan MS, Brothers RM, Tweedell AJ, Hackney AC, Griffin L.",
        year: "2014",
        title: "Changes in resting heart rate variability across the menstrual cycle.",
        journal: "Clinical Physiology and Functional Imaging.",
      },
    ],

    relatedLabel: "Next read",
    relatedTitle: "Resonant breathing — why ~0.1 Hz",
    relatedBlurb: "The daily practice that most moves your baseline RMSSD. 7 min.",

    closingKicker: "NEXT STEP",
    closingHLead: "You understand the number.",
    closingHBody: "See it live on your data.",
    closingBody:
      "30 minutes to watch BIO-IGNICIÓN calibrate your baseline and translate daily variation into training decisions.",
    closingPrimary: "Book a demo",
    closingSecondary: "Evidence library",
    closingBack: "Back to Learn",

    reviewedLabel: "Last reviewed",
    disclaimerLabel: "Educational material",
    disclaimerNote: "Does not replace clinical consultation or professional medical decisions.",
  },
};

export default async function HrvBasicsPage() {
  const locale = await getServerLocale();
  const L = locale === "en" ? "en" : "es";
  const c = COPY[L];
  const reviewedDate = new Date(ARTICLE_LAST_REVIEWED).toLocaleDateString(
    L === "en" ? "en-US" : "es-MX",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <PublicShell activePath="/learn">
      {/* ═══ Hero ═══ */}
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

      {/* ═══ Stat strip ═══ */}
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

      {/* ═══ Article body ═══ */}
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

        {/* References */}
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

        {/* Related */}
        <aside className="bi-learn-related">
          <span className="bi-learn-related-kicker">{c.relatedLabel}</span>
          <Link href="/learn/respiracion-resonante" className="bi-learn-related-link">
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

      {/* ═══ Closing CTA ═══ */}
      <section aria-labelledby="hrv-closing" className="bi-demo-closing-section">
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

              <h2 id="hrv-closing" className="bi-demo-closing-h">
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
