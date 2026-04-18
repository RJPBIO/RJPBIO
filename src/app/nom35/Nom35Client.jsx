"use client";
/* ═══════════════════════════════════════════════════════════════
   NOM-035 Aplicador (Guía III — 72 ítems)
   - Paginado por dominio
   - Persistencia local (localStorage) — se envía al server sólo
     cuando el usuario da "Enviar y generar reporte"
   - Resultado con nivel, recomendación y enlace a BIO-IGNICIÓN
   ═══════════════════════════════════════════════════════════════ */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { cssVar, space, font, radius } from "@/components/ui/tokens";
import { ITEMS, LIKERT, DOMINIOS, CATEGORIAS } from "@/lib/nom35/items";
import { scoreAnswers } from "@/lib/nom35/scoring";

const STORAGE_KEY = "bio-nom35-draft-v1";

function csrfHeader() {
  if (typeof document === "undefined") return {};
  const m = document.cookie.match(/(?:^|; )bio-csrf=([^;]+)/);
  return m ? { "x-csrf-token": decodeURIComponent(m[1]) } : {};
}

// Orden de presentación por dominio (mismo orden que categorías oficiales)
const ORDER = [
  "condiciones", "carga", "falta_control",
  "jornada", "interferencia",
  "liderazgo", "relaciones", "violencia",
  "reconocimiento", "pertenencia",
];

const DOMAIN_ITEMS = ORDER.reduce((acc, d) => {
  acc[d] = ITEMS.filter((it) => it.dominio === d);
  return acc;
}, {});

const NIVEL_COLOR = {
  nulo:      "var(--bi-ok)",
  bajo:      "var(--bi-ok)",
  medio:     "var(--bi-warn)",
  alto:      "var(--bi-danger)",
  muy_alto:  "var(--bi-danger)",
};

export default function Nom35Client() {
  // Paso: "intro" | <domainId> | "result"
  const [step, setStep] = useState("intro");
  const [answers, setAnswers] = useState({});
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submittedAt, setSubmittedAt] = useState(null);

  // Hydrate draft
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft?.answers) setAnswers(draft.answers);
        if (draft?.consent) setConsent(true);
        if (draft?.step) setStep(draft.step);
      }
    } catch {}
  }, []);

  // Persist draft
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, consent, step, savedAt: Date.now() }));
    } catch {}
  }, [answers, consent, step]);

  const result = useMemo(() => scoreAnswers(answers), [answers]);
  const completedCount = result.completedCount;
  const progressPct = (completedCount / ITEMS.length) * 100;

  function setAnswer(id, value) {
    setAnswers((a) => ({ ...a, [id]: value }));
  }

  function goNext() {
    const order = ["intro", ...ORDER, "result"];
    const i = order.indexOf(step);
    if (i < 0) return;
    const next = order[Math.min(i + 1, order.length - 1)];
    setStep(next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function goPrev() {
    const order = ["intro", ...ORDER, "result"];
    const i = order.indexOf(step);
    const prev = order[Math.max(i - 1, 0)];
    setStep(prev);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ¿El dominio actual está completo?
  function domainComplete(d) {
    return DOMAIN_ITEMS[d].every((it) => answers[it.id] !== undefined);
  }
  const canAdvance = step === "intro"
    ? consent
    : step === "result" ? true : domainComplete(step);

  async function submitAll() {
    if (completedCount < ITEMS.length) return;
    setSubmitting(true); setSubmitError("");
    try {
      const body = { answers, submittedAt: new Date().toISOString() };
      const r = await fetch("/api/v1/nom35/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrfHeader() },
        body: JSON.stringify(body),
      });
      // API aún puede no existir: tratamos 404 como "no persistido, sólo local"
      if (r.status === 404 || r.status === 501) {
        setSubmittedAt(Date.now());
      } else if (!r.ok) {
        throw new Error((await r.text()) || `HTTP ${r.status}`);
      } else {
        setSubmittedAt(Date.now());
      }
      // Guardar nivel en perfil local de BIO
      try { localStorage.setItem("bio-nom35-level", result.nivel); } catch {}
    } catch (e) {
      setSubmitError(e?.message || "No se pudo enviar");
    } finally {
      setSubmitting(false);
    }
  }

  function resetDraft() {
    if (typeof window !== "undefined" && !window.confirm("¿Borrar todas las respuestas guardadas?")) return;
    setAnswers({}); setConsent(false); setStep("intro");
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  return (
    <main style={shellStyle}>
      <header style={headerStyle}>
        <Link href="/" style={{ color: cssVar.text, textDecoration: "none", fontWeight: font.weight.bold, letterSpacing: font.tracking.wider }}>
          BIO-IGN · NOM-035
        </Link>
        <nav style={{ display: "flex", gap: space[2], alignItems: "center" }}>
          <Badge variant="soft" size="sm">Guía III</Badge>
          <Badge variant="soft" size="sm">{completedCount}/{ITEMS.length}</Badge>
        </nav>
      </header>

      <section style={contentStyle}>
        <Progress value={progressPct} max={100} label={step === "intro" ? "Iniciando" : step === "result" ? "Completado" : `Dominio: ${DOMINIOS[keyForDomain(step)]?.label}`} tone={step === "result" ? "accent" : "accent"} />

        <div style={{ marginTop: space[5] }}>
          {step === "intro" && (
            <IntroPane consent={consent} setConsent={setConsent} completedCount={completedCount} onReset={resetDraft} />
          )}

          {ORDER.includes(step) && (
            <DomainPane
              domain={step}
              items={DOMAIN_ITEMS[step]}
              answers={answers}
              onAnswer={setAnswer}
            />
          )}

          {step === "result" && (
            <ResultPane result={result} onSubmit={submitAll} submitting={submitting} submittedAt={submittedAt} error={submitError} completedCount={completedCount} />
          )}
        </div>

        <nav style={navStyle} aria-label="Navegación del cuestionario">
          <Button variant="secondary" onClick={goPrev} disabled={step === "intro" || submitting}>
            ← Anterior
          </Button>
          {step !== "result" && (
            <Button variant="primary" onClick={goNext} disabled={!canAdvance}>
              {step === "intro" ? "Comenzar" : "Siguiente →"}
            </Button>
          )}
        </nav>
      </section>
    </main>
  );
}

function keyForDomain(d) {
  // domainId en snake → key uppercase
  return Object.keys(DOMINIOS).find((k) => DOMINIOS[k].id === d);
}

function IntroPane({ consent, setConsent, completedCount, onReset }) {
  return (
    <Card>
      <CardHeader>
        <h1 style={{ margin: 0, fontSize: font.size["2xl"], fontWeight: font.weight.black, letterSpacing: font.tracking.tight }}>
          Cuestionario NOM-035
        </h1>
        <p style={{ margin: `${space[2]}px 0 0`, color: cssVar.textDim, fontSize: font.size.md }}>
          Identificación de factores de riesgo psicosocial y evaluación del entorno organizacional (Guía III, STPS México).
        </p>
      </CardHeader>
      <CardBody>
        <ul style={{ paddingLeft: space[4], margin: 0, lineHeight: 1.7 }}>
          <li>72 preguntas agrupadas en 10 dominios. Tiempo estimado: 10–15 min.</li>
          <li>Tus respuestas son <strong>confidenciales</strong>. Los reportes para tu empresa son agregados y anónimos (N ≥ 5).</li>
          <li>Puedes pausar cuando quieras — el progreso se guarda en este dispositivo.</li>
          <li>Al terminar, BIO-IGNICIÓN te sugerirá protocolos según tu nivel.</li>
        </ul>

        {completedCount > 0 && (
          <div style={{ marginTop: space[4] }}>
            <Alert kind="info">
              Tienes {completedCount} respuesta{completedCount === 1 ? "" : "s"} guardada{completedCount === 1 ? "" : "s"} en este dispositivo.{" "}
              <button onClick={onReset} style={linkBtnStyle}>Empezar de nuevo</button>
            </Alert>
          </div>
        )}

        <label style={consentStyle}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 4, accentColor: "var(--bi-accent)" }} />
          <span>
            Acepto participar voluntariamente y que mis respuestas se usen de forma <strong>agregada y anónima</strong> para fines de cumplimiento de la NOM-035-STPS-2018.
          </span>
        </label>
      </CardBody>
    </Card>
  );
}

function DomainPane({ domain, items, answers, onAnswer }) {
  const domKey = Object.keys(DOMINIOS).find((k) => DOMINIOS[k].id === domain);
  const info = DOMINIOS[domKey];
  const cat = CATEGORIAS[Object.keys(CATEGORIAS).find((k) => CATEGORIAS[k].id === info.categoria)];
  return (
    <Card>
      <CardHeader>
        <div style={{ display: "flex", alignItems: "baseline", gap: space[3], flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: font.size.xl, fontWeight: font.weight.bold }}>{info.label}</h2>
          <Badge variant="soft" size="sm">{cat.label}</Badge>
        </div>
        <p style={{ margin: `${space[2]}px 0 0`, color: cssVar.textMuted, fontSize: font.size.sm }}>
          Responde con la frecuencia con que te ocurre.
        </p>
      </CardHeader>
      <CardBody>
        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: space[4] }}>
          {items.map((it) => (
            <li key={it.id}>
              <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                <legend style={{ fontSize: font.size.md, color: cssVar.text, marginBottom: space[2] }}>
                  <strong>{it.id}.</strong> {it.text}
                </legend>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: space[2] }}>
                  {LIKERT.map((opt) => {
                    const selected = answers[it.id] === opt.value;
                    return (
                      <label
                        key={opt.value}
                        style={{
                          display: "grid",
                          placeItems: "center",
                          padding: `${space[2]}px ${space[1]}px`,
                          border: `1px solid ${selected ? cssVar.accent : cssVar.border}`,
                          borderRadius: radius.md,
                          background: selected ? "color-mix(in srgb, var(--bi-accent) 12%, transparent)" : cssVar.surface2,
                          cursor: "pointer",
                          textAlign: "center",
                          fontSize: font.size.xs,
                          color: selected ? cssVar.text : cssVar.textDim,
                          transition: "background .15s, border-color .15s",
                          minHeight: 64,
                        }}
                      >
                        <input
                          type="radio"
                          name={`item-${it.id}`}
                          value={opt.value}
                          checked={selected}
                          onChange={() => onAnswer(it.id, opt.value)}
                          style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
                        />
                        <span style={{ fontWeight: font.weight.bold, fontSize: font.size.md, marginBottom: 2 }}>{opt.value}</span>
                        <span>{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </li>
          ))}
        </ol>
      </CardBody>
    </Card>
  );
}

function ResultPane({ result, onSubmit, submitting, submittedAt, error, completedCount }) {
  const complete = completedCount === ITEMS.length;
  return (
    <Card featured={complete}>
      <CardHeader>
        <h2 style={{ margin: 0, fontSize: font.size.xl, fontWeight: font.weight.bold }}>
          {complete ? "Resultado" : "Aún hay preguntas pendientes"}
        </h2>
        {!complete && (
          <p style={{ margin: `${space[2]}px 0 0`, color: cssVar.textMuted }}>
            Tienes {ITEMS.length - completedCount} ítems sin responder. Regresa con "Anterior" y complétalos.
          </p>
        )}
      </CardHeader>

      <CardBody>
        {complete && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: space[4], marginBottom: space[5] }}>
              <Metric label="Puntaje total" value={result.total} sub={`de ${ITEMS.length * 4} posibles`} />
              <Metric
                label="Nivel de riesgo"
                value={result.nivelLabel}
                color={NIVEL_COLOR[result.nivel]}
                sub={result.nivel.replace("_", " ")}
              />
            </div>

            <Alert kind={result.nivel === "alto" || result.nivel === "muy_alto" ? "warning" : "info"}>
              <strong>Recomendación.</strong> {result.recomendacion}
            </Alert>

            <h3 style={{ marginTop: space[5], marginBottom: space[2], fontSize: font.size.lg }}>Por dominio</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: space[2] }}>
              {Object.entries(result.porDominio)
                .sort(([, a], [, b]) => b - a)
                .map(([d, v]) => {
                  const info = Object.values(DOMINIOS).find((x) => x.id === d);
                  return (
                    <li key={d} style={{ display: "flex", justifyContent: "space-between", padding: `${space[2]}px ${space[3]}px`, background: cssVar.surface2, borderRadius: radius.sm }}>
                      <span>{info?.label || d}</span>
                      <strong style={{ fontFamily: cssVar.fontMono }}>{v}</strong>
                    </li>
                  );
                })}
            </ul>

            <div style={{ display: "flex", gap: space[3], marginTop: space[5], flexWrap: "wrap" }}>
              <Button variant="primary" onClick={onSubmit} disabled={submitting || !!submittedAt}>
                {submittedAt ? "Enviado ✓" : submitting ? "Enviando…" : "Enviar reporte a mi empresa"}
              </Button>
              <Button variant="secondary" href="/">
                Ir a BIO-IGNICIÓN →
              </Button>
              <Button variant="ghost" onClick={() => typeof window !== "undefined" && window.print()}>
                Descargar / imprimir
              </Button>
            </div>

            {error && <div style={{ marginTop: space[4] }}><Alert kind="danger">{error}</Alert></div>}
            {submittedAt && (
              <p style={{ marginTop: space[3], color: cssVar.textMuted, fontSize: font.size.sm }}>
                Reporte enviado el {new Date(submittedAt).toLocaleString("es-MX")}. Tu empresa lo verá como parte de un agregado anónimo.
              </p>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}

function Metric({ label, value, sub, color }) {
  return (
    <div style={{
      padding: space[4],
      borderRadius: radius.md,
      background: cssVar.surface2,
      border: `1px solid ${cssVar.border}`,
    }}>
      <div style={{ color: cssVar.textMuted, fontSize: font.size.xs, letterSpacing: font.tracking.wider, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: font.size["3xl"], fontWeight: font.weight.black, color: color || cssVar.text, marginTop: space[1], lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ color: cssVar.textMuted, fontSize: font.size.sm, marginTop: space[1] }}>{sub}</div>}
    </div>
  );
}

const shellStyle = {
  minHeight: "100dvh",
  background: cssVar.bg,
  color: cssVar.text,
  fontFamily: cssVar.fontSans,
  display: "grid",
  gridTemplateRows: "auto 1fr",
};
const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: `${space[4]}px ${space[6]}px`,
  borderBottom: `1px solid ${cssVar.border}`,
};
const contentStyle = {
  maxWidth: 860,
  width: "100%",
  margin: "0 auto",
  padding: `${space[6]}px ${space[4]}px ${space[8]}px`,
};
const navStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: space[5],
  gap: space[3],
  position: "sticky",
  bottom: space[4],
};
const consentStyle = {
  display: "grid",
  gridTemplateColumns: "auto 1fr",
  gap: space[3],
  alignItems: "flex-start",
  marginTop: space[5],
  padding: space[3],
  borderRadius: radius.sm,
  background: cssVar.surface2,
  border: `1px solid ${cssVar.border}`,
  fontSize: font.size.sm,
  color: cssVar.textDim,
  cursor: "pointer",
};
const linkBtnStyle = {
  background: "none",
  border: "none",
  color: "var(--bi-accent)",
  textDecoration: "underline",
  cursor: "pointer",
  padding: 0,
  font: "inherit",
};
