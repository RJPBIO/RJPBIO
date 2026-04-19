/* ═══════════════════════════════════════════════════════════════
   /evidencia — Biblioteca pública de evidencia científica.

   Server-component: lista todos los estudios citados en el registro
   local (`lib/evidence.js`) con autor, año, revista, N y tamaño de
   efecto cuando están disponibles. Ningún claim sin cita.

   Esta ruta existe para ser linkeable (desde dentro de la app, pero
   también desde mercadotecnia y el footer público). Un profesional
   debe poder auditar la ciencia sin crear cuenta.
   ═══════════════════════════════════════════════════════════════ */

import Link from "next/link";
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
    <main className="page">
      <style>{`
        :root { color-scheme: light dark; }
        .page {
          max-width: 820px;
          margin: 0 auto;
          padding: 32px 24px 64px;
          font-family: "Inter", system-ui, sans-serif;
          color: #0F172A;
          line-height: 1.5;
        }
        @media (prefers-color-scheme: dark) {
          .page { color: #E2E8F0; }
          .card, .entry { background: #0F172A; border-color: #1E293B; }
          .muted { color: #94A3B8; }
          .kicker { color: #94A3B8; }
          .pills .pill { background: #1E293B; }
        }
        h1 { font-size: 30px; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 8px; }
        .sub { color: #64748B; font-size: 14px; margin: 0 0 28px; max-width: 60ch; }
        .pills { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 28px; }
        .pill { background: #F1F5F9; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; }
        .kicker { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; font-weight: 800; }
        .entry {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 18px;
          margin-block-end: 14px;
        }
        .entry h2 { font-size: 18px; font-weight: 800; margin: 0 0 2px; }
        .entry .mechanism { font-size: 13px; color: #334155; margin: 10px 0 14px; }
        .entry .block-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #64748B; font-weight: 700; margin: 10px 0 4px; }
        .entry .expect, .entry .limitation { font-size: 12px; }
        .entry .limitation { color: #64748B; font-style: italic; }
        .study {
          border-inline-start: 2px solid #CBD5E1;
          padding: 2px 0 2px 12px;
          margin-block-end: 10px;
          font-size: 12px;
        }
        .study .authors { font-weight: 700; }
        .study .journal { color: #64748B; font-style: italic; font-size: 11px; }
        .study .effect { margin-block-start: 6px; background: #F1F5F9; padding: 6px 10px; border-radius: 6px; font-size: 12px; }
        .study .doi { color: #64748B; font-size: 10px; font-family: "JetBrains Mono", monospace; margin-block-start: 4px; }
        .nav { margin-block-end: 24px; font-size: 13px; }
        .nav a { color: #475569; text-decoration: none; transition: color 0.15s ease; }
        .nav a:hover { color: #059669; text-decoration: underline; text-underline-offset: 2px; }
      `}</style>

      <nav className="nav"><Link href="/">← BIO-IGNICIÓN</Link></nav>

      <header>
        <h1>Evidencia científica</h1>
        <p className="sub">
          Cada protocolo se apoya en literatura publicada y revisada por pares.
          Esta biblioteca lista mecanismos, estudios, tamaños de muestra y
          efectos reportados. Los niveles están auto-clasificados de forma
          conservadora — revisamos y degradamos cuando la evidencia no
          justifica lo que una app suele prometer.
        </p>
        <div className="pills">
          <span className="pill">{entries.length} protocolos</span>
          <span className="pill">{totalStudies} estudios</span>
          <span className="pill" style={{ background: "#DCFCE7", color: "#166534" }}>
            {counts.high} · evidencia alta
          </span>
          <span className="pill" style={{ background: "#E0E7FF", color: "#3730A3" }}>
            {counts.moderate} · moderada
          </span>
          <span className="pill" style={{ background: "#FEF3C7", color: "#854D0E" }}>
            {counts.limited} · limitada
          </span>
        </div>
      </header>

      {entries.map((e) => {
        const color = LEVEL_COLOR[e.evidenceLevel] || "#475569";
        return (
          <article key={e.id} className="entry" aria-label={e.title}>
            <p className="kicker" style={{ color }}>{LEVEL_LABEL[e.evidenceLevel] || "—"}</p>
            <h2>{e.title}</h2>
            <p className="mechanism">{e.mechanism}</p>

            <p className="block-label">Qué esperar</p>
            <p className="expect">{e.expect}</p>

            <p className="block-label">Limitación</p>
            <p className="limitation">{e.limitation}</p>

            <p className="block-label">Estudios ({e.studies.length})</p>
            <ol role="list" style={{ paddingInlineStart: 0, listStyle: "none", margin: 0 }}>
              {e.studies.map((s, i) => (
                <li key={i} className="study">
                  <div className="authors">{s.authors} ({s.year})</div>
                  <div>{s.title}</div>
                  <div className="journal">{s.journal}{s.n ? ` · N=${s.n}` : ""}</div>
                  {s.effect && <div className="effect">{s.effect}</div>}
                  {s.doi && <div className="doi">DOI: {s.doi}</div>}
                </li>
              ))}
            </ol>
          </article>
        );
      })}

      <p className="sub" style={{ marginBlockStart: 32 }}>
        ¿Falta un estudio o ves un claim mal calibrado? Abre un issue en el
        repositorio público. Esta página se genera desde el mismo archivo
        (<code>src/lib/evidence.js</code>) que consume el producto — corregir
        aquí corrige la app.
      </p>
    </main>
  );
}
