/* ═══════════════════════════════════════════════════════════════
   EXECUTIVE NARRATIVE (server) — síntesis CHRO con LLM + fallback.
   ───────────────────────────────────────────────────────────────
   Enriquece la narrativa determinista (lib/executiveNarrative) con una
   síntesis del modelo Anthropic sobre los datos AGREGADOS del reporte.
   Degrada con gracia: sin ANTHROPIC_API_KEY o ante cualquier fallo,
   devuelve la narrativa determinista (siempre disponible, sin alucinar).

   Privacidad: solo se envían agregados (k≥5), nunca datos por persona.
   Honestidad: el prompt prohíbe inventar cifras o causalidad; baja
   temperatura; el fallback es el piso de seguridad.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { buildExecutiveNarrative } from "../lib/executiveNarrative";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-4-6";

// Solo agregados — nada por-persona. Mantiene el prompt chico y seguro.
function compactReport(report) {
  return {
    org: { name: report.org?.name, activeMembers: report.org?.activeMembers ?? report.kpis?.activeMembers },
    periodDays: report.period?.days,
    kpis: report.kpis,
    nom35: report.nom35?.summary
      ? {
          nivelPromedio: report.nom35.summary.nivelPromedio,
          avgTotal: report.nom35.summary.avgTotal,
          porDominioAltoRiesgo: (report.nom35.summary.porDominioAltoRiesgo || []).slice(0, 4),
        }
      : null,
    topProtocols: (report.topProtocols || []).slice(0, 5),
    engagement: report.engagement && !report.engagement.suppressed ? report.engagement : null,
    correlation: report.correlation && !report.correlation.suppressed ? report.correlation : null,
  };
}

function parseNarrative(text) {
  if (typeof text !== "string") return null;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  let obj;
  try {
    obj = JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!obj || typeof obj.summary !== "string" || !Array.isArray(obj.sections)) return null;
  const sections = obj.sections
    .filter((s) => s && typeof s.title === "string" && typeof s.body === "string")
    .slice(0, 6);
  if (sections.length === 0) return null;
  return { summary: obj.summary.trim(), sections };
}

const SYSTEM = [
  "Eres analista senior de people-analytics. Redactas el resumen ejecutivo de un reporte trimestral de bienestar y riesgo psicosocial (NOM-035) para un CHRO que lo presentará al consejo.",
  "Reglas estrictas:",
  "- Usa SOLO las cifras provistas en los datos. NUNCA inventes números, porcentajes ni nombres.",
  "- No afirmes causalidad; las correlaciones son asociaciones agregadas.",
  "- Tono ejecutivo, claro, en español, sin jerga técnica ni emojis.",
  "- Los datos ya están anonimizados y agregados (k≥5). No menciones individuos.",
  'Devuelve EXCLUSIVAMENTE un JSON: {"summary": string, "sections": [{"title": string, "body": string}]}.',
  "Secciones esperadas (omite las que el dato no soporte): Qué funcionó, A vigilar, Correlación, Próximos 90 días.",
].join("\n");

/**
 * @param {object} report — salida de buildExecutiveReport
 * @param {object} [opts] — { locale, signal }
 * @returns {Promise<{generatedBy:"llm"|"deterministic", summary:string, sections:Array}>}
 */
export async function generateExecutiveNarrative(report, opts = {}) {
  const fallback = buildExecutiveNarrative(report, opts);
  if (!report || report.suppressed) return fallback;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallback;

  const model = process.env.EXEC_NARRATIVE_MODEL || process.env.COACH_MODEL || DEFAULT_MODEL;
  try {
    const userMsg =
      "Datos agregados del período (k≥5):\n" +
      JSON.stringify(compactReport(report)) +
      "\n\nRedacta el resumen ejecutivo en el JSON especificado.";
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1000,
        temperature: 0.3,
        system: SYSTEM,
        messages: [{ role: "user", content: userMsg }],
      }),
      signal: opts.signal,
    });
    if (!res.ok) return fallback;
    const data = await res.json();
    const text = data?.content?.[0]?.text || "";
    const parsed = parseNarrative(text);
    if (!parsed) return fallback;
    return { generatedBy: "llm", summary: parsed.summary, sections: parsed.sections };
  } catch {
    return fallback;
  }
}
