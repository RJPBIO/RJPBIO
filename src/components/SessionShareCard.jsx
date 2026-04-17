"use client";
/* ═══════════════════════════════════════════════════════════════
   SESSION SHARE CARD — artefacto exportable post-sesión
   ═══════════════════════════════════════════════════════════════
   Genera una tarjeta SVG lista para compartir (1080×1350, ratio
   Instagram story). Contiene BioGlyph + wordmark + métricas
   biométricas en tipografía mono. Descarga como SVG; si el
   navegador soporta Web Share API con File, intenta share nativo.

   No depende del DOM existente — construye el SVG standalone con
   fuentes en-stack que resuelven en cualquier renderer.
   ═══════════════════════════════════════════════════════════════ */

import { useMemo, useState } from "react";
import { bioSignal, font, space, radius } from "../lib/theme";

const FONT_MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const FONT_SANS = "'Manrope', ui-sans-serif, system-ui, sans-serif";

function buildSvgString({ protocolName, durationSec, bioQ, vCores, moodDelta, dateLabel }) {
  const W = 1080;
  const H = 1350;
  const accent = bioSignal.phosphorCyan;
  const ign = bioSignal.ignition;
  const field = bioSignal.deepField;

  const deltaStr = moodDelta > 0 ? `+${moodDelta}` : moodDelta < 0 ? `${moodDelta}` : "=";
  const deltaColor = moodDelta > 0 ? "#34D399" : moodDelta < 0 ? "#F87171" : "#94A3B8";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="bg" cx="0.5" cy="0.3" r="0.9">
      <stop offset="0%" stop-color="#0a1020" />
      <stop offset="60%" stop-color="${field}" />
      <stop offset="100%" stop-color="#020309" />
    </radialGradient>
    <radialGradient id="core" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="${ign}" stop-opacity="1" />
      <stop offset="60%" stop-color="${accent}" stop-opacity="1" />
      <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="bar" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0%" stop-color="${accent}" />
      <stop offset="100%" stop-color="${bioSignal.neuralViolet}" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="b" />
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)" />

  <!-- Ambient particles -->
  ${Array.from({ length: 24 })
    .map((_, i) => {
      const x = (i * 137) % W;
      const y = (i * 211) % H;
      const r = 1 + (i % 3);
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="${accent}" opacity="${0.15 + (i % 3) * 0.1}" />`;
    })
    .join("\n  ")}

  <!-- BioGlyph (top) -->
  <g transform="translate(${W / 2} 260)">
    <circle cx="0" cy="0" r="110" fill="${accent}" opacity="0.12" filter="url(#glow)" />
    <circle cx="0" cy="0" r="90" fill="none" stroke="${accent}" stroke-width="2" stroke-dasharray="4 8" opacity="0.5" />
    <line x1="0" y1="0" x2="60" y2="-35" stroke="${accent}" stroke-width="8" stroke-linecap="round" />
    <line x1="0" y1="0" x2="-60" y2="35" stroke="${accent}" stroke-width="8" stroke-linecap="round" opacity="0.7" />
    <line x1="0" y1="0" x2="0" y2="60" stroke="${accent}" stroke-width="8" stroke-linecap="round" opacity="0.85" />
    <circle cx="0" cy="0" r="32" fill="url(#core)" />
    <circle cx="0" cy="0" r="10" fill="${ign}" />
  </g>

  <!-- Wordmark -->
  <text x="${W / 2}" y="440" text-anchor="middle" font-family="${FONT_SANS}" font-size="58" font-weight="900" letter-spacing="12" fill="#E8ECF4">
    <tspan font-weight="300" opacity="0.7">BIO</tspan><tspan fill="${accent}" font-weight="900"> — </tspan><tspan font-weight="900">IGNICIÓN</tspan>
  </text>

  <!-- Kicker -->
  <text x="${W / 2}" y="540" text-anchor="middle" font-family="${FONT_MONO}" font-size="22" font-weight="700" letter-spacing="8" fill="${accent}">
    SESIÓN COMPLETADA
  </text>

  <!-- BioQ — hero metric -->
  <text x="${W / 2}" y="760" text-anchor="middle" font-family="${FONT_MONO}" font-size="260" font-weight="800" letter-spacing="-8" fill="#E8ECF4">
    ${bioQ ?? "—"}<tspan font-size="110" dy="-80" fill="${accent}">%</tspan>
  </text>

  <text x="${W / 2}" y="820" text-anchor="middle" font-family="${FONT_SANS}" font-size="28" font-weight="700" letter-spacing="4" fill="rgba(232,236,244,0.55)" text-transform="uppercase">
    CALIDAD BIOMÉTRICA
  </text>

  <!-- Protocol + duration strip -->
  <rect x="90" y="900" width="${W - 180}" height="110" rx="20" fill="rgba(255,255,255,0.04)" stroke="rgba(34,211,238,0.18)" stroke-width="1.5" />
  <text x="${W / 2}" y="945" text-anchor="middle" font-family="${FONT_SANS}" font-size="34" font-weight="800" fill="#E8ECF4">
    ${escapeXml(protocolName)}
  </text>
  <text x="${W / 2}" y="985" text-anchor="middle" font-family="${FONT_MONO}" font-size="22" font-weight="500" fill="rgba(232,236,244,0.65)" letter-spacing="3">
    ${durationSec}S · IGNICIÓN ESTRUCTURADA
  </text>

  <!-- Metrics grid (3 columns) -->
  <g transform="translate(0 1070)">
    ${metricBlock(90, "V-CORES", `+${vCores}`, accent, ign)}
    ${metricBlock(390, "ÁNIMO Δ", deltaStr, deltaColor, ign)}
    ${metricBlock(690, "FECHA", dateLabel, "#E8ECF4", accent)}
  </g>

  <!-- Bottom signature -->
  <text x="${W / 2}" y="${H - 60}" text-anchor="middle" font-family="${FONT_MONO}" font-size="18" font-weight="700" letter-spacing="6" fill="rgba(232,236,244,0.4)">
    BIO-IGNICIÓN · NEURAL PERFORMANCE
  </text>
</svg>`;
}

function metricBlock(x, label, value, valueColor, dotColor) {
  return `<g transform="translate(${x} 0)">
    <rect width="300" height="140" rx="18" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
    <circle cx="30" cy="35" r="5" fill="${dotColor}" />
    <text x="50" y="43" font-family="${FONT_MONO}" font-size="16" font-weight="800" letter-spacing="3" fill="rgba(232,236,244,0.55)">${label}</text>
    <text x="150" y="105" text-anchor="middle" font-family="${FONT_MONO}" font-size="56" font-weight="800" letter-spacing="-2" fill="${valueColor}">${escapeXml(value)}</text>
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
  const dateLabel = useMemo(() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const svgString = useMemo(
    () => buildSvgString({ protocolName, durationSec, bioQ, vCores, moodDelta, dateLabel }),
    [protocolName, durationSec, bioQ, vCores, moodDelta, dateLabel]
  );

  async function handleDownload() {
    try {
      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bio-ignicion-${Date.now()}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus("Descargada");
      setTimeout(() => setStatus(""), 2000);
    } catch (e) {
      setStatus("Error al descargar");
    }
  }

  async function handleShare() {
    try {
      if (navigator.share) {
        const blob = new Blob([svgString], { type: "image/svg+xml" });
        const file = new File([blob], `bio-ignicion-${Date.now()}.svg`, { type: "image/svg+xml" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "BIO-IGNICIÓN", text: `Sesión completada · ${bioQ ?? "—"}%` });
          setStatus("Compartida");
          setTimeout(() => setStatus(""), 2000);
          return;
        }
      }
      await handleDownload();
    } catch (e) {
      if (e?.name !== "AbortError") setStatus("Error al compartir");
    }
  }

  const previewSrc = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;

  return (
    <div
      role="group"
      aria-label="Tarjeta de sesión para compartir"
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
          border: `1px solid ${cardBg || "rgba(34,211,238,0.15)"}`,
          background: bioSignal.deepField,
        }}
      >
        <img
          src={previewSrc}
          alt={`Sesión ${protocolName}, calidad ${bioQ ?? "sin dato"}%, ${dateLabel}`}
          style={{ inlineSize: "100%", blockSize: "100%", display: "block", objectFit: "cover" }}
        />
      </div>

      <div style={{ display: "flex", gap: space[1.5] || 6 }}>
        <button
          type="button"
          onClick={handleShare}
          style={{
            flex: 1,
            paddingBlock: space[2.5] || 10,
            paddingInline: space[3],
            borderRadius: radius.full,
            border: "none",
            background: `linear-gradient(135deg, ${accent}, ${bioSignal.neuralViolet})`,
            color: "#050810",
            fontSize: font.size.xs,
            fontWeight: font.weight.black,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            cursor: "pointer",
          }}
          aria-label="Compartir tarjeta de sesión"
        >
          Compartir
        </button>
        <button
          type="button"
          onClick={handleDownload}
          style={{
            flex: 1,
            paddingBlock: space[2.5] || 10,
            paddingInline: space[3],
            borderRadius: radius.full,
            border: `1px solid rgba(34,211,238,0.3)`,
            background: "transparent",
            color: textPrimary,
            fontSize: font.size.xs,
            fontWeight: font.weight.black,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            cursor: "pointer",
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
              paddingBlock: space[2.5] || 10,
              paddingInline: space[3],
              borderRadius: radius.full,
              border: `1px solid rgba(255,255,255,0.12)`,
              background: "transparent",
              color: textMuted,
              fontSize: font.size.xs,
              fontWeight: font.weight.black,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Cerrar
          </button>
        )}
      </div>
      {status && (
        <div
          role="status"
          aria-live="polite"
          style={{ textAlign: "center", fontSize: font.size.xs, color: textMuted, marginBlockStart: 4 }}
        >
          {status}
        </div>
      )}
    </div>
  );
}
