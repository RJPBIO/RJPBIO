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

export const metadata = {
  title: "Evidencia científica · BIO-IGNICIÓN",
  description:
    "Estudios revisados por pares detrás de cada protocolo. Efectos reportados, tamaños de muestra y DOIs — sin claims sin cita.",
};

const LEVEL_LABEL = {
  high: "Evidencia alta",
  moderate: "Evidencia moderada",
  limited: "Evidencia limitada",
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

export default function EvidenciaPage() {
  const entries = Object.values(EVIDENCE);
  const counts = entries.reduce(
    (acc, e) => {
      acc[e.evidenceLevel] = (acc[e.evidenceLevel] || 0) + 1;
      return acc;
    },
    { high: 0, moderate: 0, limited: 0 }
  );
  const totalStudies = entries.reduce((n, e) => n + (e.studies?.length || 0), 0);

  return (
    <PublicShell activePath="/evidencia">
      <Container size="md" className="bi-prose">
        <header style={{ marginBlockEnd: space[6] }}>
          <div style={{ fontSize: font.size.sm, color: cssVar.accent, textTransform: "uppercase", letterSpacing: "2px", fontWeight: font.weight.bold }}>
            Biblioteca
          </div>
          <h1 style={{ margin: `${space[2]}px 0` }}>Evidencia científica</h1>
          <p style={{ color: cssVar.textDim, maxWidth: "60ch" }}>
            Cada protocolo se apoya en literatura publicada y revisada por pares.
            Esta biblioteca lista mecanismos, estudios, tamaños de muestra y
            efectos reportados. Los niveles están auto-clasificados de forma
            conservadora — revisamos y degradamos cuando la evidencia no
            justifica lo que una app suele prometer.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: space[2], marginBlockStart: space[4] }}>
            <Pill>{entries.length} protocolos</Pill>
            <Pill>{totalStudies} estudios</Pill>
            <Pill variant={PILL_VARIANT.high}>{counts.high} · evidencia alta</Pill>
            <Pill variant={PILL_VARIANT.moderate}>{counts.moderate} · moderada</Pill>
            <Pill variant={PILL_VARIANT.limited}>{counts.limited} · limitada</Pill>
          </div>
        </header>

        <div style={{ display: "grid", gap: space[3] }}>
          {entries.map((e) => {
            const color = LEVEL_COLOR[e.evidenceLevel] || cssVar.textDim;
            return (
              <article
                key={e.id}
                aria-label={e.title}
                style={{
                  background: cssVar.surface,
                  border: `1px solid ${cssVar.border}`,
                  borderRadius: radius.md,
                  padding: space[4],
                }}
              >
                <p style={{
                  margin: 0,
                  fontSize: 10,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  fontWeight: font.weight.black,
                  color,
                }}>
                  {LEVEL_LABEL[e.evidenceLevel] || "—"}
                </p>
                <h2 style={{ fontSize: 18, fontWeight: font.weight.black, margin: `2px 0 0`, color: cssVar.text }}>{e.title}</h2>
                <p style={{ fontSize: 13, color: cssVar.textDim, margin: `${space[2]}px 0 ${space[3]}px` }}>{e.mechanism}</p>

                <BlockLabel>Qué esperar</BlockLabel>
                <p style={{ fontSize: 12, margin: 0, color: cssVar.text }}>{e.expect}</p>

                <BlockLabel>Limitación</BlockLabel>
                <p style={{ fontSize: 12, margin: 0, color: cssVar.textDim, fontStyle: "italic" }}>{e.limitation}</p>

                <BlockLabel>Estudios ({e.studies.length})</BlockLabel>
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
                      <div style={{ fontWeight: font.weight.bold, color: cssVar.text }}>{s.authors} ({s.year})</div>
                      <div style={{ color: cssVar.text }}>{s.title}</div>
                      <div style={{ color: cssVar.textMuted, fontStyle: "italic", fontSize: 11 }}>
                        {s.journal}{s.n ? ` · N=${s.n}` : ""}
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
                        <div style={{
                          color: cssVar.textMuted,
                          fontSize: 10,
                          fontFamily: cssVar.fontMono,
                          marginBlockStart: 4,
                        }}>
                          DOI: {s.doi}
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
          ¿Falta un estudio o ves un claim mal calibrado? Abre un issue en el
          repositorio público. Esta página se genera desde el mismo archivo
          (<code>src/lib/evidence.js</code>) que consume el producto — corregir
          aquí corrige la app.
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
