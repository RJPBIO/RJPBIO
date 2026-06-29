/* ═══════════════════════════════════════════════════════════════
   NOM-035 LONGITUDINAL — comparación período-a-período por dominio.
   ───────────────────────────────────────────────────────────────
   Convierte la foto de cumplimiento (una aplicación) en instrumento de
   gestión: ¿qué dominios mejoraron o empeoraron entre el período base y
   el actual? Funciones puras, testeables sin render.

   Dirección de riesgo (clave): en NOM-035 MÁS puntaje = MÁS riesgo. Por
   eso un delta NEGATIVO (el puntaje bajó) significa que el riesgo MEJORÓ.

   Trabaja sobre "snapshots" { total, porDominio } — sirve igual para una
   respuesta individual (porDominio crudo) que para un agregado org
   (avgTotal / avgPorDominio de aggregateScores, con k-anon ≥ 5).
   ═══════════════════════════════════════════════════════════════ */

import { computeNivel } from "./scoring";

export const NIVEL_ORDER = ["nulo", "bajo", "medio", "alto", "muy_alto"];
export const NIVEL_LABEL = Object.freeze({
  nulo: "Nulo o despreciable",
  bajo: "Bajo",
  medio: "Medio",
  alto: "Alto",
  muy_alto: "Muy alto",
});

// Cut-points por dominio = Anexo III oficial (NOM-035 Guía III). Fuente
// única para clasificar el nivel de riesgo de cada dominio en features
// longitudinales. Nom35PersonalReport.jsx mantiene su propia copia inline
// para el render del PDF; ambas derivan de Anexo III — si los cortes
// oficiales cambian, actualizar los dos. (cuts = [nulo→bajo, bajo→medio,
// medio→alto, alto→muy_alto]; score <= cuts[i] cae en el nivel i.)
export const DOMINIO_META = Object.freeze([
  { id: "condiciones",    label: "Condiciones en el ambiente de trabajo",        categoria: "ambiente",  itemCount: 5,  cuts: [4, 7, 10, 13] },
  { id: "carga",          label: "Carga de trabajo",                             categoria: "actividad", itemCount: 12, cuts: [14, 19, 24, 29] },
  { id: "falta_control",  label: "Falta de control sobre el trabajo",            categoria: "actividad", itemCount: 8,  cuts: [9, 14, 19, 24] },
  { id: "jornada",        label: "Jornada de trabajo",                           categoria: "tiempo",    itemCount: 3,  cuts: [3, 5, 7, 9] },
  { id: "interferencia",  label: "Interferencia en la relación trabajo-familia", categoria: "tiempo",    itemCount: 4,  cuts: [4, 6, 8, 10] },
  { id: "liderazgo",      label: "Liderazgo",                                    categoria: "liderazgo", itemCount: 6,  cuts: [4, 7, 10, 13] },
  { id: "relaciones",     label: "Relaciones en el trabajo",                     categoria: "liderazgo", itemCount: 6,  cuts: [4, 7, 10, 13] },
  { id: "violencia",      label: "Violencia laboral",                            categoria: "liderazgo", itemCount: 8,  cuts: [6, 10, 14, 18] },
  { id: "reconocimiento", label: "Reconocimiento del desempeño",                 categoria: "entorno",   itemCount: 9,  cuts: [7, 10, 13, 16] },
  { id: "pertenencia",    label: "Sentido de pertenencia e estabilidad",         categoria: "entorno",   itemCount: 11, cuts: [8, 13, 18, 23] },
]);

const DOMINIO_BY_ID = Object.fromEntries(DOMINIO_META.map((d) => [d.id, d]));

// Debajo de estos umbrales un cambio se considera "estable" (ruido), no
// mejora/empeora. Evita narrar como tendencia un ±0.3 de promedio.
const DEADBAND_DOMINIO = 1.0;
const DEADBAND_TOTAL = 3.0;

const round1 = (x) => Math.round(Number(x) * 10) / 10;

/** Nivel de riesgo de un dominio dado su score crudo (o promedio). */
export function dominioNivel(dominioId, score) {
  const d = DOMINIO_BY_ID[dominioId];
  const s = Number(score);
  if (!d || !Number.isFinite(s)) return null;
  const c = d.cuts;
  let nivel;
  if (s <= c[0]) nivel = "nulo";
  else if (s <= c[1]) nivel = "bajo";
  else if (s <= c[2]) nivel = "medio";
  else if (s <= c[3]) nivel = "alto";
  else nivel = "muy_alto";
  return { nivel, label: NIVEL_LABEL[nivel] };
}

// Dirección por delta con banda muerta. delta < 0 = bajó riesgo = mejoró.
function directionByDelta(delta, deadband) {
  if (delta <= -deadband) return "improved";
  if (delta >= deadband) return "worsened";
  return "stable";
}

// Dirección por cambio de nivel categórico (más robusto que el puntaje).
function directionByLevel(nivelBefore, nivelAfter) {
  const i = NIVEL_ORDER.indexOf(nivelBefore);
  const j = NIVEL_ORDER.indexOf(nivelAfter);
  if (j < i) return "improved";
  if (j > i) return "worsened";
  return null; // sin cambio de nivel → decide el delta
}

function fmtPts(delta) {
  const mag = Math.abs(delta).toFixed(1);
  if (delta > 0) return `+${mag} pts`;
  if (delta < 0) return `−${mag} pts`; // signo menos tipográfico
  return "0 pts";
}

function domainReading(label, direction, delta, nivelShift) {
  if (nivelShift) return `${label}: ${nivelShift} · ${fmtPts(delta)}`;
  if (direction === "improved") return `${label}: mejoró ${fmtPts(delta)}`;
  if (direction === "worsened") return `${label}: empeoró ${fmtPts(delta)}`;
  return `${label}: estable`;
}

function buildHeadline(direction, nivelB, nivelC, totalDelta, nImproved, nWorsened) {
  const levelChanged = nivelB.nivel !== nivelC.nivel;
  const verb = direction === "improved" ? "bajó" : direction === "worsened" ? "subió" : "se mantuvo";
  const where = levelChanged ? `de ${nivelB.label} a ${nivelC.label}` : `en nivel ${nivelC.label}`;
  const ptsClause = totalDelta === 0 ? "" : ` (${fmtPts(totalDelta)})`;
  const imp = `${nImproved} ${nImproved === 1 ? "dominio mejoró" : "dominios mejoraron"}`;
  const wor = `${nWorsened} ${nWorsened === 1 ? "empeoró" : "empeoraron"}`;
  return `Riesgo general ${verb} ${where}${ptsClause}. ${imp}, ${wor}.`;
}

/**
 * Compara dos snapshots { total, porDominio }. Núcleo reutilizable tanto
 * para una respuesta individual como para un agregado org.
 * @returns objeto con total, dominios[], summary, headline (o {available:false}).
 */
export function compareNom35Snapshots(baseline, current, opts = {}) {
  const domainDeadband = opts.domainDeadband ?? DEADBAND_DOMINIO;
  const totalDeadband = opts.totalDeadband ?? DEADBAND_TOTAL;
  if (!baseline || !current) {
    return { available: false, reason: "Faltan datos de uno de los períodos." };
  }
  const bTotal = Number(baseline.total);
  const cTotal = Number(current.total);
  if (!Number.isFinite(bTotal) || !Number.isFinite(cTotal)) {
    return { available: false, reason: "Totales inválidos en los períodos." };
  }

  const totalDelta = round1(cTotal - bTotal);
  const nivelB = computeNivel(bTotal);
  const nivelC = computeNivel(cTotal);
  const totalDirection =
    directionByLevel(nivelB.nivel, nivelC.nivel) ?? directionByDelta(totalDelta, totalDeadband);

  const dominios = DOMINIO_META.map((d) => {
    const b = Number(baseline.porDominio?.[d.id] ?? 0);
    const c = Number(current.porDominio?.[d.id] ?? 0);
    const delta = round1(c - b);
    const nb = dominioNivel(d.id, b);
    const nc = dominioNivel(d.id, c);
    const levelDir = directionByLevel(nb.nivel, nc.nivel);
    const direction = levelDir ?? directionByDelta(delta, domainDeadband);
    const nivelShift = nb.nivel !== nc.nivel ? `${nb.label} → ${nc.label}` : null;
    return {
      id: d.id,
      label: d.label,
      categoria: d.categoria,
      baseline: round1(b),
      current: round1(c),
      delta,
      direction,
      nivelBaseline: nb.nivel,
      nivelCurrent: nc.nivel,
      nivelShift,
      reading: domainReading(d.label, direction, delta, nivelShift),
    };
  });

  const improved = dominios.filter((x) => x.direction === "improved");
  const worsened = dominios.filter((x) => x.direction === "worsened");
  const stable = dominios.filter((x) => x.direction === "stable");
  const biggestImprovement = improved.slice().sort((a, b) => a.delta - b.delta)[0] || null;
  const biggestWorsening = worsened.slice().sort((a, b) => b.delta - a.delta)[0] || null;

  return {
    available: true,
    total: {
      baseline: round1(bTotal),
      current: round1(cTotal),
      delta: totalDelta,
      direction: totalDirection,
      nivelBaseline: nivelB.nivel,
      nivelCurrent: nivelC.nivel,
      nivelShift: nivelB.nivel !== nivelC.nivel ? `${nivelB.label} → ${nivelC.label}` : null,
    },
    dominios,
    summary: {
      improved: improved.map((x) => x.id),
      worsened: worsened.map((x) => x.id),
      stable: stable.map((x) => x.id),
      biggestImprovement,
      biggestWorsening,
    },
    headline: buildHeadline(totalDirection, nivelB, nivelC, totalDelta, improved.length, worsened.length),
  };
}

/**
 * Compara dos agregados org (resultados de aggregateScores). Respeta la
 * supresión por k-anon: si cualquier período tiene N < minN, no compara.
 */
export function compareNom35Aggregates(baseline, current, opts = {}) {
  if (!baseline || baseline.suppressed) {
    return { available: false, reason: baseline?.reason || "Período base sin muestra suficiente (k-anon)." };
  }
  if (!current || current.suppressed) {
    return { available: false, reason: current?.reason || "Período actual sin muestra suficiente (k-anon)." };
  }
  const cmp = compareNom35Snapshots(
    { total: baseline.avgTotal, porDominio: baseline.avgPorDominio },
    { total: current.avgTotal, porDominio: current.avgPorDominio },
    opts
  );
  return { ...cmp, n: { baseline: baseline.n, current: current.n } };
}

/**
 * Divide respuestas (Nom35Response o scoreAnswers con completedAt/ts) en
 * dos ventanas contiguas de `periodDays`: actual [now-P, now] y base
 * [now-2P, now-P). Devuelve { baseline, current } listos para aggregateScores.
 */
export function splitByPeriod(responses, { now = Date.now(), periodDays = 90 } = {}) {
  const periodMs = periodDays * 86400000;
  const currentStart = now - periodMs;
  const baselineStart = now - 2 * periodMs;
  const baseline = [];
  const current = [];
  for (const r of responses || []) {
    const raw = r?.completedAt ?? r?.ts;
    const ts = typeof raw === "number" ? raw : new Date(raw).getTime();
    if (!Number.isFinite(ts)) continue;
    if (ts >= currentStart && ts <= now) current.push(r);
    else if (ts >= baselineStart && ts < currentStart) baseline.push(r);
  }
  return { baseline, current };
}
