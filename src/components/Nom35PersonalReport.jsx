/* ═══════════════════════════════════════════════════════════════
   NOM-035 PERSONAL REPORT — server component

   Renderiza el reporte personal del trabajador en HTML imprimible
   con la estética BIO-IGNICIÓN (logo, wordmark, paleta cyan).

   Server-only: SVG inline puro sin framer-motion para que cero JS
   se envíe al cliente. El usuario abre la ruta /nom35/aplicador/reporte
   y le pega Ctrl+P → Guardar como PDF.

   Props:
     response  — Nom35Response del schema { id, total, nivel,
                 porDominio, porCategoria, completedAt }
     history?  — Array<Nom35Response> previas (para la página 4 trayectoria)
   ═══════════════════════════════════════════════════════════════ */

import { recomendacionPorNivel } from "@/lib/nom35/scoring";

// ─── Brand tokens (idénticos a src/lib/tokens.js bioSignal) ──
const BRAND = {
  phosphorCyan:    "#22D3EE",
  phosphorCyanInk: "#155E75",
  ghostCyan:       "#A5F3FC",
  ignition:        "#FDE68A",
  signalAmber:     "#FBBF24",
  plasmaRed:       "#F43F5E",
  bgPrint:         "#FFFFFF",
  ink:             "#0B1320",
  inkDim:          "#475569",
  inkSoft:         "#94A3B8",
  hairline:        "#E2E8F0",
  hairlineSoft:    "#F1F5F9",
};

// ─── Catálogo (espejo lógico de src/lib/nom35) ──
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
const CATEGORIAS = [
  { id: "ambiente",  label: "Ambiente de trabajo" },
  { id: "actividad", label: "Factores propios de la actividad" },
  { id: "tiempo",    label: "Organización del tiempo de trabajo" },
  { id: "liderazgo", label: "Liderazgo y relaciones en el trabajo" },
  { id: "entorno",   label: "Entorno organizacional" },
];
const NIVELES = [
  { nivel: "nulo",     max: 49,        label: "Nulo o despreciable", color: BRAND.phosphorCyan },
  { nivel: "bajo",     max: 69,        label: "Bajo",                color: BRAND.phosphorCyan },
  { nivel: "medio",    max: 89,        label: "Medio",               color: BRAND.signalAmber },
  { nivel: "alto",     max: 139,       label: "Alto",                color: BRAND.plasmaRed },
  { nivel: "muy_alto", max: Infinity,  label: "Muy alto",            color: BRAND.plasmaRed },
];

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

// ─── Helpers ──
function nivelByTotal(total) {
  return NIVELES.find((n) => total <= n.max) || NIVELES[NIVELES.length - 1];
}
function nivelByDomain(dominio, score) {
  const c = dominio.cuts;
  if (score <= c[0]) return NIVELES[0];
  if (score <= c[1]) return NIVELES[1];
  if (score <= c[2]) return NIVELES[2];
  if (score <= c[3]) return NIVELES[3];
  return NIVELES[4];
}
function domainSeverity(dominio, score) {
  const order = ["nulo", "bajo", "medio", "alto", "muy_alto"];
  const idx = order.indexOf(nivelByDomain(dominio, score).nivel);
  const pct = score / (dominio.itemCount * 4);
  return idx * 100 + pct * 99;
}
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

function formatReportCode(id) {
  if (!id) return "0000·0000·0000";
  return id
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 12)
    .padEnd(12, "0")
    .toLowerCase()
    .replace(/(.{4})/g, "$1·")
    .replace(/·$/, "");
}

function formatDateLong(d) {
  return new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
}
function formatDateShort(d) {
  return new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ─── BioGlyph SVG (server-renderable, sin framer-motion) ──
function BioGlyphSVG({ size = 32 }) {
  const c = size / 2;
  const rNode = size * 0.13;
  const rHalo = size * 0.42;
  const rayLen = size * 0.34;
  const rays = [
    { a: -Math.PI / 6,        op: 1.0  },
    { a: (7 * Math.PI) / 6,   op: 0.7  },
    { a: Math.PI / 2,         op: 0.85 },
  ];
  const haloId = `bi-halo-${size}`;
  const coreId = `bi-core-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="BIO-IGNICIÓN"
      style={{ display: "block", overflow: "visible", flexShrink: 0 }}
    >
      <defs>
        <radialGradient id={coreId} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%"   stopColor={BRAND.ignition}     stopOpacity="1" />
          <stop offset="60%"  stopColor={BRAND.phosphorCyan} stopOpacity="1" />
          <stop offset="100%" stopColor={BRAND.phosphorCyan} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={haloId} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%"   stopColor={BRAND.phosphorCyan} stopOpacity="0.25" />
          <stop offset="100%" stopColor={BRAND.phosphorCyan} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={rHalo} fill={`url(#${haloId})`} />
      <circle
        cx={c} cy={c} r={rHalo * 0.85}
        fill="none"
        stroke={BRAND.phosphorCyan}
        strokeWidth={size * 0.015}
        strokeDasharray={`${size * 0.02} ${size * 0.035}`}
        opacity="0.5"
      />
      {rays.map((r, i) => {
        const x2 = c + Math.cos(r.a) * rayLen;
        const y2 = c + Math.sin(r.a) * rayLen;
        return (
          <line
            key={i}
            x1={c} y1={c} x2={x2.toFixed(2)} y2={y2.toFixed(2)}
            stroke={BRAND.phosphorCyan}
            strokeWidth={size * 0.05}
            strokeLinecap="round"
            opacity={r.op}
          />
        );
      })}
      <circle cx={c} cy={c} r={rNode} fill={`url(#${coreId})`} />
      <circle cx={c} cy={c} r={rNode * 0.35} fill={BRAND.ignition} opacity="0.95" />
    </svg>
  );
}

// ─── Wordmark canónico — proporciones fijas Amazon-style ──
function Wordmark({ size = 28, colorText = BRAND.ink }) {
  const isInline = size === "inline";
  const glyphPx = isInline ? null : size;
  const textCss = isInline ? "1em" : `${(size * 0.42).toFixed(2)}px`;
  const gapPx = isInline ? null : `${(glyphPx * 0.42).toFixed(1)}px`;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        ...(isInline ? {} : { gap: gapPx }),
        lineHeight: 1,
        userSelect: "none",
        verticalAlign: isInline ? "baseline" : "middle",
        whiteSpace: "nowrap",
      }}
    >
      {!isInline && <BioGlyphSVG size={glyphPx} />}
      <span
        style={{
          display: "inline-flex",
          alignItems: "baseline",
          gap: "0.18em",
          fontSize: textCss,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          lineHeight: 1,
        }}
      >
        <span style={{ fontWeight: 400, color: colorText, opacity: 0.7 }}>BIO</span>
        <span style={{ color: BRAND.phosphorCyan, fontWeight: 700 }}>—</span>
        <span style={{ fontWeight: 900, color: colorText }}>IGNICIÓN</span>
      </span>
    </span>
  );
}

// ─── QR-like pattern (placeholder visual, no decodifica) ──
function QrLikePattern({ seed }) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  let s = (Math.abs(h) || 1) >>> 0;
  function rng() {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const N = 9;
  const cells = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const inAnchor =
        (x < 3 && y < 3) ||
        (x >= N - 3 && y < 3) ||
        (x < 3 && y >= N - 3);
      const onAnchorEdge = inAnchor && (x === 0 || x === 2 || x === N - 1 || x === N - 3 || y === 0 || y === 2 || y === N - 1 || y === N - 3);
      const onAnchorCenter =
        (x === 1 && y === 1) ||
        (x === N - 2 && y === 1) ||
        (x === 1 && y === N - 2);
      let on;
      if (inAnchor) on = onAnchorEdge || onAnchorCenter;
      else on = rng() > 0.55;
      if (on) cells.push({ x, y, k: `${x}-${y}` });
    }
  }
  const cellSize = 3;
  const total = N * cellSize;
  return (
    <svg width="60" height="60" viewBox={`0 0 ${total} ${total}`} aria-hidden="true">
      <rect width={total} height={total} fill={BRAND.bgPrint} />
      {cells.map((cell) => (
        <rect
          key={cell.k}
          x={cell.x * cellSize}
          y={cell.y * cellSize}
          width={cellSize}
          height={cellSize}
          fill={BRAND.ink}
        />
      ))}
    </svg>
  );
}

// ─── Bar de dominio ──
function DomainBar({ dominio, score }) {
  const max = dominio.itemCount * 4;
  const pct = max === 0 ? 0 : Math.min(100, (score / max) * 100);
  const v = tierVisuals(nivelByDomain(dominio, score).nivel);
  return (
    <div className="domain-row">
      <div className="domain-label">{dominio.label}</div>
      <div className="domain-bar-wrap" style={{ background: v.bg }}>
        <div className="domain-bar" style={{ width: `${pct.toFixed(1)}%`, background: v.fill }} />
      </div>
      <div className="domain-nivel" style={{ color: v.fill }}>{v.chip}</div>
      <div className="domain-score" style={{ color: BRAND.ink }}>
        {score}<span className="domain-max">/{max}</span>
      </div>
    </div>
  );
}

// ─── Meter de niveles ──
function NivelMeter({ currentNivel }) {
  const order = ["nulo", "bajo", "medio", "alto", "muy_alto"];
  const idx = order.indexOf(currentNivel);
  return (
    <div className="meter-wrap">
      {order.map((n, i) => {
        const info = NIVELES.find((x) => x.nivel === n);
        const active = i === idx;
        return (
          <div
            key={n}
            className={`meter-seg${active ? " active" : ""}`}
            style={active ? { "--seg": info.color } : undefined}
          >
            <span className="meter-seg-label">{info.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Edge mark (microtype vertical) ──
function EdgeMark({ reportCode, fmtDateShort }) {
  return (
    <div className="edge-mark">
      <span>{reportCode} · NOM-035-STPS-2018 · GUÍA III · {fmtDateShort}</span>
    </div>
  );
}

// ─── Page foot ──
function PageFoot({ reportCode, fmtDateShort }) {
  return (
    <div className="pagefoot">
      <span><span className="code">{reportCode}</span> · {fmtDateShort}</span>
      <span>NOM-035-STPS-2018 · Guía III</span>
    </div>
  );
}

// ─── Page head ──
function PageHead({ subtitle, page, totalPages }) {
  return (
    <div className="pagehead">
      <div className="left">
        <Wordmark size={18} />
        <span style={{ marginLeft: 6 }}>· {subtitle}</span>
      </div>
      <span>Pág. {page} / {totalPages}</span>
    </div>
  );
}

// ─── Main component ──
export default function Nom35PersonalReport({ response, history = [] }) {
  if (!response) return null;

  const reportCode = formatReportCode(response.id);
  const fmtDate = formatDateLong(response.completedAt);
  const fmtDateShort = formatDateShort(response.completedAt);

  const total = response.total || 0;
  const totalMax = DOMINIOS.reduce((a, d) => a + d.itemCount * 4, 0); // 288
  const nivelInfo = nivelByTotal(total);
  const nivelText = recomendacionPorNivel(nivelInfo.nivel) || "";

  const porDominio = response.porDominio || {};
  const porCategoria = response.porCategoria || {};
  const domainsSorted = [...DOMINIOS].sort(
    (a, b) => domainSeverity(b, porDominio[b.id] || 0) - domainSeverity(a, porDominio[a.id] || 0)
  );
  const worstDomain = domainsSorted[0];
  const worstScore = porDominio[worstDomain.id] || 0;
  const worstNivelInfo = nivelByDomain(worstDomain, worstScore);
  const worstAction = PROTO_PER_DOMINIO[worstDomain.id];
  const worstIsActionable = ["medio", "alto", "muy_alto"].includes(worstNivelInfo.nivel);
  const worstVisuals = tierVisuals(worstNivelInfo.nivel);
  const worstActionClass =
    worstNivelInfo.nivel === "alto" || worstNivelInfo.nivel === "muy_alto" ? "danger"
    : worstNivelInfo.nivel === "medio" ? "amber" : "";

  const VERIFY_URL = `bio-ignicion.com/verify/${reportCode.replace(/·/g, "-")}`;
  const TOTAL_PAGES = 5;

  // ─── Historial: la actual + previas (orden cronológico) ──
  const historyEntries = [...history]
    .filter((h) => h && h.completedAt)
    .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
  const allHistory = [
    ...historyEntries.map((h) => ({
      date: h.completedAt,
      dateLabel: new Date(h.completedAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }),
      total: h.total,
      nivelInfo: nivelByTotal(h.total),
      isCurrent: h.id === response.id,
    })),
  ];
  // Si la actual no está en history, añádela
  if (!allHistory.some((h) => h.isCurrent)) {
    allHistory.push({
      date: response.completedAt,
      dateLabel: new Date(response.completedAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }),
      total: response.total,
      nivelInfo,
      isCurrent: true,
    });
  }
  const hasHistory = allHistory.length > 1;

  let trendBlock = null;
  if (hasHistory) {
    const first = allHistory[0];
    const last = allHistory[allHistory.length - 1];
    const delta = last.total - first.total;
    const trend = delta < -10 ? "mejora sostenida"
                : delta < -3 ? "leve mejora"
                : delta < 4 ? "estabilidad"
                : delta < 11 ? "leve aumento de riesgo"
                : "aumento sostenido de riesgo";
    const since = `${first.dateLabel} → ${last.dateLabel}`;
    const guidance =
      delta < -3 ? "Lo que estés haciendo está funcionando. Identifica qué cambios sostienen la mejora."
      : Math.abs(delta) <= 3 ? "Mantienes un nivel estable. Reevalúa qué dominios fluctúan más entre mediciones."
      : "Considera qué cambió en los últimos meses. Si hay un cambio organizacional o personal documentable, regístralo.";
    trendBlock = (
      <div className="history-trend">
        <b>Lectura de la trayectoria:</b> {trend} desde {since} ({delta > 0 ? "+" : ""}{delta} puntos en el total). {guidance}
      </div>
    );
  }

  return (
    <>
      <style>{REPORT_CSS}</style>
      <div className="doc">

        {/* ════ COVER ════ */}
        <section className="page cover">
          <div className="content">
            <div className="cover-mark"><Wordmark size={48} /></div>

            <div className="cover-kicker">EVALUACIÓN PERSONAL · NOM-035-STPS-2018</div>
            <div className="cover-hero">
              <div className="cover-hero-text">
                <h1 className="cover-title">Reporte de factores<br/>de riesgo psicosocial</h1>
                <p className="cover-sub">Tu evaluación individual conforme a la Guía de Referencia III de la Norma Oficial Mexicana NOM-035-STPS-2018. Documento personal — los datos contenidos aquí son tuyos y solo tuyos.</p>
              </div>
              <div className="cover-hero-glyph"><BioGlyphSVG size={160} /></div>
            </div>

            <div className="cover-meta">
              <div className="cover-meta-item">
                <small>Fecha de evaluación</small>
                <b>{fmtDate}</b>
              </div>
              <div className="cover-meta-item">
                <small>Código de reporte</small>
                <b>{reportCode}</b>
              </div>
              <div className="cover-meta-item">
                <small>Instrumento</small>
                <b>Guía III · 72 ítems</b>
              </div>
            </div>

            <div className="cover-foot">
              <b>Tus datos, tu propiedad.</b> Este documento se generó local-first en tu dispositivo con tus respuestas. Solo tú decides quién más lo recibe. La empresa donde trabajas únicamente accede a agregados anónimos (k≥5); tus respuestas individuales nunca se comparten.
            </div>

            <div className="cover-seal">
              <div className="seal-left">
                <div className="seal-glyph"><BioGlyphSVG size={96} /></div>
                <div className="seal-text">
                  <b>SELLO DEL DOCUMENTO</b><br/>
                  Código {reportCode}<br/>
                  Emitido {fmtDateShort} · Letter / A4<br/>
                  NOM-035-STPS-2018 · Guía III · 72 ítems<br/>
                  <Wordmark size="inline" /> <span style={{ color: BRAND.inkSoft }}>— Optimización humana</span>
                </div>
              </div>
              <div className="seal-right">
                <div className="verify-block">
                  <div className="verify-kicker">VERIFICACIÓN PÚBLICA</div>
                  <div className="qr-pattern" aria-hidden="true"><QrLikePattern seed={reportCode} /></div>
                  <div className="verify-url">{VERIFY_URL}</div>
                  <div className="verify-hint">Cualquiera con el código puede confirmar la autenticidad de este reporte en línea.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════ RESULTADO ════ */}
        <section className="page">
          <PageHead subtitle="Reporte personal NOM-035" page={2} totalPages={TOTAL_PAGES} />
          <h1 className="section">Tu resultado <span className="accent">en una mirada</span></h1>
          <p className="section-sub">Puntaje total {total} de {totalMax} posibles. Nivel asignado conforme a la tabla de puntuación oficial NOM-035 (Anexo III).</p>

          <div className="verdict">
            <div className="verdict-num">
              <small>Puntaje total</small>
              <div className="num">{total}</div>
              <div className="of">de {totalMax}</div>
            </div>
            <div className="verdict-card" style={{ "--nivelColor": nivelInfo.color }}>
              <div className="nivel-kicker">Nivel de riesgo</div>
              <div className="nivel-label">{nivelInfo.label}</div>
              <div className="nivel-text">{nivelText}</div>
            </div>
          </div>

          <h2>Escala oficial (Anexo III)</h2>
          <NivelMeter currentNivel={nivelInfo.nivel} />
          <p className="muted" style={{ fontSize: "8.5pt", marginTop: "1mm" }}>El segmento resaltado indica tu nivel actual. Los rangos por nivel: nulo (0–49), bajo (50–69), medio (70–89), alto (90–139), muy alto (140+).</p>

          <h2>Recomendación inmediata</h2>
          <div className={`callout ${nivelInfo.nivel === "alto" || nivelInfo.nivel === "muy_alto" ? "danger" : nivelInfo.nivel === "medio" ? "amber" : ""}`}>
            <b>{nivelInfo.label}.</b> {nivelText}
          </div>

          <h2>Tu acción concreta</h2>
          <div className={`action-block ${worstActionClass}`}>
            <div className="action-kicker">DOMINIO QUE MÁS PESA</div>
            <div className="action-domain">{worstDomain.label}</div>
            <div className="action-meta">
              <span className="nivel-chip" style={{ "--nivelColor": worstVisuals.fill, "--nivelBg": worstVisuals.bg }}>
                {worstVisuals.chip}
              </span>
              {worstScore} / {worstDomain.itemCount * 4} puntos · {worstDomain.itemCount} ítems
            </div>
            {worstIsActionable && !worstAction.severeOnly ? (
              <div className="action-proto">
                <div className="proto-tile">R{worstAction.protocolId}</div>
                <div>
                  <div className="proto-name">Protocolo recomendado: {worstAction.protocolName}</div>
                  <div className="proto-dose">{worstAction.dose}</div>
                  <div className="proto-rationale">{worstAction.rationale}</div>
                </div>
              </div>
            ) : worstAction.severeOnly ? (
              <div className="referral">
                <b>Referral:</b> {worstAction.rationale}
              </div>
            ) : (
              <div className="referral">
                Tu nivel en este dominio es {worstVisuals.chip.toLowerCase()}. No requiere intervención inmediata; mantén tus hábitos actuales y reevalúa en 6 meses.
              </div>
            )}
          </div>

          <EdgeMark reportCode={reportCode} fmtDateShort={fmtDateShort} />
          <PageFoot reportCode={reportCode} fmtDateShort={fmtDateShort} />
        </section>

        {/* ════ POR DOMINIO ════ */}
        <section className="page">
          <PageHead subtitle="Detalle por dominio" page={3} totalPages={TOTAL_PAGES} />
          <h1 className="section">Detalle por <span className="accent">los 10 dominios</span></h1>
          <p className="section-sub">Ordenados de mayor a menor severidad. Un puntaje alto en un dominio indica mayor presencia del factor de riesgo en ese aspecto específico de tu trabajo.</p>

          <h2>Dominios ordenados por severidad</h2>
          <div>
            {domainsSorted.map((d) => (
              <DomainBar key={d.id} dominio={d} score={porDominio[d.id] || 0} />
            ))}
          </div>

          <h2>Síntesis por categoría</h2>
          <div className="cat-grid">
            {CATEGORIAS.map((c) => {
              const score = porCategoria[c.id] || 0;
              const max = DOMINIOS.filter((d) => d.categoria === c.id).reduce((a, d) => a + d.itemCount * 4, 0);
              return (
                <div key={c.id} className="cat-card">
                  <small>{c.label}</small>
                  <div className="v">{score}</div>
                  <div className="vmax">de {max}</div>
                </div>
              );
            })}
          </div>

          <p className="muted" style={{ marginTop: "6mm" }}>Cómo leerlo: el puntaje de cada dominio resulta de sumar tus respuestas a los ítems de ese dominio (escala 0–4 por ítem, con ítems en positivo invertidos). El nivel asignado por dominio se calcula con los rangos del Anexo III de la NOM-035 (no con un umbral porcentual genérico).</p>

          <p style={{ marginTop: "8mm", fontFamily: "ui-monospace, monospace", fontSize: "7.5pt", color: BRAND.inkSoft, letterSpacing: "0.04em", lineHeight: 1.5 }}>
            Nota técnica · Los rangos por dominio reflejan la tabla del Anexo III de la NOM-035-STPS-2018 publicada en el DOF 23-oct-2018. Para uso formal ante STPS, contrastar contra la versión vigente del DOF.
          </p>

          <EdgeMark reportCode={reportCode} fmtDateShort={fmtDateShort} />
          <PageFoot reportCode={reportCode} fmtDateShort={fmtDateShort} />
        </section>

        {/* ════ HISTORIAL ════ */}
        <section className="page">
          <PageHead subtitle="Tu trayectoria" page={4} totalPages={TOTAL_PAGES} />
          <h1 className="section">Tu trayectoria <span className="accent">en el tiempo</span></h1>
          <p className="section-sub">Comparativa de tus evaluaciones en la plataforma. La consistencia importa más que un número aislado — un mismo nivel mantenido durante 6 meses dice más que un puntaje bajo único.</p>

          <h2>Línea de tiempo de evaluaciones</h2>
          {hasHistory ? (
            <div>
              {allHistory.map((h, i) => {
                const v = tierVisuals(h.nivelInfo.nivel);
                const pct = Math.min(100, (h.total / totalMax) * 100);
                return (
                  <div key={i} className={`history-row${h.isCurrent ? " current" : ""}`}>
                    <div className="h-date">
                      {h.dateLabel}
                      {h.isCurrent && <span className="h-current-tag">· actual</span>}
                    </div>
                    <div className="h-bar-wrap">
                      <div className="h-bar" style={{ width: `${pct.toFixed(1)}%`, background: v.fill }} />
                    </div>
                    <div className="h-nivel" style={{ color: v.fill }}>{v.chip}</div>
                    <div className="h-total">{h.total}<span className="domain-max">/{totalMax}</span></div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="muted">Esta es tu primera evaluación registrada. La trayectoria aparece a partir de la segunda evaluación. Reevalúa cada 6 meses para construir tu línea base personal.</p>
          )}

          {trendBlock}

          <h2>Sobre tus evaluaciones</h2>
          <p>Tu historial completo permanece en tu dispositivo. La empresa donde trabajas <b>no recibe tu trayectoria individual</b> — solo el agregado anónimo del equipo en cada periodo (k≥5). Si cambias de empresa, este reporte se conserva: tu evaluación es tuya.</p>
          <p className="muted" style={{ marginTop: "3mm" }}>Para reevaluación recomendada: cada 6 meses bajo condiciones estables, o cuando ocurra un cambio organizacional o personal significativo (nuevo rol, cambio de equipo, evento de vida con impacto sostenido).</p>

          <EdgeMark reportCode={reportCode} fmtDateShort={fmtDateShort} />
          <PageFoot reportCode={reportCode} fmtDateShort={fmtDateShort} />
        </section>

        {/* ════ MARCO LEGAL Y PRIVACIDAD ════ */}
        <section className="page">
          <PageHead subtitle="Marco legal y privacidad" page={TOTAL_PAGES} totalPages={TOTAL_PAGES} />

          <h1 className="section">Tus datos. <span className="accent">Tus reglas.</span></h1>
          <p className="section-sub">Qué puedes hacer con este documento, qué no es, y cuál es tu derecho sobre la información que contiene.</p>

          <h2>Qué es este documento</h2>
          <p>Este reporte presenta el resultado de tu aplicación voluntaria del cuestionario de la Guía de Referencia III de la <b>NOM-035-STPS-2018</b> (Factores de riesgo psicosocial en el trabajo: identificación, análisis y prevención). La norma fue publicada en el Diario Oficial de la Federación el 23 de octubre de 2018 y aplica a todos los centros de trabajo en México; la <b>Guía III</b> es el instrumento de identificación más detallado y se aplica en centros con 50 o más trabajadores. En centros más pequeños se utiliza la Guía I o II, con obligaciones equivalentes proporcionales al tamaño.</p>

          <h2>Qué no es</h2>
          <p>Este documento <b>no constituye un diagnóstico clínico ni psicológico</b>. Es un instrumento de identificación de factores de riesgo, no de diagnóstico individual. Las recomendaciones de protocolos incluidas son <b>sugerencias de bienestar</b>, no prescripción médica. Si presentas síntomas físicos o emocionales sostenidos (alteraciones del sueño, agotamiento prolongado, ansiedad, depresión, dolores recurrentes), busca valoración profesional.</p>

          <h2>Tus derechos sobre estos datos</h2>
          <p>De acuerdo con la <b>Ley Federal de Protección de Datos Personales en Posesión de los Particulares</b> (LFPDPPP, México — Capítulo IV "De los derechos de los titulares") y el <b>Reglamento General de Protección de Datos</b> (GDPR, UE) cuando aplique, tienes derecho a:</p>
          <ul className="actions">
            <li><b>Acceso</b> (Derechos ARCO LFPDPPP / GDPR Art. 15): obtener este reporte en cualquier momento.</li>
            <li><b>Rectificación</b> (Derechos ARCO LFPDPPP / GDPR Art. 16): corregir datos inexactos.</li>
            <li><b>Cancelación y oposición</b> (Derechos ARCO LFPDPPP / GDPR Art. 17, 21): retirar tu participación o eliminar tus respuestas.</li>
            <li><b>Portabilidad</b> (GDPR Art. 20): exportar tus respuestas en formato JSON desde "Mi cuenta → Mis datos".</li>
          </ul>

          <h2>Lo que tu empresa SÍ recibe automáticamente</h2>
          <ul className="actions">
            <li><b>Constancia de tu participación:</b> que completaste la evaluación y la fecha.</li>
            <li><b>Tu nivel de riesgo</b> (nulo, bajo, medio, alto o muy alto) — sin tus respuestas item por item.</li>
            <li><b>Reporte agregado del equipo</b> con k-anonymity ≥ 5 (mínimo 5 personas por celda; si tu equipo es menor a 5, los datos individuales no se exponen).</li>
            <li><b>Si tu nivel es alto o muy alto:</b> el responsable de Seguridad y Salud en el Trabajo recibe notificación para canalizarte a atención profesional, conforme al Art. 5.5 de la NOM-035. Esto es protección al trabajador, no represalia.</li>
          </ul>

          <h2>Lo que tu empresa NO recibe</h2>
          <ul className="actions">
            <li>Tus respuestas item por item (las 72 respuestas).</li>
            <li>Tu desglose detallado por dominio.</li>
            <li>Tu trayectoria histórica (tus evaluaciones previas).</li>
          </ul>
          <p className="muted" style={{ marginTop: "2mm" }}>Estos datos son personales sensibles y están protegidos por la LFPDPPP — Capítulo IV. Quedan únicamente en este reporte.</p>

          <h2>Si tu empresa te solicita este reporte</h2>
          <div className="callout">
            La <b>NOM-035 Art. 7.IV</b> obliga a tu empresa a conservar evidencia de las evaluaciones por al menos 5 años. Los datos que ya recibe automáticamente (constancia + nivel + agregado) son <b>suficientes</b> para cumplir esa obligación. Si aún así te solicitan documentación adicional, tienes <b>tres opciones</b>:
            <br/><br/>
            <b>1. Entregar este reporte completo</b> — incluye desglose por dominio y trayectoria. Decisión voluntaria.<br/>
            <b>2. Entregar solo una constancia redactada</b> — 1 página con tu nivel y participación, sin desglose. (Disponible en "Mi cuenta → Versión para empresa".)<br/>
            <b>3. No entregar nada adicional</b> — la empresa ya tiene lo legalmente necesario.<br/>
            <br/>
            Tu empresa <b>no puede compelirte</b> a entregar las respuestas item por item ni el desglose detallado.
          </div>

          <div className="disclaimer">
            <h3>Sobre la plataforma</h3>
            <p><Wordmark size="inline" /> es una plataforma de optimización humana B2B local-first. Tus datos sensoriales (HRV, audio, haptics) y respuestas se almacenan cifradas en tu dispositivo y solo se sincronizan con servidores cuando tú lo autorizas. La aplicación implementa controles SOC 2, prácticas HIPAA-ready, y los estándares mexicanos LFPDPPP y NOM-035.</p>
            <p style={{ marginTop: "3mm" }}>Para ejercer cualquier derecho sobre tus datos, escribe a <b>privacy@bio-ignicion.com</b> o usa el panel "Mi cuenta → Mis datos" en la app.</p>
          </div>

          <div style={{ marginTop: "6mm", textAlign: "center", fontSize: "8.5pt", color: BRAND.inkDim, lineHeight: 1.5 }}>
            Reporte generado el {fmtDate} · <Wordmark size="inline" /> · Guía III NOM-035-STPS-2018<br/>
            Código: {reportCode} · Conserva este reporte para tus registros personales (5 años recomendado).
          </div>

          <EdgeMark reportCode={reportCode} fmtDateShort={fmtDateShort} />
          <PageFoot reportCode={reportCode} fmtDateShort={fmtDateShort} />
        </section>

      </div>
    </>
  );
}

// ─── CSS — print-ready white-on-everything ──
const REPORT_CSS = `
  .nom35-report-root, .nom35-report-root * { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: Letter; margin: 14mm; }
  .doc {
    max-width: 215.9mm;
    margin: 0 auto;
    background: ${BRAND.bgPrint};
    color: ${BRAND.ink};
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    font-size: 10.5pt;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
  }
  .doc * { box-sizing: border-box; }
  .page {
    background: ${BRAND.bgPrint};
    padding: 22mm 18mm 16mm;
    page-break-after: always;
    position: relative;
    min-height: 279.4mm;
  }
  .page:last-child { page-break-after: auto; }
  .doc h1, .doc h2, .doc h3, .doc h4 { font-family: inherit; }
  .doc p { margin-bottom: 3mm; color: ${BRAND.ink}; }
  .doc p.muted { color: ${BRAND.inkDim}; font-size: 9.5pt; }
  .doc ul { padding: 0; }

  /* Cover */
  .cover .content { min-height: calc(279.4mm - 38mm); display: flex; flex-direction: column; }
  .cover-mark { padding-bottom: 8mm; border-bottom: 2px solid ${BRAND.phosphorCyan}; margin-bottom: 18mm; }
  .cover-kicker { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 9pt; letter-spacing: 3px; text-transform: uppercase; color: ${BRAND.phosphorCyanInk}; margin-bottom: 8mm; font-weight: 700; }
  .cover-hero { position: relative; display: grid; grid-template-columns: 1fr auto; gap: 10mm; align-items: center; margin-bottom: 12mm; }
  .cover-hero-text { min-width: 0; }
  .cover-hero-glyph { opacity: 0.95; flex-shrink: 0; }
  .cover-title { font-size: 30pt; font-weight: 900; letter-spacing: -0.6px; line-height: 1.05; color: ${BRAND.ink}; margin-bottom: 6mm; max-width: 165mm; }
  .cover-sub { font-size: 12pt; color: ${BRAND.inkDim}; max-width: 155mm; line-height: 1.5; margin-bottom: 16mm; }
  .cover-meta { margin-top: auto; display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; border-top: 1px solid ${BRAND.hairline}; padding-top: 10mm; }
  .cover-meta-item small { display: block; font-family: ui-monospace, monospace; font-size: 7.5pt; letter-spacing: 1.5px; text-transform: uppercase; color: ${BRAND.inkDim}; margin-bottom: 4px; }
  .cover-meta-item b { font-size: 11pt; color: ${BRAND.ink}; font-weight: 800; font-family: ui-monospace, "SF Mono", Menlo, monospace; letter-spacing: 0.04em; }
  .cover-foot { margin-top: 8mm; padding: 5mm 6mm; border-left: 3px solid ${BRAND.phosphorCyan}; background: ${BRAND.hairlineSoft}; border-radius: 0 8px 8px 0; color: ${BRAND.inkDim}; font-size: 9pt; line-height: 1.5; max-width: 175mm; }
  .cover-foot b { color: ${BRAND.ink}; }
  .cover-seal { margin-top: 10mm; padding-top: 8mm; border-top: 1px solid ${BRAND.hairline}; display: grid; grid-template-columns: 1fr auto; gap: 14mm; align-items: center; }
  .cover-seal .seal-left { display: flex; align-items: center; gap: 8mm; }
  .cover-seal .seal-glyph { flex-shrink: 0; opacity: 0.95; }
  .cover-seal .seal-text { font-family: ui-monospace, monospace; font-size: 8.5pt; line-height: 1.6; color: ${BRAND.inkDim}; letter-spacing: 0.04em; }
  .cover-seal .seal-text b { color: ${BRAND.phosphorCyanInk}; font-weight: 800; letter-spacing: 0.08em; }
  .verify-block { text-align: center; border: 1px solid ${BRAND.hairline}; border-radius: 10px; padding: 4mm 5mm; min-width: 56mm; }
  .verify-block .verify-kicker { font-family: ui-monospace, monospace; font-size: 7pt; letter-spacing: 1.6px; text-transform: uppercase; color: ${BRAND.phosphorCyanInk}; font-weight: 800; margin-bottom: 3mm; }
  .verify-block .qr-pattern { display: flex; justify-content: center; margin-bottom: 3mm; }
  .verify-block .verify-url { font-family: ui-monospace, monospace; font-size: 8pt; color: ${BRAND.ink}; font-weight: 700; letter-spacing: 0.02em; margin-bottom: 2mm; word-break: break-all; }
  .verify-block .verify-hint { font-size: 7pt; color: ${BRAND.inkSoft}; line-height: 1.4; }

  /* Page chrome */
  .pagehead { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid ${BRAND.hairline}; padding-bottom: 6mm; margin-bottom: 8mm; font-family: ui-monospace, monospace; font-size: 8pt; color: ${BRAND.inkDim}; letter-spacing: 1.5px; text-transform: uppercase; }
  .pagehead .left { display: flex; align-items: center; gap: 10px; }
  .pagehead b { color: ${BRAND.phosphorCyanInk}; font-weight: 800; letter-spacing: 3px; }
  h1.section { font-size: 18pt; font-weight: 900; color: ${BRAND.ink}; letter-spacing: -0.4px; margin-bottom: 2mm; line-height: 1.1; }
  h1.section .accent { color: ${BRAND.phosphorCyanInk}; font-weight: 900; }
  .section-sub { color: ${BRAND.inkDim}; font-size: 10pt; margin-bottom: 6mm; }
  .doc h2 { font-family: ui-monospace, monospace; font-size: 9pt; letter-spacing: 2px; text-transform: uppercase; color: ${BRAND.phosphorCyanInk}; font-weight: 800; margin-top: 8mm; margin-bottom: 4mm; padding-bottom: 2mm; border-bottom: 1px solid ${BRAND.hairlineSoft}; }

  /* Verdict */
  .verdict { display: grid; grid-template-columns: 1fr 1.4fr; gap: 16px; align-items: stretch; margin: 4mm 0 8mm; }
  .verdict-num { background: ${BRAND.bgPrint}; color: ${BRAND.ink}; border: 1px solid ${BRAND.hairline}; border-top: 4px solid ${BRAND.phosphorCyan}; border-radius: 12px; padding: 10mm 8mm; text-align: center; }
  .verdict-num small { display: block; font-family: ui-monospace, monospace; font-size: 8pt; letter-spacing: 2.5px; text-transform: uppercase; color: ${BRAND.phosphorCyanInk}; margin-bottom: 2mm; font-weight: 700; }
  .verdict-num .num { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 56pt; font-weight: 900; color: ${BRAND.ink}; line-height: 0.9; letter-spacing: -2px; }
  .verdict-num .of { color: ${BRAND.inkDim}; font-size: 10pt; margin-top: 2mm; font-family: ui-monospace, monospace; }
  .verdict-card { background: ${BRAND.bgPrint}; border: 1px solid ${BRAND.hairline}; border-left: 4px solid var(--nivelColor, ${BRAND.phosphorCyan}); border-radius: 12px; padding: 8mm; display: flex; flex-direction: column; justify-content: center; }
  .verdict-card .nivel-kicker { font-family: ui-monospace, monospace; font-size: 8pt; letter-spacing: 2.5px; text-transform: uppercase; color: ${BRAND.inkDim}; margin-bottom: 2mm; font-weight: 700; }
  .verdict-card .nivel-label { font-size: 22pt; font-weight: 900; color: var(--nivelColor, ${BRAND.phosphorCyan}); margin-bottom: 4mm; line-height: 1; letter-spacing: -0.5px; }
  .verdict-card .nivel-text { color: ${BRAND.ink}; font-size: 10.5pt; line-height: 1.5; }

  /* Meter */
  .meter-wrap { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; margin: 4mm 0; }
  .meter-seg { background: ${BRAND.hairlineSoft}; border-radius: 6px; padding: 8px 6px; text-align: center; position: relative; border: 1px solid ${BRAND.hairline}; }
  .meter-seg.active { background: var(--seg, ${BRAND.phosphorCyan}); border-color: var(--seg, ${BRAND.phosphorCyan}); box-shadow: 0 4px 12px -4px var(--seg, ${BRAND.phosphorCyan}); }
  .meter-seg-label { font-family: ui-monospace, monospace; font-size: 7.5pt; letter-spacing: 0.06em; text-transform: uppercase; font-weight: 700; color: ${BRAND.inkDim}; }
  .meter-seg.active .meter-seg-label { color: ${BRAND.ink}; }

  /* Domain rows */
  .domain-row { display: grid; grid-template-columns: 64mm 1fr 18mm 22mm; gap: 12px; align-items: center; padding: 5px 0; border-bottom: 1px solid ${BRAND.hairlineSoft}; }
  .domain-row:last-child { border-bottom: none; }
  .domain-label { color: ${BRAND.ink}; font-size: 10pt; font-weight: 600; }
  .domain-bar-wrap { height: 10px; border-radius: 999px; overflow: hidden; position: relative; }
  .domain-bar { height: 100%; border-radius: 999px; }
  .domain-nivel { font-family: ui-monospace, monospace; font-size: 8pt; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; text-align: center; }
  .domain-score { text-align: right; font-family: ui-monospace, monospace; font-size: 11pt; font-weight: 800; letter-spacing: -0.02em; }
  .domain-max { color: ${BRAND.inkSoft}; font-weight: 500; font-size: 9pt; letter-spacing: 0; }

  /* Action block */
  .action-block { margin-top: 6mm; border: 1px solid ${BRAND.hairline}; border-left: 4px solid ${BRAND.phosphorCyan}; border-radius: 12px; padding: 6mm 7mm; background: ${BRAND.bgPrint}; }
  .action-block.amber { border-left-color: ${BRAND.signalAmber}; }
  .action-block.danger { border-left-color: ${BRAND.plasmaRed}; }
  .action-block .action-kicker { font-family: ui-monospace, monospace; font-size: 8pt; letter-spacing: 2px; text-transform: uppercase; color: ${BRAND.inkDim}; font-weight: 700; margin-bottom: 2mm; }
  .action-block .action-domain { font-size: 14pt; font-weight: 800; color: ${BRAND.ink}; margin-bottom: 1mm; letter-spacing: -0.2px; }
  .action-block .action-meta { font-family: ui-monospace, monospace; font-size: 9pt; color: ${BRAND.inkDim}; margin-bottom: 4mm; }
  .action-block .action-meta .nivel-chip { display: inline-block; padding: 2px 8px; border-radius: 999px; font-weight: 800; font-size: 8.5pt; letter-spacing: 0.06em; margin-right: 6px; color: var(--nivelColor, ${BRAND.phosphorCyan}); background: var(--nivelBg, #E0F7FA); }
  .action-block .action-proto { background: ${BRAND.hairlineSoft}; border-radius: 8px; padding: 4mm 5mm; margin-top: 3mm; display: grid; grid-template-columns: auto 1fr; gap: 5mm; align-items: center; }
  .action-block .proto-tile { width: 14mm; height: 14mm; border-radius: 8px; background: ${BRAND.phosphorCyan}22; border: 1px solid ${BRAND.phosphorCyan}; color: ${BRAND.phosphorCyanInk}; display: flex; align-items: center; justify-content: center; font-family: ui-monospace, monospace; font-weight: 900; font-size: 13pt; letter-spacing: -0.04em; }
  .action-block .proto-name { font-size: 12pt; font-weight: 800; color: ${BRAND.ink}; margin-bottom: 1mm; }
  .action-block .proto-dose { font-family: ui-monospace, monospace; font-size: 9pt; color: ${BRAND.phosphorCyanInk}; font-weight: 700; margin-bottom: 2mm; }
  .action-block .proto-rationale { font-size: 9.5pt; color: ${BRAND.inkDim}; line-height: 1.5; }
  .action-block .referral { background: ${BRAND.hairlineSoft}; border-radius: 8px; padding: 4mm 5mm; margin-top: 3mm; font-size: 10pt; color: ${BRAND.ink}; line-height: 1.55; }

  /* Cat grid */
  .cat-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-top: 4mm; }
  .cat-card { background: ${BRAND.hairlineSoft}; border: 1px solid ${BRAND.hairline}; border-radius: 10px; padding: 5mm 4mm; text-align: center; }
  .cat-card small { display: block; font-family: ui-monospace, monospace; font-size: 7pt; letter-spacing: 1.4px; text-transform: uppercase; color: ${BRAND.inkDim}; margin-bottom: 2mm; font-weight: 700; min-height: 22px; line-height: 1.3; }
  .cat-card .v { font-family: ui-monospace, "SF Mono", monospace; font-size: 16pt; font-weight: 900; color: ${BRAND.phosphorCyanInk}; letter-spacing: -0.04em; }
  .cat-card .vmax { color: ${BRAND.inkSoft}; font-size: 9pt; margin-top: 1mm; font-family: ui-monospace, monospace; }

  /* Callouts */
  .callout { border-left: 3px solid ${BRAND.phosphorCyan}; background: ${BRAND.hairlineSoft}; padding: 5mm 6mm; margin: 4mm 0; border-radius: 0 8px 8px 0; font-size: 10pt; line-height: 1.55; }
  .callout.amber { border-left-color: ${BRAND.signalAmber}; }
  .callout.danger { border-left-color: ${BRAND.plasmaRed}; }
  .callout b { color: ${BRAND.ink}; }

  /* History */
  .history-row { display: grid; grid-template-columns: 50mm 1fr 22mm 28mm; gap: 12px; align-items: center; padding: 5px 0; border-bottom: 1px solid ${BRAND.hairlineSoft}; }
  .history-row.current { background: ${BRAND.hairlineSoft}; border-radius: 6px; margin: 4px -8px; padding: 7px 8px; border-bottom: none; }
  .history-row .h-date { font-family: ui-monospace, monospace; font-size: 9pt; color: ${BRAND.ink}; font-weight: 700; }
  .history-row .h-current-tag { font-family: ui-monospace, monospace; font-size: 7pt; color: ${BRAND.phosphorCyanInk}; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; margin-left: 4px; }
  .history-row .h-bar-wrap { height: 8px; background: ${BRAND.hairlineSoft}; border-radius: 999px; overflow: hidden; position: relative; }
  .history-row.current .h-bar-wrap { background: ${BRAND.bgPrint}; }
  .history-row .h-bar { height: 100%; border-radius: 999px; }
  .history-row .h-total { text-align: right; font-family: ui-monospace, monospace; font-size: 11pt; font-weight: 800; color: ${BRAND.ink}; letter-spacing: -0.02em; }
  .history-row .h-nivel { font-family: ui-monospace, monospace; font-size: 8pt; font-weight: 800; text-align: center; letter-spacing: 0.06em; text-transform: uppercase; }
  .history-trend { margin-top: 6mm; padding: 4mm 5mm; background: ${BRAND.hairlineSoft}; border-radius: 8px; border-left: 3px solid ${BRAND.phosphorCyan}; font-size: 10pt; color: ${BRAND.ink}; line-height: 1.55; }
  .history-trend b { color: ${BRAND.phosphorCyanInk}; }

  /* Actions list */
  .doc ul.actions { list-style: none; padding: 0; margin: 3mm 0; }
  .doc ul.actions li { padding: 3mm 0 3mm 9mm; position: relative; color: ${BRAND.ink}; font-size: 10pt; line-height: 1.5; border-bottom: 1px solid ${BRAND.hairlineSoft}; }
  .doc ul.actions li:last-child { border-bottom: none; }
  .doc ul.actions li::before { content: "→"; position: absolute; left: 0; top: 3mm; color: ${BRAND.phosphorCyan}; font-weight: 900; font-size: 12pt; line-height: 1.2; }

  /* Disclaimer */
  .disclaimer { background: ${BRAND.hairlineSoft}; border-radius: 10px; padding: 6mm; margin-top: 6mm; color: ${BRAND.inkDim}; font-size: 9pt; line-height: 1.55; }
  .disclaimer b { color: ${BRAND.ink}; }
  .disclaimer h3 { font-family: ui-monospace, monospace; font-size: 8pt; letter-spacing: 1.8px; text-transform: uppercase; color: ${BRAND.phosphorCyanInk}; font-weight: 800; margin-bottom: 3mm; }

  /* Edge mark */
  .edge-mark { position: absolute; top: 22mm; bottom: 16mm; right: 6mm; width: 8mm; pointer-events: none; overflow: hidden; display: flex; align-items: center; justify-content: center; }
  .edge-mark span { transform: rotate(180deg); writing-mode: vertical-rl; font-family: ui-monospace, monospace; font-size: 6.5pt; letter-spacing: 0.18em; color: ${BRAND.inkSoft}; opacity: 0.55; text-transform: uppercase; white-space: nowrap; }

  /* Page foot */
  .pagefoot { position: absolute; bottom: 8mm; left: 18mm; right: 18mm; border-top: 1px solid ${BRAND.hairline}; padding-top: 3mm; font-family: ui-monospace, monospace; font-size: 7.5pt; color: ${BRAND.inkSoft}; display: flex; justify-content: space-between; letter-spacing: 0.04em; }
  .pagefoot .code { color: ${BRAND.phosphorCyanInk}; font-weight: 700; }

  /* Print — aísla el reporte del shell de la app sin conocer el DOM padre */
  @media print {
    html, body {
      background: ${BRAND.bgPrint} !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      margin: 0 !important;
      padding: 0 !important;
    }
    body * { visibility: hidden !important; }
    .nom35-report-root,
    .nom35-report-root * { visibility: visible !important; }
    .nom35-report-root {
      position: absolute;
      top: 0; left: 0;
      width: 100%;
      padding: 0 !important;
      margin: 0 !important;
    }
    .doc { box-shadow: none; }
    .page { padding: 16mm 14mm 14mm; }
    .print-bar { display: none !important; }
  }
`;
