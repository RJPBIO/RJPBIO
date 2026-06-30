/* ═══════════════════════════════════════════════════════════════
   EXECUTIVE NARRATIVE — la capa que vuelve el panel un dossier.
   ───────────────────────────────────────────────────────────────
   Convierte el output estructurado de buildExecutiveReport en prosa
   interpretativa lista para el board: resumen + qué funcionó + a vigilar
   + correlación + próximos 90 días. Función PURA y determinista — sirve
   como narrativa siempre-disponible y como fallback del generador LLM
   (src/server/executiveNarrative.js).

   Honesto: solo afirma lo que el dato soporta (k≥5, significancia).
   Nunca inventa cifras ni causalidad no medida.
   ═══════════════════════════════════════════════════════════════ */

import { DOMINIO_META, NIVEL_LABEL } from "./nom35/longitudinal";

const DOMINIO_LABEL = Object.fromEntries(DOMINIO_META.map((d) => [d.id, d.label]));

const round = (x, d = 0) => {
  const n = Number(x);
  if (!Number.isFinite(n)) return null;
  const f = 10 ** d;
  return Math.round(n * f) / f;
};

const pct = (x) => {
  const n = Number(x);
  if (!Number.isFinite(n)) return null;
  // activationRate/completionRate llegan 0..1 o 0..100 según fuente; normaliza.
  const v = n <= 1 ? n * 100 : n;
  return Math.round(v);
};

function nivelText(nivel) {
  return NIVEL_LABEL[nivel] || nivel || "sin determinar";
}

/**
 * @param {object} report — salida de buildExecutiveReport
 * @param {object} [opts] — { locale }
 * @returns {{ generatedBy:"deterministic", summary:string, sections:Array<{title,body}> }}
 */
export function buildExecutiveNarrative(report, _opts = {}) {
  if (!report || report.suppressed) {
    return {
      generatedBy: "deterministic",
      summary:
        report?.message ||
        "El reporte se genera cuando hay al menos 5 personas activas, para preservar la privacidad individual.",
      sections: [],
    };
  }

  const orgName = report.org?.name || "la organización";
  const days = report.period?.days || 90;
  const activeMembers = report.org?.activeMembers ?? report.kpis?.activeMembers ?? null;
  const sessionsTotal = report.kpis?.sessionsTotal ?? report.sessions?.total ?? null;
  const perMember = round(report.kpis?.sessionsPerActiveMember ?? report.sessions?.avgPerMember, 1);
  const nivel = report.kpis?.nom35Level || report.nom35?.summary?.nivelPromedio || null;

  // ── Resumen ──────────────────────────────────────────────────
  const summaryParts = [];
  if (activeMembers != null && sessionsTotal != null) {
    summaryParts.push(
      `En los últimos ${days} días, ${activeMembers} ${activeMembers === 1 ? "persona activa" : "personas activas"} en ${orgName} completaron ${sessionsTotal} ${sessionsTotal === 1 ? "sesión" : "sesiones"}${perMember != null ? ` (${perMember} por persona)` : ""}.`
    );
  }
  if (nivel) {
    summaryParts.push(`El riesgo psicosocial agregado (NOM-035) se ubica en nivel ${nivelText(nivel)}.`);
  }
  const moodDelta = round(report.kpis?.moodDeltaMean, 2);
  if (moodDelta != null && moodDelta !== 0) {
    summaryParts.push(
      `El cambio de ánimo medio por sesión es ${moodDelta > 0 ? "+" : ""}${moodDelta}.`
    );
  }
  const summary = summaryParts.join(" ") || "Resumen no disponible para este período.";

  const sections = [];

  // ── Qué funcionó ─────────────────────────────────────────────
  const top = (report.topProtocols || []).filter((p) => p && p.significant);
  if (top.length > 0) {
    const names = top.slice(0, 2).map((p) => p.protocolId).join(" y ");
    const lift = round(top[0].meanLift, 2);
    let body = `Los protocolos con mayor efecto medible fueron ${names}${lift != null ? ` (lift promedio ${lift > 0 ? "+" : ""}${lift})` : ""}.`;
    const completion = pct(report.kpis?.programCompletionRate ?? report.programs?.completionRate);
    if (completion != null) body += ` La tasa de finalización de programas es ${completion}%.`;
    sections.push({ title: "Qué funcionó", body });
  } else {
    sections.push({
      title: "Qué funcionó",
      body:
        "Todavía no hay protocolos con un efecto estadísticamente distinguible en este período (se requiere muestra suficiente, k≥5). La señal se afina conforme aumenta el uso.",
    });
  }

  // ── A vigilar ────────────────────────────────────────────────
  const altoRiesgo = (report.nom35?.summary?.porDominioAltoRiesgo || []).slice(0, 2);
  const vigilarParts = [];
  if (altoRiesgo.length > 0) {
    const doms = altoRiesgo.map((d) => DOMINIO_LABEL[d.dominio] || d.dominio).join(" y ");
    vigilarParts.push(`Los dominios NOM-035 de mayor riesgo son ${doms}.`);
  }
  const activation = pct(report.engagement?.activationRate);
  if (activation != null && activation < 50) {
    vigilarParts.push(`La activación semanal es ${activation}%; conviene reforzar el hábito de uso.`);
  }
  if (vigilarParts.length === 0) {
    vigilarParts.push("Sin focos de riesgo destacados con la muestra disponible.");
  }
  sections.push({ title: "A vigilar", body: vigilarParts.join(" ") });

  // ── Correlación (si hay) ─────────────────────────────────────
  const corr = report.correlation;
  if (corr && !corr.suppressed && corr.interpretation && corr.interpretation !== "no_correlation") {
    const r = round(corr.pearsonR, 2);
    const interp = {
      weak: "débil",
      moderate: "moderada",
      strong: "fuerte",
    }[corr.interpretation] || corr.interpretation;
    sections.push({
      title: "Correlación",
      body: `La relación observada entre recuperación autonómica (HRV) y riesgo psicosocial es ${interp}${r != null ? ` (r=${r})` : ""}. Es una asociación agregada, no una relación causal.`,
    });
  }

  // ── Próximos 90 días ─────────────────────────────────────────
  const recs = [];
  if (altoRiesgo.length > 0) {
    recs.push(`priorizar intervención en ${DOMINIO_LABEL[altoRiesgo[0].dominio] || altoRiesgo[0].dominio}`);
  }
  if (activation != null && activation < 50) {
    recs.push("reforzar la adherencia semanal (recordatorios, rituales de equipo)");
  } else if (top.length > 0) {
    recs.push(`sostener el uso de ${top[0].protocolId}`);
  }
  recs.push("reaplicar NOM-035 al cierre del período para medir el efecto por dominio");
  const recBody =
    "Recomendaciones: " +
    recs.map((r, i) => `(${i + 1}) ${r}`).join("; ") +
    ".";
  sections.push({ title: "Próximos 90 días", body: recBody });

  return { generatedBy: "deterministic", summary, sections };
}
