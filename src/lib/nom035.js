/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — NOM-035-STPS-2018 REFERENCE QUESTIONNAIRE
   ───────────────────────────────────────────────────────────────
   Norma Oficial Mexicana NOM-035-STPS-2018
   "Factores de riesgo psicosocial en el trabajo — Identificación,
    análisis y prevención."
   Vigente desde octubre 2019. Exige:
   - Guía de Referencia I: Acontecimientos traumáticos severos
   - Guía de Referencia II: ≤15 empleados (46 ítems)
   - Guía de Referencia III: >15 empleados (72 ítems)

   Esta implementación incluye la Guía II completa (46 ítems).
   Escala: 0=nunca, 1=casi nunca, 2=a veces, 3=casi siempre, 4=siempre.
   Cálculo por categoría y nivel de riesgo según anexos de la norma.
   ═══════════════════════════════════════════════════════════════ */

export const NOM035_SCALE = [
  { score: 0, label: "Nunca" },
  { score: 1, label: "Casi nunca" },
  { score: 2, label: "A veces" },
  { score: 3, label: "Casi siempre" },
  { score: 4, label: "Siempre" },
];

/**
 * Guía de Referencia II — 46 ítems oficiales.
 * Categorías y dominios mapeados al Anexo III de la norma.
 * Ítems marcados `reverse: true` invierten la escala en el cálculo.
 */
export const NOM035_ITEMS_GUIA_II = [
  { id: 1, cat: "ambiente", dom: "condiciones", q: "En mi trabajo debo brindar servicio a clientes o usuarios: por lo cual tengo que atender sus demandas y resolver sus problemas." },
  { id: 2, cat: "ambiente", dom: "condiciones", q: "Por la cantidad de trabajo que tengo debo quedarme tiempo adicional a mi turno." },
  { id: 3, cat: "ambiente", dom: "condiciones", q: "Por la cantidad de trabajo que tengo debo trabajar sin parar." },
  { id: 4, cat: "factores", dom: "carga_cuantitativa", q: "Considero que es necesario mantener un ritmo de trabajo acelerado." },
  { id: 5, cat: "factores", dom: "carga_mental", q: "Mi trabajo exige que esté muy concentrado." },
  { id: 6, cat: "factores", dom: "carga_mental", q: "Mi trabajo requiere que memorice mucha información." },
  { id: 7, cat: "factores", dom: "carga_mental", q: "En mi trabajo tengo que tomar decisiones difíciles muy rápido." },
  { id: 8, cat: "factores", dom: "carga_mental", q: "Mi trabajo exige que atienda varios asuntos al mismo tiempo." },
  { id: 9, cat: "factores", dom: "carga_ritmos", q: "En mi trabajo soy responsable de las consecuencias que puede traer un error en el proceso o producto." },
  { id: 10, cat: "factores", dom: "carga_ritmos", q: "En mi trabajo soy responsable de dinero o de la seguridad de otros." },
  { id: 11, cat: "factores", dom: "jornada", q: "Trabajo horas extras más de tres veces a la semana." },
  { id: 12, cat: "factores", dom: "jornada", q: "Mi trabajo me exige laborar en días de descanso, festivos o fines de semana." },
  { id: 13, cat: "factores", dom: "jornada", q: "Considero que el tiempo en el trayecto de mi casa al trabajo y viceversa se me hace largo." },
  { id: 14, cat: "factores", dom: "interferencia", q: "Pienso en las actividades familiares o personales cuando estoy en mi trabajo.", reverse: true },
  { id: 15, cat: "factores", dom: "interferencia", q: "Pienso que mis responsabilidades familiares o personales afectan mi trabajo.", reverse: true },
  { id: 16, cat: "organizacion", dom: "liderazgo", q: "Mi jefe tiene problemas para comunicarse conmigo." },
  { id: 17, cat: "organizacion", dom: "liderazgo", q: "La orientación que me da mi jefe me ayuda a realizar mejor mi trabajo.", reverse: true },
  { id: 18, cat: "organizacion", dom: "liderazgo", q: "Mi jefe ayuda a solucionar los problemas que se presentan en el trabajo.", reverse: true },
  { id: 19, cat: "organizacion", dom: "relaciones", q: "Puedo confiar en mis compañeros de trabajo.", reverse: true },
  { id: 20, cat: "organizacion", dom: "relaciones", q: "Entre compañeros solucionamos los problemas de trabajo de forma respetuosa.", reverse: true },
  { id: 21, cat: "organizacion", dom: "relaciones", q: "En mi trabajo me dan información oportuna sobre lo que hago bien o mal.", reverse: true },
  { id: 22, cat: "organizacion", dom: "violencia", q: "En mi trabajo puedo expresarme libremente sin interrupciones.", reverse: true },
  { id: 23, cat: "organizacion", dom: "violencia", q: "Recibo críticas constantes a mi persona o trabajo." },
  { id: 24, cat: "organizacion", dom: "violencia", q: "Recibo poca o nula información sobre el desempeño de mi trabajo." },
  { id: 25, cat: "organizacion", dom: "violencia", q: "Las personas me ignoran o se silencian cuando me acerco." },
  { id: 26, cat: "organizacion", dom: "violencia", q: "Han ignorado mis opiniones o aportaciones." },
  { id: 27, cat: "organizacion", dom: "violencia", q: "Siento que me critican más y peor que a otros compañeros." },
  { id: 28, cat: "organizacion", dom: "violencia", q: "Recibo burlas, calumnias, difamaciones, humillaciones públicas o insultos." },
  { id: 29, cat: "organizacion", dom: "violencia", q: "Me han expresado de forma agresiva o descortés." },
  { id: 30, cat: "organizacion", dom: "violencia", q: "Me han obligado a hacer cosas que van contra mis valores." },
  { id: 31, cat: "organizacion", dom: "violencia", q: "Me han asignado cargas de trabajo excesivas, tareas irrelevantes o sin sentido." },
  { id: 32, cat: "organizacion", dom: "violencia", q: "Me han manipulado para perjudicarme." },
  { id: 33, cat: "organizacion", dom: "violencia", q: "Han dañado mis pertenencias o equipo de trabajo." },
  { id: 34, cat: "organizacion", dom: "violencia", q: "Me han amenazado." },
  { id: 35, cat: "organizacion", dom: "violencia", q: "He presenciado actos de violencia en mi centro de trabajo." },
  { id: 36, cat: "entorno", dom: "pertenencia", q: "Me siento orgulloso de trabajar en esta empresa.", reverse: true },
  { id: 37, cat: "entorno", dom: "pertenencia", q: "Siento que mi trabajo es importante para la empresa.", reverse: true },
  { id: 38, cat: "entorno", dom: "reconocimiento", q: "Por la cantidad de trabajo que tengo, me siento presionado." },
  { id: 39, cat: "entorno", dom: "reconocimiento", q: "Considero que las actividades laborales me impiden desarrollar personalmente." },
  { id: 40, cat: "entorno", dom: "insercion", q: "Considero que mi trabajo afecta negativamente mi vida familiar." },
  { id: 41, cat: "entorno", dom: "insercion", q: "En mi trabajo reconocen mi esfuerzo solo si termino bien.", reverse: true },
  { id: 42, cat: "entorno", dom: "capacitacion", q: "Me informan con claridad cuáles son mis funciones.", reverse: true },
  { id: 43, cat: "entorno", dom: "capacitacion", q: "La capacitación que me dan en el trabajo es útil.", reverse: true },
  { id: 44, cat: "entorno", dom: "capacitacion", q: "Recibo retroalimentación sobre mi trabajo.", reverse: true },
  { id: 45, cat: "entorno", dom: "reconocimiento", q: "Recibo el pago correspondiente a mis actividades.", reverse: true },
  { id: 46, cat: "entorno", dom: "reconocimiento", q: "Puedo aspirar a un mejor puesto.", reverse: true },
];

export const NOM035_CATEGORIES = {
  ambiente: "Ambiente de trabajo",
  factores: "Factores propios de la actividad",
  organizacion: "Organización del tiempo y liderazgo",
  entorno: "Entorno organizacional",
};

/**
 * Calculate raw score per item, handling reverse items.
 */
function itemScore(item, rawScore) {
  const safe = Math.max(0, Math.min(4, rawScore));
  return item.reverse ? 4 - safe : safe;
}

/**
 * Total questionnaire score and per-category breakdown.
 * @param {Record<number, number>} answers - { [itemId]: 0-4 }
 */
export function scoreNOM035({ answers, items = NOM035_ITEMS_GUIA_II }) {
  let total = 0;
  const byCat = {};
  const byDom = {};
  for (const item of items) {
    const raw = answers[item.id];
    if (typeof raw !== "number") continue;
    const s = itemScore(item, raw);
    total += s;
    byCat[item.cat] = (byCat[item.cat] || 0) + s;
    byDom[item.dom] = (byDom[item.dom] || 0) + s;
  }
  return { total, byCat, byDom, level: riskLevel(total) };
}

/**
 * Risk level classification per Anexo III, Guía II (46 ítems).
 * Official cutoffs from NOM-035-STPS-2018:
 */
export function riskLevel(total) {
  if (total < 50) return { key: "null_or_low", label: "Nulo o despreciable", priority: 0 };
  if (total < 75) return { key: "low", label: "Bajo", priority: 1 };
  if (total < 99) return { key: "medium", label: "Medio", priority: 2 };
  if (total < 140) return { key: "high", label: "Alto", priority: 3 };
  return { key: "very_high", label: "Muy alto", priority: 4 };
}

/**
 * Action recommendations per level, aligned with Art. 7 y 8 de la NOM.
 */
export function actionsFor(levelKey) {
  const map = {
    null_or_low: "Mantener acciones preventivas y medir anualmente.",
    low: "Reforzar comunicación y revisar cargas de trabajo puntuales. Medición semestral.",
    medium: "Implementar plan de acción documentado, medidas correctivas y vigilancia clínica si aplica.",
    high: "Acciones correctivas inmediatas, examen médico a trabajadores afectados, evaluación de líderes y carga.",
    very_high: "Intervención urgente. Aislar causas, reestructurar actividad y exámenes médicos obligatorios.",
  };
  return map[levelKey] || "";
}

/**
 * Aggregate responses across a team for the B2B dashboard.
 * Preserves k-anonymity (requires ≥ minK individual responses).
 */
export function aggregateTeam(responses, { minK = 5 } = {}) {
  if (!Array.isArray(responses) || responses.length < minK) {
    return { insufficient: true, n: responses?.length || 0, minK };
  }
  const scores = responses.map((r) => scoreNOM035({ answers: r.answers }).total);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const sd = Math.sqrt(scores.reduce((a, b) => a + (b - mean) ** 2, 0) / (scores.length - 1));
  const levels = scores.map((s) => riskLevel(s).key);
  const counts = levels.reduce((acc, l) => ({ ...acc, [l]: (acc[l] || 0) + 1 }), {});
  return {
    insufficient: false,
    n: scores.length,
    mean: +mean.toFixed(1),
    sd: +sd.toFixed(1),
    distribution: counts,
    highRiskPct: +(((counts.high || 0) + (counts.very_high || 0)) / scores.length * 100).toFixed(1),
  };
}
