/* ═══════════════════════════════════════════════════════════════
   ActivationKit — Workplace activation cards (QR + NFC).
   Pure SVG: desk card (front + back), wall placard, laptop disc.
   Trademark DNA: matte black substrate, phosphor cyan laser etch,
   lattice micro-texture, monospace serials, ignition ring motif.
   ═══════════════════════════════════════════════════════════════ */

import Link from "next/link";

/* ──────────────────────────── QR matrix (deterministic) ───── */
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

function QRMatrix({ size = 300, color = "#22D3EE", bg = "#0B0B0D", modules = 25 }) {
  const { cells, positions } = useQrCells(modules);
  const m = size / modules;
  return (
    <g>
      <rect width={size} height={size} rx={m * 1.2} fill={bg} />
      {cells.map(([x, y], i) => (
        <rect
          key={i}
          x={x * m + m * 0.1}
          y={y * m + m * 0.1}
          width={m * 0.8}
          height={m * 0.8}
          rx={m * 0.18}
          fill={color}
        />
      ))}
      {positions.map(([px, py], i) => (
        <g key={i} transform={`translate(${px * m},${py * m})`}>
          <rect width={m * 7} height={m * 7} rx={m * 1.6} fill={color} />
          <rect x={m} y={m} width={m * 5} height={m * 5} rx={m * 1.1} fill={bg} />
          <rect x={m * 2} y={m * 2} width={m * 3} height={m * 3} rx={m * 0.6} fill={color} />
        </g>
      ))}
    </g>
  );
}

/* ──────────────────────────── NFC tap zone ──────────────────── */
function NFCZone({ r = 78, color = "#22D3EE", bg = "#0B0B0D" }) {
  return (
    <g>
      <circle r={r + 12} fill={bg} />
      <circle r={r} fill="none" stroke={color} strokeWidth="1.5" opacity="0.55" />
      <circle r={r * 0.74} fill="none" stroke={color} strokeWidth="1.25" opacity="0.4" />
      <circle r={r * 0.48} fill="none" stroke={color} strokeWidth="1" opacity="0.3" />
      <g>
        <circle r={5} fill={color} />
        <path
          d={`M${-r * 0.22} ${-r * 0.32} Q 0 ${-r * 0.12} ${r * 0.22} ${-r * 0.32}`}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d={`M${-r * 0.36} ${-r * 0.46} Q 0 ${-r * 0.18} ${r * 0.36} ${-r * 0.46}`}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.7"
        />
      </g>
    </g>
  );
}

/* ──────────────────────────── Wordmark ──────────────────────── */
function Wordmark({ size = 32, withTm = true, color = "#F6F7F9", accent = "#22D3EE" }) {
  const gap = size * 0.14;
  const letter = size * 0.56;
  return (
    <g>
      <text
        x="0"
        y={size * 0.78}
        fontSize={size}
        fontWeight="800"
        letterSpacing={letter * 0.08}
        fill={color}
        fontFamily="'Geist', Inter, system-ui, sans-serif"
      >
        BIO
      </text>
      <text
        x={letter * 1.95 + gap}
        y={size * 0.78}
        fontSize={size}
        fontWeight="300"
        fill={color}
        fontFamily="'Geist', Inter, system-ui, sans-serif"
      >
        —
      </text>
      <text
        x={letter * 2.8 + gap * 2}
        y={size * 0.78}
        fontSize={size}
        fontWeight="800"
        letterSpacing={letter * 0.08}
        fill={accent}
        fontFamily="'Geist', Inter, system-ui, sans-serif"
      >
        IGNICIÓN
      </text>
      {withTm && (
        <text
          x={letter * 9.8 + gap * 3}
          y={size * 0.4}
          fontSize={size * 0.32}
          fontWeight="600"
          fill={color}
          opacity="0.7"
          fontFamily="'Geist', Inter, system-ui, sans-serif"
        >
          TM
        </text>
      )}
    </g>
  );
}

/* ──────────────────────────── Substrate defs (shared) ──────── */
function SubstrateDefs({ id }) {
  return (
    <defs>
      <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#08080A" />
        <stop offset="0.5" stopColor="#14141A" />
        <stop offset="1" stopColor="#08080A" />
      </linearGradient>
      <pattern id={`${id}-lat`} width="22" height="22" patternUnits="userSpaceOnUse">
        <path d="M11 0v22M0 11h22" stroke="#22D3EE" strokeWidth="0.35" opacity="0.08" />
        <circle cx="11" cy="11" r="0.7" fill="#22D3EE" opacity="0.12" />
      </pattern>
      <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="65%">
        <stop offset="0" stopColor="#22D3EE" stopOpacity="0" />
        <stop offset="0.7" stopColor="#22D3EE" stopOpacity="0" />
        <stop offset="1" stopColor="#22D3EE" stopOpacity="0.14" />
      </radialGradient>
      <linearGradient id={`${id}-scan`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#22D3EE" stopOpacity="0" />
        <stop offset="0.5" stopColor="#22D3EE" stopOpacity="0.06" />
        <stop offset="1" stopColor="#22D3EE" stopOpacity="0" />
      </linearGradient>
    </defs>
  );
}

function SubstrateLayers({ id, w, h, rx }) {
  return (
    <>
      <rect width={w} height={h} rx={rx} fill={`url(#${id}-bg)`} />
      <rect width={w} height={h} rx={rx} fill={`url(#${id}-lat)`} />
      <rect width={w} height={h} rx={rx} fill={`url(#${id}-glow)`} />
      <rect width={w} height={h} rx={rx} fill={`url(#${id}-scan)`} opacity="0.6" />
      <rect
        x="0.5"
        y="0.5"
        width={w - 1}
        height={h - 1}
        rx={rx - 0.5}
        fill="none"
        stroke="#22D3EE"
        strokeWidth="1.2"
        opacity="0.24"
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
      <SubstrateLayers id="df" w={860} h={540} rx={44} />

      <g transform="translate(48,42)">
        <Wordmark size={30} />
      </g>

      <text
        x="812"
        y="60"
        fontSize="11"
        fill="#9CA3AF"
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="2"
        textAnchor="end"
      >
        {serial}
      </text>

      <g transform="translate(204,300)">
        <NFCZone r={86} />
      </g>
      <text
        x="204"
        y="424"
        fontSize="13"
        fontWeight="700"
        fill="#22D3EE"
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="6"
        textAnchor="middle"
      >
        TAP · NFC
      </text>
      <text
        x="204"
        y="446"
        fontSize="10"
        fill="#9CA3AF"
        textAnchor="middle"
        letterSpacing="1.5"
      >
        {T.tapSub}
      </text>

      {/* divider */}
      <line
        x1="430"
        y1="120"
        x2="430"
        y2="420"
        stroke="#22D3EE"
        strokeWidth="1"
        opacity="0.18"
        strokeDasharray="3 5"
      />

      {/* QR block */}
      <g transform="translate(516,150)">
        <rect
          x="-14"
          y="-14"
          width="248"
          height="248"
          rx="20"
          fill="#0E0E12"
          stroke="#22D3EE"
          strokeOpacity="0.28"
          strokeWidth="1"
        />
        <QRMatrix size={220} modules={25} />
        <g transform="translate(110,110)">
          <circle r="22" fill="#0E0E12" />
          <circle r="20" fill="none" stroke="#22D3EE" strokeWidth="1.8" />
          <circle r="11" fill="none" stroke="#22D3EE" strokeWidth="1.2" opacity="0.7" />
          <circle r="3" fill="#22D3EE" />
        </g>
      </g>
      <text
        x="632"
        y="424"
        fontSize="13"
        fontWeight="700"
        fill="#22D3EE"
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="6"
        textAnchor="middle"
      >
        SCAN · QR
      </text>
      <text
        x="632"
        y="446"
        fontSize="10"
        fill="#9CA3AF"
        textAnchor="middle"
        letterSpacing="1.5"
      >
        {T.scanSub}
      </text>

      {/* bottom strip */}
      <text
        x="48"
        y="510"
        fontSize="9"
        fill="#4B5563"
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="2.4"
      >
        NEURAL ACTIVATION POINT
      </text>
      <text
        x="812"
        y="510"
        fontSize="9"
        fill="#4B5563"
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
      <SubstrateLayers id="db" w={860} h={540} rx={44} />

      <g transform="translate(48,42)">
        <Wordmark size={22} withTm={false} />
      </g>
      <text
        x="812"
        y="58"
        fontSize="10"
        fill="#9CA3AF"
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="2"
        textAnchor="end"
      >
        {T.backHeader}
      </text>

      <text
        x="48"
        y="132"
        fontSize="16"
        fontWeight="700"
        fill="#F6F7F9"
        letterSpacing="1"
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
      >
        {T.installTitle}
      </text>

      {/* 3 steps */}
      {T.steps.map((s, i) => (
        <g key={i} transform={`translate(${60 + i * 248},190)`}>
          <circle cx="22" cy="22" r="22" fill="none" stroke="#22D3EE" strokeWidth="1.4" />
          <text
            x="22"
            y="29"
            textAnchor="middle"
            fontSize="16"
            fontWeight="800"
            fill="#22D3EE"
            fontFamily="ui-monospace, 'JetBrains Mono', monospace"
          >
            {String(i + 1).padStart(2, "0")}
          </text>
          <text
            x="60"
            y="20"
            fontSize="13"
            fontWeight="800"
            fill="#F6F7F9"
            letterSpacing="2"
            fontFamily="ui-monospace, 'JetBrains Mono', monospace"
          >
            {s.t}
          </text>
          <text x="60" y="42" fontSize="11" fill="#9CA3AF" letterSpacing="0.5">
            <tspan x="60" dy="0">{s.d1}</tspan>
            <tspan x="60" dy="15">{s.d2}</tspan>
          </text>
        </g>
      ))}

      {/* middle ring motif */}
      <g transform="translate(430,360)" opacity="0.35">
        <circle r="58" fill="none" stroke="#22D3EE" strokeWidth="1" />
        <circle r="38" fill="none" stroke="#22D3EE" strokeWidth="0.8" />
        <circle r="18" fill="none" stroke="#22D3EE" strokeWidth="0.6" />
      </g>

      {/* legal microtext */}
      <text
        x="48"
        y="480"
        fontSize="9"
        fill="#6B7280"
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="1.8"
      >
        {T.backLegal1}
      </text>
      <text
        x="48"
        y="498"
        fontSize="9"
        fill="#6B7280"
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="1.8"
      >
        {serial}
      </text>
      <text
        x="812"
        y="498"
        fontSize="9"
        fill="#6B7280"
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
      <SubstrateLayers id="wp" w={420} h={594} rx={24} />

      <g transform="translate(28,36)">
        <Wordmark size={18} withTm={false} />
      </g>
      <text
        x="392"
        y="48"
        fontSize="9"
        fill="#9CA3AF"
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="2"
        textAnchor="end"
      >
        {serial}
      </text>

      {/* NFC zone big */}
      <g transform="translate(210,170)">
        <NFCZone r={82} />
      </g>
      <text
        x="210"
        y="290"
        fontSize="11"
        fontWeight="700"
        fill="#22D3EE"
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="6"
        textAnchor="middle"
      >
        ACERCA TU TELÉFONO
      </text>

      {/* OR divider */}
      <g transform="translate(210,320)">
        <line x1="-80" y1="0" x2="-18" y2="0" stroke="#22D3EE" opacity="0.3" />
        <text
          x="0"
          y="4"
          fontSize="9"
          fill="#9CA3AF"
          fontFamily="ui-monospace, 'JetBrains Mono', monospace"
          textAnchor="middle"
          letterSpacing="3"
        >
          {T.orLabel}
        </text>
        <line x1="18" y1="0" x2="80" y2="0" stroke="#22D3EE" opacity="0.3" />
      </g>

      {/* QR block */}
      <g transform="translate(130,350)">
        <rect
          x="-8"
          y="-8"
          width="176"
          height="176"
          rx="14"
          fill="#0E0E12"
          stroke="#22D3EE"
          strokeOpacity="0.28"
          strokeWidth="1"
        />
        <QRMatrix size={160} modules={25} />
        <g transform="translate(80,80)">
          <circle r="16" fill="#0E0E12" />
          <circle r="14" fill="none" stroke="#22D3EE" strokeWidth="1.4" />
          <circle r="2.5" fill="#22D3EE" />
        </g>
      </g>
      <text
        x="210"
        y="560"
        fontSize="11"
        fontWeight="700"
        fill="#22D3EE"
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="6"
        textAnchor="middle"
      >
        O ESCANEA
      </text>
      <text
        x="210"
        y="578"
        fontSize="9"
        fill="#6B7280"
        textAnchor="middle"
        letterSpacing="1.8"
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
      >
        bio-ignicion.app/k/sala-04
      </text>
    </svg>
  );
}

/* ──────────────────────────── Laptop Disc (round 60mm) ──────── */
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
        <radialGradient id="ld-bg" cx="50%" cy="50%" r="55%">
          <stop offset="0" stopColor="#14141A" />
          <stop offset="1" stopColor="#08080A" />
        </radialGradient>
        <pattern id="ld-lat" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="7" cy="7" r="0.6" fill="#22D3EE" opacity="0.14" />
        </pattern>
      </defs>
      <circle cx="120" cy="120" r="118" fill="url(#ld-bg)" />
      <circle cx="120" cy="120" r="118" fill="url(#ld-lat)" />
      <circle
        cx="120"
        cy="120"
        r="117"
        fill="none"
        stroke="#22D3EE"
        strokeWidth="1"
        opacity="0.35"
      />

      {/* concentric ignition ring */}
      <g transform="translate(120,120)" opacity="0.95">
        <circle r="78" fill="none" stroke="#22D3EE" strokeWidth="1" opacity="0.35" />
        <circle r="58" fill="none" stroke="#22D3EE" strokeWidth="1" opacity="0.3" />
      </g>

      {/* center brand ring + micro QR */}
      <g transform="translate(120,92)">
        <g transform="translate(-18,-18)">
          <QRMatrix size={36} modules={17} />
        </g>
      </g>
      <text
        x="120"
        y="148"
        fontSize="12"
        fontWeight="800"
        fill="#22D3EE"
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        letterSpacing="4"
        textAnchor="middle"
      >
        TAP · SCAN
      </text>
      <text
        x="120"
        y="168"
        fontSize="8"
        fill="#9CA3AF"
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        textAnchor="middle"
        letterSpacing="2"
      >
        {T.discSub}
      </text>
      {/* micro wordmark */}
      <text
        x="120"
        y="200"
        fontSize="9"
        fontWeight="800"
        fill="#F6F7F9"
        fontFamily="'Geist', Inter, system-ui, sans-serif"
        letterSpacing="3"
        textAnchor="middle"
      >
        BIO—IGNICIÓN
      </text>
    </svg>
  );
}

/* ──────────────────────────── Context · Desk scene ──────────── */
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
        <linearGradient id="desk-surf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1A1C22" />
          <stop offset="1" stopColor="#0C0D11" />
        </linearGradient>
        <linearGradient id="desk-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0A0B0F" />
          <stop offset="1" stopColor="#131419" />
        </linearGradient>
      </defs>
      <rect width="640" height="200" fill="url(#desk-wall)" />
      <rect y="200" width="640" height="160" fill="url(#desk-surf)" />
      <line x1="0" y1="200" x2="640" y2="200" stroke="#22D3EE" opacity="0.15" />

      {/* laptop silhouette */}
      <g transform="translate(48,92)">
        <rect width="240" height="150" rx="8" fill="#0E0F14" stroke="#22D3EE" strokeOpacity="0.2" />
        <rect x="14" y="14" width="212" height="122" rx="4" fill="#08080A" />
        <circle cx="120" cy="75" r="28" fill="none" stroke="#22D3EE" strokeWidth="1" opacity="0.35" />
        <circle cx="120" cy="75" r="14" fill="none" stroke="#22D3EE" strokeWidth="0.8" opacity="0.25" />
      </g>
      <rect x="40" y="240" width="256" height="6" rx="3" fill="#0E0F14" />

      {/* card on desk, tilted */}
      <g transform="translate(370,240) rotate(-6)">
        <g transform="scale(0.28)">
          <svg viewBox="0 0 860 540" width="860" height="540">
            <SubstrateDefs id="ctx-card" />
            <SubstrateLayers id="ctx-card" w={860} h={540} rx={44} />
            <g transform="translate(48,42)">
              <Wordmark size={30} />
            </g>
            <g transform="translate(204,300)">
              <NFCZone r={86} />
            </g>
            <g transform="translate(516,150)">
              <rect x="-14" y="-14" width="248" height="248" rx="20" fill="#0E0E12" stroke="#22D3EE" strokeOpacity="0.28" />
              <QRMatrix size={220} modules={25} />
              <g transform="translate(110,110)">
                <circle r="22" fill="#0E0E12" />
                <circle r="20" fill="none" stroke="#22D3EE" strokeWidth="1.8" />
              </g>
            </g>
          </svg>
        </g>
      </g>

      {/* coffee + pen as context props */}
      <g transform="translate(320,280)">
        <ellipse cx="0" cy="0" rx="18" ry="6" fill="#0E0F14" />
        <rect x="-14" y="-28" width="28" height="28" rx="2" fill="#131419" stroke="#22D3EE" strokeOpacity="0.18" />
      </g>

      <text
        x="48"
        y="340"
        fontSize="10"
        fill="#6B7280"
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
