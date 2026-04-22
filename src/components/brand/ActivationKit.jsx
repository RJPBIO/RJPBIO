/* ═══════════════════════════════════════════════════════════════
   ActivationKit — Workplace activation cards (QR + NFC).
   Pure SVG: desk card (front + back), wall placard, laptop disc.
   Brand DNA (marketing · theme-light):
     · emerald ring gradient #34D399 → #0D9488
     · ignition mark: concentric rings + diamonds + core dot
     · matte-black substrate with emerald aura
     · wordmark "BIO-IGNICIÓN" (hyphen)
   ═══════════════════════════════════════════════════════════════ */

import Link from "next/link";

const EM_400 = "#34D399";
const EM_500 = "#10B981";
const EM_600 = "#059669";
const EM_700 = "#0D9488";
const EM_LIGHT = "#ECFDF5";
const SUB_DARK_TOP = "#0A1410";
const SUB_DARK_MID = "#122820";
const SUB_DARK_BTM = "#08100C";

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

function QRMatrix({ size = 300, modules = 25, gradientId }) {
  const { cells, positions } = useQrCells(modules);
  const m = size / modules;
  const fill = gradientId ? `url(#${gradientId})` : EM_400;
  return (
    <g>
      <rect width={size} height={size} rx={m * 1.2} fill="#07100C" />
      {cells.map(([x, y], i) => (
        <rect
          key={i}
          x={x * m + m * 0.12}
          y={y * m + m * 0.12}
          width={m * 0.76}
          height={m * 0.76}
          rx={m * 0.16}
          fill={fill}
        />
      ))}
      {positions.map(([px, py], i) => (
        <g key={i} transform={`translate(${px * m},${py * m})`}>
          <rect width={m * 7} height={m * 7} rx={m * 1.6} fill={fill} />
          <rect x={m} y={m} width={m * 5} height={m * 5} rx={m * 1.1} fill="#07100C" />
          <rect x={m * 2} y={m * 2} width={m * 3} height={m * 3} rx={m * 0.6} fill={fill} />
        </g>
      ))}
    </g>
  );
}

/* ──────────────────────────── Brand ignition mark ──────────── */
function IgnitionMark({ size = 48, filtered = true, markId = "im" }) {
  const s = size;
  const r1 = s * 0.48;
  const r2 = s * 0.34;
  const r3 = s * 0.20;
  return (
    <g>
      <g
        fill="none"
        stroke={`url(#${markId}-ring)`}
        strokeWidth={s * 0.04}
        strokeLinecap="round"
        filter={filtered ? `url(#${markId}-glow)` : undefined}
      >
        <circle r={r1} opacity="0.92" />
        <circle r={r2} opacity="0.62" />
        <circle r={r3} opacity="0.42" />
      </g>
      <g fill={EM_LIGHT} filter={filtered ? `url(#${markId}-glow)` : undefined}>
        <path d={`M0 ${-s * 0.38} L${s * 0.05} ${-s * 0.14} L0 ${-s * 0.09} L${-s * 0.05} ${-s * 0.14} Z`} opacity="0.94" />
        <path d={`M0 ${s * 0.38} L${-s * 0.05} ${s * 0.14} L0 ${s * 0.09} L${s * 0.05} ${s * 0.14} Z`} opacity="0.94" />
        <circle r={s * 0.07} />
      </g>
    </g>
  );
}

function IgnitionMarkDefs({ id = "im" }) {
  return (
    <defs>
      <linearGradient id={`${id}-ring`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={EM_400} />
        <stop offset="100%" stopColor={EM_700} />
      </linearGradient>
      <filter id={`${id}-glow`} x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="1.6" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

/* ──────────────────────────── NFC tap zone ──────────────────── */
function NFCZone({ r = 78, gradientId }) {
  const stroke = gradientId ? `url(#${gradientId})` : EM_500;
  return (
    <g>
      <circle r={r} fill="none" stroke={stroke} strokeWidth="1.6" opacity="0.58" />
      <circle r={r * 0.74} fill="none" stroke={stroke} strokeWidth="1.3" opacity="0.45" />
      <circle r={r * 0.48} fill="none" stroke={stroke} strokeWidth="1.1" opacity="0.32" />
      <g>
        <circle r={5.2} fill={EM_400} />
        <path
          d={`M${-r * 0.22} ${-r * 0.32} Q 0 ${-r * 0.12} ${r * 0.22} ${-r * 0.32}`}
          fill="none"
          stroke={EM_400}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d={`M${-r * 0.36} ${-r * 0.46} Q 0 ${-r * 0.18} ${r * 0.36} ${-r * 0.46}`}
          fill="none"
          stroke={EM_400}
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.7"
        />
      </g>
    </g>
  );
}

/* ──────────────────────────── Wordmark ──────────────────────── */
function Wordmark({ size = 30, withTm = true }) {
  return (
    <g fontFamily="'Geist', Inter, system-ui, sans-serif">
      <text
        x="0"
        y={size * 0.82}
        fontSize={size}
        fontWeight="800"
        letterSpacing={size * 0.04}
      >
        <tspan fill={EM_LIGHT}>BIO-</tspan>
        <tspan fill={EM_400}>IGNICIÓN</tspan>
        {withTm && (
          <tspan
            dx={size * 0.15}
            dy={-size * 0.38}
            fontSize={size * 0.36}
            fontWeight="600"
            fill={EM_LIGHT}
            opacity="0.7"
          >
            TM
          </tspan>
        )}
      </text>
    </g>
  );
}

/* ──────────────────────────── Substrate defs / layers ──────── */
function SubstrateDefs({ id }) {
  return (
    <defs>
      <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={SUB_DARK_TOP} />
        <stop offset="0.55" stopColor={SUB_DARK_MID} />
        <stop offset="1" stopColor={SUB_DARK_BTM} />
      </linearGradient>
      <pattern id={`${id}-lat`} width="22" height="22" patternUnits="userSpaceOnUse">
        <path d="M11 0v22M0 11h22" stroke={EM_400} strokeWidth="0.35" opacity="0.06" />
        <circle cx="11" cy="11" r="0.7" fill={EM_400} opacity="0.12" />
      </pattern>
      <radialGradient id={`${id}-aura`} cx="50%" cy="0%" r="80%">
        <stop offset="0" stopColor={EM_500} stopOpacity="0.12" />
        <stop offset="0.6" stopColor={EM_500} stopOpacity="0.03" />
        <stop offset="1" stopColor={EM_500} stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={EM_400} stopOpacity="0.55" />
        <stop offset="0.5" stopColor={EM_500} stopOpacity="0.3" />
        <stop offset="1" stopColor={EM_700} stopOpacity="0.55" />
      </linearGradient>
      <linearGradient id={`${id}-etch`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={EM_400} />
        <stop offset="1" stopColor={EM_700} />
      </linearGradient>
    </defs>
  );
}

function SubstrateLayers({ id, w, h, rx }) {
  return (
    <>
      <rect width={w} height={h} rx={rx} fill={`url(#${id}-bg)`} />
      <rect width={w} height={h} rx={rx} fill={`url(#${id}-lat)`} />
      <rect width={w} height={h} rx={rx} fill={`url(#${id}-aura)`} />
      <rect
        x="0.75"
        y="0.75"
        width={w - 1.5}
        height={h - 1.5}
        rx={rx - 0.75}
        fill="none"
        stroke={`url(#${id}-rim)`}
        strokeWidth="1.5"
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
      <IgnitionMarkDefs id="df-im" />
      <SubstrateLayers id="df" w={860} h={540} rx={44} />

      {/* Header row */}
      <g transform="translate(48,42)">
        <Wordmark size={30} />
      </g>
      <text
        x="812"
        y="60"
        fontSize="11"
        fill={EM_LIGHT}
        opacity="0.58"
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="2"
        textAnchor="end"
      >
        {serial}
      </text>

      {/* Left column · NFC */}
      <g transform="translate(204,308)">
        <NFCZone r={90} gradientId="df-etch" />
      </g>
      <text
        x="204"
        y="438"
        fontSize="13"
        fontWeight="700"
        fill={EM_400}
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="7"
        textAnchor="middle"
      >
        TAP · NFC
      </text>
      <text
        x="204"
        y="460"
        fontSize="10"
        fill={EM_LIGHT}
        opacity="0.6"
        textAnchor="middle"
        letterSpacing="1.5"
      >
        {T.tapSub}
      </text>

      {/* Divider */}
      <line
        x1="430"
        y1="120"
        x2="430"
        y2="430"
        stroke={EM_500}
        strokeWidth="1"
        opacity="0.22"
        strokeDasharray="3 6"
      />

      {/* Right column · QR */}
      <g transform="translate(516,140)">
        <rect
          x="-14"
          y="-14"
          width="248"
          height="248"
          rx="20"
          fill="#06120D"
          stroke={EM_500}
          strokeOpacity="0.32"
          strokeWidth="1"
        />
        <QRMatrix size={220} modules={25} gradientId="df-etch" />
        {/* Ignition mark at center */}
        <g transform="translate(110,110)">
          <circle r="26" fill="#06120D" />
          <circle r="26" fill="none" stroke={EM_500} strokeWidth="1" opacity="0.4" />
          <IgnitionMark size={36} markId="df-im" />
        </g>
      </g>
      <text
        x="632"
        y="438"
        fontSize="13"
        fontWeight="700"
        fill={EM_400}
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="7"
        textAnchor="middle"
      >
        SCAN · QR
      </text>
      <text
        x="632"
        y="460"
        fontSize="10"
        fill={EM_LIGHT}
        opacity="0.6"
        textAnchor="middle"
        letterSpacing="1.5"
      >
        {T.scanSub}
      </text>

      {/* Footer microtype */}
      <text
        x="48"
        y="510"
        fontSize="9"
        fill={EM_LIGHT}
        opacity="0.4"
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="2.4"
      >
        NEURAL ACTIVATION POINT
      </text>
      <text
        x="812"
        y="510"
        fontSize="9"
        fill={EM_LIGHT}
        opacity="0.4"
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
      <IgnitionMarkDefs id="db-im" />
      <SubstrateLayers id="db" w={860} h={540} rx={44} />

      <g transform="translate(48,42)">
        <Wordmark size={22} withTm={false} />
      </g>
      <text
        x="812"
        y="58"
        fontSize="10"
        fill={EM_LIGHT}
        opacity="0.58"
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="2"
        textAnchor="end"
      >
        {T.backHeader}
      </text>

      <text
        x="48"
        y="140"
        fontSize="15"
        fontWeight="800"
        fill={EM_LIGHT}
        letterSpacing="3"
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
      >
        {T.installTitle}
      </text>

      {/* Install steps */}
      {T.steps.map((s, i) => (
        <g key={i} transform={`translate(${60 + i * 252},200)`}>
          <circle cx="24" cy="24" r="24" fill="none" stroke={`url(#db-etch)`} strokeWidth="1.6" />
          <text
            x="24"
            y="31"
            textAnchor="middle"
            fontSize="16"
            fontWeight="800"
            fill={EM_400}
            fontFamily="ui-monospace, 'JetBrains Mono', monospace"
          >
            {String(i + 1).padStart(2, "0")}
          </text>
          <text
            x="64"
            y="20"
            fontSize="13"
            fontWeight="800"
            fill={EM_LIGHT}
            letterSpacing="2.2"
            fontFamily="ui-monospace, 'JetBrains Mono', monospace"
          >
            {s.t}
          </text>
          <text x="64" y="42" fontSize="11" fill={EM_LIGHT} opacity="0.65" letterSpacing="0.5">
            <tspan x="64" dy="0">{s.d1}</tspan>
            <tspan x="64" dy="15">{s.d2}</tspan>
          </text>
        </g>
      ))}

      {/* Centered ignition seal */}
      <g transform="translate(430,376)" opacity="0.9">
        <IgnitionMark size={96} markId="db-im" />
      </g>
      <text
        x="430"
        y="448"
        fontSize="9"
        fill={EM_LIGHT}
        opacity="0.55"
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="4"
        textAnchor="middle"
      >
        NEURAL · PERFORMANCE
      </text>

      {/* Legal footer */}
      <text
        x="48"
        y="498"
        fontSize="9"
        fill={EM_LIGHT}
        opacity="0.4"
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="1.8"
      >
        {T.backLegal1}
      </text>
      <text
        x="48"
        y="516"
        fontSize="9"
        fill={EM_LIGHT}
        opacity="0.4"
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="1.8"
      >
        {serial}
      </text>
      <text
        x="812"
        y="516"
        fontSize="9"
        fill={EM_LIGHT}
        opacity="0.4"
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
      <IgnitionMarkDefs id="wp-im" />
      <SubstrateLayers id="wp" w={420} h={594} rx={24} />

      <g transform="translate(28,36)">
        <Wordmark size={18} withTm={false} />
      </g>
      <text
        x="392"
        y="48"
        fontSize="9"
        fill={EM_LIGHT}
        opacity="0.6"
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="2"
        textAnchor="end"
      >
        {serial}
      </text>

      {/* NFC big */}
      <g transform="translate(210,178)">
        <NFCZone r={86} gradientId="wp-etch" />
      </g>
      <text
        x="210"
        y="302"
        fontSize="11"
        fontWeight="700"
        fill={EM_400}
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="6"
        textAnchor="middle"
      >
        ACERCA TU TELÉFONO
      </text>

      {/* OR divider */}
      <g transform="translate(210,332)">
        <line x1="-80" y1="0" x2="-20" y2="0" stroke={EM_500} opacity="0.35" />
        <text
          x="0"
          y="4"
          fontSize="9"
          fill={EM_LIGHT}
          opacity="0.6"
          fontFamily="ui-monospace, 'JetBrains Mono', monospace"
          textAnchor="middle"
          letterSpacing="3"
        >
          {T.orLabel}
        </text>
        <line x1="20" y1="0" x2="80" y2="0" stroke={EM_500} opacity="0.35" />
      </g>

      {/* QR */}
      <g transform="translate(130,360)">
        <rect
          x="-8"
          y="-8"
          width="176"
          height="176"
          rx="14"
          fill="#06120D"
          stroke={EM_500}
          strokeOpacity="0.32"
          strokeWidth="1"
        />
        <QRMatrix size={160} modules={25} gradientId="wp-etch" />
        <g transform="translate(80,80)">
          <circle r="18" fill="#06120D" />
          <IgnitionMark size={26} markId="wp-im" />
        </g>
      </g>
      <text
        x="210"
        y="566"
        fontSize="11"
        fontWeight="700"
        fill={EM_400}
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="6"
        textAnchor="middle"
      >
        O ESCANEA
      </text>
      <text
        x="210"
        y="582"
        fontSize="9"
        fill={EM_LIGHT}
        opacity="0.5"
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
        <radialGradient id="ld-bg" cx="50%" cy="50%" r="60%">
          <stop offset="0" stopColor="#102820" />
          <stop offset="0.7" stopColor="#0A1410" />
          <stop offset="1" stopColor="#060C09" />
        </radialGradient>
        <pattern id="ld-lat" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="7" cy="7" r="0.7" fill={EM_400} opacity="0.16" />
        </pattern>
        <linearGradient id="ld-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={EM_400} stopOpacity="0.6" />
          <stop offset="1" stopColor={EM_700} stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <IgnitionMarkDefs id="ld-im" />

      <circle cx="120" cy="120" r="118" fill="url(#ld-bg)" />
      <circle cx="120" cy="120" r="118" fill="url(#ld-lat)" />
      <circle
        cx="120"
        cy="120"
        r="117"
        fill="none"
        stroke="url(#ld-rim)"
        strokeWidth="1.4"
      />

      {/* outer ignition rings */}
      <g transform="translate(120,120)" opacity="0.9">
        <circle r="82" fill="none" stroke={EM_500} strokeWidth="0.8" opacity="0.35" />
        <circle r="62" fill="none" stroke={EM_500} strokeWidth="0.8" opacity="0.3" />
      </g>

      {/* ignition glyph at top */}
      <g transform="translate(120,86)">
        <IgnitionMark size={48} markId="ld-im" />
      </g>

      {/* micro QR below */}
      <g transform="translate(96,126)">
        <QRMatrix size={48} modules={17} />
      </g>

      <text
        x="120"
        y="198"
        fontSize="9"
        fontWeight="800"
        fill={EM_LIGHT}
        fontFamily="'Geist', Inter, system-ui, sans-serif"
        letterSpacing="3"
        textAnchor="middle"
      >
        BIO-IGNICIÓN
      </text>
      <text
        x="120"
        y="214"
        fontSize="7.5"
        fill={EM_400}
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="2.4"
        textAnchor="middle"
      >
        TAP · SCAN
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
        <linearGradient id="scene-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#081410" />
          <stop offset="1" stopColor="#0F201A" />
        </linearGradient>
        <linearGradient id="scene-surf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#162923" />
          <stop offset="1" stopColor="#09120E" />
        </linearGradient>
      </defs>
      <SubstrateDefs id="ctx" />
      <IgnitionMarkDefs id="ctx-im" />
      <rect width="640" height="210" fill="url(#scene-wall)" />
      <rect y="210" width="640" height="150" fill="url(#scene-surf)" />
      <line x1="0" y1="210" x2="640" y2="210" stroke={EM_500} opacity="0.18" />

      {/* laptop */}
      <g transform="translate(52,96)">
        <rect width="240" height="148" rx="8" fill="#0A1410" stroke={EM_500} strokeOpacity="0.22" />
        <rect x="14" y="14" width="212" height="120" rx="4" fill="#04090A" />
        <g transform="translate(120,74)">
          <circle r="26" fill="none" stroke={EM_500} strokeWidth="0.8" opacity="0.35" />
          <circle r="14" fill="none" stroke={EM_500} strokeWidth="0.8" opacity="0.25" />
          <circle r="3" fill={EM_400} />
        </g>
      </g>
      <rect x="44" y="240" width="256" height="6" rx="3" fill="#0A1410" />

      {/* tilted card */}
      <g transform="translate(338,232) rotate(-7)">
        <g transform="scale(0.30)">
          <rect width="860" height="540" rx="44" fill="url(#ctx-bg)" />
          <rect width="860" height="540" rx="44" fill="url(#ctx-lat)" />
          <rect width="860" height="540" rx="44" fill="url(#ctx-aura)" />
          <rect
            x="0.75"
            y="0.75"
            width="858.5"
            height="538.5"
            rx="43.25"
            fill="none"
            stroke="url(#ctx-rim)"
            strokeWidth="1.5"
          />
          <g transform="translate(48,42)">
            <Wordmark size={30} />
          </g>
          <g transform="translate(204,308)">
            <NFCZone r={90} gradientId="ctx-etch" />
          </g>
          <g transform="translate(516,140)">
            <rect x="-14" y="-14" width="248" height="248" rx="20" fill="#06120D" stroke={EM_500} strokeOpacity="0.32" />
            <QRMatrix size={220} modules={25} gradientId="ctx-etch" />
            <g transform="translate(110,110)">
              <circle r="26" fill="#06120D" />
              <IgnitionMark size={36} markId="ctx-im" />
            </g>
          </g>
        </g>
      </g>

      <text
        x="48"
        y="340"
        fontSize="10"
        fill={EM_LIGHT}
        opacity="0.45"
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="2"
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

      {/* Hero: desk card front + back */}
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

      {/* Variants strip */}
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

      {/* Specs strip */}
      <dl className="bi-kit-specs" aria-label={T.specsAria}>
        {T.specs.map((s, i) => (
          <div key={i} className="bi-kit-spec">
            <dt>{s.k}</dt>
            <dd>{s.v}</dd>
          </div>
        ))}
      </dl>

      {/* Fleet tiers */}
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

      {/* CTA */}
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
