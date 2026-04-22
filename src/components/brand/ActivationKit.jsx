/* ═══════════════════════════════════════════════════════════════
   ActivationKit — Workplace activation cards (QR + NFC).
   Matches the marketing-site trademark exactly:
     · wordmark    BIO (dim navy 400) · — (phosphor-cyan 700, raised)
                   · IGNICIÓN (navy 800)
     · glyph       rounded-square placa with cyan halo + the
                   asymmetric 3-ray BioGlyph (core + dotted ring)
     · substrate   light silver-white — same surface family as the
                   marketing PublicShell in theme-light
     · accent      phosphor cyan #22D3EE (dash, glyph, rays only)
   ═══════════════════════════════════════════════════════════════ */

import Link from "next/link";

const CY_SIGNAL = "#22D3EE";  // phosphor cyan — the only brand accent
const CY_SPARK  = "#A5F3FC";  // pale halo
const CY_CORE   = "#ECFEFF";  // brightest spark
const INK       = "#0F172A";  // slate 900 — primary ink
const INK_DIM   = "#475569";  // slate 600 — secondary
const INK_MUTE  = "#94A3B8";  // slate 400 — microtype
const PAPER_0   = "#FFFFFF";
const PAPER_1   = "#F8FAFC";
const PAPER_2   = "#F1F5F9";
const LINE      = "#E2E8F0";  // subtle borders

/* ──────────────────────────── Deterministic QR matrix ─────── */
function useQrCells(modules = 25) {
  const cells = [];
  const positions = [[0, 0], [modules - 7, 0], [0, modules - 7]];
  const inFinder = (x, y) =>
    positions.some(([px, py]) => x >= px && x < px + 7 && y >= py && y < py + 7);
  const inTiming = (x, y) => x === 6 || y === 6;
  for (let y = 0; y < modules; y++) {
    for (let x = 0; x < modules; x++) {
      if (inFinder(x, y)) continue;
      if (inTiming(x, y)) {
        if ((x + y) % 2 === 0) cells.push([x, y]);
        continue;
      }
      const h = (x * 73856093) ^ (y * 19349663) ^ ((x * y + 1) * 83492791);
      if ((h & 7) < 3) cells.push([x, y]);
    }
  }
  return { cells, positions, modules };
}

function QRMatrix({ size = 300, modules = 25, fill = INK, bg = PAPER_0 }) {
  const { cells, positions } = useQrCells(modules);
  const m = size / modules;
  return (
    <g>
      <rect width={size} height={size} rx={m * 0.6} fill={bg} />
      {cells.map(([x, y], i) => (
        <rect
          key={i}
          x={x * m + m * 0.1}
          y={y * m + m * 0.1}
          width={m * 0.8}
          height={m * 0.8}
          rx={m * 0.18}
          fill={fill}
        />
      ))}
      {positions.map(([px, py], i) => (
        <g key={i} transform={`translate(${px * m},${py * m})`}>
          <rect width={m * 7} height={m * 7} rx={m * 1.6} fill={fill} />
          <rect x={m} y={m} width={m * 5} height={m * 5} rx={m * 1.1} fill={bg} />
          <rect x={m * 2} y={m * 2} width={m * 3} height={m * 3} rx={m * 0.6} fill={fill} />
        </g>
      ))}
    </g>
  );
}

/* ──────────────────────────── BioGlyph (brand mark) ────────── */
/* 3 asymmetric rays at 30°, 210° and 90° + halo + dotted ring + core */
function BioGlyphSvg({ size = 42, haloOpacity = 0.18 }) {
  const c = size / 2;
  const rNode = size * 0.13;
  const rHalo = size * 0.42;
  const rayLen = size * 0.34;
  const rays = [
    { a: -Math.PI / 6, op: 1 },
    { a: (7 * Math.PI) / 6, op: 0.7 },
    { a: Math.PI / 2, op: 0.85 },
  ];
  return (
    <g>
      <defs>
        <radialGradient id={`bg-halo-${size}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={CY_SIGNAL} stopOpacity={haloOpacity} />
          <stop offset="100%" stopColor={CY_SIGNAL} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`bg-core-${size}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={CY_CORE} stopOpacity="1" />
          <stop offset="60%" stopColor={CY_SIGNAL} stopOpacity="1" />
          <stop offset="100%" stopColor={CY_SIGNAL} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={rHalo} fill={`url(#bg-halo-${size})`} />
      <circle
        cx={c}
        cy={c}
        r={rHalo * 0.85}
        fill="none"
        stroke={CY_SIGNAL}
        strokeWidth={size * 0.015}
        strokeDasharray={`${size * 0.02} ${size * 0.035}`}
        opacity="0.55"
      />
      {rays.map((r, i) => {
        const x2 = c + Math.cos(r.a) * rayLen;
        const y2 = c + Math.sin(r.a) * rayLen;
        return (
          <line
            key={i}
            x1={c}
            y1={c}
            x2={x2}
            y2={y2}
            stroke={CY_SIGNAL}
            strokeWidth={size * 0.05}
            strokeLinecap="round"
            opacity={r.op}
          />
        );
      })}
      <circle cx={c} cy={c} r={rNode} fill={`url(#bg-core-${size})`} />
      <circle cx={c} cy={c} r={rNode * 0.35} fill={CY_CORE} opacity="0.95" />
    </g>
  );
}

/* Rounded-square placa wrapper for the glyph (matches PublicShell light) */
function GlyphPlaca({ size = 56, glyphSize }) {
  const s = size;
  const inner = glyphSize || Math.round(s * 0.78);
  const rx = s * 0.26;
  return (
    <g>
      <defs>
        <radialGradient id={`placa-${s}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={CY_SIGNAL} stopOpacity="0.22" />
          <stop offset="60%" stopColor={PAPER_0} stopOpacity="0.65" />
          <stop offset="100%" stopColor={PAPER_0} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect
        x={0}
        y={0}
        width={s}
        height={s}
        rx={rx}
        fill={`url(#placa-${s})`}
      />
      <rect
        x={1}
        y={1}
        width={s - 2}
        height={s - 2}
        rx={rx - 1}
        fill="none"
        stroke={CY_SIGNAL}
        strokeOpacity="0.38"
        strokeWidth="1"
      />
      <g transform={`translate(${(s - inner) / 2},${(s - inner) / 2})`}>
        <BioGlyphSvg size={inner} />
      </g>
    </g>
  );
}

/* ──────────────────────────── Wordmark ──────────────────────── */
/* BIO (dim 400) — (cyan 700 raised) IGNICIÓN (black 800) */
function Wordmark({ size = 22 }) {
  return (
    <text
      y={size * 0.82}
      fontSize={size}
      fontFamily="var(--font-sans), 'Manrope', Inter, system-ui, sans-serif"
      letterSpacing={size * 0.11}
      style={{ textTransform: "uppercase" }}
    >
      <tspan fontWeight="400" fill={INK} fillOpacity="0.68">BIO</tspan>
      <tspan dx={size * 0.28} fontWeight="700" fill={CY_SIGNAL} dy={-size * 0.1}>—</tspan>
      <tspan dx={size * 0.12} fontWeight="800" fill={INK} dy={size * 0.1}>IGNICIÓN</tspan>
    </text>
  );
}

/* ──────────────────────────── NFC tap zone ──────────────────── */
function NFCZone({ r = 88 }) {
  return (
    <g>
      <circle r={r} fill="none" stroke={CY_SIGNAL} strokeWidth="1.6" opacity="0.55" />
      <circle r={r * 0.74} fill="none" stroke={CY_SIGNAL} strokeWidth="1.3" opacity="0.42" />
      <circle r={r * 0.48} fill="none" stroke={CY_SIGNAL} strokeWidth="1.1" opacity="0.3" />
      <g>
        <circle r={5.2} fill={CY_SIGNAL} />
        <path
          d={`M${-r * 0.22} ${-r * 0.32} Q 0 ${-r * 0.12} ${r * 0.22} ${-r * 0.32}`}
          fill="none"
          stroke={CY_SIGNAL}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d={`M${-r * 0.36} ${-r * 0.46} Q 0 ${-r * 0.18} ${r * 0.36} ${-r * 0.46}`}
          fill="none"
          stroke={CY_SIGNAL}
          strokeWidth="1.7"
          strokeLinecap="round"
          opacity="0.7"
        />
      </g>
    </g>
  );
}

/* ──────────────────────────── Substrate (light paper) ──────── */
function SubstrateDefs({ id }) {
  return (
    <defs>
      <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={PAPER_0} />
        <stop offset="0.6" stopColor={PAPER_1} />
        <stop offset="1" stopColor={PAPER_2} />
      </linearGradient>
      <pattern id={`${id}-dots`} width="18" height="18" patternUnits="userSpaceOnUse">
        <circle cx="9" cy="9" r="0.55" fill={CY_SIGNAL} opacity="0.08" />
      </pattern>
      <radialGradient id={`${id}-aura`} cx="20%" cy="0%" r="75%">
        <stop offset="0" stopColor={CY_SIGNAL} stopOpacity="0.12" />
        <stop offset="0.55" stopColor={CY_SIGNAL} stopOpacity="0.03" />
        <stop offset="1" stopColor={CY_SIGNAL} stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}
function SubstrateLayers({ id, w, h, rx }) {
  return (
    <>
      <rect width={w} height={h} rx={rx} fill={`url(#${id}-bg)`} />
      <rect width={w} height={h} rx={rx} fill={`url(#${id}-dots)`} />
      <rect width={w} height={h} rx={rx} fill={`url(#${id}-aura)`} />
      <rect
        x="0.5"
        y="0.5"
        width={w - 1}
        height={h - 1}
        rx={rx - 0.5}
        fill="none"
        stroke={LINE}
        strokeWidth="1"
      />
      <rect
        x="1.5"
        y="1.5"
        width={w - 3}
        height={h - 3}
        rx={rx - 1.5}
        fill="none"
        stroke={CY_SIGNAL}
        strokeOpacity="0.12"
        strokeWidth="0.8"
      />
    </>
  );
}

/* ──────────────────────────── Desk Card FRONT ───────────────── */
export function DeskCardFront({ T, serial = "KIT · 24.104 · FLEET-ACME" }) {
  return (
    <svg
      viewBox="0 0 860 540"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={T.ariaFront}
      className="bi-kit-svg"
    >
      <SubstrateDefs id="df" />
      <SubstrateLayers id="df" w={860} h={540} rx={40} />

      {/* Header row: placa + wordmark + serial */}
      <g transform="translate(48,38)">
        <GlyphPlaca size={54} />
      </g>
      <g transform="translate(116,50)">
        <Wordmark size={28} />
      </g>
      <text
        x="812"
        y="62"
        fontSize="11"
        fill={INK_MUTE}
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="2.2"
        textAnchor="end"
      >
        {serial}
      </text>

      {/* Left column · NFC */}
      <g transform="translate(210,316)">
        <NFCZone r={92} />
      </g>
      <text
        x="210"
        y="450"
        fontSize="12"
        fontWeight="800"
        fill={INK}
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="8"
        textAnchor="middle"
      >
        TAP · NFC
      </text>
      <text
        x="210"
        y="470"
        fontSize="10"
        fill={INK_DIM}
        textAnchor="middle"
        letterSpacing="1.4"
      >
        {T.tapSub}
      </text>

      {/* Divider */}
      <line
        x1="430"
        y1="132"
        x2="430"
        y2="440"
        stroke={LINE}
        strokeWidth="1"
      />

      {/* Right column · QR */}
      <g transform="translate(512,140)">
        <rect
          x="-12"
          y="-12"
          width="244"
          height="244"
          rx="16"
          fill={PAPER_0}
          stroke={LINE}
          strokeWidth="1"
        />
        <QRMatrix size={220} modules={25} fill={INK} bg={PAPER_0} />
        {/* Brand mark at QR center */}
        <g transform="translate(92,92)">
          <rect width="36" height="36" rx="9" fill={PAPER_0} />
          <g transform="translate(2,2)">
            <BioGlyphSvg size={32} />
          </g>
        </g>
      </g>
      <text
        x="624"
        y="450"
        fontSize="12"
        fontWeight="800"
        fill={INK}
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="8"
        textAnchor="middle"
      >
        SCAN · QR
      </text>
      <text
        x="624"
        y="470"
        fontSize="10"
        fill={INK_DIM}
        textAnchor="middle"
        letterSpacing="1.4"
      >
        {T.scanSub}
      </text>

      {/* Footer microtype */}
      <text
        x="48"
        y="512"
        fontSize="9"
        fill={INK_MUTE}
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="2.4"
      >
        NEURAL ACTIVATION POINT
      </text>
      <text
        x="812"
        y="512"
        fontSize="9"
        fill={INK_MUTE}
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="2.4"
        textAnchor="end"
      >
        bio-ignicion.app/k/24104
      </text>
    </svg>
  );
}

/* ──────────────────────────── Desk Card BACK ────────────────── */
export function DeskCardBack({ T, serial = "KIT · 24.104 · FLEET-ACME" }) {
  return (
    <svg
      viewBox="0 0 860 540"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={T.ariaBack}
      className="bi-kit-svg"
    >
      <SubstrateDefs id="db" />
      <SubstrateLayers id="db" w={860} h={540} rx={40} />

      <g transform="translate(48,38)">
        <GlyphPlaca size={36} />
      </g>
      <g transform="translate(96,46)">
        <Wordmark size={20} />
      </g>
      <text
        x="812"
        y="56"
        fontSize="10"
        fill={INK_MUTE}
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="2.2"
        textAnchor="end"
      >
        {T.backHeader}
      </text>

      <line x1="48" y1="110" x2="812" y2="110" stroke={LINE} />

      <text
        x="48"
        y="148"
        fontSize="14"
        fontWeight="800"
        fill={INK}
        letterSpacing="3.5"
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
      >
        {T.installTitle}
      </text>

      {T.steps.map((s, i) => (
        <g key={i} transform={`translate(${60 + i * 254},196)`}>
          <rect width="44" height="44" rx="10" fill={PAPER_0} stroke={LINE} />
          <text
            x="22"
            y="30"
            textAnchor="middle"
            fontSize="16"
            fontWeight="800"
            fill={CY_SIGNAL}
            fontFamily="ui-monospace, 'JetBrains Mono', monospace"
          >
            {String(i + 1).padStart(2, "0")}
          </text>
          <text
            x="60"
            y="20"
            fontSize="13"
            fontWeight="800"
            fill={INK}
            letterSpacing="2.4"
            fontFamily="ui-monospace, 'JetBrains Mono', monospace"
          >
            {s.t}
          </text>
          <text x="60" y="42" fontSize="11" fill={INK_DIM} letterSpacing="0.3">
            <tspan x="60" dy="0">{s.d1}</tspan>
            <tspan x="60" dy="15">{s.d2}</tspan>
          </text>
        </g>
      ))}

      {/* Centered glyph seal */}
      <g transform="translate(430,378)" opacity="0.95">
        <g transform="translate(-48,-48)">
          <BioGlyphSvg size={96} />
        </g>
      </g>
      <text
        x="430"
        y="452"
        fontSize="9"
        fill={INK_MUTE}
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="4.5"
        textAnchor="middle"
      >
        NEURAL · PERFORMANCE
      </text>

      <line x1="48" y1="476" x2="812" y2="476" stroke={LINE} />

      <text
        x="48"
        y="498"
        fontSize="9"
        fill={INK_MUTE}
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="1.8"
      >
        {T.backLegal1}
      </text>
      <text
        x="48"
        y="516"
        fontSize="9"
        fill={INK_MUTE}
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="1.8"
      >
        {serial}
      </text>
      <text
        x="812"
        y="516"
        fontSize="9"
        fill={INK_MUTE}
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="1.8"
        textAnchor="end"
      >
        bio-ignicion.app
      </text>
    </svg>
  );
}

/* ──────────────────────────── Wall Placard (A5 portrait) ────── */
export function WallPlacard({ T, serial = "SALA · NEURAL · 04" }) {
  return (
    <svg
      viewBox="0 0 420 594"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={T.ariaWall}
      className="bi-kit-svg"
    >
      <SubstrateDefs id="wp" />
      <SubstrateLayers id="wp" w={420} h={594} rx={22} />

      <g transform="translate(26,32)">
        <GlyphPlaca size={36} />
      </g>
      <g transform="translate(74,40)">
        <Wordmark size={16} />
      </g>
      <text
        x="394"
        y="52"
        fontSize="9"
        fill={INK_MUTE}
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="2"
        textAnchor="end"
      >
        {serial}
      </text>

      <line x1="26" y1="96" x2="394" y2="96" stroke={LINE} />

      {/* NFC big */}
      <g transform="translate(210,186)">
        <NFCZone r={86} />
      </g>
      <text
        x="210"
        y="308"
        fontSize="11"
        fontWeight="800"
        fill={INK}
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="6"
        textAnchor="middle"
      >
        ACERCA TU TELÉFONO
      </text>

      {/* OR divider */}
      <g transform="translate(210,338)">
        <line x1="-80" y1="0" x2="-22" y2="0" stroke={LINE} />
        <text
          x="0"
          y="4"
          fontSize="9"
          fill={INK_DIM}
          fontFamily="ui-monospace, 'JetBrains Mono', monospace"
          textAnchor="middle"
          letterSpacing="3.5"
        >
          {T.orLabel}
        </text>
        <line x1="22" y1="0" x2="80" y2="0" stroke={LINE} />
      </g>

      {/* QR */}
      <g transform="translate(130,364)">
        <rect
          x="-8"
          y="-8"
          width="176"
          height="176"
          rx="12"
          fill={PAPER_0}
          stroke={LINE}
        />
        <QRMatrix size={160} modules={25} fill={INK} bg={PAPER_0} />
        <g transform="translate(64,64)">
          <rect width="32" height="32" rx="8" fill={PAPER_0} />
          <g transform="translate(2,2)">
            <BioGlyphSvg size={28} />
          </g>
        </g>
      </g>
      <text
        x="210"
        y="568"
        fontSize="11"
        fontWeight="800"
        fill={INK}
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="6"
        textAnchor="middle"
      >
        O ESCANEA
      </text>
      <text
        x="210"
        y="584"
        fontSize="8.5"
        fill={INK_MUTE}
        textAnchor="middle"
        letterSpacing="1.8"
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
      >
        bio-ignicion.app/k/sala-04
      </text>
    </svg>
  );
}

/* ──────────────────────────── Laptop Disc (round 60 mm) ─────── */
export function LaptopDisc({ T }) {
  return (
    <svg
      viewBox="0 0 240 240"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={T.ariaDisc}
      className="bi-kit-svg"
    >
      <defs>
        <radialGradient id="ld-bg" cx="50%" cy="35%" r="70%">
          <stop offset="0" stopColor={PAPER_0} />
          <stop offset="0.7" stopColor={PAPER_1} />
          <stop offset="1" stopColor={PAPER_2} />
        </radialGradient>
        <radialGradient id="ld-aura" cx="50%" cy="35%" r="40%">
          <stop offset="0" stopColor={CY_SIGNAL} stopOpacity="0.16" />
          <stop offset="1" stopColor={CY_SIGNAL} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="120" cy="120" r="118" fill="url(#ld-bg)" />
      <circle cx="120" cy="120" r="118" fill="url(#ld-aura)" />
      <circle
        cx="120"
        cy="120"
        r="117"
        fill="none"
        stroke={LINE}
        strokeWidth="1"
      />
      <circle
        cx="120"
        cy="120"
        r="112"
        fill="none"
        stroke={CY_SIGNAL}
        strokeOpacity="0.22"
        strokeWidth="0.8"
        strokeDasharray="2 4"
      />

      {/* Central ignition glyph */}
      <g transform="translate(80,62)">
        <BioGlyphSvg size={80} />
      </g>

      {/* Wordmark (abbreviated on small disc) */}
      <text
        x="120"
        y="170"
        fontSize="11"
        fontFamily="var(--font-sans), 'Manrope', Inter, system-ui, sans-serif"
        letterSpacing="2.4"
        textAnchor="middle"
        style={{ textTransform: "uppercase" }}
      >
        <tspan fontWeight="400" fill={INK} fillOpacity="0.65">BIO</tspan>
        <tspan dx="3" fontWeight="700" fill={CY_SIGNAL}>—</tspan>
        <tspan dx="3" fontWeight="800" fill={INK}>IGN</tspan>
      </text>

      <text
        x="120"
        y="194"
        fontSize="8"
        fontWeight="700"
        fill={INK}
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="3.5"
        textAnchor="middle"
      >
        TAP · SCAN
      </text>
      <text
        x="120"
        y="210"
        fontSize="7"
        fill={INK_MUTE}
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="2"
        textAnchor="middle"
      >
        laptop · 60 mm
      </text>
    </svg>
  );
}

/* ──────────────────────────── Desk context scene ────────────── */
function DeskContext({ T }) {
  return (
    <svg
      viewBox="0 0 640 360"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={T.ariaDesk}
      className="bi-kit-scene"
    >
      <defs>
        <linearGradient id="sc-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F8FAFC" />
          <stop offset="1" stopColor="#EEF2F7" />
        </linearGradient>
        <linearGradient id="sc-surf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E2E8F0" />
          <stop offset="1" stopColor="#CBD5E1" />
        </linearGradient>
      </defs>
      <SubstrateDefs id="ctx" />
      <rect width="640" height="214" fill="url(#sc-wall)" />
      <rect y="214" width="640" height="146" fill="url(#sc-surf)" />
      <line x1="0" y1="214" x2="640" y2="214" stroke={LINE} />

      {/* Laptop silhouette */}
      <g transform="translate(52,96)">
        <rect width="240" height="144" rx="8" fill={PAPER_1} stroke={LINE} />
        <rect x="14" y="14" width="212" height="116" rx="4" fill={PAPER_0} />
        <g transform="translate(120,72)">
          <BioGlyphSvg size={54} />
        </g>
      </g>
      <rect x="44" y="236" width="256" height="6" rx="3" fill={PAPER_2} stroke={LINE} />

      {/* Tilted card */}
      <g transform="translate(338,242) rotate(-7)">
        <g transform="scale(0.30)">
          <rect width="860" height="540" rx="40" fill="url(#ctx-bg)" />
          <rect width="860" height="540" rx="40" fill="url(#ctx-dots)" />
          <rect width="860" height="540" rx="40" fill="url(#ctx-aura)" />
          <rect x="0.5" y="0.5" width="859" height="539" rx="39.5" fill="none" stroke={LINE} />
          <g transform="translate(48,38)">
            <GlyphPlaca size={54} />
          </g>
          <g transform="translate(116,50)">
            <Wordmark size={28} />
          </g>
          <g transform="translate(210,316)">
            <NFCZone r={92} />
          </g>
          <g transform="translate(512,140)">
            <rect x="-12" y="-12" width="244" height="244" rx="16" fill={PAPER_0} stroke={LINE} />
            <QRMatrix size={220} modules={25} fill={INK} bg={PAPER_0} />
            <g transform="translate(92,92)">
              <rect width="36" height="36" rx="9" fill={PAPER_0} />
              <g transform="translate(2,2)">
                <BioGlyphSvg size={32} />
              </g>
            </g>
          </g>
        </g>
      </g>

      <text
        x="48"
        y="340"
        fontSize="10"
        fill={INK_MUTE}
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="2.2"
      >
        {T.deskCaption}
      </text>
    </svg>
  );
}

/* ──────────────────────────── Main component ────────────────── */
export default function ActivationKit({ T }) {
  return (
    <div className="bi-kit-showcase">
      <div className="bi-kit-header">
        <div className="bi-kit-kicker">{T.kicker}</div>
        <h2 id="kit-h" className="bi-kit-h">{T.headline}</h2>
        <p className="bi-kit-sub">{T.sub}</p>
      </div>

      <div className="bi-kit-hero" aria-label={T.heroAria}>
        <figure className="bi-kit-fig bi-kit-fig-featured">
          <DeskCardFront T={T.front} serial={T.serial} />
          <figcaption>
            <span className="num">01</span>
            <span className="txt">{T.captions.front}</span>
          </figcaption>
        </figure>
        <figure className="bi-kit-fig bi-kit-fig-featured">
          <DeskCardBack T={T.back} serial={T.serial} />
          <figcaption>
            <span className="num">02</span>
            <span className="txt">{T.captions.back}</span>
          </figcaption>
        </figure>
      </div>

      <div className="bi-kit-variants" aria-label={T.variantsAria}>
        <figure className="bi-kit-var bi-kit-var-wall">
          <WallPlacard T={T.wall} />
          <figcaption>
            <div className="t">{T.variants.wall.t}</div>
            <div className="d">{T.variants.wall.d}</div>
            <div className="m">{T.variants.wall.m}</div>
          </figcaption>
        </figure>
        <figure className="bi-kit-var bi-kit-var-desk">
          <DeskContext T={T.context} />
          <figcaption>
            <div className="t">{T.variants.desk.t}</div>
            <div className="d">{T.variants.desk.d}</div>
            <div className="m">{T.variants.desk.m}</div>
          </figcaption>
        </figure>
        <figure className="bi-kit-var bi-kit-var-disc">
          <LaptopDisc T={T.disc} />
          <figcaption>
            <div className="t">{T.variants.disc.t}</div>
            <div className="d">{T.variants.disc.d}</div>
            <div className="m">{T.variants.disc.m}</div>
          </figcaption>
        </figure>
      </div>

      <dl className="bi-kit-specs" aria-label={T.specsAria}>
        {T.specs.map((s, i) => (
          <div key={i} className="bi-kit-spec">
            <dt>{s.k}</dt>
            <dd>{s.v}</dd>
          </div>
        ))}
      </dl>

      <div className="bi-kit-fleet" aria-label={T.fleetAria}>
        <div className="bi-kit-fleet-h">{T.fleetTitle}</div>
        <ul className="bi-kit-fleet-list">
          {T.fleet.map((f, i) => (
            <li key={i} className={f.featured ? "is-feat" : ""}>
              <span className="q">{f.q}</span>
              <span className="t">{f.t}</span>
              {f.off && <span className="off">{f.off}</span>}
            </li>
          ))}
        </ul>
      </div>

      <div className="bi-kit-cta">
        <div className="bi-kit-fomo" role="status" aria-live="polite">
          <span className="dot" aria-hidden="true" />
          <span className="txt">{T.fomo}</span>
        </div>
        <div className="bi-kit-cta-row">
          <Link href="/demo" className="bi-kit-cta-primary">
            {T.ctaPrimary}
            <span aria-hidden="true" className="arrow">→</span>
          </Link>
          <Link href="/pricing#fleet" className="bi-kit-cta-secondary">
            {T.ctaSecondary}
          </Link>
        </div>
        <div className="bi-kit-cta-foot">{T.ctaFoot}</div>
      </div>

      <div className="bi-kit-legal">{T.legal}</div>
    </div>
  );
}
