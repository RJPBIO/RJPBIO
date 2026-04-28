/* ═══════════════════════════════════════════════════════════════
   NOM-035 PERSONAL REPORT — Preview con datos aleatorios

   Genera un HTML autocontenido con la estética BIO-IGNICIÓN del
   home: BioGlyph asimétrico (3 rayos + núcleo cyan→ignition + halo
   + anillo punteado), wordmark "BIO — IGNICIÓN" idéntico, paleta
   phosphorCyan (#22D3EE) + ignition (#FDE68A).

   Privacidad: el reporte SOLO contiene datos que el usuario tiene
   derecho a ver de SI MISMO. Nada de agregados del org, nada de
   datos de otros, nada de PII de la empresa.

   Uso:
     node scripts/sim-nom35-personal-report.mjs
     → genera tmp/Reporte-NOM35-Personal-Preview.html
   ═══════════════════════════════════════════════════════════════ */

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Brand tokens (idénticos a src/lib/tokens.js) ──────────
const BRAND = {
  phosphorCyan:    "#22D3EE",
  phosphorCyanInk: "#155E75",
  ghostCyan:       "#A5F3FC",
  ignition:        "#FDE68A",
  signalAmber:     "#FBBF24",
  neuralViolet:    "#8B5CF6",
  plasmaPink:      "#F472B6",
  plasmaRed:       "#F43F5E",
  deepField:       "#050810",
  bgPrint:         "#FFFFFF",
  ink:             "#0B1320",
  inkDim:          "#475569",
  inkSoft:         "#94A3B8",
  hairline:        "#E2E8F0",
  hairlineSoft:    "#F1F5F9",
};

// ─── PRNG reproducible ──────────────────────────────
function rngFactory(seed = 2026) {
  let s = seed >>> 0;
  return () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = rngFactory(Date.now() & 0xffffffff);
const randInt = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));

// ─── Catálogo NOM-035 (espejo lógico de src/lib/nom35) ─────
// Cutoffs por dominio según Anexo III (estructuralmente alineados; verificar
// texto literal vs DOF 23-oct-2018 antes de uso formal). Cada `cuts` es la
// banda superior (max ≤) por nivel: [nulo, bajo, medio, alto] — muy_alto = el resto.
const DOMINIOS = [
  { id: "condiciones",   label: "Condiciones en el ambiente de trabajo",         categoria: "ambiente",  itemCount: 5,  cuts: [4,  7,  10, 13] },
  { id: "carga",         label: "Carga de trabajo",                              categoria: "actividad", itemCount: 12, cuts: [14, 19, 24, 29] },
  { id: "falta_control", label: "Falta de control sobre el trabajo",             categoria: "actividad", itemCount: 8,  cuts: [9,  14, 19, 24] },
  { id: "jornada",       label: "Jornada de trabajo",                            categoria: "tiempo",    itemCount: 3,  cuts: [3,  5,  7,  9 ] },
  { id: "interferencia", label: "Interferencia en la relación trabajo-familia",  categoria: "tiempo",    itemCount: 4,  cuts: [4,  6,  8,  10] },
  { id: "liderazgo",     label: "Liderazgo",                                     categoria: "liderazgo", itemCount: 6,  cuts: [4,  7,  10, 13] },
  { id: "relaciones",    label: "Relaciones en el trabajo",                      categoria: "liderazgo", itemCount: 6,  cuts: [4,  7,  10, 13] },
  { id: "violencia",     label: "Violencia laboral",                             categoria: "liderazgo", itemCount: 8,  cuts: [6,  10, 14, 18] },
  { id: "reconocimiento",label: "Reconocimiento del desempeño",                  categoria: "entorno",   itemCount: 9,  cuts: [7,  10, 13, 16] },
  { id: "pertenencia",   label: "Sentido de pertenencia e estabilidad",          categoria: "entorno",   itemCount: 11, cuts: [8,  13, 18, 23] },
];

// Acción BIO-IGNICIÓN por dominio (cuando es el peor).
// `severeOnly: true` se usa para dominios donde derivar a clínico/SST es la
// respuesta primaria, no un protocolo de la PWA. Para esos, el reporte hace
// referral, no auto-prescripción.
const PROTO_PER_DOMINIO = {
  carga:         { protocolId: 3,  protocolName: "Reset Ejecutivo",     dose: "2× al día durante 21 días",  rationale: "filtra prioridades cognitivas y ancla 60 min de trabajo focalizado." },
  falta_control: { protocolId: 2,  protocolName: "Activación Cognitiva",dose: "1× cada mañana durante 14 días", rationale: "etiquetado emocional + visualización dirigida — recupera sentido de agencia." },
  jornada:       { protocolId: 1,  protocolName: "Reinicio Parasimpático", dose: "1× al final del turno durante 14 días", rationale: "transición turno→descanso vía respiración box 4-4-4-4." },
  interferencia: { protocolId: 1,  protocolName: "Reinicio Parasimpático", dose: "1× antes de llegar a casa durante 14 días", rationale: "marca límite cognitivo entre trabajo y vida personal." },
  liderazgo:     { protocolId: 3,  protocolName: "Reset Ejecutivo",     dose: "1× antes de reuniones críticas", rationale: "regula carga de decisiones bajo supervisión. Considera hablar con tu líder sobre claridad de instrucciones." },
  relaciones:    { protocolId: 2,  protocolName: "Activación Cognitiva", dose: "1× al día durante 14 días", rationale: "regulación afectiva mejora capacidad de respuesta no-reactiva en interacciones difíciles." },
  violencia:     { protocolId: null, protocolName: null, dose: null, rationale: "Este dominio no se atiende con protocolos de bienestar. Solicita protocolo de denuncia y atención conforme al Art. 8 NOM-035 y Ley General para la Igualdad. La plataforma no sustituye este recurso.", severeOnly: true },
  reconocimiento:{ protocolId: 11, protocolName: "Quantum Grounding",   dose: "1× al día durante 21 días", rationale: "anclaje en valor intrínseco — útil cuando el reconocimiento externo es escaso o inconsistente." },
  pertenencia:   { protocolId: 6,  protocolName: "Grounded Steel",      dose: "1× al día durante 14 días", rationale: "presencia inquebrantable — sostiene identidad profesional cuando hay incertidumbre laboral." },
  condiciones:   { protocolId: null, protocolName: null, dose: null, rationale: "Este dominio refiere a infraestructura física (ruido, iluminación, seguridad). Documenta en bitácora y eleva al área de Seguridad y Salud en el Trabajo (SST) de tu empresa.", severeOnly: true },
};
const CATEGORIAS = [
  { id: "ambiente",  label: "Ambiente de trabajo" },
  { id: "actividad", label: "Factores propios de la actividad" },
  { id: "tiempo",    label: "Organización del tiempo de trabajo" },
  { id: "liderazgo", label: "Liderazgo y relaciones en el trabajo" },
  { id: "entorno",   label: "Entorno organizacional" },
];
const NIVELES = [
  { nivel: "nulo",     max: 49,       label: "Nulo o despreciable", color: BRAND.phosphorCyan,  text: "Sin riesgo apreciable. Mantén tus hábitos actuales." },
  { nivel: "bajo",     max: 69,       label: "Bajo",                color: BRAND.phosphorCyan,  text: "Riesgo bajo. Un protocolo corto de enfoque una vez al día ayuda a sostener." },
  { nivel: "medio",    max: 89,       label: "Medio",               color: BRAND.signalAmber,   text: "Riesgo medio. Recomendamos un protocolo de reset 2 veces al día (mañana y tarde)." },
  { nivel: "alto",     max: 139,      label: "Alto",                color: BRAND.plasmaRed,     text: "Riesgo alto. Protocolo de calma recomendado al menos 3 veces al día; habla con tu líder sobre carga." },
  { nivel: "muy_alto", max: Infinity, label: "Muy alto",            color: BRAND.plasmaRed,     text: "Riesgo muy alto. Solicita valoración clínica por Recursos Humanos / Medicina del Trabajo y usa protocolos de calma diarios." },
];

function nivelByTotal(total) {
  return NIVELES.find((n) => total <= n.max);
}

// Resuelve nivel oficial por dominio según Anexo III.
function nivelByDomain(dominio, score) {
  const c = dominio.cuts;
  if (score <= c[0]) return NIVELES[0]; // nulo
  if (score <= c[1]) return NIVELES[1]; // bajo
  if (score <= c[2]) return NIVELES[2]; // medio
  if (score <= c[3]) return NIVELES[3]; // alto
  return NIVELES[4]; // muy alto
}

// Severidad numérica para detectar el dominio "peor" — combina nivel
// y proximidad al techo del nivel para desempates.
function domainSeverity(dominio, score) {
  const order = ["nulo", "bajo", "medio", "alto", "muy_alto"];
  const nivel = nivelByDomain(dominio, score);
  const idx = order.indexOf(nivel.nivel);
  const pct = (score / (dominio.itemCount * 4));
  return idx * 100 + pct * 99; // idx domina, % desempata
}

// ─── Datos aleatorios (perfil "ejecutivo bajo presión", nivel medio) ─
function simulate() {
  // Para que el preview se sienta realista, generamos un perfil con
  // carga alta + falta de control + interferencia (típico admin/exec)
  // y dominios sociales (relaciones, liderazgo) en buen estado.
  const porDominio = {};
  for (const d of DOMINIOS) {
    const max = d.itemCount * 4;
    let pct;
    if (d.id === "carga" || d.id === "interferencia") pct = 0.55 + rng() * 0.20;       // alto-medio
    else if (d.id === "falta_control") pct = 0.40 + rng() * 0.20;                       // medio
    else if (d.id === "violencia") pct = 0.05 + rng() * 0.10;                           // muy bajo (afortunadamente)
    else if (d.id === "relaciones" || d.id === "liderazgo") pct = 0.20 + rng() * 0.20;  // bajo
    else pct = 0.25 + rng() * 0.30;
    porDominio[d.id] = Math.round(max * pct);
  }
  const total = Object.values(porDominio).reduce((a, b) => a + b, 0);
  const nivelInfo = nivelByTotal(total);
  // Categorías = suma de sus dominios
  const porCategoria = {};
  for (const c of CATEGORIAS) {
    porCategoria[c.id] = DOMINIOS
      .filter((d) => d.categoria === c.id)
      .reduce((a, d) => a + (porDominio[d.id] || 0), 0);
  }
  return { total, nivel: nivelInfo.nivel, nivelLabel: nivelInfo.label, nivelText: nivelInfo.text, nivelColor: nivelInfo.color, porDominio, porCategoria };
}

const result = simulate();

// Hash truncado para identificación del reporte (no PII; un hash artificial reproducible)
const reportCode = Array.from({ length: 12 }, () =>
  "0123456789abcdef"[Math.floor(rng() * 16)]
).join("").replace(/(.{4})/g, "$1·").replace(/·$/, "");

const reportDate = new Date();
const fmtDate = reportDate.toLocaleDateString("es-MX", {
  day: "2-digit", month: "long", year: "numeric",
});
const fmtDateShort = reportDate.toLocaleDateString("es-MX", {
  day: "2-digit", month: "2-digit", year: "numeric",
});

// ─── BioGlyph SVG (mirror exacto de src/components/BioIgnicionMark) ─
function bioGlyphSvg(size = 64) {
  const c = size / 2;
  const rNode = size * 0.13;
  const rHalo = size * 0.42;
  const rayLen = size * 0.34;
  // Rayos asimétricos: 30° (= -π/6 desde +x), 210° (= 7π/6), 90° (= π/2)
  const rays = [
    { a: -Math.PI / 6,        op: 1.0 },
    { a: (7 * Math.PI) / 6,   op: 0.7 },
    { a: Math.PI / 2,         op: 0.85 },
  ];
  const haloId = `bi-halo-${size}`;
  const coreId = `bi-core-${size}`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="BIO-IGNICIÓN" style="display:block;overflow:visible;flex-shrink:0">
    <defs>
      <radialGradient id="${coreId}" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stop-color="${BRAND.ignition}" stop-opacity="1"/>
        <stop offset="60%" stop-color="${BRAND.phosphorCyan}" stop-opacity="1"/>
        <stop offset="100%" stop-color="${BRAND.phosphorCyan}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="${haloId}" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stop-color="${BRAND.phosphorCyan}" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="${BRAND.phosphorCyan}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="${c}" cy="${c}" r="${rHalo}" fill="url(#${haloId})"/>
    <circle cx="${c}" cy="${c}" r="${rHalo * 0.85}" fill="none" stroke="${BRAND.phosphorCyan}" stroke-width="${size * 0.015}" stroke-dasharray="${size * 0.02} ${size * 0.035}" opacity="0.5"/>
    ${rays.map((r) => {
      const x2 = c + Math.cos(r.a) * rayLen;
      const y2 = c + Math.sin(r.a) * rayLen;
      return `<line x1="${c}" y1="${c}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${BRAND.phosphorCyan}" stroke-width="${size * 0.05}" stroke-linecap="round" opacity="${r.op}"/>`;
    }).join("")}
    <circle cx="${c}" cy="${c}" r="${rNode}" fill="url(#${coreId})"/>
    <circle cx="${c}" cy="${c}" r="${rNode * 0.35}" fill="${BRAND.ignition}" opacity="0.95"/>
  </svg>`;
}

/**
 * MARCA CANÓNICA — única función autorizada para renderizar BIO-IGNICIÓN.
 *
 * Proporciones FIJAS a cualquier escala (Amazon-style):
 *   text-size      = 0.42 × glyph-size
 *   gap glifo→text = 0.42 × glyph-size
 *   letter-spacing = 0.22em (proporcional al texto, no px fijo)
 *   gap entre BIO/dash/IGNICIÓN = 0.18em
 *   pesos: BIO 400 (opacity 0.7) · — cyan 700 · IGNICIÓN 900
 *
 * @param {object} opts
 * @param {number|"inline"} opts.size  Si número: glyph diameter en px (con
 *                                       glifo). Si "inline": sin glifo,
 *                                       hereda font-size del padre.
 * @param {string}  opts.colorText      Color de BIO + IGNICIÓN (default ink).
 */
function wordmark({ size = 28, colorText = BRAND.ink } = {}) {
  const isInline = size === "inline";
  const glyphPx = isInline ? null : size;
  const textCss = isInline ? "1em" : `${(size * 0.42).toFixed(2)}px`;
  const gapPx = isInline ? null : `${(glyphPx * 0.42).toFixed(1)}px`;
  return `<span style="display:inline-flex;align-items:center;${isInline ? "" : `gap:${gapPx};`}line-height:1;user-select:none;vertical-align:${isInline ? "baseline" : "middle"};white-space:nowrap">
    ${isInline ? "" : bioGlyphSvg(glyphPx)}
    <span style="display:inline-flex;align-items:baseline;gap:0.18em;font-size:${textCss};letter-spacing:0.22em;text-transform:uppercase;line-height:1">
      <span style="font-weight:400;color:${colorText};opacity:0.7">BIO</span>
      <span style="color:${BRAND.phosphorCyan};font-weight:700">—</span>
      <span style="font-weight:900;color:${colorText}">IGNICIÓN</span>
    </span>
  </span>`;
}

// Patrón QR-like determinístico desde el código del reporte. NO es un QR
// real (no decodifica) — es un anchor visual de autenticidad para el ojo
// humano + el código alfanumérico al lado. Una vez exista endpoint real
// de verificación, sustituir por QR generado con qrcode lib.
function qrLikePattern(seed) {
  // Hash simple del seed para sembrado del PRNG
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  const r = rngFactory(Math.abs(h) || 1);
  const N = 9; // matriz 9x9
  const cells = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      // Tres anclas tipo QR (esquinas top-left, top-right, bottom-left)
      const inAnchor = (
        (x < 3 && y < 3) ||
        (x >= N - 3 && y < 3) ||
        (x < 3 && y >= N - 3)
      );
      const onAnchorEdge = inAnchor && (x === 0 || x === 2 || x === N - 1 || x === N - 3 || y === 0 || y === 2 || y === N - 1 || y === N - 3);
      const onAnchorCenter = (
        (x === 1 && y === 1) ||
        (x === N - 2 && y === 1) ||
        (x === 1 && y === N - 2)
      );
      let on;
      if (inAnchor) on = onAnchorEdge || onAnchorCenter;
      else on = r() > 0.55;
      if (on) cells.push({ x, y });
    }
  }
  const cellSize = 3;
  const total = N * cellSize;
  return `<svg width="60" height="60" viewBox="0 0 ${total} ${total}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="${total}" height="${total}" fill="${BRAND.bgPrint}"/>
    ${cells.map((c) => `<rect x="${c.x * cellSize}" y="${c.y * cellSize}" width="${cellSize}" height="${cellSize}" fill="${BRAND.ink}"/>`).join("")}
  </svg>`;
}

// ─── Helpers de barra/visual ───────────────────────────
// Color y bg por nivel OFICIAL (Anexo III), no por % arbitrario.
function tierVisuals(nivel) {
  switch (nivel) {
    case "nulo":     return { fill: BRAND.phosphorCyan,  bg: "#E0F7FA", chip: "Nulo"     };
    case "bajo":     return { fill: BRAND.phosphorCyan,  bg: "#E0F7FA", chip: "Bajo"     };
    case "medio":    return { fill: BRAND.signalAmber,   bg: "#FEF3C7", chip: "Medio"    };
    case "alto":     return { fill: BRAND.plasmaRed,     bg: "#FEE2E2", chip: "Alto"     };
    case "muy_alto": return { fill: BRAND.plasmaRed,     bg: "#FEE2E2", chip: "Muy alto" };
    default:         return { fill: BRAND.inkSoft,       bg: BRAND.hairlineSoft, chip: "—" };
  }
}

function domainBar(dominio, score, max) {
  const pct = max === 0 ? 0 : Math.min(100, (score / max) * 100);
  const nivelInfo = nivelByDomain(dominio, score);
  const v = tierVisuals(nivelInfo.nivel);
  return `
    <div class="domain-row">
      <div class="domain-label">${dominio.label}</div>
      <div class="domain-bar-wrap" style="background:${v.bg}">
        <div class="domain-bar" style="width:${pct.toFixed(1)}%;background:${v.fill}"></div>
      </div>
      <div class="domain-nivel" style="color:${v.fill}">${v.chip}</div>
      <div class="domain-score" style="color:${BRAND.ink}">${score}<span class="domain-max">/${max}</span></div>
    </div>
  `;
}

// Indicator de nivel: barra horizontal con 5 segmentos, cursor sobre el actual
function nivelMeter(currentNivel) {
  const order = ["nulo", "bajo", "medio", "alto", "muy_alto"];
  const idx = order.indexOf(currentNivel);
  return `
    <div class="meter-wrap">
      ${order.map((n, i) => {
        const info = NIVELES.find((x) => x.nivel === n);
        const active = i === idx;
        return `<div class="meter-seg${active ? " active" : ""}" style="${active ? `--seg:${info.color}` : ""}">
          <span class="meter-seg-label">${info.label}</span>
        </div>`;
      }).join("")}
    </div>
  `;
}

// ─── Build HTML ─────────────────────────────────────
const totalMax = DOMINIOS.reduce((a, d) => a + d.itemCount * 4, 0); // 72*4 = 288

// URL de verificación pública (placeholder — se conecta al endpoint real
// en producción). El user puede entrar y validar autenticidad del reporte.
const VERIFY_URL = `bio-ignicion.com/verify/${reportCode.replace(/·/g, "-")}`;

// ─── Historial simulado: 3 evaluaciones previas + la actual ───
function simulateHistory() {
  const items = [];
  for (let i = 3; i >= 1; i--) {
    const monthsAgo = i * 6; // cada 6 meses
    const d = new Date(reportDate);
    d.setMonth(d.getMonth() - monthsAgo);
    // Tendencia: mejora gradual (total más bajo conforme avanza el tiempo)
    const offset = -i * 6 + Math.round((rng() - 0.5) * 16);
    const total = Math.max(20, Math.min(280, result.total - offset));
    items.push({
      date: d,
      dateLabel: d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }),
      total,
      nivelInfo: nivelByTotal(total),
    });
  }
  items.push({
    date: reportDate,
    dateLabel: reportDate.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }),
    total: result.total,
    nivelInfo: nivelByTotal(result.total),
    isCurrent: true,
  });
  return items;
}
const history = simulateHistory();
const TOTAL_PAGES = 5; // cover + resultado + dominios + historial + legal

// Domains ordenados por SEVERIDAD oficial (no solo % bruto, también nivel)
const domainsSorted = [...DOMINIOS].sort((a, b) => {
  return domainSeverity(b, result.porDominio[b.id] || 0) - domainSeverity(a, result.porDominio[a.id] || 0);
});

// Dominio peor (para sección "Acción concreta")
const worstDomain = domainsSorted[0];
const worstScore = result.porDominio[worstDomain.id] || 0;
const worstNivelInfo = nivelByDomain(worstDomain, worstScore);
const worstAction = PROTO_PER_DOMINIO[worstDomain.id];
const worstIsActionable = worstNivelInfo.nivel === "medio" || worstNivelInfo.nivel === "alto" || worstNivelInfo.nivel === "muy_alto";

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Reporte personal NOM-035 — BIO-IGNICIÓN</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: Letter; margin: 14mm; }
  html, body {
    background: ${BRAND.bgPrint};
    color: ${BRAND.ink};
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    font-size: 10.5pt;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
  }
  .doc {
    max-width: 215.9mm;
    margin: 0 auto;
    background: ${BRAND.bgPrint};
  }
  .page {
    background: ${BRAND.bgPrint};
    padding: 22mm 18mm 16mm;
    page-break-after: always;
    position: relative;
    min-height: 279.4mm;
  }
  .page:last-child { page-break-after: auto; }

  /* Cover en blanco — documento oficial. Identidad por logo + tipografía + acentos cyan. */
  .cover .content {
    min-height: calc(279.4mm - 38mm);
    display: flex;
    flex-direction: column;
  }
  .cover-mark {
    padding-bottom: 8mm;
    border-bottom: 2px solid ${BRAND.phosphorCyan};
    margin-bottom: 18mm;
  }
  .cover-kicker {
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 9pt;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: ${BRAND.phosphorCyanInk};
    margin-bottom: 8mm;
    font-weight: 700;
  }
  .cover-title {
    font-size: 30pt;
    font-weight: 900;
    letter-spacing: -0.6px;
    line-height: 1.05;
    color: ${BRAND.ink};
    margin-bottom: 6mm;
    max-width: 165mm;
  }
  .cover-title em {
    font-style: normal;
    color: ${BRAND.phosphorCyanInk};
  }
  .cover-sub {
    font-size: 12pt;
    color: ${BRAND.inkDim};
    max-width: 155mm;
    line-height: 1.5;
    margin-bottom: 16mm;
  }
  .cover-meta {
    margin-top: auto;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    border-top: 1px solid ${BRAND.hairline};
    padding-top: 10mm;
  }
  .cover-meta-item small {
    display: block;
    font-family: ui-monospace, monospace;
    font-size: 7.5pt;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: ${BRAND.inkDim};
    margin-bottom: 4px;
  }
  .cover-meta-item b {
    font-size: 11pt;
    color: ${BRAND.ink};
    font-weight: 800;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    letter-spacing: 0.04em;
  }
  .cover-foot {
    margin-top: 8mm;
    padding: 5mm 6mm;
    border-left: 3px solid ${BRAND.phosphorCyan};
    background: ${BRAND.hairlineSoft};
    border-radius: 0 8px 8px 0;
    color: ${BRAND.inkDim};
    font-size: 9pt;
    line-height: 1.5;
    max-width: 175mm;
  }
  .cover-foot b { color: ${BRAND.ink}; }

  /* Page chrome (non-cover) */
  .pagehead {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid ${BRAND.hairline};
    padding-bottom: 6mm;
    margin-bottom: 8mm;
    font-family: ui-monospace, monospace;
    font-size: 8pt;
    color: ${BRAND.inkDim};
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }
  .pagehead .left { display: flex; align-items: center; gap: 10px; }
  .pagehead b { color: ${BRAND.phosphorCyanInk}; font-weight: 800; letter-spacing: 3px; }

  h1.section {
    font-size: 18pt;
    font-weight: 900;
    color: ${BRAND.ink};
    letter-spacing: -0.4px;
    margin-bottom: 2mm;
    line-height: 1.1;
  }
  h1.section .accent {
    color: ${BRAND.phosphorCyanInk};
    font-weight: 900;
  }
  .section-sub {
    color: ${BRAND.inkDim};
    font-size: 10pt;
    margin-bottom: 6mm;
  }
  h2 {
    font-family: ui-monospace, monospace;
    font-size: 9pt;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: ${BRAND.phosphorCyanInk};
    font-weight: 800;
    margin-top: 8mm;
    margin-bottom: 4mm;
    padding-bottom: 2mm;
    border-bottom: 1px solid ${BRAND.hairlineSoft};
  }
  p { margin-bottom: 3mm; color: ${BRAND.ink}; }
  p.muted { color: ${BRAND.inkDim}; font-size: 9.5pt; }

  /* Verdict block — todo blanco, identidad por borde cyan + tipografía */
  .verdict {
    display: grid;
    grid-template-columns: 1fr 1.4fr;
    gap: 16px;
    align-items: stretch;
    margin: 4mm 0 8mm;
  }
  .verdict-num {
    background: ${BRAND.bgPrint};
    color: ${BRAND.ink};
    border: 1px solid ${BRAND.hairline};
    border-top: 4px solid ${BRAND.phosphorCyan};
    border-radius: 12px;
    padding: 10mm 8mm;
    text-align: center;
    position: relative;
  }
  .verdict-num small {
    display: block;
    font-family: ui-monospace, monospace;
    font-size: 8pt;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: ${BRAND.phosphorCyanInk};
    margin-bottom: 2mm;
    font-weight: 700;
  }
  .verdict-num .num {
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 56pt;
    font-weight: 900;
    color: ${BRAND.ink};
    line-height: 0.9;
    letter-spacing: -2px;
  }
  .verdict-num .of {
    color: ${BRAND.inkDim};
    font-size: 10pt;
    margin-top: 2mm;
    font-family: ui-monospace, monospace;
  }
  .verdict-card {
    background: ${BRAND.bgPrint};
    border: 1px solid ${BRAND.hairline};
    border-left: 4px solid var(--nivelColor, ${BRAND.phosphorCyan});
    border-radius: 12px;
    padding: 8mm;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .verdict-card .nivel-kicker {
    font-family: ui-monospace, monospace;
    font-size: 8pt;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: ${BRAND.inkDim};
    margin-bottom: 2mm;
    font-weight: 700;
  }
  .verdict-card .nivel-label {
    font-size: 22pt;
    font-weight: 900;
    color: var(--nivelColor, ${BRAND.phosphorCyan});
    margin-bottom: 4mm;
    line-height: 1;
    letter-spacing: -0.5px;
  }
  .verdict-card .nivel-text {
    color: ${BRAND.ink};
    font-size: 10.5pt;
    line-height: 1.5;
  }

  /* Meter de niveles */
  .meter-wrap {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
    margin: 4mm 0;
  }
  .meter-seg {
    background: ${BRAND.hairlineSoft};
    border-radius: 6px;
    padding: 8px 6px;
    text-align: center;
    position: relative;
    border: 1px solid ${BRAND.hairline};
  }
  .meter-seg.active {
    background: var(--seg, ${BRAND.phosphorCyan});
    border-color: var(--seg, ${BRAND.phosphorCyan});
    box-shadow: 0 4px 12px -4px var(--seg, ${BRAND.phosphorCyan});
  }
  .meter-seg-label {
    font-family: ui-monospace, monospace;
    font-size: 7.5pt;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-weight: 700;
    color: ${BRAND.inkDim};
  }
  .meter-seg.active .meter-seg-label {
    color: ${BRAND.ink};
  }

  /* Domain rows — incluye chip de nivel oficial Anexo III */
  .domain-row {
    display: grid;
    grid-template-columns: 64mm 1fr 18mm 22mm;
    gap: 12px;
    align-items: center;
    padding: 5px 0;
    border-bottom: 1px solid ${BRAND.hairlineSoft};
  }
  .domain-row:last-child { border-bottom: none; }
  .domain-label { color: ${BRAND.ink}; font-size: 10pt; font-weight: 600; }
  .domain-bar-wrap {
    height: 10px;
    border-radius: 999px;
    overflow: hidden;
    position: relative;
  }
  .domain-bar {
    height: 100%;
    border-radius: 999px;
    transition: width 0.4s;
  }
  .domain-nivel {
    font-family: ui-monospace, monospace;
    font-size: 8pt;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    text-align: center;
  }
  .domain-score {
    text-align: right;
    font-family: ui-monospace, monospace;
    font-size: 11pt;
    font-weight: 800;
    letter-spacing: -0.02em;
  }
  .domain-max {
    color: ${BRAND.inkSoft};
    font-weight: 500;
    font-size: 9pt;
    letter-spacing: 0;
  }

  /* Acción concreta — bloque dominio peor + protocolo BIO-IGNICIÓN */
  .action-block {
    margin-top: 6mm;
    border: 1px solid ${BRAND.hairline};
    border-left: 4px solid ${BRAND.phosphorCyan};
    border-radius: 12px;
    padding: 6mm 7mm;
    background: ${BRAND.bgPrint};
  }
  .action-block.amber { border-left-color: ${BRAND.signalAmber}; }
  .action-block.danger { border-left-color: ${BRAND.plasmaRed}; }
  .action-block .action-kicker {
    font-family: ui-monospace, monospace;
    font-size: 8pt;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: ${BRAND.inkDim};
    font-weight: 700;
    margin-bottom: 2mm;
  }
  .action-block .action-domain {
    font-size: 14pt;
    font-weight: 800;
    color: ${BRAND.ink};
    margin-bottom: 1mm;
    letter-spacing: -0.2px;
  }
  .action-block .action-meta {
    font-family: ui-monospace, monospace;
    font-size: 9pt;
    color: ${BRAND.inkDim};
    margin-bottom: 4mm;
  }
  .action-block .action-meta .nivel-chip {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 999px;
    font-weight: 800;
    font-size: 8.5pt;
    letter-spacing: 0.06em;
    margin-right: 6px;
    color: var(--nivelColor, ${BRAND.phosphorCyan});
    background: var(--nivelBg, #E0F7FA);
  }
  .action-block .action-proto {
    background: ${BRAND.hairlineSoft};
    border-radius: 8px;
    padding: 4mm 5mm;
    margin-top: 3mm;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 5mm;
    align-items: center;
  }
  .action-block .proto-tile {
    width: 14mm;
    height: 14mm;
    border-radius: 8px;
    background: ${BRAND.phosphorCyan}22;
    border: 1px solid ${BRAND.phosphorCyan};
    color: ${BRAND.phosphorCyanInk};
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: ui-monospace, monospace;
    font-weight: 900;
    font-size: 13pt;
    letter-spacing: -0.04em;
  }
  .action-block .proto-name {
    font-size: 12pt;
    font-weight: 800;
    color: ${BRAND.ink};
    margin-bottom: 1mm;
  }
  .action-block .proto-dose {
    font-family: ui-monospace, monospace;
    font-size: 9pt;
    color: ${BRAND.phosphorCyanInk};
    font-weight: 700;
    margin-bottom: 2mm;
  }
  .action-block .proto-rationale {
    font-size: 9.5pt;
    color: ${BRAND.inkDim};
    line-height: 1.5;
  }
  .action-block .referral {
    background: ${BRAND.hairlineSoft};
    border-radius: 8px;
    padding: 4mm 5mm;
    margin-top: 3mm;
    font-size: 10pt;
    color: ${BRAND.ink};
    line-height: 1.55;
  }

  /* Cover seal — BioGlyph grande + verify block */
  .cover-seal {
    margin-top: 10mm;
    padding-top: 8mm;
    border-top: 1px solid ${BRAND.hairline};
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 14mm;
    align-items: center;
  }
  .cover-seal .seal-left {
    display: flex;
    align-items: center;
    gap: 8mm;
  }
  .cover-seal .seal-glyph {
    flex-shrink: 0;
    opacity: 0.95;
  }
  .cover-seal .seal-text {
    font-family: ui-monospace, monospace;
    font-size: 8.5pt;
    line-height: 1.6;
    color: ${BRAND.inkDim};
    letter-spacing: 0.04em;
  }
  .cover-seal .seal-text b {
    color: ${BRAND.phosphorCyanInk};
    font-weight: 800;
    letter-spacing: 0.08em;
  }
  .verify-block {
    text-align: center;
    border: 1px solid ${BRAND.hairline};
    border-radius: 10px;
    padding: 4mm 5mm;
    min-width: 56mm;
  }
  .verify-block .verify-kicker {
    font-family: ui-monospace, monospace;
    font-size: 7pt;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: ${BRAND.phosphorCyanInk};
    font-weight: 800;
    margin-bottom: 3mm;
  }
  .verify-block .qr-pattern {
    display: flex;
    justify-content: center;
    margin-bottom: 3mm;
  }
  .verify-block .verify-url {
    font-family: ui-monospace, monospace;
    font-size: 8pt;
    color: ${BRAND.ink};
    font-weight: 700;
    letter-spacing: 0.02em;
    margin-bottom: 2mm;
    word-break: break-all;
  }
  .verify-block .verify-hint {
    font-size: 7pt;
    color: ${BRAND.inkSoft};
    line-height: 1.4;
  }

  /* Cover hero — BioGlyph como acento al lado del título */
  .cover-hero {
    position: relative;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10mm;
    align-items: center;
    margin-bottom: 12mm;
  }
  .cover-hero-text { min-width: 0; }
  .cover-hero-glyph {
    opacity: 0.95;
    flex-shrink: 0;
  }


  /* Historial — sparkline + tabla */
  .history-row {
    display: grid;
    grid-template-columns: 50mm 1fr 22mm 28mm;
    gap: 12px;
    align-items: center;
    padding: 5px 0;
    border-bottom: 1px solid ${BRAND.hairlineSoft};
  }
  .history-row.current {
    background: ${BRAND.hairlineSoft};
    border-radius: 6px;
    margin: 4px -8px;
    padding: 7px 8px;
    border-bottom: none;
  }
  .history-row .h-date {
    font-family: ui-monospace, monospace;
    font-size: 9pt;
    color: ${BRAND.ink};
    font-weight: 700;
  }
  .history-row .h-current-tag {
    font-family: ui-monospace, monospace;
    font-size: 7pt;
    color: ${BRAND.phosphorCyanInk};
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-left: 4px;
  }
  .history-row .h-bar-wrap {
    height: 8px;
    background: ${BRAND.hairlineSoft};
    border-radius: 999px;
    overflow: hidden;
    position: relative;
  }
  .history-row.current .h-bar-wrap { background: ${BRAND.bgPrint}; }
  .history-row .h-bar { height: 100%; border-radius: 999px; }
  .history-row .h-total {
    text-align: right;
    font-family: ui-monospace, monospace;
    font-size: 11pt;
    font-weight: 800;
    color: ${BRAND.ink};
    letter-spacing: -0.02em;
  }
  .history-row .h-nivel {
    font-family: ui-monospace, monospace;
    font-size: 8pt;
    font-weight: 800;
    text-align: center;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .history-trend {
    margin-top: 6mm;
    padding: 4mm 5mm;
    background: ${BRAND.hairlineSoft};
    border-radius: 8px;
    border-left: 3px solid ${BRAND.phosphorCyan};
    font-size: 10pt;
    color: ${BRAND.ink};
    line-height: 1.55;
  }
  .history-trend b { color: ${BRAND.phosphorCyanInk}; }

  /* Microtype edge — franja serializada vertical en cada página */
  .edge-mark {
    position: absolute;
    top: 22mm;
    bottom: 16mm;
    right: 6mm;
    width: 8mm;
    pointer-events: none;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .edge-mark span {
    transform: rotate(180deg);
    writing-mode: vertical-rl;
    font-family: ui-monospace, monospace;
    font-size: 6.5pt;
    letter-spacing: 0.18em;
    color: ${BRAND.inkSoft};
    opacity: 0.55;
    text-transform: uppercase;
    white-space: nowrap;
  }

  /* Categoría cards */
  .cat-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
    margin-top: 4mm;
  }
  .cat-card {
    background: ${BRAND.hairlineSoft};
    border: 1px solid ${BRAND.hairline};
    border-radius: 10px;
    padding: 5mm 4mm;
    text-align: center;
  }
  .cat-card small {
    display: block;
    font-family: ui-monospace, monospace;
    font-size: 7pt;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    color: ${BRAND.inkDim};
    margin-bottom: 2mm;
    font-weight: 700;
    min-height: 22px;
    line-height: 1.3;
  }
  .cat-card .v {
    font-family: ui-monospace, "SF Mono", monospace;
    font-size: 16pt;
    font-weight: 900;
    color: ${BRAND.phosphorCyanInk};
    letter-spacing: -0.04em;
  }
  .cat-card .vmax {
    color: ${BRAND.inkSoft};
    font-size: 9pt;
    margin-top: 1mm;
    font-family: ui-monospace, monospace;
  }

  /* Callouts */
  .callout {
    border-left: 3px solid ${BRAND.phosphorCyan};
    background: ${BRAND.hairlineSoft};
    padding: 5mm 6mm;
    margin: 4mm 0;
    border-radius: 0 8px 8px 0;
    font-size: 10pt;
    line-height: 1.55;
  }
  .callout.amber { border-left-color: ${BRAND.signalAmber}; }
  .callout.danger { border-left-color: ${BRAND.plasmaRed}; }
  .callout b { color: ${BRAND.ink}; }

  /* Action items list */
  ul.actions {
    list-style: none;
    padding: 0;
    margin: 3mm 0;
  }
  ul.actions li {
    padding: 3mm 0 3mm 9mm;
    position: relative;
    color: ${BRAND.ink};
    font-size: 10pt;
    line-height: 1.5;
    border-bottom: 1px solid ${BRAND.hairlineSoft};
  }
  ul.actions li:last-child { border-bottom: none; }
  ul.actions li::before {
    content: "→";
    position: absolute;
    left: 0;
    top: 3mm;
    color: ${BRAND.phosphorCyan};
    font-weight: 900;
    font-size: 12pt;
    line-height: 1.2;
  }

  /* Footer */
  .pagefoot {
    position: absolute;
    bottom: 8mm;
    left: 18mm;
    right: 18mm;
    border-top: 1px solid ${BRAND.hairline};
    padding-top: 3mm;
    font-family: ui-monospace, monospace;
    font-size: 7.5pt;
    color: ${BRAND.inkSoft};
    display: flex;
    justify-content: space-between;
    letter-spacing: 0.04em;
  }
  .pagefoot .code { color: ${BRAND.phosphorCyanInk}; font-weight: 700; }

  /* Disclaimer */
  .disclaimer {
    background: ${BRAND.hairlineSoft};
    border-radius: 10px;
    padding: 6mm;
    margin-top: 6mm;
    color: ${BRAND.inkDim};
    font-size: 9pt;
    line-height: 1.55;
  }
  .disclaimer b { color: ${BRAND.ink}; }
  .disclaimer h3 {
    font-family: ui-monospace, monospace;
    font-size: 8pt;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    color: ${BRAND.phosphorCyanInk};
    font-weight: 800;
    margin-bottom: 3mm;
  }

  /* Print */
  @media print {
    html, body {
      background: ${BRAND.bgPrint} !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .doc { box-shadow: none; }
    .page { padding: 16mm 14mm 14mm; }
  }
</style>
</head>
<body>
<div class="doc">

  <!-- ═══════════════ COVER ═══════════════ -->
  <section class="page cover">
    <div class="content">
      <div class="cover-mark">${wordmark({ size: 48 })}</div>

      <div class="cover-kicker">EVALUACIÓN PERSONAL · NOM-035-STPS-2018</div>
      <div class="cover-hero">
        <div class="cover-hero-text">
          <h1 class="cover-title">Reporte de factores<br/>de riesgo psicosocial</h1>
          <p class="cover-sub">Tu evaluación individual conforme a la Guía de Referencia III de la Norma Oficial Mexicana NOM-035-STPS-2018. Documento personal — los datos contenidos aquí son tuyos y solo tuyos.</p>
        </div>
        <div class="cover-hero-glyph">${bioGlyphSvg(160)}</div>
      </div>

      <div class="cover-meta">
        <div class="cover-meta-item">
          <small>Fecha de evaluación</small>
          <b>${fmtDate}</b>
        </div>
        <div class="cover-meta-item">
          <small>Código de reporte</small>
          <b>${reportCode}</b>
        </div>
        <div class="cover-meta-item">
          <small>Instrumento</small>
          <b>Guía III · 72 ítems</b>
        </div>
      </div>

      <div class="cover-foot">
        <b>Tus datos, tu propiedad.</b> Este documento se generó local-first en tu dispositivo con tus respuestas. Solo tú decides quién más lo recibe. La empresa donde trabajas únicamente accede a agregados anónimos (k≥5); tus respuestas individuales nunca se comparten.
      </div>

      <div class="cover-seal">
        <div class="seal-left">
          <div class="seal-glyph">${bioGlyphSvg(96)}</div>
          <div class="seal-text">
            <b>SELLO DEL DOCUMENTO</b><br/>
            Código ${reportCode}<br/>
            Emitido ${fmtDateShort} · Letter / A4<br/>
            NOM-035-STPS-2018 · Guía III · 72 ítems<br/>
            ${wordmark({ size: "inline" })} <span style="color:${BRAND.inkSoft}">— Optimización humana</span>
          </div>
        </div>
        <div class="seal-right">
          <div class="verify-block">
            <div class="verify-kicker">VERIFICACIÓN PÚBLICA</div>
            <div class="qr-pattern" aria-hidden="true">${qrLikePattern(reportCode)}</div>
            <div class="verify-url">${VERIFY_URL}</div>
            <div class="verify-hint">Cualquiera con el código puede confirmar la autenticidad de este reporte en línea.</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══════════════ RESULTADO ═══════════════ -->
  <section class="page">
    <div class="pagehead">
      <div class="left">${wordmark({ size: 18 })}<span style="margin-left:6px">· Reporte personal NOM-035</span></div>
      <span>Pág. 2 / ${TOTAL_PAGES}</span>
    </div>

    <h1 class="section">Tu resultado <span class="accent">en una mirada</span></h1>
    <p class="section-sub">Puntaje total ${result.total} de ${totalMax} posibles. Nivel asignado conforme a la tabla de puntuación oficial NOM-035 (Anexo III).</p>

    <div class="verdict">
      <div class="verdict-num">
        <small>Puntaje total</small>
        <div class="num">${result.total}</div>
        <div class="of">de ${totalMax}</div>
      </div>
      <div class="verdict-card" style="--nivelColor:${result.nivelColor}">
        <div class="nivel-kicker">Nivel de riesgo</div>
        <div class="nivel-label">${result.nivelLabel}</div>
        <div class="nivel-text">${result.nivelText}</div>
      </div>
    </div>

    <h2>Escala oficial (Anexo III)</h2>
    ${nivelMeter(result.nivel)}
    <p class="muted" style="font-size:8.5pt;margin-top:1mm">El segmento resaltado indica tu nivel actual. Los rangos por nivel: nulo (0–49), bajo (50–69), medio (70–89), alto (90–139), muy alto (140+).</p>

    <h2>Recomendación inmediata</h2>
    <div class="callout ${result.nivel === "alto" || result.nivel === "muy_alto" ? "danger" : result.nivel === "medio" ? "amber" : ""}">
      <b>${result.nivelLabel}.</b> ${result.nivelText}
    </div>

    <h2>Tu acción concreta</h2>
    ${(() => {
      const v = tierVisuals(worstNivelInfo.nivel);
      const blockClass = worstNivelInfo.nivel === "alto" || worstNivelInfo.nivel === "muy_alto" ? "danger"
                       : worstNivelInfo.nivel === "medio" ? "amber" : "";
      const protoTg = worstAction.protocolId ? `R${worstAction.protocolId}` : "—";
      return `
      <div class="action-block ${blockClass}">
        <div class="action-kicker">DOMINIO QUE MÁS PESA</div>
        <div class="action-domain">${worstDomain.label}</div>
        <div class="action-meta">
          <span class="nivel-chip" style="--nivelColor:${v.fill};--nivelBg:${v.bg}">${v.chip}</span>
          ${worstScore} / ${worstDomain.itemCount * 4} puntos · ${worstDomain.itemCount} ítems
        </div>
        ${worstIsActionable && !worstAction.severeOnly ? `
        <div class="action-proto">
          <div class="proto-tile">${protoTg}</div>
          <div>
            <div class="proto-name">Protocolo recomendado: ${worstAction.protocolName}</div>
            <div class="proto-dose">${worstAction.dose}</div>
            <div class="proto-rationale">${worstAction.rationale}</div>
          </div>
        </div>
        ` : worstAction.severeOnly ? `
        <div class="referral">
          <b>Referral:</b> ${worstAction.rationale}
        </div>
        ` : `
        <div class="referral">
          Tu nivel en este dominio es ${v.chip.toLowerCase()}. No requiere intervención inmediata; mantén tus hábitos actuales y reevalúa en 6 meses.
        </div>
        `}
      </div>`;
    })()}

    <div class="edge-mark"><span>${reportCode} · NOM-035-STPS-2018 · GUÍA III · ${fmtDateShort}</span></div>
    <div class="pagefoot">
      <span><span class="code">${reportCode}</span> · ${fmtDateShort}</span>
      <span>NOM-035-STPS-2018 · Guía III</span>
    </div>
  </section>

  <!-- ═══════════════ POR DOMINIO ═══════════════ -->
  <section class="page">
    <div class="pagehead">
      <div class="left">${wordmark({ size: 18 })}<span style="margin-left:6px">· Detalle por dominio</span></div>
      <span>Pág. 3 / ${TOTAL_PAGES}</span>
    </div>

    <h1 class="section">Detalle por <span class="accent">los 10 dominios</span></h1>
    <p class="section-sub">Ordenados de mayor a menor puntaje. Un puntaje alto en un dominio indica mayor presencia del factor de riesgo en ese aspecto específico de tu trabajo.</p>

    <h2>Dominios ordenados por puntaje</h2>
    <div>
      ${domainsSorted.map((d) => domainBar(d, result.porDominio[d.id] || 0, d.itemCount * 4)).join("")}
    </div>

    <h2>Síntesis por categoría</h2>
    <div class="cat-grid">
      ${CATEGORIAS.map((c) => {
        const score = result.porCategoria[c.id] || 0;
        const max = DOMINIOS.filter((d) => d.categoria === c.id).reduce((a, d) => a + d.itemCount * 4, 0);
        return `<div class="cat-card">
          <small>${c.label}</small>
          <div class="v">${score}</div>
          <div class="vmax">de ${max}</div>
        </div>`;
      }).join("")}
    </div>

    <p class="muted" style="margin-top:6mm">Cómo leerlo: el puntaje de cada dominio resulta de sumar tus respuestas a los ítems de ese dominio (escala 0–4 por ítem, con ítems en positivo invertidos). El nivel asignado por dominio se calcula con los rangos del Anexo III de la NOM-035 (no con un umbral porcentual genérico). Esta vista por categoría te ayuda a identificar si el riesgo se concentra en una sola dimensión o se distribuye.</p>

    <p style="margin-top:8mm;font-family:ui-monospace,monospace;font-size:7.5pt;color:${BRAND.inkSoft};letter-spacing:0.04em;line-height:1.5">
      Nota técnica · Los rangos por dominio reflejan la tabla del Anexo III de la NOM-035-STPS-2018 publicada en el DOF 23-oct-2018. Para uso formal ante STPS, contrastar contra la versión vigente del DOF.
    </p>

    <div class="edge-mark"><span>${reportCode} · NOM-035-STPS-2018 · GUÍA III · ${fmtDateShort}</span></div>
    <div class="pagefoot">
      <span><span class="code">${reportCode}</span> · ${fmtDateShort}</span>
      <span>NOM-035-STPS-2018 · Guía III</span>
    </div>
  </section>

  <!-- ═══════════════ HISTORIAL ═══════════════ -->
  <section class="page">
    <div class="pagehead">
      <div class="left">${wordmark({ size: 18 })}<span style="margin-left:6px">· Tu trayectoria</span></div>
      <span>Pág. 4 / ${TOTAL_PAGES}</span>
    </div>

    <h1 class="section">Tu trayectoria <span class="accent">en el tiempo</span></h1>
    <p class="section-sub">Comparativa de tus evaluaciones previas en la plataforma. La consistencia importa más que un número aislado — un mismo nivel mantenido durante 6 meses dice más que un puntaje bajo único.</p>

    <h2>Línea de tiempo de evaluaciones</h2>
    <div>
      ${history.map((h) => {
        const v = tierVisuals(h.nivelInfo.nivel);
        const pct = Math.min(100, (h.total / totalMax) * 100);
        return `
        <div class="history-row${h.isCurrent ? " current" : ""}">
          <div class="h-date">
            ${h.dateLabel}${h.isCurrent ? `<span class="h-current-tag">· actual</span>` : ""}
          </div>
          <div class="h-bar-wrap">
            <div class="h-bar" style="width:${pct.toFixed(1)}%;background:${v.fill}"></div>
          </div>
          <div class="h-nivel" style="color:${v.fill}">${v.chip}</div>
          <div class="h-total">${h.total}<span class="domain-max">/${totalMax}</span></div>
        </div>
        `;
      }).join("")}
    </div>

    ${(() => {
      // Tendencia entre primera y última evaluación
      const first = history[0];
      const last = history[history.length - 1];
      const delta = last.total - first.total;
      const trend = delta < -10 ? "mejora sostenida" : delta < -3 ? "leve mejora" : delta < 4 ? "estabilidad" : delta < 11 ? "leve aumento de riesgo" : "aumento sostenido de riesgo";
      const since = `${first.dateLabel} → ${last.dateLabel}`;
      return `
        <div class="history-trend">
          <b>Lectura de la trayectoria:</b> ${trend} desde ${since} (${delta > 0 ? "+" : ""}${delta} puntos en el total). ${
            delta < -3
              ? "Lo que estés haciendo está funcionando. Identifica qué cambios sostienen la mejora."
              : Math.abs(delta) <= 3
                ? "Mantienes un nivel estable. Reevalúa qué dominios fluctúan más entre mediciones."
                : "Considera qué cambió en los últimos 6 meses. Si hay un cambio organizacional o personal documentable, regístralo."
          }
        </div>
      `;
    })()}

    <h2>Sobre tus evaluaciones</h2>
    <p>Tu historial completo permanece en tu dispositivo. La empresa donde trabajas <b>no recibe tu trayectoria individual</b> — solo el agregado anónimo del equipo en cada periodo (k≥5). Si cambias de empresa, este reporte se conserva: tu evaluación es tuya.</p>
    <p class="muted" style="margin-top:3mm">Para reevaluación recomendada: cada 6 meses bajo condiciones estables, o cuando ocurra un cambio organizacional o personal significativo (nuevo rol, cambio de equipo, evento de vida con impacto sostenido).</p>

    <div class="edge-mark"><span>${reportCode} · NOM-035-STPS-2018 · GUÍA III · ${fmtDateShort}</span></div>
    <div class="pagefoot">
      <span><span class="code">${reportCode}</span> · ${fmtDateShort}</span>
      <span>NOM-035-STPS-2018 · Guía III</span>
    </div>
  </section>

  <!-- ═══════════════ MARCO LEGAL Y PRIVACIDAD ═══════════════ -->
  <section class="page">
    <div class="pagehead">
      <div class="left">${wordmark({ size: 18 })}<span style="margin-left:6px">· Marco legal y privacidad</span></div>
      <span>Pág. ${TOTAL_PAGES} / ${TOTAL_PAGES}</span>
    </div>

    <h1 class="section">Tus datos. <span class="accent">Tus reglas.</span></h1>
    <p class="section-sub">Qué puedes hacer con este documento, qué no es, y cuál es tu derecho sobre la información que contiene.</p>

    <h2>Qué es este documento</h2>
    <p>Este reporte presenta el resultado de tu aplicación voluntaria del cuestionario de la Guía de Referencia III de la <b>NOM-035-STPS-2018</b> (Factores de riesgo psicosocial en el trabajo: identificación, análisis y prevención). La norma fue publicada en el Diario Oficial de la Federación el 23 de octubre de 2018 y aplica a todos los centros de trabajo en México; la <b>Guía III</b> es el instrumento de identificación más detallado y se aplica en centros con 50 o más trabajadores. En centros más pequeños se utiliza la Guía I o II, con obligaciones equivalentes proporcionales al tamaño.</p>

    <h2>Qué no es</h2>
    <p>Este documento <b>no constituye un diagnóstico clínico ni psicológico</b>. Es un instrumento de identificación de factores de riesgo, no de diagnóstico individual. Las recomendaciones de protocolos incluidas son <b>sugerencias de bienestar</b>, no prescripción médica. Si presentas síntomas físicos o emocionales sostenidos (alteraciones del sueño, agotamiento prolongado, ansiedad, depresión, dolores recurrentes), busca valoración profesional.</p>

    <h2>Tus derechos sobre estos datos</h2>
    <p>De acuerdo con la <b>Ley Federal de Protección de Datos Personales en Posesión de los Particulares</b> (LFPDPPP, México — Capítulo IV "De los derechos de los titulares") y el <b>Reglamento General de Protección de Datos</b> (GDPR, UE) cuando aplique, tienes derecho a:</p>
    <ul class="actions">
      <li><b>Acceso</b> (Derechos ARCO LFPDPPP / GDPR Art. 15): obtener este reporte en cualquier momento.</li>
      <li><b>Rectificación</b> (Derechos ARCO LFPDPPP / GDPR Art. 16): corregir datos inexactos.</li>
      <li><b>Cancelación y oposición</b> (Derechos ARCO LFPDPPP / GDPR Art. 17, 21): retirar tu participación o eliminar tus respuestas.</li>
      <li><b>Portabilidad</b> (GDPR Art. 20): exportar tus respuestas en formato JSON desde "Mi cuenta → Mis datos".</li>
    </ul>

    <h2>Lo que tu empresa SÍ recibe automáticamente</h2>
    <ul class="actions">
      <li><b>Constancia de tu participación:</b> que completaste la evaluación y la fecha.</li>
      <li><b>Tu nivel de riesgo</b> (nulo, bajo, medio, alto o muy alto) — sin tus respuestas item por item.</li>
      <li><b>Reporte agregado del equipo</b> con k-anonymity ≥ 5 (mínimo 5 personas por celda; si tu equipo es menor a 5, los datos individuales no se exponen).</li>
      <li><b>Si tu nivel es alto o muy alto:</b> el responsable de Seguridad y Salud en el Trabajo recibe notificación para canalizarte a atención profesional, conforme al Art. 5.5 de la NOM-035. Esto es protección al trabajador, no represalia.</li>
    </ul>

    <h2>Lo que tu empresa NO recibe</h2>
    <ul class="actions">
      <li>Tus respuestas item por item (las 72 respuestas).</li>
      <li>Tu desglose detallado por dominio.</li>
      <li>Tu trayectoria histórica (tus evaluaciones previas).</li>
    </ul>
    <p class="muted" style="margin-top:2mm">Estos datos son personales sensibles y están protegidos por la LFPDPPP — Capítulo IV. Quedan únicamente en este reporte.</p>

    <h2>Si tu empresa te solicita este reporte</h2>
    <div class="callout">
      La <b>NOM-035 Art. 7.IV</b> obliga a tu empresa a conservar evidencia de las evaluaciones por al menos 5 años. Los datos que ya recibe automáticamente (constancia + nivel + agregado) son <b>suficientes</b> para cumplir esa obligación. Si aún así te solicitan documentación adicional, tienes <b>tres opciones</b>:
      <br/><br/>
      <b>1. Entregar este reporte completo</b> — incluye desglose por dominio y trayectoria. Decisión voluntaria.<br/>
      <b>2. Entregar solo una constancia redactada</b> — 1 página con tu nivel y participación, sin desglose. (Disponible en "Mi cuenta → Versión para empresa".)<br/>
      <b>3. No entregar nada adicional</b> — la empresa ya tiene lo legalmente necesario.<br/>
      <br/>
      Tu empresa <b>no puede compelirte</b> a entregar las respuestas item por item ni el desglose detallado.
    </div>

    <div class="disclaimer">
      <h3>Sobre la plataforma</h3>
      <p>${wordmark({ size: "inline" })} es una plataforma de optimización humana B2B local-first. Tus datos sensoriales (HRV, audio, haptics) y respuestas se almacenan cifradas en tu dispositivo y solo se sincronizan con servidores cuando tú lo autorizas. La aplicación implementa controles SOC 2, prácticas HIPAA-ready, y los estándares mexicanos LFPDPPP y NOM-035.</p>
      <p style="margin-top:3mm">Para ejercer cualquier derecho sobre tus datos, escribe a <b>privacy@bio-ignicion.com</b> o usa el panel "Mi cuenta → Mis datos" en la app.</p>
    </div>

    <div style="margin-top:6mm;text-align:center;font-size:8.5pt;color:${BRAND.inkDim};line-height:1.5">
      Reporte generado el ${fmtDate} · ${wordmark({ size: "inline" })} · Guía III NOM-035-STPS-2018<br/>
      Código: ${reportCode} · Conserva este reporte para tus registros personales (5 años recomendado).
    </div>

    <div class="edge-mark"><span>${reportCode} · NOM-035-STPS-2018 · GUÍA III · ${fmtDateShort}</span></div>
    <div class="pagefoot">
      <span><span class="code">${reportCode}</span> · ${fmtDateShort}</span>
      <span>NOM-035-STPS-2018 · Guía III</span>
    </div>
  </section>

</div>
</body>
</html>`;

// ─── Output ─────────────────────────────────────
const outDir = resolve(__dirname, "..", "tmp");
mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, "Reporte-NOM35-Personal-Preview.html");
writeFileSync(outPath, html, "utf8");

console.log("\n══════════════════════════════════════════════════════════════");
console.log("  PREVIEW GENERADO — Reporte personal NOM-035");
console.log("══════════════════════════════════════════════════════════════");
console.log(`Datos aleatorios:`);
console.log(`  Total puntaje:  ${result.total} / ${totalMax}`);
console.log(`  Nivel:          ${result.nivelLabel} (${result.nivel})`);
console.log(`  Código reporte: ${reportCode}`);
console.log(`  Fecha:          ${fmtDate}`);
console.log("");
console.log(`Archivo: ${outPath}`);
console.log(`Para PDF: ábrelo en navegador → Cmd/Ctrl+P → Guardar como PDF (Letter, márgenes mínimos).\n`);
