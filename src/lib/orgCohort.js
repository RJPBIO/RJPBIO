/* ═══════════════════════════════════════════════════════════════
   ORG COHORT — taxonomía curada para el BioSignal Index.
   ───────────────────────────────────────────────────────────────
   Listas fijas de industria / tamaño / turno para que las cohortes
   agrupen de forma consistente (texto libre fragmentaría el benchmark).
   Compartida entre la validación de la API y el form de admin.
   Pura, sin dependencias.
   ═══════════════════════════════════════════════════════════════ */

export const INDUSTRIES = Object.freeze([
  { id: "manufactura", label: "Manufactura" },
  { id: "tecnologia", label: "Tecnología" },
  { id: "salud", label: "Salud" },
  { id: "servicios", label: "Servicios" },
  { id: "retail", label: "Retail / Comercio" },
  { id: "finanzas", label: "Finanzas" },
  { id: "educacion", label: "Educación" },
  { id: "construccion", label: "Construcción" },
  { id: "logistica", label: "Logística / Transporte" },
  { id: "gobierno", label: "Gobierno" },
  { id: "otro", label: "Otro" },
]);

export const COMPANY_SIZES = Object.freeze([
  { id: "1-50", label: "1–50" },
  { id: "51-200", label: "51–200" },
  { id: "201-1000", label: "201–1000" },
  { id: "1000+", label: "1000+" },
]);

export const SHIFTS = Object.freeze([
  { id: "diurno", label: "Diurno" },
  { id: "nocturno", label: "Nocturno" },
  { id: "rotativo", label: "Rotativo" },
  { id: "mixto", label: "Mixto" },
]);

const ID_SET = (arr) => new Set(arr.map((x) => x.id));
const INDUSTRY_IDS = ID_SET(INDUSTRIES);
const SIZE_IDS = ID_SET(COMPANY_SIZES);
const SHIFT_IDS = ID_SET(SHIFTS);

// Un valor de cohorte es válido si es null/"" (limpiar) o un id conocido.
function validField(v, set) {
  if (v == null || v === "") return { ok: true, value: null };
  if (typeof v === "string" && set.has(v)) return { ok: true, value: v };
  return { ok: false };
}

/**
 * Valida/normaliza el payload de cohorte. Devuelve { ok, value, errors }.
 * value contiene solo los campos presentes y válidos (null = limpiar).
 */
export function validateCohort(body) {
  const out = {};
  const errors = [];
  if ("industry" in (body || {})) {
    const r = validField(body.industry, INDUSTRY_IDS);
    if (!r.ok) errors.push("industry"); else out.industry = r.value;
  }
  if ("companySize" in (body || {})) {
    const r = validField(body.companySize, SIZE_IDS);
    if (!r.ok) errors.push("companySize"); else out.companySize = r.value;
  }
  if ("shift" in (body || {})) {
    const r = validField(body.shift, SHIFT_IDS);
    if (!r.ok) errors.push("shift"); else out.shift = r.value;
  }
  return errors.length ? { ok: false, errors } : { ok: true, value: out };
}

export function industryLabel(id) {
  return INDUSTRIES.find((x) => x.id === id)?.label || id || null;
}
