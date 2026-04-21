import Link from "next/link";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font, bioSignal, radius } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";
import PerformanceRing from "./PerformanceRing";
import StrainJournal from "./StrainJournal";

export const metadata = {
  title: "BIO-IGNICIÓN · Performance tracking for human systems",
  description: "Daily readiness, strain journal, team scorecard. Precision without gimmicks.",
  alternates: { canonical: "/home-v3" },
  robots: { index: false, follow: false },
};

const COPY = {
  es: {
    badge: "SISTEMA · ACTIVO",
    h1a: "DAILY",
    h1b: "READINESS",
    h1c: "SCORE",
    sub: "Medí cómo responde tu sistema nervioso. Leé tu strain. Ajustá tu siguiente jugada. Sin inventar — sin ocultar.",
    cta1: "EMPEZAR AHORA",
    cta2: "VER PROTOCOLO",

    statsEyebrow: "NÚMEROS QUE IMPORTAN",
    stats: [
      { k: "21.0", unit: "STRAIN", desc: "Escala diaria 0-21. Calibrada contra HRV individual." },
      { k: "100", unit: "RECOVERY %", desc: "Índice compuesto: HRV, sueño, respiración, carga previa." },
      { k: "k≥5", unit: "PRIVACIDAD", desc: "El panel de equipo nunca expone lecturas individuales." },
    ],

    scoreEyebrow: "TU DÍA · LEÍDO EN 3 ANILLOS",
    scoreH: "CADA MARCADOR TIENE UNA EXPLICACIÓN.",
    scoreBody: "No son recompensas. Son señales interpretables. Si no sabemos por qué subió o bajó, no lo mostramos.",
    rings: [
      { label: "READINESS", sub: "NEURAL RECOVERY", value: 78 },
      { label: "STRAIN", sub: "DAILY LOAD", value: 54, color: bioSignal.neuralViolet },
      { label: "SLEEP", sub: "QUALITY INDEX", value: 86, color: bioSignal.ignition },
    ],

    journalEyebrow: "STRAIN JOURNAL",
    journalH: "SIETE DÍAS.",
    journalHEm: "UN PATRÓN.",
    journalBody: "Cada barra es una sesión. Cada punto, recovery al despertar. La línea trazas lo que tu cuerpo hizo, no lo que dijiste que hiciste.",
    journalWeek: "ESTA SEMANA · STRAIN MEDIO",
    journalAvg: "AVG STRAIN",
    journalBar: "STRAIN POR DÍA",
    journalDot: "RECOVERY AL DESPERTAR",

    coachEyebrow: "COACHING · NO GENÉRICO",
    coachTitle: "TU SISTEMA PIDE 7:30 DE SUEÑO ESTA NOCHE.",
    coachSub: "Basado en tu strain acumulado (54.1), HRV promedio de 7 días (62ms) y tu objetivo del viernes.",
    coachBullets: [
      "Sesión de respiración resonante a las 22:15",
      "Evita cafeína después de las 14:00",
      "Mañana: protocolo ENFOQUE a las 07:40",
    ],
    coachNote: "ALGORITMO · EXPLICABLE · AUDITABLE",

    teamEyebrow: "EQUIPO · SCORECARD",
    teamH: "CADA COHORTE, SU PROPIA HUELLA.",
    teamBody: "Ranking, no para competir. Para detectar drift temprano — cuándo un departamento entero se va de rango.",
    teamCohorts: [
      { name: "ING", n: 42, readiness: 76, strain: 13.2, color: bioSignal.phosphorCyan },
      { name: "OPS", n: 28, readiness: 68, strain: 15.8, color: bioSignal.neuralViolet },
      { name: "SALES", n: 34, readiness: 71, strain: 14.1, color: bioSignal.plasmaPink },
      { name: "EXEC", n: 12, readiness: 58, strain: 17.4, color: bioSignal.signalAmber },
    ],
    teamN: "MIEMBROS",
    teamReadiness: "READINESS",
    teamStrain: "STRAIN",
    teamNote: "k ≥ 5 · AGREGADOS · NUNCA INDIVIDUAL",

    protocolsEyebrow: "PROTOCOLOS",
    protocols: [
      { t: "CALMA", d: "HRV ↑, cortisol ↓", strain: "BAJO" },
      { t: "ENFOQUE", d: "Coherencia + binaural 14Hz", strain: "MEDIO" },
      { t: "ENERGÍA", d: "Activación + binaural 40Hz", strain: "ALTO" },
      { t: "RESET", d: "Post-estrés · 4-7-8", strain: "BAJO" },
    ],

    streakEyebrow: "STREAK · 21 DÍAS",
    streakH: "EL HÁBITO ES EL ALGORITMO.",
    streakBody: "Después de 3 semanas consecutivas, el modelo empieza a predecir tu próximo día antes de que lo vivas.",

    trustEyebrow: "SEGURIDAD · CUMPLIMIENTO",
    trustH: "TUS DATOS NO SE VENDEN. NUNCA.",
    trustItems: [
      { t: "SOC 2 · SSO", d: "Okta · Azure AD · Google." },
      { t: "DPA · SCCs", d: "Residencia US · EU · APAC · LATAM." },
      { t: "k-ANONYMITY", d: "Buckets n<5 colapsan antes de salir del server." },
      { t: "TLS 1.3 · AES-256", d: "En tránsito y en reposo. IDB cifrado en cliente." },
    ],

    finalEyebrow: "DEMO · 30 MIN",
    finalH: "VE TU SCORE EN VIVO.",
    finalBody: "Corremos un protocolo con vos. Leés tu HRV, tu strain, tu readiness. Sin slides.",
    finalCta1: "AGENDAR DEMO",
    finalCta2: "PRICING",
  },
  en: {
    badge: "SYSTEM · LIVE",
    h1a: "DAILY",
    h1b: "READINESS",
    h1c: "SCORE",
    sub: "Measure how your nervous system responds. Read your strain. Adjust your next move. Nothing invented — nothing hidden.",
    cta1: "START NOW",
    cta2: "SEE PROTOCOL",

    statsEyebrow: "NUMBERS THAT MATTER",
    stats: [
      { k: "21.0", unit: "STRAIN", desc: "Daily 0-21 scale. Calibrated against individual HRV." },
      { k: "100", unit: "RECOVERY %", desc: "Composite index: HRV, sleep, breath, prior load." },
      { k: "k≥5", unit: "PRIVACY", desc: "Team panel never exposes individual readings." },
    ],

    scoreEyebrow: "YOUR DAY · READ IN 3 RINGS",
    scoreH: "EVERY MARKER HAS AN EXPLANATION.",
    scoreBody: "Not rewards. Interpretable signals. If we can't explain the delta, we don't show it.",
    rings: [
      { label: "READINESS", sub: "NEURAL RECOVERY", value: 78 },
      { label: "STRAIN", sub: "DAILY LOAD", value: 54, color: bioSignal.neuralViolet },
      { label: "SLEEP", sub: "QUALITY INDEX", value: 86, color: bioSignal.ignition },
    ],

    journalEyebrow: "STRAIN JOURNAL",
    journalH: "SEVEN DAYS.",
    journalHEm: "ONE PATTERN.",
    journalBody: "Each bar is a session. Each dot, recovery on waking. The line traces what your body did — not what you said you did.",
    journalWeek: "THIS WEEK · AVG STRAIN",
    journalAvg: "AVG STRAIN",
    journalBar: "STRAIN BY DAY",
    journalDot: "RECOVERY ON WAKING",

    coachEyebrow: "COACHING · NOT GENERIC",
    coachTitle: "YOUR SYSTEM NEEDS 7:30 OF SLEEP TONIGHT.",
    coachSub: "Based on accumulated strain (54.1), 7-day HRV avg (62ms), and your Friday target.",
    coachBullets: [
      "Resonant breathing session at 10:15 PM",
      "Avoid caffeine after 2:00 PM",
      "Tomorrow: FOCUS protocol at 7:40 AM",
    ],
    coachNote: "ALGORITHM · EXPLAINABLE · AUDITABLE",

    teamEyebrow: "TEAM · SCORECARD",
    teamH: "EVERY COHORT, ITS OWN SIGNATURE.",
    teamBody: "Ranking — not to compete. To detect drift early: when a whole department falls out of range.",
    teamCohorts: [
      { name: "ENG", n: 42, readiness: 76, strain: 13.2, color: bioSignal.phosphorCyan },
      { name: "OPS", n: 28, readiness: 68, strain: 15.8, color: bioSignal.neuralViolet },
      { name: "SALES", n: 34, readiness: 71, strain: 14.1, color: bioSignal.plasmaPink },
      { name: "EXEC", n: 12, readiness: 58, strain: 17.4, color: bioSignal.signalAmber },
    ],
    teamN: "MEMBERS",
    teamReadiness: "READINESS",
    teamStrain: "STRAIN",
    teamNote: "k ≥ 5 · AGGREGATED · NEVER INDIVIDUAL",

    protocolsEyebrow: "PROTOCOLS",
    protocols: [
      { t: "CALM", d: "HRV ↑, cortisol ↓", strain: "LOW" },
      { t: "FOCUS", d: "Coherence + binaural 14Hz", strain: "MID" },
      { t: "ENERGY", d: "Activation + binaural 40Hz", strain: "HIGH" },
      { t: "RESET", d: "Post-stress · 4-7-8", strain: "LOW" },
    ],

    streakEyebrow: "STREAK · 21 DAYS",
    streakH: "THE HABIT IS THE ALGORITHM.",
    streakBody: "After 3 consecutive weeks, the model starts predicting your next day before you live it.",

    trustEyebrow: "SECURITY · COMPLIANCE",
    trustH: "YOUR DATA IS NEVER SOLD.",
    trustItems: [
      { t: "SOC 2 · SSO", d: "Okta · Azure AD · Google." },
      { t: "DPA · SCCs", d: "Residency US · EU · APAC · LATAM." },
      { t: "k-ANONYMITY", d: "Buckets n<5 collapse before leaving the server." },
      { t: "TLS 1.3 · AES-256", d: "In transit and at rest. Encrypted client IDB." },
    ],

    finalEyebrow: "DEMO · 30 MIN",
    finalH: "SEE YOUR SCORE LIVE.",
    finalBody: "We run a protocol with you. You read your HRV, strain, readiness. No slides.",
    finalCta1: "BOOK DEMO",
    finalCta2: "PRICING",
  },
};

export default async function HomeV3Page() {
  const locale = await getServerLocale();
  const T = COPY[locale === "en" ? "en" : "es"];

  return (
    <PublicShell activePath="/home-v3">
      {/* HERO */}
      <section style={{
        position: "relative",
        minBlockSize: "calc(100dvh - 88px)",
        background: bioSignal.deepField,
        color: cssVar.text,
        overflow: "hidden",
        isolation: "isolate",
      }}>
        <div aria-hidden style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: `
            linear-gradient(180deg, transparent 0%, ${bioSignal.deepField} 80%),
            repeating-linear-gradient(0deg, ${cssVar.border} 0px, ${cssVar.border} 1px, transparent 1px, transparent 80px),
            repeating-linear-gradient(90deg, ${cssVar.border} 0px, ${cssVar.border} 1px, transparent 1px, transparent 80px)
          `,
          opacity: 0.4,
        }} />
        <div aria-hidden style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: `radial-gradient(50% 40% at 50% 40%, ${bioSignal.phosphorCyan}22, transparent 70%)`,
        }} />
        <Container size="xl" style={{
          position: "relative", zIndex: 1,
          paddingBlock: space[16],
          display: "grid", placeItems: "center",
          minBlockSize: "calc(100dvh - 88px)",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: space[10],
            alignItems: "center",
            width: "100%",
          }}>
            <div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: space[2],
                padding: `${space[2]}px ${space[3]}px`,
                border: `1px solid ${bioSignal.phosphorCyan}`,
                background: `color-mix(in srgb, ${bioSignal.phosphorCyan} 8%, transparent)`,
                color: bioSignal.phosphorCyan,
                fontFamily: cssVar.fontMono,
                fontSize: font.size.xs,
                textTransform: "uppercase", letterSpacing: font.tracking.caps,
                fontWeight: font.weight.black,
                marginBlockEnd: space[6],
              }}>
                <span style={{
                  width: 6, height: 6,
                  background: bioSignal.phosphorCyan,
                  boxShadow: `0 0 12px ${bioSignal.phosphorCyan}`,
                }} />
                {T.badge}
              </div>

              <h1 style={{
                margin: 0,
                fontSize: "clamp(56px, 9vw, 128px)",
                lineHeight: 0.92,
                letterSpacing: "-0.04em",
                fontWeight: font.weight.black,
                fontFamily: cssVar.fontMono,
                textTransform: "uppercase",
              }}>
                <div>{T.h1a}</div>
                <div style={{
                  background: `linear-gradient(90deg, ${bioSignal.phosphorCyan}, ${bioSignal.neuralViolet})`,
                  WebkitBackgroundClip: "text", backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                  {T.h1b}
                </div>
                <div style={{ color: cssVar.textDim }}>{T.h1c}</div>
              </h1>

              <p style={{
                marginBlockStart: space[6],
                maxInlineSize: 460,
                fontSize: font.size.lg, lineHeight: 1.55,
                color: cssVar.textDim,
              }}>
                {T.sub}
              </p>

              <div style={{
                marginBlockStart: space[8],
                display: "inline-flex", gap: space[3], flexWrap: "wrap",
              }}>
                <Link href="/demo" style={{
                  padding: `${space[3]}px ${space[6]}px`,
                  background: bioSignal.phosphorCyan,
                  color: bioSignal.deepField,
                  textDecoration: "none",
                  fontWeight: font.weight.black,
                  fontFamily: cssVar.fontMono,
                  fontSize: font.size.md,
                  textTransform: "uppercase", letterSpacing: font.tracking.caps,
                  border: `2px solid ${bioSignal.phosphorCyan}`,
                  boxShadow: `0 0 24px ${bioSignal.phosphorCyan}80`,
                }}>
                  {T.cta1}
                </Link>
                <Link href="/evidencia" style={{
                  padding: `${space[3]}px ${space[5]}px`,
                  background: "transparent",
                  color: cssVar.text,
                  textDecoration: "none",
                  fontWeight: font.weight.bold,
                  fontFamily: cssVar.fontMono,
                  fontSize: font.size.md,
                  textTransform: "uppercase", letterSpacing: font.tracking.caps,
                  border: `2px solid ${cssVar.borderStrong}`,
                }}>
                  {T.cta2}
                </Link>
              </div>
            </div>

            <div style={{ display: "grid", placeItems: "center" }}>
              <PerformanceRing value={78} label="READINESS" sub="TODAY · LIVE" size={360} />
            </div>
          </div>
        </Container>
      </section>

      {/* STATS STRIP */}
      <section style={{
        background: bioSignal.deepField,
        borderBlock: `1px solid ${cssVar.border}`,
        paddingBlock: space[10],
      }}>
        <Container size="xl">
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 0,
            alignItems: "center",
          }}>
            {T.stats.map((s, i) => (
              <div key={i} style={{
                padding: `${space[5]}px ${space[6]}px`,
                borderInlineEnd: i < T.stats.length - 1 ? `1px solid ${cssVar.border}` : "none",
              }}>
                <div style={{
                  fontSize: "clamp(44px, 5vw, 72px)",
                  lineHeight: 1,
                  fontFamily: cssVar.fontMono,
                  fontWeight: font.weight.black,
                  letterSpacing: "-0.04em",
                  color: cssVar.text,
                }}>
                  {s.k}
                </div>
                <div style={{
                  marginBlockStart: space[2],
                  fontFamily: cssVar.fontMono, fontSize: font.size.xs,
                  color: bioSignal.phosphorCyan,
                  textTransform: "uppercase", letterSpacing: font.tracking.caps,
                  fontWeight: font.weight.black,
                }}>
                  {s.unit}
                </div>
                <div style={{
                  marginBlockStart: space[2],
                  fontSize: font.size.sm, lineHeight: 1.5,
                  color: cssVar.textDim,
                }}>
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 3 RINGS SCORECARD */}
      <section style={{ background: bioSignal.deepField, paddingBlock: space[20], paddingInline: space[5] }}>
        <Container size="xl">
          <SectionLabel>{T.scoreEyebrow}</SectionLabel>
          <SectionTitle>{T.scoreH}</SectionTitle>
          <p style={{
            marginBlockStart: space[5], maxInlineSize: 640,
            fontSize: font.size.lg, color: cssVar.textDim, lineHeight: 1.6,
          }}>
            {T.scoreBody}
          </p>

          <div style={{
            marginBlockStart: space[12],
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: space[10],
            justifyItems: "center",
          }}>
            {T.rings.map((r, i) => (
              <div key={i} style={{ display: "grid", placeItems: "center", gap: space[3] }}>
                <PerformanceRing value={r.value} label={r.label} sub={r.sub} color={r.color} size={240} delay={i * 0.15} />
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* STRAIN JOURNAL */}
      <section style={{
        background: bioSignal.deepField,
        borderBlockStart: `1px solid ${cssVar.border}`,
        paddingBlock: space[20], paddingInline: space[5],
      }}>
        <Container size="xl">
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: space[10], alignItems: "center",
          }}>
            <div>
              <SectionLabel>{T.journalEyebrow}</SectionLabel>
              <h2 style={{
                margin: `${space[4]}px 0 0`,
                fontSize: "clamp(36px, 5vw, 64px)",
                lineHeight: 1,
                fontFamily: cssVar.fontMono,
                fontWeight: font.weight.black,
                letterSpacing: "-0.03em",
                textTransform: "uppercase",
                color: cssVar.text,
              }}>
                {T.journalH}{" "}
                <span style={{ color: bioSignal.phosphorCyan }}>{T.journalHEm}</span>
              </h2>
              <p style={{
                marginBlockStart: space[5],
                fontSize: font.size.lg, color: cssVar.textDim, lineHeight: 1.6,
              }}>
                {T.journalBody}
              </p>
            </div>
            <StrainJournal T={T} />
          </div>
        </Container>
      </section>

      {/* COACHING CARD */}
      <section style={{ background: bioSignal.deepField, paddingBlock: space[16], paddingInline: space[5] }}>
        <Container size="lg">
          <SectionLabel>{T.coachEyebrow}</SectionLabel>
          <div style={{
            marginBlockStart: space[5],
            padding: space[8],
            borderRadius: radius.lg,
            background: `linear-gradient(135deg, ${bioSignal.phosphorCyan}14, transparent 60%), ${cssVar.surface}`,
            border: `1px solid ${bioSignal.phosphorCyan}`,
            boxShadow: `0 30px 80px -40px ${bioSignal.phosphorCyan}60, inset 0 1px 0 0 ${bioSignal.phosphorCyan}22`,
            position: "relative", overflow: "hidden",
          }}>
            <h2 style={{
              margin: 0,
              fontSize: "clamp(28px, 4vw, 44px)",
              lineHeight: 1.1,
              fontFamily: cssVar.fontMono,
              fontWeight: font.weight.black,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              color: cssVar.text,
            }}>
              {T.coachTitle}
            </h2>
            <p style={{
              marginBlockStart: space[4],
              fontSize: font.size.lg, color: cssVar.textDim, lineHeight: 1.6,
            }}>
              {T.coachSub}
            </p>
            <ul style={{
              marginBlockStart: space[6], padding: 0, listStyle: "none",
              display: "grid", gap: space[2],
            }}>
              {T.coachBullets.map((b, i) => (
                <li key={i} style={{
                  display: "grid", gridTemplateColumns: "auto 1fr", gap: space[3],
                  padding: space[3],
                  borderRadius: radius.md,
                  background: cssVar.surface2,
                  border: `1px solid ${cssVar.border}`,
                  alignItems: "center",
                }}>
                  <span style={{
                    fontFamily: cssVar.fontMono,
                    fontSize: font.size.sm, fontWeight: font.weight.black,
                    color: bioSignal.phosphorCyan,
                    minInlineSize: 28,
                  }}>
                    0{i + 1}
                  </span>
                  <span style={{ color: cssVar.text, fontSize: font.size.md, fontWeight: font.weight.semibold }}>
                    {b}
                  </span>
                </li>
              ))}
            </ul>
            <div style={{
              marginBlockStart: space[6],
              paddingBlockStart: space[4],
              borderBlockStart: `1px dashed ${cssVar.border}`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
              fontFamily: cssVar.fontMono, fontSize: font.size.xs,
              color: cssVar.textMuted,
              textTransform: "uppercase", letterSpacing: font.tracking.caps,
            }}>
              <span>{T.coachNote}</span>
              <span style={{ color: bioSignal.phosphorCyan }}>● {T.badge.split("·")[1].trim()}</span>
            </div>
          </div>
        </Container>
      </section>

      {/* TEAM SCORECARD */}
      <section style={{
        background: bioSignal.deepField,
        borderBlockStart: `1px solid ${cssVar.border}`,
        paddingBlock: space[20], paddingInline: space[5],
      }}>
        <Container size="xl">
          <SectionLabel>{T.teamEyebrow}</SectionLabel>
          <h2 style={{
            margin: `${space[4]}px 0 0`,
            fontSize: "clamp(32px, 4.5vw, 56px)",
            lineHeight: 1.05,
            fontFamily: cssVar.fontMono,
            fontWeight: font.weight.black,
            letterSpacing: "-0.03em",
            textTransform: "uppercase",
            color: cssVar.text,
            maxInlineSize: 680,
          }}>
            {T.teamH}
          </h2>
          <p style={{
            marginBlockStart: space[4], maxInlineSize: 640,
            fontSize: font.size.lg, color: cssVar.textDim, lineHeight: 1.6,
          }}>
            {T.teamBody}
          </p>

          <div style={{
            marginBlockStart: space[10],
            border: `1px solid ${cssVar.border}`,
            borderRadius: radius.lg,
            overflow: "hidden",
            background: cssVar.surface,
          }}>
            {/* Head */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "80px 1fr 2fr 2fr",
              padding: `${space[3]}px ${space[5]}px`,
              background: cssVar.surface2,
              borderBlockEnd: `1px solid ${cssVar.border}`,
              fontFamily: cssVar.fontMono, fontSize: font.size.xs,
              textTransform: "uppercase", letterSpacing: font.tracking.caps,
              color: cssVar.textMuted, fontWeight: font.weight.black,
              gap: space[4],
            }}>
              <span>#</span>
              <span>{T.teamN}</span>
              <span>{T.teamReadiness}</span>
              <span>{T.teamStrain}</span>
            </div>
            {T.teamCohorts.map((c, i) => (
              <div key={i} style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr 2fr 2fr",
                padding: `${space[4]}px ${space[5]}px`,
                borderBlockEnd: i < T.teamCohorts.length - 1 ? `1px solid ${cssVar.border}` : "none",
                alignItems: "center",
                gap: space[4],
              }}>
                <div style={{
                  fontFamily: cssVar.fontMono, fontSize: font.size.xl,
                  color: cssVar.text, fontWeight: font.weight.black,
                  letterSpacing: font.tracking.wide,
                }}>
                  {c.name}
                </div>
                <div style={{
                  fontFamily: cssVar.fontMono, fontSize: font.size.sm,
                  color: cssVar.textDim,
                }}>
                  n = {c.n}
                </div>
                <BarCell value={c.readiness} max={100} color={c.color} />
                <BarCell value={c.strain} max={21} color={bioSignal.neuralViolet} decimals={1} />
              </div>
            ))}
          </div>
          <div style={{
            marginBlockStart: space[4],
            fontFamily: cssVar.fontMono, fontSize: font.size.xs,
            color: cssVar.textMuted,
            textTransform: "uppercase", letterSpacing: font.tracking.caps,
            textAlign: "end",
          }}>
            {T.teamNote}
          </div>
        </Container>
      </section>

      {/* PROTOCOLS GRID */}
      <section style={{ background: bioSignal.deepField, paddingBlock: space[20], paddingInline: space[5], borderBlockStart: `1px solid ${cssVar.border}` }}>
        <Container size="xl">
          <SectionLabel>{T.protocolsEyebrow}</SectionLabel>
          <div style={{
            marginBlockStart: space[8],
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: space[3],
          }}>
            {T.protocols.map((p, i) => (
              <div key={i} style={{
                padding: space[5],
                border: `1px solid ${cssVar.border}`,
                background: cssVar.surface,
                position: "relative",
                minBlockSize: 180,
                display: "flex", flexDirection: "column", justifyContent: "space-between",
              }}>
                <div style={{
                  position: "absolute", top: space[3], insetInlineEnd: space[3],
                  padding: `${space[1]}px ${space[2]}px`,
                  border: `1px solid ${cssVar.border}`,
                  fontFamily: cssVar.fontMono, fontSize: 10,
                  textTransform: "uppercase", letterSpacing: font.tracking.caps,
                  color: cssVar.textMuted, fontWeight: font.weight.black,
                }}>
                  {p.strain}
                </div>
                <div style={{
                  fontFamily: cssVar.fontMono, fontSize: "clamp(28px, 3.5vw, 40px)",
                  fontWeight: font.weight.black,
                  color: cssVar.text,
                  letterSpacing: "-0.03em",
                }}>
                  {p.t}
                </div>
                <div style={{
                  fontFamily: cssVar.fontMono, fontSize: font.size.sm,
                  color: cssVar.textDim,
                  textTransform: "uppercase", letterSpacing: font.tracking.wide,
                }}>
                  {p.d}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* STREAK */}
      <section style={{ background: bioSignal.deepField, paddingBlock: space[16], paddingInline: space[5], borderBlockStart: `1px solid ${cssVar.border}` }}>
        <Container size="lg">
          <SectionLabel>{T.streakEyebrow}</SectionLabel>
          <h2 style={{
            margin: `${space[4]}px 0 0`,
            fontSize: "clamp(32px, 4vw, 52px)",
            lineHeight: 1,
            fontFamily: cssVar.fontMono,
            fontWeight: font.weight.black,
            letterSpacing: "-0.03em",
            textTransform: "uppercase",
            color: cssVar.text,
          }}>
            {T.streakH}
          </h2>
          <p style={{
            marginBlockStart: space[4], maxInlineSize: 640,
            fontSize: font.size.lg, color: cssVar.textDim, lineHeight: 1.6,
          }}>
            {T.streakBody}
          </p>

          <div style={{
            marginBlockStart: space[8],
            display: "grid",
            gridTemplateColumns: "repeat(21, 1fr)",
            gap: 4,
          }}>
            {Array.from({ length: 21 }).map((_, i) => {
              const intensity = [1, 0.85, 1, 0.7, 1, 1, 0.9, 1, 0.6, 1, 1, 1, 0.85, 1, 1, 0.75, 1, 1, 1, 0.9, 1][i];
              return (
                <div key={i} style={{
                  aspectRatio: "1",
                  background: `color-mix(in srgb, ${bioSignal.phosphorCyan} ${intensity * 60}%, ${bioSignal.deepField})`,
                  border: `1px solid ${bioSignal.phosphorCyan}40`,
                  boxShadow: intensity > 0.8 ? `0 0 8px ${bioSignal.phosphorCyan}60` : "none",
                }} />
              );
            })}
          </div>
        </Container>
      </section>

      {/* TRUST */}
      <section style={{ background: cssVar.surface, paddingBlock: space[20], paddingInline: space[5], borderBlock: `1px solid ${cssVar.border}` }}>
        <Container size="xl">
          <SectionLabel>{T.trustEyebrow}</SectionLabel>
          <h2 style={{
            margin: `${space[4]}px 0 0`,
            fontSize: "clamp(32px, 4.5vw, 56px)",
            lineHeight: 1,
            fontFamily: cssVar.fontMono,
            fontWeight: font.weight.black,
            letterSpacing: "-0.03em",
            textTransform: "uppercase",
            color: cssVar.text,
            maxInlineSize: 700,
          }}>
            {T.trustH}
          </h2>

          <div style={{
            marginBlockStart: space[10],
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 0,
          }}>
            {T.trustItems.map((it, i) => (
              <div key={i} style={{
                padding: space[5],
                borderInlineEnd: i < T.trustItems.length - 1 ? `1px solid ${cssVar.border}` : "none",
              }}>
                <div style={{
                  fontFamily: cssVar.fontMono, fontSize: font.size.sm,
                  color: bioSignal.phosphorCyan,
                  textTransform: "uppercase", letterSpacing: font.tracking.caps,
                  fontWeight: font.weight.black,
                  marginBlockEnd: space[2],
                }}>
                  {it.t}
                </div>
                <p style={{
                  margin: 0, fontSize: font.size.md,
                  color: cssVar.textDim, lineHeight: 1.55,
                }}>
                  {it.d}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* FINAL CTA */}
      <section style={{
        background: bioSignal.deepField,
        paddingBlock: space[20], paddingInline: space[5],
        position: "relative", overflow: "hidden",
      }}>
        <div aria-hidden style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: `radial-gradient(70% 80% at 50% 100%, ${bioSignal.phosphorCyan}22, transparent 65%)`,
        }} />
        <Container size="md" style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <div style={{
            fontFamily: cssVar.fontMono, fontSize: font.size.xs,
            color: bioSignal.phosphorCyan,
            textTransform: "uppercase", letterSpacing: font.tracking.caps,
            fontWeight: font.weight.black,
            marginBlockEnd: space[5],
          }}>
            {T.finalEyebrow}
          </div>
          <h2 style={{
            margin: 0,
            fontSize: "clamp(48px, 8vw, 104px)",
            lineHeight: 0.95,
            fontFamily: cssVar.fontMono,
            fontWeight: font.weight.black,
            letterSpacing: "-0.04em",
            textTransform: "uppercase",
            color: cssVar.text,
          }}>
            {T.finalH}
          </h2>
          <p style={{
            marginBlockStart: space[5], marginInline: "auto",
            maxInlineSize: 580,
            fontSize: font.size.xl, color: cssVar.textDim, lineHeight: 1.55,
          }}>
            {T.finalBody}
          </p>
          <div style={{
            marginBlockStart: space[8],
            display: "inline-flex", gap: space[3], flexWrap: "wrap", justifyContent: "center",
          }}>
            <Link href="/demo" style={{
              padding: `${space[3]}px ${space[6]}px`,
              background: bioSignal.phosphorCyan,
              color: bioSignal.deepField,
              textDecoration: "none",
              fontWeight: font.weight.black,
              fontFamily: cssVar.fontMono,
              fontSize: font.size.md,
              textTransform: "uppercase", letterSpacing: font.tracking.caps,
              border: `2px solid ${bioSignal.phosphorCyan}`,
              boxShadow: `0 0 24px ${bioSignal.phosphorCyan}80`,
            }}>
              {T.finalCta1}
            </Link>
            <Link href="/pricing" style={{
              padding: `${space[3]}px ${space[5]}px`,
              background: "transparent",
              color: cssVar.text,
              textDecoration: "none",
              fontWeight: font.weight.bold,
              fontFamily: cssVar.fontMono,
              fontSize: font.size.md,
              textTransform: "uppercase", letterSpacing: font.tracking.caps,
              border: `2px solid ${cssVar.borderStrong}`,
            }}>
              {T.finalCta2}
            </Link>
          </div>
        </Container>
      </section>
    </PublicShell>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: space[2],
      fontFamily: cssVar.fontMono, fontSize: font.size.xs,
      color: bioSignal.phosphorCyan,
      textTransform: "uppercase", letterSpacing: font.tracking.caps,
      fontWeight: font.weight.black,
    }}>
      <span aria-hidden style={{
        width: 24, height: 2,
        background: bioSignal.phosphorCyan,
        boxShadow: `0 0 8px ${bioSignal.phosphorCyan}`,
      }} />
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 style={{
      margin: `${space[4]}px 0 0`,
      fontSize: "clamp(32px, 4.5vw, 56px)",
      lineHeight: 1.02,
      fontFamily: cssVar.fontMono,
      fontWeight: font.weight.black,
      letterSpacing: "-0.03em",
      textTransform: "uppercase",
      color: cssVar.text,
      maxInlineSize: 720,
    }}>
      {children}
    </h2>
  );
}

function BarCell({ value, max, color, decimals = 0 }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 52px", gap: space[3], alignItems: "center" }}>
      <div style={{
        position: "relative", height: 10,
        background: cssVar.surface2,
        border: `1px solid ${cssVar.border}`,
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", insetBlock: 0, insetInlineStart: 0,
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}, ${color}aa)`,
          boxShadow: `0 0 12px ${color}80`,
        }} />
      </div>
      <span style={{
        fontFamily: cssVar.fontMono, fontSize: font.size.sm,
        color: cssVar.text, fontWeight: font.weight.black,
        textAlign: "end",
      }}>
        {decimals ? value.toFixed(decimals) : value}
      </span>
    </div>
  );
}
