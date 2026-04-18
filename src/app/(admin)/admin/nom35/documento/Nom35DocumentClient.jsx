"use client";
/* ═══════════════════════════════════════════════════════════════
   NOM-035 — Documento oficial (política + acta + bitácora)
   El admin completa los datos fiscales; el documento se renderiza
   abajo y se imprime con window.print(). El CSS @media print oculta
   la UI de configuración para que el PDF quede limpio.
   Los datos de la empresa se guardan en localStorage por sesión.
   ═══════════════════════════════════════════════════════════════ */
import { useEffect, useState } from "react";
import { cssVar, radius, space, font } from "@/components/ui/tokens";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { DOMINIOS } from "@/lib/nom35/items";

const STORAGE_KEY = "bio-nom35-doc-v1";

const NIVEL_LABEL = {
  nulo:      "Nulo / despreciable",
  bajo:      "Bajo",
  medio:     "Medio",
  alto:      "Alto",
  muy_alto:  "Muy alto",
};

const DEFAULT_FORM = {
  razonSocial: "",
  rfc: "",
  domicilio: "",
  representanteLegal: "",
  responsableSST: "",
  fechaEvaluacion: new Date().toISOString().slice(0, 10),
  firmaAdmin: "",
  firmaRepresentante: "",
  asistentes: "",
  observaciones: "",
};

export default function Nom35DocumentClient({
  orgName, orgRegion, totalMembers, totalResponses, aggregate,
  evaluaciones, adminName,
}) {
  const [form, setForm] = useState({ ...DEFAULT_FORM, razonSocial: orgName });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        setForm((f) => ({ ...f, ...saved }));
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(form)); } catch {}
  }, [form, hydrated]);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  const alertas = [];
  if (!form.razonSocial) alertas.push("Falta la razón social.");
  if (!form.representanteLegal) alertas.push("Falta el representante legal.");
  if (aggregate.suppressed) alertas.push(`Muestra insuficiente (${aggregate.n || 0}/${totalMembers}). El documento incluirá la política pero no cifras agregadas.`);

  return (
    <>
      {/* Barra de configuración — oculta al imprimir */}
      <div className="no-print">
        <header style={{ marginBottom: space[5] }}>
          <h1 style={{ fontSize: font.size["2xl"], fontWeight: font.weight.black, letterSpacing: font.tracking.tight, margin: 0 }}>
            Documento NOM-035
          </h1>
          <p style={{ color: cssVar.textMuted, marginTop: space[1] }}>
            Completa los datos de tu empresa y oprime <strong>Imprimir / Guardar PDF</strong>. Tiene 3 secciones: política de prevención, acta de difusión y bitácora de evaluaciones.
          </p>
        </header>

        {alertas.length > 0 && (
          <div style={{ marginBottom: space[4] }}>
            <Alert kind="warning">
              <ul style={{ margin: 0, paddingLeft: space[4] }}>
                {alertas.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </Alert>
          </div>
        )}

        <Card>
          <CardHeader>
            <h2 style={{ margin: 0, fontSize: font.size.lg }}>Datos fiscales y firmantes</h2>
          </CardHeader>
          <CardBody>
            <div style={formGrid}>
              <LabeledInput label="Razón social" value={form.razonSocial} onChange={(v) => set("razonSocial", v)} />
              <LabeledInput label="RFC" value={form.rfc} onChange={(v) => set("rfc", v)} />
              <LabeledInput label="Domicilio fiscal" value={form.domicilio} onChange={(v) => set("domicilio", v)} full />
              <LabeledInput label="Representante legal" value={form.representanteLegal} onChange={(v) => set("representanteLegal", v)} />
              <LabeledInput label="Responsable SST" value={form.responsableSST} onChange={(v) => set("responsableSST", v)} />
              <LabeledInput label="Fecha evaluación" type="date" value={form.fechaEvaluacion} onChange={(v) => set("fechaEvaluacion", v)} />
              <LabeledInput label="Firma admin (nombre)" value={form.firmaAdmin || adminName} onChange={(v) => set("firmaAdmin", v)} />
              <LabeledInput label="Firma representante (nombre)" value={form.firmaRepresentante} onChange={(v) => set("firmaRepresentante", v)} />
              <LabeledTextarea label="Asistentes a la difusión (uno por línea)" value={form.asistentes} onChange={(v) => set("asistentes", v)} />
              <LabeledTextarea label="Observaciones" value={form.observaciones} onChange={(v) => set("observaciones", v)} />
            </div>
            <div style={{ marginTop: space[4] }}>
              <Button variant="primary" onClick={() => typeof window !== "undefined" && window.print()}>
                Imprimir / Guardar PDF
              </Button>
            </div>
          </CardBody>
        </Card>

        <div style={{ margin: `${space[6]}px 0 ${space[3]}px`, color: cssVar.textMuted, fontSize: font.size.sm }}>
          Vista previa ↓
        </div>
      </div>

      {/* Documento imprimible */}
      <article className="print-doc" style={docStyle}>
        <PoliciaSection org={{ razonSocial: form.razonSocial, rfc: form.rfc, domicilio: form.domicilio }} />
        <PageBreak />
        <ActaSection
          form={form}
          totalMembers={totalMembers}
          totalResponses={totalResponses}
        />
        <PageBreak />
        <ResultadosSection aggregate={aggregate} />
        <PageBreak />
        <BitacoraSection evaluaciones={evaluaciones} />
      </article>

      <style jsx global>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-doc { background: white !important; color: black !important; }
          .print-doc h1, .print-doc h2, .print-doc h3 { color: black !important; }
          .print-doc a { color: black !important; text-decoration: none; }
          .page-break { break-after: page; page-break-after: always; }
          aside[aria-label="Secciones de administración"] { display: none !important; }
        }
      `}</style>
    </>
  );
}

function LabeledInput({ label, value, onChange, type = "text", full }) {
  return (
    <label style={{ gridColumn: full ? "1 / -1" : undefined, display: "block" }}>
      <span style={labelStyle}>{label}</span>
      <input
        type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </label>
  );
}
function LabeledTextarea({ label, value, onChange }) {
  return (
    <label style={{ gridColumn: "1 / -1", display: "block" }}>
      <span style={labelStyle}>{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        style={{ ...inputStyle, resize: "vertical", fontFamily: cssVar.fontSans }}
      />
    </label>
  );
}

function PoliciaSection({ org }) {
  return (
    <section>
      <h1 style={docH1}>Política de prevención de riesgos psicosociales y promoción del entorno organizacional favorable</h1>
      <p style={docMeta}><strong>Razón social:</strong> {org.razonSocial || "[razón social]"} &nbsp;·&nbsp; <strong>RFC:</strong> {org.rfc || "[RFC]"}</p>
      <p style={docMeta}><strong>Domicilio:</strong> {org.domicilio || "[domicilio]"}</p>
      <p style={docPara}>
        En cumplimiento a la Norma Oficial Mexicana <strong>NOM-035-STPS-2018</strong> — Factores de riesgo psicosocial en
        el trabajo, identificación, análisis y prevención, <strong>{org.razonSocial || "[razón social]"}</strong> declara su compromiso
        explícito con la prevención de los factores de riesgo psicosocial, la prevención de la violencia laboral y la
        promoción de un entorno organizacional favorable para todas las personas que prestan sus servicios dentro del centro
        de trabajo, sin distinción por género, origen, religión, condición social, preferencias o cualquier otra condición.
      </p>
      <h2 style={docH2}>Compromisos</h2>
      <ol style={docList}>
        <li>Identificar, analizar y prevenir los factores de riesgo psicosocial mediante la aplicación periódica del cuestionario de la Guía de Referencia III de la NOM-035 a la totalidad del personal.</li>
        <li>Difundir esta política y sus resultados entre el personal a través de medios impresos y digitales.</li>
        <li>Ofrecer mecanismos seguros y confidenciales para denunciar prácticas opuestas a un entorno favorable, sin represalias.</li>
        <li>Adoptar las medidas de control, prevención y atención necesarias sobre los factores que resulten con nivel de riesgo <em>medio</em>, <em>alto</em> o <em>muy alto</em>.</li>
        <li>Facilitar la referencia a atención médica, psicológica o especializada a las personas que presenten afectaciones derivadas de estos factores.</li>
        <li>Llevar registros (bitácoras) de las evaluaciones, acciones correctivas y controles durante al menos cinco años.</li>
      </ol>
      <h2 style={docH2}>Alcance</h2>
      <p style={docPara}>
        Esta política aplica a todo el personal, sin importar nivel, puesto, área o modalidad de trabajo (presencial, híbrida
        o remota). La alta dirección, gerencias y jefaturas son responsables de su implementación y seguimiento.
      </p>
    </section>
  );
}

function ActaSection({ form, totalMembers, totalResponses }) {
  const asistentes = (form.asistentes || "").split("\n").map((s) => s.trim()).filter(Boolean);
  return (
    <section>
      <h1 style={docH1}>Acta de difusión — NOM-035</h1>
      <p style={docPara}>
        En el domicilio de <strong>{form.razonSocial || "[razón social]"}</strong> ({form.domicilio || "[domicilio]"}),
        el día <strong>{form.fechaEvaluacion || "[fecha]"}</strong>, se hizo del conocimiento del personal la política
        institucional de prevención de factores de riesgo psicosocial, el procedimiento para su evaluación y los resultados
        de la aplicación del cuestionario de identificación.
      </p>
      <p style={docPara}>
        Se informó que {totalResponses} de {totalMembers} personas han respondido el cuestionario (Guía III). Los resultados
        se reportan únicamente de manera agregada y anónima; ninguna persona recibirá represalias por sus respuestas.
      </p>
      {asistentes.length > 0 ? (
        <>
          <h2 style={docH2}>Personal que asistió a la difusión</h2>
          <ol style={docList}>
            {asistentes.map((a, i) => <li key={i}>{a}</li>)}
          </ol>
        </>
      ) : null}

      {form.observaciones && (
        <>
          <h2 style={docH2}>Observaciones</h2>
          <p style={docPara}>{form.observaciones}</p>
        </>
      )}

      <div style={{ marginTop: 72, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
        <Firma nombre={form.representanteLegal} rol="Representante legal" />
        <Firma nombre={form.responsableSST || form.firmaAdmin} rol="Responsable SST / admin" />
      </div>
    </section>
  );
}

function ResultadosSection({ aggregate }) {
  if (aggregate.suppressed) {
    return (
      <section>
        <h1 style={docH1}>Resultados agregados</h1>
        <p style={docPara}>La muestra recibida ({aggregate.n || 0} respuestas) es menor al umbral mínimo para reportar (N=5). No se publican resultados individuales por dominio para preservar el anonimato.</p>
      </section>
    );
  }
  const filas = (aggregate.porDominioAltoRiesgo || []);
  return (
    <section>
      <h1 style={docH1}>Resultados agregados (anónimos)</h1>
      <p style={docPara}>
        Respuestas válidas: <strong>{aggregate.n}</strong>. Puntaje total promedio: <strong>{aggregate.avgTotal}</strong>.
        Nivel promedio: <strong>{NIVEL_LABEL[aggregate.nivelPromedio]}</strong>.
      </p>
      <h2 style={docH2}>Distribución por nivel</h2>
      <table style={docTable}>
        <thead><tr><th style={docTh}>Nivel</th><th style={docTh}>Personas</th></tr></thead>
        <tbody>
          {["nulo", "bajo", "medio", "alto", "muy_alto"].map((n) => (
            <tr key={n}><td style={docTd}>{NIVEL_LABEL[n]}</td><td style={docTd}>{aggregate.nivelCounts[n] || 0}</td></tr>
          ))}
        </tbody>
      </table>
      <h2 style={docH2}>Promedio por dominio</h2>
      <table style={docTable}>
        <thead><tr><th style={docTh}>Dominio</th><th style={docTh}>Promedio</th></tr></thead>
        <tbody>
          {filas.map((r) => {
            const info = Object.values(DOMINIOS).find((d) => d.id === r.dominio);
            return <tr key={r.dominio}><td style={docTd}>{info?.label || r.dominio}</td><td style={docTd}>{r.avg}</td></tr>;
          })}
        </tbody>
      </table>
    </section>
  );
}

function BitacoraSection({ evaluaciones }) {
  return (
    <section>
      <h1 style={docH1}>Bitácora de evaluaciones</h1>
      {evaluaciones.length === 0 ? (
        <p style={docPara}>Aún no se han registrado evaluaciones en esta plataforma.</p>
      ) : (
        <table style={docTable}>
          <thead><tr>
            <th style={docTh}>#</th>
            <th style={docTh}>Fecha</th>
            <th style={docTh}>Total</th>
            <th style={docTh}>Nivel</th>
          </tr></thead>
          <tbody>
            {evaluaciones.map((e, i) => (
              <tr key={i}>
                <td style={docTd}>{i + 1}</td>
                <td style={docTd}>{e.fecha}</td>
                <td style={docTd}>{e.total}</td>
                <td style={docTd}>{NIVEL_LABEL[e.nivel] || e.nivel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p style={{ ...docPara, marginTop: 24, fontSize: 12, color: "#555" }}>
        Conservar durante al menos 5 años (art. 7.IV NOM-035-STPS-2018).
      </p>
    </section>
  );
}

function Firma({ nombre, rol }) {
  return (
    <div style={{ borderTop: "1px solid #000", paddingTop: 6, textAlign: "center" }}>
      <div style={{ fontWeight: 600 }}>{nombre || "______________________"}</div>
      <div style={{ fontSize: 12, color: "#333" }}>{rol}</div>
    </div>
  );
}

function PageBreak() { return <div className="page-break" />; }

// ── estilos ───────────────────────────────────────────────
const formGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: `${space[3]}px ${space[4]}px`,
};
const labelStyle = {
  display: "block",
  fontSize: font.size.xs,
  color: cssVar.textDim,
  marginBottom: space[1],
  textTransform: "uppercase",
  letterSpacing: font.tracking.wider,
};
const inputStyle = {
  width: "100%",
  padding: `${space[2]}px ${space[3]}px`,
  background: cssVar.surface2,
  border: `1px solid ${cssVar.border}`,
  borderRadius: radius.sm,
  color: cssVar.text,
  fontSize: font.size.sm,
  fontFamily: cssVar.fontSans,
};
const docStyle = {
  background: "white",
  color: "black",
  padding: "48px 60px",
  borderRadius: radius.md,
  border: `1px solid ${cssVar.border}`,
  fontFamily: `"Times New Roman", Times, serif`,
  lineHeight: 1.55,
  fontSize: 14,
  maxWidth: 860,
  margin: "0 auto",
};
const docH1 = { fontSize: 20, fontWeight: 700, margin: "0 0 12px", textAlign: "center" };
const docH2 = { fontSize: 16, fontWeight: 700, margin: "18px 0 6px" };
const docMeta = { fontSize: 12, margin: "4px 0", color: "#222" };
const docPara = { margin: "8px 0", textAlign: "justify" };
const docList = { margin: "8px 0 8px 24px" };
const docTable = { width: "100%", borderCollapse: "collapse", margin: "8px 0" };
const docTh = { textAlign: "left", padding: "6px 10px", borderBottom: "1.5px solid #000", fontSize: 12, textTransform: "uppercase" };
const docTd = { padding: "4px 10px", borderBottom: "1px solid #ccc" };
