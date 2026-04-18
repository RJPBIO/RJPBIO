"use client";
/* ═══════════════════════════════════════════════════════════════
   /reporte — Informe trimestral imprimible.

   Consume el store local y agrega los 90 días anteriores. Diseño
   optimizado para lectura en 30 segundos por un profesional
   (terapeuta, médico, coach). Botón "Descargar PDF" dispara
   `window.print()`; el CSS `@media print` oculta los controles.

   Local-first: no envía datos a ningún servidor. Lo que aparece
   aquí es lo que ya vive en el dispositivo del usuario.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "../../store/useStore";
import { buildQuarterlyReport } from "../../lib/quarterlyReport";

function fmtDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("es", { year: "numeric", month: "short", day: "numeric" });
}

function fmtScore(s) {
  if (s === null || s === undefined) return "—";
  return typeof s === "number" ? s.toFixed(1) : s;
}

function DeltaBadge({ delta, positiveIsBetter = true }) {
  if (delta === null || delta === undefined) return <span className="chip chip-muted">—</span>;
  const improved = positiveIsBetter ? delta > 0 : delta < 0;
  const stable = delta === 0;
  const cls = stable ? "chip chip-muted" : improved ? "chip chip-good" : "chip chip-bad";
  const sign = delta > 0 ? "+" : "";
  return <span className={cls}>{sign}{delta}</span>;
}

export default function ReportePage() {
  const init = useStore((s) => s.init);
  const loaded = useStore((s) => s._loaded);
  const st = useStore((s) => s);

  useEffect(() => {
    if (!loaded) init?.();
  }, [loaded, init]);

  const [now, setNow] = useState(null);
  useEffect(() => { setNow(Date.now()); }, []);

  const report = useMemo(() => {
    if (!loaded || now === null) return null;
    return buildQuarterlyReport(st, { now, days: 90 });
  }, [st, loaded, now]);

  if (!loaded || !report) {
    return (
      <main className="page">
        <p>Cargando informe…</p>
      </main>
    );
  }

  const totalMin = Math.round(report.sessions.totalTimeSec / 60);

  return (
    <main className="page">
      <style>{`
        :root { color-scheme: light; }
        body { background: #F8FAFC; }
        .page {
          max-width: 820px;
          margin: 0 auto;
          padding: 32px 24px 64px;
          font-family: "Inter", system-ui, sans-serif;
          color: #0F172A;
          line-height: 1.5;
        }
        h1 { font-size: 26px; font-weight: 800; margin: 0 0 4px; letter-spacing: -0.02em; }
        h2 { font-size: 14px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #475569; margin: 32px 0 12px; border-block-end: 1px solid #E2E8F0; padding-block-end: 6px; }
        p  { margin: 0 0 8px; }
        .sub { color: #64748B; font-size: 13px; margin: 0 0 24px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
        .card { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 14px; }
        .kpi-label { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #64748B; margin: 0 0 4px; }
        .kpi-value { font-size: 22px; font-weight: 800; color: #0F172A; margin: 0; }
        .kpi-sub { font-size: 11px; color: #64748B; margin: 4px 0 0; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { text-align: start; padding: 8px 10px; border-block-end: 1px solid #E2E8F0; }
        th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748B; font-weight: 700; }
        .chip { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; }
        .chip-good { background: #DCFCE7; color: #166534; }
        .chip-bad  { background: #FEE2E2; color: #991B1B; }
        .chip-muted { background: #E2E8F0; color: #475569; }
        .warn {
          border-inline-start: 4px solid #F97316;
          background: #FFF7ED;
          padding: 10px 14px;
          border-radius: 8px;
          margin-block-end: 10px;
          font-size: 13px;
        }
        .warn.high { border-inline-start-color: #DC2626; background: #FEF2F2; }
        .actions { display: flex; gap: 10px; justify-content: flex-end; margin-block-end: 20px; }
        .actions a, .actions button {
          font: inherit;
          font-size: 13px; font-weight: 700;
          padding: 10px 16px; border-radius: 10px;
          border: 1px solid #CBD5E1;
          background: #FFFFFF; color: #0F172A;
          cursor: pointer; text-decoration: none;
        }
        .actions .primary { background: #0F172A; color: #FFFFFF; border-color: #0F172A; }
        .muted { color: #64748B; }
        .footnote { font-size: 11px; color: #64748B; margin-block-start: 24px; }

        @media print {
          body { background: #FFFFFF; }
          .actions { display: none; }
          .page { padding: 0; max-width: none; }
          h2 { page-break-after: avoid; }
          .card, table { page-break-inside: avoid; }
        }
      `}</style>

      <div className="actions">
        <Link href="/" className="">← Volver</Link>
        <button className="primary" type="button" onClick={() => window.print()}>
          Descargar PDF
        </button>
      </div>

      <header>
        <h1>Informe trimestral</h1>
        <p className="sub">
          Periodo: {fmtDate(report.period.start)} — {fmtDate(report.period.end)} · {report.period.days} días ·
          Generado {fmtDate(report.period.end)}
        </p>
      </header>

      <h2>Resumen</h2>
      <div className="grid">
        <div className="card">
          <p className="kpi-label">Sesiones</p>
          <p className="kpi-value">{report.sessions.count}</p>
          <p className="kpi-sub">{totalMin} min totales</p>
        </div>
        <div className="card">
          <p className="kpi-label">Racha actual</p>
          <p className="kpi-value">{report.streak.current} d</p>
          <p className="kpi-sub">récord {report.streak.best} d</p>
        </div>
        <div className="card">
          <p className="kpi-label">Ánimo promedio</p>
          <p className="kpi-value">{fmtScore(report.mood.avg)}</p>
          <p className="kpi-sub">tendencia {report.mood.trend}</p>
        </div>
        <div className="card">
          <p className="kpi-label">HRV (RMSSD)</p>
          <p className="kpi-value">{fmtScore(report.hrv.avgRmssd)}</p>
          <p className="kpi-sub">{report.hrv.n} lecturas · {report.hrv.trend}</p>
        </div>
      </div>

      {report.warnings.length > 0 && (
        <>
          <h2>Señales de alerta</h2>
          {report.warnings.map((w, i) => (
            <div key={i} className={`warn ${w.severity === "high" ? "high" : ""}`}>
              <strong style={{ textTransform: "uppercase", letterSpacing: 1, fontSize: 10 }}>
                {w.severity === "high" ? "Prioridad alta" : "Revisión"}
              </strong>
              <p style={{ margin: "4px 0 0" }}>{w.message}</p>
            </div>
          ))}
        </>
      )}

      <h2>Escalas validadas</h2>
      <table>
        <thead>
          <tr>
            <th>Instrumento</th>
            <th>N</th>
            <th>Inicial</th>
            <th>Último</th>
            <th>Δ</th>
            <th>Nivel actual</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>PSS-4 (estrés)</td>
            <td>{report.instruments.pss4.n}</td>
            <td>{fmtScore(report.instruments.pss4.first?.score)}</td>
            <td>{fmtScore(report.instruments.pss4.latest?.score)}</td>
            <td><DeltaBadge delta={report.instruments.pss4.delta} positiveIsBetter={false} /></td>
            <td className="muted">{report.instruments.pss4.latest?.level || "—"}</td>
          </tr>
          <tr>
            <td>SWEMWBS-7 (bienestar)</td>
            <td>{report.instruments.wemwbs7.n}</td>
            <td>{fmtScore(report.instruments.wemwbs7.first?.score)}</td>
            <td>{fmtScore(report.instruments.wemwbs7.latest?.score)}</td>
            <td><DeltaBadge delta={report.instruments.wemwbs7.delta} positiveIsBetter={true} /></td>
            <td className="muted">{report.instruments.wemwbs7.latest?.level || "—"}</td>
          </tr>
          <tr>
            <td>PHQ-2 (screening)</td>
            <td>{report.instruments.phq2.n}</td>
            <td>{fmtScore(report.instruments.phq2.first?.score)}</td>
            <td>{fmtScore(report.instruments.phq2.latest?.score)}</td>
            <td><DeltaBadge delta={report.instruments.phq2.delta} positiveIsBetter={false} /></td>
            <td className="muted">{report.instruments.phq2.latest?.level || "—"}</td>
          </tr>
        </tbody>
      </table>

      <h2>Sesiones por intención</h2>
      <div className="grid">
        {Object.entries(report.sessions.byIntent).map(([k, v]) => (
          <div key={k} className="card">
            <p className="kpi-label">{k}</p>
            <p className="kpi-value">{v}</p>
          </div>
        ))}
      </div>

      {report.sessions.topProtocols.length > 0 && (
        <>
          <h2>Protocolos más usados</h2>
          <table>
            <thead>
              <tr>
                <th>Protocolo</th>
                <th>Sesiones</th>
                <th>Δ ánimo promedio</th>
              </tr>
            </thead>
            <tbody>
              {report.sessions.topProtocols.map((p) => (
                <tr key={p.name}>
                  <td>{p.name}</td>
                  <td>{p.count}</td>
                  <td>
                    {p.avgDelta === null
                      ? <span className="muted">—</span>
                      : <DeltaBadge delta={p.avgDelta} positiveIsBetter={true} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h2>Puntajes neurales</h2>
      <div className="grid">
        <div className="card">
          <p className="kpi-label">Enfoque</p>
          <p className="kpi-value">{report.scores.coherencia ?? "—"}%</p>
        </div>
        <div className="card">
          <p className="kpi-label">Calma</p>
          <p className="kpi-value">{report.scores.resiliencia ?? "—"}%</p>
        </div>
        <div className="card">
          <p className="kpi-label">Capacidad</p>
          <p className="kpi-value">{report.scores.capacidad ?? "—"}%</p>
        </div>
      </div>

      <p className="footnote">
        Este informe se generó localmente a partir de datos que viven solo en tu dispositivo.
        BIO-IGNICIÓN no envía esta información a ningún servidor. Las escalas utilizadas
        (PSS-4, SWEMWBS-7, PHQ-2) son instrumentos de screening, no de diagnóstico.
      </p>
    </main>
  );
}
