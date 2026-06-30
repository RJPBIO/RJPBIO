/* ═══════════════════════════════════════════════════════════════
   PROTOCOL FRAMING (server) — enriquecimiento LLM con guardrails.
   ───────────────────────────────────────────────────────────────
   Genera la capa de lenguaje contextual (eyebrow + frame cognitivo) con
   el modelo Anthropic, SIN tocar el mecanismo fisiológico. Degrada con
   gracia al encuadre determinista (lib/protocolFraming) si no hay API key,
   ante cualquier fallo, o para protocolos de crisis (nunca se generan).

   Guardrails: prohíbe claims médicos/diagnóstico, prohíbe instruir un
   mecanismo distinto (la respiración la marca el protocolo, no el texto),
   1–2 frases, español, sin emojis. voiceTone restringido al set válido.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { buildProtocolFraming, VOICE_TONES } from "../lib/protocolFraming";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-haiku-4-5-20251001"; // ligero: el frame es corto

const SYSTEM = [
  "Escribes el ENCUADRE breve con que una persona entra a una sesión de respiración/regulación de BIO-IGNICIÓN. Tu texto se muestra y se lee en voz antes de empezar.",
  "Reglas innegociables:",
  "- NO des consejo médico, diagnóstico ni promesas de resultados clínicos.",
  "- NO instruyas una técnica de respiración ni cambies el mecanismo: el protocolo ya define la cadencia. Tú solo encuadras el momento (lo cognitivo y el tono).",
  "- 1 o 2 frases máximo, español neutro, cálido pero sobrio, sin emojis ni signos de admiración excesivos.",
  "- Usa el contexto (día, hora, situación, estado) para que se sienta del momento, sin inventar datos.",
  'Devuelve EXCLUSIVAMENTE JSON: {"eyebrow": string (≤24 chars), "frame": string, "voiceTone": "calm"|"discharge"|"focus"|"activation"|"neutral"}.',
].join("\n");

function parseFraming(text) {
  if (typeof text !== "string") return null;
  const a = text.indexOf("{");
  const b = text.lastIndexOf("}");
  if (a === -1 || b <= a) return null;
  let o;
  try {
    o = JSON.parse(text.slice(a, b + 1));
  } catch {
    return null;
  }
  if (!o || typeof o.eyebrow !== "string" || typeof o.frame !== "string") return null;
  if (!VOICE_TONES[o.voiceTone]) return null;
  return { eyebrow: o.eyebrow.slice(0, 28), frame: o.frame.trim(), voiceTone: o.voiceTone };
}

/**
 * @param {object} ctx — { protocol:{id,n,int,useCase,safety}, now, situation, twinDirection, signal }
 * @returns {Promise<object>} encuadre (mismo shape que buildProtocolFraming)
 */
export async function generateProtocolFraming(ctx = {}) {
  const fallback = buildProtocolFraming(ctx);

  // Crisis: jamás se generan; encuadre determinista (seguro y validado).
  const useCase = ctx.protocol?.useCase;
  if (useCase === "crisis" || ctx.protocol?.safety) return fallback;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallback;

  const model = process.env.FRAMING_MODEL || DEFAULT_MODEL;
  try {
    const d = new Date(ctx.now ?? Date.now());
    const ctxLine = {
      protocolo: ctx.protocol?.n,
      intencion: ctx.protocol?.int,
      diaSemana: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][d.getDay()],
      hora: d.getHours(),
      situacion: ctx.situation || null,
      estadoVsNorma: ctx.twinDirection || null,
    };
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 300,
        temperature: 0.6,
        system: SYSTEM,
        messages: [{ role: "user", content: "Contexto:\n" + JSON.stringify(ctxLine) + "\n\nEscribe el encuadre." }],
      }),
      signal: ctx.signal,
    });
    if (!res.ok) return fallback;
    const data = await res.json();
    const parsed = parseFraming(data?.content?.[0]?.text || "");
    if (!parsed) return fallback;
    return {
      eyebrow: parsed.eyebrow,
      frame: parsed.frame,
      voiceTone: parsed.voiceTone,
      voice: VOICE_TONES[parsed.voiceTone] || VOICE_TONES.neutral,
      close: fallback.close,
      source: "llm",
    };
  } catch {
    return fallback;
  }
}
