/* ═══════════════════════════════════════════════════════════════
   NOM-035 scoring (Guía de Referencia III)
   Función pura — testeable sin render.

   Entrada: answers = { [itemId]: 0..4 }  (Likert)
   Salida: {
     completedCount, missingCount,
     total,
     porDominio:   { condiciones: N, carga: N, ... },
     porCategoria: { ambiente: N, actividad: N, ... },
     nivel: "nulo"|"bajo"|"medio"|"alto"|"muy_alto",
     nivelLabel,
     recomendacion: string
   }
   ═══════════════════════════════════════════════════════════════ */

import { ITEMS, DOMINIOS, CATEGORIAS, NIVEL_TOTAL } from "./items";

/**
 * Convierte el valor Likert al score final (respetando reverse).
 * reverse=true: el ítem está en positivo; alta frecuencia = bajo riesgo.
 */
export function itemScore(value, reverse) {
  const v = Number(value);
  if (!Number.isFinite(v) || v < 0 || v > 4) return null;
  return reverse ? 4 - v : v;
}

export function computeNivel(total) {
  const n = NIVEL_TOTAL.find((r) => total <= r.max);
  return n || NIVEL_TOTAL[NIVEL_TOTAL.length - 1];
}

/** Recomendación por nivel — texto para el usuario y hook de BIO. */
export function recomendacionPorNivel(nivel) {
  switch (nivel) {
    case "nulo":
      return "Sin riesgo apreciable. Mantén tus hábitos actuales.";
    case "bajo":
      return "Riesgo bajo. Un protocolo corto de enfoque una vez al día ayuda a sostener.";
    case "medio":
      return "Riesgo medio. Recomendamos un protocolo de reset 2 veces al día (mañana y tarde).";
    case "alto":
      return "Riesgo alto. Protocolo de calma recomendado al menos 3 veces al día; habla con tu líder sobre carga.";
    case "muy_alto":
      return "Riesgo muy alto. Solicita valoración clínica por Recursos Humanos / Medicina del Trabajo y usa protocolos de calma diarios.";
    default:
      return "";
  }
}

/** Lista de ítems por dominio (útil para validar completitud). */
const ITEMS_BY_DOMINIO = ITEMS.reduce((acc, it) => {
  (acc[it.dominio] = acc[it.dominio] || []).push(it);
  return acc;
}, {});

const DOMINIO_TO_CATEGORIA = Object.values(DOMINIOS).reduce((acc, d) => {
  acc[d.id] = d.categoria;
  return acc;
}, {});

/**
 * Agrega las respuestas y devuelve el resultado completo.
 * No modifica la entrada.
 */
export function scoreAnswers(answers) {
  const porDominio = {};
  const porCategoria = {};
  let total = 0;
  let completedCount = 0;
  const missingItems = [];

  for (const it of ITEMS) {
    const raw = answers?.[it.id];
    const s = itemScore(raw, it.reverse);
    if (s === null) {
      missingItems.push(it.id);
      continue;
    }
    completedCount += 1;
    total += s;
    porDominio[it.dominio] = (porDominio[it.dominio] || 0) + s;
    const cat = DOMINIO_TO_CATEGORIA[it.dominio];
    if (cat) porCategoria[cat] = (porCategoria[cat] || 0) + s;
  }

  // Asegurar claves 0 para dominios/categorías sin respuestas
  for (const d of Object.values(DOMINIOS)) {
    if (porDominio[d.id] === undefined) porDominio[d.id] = 0;
  }
  for (const c of Object.values(CATEGORIAS)) {
    if (porCategoria[c.id] === undefined) porCategoria[c.id] = 0;
  }

  const nivelInfo = computeNivel(total);
  return {
    completedCount,
    missingCount: missingItems.length,
    missingItems,
    total,
    porDominio,
    porCategoria,
    nivel: nivelInfo.nivel,
    nivelLabel: nivelInfo.label,
    recomendacion: recomendacionPorNivel(nivelInfo.nivel),
  };
}

/**
 * Agregación de múltiples respuestas para dashboard admin.
 * Promedia total y dominios/categorías; requiere N mínimo por privacidad.
 *
 * @param {Array} responses — array de `scoreAnswers(...)` results
 * @param {number} minN — N mínimo para reportar (default 5)
 */
export function aggregateScores(responses, { minN = 5 } = {}) {
  const n = responses.length;
  if (n < minN) {
    return { n, suppressed: true, reason: `Muestra menor a N=${minN}; se omite por privacidad.` };
  }
  const sumDom = {};
  const sumCat = {};
  const nivelCounts = { nulo: 0, bajo: 0, medio: 0, alto: 0, muy_alto: 0 };
  let sumTotal = 0;
  for (const r of responses) {
    sumTotal += r.total;
    nivelCounts[r.nivel] = (nivelCounts[r.nivel] || 0) + 1;
    for (const [k, v] of Object.entries(r.porDominio || {})) {
      sumDom[k] = (sumDom[k] || 0) + v;
    }
    for (const [k, v] of Object.entries(r.porCategoria || {})) {
      sumCat[k] = (sumCat[k] || 0) + v;
    }
  }
  const avg = (x) => Math.round((x / n) * 10) / 10;
  const avgTotal = avg(sumTotal);
  return {
    n,
    suppressed: false,
    avgTotal,
    nivelPromedio: computeNivel(avgTotal).nivel,
    avgPorDominio: Object.fromEntries(Object.entries(sumDom).map(([k, v]) => [k, avg(v)])),
    avgPorCategoria: Object.fromEntries(Object.entries(sumCat).map(([k, v]) => [k, avg(v)])),
    nivelCounts,
    porDominioAltoRiesgo: Object.entries(sumDom)
      .map(([k, v]) => ({ dominio: k, avg: avg(v) }))
      .sort((a, b) => b.avg - a.avg),
  };
}

export { ITEMS_BY_DOMINIO };
