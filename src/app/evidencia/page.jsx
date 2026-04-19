/* ═══════════════════════════════════════════════════════════════
   /evidencia — Biblioteca pública de evidencia científica.

   Server-component: lista todos los estudios citados en el registro
   local (`lib/evidence.js`) con autor, año, revista, N y tamaño de
   efecto cuando están disponibles. Ningún claim sin cita.

   Esta ruta existe para ser linkeable (desde dentro de la app, pero
   también desde mercadotecnia y el footer público). Un profesional
   debe poder auditar la ciencia sin crear cuenta.
   ═══════════════════════════════════════════════════════════════ */

import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font, radius } from "@/components/ui/tokens";
import { EVIDENCE } from "../../lib/evidence";
import { getServerLocale } from "@/lib/locale-server";

export const metadata = {
  title: "Evidencia científica · BIO-IGNICIÓN",
  description:
    "Estudios revisados por pares detrás de cada protocolo. Efectos reportados, tamaños de muestra y DOIs — sin claims sin cita.",
  alternates: { canonical: "/evidencia" },
  openGraph: {
    title: "BIO-IGNICIÓN · Evidencia",
    description: "Estudios revisados por pares detrás de cada protocolo.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
};

const COPY = {
  es: {
    eyebrow: "Biblioteca",
    title: "Evidencia científica",
    intro:
      "Cada protocolo se apoya en literatura publicada y revisada por pares. Esta biblioteca lista mecanismos, estudios, tamaños de muestra y efectos reportados. Los niveles están auto-clasificados de forma conservadora — revisamos y degradamos cuando la evidencia no justifica lo que una app suele prometer.",
    protocolsN: (n) => `${n} protocolos`,
    studiesN: (n) => `${n} estudios`,
    highN: (n) => `${n} · evidencia alta`,
    moderateN: (n) => `${n} · moderada`,
    limitedN: (n) => `${n} · limitada`,
    toc: "Protocolos",
    levelHigh: "Evidencia alta",
    levelModerate: "Evidencia moderada",
    levelLimited: "Evidencia limitada",
    mechanism: "Mecanismo",
    expect: "Qué esperar",
    limitation: "Limitación",
    studies: (n) => `Estudios (${n})`,
    anchor: "Copiar enlace directo",
    openDoi: "Abrir DOI",
    updateNote: (
      <>
        ¿Falta un estudio o ves un claim mal calibrado? Abre un issue en el
        repositorio público. Esta página se genera desde el mismo archivo
        (<code>src/lib/evidence.js</code>) que consume el producto — corregir
        aquí corrige la app.
      </>
    ),
  },
  en: {
    eyebrow: "Library",
    title: "Scientific evidence",
    intro:
      "Every protocol rests on published, peer-reviewed literature. This library lists mechanisms, studies, sample sizes and reported effects. Levels are auto-classified conservatively — we downgrade whenever the evidence doesn't warrant what apps usually promise.",
    protocolsN: (n) => `${n} protocols`,
    studiesN: (n) => `${n} studies`,
    highN: (n) => `${n} · high evidence`,
    moderateN: (n) => `${n} · moderate`,
    limitedN: (n) => `${n} · limited`,
    toc: "Protocols",
    levelHigh: "High evidence",
    levelModerate: "Moderate evidence",
    levelLimited: "Limited evidence",
    mechanism: "Mechanism",
    expect: "What to expect",
    limitation: "Limitation",
    studies: (n) => `Studies (${n})`,
    anchor: "Copy direct link",
    openDoi: "Open DOI",
    updateNote: (
      <>
        Missing a study or see a miscalibrated claim? Open an issue in the
        public repo. This page is generated from the same file
        (<code>src/lib/evidence.js</code>) the product reads — fixing it here
        fixes the app.
      </>
    ),
  },
};

const LEVEL_COLOR = {
  high: "#059669",
  moderate: "#6366F1",
  limited: "#D97706",
};

const PILL_VARIANT = {
  high: { bg: "#DCFCE7", fg: "#166534" },
  moderate: { bg: "#E0E7FF", fg: "#3730A3" },
  limited: { bg: "#FEF3C7", fg: "#854D0E" },
};

const LEVEL_ORDER = ["high", "moderate", "limited"];

export default async function EvidenciaPage() {
  const locale = await getServerLocale();
  const c = COPY[locale === "en" ? "en" : "es"];
  const entries = Object.values(EVIDENCE);
  const counts = entries.reduce(
    (acc, e) => {
      acc[e.evidenceLevel] = (acc[e.evidenceLevel] || 0) + 1;
      return acc;
    },
    { high: 0, moderate: 0, limited: 0 }
  );
  const totalStudies = entries.reduce((n, e) => n + (e.studies?.length || 0), 0);
  const grouped = LEVEL_ORDER.map((level) => ({
    level,
    label: level === "high" ? c.levelHigh : level === "moderate" ? c.levelModerate : c.levelLimited,
    items: entries.filter((e) => e.evidenceLevel === level),
  })).filter((g) => g.items.length > 0);

  return (
    <PublicShell activePath="/evidencia">
      <Container size="md" className="bi-prose">
        <header style={{ marginBlockEnd: space[6] }}>
          <div style={{ fontSize: font.size.sm, color: cssVar.accent, textTransform: "uppercase", letterSpacing: "2px", fontWeight: font.weight.bold }}>
            {c.eyebrow}
          </div>
          <h1 style={{ margin: `${space[2]}px 0` }}>{c.title}</h1>
          <p style={{ color: cssVar.textDim, maxWidth: "60ch" }}>{c.intro}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: space[2], marginBlockStart: space[4] }}>
            <Pill>{c.protocolsN(entries.length)}</Pill>
            <Pill>{c.studiesN(totalStudies)}</Pill>
            <Pill variant={PILL_VARIANT.high}>{c.highN(counts.high)}</Pill>
            <Pill variant={PILL_VARIANT.moderate}>{c.moderateN(counts.moderate)}</Pill>
            <Pill variant={PILL_VARIANT.limited}>{c.limitedN(counts.limited)}</Pill>
          </div>
        </header>

        <nav
          aria-labelledby="toc-heading"
          style={{
            border: `1px solid ${cssVar.border}`,
            borderRadius: radius.md,
            padding: space[4],
            background: cssVar.surface,
            marginBlockEnd: space[6],
          }}
        >
          <h2
            id="toc-heading"
            style={{
              fontSize: font.size.xs,
              color: cssVar.textDim,
              textTransform: "uppercase",
              letterSpacing: font.tracking.wide,
              fontWeight: font.weight.semibold,
              margin: 0,
              marginBlockEnd: space[3],
            }}
          >
            {c.toc}
          </h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: space[2] }}>
            {grouped.map((g) => (
              <li key={g.level} style={{ display: "flex", gap: space[2], alignItems: "baseline", flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: 10,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    color: LEVEL_COLOR[g.level],
                    fontWeight: font.weight.black,
                    minWidth: 110,
                  }}
                >
                  {g.label}
                </span>
                <span style={{ display: "inline-flex", flexWrap: "wrap", gap: space[2] }}>
                  {g.items.map((e, i) => (
                    <a
                      key={e.id}
                      href={`#${e.id}`}
                      style={{
                        color: cssVar.text,
                        fontSize: font.size.sm,
                        fontWeight: font.weight.semibold,
                        textDecoration: "none",
                      }}
                    >
                      {e.title}
                      {i < g.items.length - 1 && <span aria-hidden="true" style={{ color: cssVar.textMuted }}>  ·</span>}
                    </a>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </nav>

        <div style={{ display: "grid", gap: space[3] }}>
          {entries.map((e) => {
            const color = LEVEL_COLOR[e.evidenceLevel] || cssVar.textDim;
            const levelLabel = e.evidenceLevel === "high" ? c.levelHigh : e.evidenceLevel === "moderate" ? c.levelModerate : c.levelLimited;
            return (
              <article
                key={e.id}
                id={e.id}
                aria-labelledby={`${e.id}-title`}
                style={{
                  background: cssVar.surface,
                  border: `1px solid ${cssVar.border}`,
                  borderInlineStart: `3px solid ${color}`,
                  borderRadius: radius.md,
                  padding: space[4],
                  scrollMarginBlockStart: space[6],
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: space[2], flexWrap: "wrap" }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 10,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      fontWeight: font.weight.black,
                      color,
                    }}
                  >
                    {levelLabel}
                  </p>
                  <a
                    href={`#${e.id}`}
                    aria-label={c.anchor}
                    title={c.anchor}
                    style={{
                      color: cssVar.textMuted,
                      fontSize: 11,
                      fontFamily: cssVar.fontMono,
                      textDecoration: "none",
                    }}
                  >
                    #{e.id}
                  </a>
                </div>
                <h2 id={`${e.id}-title`} style={{ fontSize: 18, fontWeight: font.weight.black, margin: `2px 0 0`, color: cssVar.text }}>
                  {e.title}
                </h2>

                <BlockLabel>{c.mechanism}</BlockLabel>
                <p style={{ fontSize: 13, color: cssVar.textDim, margin: 0 }}>{e.mechanism}</p>

                <BlockLabel>{c.expect}</BlockLabel>
                <p style={{ fontSize: 12, margin: 0, color: cssVar.text }}>{e.expect}</p>

                <BlockLabel>{c.limitation}</BlockLabel>
                <p style={{ fontSize: 12, margin: 0, color: cssVar.textDim, fontStyle: "italic" }}>{e.limitation}</p>

                <BlockLabel>{c.studies(e.studies.length)}</BlockLabel>
                <ol role="list" style={{ paddingInlineStart: 0, listStyle: "none", margin: 0 }}>
                  {e.studies.map((s, i) => (
                    <li
                      key={i}
                      style={{
                        borderInlineStart: `2px solid ${cssVar.border}`,
                        padding: `2px 0 2px 12px`,
                        marginBlockEnd: space[2],
                        fontSize: 12,
                      }}
                    >
                      <div style={{ fontWeight: font.weight.bold, color: cssVar.text }}>
                        {s.authors} ({s.year})
                      </div>
                      <div style={{ color: cssVar.text }}>{s.title}</div>
                      <div style={{ color: cssVar.textMuted, fontStyle: "italic", fontSize: 11 }}>
                        {s.journal}
                        {s.n ? ` · N=${s.n}` : ""}
                      </div>
                      {s.effect && (
                        <div style={{
                          marginBlockStart: 6,
                          background: cssVar.surface2,
                          padding: "6px 10px",
                          borderRadius: 6,
                          color: cssVar.text,
                        }}>
                          {s.effect}
                        </div>
                      )}
                      {s.doi && (
                        <div style={{ marginBlockStart: 4 }}>
                          <a
                            href={`https://doi.org/${s.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: cssVar.accent,
                              fontSize: 10,
                              fontFamily: cssVar.fontMono,
                              textDecoration: "none",
                              fontWeight: font.weight.semibold,
                            }}
                          >
                            DOI: {s.doi} <span aria-hidden="true">↗</span>
                          </a>
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </article>
            );
          })}
        </div>

        <p style={{ marginBlockStart: space[6], color: cssVar.textMuted, fontSize: font.size.sm, maxWidth: "60ch" }}>
          {c.updateNote}
        </p>
      </Container>
    </PublicShell>
  );
}

function Pill({ children, variant }) {
  const bg = variant?.bg ?? cssVar.surface2;
  const fg = variant?.fg ?? cssVar.text;
  return (
    <span style={{
      background: bg,
      color: fg,
      padding: "6px 12px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: font.weight.bold,
    }}>
      {children}
    </span>
  );
}

function BlockLabel({ children }) {
  return (
    <p style={{
      fontSize: 10,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: cssVar.textMuted,
      fontWeight: font.weight.bold,
      margin: `${space[3]}px 0 ${space[1]}px`,
    }}>
      {children}
    </p>
  );
}
