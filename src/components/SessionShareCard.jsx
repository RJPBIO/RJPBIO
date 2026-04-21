"use client";
/* ═══════════════════════════════════════════════════════════════
   SESSION SHARE CARD — artefacto exportable post-sesión
   ═══════════════════════════════════════════════════════════════
   Genera una tarjeta SVG lista para compartir (1080×1350, ratio
   Instagram story). Estética cinemática: lattice + vignette +
   scanlines + corner brackets + sello de sesión (código único).
   Paleta: emerald primario de la PWA + phosphor cyan biométrico +
   ignition rojo. Tipografía mono técnica.

   No depende del DOM existente — construye el SVG standalone con
   fuentes en-stack que resuelven en cualquier renderer.
   ═══════════════════════════════════════════════════════════════ */

import { useMemo, useState } from "react";
import { bioSignal, brand, font, space, radius } from "../lib/theme";

const FONT_MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const FONT_SANS = "'Manrope', ui-sans-serif, system-ui, sans-serif";

// Deterministic 6-char session code from the card's identifying inputs.
// Used as a visible "serial number" — brand identity marker.
function sessionCode({ protocolName, durationSec, bioQ, vCores, dateLabel }) {
  const seed = `${protocolName}|${durationSec}|${bioQ ?? "x"}|${vCores}|${dateLabel}|${Date.now().toString(36).slice(-4)}`;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const hex = (h >>> 0).toString(16).toUpperCase().padStart(8, "0");
  return `${hex.slice(0, 4)}-${hex.slice(4, 6)}`;
}

function buildSvgString({ protocolName, durationSec, bioQ, vCores, moodDelta, dateLabel, code }) {
  const W = 1080;
  const H = 1350;
  const accent = bioSignal.phosphorCyan;
  const ign = bioSignal.ignition;
  const field = bioSignal.deepField;
  const emerald = brand.primary;

  const deltaStr = moodDelta > 0 ? `+${moodDelta}` : moodDelta < 0 ? `${moodDelta}` : "=";
  const deltaColor = moodDelta > 0 ? "#34D399" : moodDelta < 0 ? "#F87171" : "#94A3B8";

  // Lattice plus-mark grid — cinematic brand DNA.
  const latticeSize = 8;
  const latticeStepX = W / (latticeSize + 1);
  const latticeStepY = H / (Math.round(latticeSize * (H / W)) + 1);
  const plusMarks = [];
  for (let ix = 1; ix <= latticeSize; ix++) {
    for (let iy = 1; iy <= Math.round(latticeSize * (H / W)); iy++) {
      const cx = ix * latticeStepX;
      const cy = iy * latticeStepY;
      plusMarks.push(
        `<path d="M${cx - 4} ${cy} L${cx + 4} ${cy} M${cx} ${cy - 4} L${cx} ${cy + 4}" stroke="${accent}" stroke-width="1" opacity="0.14" />`,
      );
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="bg" cx="0.5" cy="0.32" r="0.95">
      <stop offset="0%" stop-color="#0B1A14" />
      <stop offset="55%" stop-color="${field}" />
      <stop offset="100%" stop-color="#020309" />
    </radialGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75">
      <stop offset="50%" stop-color="#000" stop-opacity="0" />
      <stop offset="100%" stop-color="#000" stop-opacity="0.55" />
    </radialGradient>
    <radialGradient id="core" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="${ign}" stop-opacity="1" />
      <stop offset="50%" stop-color="${emerald}" stop-opacity="1" />
      <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="primary" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0%" stop-color="${emerald}" />
      <stop offset="100%" stop-color="${accent}" />
    </linearGradient>
    <pattern id="scan" width="1" height="3" patternUnits="userSpaceOnUse">
      <rect width="1" height="1" fill="#000" opacity="0.12" />
    </pattern>
    <filter id="glow">
      <feGaussianBlur stdDeviation="10" result="b" />
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)" />

  <!-- Lattice grid — cinematic brand DNA -->
  ${plusMarks.join("\n  ")}

  <!-- Scanline overlay -->
  <rect width="${W}" height="${H}" fill="url(#scan)" />

  <!-- Vignette -->
  <rect width="${W}" height="${H}" fill="url(#vignette)" />

  <!-- Frame bracket (top-left) -->
  <path d="M50 110 L50 50 L110 50" stroke="${accent}" stroke-width="2" fill="none" opacity="0.6" />
  <path d="M${W - 110} 50 L${W - 50} 50 L${W - 50} 110" stroke="${accent}" stroke-width="2" fill="none" opacity="0.6" />
  <path d="M50 ${H - 110} L50 ${H - 50} L110 ${H - 50}" stroke="${accent}" stroke-width="2" fill="none" opacity="0.6" />
  <path d="M${W - 110} ${H - 50} L${W - 50} ${H - 50} L${W - 50} ${H - 110}" stroke="${accent}" stroke-width="2" fill="none" opacity="0.6" />

  <!-- Session code (top-right, blueprint marker) -->
  <text x="${W - 80}" y="95" text-anchor="end" font-family="${FONT_MONO}" font-size="20" font-weight="700" letter-spacing="3" fill="${accent}" opacity="0.85">
    #${code}
  </text>
  <text x="80" y="95" font-family="${FONT_MONO}" font-size="14" font-weight="700" letter-spacing="3" fill="rgba(232,236,244,0.45)">
    ${dateLabel} · ${durationSec}S
  </text>

  <!-- BioGlyph -->
  <g transform="translate(${W / 2} 285)">
    <circle cx="0" cy="0" r="120" fill="${emerald}" opacity="0.10" filter="url(#glow)" />
    <circle cx="0" cy="0" r="96" fill="none" stroke="${accent}" stroke-width="1.5" stroke-dasharray="3 9" opacity="0.45" />
    <circle cx="0" cy="0" r="72" fill="none" stroke="${emerald}" stroke-width="1" opacity="0.35" />
    <line x1="0" y1="0" x2="62" y2="-36" stroke="${accent}" stroke-width="8" stroke-linecap="round" />
    <line x1="0" y1="0" x2="-62" y2="36" stroke="${accent}" stroke-width="8" stroke-linecap="round" opacity="0.7" />
    <line x1="0" y1="0" x2="0" y2="62" stroke="${emerald}" stroke-width="8" stroke-linecap="round" opacity="0.9" />
    <circle cx="0" cy="0" r="32" fill="url(#core)" />
    <circle cx="0" cy="0" r="10" fill="${ign}" />
    <!-- Tick marks on outer ring -->
    <line x1="0" y1="-96" x2="0" y2="-104" stroke="${accent}" stroke-width="2" />
    <line x1="96" y1="0" x2="104" y2="0" stroke="${accent}" stroke-width="2" />
    <line x1="0" y1="96" x2="0" y2="104" stroke="${accent}" stroke-width="2" />
    <line x1="-96" y1="0" x2="-104" y2="0" stroke="${accent}" stroke-width="2" />
  </g>

  <!-- Wordmark -->
  <text x="${W / 2}" y="475" text-anchor="middle" font-family="${FONT_SANS}" font-size="58" font-weight="900" letter-spacing="10" fill="#E8ECF4">
    <tspan font-weight="300" opacity="0.65">BIO</tspan><tspan fill="${emerald}" font-weight="900"> · </tspan><tspan font-weight="900">IGNICIÓN</tspan>
  </text>

  <!-- Kicker -->
  <text x="${W / 2}" y="540" text-anchor="middle" font-family="${FONT_MONO}" font-size="20" font-weight="700" letter-spacing="9" fill="${accent}">
    ▸ SESIÓN ESTRUCTURADA ◂
  </text>

  <!-- BioQ — hero metric -->
  <text x="${W / 2}" y="780" text-anchor="middle" font-family="${FONT_MONO}" font-size="270" font-weight="800" letter-spacing="-10" fill="#E8ECF4">
    ${bioQ ?? "—"}<tspan font-size="120" dy="-84" fill="${emerald}">%</tspan>
  </text>
  <text x="${W / 2}" y="830" text-anchor="middle" font-family="${FONT_MONO}" font-size="22" font-weight="700" letter-spacing="8" fill="rgba(232,236,244,0.55)">
    CALIDAD BIOMÉTRICA · /100
  </text>

  <!-- Protocol strip -->
  <g transform="translate(90 905)">
    <rect width="${W - 180}" height="115" rx="4" fill="rgba(16,185,129,0.05)" stroke="rgba(16,185,129,0.22)" stroke-width="1.5" />
    <!-- Corner ticks -->
    <path d="M0 16 L0 0 L16 0" stroke="${emerald}" stroke-width="2" fill="none" />
    <path d="M${W - 180 - 16} 0 L${W - 180} 0 L${W - 180} 16" stroke="${emerald}" stroke-width="2" fill="none" />
    <path d="M0 ${115 - 16} L0 115 L16 115" stroke="${emerald}" stroke-width="2" fill="none" />
    <path d="M${W - 180 - 16} 115 L${W - 180} 115 L${W - 180} ${115 - 16}" stroke="${emerald}" stroke-width="2" fill="none" />
    <text x="${(W - 180) / 2}" y="52" text-anchor="middle" font-family="${FONT_SANS}" font-size="34" font-weight="800" fill="#E8ECF4">
      ${escapeXml(protocolName)}
    </text>
    <text x="${(W - 180) / 2}" y="92" text-anchor="middle" font-family="${FONT_MONO}" font-size="16" font-weight="700" fill="rgba(232,236,244,0.55)" letter-spacing="5">
      PROTOCOLO · IGNICIÓN BIOMÉTRICA
    </text>
  </g>

  <!-- Metrics grid (3 columns) -->
  <g transform="translate(0 1070)">
    ${metricBlock(90, "V-CORES", `+${vCores}`, emerald)}
    ${metricBlock(390, "ÁNIMO Δ", deltaStr, deltaColor)}
    ${metricBlock(690, "FECHA", dateLabel, accent)}
  </g>

  <!-- Blueprint bottom rule with ticks -->
  <line x1="90" y1="${H - 82}" x2="${W - 90}" y2="${H - 82}" stroke="${accent}" stroke-width="1" opacity="0.45" />
  <g opacity="0.55">
    ${Array.from({ length: 11 }).map((_, i) => {
      const x = 90 + i * ((W - 180) / 10);
      const h = i === 5 ? 10 : 5;
      return `<line x1="${x}" y1="${H - 82}" x2="${x}" y2="${H - 82 + h}" stroke="${accent}" stroke-width="1" />`;
    }).join("\n    ")}
  </g>

  <!-- Bottom signature -->
  <text x="${W / 2}" y="${H - 48}" text-anchor="middle" font-family="${FONT_MONO}" font-size="16" font-weight="700" letter-spacing="7" fill="rgba(232,236,244,0.55)">
    BIO-IGNICIÓN · MX · NEURAL PERFORMANCE SYSTEM
  </text>
</svg>`;
}

function metricBlock(x, label, value, valueColor) {
  const W = 300;
  const H = 140;
  return `<g transform="translate(${x} 0)">
    <rect width="${W}" height="${H}" rx="4" fill="rgba(255,255,255,0.035)" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
    <!-- Corner brackets -->
    <path d="M0 12 L0 0 L12 0" stroke="${valueColor}" stroke-width="2" fill="none" />
    <path d="M${W - 12} 0 L${W} 0 L${W} 12" stroke="${valueColor}" stroke-width="2" fill="none" />
    <path d="M0 ${H - 12} L0 ${H} L12 ${H}" stroke="${valueColor}" stroke-width="2" fill="none" />
    <path d="M${W - 12} ${H} L${W} ${H} L${W} ${H - 12}" stroke="${valueColor}" stroke-width="2" fill="none" />
    <text x="20" y="36" font-family="${FONT_MONO}" font-size="14" font-weight="800" letter-spacing="3" fill="rgba(232,236,244,0.55)">${label}</text>
    <text x="${W / 2}" y="105" text-anchor="middle" font-family="${FONT_MONO}" font-size="56" font-weight="800" letter-spacing="-2" fill="${valueColor}">${escapeXml(value)}</text>
  </g>`;
}

function escapeXml(s) {
  return String(s).replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c]));
}

export default function SessionShareCard({
  protocolName = "Protocolo",
  durationSec = 120,
  bioQ = null,
  vCores = 0,
  moodDelta = 0,
  onClose,
  accent = bioSignal.phosphorCyan,
  textPrimary = "#E8ECF4",
  textMuted = "rgba(232,236,244,0.65)",
  cardBg,
}) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const dateLabel = useMemo(() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const code = useMemo(
    () => sessionCode({ protocolName, durationSec, bioQ, vCores, dateLabel }),
    [protocolName, durationSec, bioQ, vCores, dateLabel],
  );

  const svgString = useMemo(
    () => buildSvgString({ protocolName, durationSec, bioQ, vCores, moodDelta, dateLabel, code }),
    [protocolName, durationSec, bioQ, vCores, moodDelta, dateLabel, code],
  );

  async function handleDownload() {
    if (busy) return;
    setBusy(true);
    try {
      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bio-ignicion-${code}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus("Descargada");
      setTimeout(() => setStatus(""), 2000);
    } catch {
      setStatus("Error al descargar");
      setTimeout(() => setStatus(""), 2000);
    } finally {
      setBusy(false);
    }
  }

  async function handleShare() {
    if (busy) return;
    setBusy(true);
    try {
      if (navigator.share) {
        const blob = new Blob([svgString], { type: "image/svg+xml" });
        const file = new File([blob], `bio-ignicion-${code}.svg`, { type: "image/svg+xml" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "BIO-IGNICIÓN", text: `Sesión ${code} · ${bioQ ?? "—"}%` });
          setStatus("Compartida");
          setTimeout(() => setStatus(""), 2000);
          return;
        }
      }
      setBusy(false);
      await handleDownload();
      return;
    } catch (e) {
      if (e?.name !== "AbortError") {
        setStatus("Error al compartir");
        setTimeout(() => setStatus(""), 2000);
      }
    } finally {
      setBusy(false);
    }
  }

  const previewSrc = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;

  const btnBase = {
    minBlockSize: 44,
    paddingBlock: space[2.5],
    paddingInline: space[3],
    borderRadius: radius.full,
    fontSize: font.size.xs,
    fontWeight: font.weight.black,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    cursor: busy ? "wait" : "pointer",
    fontFamily: "inherit",
    opacity: busy ? 0.7 : 1,
    transition: "transform 0.15s ease, opacity 0.15s ease",
  };

  return (
    <div
      role="group"
      aria-label={`Tarjeta de sesión ${code} para compartir`}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: space[2],
        inlineSize: "100%",
      }}
    >
      <div
        style={{
          position: "relative",
          inlineSize: "100%",
          aspectRatio: "1080/1350",
          borderRadius: radius.lg,
          overflow: "hidden",
          border: `1px solid ${cardBg || "rgba(16,185,129,0.2)"}`,
          background: bioSignal.deepField,
          boxShadow: `0 20px 60px -20px rgba(16,185,129,0.35), 0 0 0 1px rgba(34,211,238,0.08) inset`,
        }}
      >
        <img
          src={previewSrc}
          alt={`Sesión ${protocolName} ${code}, calidad ${bioQ ?? "sin dato"}%, ${dateLabel}`}
          style={{ inlineSize: "100%", blockSize: "100%", display: "block", objectFit: "cover" }}
        />
      </div>

      <div
        aria-hidden="true"
        style={{
          fontFamily: FONT_MONO,
          fontSize: 11,
          letterSpacing: 3,
          color: textMuted,
          textAlign: "center",
          marginBlockStart: 2,
        }}
      >
        SERIAL · #{code}
      </div>

      <div style={{ display: "flex", gap: space[1.5] }}>
        <button
          type="button"
          onClick={handleShare}
          disabled={busy}
          style={{
            ...btnBase,
            flex: 1,
            border: "none",
            background: `linear-gradient(135deg, ${brand.primary}, ${accent})`,
            color: "#050810",
          }}
          aria-label="Compartir tarjeta de sesión"
        >
          {busy ? "…" : "Compartir"}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={busy}
          style={{
            ...btnBase,
            flex: 1,
            border: `1px solid ${brand.primary}55`,
            background: "transparent",
            color: textPrimary,
          }}
          aria-label="Descargar tarjeta de sesión"
        >
          Descargar
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              ...btnBase,
              border: `1px solid rgba(255,255,255,0.14)`,
              background: "transparent",
              color: textMuted,
            }}
          >
            Cerrar
          </button>
        )}
      </div>
      <div
        role="status"
        aria-live="polite"
        style={{
          textAlign: "center",
          fontSize: font.size.xs,
          color: textMuted,
          marginBlockStart: 4,
          minBlockSize: 16,
        }}
      >
        {status}
      </div>
    </div>
  );
}
