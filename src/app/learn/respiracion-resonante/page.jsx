/* ═══════════════════════════════════════════════════════════════
   /learn/respiracion-resonante — Artículo sobre frecuencia de
   resonancia cardiovascular (~0.1 Hz).
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
  title: "Respiración resonante · Aprende",
  description:
    "La frecuencia de resonancia (~0.1 Hz) y por qué importa: acople baroreflejo, amplificación de HRV y los 6 ciclos por minuto con respaldo en literatura revisada.",
  alternates: { canonical: "/learn/respiracion-resonante" },
  openGraph: {
    title: "Respiración resonante — por qué ~0.1 Hz",
    description: "Donde HRV, presión arterial y baroreflejo entran en fase.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
};

const ARTICLE_LAST_REVIEWED = "2026-04-18";
const ARTICLE_MINUTES = 7;
const ARTICLE_CITATIONS = 3;
const ARTICLE_YEAR_RANGE = "2006–2020";

const ACCENT = "#22D3EE";

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
    trailCategory: "SISTEMA AUTONÓMICO",
    title: "Respiración resonante — por qué ~0.1 Hz.",
    editorial: "Un fenómeno de resonancia mecánica entre corazón, pulmón y baroreflejo.",
    lead:
      "A cerca de 5.5–6.5 ciclos por minuto (~0.1 Hz), frecuencia cardíaca, presión arterial y baroreflejo entran en fase constructiva. La amplitud de la HRV se amplifica no por un efecto subjetivo de relajación, sino porque ese es el punto de resonancia del sistema cardiovascular humano.",

    statMin: "Lectura",
    statMinSub: "densidad editorial alta",
    statCit: "Referencias",
    statCitSub: "revistas indexadas",
    statRange: "Rango temporal",
    statRangeSub: "años cubiertos",
    statLevel: "Nivel de evidencia",
    statLevelVal: "Alta",
    statLevelSub: "meta-análisis con efecto consistente",

    sections: [
      {
        id: "fisica",
        kicker: "FÍSICA",
        h: "La fisiología detrás",
        body: (
          <>
            <p>
              El baroreflejo — el bucle reflejo que corrige presión arterial latido a latido —
              tiene un retardo intrínseco. Cuando respiras muy rápido, la ventana de corrección
              no cabe en un ciclo respiratorio; cuando respiras muy lento, el baroreflejo
              descansa entre correcciones. En la ventana de ~0.1 Hz las correcciones se alinean
              con inspiración y espiración y la oscilación se amplifica.
            </p>
            <p>
              Vaschillo et al. (2006) documentaron que la frecuencia resonante individual cae
              entre 4.5 y 6.5 respiraciones por minuto en la mayoría de adultos, con
              desplazamientos según altura y volumen pulmonar. El valor medio de 6 rpm (5 s
              inspirar, 5 s espirar) es una excelente primera aproximación.
            </p>
          </>
        ),
      },
      {
        id: "efectos",
        kicker: "EFECTOS",
        h: "Qué efectos tiene",
        body: (
          <ul>
            <li>
              <strong>Presión arterial:</strong> reducciones de 6–10 mmHg sistólica tras 8–10
              semanas de práctica diaria (Lehrer et al., 2020, meta-análisis).
            </li>
            <li>
              <strong>Ansiedad:</strong> efectos moderados (d ≈ 0.55) sobre escalas como GAD-7 y
              STAI en poblaciones no clínicas (Lehrer et al., 2020).
            </li>
            <li>
              <strong>Recuperación post-estrés:</strong> menor latencia entre pico de cortisol y
              retorno a línea base frente a respiración libre.
            </li>
            <li>
              <strong>Rendimiento cognitivo:</strong> mejoras pequeñas pero replicables en
              atención sostenida y memoria de trabajo (Prinsloo et al., 2011).
            </li>
          </ul>
        ),
      },
      {
        id: "practica",
        kicker: "PRÁCTICA",
        h: "Cómo practicar",
        body: (
          <>
            <p>
              Siéntate cómodo, nariz libre, hombros bajos. Inhala 5 segundos por la nariz
              llevando el aire al abdomen — no al pecho. Exhala 5 segundos, idealmente por la
              nariz o con labios semi-cerrados. Sin forzar: si cuesta, empieza en 4+6 y construye
              hasta 5+5.
            </p>
            <p>
              La dosis con mejor evidencia es <strong>20 minutos al día, 5 días por semana,
              8 semanas</strong> (Lehrer et al., 2020). Dosis más cortas (5–10 min) funcionan
              para regulación aguda pero no mueven métricas basales con la misma magnitud.
            </p>
            <p>
              Para encontrar <em>tu</em> frecuencia resonante personal (suele estar en 5.0, 5.5,
              6.0 o 6.5 rpm) mide HRV mientras respiras 2 minutos a cada frecuencia y quédate con
              la que maximice tu RMSSD. BIO-IGNICIÓN guarda este valor en el perfil y lo usa en la
              guía de respiración.
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
            <li>No es tratamiento médico. Con hipertensión diagnosticada, coordina con tu médico: no ajustes medicación por cuenta propia.</li>
            <li>En EPOC, asma activa o embarazo avanzado, consulta antes de prolongar ciclos: la mecánica ventilatoria cambia.</li>
            <li>El efecto se pierde rápido al abandonar la práctica. Es hábito, no dosis única.</li>
            <li>"Respiración 4-7-8" y similares no son respiración resonante. Tienen sus propios efectos, distintos.</li>
          </ul>
        ),
      },
    ],

    refsLabel: "Referencias",
    refs: [
      {
        authors: "Vaschillo EG, Vaschillo B, Lehrer PM.",
        year: "2006",
        title: "Characteristics of resonance in heart rate variability stimulated by biofeedback.",
        journal: "Applied Psychophysiology and Biofeedback.",
        doi: "10.1007/s10484-006-9009-3",
      },
      {
        authors: "Lehrer P, Kaur K, Sharma A, et al.",
        year: "2020",
        title: "Heart rate variability biofeedback improves emotional and physical health and performance: a systematic review and meta-analysis.",
        journal: "Applied Psychophysiology and Biofeedback.",
        doi: "10.1007/s10484-020-09466-z",
      },
      {
        authors: "Prinsloo GE, Rauch HGL, Lambert MI, Muench F, Noakes TD, Derman WE.",
        year: "2011",
        title: "The effect of short duration heart rate variability biofeedback on cognitive performance during laboratory induced cognitive stress.",
        journal: "Applied Cognitive Psychology.",
        doi: "10.1002/acp.1750",
      },
    ],

    relatedLabel: "Siguiente lectura",
    relatedTitle: "HRV 101 — qué es y por qué importa",
    relatedBlurb: "La métrica que te dice si tu práctica está moviendo la aguja. 6 min.",

    closingKicker: "SIGUIENTE PASO",
    closingHLead: "Conoces la física.",
    closingHBody: "Velo calibrado a tu respiración.",
    closingBody:
      "30 minutos para ver cómo BIO-IGNICIÓN encuentra tu frecuencia resonante personal y te guía sesión a sesión.",
    closingPrimary: "Agenda demo",
    closingSecondary: "Biblioteca de evidencia",
    closingBack: "Volver a Aprende",

    reviewedLabel: "Última revisión",
    disclaimerLabel: "Material educativo",
    disclaimerNote: "No sustituye consulta clínica ni decisiones médicas profesionales.",
  },
  en: {
    trailBack: "LEARN",
    trailCategory: "AUTONOMIC NERVOUS SYSTEM",
    title: "Resonant breathing — why ~0.1 Hz.",
    editorial: "A mechanical resonance between heart, lungs and baroreflex.",
    lead:
      "At roughly 5.5–6.5 cycles per minute (~0.1 Hz), heart rate, blood pressure and baroreflex enter constructive phase. HRV amplitude rises not because of a subjective relaxation effect, but because that is the resonance point of the human cardiovascular system.",

    statMin: "Reading",
    statMinSub: "dense editorial",
    statCit: "References",
    statCitSub: "indexed journals",
    statRange: "Time span",
    statRangeSub: "years covered",
    statLevel: "Evidence level",
    statLevelVal: "High",
    statLevelSub: "meta-analysis with consistent effect",

    sections: [
      {
        id: "fisica",
        kicker: "PHYSICS",
        h: "The physiology behind",
        body: (
          <>
            <p>
              The baroreflex — the reflex loop that corrects blood pressure beat by beat — has an
              intrinsic delay. Breathe too fast and the correction window doesn't fit inside a
              respiratory cycle; breathe too slow and the baroreflex rests between corrections.
              At ~0.1 Hz, corrections align with inhalation and exhalation and the oscillation
              amplifies.
            </p>
            <p>
              Vaschillo et al. (2006) documented that the individual resonant frequency falls
              between 4.5 and 6.5 breaths per minute in most adults, with shifts according to
              height and lung volume. The mean value of 6 bpm (5 s in, 5 s out) is an excellent
              first approximation.
            </p>
          </>
        ),
      },
      {
        id: "efectos",
        kicker: "EFFECTS",
        h: "What effects it has",
        body: (
          <ul>
            <li>
              <strong>Blood pressure:</strong> reductions of 6–10 mmHg systolic after 8–10 weeks
              of daily practice (Lehrer et al., 2020, meta-analysis).
            </li>
            <li>
              <strong>Anxiety:</strong> moderate effects (d ≈ 0.55) on scales such as GAD-7 and
              STAI in non-clinical populations (Lehrer et al., 2020).
            </li>
            <li>
              <strong>Post-stress recovery:</strong> shorter latency between cortisol peak and
              return to baseline versus free breathing.
            </li>
            <li>
              <strong>Cognitive performance:</strong> small but replicable improvements in
              sustained attention and working memory (Prinsloo et al., 2011).
            </li>
          </ul>
        ),
      },
      {
        id: "practica",
        kicker: "PRACTICE",
        h: "How to practice",
        body: (
          <>
            <p>
              Sit comfortably, nose clear, shoulders low. Inhale 5 seconds through the nose,
              directing air to the abdomen — not the chest. Exhale 5 seconds, ideally through the
              nose or with semi-closed lips. Without forcing: if it's hard, start at 4+6 and
              build up to 5+5.
            </p>
            <p>
              The dose with the strongest evidence is <strong>20 minutes per day, 5 days per
              week, 8 weeks</strong> (Lehrer et al., 2020). Shorter doses (5–10 min) work for
              acute regulation but don't move baseline metrics to the same magnitude.
            </p>
            <p>
              To find <em>your</em> personal resonant frequency (typically 5.0, 5.5, 6.0 or
              6.5 bpm) measure HRV while breathing 2 minutes at each rate and keep the one that
              maximises RMSSD. BIO-IGNICIÓN stores this value in the profile and uses it in the
              breathing guide.
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
            <li>This is not medical treatment. With diagnosed hypertension, coordinate with your doctor: do not adjust medication on your own.</li>
            <li>In COPD, active asthma or advanced pregnancy, consult before extending cycles: ventilatory mechanics change.</li>
            <li>The effect fades quickly when the practice is dropped. It is a habit, not a single dose.</li>
            <li>"4-7-8 breathing" and similar are not resonant breathing. They have their own, distinct effects.</li>
          </ul>
        ),
      },
    ],

    refsLabel: "References",
    refs: [
      {
        authors: "Vaschillo EG, Vaschillo B, Lehrer PM.",
        year: "2006",
        title: "Characteristics of resonance in heart rate variability stimulated by biofeedback.",
        journal: "Applied Psychophysiology and Biofeedback.",
        doi: "10.1007/s10484-006-9009-3",
      },
      {
        authors: "Lehrer P, Kaur K, Sharma A, et al.",
        year: "2020",
        title: "Heart rate variability biofeedback improves emotional and physical health and performance: a systematic review and meta-analysis.",
        journal: "Applied Psychophysiology and Biofeedback.",
        doi: "10.1007/s10484-020-09466-z",
      },
      {
        authors: "Prinsloo GE, Rauch HGL, Lambert MI, Muench F, Noakes TD, Derman WE.",
        year: "2011",
        title: "The effect of short duration heart rate variability biofeedback on cognitive performance during laboratory induced cognitive stress.",
        journal: "Applied Cognitive Psychology.",
        doi: "10.1002/acp.1750",
      },
    ],

    relatedLabel: "Next read",
    relatedTitle: "HRV 101 — what it is and why it matters",
    relatedBlurb: "The metric that tells you if your practice is moving the needle. 6 min.",

    closingKicker: "NEXT STEP",
    closingHLead: "You know the physics.",
    closingHBody: "See it tuned to your breath.",
    closingBody:
      "30 minutes to watch BIO-IGNICIÓN find your personal resonant frequency and guide you session by session.",
    closingPrimary: "Book a demo",
    closingSecondary: "Evidence library",
    closingBack: "Back to Learn",

    reviewedLabel: "Last reviewed",
    disclaimerLabel: "Educational material",
    disclaimerNote: "Does not replace clinical consultation or professional medical decisions.",
  },
};

export default async function ResonantePage() {
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

      <section aria-labelledby="resonant-closing" className="bi-demo-closing-section">
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

              <h2 id="resonant-closing" className="bi-demo-closing-h">
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
